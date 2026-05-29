const db = require("../config/db");

// GET /api/inventario
async function getInventario(req, res) {
  const querySede = Number(req.query.id_sede);
  const canFilterSede = ["super_admin", "admin_general"].includes(req.usuario.rol);
  const id_sede = (canFilterSede && !isNaN(querySede) && querySede > 0)
    ? querySede
    : req.usuario.id_sede;

  try {
    let sql = `SELECT p.id_producto, p.nombre, p.descripcion, p.unidad_medida,
              p.cantidad_actual, p.cantidad_minima, p.fecha_vencimiento,
              p.precio_unitario, c.nombre AS categoria,
              pr.nombre AS proveedor,
              CASE
                WHEN p.cantidad_actual <= p.cantidad_minima THEN 'bajo'
                WHEN p.fecha_vencimiento IS NOT NULL
                  AND DATEDIFF(p.fecha_vencimiento, CURDATE()) <= 5 THEN 'por_vencer'
                ELSE 'ok'
              END AS alerta
       FROM productos_inventario p
       JOIN categorias_producto c  ON c.id_categoria = p.id_categoria
       LEFT JOIN proveedores pr    ON pr.id_proveedor = p.id_proveedor
       WHERE 1 = 1`;
    const params = [];

    if (id_sede) {
      sql += ` AND p.id_sede = ?`;
      params.push(id_sede);
    }

    sql += ` ORDER BY alerta DESC, p.nombre`;
    const [rows] = await db.query(sql, params);
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al obtener inventario" });
  }
}

// PUT /api/inventario/:id
async function actualizarProducto(req, res) {
  const { id } = req.params;
  const { cantidad_actual } = req.body;

  if (cantidad_actual === undefined || cantidad_actual === null) {
    return res.status(400).json({ error: "cantidad_actual es requerida" });
  }
  if (isNaN(cantidad_actual) || Number(cantidad_actual) < 0) {
    return res.status(400).json({ error: "La cantidad no puede ser negativa" });
  }

  try {
    // Verificar que el producto existe
    const [[producto]] = await db.query(
      "SELECT id_producto, nombre, cantidad_minima FROM productos_inventario WHERE id_producto = ?",
      [id]
    );
    if (!producto) return res.status(404).json({ error: "Producto no encontrado" });

    await db.query(
      "UPDATE productos_inventario SET cantidad_actual = ? WHERE id_producto = ?",
      [Number(cantidad_actual), id]
    );

    // Advertir si queda bajo el mínimo
    const respuesta = { mensaje: "Inventario actualizado" };
    if (Number(cantidad_actual) <= producto.cantidad_minima) {
      respuesta.advertencia = `${producto.nombre} está por debajo del stock mínimo (${producto.cantidad_minima})`;
    }

    return res.json(respuesta);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al actualizar inventario" });
  }
}

module.exports = { getInventario, actualizarProducto };
