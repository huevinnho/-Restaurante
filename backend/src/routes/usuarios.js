// routes/usuarios.js
const express = require("express");
const router  = express.Router();
const { verificarToken, soloRoles } = require("../middleware/auth");
const { getUsuarios, crearUsuario, toggleActivo, cambiarRol } = require("../controllers/usuariosController");

router.use(verificarToken);

router.get("/",              soloRoles("super_admin", "admin_general"), getUsuarios);
router.post("/",             soloRoles("super_admin", "admin_general"), crearUsuario);
router.put("/:id/activo",   soloRoles("super_admin"), toggleActivo);
router.put("/:id/rol",      soloRoles("super_admin"), cambiarRol);

module.exports = router;
