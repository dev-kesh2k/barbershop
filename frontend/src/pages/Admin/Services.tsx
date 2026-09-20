import { FormEvent, useEffect, useState } from "react";
import { ApiError, api, type Service } from "../../lib/api";
import AdminNav from "../../components/AdminNav";
import ImageField from "../../components/ImageField";

const emptyForm = {
  name: "",
  description: "",
  imageUrl: "",
  price: "",
  durationMinutes: "45",
  isActive: true,
};

export default function AdminServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    api
      .get<{ services: Service[] }>("/admin/services")
      .then((res) => setServices(res.services))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const startEdit = (service: Service) => {
    setEditingId(service.id);
    setForm({
      name: service.name,
      description: service.description,
      imageUrl: service.imageUrl,
      price: String(service.price),
      durationMinutes: String(service.durationMinutes),
      isActive: service.isActive ?? true,
    });
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      name: form.name,
      description: form.description,
      imageUrl: form.imageUrl,
      price: Number(form.price),
      durationMinutes: Number(form.durationMinutes),
      isActive: form.isActive,
    };

    try {
      if (editingId) {
        await api.patch(`/admin/services/${editingId}`, payload);
      } else {
        await api.post("/admin/services", payload);
      }
      setForm(emptyForm);
      setEditingId(null);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <h1 className="page-title">Serviços</h1>
      <AdminNav />

      <form className="card card-body" style={{ marginBottom: "2rem" }} onSubmit={submit}>
        <h2>{editingId ? "Editar serviço" : "Novo serviço"}</h2>
        {error && <div className="alert alert-error">{error}</div>}

        <div className="grid-2-responsive">
          <div className="form-group">
            <label className="label">Nome</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="label">Preço (R$)</label>
            <input
              className="input"
              type="number"
              step="0.01"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="label">Descrição</label>
          <textarea
            className="textarea"
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
          />
        </div>

        <ImageField
          label="Imagem do serviço"
          value={form.imageUrl}
          onChange={(imageUrl) => setForm({ ...form, imageUrl })}
          required
        />

        <div className="form-group">
          <label className="label">Duração (min)</label>
          <input
            className="input"
            type="number"
            value={form.durationMinutes}
            onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
          />
        </div>

        {editingId && (
          <label style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            Serviço ativo
          </label>
        )}

        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Salvando..." : editingId ? "Atualizar" : "Criar serviço"}
          </button>
          {editingId && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm);
              }}
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      {loading ? (
        <p>Carregando...</p>
      ) : (
        <div className="grid" style={{ gap: "0.75rem" }}>
          {services.map((service) => (
            <div key={service.id} className="card card-body service-row">
              <div>
                <strong>{service.name}</strong>
                {!service.isActive && (
                  <span className="badge" style={{ marginLeft: "0.5rem" }}>
                    Inativo
                  </span>
                )}
                <p style={{ color: "var(--text-muted)", margin: "0.25rem 0" }}>
                  R$ {service.price.toFixed(2)} · {service.durationMinutes} min
                </p>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => startEdit(service)}
              >
                Editar
              </button>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .service-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .textarea {
          resize: vertical;
        }
      `}</style>
    </>
  );
}
