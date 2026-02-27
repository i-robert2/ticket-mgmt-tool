import React, { useState, useEffect, useCallback, useRef } from 'react';
import TicketForm from './TicketForm.jsx';
import TicketList from './TicketList.jsx';
import NotificationsPanel from './NotificationsPanel.jsx';
import { STATUSES, STATUS_COLORS, computeWarningEscalation, fetchBucharestTime } from './ticketUtils.js';

const EMPTY_DATA = { eu: [], global: [], notifications: [] };

function scrollToTicket(ticketId) {
  const el = document.getElementById(`ticket-${ticketId}`);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el.classList.add('ticket-highlight');
  setTimeout(() => el.classList.remove('ticket-highlight'), 1500);
}

function SearchOverlay({ query, setQuery, euTickets, globalTickets, onClose }) {
  const inputRef = React.useRef(null);
  React.useEffect(() => { inputRef.current?.focus(); }, []);

  const q = query.toLowerCase().trim();
  const matchTicket = (t) => {
    if (!q) return false;
    return (
      t.ticketNumber.toLowerCase().includes(q) ||
      t.title.toLowerCase().includes(q) ||
      t.label.toLowerCase().includes(q)
    );
  };

  const euResults = euTickets.filter(matchTicket).map((t) => ({ ...t, region: 'EU' }));
  const globalResults = globalTickets.filter(matchTicket).map((t) => ({ ...t, region: 'Global' }));
  const results = [...euResults, ...globalResults];

  return (
    <div className="search-overlay">
      <div className="search-backdrop" onClick={onClose} />
      <div className="search-panel">
        <div className="search-panel-header">
          <input
            ref={inputRef}
            type="text"
            className="search-input"
            placeholder="Search by ticket number, title, or label..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="search-close" onClick={onClose}>✕</button>
        </div>
        <div className="search-results">
          {!q && <p className="search-hint">Start typing to search across all tickets.</p>}
          {q && results.length === 0 && <p className="search-hint">No tickets match "{query}".</p>}
          {results.map((t) => (
            <div
              key={t.id}
              className="search-result-card"
              onClick={() => { onClose(); setTimeout(() => scrollToTicket(t.id), 100); }}
            >
              <div className="search-result-top">
                <span className="ticket-number">#{t.ticketNumber}</span>
                <span className="search-region-badge">{t.region}</span>
                <span
                  className="search-status-badge"
                  style={{ backgroundColor: STATUS_COLORS[t.status] || '#999' }}
                >{t.status}</span>
              </div>
              <div className="search-result-title">{t.title}</div>
              <div className="search-result-meta">
                <span className="ticket-label">{t.label}</span>
                <span className="ticket-severity" data-severity={t.severity}>{t.severity}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Helpers for Electron vs browser
const isElectron = typeof window !== 'undefined' && window.electronAPI;

async function persistData(data) {
  if (isElectron) {
    await window.electronAPI.saveData(data);
  } else {
    localStorage.setItem('ticket-mgmt-data', JSON.stringify(data));
  }
}

async function loadPersistedData() {
  if (isElectron) {
    return await window.electronAPI.loadData();
  } else {
    const raw = localStorage.getItem('ticket-mgmt-data');
    return raw ? JSON.parse(raw) : null;
  }
}

export default function App() {
  const [euTickets, setEuTickets] = useState([]);
  const [globalTickets, setGlobalTickets] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showFormForRegion, setShowFormForRegion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bucharestTime, setBucharestTime] = useState(null);
  const [liveClock, setLiveClock] = useState(new Date());
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [toasts, setToasts] = useState([]);
  const initialized = useRef(false);
  const euTicketsRef = useRef(euTickets);
  const globalTicketsRef = useRef(globalTickets);

  // Keep refs in sync with state
  useEffect(() => { euTicketsRef.current = euTickets; }, [euTickets]);
  useEffect(() => { globalTicketsRef.current = globalTickets; }, [globalTickets]);

  // ─── Show a temporary toast card for new notifications ───
  const showToast = useCallback((notifs) => {
    const newToasts = notifs.map((n) => ({ ...n, toastId: Date.now() + Math.random() }));
    setToasts((prev) => [...newToasts, ...prev]);
    // Auto-dismiss each toast after 6 seconds
    newToasts.forEach((t) => {
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.toastId !== t.toastId));
      }, 6000);
    });
  }, []);

  // ─── Load persisted data & run escalation check on startup ───
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    (async () => {
      // 1. Fetch Bucharest time
      const now = await fetchBucharestTime();
      setBucharestTime(now);

      // 2. Load persisted data
      const saved = await loadPersistedData();
      if (saved) {
        let eu = saved.eu || [];
        let global = saved.global || [];
        let notifs = saved.notifications || [];

        // 3. Run warning escalation for all tickets
        const processTickets = (tickets) => {
          const newNotifs = [];
          const updated = tickets.map((t) => {
            const result = computeWarningEscalation(t, now);
            if (result.notifications.length > 0) {
              newNotifs.push(...result.notifications);
            }
            if (result.status !== t.status || result.preWarningStatus !== t.preWarningStatus) {
              return { ...t, status: result.status, preWarningStatus: result.preWarningStatus };
            }
            return t;
          });
          return { updated, newNotifs };
        };

        const euResult = processTickets(eu);
        const globalResult = processTickets(global);

        eu = euResult.updated;
        global = globalResult.updated;
        notifs = [...euResult.newNotifs, ...globalResult.newNotifs, ...notifs];

        setEuTickets(eu);
        setGlobalTickets(global);
        setNotifications(notifs);

        // If there were new notifications from escalation, show toast cards
        const allNewNotifs = [...euResult.newNotifs, ...globalResult.newNotifs];
        if (allNewNotifs.length > 0) {
          showToast(allNewNotifs);
        }

        // Persist updated state
        await persistData({ eu, global, notifications: notifs });
      }
      setLoading(false);
    })();
  }, []);

  // ─── Live clock (updates every second) ───
  useEffect(() => {
    const timer = setInterval(() => {
      setLiveClock(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // ─── Periodic escalation check (every 5 minutes) ───
  useEffect(() => {
    const interval = setInterval(async () => {
      const now = await fetchBucharestTime();
      setBucharestTime(now);

      const euResult = processForState(euTicketsRef.current, now);
      const globalResult = processForState(globalTicketsRef.current, now);

      setEuTickets(euResult.updated);
      setGlobalTickets(globalResult.updated);

      const allNewNotifs = [...euResult.newNotifs, ...globalResult.newNotifs];
      if (allNewNotifs.length > 0) {
        setNotifications((n) => [...allNewNotifs, ...n]);
        showToast(allNewNotifs);
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  function processForState(tickets, now) {
    const newNotifs = [];
    const updated = tickets.map((t) => {
      const result = computeWarningEscalation(t, now);
      if (result.notifications.length > 0) {
        newNotifs.push(...result.notifications);
      }
      if (result.status !== t.status || result.preWarningStatus !== t.preWarningStatus) {
        return { ...t, status: result.status, preWarningStatus: result.preWarningStatus };
      }
      return t;
    });
    return { updated, newNotifs };
  }

  // ─── Auto-persist when data changes ───
  useEffect(() => {
    if (!loading) {
      persistData({ eu: euTickets, global: globalTickets, notifications });
    }
  }, [euTickets, globalTickets, notifications, loading]);

  // ─── Handlers ───
  const handleAddTicket = useCallback((ticket) => {
    if (ticket.region === 'EU') {
      setEuTickets((prev) => [...prev, ticket]);
    } else {
      setGlobalTickets((prev) => [...prev, ticket]);
    }
  }, []);

  const handleDeleteTicket = useCallback((region) => (id) => {
    if (region === 'EU') {
      setEuTickets((prev) => prev.filter((t) => t.id !== id));
    } else {
      setGlobalTickets((prev) => prev.filter((t) => t.id !== id));
    }
  }, []);

  const handleUpdateStatus = useCallback((region) => (id, newStatus) => {
    const updater = (prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const now = new Date().toISOString();
        const updates = {
          ...t,
          status: newStatus,
          lastModified: now,
          warningTrackingStart: now,
        };
        // Record timestamp when entering "Warning X Sent" statuses
        if (newStatus === 'Warning 1 Sent') {
          updates.warning1SentAt = now;
        } else if (newStatus === 'Warning 2 Sent') {
          updates.warning2SentAt = now;
        }
        return updates;
      });
    if (region === 'EU') {
      setEuTickets(updater);
    } else {
      setGlobalTickets(updater);
    }
  }, []);

  const handleUpdateTicket = useCallback((region) => async (id, updates) => {
    const updater = (prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const merged = { ...t, ...updates };
        // When lastModified is edited on a warning-sent ticket, sync the
        // corresponding warningXSentAt so the escalation timer uses the new date.
        if (updates.lastModified) {
          if (t.status === 'Warning 1 Sent') {
            merged.warning1SentAt = updates.lastModified;
          } else if (t.status === 'Warning 2 Sent') {
            merged.warning2SentAt = updates.lastModified;
          }
          merged.warningTrackingStart = updates.lastModified;
        }
        return merged;
      });
    if (region === 'EU') {
      setEuTickets(updater);
    } else {
      setGlobalTickets(updater);
    }

    // If lastModified was edited, run an immediate escalation check so the
    // status updates right away instead of waiting for the 5-min interval.
    if (updates.lastModified) {
      const now = await fetchBucharestTime();
      setBucharestTime(now);

      // Use a short delay to let the ticket update state settle before
      // reading the refs for the escalation check.
      await new Promise((r) => setTimeout(r, 50));

      const euResult = processForState(euTicketsRef.current, now);
      const globalResult = processForState(globalTicketsRef.current, now);

      setEuTickets(euResult.updated);
      setGlobalTickets(globalResult.updated);

      const editNewNotifs = [...euResult.newNotifs, ...globalResult.newNotifs];
      if (editNewNotifs.length > 0) {
        setNotifications((n) => [...editNewNotifs, ...n]);
        showToast(editNewNotifs);
      }
    }
  }, []);

  const handleClearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const handleDismissNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Mark all notifications as read when the panel is opened
  const toggleNotifications = useCallback(() => {
    setShowNotifications((prev) => {
      if (!prev) {
        // Opening the panel: mark all as read
        setNotifications((notifs) =>
          notifs.map((n) => (n.read ? n : { ...n, read: true }))
        );
      }
      return !prev;
    });
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading tickets & checking Bucharest time...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Ticket Management</h1>
        <div className="header-right">
          <span className="bucharest-time">
            Bucharest: {liveClock.toLocaleString('en-GB', { timeZone: 'Europe/Bucharest' })}
          </span>
          <button
            className="btn-search-header"
            onClick={() => { setShowSearch(!showSearch); setSearchQuery(''); }}
            title="Search tickets"
          >
            🔍
          </button>
          <button
            className={`btn-notifications ${notifications.length > 0 ? 'has-unread' : ''}`}
            onClick={toggleNotifications}
          >
            🔔 {notifications.length > 0 && <span className="badge">{notifications.length}</span>}
          </button>
        </div>
      </header>

      <main className="app-main">
        <div className="lists-container">
          <TicketList
            title="EU"
            tickets={euTickets}
            onDeleteTicket={handleDeleteTicket('EU')}
            onUpdateStatus={handleUpdateStatus('EU')}
            onUpdateTicket={handleUpdateTicket('EU')}
            onAddClick={() => setShowFormForRegion('EU')}
          />
          <TicketList
            title="Global"
            tickets={globalTickets}
            onDeleteTicket={handleDeleteTicket('Global')}
            onUpdateStatus={handleUpdateStatus('Global')}
            onUpdateTicket={handleUpdateTicket('Global')}
            onAddClick={() => setShowFormForRegion('Global')}
          />
        </div>
      </main>

      {showFormForRegion && (
        <TicketForm
          region={showFormForRegion}
          onAddTicket={handleAddTicket}
          onClose={() => setShowFormForRegion(null)}
        />
      )}

      {showSearch && (
        <SearchOverlay
          query={searchQuery}
          setQuery={setSearchQuery}
          euTickets={euTickets}
          globalTickets={globalTickets}
          onClose={() => setShowSearch(false)}
        />
      )}

      {showNotifications && (
        <div className="notifications-overlay">
          <div className="notifications-backdrop" onClick={() => setShowNotifications(false)} />
          <NotificationsPanel
            notifications={notifications}
            onClear={handleClearNotifications}
            onDismiss={handleDismissNotification}
          />
        </div>
      )}

      {/* Toast notification cards */}
      {toasts.length > 0 && (
        <div className="toast-container">
          {toasts.map((t) => (
            <div key={t.toastId} className="toast-card">
              <div className="toast-message">{t.message}</div>
              <div className="toast-meta">
                <span className="notif-region">{t.region}</span>
                <span className="notif-time">{new Date(t.timestamp).toLocaleString()}</span>
              </div>
              <button
                className="btn-dismiss"
                onClick={() => setToasts((prev) => prev.filter((x) => x.toastId !== t.toastId))}
              >✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
