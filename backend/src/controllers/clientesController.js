const db = require("../config/db");
const bcrypt = require("bcryptjs");
const { crearToken } = require("./authController");

async function compararContrasena(plain, hash) {
  try {
    return await bcrypt.compare(plain, hash);
  } catch (err) {
    return plain === hash;
  }
}

// Helper: obtiene id_cliente del usuario logueado
async function getIdCliente(id_usuario) {
  const [[c]] = await db.query(
    "SELECT id_cliente FROM clientes WHERE id_usuario = ?",
    [id_usuario]
  );
  return c?.id_cliente ?? null;
}

// GET /api/clientes/perfil
async function getPerfilCliente(req, res) {
  const id_usuario = req.usuario.id_usuario;
  try {
    const [[cliente]] = await db.query(
      `SELECT id_cliente, nombres, apellidos, cedula,
              fecha_nacimiento, correo, telefono, creado_en
       FROM clientes WHERE id_usuario = ?`,
      [id_usuario]
    );

    if (cliente) return res.json(cliente);

    // Fallback: si existe un registro de cliente sin id_usuario pero con el mismo correo,
    // lo vinculamos automáticamente al usuario actual.
    const correo = req.usuario.correo;
    if (!correo) return res.status(404).json({ error: "Perfil no encontrado" });

    const [[clienteCorreo]] = await db.query(
      `SELECT id_cliente, nombres, apellidos, cedula,
              fecha_nacimiento, correo, telefono, creado_en
       FROM clientes WHERE correo = ? AND id_usuario IS NULL`,
      [correo]
    );

    if (!clienteCorreo) return res.status(404).json({ error: "Perfil no encontrado" });

    await db.query(
      `UPDATE clientes SET id_usuario = ? WHERE id_cliente = ?`,
      [id_usuario, clienteCorreo.id_cliente]
    );

    return res.json(clienteCorreo);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al obtener perfil" });
  }
}

// PUT /api/clientes/perfil
async function actualizarPerfilCliente(req, res) {
  const id_usuario = req.usuario.id_usuario;
  const { nombres, apellidos, correo, telefono, fecha_nacimiento, contrasena_actual, contrasena_nueva, contrasena_confirmar } = req.body;

  if (!nombres || !apellidos) {
    return res.status(400).json({ error: "Nombres y apellidos son requeridos" });
  }

  const hoy = new Date().toISOString().split("T")[0];
  if (fecha_nacimiento && fecha_nacimiento > hoy) {
    return res.status(400).json({ error: "La fecha de nacimiento no puede ser posterior a hoy" });
  }

  const actualizarContrasena = contrasena_actual || contrasena_nueva || contrasena_confirmar;
  let hashContrasena;

  if (actualizarContrasena) {
    if (!contrasena_actual || !contrasena_nueva || !contrasena_confirmar) {
      return res.status(400).json({ error: "Completa todos los campos para cambiar la contraseña" });
    }
    if (contrasena_nueva !== contrasena_confirmar) {
      return res.status(400).json({ error: "Las nuevas contraseñas no coinciden" });
    }
    if (contrasena_nueva.length < 6) {
      return res.status(400).json({ error: "La nueva contraseña debe tener al menos 6 caracteres" });
    }

    try {
      const [[usuario]] = await db.query(
        "SELECT contrasena FROM usuarios WHERE id_usuario = ?",
        [id_usuario]
      );
      if (!usuario) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      let passwordOk = await compararContrasena(contrasena_actual, usuario.contrasena);
      if (!passwordOk && contrasena_actual === usuario.contrasena) {
        passwordOk = true;
        try {
          const nuevoHash = await bcrypt.hash(contrasena_actual, 12);
          await db.query("UPDATE usuarios SET contrasena = ? WHERE id_usuario = ?", [nuevoHash, id_usuario]);
        } catch (migracionErr) {
          console.error("Error migrando contraseña en texto plano:", migracionErr);
        }
      }

      if (!passwordOk) {
        return res.status(400).json({ error: "La contraseña actual es incorrecta" });
      }
      hashContrasena = await bcrypt.hash(contrasena_nueva, 12);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message || "Error al validar la contraseña" });
    }
  }

  try {
    const [result] = await db.query(
      `UPDATE clientes
       SET nombres = ?, apellidos = ?, correo = ?, telefono = ?, fecha_nacimiento = ?
       WHERE id_usuario = ?`,
      [nombres, apellidos, correo || null, telefono || null, fecha_nacimiento || null, id_usuario]
    );

    if (result.affectedRows === 0) {
      const correoActual = req.usuario.correo;
      if (correoActual) {
        await db.query(
          `UPDATE clientes
           SET id_usuario = ?, nombres = ?, apellidos = ?, correo = ?, telefono = ?, fecha_nacimiento = ?
           WHERE correo = ? AND id_usuario IS NULL`,
          [id_usuario, nombres, apellidos, correo || correoActual, telefono || null, fecha_nacimiento || null, correoActual]
        );
      }
    }

    await db.query(
      `UPDATE usuarios
       SET nombres = ?, apellidos = ?, correo = ?
       WHERE id_usuario = ?`,
      [nombres, apellidos, correo || req.usuario.correo, id_usuario]
    );

    if (hashContrasena) {
      await db.query(
        `UPDATE usuarios
         SET contrasena = ?
         WHERE id_usuario = ?`,
        [hashContrasena, id_usuario]
      );
    }

    const [[usuarioActualizado]] = await db.query(
      `SELECT u.id_usuario, u.id_rol, u.nombres, u.apellidos, u.correo,
              r.nombre AS rol, u.id_sede, s.nombre AS sede
       FROM usuarios u
       JOIN roles r ON r.id_rol = u.id_rol
       LEFT JOIN sedes s ON s.id_sede = u.id_sede
       WHERE u.id_usuario = ?`,
      [id_usuario]
    );

    const token = crearToken(usuarioActualizado);
    return res.json({ mensaje: "Perfil actualizado", token, usuario: usuarioActualizado });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al actualizar perfil" });
  }
}

// GET /api/clientes - lista todos los clientes (solo admin_general, super_admin)
async function getClientes(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT id_cliente, nombres, apellidos, correo, telefono, cedula,
              fecha_nacimiento, creado_en,
              CASE WHEN id_usuario IS NOT NULL THEN 1 ELSE 0 END AS activo
       FROM clientes
       ORDER BY nombres
       LIMIT 100`
    );
    return res.json(rows || []);
  } catch (err) {
    console.error("Error en getClientes:", err);
    return res.status(500).json({ error: "Error al obtener clientes" });
  }
}

module.exports = { getPerfilCliente, actualizarPerfilCliente, getIdCliente, getClientes };
