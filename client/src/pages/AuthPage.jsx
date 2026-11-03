import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function AuthPage({ mode }) {
  const isLogin = mode === "login";
  const { authenticate, token } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (token) return <Navigate to="/" replace />;

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const payload = isLogin ? { email: form.email, password: form.password } : form;
      await authenticate(mode, payload);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-brand">
        <span className="logo">✅ TaskFlow</span>
        <h1>Organise your work.<br />Ship what matters.</h1>
        <p>A focused Kanban board with priorities, due dates and progress tracking.</p>
      </div>
      <form className="auth-card" onSubmit={submit}>
        <h2>{isLogin ? "Welcome back" : "Create your account"}</h2>
        {!isLogin && (
          <label>Name<input name="name" value={form.name} onChange={update} required /></label>
        )}
        <label>Email<input name="email" type="email" value={form.email} onChange={update} required /></label>
        <label>
          Password
          <input name="password" type="password" minLength={6} value={form.password} onChange={update} required />
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn primary" disabled={submitting}>
          {submitting ? "Please wait…" : isLogin ? "Log in" : "Sign up"}
        </button>
        <p className="muted switch">
          {isLogin ? "New here? " : "Already have an account? "}
          <Link to={isLogin ? "/register" : "/login"}>{isLogin ? "Create an account" : "Log in"}</Link>
        </p>
      </form>
    </div>
  );
}
