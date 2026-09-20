import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ApiError, api, resolveImageUrl, type Barbershop, type Service } from "../lib/api";
import { useAuth } from "../lib/auth";
import { maskDdMmYy, parseDdMmYyToIso } from "../lib/format";
import "./BarbershopDetail.css";

type Step = "services" | "schedule";

export default function BarbershopDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [shopId, setShopId] = useState<string | null>(id ?? null);
  const [shop, setShop] = useState<(Barbershop & { services: Service[] }) | null>(null);
  const [step, setStep] = useState<Step>("services");
  const [selectedService, setSelectedService] = useState<string>("");
  const [date, setDate] = useState("");
  const [dateInput, setDateInput] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [guestName, setGuestName] = useState(
    () => localStorage.getItem("barbershop_guest_name") ?? "",
  );
  const [guestPhone, setGuestPhone] = useState(
    () => localStorage.getItem("barbershop_guest_phone") ?? "",
  );
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let resolvedId = id;
        if (!resolvedId) {
          const list = await api.get<{ barbershops: Barbershop[] }>("/barbershops");
          resolvedId = list.barbershops[0]?.id;
        }
        if (!resolvedId) {
          if (!cancelled) setShop(null);
          return;
        }
        const data = await api.get<{ barbershop: Barbershop & { services: Service[] } }>(
          `/barbershops/${resolvedId}`,
        );
        if (cancelled) return;
        setShop(data.barbershop);
        setShopId(data.barbershop.id);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!shopId || !selectedService || !date || step !== "schedule") {
      setSlots([]);
      return;
    }
    api
      .get<{ slots: string[] }>(
        `/barbershops/${shopId}/slots?serviceId=${selectedService}&date=${date}`,
      )
      .then((data) => {
        setSlots(data.slots);
        setSelectedSlot("");
      })
      .catch(() => setSlots([]));
  }, [shopId, selectedService, date, step]);

  const openSchedule = (serviceId: string) => {
    setSelectedService(serviceId);
    setDate("");
    setDateInput("");
    setSlots([]);
    setSelectedSlot("");
    setError("");
    setStep("schedule");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const backToServices = () => {
    setStep("services");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBook = async () => {
    if (!user) {
      if (!guestName.trim() || guestName.trim().length < 2) {
        setError("Informe seu nome.");
        return;
      }
      if (!guestPhone.trim() || guestPhone.replace(/\D/g, "").length < 8) {
        setError("Informe um telefone válido.");
        return;
      }
    }

    if (!date) {
      setError("Selecione a data.");
      return;
    }

    if (!selectedSlot) {
      setError("Selecione um horário.");
      return;
    }

    setError("");
    setBooking(true);

    try {
      const iso = new Date(`${date}T${selectedSlot}:00`).toISOString();
      const body: {
        serviceId: string;
        date: string;
        guestName?: string;
        guestPhone?: string;
      } = { serviceId: selectedService, date: iso };

      if (!user) {
        const name = guestName.trim();
        const phone = guestPhone.trim();
        body.guestName = name;
        body.guestPhone = phone;
        localStorage.setItem("barbershop_guest_name", name);
        localStorage.setItem("barbershop_guest_phone", phone);
      }

      await api.post("/bookings", body);
      navigate("/bookings");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao agendar.");
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="detail-loading">
        <div className="detail-spinner" />
        <p>Carregando...</p>
      </div>
    );
  }
  if (!shop) return <div className="empty-state">Barbearia não encontrada.</div>;

  const service = shop.services.find((s) => s.id === selectedService);
  const minDate = new Date().toISOString().slice(0, 10);

  if (step === "schedule" && service) {
    return (
      <div className="detail-stack step-in">
        <button type="button" className="back-nav" onClick={backToServices}>
          <span aria-hidden>←</span> Serviços
        </button>

        <div className="schedule-layout">
          <article className="service-summary">
            <div className="summary-media">
              <img
                src={resolveImageUrl(service.imageUrl)}
                alt={service.name}
                className="summary-img"
              />
            </div>
            <div className="summary-body">
              <p className="eyebrow">Serviço escolhido</p>
              <h1 className="page-title">{service.name}</h1>
              {service.description && <p className="muted">{service.description}</p>}
              <div className="meta-row">
                <span className="price-tag">R$ {service.price.toFixed(2)}</span>
                <span className="duration-tag">{service.durationMinutes} min</span>
              </div>
            </div>
          </article>

          <section className="booking-panel">
            <h2 className="section-title">Agendar horário</h2>
            {error && <div className="alert alert-error">{error}</div>}

            {!user && (
              <div className="fields-grid">
                <div className="form-group">
                  <label className="label" htmlFor="guestName">
                    Nome *
                  </label>
                  <input
                    id="guestName"
                    type="text"
                    className="input"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Seu nome"
                    autoComplete="name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="label" htmlFor="guestPhone">
                    Telefone *
                  </label>
                  <input
                    id="guestPhone"
                    type="tel"
                    className="input"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder="(00) 00000-0000"
                    inputMode="tel"
                    autoComplete="tel"
                    required
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="label" htmlFor="date">
                Data *
              </label>
              <input
                id="date"
                type="text"
                className="input"
                inputMode="numeric"
                autoComplete="off"
                placeholder="dd/mm/aa"
                maxLength={8}
                value={dateInput}
                onChange={(e) => {
                  const masked = maskDdMmYy(e.target.value);
                  setDateInput(masked);
                  const iso = parseDdMmYyToIso(masked);
                  if (iso && iso >= minDate) {
                    setDate(iso);
                    setError("");
                  } else {
                    setDate("");
                    setSelectedSlot("");
                    if (iso && iso < minDate) {
                      setError("Escolha uma data a partir de hoje.");
                    }
                  }
                }}
                required
              />
            </div>

            {date && (
              <div className="form-group">
                <span className="label">Horários disponíveis</span>
                {slots.length === 0 ? (
                  <p className="muted slots-empty">Nenhum horário nesta data.</p>
                ) : (
                  <div className="slot-grid">
                    {slots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        className={`slot-btn ${selectedSlot === slot ? "selected" : ""}`}
                        onClick={() => setSelectedSlot(slot)}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              className="btn btn-primary btn-block confirm-btn"
              disabled={booking || !selectedSlot}
              onClick={handleBook}
            >
              {booking ? "Agendando..." : "Confirmar agendamento"}
            </button>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="detail-stack step-in">
      <header className="shop-hero">
        <img
          src={resolveImageUrl(shop.imageUrl)}
          alt=""
          className="shop-hero-img"
        />
        <div className="shop-hero-scrim" />
        <div className="shop-hero-content">
          <p className="eyebrow">Barbearia</p>
          <h1 className="shop-name">{shop.name}</h1>
          <p className="shop-address">{shop.address}</p>
        </div>
      </header>

      {shop.description && (
        <p className="shop-desc">{shop.description}</p>
      )}

      <section className="services-section">
        <div className="section-head">
          <h2 className="section-title">Escolha um serviço</h2>
          <p className="section-hint">Toque para agendar</p>
        </div>
        <div className="services-list">
          {shop.services.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className="service-row"
              style={{ animationDelay: `${index * 40}ms` }}
              onClick={() => openSchedule(item.id)}
            >
              <img
                src={resolveImageUrl(item.imageUrl)}
                alt=""
                className="service-thumb"
              />
              <div className="service-info">
                <strong>{item.name}</strong>
                {item.description && <p className="muted">{item.description}</p>}
                <div className="meta-row">
                  <span className="price-tag">R$ {item.price.toFixed(2)}</span>
                  <span className="duration-tag">{item.durationMinutes} min</span>
                </div>
              </div>
              <span className="service-chevron" aria-hidden>
                ›
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
