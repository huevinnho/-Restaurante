const db = require("../config/db");

// GET /api/menu  — platos activos del menú activo de la sede
async function getMenu(req, res) {
  const querySede = Number(req.query.id_sede);
  const canFilterSede = ["super_admin", "admin_general"].includes(req.usuario.rol);
  const id_sede = (canFilterSede && !isNaN(querySede) && querySede > 0)
    ? querySede
    : req.usuario.id_sede;

  try {
    let sql = `SELECT pl.id_plato, pl.nombre, pl.descripcion, pl.precio, pl.disponible, pl.imagen_url,
                     m.nombre AS menu_nombre, m.id_menu
              FROM platos pl
              JOIN menus m ON m.id_menu = pl.id_menu
              WHERE m.activo = 1 AND pl.disponible = 1`;
    const params = [];

    if (id_sede) {
      sql += ` AND m.id_sede = ?`;
      params.push(id_sede);
    }

    sql += ` ORDER BY m.nombre, pl.nombre`;
    try {
      const [rows] = await db.query(sql, params);
      return res.json(rows);
    } catch (err) {
      // Fallback when DB schema does not have imagen_url yet
      if (err && err.code === 'ER_BAD_FIELD_ERROR' && err.sql && err.sql.includes('pl.imagen_url')) {
        const fallbackSql = `SELECT pl.id_plato, pl.nombre, pl.descripcion, pl.precio, pl.disponible, NULL AS imagen_url,
                                    m.nombre AS menu_nombre, m.id_menu
                             FROM platos pl
                             JOIN menus m ON m.id_menu = pl.id_menu
                             WHERE m.activo = 1 AND pl.disponible = 1` + (id_sede ? ` AND m.id_sede = ?` : ``) + ` ORDER BY m.nombre, pl.nombre`;
        const [rows2] = await db.query(fallbackSql, params);
        return res.json(rows2);
      }
      throw err;
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al obtener menú" });
  }
}

// POST /api/menu
async function crearMenu(req, res) {
  const { nombre, descripcion, precio, disponible = 1, imagen_url, id_sede: sedeBody } = req.body;
  const canFilterSede = ["super_admin", "admin_general"].includes(req.usuario.rol);
  const id_sede = (canFilterSede && !isNaN(Number(sedeBody)) && Number(sedeBody) > 0)
    ? Number(sedeBody)
    : req.usuario.id_sede;

  if (!nombre || precio === undefined || precio === null) {
    return res.status(400).json({ error: "Nombre y precio son requeridos" });
  }
  if (isNaN(Number(precio)) || Number(precio) < 0) {
    return res.status(400).json({ error: "Precio inválido" });
  }
  if (!id_sede) {
    return res.status(400).json({ error: "No se encontró la sede para el menú" });
  }

  try {
    const [[menuActivo]] = await db.query(
      "SELECT id_menu FROM menus WHERE id_sede = ? AND activo = 1 LIMIT 1",
      [id_sede]
    );
    if (!menuActivo) {
      return res.status(400).json({ error: "No hay un menú activo para la sede seleccionada" });
    }
    // Try insert including imagen_url; if column missing, retry without it
    try {
      const [result] = await db.query(
        "INSERT INTO platos (id_menu, nombre, descripcion, precio, disponible, imagen_url) VALUES (?, ?, ?, ?, ?, ?)",
        [menuActivo.id_menu, nombre, descripcion || null, Number(precio), disponible ? 1 : 0, imagen_url || null]
      );
      const [[plato]] = await db.query("SELECT * FROM platos WHERE id_plato = ?", [result.insertId]);
      return res.status(201).json(plato);
    } catch (insErr) {
      if (insErr && insErr.code === 'ER_BAD_FIELD_ERROR' && insErr.sql && insErr.sql.includes('imagen_url')) {
        const [result] = await db.query(
          "INSERT INTO platos (id_menu, nombre, descripcion, precio, disponible) VALUES (?, ?, ?, ?, ?)",
          [menuActivo.id_menu, nombre, descripcion || null, Number(precio), disponible ? 1 : 0]
        );
        const [[plato]] = await db.query("SELECT * FROM platos WHERE id_plato = ?", [result.insertId]);
        return res.status(201).json(plato);
      }
      throw insErr;
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al crear plato" });
  }
}

// PUT /api/menu/:id
async function actualizarMenu(req, res) {
  const { id } = req.params;
  const { nombre, descripcion, precio, disponible, imagen_url } = req.body;
  const esAdminPunto = req.usuario.rol === "admin_punto";

  if (nombre === undefined && descripcion === undefined && precio === undefined && disponible === undefined && imagen_url === undefined) {
    return res.status(400).json({ error: "No hay datos para actualizar" });
  }
  if (precio !== undefined && (isNaN(Number(precio)) || Number(precio) < 0)) {
    return res.status(400).json({ error: "Precio inválido" });
  }

  try {
    let sql = `SELECT p.id_plato
               FROM platos p
               JOIN menus m ON m.id_menu = p.id_menu
               WHERE p.id_plato = ?`;
    const params = [id];
    if (esAdminPunto) {
      sql += ` AND m.id_sede = ?`;
      params.push(req.usuario.id_sede);
    }

    const [[existing]] = await db.query(sql, params);
    if (!existing) {
      return res.status(404).json({ error: "Plato no encontrado o sin permisos" });
    }

    const updates = [];
    const updateParams = [];
    if (nombre !== undefined) {
      updates.push("nombre = ?");
      updateParams.push(nombre);
    }
    if (descripcion !== undefined) {
      updates.push("descripcion = ?");
      updateParams.push(descripcion || null);
    }
    if (precio !== undefined) {
      updates.push("precio = ?");
      updateParams.push(Number(precio));
    }
    if (disponible !== undefined) {
      updates.push("disponible = ?");
      updateParams.push(disponible ? 1 : 0);
    }
    if (imagen_url !== undefined) {
      updates.push("imagen_url = ?");
      updateParams.push(imagen_url || null);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No hay campos válidos para actualizar" });
    }

    // Try update including imagen_url; if column missing, retry without that field
    try {
      await db.query(`UPDATE platos SET ${updates.join(", ")} WHERE id_plato = ?`, [...updateParams, id]);
    } catch (updErr) {
      if (updErr && updErr.code === 'ER_BAD_FIELD_ERROR' && updErr.sql && updErr.sql.includes('imagen_url')) {
        // remove imagen_url from updates and params
        const filtered = updates.filter(u => !u.includes('imagen_url'));
        const filteredParams = updateParams.slice(0).filter((_, i) => !updates[i].includes('imagen_url'));
        if (filtered.length === 0) {
          return res.status(400).json({ error: "No hay campos válidos para actualizar después del fallback" });
        }
        await db.query(`UPDATE platos SET ${filtered.join(", ")} WHERE id_plato = ?`, [...filteredParams, id]);
      } else {
        throw updErr;
      }
    }

    const [[plato]] = await db.query("SELECT * FROM platos WHERE id_plato = ?", [id]);
    return res.json(plato);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al actualizar plato" });
  }
}

// DELETE /api/menu/:id
async function eliminarMenu(req, res) {
  const { id } = req.params;
  const esAdminPunto = req.usuario.rol === "admin_punto";

  try {
    let sql = `SELECT p.id_plato
               FROM platos p
               JOIN menus m ON m.id_menu = p.id_menu
               WHERE p.id_plato = ?`;
    const params = [id];
    if (esAdminPunto) {
      sql += ` AND m.id_sede = ?`;
      params.push(req.usuario.id_sede);
    }

    const [[existing]] = await db.query(sql, params);
    if (!existing) {
      return res.status(404).json({ error: "Plato no encontrado o sin permisos" });
    }

    await db.query("DELETE FROM platos WHERE id_plato = ?", [id]);
    return res.json({ mensaje: "Plato eliminado" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al eliminar plato" });
  }
}

// GET /api/menu/:id/receta  — receta de un plato (solo cocineros)
async function getReceta(req, res) {
  const { id } = req.params;
  try {
    const [[receta]] = await db.query(
      `SELECT r.id_receta, r.modo_preparacion, r.tiempo_minutos,
              p.nombre AS plato_nombre
       FROM recetas r
       JOIN platos p ON p.id_plato = r.id_plato
       WHERE r.id_plato = ?`,
      [id]
    );
    if (!receta) return res.status(404).json({ error: "Receta no encontrada" });

    const [ingredientes] = await db.query(
      `SELECT ri.id_producto, ri.cantidad_requerida, pi2.nombre AS ingrediente,
              pi2.unidad_medida, pi2.cantidad_actual AS stock_actual
       FROM receta_ingredientes ri
       JOIN productos_inventario pi2 ON pi2.id_producto = ri.id_producto
       WHERE ri.id_receta = ?`,
      [receta.id_receta]
    );

    return res.json({ ...receta, ingredientes });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al obtener receta" });
  }
}

module.exports = { getMenu, getReceta, crearMenu, actualizarMenu, eliminarMenu };
