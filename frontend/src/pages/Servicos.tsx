import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Thumb from "../components/Thumb";
import { formatMoney } from "../lib/format";
import { useShop } from "../lib/useShop";
import "./customer.css";

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" strokeLinecap="round" />
    </svg>
  );
}

export default function Servicos() {
  const navigate = useNavigate();
  const { shop, loading, error } = useShop();
  const [query, setQuery] = useState("");

  const services = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!shop) return [];
    return shop.services.filter(
      (item) =>
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q),
    );
  }, [shop, query]);

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

  return (
    <div>
      <h1 className="page-title">Serviços</h1>
      <label className="search">
        <span className="sr-only">Buscar serviço</span>
        <SearchIcon />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar serviço..."
        />
      </label>

      {services.length === 0 ? (
        <div className="empty-state">Nenhum serviço encontrado.</div>
      ) : (
        <div className="svc-list">
          {services.map((item) => (
            <button
              key={item.id}
              type="button"
              className="svc-row"
              onClick={() => navigate(`/agendar?service=${item.id}`)}
            >
              <Thumb src={item.imageUrl} alt="" />
              <span>
                <strong>{item.name}</strong>
                {item.description && <p>{item.description}</p>}
                <p className="svc-meta">
                  {item.durationMinutes} min · {formatMoney(item.price)}
                </p>
              </span>
              <span className="chevron" aria-hidden>
                ›
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
