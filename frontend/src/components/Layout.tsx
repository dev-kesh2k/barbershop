import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../lib/auth";
import "./Layout.css";

export default function Layout() {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === "BARBER_ADMIN";

  return (
    <div className="layout">
      <header className="navbar">
        <div className="container navbar-inner">
          <Link to={isAdmin ? "/admin" : "/"} className="brand">
            <img
              src={`${import.meta.env.BASE_URL}logo.png`}
              alt="Brutus Barber"
              className="brand-logo"
            />
            <span className="brand-text">Brutus Barber</span>
          </Link>

          <nav className="top-nav" aria-label="Navegação principal">
            {isAdmin ? (
              <NavLink to="/admin" end>
                Admin
              </NavLink>
            ) : (
              <NavLink to="/" end>
                Agendar
              </NavLink>
            )}
            <NavLink to={isAdmin ? "/admin/schedule" : "/bookings"}>Agenda</NavLink>
            {isAdmin && <NavLink to="/profile">Perfil</NavLink>}
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

      <main className="container page layout-main">
        <Outlet />
      </main>

      <nav
        className={`bottom-nav${isAdmin ? " with-admin" : " client-nav"}`}
        aria-label="Navegação mobile"
      >
        {isAdmin ? (
          <NavLink to="/admin" end>
            <span className="nav-ico">⚙</span>
            Admin
          </NavLink>
        ) : (
          <NavLink to="/" end>
            <span className="nav-ico">✂</span>
            Agendar
          </NavLink>
        )}
        <NavLink to={isAdmin ? "/admin/schedule" : "/bookings"}>
          <span className="nav-ico">◷</span>
          Agenda
        </NavLink>
        {isAdmin && (
          <NavLink to="/profile">
            <span className="nav-ico">☺</span>
            Perfil
          </NavLink>
        )}
      </nav>
    </div>
  );
}
