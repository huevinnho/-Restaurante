import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import MiniCalendar from "../components/shared/MiniCalendarComponent";

// ── Estilos ───────────────────────────────────────────────────────────
const C = {
  bg: "#0f0e0c", surface: "#1a1916", card: "#232220",
  border: "#2e2c29", accent: "#e8a43a", muted: "#6b6a66",
  text: "#f0ede6", danger: "#e05c4b", success: "#4caf7d", info: "#4a9edd",
  warning: "#f59e0b",
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
    borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 500, whiteSpace: "nowrap",
  }}>{children}</span>
);

const Btn = ({ children, onClick, variant = "primary", style = {}, disabled }) => {
  const v = {
    primary: { background: C.accent, color: "#0f0e0c" },
    ghost: { background: "transparent", color: C.muted, border: `1px solid ${C.border}` },
    danger: { background: C.danger + "22", color: C.danger, border: `1px solid ${C.danger}44` },
    success: { background: C.success + "22", color: C.success, border: `1px solid ${C.success}44` },
    info: { background: C.info + "22", color: C.info, border: `1px solid ${C.info}44` },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: "9px 18px", borderRadius: 8, fontSize: 13, fontWeight: 500,
      display: "inline-flex", alignItems: "center", gap: 6,
      transition: "opacity .15s", opacity: disabled ? .5 : 1,
      cursor: disabled ? "not-allowed" : "pointer",
      ...v[variant], ...style,
    }}>{children}</button>
  );
};

const Spinner = ({ size = 14 }) => (
  <span style={{
    display: "inline-block", width: size, height: size,
    border: "2px solid currentColor", borderTopColor: "transparent",
    borderRadius: "50%", animation: "spin .7s linear infinite",
  }} />
);

