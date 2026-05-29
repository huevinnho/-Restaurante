const db = require("../config/db");


// GET /api/reservas/disponibilidad?id_sede=1&fecha=2026-05-20&hora=18:00:00&personas=4
// Devuelve mesas disponibles sin mostrar datos de otros clientes.
async function getDisponibilidad(req, res) {
  const { id_sede, fecha, hora, personas = 1 } = req.query;
  if (!id_sede) return res.status(400).json({ error: "Selecciona una sede" });

  try {
    let params = [id_sede, Number(personas) || 1];
    let sql = `SELECT m.id_mesa, m.id_sede, m.numero, m.capacidad, m.disponible
               FROM mesas m
               WHERE m.id_sede = ? AND m.disponible = 1 AND m.capacidad >= ?`;

    if (fecha && hora) {
      sql += ` AND NOT EXISTS (
                SELECT 1 FROM reservas r
                WHERE r.id_mesa = m.id_mesa
                  AND r.fecha_reserva = ?
                  AND r.estado = 'activa'
                  AND ABS(TIMESTAMPDIFF(MINUTE, r.hora_reserva, TIME(?))) < 120
              )`;
      params.push(fecha, hora);
    }

    sql += " ORDER BY m.capacidad, m.numero";
    const [rows] = await db.query(sql, params);
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al consultar disponibilidad" });
  }
}

// GET /api/reservas
// Admins → ven reservas activas de todas las sedes, incluyendo nombre de sede
async function getReservas(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT r.id_reserva, r.id_sede, s.nombre AS sede_nombre, s.direccion AS sede_direccion,
              r.fecha_reserva, r.hora_reserva, r.cantidad_personas, r.estado, r.creado_en,
              m.numero AS mesa_numero,
              CONCAT(c.nombres, ' ', c.apellidos) AS cliente_nombre,
              c.telefono AS cliente_telefono
       FROM reservas r
       JOIN sedes s ON s.id_sede = r.id_sede
       JOIN mesas m ON m.id_mesa = r.id_mesa
       JOIN clientes c ON c.id_cliente = r.id_cliente
       WHERE r.estado = 'activa'
       ORDER BY s.nombre, r.fecha_reserva, r.hora_reserva`
    );
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al obtener reservas" });
  }
}

// GET /api/reservas/mis-reservas
async function getMisReservas(req, res) {
  const id_usuario = req.usuario.id_usuario;
  try {
    const [[cliente]] = await db.query(
      "SELECT id_cliente FROM clientes WHERE id_usuario = ?",
      [id_usuario]
    );
    if (!cliente) {
      return res.status(404).json({ error: "Perfil de cliente no encontrado" });
    }
    const [rows] = await db.query(
      `SELECT r.id_reserva, r.id_sede, s.nombre AS sede_nombre, s.direccion AS sede_direccion,
              r.fecha_reserva, r.hora_reserva, r.cantidad_personas, r.estado, r.creado_en,
              m.numero AS mesa_numero
       FROM reservas r
       JOIN sedes s ON s.id_sede = r.id_sede
       JOIN mesas m ON m.id_mesa = r.id_mesa
       WHERE r.id_cliente = ?
       ORDER BY r.fecha_reserva DESC, r.hora_reserva DESC`,
      [cliente.id_cliente]
    );
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al obtener tus reservas" });
  }
}

// POST /api/reservas
async function crearReserva(req, res) {
  const { id_mesa, fecha_reserva, hora_reserva, cantidad_personas } = req.body;
  let { id_cliente, id_sede } = req.body;

  if (req.usuario.rol === "cliente") {
    const [[c]] = await db.query(
      "SELECT id_cliente FROM clientes WHERE id_usuario = ?",
      [req.usuario.id_usuario]
    );
    if (!c) return res.status(404).json({ error: "Perfil de cliente no encontrado" });
    id_cliente = c.id_cliente;
  }

  if (!id_cliente || !id_sede || !id_mesa || !fecha_reserva || !hora_reserva || !cantidad_personas) {
    return res.status(400).json({ error: "Sede, mesa, fecha, hora y personas son requeridos" });
  }

  const fechaHoraReserva = new Date(`${fecha_reserva}T${hora_reserva}`);
  const ahora = new Date();
  const diffHoras = (fechaHoraReserva - ahora) / 36e5;

  if (isNaN(fechaHoraReserva.getTime())) {
    return res.status(400).json({ error: "Fecha u hora inválida" });
  }
  if (diffHoras < 1) {
    return res.status(400).json({ error: "La reserva debe hacerse con al menos 1 hora de anticipación" });
  }

  try {
    const [[mesa]] = await db.query(
      "SELECT id_mesa, capacidad, disponible FROM mesas WHERE id_mesa = ? AND id_sede = ?",
      [id_mesa, id_sede]
    );
    if (!mesa) return res.status(400).json({ error: "Mesa no válida para esta sede" });
    if (!mesa.disponible) return res.status(400).json({ error: "Esa mesa no está disponible en esta sede" });
    if (Number(cantidad_personas) > Number(mesa.capacidad)) {
      return res.status(400).json({ error: `La mesa seleccionada solo tiene capacidad para ${mesa.capacidad} personas` });
    }

    const [conflicto] = await db.query(
      `SELECT id_reserva FROM reservas
       WHERE id_mesa = ? AND fecha_reserva = ? AND estado = 'activa'
         AND ABS(TIMESTAMPDIFF(MINUTE, hora_reserva, TIME(?))) < 120`,
      [id_mesa, fecha_reserva, hora_reserva]
    );
    if (conflicto.length > 0) {
      return res.status(400).json({ error: "La mesa ya tiene una reserva en ese horario. Elige otra mesa, otra hora u otra sede" });
    }

    const [result] = await db.query(
      `INSERT INTO reservas (id_sede, id_cliente, id_mesa, fecha_reserva, hora_reserva, cantidad_personas)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id_sede, id_cliente, id_mesa, fecha_reserva, hora_reserva, cantidad_personas]
    );
    return res.status(201).json({ id_reserva: result.insertId });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al crear reserva" });
  }
}

// PUT /api/reservas/:id/cancelar
async function cancelarReserva(req, res) {
  const { id } = req.params;
  try {
    const [[reserva]] = await db.query(
      "SELECT fecha_reserva, hora_reserva, estado, id_cliente FROM reservas WHERE id_reserva = ?",
      [id]
    );
    if (!reserva) return res.status(404).json({ error: "Reserva no encontrada" });
    if (reserva.estado === "cancelada") {
      return res.status(400).json({ error: "La reserva ya fue cancelada" });
    }

    if (req.usuario.rol === "cliente") {
      const [[c]] = await db.query(
        "SELECT id_cliente FROM clientes WHERE id_usuario = ?",
        [req.usuario.id_usuario]
      );
      if (!c || c.id_cliente !== reserva.id_cliente) {
        return res.status(403).json({ error: "No tienes permiso para cancelar esta reserva" });
      }
    }

    const fechaHora = new Date(`${String(reserva.fecha_reserva).slice(0,10)}T${reserva.hora_reserva}`);
    const diffHoras = (fechaHora - new Date()) / 36e5;

    if (diffHoras < 1) {
      return res.status(400).json({ error: "Solo se puede cancelar con más de 1 hora de anticipación" });
    }

    await db.query("UPDATE reservas SET estado = 'cancelada' WHERE id_reserva = ?", [id]);
    return res.json({ mensaje: "Reserva cancelada" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al cancelar reserva" });
  }
}

module.exports = { getReservas, getMisReservas, getDisponibilidad, crearReserva, cancelarReserva };
