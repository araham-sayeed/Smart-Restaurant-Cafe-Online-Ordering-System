import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getPublicMenu } from "../../api/menu";
import { useCart } from "../../store/useCart";
import ItemModal from "../../components/menu/ItemModal";
import CartDrawer from "../../components/cart/CartDrawer";

export default function Menu() {
  const { slug } = useParams();
  const [menu, setMenu] = useState(null);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const count = useCart((s) => s.count());
  const total = useCart((s) => s.total());
  const open = useCart((s) => s.open);

  useEffect(() => {
    getPublicMenu(slug)
      .then(setMenu)
      .catch(() => setError("Restaurant menu not found"));
  }, [slug]);

  if (error) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm text-center shadow-sm">
          <p className="text-ink font-medium mb-4">{error}</p>
          <Link to="/" className="text-sm text-sage-dark underline">
            Go back to homepage
          </Link>
        </div>
      </div>
    );
  }

  if (!menu) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <p className="text-ink/60 font-medium">Loading delicious menu…</p>
      </div>
    );
  }

  const effectiveSlug = slug || menu.slug;

  return (
    <div className="min-h-screen bg-cream pb-28 text-ink">
      {/* Header */}
      <header className="p-5 bg-white shadow-sm sticky top-0 z-20 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink">
            {menu.restaurant_name}
          </h1>
          <p className="text-xs text-ink/50">Online Ordering & Pickup</p>
        </div>
        <button
          onClick={open}
          className="relative px-3.5 py-2 bg-sand rounded-xl text-xs font-semibold hover:bg-sand/80 transition-colors"
        >
          🛒 Cart {count > 0 && <span className="text-sage-dark">({count})</span>}
        </button>
      </header>

      {/* Category Sections */}
      <main className="max-w-3xl mx-auto p-4 space-y-8">
        {menu.categories?.map((cat) => (
          <section key={cat.id} id={`cat-${cat.id}`} className="space-y-3">
            <h2 className="text-lg font-bold text-ink border-b pb-1.5 border-sand">
              {cat.name}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {cat.items?.map((item) => (
                <button
                  key={item.id}
                  disabled={!item.is_available}
                  onClick={() => setSelected(item)}
                  className="text-left bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all border border-transparent hover:border-sage/40 disabled:opacity-50 flex flex-col justify-between"
                >
                  <div>
                    {item.image_url && (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-32 object-cover rounded-lg mb-2"
                      />
                    )}
                    <div className="font-semibold text-ink text-base">
                      {item.name}
                    </div>
                    {item.description && (
                      <div className="text-xs text-ink/60 mt-1 line-clamp-2">
                        {item.description}
                      </div>
                    )}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="font-mono font-bold text-sage-dark">
                      ${Number(item.price).toFixed(2)}
                    </span>
                    {!item.is_available ? (
                      <span className="text-xs text-red-500 font-semibold bg-red-50 px-2 py-0.5 rounded">
                        Sold Out
                      </span>
                    ) : (
                      <span className="text-xs text-sage font-medium bg-sage/10 px-2 py-0.5 rounded">
                        + Add
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </section>
        ))}
      </main>

      {/* Floating Bottom Cart Bar */}
      {count > 0 && (
        <div className="fixed bottom-4 left-4 right-4 max-w-lg mx-auto z-30">
          <button
            onClick={open}
            className="w-full bg-sage-dark text-white rounded-2xl p-4 flex items-center justify-between shadow-xl hover:opacity-95 transition-all"
          >
            <div className="flex items-center gap-2">
              <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-xs font-bold">
                {count}
              </span>
              <span className="font-semibold text-sm">View order</span>
            </div>
            <span className="font-mono font-bold text-base">
              ${total.toFixed(2)}
            </span>
          </button>
        </div>
      )}

      {selected && (
        <ItemModal
          slug={effectiveSlug}
          item={selected}
          onClose={() => setSelected(null)}
        />
      )}

      <CartDrawer slug={effectiveSlug} />
    </div>
  );
}
