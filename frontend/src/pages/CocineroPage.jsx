import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=DM+Sans:wght@300;400;500&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0f0e0c; color: #f0ede6; font-family: 'DM Sans', sans-serif; }
  @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
  @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:.6} }
  @keyframes spin   { to { transform: rotate(360deg); } }
  .fade  { animation: fadeUp .35s ease both; }
  .pulse { animation: pulse 1.5s ease-in-out infinite; }
  input, select {
    background: #1a1916; border: 1px solid #2e2c29; color: #f0ede6;
    font-family: 'DM Sans', sans-serif; font-size: 13px;
    border-radius: 8px; padding: 9px 12px; outline: none; width: 100%;
    transition: border-color .2s;
  }
  input:focus, select:focus { border-color: #e8a43a; }
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

const ESTADO_COLOR = { pendiente: C.accent, en_preparacion: C.info, listo: C.success, entregado: C.muted };
const ESTADO_LABEL = { pendiente: "Pendiente", en_preparacion: "En preparación", listo: "Listo", entregado: "Entregado" };
const ESTADO_NEXT = { pendiente: "en_preparacion", en_preparacion: "listo" };
const ESTADO_NEXT_LABEL = { pendiente: "Iniciar preparación", en_preparacion: "Marcar como listo" };

// ── TOPBAR ────────────────────────────────────────────────────────────
function Topbar({ user, logout, tab, setTab, pendientes }) {
  const tabs = [
    { id: "cola", label: "Cola de pedidos", icon: "🔥" },
    { id: "recetas", label: "Recetas", icon: "📖" },
    { id: "alertas", label: "Alertas stock", icon: "⚠️" },
  ];
  const { cambiarMiSede } = useAuth();
  const [sedes, setSedes] = useState([]);
  const [cambiandoSede, setCambiandoSede] = useState(false);

  useEffect(() => { api.getSedes().then(setSedes).catch(() => setSedes([])); }, []);

  const seleccionarSede = async (e) => {
    const id = e.target.value;
    if (!id || Number(id) === Number(user.id_sede)) return;
    setCambiandoSede(true);
    try {
      await cambiarMiSede(Number(id));
      window.location.reload();
    } catch (err) {
      alert(err?.message || "No se pudo cambiar la sede");
      setCambiandoSede(false);
    }
  };

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
          <span style={{ fontSize: 12, color: C.muted }}>Cocina</span>
          <select
            value={user.id_sede || ""}
            onChange={seleccionarSede}
            disabled={cambiandoSede}
            title="Selecciona la sede donde trabajas"
            style={{ width: 210, padding: "6px 10px", fontSize: 12 }}
          >
            <option value="">Selecciona sede</option>
            {sedes.map(s => <option key={s.id_sede} value={s.id_sede}>{s.nombre}</option>)}
          </select>
          {pendientes > 0 && (
            <span className="pulse" style={{
              background: C.danger, color: "#fff",
              borderRadius: "50%", width: 20, height: 20,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 700,
            }}>{pendientes}</span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Badge color={C.accent}>Cocinero</Badge>
          <span style={{ fontSize: 13, color: C.muted }}>{user.nombres}</span>
          <Btn variant="ghost" onClick={logout} style={{ padding: "5px 12px", fontSize: 11 }}>Salir</Btn>
        </div>
      </div>
      <div style={{
        background: C.surface, borderBottom: `1px solid ${C.border}`,
        padding: "0 24px", display: "flex", gap: 2,
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

// ──  el "Beep" de una alarma (Web Audio API) ───────────────────
function reproducirBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.18, 0.36].forEach(t => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = 880;
      o.type = "sine";
      g.gain.setValueAtTime(0, ctx.currentTime + t);
      g.gain.linearRampToValueAtTime(0.4, ctx.currentTime + t + 0.04);
      g.gain.linearRampToValueAtTime(0, ctx.currentTime + t + 0.22);
      o.start(ctx.currentTime + t);
      o.stop(ctx.currentTime + t + 0.25);
    });
  } catch (e) {}
}

// ── Formato MM:SS ────────────────────────────────────
function fmtTiempo(s) {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

//cuenta regresiva global para cada pedido (se reinicia al recargar la página, pero se mantiene entre cambios de estado)
const countdownStartTimes = {}; 

function useCountdown(idPedido, activo, minutos = 5) {
  const TOTAL = minutos * 60;
  const [restante, setRestante] = useState(TOTAL);
  const [alarmaVisible, setAlarmaVisible] = useState(false);
  const getStart = (id) => sessionStorage.getItem(`cd_${id}`);
  const setStart = (id) => sessionStorage.setItem(`cd_${id}`, Date.now());

  useEffect(() => {
    if (!activo) return;

    if (!countdownStartTimes[idPedido]) {
      countdownStartTimes[idPedido] = Date.now();
    }

    const calcRestante = () => {
      const transcurrido = Math.floor((Date.now() - countdownStartTimes[idPedido]) / 1000);
      return Math.max(0, TOTAL - transcurrido);
    };

    const inicial = calcRestante();
    setRestante(inicial);
    if (inicial === 0) {
      setAlarmaVisible(true);
      reproducirBeep();
      return;
    }

    const interval = setInterval(() => {
      const r = calcRestante();
      setRestante(r);
      if (r === 0) {
        clearInterval(interval);
        setAlarmaVisible(true);
        reproducirBeep();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [idPedido, activo]);

  return {
    restante,
    total: TOTAL,
    alarmaVisible,
    cerrarAlarma: () => setAlarmaVisible(false),
  };
}

// ── Animaciones inyectadas una sola vez en <head> ────
function InjectStyles() {
  useEffect(() => {
    const id = "resto-keyframes";
    if (document.getElementById(id)) return;
    const el = document.createElement("style");
    el.id = id;
    el.textContent = `
      @keyframes urgentPulse {
        from { box-shadow: 0 0 0 0 rgba(220,38,38,0); }
        to   { box-shadow: 0 0 10px 2px rgba(220,38,38,0.25); }
      }
      @keyframes alarmPop {
        from { transform: scale(0.7); opacity: 0; }
        to   { transform: scale(1);   opacity: 1; }
      }
      @keyframes shake {
        0%,100% { transform: rotate(0deg); }
        25%      { transform: rotate(-8deg); }
        75%      { transform: rotate(8deg); }
      }
      @keyframes fadeIn {
        from { opacity: 0; } to { opacity: 1; }
      }
    `;
    document.head.appendChild(el);
  }, []);
  return null;
}

// ── TabCola (componente principal) ───────────────────
function TabCola({ pedidos, onAvanzar, cargando }) {
  const [filtro, setFiltro] = useState("todos");
  const [avanzando, setAvanzando] = useState(null);

  const pedidosFilt = pedidos.filter(p =>
    filtro === "todos"
      ? p.estado !== "entregado" && p.estado !== "cancelado"
      : p.estado === filtro
  );

  const pendientes    = pedidos.filter(p => p.estado === "pendiente").length;
  const enPreparacion = pedidos.filter(p => p.estado === "en_preparacion").length;
  const listos        = pedidos.filter(p => p.estado === "listo").length;

  const avanzar = async (id, estadoActual) => {
    const siguiente = ESTADO_NEXT[estadoActual];
    if (!siguiente) return;
    setAvanzando(id);
    try {
      await api.actualizarEstado(id, siguiente);
      onAvanzar();
    } catch (err) {
      console.error(err);
    } finally {
      setAvanzando(null);
    }
  };

  if (cargando) return (
    <div style={{ textAlign: "center", padding: "60px 20px", color: C.muted }}>
      <Spinner size={24} />
    </div>
  );

  return (
    <div className="fade">
      <InjectStyles />

      {/* Contadores */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        {[
          { label: "Pendientes",     val: pendientes,    color: C.accent },
          { label: "En preparación", val: enPreparacion, color: C.info },
          { label: "Listos",         val: listos,        color: C.success },
        ].map(s => (
          <Card key={s.label} style={{ flex: 1, minWidth: 130, padding: "14px 18px" }}>
            <div style={{ fontSize: 26, fontFamily: "'Playfair Display', serif", color: s.color }}>
              {s.val}
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{s.label}</div>
          </Card>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { id: "todos",          label: "Todos activos" },
          { id: "pendiente",      label: "Pendientes" },
          { id: "en_preparacion", label: "En preparación" },
          { id: "listo",          label: "Listos" },
        ].map(f => (
          <button key={f.id} onClick={() => setFiltro(f.id)} style={{
            background: filtro === f.id ? C.accent + "22" : C.surface,
            color:      filtro === f.id ? C.accent         : C.muted,
            border:     `1px solid ${filtro === f.id ? C.accent + "66" : C.border}`,
            borderRadius: 20, padding: "5px 14px", fontSize: 12, transition: "all .15s",
          }}>{f.label}</button>
        ))}
      </div>

      {pedidosFilt.length === 0
        ? <Card style={{ textAlign: "center", padding: "40px 20px" }}>
            <p style={{ color: C.muted, fontSize: 14 }}>No hay pedidos en este estado 🎉</p>
          </Card>
        : <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {pedidosFilt.map((p, idx) => (
              <PedidoCard
                key={p.id_pedido}
                p={p}
                idx={idx}
                avanzando={avanzando}
                onAvanzar={avanzar}
              />
            ))}
          </div>
      }
    </div>
  );
}

// ── Tarjeta individual con countdown propio ──────────
function PedidoCard({ p, idx, avanzando, onAvanzar }) {
  const enPrep = p.estado === "en_preparacion";
  const { restante, total, alarmaVisible, cerrarAlarma } = useCountdown(
    p.id_pedido,
    enPrep
  );
  const pct    = (restante / total) * 100;
  const urgent = restante <= 30;

  return (
    <>
      <Card style={{
        borderColor: p.estado === "pendiente"
          ? C.accent + "55"
          : enPrep
            ? C.info + "55"
            : C.success + "55",
        animationDelay: `${idx * 0.05}s`,
      }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {p.estado === "pendiente" && (
              <span className="pulse" style={{
                width: 8, height: 8, borderRadius: "50%",
                background: C.accent, display: "inline-block",
              }} />
            )}
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: C.accent }}>
              Mesa {p.mesa_numero}
            </span>
            <Badge color={ESTADO_COLOR[p.estado]}>{ESTADO_LABEL[p.estado]}</Badge>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 11, color: C.muted }}>Pedido #{p.id_pedido}</p>
            <p style={{ fontSize: 11, color: C.muted }}>
              🕐 {new Date(p.creado_en).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
              {" · "}{p.mesero_nombre}
            </p>
          </div>
        </div>

        {/* Alergias / observación */}
        {p.observacion && (
          <div style={{
            background: C.danger + "11", border: `1px solid ${C.danger}33`,
            borderRadius: 8, padding: "8px 12px",
            marginBottom: 12, fontSize: 12, color: C.danger,
          }}>
            ⚠ {p.observacion}
          </div>
        )}

        {/* ── Cuenta regresiva ── */}
        {enPrep && (
          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            background: urgent ? C.danger + "11" : C.info + "0D",
            border: `1px solid ${urgent ? C.danger + "55" : C.info + "33"}`,
            borderRadius: 10, padding: "10px 14px", marginBottom: 14,
            transition: "all 0.3s",
            animation: urgent ? "urgentPulse 0.8s ease-in-out infinite alternate" : "none",
          }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>
              {urgent ? "🚨" : "⏳"}
            </span>
            <div>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 1 }}>
                Tiempo de preparación
              </div>
              <div style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 22, letterSpacing: 1, lineHeight: 1,
                color: urgent ? C.danger : C.info,
                transition: "color 0.3s",
              }}>
                {fmtTiempo(restante)}
              </div>
            </div>
            <div style={{
              flex: 1, height: 4,
              background: "rgba(255,255,255,0.08)",
              borderRadius: 4, overflow: "hidden",
            }}>
              <div style={{
                width: `${pct}%`, height: "100%", borderRadius: 4,
                background: urgent ? C.danger : C.info,
                transition: "width 1s linear, background 0.3s",
              }} />
            </div>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
          {p.items?.map((it, i) => (
            <div key={i} style={{
              display: "flex", justifyContent: "space-between",
              padding: "6px 10px", background: C.surface,
              borderRadius: 8, fontSize: 13,
            }}>
              <div>
                <span style={{ fontWeight: 500 }}>{it.cantidad}×</span> {it.plato_nombre}
                {it.observacion && (
                  <span style={{ fontSize: 11, color: C.muted, marginLeft: 8 }}>— {it.observacion}</span>
                )}
                {it.ingredientes_excluir?.length > 0 && (
                  <div style={{ fontSize: 11, color: C.info, marginTop: 6 }}>
                    ✖ Excluye: {it.ingredientes_excluir_nombres?.length
                      ? it.ingredientes_excluir_nombres.join(", ")
                      : it.ingredientes_excluir.join(", ")}
                  </div>
                )}
                {it.alergias_texto && (
                  <span style={{ fontSize: 11, color: C.danger, marginLeft: 8 }}>⚠ {it.alergias_texto}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Botón avanzar */}
        {ESTADO_NEXT[p.estado] && (
          <Btn
            variant={p.estado === "pendiente" ? "primary" : "success"}
            onClick={() => onAvanzar(p.id_pedido, p.estado)}
            disabled={avanzando === p.id_pedido}
            style={{ fontSize: 12 }}
          >
            {avanzando === p.id_pedido
              ? <><Spinner /> Guardando…</>
              : <>{p.estado === "pendiente" ? "🔥" : "✅"} {ESTADO_NEXT_LABEL[p.estado]}</>
            }
          </Btn>
        )}
        {p.estado === "listo" && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>✅</span>
            <span style={{ fontSize: 13, color: C.success }}>Listo para servir — esperando al mesero</span>
          </div>
        )}
      </Card>

      {alarmaVisible && (
        <div style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.65)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 999,
          animation: "fadeIn 0.3s ease",
        }}>
          <div style={{
            background: C.surface,
            border: `1.5px solid ${C.danger}99`,
            borderRadius: 18, padding: "32px 40px",
            textAlign: "center", maxWidth: 340,
            boxShadow: `0 0 40px ${C.danger}44, 0 20px 60px rgba(0,0,0,0.6)`,
            animation: "alarmPop 0.4s cubic-bezier(.175,.885,.32,1.6)",
          }}>
            <div style={{ fontSize: 44, marginBottom: 12, animation: "shake 0.5s ease infinite" }}>
              🔔
            </div>
            <div style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 18, color: C.danger, marginBottom: 8,
            }}>
              ¡Tiempo agotado!
            </div>
            <p style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>
              Se ha acabado el tiempo de preparación del plato.<br />
              Mesa {p.mesa_numero} — Pedido #{p.id_pedido}
            </p>
            <Btn
              variant="primary"
              onClick={cerrarAlarma}
              style={{ background: C.danger, borderColor: C.danger }}
            >
              Entendido
            </Btn>
          </div>
        </div>
      )}
    </>
  );
}

// ── TAB: RECETAS ──────────────────────────────────────────────────────
function TabRecetas() {
  const [recetas, setRecetas] = useState([]);
  const [recetaSel, setRecetaSel] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    // Cargar el menú para listar platos con receta
    api.getMenu()
      .then(setRecetas)
      .catch(() => setRecetas([]))
      .finally(() => setCargando(false));
  }, []);

  const [recetaDetalle, setRecetaDetalle] = useState(null);
  const [cargandoReceta, setCargandoReceta] = useState(false);

  const verReceta = async (plato) => {
    if (recetaSel?.id_plato === plato.id_plato) {
      setRecetaSel(null); setRecetaDetalle(null); return;
    }
    setRecetaSel(plato);
    setCargandoReceta(true);
    try {
      const r = await api.getReceta(plato.id_plato);
      setRecetaDetalle(r);
    } catch {
      setRecetaDetalle(null);
    } finally {
      setCargandoReceta(false);
    }
  };

  const recetasFilt = recetas.filter(r =>
    r.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  if (cargando) return (
    <div style={{ textAlign: "center", padding: "60px 20px", color: C.muted }}>
      <Spinner size={24} />
    </div>
  );

  return (
    <div className="fade">
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, marginBottom: 16 }}>
        Recetas
      </h2>
      <input
        placeholder="🔍 Buscar receta..."
        value={busqueda} onChange={e => setBusqueda(e.target.value)}
        style={{ marginBottom: 20 }}
      />

      <div style={{ display: "grid", gridTemplateColumns: recetaDetalle ? "1fr 1fr" : "repeat(auto-fill, minmax(220px,1fr))", gap: 14 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {recetasFilt.map(r => (
            <Card key={r.id_plato} onClick={() => verReceta(r)}
              style={{
                borderColor: recetaSel?.id_plato === r.id_plato ? C.accent + "66" : C.border,
                transition: "all .2s",
              }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <img
                  src={imagenesPlatos[r.id_plato] || "/img/1.png"}
                  alt={r.nombre}
                  style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 12, flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, color: C.accent, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {r.nombre}
                  </p>
                  <p style={{ fontSize: 11, color: C.muted, marginTop: 0 }}>
                    ${Number(r.precio).toLocaleString()} · {r.menu_nombre}
                  </p>
                </div>
                <span style={{ fontSize: 12, color: C.muted }}>📖</span>
              </div>
            </Card>
          ))}
        </div>

        {/* Detalle receta */}
        {recetaSel && (
          <Card style={{ borderColor: C.accent + "44" }} className="fade">
            <div style={{ display: "flex", gap: 16, marginBottom: 16, alignItems: "flex-start" }}>
              <img
                src={imagenesPlatos[recetaSel.id_plato] || "/img/1.png"}
                alt={recetaSel.nombre}
                style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 16, flexShrink: 0 }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 16 }}>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: C.accent, margin: 0 }}>
                    {recetaSel.nombre}
                  </h3>
                  <Btn variant="ghost" onClick={() => { setRecetaSel(null); setRecetaDetalle(null); }} style={{ padding: "4px 10px", fontSize: 11 }}>✕</Btn>
                </div>
                <p style={{ fontSize: 12, color: C.muted, marginTop: 8 }}>
                  ${Number(recetaSel.precio).toLocaleString()} · {recetaSel.menu_nombre}
                </p>
              </div>
            </div>

            {cargandoReceta
              ? <div style={{ textAlign: "center", padding: 30 }}><Spinner size={20} /></div>
              : recetaDetalle
                ? <>
                  <p style={{ fontSize: 12, color: C.muted, marginBottom: 16 }}>
                    🕐 Tiempo de preparación: {recetaDetalle.tiempo_minutos} minutos
                  </p>

                  <p style={{ fontSize: 11, color: C.muted, letterSpacing: .8, marginBottom: 10 }}>INGREDIENTES</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
                    {recetaDetalle.ingredientes?.map((ing, i) => (
                      <div key={i} style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "7px 12px", background: C.surface, borderRadius: 8,
                        border: `1px solid ${ing.stock_actual <= 2 ? C.danger + "44" : C.border}`,
                      }}>
                        <span style={{ fontSize: 13 }}>{ing.ingrediente}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 12, color: C.accent }}>
                            {ing.cantidad_requerida} {ing.unidad_medida}
                          </span>
                          {ing.stock_actual <= 2 && (
                            <Badge color={C.danger}>stock bajo</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <p style={{ fontSize: 11, color: C.muted, letterSpacing: .8, marginBottom: 10 }}>PREPARACIÓN</p>
                  <div style={{ fontSize: 13, lineHeight: 1.7, color: C.text, whiteSpace: "pre-line" }}>
                    {recetaDetalle.modo_preparacion}
                  </div>
                </>
                : <p style={{ color: C.muted, fontSize: 13 }}>Este plato no tiene receta registrada aún.</p>
            }
          </Card>
        )}
      </div>
    </div>
  );
}

