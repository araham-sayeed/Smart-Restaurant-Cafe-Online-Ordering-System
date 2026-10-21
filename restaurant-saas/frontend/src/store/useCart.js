import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Generate a stable key for a cart line based on item + chosen options.
 * Two lines are the same if they have the same item AND the same set of options.
 */
function makeKey(itemId, options = []) {
  const optIds = [...options].map((o) => o.id).sort().join(",");
  return `${itemId}:${optIds}`;
}

/**
 * Calculate the unit price of a cart line (base price + all selected add-on prices).
 */
export function lineUnitPrice(line) {
  const base = Number(line.price) || 0;
  const extras = (line.options || []).reduce(
    (sum, o) => sum + (Number(o.extra_price) || 0),
    0
  );
  return base + extras;
}

const useCart = create(
  persist(
    (set, get) => ({
      lines: [],   // array of line objects
      isOpen: false,

      // ── Actions ──────────────────────────────────────────────────────────────

      /**
       * Add an item to the cart.
       * If an identical line (same item + same options) already exists,
       * increment its quantity instead of creating a duplicate.
       */
      addLine: (slug, item, options = [], qty = 1, note = "") => {
        const key = makeKey(item.id, options);
        set((state) => {
          const existing = state.lines.find((l) => l.key === key);
          if (existing) {
            return {
              lines: state.lines.map((l) =>
                l.key === key ? { ...l, qty: l.qty + qty } : l
              ),
            };
          }
          return {
            lines: [
              ...state.lines,
              {
                key,
                slug,
                itemId: item.id,
                name: item.name,
                price: Number(item.price),
                options,
                qty,
                note,
              },
            ],
          };
        });
      },

      /** Change quantity by delta (+1 or -1). Removes the line if qty drops to 0. */
      changeQty: (key, delta) => {
        set((state) => {
          const updated = state.lines
            .map((l) => (l.key === key ? { ...l, qty: l.qty + delta } : l))
            .filter((l) => l.qty > 0);
          return { lines: updated };
        });
      },

      /** Remove a specific line entirely. */
      removeLine: (key) => {
        set((state) => ({ lines: state.lines.filter((l) => l.key !== key) }));
      },

      /** Clear all items from the cart. */
      clear: () => set({ lines: [] }),

      /** Open the cart drawer. */
      open: () => set({ isOpen: true }),

      /** Close the cart drawer. */
      close: () => set({ isOpen: false }),

      // ── Derived values (called as functions) ─────────────────────────────────

      /** Total number of individual items (sum of all qtys). */
      count: () => get().lines.reduce((n, l) => n + l.qty, 0),

      /** Total price across all lines. */
      total: () =>
        get().lines.reduce(
          (sum, l) => sum + lineUnitPrice(l) * l.qty,
          0
        ),
    }),
    {
      name: "restaurant-cart", // localStorage key
      // Only persist the lines array; isOpen should always reset to false on page load
      partialize: (state) => ({ lines: state.lines }),
    }
  )
);

export { useCart };
export default useCart;
