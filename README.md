# PetalList 🎀

> *“A little list for a lovely day ♡”*

**PetalList** is a lightweight, beginner-friendly to-do list web application designed with a soft, girly **coquette aesthetic** inspired by digital pastel journals, delicate bows, and cozy study days.

Built with **Node.js**, **Express.js**, and vanilla frontend web standards (**HTML5**, **CSS3**, **JavaScript**), PetalList keeps your daily goals organized while sprinkling in a daily dose of humor, student motivation, and sweet reminders.

---

## 🎀 Aesthetic & Design

- **Color Palette:**
  - Blush pink: `#F8C8DC`
  - Baby pink: `#FADADD`
  - Cream: `#FFF9F5`
  - Rose pink: `#E98BAA`
  - Dark cocoa: `#5C4148`
  - White: `#FFFFFF`
- **Typography:** *Playfair Display* for romantic, elegant serif headings and *Poppins* for clean, modern, readable body text.
- **Accents:** Delicate bows (`୨ৎ`, `🎀`), sparkles (`✨`), hearts (`♡`, `💗`), and tiny flowers (`🌸`).
- **Feel:** Smooth transitions, soft shadows, rounded corners, responsive layout on desktop and mobile.

---

## ✨ Features

1. **Header & Aesthetics:**
   - Playful app title with floating ribbon elements and soft pastel backdrop.
2. **Add Tasks:**
   - Input field with cute placeholder: *“What’s on your mind, pretty? ♡”*
   - Cute pink `Add Task +` button or press <kbd>Enter</kbd>.
   - Built-in validation rejects empty or whitespace-only submissions with a gentle shake.
3. **Interactive Task List:**
   - Custom rounded check buttons: check off items to strike through text and soften cards.
   - Click again to mark active whenever needed.
   - Delete button with a gentle hover spin to sweep tasks away.
4. **Real-time Statistics & Progress Bar:**
   - Tracks **Active** tasks, **Completed** tasks, and **Percentage**.
   - Dynamic progress bar with a soft pink shimmer and encouraging captions that evolve as you finish tasks.
5. **Filter Tabs:**
   - Easily switch between **All ♡**, **To Bloom 🌸** (active), and **Done 🎀** (completed).
   - "Clear Done 🧹" button to quickly clean up completed tasks.
6. **Cute Empty State:**
   - Displays *“No little tasks yet! Time to romanticize your day ♡”* when no tasks exist.
7. **Daily Surprise — Quotes, Jokes & Girly Motivation 💌:**
   - Randomly displays one of **68+** curated, witty, and heartwarming messages on page load.
   - Mix of relatable college humor, coding jokes, gentle self-care, coquette wisdom, and sassy motivation.
   - Uses `sessionStorage` to avoid repeating the exact same message on consecutive reloads.
   - **“Another one, please! 🎲”** button shuffles in a new quote instantly without page reload.
8. **Dual Persistence (Backend API + Browser localStorage):**
   - Saves tasks to the Express in-memory array via REST API.
   - Automatically synchronizes with browser `localStorage`, ensuring tasks remain safely saved across page refreshes even if the Node server restarts.

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16.0.0 or later recommended)
- `npm` (bundled with Node.js)

### Installation

1. Clone or navigate to the repository directory:
   ```bash
   cd ToDoApp
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the application:
   ```bash
   npm start
   ```
   *Or for development with automatic restarts on changes:*
   ```bash
   npm run dev
   ```

4. Open your browser and visit:
   ```
   http://localhost:3000
   ```

---

## 🛠️ REST API Reference

The backend exposes a clean and beginner-friendly JSON REST API:

| Method | Endpoint | Description | Request Body | Status Codes |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/tasks` | Returns all to-do tasks | *None* | `200 OK` |
| `POST` | `/api/tasks` | Creates a new task | `{ "text": "Task description" }` | `201 Created`, `400 Bad Request` |
| `PATCH` | `/api/tasks/:id` | Toggles or updates task completion status | `{ "completed": true }` *(optional)* | `200 OK`, `400 Bad Request`, `404 Not Found` |
| `DELETE` | `/api/tasks/:id` | Deletes a task by ID | *None* | `200 OK`, `400 Bad Request`, `404 Not Found` |
| `POST` | `/api/tasks/sync` | Restores client tasks to server after restart | `{ "clientTasks": [...] }` | `200 OK` |

### Testing the API

Run the automated test suite:
```bash
npm test
```

You can also test the endpoints using `curl` or PowerShell:
```bash
# 1. Fetch all tasks
curl http://localhost:3000/api/tasks

# 2. Add a new task
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"text": "Study at the cute cafe ♡"}'

# 3. Toggle task completion (ID 1)
curl -X PATCH http://localhost:3000/api/tasks/1

# 4. Delete a task (ID 1)
curl -X DELETE http://localhost:3000/api/tasks/1
```

---

## 📁 Project Structure

```
ToDoApp/
├── public/
│   ├── index.html       # Semantic HTML5 structure with coquette cards
│   ├── style.css        # Girly pastel-pink styling & micro-animations
│   ├── script.js        # Client-side reactivity, API calls & localStorage sync
│   └── quotes.js        # 68+ quotes, student jokes & motivation collection
├── test/
│   └── api.test.js      # Automated test suite for endpoints & quote quality
├── server.js            # Express.js backend server with REST API
├── package.json         # Project metadata and dependencies
├── .gitignore           # Ignores node_modules, logs, and OS files
└── README.md            # Project documentation and guide
```

---

## 🎀 How the Backend and Frontend Work Together

1. **Express Server (`server.js`):**
   - Serves the frontend assets statically from the `public/` directory.
   - Manages an in-memory array of task objects (`[{ id, text, completed, createdAt }]`).
   - Validates incoming data and returns standardized HTTP status codes and JSON.
2. **Frontend Client (`public/script.js`):**
   - Fetches tasks from `/api/tasks` on page load.
   - Maintains an in-browser backup in `localStorage` under `petallist_tasks_cache`.
   - Sends REST API requests (`POST`, `PATCH`, `DELETE`) on user actions and immediately updates the UI for zero perceived latency.
   - If the server restarts, the frontend uses `/api/tasks/sync` to restore cached tasks so your list stays intact!
3. **Daily Surprise (`public/quotes.js`):**
   - Operates completely client-side without external API keys or rate limits.
   - Keeps track of the last viewed quote in `sessionStorage` so refreshing gives you a fresh smile every time.

---

## 🌸 Git & GitHub Guide

To stage, commit, and push your work to GitHub:

```bash
# 1. Initialize git (if not already initialized)
git init

# 2. Stage all project files (.gitignore ensures node_modules is excluded)
git add .

# 3. Commit with the required message
git commit -m "feat: build PetalList girly todo app"

# 4. Link your GitHub repository (replace with your repo URL)
# If you haven't added a remote yet:
git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO_NAME>.git

# 5. Rename branch to main (standard)
git branch -M main

# 6. Push to GitHub
git push -u origin main
```

---

*Made with love, pink dreams & a little productivity ♡*
