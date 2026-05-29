const jwt = require("jsonwebtoken");

// Verifica que el token JWT sea válido
function verificarToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ error: "Token requerido" });

  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = decoded; // { id_usuario, id_rol, rol, id_sede, nombres }
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
}

// Restringe acceso a ciertos roles
function soloRoles(...roles) {
  return (req, res, next) => {
    if (!req.usuario) return res.status(401).json({ error: "No autenticado" });
    if (!roles.includes(req.usuario.rol)) {
      return res.status(403).json({ error: "Sin permisos para esta acción" });
    }
    next();
  };
}

module.exports = { verificarToken, soloRoles };
