import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";

// ── Estilos globales (mismo patrón que CocineroPage) ─────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=DM+Sans:wght@300;400;500&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0f0e0c; color: #f0ede6; font-family: 'DM Sans', sans-serif; }
  @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
  @keyframes spin   { to { transform: rotate(360deg); } }
  @keyframes shimmer {
    0%   { background-position: -600px 0; }
    100% { background-position:  600px 0; }
  }
  .fade        { animation: fadeUp .35s ease both; }
  .skeleton    {
    background: linear-gradient(90deg, #1a1916 25%, #232220 50%, #1a1916 75%);
    background-size: 600px 100%;
    animation: shimmer 1.4s infinite;
    border-radius: 8px;
  }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-thumb { background: #2e2c29; border-radius: 2px; }
`;

const C = {
  bg: "#0f0e0c", surface: "#1a1916", card: "#232220",
  border: "#2e2c29", accent: "#e8a43a", muted: "#6b6a66",
  text: "#f0ede6", danger: "#e05c4b", success: "#4caf7d", info: "#4a9edd",
};

// ── Primitivos reutilizables ─────────────────────────────────────────
const Card = ({ children, style = {}, className = "" }) => (
  <div className={className} style={{
    background: C.card, border: `1px solid ${C.border}`,
    borderRadius: 12, padding: 18, ...style,
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
    primary: { background: C.accent,         color: "#0f0e0c" },
    ghost:   { background: "transparent",     color: C.muted,    border: `1px solid ${C.border}` },
    success: { background: C.success + "22",  color: C.success,  border: `1px solid ${C.success}44` },
    info:    { background: C.info + "22",     color: C.info,     border: `1px solid ${C.info}44` },
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

// Formatea pesos colombianos de forma compacta: 3200000 → $3.2M
const fmt = (n) => {
  if (n == null) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}k`;
  return `$${Number(n).toLocaleString("es-CO")}`;
};

const fmtPct = (n) => n != null ? `${Number(n).toFixed(1)}%` : "—";

// ── Skeleton loader ──────────────────────────────────────────────────
function SkeletonDash() {
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 88 }} />
        ))}
      </div>
      <div className="skeleton" style={{ height: 260, marginBottom: 24 }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 64 }} />
        ))}
      </div>
    </div>
  );
}

// ── Topbar ───────────────────────────────────────────────────────────
function Topbar({ user, logout }) {
  return (
    <div style={{
      position: "sticky", top: 0, zIndex: 100,
      background: C.surface, borderBottom: `1px solid ${C.border}`,
      padding: "0 24px", display: "flex", alignItems: "center",
      justifyContent: "space-between", height: 54,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 20 }}>📈</span>
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, color: C.accent }}>
          Restaurante
        </span>
        <span style={{ color: C.border }}>|</span>
        <span style={{ fontSize: 12, color: C.muted }}>Portal Inversionista</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Badge color={C.info}>Inversionista</Badge>
        <span style={{ fontSize: 13, color: C.muted }}>{user?.nombres}</span>
        <Btn variant="ghost" onClick={logout} style={{ padding: "5px 12px", fontSize: 11 }}>Salir</Btn>
      </div>
    </div>
  );
}

// ── Tarjeta de métrica ───────────────────────────────────────────────
function MetricCard({ label, value, sub, color = C.accent, icon, style = {} }) {
  return (
    <Card className="fade" style={{ padding: "16px 20px", ...style }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <span style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: .6 }}>
          {label}
        </span>
        <span style={{ fontSize: 18 }}>{icon}</span>
      </div>
      <div style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: 26, fontWeight: 700, color, letterSpacing: -1,
      }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{sub}</div>}
    </Card>
  );
}

// ── Tooltip personalizado del gráfico ────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`,
      borderRadius: 10, padding: "10px 14px", fontSize: 13,
    }}>
      <p style={{ color: C.muted, marginBottom: 6, fontSize: 11 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, margin: "3px 0" }}>
          {p.name}: <strong>{fmt(p.value)}</strong>
        </p>
      ))}
    </div>
  );
}

