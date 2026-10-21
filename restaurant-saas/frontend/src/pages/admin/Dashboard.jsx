import { useAuth } from "../../store/useAuth";

export default function Dashboard() {
  const { user, logout } = useAuth();
  return (
    <div className="p-8">
      <h1 className="text-2xl text-ink">Welcome, {user?.full_name}</h1>
      <button onClick={logout} className="mt-4 underline">Log out</button>
    </div>
  );
}