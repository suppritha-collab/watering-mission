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
│   ├── app.js          # Application logic and UI interactions
│   └── utils.js        # Business logic and utility functions
├── tests/
│   ├── run-tests.html  # Browser-based unit test runner
│   └── test-utils.js   # Unit test suite for utils.js
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

## Testing and Error Handling

### 1. Unit Testing (`tests/test-utils.js`)

Core business logic and algorithmic functions are isolated in `js/utils.js` (exposed under the `WateringMission` namespace) without DOM dependencies. These functions are verified through a standalone unit test suite in `tests/test-utils.js`.

#### Browser Test Runner
- **File**: `tests/run-tests.html`
- **Execution**: Open `tests/run-tests.html` in any standard web browser (Chrome, Firefox, Edge, Safari).
- **Interface**: Renders total test count, passed/failed counters, and expandable suite breakdown with individual checkmark or error indicators.
- **Dependencies**: None. The runner operates entirely client-side without npm packages, external frameworks, or build steps.

#### Test Categories Covered
The test suite covers 10 functional categories across 21 test suites:

1. **Timer Calculations (`calculateRemainingTime`, `formatTimerComponents`, `formatTimerDisplay`)**
   - Remaining time determination using absolute timestamps (`endTimestamp - now`), boundary clamping to 0, non-numeric and `NaN` input rejection, and epoch timestamp precision.
   - Millisecond duration conversion into hours, minutes, and seconds components.
   - Zero-padded string formatting (`HH:MM:SS`), handling missing properties, and fallback for null/undefined inputs.
2. **Progress Calculations (`calculateProgress`, `calculateTimerRingOffset`, `calculateResumeEndTimestamp`)**
   - Percentage completion calculation clamped between `[0, 100]`, negative remaining time handling, and zero/negative total duration guards.
   - SVG circular progress offset calculations based on ring circumference (`2 * π * 90`).
   - Resumed session end-timestamp recalculation extending target end time by the pause duration.
3. **Session Validation (`validateDuration`, `validateSessionData`)**
   - Duration input validation ensuring allowable bounds (1 to 180 minutes), numeric string parsing, and rejection of out-of-range, non-numeric, or null values.
   - Session data structure validation verifying required fields (`id`, `section`, `plannedDuration`, `startTimestamp`, `endTimestamp`, and allowed statuses: `active`, `paused`, `attention_shift`, `alerted`, `completed`).
4. **Session Status Transitions (`transitionToAttentionShift`, `transitionPauseResume`, `shouldTriggerAlert`)**
   - State transition rules for entering attention shift mode from active and re-transitions, while blocking invalid transitions from paused, alerted, or completed states.
   - Transition logic between active/attention-shift states and paused state, preserving prior attention-shift flags upon resuming.
   - Completion alert eligibility evaluation, preventing duplicate alert firing when already alerted or completed.
5. **Weekly Goal Calculations (`getWeekStart`, `getWeekEnd`, `calculateWeeklyProgress`, `hasSessionOnDate`)**
   - Weekly boundary calculations determining Monday midnight (`00:00:00`) and Sunday end-of-day (`23:59:59`) for any reference date.
   - 3-session weekly goal evaluation including same-day session deduplication, exclusion of non-completed sessions, and rejection of sessions outside the target week.
   - Date verification determining whether a completed session exists on a given calendar day.
6. **Date and Time Formatting (`formatTime`, `formatDate`, `formatDateShort`)**
   - Localized 12-hour time formatting (`h:mm A`) with em-dash (`—`) fallback for invalid or missing dates.
   - Full date (`Month Day, Year`) and short date (`Mon Day`) formatting.
7. **Statistics Calculations (`calculateStatistics`)**
   - Aggregation of total sessions, average session duration, longest session duration, and latest watering date, ignoring invalid or corrupt entries.
8. **History Filtering (`filterSessions`)**
   - Filtering session history by `'all'`, `'completed'`, `'alerted'`, and `'week'`.
   - Chronological sorting (newest first) and defensive handling of malformed session objects.
9. **localStorage Helpers (`safeGetJSON`, `safeSetJSON`, `safeRemoveKey`)**
   - Data round-tripping through `localStorage`.
   - Fallback value handling upon missing keys or corrupted JSON strings.
   - Safe removal and write execution verification.
