# 🚀 Quick Start Guide

## Step 1: Start Backend Server

```bash
cd backend
npm install
npm run dev
```

**Output should show:**
```
Server running on port 5000
```

## Step 2: Start Frontend (New Terminal)

```bash
cd frontend
npm install
npm run dev
```

**Output should show:**
```
  VITE v6.2.0  ready in XXX ms

  ➜  Local:   http://localhost:5173/
```

## Step 3: Open in Browser

Open `http://localhost:5173` in your browser. You should see:
- ✅ Kanban Board with 3 columns (To Do, In Progress, Done)
- ✅ Sample tasks loaded from backend
- ✅ Progress statistics showing tasks count
- ✅ "+ Add New Task" button

## Step 4: Test Features

### Create a Task
1. Click "+ Add New Task"
2. Enter title: "Test Task"
3. Enter description: "Testing the board"
4. Select Priority: "High"
5. Select Category: "Feature"
6. Click "Create Task" ✅

### Move a Task
1. Find a task card
2. Click and drag it to another column
3. Watch it update in real-time ✅

### Edit a Task
1. Click "Edit" on any task
2. Modify the fields
3. Click "Save" ✅

### Upload Attachment
1. Click "Attach" on a task
2. Select an image file
3. See the image preview ✅

### Delete a Task
1. Click "Delete" on a task
2. Confirm deletion
3. Watch it disappear ✅

## Step 5: Run Tests

### Unit & Integration Tests
```bash
cd frontend
npm run test
```

Expected output: **28 tests passing**

### Watch Mode (Auto-rerun on changes)
```bash
npm run test:watch
```

### E2E Tests
```bash
npm run test:e2e
```

Expected output: **15 test scenarios passing**

### E2E Tests with UI (Visual debugging)
```bash
npm run test:e2e:ui
```

---

## 🎯 Key Features to Try

1. **Real-time Sync:** Open two browser tabs and add a task in one - see it appear in the other
2. **Drag & Drop:** Drag tasks between columns
3. **Progress Tracking:** Watch the percentage update as you complete tasks
4. **File Attachments:** Upload images with preview, or any file type
5. **Priority Colors:** High (red), Medium (orange), Low (green)

---

## 📊 Test Coverage

| Test Type | Count | Command |
|-----------|-------|---------|
| Unit Tests | 15 | `npm run test` |
| Integration Tests | 13 | `npm run test` |
| E2E Tests | 15 | `npm run test:e2e` |
| **Total** | **43** | All tests passing ✅ |

---

## 🔗 Ports & URLs

| Service | URL | Port |
|---------|-----|------|
| Frontend (Dev) | http://localhost:5173 | 5173 |
| Backend (Server) | http://localhost:5000 | 5000 |
| WebSocket | ws://localhost:5000 | 5000 |

---

## ⚡ Hot Module Replacement (HMR)

The frontend supports HMR - changes to React components automatically reload in the browser without losing state!

## 🛑 Stopping Services

- **Frontend:** Press `Ctrl+C` in the frontend terminal
- **Backend:** Press `Ctrl+C` in the backend terminal

---

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| "Port 5000 in use" | Kill the process: `lsof -ti:5000 \| xargs kill` (Mac/Linux) or use Task Manager (Windows) |
| "Port 5173 in use" | Same as above |
| Tests timeout | Ensure both backend and frontend are running |
| No real-time updates | Check browser console for WebSocket errors |
| Missing dependencies | Run `npm install` in the folder |

---

## 📁 File Structure

```
Vyorius Drones/
├── backend/
│   ├── server.js (WebSocket implementation)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/KanbanBoard.jsx (Main component)
│   │   ├── styles/KanbanBoard.css (Styling)
│   │   └── tests/ (All test files)
│   ├── vitest.config.js (Test configuration)
│   ├── playwright.config.js (E2E test configuration)
│   └── package.json
└── IMPLEMENTATION.md (Detailed documentation)
```

---

**You're all set! 🎉**

The project is fully functional with:
- ✅ Real-time WebSocket synchronization
- ✅ Drag-and-drop functionality
- ✅ File uploads with image preview
- ✅ Priority & category management
- ✅ Progress tracking
- ✅ 43 comprehensive tests
- ✅ Professional UI/UX

Enjoy! 🚀
