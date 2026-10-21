import { useState } from "react";
import { useCart } from "../../store/useCart";

export default function ItemModal({ slug, item, onClose }) {
  const addLine = useCart((s) => s.addLine);
  const [selected, setSelected] = useState({}); // { [groupId]: [option, ...] }
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");

  const toggle = (group, opt) => {
    const current = selected[group.id] || [];
    let next;
    if (group.max_select === 1) {
      next = [opt]; // radio
    } else if (current.some((o) => o.id === opt.id)) {
      next = current.filter((o) => o.id !== opt.id);
    } else if (current.length < group.max_select) {
      next = [...current, opt];
    } else {
      next = current; // at max
    }
    setSelected({ ...selected, [group.id]: next });
  };

  const isValid = (item.addon_groups || []).every((g) => {
    const count = (selected[g.id] || []).length;
    const min = Math.max(g.min_select, g.is_required ? 1 : 0);
    return count >= min && count <= g.max_select;
  });

  const options = Object.values(selected).flat();
  const unit =
    Number(item.price) +
    options.reduce((s, o) => s + Number(o.extra_price || 0), 0);

  const add = () => {
    addLine(slug, item, options, qty, note.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-ink">{item.name}</h3>
        {item.description && (
          <p className="text-sm text-ink/60 mt-1">{item.description}</p>
        )}

        {item.addon_groups?.map((g) => (
          <div key={g.id} className="mt-4">
            <div className="font-medium text-ink">
              {g.name}{" "}
              <span className="text-xs text-ink/50">
                {g.is_required ? "(Required)" : "(Optional)"}
              </span>
            </div>
            {g.options
              ?.filter((o) => o.is_available)
              .map((o) => {
                const checked = (selected[g.id] || []).some(
                  (x) => x.id === o.id
                );
                return (
                  <label
                    key={o.id}
                    className="flex justify-between py-1.5 text-sm text-ink cursor-pointer hover:bg-gray-50 rounded px-1"
                  >
                    <span className="flex items-center">
                      <input
                        type={g.max_select === 1 ? "radio" : "checkbox"}
                        name={`g-${g.id}`}
                        checked={checked}
                        onChange={() => toggle(g, o)}
                        className="mr-2 rounded text-sage focus:ring-sage"
                      />
                      {o.name}
                    </span>
                    {Number(o.extra_price) > 0 && (
                      <span className="text-gray-500">
                        +${Number(o.extra_price).toFixed(2)}
                      </span>
                    )}
                  </label>
                );
              })}
          </div>
        ))}

        <textarea
          className="w-full border rounded-lg p-2 mt-4 text-sm focus:outline-none focus:ring-2 focus:ring-sage"
          placeholder="Special instructions (optional)"
          maxLength={200}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <div className="flex items-center justify-between mt-4 pt-2 border-t">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setQty(Math.max(1, qty - 1))}
              className="w-8 h-8 border rounded-lg flex items-center justify-center font-bold hover:bg-gray-50"
            >
              −
            </button>
            <span className="font-semibold">{qty}</span>
            <button
              onClick={() => setQty(Math.min(50, qty + 1))}
              className="w-8 h-8 border rounded-lg flex items-center justify-center font-bold hover:bg-gray-50"
            >
              +
            </button>
          </div>
          <button
            disabled={!isValid}
            onClick={add}
            className="bg-sage text-white rounded-lg px-5 py-2 font-medium disabled:opacity-40 hover:opacity-95"
          >
            Add · ${(unit * qty).toFixed(2)}
          </button>
        </div>
        <button
          onClick={onClose}
          className="mt-3 w-full text-sm text-ink/60 hover:text-ink text-center py-1"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
