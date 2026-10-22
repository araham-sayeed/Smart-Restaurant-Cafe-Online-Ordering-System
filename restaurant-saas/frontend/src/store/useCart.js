import { create } from "zustand";
import { persist } from "zustand/middleware";

const lineKey = (itemId, options, note) =>
    `${itemId}|${options.map((o) => o.id).sort((a, b) => a - b).join(",")}|${note}`;

export const lineUnitPrice = (l) =>
    Number(l.basePrice) + l.options.reduce((s, o) => s + Number(o.extra_price), 0);

export const useCart = create(
    persist(
        (set, get) => ({
            slug: null,
            lines: [],
            isOpen: false,

            addLine: (slug, item, options, qty = 1, note = "") => {
                // different restaurant → start a fresh cart
                if (get().slug && get().slug !== slug) set({ lines: [], slug });
                else set({ slug });

                const key = lineKey(item.id, options, note);
                const existing = get().lines.find((l) => l.key === key);
                if (existing) {
                    set({ lines: get().lines.map((l) => (l.key === key ? { ...l, qty: l.qty + qty } : l)) });
                } else {
                    set({
                        lines: [
                            ...get().lines,
                            { key, itemId: item.id, name: item.name, basePrice: item.price, options, qty, note },
                        ],
                    });
                }
            },

            changeQty: (key, delta) =>
                set({
                    lines: get()
                        .lines.map((l) => (l.key === key ? { ...l, qty: l.qty + delta } : l))
                        .filter((l) => l.qty > 0),
                }),

            removeLine: (key) => set({ lines: get().lines.filter((l) => l.key !== key) }),
            clear: () => set({ lines: [] }),
            open: () => set({ isOpen: true }),
            close: () => set({ isOpen: false }),

            count: () => get().lines.reduce((s, l) => s + l.qty, 0),
            total: () => get().lines.reduce((s, l) => s + lineUnitPrice(l) * l.qty, 0),
        }),
        {
            name: "cart-storage",
            partialize: (s) => ({ slug: s.slug, lines: s.lines }), // don't persist isOpen
        }
    )
);