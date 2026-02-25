import React, { useState } from 'react';
import { STATUSES, STATUS_COLORS } from './ticketUtils.js';

export default function TicketList({ title, tickets, onDeleteTicket, onUpdateStatus }) {
  const [filterStatus, setFilterStatus] = useState('All');

  const filtered = filterStatus === 'All'
    ? tickets
    : tickets.filter((t) => t.status === filterStatus);

  // Sort tickets according to STATUSES order
  const sorted = [...filtered].sort((a, b) => {
    return STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status);
  });

  return (
    <div className="ticket-list">
      <div className="list-header">
        <h3>{title} Tickets ({sorted.length})</h3>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="filter-select"
        >
          <option value="All">All Statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {sorted.length === 0 ? (
        <p className="empty-msg">No tickets found.</p>
      ) : (
        <div className="ticket-items">
          {sorted.map((ticket) => (
            <div key={ticket.id} className="ticket-card">
              <div className="ticket-card-header">
                <span className="ticket-number">#{ticket.ticketNumber}</span>
                <span
                  className="ticket-status-badge"
                  style={{ backgroundColor: STATUS_COLORS[ticket.status] || '#999' }}
                >
                  {ticket.status}
                </span>
              </div>
              <div className="ticket-card-body">
                <div className="ticket-title">{ticket.title}</div>
                <div className="ticket-meta">
                  <span className="ticket-label">{ticket.label}</span>
                  <span className="ticket-severity" data-severity={ticket.severity}>
                    {ticket.severity}
                  </span>
                </div>
                <div className="ticket-date">
                  Last Modified: {new Date(ticket.lastModified).toLocaleString()}
                </div>
              </div>
              <div className="ticket-card-actions">
                <select
                  value={ticket.status}
                  onChange={(e) => onUpdateStatus(ticket.id, e.target.value)}
                  className="status-change-select"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <button
                  className="btn-delete"
                  onClick={() => onDeleteTicket(ticket.id)}
                  title="Delete ticket"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
