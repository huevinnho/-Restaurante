const router = require("express").Router();
const { getAlergias, getMisAlergias, actualizarMisAlergias } = require("../controllers/alergiasController");
const { verificarToken, soloRoles } = require("../middleware/auth");

router.get("/", getAlergias); // público — sin token para que el mesero también pueda usarlo

router.use(verificarToken);
router.use(soloRoles("cliente", "super_admin"));

router.get("/mis-alergias",  getMisAlergias);
router.put("/mis-alergias",  actualizarMisAlergias);

module.exports = router;
