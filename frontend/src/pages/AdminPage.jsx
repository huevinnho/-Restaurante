import { useState, useEffect, useCallback } from "react";
import { useAuth, usePuede } from "../context/AuthContext";
import api from "../services/api";
import TabReservas from "../components/shared/TabReservas";

// ── Estilos ───────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=DM+Sans:wght@300;400;500&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0f0e0c; color: #f0ede6; font-family: 'DM Sans', sans-serif; }
  @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
  @keyframes spin   { to { transform: rotate(360deg); } }
  .fade { animation: fadeUp .35s ease both; }
  input, select, textarea {
    background: #1a1916; border: 1px solid #2e2c29; color: #f0ede6;
    font-family: 'DM Sans', sans-serif; font-size: 13px;
    border-radius: 8px; padding: 9px 12px; outline: none; width: 100%;
    transition: border-color .2s;
  }
  input:focus, select:focus, textarea:focus { border-color: #e8a43a; }
  input::placeholder, textarea::placeholder { color: #6b6a66; }
  button { cursor: pointer; font-family: 'DM Sans', sans-serif; border: none; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-thumb { background: #2e2c29; border-radius: 2px; }
`;

const C = {
  bg: "#0f0e0c", surface: "#1a1916", card: "#232220",
  border: "#2e2c29", accent: "#e8a43a", muted: "#6b6a66",
  text: "#f0ede6", danger: "#e05c4b", success: "#4caf7d", info: "#4a9edd",
};

const imagenesPlatos = {
  1: "/img/1.png",
  2: "/img/2.png",
  3: "/img/3.png",
  4: "/img/4.png",
  5: "/img/5.png",
  6: "/img/6.png",
  7: "/img/7.png",
  8: "/img/8.png",
  9: "/img/9.png",
  10: "/img/10.png",
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
      ...v[variant], ...style,
    }}>{children}</button>
  );
};

const Divider = () => <div style={{ height: 1, background: C.border, margin: "14px 0" }} />;

const Spinner = ({ size = 14 }) => (
  <span style={{
    display: "inline-block", width: size, height: size,
    border: "2px solid currentColor", borderTopColor: "transparent",
    borderRadius: "50%", animation: "spin .7s linear infinite",
  }} />
);

const Label = ({ children }) => (
  <p style={{ fontSize: 11, color: C.muted, letterSpacing: .8, marginBottom: 8 }}>{children}</p>
);

const Input = ({ label, ...props }) => (
  <div style={{ marginBottom: 14 }}>
    {label && <Label>{label.toUpperCase()}</Label>}
    <input {...props} />
  </div>
);

const Select = ({ label, children, ...props }) => (
  <div style={{ marginBottom: 14 }}>
    {label && <Label>{label.toUpperCase()}</Label>}
    <select {...props}>{children}</select>
  </div>
);

function Modal({ title, onClose, children }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "#000a", zIndex: 200,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 16, padding: 28, width: "100%", maxWidth: 480,
        maxHeight: "90vh", overflowY: "auto",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: C.accent }}>{title}</h3>
          <Btn variant="ghost" onClick={onClose} style={{ padding: "4px 10px", fontSize: 14 }}>✕</Btn>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── TOPBAR ────────────────────────────────────────────────────────────
const TABS = [
  { id: "resumen", icon: "📊", label: "Resumen" },
  { id: "mesas", icon: "🪑", label: "Mesas" },
  { id: "pedidos", icon: "📋", label: "Pedidos" },
  { id: "facturacion", icon: "🧾", label: "Facturación" },
  { id: "menu", icon: "🍽", label: "Menú" },
  { id: "inventario", icon: "📦", label: "Inventario" },
  { id: "reservas", icon: "📅", label: "Reservas" },
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
          <Badge color={C.info}>Admin del Punto</Badge>
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

// ── TAB: RESUMEN ──────────────────────────────────────────────────────
function TabResumen({ mesas, pedidos, inventario, facturas }) {
  const mesasOcupadas = mesas.filter(m => !m.disponible).length;
  const pedidosActivos = pedidos.filter(p => !["entregado", "cancelado"].includes(p.estado)).length;
  const alertasStock = inventario.filter(i => i.alerta !== "ok").length;
  const totalHoy = facturas.reduce((s, f) => s + Number(f.total), 0);

  const stats = [
    { label: "Mesas ocupadas", val: `${mesasOcupadas}/${mesas.length}`, color: C.accent, icon: "🪑" },
    { label: "Pedidos activos", val: pedidosActivos, color: C.info, icon: "📋" },
    { label: "Alertas de stock", val: alertasStock, color: alertasStock > 0 ? C.danger : C.success, icon: "📦" },
    { label: "Facturado hoy", val: `$${totalHoy.toLocaleString()}`, color: C.success, icon: "💰" },
  ];

  return (
    <div className="fade">
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, marginBottom: 20 }}>
        Resumen del día
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14, marginBottom: 28 }}>
        {stats.map(s => (
          <Card key={s.label}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <span style={{ fontSize: 22 }}>{s.icon}</span>
              <span style={{ fontSize: 12, color: C.muted }}>{s.label}</span>
            </div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: s.color }}>
              {s.val}
            </div>
          </Card>
        ))}
      </div>

      {/* Pedidos recientes */}
      <h3 style={{ fontSize: 13, color: C.muted, letterSpacing: .8, marginBottom: 14 }}>PEDIDOS ACTIVOS</h3>
      {pedidos.filter(p => !["entregado", "cancelado"].includes(p.estado)).slice(0, 5).map(p => (
        <Card key={p.id_pedido} style={{ marginBottom: 10, padding: "12px 18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontFamily: "'Playfair Display', serif", color: C.accent }}>Mesa {p.mesa_numero}</span>
              <Badge color={p.estado === "pendiente" ? C.accent : p.estado === "en_preparacion" ? C.info : C.success}>
                {p.estado.replace("_", " ")}
              </Badge>
            </div>
            <span style={{ fontSize: 12, color: C.muted }}>
              {new Date(p.creado_en).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        </Card>
      ))}

      {/* Alertas inventario */}
      {alertasStock > 0 && (
        <>
          <h3 style={{ fontSize: 13, color: C.muted, letterSpacing: .8, margin: "24px 0 14px" }}>ALERTAS DE INVENTARIO</h3>
          {inventario.filter(i => i.alerta !== "ok").slice(0, 4).map((a, i) => (
            <Card key={i} style={{ marginBottom: 10, padding: "12px 18px", borderColor: C.danger + "44" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13 }}>{a.nombre}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Badge color={a.alerta === "bajo" ? C.danger : C.accent}>
                    {a.alerta === "bajo" ? "Stock bajo" : "Por vencer"}
                  </Badge>
                  <span style={{ fontSize: 13, color: C.danger }}>{a.cantidad_actual} {a.unidad_medida}</span>
                </div>
              </div>
            </Card>
          ))}
        </>
      )}
    </div>
  );
}

// ── TAB: MESAS ────────────────────────────────────────────────────────
function TabMesas({ mesas, pedidos, onRefresh }) {
  const getPedido = (id) => pedidos.find(p => p.id_mesa === id && !["entregado", "cancelado"].includes(p.estado));

  return (
    <div className="fade">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22 }}>Mesas</h2>
        <Btn variant="ghost" onClick={onRefresh} style={{ fontSize: 12, padding: "6px 14px" }}>↻ Actualizar</Btn>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
        {mesas.map(m => {
          const pedido = getPedido(m.id_mesa);
          const color = m.disponible ? C.success : C.accent;
          return (
            <Card key={m.id_mesa} style={{ borderColor: !m.disponible ? C.accent + "55" : C.border }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: C.accent }}>
                  Mesa {m.numero}
                </span>
                <Badge color={color}>{m.disponible ? "Libre" : "Ocupada"}</Badge>
              </div>
              <p style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>Cap. {m.capacidad} personas</p>
              {pedido && (
                <>
                  <Divider />
                  <p style={{ fontSize: 12, marginBottom: 4 }}>Pedido #{pedido.id_pedido}</p>
                  <Badge color={pedido.estado === "pendiente" ? C.accent : pedido.estado === "en_preparacion" ? C.info : C.success}>
                    {pedido.estado.replace("_", " ")}
                  </Badge>
                  <p style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>
                    {pedido.items?.length || 0} items · ${pedido.items?.reduce((s, i) => s + i.precio * i.cantidad, 0).toLocaleString()}
                  </p>
                </>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ── TAB: PEDIDOS ──────────────────────────────────────────────────────
function TabPedidos({ pedidos, onRefresh }) {
  const [filtro, setFiltro] = useState("activos");

  const lista = pedidos.filter(p =>
    filtro === "activos"
      ? !["entregado", "cancelado"].includes(p.estado)
      : p.estado === filtro
  );

  return (
    <div className="fade">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22 }}>Pedidos</h2>
        <Btn variant="ghost" onClick={onRefresh} style={{ fontSize: 12, padding: "6px 14px" }}>↻ Actualizar</Btn>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { id: "activos", label: "Activos" },
          { id: "pendiente", label: "Pendientes" },
          { id: "en_preparacion", label: "En preparación" },
          { id: "listo", label: "Listos" },
          { id: "entregado", label: "Entregados" },
        ].map(f => (
          <button key={f.id} onClick={() => setFiltro(f.id)} style={{
            background: filtro === f.id ? C.accent + "22" : C.surface,
            color: filtro === f.id ? C.accent : C.muted,
            border: `1px solid ${filtro === f.id ? C.accent + "66" : C.border}`,
            borderRadius: 20, padding: "5px 14px", fontSize: 12, transition: "all .15s",
          }}>{f.label}</button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {lista.length === 0
          ? <Card style={{ textAlign: "center", padding: 40 }}>
            <p style={{ color: C.muted }}>No hay pedidos en este estado</p>
          </Card>
          : lista.map(p => (
            <Card key={p.id_pedido}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontFamily: "'Playfair Display', serif", color: C.accent, fontSize: 16 }}>
                    Mesa {p.mesa_numero}
                  </span>
                  <Badge color={p.estado === "pendiente" ? C.accent : p.estado === "en_preparacion" ? C.info : p.estado === "listo" ? C.success : C.muted}>
                    {p.estado.replace("_", " ")}
                  </Badge>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: 12, color: C.muted }}>#{p.id_pedido}</p>
                  <p style={{ fontSize: 11, color: C.muted }}>
                    {new Date(p.creado_en).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                    {" · "}{p.mesero_nombre}
                  </p>
                </div>
              </div>
              {p.observacion && (
                <div style={{
                  background: C.danger + "11", border: `1px solid ${C.danger}33`,
                  borderRadius: 8, padding: "6px 12px", fontSize: 12, color: C.danger, marginBottom: 10,
                }}>⚠ {p.observacion}</div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {p.items?.map((it, i) => (
                  <div key={i} style={{
                    display: "flex", justifyContent: "space-between",
                    fontSize: 13, padding: "5px 0",
                    borderBottom: i < p.items.length - 1 ? `1px solid ${C.border}` : "none",
                  }}>
                    <span>{it.cantidad}× {it.plato_nombre}</span>
                    <span style={{ color: C.accent }}>${(it.precio * it.cantidad).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: C.accent }}>
                  ${p.items?.reduce((s, i) => s + i.precio * i.cantidad, 0).toLocaleString()}
                </span>
              </div>
            </Card>
          ))
        }
      </div>
    </div>
  );
}

// ── TAB: FACTURACIÓN ──────────────────────────────────────────────────
function TabFacturacion({ pedidos, facturas, onRefresh }) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ id_pedido: "", id_metodo_pago: "1", propina: 0, iva_porcentaje: 19 });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  const METODOS = [
    { id: "1", label: "Efectivo" },
    { id: "2", label: "Tarjeta débito" },
    { id: "3", label: "Tarjeta crédito" },
    { id: "4", label: "App móvil" },
  ];

  const pedidosListos = pedidos.filter(p => p.estado === "listo");

  const generarFactura = async () => {
    if (!form.id_pedido) { setError("Selecciona un pedido"); return; }
    setEnviando(true); setError("");
    try {
      await api.crearFactura({
        id_pedido: Number(form.id_pedido),
        id_metodo_pago: Number(form.id_metodo_pago),
        propina: Number(form.propina),
        iva_porcentaje: Number(form.iva_porcentaje),
      });
      setModal(false);
      setForm({ id_pedido: "", id_metodo_pago: "1", propina: 0, iva_porcentaje: 19 });
      onRefresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  const totalHoy = facturas.reduce((s, f) => s + Number(f.total), 0);
  const totalIva = facturas.reduce((s, f) => s + Number(f.iva_valor), 0);
  const totalProp = facturas.reduce((s, f) => s + Number(f.propina), 0);

  return (
    <div className="fade">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22 }}>Facturación</h2>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="ghost" onClick={onRefresh} style={{ fontSize: 12, padding: "6px 14px" }}>↻ Actualizar</Btn>
          <Btn onClick={() => setModal(true)}>+ Generar factura</Btn>
        </div>
      </div>

      {/* Resumen */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Total facturado", val: `$${totalHoy.toLocaleString()}`, color: C.success },
          { label: "IVA recaudado", val: `$${totalIva.toLocaleString()}`, color: C.info },
          { label: "Propinas", val: `$${totalProp.toLocaleString()}`, color: C.accent },
          { label: "Facturas", val: facturas.length, color: C.muted },
        ].map(s => (
          <Card key={s.label} style={{ padding: "14px 18px" }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: s.color }}>{s.val}</div>
          </Card>
        ))}
      </div>

      {/* Tabla facturas */}
      {facturas.length === 0
        ? <Card style={{ textAlign: "center", padding: 40 }}>
          <p style={{ color: C.muted }}>No hay facturas registradas hoy</p>
        </Card>
        : <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {facturas.map(f => (
            <Card key={f.id_factura} style={{ padding: "14px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <span style={{ fontFamily: "'Playfair Display', serif", color: C.accent }}>
                      Factura #{f.id_factura}
                    </span>
                    <Badge color={C.info}>{f.metodo_pago}</Badge>
                  </div>
                  <p style={{ fontSize: 12, color: C.muted }}>
                    Pedido #{f.id_pedido} · {new Date(f.fecha_emision).toLocaleString("es-CO")}
                    {f.cliente_nombre && ` · ${f.cliente_nombre}`}
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20 }}>
                    ${Number(f.total).toLocaleString()}
                  </div>
                  <p style={{ fontSize: 11, color: C.muted }}>
                    IVA: ${Number(f.iva_valor).toLocaleString()} · Prop: ${Number(f.propina).toLocaleString()}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      }

      {/* Ventana flotante generar factura */}
      {modal && (
        <DraggableWindow title="Generar factura" onClose={() => { setModal(false); setError(""); }}>
          <Select
            label="Pedido listo para facturar"
            value={form.id_pedido}
            onChange={e => setForm(f => ({ ...f, id_pedido: e.target.value }))}
          >
            <option value="">— Seleccionar pedido —</option>
            {pedidosListos.map(p => (
              <option key={p.id_pedido} value={p.id_pedido}>
                Pedido #{p.id_pedido} — Mesa {p.mesa_numero} (${p.items?.reduce((s, i) => s + i.precio * i.cantidad, 0).toLocaleString()})
              </option>
            ))}
          </Select>
          {pedidosListos.length === 0 && (
            <p style={{ fontSize: 12, color: C.muted, marginBottom: 14 }}>
              No hay pedidos marcados como "listo". El cocinero debe marcarlos antes de facturar.
            </p>
          )}
          <Select
            label="Método de pago"
            value={form.id_metodo_pago}
            onChange={e => setForm(f => ({ ...f, id_metodo_pago: e.target.value }))}
          >
            {METODOS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
          </Select>
          <Input
            label="IVA (%)"
            type="number" min="0" max="100" step="0.5"
            value={form.iva_porcentaje}
            onChange={e => setForm(f => ({ ...f, iva_porcentaje: e.target.value }))}
          />
          <Input
            label="Propina ($)"
            type="number" min="0"
            value={form.propina}
            onChange={e => setForm(f => ({ ...f, propina: e.target.value }))}
          />
          {error && (
            <div style={{
              background: C.danger + "22", border: `1px solid ${C.danger}44`,
              borderRadius: 8, padding: "8px 12px", fontSize: 12, color: C.danger, marginBottom: 14,
            }}>{error}</div>
          )}
          <Btn onClick={generarFactura} disabled={enviando || !form.id_pedido} style={{ width: "100%", justifyContent: "center" }}>
            {enviando ? <><Spinner /> Generando…</> : "Generar factura"}
          </Btn>
          <Btn variant="ghost" onClick={() => { setModal(false); setError(""); }}
            style={{ width: "100%", justifyContent: "center", marginTop: 10, fontSize: 13 }}>
            Cancelar
          </Btn>
        </DraggableWindow>
      )}
    </div>
  );
}

// ── TAB: MENÚ ─────────────────────────────────────────────────────────
function TabMenu({ menu, onRefresh, idSede }) {
  const puede = usePuede();
  const puedeGestionar = puede("crearMenu");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ id_plato: null, nombre: "", descripcion: "", precio: "", disponible: true, imagen_url: "" });
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const cats = [...new Set(menu.map(p => p.menu_nombre))];

  const abrirNuevo = () => {
    setForm({ id_plato: null, nombre: "", descripcion: "", precio: "", disponible: true, imagen_url: "" });
    setError("");
    setModal(true);
  };

  const abrirEditar = (plato) => {
    setForm({
      id_plato: plato.id_plato,
      nombre: plato.nombre || "",
      descripcion: plato.descripcion || "",
      precio: String(plato.precio || ""),
      disponible: !!plato.disponible,
      imagen_url: plato.imagen_url || "",
    });
    setError("");
    setModal(true);
  };

  const guardar = async () => {
    if (!form.nombre.trim()) {
      setError("El nombre es obligatorio");
      return;
    }
    if (form.precio === "" || isNaN(Number(form.precio)) || Number(form.precio) < 0) {
      setError("Precio válido requerido");
      return;
    }

    setGuardando(true);
    setError("");
    try {
      const payload = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || null,
        precio: Number(form.precio),
        disponible: form.disponible ? 1 : 0,
        imagen_url: form.imagen_url.trim() || null,
      };
      if (idSede) payload.id_sede = Number(idSede);

      if (form.id_plato) {
        await api.actualizarMenu(form.id_plato, payload);
      } else {
        await api.crearMenu(payload);
      }
      setModal(false);
      onRefresh();
    } catch (err) {
      setError(err.message || "Error guardando plato");
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (id) => {
    if (!window.confirm("¿Eliminar este plato del menú?")) return;
    try {
      await api.eliminarMenu(id);
      onRefresh();
    } catch (err) {
      console.error(err);
      alert(err.message || "Error eliminando plato");
    }
  };

  return (
    <div className="fade">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22 }}>Menú activo</h2>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {puedeGestionar && <Btn onClick={abrirNuevo}>+ Nuevo plato</Btn>}
          <Btn variant="ghost" onClick={onRefresh} style={{ fontSize: 12, padding: "6px 14px" }}>↻ Actualizar</Btn>
        </div>
      </div>

      {cats.map(cat => (
        <div key={cat} style={{ marginBottom: 24 }}>
          <Label>{cat.toUpperCase()}</Label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
            {menu.filter(p => p.menu_nombre === cat).map(p => (
              <Card key={p.id_plato} style={{ padding: "14px 18px" }}>
                <div style={{ display: "flex", gap: 14, marginBottom: 10, alignItems: "flex-start" }}>
                  <img
                    src={p.imagen_url || imagenesPlatos[p.id_plato] || "/img/1.png"}
                    alt={p.nombre}
                    style={{ width: 96, height: 96, objectFit: "cover", borderRadius: 12, flexShrink: 0 }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 6 }}>
                      <span style={{ fontSize: 14, flex: 1 }}>{p.nombre}</span>
                      <Badge color={p.disponible ? C.success : C.muted}>
                        {p.disponible ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                    {p.descripcion && <p style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>{p.descripcion}</p>}
                    <span style={{ color: C.accent, fontFamily: "'Playfair Display', serif", fontSize: 18 }}>
                      ${Number(p.precio).toLocaleString()}
                    </span>
                  </div>
                </div>
                {puedeGestionar && (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                    <Btn variant="ghost" onClick={() => abrirEditar(p)} style={{ padding: "6px 10px", fontSize: 12 }}>
                      Editar
                    </Btn>
                    <Btn variant="danger" onClick={() => eliminar(p.id_plato)} style={{ padding: "6px 10px", fontSize: 12 }}>
                      Borrar
                    </Btn>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      ))}

      {menu.length === 0 && (
        <Card style={{ textAlign: "center", padding: 40 }}>
          <p style={{ color: C.muted }}>No hay platos registrados en el menú activo</p>
        </Card>
      )}

      {modal && (
        <Modal title={form.id_plato ? "Editar plato" : "Agregar plato"} onClose={() => { setModal(false); setError(""); }}>
          <Input
            label="Nombre"
            value={form.nombre}
            onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
          />
          <Input
            label="Descripción"
            value={form.descripcion}
            onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
          />
          <Input
            label="Precio"
            type="number" min="0" step="0.01"
            value={form.precio}
            onChange={e => setForm(f => ({ ...f, precio: e.target.value }))}
          />
          <Input
            label="Imagen (URL)"
            type="text"
            placeholder="https://..."
            value={form.imagen_url}
            onChange={e => setForm(f => ({ ...f, imagen_url: e.target.value }))}
          />
          <label style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, fontSize: 12, color: C.muted }}>
            <input
              type="checkbox"
              checked={form.disponible}
              onChange={e => setForm(f => ({ ...f, disponible: e.target.checked }))}
            />
            Disponible
          </label>
          {form.imagen_url && (
            <div style={{ marginBottom: 14 }}>
              <Label>Previsualización</Label>
              <img src={form.imagen_url} alt="Previsualización" style={{ width: "100%", maxHeight: 180, objectFit: "cover", borderRadius: 12, border: `1px solid ${C.border}` }} />
            </div>
          )}
          {error && (
            <div style={{
              background: C.danger + "22", border: `1px solid ${C.danger}44`,
              borderRadius: 8, padding: "8px 12px", fontSize: 12, color: C.danger, marginBottom: 14,
            }}>{error}</div>
          )}
          <Btn onClick={guardar} disabled={guardando} style={{ width: "100%", justifyContent: "center" }}>
            {guardando ? <><Spinner /> Guardando…</> : form.id_plato ? "Guardar cambios" : "Crear plato"}
          </Btn>
          <Btn variant="ghost" onClick={() => { setModal(false); setError(""); }}
            style={{ width: "100%", justifyContent: "center", marginTop: 10, fontSize: 13 }}>
            Cancelar
          </Btn>
        </Modal>
      )}
    </div>
  );
}

// ── TAB: INVENTARIO ───────────────────────────────────────────────────
function TabInventario({ inventario, onRefresh }) {
  const [busqueda, setBusqueda] = useState("");
  const [editando, setEditando] = useState(null);
  const [cantidad, setCantidad] = useState("");
  const [guardando, setGuardando] = useState(false);

  const lista = inventario.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const guardar = async (id) => {
    setGuardando(true);
    try {
      await api.actualizarProducto(id, { cantidad_actual: Number(cantidad) });
      setEditando(null);
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fade">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22 }}>Inventario</h2>
        <Btn variant="ghost" onClick={onRefresh} style={{ fontSize: 12, padding: "6px 14px" }}>↻ Actualizar</Btn>
      </div>
      <input
        placeholder="🔍 Buscar producto..."
        value={busqueda} onChange={e => setBusqueda(e.target.value)}
        style={{ marginBottom: 20 }}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {lista.map(p => (
          <Card key={p.id_producto} style={{
            padding: "14px 18px",
            borderColor: p.alerta === "bajo" ? C.danger + "44" : p.alerta === "por_vencer" ? C.accent + "44" : C.border,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{p.nombre}</span>
                  {p.alerta === "bajo" && <Badge color={C.danger}>Stock bajo</Badge>}
                  {p.alerta === "por_vencer" && <Badge color={C.accent}>Por vencer</Badge>}
                </div>
                <p style={{ fontSize: 12, color: C.muted }}>
                  {p.categoria} · Proveedor: {p.proveedor || "—"}
                  {p.fecha_vencimiento && ` · Vence: ${new Date(p.fecha_vencimiento).toLocaleDateString("es-CO")}`}
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {editando === p.id_producto
                  ? <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input
                      type="number" min="0"
                      value={cantidad}
                      onChange={e => setCantidad(e.target.value)}
                      style={{ width: 80, padding: "6px 10px" }}
                      autoFocus
                    />
                    <Btn variant="success" onClick={() => guardar(p.id_producto)}
                      disabled={guardando} style={{ padding: "6px 12px", fontSize: 12 }}>
                      {guardando ? <Spinner /> : "✓"}
                    </Btn>
                    <Btn variant="ghost" onClick={() => setEditando(null)} style={{ padding: "6px 10px", fontSize: 12 }}>✕</Btn>
                  </div>
                  : <>
                    <div style={{ textAlign: "right" }}>
                      <div style={{
                        fontFamily: "'Playfair Display', serif", fontSize: 22,
                        color: p.alerta === "bajo" ? C.danger : C.text,
                      }}>
                        {p.cantidad_actual}
                      </div>
                      <p style={{ fontSize: 11, color: C.muted }}>{p.unidad_medida}</p>
                    </div>
                    <Btn variant="ghost" onClick={() => { setEditando(p.id_producto); setCantidad(p.cantidad_actual); }}
                      style={{ padding: "6px 12px", fontSize: 12 }}>Editar</Btn>
                  </>
                }
              </div>
            </div>
          </Card>
        ))}
        {lista.length === 0 && (
          <Card style={{ textAlign: "center", padding: 40 }}>
            <p style={{ color: C.muted }}>Sin resultados</p>
          </Card>
        )}
      </div>
    </div>
  );
}

// ── TAB: RESERVAS ─────────────────────────────────────────────────────
// ── TAB: RESERVAS → Componente compartido en components/shared/TabReservas.jsx


// ── Ventana flotante arrastrable ──────────────────────────────────────────────
function DraggableWindow({ title, onClose, children }) {
  const [pos, setPos] = useState({ x: window.innerWidth / 2 - 280, y: 60 });
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const onMouseDown = (e) => {
    setDragging(true);
    setOffset({ x: e.clientX - pos.x, y: e.clientY - pos.y });
  };

  useEffect(() => {
    const onMove = (e) => {
      if (!dragging) return;
      setPos({
        x: Math.max(0, Math.min(window.innerWidth - 560, e.clientX - offset.x)),
        y: Math.max(0, Math.min(window.innerHeight - 100, e.clientY - offset.y)),
      });
    };
    const onUp = () => setDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragging, offset]);

  return (
    <div style={{
      position: "fixed", left: pos.x, top: pos.y, zIndex: 300,
      width: 560, maxHeight: "85vh",
      background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: 14, boxShadow: "0 20px 60px #000a",
      display: "flex", flexDirection: "column",
    }}>
      <div
        onMouseDown={onMouseDown}
        style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "14px 20px", borderBottom: `1px solid ${C.border}`,
          cursor: dragging ? "grabbing" : "grab",
          userSelect: "none", borderRadius: "14px 14px 0 0",
          background: C.card, flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 14 }}>⠿</span>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: C.accent }}>
            {title}
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            background: C.danger + "22", color: C.danger,
            border: `1px solid ${C.danger}44`,
            borderRadius: 6, padding: "4px 10px", fontSize: 13,
          }}
        >✕</button>
      </div>
      <div style={{ overflowY: "auto", padding: 24, flex: 1 }}>
        {children}
      </div>
    </div>
  );
}

// ── DASHBOARD PRINCIPAL ───────────────────────────────────────────────
export default function AdminPage() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState("resumen");
  const [mesas, setMesas] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [menu, setMenu] = useState([]);
  const [inventario, setInventario] = useState([]);
  const [facturas, setFacturas] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [idSede, setIdSede] = useState("");
  const [cargando, setCargando] = useState(true);
  const isMultiSedeAdmin = ["super_admin", "admin_general"].includes(user?.rol);

  const cargarDatos = useCallback(async () => {
    try {
      const [m, p, mn, inv, f, r] = await Promise.all([
        api.getMesas(idSede || undefined),
        api.getPedidos(idSede || undefined),
        api.getMenu(idSede || undefined),
        api.getInventario(idSede || undefined),
        api.getFacturas(idSede || undefined),
        api.getReservas(),
      ]);
      setMesas(m);
      setPedidos(p);
      setMenu(mn);
      setInventario(inv);
      setFacturas(f);
      setReservas(r);
    } catch (err) {
      console.error("Error cargando datos:", err);
    } finally {
      setCargando(false);
    }
  }, [idSede]);

  useEffect(() => {
    cargarDatos();
    const interval = setInterval(cargarDatos, 30000);
    return () => clearInterval(interval);
  }, [cargarDatos]);

  useEffect(() => {
    if (!isMultiSedeAdmin) return;
    api.getSedes()
      .then(setSedes)
      .catch(err => console.error("Error cargando sedes:", err));
  }, [isMultiSedeAdmin]);

  if (cargando) return (
    <>
      <style>{css}</style>
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <Spinner size={32} />
          <p style={{ color: C.muted, marginTop: 16 }}>Cargando panel de administración…</p>
        </div>
      </div>
    </>
  );

  return (
    <>
      <style>{css}</style>
      <div style={{ minHeight: "100vh", background: C.bg }}>
        <Topbar user={user} logout={logout} tab={tab} setTab={setTab} />
        <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
          {isMultiSedeAdmin && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end", marginBottom: 20 }}>
              <div style={{ minWidth: 260, flex: "1 1 auto" }}>
                <Select label="Filtrar por sede" value={idSede} onChange={e => setIdSede(e.target.value)}>
                  <option value="">Todas las sedes</option>
                  {sedes.map(s => (
                    <option key={s.id_sede} value={s.id_sede}>{s.nombre}</option>
                  ))}
                </Select>
              </div>
              <Btn variant="ghost" onClick={() => setIdSede("")} style={{ whiteSpace: "nowrap" }}>
                Limpiar filtro
              </Btn>
            </div>
          )}
          {tab === "resumen" && <TabResumen mesas={mesas} pedidos={pedidos} inventario={inventario} facturas={facturas} />}
          {tab === "mesas" && <TabMesas mesas={mesas} pedidos={pedidos} onRefresh={cargarDatos} />}
          {tab === "pedidos" && <TabPedidos pedidos={pedidos} onRefresh={cargarDatos} />}
          {tab === "facturacion" && <TabFacturacion pedidos={pedidos} facturas={facturas} onRefresh={cargarDatos} />}
          {tab === "menu" && <TabMenu menu={menu} onRefresh={cargarDatos} idSede={idSede} />}
          {tab === "inventario" && <TabInventario inventario={inventario} onRefresh={cargarDatos} />}
          {tab === "reservas" && <TabReservas esAdmin={true} />}
        </div>
      </div>
    </>
  );
}
