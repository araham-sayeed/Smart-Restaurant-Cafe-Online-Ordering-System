import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getPublicMenu } from "../../api/menu";

export default function MenuRedirect() {
  const [slug, setSlug] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    getPublicMenu()
      .then((m) => setSlug(m.slug))
      .catch(() => setError(true));
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center text-ink">
        Menu unavailable
      </div>
    );
  }
  if (!slug) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center text-ink/60">
        Loading menu…
      </div>
    );
  }
  return <Navigate to={`/r/${slug}`} replace />;
}
