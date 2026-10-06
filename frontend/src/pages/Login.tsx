import { FormEvent, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { ApiError } from "../lib/api";
import { useAuth } from "../lib/auth";
import "./Login.css";

function Mark() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden>
      <path d="M18 14c0-4 3-7 7-6l8 3c3 1 4 5 2 8L22 46" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M46 14c0-4-3-7-7-6l-8 3c-3 1-4 5-2 8l13 27" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <circle cx="16" cy="50" r="5" stroke="currentColor" strokeWidth="3" />
      <circle cx="48" cy="50" r="5" stroke="currentColor" strokeWidth="3" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

export default function Login() {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (user) {
    return <Navigate to={user.role === "BARBER_ADMIN" ? "/admin" : "/"} replace />;
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (tab === "login") await login(email, password);
      else await register(name, email, password);
      navigate("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao autenticar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth">
      <div className="auth-top">
        <button type="button" className="icon-btn" aria-label="Voltar" onClick={() => navigate("/")}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <path d="M15 5 8 12l7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="auth-mark">
        <Mark />
      </div>
      <h1 className="page-title">Brutus Barber</h1>
      <p className="auth-lede">
        {tab === "login" ? "Entre para acompanhar seus horários." : "Crie sua conta em poucos segundos."}
      </p>

      <form className="auth-form" onSubmit={submit}>
        {error && <div className="alert alert-error">{error}</div>}

        {tab === "register" && (
          <label className="field">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <circle cx="12" cy="8" r="3" />
              <path d="M5 19c1.2-3 3.4-4.5 7-4.5s5.8 1.5 7 4.5" />
            </svg>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome"
              required
              autoComplete="name"
            />
          </label>
        )}

        <label className="field">
          <MailIcon />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-mail"
            required
            autoComplete="email"
            inputMode="email"
          />
        </label>

        <label className="field">
          <LockIcon />
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha"
            required
            minLength={6}
            autoComplete={tab === "login" ? "current-password" : "new-password"}
          />
          <button
            type="button"
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            onClick={() => setShowPassword((value) => !value)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12Z" />
              <circle cx="12" cy="12" r="2.5" />
            </svg>
          </button>
        </label>

        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? "Aguarde..." : tab === "login" ? "Entrar" : "Criar conta"}
        </button>
      </form>

      <p className="auth-switch">
        {tab === "login" ? "Não tem conta? " : "Já tem conta? "}
        <button type="button" onClick={() => setTab(tab === "login" ? "register" : "login")}>
          {tab === "login" ? "Cadastre-se" : "Entrar"}
        </button>
      </p>
    </div>
  );
}
