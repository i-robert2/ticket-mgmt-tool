# Ticket Management

A desktop application built with **Electron** and **React** for managing support tickets across EU and Global regions. Track ticket statuses, receive automated warning escalations based on business-day deadlines, and stay on top of your support queue.

![Electron](https://img.shields.io/badge/Electron-40-47848F?logo=electron&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)

---

## Features

### Dual Region Ticket Lists
- Separate lists for **EU** and **Global** tickets displayed side by side.
- Each list can be independently filtered by status.

### Status Workflow
Tickets follow a defined status order with color-coded indicators:

| Status | Color |
|---|---|
| Pending Initial Contact | 🔴 Red |
| In Progress Support | 🔴 Red |
| Pending Warning 3 | 🔴 Red |
| Pending Warning 2 | 🔴 Red |
| Pending Warning 1 | 🔴 Red |
| In Progress Engineering | 🟠 Orange |
| Pending Customer Response | 🔵 Blue |

### Automated Warning Escalation
Tickets are automatically escalated based on **business days** (Mon–Fri, excluding weekends):

- **Warning 1** — after **2 business days** without status change
- **Warning 2** — after **2 more business days** (4 total)
- **Warning 3** — after **3 more business days** (7 total)

Escalations are announced as alerts in a **notifications panel**.

### Bucharest Time Sync
On startup, the app fetches the current time from a [public API](https://worldtimeapi.org/api/timezone/Europe/Bucharest) (Europe/Bucharest timezone). This ensures warning escalations are calculated correctly even if the app was closed for an extended period. Falls back to local system time if the API is unreachable.

### Persistent Storage
All ticket data and notifications are saved to disk (Electron `userData` directory) and restored on next launch.

### Ticket Form
Add tickets via a form with the following fields:
- **Region** (EU / Global)
- **Ticket Number**
- **Title**
- **Label**
- **Last Modified** (date/time picker)
- **Severity** (Critical, High, Medium, Low)
- **Initial Status**

---

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop Shell | Electron |
| Frontend | React 19 |
| Build Tool | Vite |
| Styling | CSS (dark theme) |
| Persistence | JSON file (Electron userData) |
| Time API | WorldTimeAPI |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)

### Installation

```bash
git clone https://github.com/i-robert2/ticket-mgmt.git
cd ticket-mgmt
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
│   ├── main.cjs          # Electron main process
│   └── preload.cjs       # Context bridge (IPC)
├── src/
│   ├── main.jsx           # React entry point
│   ├── App.jsx            # Root component & state management
│   ├── TicketForm.jsx     # New ticket form
│   ├── TicketList.jsx     # Filterable ticket list
│   ├── NotificationsPanel.jsx  # Warning escalation alerts
│   ├── ticketUtils.js     # Business logic & helpers
│   └── styles.css         # Dark-themed styles
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

---

## License

ISC
