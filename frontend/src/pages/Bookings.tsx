import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ApiError, api, type Booking } from "../lib/api";
import { useAuth } from "../lib/auth";
import { formatDdMmYyTime } from "../lib/format";
import "./Bookings.css";

const statusLabel: Record<Booking["status"], string> = {
  CONFIRMED: "Confirmado",
  COMPLETED: "Concluído",
  CANCELED: "Cancelado",
  NO_SHOW: "Não compareceu",
};

const PHONE_KEY = "barbershop_guest_phone";

export default function Bookings() {
  const { user } = useAuth();
  const [phone, setPhone] = useState(() => localStorage.getItem(PHONE_KEY) ?? "");
  const [lookedUp, setLookedUp] = useState(Boolean(user));
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(Boolean(user));
  const [error, setError] = useState("");

  const loadByAuth = () => {
    setLoading(true);
    setError("");
    api
      .get<{ bookings: Booking[] }>("/bookings")
      .then((data) => {
        setBookings(data.bookings);
        setLookedUp(true);
      })
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Erro ao carregar."),
      )
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
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Erro ao carregar."),
      )
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

  const changePhone = () => {
    setLookedUp(false);
    setBookings([]);
    setError("");
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

  if (!user && !lookedUp) {
    return (
      <div className="bookings-page">
        <header className="bookings-hero">
          <p className="eyebrow">Agenda</p>
          <h1 className="page-title">Meus agendamentos</h1>
          <p className="page-subtitle">
            Informe seu telefone para ver os horários marcados.
          </p>
        </header>

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
      <header className="bookings-hero">
        <p className="eyebrow">Agenda</p>
        <h1 className="page-title">Meus agendamentos</h1>
        <p className="page-subtitle">
          {user ? "Gerencie seus horários marcados." : `Telefone ${phone}`}
        </p>
      </header>

      {!user && (
        <button type="button" className="btn btn-secondary btn-sm change-phone" onClick={changePhone}>
          Trocar telefone
        </button>
      )}

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="bookings-loading">
          <div className="bookings-spinner" />
          <p>Carregando...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="empty-state">
          <p>Você ainda não tem agendamentos.</p>
          <Link to="/" className="btn btn-primary" style={{ marginTop: "1rem" }}>
            Agendar horário
          </Link>
        </div>
      ) : (
        <div className="bookings-list">
          {bookings.map((booking) => {
            const d = new Date(booking.date);
            const canCancel =
              booking.status === "CONFIRMED" && d.getTime() > Date.now();

            return (
              <article key={booking.id} className="booking-card">
                <div className="booking-main">
                  <strong>{booking.service.name}</strong>
                  <p className="booking-when">
                    {formatDdMmYyTime(d)}
                  </p>
                  <div className="booking-meta">
                    <span className={`badge badge-${booking.status.toLowerCase()}`}>
                      {statusLabel[booking.status]}
                    </span>
                    <span className="booking-price">
                      R$ {booking.service.price.toFixed(2)}
                    </span>
                  </div>
                </div>
                {canCancel && (
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => cancel(booking.id)}
                  >
                    Cancelar
                  </button>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
