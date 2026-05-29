import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import MiniCalendar from "../components/shared/MiniCalendarComponent";
import RHpage from "./RHpage";
import AdminPage from "./AdminPage";

// ── Estilos ────────────────────────────────────────────────────────
const C = {
  bg: "#0f0e0c", surface: "#1a1916", card: "#232220",
  border: "#2e2c29", accent: "#e8a43a", muted: "#6b6a66",
  text: "#f0ede6", danger: "#e05c4b", success: "#4caf7d", info: "#4a9edd",
  warning: "#f59e0b", purple: "#a78bfa",
};

// ── Primitivos ────────────────────────────────────────────────────────
const Card = ({ children, style = {}, onClick }) => (
  <div onClick={onClick} style={{
    background: C.card, border: `1px solid ${C.border}`,
    borderRadius: 12, padding: 18, ...style,
    cursor: onClick ? "pointer" : "default",
  }}>{children}</div>
);

const Badge = ({ color, children }) => (
  <span style={{
    background: color + "22", color, border: `1px solid ${color}44`,
    borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap",
  }}>{children}</span>
);

const Btn = ({ children, onClick, variant = "primary", style = {}, disabled, size = "md" }) => {
  const sizes = { sm: "6px 12px", md: "9px 18px", lg: "12px 24px" };
  const v = {
    primary: { background: C.accent, color: "#0f0e0c" },
    ghost: { background: "transparent", color: C.muted, border: `1px solid ${C.border}` },
    danger: { background: C.danger + "22", color: C.danger, border: `1px solid ${C.danger}44` },
    success: { background: C.success + "22", color: C.success, border: `1px solid ${C.success}44` },
    info: { background: C.info + "22", color: C.info, border: `1px solid ${C.info}44` },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: sizes[size], borderRadius: 8, fontSize: size === "sm" ? 11 : 13, fontWeight: 500,
      display: "inline-flex", alignItems: "center", gap: 6,
      transition: "opacity .15s", opacity: disabled ? .5 : 1,
      cursor: disabled ? "not-allowed" : "pointer",
      ...v[variant], ...style,
    }}>{children}</button>
  );
};

const Input = ({ placeholder, value, onChange, type = "text", style = {} }) => (
  <input type={type} placeholder={placeholder} value={value} onChange={onChange}
    style={{
      background: C.surface, color: C.text, border: `1px solid ${C.border}`,
      borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none",
      ...style,
    }}
  />
);

const Spinner = ({ size = 14 }) => (
  <span style={{
    display: "inline-block", width: size, height: size,
    border: "2px solid currentColor", borderTopColor: "transparent",
    borderRadius: "50%", animation: "spin .7s linear infinite",
  }} />
);

// ── TOPBAR ────────────────────────────────────────────────────────────
const TABS = [
  { id: "sedes", icon: "🏢", label: "Sedes" },
  { id: "finanzas", icon: "💰", label: "Finanzas Global" },
  { id: "usuarios", icon: "👥", label: "Usuarios" },
  { id: "admin_punto", icon: "🏪", label: "Admin Punto" },
  { id: "rh", icon: "👥", label: "RRHH" },
];

function Topbar({ user, logout, tab, setTab }) {
  return (
    <div style={{ position: "sticky", top: 0, zIndex: 100 }}>
      <div style={{
        background: C.surface, borderBottom: `1px solid ${C.border}`,
        padding: "0 24px", display: "flex", alignItems: "center",
        justifyContent: "space-between", height: 54,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 20 }}>🍽</span>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, color: C.accent }}>Restaurante</span>
          <span style={{ color: C.border }}>|</span>
          <span style={{ fontSize: 12, color: C.muted }}>Global</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Badge color={C.purple}>🔐 Super Admin</Badge>
          <span style={{ fontSize: 13, color: C.muted }}>{user.nombres}</span>
          <Btn variant="ghost" onClick={logout} style={{ padding: "5px 12px", fontSize: 11 }}>Salir</Btn>
        </div>
      </div>
      <div style={{
        background: C.surface, borderBottom: `1px solid ${C.border}`,
        padding: "0 24px", display: "flex", gap: 2, overflowX: "auto",
      }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background: "transparent",
            color: tab === t.id ? C.accent : C.muted,
            borderBottom: `2px solid ${tab === t.id ? C.accent : "transparent"}`,
            padding: "13px 16px", fontSize: 13, fontWeight: 500,
            transition: "all .15s", whiteSpace: "nowrap",
          }}>{t.icon} {t.label}</button>
        ))}
      </div>
    </div>
  );
}

