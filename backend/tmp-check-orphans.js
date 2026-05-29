const db = require('./src/config/db');
(async () => {
    try {
        const [clientesOrphan] = await db.query("SELECT id_cliente, id_usuario, correo FROM clientes WHERE id_usuario IS NULL");
        const [usuariosDemo] = await db.query("SELECT id_usuario, correo, id_rol FROM usuarios WHERE correo LIKE '%demo%' OR correo LIKE '%restaurante.com' LIMIT 50");
        console.log('clientesOrphan', clientesOrphan);
        console.log('usuariosDemo', usuariosDemo);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
})();
