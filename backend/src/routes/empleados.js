const express = require("express");
const { verificarToken, soloRoles } = require("../middleware/auth");
const {
  getEmpleados,
  crearEmpleado,
  actualizarEmpleado,
  getNomina,
  generarNominaDelMes,
  marcarNominaPagada,
  getMemorandos,
  crearMemorando,
  getSeguridad,
  crearControlSeguridad,
  getAsistencia,
  registrarAsistencia,
} = require("../controllers/empleadosController");

const router = express.Router();

// Proteger todas las rutas
router.use(verificarToken);

// ── EMPLEADOS ──────────────────────────────────────────────────────────
router.get("/", soloRoles("admin_punto", "admin_general", "super_admin"), getEmpleados);
router.post("/", soloRoles("admin_general", "super_admin"), crearEmpleado);
router.put("/:id", soloRoles("admin_general", "super_admin"), actualizarEmpleado);

// ── NÓMINA ─────────────────────────────────────────────────────────────
router.get("/nomina/lista", soloRoles("admin_general", "super_admin"), getNomina);
router.post("/nomina/generar", soloRoles("admin_general", "super_admin"), generarNominaDelMes);
router.put("/nomina/:id/pagar", soloRoles("admin_general", "super_admin"), marcarNominaPagada);

// ── MEMORANDOS ──────────────────────────────────────────────────────────
router.get("/memorandos/lista", soloRoles("admin_general", "super_admin"), getMemorandos);
router.post("/memorandos", soloRoles("admin_general", "super_admin"), crearMemorando);

// ── CONTROL SEGURIDAD ──────────────────────────────────────────────────
router.get("/seguridad/lista", soloRoles("admin_general", "super_admin"), getSeguridad);
router.post("/seguridad", soloRoles("admin_general", "super_admin"), crearControlSeguridad);

// ── ASISTENCIA ─────────────────────────────────────────────────────────
router.get("/asistencia/lista", soloRoles("admin_general", "super_admin"), getAsistencia);
router.post("/asistencia", soloRoles("admin_general", "super_admin"), registrarAsistencia);

module.exports = router;
