import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getOrder, getOrderStreamUrl } from "../../api/orders";
import { useAuth } from "../../store/useAuth";

// ─── Live Countdown Timer ────────────────────────────────────────────────────
function LiveTimer({ prepStartedAt, targetMinutes }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!prepStartedAt) {
    // Kitchen hasn't started yet — show static estimate
    return (
      <div className="flex items-center gap-2 text-amber-700">
        <span className="text-lg">⏱️</span>
        <span className="font-mono font-bold text-xl">~{targetMinutes || 5}m</span>
        <span className="text-xs font-medium opacity-70">estimated</span>
      </div>
    );
  }

  const startMs = new Date(prepStartedAt).getTime();
  const targetMs = (targetMinutes || 5) * 60 * 1000;
  const elapsedMs = now - startMs;
  const remainingMs = targetMs - elapsedMs;
  const isOvertime = remainingMs < 0;
  const totalSecs = Math.abs(Math.floor(remainingMs / 1000));
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  const display = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  const progressPct = Math.min(100, Math.max(0, (elapsedMs / targetMs) * 100));

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{isOvertime ? "⚠️" : "⏱️"}</span>
          <span
            className={`font-mono font-extrabold text-2xl tabular-nums ${
              isOvertime ? "text-red-600 animate-pulse" : "text-amber-700"
            }`}
          >
            {isOvertime ? `+${display}` : display}
          </span>
        </div>
        <span className="text-[11px] font-semibold text-amber-700/70">
          {isOvertime ? "almost done!" : `of ~${targetMinutes}m`}
        </span>
      </div>
      {/* Progress bar */}
      <div className="w-full bg-amber-100 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${
            isOvertime ? "bg-red-400" : "bg-amber-500"
          }`}
          style={{ width: `${progressPct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Status Config ────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  received: {
    icon: "📋",
    label: "Order Received",
    sublabel: "Kitchen will start preparing shortly",
    bg: "bg-blue-50",
    border: "border-blue-200",
    badge: "bg-blue-100 text-blue-800",
    dot: "bg-blue-500",
  },
  preparing: {
    icon: "🍳",
    label: "Preparing",
    sublabel: "Your order is being prepared",
    bg: "bg-amber-50",
    border: "border-amber-300",
    badge: "bg-amber-100 text-amber-800",
    dot: "bg-amber-500 animate-ping",
  },
  ready: {
    icon: "🎉",
    label: "Ready for Pickup!",
    sublabel: "Please collect at the counter",
    bg: "bg-emerald-50",
    border: "border-emerald-300",
    badge: "bg-emerald-100 text-emerald-800",
    dot: "bg-emerald-500",
  },
  completed: {
    icon: "✓",
    label: "Completed",
    sublabel: "Thank you! Enjoy your order",
    bg: "bg-gray-50",
    border: "border-gray-200",
    badge: "bg-gray-100 text-gray-700",
    dot: "bg-gray-400",
  },
  cancelled: {
    icon: "✕",
    label: "Cancelled",
    sublabel: "This order was cancelled",
    bg: "bg-red-50",
    border: "border-red-200",
    badge: "bg-red-100 text-red-700",
    dot: "bg-red-400",
  },
};

const STEPS = ["received", "preparing", "ready", "completed"];

