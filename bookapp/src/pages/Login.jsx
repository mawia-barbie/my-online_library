import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { BookMarked } from "lucide-react";
import { toast } from "sonner";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Login failed");
      }
      const data = await res.json();
      const token = data.access_token || data.token || data.token_type ? data.access_token : null;
      if (!token) throw new Error("No token received");

      await login(token);
      toast.success("Welcome back!");
      navigate("/home");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setEmail("maya@demo.app");
    setPassword("demo1234");
  };

  return (
    <div className="min-h-screen bg-gradient-soft flex flex-col">
      <header className="container max-w-6xl mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
            <BookMarked size={18} className="text-primary-foreground" />
          </div>
          <span className="font-heading font-bold text-lg">Book Exchange</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-card p-7">
          <h1 className="font-heading font-bold text-2xl mb-1">Welcome back</h1>
          <p className="text-sm text-muted-foreground mb-6">Log in to your shelf.</p>

          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-muted-foreground">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-md border border-border px-3 py-2 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-muted-foreground">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-md border border-border px-3 py-2 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {error && <p className="text-xs text-destructive">{error}</p>}

            <button type="submit" disabled={loading} className="w-full rounded-full bg-primary text-primary-foreground py-2 px-4 font-semibold">
              {loading ? "Signing in..." : "Log in"}
            </button>
          </form>

          <button
            onClick={fillDemo}
            className="mt-3 w-full text-xs text-muted-foreground hover:text-primary transition"
          >
            Try a demo account →
          </button>

          <p className="mt-6 text-sm text-center text-muted-foreground">
            New here?{' '}
            <Link to="/register" className="text-primary font-semibold hover:underline">Create account</Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default Login;