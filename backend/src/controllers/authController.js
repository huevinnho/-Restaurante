const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

function crearToken(usuario) {
  const payload = {
    id_usuario: usuario.id_usuario,
    id_rol: usuario.id_rol,
    rol: usuario.rol,
    id_sede: usuario.id_sede,
    nombres: usuario.nombres,
    correo: usuario.correo,
  };
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "8h",
  });
}

function hoyISO() {
  return new Date().toISOString().split("T")[0];
}

// POST /api/auth/login
async function login(req, res) {
  const { correo, contrasena } = req.body;

  if (!correo || !contrasena) {
    return res.status(400).json({ error: "Correo y contraseña requeridos" });
  }

  try {
    const [rows] = await db.query(
      `SELECT u.id_usuario, u.id_rol, u.id_sede, u.nombres, u.apellidos,
              u.correo, u.contrasena, u.activo, r.nombre AS rol,
              s.nombre AS sede
       FROM usuarios u
       JOIN roles r ON r.id_rol = u.id_rol
       LEFT JOIN sedes s ON s.id_sede = u.id_sede
       WHERE u.correo = ?`,
      [correo]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    const usuario = rows[0];

    if (!usuario.activo) {
      return res.status(403).json({ error: "Usuario inactivo" });
    }

    let passwordOk = await bcrypt.compare(contrasena, usuario.contrasena);
    if (!passwordOk) {
      // Compatibilidad con registros antiguos que puedan haber quedado en texto plano.
      if (contrasena === usuario.contrasena) {
        passwordOk = true;
        try {
          const nuevoHash = await bcrypt.hash(contrasena, 12);
          await db.query("UPDATE usuarios SET contrasena = ? WHERE id_usuario = ?", [nuevoHash, usuario.id_usuario]);
        } catch (migracionErr) {
          console.error("Error al migrar contraseña en texto plano:", migracionErr);
        }
      }
    }

    if (!passwordOk) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    const token = crearToken(usuario);

    return res.json({
      token,
      usuario: {
        id_usuario: usuario.id_usuario,
        nombres: usuario.nombres,
        apellidos: usuario.apellidos,
        correo: usuario.correo,
        rol: usuario.rol,
        id_sede: usuario.id_sede,
        sede: usuario.sede,
      },
    });
  } catch (err) {
    console.error("Error en login:", err);
    return res.status(500).json({ error: "Error del servidor" });
  }
}

// POST /api/auth/register  — registro público de clientes
async function registrarCliente(req, res) {
  const { nombres, apellidos, cedula, correo, telefono, fecha_nacimiento, contrasena } = req.body;

  if (!nombres || !apellidos || !cedula || !correo || !contrasena) {
    return res.status(400).json({ error: "Nombres, apellidos, cédula, correo y contraseña son requeridos" });
  }

  if (fecha_nacimiento && fecha_nacimiento > hoyISO()) {
    return res.status(400).json({ error: "La fecha de nacimiento no puede ser posterior a hoy" });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [[rolCliente]] = await conn.query("SELECT id_rol FROM roles WHERE nombre = 'cliente'");
    if (!rolCliente) throw new Error("No existe el rol cliente en la base de datos");

    const hash = await bcrypt.hash(contrasena, 12);
    const [u] = await conn.query(
      `INSERT INTO usuarios (id_rol, id_sede, nombres, apellidos, correo, contrasena, activo)
       VALUES (?, NULL, ?, ?, ?, ?, 1)`,
      [rolCliente.id_rol, nombres, apellidos, correo, hash]
    );

    await conn.query(
      `INSERT INTO clientes (id_usuario, nombres, apellidos, cedula, fecha_nacimiento, correo, telefono)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [u.insertId, nombres, apellidos, cedula, fecha_nacimiento || null, correo, telefono || null]
    );

    await conn.commit();
    return res.status(201).json({ mensaje: "Cliente registrado correctamente" });
  } catch (err) {
    await conn.rollback();
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "El correo o la cédula ya están registrados" });
    }
    console.error("Error en registro:", err);
    return res.status(500).json({ error: "Error al registrar cliente" });
  } finally {
    conn.release();
  }
}

// GET /api/auth/me  (requiere token)
async function perfil(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT u.id_usuario, u.nombres, u.apellidos, u.correo,
              r.nombre AS rol, u.id_sede, s.nombre AS sede
       FROM usuarios u
       JOIN roles r ON r.id_rol = u.id_rol
       LEFT JOIN sedes s ON s.id_sede = u.id_sede
       WHERE u.id_usuario = ?`,
      [req.usuario.id_usuario]
    );

    if (rows.length === 0) return res.status(404).json({ error: "Usuario no encontrado" });
    return res.json(rows[0]);
  } catch (err) {
    console.error("Error en perfil:", err);
    return res.status(500).json({ error: "Error del servidor" });
  }
}

// PUT /api/auth/mi-sede  — mesero/cocinero elige la sede donde trabaja
async function cambiarMiSede(req, res) {
  const { id_sede } = req.body;
  if (!id_sede) return res.status(400).json({ error: "Debes seleccionar una sede" });

  try {
    const [[sede]] = await db.query("SELECT id_sede FROM sedes WHERE id_sede = ?", [id_sede]);
    if (!sede) return res.status(404).json({ error: "Sede no encontrada" });

    await db.query("UPDATE usuarios SET id_sede = ? WHERE id_usuario = ?", [id_sede, req.usuario.id_usuario]);
    await db.query("UPDATE empleados SET id_sede = ? WHERE id_usuario = ?", [id_sede, req.usuario.id_usuario]);

    const [[usuario]] = await db.query(
      `SELECT u.id_usuario, u.id_rol, u.id_sede, u.nombres, u.apellidos,
              u.correo, r.nombre AS rol, s.nombre AS sede
       FROM usuarios u
       JOIN roles r ON r.id_rol = u.id_rol
       LEFT JOIN sedes s ON s.id_sede = u.id_sede
       WHERE u.id_usuario = ?`,
      [req.usuario.id_usuario]
    );

    const token = crearToken(usuario);
    return res.json({ token, usuario });
  } catch (err) {
    console.error("Error al cambiar sede:", err);
    return res.status(500).json({ error: "Error al cambiar sede" });
  }
}

module.exports = { crearToken, login, perfil, registrarCliente, cambiarMiSede };
