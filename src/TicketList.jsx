import React, { useState } from 'react';
import { STATUSES, STATUS_COLORS } from './ticketUtils.js';

function TicketCard({ ticket, onDeleteTicket, onUpdateStatus, onUpdateTicket }) {
  const [noteExpanded, setNoteExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const hasNote = ticket.hasNote;

  const handleAddNote = () => {
    onUpdateTicket(ticket.id, { hasNote: true, note: '', hasDraftEmail: false });
  };

  const handleNoteChange = (e) => {
    onUpdateTicket(ticket.id, { note: e.target.value });
  };

  const toggleDraft = () => {
    onUpdateTicket(ticket.id, { hasDraftEmail: !ticket.hasDraftEmail });
  };

  const handleRemoveNote = () => {
    onUpdateTicket(ticket.id, { hasNote: false, note: '', hasDraftEmail: false });
    setNoteExpanded(false);
  };

  return (
    <div className="ticket-card" id={`ticket-${ticket.id}`}>
      <div className="ticket-card-header">
        <span className="ticket-number">#{ticket.ticketNumber}</span>
        <div className="status-dropdown-wrapper" style={{ backgroundColor: STATUS_COLORS[ticket.status] || '#999' }}>
          <select
            className="ticket-status-dropdown"
            value={ticket.status}
            onChange={(e) => onUpdateStatus(ticket.id, e.target.value)}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <span className="dropdown-arrow">▾</span>
        </div>
      </div>
      <div className="ticket-card-body">
        <div className="ticket-title">{ticket.title}</div>
        <div className="ticket-meta">
          <span className="ticket-label">{ticket.label}</span>
          <span className="ticket-severity" data-severity={ticket.severity}>
            {ticket.severity}
          </span>
        </div>
        <div className="ticket-date-row">
          <span className="ticket-date">
            Last Modified: {new Date(ticket.lastModified).toLocaleString()}
          </span>
          <div className="ticket-actions-right">
            {!hasNote && (
              <button
                className="btn-add-note"
                onClick={handleAddNote}
                title="Add note"
              >
                + Note
              </button>
            )}
            <button
              className="btn-delete"
              onClick={() => setConfirmDelete(true)}
              title="Delete ticket"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18"/>
                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                <path d="M5 6v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6"/>
                <line x1="10" y1="11" x2="10" y2="17"/>
                <line x1="14" y1="11" x2="14" y2="17"/>
              </svg>
            </button>
          </div>
        </div>

        {confirmDelete && (
          <div className="confirm-delete-overlay">
            <div className="confirm-delete-modal">
              <p>Are you sure you want to delete ticket <strong>#{ticket.ticketNumber}</strong>?</p>
              <div className="confirm-delete-actions">
                <button className="btn-confirm-yes" onClick={() => onDeleteTicket(ticket.id)}>Yes, delete</button>
                <button className="btn-confirm-no" onClick={() => setConfirmDelete(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {hasNote && (
          <div className="ticket-note-section">
            <div className="ticket-note-header">
              <div className="note-left">
                <button
                  className="btn-note-toggle"
                  onClick={() => setNoteExpanded(!noteExpanded)}
                >
                  <span className={`note-arrow ${noteExpanded ? 'expanded' : ''}`}>▸</span>
                  Note
                </button>
                <button
                  className="btn-remove-note"
                  onClick={handleRemoveNote}
                  title="Remove note"
                >
                  ✕
                </button>
              </div>
              <span
                className={`draft-badge ${ticket.hasDraftEmail ? 'draft-ready' : 'draft-none'}`}
                onClick={toggleDraft}
                title="Click to toggle draft status"
              >
                {ticket.hasDraftEmail ? 'Draft email ready' : 'No draft email'}
              </span>
            </div>
            {noteExpanded && (
              <textarea
                className="ticket-note-input"
                value={ticket.note || ''}
                onChange={handleNoteChange}
                placeholder="What needs to be done on this ticket..."
                rows={3}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TicketList({ title, tickets, onDeleteTicket, onUpdateStatus, onUpdateTicket, onAddClick }) {
  const [filterStatus, setFilterStatus] = useState('All');

  const filtered = filterStatus === 'All'
    ? tickets
    : tickets.filter((t) => t.status === filterStatus);

  const sorted = [...filtered].sort((a, b) => {
    return STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status);
  });

  return (
    <div className="ticket-list">
      <div className="list-header">
        <h3>{title} Tickets ({sorted.length})</h3>
        <button className="btn-add-ticket" onClick={onAddClick} title="Add ticket">＋</button>
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
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              onDeleteTicket={onDeleteTicket}
              onUpdateStatus={onUpdateStatus}
              onUpdateTicket={onUpdateTicket}
            />
          ))}
        </div>
      )}
    </div>
  );
}
