const db = require("../config/db");

// ─── GET /api/superadmin/dashboard ───────────────────────────────────────────
// Estadísticas globales para las cards del Dashboard.
// Retorna: totalSedes, sedesActivas, totalUsuarios, usuariosActivos, totalIngresos
async function getDashboard(req, res) {
  try {
    const [[sedes]] = await db.query(
      `SELECT COUNT(*) AS totalSedes,
              SUM(activa = 1) AS sedesActivas
       FROM sedes`
    );

    const [[usuarios]] = await db.query(
      `SELECT COUNT(*) AS totalUsuarios,
              SUM(activo = 1) AS usuariosActivos
       FROM usuarios`
    );

    const [[finanzas]] = await db.query(
      `SELECT COALESCE(SUM(total), 0) AS totalIngresos
       FROM facturas`
    );

    return res.json({
      totalSedes:      sedes.totalSedes      || 0,
      sedesActivas:    sedes.sedesActivas    || 0,
      totalUsuarios:   usuarios.totalUsuarios  || 0,
      usuariosActivos: usuarios.usuariosActivos || 0,
      totalIngresos:   Number(finanzas.totalIngresos) || 0,
    });
  } catch (err) {
    console.error("Error en getDashboard:", err);
    return res.status(500).json({ error: "Error al obtener estadísticas del dashboard" });
  }
}

// ─── GET /api/superadmin/reportes ────────────────────────────────────────────
// Métricas consolidadas para el tab de Reportes.
// Retorna: totalVentas, clientesActivos, pedidosDia, empleadosActivos
async function getReportes(req, res) {
  try {
    const hoy = new Date().toISOString().split("T")[0];

    const [[ventas]] = await db.query(
      `SELECT COALESCE(SUM(total), 0) AS totalVentas
       FROM facturas`
    );

    const [[clientes]] = await db.query(
      `SELECT COUNT(*) AS clientesActivos
       FROM clientes
       WHERE id_usuario IS NOT NULL`
    );

    const [[pedidos]] = await db.query(
      `SELECT COUNT(*) AS pedidosDia
       FROM pedidos
       WHERE DATE(creado_en) = ?`,
      [hoy]
    );

    // Empleados activos: roles operativos (cocinero, mesero, admin de punto, admin_general)
    const [[empleados]] = await db.query(
      `SELECT COUNT(*) AS empleadosActivos
       FROM usuarios u
       JOIN roles r ON r.id_rol = u.id_rol
       WHERE u.activo = 1
         AND r.nombre IN ('cocinero','mesero','admin_punto','admin_general')`
    );

    return res.json({
      totalVentas:      Number(ventas.totalVentas)       || 0,
      clientesActivos:  clientes.clientesActivos          || 0,
      pedidosDia:       pedidos.pedidosDia                || 0,
      empleadosActivos: empleados.empleadosActivos        || 0,
    });
  } catch (err) {
    console.error("Error en getReportes:", err);
    return res.status(500).json({ error: "Error al obtener reportes" });
  }
}

// ─── GET /api/superadmin/finanzas ─────────────────────────────────────────────
// Resumen financiero global con desglose por sede.
// Query params opcionales: ?desde=YYYY-MM-DD&hasta=YYYY-MM-DD | ?mes=M&año=YYYY
async function getFinanzas(req, res) {
  const { desde, hasta, mes, año } = req.query;

  try {
    let condFecha = "";
    let valores = [];

    if (desde && hasta) {
      condFecha = "AND DATE(f.fecha_emision) BETWEEN ? AND ?";
      valores.push(desde, hasta);
    } else if (mes && año) {
      condFecha = "AND MONTH(f.fecha_emision) = ? AND YEAR(f.fecha_emision) = ?";
      valores.push(Number(mes), Number(año));
    }

    // Totales globales
    const [[totales]] = await db.query(
      `SELECT COALESCE(SUM(f.total), 0)     AS totalIngresos,
              COALESCE(SUM(f.iva_valor), 0)  AS totalIVA,
              COALESCE(SUM(f.propina), 0)    AS totalPropinas,
              COUNT(f.id_factura)            AS totalTransacciones
       FROM facturas f
       LEFT JOIN pedidos p ON p.id_pedido = f.id_pedido
       WHERE 1=1 ${condFecha}`,
      valores
    );

    // Desglose por sede
    const [porSede] = await db.query(
      `SELECT s.nombre AS sede,
              COALESCE(SUM(f.total), 0)    AS ingresos,
              COALESCE(SUM(f.iva_valor), 0) AS iva,
              COUNT(f.id_factura)           AS transacciones
       FROM facturas f
       JOIN pedidos p ON p.id_pedido = f.id_pedido
       JOIN sedes s   ON s.id_sede   = p.id_sede
       WHERE 1=1 ${condFecha}
       GROUP BY s.id_sede, s.nombre
       ORDER BY ingresos DESC`,
      valores
    );

    return res.json({
      totales: {
        totalIngresos:      Number(totales.totalIngresos)      || 0,
        totalIVA:           Number(totales.totalIVA)           || 0,
        totalPropinas:      Number(totales.totalPropinas)      || 0,
        totalTransacciones: totales.totalTransacciones         || 0,
      },
      porSede: porSede || [],
    });
  } catch (err) {
    console.error("Error en getFinanzas:", err);
    return res.status(500).json({ error: "Error al obtener finanzas" });
  }
}

module.exports = { getDashboard, getReportes, getFinanzas };
