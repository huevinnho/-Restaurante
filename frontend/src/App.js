import { AuthProvider } from "./context/AuthContext";
import { RestauranteProvider } from "./context/RestauranteContext";
import AppRouter from "./routes/AppRouter";

export default function App() {
  return (
    <AuthProvider>
      <RestauranteProvider>
        <AppRouter />
      </RestauranteProvider>
    </AuthProvider>
  );
}