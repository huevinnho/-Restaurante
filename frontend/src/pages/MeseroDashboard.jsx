import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

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

// ── Componentes base ──────────────────────────────────────────────────
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
    borderRadius: 20, padding: "2px 10px",
    fontSize: 11, fontWeight: 500, whiteSpace: "nowrap",
  }}>{children}</span>
);

const Btn = ({ children, onClick, variant = "primary", style = {}, disabled }) => {
  const v = {
    primary: { background: C.accent, color: "#0f0e0c" },
    ghost: { background: "transparent", color: C.muted, border: `1px solid ${C.border}` },
    danger: { background: C.danger + "22", color: C.danger, border: `1px solid ${C.danger}44` },
    success: { background: C.success + "22", color: C.success, border: `1px solid ${C.success}44` },
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

const ESTADO_COLOR = { disponible: C.success, ocupada: C.accent, reservada: C.info };
const ESTADO_PEDIDO_COLOR = { pendiente: C.accent, en_preparacion: C.info, listo: C.success, entregado: C.muted };

// ── TOPBAR ────────────────────────────────────────────────────────────
function Topbar({ user, logout, tab, setTab }) {
  const tabs = [
    { id: "mesas", label: "Mis mesas", icon: "🪑" },
    { id: "pedido", label: "Nuevo pedido", icon: "📋" },
    { id: "facturas", label: "Mis facturas", icon: "🧾" },
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
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Badge color={C.accent}>Mesero</Badge>
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

// ── TAB: MESAS ────────────────────────────────────────────────────────
function TabMesas({ mesas, pedidos, cargando }) {
  const [mesaDetalle, setMesaDetalle] = useState(null);

  const getPedidoMesa = (idMesa) =>
    pedidos.find(p => p.id_mesa === idMesa && p.estado !== "entregado" && p.estado !== "cancelado");

  if (cargando) return (
    <div style={{ textAlign: "center", padding: "60px 20px", color: C.muted }}>
      <Spinner size={24} /> <span style={{ marginLeft: 10 }}>Cargando mesas…</span>
    </div>
  );

  const mesasOcupadas = mesas.filter(m => !m.disponible).length;
  const pedidosPend = pedidos.filter(p => p.estado === "pendiente").length;
  const pedidosEnPrep = pedidos.filter(p => p.estado === "en_preparacion").length;

  return (
    <div className="fade">
      {/* Resumen */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        {[
          { label: "Mesas ocupadas", val: mesasOcupadas, color: C.accent },
          { label: "Pedidos pendientes", val: pedidosPend, color: C.info },
          { label: "En preparación", val: pedidosEnPrep, color: C.success },
        ].map(s => (
          <Card key={s.label} style={{ flex: 1, minWidth: 140, padding: "14px 18px" }}>
            <div style={{ fontSize: 24, fontFamily: "'Playfair Display', serif", color: s.color }}>
              {s.val}
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{s.label}</div>
          </Card>
        ))}
      </div>

      {/* Grid mesas */}
      <h3 style={{ fontSize: 13, color: C.muted, letterSpacing: .8, marginBottom: 14 }}>
        TODAS LAS MESAS
      </h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12, marginBottom: 24 }}>
        {mesas.map(m => {
          const pedido = getPedidoMesa(m.id_mesa);
          const estadoMesa = m.disponible ? "disponible" : "ocupada";
          return (
            <Card key={m.id_mesa}
              onClick={() => pedido ? setMesaDetalle(mesaDetalle?.id_mesa === m.id_mesa ? null : m) : null}
              style={{
                borderColor: pedido ? C.accent + "55" : C.border,
                transition: "all .2s",
              }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: C.accent }}>
                  Mesa {m.numero}
                </span>
                <Badge color={ESTADO_COLOR[estadoMesa]}>{estadoMesa}</Badge>
              </div>
              <div style={{ fontSize: 11, color: C.muted }}>Cap. {m.capacidad} personas</div>
              {pedido && (
                <div style={{ marginTop: 8 }}>
                  <Badge color={ESTADO_PEDIDO_COLOR[pedido.estado]}>
                    {pedido.estado.replace("_", " ")}
                  </Badge>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Detalle pedido */}
      {mesaDetalle && (() => {
        const pedido = getPedidoMesa(mesaDetalle.id_mesa);
        if (!pedido) return null;
        return (
          <Card style={{ borderColor: C.accent + "44" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: C.accent }}>
                Pedido #{pedido.id_pedido} — Mesa {mesaDetalle.numero}
              </h3>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <Badge color={ESTADO_PEDIDO_COLOR[pedido.estado]}>
                  {pedido.estado.replace("_", " ")}
                </Badge>
                <Btn variant="ghost" onClick={() => setMesaDetalle(null)} style={{ padding: "4px 10px", fontSize: 11 }}>✕</Btn>
              </div>
            </div>

            {pedido.items?.map((it, i) => (
              <div key={i} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "8px 0", borderBottom: `1px solid ${C.border}`,
              }}>
                <div>
                  <div style={{ fontSize: 14 }}>{it.cantidad}× {it.plato_nombre}</div>
                  {it.observacion && <div style={{ fontSize: 11, color: C.muted }}>↳ {it.observacion}</div>}
                  {it.ingredientes_excluir && it.ingredientes_excluir.length > 0 && (
                    <div style={{ fontSize: 11, color: C.info, marginTop: 6 }}>
                      ✖ Ingredientes excluidos: {it.ingredientes_excluir_nombres?.length ? it.ingredientes_excluir_nombres.join(", ") : it.ingredientes_excluir.join(", ")}
                    </div>
                  )}
                  {it.alergias_texto && <div style={{ fontSize: 11, color: C.danger }}>⚠ {it.alergias_texto}</div>}
                </div>
                <span style={{ color: C.accent, fontSize: 14 }}>
                  ${(it.precio * it.cantidad).toLocaleString()}
                </span>
              </div>
            ))}

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14, alignItems: "center" }}>
              <span style={{ color: C.muted, fontSize: 13 }}>Total estimado</span>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: C.accent }}>
                ${pedido.items?.reduce((s, i) => s + i.precio * i.cantidad, 0).toLocaleString()}
              </span>
            </div>
          </Card>
        );
      })()}
    </div>
  );
}

// ── TAB: NUEVO PEDIDO ─────────────────────────────────────────────────
function TabPedido({ mesas, menu, onPedidoCreado }) {
  const [mesaSel, setMesaSel] = useState(null);
  const [items, setItems] = useState([]);
  const [alergias, setAlergias] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [obs, setObs] = useState({});
  const [recetasCache, setRecetasCache] = useState({});
  const [recetaSeleccionada, setRecetaSeleccionada] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState("");

  const ALERGIAS_OPTS = ["Gluten", "Lactosa", "Mariscos", "Nueces", "Huevo"];

  const mesasDisp = mesas.filter(m => m.disponible);
  const menuFilt = menu.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );
  const cats = [...new Set(menu.map(p => p.menu_nombre))];
  const total = items.reduce((s, i) => s + i.precio * i.cantidad, 0);

  const loadReceta = async (id_plato) => {
    if (Object.prototype.hasOwnProperty.call(recetasCache, id_plato)) return recetasCache[id_plato];
    try {
      const receta = await api.getReceta(id_plato);
      setRecetasCache(prev => ({ ...prev, [id_plato]: receta }));
      return receta;
    } catch (err) {
      setRecetasCache(prev => ({ ...prev, [id_plato]: null }));
      return null;
    }
  };

  const abrirReceta = async (id_plato) => {
    const receta = await loadReceta(id_plato);
    if (receta) {
      setRecetaSeleccionada({ id_plato, ...receta });
    }
  };

  const agregar = async (plato) => {
    await loadReceta(plato.id_plato);
    setItems(prev => {
      const ex = prev.find(i => i.id_plato === plato.id_plato);
      if (ex) return prev.map(i => i.id_plato === plato.id_plato ? { ...i, cantidad: i.cantidad + 1 } : i);
      return [...prev, { ...plato, cantidad: 1, ingredientes_excluir: [] }];
    });
  };

  const toggleExclusion = (id_plato, id_producto) => {
    setItems(prev => prev.map(i => {
      if (i.id_plato !== id_plato) return i;
      const excluded = new Set(i.ingredientes_excluir || []);
      if (excluded.has(id_producto)) excluded.delete(id_producto);
      else excluded.add(id_producto);
      return { ...i, ingredientes_excluir: [...excluded] };
    }));
  };

  const quitar = (id) => {
    setItems(prev => prev.map(i => i.id_plato === id ? { ...i, cantidad: i.cantidad - 1 } : i).filter(i => i.cantidad > 0));
  };

  const enviar = async () => {
    if (!mesaSel || items.length === 0) return;
    setEnviando(true);
    setError("");
    try {
      await api.crearPedido({
        id_mesa: mesaSel.id_mesa,
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
      onPedidoCreado(); // refresca mesas y pedidos
      setTimeout(() => {
        setItems([]); setAlergias([]); setMesaSel(null);
        setObs({}); setBusqueda(""); setEnviado(false);
      }, 2500);
    } catch (err) {
      setError(err.message || "Error al enviar el pedido");
    } finally {
      setEnviando(false);
    }
  };

  if (enviado) return (
    <div className="fade" style={{ textAlign: "center", padding: "60px 20px" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
      <h2 style={{ fontFamily: "'Playfair Display', serif", color: C.success, marginBottom: 8 }}>
        Pedido enviado a cocina
      </h2>
      <p style={{ color: C.muted, fontSize: 14 }}>Mesa {mesaSel?.numero} · {items.length} productos</p>
    </div>
  );

  return (
    <div className="fade" style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, alignItems: "start" }}>

      {/* Izquierda: menú */}
      <div>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, marginBottom: 16 }}>
          Nuevo pedido
        </h2>

        {/* Mesa */}
        <Card style={{ marginBottom: 14 }}>
          <p style={{ fontSize: 11, color: C.muted, letterSpacing: .8, marginBottom: 10 }}>SELECCIONAR MESA</p>
          {mesasDisp.length === 0
            ? <p style={{ fontSize: 13, color: C.muted }}>No hay mesas disponibles</p>
            : <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {mesasDisp.map(m => (
                <button key={m.id_mesa} onClick={() => setMesaSel(m)} style={{
                  background: mesaSel?.id_mesa === m.id_mesa ? C.accent : C.surface,
                  color: mesaSel?.id_mesa === m.id_mesa ? "#0f0e0c" : C.muted,
                  border: `1px solid ${mesaSel?.id_mesa === m.id_mesa ? C.accent : C.border}`,
                  borderRadius: 8, padding: "6px 14px", fontSize: 13, transition: "all .15s",
                }}>Mesa {m.numero} · {m.capacidad}p</button>
              ))}
            </div>
          }
        </Card>

        {/* Alergias */}
        <Card style={{ marginBottom: 14 }}>
          <p style={{ fontSize: 11, color: C.muted, letterSpacing: .8, marginBottom: 10 }}>ALERGIAS DEL CLIENTE</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {ALERGIAS_OPTS.map(a => (
              <button key={a} onClick={() => setAlergias(prev =>
                prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]
              )} style={{
                background: alergias.includes(a) ? C.danger + "22" : C.surface,
                color: alergias.includes(a) ? C.danger : C.muted,
                border: `1px solid ${alergias.includes(a) ? C.danger + "66" : C.border}`,
                borderRadius: 20, padding: "4px 12px", fontSize: 12, transition: "all .15s",
              }}>{a}</button>
            ))}
          </div>
        </Card>

        {/* Buscador */}
        <input
          placeholder="🔍 Buscar plato o categoría..."
          value={busqueda} onChange={e => setBusqueda(e.target.value)}
          style={{ marginBottom: 14 }}
        />

        {/* Menú por categorías */}
        {cats.map(cat => {
          const platsCat = menuFilt.filter(p => p.menu_nombre === cat);
          if (!platsCat.length) return null;
          return (
            <div key={cat} style={{ marginBottom: 18 }}>
              <p style={{ fontSize: 11, color: C.muted, letterSpacing: .8, marginBottom: 10 }}>
                {cat.toUpperCase()}
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {platsCat.map(p => {
                  const enPedido = items.find(i => i.id_plato === p.id_plato);
                  return (
                    <Card key={p.id_plato} onClick={() => agregar(p)} style={{
                      padding: 12, transition: "all .15s",
                      borderColor: enPedido ? C.accent + "66" : C.border,
                    }}>
                      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                        <img
                          src={imagenesPlatos[p.id_plato] || "/img/1.png"}
                          alt={p.nombre}
                          style={{ width: 78, height: 78, objectFit: "cover", borderRadius: 12, flexShrink: 0 }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                            <span style={{ fontSize: 13, flex: 1, minWidth: 0 }}>{p.nombre}</span>
                            {enPedido && (
                              <span style={{
                                background: C.accent, color: "#0f0e0c",
                                borderRadius: "50%", width: 20, height: 20,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 11, fontWeight: 700, flexShrink: 0,
                              }}>{enPedido.cantidad}</span>
                            )}
                          </div>
                          {p.descripcion && (
                            <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>{p.descripcion}</div>
                          )}
                          <span style={{ color: C.accent, fontSize: 12, marginTop: 8, display: "block" }}>
                            ${p.precio.toLocaleString()}
                          </span>
                          <button onClick={(e) => { e.stopPropagation(); abrirReceta(p.id_plato); }} style={{
                            marginTop: 10,
                            background: "transparent",
                            color: C.info,
                            border: `1px solid ${C.info}44`,
                            borderRadius: 8,
                            padding: "6px 10px",
                            fontSize: 11,
                            cursor: "pointer",
                          }}>
                            Ver receta
                          </button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
              {recetaSeleccionada && (
                <div style={{
                  position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
                  background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center",
                  justifyContent: "center", padding: 24, zIndex: 2000,
                }}>
                  <div style={{ width: "100%", maxWidth: 620, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 20, padding: 24, position: "relative" }}>
                    <button onClick={() => setRecetaSeleccionada(null)} style={{
                      position: "absolute", top: 16, right: 16,
                      border: "none", background: "transparent", color: C.muted,
                      fontSize: 22, cursor: "pointer",
                    }}>×</button>
                    <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: C.accent, marginBottom: 10 }}>
                      Receta: {recetaSeleccionada.plato_nombre}
                    </h3>
                    <p style={{ color: C.muted, fontSize: 13, marginBottom: 16 }}>
                      Tiempo de preparación: {recetaSeleccionada.tiempo_minutos} min.
                    </p>
                    {recetaSeleccionada.modo_preparacion && (
                      <div style={{ marginBottom: 18 }}>
                        <p style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>Preparación</p>
                        <div style={{ fontSize: 13, color: C.text, lineHeight: 1.7 }}>
                          {recetaSeleccionada.modo_preparacion}
                        </div>
                      </div>
                    )}
                    <div>
                      <p style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>Ingredientes</p>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
                        {Array.isArray(recetaSeleccionada.ingredientes) && recetaSeleccionada.ingredientes.map(ing => (
                          <div key={ing.id_producto} style={{ background: C.surface, borderRadius: 14, padding: 12 }}>
                            <div style={{ fontSize: 13, color: C.text, marginBottom: 4 }}>{ing.ingrediente}</div>
                            <div style={{ fontSize: 11, color: C.muted }}>
                              {ing.cantidad_requerida} {ing.unidad_medida}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Derecha: resumen */}
      <div style={{ position: "sticky", top: 80 }}>
        <Card>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, marginBottom: 14 }}>
            Resumen del pedido
          </h3>

          {mesaSel
            ? <Badge color={C.success}>Mesa {mesaSel.numero} · {mesaSel.capacidad} personas</Badge>
            : <p style={{ fontSize: 12, color: C.muted }}>Sin mesa seleccionada</p>
          }

          <Divider />

          {items.length === 0
            ? <p style={{ fontSize: 13, color: C.muted, textAlign: "center", padding: "20px 0" }}>
              Selecciona platos del menú
            </p>
            : items.map(it => (
              <div key={it.id_plato} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, flex: 1 }}>{it.nombre}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <button onClick={() => quitar(it.id_plato)} style={{
                      background: C.danger + "22", color: C.danger,
                      border: `1px solid ${C.danger}44`, borderRadius: 6,
                      width: 22, height: 22, display: "flex", alignItems: "center",
                      justifyContent: "center", fontSize: 14,
                    }}>−</button>
                    <span style={{ fontSize: 13, minWidth: 14, textAlign: "center" }}>{it.cantidad}</span>
                    <button onClick={() => agregar(it)} style={{
                      background: C.success + "22", color: C.success,
                      border: `1px solid ${C.success}44`, borderRadius: 6,
                      width: 22, height: 22, display: "flex", alignItems: "center",
                      justifyContent: "center", fontSize: 14,
                    }}>+</button>
                  </div>
                  <span style={{ color: C.accent, fontSize: 13, marginLeft: 8, minWidth: 56, textAlign: "right" }}>
                    ${(it.precio * it.cantidad).toLocaleString()}
                  </span>
                </div>
                {recetasCache[it.id_plato] && Array.isArray(recetasCache[it.id_plato].ingredientes) && recetasCache[it.id_plato].ingredientes.length > 0 && (
                  <div style={{ marginTop: 8, padding: "10px 10px", background: "#11100e", borderRadius: 10 }}>
                    <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>
                      Excluir ingredientes
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {recetasCache[it.id_plato].ingredientes.map(ing => {
                        const excluded = it.ingredientes_excluir?.includes(ing.id_producto);
                        return (
                          <button key={ing.id_producto} onClick={() => toggleExclusion(it.id_plato, ing.id_producto)}
                            style={{
                              background: excluded ? C.danger + "22" : C.surface,
                              color: excluded ? C.danger : C.muted,
                              border: `1px solid ${excluded ? C.danger + "44" : C.border}`,
                              borderRadius: 999, padding: "5px 10px", fontSize: 11,
                            }}>
                            {excluded ? "Sin " : "Con "}{ing.ingrediente}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <input
                  placeholder="Observación..."
                  value={obs[it.id_plato] || ""}
                  onChange={e => setObs(p => ({ ...p, [it.id_plato]: e.target.value }))}
                  style={{ marginTop: 6, padding: "5px 10px", fontSize: 11 }}
                />
                {/* Mostrar nombres de ingredientes excluidos en el resumen previo al envío */}
                {it.ingredientes_excluir && it.ingredientes_excluir.length > 0 && (
                  <div style={{ fontSize: 12, color: C.info, marginTop: 8 }}>
                    ✖ Ingredientes excluidos: {recetasCache[it.id_plato]
                      ? recetasCache[it.id_plato].ingredientes.filter(ing => (it.ingredientes_excluir || []).includes(ing.id_producto)).map(ing => ing.ingrediente).join(", ")
                      : it.ingredientes_excluir.join(", ")}
                  </div>
                )}
              </div>
            ))
          }

          {alergias.length > 0 && (
            <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 4 }}>
              {alergias.map(a => <Badge key={a} color={C.danger}>{a}</Badge>)}
            </div>
          )}

          <Divider />

          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
            <span style={{ color: C.muted, fontSize: 13 }}>Total estimado</span>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: C.accent }}>
              ${total.toLocaleString()}
            </span>
          </div>

          {error && (
            <div style={{
              background: C.danger + "22", border: `1px solid ${C.danger}44`,
              borderRadius: 8, padding: "8px 12px", fontSize: 12,
              color: C.danger, marginBottom: 12,
            }}>{error}</div>
          )}

          <Btn
            onClick={enviar}
            disabled={!mesaSel || items.length === 0 || enviando}
            style={{ width: "100%", justifyContent: "center", padding: "11px 20px" }}
          >
            {enviando
              ? <><Spinner /> Enviando…</>
              : "📤 Enviar a cocina"
            }
          </Btn>
        </Card>
      </div>
    </div>
  );
}

// ── TAB: FACTURAS ─────────────────────────────────────────────────────
function TabFacturas() {
  const [facturas, setCargando_] = useState([]);
  const [cargando, setCargando] = useState(true);

  const setFacturas = setCargando_;

  useEffect(() => {
    api.getMisFacturas()
      .then(setFacturas)
      .catch(() => setFacturas([]))
      .finally(() => setCargando(false));
  }, []);

  const METODO_COLOR = { Tarjeta: C.info, Efectivo: C.success, "App móvil": C.accent };

  if (cargando) return (
    <div style={{ textAlign: "center", padding: "60px 20px", color: C.muted }}>
      <Spinner size={24} />
    </div>
  );

  return (
    <div className="fade">
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, marginBottom: 6 }}>
        Mis facturas
      </h2>
      <p style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>
        Facturas generadas de tus pedidos
      </p>

      {facturas.length === 0
        ? <Card style={{ textAlign: "center", padding: "40px 20px" }}>
          <p style={{ color: C.muted }}>Aún no tienes facturas registradas</p>
        </Card>
        : <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {facturas.map(f => (
            <Card key={f.id_factura}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, color: C.accent }}>
                      Factura #{f.id_factura}
                    </span>
                    <Badge color={METODO_COLOR[f.metodo_pago] || C.muted}>{f.metodo_pago}</Badge>
                  </div>
                  <p style={{ fontSize: 12, color: C.muted }}>
                    Mesa {f.mesa_numero} · Pedido #{f.id_pedido}
                  </p>
                  <p style={{ fontSize: 12, color: C.muted }}>
                    {new Date(f.fecha_emision).toLocaleString("es-CO")}
                  </p>
                  {f.cliente_nombre && (
                    <p style={{ fontSize: 12, color: C.muted }}>👤 {f.cliente_nombre}</p>
                  )}
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 20 }}>
                    ${Number(f.total).toLocaleString()}
                  </span>
                  <p style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                    IVA: ${Number(f.iva_valor).toLocaleString()}
                    {Number(f.propina) > 0 && ` · Propina: $${Number(f.propina).toLocaleString()}`}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      }

      {facturas.length > 0 && (
        <Card style={{ marginTop: 20, padding: "14px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontSize: 12, color: C.muted }}>Total facturado</p>
              <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, color: C.accent, marginTop: 2 }}>
                ${facturas.reduce((s, f) => s + Number(f.total), 0).toLocaleString()}
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: 12, color: C.muted }}>Facturas emitidas</p>
              <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, marginTop: 2 }}>
                {facturas.length}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

// ── DASHBOARD PRINCIPAL ───────────────────────────────────────────────
export default function MeseroDashboard() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState("mesas");
  const [mesas, setMesas] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [menu, setMenu] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargarDatos = useCallback(async () => {
    try {
      const [m, p, mn] = await Promise.all([
        api.getMesas(),
        api.getPedidos(),
        api.getMenu(),
      ]);
      setMesas(m);
      setPedidos(p);
      setMenu(mn);
    } catch (err) {
      console.error("Error cargando datos:", err);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
    // Refresca pedidos cada 15 segundos
    const interval = setInterval(cargarDatos, 15000);
    return () => clearInterval(interval);
  }, [cargarDatos]);

  return (
    <>
      <style>{css}</style>
      <div style={{ minHeight: "100vh", background: C.bg }}>
        <Topbar user={user} logout={logout} tab={tab} setTab={setTab} />
        <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
          {tab === "mesas" && <TabMesas mesas={mesas} pedidos={pedidos} cargando={cargando} />}
          {tab === "pedido" && <TabPedido mesas={mesas} menu={menu} onPedidoCreado={cargarDatos} />}
          {tab === "facturas" && <TabFacturas />}
        </div>
      </div>
    </>
  );
}