// ── Barra de participación ───────────────────────────────────────────
function PctBar({ value, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{
        flex: 1, height: 5, background: C.surface,
        borderRadius: 3, overflow: "hidden",
      }}>
        <div style={{
          width: `${value}%`, height: "100%",
          background: color, borderRadius: 3,
          transition: "width .6s ease",
        }} />
      </div>
      <span style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: 13, color, minWidth: 40, textAlign: "right",
      }}>
        {fmtPct(value)}
      </span>
    </div>
  );
}

const SEDE_COLORS = [C.accent, C.info, C.success, "#b07edc", "#e07a5f"];

// ── Página principal ─────────────────────────────────────────────────
export default function InversionistaPage() {
  const { user, logout } = useAuth();

  const [resumen,   setResumen]   = useState(null);
  const [historial, setHistorial] = useState([]);
  const [periodos,  setPeriodos]  = useState(6);
  const [cargando,  setCargando]  = useState(true);
  const [error,     setError]     = useState(null);

  const cargarRef = useRef(null);

  const cargar = async (m) => {
    setCargando(true);
    setError(null);
    const MESES_ES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
    try {
      const [res, hist] = await Promise.all([
        api.getResumenInversionista(),
        api.getHistorialInversionista(Number(m)),
      ]);
      setResumen(res);
      setHistorial(
        Array.isArray(hist)
          ? hist.map(h => ({
              ...h,
              label: h.periodo
                ? MESES_ES[parseInt(h.periodo.split("-")[1], 10) - 1]
                    + " " + h.periodo.split("-")[0].slice(2)
                : "—",
              ingresos: Number(h.ingresos  ?? 0),
              retorno:  Number(h.retorno   ?? 0),
            }))
          : []
      );
    } catch (err) {
      console.error(err);
      setError("No se pudo cargar la información. Intenta de nuevo.");
    } finally {
      setCargando(false);
    }
  };

  cargarRef.current = () => cargar(periodos);

  useEffect(() => { cargar(periodos); }, [periodos]); // eslint-disable-line

  const { sedes = [], totales = {} } = resumen || {};

  // Variación ficticia de tendencia (si el historial tiene ≥2 puntos)
  const tendencia = historial.length >= 2
    ? (((historial.at(-1).retorno - historial.at(-2).retorno) / (historial.at(-2).retorno || 1)) * 100).toFixed(1)
    : null;

  return (
    <>
      <style>{css}</style>
      <div style={{ minHeight: "100vh", background: C.bg }}>
        <Topbar user={user} logout={logout} />

        <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>

          {/* ── Encabezado ── */}
          <div className="fade" style={{ marginBottom: 28 }}>
            <h1 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 28, color: C.accent, marginBottom: 4,
            }}>
              Mi portafolio
            </h1>
            <p style={{ fontSize: 13, color: C.muted }}>
              Resultados del mes en curso · {new Date().toLocaleDateString("es-CO", { month: "long", year: "numeric" })}
            </p>
          </div>

          {error && (
            <Card style={{ borderColor: C.danger + "55", marginBottom: 24 }}>
              <p style={{ color: C.danger, fontSize: 13 }}>⚠ {error}</p>
              <Btn variant="ghost" onClick={() => cargarRef.current()} style={{ marginTop: 10, fontSize: 12 }}>
                Reintentar
              </Btn>
            </Card>
          )}

          {cargando ? <SkeletonDash /> : (
            <>
              {/* ── Métricas ── */}
              <div className="fade" style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 12, marginBottom: 24,
              }}>
                <MetricCard
                  label="Ingresos totales"
                  value={fmt(totales.ingresos_mes)}
                  sub="Suma de todas tus sedes"
                  icon="🏦" color={C.text}
                />
                <MetricCard
                  label="Tu retorno del mes"
                  value={fmt(totales.retorno_mes)}
                  sub={tendencia != null
                    ? `${tendencia > 0 ? "▲" : "▼"} ${Math.abs(tendencia)}% vs mes anterior`
                    : "Según tu participación"}
                  icon="💰" color={C.accent}
                />
                <MetricCard
                  label="Sedes activas"
                  value={totales.num_sedes ?? "—"}
                  sub="Con participación asignada"
                  icon="📍" color={C.info}
                />
                <MetricCard
                  label="Participación promedio"
                  value={sedes.length
                    ? fmtPct(sedes.reduce((a, s) => a + Number(s.porcentaje_participacion), 0) / sedes.length)
                    : "—"}
                  sub="Promedio entre tus sedes"
                  icon="📊" color={C.success}
                />
              </div>

              {/* ── Gráfica histórica ── */}
              <Card className="fade" style={{ marginBottom: 24, padding: "20px 20px 12px" }}>
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12,
                }}>
                  <div>
                    <h2 style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: 18, marginBottom: 3,
                    }}>Rendimiento histórico</h2>
                    <p style={{ fontSize: 12, color: C.muted }}>Ingresos de tus sedes vs tu retorno</p>
                  </div>
                  {/* Selector de período */}
                  <div style={{ display: "flex", gap: 6 }}>
                    {[
                      { val: 6,  label: "6M" },
                      { val: 12, label: "1A" },
                      { val: 36, label: "3A" },
                    ].map(op => (
                      <button key={op.val} onClick={() => setPeriodos(op.val)} style={{
                        background: periodos === op.val ? C.accent + "22" : C.surface,
                        color: periodos === op.val ? C.accent : C.muted,
                        border: `1px solid ${periodos === op.val ? C.accent + "66" : C.border}`,
                        borderRadius: 20, padding: "5px 14px",
                        fontSize: 12, cursor: "pointer", transition: "all .15s",
                      }}>{op.label}</button>
                    ))}
                  </div>
                </div>

                {historial.length === 0
                  ? <p style={{ color: C.muted, fontSize: 13, textAlign: "center", padding: "40px 0" }}>
                      Sin datos en este período
                    </p>
                  : <ResponsiveContainer width="100%" height={240}>
                      <AreaChart data={historial} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="gradIngresos" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor={C.info}   stopOpacity={0.18} />
                            <stop offset="95%" stopColor={C.info}   stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="gradRetorno" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor={C.accent} stopOpacity={0.25} />
                            <stop offset="95%" stopColor={C.accent} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                        <XAxis
                          dataKey="label"
                          tick={{ fill: C.muted, fontSize: 11 }}
                          axisLine={false} tickLine={false}
                        />
                        <YAxis
                          tick={{ fill: C.muted, fontSize: 11 }}
                          axisLine={false} tickLine={false}
                          tickFormatter={v => fmt(v)}
                          width={54}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                          wrapperStyle={{ fontSize: 12, color: C.muted, paddingTop: 12 }}
                          formatter={name => <span style={{ color: C.muted }}>{name}</span>}
                        />
                        <Area
                          type="monotone" dataKey="ingresos" name="Ingresos sede"
                          stroke={C.info} strokeWidth={2}
                          fill="url(#gradIngresos)" dot={false}
                        />
                        <Area
                          type="monotone" dataKey="retorno" name="Mi retorno"
                          stroke={C.accent} strokeWidth={2.5}
                          fill="url(#gradRetorno)"
                          dot={{ fill: C.accent, strokeWidth: 0, r: 3 }}
                          activeDot={{ r: 5, fill: C.accent }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                }
              </Card>

              {/* ── Tabla de sedes ── */}
              <Card className="fade" style={{ padding: 0, overflow: "hidden" }}>
                <div style={{ padding: "18px 20px 14px", borderBottom: `1px solid ${C.border}` }}>
                  <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18 }}>
                    Mis sedes
                  </h2>
                  <p style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>
                    Desglose por sede — mes actual
                  </p>
                </div>

                {sedes.length === 0
                  ? <p style={{ color: C.muted, fontSize: 13, padding: "30px 20px" }}>
                      Sin sedes asignadas aún
                    </p>
                  : <>
                      {/* Cabecera tabla */}
                      <div style={{
                        display: "grid",
                        gridTemplateColumns: "2fr 1.6fr 1.2fr 1.2fr 1.4fr",
                        padding: "10px 20px",
                        fontSize: 10, color: C.muted,
                        textTransform: "uppercase", letterSpacing: .6,
                        borderBottom: `1px solid ${C.border}`,
                      }}>
                        <span>Sede</span>
                        <span>Participación</span>
                        <span>Ingresos</span>
                        <span>Mi retorno</span>
                        <span>Margen efectivo</span>
                      </div>

                      {/* Filas */}
                      {sedes.map((s, i) => {
                        const color  = SEDE_COLORS[i % SEDE_COLORS.length];
                        const margen = s.ingresos_mes > 0
                          ? ((s.retorno_mes / s.ingresos_mes) * 100).toFixed(1)
                          : 0;
                        return (
                          <div key={s.id_sede} style={{
                            display: "grid",
                            gridTemplateColumns: "2fr 1.6fr 1.2fr 1.2fr 1.4fr",
                            padding: "14px 20px", alignItems: "center",
                            borderBottom: `1px solid ${C.border}`,
                            transition: "background .15s",
                          }}
                            onMouseEnter={e => e.currentTarget.style.background = C.surface}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                          >
                            {/* Nombre sede */}
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{
                                width: 8, height: 8, borderRadius: "50%",
                                background: color, flexShrink: 0,
                              }} />
                              <span style={{ fontSize: 14, fontWeight: 500 }}>{s.sede}</span>
                            </div>

                            {/* Barra participación */}
                            <PctBar value={Number(s.porcentaje_participacion)} color={color} />

                            {/* Ingresos */}
                            <span style={{
                              fontFamily: "'Playfair Display', serif",
                              fontSize: 15, color: C.text,
                            }}>
                              {fmt(s.ingresos_mes)}
                            </span>

                            {/* Retorno */}
                            <span style={{
                              fontFamily: "'Playfair Display', serif",
                              fontSize: 15, color,
                            }}>
                              {fmt(s.retorno_mes)}
                            </span>

                            {/* Margen */}
                            <Badge color={Number(margen) >= 30 ? C.success : Number(margen) >= 15 ? C.accent : C.danger}>
                              {margen}% efectivo
                            </Badge>
                          </div>
                        );
                      })}

                      {/* Fila de totales */}
                      <div style={{
                        display: "grid",
                        gridTemplateColumns: "2fr 1.6fr 1.2fr 1.2fr 1.4fr",
                        padding: "14px 20px", alignItems: "center",
                        background: C.surface,
                        borderTop: `1px solid ${C.border}`,
                      }}>
                        <span style={{ fontSize: 12, color: C.muted, fontWeight: 500 }}>TOTAL</span>
                        <span />
                        <span style={{
                          fontFamily: "'Playfair Display', serif",
                          fontSize: 16, color: C.text, fontWeight: 700,
                        }}>
                          {fmt(totales.ingresos_mes)}
                        </span>
                        <span style={{
                          fontFamily: "'Playfair Display', serif",
                          fontSize: 16, color: C.accent, fontWeight: 700,
                        }}>
                          {fmt(totales.retorno_mes)}
                        </span>
                        <span />
                      </div>
                    </>
                }
              </Card>

              {/* ── Nota informativa ── */}
              <Card className="fade" style={{ marginTop: 16, borderColor: C.info + "33", padding: "12px 18px" }}>
                <p style={{ fontSize: 12, color: C.info }}>
                  ℹ Los valores son calculados sobre las facturas emitidas en el período seleccionado.
                  Para consultar pagos realizados, contacta al administrador general.
                </p>
              </Card>
            </>
          )}
        </div>
      </div>
    </>
  );
}