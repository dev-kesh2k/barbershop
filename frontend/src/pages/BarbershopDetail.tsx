import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Thumb from "../components/Thumb";
import { ApiError, api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { formatMoney, todayIso } from "../lib/format";
import { useShop } from "../lib/useShop";
import "./BarbershopDetail.css";

type Step = "service" | "barber" | "date" | "time" | "details";
const WEEKDAYS = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"];

function prettyDate(iso: string) {
  if (!iso) return "";
  return new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function BarbershopDetail() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user } = useAuth();
  const { shop, loading, error: loadError } = useShop();

  const [step, setStep] = useState<Step | null>(null);
  const [selectedService, setSelectedService] = useState("");
  const [selectedBarber, setSelectedBarber] = useState("");
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [guestName, setGuestName] = useState(
    () => localStorage.getItem("barbershop_guest_name") ?? "",
  );
  const [guestPhone, setGuestPhone] = useState(
    () => localStorage.getItem("barbershop_guest_phone") ?? "",
  );
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!shop || step) return;
    const preset = params.get("service");
    if (preset && shop.services.some((item) => item.id === preset)) {
      setSelectedService(preset);
      setStep(shop.barbers.length > 0 ? "barber" : "date");
      return;
    }
    setStep("service");
  }, [shop, params, step]);

  useEffect(() => {
    if (!shop || !selectedService || !date || ((shop.barbers?.length ?? 0) > 0 && !selectedBarber)) {
      setSlots([]);
      return;
    }
    let cancelled = false;
    setSlotsLoading(true);
    const barberQuery = selectedBarber ? `&barberId=${selectedBarber}` : "";
    api
      .get<{ slots: string[] }>(
        `/barbershops/${shop.id}/slots?serviceId=${selectedService}&date=${date}${barberQuery}`,
      )
      .then((data) => {
        if (!cancelled) setSlots(data.slots);
      })
      .catch(() => {
        if (!cancelled) setSlots([]);
      })
      .finally(() => {
        if (!cancelled) setSlotsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [shop, selectedService, selectedBarber, date]);

  useEffect(() => {
    if (step) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const service = shop?.services.find((item) => item.id === selectedService);
  const barber = shop?.barbers.find((item) => item.id === selectedBarber);
  const needsBarber = (shop?.barbers.length ?? 0) > 0;
  const ORDER: Step[] = needsBarber
    ? ["service", "barber", "date", "time", "details"]
    : ["service", "date", "time", "details"];
  const LABELS = needsBarber
    ? ["Serviço", "Barbeiro", "Data", "Horário", "Detalhes"]
    : ["Serviço", "Data", "Horário", "Detalhes"];
  const current = step ? ORDER.indexOf(step) + 1 : 1;
  const minDate = useMemo(() => todayIso(), []);

  const goBack = () => {
    setError("");
    const index = step ? ORDER.indexOf(step) : 0;
    if (index <= 0) {
      navigate(-1);
      return;
    }
    setStep(ORDER[index - 1]);
  };

  const goNext = () => {
    setError("");
    if (step === "service" && selectedService) setStep(needsBarber ? "barber" : "date");
    else if (step === "barber" && selectedBarber) setStep("date");
    else if (step === "date" && date) setStep("time");
    else if (step === "time" && selectedSlot) setStep("details");
    else if (step === "details") void handleBook();
  };

  const canContinue =
    (step === "service" && Boolean(selectedService)) ||
    (step === "barber" && Boolean(selectedBarber)) ||
    (step === "date" && Boolean(date)) ||
    (step === "time" && Boolean(selectedSlot) && !slotsLoading) ||
    step === "details";

  async function handleBook() {
    if (!service || !date || !selectedSlot || booking) return;
    if (needsBarber && !selectedBarber) {
      setError("Escolha o barbeiro.");
      return;
    }

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

    setError("");
    setBooking(true);
    try {
      const iso = new Date(`${date}T${selectedSlot}:00`).toISOString();
      const body: {
        serviceId: string;
        barberId?: string;
        date: string;
        guestName?: string;
        guestPhone?: string;
      } = {
        serviceId: selectedService,
        date: iso,
        ...(selectedBarber ? { barberId: selectedBarber } : {}),
      };

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
  }

  if (loading) {
    return (
      <div className="center-state">
        <div className="spinner" />
        <p>Carregando...</p>
      </div>
    );
  }

  if (!shop) {
    return <div className="empty-state">{loadError || "Barbearia não encontrada."}</div>;
  }

  if (!step) {
    return (
      <div className="center-state">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="flow">
      <header className="flow-top">
        <button type="button" className="icon-btn" onClick={goBack} aria-label="Voltar">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <path d="M15 5 8 12l7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1>Agendar</h1>
        <span />
      </header>

      <ol className="steps" aria-label="Etapas do agendamento">
        {LABELS.map((label, index) => {
          const number = index + 1;
          const state = number < current ? "done" : number === current ? "current" : "todo";
          return (
            <li key={label} className={`step ${state}`}>
              <button
                type="button"
                className="step-hit"
                disabled={number > current}
                onClick={() => {
                  if (number < current) {
                    setError("");
                    setStep(ORDER[index]);
                  }
                }}
              >
                <span className="step-dot">{state === "done" ? "✓" : number}</span>
                <span className="step-label">{label}</span>
              </button>
            </li>
          );
        })}
      </ol>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="flow-body">
        {step === "service" && (
          <div className="pick-list">
            {shop.services.map((item) => {
              const selected = item.id === selectedService;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`pick ${selected ? "is-on" : ""}`}
                  onClick={() => {
                    setSelectedService(item.id);
                    setSelectedBarber("");
                    setDate("");
                    setSelectedSlot("");
                    setError("");
                  }}
                >
                  <Thumb src={item.imageUrl} alt="" />
                  <span>
                    <strong>{item.name}</strong>
                    {item.description && <em>{item.description}</em>}
                    <b>
                      {formatMoney(item.price)} · {item.durationMinutes} min
                    </b>
                  </span>
                  <span className="pick-radio" aria-hidden />
                </button>
              );
            })}
          </div>
        )}

        {step === "barber" && (
          <div className="pick-list">
            {shop.barbers.map((item) => {
              const selected = item.id === selectedBarber;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`pick round ${selected ? "is-on" : ""}`}
                  onClick={() => {
                    setSelectedBarber(item.id);
                    setDate("");
                    setSelectedSlot("");
                    setError("");
                  }}
                >
                  <Thumb src={item.imageUrl} alt="" label={item.name} />
                  <span>
                    <strong>{item.name}</strong>
                    <em>{item.title}</em>
                  </span>
                  <span className="pick-radio" aria-hidden />
                </button>
              );
            })}
          </div>
        )}

        {step === "date" && (
          <MonthCalendar
            value={date}
            minIso={minDate}
            onChange={(next) => {
              setDate(next);
              setSelectedSlot("");
              setError("");
            }}
          />
        )}

        {step === "time" && (
          <>
            <p className="flow-context">
              {[service?.name, barber?.name, date ? prettyDate(date) : ""]
                .filter(Boolean)
                .join(" · ")}
            </p>
            <p className="label">Horários disponíveis</p>
            {slotsLoading ? (
              <p className="muted">Buscando horários...</p>
            ) : slots.length === 0 ? (
              <p className="muted">Nenhum horário nesta data.</p>
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
          </>
        )}

        {step === "details" && service && (
          <>
            <article className="summary-card">
              <Thumb src={service.imageUrl} alt="" />
              <div>
                <strong>{service.name}</strong>
                <p>
                  {[barber?.name, prettyDate(date), selectedSlot].filter(Boolean).join(" · ")}
                </p>
              </div>
              <b>{formatMoney(service.price)}</b>
            </article>

            {!user && (
              <>
                <div className="form-group">
                  <label className="label" htmlFor="guestName">
                    Nome
                  </label>
                  <input
                    id="guestName"
                    className="input"
                    value={guestName}
                    onChange={(event) => setGuestName(event.target.value)}
                    placeholder="Seu nome"
                    autoComplete="name"
                  />
                </div>
                <div className="form-group">
                  <label className="label" htmlFor="guestPhone">
                    Telefone
                  </label>
                  <input
                    id="guestPhone"
                    className="input"
                    type="tel"
                    inputMode="tel"
                    value={guestPhone}
                    onChange={(event) => setGuestPhone(event.target.value)}
                    placeholder="(00) 00000-0000"
                    autoComplete="tel"
                  />
                </div>
              </>
            )}
          </>
        )}
      </div>

      <div className="flow-footer">
        <button
          type="button"
          className="btn btn-primary btn-block"
          disabled={!canContinue || booking}
          onClick={goNext}
        >
          {booking ? "Agendando..." : step === "details" ? "Confirmar" : "Próximo"}
        </button>
      </div>
    </div>
  );
}

function MonthCalendar({
  value,
  minIso,
  onChange,
}: {
  value: string;
  minIso: string;
  onChange: (iso: string) => void;
}) {
  const initial = value ? new Date(`${value}T12:00:00`) : new Date();
  const [cursor, setCursor] = useState(
    () => new Date(initial.getFullYear(), initial.getMonth(), 1),
  );

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const today = new Date();
  const cursorKey = year * 12 + month;
  const minKey = today.getFullYear() * 12 + today.getMonth();
  const rawLabel = cursor.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const label = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1);

  const firstWeekday = new Date(year, month, 1).getDay();
  const offset = (firstWeekday + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<number | null> = Array.from({ length: offset }, () => null);
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(day);

  function isoFor(day: number) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  return (
    <div>
      <div className="cal-head">
        <button
          type="button"
          className="icon-btn"
          aria-label="Mês anterior"
          disabled={cursorKey <= minKey}
          onClick={() => setCursor(new Date(year, month - 1, 1))}
        >
          ‹
        </button>
        <strong>{label}</strong>
        <button
          type="button"
          className="icon-btn"
          aria-label="Próximo mês"
          disabled={cursorKey >= minKey + 11}
          onClick={() => setCursor(new Date(year, month + 1, 1))}
        >
          ›
        </button>
      </div>
      <div className="cal-grid">
        {WEEKDAYS.map((day) => (
          <span key={day} className="cal-dow">
            {day}
          </span>
        ))}
        {cells.map((day, index) => {
          if (!day) return <span key={`e-${index}`} />;
          const iso = isoFor(day);
          const disabled = iso < minIso;
          return (
            <button
              key={iso}
              type="button"
              className={`cal-day ${iso === value ? "is-on" : ""} ${iso === minIso ? "is-today" : ""}`}
              disabled={disabled}
              onClick={() => onChange(iso)}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
