import { useNavigate } from "react-router-dom";
import { useCart, lineUnitPrice } from "../../store/useCart";

export default function CartDrawer({ slug }) {
  const navigate = useNavigate();
  const isOpen = useCart((s) => s.isOpen);
  const close = useCart((s) => s.close);
  const lines = useCart((s) => s.lines);
  const changeQty = useCart((s) => s.changeQty);
  const removeLine = useCart((s) => s.removeLine);
  const clear = useCart((s) => s.clear);
  const total = useCart((s) => s.total());
  const count = useCart((s) => s.count());

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={close}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-ink">Your Order</h2>
            <span className="text-xs bg-sand px-2 py-0.5 rounded-full font-semibold">
              {count} items
            </span>
          </div>
          <button
            onClick={close}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 text-lg"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {lines.length === 0 ? (
            <div className="py-20 text-center text-gray-400">
              <span className="text-4xl block mb-2">🛒</span>
              Your cart is empty
            </div>
          ) : (
            lines.map((l) => {
              const unitPrice = lineUnitPrice(l);
              return (
                <div
                  key={l.key}
                  className="bg-sand/20 rounded-xl p-3 border border-sand/40 flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-sm text-ink">{l.name}</h4>
                      {l.options?.length > 0 && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {l.options.map((o) => o.name).join(", ")}
                        </p>
                      )}
                      {l.note && (
                        <p className="text-xs italic text-gray-400 mt-0.5">
                          "{l.note}"
                        </p>
                      )}
                    </div>
                    <span className="font-mono text-sm font-semibold text-ink">
                      ${(unitPrice * l.qty).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-sand/60">
                    <div className="flex items-center gap-2 bg-white rounded-lg border px-2 py-1">
                      <button
                        onClick={() => changeQty(l.key, -1)}
                        className="text-xs font-bold w-5 h-5 flex items-center justify-center hover:text-red-500"
                      >
                        −
                      </button>
                      <span className="text-xs font-semibold">{l.qty}</span>
                      <button
                        onClick={() => changeQty(l.key, 1)}
                        className="text-xs font-bold w-5 h-5 flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => removeLine(l.key)}
                      className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {lines.length > 0 && (
          <div className="p-4 border-t bg-white space-y-3">
            <div className="flex items-center justify-between text-base font-bold text-ink">
              <span>Total</span>
              <span className="font-mono text-lg">${total.toFixed(2)}</span>
            </div>

            <button
              onClick={() => {
                close();
                navigate(`/r/${slug}/checkout`);
              }}
              className="w-full bg-sage-dark text-white rounded-xl py-3 font-semibold hover:opacity-95 shadow-sm transition-all"
            >
              Checkout (${total.toFixed(2)})
            </button>

            <button
              onClick={clear}
              className="w-full text-xs text-gray-400 hover:text-red-500 text-center py-1"
            >
              Clear Cart
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
