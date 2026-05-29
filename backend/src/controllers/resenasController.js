const db = require("../config/db");
const { getIdCliente } = require("./clientesController");

// GET /api/resenas/mis-resenas
async function getMisResenas(req, res) {
  const id_cliente = await getIdCliente(req.usuario.id_usuario);
  if (!id_cliente) return res.status(404).json({ error: "Cliente no encontrado" });

  try {
    const [rows] = await db.query(
      `SELECT r.id_resena, r.id_pedido, r.calificacion,
              r.comentario, r.fecha, s.nombre AS sede
       FROM resenas r
       JOIN sedes s ON s.id_sede = r.id_sede
       WHERE r.id_cliente = ?
       ORDER BY r.fecha DESC`,
      [id_cliente]
    );
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al obtener reseñas" });
  }
}

// POST /api/resenas
async function crearResena(req, res) {
  const id_cliente = await getIdCliente(req.usuario.id_usuario);
  if (!id_cliente) return res.status(404).json({ error: "Cliente no encontrado" });

  const { id_pedido, calificacion, comentario } = req.body;

  if (!id_pedido || !calificacion) {
    return res.status(400).json({ error: "id_pedido y calificacion son requeridos" });
  }
  if (calificacion < 1 || calificacion > 5) {
    return res.status(400).json({ error: "La calificación debe ser entre 1 y 5" });
  }

  try {
    const [[pedido]] = await db.query(
      `SELECT p.id_sede FROM pedidos p
       JOIN facturas f ON f.id_pedido = p.id_pedido
       WHERE p.id_pedido = ? AND f.id_cliente = ?`,
      [id_pedido, id_cliente]
    );
    if (!pedido) return res.status(404).json({ error: "Pedido no encontrado" });

    const [[existe]] = await db.query(
      "SELECT id_resena FROM resenas WHERE id_pedido = ? AND id_cliente = ?",
      [id_pedido, id_cliente]
    );
    if (existe) return res.status(409).json({ error: "Ya tienes una reseña para este pedido" });

    const [result] = await db.query(
      `INSERT INTO resenas (id_cliente, id_sede, id_pedido, calificacion, comentario)
       VALUES (?, ?, ?, ?, ?)`,
      [id_cliente, pedido.id_sede, id_pedido, calificacion, comentario || null]
    );
    return res.status(201).json({ id_resena: result.insertId });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al crear reseña" });
  }
}

module.exports = { getMisResenas, crearResena };
