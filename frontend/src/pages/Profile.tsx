import { FormEvent, useEffect, useState } from "react";
import { ApiError, api } from "../lib/api";
import { useAuth } from "../lib/auth";

export default function Profile() {
  const { user, refresh } = useAuth();
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
      setMessage("Perfil atualizado com sucesso.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <h1 className="page-title">Meu perfil</h1>
      <p className="page-subtitle">Atualize seus dados pessoais.</p>

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
          {saving ? "Salvando..." : "Salvar alterações"}
        </button>
      </form>

      <style>{`
        .profile-form {
          width: 100%;
          max-width: 100%;
        }
        @media (min-width: 768px) {
          .profile-form {
            max-width: 480px;
          }
        }
      `}</style>
    </>
  );
}
