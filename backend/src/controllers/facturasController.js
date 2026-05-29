const db = require("../config/db");

// GET /api/facturas
// super_admin ve todas; admin_punto ve solo su sede
// Query params opcionales: ?desde=YYYY-MM-DD&hasta=YYYY-MM-DD | ?mes=M&año=YYYY | ?id_sede=N
async function getFacturas(req, res) {
  const userSede = req.usuario?.id_sede;
  const canFilterSede = ["super_admin", "admin_general"].includes(req.usuario?.rol);
  const { desde, hasta, mes, año, id_sede: sedeParam } = req.query;
  const sedeNumber = Number(sedeParam);

  try {
    let condiciones = [];
    let params      = [];

    // Filtro por sede: super_admin/admin_general puede pasar ?id_sede, otros ven solo la suya
    if (!canFilterSede && userSede) {
      condiciones.push("f.id_sede = ?");
      params.push(userSede);
    } else if (canFilterSede && !isNaN(sedeNumber) && sedeNumber > 0) {
      condiciones.push("f.id_sede = ?");
      params.push(sedeNumber);
    }

    // Filtro por fecha — desde/hasta tiene prioridad sobre mes/año
    if (desde && hasta) {
      condiciones.push("DATE(f.fecha_emision) BETWEEN ? AND ?");
      params.push(desde, hasta);
    } else if (mes && año) {
      condiciones.push("MONTH(f.fecha_emision) = ? AND YEAR(f.fecha_emision) = ?");
      params.push(Number(mes), Number(año));
    }

    const where = condiciones.length ? `WHERE ${condiciones.join(" AND ")}` : "";

    const [rows] = await db.query(
      `SELECT f.id_factura, f.id_pedido,
              f.subtotal, f.iva_porcentaje, f.iva_valor,
              f.propina, f.total, f.fecha_emision,
              mp.nombre AS metodo_pago,
              s.nombre  AS sede,
              m.numero  AS mesa_numero,
              COALESCE(CONCAT(c.nombres, ' ', c.apellidos), 'N/A') AS cliente_nombre
       FROM facturas f
       JOIN metodos_pago mp ON mp.id_metodo    = f.id_metodo_pago
       LEFT JOIN sedes s   ON s.id_sede        = f.id_sede
       LEFT JOIN pedidos p ON p.id_pedido      = f.id_pedido
       LEFT JOIN mesas m   ON m.id_mesa        = p.id_mesa
       LEFT JOIN clientes c ON c.id_cliente    = f.id_cliente
       ${where}
       ORDER BY f.fecha_emision DESC
       LIMIT 500`,
      params
    );
    return res.json(rows || []);
  } catch (err) {
    console.error("Error en getFacturas:", err);
    return res.status(500).json({ error: "Error al obtener facturas" });
  }
}

// GET /api/facturas/mis-facturas — facturas de los pedidos del mesero autenticado
async function getMisFacturas(req, res) {
  const id_usuario = req.usuario.id_usuario;
  try {
    const [[empleado]] = await db.query(
      "SELECT id_empleado FROM empleados WHERE id_usuario = ?",
      [id_usuario]
    );
    if (!empleado) return res.status(404).json({ error: "Empleado no encontrado" });

    const [rows] = await db.query(
      `SELECT f.id_factura, f.id_pedido,
              f.subtotal, f.iva_porcentaje, f.iva_valor,
              f.propina, f.total, f.fecha_emision,
              mp.nombre AS metodo_pago,
              m.numero  AS mesa_numero,
              CONCAT(c.nombres, ' ', c.apellidos) AS cliente_nombre
       FROM facturas f
       JOIN pedidos p      ON p.id_pedido   = f.id_pedido
       JOIN mesas m        ON m.id_mesa     = p.id_mesa
       JOIN metodos_pago mp ON mp.id_metodo = f.id_metodo_pago
       LEFT JOIN clientes c ON c.id_cliente = f.id_cliente
       WHERE p.id_mesero = ?
       ORDER BY f.fecha_emision DESC`,
      [empleado.id_empleado]
    );
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al obtener tus facturas" });
  }
}

// POST /api/facturas — admin_punto / mesero
async function crearFactura(req, res) {
  const { id_pedido, id_cliente, id_metodo_pago, propina, iva_porcentaje } = req.body;

  if (!id_pedido || !id_metodo_pago) {
    return res.status(400).json({ error: "id_pedido y id_metodo_pago son requeridos" });
  }
  if (propina !== undefined && propina < 0) {
    return res.status(400).json({ error: "La propina no puede ser negativa" });
  }
  if (iva_porcentaje !== undefined && (iva_porcentaje < 0 || iva_porcentaje > 100)) {
    return res.status(400).json({ error: "El IVA debe estar entre 0 y 100" });
  }

  const id_sede = req.usuario.id_sede;

  try {
    const [[pedido]] = await db.query(
      "SELECT id_pedido, estado, id_mesa FROM pedidos WHERE id_pedido = ? AND id_sede = ?",
      [id_pedido, id_sede]
    );
    if (!pedido) return res.status(404).json({ error: "Pedido no encontrado" });
    if (pedido.estado !== "listo") {
      return res.status(400).json({
        error: `El pedido debe estar en estado "listo" para facturar (estado actual: ${pedido.estado})`
      });
    }

    const [[facturaExiste]] = await db.query(
      "SELECT id_factura FROM facturas WHERE id_pedido = ?", [id_pedido]
    );
    if (facturaExiste) {
      return res.status(409).json({
        error: `Este pedido ya fue facturado (factura #${facturaExiste.id_factura})`
      });
    }

    const [[metodo]] = await db.query(
      "SELECT id_metodo FROM metodos_pago WHERE id_metodo = ?", [id_metodo_pago]
    );
    if (!metodo) return res.status(400).json({ error: "Método de pago inválido" });

    // Calcular subtotal desde los ítems del pedido
    const [items] = await db.query(
      `SELECT pd.cantidad, pl.precio
       FROM pedido_detalle pd
       JOIN platos pl ON pl.id_plato = pd.id_plato
       WHERE pd.id_pedido = ?`,
      [id_pedido]
    );
    if (!items.length) return res.status(400).json({ error: "El pedido no tiene ítems" });

    const subtotal  = items.reduce((s, i) => s + i.precio * i.cantidad, 0);
    const ivaPct    = iva_porcentaje ?? 19.0;
    const iva_valor = +(subtotal * ivaPct / 100).toFixed(2);
    const propina_v = +(propina || 0);
    const total     = +(subtotal + iva_valor + propina_v).toFixed(2);

    const [result] = await db.query(
      `INSERT INTO facturas
         (id_pedido, id_cliente, id_sede, id_metodo_pago,
          subtotal, iva_porcentaje, iva_valor, propina, total)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id_pedido, id_cliente || null, id_sede, id_metodo_pago,
       subtotal, ivaPct, iva_valor, propina_v, total]
    );

    // Marcar pedido como entregado y liberar mesa
    await db.query("UPDATE pedidos SET estado = 'entregado' WHERE id_pedido = ?", [id_pedido]);
    await db.query("UPDATE mesas SET disponible = 1 WHERE id_mesa = ?", [pedido.id_mesa]);

    return res.status(201).json({ id_factura: result.insertId, total });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al crear factura" });
  }
}

module.exports = { getFacturas, getMisFacturas, crearFactura };