10. **Identifier Generation (`generateId`)**
    - Generation of unique session and alert identifiers with `wm_` prefix and randomness verification.

#### Scope and Limitations of Unit Tests
> **Note on Test Scope:** The unit tests in `tests/test-utils.js` exclusively test the headless utility functions in `js/utils.js`. They **do not** fully test the entire application. DOM manipulations, user interface events, timer intervals (`setInterval`), Web Audio API audio synthesis, browser notification permissions and display, modal interactions, and end-to-end integration flows in `js/app.js` are not covered by these unit tests and require manual functional testing.

---

### 2. Manual Functional Checks Completed

To validate runtime features and browser integration that cannot be verified by utility unit tests, the following manual checks were performed:

- **Starting a Watering Session**: Selected garden sections and duration presets/custom inputs, verified input validation, submitted the form, and confirmed proper initialization of the countdown display and SVG circular progress ring.
- **Pausing and Resuming**: Paused an active session, verified timer freezing, resumed the session, and confirmed that the end timestamp was properly recalculated (`calculateResumeEndTimestamp`) to extend the timer by the paused duration without cutting short the watering time.
- **Page Refresh and Timer Continuity**: Initiated an active session and refreshed the browser tab; verified that session state was restored from `localStorage` and that the countdown continued accurately using absolute timestamps (`endTimestamp - now`) without resetting or losing progress.
- **Completion Alert Verification**: Monitored the timer until it reached 00:00:00 (as well as reloading with an expired end timestamp); verified transition to `alerted` status, activation of the Web Audio API two-tone alert chime, dispatch of the browser notification, appearance of the completion toast, and opening of the completion modal for motor and reminder feedback.

---

### 3. Error-Handling Mechanisms

The application implements defensive error-handling strategies across key browser APIs:

1. **`localStorage` Operations**:
   - **Corrupted Data & Parsing Recovery**: In `js/utils.js` (`safeGetJSON`) and `js/app.js` (`getSessions`, `getActiveSession`, `getAlerts`), all storage read operations and `JSON.parse` calls are wrapped in `try...catch` blocks. If data is corrupt or inaccessible, the application falls back to safe default values (`[]` or `null`) and purges corrupt keys via `removeItem` to prevent application breakdown.
   - **Storage Quota & Write Protection**: In `js/utils.js` (`safeSetJSON`), writes are wrapped in `try...catch` to handle storage quota exceedances or restricted browser environments (such as private browsing modes), logging errors via `console.warn` and invoking error callbacks where provided.
   - **Safe Deletion**: Key removal (`safeRemoveKey`) is guarded to prevent runtime exceptions if keys are absent or storage is blocked.

2. **Sound Alerts (Web Audio API)**:
   - **Context Initialization**: In `js/app.js` (`playAlertSound`), `AudioContext` / `webkitAudioContext` creation is wrapped in a `try...catch` block to handle browser environments where audio context creation is disallowed or unsupported.
   - **Autoplay Policy Handling**: If the browser places the audio context in a `suspended` state, `audioContext.resume()` is called when triggering sound.
   - **State Checking & Teardown**: Tone playback explicitly verifies `if (!audioContext || audioContext.state === 'closed') return;`. Teardown (`stopAlertSound`) clears recurring intervals and closes the audio context with error catching (`audioContext.close().catch(() => {})`).
   - **Non-blocking Failure**: If audio initialization fails, the error is logged to `console.warn`, allowing visual alerts and browser notifications to proceed uninterrupted.

3. **Browser Notifications (Notifications API)**:
   - **Support and Permission Guards**: In `js/app.js` (`showBrowserNotification`), notification dispatch is guarded by `'Notification' in window && Notification.permission === 'granted'`.
   - **Non-Intrusive Permission Flow**: Permission is requested via `requestNotificationPermission()` only when permission is `'default'`, delayed by 3 seconds (`setTimeout`) to prevent intrusive prompt blocking during initial page load.
   - **Protected Instantiation**: Instantiation of `new Notification()` is wrapped in a `try...catch` block to safeguard against platform-specific or permission-related exceptions, logging any rejection via `console.warn` while keeping the application fully functional.

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
