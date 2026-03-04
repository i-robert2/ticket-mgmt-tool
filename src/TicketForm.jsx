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
    countdownHours: '',
    countdownMinutes: '',
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
    const hours = parseInt(form.countdownHours, 10) || 0;
    const minutes = parseInt(form.countdownMinutes, 10) || 0;
    const totalMs = (hours * 60 + minutes) * 60 * 1000;
    const countdownEndTime = (form.status === 'Pending Initial Contact' && totalMs > 0)
      ? new Date(Date.now() + totalMs).toISOString()
      : null;

    onAddTicket({
      ...form,
      id: Date.now() + Math.random(),
      createdAt: new Date().toISOString(),
      warningTrackingStart: lastMod,
      lastModified: lastMod,
      countdownEndTime,
      countdownNotified: false,
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

      {form.status === 'Pending Initial Contact' && (
        <div className="form-row countdown-row">
          <label>
            Countdown Timer (optional)
            <div className="countdown-inputs">
              <input
                type="number"
                name="countdownHours"
                value={form.countdownHours}
                onChange={handleChange}
                placeholder="Hours"
                min="0"
                max="999"
              />
              <span className="countdown-separator">h</span>
              <input
                type="number"
                name="countdownMinutes"
                value={form.countdownMinutes}
                onChange={handleChange}
                placeholder="Min"
                min="0"
                max="59"
              />
              <span className="countdown-separator">m</span>
            </div>
          </label>
        </div>
      )}

        <button type="submit" className="btn-primary">Add Ticket</button>
      </form>
    </div>
  );
}
