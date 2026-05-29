const router = require("express").Router();
const { getMesas, actualizarMesa } = require("../controllers/mesasController");
const { verificarToken, soloRoles } = require("../middleware/auth");

router.use(verificarToken);

router.get("/",      getMesas);
router.put("/:id",   soloRoles("admin_punto","admin_general","super_admin","mesero"), actualizarMesa);

module.exports = router;
