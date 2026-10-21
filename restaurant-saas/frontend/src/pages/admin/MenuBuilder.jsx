import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  getAdminMenu,
  createCategory,
  deleteCategory,
  createItem,
  deleteItem,
  setAvailability,
  createGroup,
  deleteGroup,
  createOption,
  deleteOption,
} from "../../api/menu";
import { useAuth } from "../../store/useAuth";

export default function MenuBuilder() {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [activeCatId, setActiveCatId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modals state
  const [showCatModal, setShowCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState("");

  const [showItemModal, setShowItemModal] = useState(false);
  const [itemForm, setItemForm] = useState({
    name: "",
    description: "",
    price: "",
    image_url: "",
  });

  const [groupModalItem, setGroupModalItem] = useState(null);
  const [groupForm, setGroupForm] = useState({
    name: "",
    is_required: false,
    min_select: 0,
    max_select: 1,
  });

  const [optModalGroup, setOptModalGroup] = useState(null);
  const [optForm, setOptForm] = useState({
    name: "",
    extra_price: "0",
  });

  const loadMenu = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAdminMenu();
      setCategories(data);
      if (data.length > 0 && !activeCatId) {
        setActiveCatId(data[0].id);
      }
    } catch (err) {
      setError("Failed to load menu: " + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  }, [activeCatId]);

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const data = await getAdminMenu();
        if (!ignore) {
          setCategories(data);
          if (data.length > 0) setActiveCatId(data[0].id);
          setLoading(false);
        }
      } catch (err) {
        if (!ignore) {
          setError("Failed to load menu: " + (err.response?.data?.detail || err.message));
          setLoading(false);
        }
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, []);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      const created = await createCategory({
        name: newCatName.trim(),
        sort_order: categories.length,
      });
      setNewCatName("");
      setShowCatModal(false);
      await loadMenu();
      setActiveCatId(created.id);
    } catch (err) {
      alert("Error adding category: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!confirm("Are you sure? All items in this category will be deleted.")) return;
    try {
      await deleteCategory(id);
      await loadMenu();
      if (activeCatId === id) setActiveCatId(null);
    } catch (err) {
      alert("Error deleting category: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!activeCatId) return;
    try {
      await createItem({
        category_id: activeCatId,
        name: itemForm.name,
        description: itemForm.description || null,
        price: parseFloat(itemForm.price),
        image_url: itemForm.image_url || null,
        sort_order: 0,
        is_available: true,
      });
      setItemForm({ name: "", description: "", price: "", image_url: "" });
      setShowItemModal(false);
      await loadMenu();
    } catch (err) {
      alert("Error adding item: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!confirm("Delete this menu item?")) return;
    try {
      await deleteItem(itemId);
      await loadMenu();
    } catch (err) {
      alert("Error deleting item: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleToggleAvailability = async (item) => {
    const nextState = !item.is_available;
    // Optimistic UI update
    setCategories((prev) =>
      prev.map((cat) => ({
        ...cat,
        items: cat.items.map((i) => (i.id === item.id ? { ...i, is_available: nextState } : i)),
      }))
    );
    try {
      await setAvailability(item.id, nextState);
    } catch (err) {
      alert("Failed to update availability: " + (err.response?.data?.detail || err.message));
      await loadMenu();
    }
  };

  const handleAddGroup = async (e) => {
    e.preventDefault();
    if (!groupModalItem) return;
    try {
      await createGroup(groupModalItem.id, {
        name: groupForm.name,
        is_required: groupForm.is_required,
        min_select: parseInt(groupForm.min_select, 10),
        max_select: parseInt(groupForm.max_select, 10),
      });
      setGroupModalItem(null);
      setGroupForm({ name: "", is_required: false, min_select: 0, max_select: 1 });
      await loadMenu();
    } catch (err) {
      alert("Error adding modifier group: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!confirm("Delete this modifier group?")) return;
    try {
      await deleteGroup(groupId);
      await loadMenu();
    } catch (err) {
      alert("Error deleting group: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleAddOption = async (e) => {
    e.preventDefault();
    if (!optModalGroup) return;
    try {
      await createOption(optModalGroup.id, {
        name: optForm.name,
        extra_price: parseFloat(optForm.extra_price || 0),
        is_available: true,
      });
      setOptModalGroup(null);
      setOptForm({ name: "", extra_price: "0" });
      await loadMenu();
    } catch (err) {
      alert("Error adding option: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleDeleteOption = async (optId) => {
    try {
      await deleteOption(optId);
      await loadMenu();
    } catch (err) {
      alert("Error deleting option: " + (err.response?.data?.detail || err.message));
    }
  };

  const activeCategory = categories.find((c) => c.id === activeCatId);

  if (user && user.role !== "admin" && user.role !== "owner") {
    return (
      <div className="min-h-screen bg-[#FBF9F5] flex items-center justify-center p-4">
        <div className="bg-white border rounded-2xl p-8 max-w-md text-center shadow-sm">
          <div className="text-3xl mb-2">🔒</div>
          <h2 className="text-xl font-bold text-ink mb-2">Admin Access Required</h2>
          <p className="text-sm text-gray-500 mb-6">
            Your account ({user.email}) is registered as a <strong>Customer</strong>. Only Admin accounts can configure categories and dishes.
          </p>
          <Link to="/admin" className="px-4 py-2 bg-sage text-white rounded-lg text-sm font-medium hover:opacity-95">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-ink">
      {/* Header */}
      <header className="border-b bg-white px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Link to="/admin" className="text-sm font-medium text-gray-500 hover:text-ink">
            &larr; Dashboard
          </Link>
          <div className="h-4 w-px bg-gray-200" />
          <h1 className="text-xl font-bold tracking-tight">Menu Builder</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs bg-sage/20 text-ink px-3 py-1 rounded-full font-medium">
            Restaurant #{user?.restaurant_id}
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Categories Bar / Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 border-b">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center">
              <button
                onClick={() => setActiveCatId(cat.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  activeCatId === cat.id
                    ? "bg-sage text-white shadow-sm"
                    : "bg-white text-ink hover:bg-sand/60 border border-gray-200"
                }`}
              >
                {cat.name} ({cat.items?.length || 0})
              </button>
              {activeCatId === cat.id && (
                <button
                  onClick={() => handleDeleteCategory(cat.id)}
                  title="Delete category"
                  className="ml-1 text-xs text-gray-400 hover:text-red-500 p-1"
                >
                  ✕
                </button>
              )}
            </div>
          ))}

          <button
            onClick={() => setShowCatModal(true)}
            className="px-4 py-2 border-2 border-dashed border-sage/50 text-sage hover:bg-sage/10 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
          >
            + New Category
          </button>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="py-20 text-center text-gray-400 font-medium">Loading menu...</div>
        ) : categories.length === 0 ? (
          <div className="bg-white border rounded-2xl p-12 text-center max-w-md mx-auto shadow-sm">
            <h3 className="text-lg font-semibold text-ink mb-2">No Categories Yet</h3>
            <p className="text-sm text-gray-500 mb-6">
              Create your first menu category (e.g. "Coffee", "Pastries", "Sandwiches") to start adding items.
            </p>
            <button
              onClick={() => setShowCatModal(true)}
              className="bg-sage text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:opacity-95"
            >
              Add First Category
            </button>
          </div>
        ) : !activeCategory ? (
          <div className="text-center py-12 text-gray-400">Select a category to view items.</div>
        ) : (
          <div>
            {/* Category Subheader */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-ink">{activeCategory.name}</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Manage dishes, pricing, modifiers, and availability
                </p>
              </div>
              <button
                onClick={() => setShowItemModal(true)}
                className="bg-sage text-white px-4 py-2 rounded-xl text-sm font-medium hover:opacity-95 shadow-sm"
              >
                + Add Item
              </button>
            </div>

            {/* Items Grid */}
            {activeCategory.items?.length === 0 ? (
              <div className="bg-white border rounded-xl p-8 text-center text-gray-400">
                No items in "{activeCategory.name}" yet. Click "+ Add Item" above!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeCategory.items?.map((item) => (
                  <div
                    key={item.id}
                    className={`bg-white rounded-2xl border transition-all p-5 shadow-sm flex flex-col justify-between ${
                      !item.is_available ? "opacity-60 bg-gray-50" : ""
                    }`}
                  >
                    <div>
                      {item.image_url && (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-36 object-cover rounded-xl mb-3"
                        />
                      )}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-bold text-ink text-base">{item.name}</h3>
                        <span className="font-mono font-semibold text-sm bg-sand px-2 py-0.5 rounded text-ink">
                          ${parseFloat(item.price).toFixed(2)}
                        </span>
                      </div>
                      {item.description && (
                        <p className="text-xs text-gray-500 line-clamp-2 mb-3">
                          {item.description}
                        </p>
                      )}

                      {/* Add-on Groups List */}
                      <div className="mt-4 pt-3 border-t">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Modifiers ({item.addon_groups?.length || 0})
                          </span>
                          <button
                            onClick={() => setGroupModalItem(item)}
                            className="text-xs text-sage font-medium hover:underline"
                          >
                            + Add Group
                          </button>
                        </div>

                        {item.addon_groups?.map((grp) => (
                          <div key={grp.id} className="bg-sand/40 rounded-lg p-2.5 mb-2 text-xs">
                            <div className="flex items-center justify-between font-medium text-ink mb-1">
                              <span>
                                {grp.name} {grp.is_required && <span className="text-terra font-bold">*</span>}
                              </span>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setOptModalGroup(grp)}
                                  className="text-xs text-sage font-bold hover:underline"
                                >
                                  + Option
                                </button>
                                <button
                                  onClick={() => handleDeleteGroup(grp.id)}
                                  className="text-gray-400 hover:text-red-500"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {grp.options?.map((opt) => (
                                <span
                                  key={opt.id}
                                  className="inline-flex items-center gap-1 bg-white border px-2 py-0.5 rounded text-[11px] text-gray-700"
                                >
                                  {opt.name}
                                  {parseFloat(opt.extra_price) > 0 && (
                                    <span className="text-gray-400">
                                      (+${parseFloat(opt.extra_price).toFixed(2)})
                                    </span>
                                  )}
                                  <button
                                    onClick={() => handleDeleteOption(opt.id)}
                                    className="text-gray-300 hover:text-red-500 text-[10px]"
                                  >
                                    ✕
                                  </button>
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="flex items-center justify-between pt-4 mt-3 border-t">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
                        <input
                          type="checkbox"
                          checked={item.is_available}
                          onChange={() => handleToggleAvailability(item)}
                          className="rounded text-sage focus:ring-sage"
                        />
                        <span>{item.is_available ? "In Stock" : "Sold Out"}</span>
                      </label>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-xs text-gray-400 hover:text-red-600 transition-colors"
                      >
                        Delete Item
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal: Create Category */}
      {showCatModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl">
            <h3 className="text-lg font-bold text-ink mb-4">New Category</h3>
            <form onSubmit={handleAddCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1">Category Name</label>
                <input
                  type="text"
                  placeholder="e.g. Specialty Drinks"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage"
                  required
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCatModal(false)}
                  className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sage text-white rounded-lg text-sm font-medium hover:opacity-95"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Item */}
      {showItemModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-bold text-ink mb-4">Add Item to {activeCategory?.name}</h3>
            <form onSubmit={handleAddItem} className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1">Item Name</label>
                <input
                  type="text"
                  placeholder="e.g. Vanilla Bean Latte"
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                  className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="4.75"
                  value={itemForm.price}
                  onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                  className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Description (optional)</label>
                <textarea
                  rows="2"
                  placeholder="Ingredients, notes, dietary info..."
                  value={itemForm.description}
                  onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                  className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Image URL (optional)</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={itemForm.image_url}
                  onChange={(e) => setItemForm({ ...itemForm, image_url: e.target.value })}
                  className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sage text-white rounded-lg text-sm font-medium hover:opacity-95"
                >
                  Add Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Addon Group */}
      {groupModalItem && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl">
            <h3 className="text-lg font-bold text-ink mb-1">New Modifier Group</h3>
            <p className="text-xs text-gray-500 mb-4">For item: {groupModalItem.name}</p>
            <form onSubmit={handleAddGroup} className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1">Group Name</label>
                <input
                  type="text"
                  placeholder="e.g. Milk Choice, Size, Extras"
                  value={groupForm.name}
                  onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                  className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage"
                  required
                />
              </div>
              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={groupForm.is_required}
                  onChange={(e) => setGroupForm({ ...groupForm, is_required: e.target.checked })}
                  className="rounded text-sage focus:ring-sage"
                />
                <span>Required selection (customer must pick)</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium mb-1">Min Select</label>
                  <input
                    type="number"
                    min="0"
                    value={groupForm.min_select}
                    onChange={(e) => setGroupForm({ ...groupForm, min_select: e.target.value })}
                    className="w-full border rounded-lg p-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Max Select</label>
                  <input
                    type="number"
                    min="1"
                    value={groupForm.max_select}
                    onChange={(e) => setGroupForm({ ...groupForm, max_select: e.target.value })}
                    className="w-full border rounded-lg p-2 text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setGroupModalItem(null)}
                  className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sage text-white rounded-lg text-sm font-medium hover:opacity-95"
                >
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Option */}
      {optModalGroup && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl">
            <h3 className="text-lg font-bold text-ink mb-1">Add Option</h3>
            <p className="text-xs text-gray-500 mb-4">In group: {optModalGroup.name}</p>
            <form onSubmit={handleAddOption} className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1">Option Name</label>
                <input
                  type="text"
                  placeholder="e.g. Almond Milk, Extra Shot"
                  value={optForm.name}
                  onChange={(e) => setOptForm({ ...optForm, name: e.target.value })}
                  className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Extra Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={optForm.extra_price}
                  onChange={(e) => setOptForm({ ...optForm, extra_price: e.target.value })}
                  className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setOptModalGroup(null)}
                  className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sage text-white rounded-lg text-sm font-medium hover:opacity-95"
                >
                  Add Option
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
