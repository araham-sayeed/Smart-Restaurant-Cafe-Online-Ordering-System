import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getKitchenOrders, updateOrderStatus, getKitchenStreamUrl } from "../../api/kitchen";
import { useAuth } from "../../store/useAuth";

// Synthesize pleasant kitchen alert chime via Web Audio API (no external asset needed)
function playKitchenChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = "sine";
    osc2.type = "triangle";

    // Two-tone bell chime (G5 and C6)
    osc1.frequency.setValueAtTime(783.99, ctx.currentTime);
    osc2.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(ctx.currentTime);
    osc2.start(ctx.currentTime + 0.1);
    osc1.stop(ctx.currentTime + 0.8);
    osc2.stop(ctx.currentTime + 0.8);
  } catch (err) {
    console.warn("Could not play audio chime", err);
  }
}

// Active Timer Component for Preparing tickets
function CountdownTimer({ prepStartedAt, targetMinutes }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!prepStartedAt) {
    return <span className="font-mono text-xs text-gray-500">⏱️ {targetMinutes}m target</span>;
  }

  const startTime = new Date(prepStartedAt).getTime();
  const targetDurationMs = (targetMinutes || 5) * 60 * 1000;
  const elapsedMs = now - startTime;
  const remainingMs = targetDurationMs - elapsedMs;

  const isOvertime = remainingMs < 0;
  const totalSecs = Math.abs(Math.floor(remainingMs / 1000));
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  const formatted = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  const progressPercent = Math.min(100, Math.max(0, (elapsedMs / targetDurationMs) * 100));

  return (
    <div className="space-y-1.5 w-full">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-gray-600">
          {isOvertime ? "⚠️ Overtime:" : "⏱️ Remaining:"}
        </span>
        <span
          className={`font-mono text-sm font-extrabold ${
            isOvertime ? "text-red-600 animate-pulse" : "text-amber-700"
          }`}
        >
          {isOvertime ? `+${formatted}` : formatted}
        </span>
      </div>
      <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ${
            isOvertime ? "bg-red-500" : "bg-amber-500"
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}

export default function Kitchen() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [error, setError] = useState("");
  const [busyOrderId, setBusyOrderId] = useState(null);

  const soundRef = useRef(soundEnabled);
  soundRef.current = soundEnabled;

  const handleLogout = () => {
    logout();
    navigate("/customer/login");
  };

  // Initial Load
  const fetchOrders = async () => {
    try {
      const data = await getKitchenOrders(true);
      setOrders(data);
      setError("");
    } catch (err) {
      setError(err.response?.data?.detail || "Could not load kitchen orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Real-time SSE Connection
  useEffect(() => {
    const sseUrl = getKitchenStreamUrl();
    let es = null;

    try {
      es = new EventSource(sseUrl);

      es.onopen = () => {
        setConnected(true);
      };

      es.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.event === "order.created") {
            if (soundRef.current) playKitchenChime();
            setOrders((prev) => {
              if (prev.some((o) => o.id === payload.data.id)) return prev;
              return [payload.data, ...prev];
            });
          } else if (payload.event === "order.updated") {
            setOrders((prev) =>
              prev.map((o) => (o.id === payload.data.id ? { ...o, ...payload.data } : o))
            );
          }
        } catch {
          // Heartbeat ping or raw message
        }
      };

      es.onerror = () => {
        setConnected(false);
      };
    } catch (err) {
      console.warn("EventSource error", err);
    }

    return () => {
      if (es) es.close();
    };
  }, []);

  // Status Machine Handlers
  const handleTransition = async (orderId, newStatus) => {
    setBusyOrderId(orderId);
    try {
      const updated = await updateOrderStatus(orderId, newStatus);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
    } catch (err) {
      alert(err.response?.data?.detail || "Error updating status");
    } finally {
      setBusyOrderId(null);
    }
  };

  // Group orders by column
  const receivedOrders = orders.filter((o) => o.status === "received");
  const preparingOrders = orders.filter((o) => o.status === "preparing");
  const readyOrders = orders.filter((o) => o.status === "ready");
  const completedOrders = orders.filter((o) => o.status === "completed").slice(0, 8);

  return (
    <div className="min-h-screen bg-[#F5F3EF] text-ink flex flex-col">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b px-6 py-3.5 flex items-center justify-between shadow-xs sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <Link
            to="/admin"
            className="text-xs font-semibold text-gray-500 hover:text-ink transition-colors"
          >
            ← Dashboard
          </Link>
          <div className="h-4 w-px bg-gray-200" />
          <div className="flex items-center gap-2">
            <span className="text-xl">👨‍🍳</span>
            <h1 className="text-lg font-extrabold tracking-tight">Kitchen Live Queue</h1>
          </div>
          <span
            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 ${
              connected
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-amber-50 text-amber-700 border border-amber-200"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                connected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
              }`}
            />
            {connected ? "Live Stream Active" : "Connecting..."}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSoundEnabled((v) => !v)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition-colors flex items-center gap-1.5 ${
              soundEnabled
                ? "bg-sand/60 border-sand text-ink"
                : "bg-gray-100 border-gray-200 text-gray-400"
            }`}
            title="Toggle kitchen order audio alerts"
          >
            <span>{soundEnabled ? "🔔" : "🔕"}</span>
            <span>{soundEnabled ? "Sound On" : "Muted"}</span>
          </button>

          <button
            type="button"
            onClick={fetchOrders}
            className="text-xs font-semibold px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors"
          >
            ↻ Refresh
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="text-xs font-semibold px-3 py-1.5 text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-colors"
          >
            Log out
          </button>
        </div>
      </header>

      {error && (
        <div className="bg-red-50 border-b border-red-200 text-red-700 px-6 py-2 text-xs font-medium">
          {error}
        </div>
      )}

      {/* Main Kanban Board */}
      <main className="flex-1 p-6 grid grid-cols-1 md:grid-cols-4 gap-6 max-w-[1700px] w-full mx-auto overflow-x-auto">
        {/* Column 1: Received / New */}
        <div className="flex flex-col bg-[#ECE9E2]/60 rounded-2xl p-4 border border-sand/80">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500" />
              <h2 className="font-extrabold text-sm uppercase tracking-wider text-ink">
                New Orders
              </h2>
            </div>
            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded-full">
              {receivedOrders.length}
            </span>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto pr-1">
            {receivedOrders.length === 0 ? (
              <div className="h-40 border-2 border-dashed border-sand/80 rounded-xl flex items-center justify-center text-xs text-gray-400">
                No new orders
              </div>
            ) : (
              receivedOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-xl p-4 shadow-sm border border-sand hover:shadow-md transition-all space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-mono font-bold text-base text-ink">
                        #{order.public_id.slice(0, 6).toUpperCase()}
                      </div>
                      <div className="text-xs font-semibold text-gray-600">
                        {order.customer_name}
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        order.order_type === "dine_in"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {order.order_type === "dine_in" ? "🍽️ Dine In" : "🛍️ Takeaway"}
                    </span>
                  </div>

                  <div className="bg-sand/30 rounded-lg p-2 text-xs space-y-1">
                    {order.items?.map((it, idx) => (
                      <div key={idx} className="flex justify-between font-medium">
                        <span>
                          <strong>{it.quantity}x</strong> {it.name}
                        </span>
                        {it.addons?.length > 0 && (
                          <span className="text-[10px] text-gray-500">
                            +{it.addons.map((a) => a.name).join(", ")}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {order.notes && (
                    <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 p-1.5 rounded-md italic">
                      "{order.notes}"
                    </p>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-500 pt-1 border-t border-gray-100">
                    <span className="font-semibold">
                      ⏱️ Target: {order.estimated_prep_minutes}m
                    </span>
                    <span className="capitalize">{order.payment_method}</span>
                  </div>

                  <button
                    type="button"
                    disabled={busyOrderId === order.id}
                    onClick={() => handleTransition(order.id, "preparing")}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 rounded-xl text-xs transition-colors shadow-2xs"
                  >
                    Start Preparing ({order.estimated_prep_minutes}m) →
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 2: In Preparation */}
        <div className="flex flex-col bg-[#ECE9E2]/60 rounded-2xl p-4 border border-sand/80">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500 animate-ping" />
              <h2 className="font-extrabold text-sm uppercase tracking-wider text-ink">
                Preparing
              </h2>
            </div>
            <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full">
              {preparingOrders.length}
            </span>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto pr-1">
            {preparingOrders.length === 0 ? (
              <div className="h-40 border-2 border-dashed border-sand/80 rounded-xl flex items-center justify-center text-xs text-gray-400">
                No dishes cooking
              </div>
            ) : (
              preparingOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-xl p-4 shadow-sm border-2 border-amber-400 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-mono font-bold text-base text-ink">
                        #{order.public_id.slice(0, 6).toUpperCase()}
                      </div>
                      <div className="text-xs font-semibold text-gray-600">
                        {order.customer_name}
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        order.order_type === "dine_in"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {order.order_type === "dine_in" ? "🍽️ Dine In" : "🛍️ Takeaway"}
                    </span>
                  </div>

                  {/* Dynamic Countdown Timer */}
                  <CountdownTimer
                    prepStartedAt={order.prep_started_at}
                    targetMinutes={order.estimated_prep_minutes || 5}
                  />

                  <div className="bg-sand/30 rounded-lg p-2 text-xs space-y-1">
                    {order.items?.map((it, idx) => (
                      <div key={idx} className="flex justify-between font-medium">
                        <span>
                          <strong>{it.quantity}x</strong> {it.name}
                        </span>
                        {it.addons?.length > 0 && (
                          <span className="text-[10px] text-gray-500">
                            +{it.addons.map((a) => a.name).join(", ")}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    disabled={busyOrderId === order.id}
                    onClick={() => handleTransition(order.id, "ready")}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors shadow-2xs"
                  >
                    Mark Ready ✓
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 3: Ready */}
        <div className="flex flex-col bg-[#ECE9E2]/60 rounded-2xl p-4 border border-sand/80">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <h2 className="font-extrabold text-sm uppercase tracking-wider text-ink">
                Ready for Pickup
              </h2>
            </div>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-0.5 rounded-full">
              {readyOrders.length}
            </span>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto pr-1">
            {readyOrders.length === 0 ? (
              <div className="h-40 border-2 border-dashed border-sand/80 rounded-xl flex items-center justify-center text-xs text-gray-400">
                No orders waiting
              </div>
            ) : (
              readyOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-xl p-4 shadow-sm border border-emerald-400 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-mono font-bold text-base text-ink">
                        #{order.public_id.slice(0, 6).toUpperCase()}
                      </div>
                      <div className="text-xs font-semibold text-gray-600">
                        {order.customer_name}
                      </div>
                    </div>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                      Ready 🎉
                    </span>
                  </div>

                  <div className="bg-sand/30 rounded-lg p-2 text-xs space-y-1">
                    {order.items?.map((it, idx) => (
                      <div key={idx} className="flex justify-between font-medium">
                        <span>
                          <strong>{it.quantity}x</strong> {it.name}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="text-xs text-gray-500 flex justify-between">
                    <span>{order.customer_phone}</span>
                    <span>${Number(order.total).toFixed(2)}</span>
                  </div>

                  <button
                    type="button"
                    disabled={busyOrderId === order.id}
                    onClick={() => handleTransition(order.id, "completed")}
                    className="w-full bg-ink hover:opacity-90 text-white font-bold py-2.5 rounded-xl text-xs transition-colors shadow-2xs"
                  >
                    Complete / Picked Up →
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 4: Completed */}
        <div className="flex flex-col bg-[#ECE9E2]/60 rounded-2xl p-4 border border-sand/80">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-gray-400" />
              <h2 className="font-extrabold text-sm uppercase tracking-wider text-ink">
                Recent Completed
              </h2>
            </div>
            <span className="bg-gray-200 text-gray-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {completedOrders.length}
            </span>
          </div>

          <div className="flex-1 space-y-2.5 overflow-y-auto pr-1 opacity-80">
            {completedOrders.length === 0 ? (
              <div className="h-40 border-2 border-dashed border-sand/80 rounded-xl flex items-center justify-center text-xs text-gray-400">
                No completed history
              </div>
            ) : (
              completedOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-xl p-3 shadow-2xs border border-gray-200 text-xs space-y-1"
                >
                  <div className="flex justify-between items-center font-semibold">
                    <span className="font-mono text-ink">
                      #{order.public_id.slice(0, 6).toUpperCase()}
                    </span>
                    <span className="text-gray-400 text-[10px]">
                      {new Date(order.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="text-gray-600 truncate">
                    {order.customer_name} · ${Number(order.total).toFixed(2)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
