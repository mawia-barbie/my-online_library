import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { BookMarked } from "lucide-react";
import { toast } from "sonner";

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    const res = await register({ email, password, nickname });

    if (!res || !res.ok) {
      setError(res?.error ?? "Registration failed");
      return;
    }

    toast.success(`Welcome, @${nickname}!`);
    navigate("/home");
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
          <h1 className="font-heading font-bold text-2xl mb-1">Join the community</h1>
          <p className="text-sm text-muted-foreground mb-6">Start sharing the books you love.</p>

          <form onSubmit={submit} className="space-y-4">
            {/* Nickname */}
            <div className="space-y-1.5">
              <label htmlFor="nickname" className="block text-sm font-medium text-muted-foreground">Nickname</label>
              <input
                id="nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="reading.lover"
                required
                className="w-full rounded-md border border-border px-3 py-2 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Email */}
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

            {/* Password */}
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

            <button type="submit" className="w-full rounded-full bg-primary text-primary-foreground py-2 px-4 font-semibold">
              Create account
            </button>
          </form>

          <p className="mt-6 text-sm text-center text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">Log in</Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default Register;