import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useAuth } from "../auth-context";

export function AuthPage() {
  const { isAuthenticated, login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const submit = async (e) => {
    e.preventDefault();

    try {
      setBusy(true);
      if (mode === "login") {
        await login({ username: form.username, password: form.password });
        toast.success("Welcome back");
      } else {
        await register({ username: form.username, email: form.email, password: form.password });
        toast.success("Account created");
      }
      navigate("/");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md border p-6 space-y-5">
        <div className="text-center">
          <div className="mx-auto mb-3 w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">Drishyamitra</h1>
          <p className="text-sm text-gray-500">AI-powered photo management</p>
        </div>

        <div className="flex gap-2">
          <Button className="flex-1" variant={mode === "login" ? "default" : "outline"} onClick={() => setMode("login")}>
            Login
          </Button>
          <Button className="flex-1" variant={mode === "register" ? "default" : "outline"} onClick={() => setMode("register")}>
            Register
          </Button>
        </div>

        <form className="space-y-3" onSubmit={submit}>
          <Input
            placeholder={mode === "login" ? "Username or Email" : "Username"}
            value={form.username}
            onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
            required
          />

          {mode === "register" && (
            <Input
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              required
            />
          )}

          <Input
            placeholder="Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            required
          />

          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Please wait..." : mode === "login" ? "Login" : "Create account"}
          </Button>
        </form>
      </div>
    </div>
  );
}
