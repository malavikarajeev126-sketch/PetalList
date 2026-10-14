# PetalList

PetalList is a single-user productivity app built with Node.js, Express, and vanilla HTML, CSS, and JavaScript. It combines task management, a habit garden, a Pomodoro-style focus timer, and locally saved personalization with a pastel journal-inspired interface.

## Features

- Create, edit, complete, and delete tasks.
- Give each task a category (`College`, `Coding`, `Personal`, or `Self-care`), priority (`Low`, `Medium`, or `High`), and optional due date.
- Search task text; sort by due date, priority, creation time, or name; filter by all, today, upcoming, overdue, or completed tasks.
- View task counts, completion percentage, and progress.
- Create habits, mark or unmark them for today, remove them, and view current streaks and daily garden progress.
- Run 25-minute focus and 5-minute break timer sessions, pause and reset the timer, and associate a session with an active task.
- Choose a color theme, toggle dark mode, and save a display name.
- Shuffle through the bundled quote collection and save or remove favorite quotes.
- Use the responsive interface on desktop and mobile.

## Run locally

Requirements: Node.js 16 or later and npm.

```sh
npm install
npm start
```

Open <http://localhost:3000>. For development with automatic restarts:

```sh
npm run dev
```

## Project structure

```text
ToDoApp/
├── data/
│   └── store.json       # Persistent server-side task and habit data
├── public/
│   ├── index.html       # App structure and controls
│   ├── style.css        # Themes, layout, animations, and responsive rules
│   ├── script.js        # Browser interactions and API client
│   ├── task-utils.js    # Shared task filtering, sorting, and date validation
│   └── quotes.js        # Bundled quote collection
├── test/
│   └── api.test.js      # API and task utility tests
├── server.js            # Express static server, REST API, and JSON persistence
├── package.json
└── README.md
```

## How the frontend and backend work together

Express serves the files in `public/` and exposes JSON endpoints under `/api`. The browser fetches tasks and habits from the server, sends changes to the API, and updates the displayed state only after the server confirms the change. Failed requests are shown to the user and do not create an unsaved browser-only task or habit.

The server-side JSON file is the source of truth for tasks and habits. By default, it is `data/store.json`; `PETALLIST_STORE_FILE` can point the server to a different JSON file when a separate data store is needed. Writes use a temporary file and replace the store after the write succeeds. This JSON-backed setup is intended for local, single-user use; it does not provide accounts, access control, or multi-user data isolation.

Theme, dark-mode, display-name, and favorite-quote preferences are stored in the browser's `localStorage`. The most recently shown quote ID is stored in `sessionStorage` to avoid an immediate repeat. Task and habit state is not restored from browser storage.

## REST API

Task records have an `id`, `text`, `completed`, `category`, `priority`, `dueDate`, `createdAt`, and `updatedAt`. Existing records without optional metadata continue to display with sensible defaults.

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/tasks` | Return all tasks. |
| `POST` | `/api/tasks` | Create a task. Body: `{"text":"Study","category":"College","priority":"High","dueDate":"2026-10-20"}`. Category, priority, and due date are optional. |
| `PATCH` | `/api/tasks/:id` | Update task fields. Send `{"completed":true}`, or edit with `text`, `category`, `priority`, and/or `dueDate`. An empty JSON object toggles completion for compatibility. Use `null` or an empty string to clear the due date. |
| `DELETE` | `/api/tasks/:id` | Delete a task. |
| `POST` | `/api/tasks/sync` | Legacy bulk import. A non-empty `clientTasks` array replaces the task list; it is not used by the frontend. |
| `GET` | `/api/habits` | Return all habits and completion dates. |
| `POST` | `/api/habits` | Create a habit. Body: `{"name":"Read 10 pages","icon":"📖"}`. |
| `PATCH` | `/api/habits/:id/toggle` | Toggle completion for a date. Body may include `{"date":"2026-10-14"}`; omitted date means today. |
| `DELETE` | `/api/habits/:id` | Delete a habit. |
| `POST` | `/api/habits/sync` | Legacy bulk import for habits. A non-empty `clientHabits` array replaces the habit list. |

Invalid task descriptions, categories, priorities, calendar dates, and IDs return a JSON error response. Task descriptions are limited to 200 characters; habit names are limited to 60 characters.

## Tests

```sh
npm test
```

The test suite exercises task filtering and sorting, task CRUD and validation, habit API behavior, quote data, and JSON persistence. It sets `PETALLIST_STORE_FILE` to a temporary test file and removes that file afterward, leaving `data/store.json` unchanged.
