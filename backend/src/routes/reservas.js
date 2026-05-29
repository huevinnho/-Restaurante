const router = require("express").Router();
const { getReservas, getMisReservas, getDisponibilidad, crearReserva, cancelarReserva } = require("../controllers/reservasController");
const { verificarToken, soloRoles } = require("../middleware/auth");

router.use(verificarToken);

router.get("/mis-reservas", soloRoles("cliente", "super_admin"), getMisReservas);
router.get("/disponibilidad", soloRoles("cliente", "admin_punto", "admin_general", "super_admin"), getDisponibilidad);
router.get("/", soloRoles("admin_punto", "admin_general", "super_admin"), getReservas);
router.post("/", soloRoles("cliente", "admin_punto", "admin_general", "super_admin"), crearReserva);
router.put("/:id/cancelar", soloRoles("cliente", "admin_punto", "admin_general", "super_admin"), cancelarReserva);

module.exports = router;
