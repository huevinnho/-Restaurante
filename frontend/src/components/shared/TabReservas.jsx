import { useState, useEffect, useCallback } from "react";
import MiniCalendar from "./MiniCalendarComponent";
import api from "../../services/api";

const C = {
  bg: "#0f0e0c", surface: "#1a1916", card: "#232220",
  border: "#2e2c29", accent: "#e8a43a", muted: "#6b6a66",
  text: "#f0ede6", danger: "#e05c4b", success: "#4caf7d", info: "#4a9edd",
};

const FRANJAS = ["11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00","21:00","22:00"];
const ESTADO_COLOR = { activa: C.success, cancelada: C.danger, completada: C.muted };
const ESTADO_LABEL = { activa: "Activa", cancelada: "Cancelada", completada: "Completada" };

const Spinner = () => <span style={{ display:"inline-block", width:14, height:14, marginRight:6, border:`2px solid ${C.accent}55`, borderTopColor:C.accent, borderRadius:"50%", animation:"spin 0.7s linear infinite" }} />;
const Badge = ({ color, children }) => <span style={{ background: color+"22", color, border:`1px solid ${color}44`, borderRadius:20, padding:"2px 10px", fontSize:11, fontWeight:500 }}>{children}</span>;
const Card = ({ children, style = {} }) => <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"16px 20px", ...style }}>{children}</div>;
const Label = ({ children }) => <p style={{ fontSize:10, letterSpacing:1, color:C.muted, marginBottom:6 }}>{children}</p>;
const Alert = ({ color, children }) => <div style={{ background:color+"18", border:`1px solid ${color}44`, borderRadius:8, padding:"9px 14px", fontSize:13, color }}>{children}</div>;
const Btn = ({ children, onClick, disabled, variant="primary", style={} }) => {
  const variants = {
    primary: { background:C.accent, color:"#0f0e0c" },
    danger: { background:C.danger+"22", color:C.danger, border:`1px solid ${C.danger}44` },
    ghost: { background:"transparent", color:C.muted, border:`1px solid ${C.border}` },
  };
  return <button onClick={onClick} disabled={disabled} style={{ borderRadius:10, padding:"9px 18px", fontSize:13, fontWeight:500, display:"inline-flex", alignItems:"center", gap:6, opacity:disabled?.5:1, cursor:disabled?"not-allowed":"pointer", border:"none", ...variants[variant], ...style }}>{children}</button>;
};