// ── DASHBOARD ──────────────────────────────────────────────────────────
function TabDashboard({ user }) {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [sedesRes, usuariosRes, facturasRes] = await Promise.all([
          api.getSedes(),
          api.getUsuarios(),
          api.getFacturas(),
        ]);
        const sedes = Array.isArray(sedesRes) ? sedesRes : sedesRes.data || [];
        const usuarios = Array.isArray(usuariosRes) ? usuariosRes : usuariosRes.data || [];
        const facturas = Array.isArray(facturasRes) ? facturasRes : facturasRes.data || [];
        
        const totalIngresos = facturas.reduce((s, f) => s + (parseFloat(f.total) || 0), 0);
        
        setStats({
          totalSedes: sedes.length,
          totalUsuarios: usuarios.length,
          usuariosActivos: usuarios.filter(u => u.activo).length,
          totalIngresos: totalIngresos,
          sedesActivas: sedes.filter(s => s.activa).length,
        });
      } catch (err) {
        console.error("Error cargando stats dashboard:", err);
        setStats({
          totalSedes: 0,
          totalUsuarios: 0,
          usuariosActivos: 0,
          totalIngresos: 0,
          sedesActivas: 0,
        });
      }
      setLoading(false);
    })();
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ color: C.accent, marginBottom: 8 }}>Dashboard Global</h1>
        <p style={{ color: C.muted, fontSize: 13 }}>Resumen de todas las operaciones</p>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px 0" }}><Spinner /></div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 18, marginBottom: 32 }}>
          <Card>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🏢</div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 4 }}>Sedes Totales</div>
            <div style={{ fontSize: 24, fontWeight: 600, color: C.accent }}>{stats.totalSedes}</div>
            <div style={{ fontSize: 11, color: C.success, marginTop: 6 }}>✓ {stats.sedesActivas} activas</div>
          </Card>

          <Card>
            <div style={{ fontSize: 28, marginBottom: 8 }}>👥</div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 4 }}>Usuarios Totales</div>
            <div style={{ fontSize: 24, fontWeight: 600, color: C.accent }}>{stats.totalUsuarios}</div>
            <div style={{ fontSize: 11, color: C.success, marginTop: 6 }}>✓ {stats.usuariosActivos} activos</div>
          </Card>

          <Card>
            <div style={{ fontSize: 28, marginBottom: 8 }}>💰</div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 4 }}>Ingresos Totales</div>
            <div style={{ fontSize: 24, fontWeight: 600, color: C.success }}>
              ${stats.totalIngresos ? stats.totalIngresos.toLocaleString('es-CO', { maximumFractionDigits: 0 }) : 0}
            </div>
            <div style={{ fontSize: 11, color: C.info, marginTop: 6 }}>Todas las sedes</div>
          </Card>
        </div>
      )}

      <Card style={{ marginTop: 24 }}>
        <h3 style={{ color: C.accent, marginBottom: 16 }}>Acceso Rápido</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
          <Btn onClick={() => window.location.hash = "?tab=sedes"} variant="info">
            📍 Gestionar Sedes
          </Btn>
          <Btn onClick={() => window.location.hash = "?tab=finanzas"} variant="success">
            💳 Ver Finanzas
          </Btn>
          <Btn onClick={() => window.location.hash = "?tab=usuarios"} variant="info">
            👤 Gestionar Usuarios
          </Btn>
          <Btn onClick={() => window.location.hash = "?tab=reportes"} variant="success">
            📊 Ver Reportes
          </Btn>
        </div>
      </Card>
    </div>
  );
}

