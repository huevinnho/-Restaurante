const db = require("../config/db");

// GET /api/inversionistas/resumen
// Retorna métricas consolidadas del inversionista logueado
async function getResumen(req, res) {
  const id_usuario = req.usuario.id_usuario;

  try {
    // Sedes donde tiene participación + ingresos del mes actual
    const [sedes] = await db.query(
      `SELECT
         s.id_sede,
         s.nombre                          AS sede,
         is2.porcentaje_participacion,
         COALESCE(SUM(f.total), 0)         AS ingresos_mes,
         COALESCE(SUM(f.total), 0)
           * is2.porcentaje_participacion / 100  AS retorno_mes
       FROM inversionistas_sede is2
       JOIN sedes s ON s.id_sede = is2.id_sede
       LEFT JOIN facturas f
         ON  f.id_sede = s.id_sede
         AND MONTH(f.fecha_emision) = MONTH(CURRENT_DATE())
         AND YEAR(f.fecha_emision)  = YEAR(CURRENT_DATE())
       WHERE is2.id_usuario = ?
       GROUP BY s.id_sede, is2.porcentaje_participacion`,
      [id_usuario]
    );

    if (!sedes.length) {
      return res.status(404).json({ error: "Sin sedes asignadas" });
    }

    // Totales consolidados
    const totalIngresos = sedes.reduce((acc, s) => acc + Number(s.ingresos_mes), 0);
    const totalRetorno  = sedes.reduce((acc, s) => acc + Number(s.retorno_mes),  0);

    return res.json({
      sedes,
      totales: {
        ingresos_mes:  totalIngresos,
        retorno_mes:   totalRetorno,
        num_sedes:     sedes.length,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al obtener resumen" });
  }
}

// GET /api/inversionistas/historial?meses=6
// Retorna ingresos y retorno mes a mes para la gráfica
async function getHistorial(req, res) {
  const id_usuario = req.usuario.id_usuario;
  const meses      = Math.min(parseInt(req.query.meses) || 6, 36);

  try {
    const [rows] = await db.query(
      `SELECT
         DATE_FORMAT(f.fecha_emision, '%Y-%m')  AS periodo,
         COALESCE(SUM(f.total), 0)              AS ingresos,
         COALESCE(SUM(f.total * is2.porcentaje_participacion / 100), 0) AS retorno
       FROM inversionistas_sede is2
       JOIN sedes s ON s.id_sede = is2.id_sede
       LEFT JOIN facturas f
         ON  f.id_sede           = s.id_sede
         AND f.fecha_emision    >= DATE_SUB(LAST_DAY(CURRENT_DATE()), INTERVAL ? MONTH)
       WHERE is2.id_usuario = ?
       GROUP BY periodo
       ORDER BY periodo ASC`,
      [meses, id_usuario]
    );

    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al obtener historial" });
  }
}

// GET /api/inversionistas  — solo super_admin: ver todos los inversionistas
async function getInversionistas(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT
         u.id_usuario,
         u.nombres,
         u.apellidos,
         u.correo,
         COUNT(is2.id_sede)              AS num_sedes,
         AVG(is2.porcentaje_participacion) AS participacion_promedio
       FROM usuarios u
       JOIN inversionistas_sede is2 ON is2.id_usuario = u.id_usuario
       GROUP BY u.id_usuario
       ORDER BY u.nombres`
    );
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al obtener inversionistas" });
  }
}

// POST /api/inversionistas  — asignar inversionista a una sede
async function asignarSede(req, res) {
  const { id_usuario, id_sede, porcentaje_participacion } = req.body;

  if (!id_usuario || !id_sede || porcentaje_participacion == null) {
    return res.status(400).json({ error: "Faltan campos requeridos" });
  }
  if (porcentaje_participacion <= 0 || porcentaje_participacion > 100) {
    return res.status(400).json({ error: "Porcentaje debe estar entre 0.01 y 100" });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO inversionistas_sede (id_usuario, id_sede, porcentaje_participacion)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE porcentaje_participacion = VALUES(porcentaje_participacion)`,
      [id_usuario, id_sede, porcentaje_participacion]
    );
    return res.status(201).json({ id_inversionista_sede: result.insertId });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al asignar sede" });
  }
}

// DELETE /api/inversionistas/:id_usuario/sede/:id_sede
async function quitarSede(req, res) {
  const { id_usuario, id_sede } = req.params;
  try {
    await db.query(
      `DELETE FROM inversionistas_sede WHERE id_usuario = ? AND id_sede = ?`,
      [id_usuario, id_sede]
    );
    return res.json({ mensaje: "Sede desvinculada" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al quitar sede" });
  }
}

module.exports = { getResumen, getHistorial, getInversionistas, asignarSede, quitarSede };
