const db = require("../config/db");
const bcrypt = require("bcryptjs");

// ── EMPLEADOS ──────────────────────────────────────────────────────────

exports.getEmpleados = async (req, res) => {
  try {
    const conn = await db.getConnection();
    let query = `
      SELECT 
        e.id_empleado,
        u.id_usuario,
        u.nombres,
        u.apellidos,
        u.correo as email,
        e.cargo,
        e.salario,
        e.activo,
        e.id_sede,
        s.nombre as sede
      FROM empleados e
      LEFT JOIN usuarios u ON e.id_usuario = u.id_usuario
      LEFT JOIN sedes s ON e.id_sede = s.id_sede
      WHERE 1=1
    `;
    
    const params = [];
    
    // Si no es super_admin, filtra por sede
    if (req.usuario.rol !== "super_admin" && req.usuario.id_sede) {
      query += ` AND e.id_sede = ?`;
      params.push(req.usuario.id_sede);
    }
    
    query += ` ORDER BY u.nombres ASC`;
    
    console.log("Query empleados:", query);
    console.log("Params:", params);
    console.log("Usuario:", req.usuario);

    const [empleados] = await conn.execute(query, params);
    conn.release();

    console.log("Empleados encontrados:", empleados.length);
    res.json(empleados);
  } catch (error) {
    console.error("Error getEmpleados:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.crearEmpleado = async (req, res) => {
  
  try {
    const {
  nombres,
  apellidos,
  email,
  password,
  cargo,
  sede,
  salario,
  fecha_inicio,
  activo
} = req.body;
     
    if (!nombres || !apellidos || !email || !password || !cargo || !sede || !salario) {
      return res.status(400).json({ error: "Faltan datos requeridos" });
    }
    const cargosPermitidos = [
      "mesero",
      "cocinero",
      "admin de punto"
    ];

    const conn = await db.getConnection();
    
    // Verificar email único
    const [usuarioExiste] = await conn.execute(
      "SELECT id_usuario FROM usuarios WHERE correo = ?",
      [email]
    );
    
    if (usuarioExiste.length > 0) {
      conn.release();
      return res.status(409).json({ error: "Email ya existe" });
    }

    // Obtener id_sede
    const id_sede = sede;
    
   

    const contrasena_hash = await bcrypt.hash(password, 12);

    // Crear usuario
    const [resultUser] = await conn.execute(
      `INSERT INTO usuarios (id_rol, id_sede, nombres, apellidos, correo, contrasena, activo)
       VALUES (
         (SELECT id_rol FROM roles WHERE nombre = ?),
         ?,
         ?,
         ?,
         ?,
         ?,
         1
       )`,
      [cargo, id_sede, nombres, apellidos, email, contrasena_hash]
    );

    const id_usuario = resultUser.insertId;

    // Crear empleado
    await conn.execute(
  `INSERT INTO empleados (
    id_usuario,
    id_sede,
    cargo,
    id_tipo_contrato,
    salario,
    fecha_inicio,
    activo
  )
   VALUES (?, ?, ?, ?, ?, ?, ?)`,
  [
    id_usuario,
    id_sede,
    cargo,
    1,
    salario,
    fecha_inicio,
    1
  ]
);

    conn.release();

    res.json({
      mensaje: "Empleado creado exitosamente",
      email,
      aviso: "El empleado debe cambiar la contraseña en el primer login"
    });
    

    if (!cargosPermitidos.includes(cargo)) {
      return res.status(400).json({
        error: "Cargo no válido"
      });
    }
  } catch (error) {
    console.error("Error crearEmpleado:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.actualizarEmpleado = async (req, res) => {

  try {

    const { id } = req.params;

    const {
      nombres,
      apellidos,
      email,
      cargo,
      sede,
      salario,
      activo,
      password
    } = req.body;

    const conn = await db.getConnection();

    // obtener usuario
    const [empleadoRows] = await conn.execute(`
      SELECT id_usuario
      FROM empleados
      WHERE id_empleado = ?
    `, [id]);

    if (empleadoRows.length === 0) {

      conn.release();

      return res.status(404).json({
        error: "Empleado no encontrado"
      });
    }

    const id_usuario =
      empleadoRows[0].id_usuario;

    // actualizar usuario
    if (password && password.trim() !== "") {

      const hash =
        await bcrypt.hash(password, 12);

      await conn.execute(`
        UPDATE usuarios
        SET
          nombres = ?,
          apellidos = ?,
          correo = ?,
          contrasena = ?,
          activo = ?
        WHERE id_usuario = ?
      `, [
        nombres,
        apellidos,
        email,
        hash,
        activo,
        id_usuario
      ]);

    } else {

      await conn.execute(`
        UPDATE usuarios
        SET
          nombres = ?,
          apellidos = ?,
          correo = ?,
          activo = ?
        WHERE id_usuario = ?
      `, [
        nombres,
        apellidos,
        email,
        activo,
        id_usuario
      ]);
    }

    // actualizar empleado
    await conn.execute(`
      UPDATE empleados
      SET
        cargo = ?,
        id_sede = ?,
        salario = ?,
        activo = ?
      WHERE id_empleado = ?
    `, [
      cargo,
      sede,
      salario,
      activo,
      id
    ]);

    conn.release();

    res.json({
      mensaje: "Empleado actualizado"
    });

  } catch (error) {

    console.error(
      "Error actualizarEmpleado:",
      error
    );

    res.status(500).json({
      error: error.message
    });
  }
};

// ── NÓMINA ─────────────────────────────────────────────────────────────

exports.getNomina = async (req, res) => {
  try {

    const conn = await db.getConnection();

    const [rows] = await conn.execute(`
      SELECT
        n.id_nomina,

        n.estado,
        n.fecha_inicio,
        n.fecha_fin,
        n.monto,
        n.fecha_pago,

        e.id_empleado,
        e.cargo,

        CONCAT(
          u.nombres,
          ' ',
          u.apellidos
        ) AS empleado,

        s.nombre AS sede

      FROM nomina n

      JOIN empleados e
        ON n.id_empleado = e.id_empleado

      JOIN usuarios u
        ON e.id_usuario = u.id_usuario

      LEFT JOIN sedes s
        ON e.id_sede = s.id_sede

      ORDER BY n.fecha_inicio DESC
    `);

    conn.release();

    res.json(rows);

  } catch (error) {

    console.error("Error getNomina:", error);

    res.status(500).json({
      error: error.message
    });
  }
};

exports.marcarNominaPagada = async (req, res) => {
  try {

    const { id } = req.params;

    const conn = await db.getConnection();

    await conn.execute(`
      UPDATE nomina
      SET
        estado = 'pagado',
        fecha_pago = NOW()
      WHERE id_nomina = ?
    `, [id]);

    conn.release();

    res.json({
      mensaje: "Nómina pagada"
    });

  } catch (error) {

    console.error("Error marcarNominaPagada:", error);

    res.status(500).json({
      error: error.message
    });
  }
};

exports.generarNominaDelMes = async (req, res) => {
  try {
    const conn = await db.getConnection();

    // Obtener mes y año actual
    const ahora = new Date();
    const mes_actual = String(ahora.getMonth() + 1).padStart(2, '0');
    const año_actual = ahora.getFullYear();
    const fecha_inicio = `${año_actual}-${mes_actual}-01`;
    const fecha_fin = new Date(año_actual, ahora.getMonth() + 1, 0).toISOString().split('T')[0];

    console.log("📋 Generando nóminas para:", { mes: mes_actual, año: año_actual, usuario: req.usuario.rol });

    // Obtener empleados activos
    let queryEmpleados = `
      SELECT 
        e.id_empleado,
        e.salario,
        e.id_sede,
        u.nombres,
        u.apellidos
      FROM empleados e
      JOIN usuarios u ON e.id_usuario = u.id_usuario
      WHERE e.activo = 1
    `;
    
    const paramsEmpleados = [];
    
    // Solo admin_punto se filtra por sede
if (req.usuario.rol === "admin_punto") {
  queryEmpleados += ` AND e.id_sede = ?`;
  paramsEmpleados.push(req.usuario.id_sede);
}

    const [empleados] = await conn.execute(queryEmpleados, paramsEmpleados);
    console.log("👥 Empleados encontrados:", empleados.length);

    if (empleados.length === 0) {
      conn.release();
      console.warn("⚠️ No hay empleados activos para generar nómina");
      return res.status(400).json({ error: "No hay empleados activos para generar nómina" });
    }

    // Generar nóminas para cada empleado
let nominasCreadas = 0;
let nominasOmitidas = 0;

for (const empleado of empleados) {

  // Verificar si ya existe nómina del empleado este mes
  const [existe] = await conn.execute(`
    SELECT COUNT(*) as cantidad
    FROM nomina
    WHERE id_empleado = ?
    AND YEAR(fecha_inicio) = ?
    AND MONTH(fecha_inicio) = ?
  `, [
    empleado.id_empleado,
    año_actual,
    parseInt(mes_actual)
  ]);

  // Si ya existe, omitir
  if (existe[0].cantidad > 0) {
    console.warn(`⚠️ Nómina ya existe para ${empleado.nombres}`);
    nominasOmitidas++;
    continue;
  }

  try {
    
    await conn.execute(`
      INSERT INTO nomina (
        id_empleado,
        fecha_inicio,
        fecha_fin,
        monto,
        estado
      )
      VALUES (?, ?, ?, ?, 'pendiente')
    `, [
      empleado.id_empleado,
      fecha_inicio,
      fecha_fin,
      empleado.salario
    ]);

    nominasCreadas++;

    console.log(
      `✓ Nómina creada para empleado ${empleado.id_empleado}`
    );

    

  } catch (err) {

    console.error("ERROR SQL COMPLETO:");
    console.error(err);
    console.error(
      `✗ Error creando nómina para ${empleado.nombres}:`,
      err.message
    );

    throw err;
  }
  
}
  } catch (error) {
    console.error("❌ Error generarNominaDelMes:", error.message);
    console.error(error);

res.status(500).json({
  error: error.message,
  sqlMessage: error.sqlMessage,
  code: error.code
});
  }
};

// ── MEMORANDOS ──────────────────────────────────────────────────────────

exports.getMemorandos = async (req, res) => {
  try {

    const conn = await db.getConnection();

    const [rows] = await conn.execute(`
      SELECT
        m.id_memorando,

        m.razon AS asunto,
        m.descripcion AS contenido,
        m.fecha AS fecha_creacion,

        CONCAT(
          u.nombres,
          ' ',
          u.apellidos
        ) AS destinatario,

        'general' AS tipo

      FROM memorandos m

      JOIN empleados e
        ON m.id_empleado = e.id_empleado

      JOIN usuarios u
        ON e.id_usuario = u.id_usuario

      ORDER BY m.fecha DESC
    `);

    conn.release();

    res.json(rows);

  } catch (error) {

    console.error("Error getMemorandos:", error);

    res.status(500).json({
      error: error.message
    });
  }
};

exports.crearMemorando = async (req, res) => {
  try {
    const { asunto, contenido, id_empleado } = req.body;

    if (!asunto || !contenido || !id_empleado) {
      return res.status(400).json({ error: "Faltan datos requeridos" });
    }

    const conn = await db.getConnection();

    await conn.execute(
      `INSERT INTO memorandos (id_empleado, fecha, razon, descripcion)
       VALUES (?, NOW(), ?, ?)`,
      [id_empleado, asunto, contenido]
    );

    conn.release();

    res.json({ mensaje: "Memorando creado exitosamente" });
  } catch (error) {
    console.error("Error crearMemorando:", error);
    res.status(500).json({ error: error.message });
  }
};

// ── CONTROL SEGURIDAD ──────────────────────────────────────────────────

exports.getSeguridad = async (req, res) => {
  try {
    const conn = await db.getConnection();

    let query = `
      SELECT 
        r.id_revision,
        t.nombre as tipo,
        r.descripcion,
        r.fecha_revision,
        r.fecha_vencimiento,
        r.fecha_proxima_accion,
        r.observacion,
        s.nombre as sede
      FROM revisiones r
      JOIN sedes s ON r.id_sede = s.id_sede
      JOIN tipos_revision t ON r.id_tipo = t.id_tipo
      WHERE 1=1
    `;

    const params = [];

    // Solo restringir por sede si NO es super_admin ni admin_general
    if (req.usuario.rol !== "super_admin" && req.usuario.rol !== "admin_general") {
      query += ` AND r.id_sede = ?`;
      params.push(req.usuario.id_sede);
    }

    query += ` ORDER BY r.fecha_vencimiento ASC`;

    const [seguridad] = await conn.execute(query, params);
    conn.release();

    res.json(seguridad);
  } catch (error) {
    console.error("Error getSeguridad:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.crearControlSeguridad = async (req, res) => {
  try {
    const { id_tipo, descripcion, fecha_revision, fecha_vencimiento, fecha_proxima_accion, observacion, id_sede } = req.body;

    if (!id_tipo || !fecha_revision) {
      return res.status(400).json({ error: "Faltan datos requeridos" });
    }

    const conn = await db.getConnection();
    const sede_id = id_sede || req.usuario.id_sede;

    await conn.execute(
      `INSERT INTO revisiones (id_sede, id_tipo, descripcion, fecha_revision, fecha_vencimiento, fecha_proxima_accion, observacion)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [sede_id, id_tipo, descripcion || null, fecha_revision, fecha_vencimiento || null, fecha_proxima_accion || null, observacion || null]
    );

    conn.release();

    res.json({ mensaje: "Revisión registrada exitosamente" });
  } catch (error) {
    console.error("Error crearControlSeguridad:", error);
    res.status(500).json({ error: error.message });
  }
};

// ── ASISTENCIA ─────────────────────────────────────────────────────────

exports.getAsistencia = async (req, res) => {
  try {
    const { fecha, id_sede } = req.query;
    const conn = await db.getConnection();

    let query = `
      SELECT 
        a.id_asistencia,
        e.id_empleado,
        u.nombres as empleado_nombre,
        s.id_sede,
        s.nombre as sede,
        DATE_FORMAT(a.fecha, '%Y-%m-%d') as fecha,
        a.hora_entrada,
        a.hora_salida,
        a.estado
      FROM asistencia a
      JOIN empleados e ON a.id_empleado = e.id_empleado
      JOIN usuarios u ON e.id_usuario = u.id_usuario
      JOIN sedes s ON a.id_sede = s.id_sede
      WHERE 1=1
    `;

    const params = [];

    if (fecha) {
      query += ` AND DATE(a.fecha) = ?`;
      params.push(fecha);
    }

    // Solo filtrar por sede si se manda explícitamente desde el frontend
    if (id_sede) {
      query += ` AND a.id_sede = ?`;
      params.push(id_sede);
    } else if (req.usuario.rol !== "super_admin" && req.usuario.rol !== "admin_general") {
      // Roles de sede específica (mesero, cocinero, etc.) solo ven su sede
      query += ` AND a.id_sede = ?`;
      params.push(req.usuario.id_sede);
    }
    // super_admin y admin_general sin id_sede → ven todo

    query += ` ORDER BY a.hora_entrada ASC`;

    const [asistencia] = await conn.execute(query, params);
    conn.release();

    res.json(asistencia);
  } catch (error) {
    console.error("Error getAsistencia:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.registrarAsistencia = async (req, res) => {
  try {
    const { id_empleado, fecha, hora_entrada, hora_salida, estado, id_sede } = req.body;

    if (!id_empleado || !fecha || !estado) {
      return res.status(400).json({ error: "Faltan datos requeridos" });
    }

    const sede_id = id_sede || req.usuario.id_sede;
    if (!sede_id) {
      return res.status(400).json({ error: "No se pudo determinar la sede" });
    }

    const conn = await db.getConnection();

    // Verificar si ya existe registro para ese empleado y fecha
    const [existe] = await conn.execute(
      `SELECT id_asistencia FROM asistencia WHERE id_empleado = ? AND fecha = ?`,
      [id_empleado, fecha]
    );

    if (existe.length > 0) {
  conn.release();
  // Devolver 200 en vez de 409 — ya existe, no es un error real
  return res.json({ mensaje: "Ya registrado" });
}

    await conn.execute(
      `INSERT INTO asistencia (id_empleado, id_sede, fecha, hora_entrada, hora_salida, estado)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id_empleado, sede_id, fecha, hora_entrada || null, hora_salida || null, estado]
    );

    conn.release();
    res.json({ mensaje: "Asistencia registrada" });
  } catch (error) {
    console.error("Error registrarAsistencia:", error);
    res.status(500).json({ error: error.message });
  }
};
