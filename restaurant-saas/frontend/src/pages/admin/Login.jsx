import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login, requestOtp } from "../../api/auth";
import { useAuth } from "../../store/useAuth";
import { useOtpBanner } from "../../store/useOtpBanner";

export default function AdminLogin() {
  const [form, setForm] = useState({ identifier: "arham@gmail.com", password: "", otp_code: "" });
  const [error, setError] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const { setToken, fetchMe, logout } = useAuth();
  const showOtp = useOtpBanner((s) => s.show);
  const navigate = useNavigate();

  const sendOtp = async () => {
    setError("");
    if (!form.identifier.trim()) {
      setError("Enter email or phone first");
      return;
    }
    try {
      const data = await requestOtp(form.identifier.trim(), "login");
      if (data.dev_otp) showOtp(data.dev_otp, "Admin login code");
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
    try {
      const data = await login(form.identifier.trim(), form.password, form.otp_code);
      setToken(data.access_token);
      const me = await fetchMe();
      if (me.role === "customer") {
        logout();
        setError("Use customer login for this account");
        return;
      }
      navigate("/admin");
    } catch (err) {
      setError(err.response?.data?.detail || "Incorrect phone/email or password");
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4 pt-16">
      <form onSubmit={submit} className="bg-white rounded-xl shadow p-8 w-full max-w-sm space-y-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Admin log in</h1>
          <p className="text-xs text-gray-500 mt-1">Manage menu and orders</p>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <input
          className="w-full border rounded p-2"
          type="text"
          placeholder="Email or phone"
          value={form.identifier}
          onChange={(e) => setForm({ ...form, identifier: e.target.value })}
          required
        />
        <input
          className="w-full border rounded p-2"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
        <div className="flex gap-2">
          <input
            className="flex-1 border rounded p-2 font-mono text-sm"
            placeholder="Verification code"
            value={form.otp_code}
            onChange={(e) => setForm({ ...form, otp_code: e.target.value })}
            required
          />
          <button type="button" onClick={sendOtp} className="shrink-0 px-3 text-xs font-semibold border rounded-lg">
            Send code
          </button>
        </div>
        <button className="w-full bg-sage-dark text-white rounded p-2">Log in</button>
        <p className="text-xs text-center text-gray-500">
          Ordering food?{" "}
          <Link className="underline text-ink" to="/customer/login">
            Customer login
          </Link>
        </p>
      </form>
    </div>
  );
}
