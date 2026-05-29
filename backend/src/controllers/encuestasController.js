const db = require("../config/db");
const { getIdCliente } = require("./clientesController");

// GET /api/encuestas/pedidos-disponibles
// Pedidos entregados del cliente que aún no tienen encuesta
async function getMisPedidosEntregados(req, res) {
  const id_cliente = await getIdCliente(req.usuario.id_usuario);
  if (!id_cliente) return res.status(404).json({ error: "Cliente no encontrado" });

  try {
    const [rows] = await db.query(
      `SELECT p.id_pedido, p.creado_en, m.numero AS mesa_numero,
              s.nombre AS sede
       FROM pedidos p
       JOIN facturas f   ON f.id_pedido  = p.id_pedido
       JOIN mesas m      ON m.id_mesa    = p.id_mesa
       JOIN sedes s      ON s.id_sede    = p.id_sede
       WHERE f.id_cliente = ?
         AND p.estado     = 'entregado'
         AND p.id_pedido NOT IN (
           SELECT COALESCE(id_pedido, 0) FROM encuestas WHERE id_cliente = ?
         )
       ORDER BY p.creado_en DESC`,
      [id_cliente, id_cliente]
    );
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al obtener pedidos" });
  }
}

// GET /api/encuestas/mis-encuestas
async function getMisEncuestas(req, res) {
  const id_cliente = await getIdCliente(req.usuario.id_usuario);
  if (!id_cliente) return res.status(404).json({ error: "Cliente no encontrado" });

  try {
    const [rows] = await db.query(
      `SELECT e.id_encuesta, e.id_pedido, e.satisfecho_servicio,
              e.gusto_comida, e.tiempo_espera_adecuado,
              e.observacion, e.fecha,
              s.nombre AS sede
       FROM encuestas e
       JOIN sedes s ON s.id_sede = e.id_sede
       WHERE e.id_cliente = ?
       ORDER BY e.fecha DESC`,
      [id_cliente]
    );
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al obtener encuestas" });
  }
}

// POST /api/encuestas
async function crearEncuesta(req, res) {
  const id_cliente = await getIdCliente(req.usuario.id_usuario);
  if (!id_cliente) return res.status(404).json({ error: "Cliente no encontrado" });

  const { id_pedido, satisfecho_servicio, gusto_comida, tiempo_espera_adecuado, observacion } = req.body;

  if (!id_pedido) {
    return res.status(400).json({ error: "id_pedido es requerido" });
  }

  try {
    // Obtener id_sede del pedido y verificar que pertenece al cliente
    const [[pedido]] = await db.query(
      `SELECT p.id_sede FROM pedidos p
       JOIN facturas f ON f.id_pedido = p.id_pedido
       WHERE p.id_pedido = ? AND f.id_cliente = ?`,
      [id_pedido, id_cliente]
    );
    if (!pedido) return res.status(404).json({ error: "Pedido no encontrado" });

    // Verificar que no existe ya una encuesta para este pedido
    const [[existe]] = await db.query(
      "SELECT id_encuesta FROM encuestas WHERE id_pedido = ? AND id_cliente = ?",
      [id_pedido, id_cliente]
    );
    if (existe) return res.status(409).json({ error: "Ya enviaste una encuesta para este pedido" });

    const [result] = await db.query(
      `INSERT INTO encuestas
         (id_cliente, id_sede, id_pedido, satisfecho_servicio, gusto_comida, tiempo_espera_adecuado, observacion)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id_cliente, pedido.id_sede, id_pedido,
        satisfecho_servicio ?? null,
        gusto_comida ?? null,
        tiempo_espera_adecuado ?? null,
        observacion || null,
      ]
    );
    return res.status(201).json({ id_encuesta: result.insertId });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al crear encuesta" });
  }
}

module.exports = { getMisPedidosEntregados, getMisEncuestas, crearEncuesta };
