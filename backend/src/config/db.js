const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
  host:               process.env.DB_HOST     || "localhost",
  port:               process.env.DB_PORT     || 3307,
  user:               process.env.DB_USER     || "root",
  password:           process.env.DB_PASSWORD || "",
  database:           process.env.DB_NAME     || "restaurante",
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  timezone:           "local",
});

// Verifica la conexión al iniciar
pool.getConnection()
  .then((conn) => {
    console.log("✅ Conectado a MySQL —", process.env.DB_NAME);
    conn.release();
  })
  .catch((err) => {
    console.error("❌ Error conectando a MySQL:", err.message);
    process.exit(1);
  });

module.exports = pool;
