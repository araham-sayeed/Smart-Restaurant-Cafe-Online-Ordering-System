import { Link } from "react-router-dom";
import { useAuth } from "../../store/useAuth";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "owner";

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-ink">
      <nav className="bg-white border-b px-8 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold tracking-tight">Restaurant Portal</span>
          <span className="text-xs bg-sand px-2.5 py-0.5 rounded-full font-medium capitalize">
            Role: {user?.role}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-600">
            {user?.full_name}
          </span>
          <button
            onClick={logout}
            className="text-xs font-semibold px-3 py-1.5 border rounded-lg hover:bg-gray-100 transition-colors"
          >
            Log out
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight">
            Welcome, {user?.full_name?.split(" ")[0]} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isAdmin
              ? "You have Admin access: manage your restaurant catalog, pricing, and live inventory."
              : "You are logged in as a Customer: browse dishes, customize selections, and place orders."}
          </p>
        </div>

        {isAdmin ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card: Menu Builder (Admin Only) */}
            <Link
              to="/admin/menu"
              className="group block bg-white border rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-sage transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl">☕</span>
                <span className="text-xs font-semibold uppercase tracking-wider text-sage group-hover:underline">
                  Configure &rarr;
                </span>
              </div>
              <h2 className="text-lg font-bold text-ink mb-1 group-hover:text-sage transition-colors">
                Menu Builder
              </h2>
              <p className="text-xs text-gray-500">
                Create categories, add menu dishes, set item variations and prices, and manage real-time inventory.
              </p>
            </Link>

            {/* Card: Storefront Preview */}
            <div className="bg-white border rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl">🛍️</span>
                  <span className="text-xs bg-sage/20 text-ink px-2.5 py-0.5 rounded-full font-mono font-medium">
                    Admin Active
                  </span>
                </div>
                <h2 className="text-lg font-bold text-ink mb-1">Customer Storefront</h2>
                <p className="text-xs text-gray-500">
                  Preview how your online ordering menu appears to customers for dine-in and takeout.
                </p>
              </div>
              <div className="pt-4 mt-2">
                <Link
                  to="/admin/menu"
                  className="inline-block text-xs font-medium text-sage hover:underline"
                >
                  Manage Dishes & Modifiers &rarr;
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* Customer View */
          <div className="bg-white border rounded-2xl p-8 shadow-sm max-w-xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">🍽️</span>
              <div>
                <h2 className="text-xl font-bold text-ink">Customer Account</h2>
                <span className="text-xs text-gray-400">Order & Dine In</span>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              You are logged in as a <strong>Customer</strong>. Customers have access to browse the active menu, customize options, and place pickup/dine-in orders. Only <strong>Admin</strong> accounts can modify dishes, categories, and prices.
            </p>
            <div className="p-4 bg-sand/30 rounded-xl border border-sand text-xs text-gray-600">
              💡 <strong>Tip for Testing:</strong> If you want to test adding and editing menu items, log out and register an account selecting <strong>Admin</strong>.
            </div>
          </div>
        )}
      </main>
    </div>
  );
}