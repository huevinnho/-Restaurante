const router = require("express").Router();
const { getPerfilCliente, actualizarPerfilCliente, getClientes } = require("../controllers/clientesController");
const { verificarToken, soloRoles } = require("../middleware/auth");

router.use(verificarToken);

router.get("/", soloRoles("admin_general", "super_admin"), getClientes);
router.get("/perfil",  soloRoles("cliente", "super_admin"), getPerfilCliente);
router.put("/perfil",  soloRoles("cliente", "super_admin"), actualizarPerfilCliente);

module.exports = router;
