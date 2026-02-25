// Status constants in the required display order
export const STATUSES = [
  'Pending Initial Contact',
  'In Progress Support',
  'Pending Warning 3',
  'Pending Warning 2',
  'Pending Warning 1',
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
 */
export function countBusinessDays(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  let count = 0;
  const current = new Date(start);
  while (current < end) {
    current.setDate(current.getDate() + 1);
    const dow = current.getDay();
    if (dow !== 0 && dow !== 6) {
      count++;
    }
  }
  return count;
}

/**
 * Determine if a ticket should escalate to a warning status.
 * Warning 1: after 2 business days from entering a "Pending" non-warning status
 * Warning 2: after 2 more business days (total 4)
 * Warning 3: after 3 more business days (total 7)
 *
 * Returns the new status (or current status if no change), plus any notifications.
 */
export function computeWarningEscalation(ticket, nowDate) {
  const trackableStatuses = [
    'Pending Initial Contact',
    'In Progress Support',
    'In Progress Engineering',
    'Pending Customer Response',
  ];

  // Only auto-escalate tickets that are in a trackable status or already in a warning
  const isTrackable = trackableStatuses.includes(ticket.status) ||
    ticket.status.startsWith('Pending Warning');

  if (!isTrackable) return { status: ticket.status, notifications: [] };

  // Use the warningTrackingStart if set, otherwise use createdAt
  const trackingStart = new Date(ticket.warningTrackingStart || ticket.createdAt);
  const businessDaysElapsed = countBusinessDays(trackingStart, nowDate);

  const notifications = [];
  let newStatus = ticket.status;

  // Warning thresholds: Warning 1 at 2 days, Warning 2 at 4 days, Warning 3 at 7 days
  if (businessDaysElapsed >= 7 && ticket.status !== 'Pending Warning 3') {
    newStatus = 'Pending Warning 3';
    if (ticket.status !== 'Pending Warning 3') {
      notifications.push({
        id: Date.now() + Math.random(),
        ticketNumber: ticket.ticketNumber,
        region: ticket.region,
        message: `Ticket #${ticket.ticketNumber} escalated to Pending Warning 3`,
        timestamp: nowDate.toISOString(),
        read: false,
      });
    }
  } else if (businessDaysElapsed >= 4 && businessDaysElapsed < 7 && ticket.status !== 'Pending Warning 2' && ticket.status !== 'Pending Warning 3') {
    newStatus = 'Pending Warning 2';
    notifications.push({
      id: Date.now() + Math.random(),
      ticketNumber: ticket.ticketNumber,
      region: ticket.region,
      message: `Ticket #${ticket.ticketNumber} escalated to Pending Warning 2`,
      timestamp: nowDate.toISOString(),
      read: false,
    });
  } else if (businessDaysElapsed >= 2 && businessDaysElapsed < 4 && ticket.status !== 'Pending Warning 1' && ticket.status !== 'Pending Warning 2' && ticket.status !== 'Pending Warning 3') {
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

  return { status: newStatus, notifications };
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
