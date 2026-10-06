import { useState } from "react";
import { Link } from "react-router-dom";
import Thumb from "../components/Thumb";
import { formatMoney } from "../lib/format";
import { useAuth } from "../lib/auth";
import { useShop } from "../lib/useShop";
import "./customer.css";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" strokeLinecap="round" />
    </svg>
  );
}

export default function Home() {
  const { user } = useAuth();
  const { shop, loading, error } = useShop();
  const [query, setQuery] = useState("");

  if (loading) {
    return (
      <div className="center-state">
        <div className="spinner" />
        <p>Carregando...</p>
      </div>
    );
  }

  if (!shop) {
    return <div className="empty-state">{error || "Barbearia não encontrada."}</div>;
  }

  const phone = Array.isArray(shop.phones) ? shop.phones[0] : "";
  const initial = (user?.name || shop.name).trim().charAt(0).toUpperCase();
  const q = query.trim().toLowerCase();
  const services = shop.services.filter(
    (item) =>
      !q ||
      item.name.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q),
  );

  return (
    <div>
      <header className="hello">
        <span className="avatar-sm" aria-hidden>
          {initial}
        </span>
        <div>
          <p>{greeting()},</p>
          <strong>{user?.name?.trim() || "Bem-vindo"}</strong>
        </div>
      </header>

      <label className="search">
        <span className="sr-only">Buscar serviço</span>
        <SearchIcon />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar serviço..."
        />
      </label>

      <article className={`promo ${shop.imageUrl ? "" : "promo-solo"}`}>
        <div className="promo-copy">
          <h2>Seu horário, sem fila</h2>
          <p>Escolha o serviço, o dia e o horário.</p>
          <Link className="promo-btn" to="/agendar">
            Agendar
          </Link>
        </div>
        {shop.imageUrl && (
          <div className="promo-media">
            <Thumb src={shop.imageUrl} alt="" />
          </div>
        )}
      </article>

      <div className="section-head">
        <h2>Serviços</h2>
        <Link to="/servicos">Ver todos</Link>
      </div>
      {services.length === 0 ? (
        <p className="muted">Nenhum serviço encontrado.</p>
      ) : (
        <div className="h-scroll">
          {services.map((item) => (
            <Link key={item.id} className="svc-tile" to={`/agendar?service=${item.id}`}>
              <Thumb src={item.imageUrl} alt="" />
              <strong>{item.name}</strong>
              <em>{formatMoney(item.price)}</em>
            </Link>
          ))}
        </div>
      )}

      <div className="section-head">
        <h2>A barbearia</h2>
      </div>
      <Link className="shop-card" to="/servicos">
        <Thumb src={shop.imageUrl} alt="" />
        <div>
          <strong>{shop.name}</strong>
          <p>{shop.address}</p>
          {phone && <p>{phone}</p>}
        </div>
        <span className="chevron" aria-hidden>
          ›
        </span>
      </Link>
    </div>
  );
}
