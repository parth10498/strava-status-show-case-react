# 🏃 Strava Athletic Portfolio & Analytics Dashboard (Pure React)

A state-of-the-art, **100% standalone React** application showcasing athletic performance, distance milestone ladders, Leaflet interactive route maps, workout playback animations, training consistency, gear tracking, and annual Strava Wrapped summaries.

> [!NOTE]
> This application runs **entirely in the browser** with **zero backend dependencies** (no Python, no FastAPI, and no database server needed). All analytics calculations, aggregations, data persistence, and GPX/TCX generation are executed purely in client-side JavaScript.

---

## 🌟 Key Features

### 1. 📊 Milestones & Distance Ladders
- **Running Ladder**: Automated classification and tracking for 5k, 10k, 15k, 21k (Half Marathon), and 42k (Full Marathon) runs.
- **Cycling Endurance Ladder**: Milestone brackets ranging from 20k, 40k, 60k, 80k, 100k (Century), up to 200k+ ultra rides.
- **Pace & Speed Distribution**: Visual breakups of cadence, elevation gain, heart rate, and moving vs. elapsed time.

### 2. 🗺️ Interactive Route Maps & Playback Engine
- **Leaflet OpenStreetMap**: Dark/Light/Satellite tile layers with custom route polylines.
- **Interactive Workout Replay**: Playback controls (Play, Pause, Speed adjustment, Scrubber) simulating runner/cyclist marker progression along the recorded GPS polyline.
- **Turn-by-turn & Elevation Profile**: Real-time cursor sync between the elevation chart and map marker.

### 3. 📅 Consistency Matrix & Apple Fitness Goals
- **53-Week Heatmap**: GitHub-style activity grid across all 365 days of the year.
- **Apple Fitness Style Activity Rings**: Real-time progress toward weekly workout count, weekly running km, cycling km, and monthly totals.
- **Streaks & Distribution**: Tracks current vs. longest training streaks, day-of-week trends, and time-of-day heatmaps.

### 4. 🏆 Hall of Fame & Eddington Numbers
- **Personal Records**: Fastest 5k, 10k, Half Marathon, Longest Ride, Maximum Elevation gain, and top average speeds.
- **Cycling & Running Eddington Numbers**: Automatic mathematical computation of your global athletic Eddington score.

### 5. 👟 Gear & Shoe Retirement Tracker
- Visual odometer bars tracking shoe usage toward the recommended 800 km limit and bikes toward 5,000 km maintenance milestones.
- Ability to add, edit, retire, and assign activities to specific shoes or bikes.

### 6. 📱 Annual Strava Wrapped & Share Card Generator
- **Strava Wrapped Story**: An animated, slide-based annual story reviewing your biggest year accomplishments, top sport, longest workout, and total sweat time.
- **Exportable Share Cards**: Generates high-resolution social media cards directly to HTML5 Canvas and downloads as PNG.

### 7. 💾 Client-Side Data Storage & Analytics
- **Preloaded Data**: Bundled with 349 real activities for athlete Parth Chaudhari.
- **Interactive Re-indexing**: Instant recalculation across date filters, years, and sport categories.
- **Milestone Demonstration Mode**: Ability to load realistic demonstration milestones covering all run and cycling ladders.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18+ or 20+ recommended)
- 
pm (included with Node.js)

### Installation
From the project folder (strava-status-react):
`ash
npm install
`

### Development Server
Start the local Vite development server:
`ash
npm run dev
`
Open **http://localhost:5173/** in your web browser.

### Production Build
Build the minified production bundle:
`ash
npm run build
`
Preview the production build locally:
`ash
npm run preview
`

### Linting
Validate the codebase with Oxlint:
`ash
npm run lint
`

---

## 📁 Project Structure

`
strava-status-react/
├── public/                     # Static assets (favicons, SVGs)
├── src/
│   ├── assets/                 # SVGs and hero images
│   ├── components/             # Modular React UI components
│   │   ├── ActivitiesList.jsx
│   │   ├── AllActivityHeatmap.jsx
│   │   ├── AuthBanner.jsx
│   │   ├── CyclingSection.jsx  # 20k to 200k+ endurance ladder
│   │   ├── DateFilterBar.jsx   # Multi-year/month date filter
│   │   ├── GearManager.jsx     # Shoe & bike tracking
│   │   ├── HallOfFame.jsx      # PRs and Eddington calculation
│   │   ├── HeroStats.jsx       # Top-level aggregate cards
│   │   ├── Navbar.jsx          # Top navigation bar
│   │   ├── OtherSportsSection.jsx
│   │   ├── RouteExplorer.jsx   # Route card browser
│   │   ├── RouteMapModal.jsx   # Leaflet map & animated GPS replay
│   │   ├── RunningSection.jsx  # 5k, 10k, 15k, 21k ladders
│   │   ├── ShareCardModal.jsx  # HTML5 Canvas social card generator
│   │   ├── StravaWrappedModal.jsx # Annual Wrapped story
│   │   ├── TrainingConsistency.jsx # 365-day grid & goal rings
│   │   └── YearlyMonthlySection.jsx
│   ├── data/
│   │   ├── demoActivities.js   # 22-activity demonstration preset
│   │   └── initialData.json    # 349 embedded Strava workouts
│   ├── services/
│   │   └── stravaDataService.js# Pure client-side calculations & storage engine
│   ├── utils/
│   │   └── polyline.js         # Google Encoded Polyline algorithm
│   ├── App.css                 # Dark-mode dashboard theme & glassmorphism
│   ├── App.jsx                 # Main dashboard view
│   ├── index.css               # Global base styles & variables
│   └── main.jsx                # React DOM entry point
├── .gitignore
├── .oxlintrc.json
├── index.html
├── package.json
└── vite.config.js
`

---

## 🔒 Privacy & Data Storage
All activity and athlete data is stored exclusively in your browser's localStorage. No data is uploaded or sent to any external server (except optional direct calls to Strava when providing a personal access token, and free Open-Meteo for live weather).
