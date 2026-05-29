const db = require('./src/config/db');
(async () => {
    try {
        const [usuarios] = await db.query('SELECT id_usuario, correo, contrasena FROM usuarios LIMIT 5');
        console.log('usuarios', usuarios);
        const [clientes] = await db.query('SELECT id_cliente, id_usuario, correo FROM clientes LIMIT 5');
        console.log('clientes', clientes);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
})();
