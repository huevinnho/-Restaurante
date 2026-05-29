const db = require("../config/db");

// Alias usados en todas las queries:
//   direccion → director  (lo que el frontend llama "director" es la dirección física)
//   telefono  → contacto  (lo que el frontend llama "contacto" es el teléfono)
//   activa    → siempre 1 (la tabla no tiene esta columna aún)

const SELECT_SEDE = `
  SELECT id_sede, nombre, ciudad, pais,
         direccion AS director,
         telefono  AS contacto,
         1         AS activa,
         creado_en
  FROM sedes`;

// GET /api/sedes
async function getSedes(req, res) {
  try {
    const [rows] = await db.query(`${SELECT_SEDE} ORDER BY nombre`);
    return res.json(rows);
  } catch (err) {
    console.error("Error al obtener sedes:", err);
    return res.status(500).json({ error: "Error al obtener sedes" });
  }
}

// POST /api/sedes — solo super_admin
async function crearSede(req, res) {
  const { nombre, ciudad, pais, director, contacto } = req.body;

  if (!nombre || !nombre.trim()) {
    return res.status(400).json({ error: "El nombre de la sede es requerido" });
  }

  try {
    const [[existente]] = await db.query(
      "SELECT id_sede FROM sedes WHERE nombre = ?",
      [nombre.trim()]
    );
    if (existente) {
      return res.status(409).json({ error: "Ya existe una sede con ese nombre" });
    }

    const [result] = await db.query(
      `INSERT INTO sedes (nombre, ciudad, pais, direccion, telefono)
       VALUES (?, ?, ?, ?, ?)`,
      [nombre.trim(), ciudad || null, pais || null, director || null, contacto || null]
    );

    const [[nueva]] = await db.query(
      `${SELECT_SEDE} WHERE id_sede = ?`,
      [result.insertId]
    );
    return res.status(201).json(nueva);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al crear sede" });
  }
}

// PUT /api/sedes/:id — solo super_admin
async function actualizarSede(req, res) {
  const { id } = req.params;
  const { nombre, ciudad, pais, director, contacto } = req.body;

  if (!nombre || !nombre.trim()) {
    return res.status(400).json({ error: "El nombre de la sede es requerido" });
  }

  try {
    const [[existe]] = await db.query(
      "SELECT id_sede FROM sedes WHERE id_sede = ?", [id]
    );
    if (!existe) return res.status(404).json({ error: "Sede no encontrada" });

    await db.query(
      `UPDATE sedes
       SET nombre = ?, ciudad = ?, pais = ?, direccion = ?, telefono = ?
       WHERE id_sede = ?`,
      [nombre.trim(), ciudad || null, pais || null, director || null, contacto || null, id]
    );

    const [[actualizada]] = await db.query(
      `${SELECT_SEDE} WHERE id_sede = ?`, [id]
    );
    return res.json(actualizada);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al actualizar sede" });
  }
}

// DELETE /api/sedes/:id — solo super_admin
async function eliminarSede(req, res) {
  const { id } = req.params;

  try {
    const [[existe]] = await db.query(
      "SELECT id_sede FROM sedes WHERE id_sede = ?",
      [id]
    );

    if (!existe) {
      return res.status(404).json({ error: "Sede no encontrada" });
    }

    await db.query(
      "DELETE FROM sedes WHERE id_sede = ?",
      [id]
    );

    return res.json({ mensaje: "Sede eliminada correctamente" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al eliminar sede" });
  }
}

module.exports = {
  getSedes,
  crearSede,
  actualizarSede,
  eliminarSede
};