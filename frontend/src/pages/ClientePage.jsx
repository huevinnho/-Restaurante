import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import TabReservas from "../components/shared/TabReservas";
import MiniCalendar from "../components/shared/MiniCalendarComponent";
import ModalPago from "../components/shared/ModalPago";


const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=DM+Sans:wght@300;400;500&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0f0e0c; color: #f0ede6; font-family: 'DM Sans', sans-serif; }
  @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
  @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:.6} }
  @keyframes spin   { to { transform: rotate(360deg); } }
  .fade  { animation: fadeUp .35s ease both; }
  .pulse { animation: pulse 1.5s ease-in-out infinite; }
  input, select, textarea {
    background: #1a1916; border: 1px solid #2e2c29; color: #f0ede6;
    font-family: 'DM Sans', sans-serif; font-size: 13px;
    border-radius: 8px; padding: 9px 12px; outline: none; width: 100%;
    transition: border-color .2s;
  }
  input:focus, select:focus, textarea:focus { border-color: #e8a43a; }
  input:disabled, select:disabled, textarea:disabled { opacity: .55; cursor: not-allowed; }
  textarea { resize: vertical; min-height: 72px; }
  button { cursor: pointer; font-family: 'DM Sans', sans-serif; border: none; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-thumb { background: #2e2c29; border-radius: 2px; }
`;

const C = {
  bg: "#0f0e0c", surface: "#1a1916", card: "#232220",
  border: "#2e2c29", accent: "#e8a43a", muted: "#6b6a66",
  text: "#f0ede6", danger: "#e05c4b", success: "#4caf7d", info: "#4a9edd",
};

const parseDate = (value) => {
  if (!value) return null;
  const text = String(value).trim();
  const candidate = new Date(text.length === 10 ? `${text}T12:00:00` : text);
  return isNaN(candidate) ? null : candidate;
};

const formatDateYMD = (value) => {
  const fecha = parseDate(value);
  return fecha ? fecha.toLocaleDateString("es-CO") : "";
};

const ESTADO_PEDIDO_COLOR = {
  pendiente: C.accent, en_preparacion: C.info,
  listo: C.success, entregado: C.muted, cancelado: C.danger,
};
const ESTADO_PEDIDO_LABEL = {
  pendiente: "Pendiente", en_preparacion: "En preparación",
  listo: "¡Listo!", entregado: "Entregado", cancelado: "Cancelado",
};
const ESTADO_PEDIDO_ICON = {
  pendiente: "🕐", en_preparacion: "🔥",
  listo: "✅", entregado: "🏁", cancelado: "❌",
};
const PASOS_PEDIDO = ["pendiente", "en_preparacion", "listo", "entregado"];

const ESTADO_RESERVA_COLOR = {
  activa: C.success, cancelada: C.danger, completada: C.muted,
};
const ESTADO_RESERVA_LABEL = {
  activa: "Activa", cancelada: "Cancelada", completada: "Completada",
};

const Card = ({ children, style = {}, onClick }) => (
  <div onClick={onClick} style={{
    background: C.card, border: `1px solid ${C.border}`,
    borderRadius: 12, padding: 18, ...style,
    cursor: onClick ? "pointer" : "default",
  }}>{children}</div>
);

const Badge = ({ color, children }) => (
  <span style={{
    background: color + "22", color,
    border: `1px solid ${color}44`,
    borderRadius: 20, padding: "2px 10px",
    fontSize: 11, fontWeight: 500, whiteSpace: "nowrap",
  }}>{children}</span>
);

const Btn = ({ children, onClick, variant = "primary", style = {}, disabled }) => {
  const v = {
    primary: { background: C.accent, color: "#0f0e0c" },
    ghost: { background: "transparent", color: C.muted, border: `1px solid ${C.border}` },
    success: { background: C.success + "22", color: C.success, border: `1px solid ${C.success}44` },
    info: { background: C.info + "22", color: C.info, border: `1px solid ${C.info}44` },
    danger: { background: C.danger + "22", color: C.danger, border: `1px solid ${C.danger}44` },
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

const Spinner = ({ size = 14 }) => (
  <span style={{
    display: "inline-block", width: size, height: size,
    border: "2px solid currentColor", borderTopColor: "transparent",
    borderRadius: "50%", animation: "spin .7s linear infinite",
  }} />
);

const Label = ({ children }) => (
  <p style={{ fontSize: 11, color: C.muted, letterSpacing: .8, marginBottom: 6 }}>
    {children}
  </p>
);

const AlertBox = ({ color, children }) => (
  <div style={{
    background: color + "11", border: `1px solid ${color}33`,
    borderRadius: 8, padding: "10px 14px", fontSize: 13, color,
  }}>{children}</div>
);

const CenteredSpinner = () => (
  <div style={{ textAlign: "center", padding: "60px 20px", color: C.muted }}>
    <Spinner size={24} />
  </div>
);

function Topbar({ user, logout, tab, setTab, pedidosActivos }) {
  const tabs = [
    { id: "menu", label: "Menú", icon: "🍽" },
    { id: "pedidos", label: "Mis pedidos", icon: "📋" },
    { id: "reservas", label: "Reservas", icon: "📅" },
    { id: "historial", label: "Facturas", icon: "🧾" },
    { id: "encuestas", label: "Opiniones", icon: "⭐" },
    { id: "perfil", label: "Mi perfil", icon: "👤" },
    
  ];

  return (
    <div style={{ position: "sticky", top: 0, zIndex: 100 }}>
      <div style={{
        background: C.surface, borderBottom: `1px solid ${C.border}`,
        padding: "0 24px", display: "flex", alignItems: "center",
        justifyContent: "space-between", height: 54,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 20 }}>🍽</span>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, color: C.accent }}>
            Restaurante
          </span>
          <span style={{ color: C.border }}>|</span>
          <span style={{ fontSize: 12, color: C.muted }}>Portal del cliente</span>
          {pedidosActivos > 0 && (
            <span className="pulse" style={{
              background: C.info, color: "#fff",
              borderRadius: "50%", width: 20, height: 20,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 700,
            }}>{pedidosActivos}</span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Badge color={C.success}>Cliente</Badge>
          <span style={{ fontSize: 13, color: C.muted }}>{user?.nombres}</span>
          <Btn variant="ghost" onClick={logout} style={{ padding: "5px 12px", fontSize: 11 }}>Salir</Btn>
        </div>
      </div>
      <div style={{
        background: C.surface, borderBottom: `1px solid ${C.border}`,
        padding: "0 24px", display: "flex", gap: 2, overflowX: "auto",
      }}>
        {tabs.map(t => (
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

// ─────────────────────────────────────────────────────────────────────────────
// REEMPLAZA la función TabMenu() en ClientePage.jsx
// Pega este código donde está la función TabMenu actual.
// ─────────────────────────────────────────────────────────────────────────────

const ID_MESERO_PREDETERMINADO = 1;

function TabMenu() {
  // ── Catálogo ──────────────────────────────────────────────────────────────
  const [menu, setMenu] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [mesas, setMesas] = useState([]);
  const [recetasCache, setRecetasCache] = useState({});

  // ── Filtros ───────────────────────────────────────────────────────────────
  const [catActiva, setCatActiva] = useState("todas");
  const [busqueda, setBusqueda] = useState("");

  // ── Selección mesa ────────────────────────────────────────────────────────
  const [idSede, setIdSede] = useState("");
  const [mesaSel, setMesaSel] = useState(null);

  // ── Carrito ───────────────────────────────────────────────────────────────
  const [items, setItems] = useState([]);
  const [obs, setObs] = useState({});
  const [alergias, setAlergias] = useState([]);

  // ── UI ────────────────────────────────────────────────────────────────────
  const [platoSel, setPlatoSel] = useState(null);   // detalle al hacer clic
  const [carritoAbierto, setCarritoAbierto] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState("");

  const ALERGIAS_OPTS = ["Gluten", "Lactosa", "Mariscos", "Nueces", "Huevo"];

  // ── Carga inicial ─────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([api.getMenu(), api.getSedes()])
      .then(([m, s]) => {
        setMenu(m || []);
        setCategorias([...new Set((m || []).map(p => p.menu_nombre))]);
        setSedes(s || []);
      })
      .catch(() => setError("No se pudo cargar el menú."))
      .finally(() => setCargando(false));
  }, []);

  // Mesas disponibles al cambiar sede
  useEffect(() => {
    if (!idSede) { setMesas([]); setMesaSel(null); return; }
    api.getMesas(idSede)
      .then(data => setMesas((data || []).filter(m => m.disponible)))
      .catch(() => setMesas([]));
    setMesaSel(null);
  }, [idSede]);

  // ── Receta ────────────────────────────────────────────────────────────────
  const loadReceta = async (id_plato) => {
    if (Object.prototype.hasOwnProperty.call(recetasCache, id_plato)) return recetasCache[id_plato];
    try {
      const r = await api.getReceta(id_plato);
      setRecetasCache(p => ({ ...p, [id_plato]: r }));
      return r;
    } catch {
      setRecetasCache(p => ({ ...p, [id_plato]: null }));
      return null;
    }
  };

  // ── Carrito helpers ───────────────────────────────────────────────────────
  const agregar = async (plato) => {
    await loadReceta(plato.id_plato);
    setItems(prev => {
      const ex = prev.find(i => i.id_plato === plato.id_plato);
      if (ex) return prev.map(i => i.id_plato === plato.id_plato ? { ...i, cantidad: i.cantidad + 1 } : i);
      return [...prev, { ...plato, cantidad: 1, ingredientes_excluir: [] }];
    });
  };

  const quitar = (id) =>
    setItems(prev =>
      prev.map(i => i.id_plato === id ? { ...i, cantidad: i.cantidad - 1 } : i)
        .filter(i => i.cantidad > 0)
    );

  const toggleExclusion = (id_plato, id_producto) => {
    setItems(prev => prev.map(i => {
      if (i.id_plato !== id_plato) return i;
      const s = new Set(i.ingredientes_excluir || []);
      s.has(id_producto) ? s.delete(id_producto) : s.add(id_producto);
      return { ...i, ingredientes_excluir: [...s] };
    }));
  };

  const totalItems = items.reduce((s, i) => s + i.cantidad, 0);
  const total = items.reduce((s, i) => s + i.precio * i.cantidad, 0);

  // ── Enviar pedido ─────────────────────────────────────────────────────────
  const enviar = async () => {
    if (!mesaSel || items.length === 0) return;
    setEnviando(true);
    setError("");
    try {
      await api.crearPedido({
        id_mesa: mesaSel.id_mesa,
         id_sede: Number(idSede),  
        id_mesero: ID_MESERO_PREDETERMINADO,
        observacion: alergias.length ? `Alergias: ${alergias.join(", ")}` : null,
        items: items.map(i => ({
          id_plato: i.id_plato,
          cantidad: i.cantidad,
          observacion: obs[i.id_plato] || null,
          alergias_texto: alergias.length ? alergias.join(", ") : null,
          ingredientes_excluir: i.ingredientes_excluir || [],
        })),
      });
      setEnviado(true);
      setTimeout(() => {
        setItems([]); setAlergias([]); setMesaSel(null);
        setObs({}); setBusqueda(""); setEnviado(false);
        setCarritoAbierto(false); setIdSede("");
      }, 3000);
    } catch (err) {
      setError(err?.message || "Error al enviar el pedido.");
    } finally {
      setEnviando(false);
    }
  };

  // ── Derivados ─────────────────────────────────────────────────────────────
  const platosFilt = menu.filter(p => {
    const enCat = catActiva === "todas" || p.menu_nombre === catActiva;
    const enBus = p.nombre.toLowerCase().includes(busqueda.toLowerCase());
    return enCat && enBus && p.disponible !== false;
  });

  if (cargando) return <CenteredSpinner />;

  // ── Pantalla de éxito ─────────────────────────────────────────────────────
  if (enviado) return (
    <div className="fade" style={{ textAlign: "center", padding: "80px 20px" }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, color: C.success, marginBottom: 8 }}>
        ¡Pedido enviado a cocina!
      </h2>
      <p style={{ color: C.muted, fontSize: 14 }}>
        Mesa {mesaSel?.numero} · {items.length} producto{items.length !== 1 ? "s" : ""}
      </p>
    </div>
  );

  return (
    <div className="fade">
      {/* ── Encabezado ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, marginBottom: 4 }}>
            Nuestra carta
          </h2>
          <p style={{ color: C.muted, fontSize: 13 }}>
            Agrega platos al carrito y haz tu pedido directamente.
          </p>
        </div>

        {/* Botón carrito flotante */}
        <button
          onClick={() => setCarritoAbierto(true)}
          style={{
            position: "relative", background: C.accent, color: "#0f0e0c",
            border: "none", borderRadius: 12, padding: "10px 18px",
            fontSize: 14, fontWeight: 600, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 8, flexShrink: 0,
          }}
        >
          🛒 Carrito
          {totalItems > 0 && (
            <span style={{
              position: "absolute", top: -8, right: -8,
              background: C.danger, color: "#fff",
              borderRadius: "50%", width: 20, height: 20,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 700,
            }}>{totalItems}</span>
          )}
        </button>
      </div>

      {/* ── Búsqueda + categorías ── */}
      <input
        placeholder="🔍 Buscar plato..."
        value={busqueda}
        onChange={e => { setBusqueda(e.target.value); setCatActiva("todas"); }}
        style={{ marginBottom: 14 }}
      />

      <div style={{ display: "flex", gap: 8, marginBottom: 22, flexWrap: "wrap" }}>
        {["todas", ...categorias].map(c => (
          <button key={c} onClick={() => { setCatActiva(c); setBusqueda(""); }} style={{
            background: catActiva === c ? C.accent + "22" : C.surface,
            color: catActiva === c ? C.accent : C.muted,
            border: `1px solid ${catActiva === c ? C.accent + "66" : C.border}`,
            borderRadius: 20, padding: "5px 14px", fontSize: 12,
            transition: "all .15s", cursor: "pointer",
          }}>{c === "todas" ? "Todos" : c}</button>
        ))}
      </div>

      {/* ── Grid de platos ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: platoSel ? "1fr 300px" : "repeat(auto-fill, minmax(210px, 1fr))",
        gap: 16, alignItems: "start",
      }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
          {platosFilt.map((p, i) => {
            const enPedido = items.find(i => i.id_plato === p.id_plato);
            return (
              <Card key={p.id_plato}
                style={{
                  animationDelay: `${i * 0.04}s`,
                  borderColor: enPedido ? C.accent + "66" : C.border,
                  transition: "border-color .2s", padding: 0, overflow: "hidden",
                }}>
                {/* Imagen */}
                <div style={{ position: "relative" }}>
                  <img
                    src={imagenesPlatos[p.id_plato] || "/img/1.png"}
                    alt={p.nombre}
                    onClick={() => setPlatoSel(platoSel?.id_plato === p.id_plato ? null : p)}
                    style={{
                      width: "100%", height: 140, objectFit: "cover",
                      display: "block", cursor: "pointer",
                    }}
                  />
                  {enPedido && (
                    <span style={{
                      position: "absolute", top: 8, right: 8,
                      background: C.accent, color: "#0f0e0c",
                      borderRadius: "50%", width: 24, height: 24,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 700,
                    }}>{enPedido.cantidad}</span>
                  )}
                </div>

                {/* Info */}
                <div style={{ padding: 12 }}>
                  <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, color: C.accent, marginBottom: 4 }}>
                    {p.nombre}
                  </p>
                  {p.descripcion && (
                    <p style={{ fontSize: 11, color: C.muted, marginBottom: 10, lineHeight: 1.5 }}>
                      {p.descripcion.length > 60 ? p.descripcion.slice(0, 60) + "…" : p.descripcion}
                    </p>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: C.text }}>
                      ${Number(p.precio).toLocaleString("es-CO")}
                    </span>

                    {enPedido ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <button onClick={() => quitar(p.id_plato)} style={{
                          background: C.danger + "22", color: C.danger,
                          border: `1px solid ${C.danger}44`, borderRadius: 6,
                          width: 24, height: 24, cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15,
                        }}>−</button>
                        <span style={{ fontSize: 13, minWidth: 14, textAlign: "center" }}>{enPedido.cantidad}</span>
                        <button onClick={() => agregar(p)} style={{
                          background: C.success + "22", color: C.success,
                          border: `1px solid ${C.success}44`, borderRadius: 6,
                          width: 24, height: 24, cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15,
                        }}>+</button>
                      </div>
                    ) : (
                      <button onClick={() => agregar(p)} style={{
                        background: C.accent, color: "#0f0e0c",
                        border: "none", borderRadius: 8,
                        padding: "5px 12px", fontSize: 12, fontWeight: 600,
                        cursor: "pointer",
                      }}>+ Agregar</button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}

          {platosFilt.length === 0 && (
            <Card style={{ gridColumn: "1/-1", textAlign: "center", padding: "40px 20px" }}>
              <p style={{ color: C.muted }}>No hay platos que coincidan</p>
            </Card>
          )}
        </div>

        {/* Panel detalle plato */}
        {platoSel && (
          <Card style={{ borderColor: C.accent + "44", position: "sticky", top: 120 }} className="fade">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 12 }}>
              <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: C.accent }}>
                {platoSel.nombre}
              </p>
              <Btn variant="ghost" onClick={() => setPlatoSel(null)} style={{ padding: "3px 8px", fontSize: 11 }}>✕</Btn>
            </div>
            <img
              src={imagenesPlatos[platoSel.id_plato] || "/img/1.png"}
              alt={platoSel.nombre}
              style={{ width: "100%", height: 140, objectFit: "cover", borderRadius: 10, marginBottom: 10 }}
            />
            {platoSel.descripcion && (
              <p style={{ fontSize: 13, color: C.text, lineHeight: 1.7, marginBottom: 14 }}>
                {platoSel.descripcion}
              </p>
            )}
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              paddingTop: 12, borderTop: `1px solid ${C.border}`, marginBottom: 12,
            }}>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: C.accent }}>
                ${Number(platoSel.precio).toLocaleString("es-CO")}
              </span>
              <Badge color={C.success}>Disponible</Badge>
            </div>
            <button onClick={() => { agregar(platoSel); setPlatoSel(null); }} style={{
              width: "100%", background: C.accent, color: "#0f0e0c",
              border: "none", borderRadius: 8, padding: "9px 0",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}>+ Agregar al pedido</button>
          </Card>
        )}
      </div>

      {/* ── Drawer / modal del carrito ── */}
      {carritoAbierto && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
          zIndex: 3000, display: "flex", justifyContent: "flex-end",
          backdropFilter: "blur(3px)",
        }}
          onClick={e => { if (e.target === e.currentTarget) setCarritoAbierto(false); }}
        >
          <div style={{
            width: "100%", maxWidth: 440, background: C.bg,
            borderLeft: `1px solid ${C.border}`, height: "100%",
            overflowY: "auto", padding: 24, animation: "fadeUp .25s ease",
          }}>
            {/* Header carrito */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: C.accent }}>
                🛒 Tu pedido
              </h3>
              <button onClick={() => setCarritoAbierto(false)} style={{
                background: "transparent", border: "none", color: C.muted,
                fontSize: 24, cursor: "pointer",
              }}>×</button>
            </div>

            {/* Sede */}
            <div style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 11, color: C.muted, letterSpacing: .8, marginBottom: 6 }}>SEDE</p>
              <select
                value={idSede}
                onChange={e => setIdSede(e.target.value)}
                style={{
                  background: C.surface, border: `1px solid ${C.border}`,
                  color: C.text, borderRadius: 8, padding: "8px 12px",
                  fontSize: 13, width: "100%", outline: "none",
                }}
              >
                <option value="">Seleccionar sede</option>
                {sedes.map(s => (
                  <option key={s.id_sede} value={s.id_sede}>{s.nombre}</option>
                ))}
              </select>
            </div>

            {/* Mesas */}
            {idSede && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 11, color: C.muted, letterSpacing: .8, marginBottom: 8 }}>MESA</p>
                {mesas.length === 0
                  ? <p style={{ fontSize: 12, color: C.muted }}>Sin mesas disponibles</p>
                  : <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {mesas.map(m => (
                      <button key={m.id_mesa} onClick={() => setMesaSel(m)} style={{
                        background: mesaSel?.id_mesa === m.id_mesa ? C.accent : C.surface,
                        color: mesaSel?.id_mesa === m.id_mesa ? "#0f0e0c" : C.muted,
                        border: `1px solid ${mesaSel?.id_mesa === m.id_mesa ? C.accent : C.border}`,
                        borderRadius: 8, padding: "6px 12px", fontSize: 12,
                        transition: "all .15s", cursor: "pointer",
                      }}>Mesa {m.numero} · {m.capacidad}p</button>
                    ))}
                  </div>
                }
              </div>
            )}

            {/* Alergias */}
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 11, color: C.muted, letterSpacing: .8, marginBottom: 8 }}>ALERGIAS</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {ALERGIAS_OPTS.map(a => (
                  <button key={a} onClick={() => setAlergias(prev =>
                    prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]
                  )} style={{
                    background: alergias.includes(a) ? C.danger + "22" : C.surface,
                    color: alergias.includes(a) ? C.danger : C.muted,
                    border: `1px solid ${alergias.includes(a) ? C.danger + "66" : C.border}`,
                    borderRadius: 20, padding: "4px 12px", fontSize: 11,
                    transition: "all .15s", cursor: "pointer",
                  }}>{a}</button>
                ))}
              </div>
            </div>

            <div style={{ height: 1, background: C.border, margin: "16px 0" }} />

            {/* Items */}
            {items.length === 0
              ? <p style={{ fontSize: 13, color: C.muted, textAlign: "center", padding: "24px 0" }}>
                Aún no has agregado platos
              </p>
              : items.map(it => (
                <div key={it.id_plato} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, flex: 1 }}>{it.nombre}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <button onClick={() => quitar(it.id_plato)} style={{
                        background: C.danger + "22", color: C.danger,
                        border: `1px solid ${C.danger}44`, borderRadius: 6,
                        width: 22, height: 22, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
                      }}>−</button>
                      <span style={{ fontSize: 13, minWidth: 14, textAlign: "center" }}>{it.cantidad}</span>
                      <button onClick={() => agregar(it)} style={{
                        background: C.success + "22", color: C.success,
                        border: `1px solid ${C.success}44`, borderRadius: 6,
                        width: 22, height: 22, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
                      }}>+</button>
                    </div>
                    <span style={{ color: C.accent, fontSize: 13, marginLeft: 8, minWidth: 60, textAlign: "right" }}>
                      ${(it.precio * it.cantidad).toLocaleString("es-CO")}
                    </span>
                  </div>

                  {/* Excluir ingredientes */}
                  {recetasCache[it.id_plato]?.ingredientes?.length > 0 && (
                    <div style={{ marginTop: 8, padding: "8px 10px", background: "#11100e", borderRadius: 10 }}>
                      <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>Excluir ingredientes</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                        {recetasCache[it.id_plato].ingredientes.map(ing => {
                          const excluido = it.ingredientes_excluir?.includes(ing.id_producto);
                          return (
                            <button key={ing.id_producto}
                              onClick={() => toggleExclusion(it.id_plato, ing.id_producto)}
                              style={{
                                background: excluido ? C.danger + "22" : C.surface,
                                color: excluido ? C.danger : C.muted,
                                border: `1px solid ${excluido ? C.danger + "44" : C.border}`,
                                borderRadius: 999, padding: "3px 10px", fontSize: 11, cursor: "pointer",
                              }}
                            >{excluido ? "Sin " : "Con "}{ing.ingrediente}</button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Observación */}
                  <input
                    placeholder="Observación específica..."
                    value={obs[it.id_plato] || ""}
                    onChange={e => setObs(p => ({ ...p, [it.id_plato]: e.target.value }))}
                    style={{
                      marginTop: 6, padding: "5px 10px", fontSize: 11,
                      background: C.surface, border: `1px solid ${C.border}`,
                      borderRadius: 8, color: C.text, width: "100%", outline: "none",
                    }}
                  />
                </div>
              ))
            }

            {/* Total */}
            {items.length > 0 && (
              <>
                <div style={{ height: 1, background: C.border, margin: "16px 0" }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <span style={{ color: C.muted, fontSize: 13 }}>Total estimado</span>
                  <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: C.accent }}>
                    ${total.toLocaleString("es-CO")}
                  </span>
                </div>
              </>
            )}

            {error && (
              <div style={{
                background: C.danger + "18", border: `1px solid ${C.danger}44`,
                borderRadius: 8, padding: "8px 12px", fontSize: 12,
                color: C.danger, marginBottom: 14,
              }}>{error}</div>
            )}

            <button
              onClick={enviar}
              disabled={!mesaSel || items.length === 0 || enviando}
              style={{
                width: "100%", padding: "12px 0", borderRadius: 8, fontSize: 14,
                fontWeight: 600,
                background: (!mesaSel || items.length === 0) ? C.border : C.accent,
                color: (!mesaSel || items.length === 0) ? C.muted : "#0f0e0c",
                border: "none",
                cursor: (!mesaSel || items.length === 0 || enviando) ? "not-allowed" : "pointer",
                opacity: enviando ? .7 : 1,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              {enviando
                ? <><Spinner /> Enviando…</>
                : "📤 Enviar a cocina"
              }
            </button>

            {(!mesaSel || items.length === 0) && (
              <p style={{ fontSize: 11, color: C.muted, textAlign: "center", marginTop: 8 }}>
                {items.length === 0 ? "Agrega platos desde el menú" : "Selecciona una sede y mesa"}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: MIS PEDIDOS
// Tablas: pedidos + pedido_detalle + facturas (si ya tiene)
// ─────────────────────────────────────────────────────────────────────────────
  function TabPedidos({ pedidos, cargando, onRecargar }) {
    const [filtro, setFiltro] = useState("activos");
    const [pedidoPago, setPedidoPago] = useState(null);

    const pedidosFilt = pedidos.filter(p =>
      filtro === "activos"
        ? !["entregado", "cancelado"].includes(p.estado)
        : ["entregado", "cancelado"].includes(p.estado)
    );

    if (cargando) return <CenteredSpinner />;

    return (
      <div className="fade">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22 }}>Mis pedidos</h2>
          <Btn variant="ghost" onClick={onRecargar} style={{ padding: "6px 14px", fontSize: 12 }}>
            🔄 Actualizar
          </Btn>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {[{ id: "activos", label: "Activos" }, { id: "historial", label: "Historial" }].map(f => (
            <button key={f.id} onClick={() => setFiltro(f.id)} style={{
              background: filtro === f.id ? C.accent + "22" : C.surface,
              color: filtro === f.id ? C.accent : C.muted,
              border: `1px solid ${filtro === f.id ? C.accent + "66" : C.border}`,
              borderRadius: 20, padding: "5px 14px", fontSize: 12, transition: "all .15s",
            }}>{f.label}</button>
          ))}
        </div>

        {pedidosFilt.length === 0
          ? <Card style={{ textAlign: "center", padding: "40px 20px" }}>
            <p style={{ color: C.muted }}>
              {filtro === "activos" ? "No tienes pedidos activos 🎉" : "Aún no tienes historial de pedidos"}
            </p>
          </Card>
          : <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {pedidosFilt.map((p, idx) => (
              <Card key={p.id_pedido} style={{
                borderColor: ESTADO_PEDIDO_COLOR[p.estado] + "55",
                animationDelay: `${idx * 0.05}s`,
              }}>
                {/* Cabecera */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {p.estado === "listo" && (
                      <span className="pulse" style={{
                        width: 8, height: 8, borderRadius: "50%",
                        background: C.success, display: "inline-block",
                      }} />
                    )}
                    <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 16 }}>
                      Pedido #{p.id_pedido}
                    </span>
                    <Badge color={ESTADO_PEDIDO_COLOR[p.estado]}>
                      {ESTADO_PEDIDO_ICON[p.estado]} {ESTADO_PEDIDO_LABEL[p.estado]}
                    </Badge>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 11, color: C.muted }}>Mesa {p.mesa_numero}</p>
                    <p style={{ fontSize: 11, color: C.muted }}>
                      🕐 {new Date(p.creado_en).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>

                {/* Barra de progreso */}
                {p.estado !== "cancelado" && (
                  <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
                    {PASOS_PEDIDO.map((e, i) => {
                      const idx = PASOS_PEDIDO.indexOf(p.estado);
                      return (
                        <div key={e} style={{ flex: 1, display: "flex", alignItems: "center", gap: 4 }}>
                          <div style={{
                            height: 4, flex: 1, borderRadius: 2,
                            background: i <= idx ? ESTADO_PEDIDO_COLOR[e] : C.border,
                            transition: "background .3s",
                          }} />
                          {i < PASOS_PEDIDO.length - 1 && (
                            <div style={{
                              width: 4, height: 4, borderRadius: "50%", flexShrink: 0,
                              background: i < idx ? ESTADO_PEDIDO_COLOR[e] : C.border,
                            }} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Aviso "listo" */}
                {p.estado === "listo" && (
                  <div style={{ marginBottom: 12 }}>
                    <AlertBox color={C.success}>
                      🎉 ¡Tu pedido está listo! El mesero vendrá a servirte en breve.
                    </AlertBox>
                  </div>
                )}

                {/* Botón pagar */}
                {p.estado === "listo" && !p.factura && (
                  <button
                    onClick={() => setPedidoPago(p)}
                    style={{
                      width: "100%", padding: "11px 0", borderRadius: 8,
                      background: C.accent, color: "#0f0e0c", border: "none",
                      fontSize: 14, fontWeight: 600, cursor: "pointer", marginBottom: 12,
                    }}
                  >
                    💳 Pagar ahora
                  </button>
                )}

                {/* Observación global del pedido */}
                {p.observacion && (
                  <div style={{ marginBottom: 10 }}>
                    <AlertBox color={C.danger}>⚠ {p.observacion}</AlertBox>
                  </div>
                )}

                {/* Items (pedido_detalle) */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
                  {p.items?.map((it, i) => (
                    <div key={i} style={{
                      display: "flex", justifyContent: "space-between",
                      padding: "7px 10px", background: C.surface, borderRadius: 8, fontSize: 13,
                    }}>
                      <div>
                        <span style={{ fontWeight: 500 }}>{it.cantidad}×</span> {it.plato_nombre}
                        {it.observacion && (
                          <span style={{ fontSize: 11, color: C.muted, marginLeft: 8 }}>
                            — {it.observacion}
                          </span>
                        )}
                        {it.alergias_texto && (
                          <span style={{ fontSize: 11, color: C.danger, marginLeft: 8 }}>
                            ⚠ {it.alergias_texto}
                          </span>
                        )}
                      </div>
                      {it.precio_unitario && (
                        <span style={{ color: C.accent, whiteSpace: "nowrap" }}>
                          ${(it.cantidad * Number(it.precio_unitario)).toLocaleString("es-CO")}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Factura (subtotal, IVA, propina, total) */}
                {p.factura && (
                  <div style={{ paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
                    {[
                      ["Subtotal", `$${Number(p.factura.subtotal).toLocaleString("es-CO")}`],
                      [`IVA (${p.factura.iva_porcentaje}%)`, `$${Number(p.factura.iva_valor).toLocaleString("es-CO")}`],
                      Number(p.factura.propina) > 0 && ["Propina", `$${Number(p.factura.propina).toLocaleString("es-CO")}`],
                    ].filter(Boolean).map(([k, v]) => (
                      <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.muted, marginBottom: 3 }}>
                        <span>{k}</span><span>{v}</span>
                      </div>
                    ))}
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>Total pagado</span>
                      <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: C.accent }}>
                        ${Number(p.factura.total).toLocaleString("es-CO")}
                      </span>
                    </div>
                  </div>
                )}

                {/* Modal de pago */}
                {pedidoPago?.id_pedido === p.id_pedido && (
                  <ModalPago
                    pedido={pedidoPago}
                    onClose={() => setPedidoPago(null)}
                    onPagado={() => { setPedidoPago(null); onRecargar(); }}
                  />
                )}
              </Card>
            ))}
          </div>
        }
      </div>
    );
  }

// ─────────────────────────────────────────────────────────────────────────────
// TAB: RESERVAS → Componente compartido en components/shared/TabReservas.jsx
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// TAB: FACTURAS
// Tabla: facturas  (subtotal, iva_porcentaje, iva_valor, propina, total,
//                   fecha_emision, id_metodo_pago → metodos_pago.nombre)
// ─────────────────────────────────────────────────────────────────────────────
function TabFacturas() {
  const [facturas, setFacturas] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api.getMisFacturas()
      .then(setFacturas)
      .catch(() => setFacturas([]))
      .finally(() => setCargando(false));
  }, []);

  if (cargando) return <CenteredSpinner />;

  const totalGastado = facturas.reduce((s, f) => s + Number(f.total), 0);

  return (
    <div className="fade">
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, marginBottom: 4 }}>Mis facturas</h2>
      <p style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>Historial de pagos de tus visitas</p>

      {facturas.length > 0 && (
        <Card style={{ marginBottom: 24, display: "flex", gap: 32, flexWrap: "wrap" }}>
          <div>
            <Label>TOTAL GASTADO</Label>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: C.accent }}>
              ${totalGastado.toLocaleString("es-CO")}
            </p>
          </div>
          <div>
            <Label>VISITAS</Label>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 26 }}>{facturas.length}</p>
          </div>
        </Card>
      )}

      {facturas.length === 0
        ? <Card style={{ textAlign: "center", padding: "40px 20px" }}>
          <p style={{ color: C.muted }}>Aún no tienes facturas registradas</p>
        </Card>
        : <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {facturas.map((f, i) => (
            <Card key={f.id_factura} style={{ animationDelay: `${i * 0.04}s` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 12 }}>
                <div>
                  <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 15 }}>
                    Factura #{f.id_factura}
                  </p>
                  <p style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                    Pedido #{f.id_pedido} · {new Date(f.fecha_emision).toLocaleDateString("es-CO", {
                      year: "numeric", month: "long", day: "numeric",
                    })}
                  </p>
                </div>
                <Badge color={C.info}>{f.metodo_pago || "—"}</Badge>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {[
                  ["Subtotal", `$${Number(f.subtotal).toLocaleString("es-CO")}`],
                  [`IVA (${f.iva_porcentaje}%)`, `$${Number(f.iva_valor).toLocaleString("es-CO")}`],
                  Number(f.propina) > 0 && ["Propina", `$${Number(f.propina).toLocaleString("es-CO")}`],
                ].filter(Boolean).map(([k, v]) => (
                  <div key={k} style={{
                    padding: "6px 10px", background: C.surface, borderRadius: 8,
                    display: "flex", justifyContent: "space-between", fontSize: 12,
                  }}>
                    <span style={{ color: C.muted }}>{k}</span>
                    <span>{v}</span>
                  </div>
                ))}
              </div>

              <div style={{
                marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.border}`,
                display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 10,
              }}>
                <span style={{ fontSize: 13, color: C.muted }}>Total pagado</span>
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: C.accent }}>
                  ${Number(f.total).toLocaleString("es-CO")}
                </span>
              </div>
            </Card>
          ))}
        </div>
      }
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: ENCUESTAS Y RESEÑAS
// Tablas: encuestas  (satisfecho_servicio BOOL, gusto_comida BOOL,
//                     tiempo_espera_adecuado BOOL, observacion, id_pedido)
//         resenas    (calificacion TINYINT 1-5, comentario, id_pedido)
// ─────────────────────────────────────────────────────────────────────────────
function TabEncuestas() {
  const [pedidosDisponibles, setPedidosDisponibles] = useState([]);
  const [encuestas, setEncuestas] = useState([]);
  const [resenas, setResenas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [subtab, setSubtab] = useState("encuesta");
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [formE, setFormE] = useState({
    id_pedido: "", satisfecho_servicio: null,
    gusto_comida: null, tiempo_espera_adecuado: null, observacion: "",
  });

  const [formR, setFormR] = useState({
    id_pedido: "", calificacion: 0, comentario: "",
  });

  const recargar = () =>
    Promise.all([
      api.getMisPedidosEntregados(),
      api.getMisEncuestas(),
      api.getMisResenas(),
    ]).then(([p, e, r]) => {
      setPedidosDisponibles(p); setEncuestas(e); setResenas(r);
    }).catch(() => { }).finally(() => setCargando(false));

  useEffect(() => { recargar(); }, []);

  const enviarEncuesta = async () => {
    setEnviando(true); setErrorMsg("");
    try {
      await api.crearEncuesta(formE);
      setExito("¡Encuesta enviada! Gracias.");
      setFormE({ id_pedido: "", satisfecho_servicio: null, gusto_comida: null, tiempo_espera_adecuado: null, observacion: "" });
      setTimeout(() => setExito(""), 4000);
      recargar();
    } catch { setErrorMsg("No se pudo enviar la encuesta."); }
    finally { setEnviando(false); }
  };

  const enviarResena = async () => {
    setEnviando(true); setErrorMsg("");
    try {
      await api.crearResena(formR);
      setExito("¡Reseña publicada! Gracias.");
      setFormR({ id_pedido: "", calificacion: 0, comentario: "" });
      setTimeout(() => setExito(""), 4000);
      recargar();
    } catch { setErrorMsg("No se pudo publicar la reseña."); }
    finally { setEnviando(false); }
  };

  const BoolBtn = ({ campo, form, setForm }) => (
    <div style={{ display: "flex", gap: 8 }}>
      {[true, false].map(v => (
        <button key={String(v)} onClick={() => setForm(p => ({ ...p, [campo]: v }))} style={{
          padding: "6px 18px", borderRadius: 8, fontSize: 13, fontWeight: 500,
          border: `1px solid ${form[campo] === v ? (v ? C.success : C.danger) + "88" : C.border}`,
          background: form[campo] === v ? (v ? C.success : C.danger) + "22" : C.surface,
          color: form[campo] === v ? (v ? C.success : C.danger) : C.muted,
          transition: "all .15s",
        }}>{v ? "Sí" : "No"}</button>
      ))}
    </div>
  );

  const Estrellas = ({ valor, onChange }) => (
    <div style={{ display: "flex", gap: 6 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} onClick={() => onChange(n)} style={{
          fontSize: 26, background: "transparent",
          filter: n <= valor ? "none" : "grayscale(1) opacity(.35)",
          transition: "filter .15s",
        }}>⭐</button>
      ))}
    </div>
  );

  if (cargando) return <CenteredSpinner />;

  return (
    <div className="fade">
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, marginBottom: 4 }}>Opiniones</h2>
      <p style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>Tu opinión nos ayuda a mejorar</p>

      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        {[
          { id: "encuesta", label: "📋 Encuesta de satisfacción" },
          { id: "resena", label: "⭐ Dejar reseña" },
          { id: "mis", label: "📄 Mis opiniones" },
        ].map(t => (
          <button key={t.id} onClick={() => { setSubtab(t.id); setExito(""); setErrorMsg(""); }} style={{
            background: subtab === t.id ? C.accent + "22" : C.surface,
            color: subtab === t.id ? C.accent : C.muted,
            border: `1px solid ${subtab === t.id ? C.accent + "66" : C.border}`,
            borderRadius: 20, padding: "5px 14px", fontSize: 12, transition: "all .15s",
          }}>{t.label}</button>
        ))}
      </div>

      {exito && <div style={{ marginBottom: 16 }}><AlertBox color={C.success}>✅ {exito}</AlertBox></div>}
      {errorMsg && <div style={{ marginBottom: 16 }}><AlertBox color={C.danger}>⚠ {errorMsg}</AlertBox></div>}

      {/* ── ENCUESTA ── */}
      {subtab === "encuesta" && (
        <Card className="fade" style={{ maxWidth: 560 }}>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, color: C.accent, marginBottom: 18 }}>
            Encuesta de satisfacción
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <Label>PEDIDO A EVALUAR</Label>
              <select value={formE.id_pedido}
                onChange={e => setFormE(p => ({ ...p, id_pedido: e.target.value }))}>
                <option value="">Seleccionar pedido</option>
                {pedidosDisponibles.map(p => (
                  <option key={p.id_pedido} value={p.id_pedido}>
                    Pedido #{p.id_pedido} — {new Date(p.creado_en).toLocaleDateString("es-CO")}
                  </option>
                ))}
              </select>
            </div>
            {[
              { k: "satisfecho_servicio", label: "¿QUEDASTE SATISFECHO CON EL SERVICIO?" },
              { k: "gusto_comida", label: "¿TE GUSTÓ LA COMIDA?" },
              { k: "tiempo_espera_adecuado", label: "¿EL TIEMPO DE ESPERA FUE ADECUADO?" },
            ].map(({ k, label }) => (
              <div key={k}>
                <Label>{label}</Label>
                <BoolBtn campo={k} form={formE} setForm={setFormE} />
              </div>
            ))}
            <div>
              <Label>OBSERVACIÓN (OPCIONAL)</Label>
              <textarea placeholder="Cuéntanos más..."
                value={formE.observacion}
                onChange={e => setFormE(p => ({ ...p, observacion: e.target.value }))} />
            </div>
          </div>
          <div style={{ marginTop: 18 }}>
            <Btn variant="primary" onClick={enviarEncuesta}
              disabled={enviando || !formE.id_pedido}>
              {enviando ? <><Spinner /> Enviando…</> : "📋 Enviar encuesta"}
            </Btn>
          </div>
        </Card>
      )}

      {/* ── RESEÑA ── */}
      {subtab === "resena" && (
        <Card className="fade" style={{ maxWidth: 560 }}>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, color: C.accent, marginBottom: 18 }}>
            Dejar una reseña
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <Label>PEDIDO A RESEÑAR</Label>
              <select value={formR.id_pedido}
                onChange={e => setFormR(p => ({ ...p, id_pedido: e.target.value }))}>
                <option value="">Seleccionar pedido</option>
                {pedidosDisponibles.map(p => (
                  <option key={p.id_pedido} value={p.id_pedido}>
                    Pedido #{p.id_pedido} — {new Date(p.creado_en).toLocaleDateString("es-CO")}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>CALIFICACIÓN (1 – 5 ESTRELLAS)</Label>
              <Estrellas valor={formR.calificacion}
                onChange={v => setFormR(p => ({ ...p, calificacion: v }))} />
            </div>
            <div>
              <Label>COMENTARIO (OPCIONAL)</Label>
              <textarea placeholder="Comparte tu experiencia..."
                value={formR.comentario}
                onChange={e => setFormR(p => ({ ...p, comentario: e.target.value }))} />
            </div>
          </div>
          <div style={{ marginTop: 18 }}>
            <Btn variant="primary" onClick={enviarResena}
              disabled={enviando || !formR.id_pedido || formR.calificacion === 0}>
              {enviando ? <><Spinner /> Publicando…</> : "⭐ Publicar reseña"}
            </Btn>
          </div>
        </Card>
      )}

      {/* ── MIS OPINIONES PREVIAS ── */}
      {subtab === "mis" && (
        <div className="fade">
          {encuestas.length === 0 && resenas.length === 0 && (
            <Card style={{ textAlign: "center", padding: "40px 20px" }}>
              <p style={{ color: C.muted }}>Aún no has dejado ninguna opinión</p>
            </Card>
          )}

          {encuestas.length > 0 && (
            <>
              <p style={{ fontSize: 11, color: C.muted, letterSpacing: .8, marginBottom: 12 }}>MIS ENCUESTAS</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                {encuestas.map(e => (
                  <Card key={e.id_encuesta}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                      <p style={{ fontSize: 13, fontWeight: 500 }}>Pedido #{e.id_pedido}</p>
                      <p style={{ fontSize: 11, color: C.muted }}>{new Date(e.fecha).toLocaleDateString("es-CO")}</p>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                      {[
                        ["Servicio", e.satisfecho_servicio],
                        ["Comida", e.gusto_comida],
                        ["Tiempo espera", e.tiempo_espera_adecuado],
                      ].map(([lbl, v]) => (
                        <div key={lbl} style={{
                          background: C.surface, borderRadius: 8, padding: "8px 12px",
                          border: `1px solid ${v === true ? C.success + "44" : v === false ? C.danger + "44" : C.border}`,
                        }}>
                          <p style={{ fontSize: 11, color: C.muted }}>{lbl}</p>
                          <p style={{ fontSize: 18, marginTop: 2 }}>
                            {v === true ? "✅" : v === false ? "❌" : "—"}
                          </p>
                        </div>
                      ))}
                    </div>
                    {e.observacion && (
                      <p style={{ fontSize: 12, color: C.muted, marginTop: 10 }}>💬 {e.observacion}</p>
                    )}
                  </Card>
                ))}
              </div>
            </>
          )}

          {resenas.length > 0 && (
            <>
              <p style={{ fontSize: 11, color: C.muted, letterSpacing: .8, marginBottom: 12 }}>MIS RESEÑAS</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {resenas.map(r => (
                  <Card key={r.id_resena}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <p style={{ fontSize: 13, fontWeight: 500 }}>Pedido #{r.id_pedido}</p>
                      <p style={{ fontSize: 11, color: C.muted }}>{new Date(r.fecha).toLocaleDateString("es-CO")}</p>
                    </div>
                    <div style={{ fontSize: 22, marginBottom: r.comentario ? 8 : 0 }}>
                      {"⭐".repeat(r.calificacion)}
                      <span style={{ fontSize: 12, color: C.muted, marginLeft: 6 }}>{r.calificacion}/5</span>
                    </div>
                    {r.comentario && (
                      <p style={{ fontSize: 13, color: C.text, lineHeight: 1.6 }}>{r.comentario}</p>
                    )}
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB: MI PERFIL
// Tabla: clientes  (nombres, apellidos, cedula [readonly], fecha_nacimiento,
//                   correo, telefono)
// Tabla: cliente_alergias + alergias  (toggle de alergias del cliente)
// ─────────────────────────────────────────────────────────────────────────────
function TabPerfil() {
  const { refreshUser } = useAuth();
  const [datos, setDatos] = useState(null);
  const [alergias, setAlergias] = useState([]);   // catálogo completo de `alergias`
  const [misAler, setMisAler] = useState([]);   // ids activos en `cliente_alergias`
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [ok, setOk] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [mostrarCalendar, setMostrarCalendar] = useState(false);

  useEffect(() => {
    Promise.all([
      api.getPerfilCliente(),
      api.getAlergias(),
      api.getMisAlergias(),
    ])
      .then(([d, a, ma]) => {
        setDatos(d); setForm(d);
        setAlergias(a);
        setMisAler(ma.map(x => x.id_alergia));
      })
      .catch(() => { })
      .finally(() => setCargando(false));
  }, []);

  const toggleAlergia = async (id) => {
    const tenia = misAler.includes(id);
    const nuevas = tenia ? misAler.filter(a => a !== id) : [...misAler, id];
    setMisAler(nuevas);
    try {
      await api.actualizarMisAlergias(nuevas);
    } catch {
      // Revertir si falla
      setMisAler(misAler);
    }
  };

  const guardar = async () => {
    setGuardando(true); setErrorMsg("");

    if (form.contrasena_actual || form.contrasena_nueva || form.contrasena_confirmar) {
      if (!form.contrasena_actual || !form.contrasena_nueva || !form.contrasena_confirmar) {
        setErrorMsg("Completa todos los campos para cambiar la contraseña.");
        setGuardando(false);
        return;
      }
      if (form.contrasena_nueva !== form.contrasena_confirmar) {
        setErrorMsg("Las nuevas contraseñas no coinciden.");
        setGuardando(false);
        return;
      }
      if (form.contrasena_nueva.length < 6) {
        setErrorMsg("La nueva contraseña debe tener al menos 6 caracteres.");
        setGuardando(false);
        return;
      }
    }

    try {
      const result = await api.actualizarPerfilCliente(form);
      if (result.token) {
        localStorage.setItem("token", result.token);
      }
      await refreshUser();
      const cleanForm = {
        ...form,
        contrasena_actual: "",
        contrasena_nueva: "",
        contrasena_confirmar: "",
      };
      setDatos(cleanForm);
      setForm(cleanForm);
      setEditando(false);
      setOk(true); setTimeout(() => setOk(false), 3000);
    } catch (err) {
      setErrorMsg(err.message || "No se pudo guardar. Intenta de nuevo.");
    } finally {
      setGuardando(false);
    }
  };

  const campo = (label, key, type = "text", readonly = false) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <Label>{label}</Label>
      <input
        type={type}
        value={form[key] || ""}
        onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
        disabled={!editando || readonly}
      />
    </div>
  );

  if (cargando) return <CenteredSpinner />;

  return (
    <div className="fade" style={{ maxWidth: 620 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22 }}>Mi perfil</h2>
        {!editando
          ? <Btn variant="info" onClick={() => setEditando(true)}>✏ Editar</Btn>
          : <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="ghost" onClick={() => { setEditando(false); setForm(datos); setErrorMsg(""); }}>Cancelar</Btn>
            <Btn variant="success" onClick={guardar} disabled={guardando}>
              {guardando ? <><Spinner /> Guardando…</> : "💾 Guardar"}
            </Btn>
          </div>
        }
      </div>

      {ok && <div style={{ marginBottom: 16 }}><AlertBox color={C.success}>✅ Perfil actualizado correctamente</AlertBox></div>}
      {errorMsg && <div style={{ marginBottom: 16 }}><AlertBox color={C.danger}>⚠ {errorMsg}</AlertBox></div>}

      {/* Datos personales */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 16,
          marginBottom: 20, paddingBottom: 16, borderBottom: `1px solid ${C.border}`,
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            background: C.accent + "22", border: `2px solid ${C.accent}44`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24,
          }}>👤</div>
          <div>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: C.accent }}>
              {datos?.nombres} {datos?.apellidos}
            </p>
            <p style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{datos?.correo}</p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {campo("NOMBRES", "nombres")}
          {campo("APELLIDOS", "apellidos")}
          {campo("CÉDULA", "cedula", "text", true /* readonly */)}

          {/* Fecha de nacimiento con calendario */}
          <div>
            <label style={{ fontSize: 12, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Fecha de nacimiento
            </label>
            <button
              type="button"
              onClick={() => setMostrarCalendar(!mostrarCalendar)}
              style={{
                width: "100%", padding: "10px 14px", marginTop: 8, border: `1px solid ${C.border}`,
                borderRadius: 6, background: C.surface, fontSize: 14, cursor: "pointer",
                textAlign: "left", color: form.fecha_nacimiento ? C.text : C.muted,
              }}
            >
              {form.fecha_nacimiento ? formatDateYMD(form.fecha_nacimiento) : "Selecciona una fecha"}
            </button>
            {mostrarCalendar && editando && (
              <div style={{ marginTop: 8, position: "relative", zIndex: 100 }}>
                <MiniCalendar
                  value={form.fecha_nacimiento}
                  onChange={(date) => {
                    setForm(p => ({ ...p, fecha_nacimiento: date }));
                    setMostrarCalendar(false);
                  }}
                  maxDate={new Date().toISOString().split("T")[0]}
                />
              </div>
            )}
          </div>

          {campo("CORREO ELECTRÓNICO", "correo", "email")}
          {campo("TELÉFONO", "telefono", "tel")}
        </div>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: C.accent, marginBottom: 4 }}>
          Cambiar contraseña
        </p>
        <p style={{ fontSize: 12, color: C.muted, marginBottom: 14 }}>
          Completa estos campos solo si deseas actualizar tu contraseña.
        </p>
        <div style={{ display: "grid", gap: 14 }}>
          {campo("Contraseña actual", "contrasena_actual", "password")}
          {campo("Nueva contraseña", "contrasena_nueva", "password")}
          {campo("Confirmar nueva contraseña", "contrasena_confirmar", "password")}
        </div>
      </Card>

      {/* Alergias — tabla cliente_alergias */}
      <Card style={{ marginBottom: 16 }}>
        <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: C.accent, marginBottom: 4 }}>
          Mis alergias
        </p>
        <p style={{ fontSize: 12, color: C.muted, marginBottom: 14 }}>
          La cocina las tendrá en cuenta al preparar tu pedido
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {alergias.map(a => {
            const activa = misAler.includes(a.id_alergia);
            return (
              <button key={a.id_alergia} onClick={() => toggleAlergia(a.id_alergia)} style={{
                padding: "7px 16px", borderRadius: 20, fontSize: 13, fontWeight: 500,
                border: `1px solid ${activa ? C.danger + "88" : C.border}`,
                background: activa ? C.danger + "22" : C.surface,
                color: activa ? C.danger : C.muted,
                transition: "all .2s",
              }}>
                {activa ? "⚠ " : ""}{a.nombre}
              </button>
            );
          })}
        </div>
      </Card>

      <Card style={{ borderColor: C.info + "33", padding: "14px 18px" }}>
        <p style={{ fontSize: 13, color: C.info }}>
          ℹ La cédula no puede modificarse. Para cambios en datos sensibles, contacta al administrador.
        </p>
      </Card>
    </div>
  );
}



// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export default function ClientePage() {
  const { user, logout, refreshUser } = useAuth();
  const [tab, setTab] = useState("menu");
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargarPedidos = useCallback(async () => {
    try {
      const p = await api.getMisPedidos();
      setPedidos(p);
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarPedidos();
    // Refresca cada 15 s para ver cambios de estado en tiempo real
    const iv = setInterval(cargarPedidos, 15000);
    return () => clearInterval(iv);
  }, [cargarPedidos]);

  const pedidosActivos = pedidos.filter(
    p => !["entregado", "cancelado"].includes(p.estado)
  ).length;

  return (
    <>
      <style>{css}</style>
      <div style={{ minHeight: "100vh", background: C.bg }}>
        <Topbar
          user={user} logout={logout}
          tab={tab} setTab={setTab}
          pedidosActivos={pedidosActivos}
        />
        <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
          {tab === "menu" && <TabMenu />}
          {tab === "pedidos" && <TabPedidos pedidos={pedidos} cargando={cargando} onRecargar={cargarPedidos} />}
          {tab === "reservas" && <TabReservas />}
          {tab === "historial" && <TabFacturas />}
          {tab === "encuestas" && <TabEncuestas />}
          {tab === "perfil" && <TabPerfil />}
        </div>
      </div>
    </>
  );
}