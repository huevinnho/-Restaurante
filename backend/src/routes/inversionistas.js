const router = require("express").Router();
const {
  getResumen,
  getHistorial,
  getInversionistas,
  asignarSede,
  quitarSede,
} = require("../controllers/inversionistasController");
const { verificarToken, soloRoles } = require("../middleware/auth");

router.use(verificarToken);

// Rutas del inversionista logueado
router.get("/resumen",   soloRoles("inversionista", "super_admin"), getResumen);
router.get("/historial", soloRoles("inversionista", "super_admin"), getHistorial);

// Rutas de administración (solo super_admin)
router.get("/",                              soloRoles("super_admin"), getInversionistas);
router.post("/",                             soloRoles("super_admin"), asignarSede);
router.delete("/:id_usuario/sede/:id_sede",  soloRoles("super_admin"), quitarSede);

module.exports = router;
