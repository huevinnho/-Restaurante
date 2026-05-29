const db = require("../config/db");
const { getIdCliente } = require("./clientesController");

// GET /api/alergias  — catálogo completo (público o cliente)
async function getAlergias(req, res) {
  try {
    const [rows] = await db.query("SELECT id_alergia, nombre FROM alergias ORDER BY nombre");
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al obtener alergias" });
  }
}

// GET /api/alergias/mis-alergias
async function getMisAlergias(req, res) {
  const id_cliente = await getIdCliente(req.usuario.id_usuario);
  if (!id_cliente) return res.status(404).json({ error: "Cliente no encontrado" });

  try {
    const [rows] = await db.query(
      `SELECT ca.id_alergia, a.nombre
       FROM cliente_alergias ca
       JOIN alergias a ON a.id_alergia = ca.id_alergia
       WHERE ca.id_cliente = ?`,
      [id_cliente]
    );
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al obtener mis alergias" });
  }
}

// PUT /api/alergias/mis-alergias  — reemplaza todas las alergias del cliente
async function actualizarMisAlergias(req, res) {
  const id_cliente = await getIdCliente(req.usuario.id_usuario);
  if (!id_cliente) return res.status(404).json({ error: "Cliente no encontrado" });

  const { ids } = req.body; // array de id_alergia activos
  if (!Array.isArray(ids)) {
    return res.status(400).json({ error: "ids debe ser un arreglo" });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query("DELETE FROM cliente_alergias WHERE id_cliente = ?", [id_cliente]);
    if (ids.length > 0) {
      const values = ids.map(id => [id_cliente, id]);
      await conn.query("INSERT INTO cliente_alergias (id_cliente, id_alergia) VALUES ?", [values]);
    }
    await conn.commit();
    return res.json({ mensaje: "Alergias actualizadas" });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    return res.status(500).json({ error: "Error al actualizar alergias" });
  } finally {
    conn.release();
  }
}

module.exports = { getAlergias, getMisAlergias, actualizarMisAlergias };
