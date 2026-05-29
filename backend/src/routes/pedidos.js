const router = require("express").Router();
const { getPedidos, crearPedido, actualizarEstado } = require("../controllers/pedidosController");
const { verificarToken, soloRoles } = require("../middleware/auth");

router.use(verificarToken);

router.get("/",              getPedidos);
router.post("/",             soloRoles("mesero","admin_punto","super_admin"), crearPedido);
router.put("/:id/estado",    soloRoles("cliente","cocinero","mesero","admin_punto","super_admin"), actualizarEstado);

module.exports = router;
