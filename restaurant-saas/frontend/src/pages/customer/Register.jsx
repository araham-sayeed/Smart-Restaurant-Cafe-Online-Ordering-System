import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { requestCustomerOtp, verifyCustomerOtp } from "../../api/auth";
import { useAuth } from "../../store/useAuth";
import { useOtpBanner } from "../../store/useOtpBanner";

export default function CustomerRegister() {
  const [step, setStep] = useState("phone"); // "phone" | "otp"
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [devOtp, setDevOtp] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { setToken, fetchMe } = useAuth();
  const showOtp = useOtpBanner((s) => s.show);
  const clearOtp = useOtpBanner((s) => s.clear);
  const navigate = useNavigate();

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const cleanedPhone = phone.trim().replace(/\D/g, "");
    if (cleanedPhone.length < 5) {
      setError("Please enter a valid phone number (at least 5 digits).");
      return;
    }

    setLoading(true);
    try {
      const data = await requestCustomerOtp(phone.trim());
      if (data.dev_otp) {
        setDevOtp(data.dev_otp);
        showOtp(data.dev_otp, "Customer Registration Code");
      }
      setStep("otp");
    } catch (err) {
      setError(err.response?.data?.detail || "Could not send verification code.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!otpCode.trim()) {
      setError("Please enter the verification code.");
      return;
    }

    setLoading(true);
    try {
      const data = await verifyCustomerOtp(phone.trim(), otpCode.trim(), fullName.trim() || null);
      setToken(data.access_token);
      clearOtp();
      const me = await fetchMe();
      if (me.restaurant_slug) {
        navigate(`/r/${me.restaurant_slug}`);
      } else {
        navigate("/menu");
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid or expired verification code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4 pt-16 text-ink">
      <div className="bg-white rounded-2xl shadow-sm border border-sand p-8 w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="w-12 h-12 bg-sage/10 text-sage-dark rounded-full flex items-center justify-center mx-auto text-xl mb-3">
            {step === "phone" ? "✨" : "🔐"}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            {step === "phone" ? "Create Customer Account" : "Enter Verification Code"}
          </h1>
          <p className="text-xs text-ink/60 mt-1">
            {step === "phone"
              ? "Fast, passwordless sign-in with your mobile phone."
              : `Enter the code sent to ${phone}`}
          </p>
        </div>

        {error && (
          <div className="text-xs text-red-600 bg-red-50 border border-red-200 p-2.5 rounded-xl">
            {error}
          </div>
        )}

        {step === "phone" && (
          <form onSubmit={handlePhoneSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Your Full Name
              </label>
              <input
                className="w-full border border-sand rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sage"
                type="text"
                placeholder="Jane Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoFocus
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Mobile Phone Number
              </label>
              <input
                className="w-full border border-sand rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sage"
                type="tel"
                placeholder="050 123 4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sage-dark text-white rounded-xl py-3 text-sm font-bold hover:opacity-95 disabled:opacity-50 transition-all shadow-sm"
            >
              {loading ? "Sending Code..." : "Submit"}
            </button>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            {devOtp && (
              <div className="bg-sand/40 border border-sand rounded-xl p-2.5 text-xs text-center flex items-center justify-between">
                <span>
                  Demo Code: <strong className="font-mono text-sage-dark">{devOtp}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setOtpCode(devOtp)}
                  className="px-2 py-1 bg-white rounded-lg text-[11px] font-semibold border hover:bg-gray-50"
                >
                  Auto-fill
                </button>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-ink mb-1 text-center">
                6-Digit Verification Code
              </label>
              <input
                className="w-full border border-sand rounded-xl p-3 text-center text-xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-sage"
                type="text"
                inputMode="numeric"
                maxLength={8}
                placeholder="••••••"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                autoFocus
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sage-dark text-white rounded-xl py-3 text-sm font-bold hover:opacity-95 disabled:opacity-50 transition-all shadow-sm"
            >
              {loading ? "Verifying..." : "Verify & Go to Menu →"}
            </button>

            <div className="flex items-center justify-between text-xs pt-1 text-gray-500">
              <button
                type="button"
                onClick={() => {
                  setStep("phone");
                  setError("");
                }}
                className="hover:underline font-medium"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={handlePhoneSubmit}
                disabled={loading}
                className="hover:underline font-medium text-sage-dark"
              >
                Resend code
              </button>
            </div>
          </form>
        )}

        <div className="border-t border-sand/50 pt-4 text-center">
          <p className="text-xs text-gray-400">
            Already have an account?{" "}
            <Link className="underline font-medium text-ink hover:text-sage-dark" to="/customer/login">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