// ── SEDES ──────────────────────────────────────────────────────────────
function TabSedes() {
  const [sedes, setSedes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nombre: "", ciudad: "", director: "", contacto: "" });

  useEffect(() => {
    cargarSedes();
  }, []);

  const cargarSedes = async () => {
    try {
      const res = await api.getSedes();
      setSedes(Array.isArray(res) ? res : res.data || []);
      console.log("Sedes cargadas:", res);
    } catch (err) {
      console.error("Error cargando sedes:", err);
      setSedes([]);
    }
    setLoading(false);
  };

  const crearSede = async () => {
    if (!form.nombre.trim()) return alert("Ingresa el nombre de la sede");
    try {
      await api.crearSede(form);
      alert("✓ Sede creada");
      setForm({ nombre: "", ciudad: "", director: "",pais: "", contacto: "" });
      setShowForm(false);
      cargarSedes();
    } catch (err) {
      alert("Error: " + (err.message || "Error desconocido"));
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ color: C.accent }}>Gestión de Sedes</h2>
        <Btn onClick={() => setShowForm(!showForm)} variant="primary">
          + Nueva Sede
        </Btn>
      </div>

      {showForm && (
        <Card style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 16, color: C.accent }}>Nueva Sede</h3>
          <div style={{ display: "grid", gap: 12 }}>
            <Input placeholder="Nombre de la sede" value={form.nombre} 
              onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            <Input placeholder="país" value={form.pais}
              onChange={(e) => setForm({ ...form, pais: e.target.value })} />
            <Input placeholder="Ciudad" value={form.ciudad}
              onChange={(e) => setForm({ ...form, ciudad: e.target.value })} />
            <Input placeholder="Dirrecion" value={form.director}
              onChange={(e) => setForm({ ...form, director: e.target.value })} />
            <Input placeholder="Contacto (teléfono/email)" value={form.contacto}
              onChange={(e) => setForm({ ...form, contacto: e.target.value })} />
            <div style={{ display: "flex", gap: 12 }}>
              <Btn onClick={crearSede} variant="success">Crear</Btn>
              <Btn onClick={() => setShowForm(false)} variant="ghost">Cancelar</Btn>
            </div>
          </div>
        </Card>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px 0" }}><Spinner /></div>
      ) : sedes.length === 0 ? (
        <Card style={{ textAlign: "center", color: C.muted }}>No hay sedes registradas</Card>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {sedes.map((sede) => (
            <Card key={sede.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{sede.nombre}</div>
                <div style={{ fontSize: 13, color: C.muted }}>
                  📍 {sede.ciudad || "N/A"} | Director: {sede.director || "N/A"}
                </div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
                  {sede.contacto || "Sin contacto"}
                </div>
              </div>
              <Badge color={sede.activa ? C.success : C.danger}>
                {sede.activa ? "✓ Activa" : "✗ Inactiva"}
              </Badge>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ── FINANZAS GLOBALES ──────────────────────────────────────────────────
function TabFinanzas() {
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fechaFiltro, setFechaFiltro] = useState(
  new Date().toISOString().split("T")[0]
);

  useEffect(() => {
    cargarFinanzas();
  }, [fechaFiltro]);

  const cargarFinanzas = async () => {
    try {
      const fecha = new Date(fechaFiltro);

      const mes = fecha.getMonth() + 1;
      const año = fecha.getFullYear();

      const res = await api.getFacturas({
        params: { mes, año }
      });
      let datos = Array.isArray(res) ? res : res.data || [];
      // Filtrar por mes/año si es necesario
      setFacturas(datos);
      console.log("Facturas cargadas:", datos);
    } catch (err) {
      console.error("Error cargando facturas:", err);
      setFacturas([]);
    }
    setLoading(false);
  };

  const totalIngresos = facturas.reduce((s, f) => s + (parseFloat(f.total) || 0), 0);
  const totalIVA = facturas.reduce(
  (s, f) => s + (parseFloat(f.iva_valor) || 0),
  0
);
  const totalPropinas = facturas.reduce((s, f) => s + (parseFloat(f.propina) || 0), 0);

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ color: C.accent, marginBottom: 16 }}>Finanzas Globales</h2>
        <div style={{ marginBottom: 18 }}>
          <MiniCalendar
            value={fechaFiltro}
            onChange={setFechaFiltro}
            width={280}
          />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 18, marginBottom: 24 }}>
        <Card>
          <div style={{ fontSize: 28, marginBottom: 8 }}>💵</div>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 4 }}>Ingresos Totales</div>
          <div style={{ fontSize: 24, fontWeight: 600, color: C.success }}>
            ${totalIngresos.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
          </div>
        </Card>

        <Card>
          <div style={{ fontSize: 28, marginBottom: 8 }}>📊</div>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 4 }}>IVA Recaudado</div>
          <div style={{ fontSize: 24, fontWeight: 600, color: C.info }}>
            ${totalIVA.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
          </div>
        </Card>

        <Card>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🙏</div>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 4 }}>Propinas</div>
          <div style={{ fontSize: 24, fontWeight: 600, color: C.accent }}>
            ${totalPropinas.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
          </div>
        </Card>

        <Card>
          <div style={{ fontSize: 28, marginBottom: 8 }}>📈</div>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 4 }}>Transacciones</div>
          <div style={{ fontSize: 24, fontWeight: 600, color: C.accent }}>
            {facturas.length}
          </div>
        </Card>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px 0" }}><Spinner /></div>
      ) : facturas.length === 0 ? (
        <Card style={{ textAlign: "center", color: C.muted }}>Sin facturas en este período</Card>
      ) : (
        <Card>
          <h3 style={{ marginBottom: 16, color: C.accent }}>Detalle de Facturas</h3>
          <div style={{ maxHeight: 400, overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  <th style={{ textAlign: "left", padding: "8px 0", color: C.muted, fontSize: 12 }}>ID</th>
                  <th style={{ textAlign: "left", padding: "8px 0", color: C.muted, fontSize: 12 }}>Fecha</th>
                  <th style={{ textAlign: "left", padding: "8px 0", color: C.muted, fontSize: 12 }}>Total</th>
                  <th style={{ textAlign: "left", padding: "8px 0", color: C.muted, fontSize: 12 }}>IVA</th>
                </tr>
              </thead>
              <tbody>
                {facturas.map((f) => (
                  <tr key={f.id_factura} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: "10px 0", fontSize: 13 }}>#{f.id_factura}</td>
                    <td style={{ padding: "10px 0", fontSize: 13, color: C.muted }}>
                      {new Date(f.fecha).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "10px 0", fontSize: 13, fontWeight: 500 }}>
                      ${parseFloat(f.total).toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                    </td>
                    <td style={{ padding: "10px 0", fontSize: 13, color: C.info }}>
                      ${parseFloat(f.iva || 0).toLocaleString('es-CO', { maximumFractionDigits: 0 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

// ── USUARIOS ───────────────────────────────────────────────────────────
function TabUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroRol, setFiltroRol] = useState("todos");

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      const res = await api.getUsuarios();
      setUsuarios(Array.isArray(res) ? res : res.data || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const usuariosFiltrados = filtroRol === "todos" 
    ? usuarios 
    : usuarios.filter(u => u.rol === filtroRol);

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ color: C.accent, marginBottom: 16 }}>Gestión de Usuarios</h2>
        <div style={{ display: "flex", gap: 12 }}>
          <Btn onClick={() => setFiltroRol("todos")} 
            variant={filtroRol === "todos" ? "primary" : "ghost"}>
            Todos ({usuarios.length})
          </Btn>
          <Btn onClick={() => setFiltroRol("super_admin")} 
            variant={filtroRol === "super_admin" ? "primary" : "ghost"}>
            Super Admin
          </Btn>
          <Btn onClick={() => setFiltroRol("admin_general")} 
            variant={filtroRol === "admin_general" ? "primary" : "ghost"}>
            Admin General
          </Btn>
          <Btn onClick={() => setFiltroRol("admin_punto")} 
            variant={filtroRol === "admin_punto" ? "primary" : "ghost"}>
            Admin Punto
          </Btn>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px 0" }}><Spinner /></div>
      ) : usuariosFiltrados.length === 0 ? (
        <Card style={{ textAlign: "center", color: C.muted }}>No hay usuarios con ese rol</Card>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {usuariosFiltrados.map((u) => (
            <Card key={u.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{u.nombres} {u.apellidos}</div>
                <div style={{ fontSize: 12, color: C.muted }}>
                  📧 {u.correo}
                </div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
                  Rol: <Badge color={C.accent}>{u.rol}</Badge>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <Badge color={u.activo ? C.success : C.danger}>
                  {u.activo ? "✓ Activo" : "✗ Inactivo"}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ── REPORTES ───────────────────────────────────────────────────────────
function TabReportes() {
  const [reportes, setReportes] = useState({
    totalVentas: 0,
    clientesActivos: 0,
    pedidosDia: 0,
    empleadosActivos: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [facturasRes, clientesRes, pedidosRes, usuariosRes] = await Promise.all([
          api.getFacturas(),
          api.getClientes(),
          api.getPedidos(),
          api.getUsuarios(),
        ]);

        const hoy = new Date().toISOString().split('T')[0];
        const facturas = Array.isArray(facturasRes) ? facturasRes : facturasRes.data || [];
        const clientes = Array.isArray(clientesRes) ? clientesRes : clientesRes.data || [];
        const pedidos = Array.isArray(pedidosRes) ? pedidosRes : pedidosRes.data || [];
        const usuarios = Array.isArray(usuariosRes) ? usuariosRes : usuariosRes.data || [];
        
        setReportes({
          totalVentas: facturas.reduce((s, f) => s + parseFloat(f.total || 0), 0),
          clientesActivos: clientes.filter(c => c.activo).length,
          pedidosDia: pedidos.filter(p => p.creado_en?.split('T')[0] === hoy).length,
          empleadosActivos: usuarios.filter(u => u.activo && (u.rol.includes("admin") || u.rol === "cocinero" || u.rol === "mesero")).length,
        });
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    })();
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ color: C.accent, marginBottom: 24 }}>Reportes Consolidados</h2>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px 0" }}><Spinner /></div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 18, marginBottom: 32 }}>
            <Card>
              <div style={{ fontSize: 28, marginBottom: 8 }}>💵</div>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 4 }}>Ventas Totales</div>
              <div style={{ fontSize: 24, fontWeight: 600, color: C.success }}>
                ${reportes.totalVentas.toLocaleString('es-CO', { maximumFractionDigits: 0 })}
              </div>
            </Card>

            <Card>
              <div style={{ fontSize: 28, marginBottom: 8 }}>👤</div>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 4 }}>Clientes Activos</div>
              <div style={{ fontSize: 24, fontWeight: 600, color: C.accent }}>{reportes.clientesActivos}</div>
            </Card>

            <Card>
              <div style={{ fontSize: 28, marginBottom: 8 }}>📦</div>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 4 }}>Pedidos Hoy</div>
              <div style={{ fontSize: 24, fontWeight: 600, color: C.info }}>{reportes.pedidosDia}</div>
            </Card>

            <Card>
              <div style={{ fontSize: 28, marginBottom: 8 }}>👨‍💼</div>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 4 }}>Staff Activo</div>
              <div style={{ fontSize: 24, fontWeight: 600, color: C.success }}>{reportes.empleadosActivos}</div>
            </Card>
          </div>

          <Card>
            <h3 style={{ marginBottom: 16, color: C.accent }}>Notas Importantes</h3>
            <ul style={{ fontSize: 13, color: C.muted, lineHeight: 1.8, paddingLeft: 20 }}>
              <li>✓ Dashboard actualizado en tiempo real desde el backend</li>
              <li>✓ Acceso a todas las sedes y datos consolidados</li>
              <li>✓ Gestión total de usuarios y sedes</li>
              <li>✓ Auditoría completa de finanzas globales</li>
              <li>✓ Reportes agregados de todas las operaciones</li>
            </ul>
          </Card>
        </>
      )}
    </div>
  );
}

// ── MAIN COMPONENT ─────────────────────────────────────────────────────
export default function SuperAdminPage() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState("rh");

  const renderTab = () => {
    switch (tab) {
      case "sedes": return <TabSedes />;
      case "finanzas": return <TabFinanzas />;
      case "usuarios": return <TabUsuarios />;
      case "admin_punto": return <AdminPage />;
      case "rh": return <RHpage />;
      default: return null;
    }
  };

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text }}>
      <Topbar user={user} logout={logout} tab={tab} setTab={setTab} />
      {renderTab()}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        body { margin: 0; font-family: system-ui, -apple-system, sans-serif; }
      `}</style>
    </div>
  );
}