import { FormEvent, useEffect, useState } from "react";
import { ApiError, api, type OpeningHour, type ScheduleBlock } from "../../lib/api";
import AdminNav from "../../components/AdminNav";
import { formatDdMmYyTime } from "../../lib/format";
import "./Schedule.css";

const WEEKDAYS = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

interface AdminBooking {
  id: string;
  date: string;
  status: "CONFIRMED" | "COMPLETED" | "CANCELED" | "NO_SHOW";
  user: {
    id: string;
    name: string | null;
    phone: string | null;
    email: string;
  };
  barber?: { id: string; name: string } | null;
  service: {
    id: string;
    name: string;
    price: number;
    durationMinutes: number;
  };
}

const statusLabel: Record<AdminBooking["status"], string> = {
  CONFIRMED: "Confirmado",
  COMPLETED: "Concluído",
  CANCELED: "Cancelado",
  NO_SHOW: "Não compareceu",
};

export default function AdminSchedule() {
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([]);
  const [hours, setHours] = useState<OpeningHour[]>([]);
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingHours, setSavingHours] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [bookingsRes, blocksRes, hoursRes] = await Promise.all([
        api.get<{ bookings: AdminBooking[] }>("/admin/bookings"),
        api.get<{ blocks: ScheduleBlock[] }>("/admin/schedule-blocks"),
        api.get<{ openingHours: OpeningHour[] }>("/admin/opening-hours"),
      ]);
      setBookings(bookingsRes.bookings);
      setBlocks(blocksRes.blocks);
      setHours(hoursRes.openingHours);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao carregar.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id: string, status: AdminBooking["status"]) => {
    try {
      await api.patch(`/admin/bookings/${id}`, { status });
      await load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Erro ao atualizar.");
    }
  };

  const addBlock = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await api.post("/admin/schedule-blocks", {
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
        reason: reason || undefined,
      });
      setStartsAt("");
      setEndsAt("");
      setReason("");
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao criar bloqueio.");
    }
  };

  const removeBlock = async (id: string) => {
    if (!confirm("Remover este bloqueio?")) return;
    await api.delete(`/admin/schedule-blocks/${id}`);
    load();
  };

  const saveHours = async () => {
    setSavingHours(true);
    setError("");
    try {
      await api.put("/admin/opening-hours", hours);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao salvar horários.");
    } finally {
      setSavingHours(false);
    }
  };

  const updateHour = (weekday: number, patch: Partial<OpeningHour>) => {
    setHours((prev) =>
      prev.map((h) => (h.weekday === weekday ? { ...h, ...patch } : h)),
    );
  };

  const upcoming = bookings.filter(
    (b) => b.status === "CONFIRMED" && new Date(b.date).getTime() >= Date.now(),
  );
  const past = bookings.filter(
    (b) => !(b.status === "CONFIRMED" && new Date(b.date).getTime() >= Date.now()),
  );

  return (
    <>
      <h1 className="page-title">Agenda</h1>
      <AdminNav />
      {error && <div className="alert alert-error">{error}</div>}

      <section className="admin-bookings">
        <h2 className="section-heading">Próximos agendamentos</h2>
        {loading ? (
          <p>Carregando...</p>
        ) : upcoming.length === 0 ? (
          <p className="muted-line">Nenhum horário marcado ainda.</p>
        ) : (
          <div className="admin-booking-list">
            {upcoming.map((booking) => {
              const d = new Date(booking.date);
              return (
                <article key={booking.id} className="admin-booking-card">
                  <div className="admin-booking-main">
                    <strong>{booking.service.name}</strong>
                    <p className="admin-booking-when">
                      {formatDdMmYyTime(d)}
                    </p>
                    <p className="admin-booking-client">
                      {booking.user.name || "Cliente"}
                      {booking.barber?.name ? ` · ${booking.barber.name}` : ""}
                      {booking.user.phone ? ` · ${booking.user.phone}` : ""}
                    </p>
                    <div className="admin-booking-meta">
                      <span className={`badge badge-${booking.status.toLowerCase()}`}>
                        {statusLabel[booking.status]}
                      </span>
                      <span className="admin-booking-price">
                        R$ {booking.service.price.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="admin-booking-actions">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => updateStatus(booking.id, "COMPLETED")}
                    >
                      Concluir
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => {
                        if (confirm("Cancelar este agendamento?")) {
                          updateStatus(booking.id, "CANCELED");
                        }
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {past.length > 0 && (
        <section className="admin-bookings">
          <h2 className="section-heading">Histórico recente</h2>
          <div className="admin-booking-list">
            {past.slice(0, 10).map((booking) => {
              const d = new Date(booking.date);
              return (
                <article key={booking.id} className="admin-booking-card past">
                  <div className="admin-booking-main">
                    <strong>{booking.service.name}</strong>
                    <p className="admin-booking-when">
                      {formatDdMmYyTime(d)}
                    </p>
                    <p className="admin-booking-client">
                      {booking.user.name || "Cliente"}
                      {booking.barber?.name ? ` · ${booking.barber.name}` : ""}
                      {booking.user.phone ? ` · ${booking.user.phone}` : ""}
                    </p>
                    <span className={`badge badge-${booking.status.toLowerCase()}`}>
                      {statusLabel[booking.status]}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      <section className="card card-body" style={{ marginBottom: "2rem" }}>
        <h2>Horário de funcionamento</h2>
        {loading ? (
          <p>Carregando...</p>
        ) : (
          <>
            <div className="grid" style={{ gap: "0.75rem" }}>
              {hours.map((hour) => (
                <div key={hour.weekday} className="hour-row">
                  <strong style={{ minWidth: 140 }}>{WEEKDAYS[hour.weekday]}</strong>
                  <label style={{ display: "flex", gap: "0.35rem", alignItems: "center" }}>
                    <input
                      type="checkbox"
                      checked={hour.isClosed}
                      onChange={(e) =>
                        updateHour(hour.weekday, { isClosed: e.target.checked })
                      }
                    />
                    Fechado
                  </label>
                  <input
                    className="input"
                    type="time"
                    value={hour.opensAt}
                    disabled={hour.isClosed}
                    onChange={(e) => updateHour(hour.weekday, { opensAt: e.target.value })}
                  />
                  <input
                    className="input"
                    type="time"
                    value={hour.closesAt}
                    disabled={hour.isClosed}
                    onChange={(e) => updateHour(hour.weekday, { closesAt: e.target.value })}
                  />
                </div>
              ))}
            </div>
            <button
              type="button"
              className="btn btn-primary"
              style={{ marginTop: "1rem" }}
              disabled={savingHours}
              onClick={saveHours}
            >
              {savingHours ? "Salvando..." : "Salvar horários"}
            </button>
          </>
        )}
      </section>

      <section className="card card-body" style={{ marginBottom: "2rem" }}>
        <h2>Novo bloqueio</h2>
        <form onSubmit={addBlock}>
          <div className="grid-2-responsive">
            <div className="form-group">
              <label className="label">Início</label>
              <input
                className="input"
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="label">Fim</label>
              <input
                className="input"
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label className="label">Motivo (opcional)</label>
            <input
              className="input"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Adicionar bloqueio
          </button>
        </form>
      </section>

      <section>
        <h2>Bloqueios</h2>
        {blocks.length === 0 ? (
          <p style={{ color: "var(--text-muted)" }}>Nenhum bloqueio cadastrado.</p>
        ) : (
          <div className="grid" style={{ gap: "0.75rem" }}>
            {blocks.map((block) => (
              <div key={block.id} className="card card-body block-row">
                <div>
                  <strong>
                    {formatDdMmYyTime(block.startsAt)} — {formatDdMmYyTime(block.endsAt)}
                  </strong>
                  {block.reason && (
                    <p style={{ color: "var(--text-muted)", margin: "0.25rem 0 0" }}>
                      {block.reason}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => removeBlock(block.id)}
                >
                  Remover
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
