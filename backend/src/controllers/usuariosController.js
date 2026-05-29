const bcrypt = require("bcryptjs");
const db     = require("../config/db");

// GET /api/usuarios
// super_admin ve todos; admin_general ve solo su sede
async function getUsuarios(req, res) {
  const id_sede     = req.usuario?.id_sede;
  const esSuperAdmin = req.usuario?.rol === "super_admin";

  try {
    let query = `
      SELECT u.id_usuario, u.nombres, u.apellidos, u.correo,
             u.activo, u.creado_en,
             r.nombre AS rol,
             s.nombre AS sede, u.id_sede
      FROM usuarios u
      JOIN roles r ON r.id_rol = u.id_rol
      LEFT JOIN sedes s ON s.id_sede = u.id_sede`;

    let params = [];
    if (!esSuperAdmin && id_sede) {
      query += " WHERE u.id_sede = ?";
      params = [id_sede];
    }
    query += " ORDER BY u.nombres LIMIT 200";

    const [rows] = await db.query(query, params);
    return res.json(rows || []);
  } catch (err) {
    console.error("Error en getUsuarios:", err);
    return res.status(500).json({ error: "Error al obtener usuarios" });
  }
}

// POST /api/usuarios
// Acepta id_rol (número) o rol (string) — compatible con AdminPage y SuperAdminPage
async function crearUsuario(req, res) {
  const { nombres, apellidos, correo, contrasena, id_rol, rol, id_sede } = req.body;

  if (!nombres || !apellidos || !correo || !contrasena) {
    return res.status(400).json({ error: "Nombres, apellidos, correo y contraseña son requeridos" });
  }
  if (!id_rol && !rol) {
    return res.status(400).json({ error: "Se requiere id_rol o rol" });
  }

  try {
    // Resolver id_rol: puede venir como número directo o como nombre de rol
    let rolId = id_rol;
    if (!rolId && rol) {
      const [[rolRow]] = await db.query(
        "SELECT id_rol FROM roles WHERE nombre = ?", [rol]
      );
      if (!rolRow) return res.status(400).json({ error: `El rol '${rol}' no existe` });
      rolId = rolRow.id_rol;
    }

    const hash = await bcrypt.hash(contrasena, 12);

    const [result] = await db.query(
      `INSERT INTO usuarios (nombres, apellidos, correo, contrasena, id_rol, id_sede, activo)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [nombres.trim(), apellidos.trim(), correo.trim(), hash, rolId, id_sede || null]
    );

    const [[nuevo]] = await db.query(
      `SELECT u.id_usuario, u.nombres, u.apellidos, u.correo,
              u.activo, r.nombre AS rol, s.nombre AS sede
       FROM usuarios u
       JOIN roles r ON r.id_rol = u.id_rol
       LEFT JOIN sedes s ON s.id_sede = u.id_sede
       WHERE u.id_usuario = ?`,
      [result.insertId]
    );
    return res.status(201).json(nuevo);
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "El correo ya está registrado" });
    }
    console.error(err);
    return res.status(500).json({ error: "Error al crear usuario" });
  }
}

// PUT /api/usuarios/:id/activo
async function toggleActivo(req, res) {
  const { id }    = req.params;
  const { activo } = req.body;

  // Evitar que el super_admin se desactive a sí mismo
  if (Number(id) === req.usuario?.id_usuario && !activo) {
    return res.status(403).json({ error: "No puedes desactivarte a ti mismo" });
  }

  try {
    await db.query(
      "UPDATE usuarios SET activo = ? WHERE id_usuario = ?",
      [activo ? 1 : 0, id]
    );
    return res.json({ mensaje: `Usuario ${activo ? "activado" : "desactivado"}` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al actualizar usuario" });
  }
}

// PUT /api/usuarios/:id/rol — solo super_admin
async function cambiarRol(req, res) {
  const { id }         = req.params;
  const { rol, id_sede } = req.body;

  if (!rol) return res.status(400).json({ error: "El rol es requerido" });

  try {
    const [[rolRow]] = await db.query(
      "SELECT id_rol FROM roles WHERE nombre = ?", [rol]
    );
    if (!rolRow) return res.status(400).json({ error: `El rol '${rol}' no existe` });

    await db.query(
      "UPDATE usuarios SET id_rol = ?, id_sede = ? WHERE id_usuario = ?",
      [rolRow.id_rol, id_sede || null, id]
    );
    return res.json({ mensaje: "Rol actualizado correctamente" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al cambiar rol" });
  }
}

module.exports = { getUsuarios, crearUsuario, toggleActivo, cambiarRol };
