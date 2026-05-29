const router = require("express").Router();
const { getMisPedidosEntregados, getMisEncuestas, crearEncuesta } = require("../controllers/encuestasController");
const { verificarToken, soloRoles } = require("../middleware/auth");

router.use(verificarToken);
router.use(soloRoles("cliente", "super_admin"));

router.get("/pedidos-disponibles", getMisPedidosEntregados);
router.get("/mis-encuestas",       getMisEncuestas);
router.post("/",                   crearEncuesta);

module.exports = router;
