import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./store/useAuth";
import ProtectedRoute from "./components/ProtectedRoute";

// Auth & admin pages
import Login from "./pages/admin/Login";
import Register from "./pages/admin/Register";
import Dashboard from "./pages/admin/Dashboard";
import MenuBuilder from "./pages/admin/MenuBuilder";

// Customer store pages
import Menu from "./pages/store/Menu";
import Checkout from "./pages/store/Checkout";
import OrderConfirmation from "./pages/store/OrderConfirmation";

// Phase 4 (uncomment each import and its route when you build the file)
// import LiveQueue from "./pages/kitchen/LiveQueue";
// import OrderTracking from "./pages/store/OrderTracking";

function Home() {
  const token = useAuth((s) => s.token);
  return <Navigate to={token ? "/admin" : "/login"} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Home */}
        <Route path="/" element={<Home />} />

        {/* Auth & admin */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/menu"
          element={
            <ProtectedRoute>
              <MenuBuilder />
            </ProtectedRoute>
          }
        />

        {/* Kitchen (Phase 4) */}
        {/*
        <Route
          path="/kitchen"
          element={
            <ProtectedRoute>
              <LiveQueue />
            </ProtectedRoute>
          }
        />
        */}

        {/* Customer storefront & order flow */}
        <Route path="/r/:slug" element={<Menu />} />
        <Route path="/r/:slug/checkout" element={<Checkout />} />
        <Route path="/r/:slug/order/:publicId" element={<OrderConfirmation />} />
        {/* Phase 4: replace OrderConfirmation above with <OrderTracking /> */}

        {/* Catch-all: unknown URLs follow the home rule */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}