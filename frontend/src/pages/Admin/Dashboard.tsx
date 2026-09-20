import { useEffect, useState } from "react";
import { ApiError, api, type ScheduleBlock } from "../../lib/api";
import AdminNav from "../../components/AdminNav";

interface DashboardData {
  todayBookings: number;
  upcomingBookings: number;
  servicesCount: number;
  blocks: ScheduleBlock[];
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<{ dashboard: DashboardData }>("/admin/dashboard")
      .then((res) => setData(res.dashboard))
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Erro ao carregar."),
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <h1 className="page-title">Painel administrativo</h1>
      <AdminNav />

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <p>Carregando...</p>
      ) : data ? (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{data.todayBookings}</div>
              <div className="stat-label">Agendamentos hoje</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{data.upcomingBookings}</div>
              <div className="stat-label">Próximos confirmados</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{data.servicesCount}</div>
              <div className="stat-label">Serviços cadastrados</div>
            </div>
          </div>

          <p className="dash-hint">
            Veja e gerencie os horários marcados na página <strong>Agenda</strong>.
          </p>
        </>
      ) : null}

      <style>{`
        .dash-hint {
          color: var(--text-muted);
          margin: 0.25rem 0 0;
          font-size: 0.95rem;
        }
      `}</style>
    </>
  );
}
