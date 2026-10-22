import { useOtpBanner } from "../store/useOtpBanner";

export default function OtpNotificationBar() {
  const { code, message, clear } = useOtpBanner();
  if (!code) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-ink text-white shadow-md">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-4 text-sm">
        <div>
          <span className="font-semibold">{message}: </span>
          <span className="font-mono text-lg tracking-widest text-sand">{code}</span>
          <span className="hidden sm:inline text-white/70 ml-2">(demo — no SMS yet)</span>
        </div>
        <button
          type="button"
          onClick={clear}
          className="shrink-0 text-xs font-semibold px-2 py-1 rounded bg-white/10 hover:bg-white/20"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
