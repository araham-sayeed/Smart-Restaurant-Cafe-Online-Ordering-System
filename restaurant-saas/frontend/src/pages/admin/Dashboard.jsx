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
                Create categories, add menu dishes, set item variations, prep times, and manage real-time inventory.
              </p>
            </Link>

            {/* Card: Kitchen Live Display (Admin/Staff Only) */}
            <Link
              to="/admin/kitchen"
              className="group block bg-white border rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-amber-500 transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl">👨‍🍳</span>
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 group-hover:underline">
                  Live Queue &rarr;
                </span>
              </div>
              <h2 className="text-lg font-bold text-ink mb-1 group-hover:text-amber-600 transition-colors">
                Kitchen Display System (KDS)
              </h2>
              <p className="text-xs text-gray-500">
                Real-time kitchen order tickets, dynamic coffee & food prep countdown timers, and audio alerts.
              </p>
            </Link>

            <Link
              to={user?.restaurant_slug ? `/r/${user.restaurant_slug}` : "/menu"}
              className="group block bg-white border rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-sage transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl">🛍️</span>
                <span className="text-xs font-semibold uppercase tracking-wider text-sage group-hover:underline">
                  Open &rarr;
                </span>
              </div>
              <h2 className="text-lg font-bold text-ink mb-1">Customer Storefront</h2>
              <p className="text-xs text-gray-500">
                Preview the live menu customers see (same items as Menu Builder).
              </p>
            </Link>
          </div>
        ) : (
          <div className="bg-white border rounded-2xl p-8 shadow-sm max-w-xl">
            <h2 className="text-xl font-bold text-ink mb-2">Browse & order</h2>
            <p className="text-sm text-gray-600 mb-6">
              Your account is linked to the restaurant menu. Tap below to see every dish the kitchen offers.
            </p>
            <Link
              to={user?.restaurant_slug ? `/r/${user.restaurant_slug}` : "/menu"}
              className="inline-block bg-sage-dark text-white px-6 py-3 rounded-xl text-sm font-semibold hover:opacity-95"
            >
              Open menu
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}