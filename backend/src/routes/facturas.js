const express = require("express");
const router  = express.Router();
const { verificarToken, soloRoles } = require("../middleware/auth");
const { getFacturas, getMisFacturas, crearFactura, pagarPedido, getMisFacturasCliente } = require("../controllers/facturasController");

router.use(verificarToken);
router.get("/mis-facturas-cliente", soloRoles("cliente"), getMisFacturasCliente);
router.get("/mis-facturas", getMisFacturas);
router.post("/pagar",       soloRoles("cliente"), pagarPedido);
router.get("/",             soloRoles("super_admin", "admin_general", "admin_punto"), getFacturas);
router.post("/",            soloRoles("admin_punto", "mesero"), crearFactura);

module.exports = router;