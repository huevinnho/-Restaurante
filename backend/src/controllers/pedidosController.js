const db = require("../config/db");
const DETALLE_EXCLUSION_TOKEN = "|EXCLUIDOS|";


const getMisPedidos = async (req, res) => {
  try {
    const [pedidos] = await db.query(
      `SELECT p.*, m.numero AS mesa_numero,
              JSON_ARRAYAGG(
                JSON_OBJECT(
                  'id_plato', pd.id_plato,
                  'plato_nombre', pl.nombre,
                  'cantidad', pd.cantidad,
                  'precio_unitario', pd.precio_unitario,
                  'observacion', pd.observacion,
                  'alergias_texto', pd.alergias_texto
                )
              ) AS items
       FROM pedidos p
       JOIN mesas m ON p.id_mesa = m.id_mesa
       JOIN pedido_detalle pd ON p.id_pedido = pd.id_pedido
       JOIN platos pl ON pd.id_plato = pl.id_plato
       WHERE p.id_cliente = ?
       GROUP BY p.id_pedido
       ORDER BY p.creado_en DESC`,
      [req.user.id]
    );
    res.json(pedidos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


function parseDetalleObservacion(observacion = "") {
  if (!observacion) return { nota: null, ingredientes_excluir: [] };
  const idx = observacion.indexOf(DETALLE_EXCLUSION_TOKEN);
  if (idx === -1) return { nota: observacion, ingredientes_excluir: [] };
  const nota = observacion.slice(0, idx).trim();
  const raw = observacion.slice(idx + DETALLE_EXCLUSION_TOKEN.length);
  try {
    const parsed = JSON.parse(raw);
    return {
      nota: nota || null,
      ingredientes_excluir: Array.isArray(parsed) ? parsed : [],
    };
  } catch (err) {
    return { nota: observacion, ingredientes_excluir: [] };
  }
}

function serializeDetalleObservacion(nota, ingredientes_excluir = []) {
  const cleanNota = nota ? String(nota).trim() : "";
  if (!ingredientes_excluir || ingredientes_excluir.length === 0) return cleanNota || null;
  const payload = JSON.stringify(ingredientes_excluir);
  return `${cleanNota}${cleanNota ? " " : ""}${DETALLE_EXCLUSION_TOKEN}${payload}`;
}

function extractIngredientesExcluir(item) {
  if (Array.isArray(item.ingredientes_excluir) && item.ingredientes_excluir.length > 0) {
    return item.ingredientes_excluir;
  }
  if (item.observacion) {
    return parseDetalleObservacion(item.observacion).ingredientes_excluir;
  }
  return [];
}

// GET /api/pedidos
async function getPedidos(req, res) {
  const userSede = req.usuario?.id_sede;
  const querySede = Number(req.query.id_sede);
  const canFilterSede = ["super_admin", "admin_general"].includes(req.usuario?.rol);
  const id_sede = (canFilterSede && !isNaN(querySede) && querySede > 0)
    ? querySede
    : userSede;

  try {
    let query = `SELECT p.id_pedido, p.id_mesa, p.id_sede, p.estado, p.observacion, p.creado_en,
              m.numero AS mesa_numero,
              u.nombres AS mesero_nombre,
              s.nombre AS sede_nombre
       FROM pedidos p
       JOIN mesas m ON m.id_mesa = p.id_mesa
       LEFT JOIN empleados e ON e.id_empleado = p.id_mesero
       LEFT JOIN usuarios u ON u.id_usuario = e.id_usuario
       LEFT JOIN sedes s ON s.id_sede = p.id_sede
       WHERE 1=1`;

    let params = [];
    if (id_sede) {
      query += ` AND p.id_sede = ?`;
      params = [id_sede];
    }
    
    query += ` ORDER BY p.creado_en DESC LIMIT 100`;
    
    const [pedidos] = await db.query(query, params);

    for (const pedido of pedidos) {
      const [detalle] = await db.query(
        `SELECT pd.id_detalle, pd.id_plato, pd.cantidad,
                pd.observacion, pd.alergias_texto,
                pl.nombre AS plato_nombre, pl.precio
         FROM pedido_detalle pd
         JOIN platos pl ON pl.id_plato = pd.id_plato
         WHERE pd.id_pedido = ?`,
        [pedido.id_pedido]
      );
      pedido.items = detalle.map(d => {
        const parsed = parseDetalleObservacion(d.observacion);
        return {
          ...d,
          observacion: parsed.nota,
          ingredientes_excluir: parsed.ingredientes_excluir,
          ingredientes_excluir_nombres: [],
        };
      });

      // Si hay exclusiones, obtener los nombres para cada ingrediente excluido
      for (const it of pedido.items) {
        if (it.ingredientes_excluir && it.ingredientes_excluir.length > 0) {
          const ids = it.ingredientes_excluir.map(id => Number(id)).filter(Boolean);
          if (ids.length > 0) {
            const placeholders = ids.map(() => "?").join(",");
            const [prodRows] = await db.query(
              `SELECT id_producto, nombre FROM productos_inventario WHERE id_producto IN (${placeholders})`,
              ids
            );
            it.ingredientes_excluir_nombres = prodRows.map(r => r.nombre);
          }
        }
      }
    }

    return res.json(pedidos || []);
  } catch (err) {
    console.error("Error en getPedidos:", err);
    return res.status(500).json({ error: "Error al obtener pedidos" });
  }
}

async function validarInventarioParaPedido(conn, items) {
  const requerimientos = new Map();

  for (const item of items) {
    const exclude = new Set(extractIngredientesExcluir(item));
    const [ingredientes] = await conn.query(
      `SELECT ri.id_producto, ri.cantidad_requerida, pi.nombre
       FROM receta_ingredientes ri
       JOIN recetas r ON r.id_receta = ri.id_receta
       JOIN productos_inventario pi ON pi.id_producto = ri.id_producto
       WHERE r.id_plato = ?`,
      [item.id_plato]
    );

    for (const ingrediente of ingredientes) {
      if (exclude.has(ingrediente.id_producto)) continue;
      const total = (requerimientos.get(ingrediente.id_producto)?.cantidad || 0)
        + ingrediente.cantidad_requerida * item.cantidad;
      requerimientos.set(ingrediente.id_producto, {
        cantidad: total,
        nombre: ingrediente.nombre,
      });
    }
  }

  if (requerimientos.size === 0) return;

  const ids = [...requerimientos.keys()];
  const placeholders = ids.map(() => "?").join(",");
  const [productos] = await conn.query(
    `SELECT id_producto, nombre, cantidad_actual FROM productos_inventario WHERE id_producto IN (${placeholders})`,
    ids
  );

  const disponible = new Map(productos.map(p => [p.id_producto, p]));

  for (const [id, req] of requerimientos.entries()) {
    const producto = disponible.get(id);
    if (!producto) {
      throw new Error(`No existe inventario registrado para ${req.nombre || "un ingrediente"}`);
    }
    if (producto.cantidad_actual < req.cantidad) {
      throw new Error(`No hay suficiente ${req.nombre} para preparar este pedido`);
    }
  }
}

async function descontarInventarioPedido(conn, id_pedido) {
  const [items] = await conn.query(
    `SELECT id_plato, cantidad, observacion FROM pedido_detalle WHERE id_pedido = ?`,
    [id_pedido]
  );

  const requerimientos = new Map();
  for (const item of items) {
    const { ingredientes_excluir } = parseDetalleObservacion(item.observacion);
    const exclude = new Set(ingredientes_excluir);
    const [ingredientes] = await conn.query(
      `SELECT ri.id_producto, ri.cantidad_requerida
       FROM receta_ingredientes ri
       JOIN recetas r ON r.id_receta = ri.id_receta
       WHERE r.id_plato = ?`,
      [item.id_plato]
    );
    for (const ingrediente of ingredientes) {
      if (exclude.has(ingrediente.id_producto)) continue;
      const total = (requerimientos.get(ingrediente.id_producto) || 0)
        + ingrediente.cantidad_requerida * item.cantidad;
      requerimientos.set(ingrediente.id_producto, total);
    }
  }

  if (requerimientos.size === 0) return;

  for (const [id_producto, cantidad] of requerimientos.entries()) {
    await conn.query(
      `UPDATE productos_inventario
       SET cantidad_actual = cantidad_actual - ?
       WHERE id_producto = ?`,
      [cantidad, id_producto]
    );
  }
}

// POST /api/pedidos
async function crearPedido(req, res) {
  const { id_mesa,id_mesero, observacion, items } = req.body;

  // Validaciones de entrada
  if (!id_mesa) return res.status(400).json({ error: "La mesa es requerida" });
  if (!items || items.length === 0) return res.status(400).json({ error: "El pedido debe tener al menos un ítem" });

  // Validar que cada ítem tenga cantidad > 0
  for (const item of items) {
    if (!item.id_plato) return res.status(400).json({ error: "Cada ítem debe tener un plato válido" });
    if (!item.cantidad || item.cantidad < 1) return res.status(400).json({ error: "La cantidad debe ser mayor a 0" });
  }

  const id_sede = req.body.id_sede || req.usuario.id_sede;
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    // Verificar que la mesa pertenece a la sede
    const [[mesa]] = await conn.query(
      "SELECT id_mesa, disponible FROM mesas WHERE id_mesa = ? AND id_sede = ?",
      [id_mesa, id_sede]
    );
    if (!mesa) throw new Error("Mesa no válida para esta sede");
    if (!mesa.disponible) throw new Error("La mesa ya está ocupada");

    // Verificar que no haya un pedido activo en la misma mesa
    const [pedidoActivo] = await conn.query(
      "SELECT id_pedido FROM pedidos WHERE id_mesa = ? AND estado NOT IN ('entregado','cancelado')",
      [id_mesa]
    );
    if (pedidoActivo.length > 0) throw new Error("La mesa ya tiene un pedido activo");

    // Verificar que los platos existen y están disponibles
    for (const item of items) {
      const [[plato]] = await conn.query(
        "SELECT id_plato, disponible FROM platos WHERE id_plato = ?",
        [item.id_plato]
      );
      if (!plato) throw new Error(`El plato #${item.id_plato} no existe`);
      if (!plato.disponible) throw new Error(`El plato #${item.id_plato} no está disponible`);
    }

    // Verificar inventario para los platos pedidos
    await validarInventarioParaPedido(conn, items);

    // Obtener id_empleado del mesero
   // Después:
const [[empleado]] = await conn.query(
  "SELECT id_empleado FROM empleados WHERE id_usuario = ?",
  [id_mesero]
);
if (!empleado) throw new Error("El mesero asignado no tiene registro de empleado");

    // Insertar pedido
    const [result] = await conn.query(
      `INSERT INTO pedidos (id_mesa, id_mesero, id_sede, estado, observacion)
       VALUES (?, ?, ?, 'pendiente', ?)`,
      [id_mesa, empleado.id_empleado, id_sede, observacion || null]
    );
    const id_pedido = result.insertId;

    // Insertar detalle
    for (const item of items) {
      const observacionSerializada = serializeDetalleObservacion(item.observacion || null, item.ingredientes_excluir);
      await conn.query(
        `INSERT INTO pedido_detalle (id_pedido, id_plato, cantidad, observacion, alergias_texto)
         VALUES (?, ?, ?, ?, ?)`,
        [id_pedido, item.id_plato, item.cantidad, observacionSerializada, item.alergias_texto || null]
      );
    }

    // Marcar mesa como no disponible
    await conn.query("UPDATE mesas SET disponible = 0 WHERE id_mesa = ?", [id_mesa]);

    await conn.commit();
    return res.status(201).json({ id_pedido, mensaje: "Pedido creado" });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    return res.status(400).json({ error: err.message || "Error al crear pedido" });
  } finally {
    conn.release();
  }
}

// PUT /api/pedidos/:id/estado
async function actualizarEstado(req, res) {
  const { id } = req.params;
  const { estado } = req.body;

  const ESTADOS_VALIDOS = ["pendiente", "en_preparacion", "listo", "entregado", "cancelado"];
  if (!ESTADOS_VALIDOS.includes(estado)) {
    return res.status(400).json({ error: "Estado inválido" });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [[pedido]] = await conn.query(
      "SELECT id_pedido, estado, id_mesa FROM pedidos WHERE id_pedido = ?",
      [id]
    );
    if (!pedido) {
      await conn.rollback();
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    // Validar transiciones de estado permitidas
    const TRANSICIONES = {
      pendiente: ["en_preparacion", "cancelado"],
      en_preparacion: ["listo", "cancelado"],
      listo: ["entregado", "cancelado"],
      entregado: [],
      cancelado: [],
    };

    if (!TRANSICIONES[pedido.estado].includes(estado)) {
      await conn.rollback();
      return res.status(400).json({
        error: `No se puede pasar de "${pedido.estado}" a "${estado}"`,
      });
    }

    if (estado === "en_preparacion") {
      const [items] = await conn.query(
        "SELECT id_plato, cantidad, observacion FROM pedido_detalle WHERE id_pedido = ?",
        [id]
      );
      await validarInventarioParaPedido(conn, items);
      await descontarInventarioPedido(conn, id);
    }

    await conn.query("UPDATE pedidos SET estado = ? WHERE id_pedido = ?", [estado, id]);

    // Liberar mesa si se entrega o cancela
    if (estado === "entregado" || estado === "cancelado") {
      await conn.query("UPDATE mesas SET disponible = 1 WHERE id_mesa = ?", [pedido.id_mesa]);
    }

    await conn.commit();
    return res.json({ mensaje: "Estado actualizado" });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    return res.status(500).json({ error: err.message || "Error al actualizar estado" });
  } finally {
    conn.release();
  }
}

module.exports = { getPedidos, crearPedido, actualizarEstado, getMisPedidos };