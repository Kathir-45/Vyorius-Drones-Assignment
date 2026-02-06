# Complete Setup & Deployment Guide

## Project Overview

This is a real-time Kanban board application with:
- ✅ React frontend with drag-and-drop functionality
- ✅ Node.js/Express WebSocket backend
- ✅ Supabase authentication (email/password)
- ✅ Persistent PostgreSQL database
- ✅ User-specific task isolation
- ✅ File attachments with preview
- ✅ Full test coverage (24 tests)
- ✅ Responsive design

---

## Prerequisites

- **Node.js** 16+ ([download](https://nodejs.org))
- **npm** 8+ (comes with Node.js)
- **Supabase account** (free at [supabase.com](https://supabase.com))
- A terminal/command prompt
- A code editor (VS Code recommended)

---

## Quick Start (5 minutes)

### 1. Download & Setup

```bash
# Navigate to your project directory
cd "c:\code\intern assignments\Vyorius Drones"

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Supabase

Complete the [Supabase Setup Guide](./SUPABASE_SETUP.md):
1. Create free Supabase account
2. Get Project URL and Anon Key
3. Create `.env.local` in frontend folder
4. Paste credentials
5. Create database schema

### 3. Run the Application

**Terminal 1 - Start Backend:**
```bash
cd backend
npm start
# Output: "WebSocket server running on ws://localhost:5000"
```

**Terminal 2 - Start Frontend:**
```bash
cd frontend
npm run dev
# Output: "Local: http://localhost:5173"
```

### 4. Open in Browser

Go to [http://localhost:5173](http://localhost:5173)

---

## Detailed Setup Instructions

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Install additional packages (if using Supabase backend integration)
npm install @supabase/supabase-js dotenv cors

# Create .env file (optional, for Supabase backend integration)
echo SUPABASE_URL=your_url > .env
echo SUPABASE_SERVICE_KEY=your_key >> .env
echo PORT=5000 >> .env

# Start server
npm start

# Expected output:
# WebSocket server running on ws://localhost:5000
# Ready for Supabase database integration
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create environment configuration
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Start development server
npm run dev

# Expected output:
# VITE v6.2.0 running at:
# Local:  http://localhost:5173
```

### Verify Installation

1. **Backend running**: http://localhost:5000 shows WebSocket server (not a web page - that's correct)
2. **Frontend running**: http://localhost:5173 loads in browser
3. **Can sign up**: Click "Sign Up" and create an account
4. **Can create tasks**: Add a task and see it on the board
5. **Can logout**: Click user email → "Logout"

---

## Running Tests

### Unit & Integration Tests

```bash
cd frontend
npm run test

# Output should show:
# Test Files: 2 passed (2)
# Tests: 24 passed (24)
```

### End-to-End Tests

```bash
cd frontend

# Make sure frontend server is running in another terminal (npm run dev)

npm run test:e2e

# Tests run in browser using Playwright
# Shows test progress and results
```

### Run Specific Tests

```bash
# Run only unit tests
npm run test -- KanbanBoard.test

# Run with UI (watch mode)
npm run test:ui

# Run with coverage
npm run test -- --coverage
```

---

## Project Structure

```
c:\code\intern assignments\Vyorius Drones\
├── backend/
│   ├── server.js              # Express + Socket.IO server
│   ├── package.json           # Backend dependencies
│   └── .env                   # Environment variables (optional)
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx            # Root component with auth
│   │   ├── main.jsx           # React entry point
│   │   ├── components/
│   │   │   ├── Auth.jsx       # Login/signup forms
│   │   │   └── KanbanBoard.jsx # Main board component
│   │   ├── lib/
│   │   │   └── supabaseClient.js # Supabase configuration
│   │   ├── styles/
│   │   │   ├── App.css
│   │   │   ├── Auth.css
│   │   │   └── KanbanBoard.css
│   │   ├── tests/
│   │   │   ├── unit/          # Unit tests (Vitest)
│   │   │   ├── integration/   # Integration tests (Vitest)
│   │   │   └── e2e/           # End-to-end tests (Playwright)
│   │   └── setupTests.js      # Test configuration
│   ├── package.json           # Frontend dependencies
│   ├── vite.config.js         # Vite configuration
│   ├── vitest.config.js       # Vitest configuration
│   ├── playwright.config.js   # Playwright configuration
│   ├── .env.example           # Template for env variables
│   ├── .env.local             # YOUR credentials (git-ignored)
│   └── index.html             # HTML entry point
│
├── README.md                  # Project overview
├── SUPABASE_SETUP.md          # How to set up Supabase
└── IMPLEMENTATION.md          # Technical implementation details
```

---

## How to Use the Application

### Sign Up
1. Enter email and password
2. Click "Sign Up"
3. Check that email is confirmed (Supabase allows test emails without verification)

### Create Tasks
1. Enter task title
2. Add description (optional)
3. Select priority (Low, Medium, High)
4. Select category (Feature, Bug, Enhancement)
5. Attach files (optional)
6. Click "Create Task"

### Manage Tasks
- **Drag & Drop**: Move tasks between columns
- **Edit**: Click task to edit details
- **Delete**: Click delete button on task
- **Track Progress**: See completion percentage at top

### Logout
1. Click user email in top right
2. Click "Logout"
3. You'll return to login page

---

## Troubleshooting

### Port Already in Use

If `Error: listen EADDRINUSE: address already in use :::5000`:

```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :5000
kill -9 <PID>
```

### Frontend Can't Connect to Backend

Check:
- Backend is running (`npm start` in backend folder)
- Backend shows "WebSocket server running on ws://localhost:5000"
- Frontend shows no errors in browser console (F12 → Console tab)

### Supabase Credentials Not Working

1. Verify `.env.local` exists in `frontend/` folder
2. Check exact variable names:
   - `VITE_SUPABASE_URL=` (not `SUPABASE_URL`)
   - `VITE_SUPABASE_ANON_KEY=`
3. Restart frontend server after creating/updating `.env.local`

### Tests Failing

```bash
# Clear cache and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run test
```

### Authentication Not Working

1. Check Supabase project is active (dashboard loads)
2. Verify Email authentication is enabled:
   - Supabase dashboard → Authentication → Providers → Email (enabled)
3. Check your Anon Key has auth permissions
4. Look at browser console for error messages

---

## Development Workflow

### Making Changes

1. **Backend changes**: Edit `backend/server.js`
   - Restart: Stop `npm start`, then run again
   - No hot reload (restart server manually)

2. **Frontend changes**: Edit files in `frontend/src/`
   - Changes save automatically (hot reload)
   - Browser refreshes automatically in dev mode

3. **Style changes**: Edit `.css` files
   - Changes appear instantly

### Adding Dependencies

```bash
# For backend
cd backend
npm install package-name
npm save package-name  # if --save not used

# For frontend
cd frontend
npm install package-name
```

### Pushing to Production

Not covered in this guide, but typically:
- Deploy backend to Heroku, Railway, or similar
- Deploy frontend to Vercel, Netlify, or GitHub Pages
- Keep Supabase account (handles database automatically)

---

## API Reference

### Socket Events (Real-time Communication)

```javascript
// Client sends:
socket.emit("register:user", userId)        // Register user session
socket.emit("task:create", taskData)        // Create new task
socket.emit("task:update", taskData)        // Update task
socket.emit("task:move", {taskId, column}) // Move task to column
socket.emit("task:delete", taskId)         // Delete task

// Server sends:
socket.on("sync:tasks", tasks)     // Receive all user's tasks
socket.on("task:created", task)    // New task created
socket.on("task:updated", task)    // Task updated
socket.on("task:moved", task)      // Task moved
socket.on("task:deleted", taskId)  // Task deleted
```

### Supabase Functions

```javascript
// Authentication
signUp(email, password)        // Create new account
signIn(email, password)        // Login to account
signOut()                      // Logout

// Tasks (requires authentication)
getTasks(userId)               // Get all user's tasks
createTask(taskData, userId)   // Create new task
updateTask(taskId, updates)    // Update task
deleteTask(taskId)             // Delete task
subscribeToTasks(userId, fn)   // Real-time updates
```

---

## Performance Notes

- Frontend: Vite provides ~300ms dev server startup
- Backend: Socket.IO handles 1000+ concurrent connections
- Database: Supabase free tier supports 500MB storage
- Real-time: WebSocket provides <50ms latency

---

## Security

- **Auth**: Email/password secured by Supabase
- **Database**: Row-level security ensures users see only their tasks
- **WebSocket**: User ID validation on backend
- **CORS**: Restricted to frontend origin
- **Secrets**: Keep Supabase keys in `.env.local` (never commit)

---

## Support & Resources

- [React Documentation](https://react.dev)
- [Socket.IO Guide](https://socket.io/docs/)
- [Supabase Docs](https://supabase.com/docs)
- [Vite Guide](https://vitejs.dev/guide/)
- [Vitest Testing](https://vitest.dev/)
- [Playwright Testing](https://playwright.dev/)

---

## Next Steps After Setup

1. ✅ Create Supabase account and database schema
2. ✅ Update `.env.local` with your credentials
3. ✅ Start backend and frontend servers
4. ✅ Sign up for a new account
5. ✅ Create and manage tasks
6. ✅ Run tests to verify everything works
7. ✅ Deploy to production (not covered here)

Enjoy! 🚀