function FormularioReserva({ sedes, onCreada, onCancelar, esAdmin=false }) {
  const hoy = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState({ id_cliente:"", id_sede:"", id_mesa:"", fecha_reserva:"", hora_reserva:"", cantidad_personas:2 });
  const [mesas, setMesas] = useState([]);
  const [cargandoMesas, setCargandoMesas] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  const sedeSel = sedes.find(s => s.id_sede === Number(form.id_sede));
  const mesaSel = mesas.find(m => m.id_mesa === Number(form.id_mesa));

  const cargarDisponibilidad = useCallback(() => {
    if (!form.id_sede) { setMesas([]); return; }
    setCargandoMesas(true);
    api.getMesasDisponibles(form.id_sede, form.fecha_reserva, form.hora_reserva ? form.hora_reserva + ":00" : "", form.cantidad_personas)
      .then(setMesas)
      .catch((err) => {
        console.error("Error cargando mesas:", err);
        setMesas([]);
      })
      .finally(() => setCargandoMesas(false));
  }, [form.id_sede, form.fecha_reserva, form.hora_reserva, form.cantidad_personas]);

  useEffect(() => { cargarDisponibilidad(); }, [cargarDisponibilidad]);

  const franjasDisponibles = FRANJAS.filter(h => {
    if (form.fecha_reserva !== hoy) return true;
    const [hh, mm] = h.split(":").map(Number);
    const franja = new Date(); franja.setHours(hh, mm, 0, 0);
    return (franja - new Date()) / 36e5 >= 1;
  });

  const crear = async () => {
    if (!form.id_sede)       { setError("Selecciona una sede"); return; }
    if (!form.fecha_reserva) { setError("Selecciona una fecha"); return; }
    if (!form.hora_reserva)  { setError("Selecciona una hora"); return; }
    if (!form.id_mesa)       { setError("Selecciona una mesa disponible"); return; }
    if (esAdmin && !form.id_cliente) { setError("Ingresa el ID del cliente"); return; }

    setEnviando(true); setError("");
    try {
      const payload = {
        id_sede: Number(form.id_sede), id_mesa: Number(form.id_mesa),
        fecha_reserva: form.fecha_reserva, hora_reserva: form.hora_reserva + ":00",
        cantidad_personas: Number(form.cantidad_personas),
      };
      if (esAdmin) payload.id_cliente = Number(form.id_cliente);
      await api.crearReserva(payload);
      onCreada();
    } catch (err) {
      setError(err?.message || "No se pudo crear la reserva");
      cargarDisponibilidad();
    } finally { setEnviando(false); }
  };

  if (!sedes || sedes.length === 0) {
    return (
      <Card style={{ borderColor:C.accent+"44" }}>
        <p style={{ fontFamily:"'Playfair Display',serif", fontSize:17, color:C.accent, marginBottom:18 }}>Nueva reserva</p>
        <Alert color={C.muted}>Cargando sedes disponibles...</Alert>
        <div style={{ marginTop:14 }}>
          <Btn variant="ghost" onClick={onCancelar}>Cancelar</Btn>
        </div>
      </Card>
    );
  }

  return (
    <Card style={{ borderColor:C.accent+"44" }}>
      <p style={{ fontFamily:"'Playfair Display',serif", fontSize:17, color:C.accent, marginBottom:18 }}>Nueva reserva</p>

      <Label>1 · ELIGE LA SEDE EN BOGOTÁ</Label>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(210px, 1fr))", gap:10, marginBottom:18 }}>
        {sedes.map(s => (
          <button key={s.id_sede} onClick={() => setForm(p => ({ ...p, id_sede:String(s.id_sede), id_mesa:"" }))} style={{ textAlign:"left", background:Number(form.id_sede)===s.id_sede?C.accent+"22":C.surface, color:C.text, border:`1px solid ${Number(form.id_sede)===s.id_sede?C.accent+"66":C.border}`, borderRadius:10, padding:"11px 13px" }}>
            <strong style={{ color:Number(form.id_sede)===s.id_sede?C.accent:C.text }}>{s.nombre}</strong>
            <p style={{ color:C.muted, fontSize:11, marginTop:4 }}>{s.direccion}</p>
          </button>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(180px, 1fr))", gap:12, marginBottom:18 }}>
        <div><Label>2 · FECHA</Label><MiniCalendar value={form.fecha_reserva} minDate={hoy} onChange={val => setForm(p => ({ ...p, fecha_reserva:val, hora_reserva:"", id_mesa:"" }))} width={220} /></div>
        <div><Label>3 · PERSONAS</Label><input type="number" min="1" max="20" value={form.cantidad_personas} onChange={e => setForm(p => ({ ...p, cantidad_personas:Number(e.target.value), id_mesa:"" }))} /></div>
      </div>

      {form.fecha_reserva && <><Label>4 · HORA</Label><div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:18 }}>
        {franjasDisponibles.map(h => <button key={h} onClick={() => setForm(p => ({ ...p, hora_reserva:h, id_mesa:"" }))} style={{ background:form.hora_reserva===h?C.accent:C.surface, color:form.hora_reserva===h?"#0f0e0c":C.muted, border:`1px solid ${form.hora_reserva===h?C.accent:C.border}`, borderRadius:8, padding:"8px 14px", fontSize:13 }}>{h}</button>)}
      </div></>}

      {form.id_sede && form.fecha_reserva && form.hora_reserva && <>
        <Label>5 · MESA DISPONIBLE EN ESTA SEDE</Label>
        {cargandoMesas ? <p style={{ color:C.muted, fontSize:13, marginBottom:14 }}><Spinner />Consultando mesas...</p> : mesas.length === 0 ? (
          <Alert color={C.danger}>No hay mesas disponibles en {sedeSel?.nombre || "esta sede"} para esa fecha, hora y cantidad de personas. Elige otra sede u otro horario.</Alert>
        ) : (
          <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:18 }}>
            {mesas.map(m => <button key={m.id_mesa} onClick={() => setForm(p => ({ ...p, id_mesa:String(m.id_mesa) }))} style={{ background:Number(form.id_mesa)===m.id_mesa?C.accent:C.surface, color:Number(form.id_mesa)===m.id_mesa?"#0f0e0c":C.muted, border:`1px solid ${Number(form.id_mesa)===m.id_mesa?C.accent:C.border}`, borderRadius:10, padding:"10px 16px", minWidth:86 }}><strong>Mesa {m.numero}</strong><br/><span style={{ fontSize:11 }}>{m.capacidad} personas</span></button>)}
          </div>
        )}
      </>}

      {esAdmin && <div style={{ marginBottom:18 }}><Label>ID DEL CLIENTE</Label><input type="number" placeholder="Ej: 1" value={form.id_cliente} onChange={e => setForm(p => ({ ...p, id_cliente:e.target.value }))} /></div>}

      {sedeSel && mesaSel && form.fecha_reserva && form.hora_reserva && <div style={{ background:C.accent+"11", border:`1px solid ${C.accent}33`, borderRadius:10, padding:"12px 16px", marginBottom:14, fontSize:13 }}>
        <p>🏢 <strong>{sedeSel.nombre}</strong> · {sedeSel.direccion}</p>
        <p style={{ marginTop:4 }}>🪑 Mesa {mesaSel.numero} · 📅 {form.fecha_reserva} · 🕐 {form.hora_reserva} · 👥 {form.cantidad_personas}</p>
      </div>}

      {error && <div style={{ marginBottom:14 }}><Alert color={C.danger}>⚠ {error}</Alert></div>}
      <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
        <Btn onClick={crear} disabled={enviando || !form.id_mesa}>{enviando ? <><Spinner />Guardando…</> : "📅 Confirmar reserva"}</Btn>
        <Btn variant="ghost" onClick={onCancelar}>Cancelar</Btn>
      </div>
    </Card>
  );
}

