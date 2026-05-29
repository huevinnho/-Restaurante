const router = require("express").Router();
const { getMenu, getReceta, crearMenu, actualizarMenu, eliminarMenu } = require("../controllers/menuController");
const { verificarToken, soloRoles } = require("../middleware/auth");

router.use(verificarToken);

router.get("/", getMenu);
router.post("/", soloRoles("admin_punto", "admin_general", "super_admin"), crearMenu);
router.put("/:id", soloRoles("admin_punto", "admin_general", "super_admin"), actualizarMenu);
router.delete("/:id", soloRoles("admin_punto", "admin_general", "super_admin"), eliminarMenu);
router.get("/:id/receta", soloRoles("mesero", "cocinero", "admin_punto", "admin_general", "super_admin"), getReceta);

module.exports = router;
