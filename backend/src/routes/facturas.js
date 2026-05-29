// routes/facturas.js
const express = require("express");
const router  = express.Router();
const { verificarToken, soloRoles } = require("../middleware/auth");
const { getFacturas, getMisFacturas, crearFactura } = require("../controllers/facturasController");

router.use(verificarToken);

// ⚠️ /mis-facturas debe ir ANTES de / para que Express no lo confunda
router.get("/mis-facturas", getMisFacturas);
router.get("/",             soloRoles("super_admin", "admin_general", "admin_punto"), getFacturas);
router.post("/",            soloRoles("admin_punto", "mesero"), crearFactura);

module.exports = router;
