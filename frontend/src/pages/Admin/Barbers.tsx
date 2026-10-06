import { FormEvent, useEffect, useState } from "react";
import { ApiError, api, type Barber } from "../../lib/api";
import AdminNav from "../../components/AdminNav";
import ImageField from "../../components/ImageField";

const emptyForm = {
  name: "",
  title: "Barbeiro",
  imageUrl: "",
  isActive: true,
};

export default function AdminBarbers() {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    api
      .get<{ barbers: Barber[] }>("/admin/barbers")
      .then((res) => setBarbers(res.barbers))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Erro ao carregar."))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const startEdit = (barber: Barber) => {
    setEditingId(barber.id);
    setForm({
      name: barber.name,
      title: barber.title,
      imageUrl: barber.imageUrl,
      isActive: barber.isActive ?? true,
    });
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      name: form.name,
      title: form.title,
      imageUrl: form.imageUrl,
      isActive: form.isActive,
    };

    try {
      if (editingId) await api.patch(`/admin/barbers/${editingId}`, payload);
      else await api.post("/admin/barbers", payload);
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
      <h1 className="page-title">Barbeiros</h1>
      <AdminNav />

      <form className="card card-body" style={{ marginBottom: "1.5rem" }} onSubmit={submit}>
        <h2>{editingId ? "Editar barbeiro" : "Novo barbeiro"}</h2>
        {error && <div className="alert alert-error">{error}</div>}
        <div className="form-group">
          <label className="label" htmlFor="barberName">
            Nome
          </label>
          <input
            id="barberName"
            className="input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>
        <div className="form-group">
          <label className="label" htmlFor="barberTitle">
            Função
          </label>
          <input
            id="barberTitle"
            className="input"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Barbeiro sênior"
          />
        </div>
        <ImageField
          label="Foto"
          value={form.imageUrl}
          onChange={(imageUrl) => setForm({ ...form, imageUrl })}
        />
        <label style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
          />
          Atende na agenda
        </label>
        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Salvando..." : editingId ? "Atualizar" : "Adicionar"}
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
        <div className="grid">
          {barbers.map((barber) => (
            <article key={barber.id} className="card card-body">
              <strong>{barber.name}</strong>
              <p className="muted" style={{ margin: "0.2rem 0 0.75rem" }}>
                {barber.title}
                {barber.isActive === false ? " · inativo" : ""}
              </p>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => startEdit(barber)}>
                Editar
              </button>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