// ─── Main Component ───────────────────────────────────────────────────────────
export default function OrderConfirmation() {
  const { slug, publicId } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [streamConnected, setStreamConnected] = useState(false);

  // ── Initial fetch ──
  useEffect(() => {
    getOrder(slug, publicId)
      .then((data) => { setOrder(data); setLoading(false); })
      .catch((err) => { setError(err.response?.data?.detail || "Order not found"); setLoading(false); });
  }, [slug, publicId]);

  // ── SSE live stream ──
  useEffect(() => {
    if (!publicId) return;
    const sseUrl = getOrderStreamUrl(slug, publicId);
    let es;
    try {
      es = new EventSource(sseUrl);
      es.onopen = () => setStreamConnected(true);
      es.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.event === "order.updated" && payload.data) {
            setOrder((prev) => ({ ...prev, ...payload.data }));
          }
        } catch { /* ping */ }
      };
      es.onerror = () => setStreamConnected(false);
    } catch { /* no SSE support */ }
    return () => { if (es) es.close(); };
  }, [slug, publicId]);

  // ── Loading / error states ──
  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-ink/50 font-medium text-sm animate-pulse">Loading order…</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm text-center shadow-sm border border-sand">
          <p className="text-ink font-semibold mb-4">{error || "Order not found"}</p>
          <Link to={slug ? `/r/${slug}` : "/"} className="text-sm text-sage-dark underline">
            Back to Menu
          </Link>
        </div>
      </div>
    );
  }

  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.received;
  const currentStepIdx = STEPS.indexOf(order.status);
  const isPreparing = order.status === "preparing";
  const isReady = order.status === "ready";

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4 pb-16">
      <div className="max-w-sm w-full space-y-3">

        {/* ── Top nav ── */}
        <div className="flex items-center justify-between text-xs px-1">
          <Link
            to={slug ? `/r/${slug}` : "/"}
            className="text-ink/50 hover:text-ink font-semibold transition-colors"
          >
            ← Menu
          </Link>
          <div className="flex items-center gap-2">
            {/* Live indicator */}
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-ink/50">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  streamConnected ? "bg-emerald-500 animate-pulse" : "bg-gray-300"
                }`}
              />
              {streamConnected ? "Live" : "Connecting…"}
            </span>
            {user && (
              <button
                onClick={() => { logout(); navigate("/customer/login"); }}
                className="text-red-500 hover:text-red-700 font-semibold"
              >
                Log out
              </button>
            )}
          </div>
        </div>

        {/* ── ORDER REFERENCE ── */}
        <div className="text-center">
          <p className="text-[11px] text-ink/40 font-semibold uppercase tracking-widest">Order</p>
          <p className="font-mono font-extrabold text-2xl text-ink tracking-wider">
            #{order.public_id.slice(0, 8).toUpperCase()}
          </p>
        </div>

        {/* ══════════════════════════════════════════════════
            MAIN STATUS CARD — The focal point
        ══════════════════════════════════════════════════ */}
        <div className={`rounded-2xl border-2 p-5 ${cfg.bg} ${cfg.border} text-center space-y-3 transition-all duration-500`}>

          {/* Icon + status label */}
          <div className="flex flex-col items-center gap-2">
            <span className={`text-5xl ${isReady ? "animate-bounce" : ""}`}>
              {cfg.icon}
            </span>
            <div>
              <h1 className="text-xl font-extrabold text-ink tracking-tight">
                {cfg.label}
              </h1>
              <p className="text-xs text-ink/60 mt-0.5">{cfg.sublabel}</p>
            </div>
          </div>

          {/* Live countdown — only when preparing */}
          {isPreparing && (
            <div className={`rounded-xl border p-3 ${cfg.bg} ${cfg.border}`}>
              <LiveTimer
                prepStartedAt={order.prep_started_at}
                targetMinutes={order.estimated_prep_minutes}
              />
            </div>
          )}

          {/* Estimated wait — only when received (not started yet) */}
          {order.status === "received" && (
            <div className="text-xs text-blue-700/80 font-medium">
              ⏱️ Estimated wait: ~{order.estimated_prep_minutes || 5} min
            </div>
          )}

          {/* Ready pulsing CTA */}
          {isReady && (
            <div className="bg-emerald-600 text-white rounded-xl py-2.5 font-bold text-sm animate-pulse">
              🛎️ Please collect at the counter
            </div>
          )}
        </div>

        {/* ── STEP PROGRESS BAR ── */}
        <div className="bg-white rounded-2xl border border-sand p-4">
          <div className="flex items-center justify-between gap-1">
            {STEPS.map((step, i) => {
              const done = i <= currentStepIdx;
              const active = i === currentStepIdx && step !== "completed";
              return (
                <div key={step} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    {/* Dot */}
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                        done
                          ? "border-sage-dark bg-sage-dark"
                          : "border-gray-200 bg-white"
                      } ${active ? "ring-4 ring-sage/20 scale-125" : ""}`}
                    >
                      {done && (
                        <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 12 12">
                          <path d="M10 3L5 8.5 2 5.5" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"/>
                        </svg>
                      )}
                    </div>
                    {/* Label */}
                    <span
                      className={`text-[9px] mt-1 font-bold uppercase tracking-wider text-center leading-tight ${
                        done ? "text-sage-dark" : "text-gray-300"
                      }`}
                    >
                      {step === "received" ? "Received" :
                       step === "preparing" ? "Cooking" :
                       step === "ready" ? "Ready" : "Done"}
                    </span>
                  </div>
                  {/* Connector line */}
                  {i < STEPS.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 mx-1 rounded transition-all ${
                        i < currentStepIdx ? "bg-sage-dark" : "bg-gray-100"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── ORDER SUMMARY (compact) ── */}
        <div className="bg-white rounded-2xl border border-sand p-4 space-y-2">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-ink/40">
              Your Order
            </h3>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${cfg.badge}`}>
              {order.status}
            </span>
          </div>

          {/* Items */}
          <div className="divide-y divide-sand/60 text-xs">
            {order.items?.map((item, idx) => (
              <div key={idx} className="py-1.5 flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-ink">
                    {item.quantity}× {item.name}
                  </span>
                  {item.addons?.length > 0 && (
                    <div className="text-[10px] text-ink/50 mt-0.5">
                      +{item.addons.map((a) => a.name).join(", ")}
                    </div>
                  )}
                  {item.note && (
                    <div className="text-[10px] text-ink/40 italic">"{item.note}"</div>
                  )}
                </div>
                <span className="font-mono text-ink/70 shrink-0">
                  ${Number(item.line_total).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="pt-2 border-t border-sand flex items-center justify-between font-bold text-sm text-ink">
            <div className="flex items-center gap-2">
              <span>Total</span>
              <span className="text-[10px] font-normal text-ink/50 capitalize">
                ({order.payment_method} · {order.payment_status})
              </span>
            </div>
            <span className="font-mono text-sage-dark">${Number(order.total).toFixed(2)}</span>
          </div>
        </div>

        {/* ── ORDER MORE ── */}
        <Link
          to={slug ? `/r/${slug}` : "/"}
          className="block text-center w-full bg-white border border-sand hover:bg-sand/40 text-ink rounded-2xl py-3 text-xs font-semibold transition-colors"
        >
          + Order More Items
        </Link>
      </div>
    </div>
  );
}
