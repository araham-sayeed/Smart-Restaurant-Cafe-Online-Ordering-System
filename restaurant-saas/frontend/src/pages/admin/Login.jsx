import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../api/client";
import { useAuth } from "../../store/useAuth";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const { setToken, fetchMe } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post("/auth/login", form);
      setToken(data.access_token);
      await fetchMe();
      navigate("/admin");
    } catch {
      setError("Incorrect email or password");
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <form onSubmit={submit} className="bg-white rounded-xl shadow p-8 w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold text-ink">Log in</h1>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <input className="w-full border rounded p-2" type="email" placeholder="Email"
          value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <input className="w-full border rounded p-2" type="password" placeholder="Password"
          value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        <button className="w-full bg-sage-dark text-white rounded p-2">Log in</button>
        <p className="text-sm text-ink">No account? <Link className="underline" to="/register">Register</Link></p>
      </form>
    </div>
  );
}