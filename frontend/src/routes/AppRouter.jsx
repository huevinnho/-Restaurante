import { useAuth } from "../context/AuthContext";
import LoginPage         from "../pages/LoginPage";
import MeseroDashboard   from "../pages/MeseroDashboard";
import CocineroPage      from "../pages/CocineroPage";
import AdminPage         from "../pages/AdminPage";
import RHpage            from "../pages/RHpage";
import InversionistaPage from "../pages/InversionistaPage";
import ClientePage       from "../pages/ClientePage";
import SuperAdminPage    from "../pages/SuperAdminPage";

const DASHBOARDS = {
  mesero:        <MeseroDashboard />,
  cocinero:      <CocineroPage />,
  admin_punto:   <AdminPage />,
  admin_general: <RHpage />,
  inversionista: <InversionistaPage />,
  cliente:       <ClientePage />,
  super_admin:   <SuperAdminPage />,
};

export default function AppRouter() {
  const { user } = useAuth();
  if (!user) return <LoginPage />;
  return DASHBOARDS[user.rol] ?? <p>Rol no reconocido</p>;
}