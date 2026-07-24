# Name to be changed 🏏
**Premium Cricket Scoring Engine & Live Broadcast Platform**

Bakaziki is a full-stack, real-time cricket scoring application designed for local matches. It features a professional umpire control panel, automated Super Over logic, live spectator broadcasting with motion graphics, and automated PDF scorecard generation.

## 🚀 Key Features

* **Esports-Style Dashboard:** Dynamic, glassmorphism UI with animated backgrounds.
* **Umpire Console:** A robust scoring engine handling runs, extras (WD, NB, Byes), wickets (Caught, Bowled, Run Out, Stumped), strike rotation, and an undo stack.
* **Automated Match Logic:** Enforces bowler over limits (max 25% of total overs), calculates target scores, and automatically triggers Super Overs for tied matches.
* **Live Spectator Broadcast:** Real-time WebSockets sync the match state to viewers anywhere. Includes motion graphics for boundaries (4s, 6s) and shattered stumps for wickets.
* **Post-Match Summary & PDF:** Automatically calculates Man of the Match, Best Batter, and Best Bowler, then generates a downloadable, multi-page PDF scorecard.

---

## 🛠️ Tech Stack

* **Frontend:** React.js, Tailwind CSS
* **Backend:** Node.js, Express.js
* **Real-Time Engine:** Socket.io (Client & Server)
* **Utilities:** `axios` (API requests), `html-to-image` & `jspdf` (PDF generation)

---

## 🔄 App Workflow (User Journey)

The application supports two distinct user paths: **The Umpire** (Broadcaster) and **The Spectator** (Viewer).

### Path A: The Umpire (Match Creation & Scoring)
1. **Home Dashboard:** Clicks "Host Match".
2. **Match Setup:** Enters venue, overs, team rosters, captains, and toss results.
3. **Initialization:** Submits the form. The app generates a unique 6-digit `Match ID` and saves the match to the database.
4. **Live Scoring (Umpire Console):** 
   * Umpire selects opening batters and bowler.
   * Umpire records ball-by-ball events (runs, extras, wickets).
   * The app automatically handles strike rotation and over transitions.
5. **Innings Break / Super Over:** App calculates targets. If tied at the end, seamlessly transitions into a Super Over.
6. **Match End:** The Umpire clicks "End Match", transitioning to the `PostMatchSummary` screen to view awards and download the PDF. Exiting clears the active session and returns to Home.

### Path B: The Spectator (Live Viewing)
1. **Home Dashboard:** Enters the 6-digit `Match ID` shared by the Umpire and clicks "Join".
2. **Connection:** Fetches the current match state from the database and opens a WebSocket connection to the stadium (room).
3. **Live View:** Watches the scoreboard update in real-time. Transient animations trigger for 4s, 6s, and Wickets.
4. **Match End:** Automatically pushed to the `PostMatchSummary` screen alongside the Umpire when the match concludes.

---

## 📡 Data Flow Architecture

Bakaziki relies on a unidirectional data flow for live updates to ensure spectators and the umpire are always perfectly synchronized.

1. **Match Creation (REST API):**
   * `MatchSetup` sends a `POST /api/match` request with the configuration data.
   * The backend creates a MongoDB document and returns success. 
   * Frontend stores `setupData` in `localStorage` to survive page reloads.

2. **Live Scoring Cycle (REST + WebSockets):**
   * **Action:** Umpire clicks a run/wicket button.
   * **State Update:** `useMatchScoring` hook calculates the new state (adding runs, incrementing balls, etc.).
   * **Database Sync:** A `PUT /api/match/:matchId` request is fired containing the entire `liveState` and `stats` objects.
   * **Real-Time Broadcast:** Upon successful database update, the Express server triggers `socket.to(matchId).emit('matchUpdate', updatedData)`.
   * **Spectator Sync:** All `SpectatorView` clients listening in that Socket.io room receive the event and re-render the updated scoreboard immediately.

3. **Data Protection (Undo Logic):**
   * Before applying any new event, the `useMatchScoring` hook pushes a deep clone of the current state to a `historyStack`.
   * If the Umpire clicks "Undo", the state is popped from the stack, and a new `PUT` request overrides the database, instantly correcting the spectators' screens as well.

---

## 🏗️ Component Architecture

The app is a Single Page Application (SPA) routed primarily through `App.jsx` using conditional rendering based on the `currentScreen` state.

* **`HomeDashboard.jsx`:** The entry point with Esports styling.
* **`MatchSetup.jsx`:** The configuration screen with validation for unique player names.
* **`useMatchScoring.js`:** A custom hook isolating the math and business logic of cricket (strike rotation, over limits, Super Overs).
* **`UmpireConsole.jsx`:** The UI layer for the Umpire, consuming the scoring hook and rendering modals (`WicketModal`, `ExtraModal`).
* **`SpectatorView.jsx`:** The WebSocket-connected live scoreboard featuring CSS motion graphics.
* **`PostMatchSummary.jsx`:** Aggregates stats, calculates Man of the Match, and dynamically builds a hidden HTML template converted into a paginated PDF via `jsPDF`.

---

## 💻 Local Setup & Installation

**1. Clone the repository**
```
bash
git clone https://github.com/yourusername/bakaziki.git
cd bakaziki
```

**2. Install Dependencies**
Navigate to both the client and server directories to install packages
# In the frontend directory
```
npm install
```

# In the backend directory
```
npm install
```

**3. Environment Variables**
Duplicate the `.env.example` file and rename it to `.env`. Update the variables to point to your local backend and MongoDB instance.

**4. Start the Development Servers**
\`\`\`bash
# Start the backend server (from server directory)
```
node server.js
```
# Start the React frontend (from client directory)
```
npm run dev
```


---
*Built for Friends with Heart ❤️*