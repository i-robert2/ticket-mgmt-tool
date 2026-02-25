import React, { useState } from 'react';
import { STATUSES, SEVERITIES } from './ticketUtils.js';

const initialForm = {
  ticketNumber: '',
  title: '',
  label: '',
  lastModified: '',
  severity: 'Medium',
  status: 'Pending Initial Contact',
  region: 'EU',
};

export default function TicketForm({ onAddTicket }) {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');

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
    onAddTicket({
      ...form,
      id: Date.now() + Math.random(),
      createdAt: new Date().toISOString(),
      warningTrackingStart: new Date().toISOString(),
      lastModified: form.lastModified || new Date().toISOString(),
    });
    setForm(initialForm);
  };

  return (
    <form className="ticket-form" onSubmit={handleSubmit}>
      <h3>Add New Ticket</h3>
      {error && <div className="form-error">{error}</div>}

      <div className="form-row">
        <label>
          Region
          <select name="region" value={form.region} onChange={handleChange}>
            <option value="EU">EU</option>
            <option value="Global">Global</option>
          </select>
        </label>

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
  );
}