export default function TabReservas({ esAdmin=false }) {
  const [reservas, setReservas] = useState([]);
  const [sedes, setSedes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrando, setMostrando] = useState(false);
  const [cancelando, setCancelando] = useState(null);
  const [exito, setExito] = useState("");

  const cargar = useCallback(() => {
    setCargando(true);
    const promReservas = esAdmin ? api.getReservas() : api.getMisReservas();
    // Cargar sedes y reservas independientemente para que un fallo en reservas
    // no deje sedes vacío (bug "cargando sedes" en cliente)
    Promise.all([
      promReservas.catch((err) => { console.error("Error cargando reservas:", err); return []; }),
      api.getSedes().catch((err) => { console.error("Error cargando sedes:", err); return []; }),
    ])
      .then(([r, s]) => {
        setReservas(r || []);
        setSedes(s || []);
      })
      .finally(() => setCargando(false));
  }, [esAdmin]);

  const puedeCancelarReserva = (reserva) => {
    if (!reserva?.fecha_reserva || !reserva?.hora_reserva) return false;
    const fechaHora = new Date(`${String(reserva.fecha_reserva).slice(0, 10)}T${reserva.hora_reserva}`);
    return fechaHora.getTime() - Date.now() > 60 * 60 * 1000;
  };

  useEffect(() => { cargar(); }, [cargar]);

  const cancelar = async (id) => {
    setCancelando(id);
    try { await api.cancelarReserva(id); setExito("Reserva cancelada correctamente"); setTimeout(() => setExito(""), 3500); cargar(); }
    catch (err) { alert(err?.message || "No se pudo cancelar la reserva"); }
    finally { setCancelando(null); }
  };

  if (cargando) return <div style={{ textAlign:"center", padding:60, color:C.muted }}><Spinner />Cargando…</div>;

  const activas = esAdmin ? reservas : reservas.filter(r => r.estado === "activa");
  const historial = esAdmin ? [] : reservas.filter(r => r.estado !== "activa");

  return <div className="fade">
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
      <div>
        <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:22 }}>{esAdmin ? "Reservas activas por sede" : "Mis reservas"}</h2>
        <p style={{ color:C.muted, fontSize:13, marginTop:4 }}>{esAdmin ? "El administrador ve la sede donde reservó cada cliente" : "Elige la sede de Bogotá donde quieres reservar"}</p>
      </div>
      <div style={{ display:"flex", gap:10 }}>
        {esAdmin && <Btn variant="ghost" onClick={cargar} style={{ fontSize:12, padding:"6px 14px" }}>↻ Actualizar</Btn>}
        <Btn onClick={() => setMostrando(!mostrando)}>{mostrando ? "✕ Cancelar" : "+ Nueva reserva"}</Btn>
      </div>
    </div>

    {exito && <div style={{ marginBottom:16 }}><Alert color={C.success}>✅ {exito}</Alert></div>}
    {mostrando && <div style={{ marginBottom:24 }}><FormularioReserva sedes={sedes} esAdmin={esAdmin} onCancelar={() => setMostrando(false)} onCreada={() => { setMostrando(false); setExito("¡Reserva creada exitosamente!"); setTimeout(() => setExito(""), 4000); cargar(); }} /></div>}

    {activas.length > 0 && <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:24 }}>
      {activas.map(r => <Card key={r.id_reserva} style={{ borderColor:C.success+"33" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:44, height:44, borderRadius:10, background:C.success+"22", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>📅</div>
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:2 }}>
                <p style={{ fontFamily:"'Playfair Display',serif", fontSize:15, color:C.accent }}>Mesa {r.mesa_numero}</p>
                <Badge color={C.info}>{r.cantidad_personas} personas</Badge>
                <Badge color={C.accent}>{r.sede_nombre || "Sede"}</Badge>
              </div>
              {esAdmin && r.cliente_nombre && <p style={{ fontSize:13, marginBottom:2 }}>{r.cliente_nombre}</p>}
              <p style={{ fontSize:12, color:C.muted }}>{new Date(String(r.fecha_reserva).slice(0,10)+"T12:00:00").toLocaleDateString("es-CO",{ weekday:"long", year:"numeric", month:"long", day:"numeric" })} · {String(r.hora_reserva).slice(0,5)}{esAdmin && r.cliente_telefono ? ` · 📞 ${r.cliente_telefono}` : ""}</p>
              <p style={{ fontSize:11, color:C.muted, marginTop:2 }}>{r.sede_direccion}</p>
            </div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6 }}>
            <Badge color={C.success}>Activa</Badge>
            <Btn
              variant="danger"
              onClick={() => cancelar(r.id_reserva)}
              disabled={cancelando===r.id_reserva || !puedeCancelarReserva(r)}
              style={{ padding:"5px 12px", fontSize:11 }}
            >
              {cancelando===r.id_reserva
                ? <Spinner />
                : puedeCancelarReserva(r)
                  ? "Cancelar"
                  : "Ya no se puede cancelar"
              }
            </Btn>
            {!puedeCancelarReserva(r) && (
              <p style={{ fontSize: 11, color: C.muted, margin: 0, textAlign: "right" }}>
                No puedes cancelar con menos de 1 hora de antelación.
              </p>
            )}
          </div>
        </div>
      </Card>)}
    </div>}

    {!esAdmin && historial.length > 0 && <><p style={{ fontSize:11, color:C.muted, letterSpacing:.8, marginBottom:12 }}>HISTORIAL</p><div style={{ display:"flex", flexDirection:"column", gap:10 }}>{historial.map(r => <Card key={r.id_reserva} style={{ opacity:.72 }}><div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}><div><p style={{ fontSize:14 }}>{r.sede_nombre} · Mesa {r.mesa_numero}</p><p style={{ fontSize:12, color:C.muted }}>{String(r.fecha_reserva).slice(0,10)} — {String(r.hora_reserva).slice(0,5)} · {r.cantidad_personas} pers.</p></div><Badge color={ESTADO_COLOR[r.estado]}>{ESTADO_LABEL[r.estado]}</Badge></div></Card>)}</div></>}

    {reservas.length === 0 && !mostrando && <Card style={{ textAlign:"center", padding:"40px 20px" }}><p style={{ fontSize:32, marginBottom:12 }}>📅</p><p style={{ color:C.muted }}>{esAdmin ? "No hay reservas activas en este momento." : "Aún no tienes reservas. Crea una arriba y elige la sede que prefieras."}</p></Card>}
  </div>;
}
