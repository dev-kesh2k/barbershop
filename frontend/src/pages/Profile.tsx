import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError, api } from "../lib/api";
import { useAuth } from "../lib/auth";
import "./Profile.css";

function RowIcon({ name }: { name: "user" | "cal" | "out" }) {
  const common = {
    width: 16,
    height: 16,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };
  if (name === "cal") {
    return (
      <svg {...common}>
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M8 3v4M16 3v4M4 10h16" />
      </svg>
    );
  }
  if (name === "out") {
    return (
      <svg {...common}>
        <path d="M10 7V5a1 1 0 0 1 1-1h7v16h-7a1 1 0 0 1-1-1v-2" />
        <path d="M4 12h11M12 8l4 4-4 4" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="12" cy="8" r="3" />
      <path d="M5 19c1.2-3 3.4-4.5 7-4.5s5.8 1.5 7 4.5" />
    </svg>
  );
}

export default function Profile() {
  const { user, refresh, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setPhone(user.phone ?? "");
    }
  }, [user]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await api.patch("/profile", { name, phone: phone || null });
      await refresh();
      setMessage("Perfil atualizado.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const initial = (user?.name || user?.email || "B").trim().charAt(0).toUpperCase();

  return (
    <div>
      <h1 className="page-title">Perfil</h1>
      <header className="profile-hero">
        <span className="avatar" aria-hidden>
          {initial}
        </span>
        <div>
          <strong>{user?.name?.trim() || "Sua conta"}</strong>
          <p>{user?.email}</p>
          {user?.phone && <p>{user.phone}</p>}
        </div>
      </header>

      <nav className="menu" aria-label="Conta">
        <button type="button" className="menu-row" onClick={() => setOpen((value) => !value)}>
          <span className="menu-ico">
            <RowIcon name="user" />
          </span>
          <span>Informações pessoais</span>
          <span className={`chevron${open ? " is-open" : ""}`} aria-hidden>
            ›
          </span>
        </button>
        <Link className="menu-row" to="/bookings">
          <span className="menu-ico">
            <RowIcon name="cal" />
          </span>
          <span>Meus agendamentos</span>
          <span className="chevron" aria-hidden>
            ›
          </span>
        </Link>
        <button
          type="button"
          className="menu-row danger"
          onClick={() => {
            logout();
            navigate("/");
          }}
        >
          <span className="menu-ico">
            <RowIcon name="out" />
          </span>
          <span>Sair</span>
        </button>
      </nav>

      {open && (
        <form className="card card-body profile-form" onSubmit={submit}>
          {error && <div className="alert alert-error">{error}</div>}
          {message && <div className="alert alert-success">{message}</div>}
          <div className="form-group">
            <label className="label">E-mail</label>
            <input className="input" value={user?.email ?? ""} disabled />
          </div>
          <div className="form-group">
            <label className="label" htmlFor="name">
              Nome
            </label>
            <input
              id="name"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="label" htmlFor="phone">
              Telefone
            </label>
            <input
              id="phone"
              className="input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(11) 99999-9999"
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </form>
      )}
    </div>
  );
}
