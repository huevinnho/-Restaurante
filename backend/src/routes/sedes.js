// routes/sedes.js
const express = require("express");
const router  = express.Router();
const { verificarToken, soloRoles } = require("../middleware/auth");
const {
  getSedes,
  crearSede,
  actualizarSede,
  eliminarSede
} = require("../controllers/sedesController");

router.use(verificarToken);

router.get   ("/",    getSedes);
router.post  ("/",    soloRoles("super_admin"), crearSede);
router.put   ("/:id", soloRoles("super_admin"), actualizarSede);
router.delete("/:id", soloRoles("super_admin"), eliminarSede);

module.exports = router;
