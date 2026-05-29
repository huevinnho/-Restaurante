const router = require("express").Router();
const { getInventario, actualizarProducto } = require("../controllers/inventarioController");
const { verificarToken, soloRoles } = require("../middleware/auth");

router.use(verificarToken);

router.get("/",      soloRoles("cocinero","admin_punto","admin_general","super_admin"), getInventario);
router.put("/:id",   soloRoles("admin_punto","admin_general","super_admin"), actualizarProducto);

module.exports = router;
