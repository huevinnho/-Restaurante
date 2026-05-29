// src/context/AuthContext.jsx  — reemplaza el archivo actual
import { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Al montar: si hay token guardado, recuperar sesión
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { setLoading(false); return; }

    api.perfil()
      .then((u) => setUser(u))
      .catch(() => localStorage.removeItem("token"))
      .finally(() => setLoading(false));
  }, []);

  // Login real contra el backend
  const login = async (correo, contrasena) => {
    const { token, usuario } = await api.login(correo, contrasena);
    localStorage.setItem("token", token);
    setUser(usuario);
    return usuario;
  };

  const refreshUser = async () => {
    const usuario = await api.perfil();
    setUser(usuario);
    return usuario;
  };

  const cambiarMiSede = async (id_sede) => {
    const { token, usuario } = await api.cambiarMiSede(id_sede);
    localStorage.setItem("token", token);
    setUser(usuario);
    return usuario;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  if (loading) return null; // Esperar a restaurar sesión antes de renderizar

  return (
    <AuthContext.Provider value={{ user, login, logout, cambiarMiSede, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

// Permisos por módulo y rol (sin cambios)
export const PERMISOS = {
  verProveedores: ["admin_general", "super_admin"],
  verSalarios: ["admin_general", "super_admin"],
  verMemorandos: ["admin_general", "super_admin"],
  verFinanzasGlobales: ["super_admin"],
  verFinanzasSede: ["admin_general", "super_admin", "inversionista"],
  verIVA: ["admin_general", "super_admin"],
  verPropinas: ["admin_general", "super_admin"],
  verTotalIngresos: ["admin_general", "super_admin", "inversionista"],
  verEgresos: ["admin_general", "super_admin", "inversionista"],
  verLicencias: ["admin_general", "super_admin"],
  verEmpleados: ["admin_general", "super_admin"],
  generarFactura: ["admin_punto", "super_admin", "admin_general"],
  verResumenPagos: ["admin_punto", "admin_general", "super_admin"],
  crearMenu: ["admin_punto", "admin_general", "super_admin"],
  verRecetas: ["cocinero", "super_admin"],
  verColaPedidos: ["cocinero", "super_admin"],
  hacerPedido: ["mesero", "super_admin"],
  verMisPedidos: ["mesero", "super_admin"],
  verReservas: ["cliente", "admin_punto", "admin_general", "super_admin"],
  responderEncuesta: ["cliente"],
  verEncuestas: ["admin_general", "super_admin"],
};

export function usePuede() {
  const { user } = useContext(AuthContext);
  return (permiso) => {
    if (!user) return false;
    if (user.rol === "super_admin") return true;
    return PERMISOS[permiso]?.includes(user.rol) ?? false;
  };
}
