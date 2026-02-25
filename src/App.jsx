import React, { useState, useEffect, useCallback, useRef } from 'react';
import TicketForm from './TicketForm.jsx';
import TicketList from './TicketList.jsx';
import NotificationsPanel from './NotificationsPanel.jsx';
import { computeWarningEscalation, fetchBucharestTime } from './ticketUtils.js';

const EMPTY_DATA = { eu: [], global: [], notifications: [] };

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
  const [loading, setLoading] = useState(true);
  const [bucharestTime, setBucharestTime] = useState(null);
  const initialized = useRef(false);

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
            if (result.status !== t.status) {
              return { ...t, status: result.status };
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

        // If there were new notifications from escalation, show the panel
        if (euResult.newNotifs.length > 0 || globalResult.newNotifs.length > 0) {
          setShowNotifications(true);
        }

        // Persist updated state
        await persistData({ eu, global, notifications: notifs });
      }
      setLoading(false);
    })();
  }, []);

  // ─── Periodic escalation check (every 5 minutes) ───
  useEffect(() => {
    const interval = setInterval(async () => {
      const now = await fetchBucharestTime();
      setBucharestTime(now);

      setEuTickets((prev) => {
        const result = processForState(prev, now);
        if (result.newNotifs.length > 0) {
          setNotifications((n) => [...result.newNotifs, ...n]);
          setShowNotifications(true);
        }
        return result.updated;
      });

      setGlobalTickets((prev) => {
        const result = processForState(prev, now);
        if (result.newNotifs.length > 0) {
          setNotifications((n) => [...result.newNotifs, ...n]);
          setShowNotifications(true);
        }
        return result.updated;
      });
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
      if (result.status !== t.status) {
        return { ...t, status: result.status };
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
        // Reset warning tracking when manually changing status
        return {
          ...t,
          status: newStatus,
          warningTrackingStart: new Date().toISOString(),
        };
      });
    if (region === 'EU') {
      setEuTickets(updater);
    } else {
      setGlobalTickets(updater);
    }
  }, []);

  const handleClearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const handleDismissNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
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
          {bucharestTime && (
            <span className="bucharest-time">
              Bucharest: {bucharestTime.toLocaleString('en-GB', { timeZone: 'Europe/Bucharest' })}
            </span>
          )}
          <button
            className={`btn-notifications ${unreadCount > 0 ? 'has-unread' : ''}`}
            onClick={() => setShowNotifications(!showNotifications)}
          >
            🔔 {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
          </button>
        </div>
      </header>

      <main className="app-main">
        <TicketForm onAddTicket={handleAddTicket} />

        <div className="lists-container">
          <TicketList
            title="EU"
            tickets={euTickets}
            onDeleteTicket={handleDeleteTicket('EU')}
            onUpdateStatus={handleUpdateStatus('EU')}
          />
          <TicketList
            title="Global"
            tickets={globalTickets}
            onDeleteTicket={handleDeleteTicket('Global')}
            onUpdateStatus={handleUpdateStatus('Global')}
          />
        </div>
      </main>

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
    </div>
  );
}
