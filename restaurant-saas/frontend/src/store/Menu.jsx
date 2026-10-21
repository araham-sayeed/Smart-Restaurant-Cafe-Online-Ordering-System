import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
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
    getPublicMenu(slug).then(setMenu).catch(() => setError("Restaurant not found"));
  }, [slug]);

  if (error) return <p className="p-8 text-ink">{error}</p>;
  if (!menu) return <p className="p-8 text-ink">Loading…</p>;

  return (
    <div className="min-h-screen bg-cream pb-24">
      <header className="p-4 bg-white shadow-sm">
        <h1 className="text-xl font-semibold text-ink">{menu.restaurant_name}</h1>
      </header>

      {/* category tabs: <nav> with anchor links to #cat-{id} */}
      {menu.categories.map((cat) => (
        <section key={cat.id} id={`cat-${cat.id}`} className="p-4">
          <h2 className="text-lg font-medium text-ink mb-3">{cat.name}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {cat.items.map((item) => (
              <button
                key={item.id}
                disabled={!item.is_available}
                onClick={() => setSelected(item)}
                className="text-left bg-white rounded-xl p-4 shadow-sm disabled:opacity-50"
              >
                <div className="font-medium text-ink">{item.name}</div>
                <div className="text-sm text-ink/60">{item.description}</div>
                <div className="mt-2 text-sage-dark">
                  {Number(item.price).toFixed(2)}
                  {!item.is_available && <span className="ml-2 text-red-500">Out of stock</span>}
                </div>
              </button>
            ))}
          </div>
        </section>
      ))}

      {count > 0 && (
        <button onClick={open}
          className="fixed bottom-4 left-4 right-4 bg-sage-dark text-white rounded-xl p-4 flex justify-between">
          <span>View cart ({count})</span><span>{total.toFixed(2)}</span>
        </button>
      )}

      {selected && <ItemModal slug={slug} item={selected} onClose={() => setSelected(null)} />}
      <CartDrawer slug={slug} />
    </div>
  );
}