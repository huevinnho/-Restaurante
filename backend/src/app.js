require("dotenv").config();
const express = require("express");
const cors    = require("cors");

const app = express();

// ── Middlewares globales ──────────────────────────────────────
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true
}));
app.use(express.json());

// ── Rutas ─────────────────────────────────────────────────────
app.use("/api/auth",       require("./routes/auth"));
app.use("/api/sedes",      require("./routes/sedes"));
app.use("/api/mesas",      require("./routes/mesas"));
app.use("/api/pedidos",    require("./routes/pedidos"));
app.use("/api/menu",       require("./routes/menu"));
app.use("/api/inventario", require("./routes/inventario"));
app.use("/api/facturas",   require("./routes/facturas"));
app.use("/api/reservas",   require("./routes/reservas"));
app.use("/api/usuarios",   require("./routes/usuarios"));
app.use("/api/clientes",   require("./routes/clientes"));
app.use("/api/alergias",   require("./routes/alergias"));
app.use("/api/encuestas",  require("./routes/encuestas"));
app.use("/api/resenas",    require("./routes/resenas"));
app.use("/api/inversionistas", require("./routes/inversionistas"));
app.use("/api/empleados",  require("./routes/empleados"));

// ── Health check ──────────────────────────────────────────────
app.get("/api/health", (req, res) => res.json({ ok: true }));

// ── 404 catch-all ─────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: "Ruta no encontrada" }));

// ── Arranque ──────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
