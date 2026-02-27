import React, { useState, useEffect } from 'react';
import { STATUSES, SEVERITIES } from './ticketUtils.js';

export default function TicketForm({ onAddTicket, onClose, region }) {
  const [form, setForm] = useState({
    ticketNumber: '',
    title: '',
    label: '',
    lastModified: '',
    severity: 'Medium',
    status: 'Pending Initial Contact',
    region: region || 'EU',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    setForm((f) => ({ ...f, region: region || 'EU' }));
  }, [region]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.ticketNumber.trim() || !form.title.trim()) {
      setError('Ticket number and title are required.');
      return;
    }
    setError('');
    const lastMod = form.lastModified
      ? new Date(form.lastModified).toISOString()
      : new Date().toISOString();
    onAddTicket({
      ...form,
      id: Date.now() + Math.random(),
      createdAt: new Date().toISOString(),
      warningTrackingStart: lastMod,
      lastModified: lastMod,
    });
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-backdrop" onClick={onClose} />
      <form className="ticket-form modal-form" onSubmit={handleSubmit}>
        <div className="modal-form-header">
          <h3>Add New {region} Ticket</h3>
          <button type="button" className="btn-modal-close" onClick={onClose}>✕</button>
        </div>
        {error && <div className="form-error">{error}</div>}

        <div className="form-row">
          <label>
          Ticket Number
          <input
            type="text"
            name="ticketNumber"
            value={form.ticketNumber}
            onChange={handleChange}
            placeholder="e.g. TKT-1234"
          />
        </label>
      </div>

      <div className="form-row">
        <label>
          Title
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Ticket title"
          />
        </label>

        <label>
          Label
          <input
            type="text"
            name="label"
            value={form.label}
            onChange={handleChange}
            placeholder="e.g. Bug, Feature"
          />
        </label>
      </div>

      <div className="form-row">
        <label>
          Last Modified
          <input
            type="datetime-local"
            name="lastModified"
            value={form.lastModified}
            onChange={handleChange}
          />
        </label>

        <label>
          Severity
          <select name="severity" value={form.severity} onChange={handleChange}>
            {SEVERITIES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="form-row">
        <label>
          Initial Status
          <select name="status" value={form.status} onChange={handleChange}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
      </div>

        <button type="submit" className="btn-primary">Add Ticket</button>
      </form>
    </div>
  );
}
