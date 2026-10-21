import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { createOrder } from "../../api/orders";
import { useCart } from "../../store/useCart";

export default function Checkout() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { lines, clear } = useCart();
  const total = useCart((s) => s.total());
  const [form, setForm] = useState({
    customer_name: "",
    customer_phone: "",
    order_type: "pickup",
    delivery_address: "",
    notes: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const order = await createOrder(slug, {
        ...form,
        delivery_address:
          form.order_type === "delivery" ? form.delivery_address : null,
        payment_method: "cash",
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
      setError(err.response?.data?.detail || "Something went wrong placing your order");
    } finally {
      setBusy(false);
    }
  };

  if (lines.length === 0) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm text-center shadow-sm">
          <p className="text-ink font-semibold mb-2">Your cart is empty</p>
          <p className="text-xs text-ink/60 mb-6">Add dishes from the menu to checkout.</p>
          <Link
            to={slug ? `/r/${slug}` : "/"}
            className="inline-block bg-sage-dark text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:opacity-95"
          >
            Browse Menu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream p-4 flex items-center justify-center">
      <form
        onSubmit={submit}
        className="max-w-md w-full bg-white rounded-2xl p-6 shadow-sm space-y-4"
      >
        <div className="flex items-center justify-between border-b pb-3">
          <h1 className="text-xl font-bold text-ink">Checkout</h1>
          <Link
            to={`/r/${slug}`}
            className="text-xs text-gray-500 hover:text-ink font-medium"
          >
            &larr; Back to Menu
          </Link>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-2.5 rounded-xl">
            {typeof error === "string" ? error : "Please check your order details."}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-ink mb-1">
            Your Name
          </label>
          <input
            className="w-full border rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sage"
            placeholder="Jane Doe"
            required
            value={form.customer_name}
            onChange={set("customer_name")}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-ink mb-1">
            Phone Number
          </label>
          <input
            className="w-full border rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sage"
            placeholder="(555) 000-0000"
            required
            value={form.customer_phone}
            onChange={set("customer_phone")}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-ink mb-1">
            Order Type
          </label>
          <select
            className="w-full border rounded-xl p-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sage"
            value={form.order_type}
            onChange={set("order_type")}
          >
            <option value="pickup">Pickup</option>
            <option value="delivery">Delivery</option>
          </select>
        </div>

        {form.order_type === "delivery" && (
          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              Delivery Address
            </label>
            <input
              className="w-full border rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sage"
              placeholder="123 Main St, Apt 4B"
              required
              value={form.delivery_address}
              onChange={set("delivery_address")}
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-ink mb-1">
            Order Notes (Optional)
          </label>
          <textarea
            className="w-full border rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sage"
            rows="2"
            placeholder="Special delivery notes or allergies..."
            value={form.notes}
            onChange={set("notes")}
          />
        </div>

        <div className="bg-sand/30 rounded-xl p-3 text-xs text-ink flex items-center justify-between">
          <span>Payment Method:</span>
          <span className="font-semibold">💵 Cash on {form.order_type}</span>
        </div>

        <button
          type="submit"
          disabled={busy}
          className="w-full bg-sage-dark text-white rounded-xl py-3.5 font-bold hover:opacity-95 disabled:opacity-50 transition-all shadow-sm"
        >
          {busy ? "Placing Order..." : `Place Order · $${total.toFixed(2)}`}
        </button>
      </form>
    </div>
  );
}
