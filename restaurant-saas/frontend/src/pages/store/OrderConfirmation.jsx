import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getOrder } from "../../api/orders";

export default function OrderConfirmation() {
  const { slug, publicId } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOrder(slug, publicId)
      .then((data) => {
        setOrder(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.detail || "Order not found");
        setLoading(false);
      });
  }, [slug, publicId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <p className="text-ink/60 font-medium">Loading order details…</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm text-center shadow-sm">
          <p className="text-ink font-semibold mb-4">{error || "Order not found"}</p>
          <Link
            to={slug ? `/r/${slug}` : "/"}
            className="text-sm text-sage-dark underline"
          >
            Return to Menu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream p-4 flex items-center justify-center text-ink">
      <div className="max-w-md w-full bg-white rounded-2xl p-6 shadow-sm space-y-6">
        {/* Success Header */}
        <div className="text-center pt-2">
          <div className="w-14 h-14 bg-sage/20 text-sage-dark rounded-full flex items-center justify-center mx-auto text-2xl font-bold mb-3">
            ✓
          </div>
          <h1 className="text-2xl font-extrabold text-ink">Order Received!</h1>
          <p className="text-xs text-ink/60 mt-1">
            Thank you, {order.customer_name}. The kitchen has received your order.
          </p>
        </div>

        {/* Order Info Card */}
        <div className="bg-sand/30 rounded-xl p-4 text-xs space-y-2">
          <div className="flex justify-between items-center border-b border-sand pb-2">
            <span className="text-gray-500">Order Reference</span>
            <span className="font-mono font-bold text-ink">#{order.public_id.slice(0, 8).toUpperCase()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Status</span>
            <span className="bg-sage text-white font-semibold px-2.5 py-0.5 rounded-full capitalize">
              {order.status}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Fulfillment</span>
            <span className="font-semibold capitalize">{order.order_type}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Payment</span>
            <span className="font-semibold capitalize">
              {order.payment_method} ({order.payment_status})
            </span>
          </div>
          {order.notes && (
            <div className="pt-1 text-gray-500 italic">
              Note: "{order.notes}"
            </div>
          )}
        </div>

        {/* Items Summary */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Items Ordered
          </h3>
          <div className="divide-y text-xs">
            {order.items?.map((item, idx) => (
              <div key={idx} className="py-2.5 flex justify-between items-start">
                <div>
                  <div className="font-semibold text-ink">
                    {item.quantity}x {item.name}
                  </div>
                  {item.addons?.length > 0 && (
                    <div className="text-gray-500 text-[11px] mt-0.5">
                      + {item.addons.map((a) => a.name).join(", ")}
                    </div>
                  )}
                  {item.note && (
                    <div className="text-gray-400 text-[11px] italic">
                      "{item.note}"
                    </div>
                  )}
                </div>
                <span className="font-mono font-medium">
                  ${Number(item.line_total).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t pt-3 flex justify-between items-center text-sm font-bold text-ink">
            <span>Total to Pay</span>
            <span className="font-mono text-base text-sage-dark">
              ${Number(order.total).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2">
          <Link
            to={slug ? `/r/${slug}` : "/"}
            className="block text-center w-full bg-sand/60 hover:bg-sand text-ink rounded-xl py-3 text-xs font-semibold transition-colors"
          >
            &larr; Order More Items
          </Link>
        </div>
      </div>
    </div>
  );
}
