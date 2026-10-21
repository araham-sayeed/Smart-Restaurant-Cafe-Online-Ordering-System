import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../api/client";
import { useAuth } from "../../store/useAuth";

export default function Register() {
  const [form, setForm] = useState({
    restaurant_name: "",
    full_name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { setToken, fetchMe } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data } = await api.post("/auth/register", form);
      setToken(data.access_token);
      await fetchMe();
      navigate("/admin");
    } catch (err) {
      const message =
        err.response?.data?.detail || "Registration failed. Please check your information.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <form
        onSubmit={submit}
        className="bg-white rounded-xl shadow p-8 w-full max-w-sm space-y-4"
      >
        <div>
          <h1 className="text-2xl font-semibold text-ink">Create Restaurant</h1>
          <p className="text-xs text-gray-500 mt-1">
            Register your cafe or restaurant account
          </p>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-ink mb-1">
            Restaurant Name
          </label>
          <input
            className="w-full border rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage"
            type="text"
            placeholder="e.g. Cozy Corner Cafe"
            value={form.restaurant_name}
            onChange={(e) =>
              setForm({ ...form, restaurant_name: e.target.value })
            }
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-ink mb-1">
            Your Full Name
          </label>
          <input
            className="w-full border rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage"
            type="text"
            placeholder="e.g. Jane Doe"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-ink mb-1">
            Email Address
          </label>
          <input
            className="w-full border rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage"
            type="email"
            placeholder="owner@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-ink mb-1">
            Password
          </label>
          <input
            className="w-full border rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-sage"
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            minLength={6}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-sage-dark hover:opacity-95 text-white font-medium rounded p-2 transition-opacity disabled:opacity-50"
        >
          {loading ? "Creating Account..." : "Register Restaurant"}
        </button>

        <p className="text-sm text-ink text-center pt-2">
          Already have an account?{" "}
          <Link className="underline font-medium hover:text-sage-dark" to="/login">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}
