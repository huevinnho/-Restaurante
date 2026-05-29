const db = require("../config/db");

// GET /api/mesas?id_sede=1
// Si no se pasa id_sede y el usuario es admin_general/super_admin, devuelve todas las mesas
async function getMesas(req, res) {
  const id_sede = req.query.id_sede || req.usuario.id_sede;
  const rolAdmin = ["admin_general", "super_admin"].includes(req.usuario.rol);

  if (!id_sede && !rolAdmin) {
    return res.status(400).json({ error: "Debes seleccionar una sede" });
  }

  try {
    let rows;
    if (id_sede) {
      [rows] = await db.query(
        "SELECT * FROM mesas WHERE id_sede = ? ORDER BY numero",
        [id_sede]
      );
    } else {
      // Admin sin sede asignada: devuelve todas las mesas con nombre de sede
      [rows] = await db.query(
        `SELECT m.*, s.nombre AS sede_nombre
         FROM mesas m
         JOIN sedes s ON s.id_sede = m.id_sede
         ORDER BY s.nombre, m.numero`
      );
    }
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al obtener mesas" });
  }
}

async function actualizarMesa(req, res) {
  const { id } = req.params;
  const { disponible } = req.body;
  try {
    await db.query(
      "UPDATE mesas SET disponible = ? WHERE id_mesa = ?",
      [disponible, id]
    );
    return res.json({ mensaje: "Mesa actualizada" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al actualizar mesa" });
  }
}

module.exports = { getMesas, actualizarMesa };
