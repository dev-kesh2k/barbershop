import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import BarbershopDetail from "./pages/BarbershopDetail";
import Bookings from "./pages/Bookings";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import AdminDashboard from "./pages/Admin/Dashboard";
import AdminServices from "./pages/Admin/Services";
import AdminSchedule from "./pages/Admin/Schedule";
import AdminSettings from "./pages/Admin/Settings";
import { useAuth } from "./lib/auth";

function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <p>Carregando...</p>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AdminOnly({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <p>Carregando...</p>;
  if (!user || user.role !== "BARBER_ADMIN") return <Navigate to="/" replace />;
  return children;
}

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <p>Carregando...</p>;
  if (user?.role === "BARBER_ADMIN") return <Navigate to="/admin" replace />;
  return <BarbershopDetail />;
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomeRedirect />} />
          <Route path="bookings" element={<Bookings />} />
          <Route
            path="profile"
            element={
              <Protected>
                <Profile />
              </Protected>
            }
          />
          <Route path="login" element={<Login />} />
          <Route
            path="admin"
            element={
              <AdminOnly>
                <AdminDashboard />
              </AdminOnly>
            }
          />
          <Route
            path="admin/services"
            element={
              <AdminOnly>
                <AdminServices />
              </AdminOnly>
            }
          />
          <Route
            path="admin/schedule"
            element={
              <AdminOnly>
                <AdminSchedule />
              </AdminOnly>
            }
          />
          <Route
            path="admin/settings"
            element={
              <AdminOnly>
                <AdminSettings />
              </AdminOnly>
            }
          />
          <Route path="barbershops" element={<Navigate to="/" replace />} />
          <Route path="barbershops/:id" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
