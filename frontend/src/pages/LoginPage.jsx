import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import MiniCalendar from "../components/shared/MiniCalendarComponent";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=DM+Sans:wght@300;400;500&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'DM Sans', sans-serif; background: #0f0e0c; color: #f0ede6; min-height: 100vh; }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes spin   { to { transform: rotate(360deg); } }
  .fade-1 { animation: fadeUp .4s ease both; }
  .fade-2 { animation: fadeUp .4s .1s ease both; }
  .fade-3 { animation: fadeUp .4s .2s ease both; }
  .fade-4 { animation: fadeUp .4s .3s ease both; }
  input { width: 100%; background: #1a1916; border: 1px solid #2e2c29; color: #f0ede6; font-family: 'DM Sans', sans-serif; font-size: 14px; border-radius: 8px; padding: 11px 14px; outline: none; transition: border-color .2s; }
  input:focus { border-color: #e8a43a; }
  input::placeholder { color: #6b6a66; }
  button { cursor: pointer; font-family: 'DM Sans', sans-serif; border: none; }
`;


const parseDate = (value) => {
  if (!value) return null;
  const text = String(value).trim();
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(text);
  const candidate = new Date(isDateOnly ? `${text}T12:00:00` : text);
  if (!isNaN(candidate)) return candidate;
  const fallback = new Date(text.slice(0, 10) + "T12:00:00");
  return isNaN(fallback) ? null : fallback;
};

const formatDateYMD = (value) => {
  const fecha = parseDate(value);
  return fecha ? fecha.toLocaleDateString("es-CO") : "";
};

function Spinner() {
  return <span style={{ display: "inline-block", width: 16, height: 16, border: "2px solid #0f0e0c", borderTopColor: "transparent", borderRadius: "50%", animation: "spin .7s linear infinite" }} />;
}

const Label = ({ children }) => <label style={{ display: "block", fontSize: 11, color: "#6b6a66", letterSpacing: .8, marginBottom: 7 }}>{children}</label>;

export default function LoginPage() {
  const { login } = useAuth();
  const hoy = new Date().toISOString().split("T")[0];
  const [modo, setModo] = useState("login");
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [verPass, setVerPass] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");
  const [loading, setLoading] = useState(false);
  const [mostrarCalendar, setMostrarCalendar] = useState(false);
  const [registro, setRegistro] = useState({ nombres: "", apellidos: "", cedula: "", correo: "", telefono: "", fecha_nacimiento: "", contrasena: "" });

  const handleLogin = async () => {
    setError(""); setExito("");
    if (!correo || !password) { setError("Por favor completa todos los campos."); return; }
    setLoading(true);
    try { await login(correo, password); }
    catch (err) { setError(err.message || "Correo o contraseña incorrectos."); setLoading(false); }
  };

  const handleRegistro = async () => {
    setError("");
    setExito("");

    if (
      !registro.nombres ||
      !registro.apellidos ||
      !registro.cedula ||
      !registro.correo ||
      !registro.contrasena
    ) {
      setError("Completa nombres, apellidos, cédula, correo y contraseña.");
      return;
    }

    if (
      registro.fecha_nacimiento &&
      registro.fecha_nacimiento !== "1900-01-01"
    ) {

      const hoy = new Date();
      const fechaNacimiento = new Date(registro.fecha_nacimiento);

      // Validar fecha futura
      if (fechaNacimiento > hoy) {
        setError("La fecha de nacimiento no puede ser posterior a hoy.");
        return;
      }

      // Calcular edad
      let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();

      const mesActual = hoy.getMonth();
      const diaActual = hoy.getDate();

      const mesNacimiento = fechaNacimiento.getMonth();
      const diaNacimiento = fechaNacimiento.getDate();

      // Ajustar si aún no cumple años este año
      if (
        mesActual < mesNacimiento ||
        (mesActual === mesNacimiento && diaActual < diaNacimiento)
      ) {
        edad--;
      }

      // Validar mayoría de edad
      if (edad < 18) {
        setError("El cliente debe ser mayor de 18 años.");
        return;
      }
    }

    setLoading(true);

    try {
      await api.register(registro);

      setExito("Cuenta creada correctamente. Ahora puedes iniciar sesión.");

      setCorreo(registro.correo);
      setPassword(registro.contrasena);
      setModo("login");

    } catch (err) {
      setError(err.message || "No se pudo crear la cuenta.");
    } finally {
      setLoading(false);
    }
  };


  return <>
    <style>{css}</style>
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 39px, #2e2c2933 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, #2e2c2933 40px)`, opacity: .4 }} />
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse at 35% 45%, #2a1f0a 0%, transparent 65%)" }} />

    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, position: "relative", zIndex: 1 }}>
      <div style={{ width: "100%", maxWidth: 520 }}>
        <div className="fade-1" style={{ textAlign: "center", marginBottom: 30 }}>
          <div style={{ width: 68, height: 68, borderRadius: "50%", background: "linear-gradient(135deg, #e8a43a, #b8832e)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, margin: "0 auto 16px", boxShadow: "0 0 48px #e8a43a33" }}>🍽</div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, fontWeight: 700, color: "#f0ede6", letterSpacing: -.5 }}>Restaurante</h1>
          <p style={{ color: "#6b6a66", fontSize: 13, marginTop: 5 }}>Sistema de gestión — Ingreso al sistema</p>
        </div>

        <div className="fade-2" style={{ background: "#1a1916", border: "1px solid #2e2c29", borderRadius: 14, padding: 32, marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 22 }}>
            <button onClick={() => { setModo("login"); setError(""); }} style={{ flex: 1, background: modo === "login" ? "#e8a43a" : "#232220", color: modo === "login" ? "#0f0e0c" : "#8a8780", borderRadius: 8, padding: "10px 12px" }}>Ingresar</button>
            <button onClick={() => { setModo("registro"); setError(""); }} style={{ flex: 1, background: modo === "registro" ? "#e8a43a" : "#232220", color: modo === "registro" ? "#0f0e0c" : "#8a8780", borderRadius: 8, padding: "10px 12px" }}>Registrarme como cliente</button>
          </div>

          {modo === "login" ? <>
            <div style={{ marginBottom: 16 }}><Label>CORREO ELECTRÓNICO</Label><input type="email" placeholder="usuario@restaurante.com" value={correo} onChange={e => setCorreo(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} autoComplete="email" /></div>
            <div style={{ marginBottom: 24 }}><Label>CONTRASEÑA</Label><div style={{ position: "relative" }}><input type={verPass ? "text" : "password"} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} autoComplete="current-password" style={{ paddingRight: 44 }} /><button onClick={() => setVerPass(v => !v)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "transparent", color: "#6b6a66", fontSize: 16, padding: 4, lineHeight: 1 }}>{verPass ? "🙈" : "👁"}</button></div></div>
          </> : <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div><Label>NOMBRES</Label><input value={registro.nombres} onChange={e => setRegistro(p => ({ ...p, nombres: e.target.value }))} /></div>
              <div><Label>APELLIDOS</Label><input value={registro.apellidos} onChange={e => setRegistro(p => ({ ...p, apellidos: e.target.value }))} /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div><Label>CÉDULA</Label><input value={registro.cedula} onChange={e => setRegistro(p => ({ ...p, cedula: e.target.value }))} /></div>
              <div><Label>TELÉFONO</Label><input value={registro.telefono} onChange={e => setRegistro(p => ({ ...p, telefono: e.target.value }))} /></div>
            </div>
            <div style={{ marginBottom: 12 }}><Label>CORREO</Label><input type="email" value={registro.correo} onChange={e => setRegistro(p => ({ ...p, correo: e.target.value }))} /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
              <div><Label>FECHA NACIMIENTO</Label><button onClick={() => setMostrarCalendar(!mostrarCalendar)} style={{ width: "100%", background: "#1a1916", border: "1px solid #2e2c29", color: "#f0ede6", borderRadius: 8, padding: "11px 14px", textAlign: "left", cursor: "pointer", fontSize: 14 }}>📅 {registro.fecha_nacimiento ? formatDateYMD(registro.fecha_nacimiento) : "Selecciona una fecha"}</button>{mostrarCalendar && <MiniCalendar value={registro.fecha_nacimiento} maxDate={hoy} onChange={(fecha) => { setRegistro(p => ({ ...p, fecha_nacimiento: fecha })); setMostrarCalendar(false); }} />}</div>
              <div><Label>CONTRASEÑA</Label><input type="password" value={registro.contrasena} onChange={e => setRegistro(p => ({ ...p, contrasena: e.target.value }))} /></div>
            </div>
          </>}

          {error && <div style={{ background: "#e05c4b22", border: "1px solid #e05c4b44", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#e05c4b", marginBottom: 16 }}>{error}</div>}
          {exito && <div style={{ background: "#4caf7d22", border: "1px solid #4caf7d44", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#4caf7d", marginBottom: 16 }}>{exito}</div>}

          <button onClick={modo === "login" ? handleLogin : handleRegistro} disabled={loading} style={{ width: "100%", background: loading ? "#b8832e" : "#e8a43a", color: "#0f0e0c", fontWeight: 500, fontSize: 15, padding: "12px 20px", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "background .2s", opacity: loading ? .8 : 1 }}>
            {loading ? <><Spinner /> Procesando…</> : modo === "login" ? "Ingresar" : "Crear cuenta"}
          </button>
        </div>


        <div className="fade-4" style={{ textAlign: "center" }}><p style={{ fontSize: 12, color: "#6b6a66" }}>Cadena de restaurantes · Sistema interno v1.1</p></div>
      </div>
    </div>
  </>;
}
