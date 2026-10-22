import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./store/useAuth";
import AdminRoute from "./components/AdminRoute";
import OtpNotificationBar from "./components/OtpNotificationBar";

import AdminLogin from "./pages/admin/Login";
import CustomerLogin from "./pages/customer/Login";
import CustomerRegister from "./pages/customer/Register";
import Dashboard from "./pages/admin/Dashboard";
import MenuBuilder from "./pages/admin/MenuBuilder";

import Menu from "./pages/store/Menu";
import MenuRedirect from "./pages/store/MenuRedirect";
import Checkout from "./pages/store/Checkout";
import OrderConfirmation from "./pages/store/OrderConfirmation";

const isAdminRole = (role) => role === "admin" || role === "owner";

function Home() {
  const token = useAuth((s) => s.token);
  const user = useAuth((s) => s.user);
  const fetchMe = useAuth((s) => s.fetchMe);

  useEffect(() => {
    if (token && !user) fetchMe().catch(() => {});
  }, [token, user, fetchMe]);

  if (!token) {
    return <Navigate to="/customer/login" replace />;
  }
  if (user) {
    if (isAdminRole(user.role)) {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to={user.restaurant_slug ? `/r/${user.restaurant_slug}` : "/menu"} replace />;
  }
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center text-ink/60">
      Loading…
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <OtpNotificationBar />
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/login" element={<AdminLogin />} />
        <Route path="/customer/login" element={<CustomerLogin />} />
        <Route path="/register" element={<CustomerRegister />} />

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <Dashboard />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/menu"
          element={
            <AdminRoute>
              <MenuBuilder />
            </AdminRoute>
          }
        />

        <Route path="/menu" element={<MenuRedirect />} />
        <Route path="/r/:slug" element={<Menu />} />
        <Route path="/r/:slug/checkout" element={<Checkout />} />
        <Route path="/r/:slug/order/:publicId" element={<OrderConfirmation />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
