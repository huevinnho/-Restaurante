const router = require("express").Router();
const { login, perfil, registrarCliente, cambiarMiSede } = require("../controllers/authController");
const { verificarToken, soloRoles } = require("../middleware/auth");

router.post("/login", login);
router.post("/register", registrarCliente);
router.get("/me", verificarToken, perfil);
router.put("/mi-sede", verificarToken, soloRoles("mesero", "cocinero", "super_admin"), cambiarMiSede);

module.exports = router;
