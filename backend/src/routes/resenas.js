const router = require("express").Router();
const { getMisResenas, crearResena } = require("../controllers/resenasController");
const { verificarToken, soloRoles } = require("../middleware/auth");

router.use(verificarToken);
router.use(soloRoles("cliente", "super_admin"));

router.get("/mis-resenas", getMisResenas);
router.post("/",           crearResena);

module.exports = router;
