# 🌿 WATERING MISSION — Smart Garden Watering Assistant

A responsive web application for tracking and managing garden watering sessions with smart reminders.

## About

This prototype provides digital watering-session tracking and reminders. It does not directly detect or control the physical bore motor. Users manually start the digital session when they physically begin watering and manually check the motor when alerted.

**This is a software prototype developed as a college project.**

## Features

- **Dashboard** — Overview of watering status, weekly progress, and statistics
- **Session Management** — Start, monitor, pause, and complete watering sessions
- **Countdown Timer** — Real-time countdown with circular progress visualization
- **Sound Alerts** — Browser-native audio alerts when sessions complete
- **Browser Notifications** — Push notifications for session reminders
- **Watering History** — Complete log of all past sessions with filtering
- **Weekly 3-Session Goal** — Track progress toward watering 3 times per week
- **Persistent Storage** — All data saved in localStorage (survives refresh/close)
- **Mobile Responsive** — Works on desktop, tablet, and mobile devices

## Tech Stack

- HTML5
- CSS3 (with CSS Custom Properties)
- Vanilla JavaScript (ES6+)
- localStorage for data persistence
- Web Audio API for alert sounds
- Notifications API for browser notifications

**No backend, database, frameworks, or external APIs required.**

## How to Run

1. Open `index.html` in any modern web browser (Chrome, Firefox, Edge, Safari)
2. No build step or server required
3. For best experience, allow notification permissions when prompted

## Project Structure

```
/
├── index.html          # Main HTML page
├── css/
│   └── style.css       # Complete stylesheet
├── js/
│   └── app.js          # Application logic
└── README.md           # This file
```

## Demo Flow

1. **Dashboard** — View current status and statistics
2. **Start Session** — Select garden section and duration
3. **Active Session** — Watch countdown timer
4. **Attention Shift** — Mark yourself as busy
5. **Alert** — Receive sound alert when timer completes
6. **Complete** — Provide motor and reminder feedback
7. **History** — Review past sessions
8. **Weekly Plan** — Check 3-session weekly goal progress

## Limitations

- This is a client-side prototype; data is stored in the browser's localStorage
- No sensors, IoT, or automatic motor detection
- No automatic motor detection or control
- Sound alerts require user interaction with the page first (browser policy)
- Data is specific to the browser/device used

## Color Theme

| Color | Hex | Usage |
|-------|-----|-------|
| Deep Forest Green | `#1a3c2a` | Primary dark |
| Dark Green | `#2d5a3f` | Sidebar, buttons |
| Medium Green | `#3d7a56` | Accents, progress |
| Sage Green | `#7a9e7e` | Secondary elements |
| Light Green | `#a8c5a0` | Highlights |
| Pale Green | `#d4e6cf` | Backgrounds |
| Cream | `#f5f0e8` | Main background |
| Off-white | `#fefefe` | Card backgrounds |

---

*Developed as a college project — Watering Mission © 2026*
