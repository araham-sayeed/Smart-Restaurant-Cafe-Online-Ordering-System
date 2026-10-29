import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { createOrder } from "../../api/orders";
import { useCart } from "../../store/useCart";
import { useAuth } from "../../store/useAuth";

export default function Checkout() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { lines, clear } = useCart();
  const total = useCart((s) => s.total());

  const [form, setForm] = useState({
    customer_name: user?.full_name || "",
    customer_phone: user?.phone || "",
    order_type: "dine_in", // "dine_in" | "takeaway"
    table_number: "",
    payment_method: "cash", // "cash" | "card"
    notes: "",
  });

  // Demo card state
  const [cardDetails, setCardDetails] = useState({
    cardholder_name: user?.full_name || "",
    card_number: "",
    expiry: "",
    cvc: "",
  });

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        customer_name: prev.customer_name || user.full_name || "",
        customer_phone: prev.customer_phone || user.phone || "",
      }));
      setCardDetails((prev) => ({
        ...prev,
        cardholder_name: prev.cardholder_name || user.full_name || "",
      }));
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate("/customer/login");
  };

  const handleFillDemoCard = () => {
    setCardDetails({
      cardholder_name: form.customer_name || "Jane Doe",
      card_number: "4242 4242 4242 4242",
      expiry: "12/28",
      cvc: "888",
    });
  };

  const formatCardNumber = (val) => {
    const raw = val.replace(/\D/g, "").slice(0, 16);
    return raw.replace(/(\d{4})/g, "$1 ").trim();
  };

  const formatExpiry = (val) => {
    const raw = val.replace(/\D/g, "").slice(0, 4);
    if (raw.length >= 3) {
      return `${raw.slice(0, 2)}/${raw.slice(2, 4)}`;
    }
    return raw;
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate card details if card is selected
    if (form.payment_method === "card") {
      const cleanCard = cardDetails.card_number.replace(/\s+/g, "");
      if (cleanCard.length < 15) {
        setError("Please enter a valid 16-digit card number.");
        return;
      }
      if (!cardDetails.expiry || cardDetails.expiry.length < 4) {
        setError("Please enter a valid card expiry date (MM/YY).");
        return;
      }
      if (!cardDetails.cvc || cardDetails.cvc.length < 3) {
        setError("Please enter a valid 3-digit security code (CVC).");
        return;
      }
    }

    setBusy(true);

    const compiledNotes = [
      form.order_type === "dine_in" && form.table_number.trim()
        ? `Table/Seat: ${form.table_number.trim()}`
        : null,
      form.notes.trim() ? form.notes.trim() : null,
      form.payment_method === "card" ? "(Demo Card Payment Verified)" : null,
    ]
      .filter(Boolean)
      .join(" | ");

    try {
      const order = await createOrder(slug, {
        customer_name: form.customer_name.trim(),
        customer_phone: form.customer_phone.trim(),
        order_type: form.order_type,
        delivery_address: null,
        payment_method: form.payment_method,
        notes: compiledNotes || null,
        items: lines.map((l) => ({
          item_id: l.itemId,
          quantity: l.qty,
          option_ids: (l.options || []).map((o) => o.id),
          note: l.note || null,
        })),
      });

      clear();
      navigate(slug ? `/r/${slug}/order/${order.public_id}` : `/order/${order.public_id}`);
    } catch (err) {
      setError(err.response?.data?.detail || "Something went wrong placing your order.");
    } finally {
      setBusy(false);
    }
  };

  if (lines.length === 0) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm text-center shadow-sm border border-sand">
          <div className="text-3xl mb-2">🛒</div>
          <p className="text-ink font-semibold mb-2">Your cart is empty</p>
          <p className="text-xs text-ink/60 mb-6">Add delicious dishes from the menu to checkout.</p>
          <Link
            to={slug ? `/r/${slug}` : "/"}
            className="inline-block bg-sage-dark text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-95"
          >
            Browse Menu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream p-4 pb-16 flex items-center justify-center text-ink">
      <form
        onSubmit={submit}
        className="max-w-lg w-full bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-sand space-y-6"
      >
        {/* Top Header & Navigation */}
        <div className="flex items-center justify-between border-b border-sand pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink">Checkout</h1>
            <p className="text-xs text-ink/50 mt-0.5">Review your order and finalize payment</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to={slug ? `/r/${slug}` : "/"}
              className="text-xs text-ink/60 hover:text-ink font-semibold"
            >
              ← Back to Menu
            </Link>
            {user && (
              <button
                type="button"
                onClick={handleLogout}
                className="text-xs text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 px-2.5 py-1 rounded-lg font-semibold transition-colors"
                title="Log out of account"
              >
                Log out
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="text-xs text-red-600 bg-red-50 border border-red-200 p-3 rounded-xl font-medium">
            {error}
          </div>
        )}

        {/* 1. Contact Info */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-ink/50">
            1. Contact Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Your Name
              </label>
              <input
                className="w-full border border-sand rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sage"
                placeholder="Jane Doe"
                required
                value={form.customer_name}
                onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Phone Number
              </label>
              <input
                className="w-full border border-sand rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sage"
                placeholder="e.g. 050 123 4567"
                required
                value={form.customer_phone}
                onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* 2. Order Type: Strictly Dine In vs Take Away */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-ink/50">
            2. Dining Option
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setForm({ ...form, order_type: "dine_in" })}
              className={`p-3.5 rounded-xl border text-left transition-all flex items-center gap-3 ${
                form.order_type === "dine_in"
                  ? "border-sage bg-sage/10 ring-2 ring-sage/30 text-ink"
                  : "border-sand hover:border-sand/80 bg-white text-ink/70"
              }`}
            >
              <span className="text-2xl">🍽️</span>
              <div>
                <div className="text-sm font-bold">Dine In</div>
                <div className="text-[11px] text-ink/50">Eat at our restaurant</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setForm({ ...form, order_type: "takeaway" })}
              className={`p-3.5 rounded-xl border text-left transition-all flex items-center gap-3 ${
                form.order_type === "takeaway"
                  ? "border-sage bg-sage/10 ring-2 ring-sage/30 text-ink"
                  : "border-sand hover:border-sand/80 bg-white text-ink/70"
              }`}
            >
              <span className="text-2xl">🛍️</span>
              <div>
                <div className="text-sm font-bold">Take Away</div>
                <div className="text-[11px] text-ink/50">Pickup & take out</div>
              </div>
            </button>
          </div>

          {form.order_type === "dine_in" && (
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Table Number / Seating Note <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <input
                className="w-full border border-sand rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sage"
                placeholder="e.g. Table 4 or Outside Patio"
                value={form.table_number}
                onChange={(e) => setForm({ ...form, table_number: e.target.value })}
              />
            </div>
          )}
        </div>

        {/* 3. Payment Method: Strictly Cash vs Card */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-ink/50">
            3. Payment Method
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setForm({ ...form, payment_method: "cash" })}
              className={`p-3.5 rounded-xl border text-left transition-all flex items-center gap-3 ${
                form.payment_method === "cash"
                  ? "border-sage bg-sage/10 ring-2 ring-sage/30 text-ink"
                  : "border-sand hover:border-sand/80 bg-white text-ink/70"
              }`}
            >
              <span className="text-2xl">💵</span>
              <div>
                <div className="text-sm font-bold">Cash</div>
                <div className="text-[11px] text-ink/50">Pay at counter</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setForm({ ...form, payment_method: "card" })}
              className={`p-3.5 rounded-xl border text-left transition-all flex items-center gap-3 ${
                form.payment_method === "card"
                  ? "border-sage bg-sage/10 ring-2 ring-sage/30 text-ink"
                  : "border-sand hover:border-sand/80 bg-white text-ink/70"
              }`}
            >
              <span className="text-2xl">💳</span>
              <div>
                <div className="text-sm font-bold">Card</div>
                <div className="text-[11px] text-ink/50">Credit / Debit card</div>
              </div>
            </button>
          </div>

          {/* Cash details */}
          {form.payment_method === "cash" && (
            <div className="bg-sand/30 border border-sand rounded-xl p-3 text-xs text-ink/70 flex items-center gap-2">
              <span>ℹ️</span>
              <span>
                Please pay with cash at the counter upon{" "}
                <strong>{form.order_type === "dine_in" ? "dining" : "order pickup"}</strong>.
              </span>
            </div>
          )}

          {/* Card details (Demo Mode) */}
          {form.payment_method === "card" && (
            <div className="bg-sand/20 border border-sand rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                  <span>🔒 Demo Card Details</span>
                  <span className="bg-sage/20 text-sage-dark text-[10px] px-2 py-0.5 rounded-full font-semibold">
                    Test Mode
                  </span>
                </span>
                <button
                  type="button"
                  onClick={handleFillDemoCard}
                  className="text-[11px] font-semibold text-sage-dark hover:underline bg-white px-2 py-1 rounded-lg border border-sand shadow-2xs"
                >
                  ⚡ Auto-fill Demo Card
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-ink/70 mb-1">
                  Cardholder Name
                </label>
                <input
                  className="w-full bg-white border border-sand rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-sage font-medium"
                  placeholder="Jane Doe"
                  value={cardDetails.cardholder_name}
                  onChange={(e) =>
                    setCardDetails({ ...cardDetails, cardholder_name: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-ink/70 mb-1">
                  Card Number
                </label>
                <input
                  className="w-full bg-white border border-sand rounded-xl p-2.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-sage tracking-wider"
                  placeholder="•••• •••• •••• ••••"
                  maxLength={19}
                  value={cardDetails.card_number}
                  onChange={(e) =>
                    setCardDetails({
                      ...cardDetails,
                      card_number: formatCardNumber(e.target.value),
                    })
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-ink/70 mb-1">
                    Expires (MM/YY)
                  </label>
                  <input
                    className="w-full bg-white border border-sand rounded-xl p-2.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-sage"
                    placeholder="12/28"
                    maxLength={5}
                    value={cardDetails.expiry}
                    onChange={(e) =>
                      setCardDetails({
                        ...cardDetails,
                        expiry: formatExpiry(e.target.value),
                      })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-ink/70 mb-1">
                    CVC / CVV
                  </label>
                  <input
                    className="w-full bg-white border border-sand rounded-xl p-2.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-sage"
                    placeholder="888"
                    type="password"
                    maxLength={4}
                    value={cardDetails.cvc}
                    onChange={(e) =>
                      setCardDetails({
                        ...cardDetails,
                        cvc: e.target.value.replace(/\D/g, ""),
                      })
                    }
                    required
                  />
                </div>
              </div>
              <p className="text-[10px] text-gray-400">
                Demo card mode: no actual charges occur. Card details are validated for demonstration.
              </p>
            </div>
          )}
        </div>

        {/* 4. Special Notes */}
        <div>
          <label className="block text-xs font-semibold text-ink mb-1">
            Order Notes <span className="text-gray-400 font-normal">(Optional)</span>
          </label>
          <textarea
            className="w-full border border-sand rounded-xl p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-sage"
            rows="2"
            placeholder="Special preparation instructions, allergies..."
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>

        {/* 5. Summary & Action */}
        <div className="pt-2 border-t border-sand space-y-3">
          <div className="flex justify-between items-center text-sm font-semibold text-ink">
            <span>Total Payment ({lines.length} {lines.length === 1 ? "item" : "items"}):</span>
            <span className="font-mono text-lg font-bold text-sage-dark">
              ${total.toFixed(2)}
            </span>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full bg-sage-dark text-white rounded-xl py-3.5 font-bold hover:opacity-95 disabled:opacity-50 transition-all shadow-sm text-sm"
          >
            {busy
              ? "Placing Order..."
              : form.payment_method === "card"
              ? `Pay by Card · $${total.toFixed(2)}`
              : `Place Order (Cash) · $${total.toFixed(2)}`}
          </button>
        </div>
      </form>
    </div>
  );
}
