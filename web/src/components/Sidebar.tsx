import React from "react";
import { Link } from "react-router-dom";
import "./sidebar.css"; // or add in index.css

export default function Sidebar() {
  return (
    <aside className="app-sidebar">
      <div className="brand">Quotation Maker</div>
      <nav>
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/quotes" className="active">Quotes</Link>
        <Link to="/invoices">Invoices</Link>
        <Link to="/clients">Clients</Link>
        <Link to="/settings">Settings</Link>
      </nav>
      <div className="sidebar-footer">v1.0</div>
    </aside>
  );
}
