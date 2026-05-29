import { useState } from "react";

const C = {
  bg: "#0f0e0c", surface: "#1a1916", card: "#232220",
  border: "#2e2c29", accent: "#e8a43a", muted: "#6b6a66",
  text: "#f0ede6", danger: "#e05c4b", success: "#4caf7d", info: "#4a9edd",
};

const MESES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];
const MESES_CORTOS = [
  "Ene","Feb","Mar","Abr","May","Jun",
  "Jul","Ago","Sep","Oct","Nov","Dic",
];
const DIAS_CORTOS = ["Do","Lu","Ma","Mi","Ju","Vi","Sa"];

const parseDateString = (input) => {
  if (!input) return null;
  const text = String(input).trim();
  if (!text) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return new Date(`${text}T12:00:00`);
  }
  const parsed = new Date(text);
  return isNaN(parsed) ? null : parsed;
};

// Vista activa: "año" | "mes" | "dia"
export default function MiniCalendar({ value, onChange, minDate, maxDate, width = 260 }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const min = parseDateString(minDate);
  const max = parseDateString(maxDate);
  const selDate = parseDateString(value);

  const [año, setAño] = useState(selDate ? selDate.getFullYear()  : today.getFullYear());
  const [mes, setMes] = useState(selDate ? selDate.getMonth()     : today.getMonth());
  const [vista, setVista] = useState("dia"); // empieza en el calendario
  // Para el picker de años: página de 12 años
  const [añoBase, setAñoBase] = useState(Math.floor((selDate ? selDate.getFullYear() : today.getFullYear()) / 12) * 12);

  /* ── helpers ── */
  const mesHabilitado = (a, m) => {
    const primerDia = new Date(a, m, 1);
    const ultimoDia = new Date(a, m + 1, 0);
    if (min && ultimoDia < min) return false;
    if (max && primerDia > max) return false;
    return true;
  };

  const añoHabilitado = (a) => {
    const primerDia = new Date(a, 0, 1);
    const ultimoDia = new Date(a, 11, 31);
    if (min && ultimoDia < min) return false;
    if (max && primerDia > max) return false;
    return true;
  };

  const elegirDia = (dia) => {
    if (!dia) return;
    const fecha = new Date(año, mes, dia);
    fecha.setHours(12, 0, 0, 0);
    if (min && fecha < min) return;
    if (max && fecha > max) return;
    const str = `${año}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
    onChange(str);
  };

  const elegirMes = (m) => {
    if (!mesHabilitado(año, m)) return;
    setMes(m);
    setVista("dia");
  };

  const elegirAño = (a) => {
    if (!añoHabilitado(a)) return;
    setAño(a);
    setVista("mes");
  };

  /* ── botón de header ── */
  const btnHeader = (label, target) => (
    <button
      onClick={() => setVista(target)}
      style={{
        background: "none", border: "none", cursor: "pointer",
        fontFamily: "'Playfair Display', serif", fontSize: 13,
        color: C.accent, padding: "0 4px", borderRadius: 6,
      }}
    >
      {label}
    </button>
  );

  /* ── VISTA: AÑO ── */
  if (vista === "año") {
    const años = Array.from({ length: 12 }, (_, i) => añoBase + i);
    return (
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, width }}>
        {/* nav */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <NavBtn onClick={() => setAñoBase(b => b - 12)}>‹</NavBtn>
          <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 13, color: C.text }}>
            {añoBase} – {añoBase + 11}
          </span>
          <NavBtn onClick={() => setAñoBase(b => b + 12)}>›</NavBtn>
        </div>
        {/* grid 4×3 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
          {años.map(a => {
            const esHoy   = a === today.getFullYear();
            const esSel   = selDate && a === selDate.getFullYear();
            const disabled = !añoHabilitado(a);
            return (
              <button key={a} onClick={() => elegirAño(a)} disabled={disabled} style={{
                borderRadius: 8, padding: "8px 0", fontSize: 12, fontWeight: esSel ? 700 : 400,
                border: esHoy && !esSel ? `1px solid ${C.accent}66` : "none",
                background: esSel ? C.accent : "transparent",
                color: esSel ? "#0f0e0c" : disabled ? C.border : C.text,
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.4 : 1,
                transition: "background .12s",
              }}>{a}</button>
            );
          })}
        </div>
        <Etiqueta value={value} />
      </div>
    );
  }

  /* ── VISTA: MES ── */
  if (vista === "mes") {
    return (
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, width }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <NavBtn onClick={() => { setAño(a => a - 1); }}>‹</NavBtn>
          <div style={{ display: "flex", gap: 4 }}>
            {btnHeader(año, "año")}
          </div>
          <NavBtn onClick={() => { setAño(a => a + 1); }}>›</NavBtn>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
          {MESES_CORTOS.map((nm, m) => {
            const esHoy   = m === today.getMonth() && año === today.getFullYear();
            const esSel   = selDate && m === selDate.getMonth() && año === selDate.getFullYear();
            const disabled = !mesHabilitado(año, m);
            return (
              <button key={m} onClick={() => elegirMes(m)} disabled={disabled} style={{
                borderRadius: 8, padding: "9px 0", fontSize: 12, fontWeight: esSel ? 700 : 400,
                border: esHoy && !esSel ? `1px solid ${C.accent}66` : "none",
                background: esSel ? C.accent : "transparent",
                color: esSel ? "#0f0e0c" : disabled ? C.border : C.text,
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.4 : 1,
                transition: "background .12s",
              }}>{nm}</button>
            );
          })}
        </div>
        <Etiqueta value={value} />
      </div>
    );
  }

  /* ── VISTA: DÍA (calendario) ── */
  const primerDia = new Date(año, mes, 1).getDay();
  const diasMes   = new Date(año, mes + 1, 0).getDate();
  const celdas = [];
  for (let i = 0; i < primerDia; i++) celdas.push(null);
  for (let d = 1; d <= diasMes; d++) celdas.push(d);

  const irMes = (delta) => {
    let m = mes + delta, a = año;
    if (m < 0)  { m = 11; a--; }
    if (m > 11) { m = 0;  a++; }
    setMes(m); setAño(a);
  };

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, width }}>
      {/* header con botones mes y año clicables */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <NavBtn onClick={() => irMes(-1)}>‹</NavBtn>
        <div style={{ display: "flex", gap: 2 }}>
          {btnHeader(MESES[mes], "mes")}
          {btnHeader(año, "año")}
        </div>
        <NavBtn onClick={() => irMes(1)}>›</NavBtn>
      </div>

      {/* cabecera días */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 4 }}>
        {DIAS_CORTOS.map(d => (
          <div key={d} style={{ textAlign: "center", fontSize: 10, color: C.muted, padding: "2px 0" }}>{d}</div>
        ))}
      </div>

      {/* grid días */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
        {celdas.map((dia, i) => {
          if (!dia) return <div key={`e${i}`} />;
          const diaDate = new Date(año, mes, dia);
          diaDate.setHours(12, 0, 0, 0);
          const pasado   = min && diaDate < min;
          const futuro   = max && diaDate > max;
          const disabled = pasado || futuro;
          const esHoy    = diaDate.toDateString() === today.toDateString();
          const esSel    = selDate && diaDate.toDateString() === selDate.toDateString();
          return (
            <button key={dia} onClick={() => elegirDia(dia)} disabled={disabled} style={{
              width: "100%", aspectRatio: "1", border: "none", borderRadius: 7, fontSize: 12,
              cursor: disabled ? "not-allowed" : "pointer",
              background: esSel ? C.accent : esHoy ? C.accent + "22" : "transparent",
              color: esSel ? "#0f0e0c" : disabled ? C.border : C.text,
              fontWeight: esSel || esHoy ? 600 : 400,
              outline: esHoy && !esSel ? `1px solid ${C.accent}66` : "none",
              transition: "background .12s",
              opacity: disabled ? 0.5 : 1,
            }}>{dia}</button>
          );
        })}
      </div>

      <Etiqueta value={value} />
    </div>
  );
}

/* ── sub-componentes auxiliares ── */
function NavBtn({ onClick, children }) {
  return (
    <button onClick={onClick} style={{
      background: "none", border: "none", color: C.accent,
      fontSize: 18, cursor: "pointer", lineHeight: 1, padding: "0 4px",
    }}>{children}</button>
  );
}

function Etiqueta({ value }) {
  const fecha = parseDateString(value);
  if (!fecha) return null;
  return (
    <p style={{ marginTop: 8, fontSize: 11, color: C.accent, textAlign: "center" }}>
      📅 {fecha.toLocaleDateString("es-CO", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
      })}
    </p>
  );
}