// ── TOPBAR ────────────────────────────────────────────────────────────
const TABS = [
  { id: "empleados", icon: "👥", label: "Empleados" },
  { id: "nomina", icon: "💰", label: "Nómina" },
  { id: "memorandos", icon: "📝", label: "Memorandos" },
  { id: "correos", icon: "📧", label: "Correos Corp." },
  { id: "seguridad", icon: "🔐", label: "Seguridad" },
  { id: "asistencia", icon: "✓", label: "Asistencia" },
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
          <span style={{ fontSize: 12, color: C.muted }}>{user.sede || "Sede Principal"}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Badge color={C.accent}>HR Manager</Badge>
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

// ── TAB: EMPLEADOS ───────────────────────────────────────────────────
function TabEmpleados({ empleados, sedes = [], onRefresh }) {
  const [modal, setModal] = useState(null);
  const [empleadoEditando, setEmpleadoEditando] = useState(null);
  const [formData, setFormData] = useState({
    nombres: "", apellidos: "", email: "", password: "",
    cargo: "", sede: "", salario: "", fecha_inicio: "",
  });

  const handleGuardar = async () => {
    try {
      await api.crearEmpleado(formData);
      onRefresh && onRefresh();
      setModal(null);
      setFormData({ nombres: "", apellidos: "", email: "", password: "", cargo: "", sede: "", salario: "", fecha_inicio: "" });
    } catch (error) {
      console.error("Error guardando empleado:", error);
      alert("Error: " + error.message);
    }
  };

  const handleActualizar = async () => {
    try {
      await api.actualizarEmpleado(empleadoEditando.id_empleado, formData);
      onRefresh && onRefresh();
      setModal(null);
      setEmpleadoEditando(null);
      setFormData({ nombres: "", apellidos: "", email: "", password: "", cargo: "", sede: "", salario: "", fecha_inicio: "" });
    } catch (error) {
      console.error("Error actualizando empleado:", error);
      alert("Error: " + error.message);
    }
  };

  const cargos = ["mesero", "cocinero", "admin de punto"];
  const estados = empleados.reduce((acc, e) => {
    const key = e.activo ? "activo" : "inactivo";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22 }}>Gestión de Empleados</h2>
        <Btn onClick={() => setModal("nuevo")} style={{ fontSize: 12 }}>+ Nuevo Empleado</Btn>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12, marginBottom: 28 }}>
        <Card><p style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>TOTAL</p><p style={{ fontSize: 20, color: C.accent, fontWeight: 500 }}>{empleados.length}</p></Card>
        <Card><p style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>ACTIVOS</p><p style={{ fontSize: 20, color: C.success, fontWeight: 500 }}>{estados.activo || 0}</p></Card>
        <Card><p style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>INACTIVOS</p><p style={{ fontSize: 20, color: C.danger, fontWeight: 500 }}>{estados.inactivo || 0}</p></Card>
        <Card><p style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>EN PRUEBA</p><p style={{ fontSize: 20, color: C.warning, fontWeight: 500 }}>{estados.en_prueba || 0}</p></Card>
      </div>

      <h3 style={{ fontSize: 13, color: C.muted, letterSpacing: .8, marginBottom: 14 }}>NÓMINA DE EMPLEADOS</h3>
      {empleados.map(e => (
        <Card key={e.id_empleado} style={{ marginBottom: 12, padding: "14px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>{e.nombres} {e.apellidos}</p>
              <p style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>{e.email}</p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Badge color={e.activo ? C.success : C.danger}>{e.activo ? "activo" : "inactivo"}</Badge>
                <Badge color={C.info}>{e.cargo}</Badge>
                <Badge color={C.muted}>{e.sede}</Badge>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>Salario</p>
              <p style={{ fontSize: 16, color: C.success, fontWeight: 500 }}>${e.salario?.toLocaleString()}</p>
              <div style={{ display: "flex", gap: 6, marginTop: 10, justifyContent: "flex-end" }}>
                <Btn variant="ghost" onClick={() => {
                  setEmpleadoEditando(e);
                  setFormData({ nombres: e.nombres || "", apellidos: e.apellidos || "", email: e.email || "", cargo: e.cargo || "mesero", sede: e.id_sede || "", salario: e.salario || "", activo: e.activo, password: "" });
                  setModal("editar");
                }} style={{ fontSize: 11, padding: "4px 10px" }}>✏️ Editar</Btn>
                <Btn variant="ghost" onClick={async () => {
                  try {
                    await api.actualizarEmpleado(e.id_empleado, { nombres: e.nombres, apellidos: e.apellidos, email: e.email, cargo: e.cargo, sede: e.id_sede, salario: e.salario, activo: e.activo ? 0 : 1, password: "" });
                    onRefresh && onRefresh();
                  } catch (error) { alert("Error: " + error.message); }
                }} style={{ fontSize: 11, padding: "4px 10px" }}>{e.activo ? "Desactivar" : "Activar"}</Btn>
              </div>
            </div>
          </div>
        </Card>
      ))}

      {/* Modal Nuevo Empleado */}
      {modal === "nuevo" && (
        <div style={{ position: "fixed", inset: 0, background: "#000a", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 28, width: "100%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto" }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: C.accent, marginBottom: 20 }}>Nuevo Empleado</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <input type="text" placeholder="Nombres" value={formData.nombres} onChange={(e) => setFormData({...formData, nombres: e.target.value})} style={{ padding: "10px 12px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13 }} />
              <input type="text" placeholder="Apellidos" value={formData.apellidos} onChange={(e) => setFormData({...formData, apellidos: e.target.value})} style={{ padding: "10px 12px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13 }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <input type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} style={{ padding: "10px 12px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13 }} />
              <input type="password" placeholder="Contraseña temporal" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} style={{ padding: "10px 12px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13 }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <select value={formData.cargo} onChange={(e) => setFormData({...formData, cargo: e.target.value})} style={{ width: "100%", padding: "12px", borderRadius: 10, border: "1px solid #2e2c29", background: "#232220", color: "#f0ede6", fontSize: 14, outline: "none", cursor: "pointer" }}>
                <option value="">Selecciona un cargo</option>
                {cargos.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={formData.sede || ""} onChange={(e) => setFormData({...formData, sede: e.target.value})} style={{ width: "100%", padding: "10px 12px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13 }}>
                <option value="">Selecciona una sede</option>
                {sedes.map((s) => <option key={s.id_sede} value={s.id_sede}>{s.nombre} - {s.ciudad}</option>)}
              </select>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              <input type="number" placeholder="Salario" value={formData.salario} onChange={(e) => setFormData({...formData, salario: e.target.value})} style={{ padding: "10px 12px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13 }} />
              <div style={{ marginTop: 12 }}>
                <label style={{ display: "block", marginBottom: 6, color: "#f0ede6", fontSize: 14 }}>Fecha de inicio</label>
                <MiniCalendar value={formData.fecha_inicio} onChange={(fecha) => setFormData({...formData, fecha_inicio: fecha})} maxDate={new Date().toISOString().split("T")[0]} width={280} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn onClick={handleGuardar} style={{ flex: 1 }}>Guardar</Btn>
              <Btn variant="ghost" onClick={() => setModal(null)} style={{ flex: 1 }}>Cancelar</Btn>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Empleado */}
      {modal === "editar" && empleadoEditando && (
        <div style={{ position: "fixed", inset: 0, background: "#000a", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 28, width: "100%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto" }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: C.accent, marginBottom: 20 }}>✏️ Editar Empleado</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <input type="text" placeholder="Nombres" value={formData.nombres} onChange={(e) => setFormData({...formData, nombres: e.target.value})} style={{ padding: "10px 12px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13 }} />
              <input type="text" placeholder="Apellidos" value={formData.apellidos} onChange={(e) => setFormData({...formData, apellidos: e.target.value})} style={{ padding: "10px 12px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13 }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <input type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} style={{ padding: "10px 12px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13 }} />
              <input type="password" placeholder="Nueva contraseña (opcional)" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} style={{ padding: "10px 12px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13 }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <select value={formData.cargo} onChange={(e) => setFormData({...formData, cargo: e.target.value})} style={{ padding: "10px 12px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13 }}>
                <option value="">Selecciona un cargo</option>
                {cargos.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={formData.sede || ""} onChange={(e) => setFormData({...formData, sede: e.target.value})} style={{ padding: "10px 12px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13 }}>
                <option value="">Selecciona una sede</option>
                {sedes.map((s) => <option key={s.id_sede} value={s.id_sede}>{s.nombre} - {s.ciudad}</option>)}
              </select>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              <input type="number" placeholder="Salario" value={formData.salario} onChange={(e) => setFormData({...formData, salario: e.target.value})} style={{ padding: "10px 12px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13 }} />
              <select value={formData.activo ?? 1} onChange={(e) => setFormData({...formData, activo: Number(e.target.value)})} style={{ padding: "10px 12px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13 }}>
                <option value={1}>Activo</option>
                <option value={0}>Inactivo</option>
              </select>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn onClick={handleActualizar} style={{ flex: 1 }}>Guardar cambios</Btn>
              <Btn variant="ghost" onClick={() => { setModal(null); setEmpleadoEditando(null); }} style={{ flex: 1 }}>Cancelar</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── TAB: NÓMINA ───────────────────────────────────────────────────────
function TabNomina({ nomina = [], onRefresh, empleados = [] }) {
  const [generando, setGenerando] = useState(false);
  const [modalConfirm, setModalConfirm] = useState(false);

  const pagar = async (id) => {
    try {
      await api.marcarNominaPagada(id);
      onRefresh && onRefresh();
    } catch (error) { alert(error.message); }
  };

  const generarNominaMes = async () => {
    setModalConfirm(false);
    setGenerando(true);
    try {
      const resultado = await api.generarNomina();
      alert(`✅ ${resultado.mensaje}\nEmpleados: ${resultado.cantidad}\nMes: ${resultado.mes}/${resultado.año}`);
      onRefresh && onRefresh();
    } catch (error) { 
      alert("Error: " + error.message);
    } finally {
      setGenerando(false);
    }
  };

  // Calcular empleados activos de forma más robusta
  const empleadosArray = Array.isArray(empleados) ? empleados : [];
  const empleadosActivos = empleadosArray.filter(e => {
    if (typeof e === 'object' && e !== null) {
      return e.activo === 1 || e.activo === true;
    }
    return false;
  }).length;

  console.log("TabNomina - Empleados recibidos:", empleadosArray);
  console.log("TabNomina - Empleados activos:", empleadosActivos);

  const ahora = new Date();
  const mesActual = String(ahora.getMonth() + 1).padStart(2, '0');
  const mesNombre = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][ahora.getMonth()];
  const año = ahora.getFullYear();

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22 }}>Nómina</h2>
        <Btn onClick={() => setModalConfirm(true)} disabled={generando || empleadosArray.length === 0} style={{ fontSize: 12 }}>
          {generando ? <Spinner size={12} /> : "💰"} Generar Nóminas del Mes
        </Btn>
      </div>
      {nomina.length === 0 ? (
        <Card style={{ padding: 28, textAlign: "center" }}>
          <p style={{ color: C.muted, marginBottom: 12 }}>No hay nóminas aún. Genera las nóminas del mes actual.</p>
          <Btn onClick={() => setModalConfirm(true)} disabled={generando}>
            {generando ? <Spinner size={14} /> : "+"} Generar Nóminas
          </Btn>
        </Card>
      ) : (
        nomina.map((n) => (
          <Card key={n.id_nomina} style={{ marginBottom: 12, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ fontWeight: 600, marginBottom: 6 }}>{n.empleado}</p>
                <p style={{ fontSize: 13, color: C.muted, marginBottom: 6 }}>{n.cargo} • {n.sede}</p>
                <p style={{ fontSize: 12, color: C.muted }}>{n.fecha_inicio} → {n.fecha_fin}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontWeight: 700, marginBottom: 8 }}>${Number(n.monto).toLocaleString("es-CO")}</p>
                <Badge color={n.estado === "pagado" ? C.success : C.warning}>{n.estado}</Badge>
                {n.estado === "pendiente" && (
                  <div style={{ marginTop: 10 }}>
                    <Btn onClick={() => pagar(n.id_nomina)}>Marcar Pagada</Btn>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))
      )}
      
      {/* Modal de Confirmación */}
      {modalConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "#000a", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 28, width: "100%", maxWidth: 450, boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: C.accent, marginBottom: 20 }}>Generar Nóminas</h3>
            
            {empleadosArray.length === 0 ? (
              <>
                <div style={{ background: C.danger + "22", border: `1px solid ${C.danger}44`, borderRadius: 12, padding: 16, marginBottom: 20 }}>
                  <p style={{ fontSize: 12, color: C.danger, marginBottom: 8 }}>⚠️ No se encontraron empleados</p>
                  <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>No hay empleados cargados en el sistema. Verifica que existan empleados activos antes de generar nóminas.</p>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <Btn variant="ghost" onClick={() => setModalConfirm(false)} style={{ flex: 1 }}>Cerrar</Btn>
                </div>
              </>
            ) : (
              <>
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, marginBottom: 20 }}>
                  <p style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>DETALLES DE LA GENERACIÓN</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                    <div>
                      <p style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Mes</p>
                      <p style={{ fontSize: 14, fontWeight: 500, color: C.text }}>{mesNombre} {año}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Empleados Activos</p>
                      <p style={{ fontSize: 14, fontWeight: 500, color: empleadosActivos > 0 ? C.success : C.warning }}>{empleadosActivos}</p>
                    </div>
                  </div>
                  <div>
                    <p style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Rango de Fechas</p>
                    <p style={{ fontSize: 13, color: C.text }}>01/{mesActual}/{año} — {new Date(año, ahora.getMonth() + 1, 0).getDate()}/{mesActual}/{año}</p>
                  </div>
                </div>

                {empleadosActivos === 0 && (
                  <div style={{ background: C.warning + "22", border: `1px solid ${C.warning}44`, borderRadius: 12, padding: 12, marginBottom: 20 }}>
                    <p style={{ fontSize: 12, color: C.warning }}>⚠️ No hay empleados activos. Se crearán 0 nóminas.</p>
                  </div>
                )}

                <p style={{ fontSize: 12, color: C.muted, marginBottom: 20 }}>Se generarán nóminas en estado <Badge color={C.warning}>pendiente</Badge> para cada empleado activo. Podrás marcarlas como pagadas después.</p>

                <div style={{ display: "flex", gap: 10 }}>
                  <Btn onClick={generarNominaMes} style={{ flex: 1 }} disabled={generando || empleadosActivos === 0}>
                    {generando ? <Spinner size={12} /> : "✅"} Confirmar Generación
                  </Btn>
                  <Btn variant="ghost" onClick={() => setModalConfirm(false)} style={{ flex: 1 }} disabled={generando}>Cancelar</Btn>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── TAB: MEMORANDOS ───────────────────────────────────────────────────
function TabMemorandos({ memorandos = [], empleados = [], onRefresh }) {
  const [modal, setModal] = useState(null);
  const [formData, setFormData] = useState({ asunto: "", contenido: "", id_empleado: "", tipo: "general" });

  const handleEnviar = async () => {
    try {
      await api.crearMemorando(formData);
      onRefresh && onRefresh();
      setModal(null);
    } catch (error) {
      console.error("Error enviando memorando:", error);
      alert("Error: " + error.message);
    }
  };

  const tipos = ["general", "advertencia", "felicitacion", "disciplinario", "otros"];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22 }}>Memorandos</h2>
        <Btn onClick={() => setModal("nuevo")} style={{ fontSize: 12 }}>+ Nuevo Memorando</Btn>
      </div>
      <h3 style={{ fontSize: 13, color: C.muted, letterSpacing: .8, marginBottom: 14 }}>HISTORIAL</h3>
      {memorandos.map(m => (
        <Card key={m.id_memorando} style={{ marginBottom: 12, padding: "14px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>{m.asunto}</p>
              <p style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>Para: {m.destinatario} • {new Date(m.fecha_creacion).toLocaleDateString("es-CO")}</p>
              <p style={{ fontSize: 13, marginBottom: 10 }}>{m.contenido?.substring(0, 80)}...</p>
              <Badge color={m.tipo === "advertencia" ? C.danger : m.tipo === "felicitacion" ? C.success : m.tipo === "disciplinario" ? C.danger : C.info}>{m.tipo}</Badge>
            </div>
            <Btn variant="ghost" onClick={() => {}} style={{ fontSize: 11 }}>📄 Ver</Btn>
          </div>
        </Card>
      ))}

      {modal === "nuevo" && (
        <div style={{ position: "fixed", inset: 0, background: "#000a", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 28, width: "100%", maxWidth: 600, maxHeight: "90vh", overflowY: "auto" }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: C.accent, marginBottom: 20 }}>Nuevo Memorando</h3>
            <select value={formData.tipo} onChange={(e) => setFormData({...formData, tipo: e.target.value})} style={{ width: "100%", padding: "10px 12px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13, marginBottom: 16 }}>
              {tipos.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={formData.id_empleado} onChange={(e) => setFormData({...formData, id_empleado: e.target.value})} style={{ width: "100%", padding: "12px", backgroundColor: "#232220", border: "1px solid #3a3834", borderRadius: 8, color: "#f0ede6", fontSize: 14, marginBottom: 16 }}>
              <option value="">Selecciona un empleado</option>
              {empleados.map((e) => <option key={e.id_empleado} value={e.id_empleado}>{`${e.nombres} ${e.apellidos} - ${e.cargo}`}</option>)}
            </select>
            <input placeholder="Asunto..." value={formData.asunto} onChange={(e) => setFormData({...formData, asunto: e.target.value})} style={{ width: "100%", padding: "10px 12px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13, marginBottom: 16 }} />
            <textarea placeholder="Contenido del memorando..." value={formData.contenido} onChange={(e) => setFormData({...formData, contenido: e.target.value})} style={{ width: "100%", padding: "10px 12px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13, marginBottom: 20, minHeight: 150 }} />
            <div style={{ display: "flex", gap: 10 }}>
              <Btn onClick={handleEnviar} style={{ flex: 1 }}>Enviar</Btn>
              <Btn variant="ghost" onClick={() => setModal(null)} style={{ flex: 1 }}>Cancelar</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── TAB: CORREOS CORPORATIVOS ─────────────────────────────────────────
function TabCorreos({ empleados = [] }) {
  const [modal, setModal] = useState(null);
  const [formData, setFormData] = useState({ nombre: "", apellido: "", usuario: "", contraseña_generada: "" });

  const generarCorreo = (nombres, apellidos) => {
    const nombre = nombres.split(" ")[0].toLowerCase();
    const apellido = apellidos.split(" ")[0].toLowerCase();
    return `${nombre}.${apellido}@restaurante.com`;
  };

  const generarContraseña = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
    let pwd = "";
    for (let i = 0; i < 12; i++) pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    return pwd;
  };

  const handleGenerarCorreo = () => {
    const correo = generarCorreo(formData.nombre, formData.apellido);
    const pwd = generarContraseña();
    setFormData({...formData, usuario: correo, contraseña_generada: pwd});
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22 }}>Generador de Correos Corporativos</h2>
        <Btn onClick={() => setModal("nuevo")} style={{ fontSize: 12 }}>+ Generar Correo</Btn>
      </div>
      <h3 style={{ fontSize: 13, color: C.muted, letterSpacing: .8, marginBottom: 14 }}>CORREOS CREADOS</h3>
      {empleados.map(e => (
        <Card key={e.id_empleado} style={{ marginBottom: 12, padding: "14px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 500 }}>{e.nombres} {e.apellidos}</p>
              <p style={{ fontSize: 12, color: C.accent, fontFamily: "monospace" }}>{e.email}</p>
            </div>
            <Badge color={e.activo ? C.success : C.danger}>{e.activo ? "Correo activo" : "Correo desactivado"}</Badge>
          </div>
        </Card>
      ))}

      {modal === "nuevo" && (
        <div style={{ position: "fixed", inset: 0, background: "#000a", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 28, width: "100%", maxWidth: 500, maxHeight: "90vh", overflowY: "auto" }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: C.accent, marginBottom: 20 }}>Generar Correo Corporativo</h3>
            <input type="text" placeholder="Nombres" value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} style={{ width: "100%", padding: "10px 12px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13, marginBottom: 12 }} />
            <input type="text" placeholder="Apellidos" value={formData.apellido} onChange={(e) => setFormData({...formData, apellido: e.target.value})} style={{ width: "100%", padding: "10px 12px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13, marginBottom: 16 }} />
            <Btn onClick={handleGenerarCorreo} style={{ width: "100%", marginBottom: 16 }}>Generar</Btn>
            {formData.usuario && (
              <Card style={{ marginBottom: 16, padding: "14px" }}>
                <p style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>USUARIO</p>
                <p style={{ fontSize: 13, fontFamily: "monospace", color: C.accent, marginBottom: 12 }}>{formData.usuario}</p>
                <p style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>CONTRASEÑA</p>
                <p style={{ fontSize: 13, fontFamily: "monospace", color: C.success, marginBottom: 12 }}>{formData.contraseña_generada}</p>
                <Btn variant="info" onClick={() => {
                  const text = `Usuario: ${formData.usuario}\nContraseña: ${formData.contraseña_generada}`;
                  navigator.clipboard.writeText(text);
                  alert("✓ Credenciales copiadas al portapapeles");
                }} style={{ width: "100%" }}>📋 Copiar credenciales</Btn>
              </Card>
            )}
            <Btn variant="ghost" onClick={() => setModal(null)} style={{ width: "100%" }}>Cancelar</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

// ── TAB: SEGURIDAD ────────────────────────────────────────────────────
function TabSeguridad({ seguridad = [], sedes = [], onRefresh }) {
  const [modal, setModal] = useState(null);
  const [formData, setFormData] = useState({
    id_sede: "", id_tipo: "", fecha_revision: new Date().toISOString().split("T")[0],
    fecha_vencimiento: "", fecha_proxima_accion: "", descripcion: "", observacion: "",
  });

  const tiposRevisiones = [
    { id: 1, nombre: "Licencia sanitaria" },
    { id: 2, nombre: "Certificado de bomberos" },
    { id: 3, nombre: "Permiso de operación" },
    { id: 4, nombre: "Inspección DIAN" },
    { id: 5, nombre: "Revisión de seguridad" },
  ];

  const inputStyle = { width: "100%", padding: "10px 12px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13, marginBottom: 12 };
  const labelStyle = { display: "block", fontSize: 11, color: C.muted, marginBottom: 4, marginTop: 4 };

  const handleGuardar = async () => {
    try {
      await api.crearControlSeguridad(formData);
      onRefresh && onRefresh();
      setModal(null);
      setFormData({ id_sede: "", id_tipo: "", fecha_revision: new Date().toISOString().split("T")[0], fecha_vencimiento: "", fecha_proxima_accion: "", descripcion: "", observacion: "" });
    } catch (error) { alert("Error: " + error.message); }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22 }}>Control de Seguridad y Revisiones</h2>
        <Btn onClick={() => setModal("nuevo")} style={{ fontSize: 12 }}>+ Registrar Revisión</Btn>
      </div>
      <h3 style={{ fontSize: 13, color: C.muted, letterSpacing: .8, marginBottom: 14 }}>REVISIONES POR SEDE</h3>
      {seguridad.length > 0 ? seguridad.map(s => (
        <Card key={s.id_revision} style={{ marginBottom: 12, padding: "14px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>{s.tipo}</p>
              <p style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>Sede: {s.sede} • Realizada: {new Date(s.fecha_revision).toLocaleDateString("es-CO")}</p>
              {s.descripcion && <p style={{ fontSize: 12, marginBottom: 6 }}>{s.descripcion}</p>}
              {s.observacion && <p style={{ fontSize: 11, color: C.muted, fontStyle: "italic" }}>📝 {s.observacion}</p>}
            </div>
            <div style={{ textAlign: "right" }}>
              {s.fecha_vencimiento && (
                <>
                  <p style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Vence</p>
                  <p style={{ fontSize: 13, color: new Date(s.fecha_vencimiento) < new Date() ? C.danger : C.success, fontWeight: 500 }}>
                    {new Date(s.fecha_vencimiento).toLocaleDateString("es-CO")}
                  </p>
                </>
              )}
              {s.fecha_proxima_accion && (
                <p style={{ fontSize: 11, color: C.warning, marginTop: 4 }}>Próx. acción: {new Date(s.fecha_proxima_accion).toLocaleDateString("es-CO")}</p>
              )}
            </div>
          </div>
        </Card>
      )) : <p style={{ color: C.muted, fontSize: 12 }}>📋 No hay revisiones registradas</p>}

      {modal === "nuevo" && (
        <div style={{ position: "fixed", inset: 0, background: "#000a", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 28, width: "100%", maxWidth: 600, maxHeight: "90vh", overflowY: "auto" }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: C.accent, marginBottom: 20 }}>Registrar Nueva Revisión</h3>
            <label style={labelStyle}>Sede</label>
            <select value={formData.id_sede} onChange={(e) => setFormData({...formData, id_sede: e.target.value})} style={inputStyle}>
              <option value="">Selecciona una sede...</option>
              {sedes.map(s => <option key={s.id_sede} value={s.id_sede}>{s.nombre} - {s.ciudad}</option>)}
            </select>
            <label style={labelStyle}>Tipo de revisión</label>
            <select value={formData.id_tipo} onChange={(e) => setFormData({...formData, id_tipo: e.target.value})} style={inputStyle}>
              <option value="">Selecciona tipo de revisión...</option>
              {tiposRevisiones.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
            </select>
            <label style={labelStyle}>Descripción</label>
            <input type="text" placeholder="Descripción breve" value={formData.descripcion} onChange={(e) => setFormData({...formData, descripcion: e.target.value})} style={inputStyle} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 4 }}>
              <div>
                <label style={labelStyle}>Fecha de revisión</label>
                <MiniCalendar
                  value={formData.fecha_revision}
                  onChange={(fecha) => setFormData({...formData, fecha_revision: fecha})}
                  maxDate={new Date().toISOString().split("T")[0]}
                  width={200}
                />
              </div>
              <div>
                <label style={labelStyle}>Fecha de vencimiento</label>
                <MiniCalendar
                  value={formData.fecha_vencimiento}
                  onChange={(fecha) => setFormData({...formData, fecha_vencimiento: fecha})}
                  width={200}
                />
              </div>
              <div>
                <label style={labelStyle}>Próxima acción</label>
                <MiniCalendar
                  value={formData.fecha_proxima_accion}
                  onChange={(fecha) => setFormData({...formData, fecha_proxima_accion: fecha})}
                  width={200}
                />
              </div>
            </div>
            <label style={{ ...labelStyle, marginTop: 12 }}>Observaciones</label>
            <textarea placeholder="Observaciones adicionales..." value={formData.observacion} onChange={(e) => setFormData({...formData, observacion: e.target.value})} style={{ ...inputStyle, marginBottom: 20, minHeight: 90 }} />
            <div style={{ display: "flex", gap: 10 }}>
              <Btn onClick={handleGuardar} style={{ flex: 1 }}>Guardar</Btn>
              <Btn variant="ghost" onClick={() => setModal(null)} style={{ flex: 1 }}>Cancelar</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── TAB: ASISTENCIA ───────────────────────────────────────────────────
function TabAsistencia({ empleados = [], sedes = [] }) {
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [sedeId, setSedeId] = useState("");
  const [asistencia, setAsistencia] = useState([]);
  const [marcas, setMarcas] = useState({});
  const [guardando, setGuardando] = useState({});

  const inputStyle = { padding: "8px 10px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6, color: C.text, fontSize: 12 };
  const labelStyle = { display: "block", fontSize: 11, color: C.muted, marginBottom: 4 };

  const cargarAsistencia = async () => {
    try {
      const data = await api.getAsistencia(fecha, sedeId || null);
      const lista = Array.isArray(data) ? data : [];
      setAsistencia(lista);
      const init = {};
      lista.forEach(a => {
        init[Number(a.id_empleado)] = {   // ← siempre Number como clave
          estado: a.estado,
          hora_entrada: a.hora_entrada || "",
          hora_salida: a.hora_salida || "",
          guardado: true,
        };
      });
      setMarcas(init);
    } catch (error) {
      console.error("Error cargando asistencia:", error);
      setAsistencia([]);
      setMarcas({});
    }
  };

  useEffect(() => { cargarAsistencia(); }, [fecha, sedeId]);

  const empleadosFiltrados = sedeId
    ? empleados.filter(e => String(e.id_sede) === String(sedeId))
    : empleados;

  const setMarca = (id_empleado, campo, valor) => {
    setMarcas(prev => ({
      ...prev,
      [Number(id_empleado)]: { ...prev[Number(id_empleado)], [campo]: valor, guardado: false },
    }));
  };

  const guardarMarca = async (empleado) => {
    const marca = marcas[Number(empleado.id_empleado)];
    if (!marca?.estado) return;
    setGuardando(prev => ({ ...prev, [Number(empleado.id_empleado)]: true }));
    try {
      await api.registrarAsistencia({
        id_empleado: empleado.id_empleado,
        id_sede: empleado.id_sede,
        fecha,
        estado: marca.estado,
        hora_entrada: marca.hora_entrada || null,
        hora_salida: marca.hora_salida || null,
      });
    } catch (error) {
      if (!error.message.includes("Ya existe")) {
        alert("Error guardando: " + error.message);
      }
    } finally {
      await cargarAsistencia();  // siempre recarga, éxito o duplicado
      setGuardando(prev => ({ ...prev, [Number(empleado.id_empleado)]: false }));
    }
  };

  const conteo = {
    presente:   empleadosFiltrados.filter(e => marcas[Number(e.id_empleado)]?.estado === "presente").length,
    ausente:    empleadosFiltrados.filter(e => marcas[Number(e.id_empleado)]?.estado === "ausente").length,
    tardanza:   empleadosFiltrados.filter(e => marcas[Number(e.id_empleado)]?.estado === "tardanza").length,
    sin_marcar: empleadosFiltrados.filter(e => !marcas[Number(e.id_empleado)]?.estado).length,
  };

  const colorEstado = { presente: C.success, ausente: C.danger, tardanza: C.warning };
  const iconoEstado = { presente: "✓", ausente: "✗", tardanza: "⏱" };
  const hoy = new Date().toISOString().split("T")[0];

  return (
    <div>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, marginBottom: 20 }}>Registro de Asistencia</h2>

      <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>

        {/* Panel izquierdo: calendario + sede */}
        <div style={{ flexShrink: 0 }}>
          <MiniCalendar value={fecha} onChange={setFecha} maxDate={hoy} width={280} />

          <div style={{ marginTop: 16 }}>
            <label style={labelStyle}>Sede</label>
            <select value={sedeId} onChange={(e) => setSedeId(e.target.value)} style={{ ...inputStyle, width: "100%" }}>
              <option value="">Todas las sedes</option>
              {sedes.map(s => <option key={s.id_sede} value={s.id_sede}>{s.nombre}</option>)}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 16 }}>
            {[
              { label: "PRESENTES",  val: conteo.presente,   color: C.success },
              { label: "AUSENTES",   val: conteo.ausente,    color: C.danger },
              { label: "TARDANZAS",  val: conteo.tardanza,   color: C.warning },
              { label: "SIN MARCAR", val: conteo.sin_marcar, color: C.muted },
            ].map(({ label, val, color }) => (
              <Card key={label} style={{ padding: "10px 14px" }}>
                <p style={{ fontSize: 10, color: C.muted, marginBottom: 4 }}>{label}</p>
                <p style={{ fontSize: 18, color, fontWeight: 500 }}>{val}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Panel derecho: lista de empleados */}
        <div style={{ flex: 1, minWidth: 300 }}>
          <h3 style={{ fontSize: 13, color: C.muted, letterSpacing: .8, marginBottom: 14 }}>
            EMPLEADOS
          </h3>

          {empleadosFiltrados.length === 0
            ? <p style={{ color: C.muted, fontSize: 12 }}>No hay empleados para esta sede.</p>
            : empleadosFiltrados.map(e => {
              const marca    = marcas[Number(e.id_empleado)] || {};
              const estado   = marca.estado;
              const guardado = marca.guardado;
              const cargando = guardando[Number(e.id_empleado)];

              return (
                <Card key={e.id_empleado} style={{
                  marginBottom: 10, padding: "14px 16px",
                  borderLeft: `3px solid ${estado ? colorEstado[estado] : C.border}`,
                  opacity: guardado ? 0.85 : 1,
                  transition: "opacity .2s",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>

                    <div style={{ minWidth: 150 }}>
                      <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{e.nombres} {e.apellidos}</p>
                      <p style={{ fontSize: 11, color: C.muted }}>{e.cargo} · {e.sede}</p>
                    </div>

                    {/* Botones estado — bloqueados si ya está guardado */}
                    <div style={{ display: "flex", gap: 5 }}>
                      {["presente", "ausente", "tardanza"].map(op => (
                        <button key={op}
                          onClick={() => !guardado && setMarca(e.id_empleado, "estado", op)}
                          disabled={guardado}
                          style={{
                            padding: "5px 10px", borderRadius: 6, fontSize: 11, fontWeight: 500,
                            cursor: guardado ? "not-allowed" : "pointer",
                            background: estado === op ? colorEstado[op] + "33" : "transparent",
                            color: estado === op ? colorEstado[op] : C.muted,
                            border: `1px solid ${estado === op ? colorEstado[op] : C.border}`,
                            opacity: guardado ? 0.6 : 1,
                            transition: "all .15s",
                          }}>
                          {iconoEstado[op]} {op}
                        </button>
                      ))}
                    </div>

                    {/* Horas — solo lectura si ya está guardado */}
                    {(estado === "presente" || estado === "tardanza") && (
                      <div style={{ display: "flex", gap: 8 }}>
                        <div>
                          <label style={{ ...labelStyle, marginBottom: 2 }}>Entrada</label>
                          <input type="time" value={marca.hora_entrada || ""}
                            onChange={(ev) => !guardado && setMarca(e.id_empleado, "hora_entrada", ev.target.value)}
                            readOnly={guardado}
                            style={{ ...inputStyle, width: 105, cursor: guardado ? "not-allowed" : "auto", opacity: guardado ? 0.6 : 1 }} />
                        </div>
                        <div>
                          <label style={{ ...labelStyle, marginBottom: 2 }}>Salida</label>
                          <input type="time" value={marca.hora_salida || ""}
                            onChange={(ev) => !guardado && setMarca(e.id_empleado, "hora_salida", ev.target.value)}
                            readOnly={guardado}
                            style={{ ...inputStyle, width: 105, cursor: guardado ? "not-allowed" : "auto", opacity: guardado ? 0.6 : 1 }} />
                        </div>
                      </div>
                    )}

                    {/* Botón guardar — oculto si ya está guardado */}
                    {estado && !guardado && (
                      <Btn
                        variant="primary"
                        onClick={() => guardarMarca(e)}
                        disabled={cargando}
                        style={{ fontSize: 12, padding: "6px 14px", minWidth: 80 }}
                      >
                        {cargando ? <Spinner size={12} /> : "Guardar"}
                      </Btn>
                    )}
                    {estado && guardado && (
                      <span style={{ fontSize: 12, color: C.success, fontWeight: 500, minWidth: 80, textAlign: "center" }}>
                        ✓ Guardado
                      </span>
                    )}
                  </div>
                </Card>
              );
            })
          }
        </div>
      </div>
    </div>
  );
}

// ── COMPONENTE PRINCIPAL ──────────────────────────────────────────────
export default function AdminGeneralPage() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState("empleados");
  const [sedes, setSedes] = useState([]);
  const [data, setData] = useState({
    empleados: [],
    nomina: [],
    memorandos: [],
    seguridad: [],
    asistencia: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        
        // Cargar empleados con manejo de error más explícito
        let empleadosData = [];
        try {
          empleadosData = await api.getEmpleados();
          console.log("✅ Empleados cargados:", empleadosData);
        } catch (err) {
          console.error("❌ Error cargando empleados:", err);
          empleadosData = [];
        }
        
        // Cargar otros datos
        const [nomina, memorandos, seguridad, sedesData] = await Promise.all([
          api.getNomina().catch(err => { console.error("Error getNomina:", err); return []; }),
          api.getMemorandos().catch(err => { console.error("Error getMemorandos:", err); return []; }),
          api.getSeguridad().catch(err => { console.error("Error getSeguridad:", err); return []; }),
          api.getSedes().catch(err => { console.error("Error getSedes:", err); return []; }),
        ]);
        
        setData({
          empleados: Array.isArray(empleadosData) ? empleadosData : [],
          nomina: Array.isArray(nomina) ? nomina : [],
          memorandos: Array.isArray(memorandos) ? memorandos : [],
          seguridad: Array.isArray(seguridad) ? seguridad : [],
          asistencia: [],
        });
        setSedes(Array.isArray(sedesData) ? sedesData : []);
      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
    const interval = setInterval(cargarDatos, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 3px; }
        button { border: none; font-family: inherit; }
        input, select, textarea { font-family: inherit; outline: none; }
      `}</style>

      <Topbar user={user} logout={logout} tab={tab} setTab={setTab} />

      <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: C.muted }}>
            <Spinner /> Cargando datos...
          </div>
        ) : (
          <>
            {tab === "empleados" && (
              <TabEmpleados empleados={data.empleados} sedes={sedes}
                onRefresh={() => api.getEmpleados().then(empleados => setData(prev => ({ ...prev, empleados })))} />
            )}
            {tab === "nomina" && (
              <TabNomina nomina={data.nomina} empleados={data.empleados}
                onRefresh={() => api.getNomina().then(nomina => setData(prev => ({ ...prev, nomina })))} />
            )}
            {tab === "memorandos" && (
              <TabMemorandos memorandos={data.memorandos} empleados={data.empleados}
                onRefresh={() => api.getMemorandos().then(memorandos => setData(prev => ({ ...prev, memorandos })))} />
            )}
            {tab === "correos" && <TabCorreos empleados={data.empleados} />}
            {tab === "seguridad" && (
              <TabSeguridad seguridad={data.seguridad} sedes={sedes}
                onRefresh={() => api.getSeguridad().then(seguridad => setData(prev => ({ ...prev, seguridad })))} />
            )}
            {tab === "asistencia" && (
              <TabAsistencia empleados={data.empleados} sedes={sedes} />
            )}
          </>
        )}
      </div>
    </div>
  );
}