import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth";
import "./Layout.css";

const iconProps = {
  viewBox: "0 0 24 24",
  className: "nav-svg",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true as const,
};

function NavIcon({ name }: { name: "book" | "agenda" | "profile" | "admin" }) {
  if (name === "book") {
    return (
      <svg {...iconProps}>
        <circle cx="6" cy="7" r="2" />
        <path d="M8 7h12M6 11h14M6 15h10" />
        <path d="M4 4v16" />
      </svg>
    );
  }
  if (name === "agenda") {
    return (
      <svg {...iconProps}>
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M8 3v4M16 3v4M4 10h16" />
      </svg>
    );
  }
  if (name === "admin") {
    return (
      <svg {...iconProps}>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" />
      </svg>
    );
  }
  return (
    <svg {...iconProps}>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5 19.2c1.3-3.1 3.6-4.6 7-4.6s5.7 1.5 7 4.6" />
    </svg>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const isAdmin = user?.role === "BARBER_ADMIN" || pathname.startsWith("/admin");
  const hideNav = !isAdmin && (pathname === "/login" || pathname.startsWith("/agendar"));

  return (
    <div className={`layout ${isAdmin ? "layout-admin" : "layout-app"}${hideNav ? " nav-hidden" : ""}`}>
      {isAdmin && (
        <header className="navbar">
          <div className="navbar-inner">
            <Link to="/admin" className="brand">
              <img
                src={`${import.meta.env.BASE_URL}logo.png`}
                alt=""
                className="brand-logo"
              />
              <span className="brand-text">Brutus Barber</span>
            </Link>

            <nav className="top-nav" aria-label="Navegação principal">
              <NavLink to="/admin" end>
                Admin
              </NavLink>
              <NavLink to="/admin/schedule">Agenda</NavLink>
              <NavLink to="/profile">Perfil</NavLink>
            </nav>

            {user && (
              <div className="header-actions">
                <button type="button" className="btn btn-secondary btn-sm" onClick={logout}>
                  Sair
                </button>
              </div>
            )}
          </div>
        </header>
      )}

      <main className="container page layout-main">
        <Outlet />
      </main>

      {!hideNav && (
        <nav className="bottom-nav" aria-label="Navegação">
          <div className={`bottom-nav-pill${isAdmin ? " with-admin" : ""}`}>
            {isAdmin ? (
              <NavLink to="/admin" end>
                <NavIcon name="admin" />
                <span className="nav-label">Admin</span>
              </NavLink>
            ) : (
              <NavLink to="/" end>
                <NavIcon name="book" />
                <span className="nav-label">Agendar</span>
              </NavLink>
            )}
            <NavLink to={isAdmin ? "/admin/schedule" : "/bookings"}>
              <NavIcon name="agenda" />
              <span className="nav-label">Agenda</span>
            </NavLink>
            {isAdmin && (
              <NavLink to="/profile">
                <NavIcon name="profile" />
                <span className="nav-label">Perfil</span>
              </NavLink>
            )}
          </div>
        </nav>
      )}
    </div>
  );
}
