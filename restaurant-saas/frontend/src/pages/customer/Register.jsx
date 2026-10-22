import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerCustomer, requestOtp } from "../../api/auth";
import { useAuth } from "../../store/useAuth";
import { useOtpBanner } from "../../store/useOtpBanner";

export default function CustomerRegister() {
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    password: "",
    otp_code: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const { setToken, fetchMe } = useAuth();
  const showOtp = useOtpBanner((s) => s.show);
  const navigate = useNavigate();

  const sendOtp = async () => {
    setError("");
    try {
      const data = await requestOtp(form.phone, "register");
      if (data.dev_otp) showOtp(data.dev_otp, "Registration code");
      setOtpSent(true);
    } catch (err) {
      setError(err.response?.data?.detail || "Could not send verification code");
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!otpSent) {
      setError("Send a verification code first");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const data = await registerCustomer(form);
      setToken(data.access_token);
      const me = await fetchMe();
      navigate(me.restaurant_slug ? `/r/${me.restaurant_slug}` : "/menu");
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4 pt-16">
      <form onSubmit={submit} className="bg-white rounded-xl shadow p-8 w-full max-w-sm space-y-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Create customer account</h1>
          <p className="text-xs text-gray-500 mt-1">Order pickup or delivery from our menu</p>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">{error}</div>
        )}

        <input
          className="w-full border rounded p-2 text-sm"
          type="text"
          placeholder="Full name"
          value={form.full_name}
          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
          required
        />
        <input
          className="w-full border rounded p-2 text-sm"
          type="tel"
          placeholder="Phone e.g. 0501111111"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          required
        />
        <input
          className="w-full border rounded p-2 text-sm"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
          minLength={6}
        />

        <div className="flex gap-2">
          <input
            className="flex-1 border rounded p-2 text-sm font-mono"
            type="text"
            placeholder="Verification code"
            value={form.otp_code}
            onChange={(e) => setForm({ ...form, otp_code: e.target.value })}
            required
          />
          <button
            type="button"
            onClick={sendOtp}
            className="shrink-0 px-3 py-2 text-xs font-semibold border rounded-lg hover:bg-sand/50"
          >
            Send code
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-sage-dark text-white rounded p-2 disabled:opacity-50"
        >
          {loading ? "Creating account…" : "Register"}
        </button>

        <p className="text-sm text-center">
          Already have an account?{" "}
          <Link className="underline font-medium" to="/customer/login">
            Log in
          </Link>
        </p>
        <p className="text-xs text-center text-gray-400">
          Restaurant staff?{" "}
          <Link className="underline" to="/login">
            Admin login
          </Link>
        </p>
      </form>
    </div>
  );
}
