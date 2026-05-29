const db = require('./src/config/db');
(async () => {
    try {
        const correo = 'admin.principal@restaurante.com';
        const [rows] = await db.query(
            `SELECT u.id_usuario, u.id_rol, u.id_sede, u.nombres, u.apellidos, u.correo, u.contrasena, u.activo, r.nombre AS rol, s.nombre AS sede
       FROM usuarios u
       LEFT JOIN roles r ON r.id_rol = u.id_rol
       LEFT JOIN sedes s ON s.id_sede = u.id_sede
       WHERE u.correo = ?`,
            [correo]
        );
        if (rows.length === 0) {
            console.log('NO_USER');
        } else {
            console.log(JSON.stringify(rows[0], null, 2));
        }
    } catch (err) {
        console.error(err);
        process.exit(1);
    } finally {
        process.exit(0);
    }
})();
