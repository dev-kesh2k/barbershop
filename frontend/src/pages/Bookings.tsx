import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Thumb from "../components/Thumb";
import { ApiError, api, type Booking } from "../lib/api";
import { useAuth } from "../lib/auth";
import { formatDdMmYyTime, formatMoney } from "../lib/format";
import "./Bookings.css";

const statusLabel: Record<Booking["status"], string> = {
  CONFIRMED: "Confirmado",
  COMPLETED: "Concluído",
  CANCELED: "Cancelado",
  NO_SHOW: "Não compareceu",
};

type Filter = "upcoming" | "past" | "canceled";

const PHONE_KEY = "barbershop_guest_phone";

function bucket(booking: Booking): Filter {
  if (booking.status === "CANCELED") return "canceled";
  const when = new Date(booking.date).getTime();
  if (booking.status === "CONFIRMED" && when >= Date.now()) return "upcoming";
  return "past";
}

export default function Bookings() {
  const { user } = useAuth();
  const [phone, setPhone] = useState(() => localStorage.getItem(PHONE_KEY) ?? "");
  const [lookedUp, setLookedUp] = useState(Boolean(user));
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(Boolean(user));
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("upcoming");

  const loadByAuth = () => {
    setLoading(true);
    setError("");
    api
      .get<{ bookings: Booking[] }>("/bookings")
      .then((data) => {
        setBookings(data.bookings);
        setLookedUp(true);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Erro ao carregar."))
      .finally(() => setLoading(false));
  };

  const loadByPhone = (value: string) => {
    setLoading(true);
    setError("");
    api
      .post<{ bookings: Booking[] }>("/bookings/lookup", { phone: value.trim() })
      .then((data) => {
        setBookings(data.bookings);
        setLookedUp(true);
        localStorage.setItem(PHONE_KEY, value.trim());
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Erro ao carregar."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (user) {
      loadByAuth();
      return;
    }
    const saved = localStorage.getItem(PHONE_KEY);
    if (saved) {
      setPhone(saved);
      loadByPhone(saved);
    }
  }, [user]);

  const submitPhone = (e: FormEvent) => {
    e.preventDefault();
    if (phone.replace(/\D/g, "").length < 8) {
      setError("Informe um telefone válido.");
      return;
    }
    loadByPhone(phone);
  };

  const cancel = async (id: string) => {
    if (!confirm("Cancelar este agendamento?")) return;
    try {
      if (user) {
        await api.delete(`/bookings/${id}`);
        loadByAuth();
      } else {
        await api.delete(`/bookings/${id}`, { phone: phone.trim() });
        loadByPhone(phone);
      }
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Erro ao cancelar.");
    }
  };

  const visible = bookings
    .filter((booking) => bucket(booking) === filter)
    .sort((a, b) => {
      const diff = new Date(a.date).getTime() - new Date(b.date).getTime();
      return filter === "upcoming" ? diff : -diff;
    });

  if (!user && !lookedUp) {
    return (
      <div className="bookings-page">
        <h1 className="page-title">Meus agendamentos</h1>
        <p className="page-subtitle">Informe o telefone usado na reserva.</p>
        {error && <div className="alert alert-error">{error}</div>}
        <form className="lookup-card" onSubmit={submitPhone}>
          <div className="form-group">
            <label className="label" htmlFor="lookupPhone">
              Telefone
            </label>
            <input
              id="lookupPhone"
              type="tel"
              className="input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(00) 00000-0000"
              inputMode="tel"
              autoComplete="tel"
              autoFocus
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? "Buscando..." : "Ver agendamentos"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="bookings-page">
      <h1 className="page-title">Meus agendamentos</h1>
      {!user && (
        <button
          type="button"
          className="text-btn"
          onClick={() => {
            setLookedUp(false);
            setBookings([]);
            setError("");
          }}
        >
          Trocar telefone
        </button>
      )}

      <div className="tabs" role="tablist">
        {(
          [
            ["upcoming", "Próximos"],
            ["past", "Passados"],
            ["canceled", "Cancelados"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`tab ${filter === id ? "active" : ""}`}
            onClick={() => setFilter(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="center-state">
          <div className="spinner" />
          <p>Carregando...</p>
        </div>
      ) : visible.length === 0 ? (
        <div className="empty-state">
          <p>
            {filter === "upcoming"
              ? "Nenhum horário por vir."
              : filter === "past"
                ? "Nenhum horário passado."
                : "Nenhum horário cancelado."}
          </p>
          {filter === "upcoming" && (
            <Link to="/agendar" className="btn btn-primary">
              Agendar horário
            </Link>
          )}
        </div>
      ) : (
        <div className="bookings-list">
          {visible.map((booking) => {
            const when = new Date(booking.date);
            const canCancel = booking.status === "CONFIRMED" && when.getTime() > Date.now();
            return (
              <article key={booking.id} className="booking-card">
                <Thumb src={booking.service.imageUrl} alt="" />
                <div>
                  <div className="booking-top">
                    <strong>{booking.service.name}</strong>
                    <span className={`badge badge-${booking.status.toLowerCase()}`}>
                      {statusLabel[booking.status]}
                    </span>
                  </div>
                  <p className="booking-shop">
                    {booking.barber?.name ?? booking.service.barbershop?.name}
                  </p>
                  <p className="booking-when">
                    {formatDdMmYyTime(when)} · {formatMoney(booking.service.price)}
                  </p>
                  {canCancel && (
                    <button type="button" className="booking-cancel" onClick={() => cancel(booking.id)}>
                      Cancelar
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
