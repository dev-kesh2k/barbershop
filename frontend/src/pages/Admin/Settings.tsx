import { FormEvent, useEffect, useState } from "react";
import { ApiError, api } from "../../lib/api";
import AdminNav from "../../components/AdminNav";
import ImageField from "../../components/ImageField";

export default function AdminSettings() {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phones, setPhones] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { user } = await api.get<{ user: { barbershopId: string | null } }>("/auth/me");
        if (!user.barbershopId) return;
        const detail = await api.get<{
          barbershop: {
            name: string;
            address: string;
            phones: string[];
            description: string;
            imageUrl: string;
          };
        }>(`/barbershops/${user.barbershopId}`);
        const shop = detail.barbershop;
        setName(shop.name);
        setAddress(shop.address);
        setPhones(shop.phones.join(", "));
        setDescription(shop.description);
        setImageUrl(shop.imageUrl);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await api.patch("/admin/settings", {
        name,
        address,
        phones: phones.split(",").map((p) => p.trim()).filter(Boolean),
        description,
        imageUrl,
      });
      setMessage("Configurações salvas.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <h1 className="page-title">Configurações</h1>
      <AdminNav />

      {loading ? (
        <p>Carregando...</p>
      ) : (
        <form className="card card-body settings-form" onSubmit={submit}>
          {error && <div className="alert alert-error">{error}</div>}
          {message && <div className="alert alert-success">{message}</div>}

          <div className="form-group">
            <label className="label">Nome da barbearia</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="label">Endereço</label>
            <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="label">Telefones (separados por vírgula)</label>
            <input className="input" value={phones} onChange={(e) => setPhones(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="label">Descrição</label>
            <textarea
              className="textarea"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <ImageField
            label="Imagem da barbearia"
            value={imageUrl}
            onChange={setImageUrl}
            required
          />

          <button type="submit" className="btn btn-primary btn-block" disabled={saving}>
            {saving ? "Salvando..." : "Salvar configurações"}
          </button>
        </form>
      )}

      <style>{`
        .textarea { resize: vertical; }
        .settings-form {
          width: 100%;
          max-width: 100%;
        }
        @media (min-width: 768px) {
          .settings-form {
            max-width: 640px;
          }
        }
      `}</style>
    </>
  );
}