// ── TAB: ALERTAS STOCK ────────────────────────────────────────────────
function TabAlertas() {
  const [inventario, setInventario] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api.getInventario()
      .then(data => setInventario(data.filter(p => p.alerta !== "ok")))
      .catch(() => setInventario([]))
      .finally(() => setCargando(false));
  }, []);

  if (cargando) return (
    <div style={{ textAlign: "center", padding: "60px 20px", color: C.muted }}>
      <Spinner size={24} />
    </div>
  );

  return (
    <div className="fade">
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, marginBottom: 6 }}>
        Alertas de stock
      </h2>
      <p style={{ color: C.muted, fontSize: 13, marginBottom: 24 }}>
        Ingredientes con stock bajo o próximos a vencer
      </p>

      {inventario.length === 0
        ? <Card style={{ textAlign: "center", padding: "40px 20px" }}>
          <p style={{ color: C.success, fontSize: 14 }}>✅ Todo el inventario está en buen estado</p>
        </Card>
        : <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {inventario.map((a, i) => (
            <Card key={i} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              borderColor: a.alerta === "bajo" ? C.danger + "55" : C.accent + "44",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 8, flexShrink: 0,
                  background: a.alerta === "bajo" ? C.danger + "22" : C.accent + "22",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18,
                }}>
                  {a.alerta === "bajo" ? "🔴" : "🟡"}
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 500 }}>{a.nombre}</p>
                  <p style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                    {a.alerta === "bajo" ? "Stock bajo" : "Próximo a vencer"} · Avisar al administrador
                    {a.fecha_vencimiento && ` · Vence: ${new Date(a.fecha_vencimiento).toLocaleDateString("es-CO")}`}
                  </p>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{
                  fontFamily: "'Playfair Display', serif", fontSize: 22,
                  color: a.alerta === "bajo" ? C.danger : C.accent,
                }}>
                  {a.cantidad_actual}
                </p>
                <p style={{ fontSize: 11, color: C.muted }}>{a.unidad_medida} restantes</p>
              </div>
            </Card>
          ))}
        </div>
      }

      <Card style={{ marginTop: 20, borderColor: C.info + "44", padding: "14px 18px" }}>
        <p style={{ fontSize: 13, color: C.info }}>
          ℹ Para solicitar reabastecimiento, comunícate con el administrador del punto.
        </p>
      </Card>
    </div>
  );
}

// ── DASHBOARD PRINCIPAL ───────────────────────────────────────────────
export default function CocineroPage() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState("cola");
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargarPedidos = useCallback(async () => {
    try {
      const p = await api.getPedidos();
      setPedidos(p);
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarPedidos();
    // Refresca cada 10 segundos
    const interval = setInterval(cargarPedidos, 10000);
    return () => clearInterval(interval);
  }, [cargarPedidos]);

  const pendientes = pedidos.filter(p => p.estado === "pendiente").length;

  return (
    <>
      <style>{css}</style>
      <div style={{ minHeight: "100vh", background: C.bg }}>
        <Topbar user={user} logout={logout} tab={tab} setTab={setTab} pendientes={pendientes} />
        <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
          {tab === "cola" && <TabCola pedidos={pedidos} onAvanzar={cargarPedidos} cargando={cargando} />}
          {tab === "recetas" && <TabRecetas />}
          {tab === "alertas" && <TabAlertas />}
        </div>
      </div>
    </>
  );
}
