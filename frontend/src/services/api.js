// src/services/api.js
// Centraliza todas las llamadas al backend.
// Uso: import api from '../services/api';

const BASE = "http://localhost:5000/api";

function getToken() {
  return localStorage.getItem("token");
}

async function request(method, path, body) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error del servidor");
  return data;
}

const api = {
  // ── Auth ──────────────────────────────────────────────────
  login:  (correo, contrasena) => request("POST", "/auth/login", { correo, contrasena }),
  register: (data)             => request("POST", "/auth/register", data),
  perfil: ()                   => request("GET",  "/auth/me"),
  cambiarMiSede: (id_sede)     => request("PUT", "/auth/mi-sede", { id_sede }),

  // ── Sedes ─────────────────────────────────────────────────
  getSedes: ()                 => request("GET", "/sedes"),
  crearSede: (data)            => request("POST", "/sedes", data),

  // ── Mesas ─────────────────────────────────────────────────
  getMesas:        (id_sede)    => request("GET",  id_sede ? `/mesas?id_sede=${id_sede}` : "/mesas"),
  actualizarMesa:  (id, data)   => request("PUT",  `/mesas/${id}`, data),

  // ── Pedidos ───────────────────────────────────────────────
  getPedidos:      (id_sede)    => request("GET",  id_sede ? `/pedidos?id_sede=${id_sede}` : "/pedidos"),
  crearPedido:     (data)       => request("POST", "/pedidos", data),
  actualizarEstado:(id, estado) => request("PUT",  `/pedidos/${id}/estado`, { estado }),

  // ── Menú ──────────────────────────────────────────────────
  getMenu:         (id_sede) => request("GET", id_sede ? `/menu?id_sede=${id_sede}` : "/menu"),
  crearMenu:       (data)    => request("POST", "/menu", data),
  actualizarMenu:  (id, data)=> request("PUT", `/menu/${id}`, data),
  eliminarMenu:    (id)      => request("DELETE", `/menu/${id}`),
  getReceta:       (id)      => request("GET", `/menu/${id}/receta`),

  // ── Inventario ────────────────────────────────────────────
  getInventario:     (id_sede) => request("GET", id_sede ? `/inventario?id_sede=${id_sede}` : "/inventario"),
  actualizarProducto:(id, data) => request("PUT", `/inventario/${id}`, data),

  // ── Facturas ──────────────────────────────────────────────
  getFacturas:  (id_sede) => request("GET",  id_sede ? `/facturas?id_sede=${id_sede}` : "/facturas"),
  getMisFacturas: ()    => request("GET",  "/facturas/mis-facturas"),
  crearFactura: (data) => request("POST", "/facturas", data),

  // ── Reservas ──────────────────────────────────────────────
  getReservas:    ()   => request("GET",  "/reservas"),
  getMesasDisponibles: (id_sede, fecha, hora, personas=1) => {
    const q = new URLSearchParams({ id_sede, personas });
    if (fecha) q.append("fecha", fecha);
    if (hora) q.append("hora", hora);
    return request("GET", `/reservas/disponibilidad?${q.toString()}`);
  },
  crearReserva:   (data) => request("POST", "/reservas", data),
  cancelarReserva:(id) => request("PUT",  `/reservas/${id}/cancelar`),

  // ── Usuarios ──────────────────────────────────────────────
  getUsuarios:  ()     => request("GET",  "/usuarios"),
  crearUsuario: (data) => request("POST", "/usuarios", data),
  toggleActivo: (id, activo) => request("PUT", `/usuarios/${id}/activo`, { activo }),

  // ── Clientes ──────────────────────────────────────────────
  getClientes:                 ()     => request("GET", "/clientes"),
  getPerfilCliente:        ()     => request("GET", "/clientes/perfil"),
  actualizarPerfilCliente: (data) => request("PUT", "/clientes/perfil", data),
  getMisReservas:          ()     => request("GET", "/reservas/mis-reservas"),
  getMisPedidos: () => request("GET", "/pedidos/mis-pedidos"),
  
  // ── Alergias ──────────────────────────────────────────────
  getAlergias:           ()      => request("GET", "/alergias"),
  getMisAlergias:        ()      => request("GET", "/alergias/mis-alergias"),
  actualizarMisAlergias: (ids)   => request("PUT", "/alergias/mis-alergias", { ids }),

  // ── Encuestas ─────────────────────────────────────────────
  getMisPedidosEntregados: ()     => request("GET",  "/encuestas/pedidos-disponibles"),
  getMisEncuestas:         ()     => request("GET",  "/encuestas/mis-encuestas"),
  crearEncuesta:           (data) => request("POST", "/encuestas", data),

  // ── Reseñas ───────────────────────────────────────────────
  getMisResenas: ()     => request("GET",  "/resenas/mis-resenas"),
  crearResena:   (data) => request("POST", "/resenas", data),

  // ── Inversionistas ────────────────────────────────────────
  getResumenInversionista:   ()         => request("GET", "/inversionistas/resumen"),
  getHistorialInversionista: (meses=6)  => request("GET", `/inversionistas/historial?meses=${meses}`),
  getInversionistas:         ()         => request("GET", "/inversionistas"),
  asignarSede: (data)                   => request("POST", "/inversionistas", data),
  quitarSede:  (id_usuario, id_sede)    => request("DELETE", `/inversionistas/${id_usuario}/sede/${id_sede}`),

  // ── RRHH: Empleados ───────────────────────────────────────
  getEmpleados:   ()     => request("GET",  "/empleados"),
  crearEmpleado:  (data) => request("POST", "/empleados", data),
  actualizarEmpleado: (id, data) => request("PUT", `/empleados/${id}`, data),

  // ── RRHH: Nómina ──────────────────────────────────────────
  getNomina:      (mes)  => request("GET",  `/empleados/nomina/lista${mes ? `?mes=${mes}` : ""}`),
  generarNomina:  ()     => request("POST", "/empleados/nomina/generar"),
  marcarNominaPagada: (id) => request("PUT", `/empleados/nomina/${id}/pagar`),

  // ── RRHH: Memorandos ──────────────────────────────────────
  getMemorandos:  ()     => request("GET",  "/empleados/memorandos/lista"),
  crearMemorando: (data) => request("POST", "/empleados/memorandos", data),

  // ── RRHH: Control de Seguridad ────────────────────────────
  getSeguridad:   ()     => request("GET",  "/empleados/seguridad/lista"),
  crearControlSeguridad: (data) => request("POST", "/empleados/seguridad", data),

  // ── RRHH: Asistencia ──────────────────────────────────────
  getAsistencia:  (fecha, id_sede) => {
    const q = new URLSearchParams();
    if (fecha) q.append("fecha", fecha);
    if (id_sede) q.append("id_sede", id_sede);
    return request("GET", `/empleados/asistencia/lista${q.toString() ? `?${q.toString()}` : ""}`);
  },
  registrarAsistencia: (data) => request("POST", "/empleados/asistencia", data),
};

export default api;
