# Ticket Management

A desktop application built with **Electron** and **React** for managing support tickets across EU and Global regions. Track ticket statuses, search tickets, add notes, manage draft emails, receive automated warning escalations based on business-day deadlines, and stay on top of your support queue — all from a sleek dark-themed UI with a live Bucharest clock.

![Electron](https://img.shields.io/badge/Electron-40-47848F?logo=electron&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)

---

## Features

### Dual Region Ticket Lists
- Separate lists for **EU** and **Global** tickets displayed side by side.
- Each list can be independently filtered by status.
- Lists scroll individually and extend to fill the viewport.

### Status Workflow
Tickets follow a defined status order with color-coded dropdown badges:

| Status | Color |
|---|---|
| Pending Initial Contact | 🔴 Red |
| In Progress Support | 🔴 Red |
| Close Case | 🔴 Red |
| Pending Warning 3 | 🔴 Red |
| Pending Warning 2 | 🔴 Red |
| Pending Warning 1 | 🔴 Red |
| Warning 3 Sent | 🔵 Blue |
| Warning 2 Sent | 🔵 Blue |
| Warning 1 Sent | 🔵 Blue |
| In Progress Engineering | 🟠 Orange |
| Pending Customer Response | 🔵 Blue |

Status can be changed directly from the ticket card via an inline dropdown.

- **Close Case** is a manual-only status — it is never set or removed automatically.

### Ticket Search
- 🔍 Search button in the header bar (between the clock and notifications).
- Search by **ticket number**, **title**, or **label** — partial matches supported.
- Click a search result to close the panel and **scroll directly to the ticket** with a highlight animation.

### Ticket Notes & Draft Email Tracking
- **+ Note** button on each ticket card to add an expandable note section.
- Collapsible text area for writing notes about what needs to be done.
- **Draft email badge** — toggle between "Draft email ready" (green) and "No draft email" (red) with a click.
- **✕ button** next to the Note label to remove the note and restore the card to its original look.

### Automated Warning Escalation
Tickets are automatically escalated based on **business days** (Mon–Fri, excluding weekends):

| Transition | Trigger |
|---|---|
| Trackable status → Pending Warning 1 | 2 business days from `lastModified` |
| Warning 1 Sent → Pending Warning 2 | 2 business days from `warning1SentAt` |
| Warning 2 Sent → Pending Warning 3 | 3 business days from `warning2SentAt` |

Trackable statuses: Pending Initial Contact, In Progress Support, In Progress Engineering, Pending Customer Response.

**No automatic de-escalation** — once a ticket reaches any Pending Warning status, it stays there until manually changed.

Escalations trigger a **toast notification card** that slides in from the top-right corner with the alert details and auto-dismisses after 6 seconds. Full notification history is accessible via the 🔔 bell icon in the header.

Escalation checks run:
- **On startup** — catches any tickets that should have escalated while the app was closed (e.g., over a weekend).
- **Every 5 minutes** — periodic background check using Bucharest time.
- **Immediately after editing `lastModified`** — so status updates appear right away.

### Smart Ticket Sorting
- Tickets are sorted by **status priority** (following the defined status order).
- Within the same status, tickets are sorted by **most recently modified first**, so the tickets closest to the current time appear on top.

### Live Bucharest Clock
- Displays current Bucharest time in the header, updating every second.
- Time is fetched from [WorldTimeAPI](https://worldtimeapi.org/api/timezone/Europe/Bucharest) on startup for accuracy; falls back to local system time if unreachable.

### Modal Ticket Form
- Add tickets via a **popup modal** triggered by the ＋ button on each list.
- Fields: Ticket Number, Title, Label, Last Modified (date/time), Severity, Initial Status.
- Region is pre-selected based on which list's ＋ button was clicked.

### Notifications
- **Toast cards** slide in from the top-right for new escalation events and auto-dismiss after 6 seconds.
- **🔔 Bell icon** with unread badge shows notification count; opening the panel marks all as read.
- Notifications can be individually dismissed or cleared entirely.

### Persistent Storage
All ticket data (including notes, draft status, and warning timestamps) and notifications are saved to disk (Electron `userData` directory) and restored on next launch. In browser mode, data is persisted via `localStorage`.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop Shell | Electron |
| Frontend | React 19 |
| Build Tool | Vite |
| Styling | CSS (dark theme) |
| Persistence | JSON file (Electron userData) / localStorage (browser) |
| Time API | WorldTimeAPI |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)

### Installation

```bash
git clone https://github.com/i-robert2/ticket-mgmt-tool.git
cd ticket-mgmt-tool
npm install
```

### Run the App

**Production mode** (build + launch):
```bash
npm run start
```

**Development mode** (with hot reload):
```bash
npm run dev
```

---

## Project Structure

```
ticket-mgmt/
├── electron/
│   ├── main.cjs               # Electron main process
│   └── preload.cjs             # Context bridge (IPC)
├── src/
│   ├── main.jsx                # React entry point
│   ├── App.jsx                 # Root component, state, search overlay
│   ├── TicketForm.jsx          # Modal ticket form
│   ├── TicketList.jsx          # Filterable ticket list with card components
│   ├── NotificationsPanel.jsx  # Notification history panel
│   ├── ticketUtils.js          # Business logic & helpers
│   └── styles.css              # Dark-themed styles
├── test/
│   └── warning-escalation.test.cjs  # 25 unit tests for escalation logic
├── index.html
├── vite.config.js
└── package.json
```

---

## Scripts

| Command | Description |
|---|---|
| `npm run start` | Build frontend and launch Electron |
| `npm run dev` | Start Vite dev server + Electron with hot reload |
| `npm run build` | Build the React frontend only |
| `npm test` | Run warning escalation unit tests |
| `npm run dist` | Build and package the app for distribution |

---

## License

ISC
