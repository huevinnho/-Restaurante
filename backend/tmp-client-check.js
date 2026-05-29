const db = require('./src/config/db');
(async () => {
    try {
        const [usuarios] = await db.query("SELECT id_usuario, correo, contrasena, id_rol FROM usuarios WHERE correo = ?", ['cliente@restaurante.com']);
        const [clientes] = await db.query("SELECT id_cliente, id_usuario, correo FROM clientes WHERE correo = ?", ['cliente@restaurante.com']);
        console.log('usuarios', usuarios);
        console.log('clientes', clientes);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
})();
