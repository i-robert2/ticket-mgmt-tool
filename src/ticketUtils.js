// Status constants in the required display order
export const STATUSES = [
  'Pending Initial Contact',
  'In Progress Support',
  'Pending Warning 3',
  'Pending Warning 2',
  'Pending Warning 1',
  'Warning 3 Sent',
  'Warning 2 Sent',
  'Warning 1 Sent',
  'In Progress Engineering',
  'Pending Customer Response',
];

// Color map for statuses
export const STATUS_COLORS = {
  'Pending Initial Contact': '#e74c3c',
  'In Progress Support': '#e74c3c',
  'Pending Warning 1': '#e74c3c',
  'Pending Warning 2': '#e74c3c',
  'Pending Warning 3': '#e74c3c',
  'Warning 1 Sent': '#3498db',
  'Warning 2 Sent': '#3498db',
  'Warning 3 Sent': '#3498db',
  'In Progress Engineering': '#e67e22',
  'Pending Customer Response': '#3498db',
};

// Severity options
export const SEVERITIES = ['Critical', 'High', 'Medium', 'Low'];

// Business-day calculation helpers
// A business day = Mon-Fri (excludes Sat/Sun)

/**
 * Add N business days to a Date, returning a new Date.
 */
export function addBusinessDays(startDate, days) {
  const result = new Date(startDate);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const dow = result.getDay();
    if (dow !== 0 && dow !== 6) {
      added++;
    }
  }
  return result;
}

/**
 * Count business days between two dates (exclusive of start, inclusive of end).
 * Accounts for time-of-day: a day only counts if the full period has elapsed.
 */
export function countBusinessDays(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  let count = 0;
  const current = new Date(start);
  while (true) {
    current.setDate(current.getDate() + 1);
    if (current > end) break;
    const dow = current.getDay();
    if (dow !== 0 && dow !== 6) {
      count++;
    }
  }
  return count;
}

/**
 * Determine if a ticket should escalate (or de-escalate) to a warning status.
 *
 * Escalation chain:
 *   Trackable status → (2 biz days from lastModified) → Pending Warning 1
 *   Warning 1 Sent   → (2 biz days from warning1SentAt) → Pending Warning 2
 *   Warning 2 Sent   → (3 biz days from warning2SentAt) → Pending Warning 3
 *
 * Also de-escalates if a ticket was prematurely set to a warning level
 * and the elapsed time doesn't warrant it yet.
 *
 * Returns { status, notifications, preWarningStatus }.
 */
export function computeWarningEscalation(ticket, nowDate) {
  const trackableStatuses = [
    'Pending Initial Contact',
    'In Progress Support',
    'In Progress Engineering',
    'Pending Customer Response',
  ];

  const notifications = [];
  let newStatus = ticket.status;

  // ── Warning 1 Sent → Pending Warning 2 (after 2 biz days from warning1SentAt) ──
  if (ticket.status === 'Warning 1 Sent') {
    if (ticket.warning1SentAt) {
      const daysSinceSent = countBusinessDays(new Date(ticket.warning1SentAt), nowDate);
      if (daysSinceSent >= 2) {
        newStatus = 'Pending Warning 2';
        notifications.push({
          id: Date.now() + Math.random(),
          ticketNumber: ticket.ticketNumber,
          region: ticket.region,
          message: `Ticket #${ticket.ticketNumber} escalated to Pending Warning 2`,
          timestamp: nowDate.toISOString(),
          read: false,
        });
      }
    }
    return { status: newStatus, notifications, preWarningStatus: ticket.preWarningStatus || null };
  }

  // ── Warning 2 Sent → Pending Warning 3 (after 3 biz days from warning2SentAt) ──
  if (ticket.status === 'Warning 2 Sent') {
    if (ticket.warning2SentAt) {
      const daysSinceSent = countBusinessDays(new Date(ticket.warning2SentAt), nowDate);
      if (daysSinceSent >= 3) {
        newStatus = 'Pending Warning 3';
        notifications.push({
          id: Date.now() + Math.random(),
          ticketNumber: ticket.ticketNumber,
          region: ticket.region,
          message: `Ticket #${ticket.ticketNumber} escalated to Pending Warning 3`,
          timestamp: nowDate.toISOString(),
          read: false,
        });
      }
    }
    return { status: newStatus, notifications, preWarningStatus: ticket.preWarningStatus || null };
  }

  // ── Warning 3 Sent: no further auto-escalation ──
  if (ticket.status === 'Warning 3 Sent') {
    return { status: ticket.status, notifications: [], preWarningStatus: ticket.preWarningStatus || null };
  }

  // ── Trackable statuses & Pending Warning levels ──
  const isTrackable = trackableStatuses.includes(ticket.status) ||
    ticket.status.startsWith('Pending Warning');

  if (!isTrackable) return { status: ticket.status, notifications: [] };

  // Use lastModified as the primary tracking date
  const trackingStart = new Date(ticket.lastModified || ticket.warningTrackingStart || ticket.createdAt);
  const businessDaysElapsed = countBusinessDays(trackingStart, nowDate);

  // Only auto-escalate to Warning 1 from trackable (non-warning) statuses
  if (businessDaysElapsed >= 2) {
    if (!ticket.status.startsWith('Pending Warning')) {
      newStatus = 'Pending Warning 1';
      notifications.push({
        id: Date.now() + Math.random(),
        ticketNumber: ticket.ticketNumber,
        region: ticket.region,
        message: `Ticket #${ticket.ticketNumber} escalated to Pending Warning 1`,
        timestamp: nowDate.toISOString(),
        read: false,
      });
    }
  } else {
    // Less than 2 business days — no warning is warranted
    if (ticket.status.startsWith('Pending Warning')) {
      newStatus = ticket.preWarningStatus || 'Pending Customer Response';
    }
  }

  // Track the pre-warning status so we can restore it on de-escalation
  let preWarningStatus = ticket.preWarningStatus || null;
  if (!ticket.status.startsWith('Pending Warning') && newStatus.startsWith('Pending Warning')) {
    preWarningStatus = ticket.status;
  }

  return { status: newStatus, notifications, preWarningStatus };
}

/**
 * Fetch current Bucharest time from WorldTimeAPI.
 * Falls back to local system time if the API is unreachable.
 */
export async function fetchBucharestTime() {
  try {
    const response = await fetch('https://worldtimeapi.org/api/timezone/Europe/Bucharest');
    if (!response.ok) throw new Error('API error');
    const data = await response.json();
    return new Date(data.datetime);
  } catch (err) {
    console.warn('Failed to fetch Bucharest time, using local time:', err);
    return new Date();
  }
}
