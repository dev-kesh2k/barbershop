import { NavLink } from "react-router-dom";
import "./AdminNav.css";

export default function AdminNav() {
  return (
    <nav className="admin-nav" aria-label="Admin">
      <NavLink to="/admin" end>
        Dashboard
      </NavLink>
      <NavLink to="/admin/services">Serviços</NavLink>
      <NavLink to="/admin/schedule">Agenda</NavLink>
      <NavLink to="/admin/settings">Config</NavLink>
    </nav>
  );
}
