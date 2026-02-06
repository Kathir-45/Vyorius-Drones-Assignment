import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import io from "socket.io-client";
import { signOut } from "../lib/supabaseClient";
import Spinner from "./Spinner";
import "../styles/KanbanBoard.css";

function KanbanBoard({ user, onLogout }) {
  const [tasks, setTasks] = useState([]);
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [draggedTask, setDraggedTask] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [darkMode, setDarkMode] = useState(false);
  const [sortBy, setSortBy] = useState("created");
  const [selectedTasks, setSelectedTasks] = useState(new Set());
  const [showTaskDetails, setShowTaskDetails] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [statusModalTaskId, setStatusModalTaskId] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [newTaskData, setNewTaskData] = useState({
    title: "",
    description: "",
    priority: "Medium",
    category: "Feature",
    dueDate: "",
    timeEstimate: "",
    tags: "",
  });
  const fileInputRef = useRef(null);

  const columns = ["To Do", "In Progress", "Done"];

  // Initialize WebSocket connection
  useEffect(() => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
    const newSocket = io(backendUrl);
    setSocket(newSocket);

    // Register user with socket for user-specific task filtering
    newSocket.on("connect", () => {
      if (user?.id) {
        newSocket.emit("register:user", user.id);
      }
    });

    newSocket.on("sync:tasks", (receivedTasks) => {
      setTasks(receivedTasks);
      setLoading(false);
    });

    newSocket.on("task:created", (newTask) => {
      setTasks((prevTasks) => [...prevTasks, newTask]);
    });

    newSocket.on("task:updated", (updatedTask) => {
      setTasks((prevTasks) =>
        prevTasks.map((t) => (t.id === updatedTask.id ? updatedTask : t))
      );
    });

    newSocket.on("task:moved", (movedTask) => {
      setTasks((prevTasks) =>
        prevTasks.map((t) => (t.id === movedTask.id ? movedTask : t))
      );
    });

    newSocket.on("task:deleted", (taskId) => {
      setTasks((prevTasks) => prevTasks.filter((t) => t.id !== taskId));
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeydown = (e) => {
      // Ctrl/Cmd + Shift + A: Add new task
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "A") {
        e.preventDefault();
        setShowNewTaskForm(true);
      }
      // Ctrl/Cmd + K: Focus search
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        document.querySelector(".search-input")?.focus();
      }
      // Ctrl/Cmd + L: Toggle dark mode
      if ((e.ctrlKey || e.metaKey) && e.key === "l") {
        e.preventDefault();
        setDarkMode(!darkMode);
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [darkMode]);

  // Drag and Drop Handlers
  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "move";
    }
  };

  const handleDropOnColumn = (e, columnName) => {
    e.preventDefault();
    if (draggedTask && draggedTask.column !== columnName && socket) {
      socket.emit("task:move", { id: draggedTask.id, column: columnName });
      setDraggedTask(null);
    }
  };

  // Create new task
  const handleCreateTask = () => {
    if (newTaskData.title.trim() && socket) {
      socket.emit("task:create", {
        title: newTaskData.title,
        description: newTaskData.description,
        priority: newTaskData.priority,
        category: newTaskData.category,
        column: "To Do",
      });
      setNewTaskData({
        title: "",
        description: "",
        priority: "Medium",
        category: "Feature",
      });
      setShowNewTaskForm(false);
    }
  };

  // Update task
  const handleUpdateTask = (updatedData) => {
    if (socket && editingTask) {
      socket.emit("task:update", {
        id: editingTask.id,
        ...updatedData,
      });
      setEditingTask(null);
    }
  };

  // Delete task
  const handleDeleteTask = (taskId) => {
    if (socket && window.confirm("Are you sure you want to delete this task?")) {
      socket.emit("task:delete", taskId);
    }
  };

  // Change task status
  const handleChangeStatus = (taskId, newStatus) => {
    if (socket) {
      socket.emit("task:update", {
        id: taskId,
        column: newStatus,
      });
    }
  };

  // Duplicate task
  const handleDuplicateTask = (task) => {
    if (socket) {
      const newTask = {
        ...task,
        id: undefined,
        title: `${task.title} (Copy)`,
        column: task.column,
      };
      socket.emit("task:create", newTask);
    }
  };

  // Toggle task favorite
  const handleToggleFavorite = (taskId) => {
    if (socket) {
      const task = tasks.find(t => t.id === taskId);
      socket.emit("task:update", {
        id: taskId,
        isFavorite: !task?.isFavorite,
      });
    }
  };

  // Calculate task statistics
  const calculateTaskStats = () => {
    const activeTasks = tasks.filter(t => !t.archived);
    const totalTime = activeTasks.reduce((sum, t) => sum + (parseInt(t.timeEstimate) || 0), 0);
    const favoriteTasks = activeTasks.filter(t => t.isFavorite).length;
    const overdueTasks = activeTasks.filter(t => {
      if (!t.dueDate || t.column === "Done") return false;
      return new Date(t.dueDate) < new Date();
    }).length;
    
    return {
      total: activeTasks.length,
      favorite: favoriteTasks,
      totalHours: totalTime,
      overdue: overdueTasks,
      byPriority: {
        high: activeTasks.filter(t => t.priority === "High").length,
        medium: activeTasks.filter(t => t.priority === "Medium").length,
        low: activeTasks.filter(t => t.priority === "Low").length,
      }
    };
  };

  const handleLogout = async () => {
    const { error } = await signOut();
    if (!error) {
      onLogout();
    }
  };

  // Handle file upload
  const handleFileUpload = (e, taskId) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const task = tasks.find((t) => t.id === taskId);
        if (task && socket) {
          const updatedAttachments = [
            ...(task.attachments || []),
            {
              id: Date.now().toString(),
              name: file.name,
              type: file.type,
              data: event.target.result,
            },
          ];
          socket.emit("task:update", {
            id: taskId,
            attachments: updatedAttachments,
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Calculate progress stats
  const calculateStats = () => {
    const total = tasks.filter(t => !t.archived).length;
    const done = tasks.filter((t) => t.column === "Done" && !t.archived).length;
    const archived = tasks.filter(t => t.archived).length;
    const percentage = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, done, percentage, archived };
  };

  const stats = calculateStats();

  // Archive task
  const handleArchiveTask = (taskId) => {
    if (socket) {
      const task = tasks.find(t => t.id === taskId);
      socket.emit("task:update", {
        id: taskId,
        archived: !task?.archived,
      });
    }
  };

  // Bulk delete archived tasks
  const handleDeleteArchived = () => {
    if (window.confirm("Delete all archived tasks? This cannot be undone.")) {
      const archivedIds = tasks.filter(t => t.archived).map(t => t.id);
      archivedIds.forEach(id => {
        if (socket) socket.emit("task:delete", id);
      });
    }
  };

  // Export tasks to CSV
  const handleExportTasks = () => {
    const visibleTasks = showArchived ? tasks : tasks.filter(t => !t.archived);
    const headers = ["Title", "Description", "Status", "Priority", "Category", "Due Date", "Created Date"];
    const csvContent = [
      headers.join(","),
      ...visibleTasks.map(task => [
        `"${task.title}"`,
        `"${task.description || ''}"`,
        task.column,
        task.priority,
        task.category,
        task.dueDate || "N/A",
        task.createdAt || "N/A"
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "kanban-tasks.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Filter tasks based on search and filters
  const getFilteredTasks = () => {
    let filtered = tasks.filter((task) => {
      if (!showArchived && task.archived) return false;
      if (showArchived && !task.archived) return false;
      
      const matchesSearch =
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPriority =
        priorityFilter === "All" || task.priority === priorityFilter;
      const matchesCategory =
        categoryFilter === "All" || task.category === categoryFilter;
      return matchesSearch && matchesPriority && matchesCategory;
    });

    // Apply sorting
    if (sortBy === "priority") {
      const priorityOrder = { High: 1, Medium: 2, Low: 3 };
      filtered.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    } else if (sortBy === "dueDate") {
      filtered.sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      });
    } else if (sortBy === "created") {
      filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    return filtered;
  };

  const filteredTasks = getFilteredTasks();
  const uniqueCategories = [...new Set(tasks.map((t) => t.category))];

  if (loading) {
    return <Spinner />;
  }

  return (
    <div className={`kanban-container ${darkMode ? "dark-mode" : ""}`}>
      {/* Header with Progress */}
      <div className="kanban-header">
        <div className="header-top">
          <h1>Real-time Kanban Board</h1>
          {user && (
            <div className="user-section">
              <span className="user-email">{user.email}</span>
              <button className="btn-logout" onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}
        </div>
        <div className="progress-stats">
          <div className="stat-item">
            <span className="stat-label">Total Tasks:</span>
            <span className="stat-value">{stats.total}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Completed:</span>
            <span className="stat-value">{stats.done}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Progress:</span>
            <span className="stat-value">{stats.percentage}%</span>
          </div>
          {stats.archived > 0 && (
            <div className="stat-item">
              <span className="stat-label">Archived:</span>
              <span className="stat-value">{stats.archived}</span>
            </div>
          )}
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${stats.percentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Filters, Sort, and Controls */}
      <div className="filters-section">
        <div className="filters-left">
          <input
            type="text"
            placeholder="🔍 Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="filter-select"
          >
            <option value="All">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="filter-select"
          >
            <option value="All">All Categories</option>
            {uniqueCategories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="filter-select"
          >
            <option value="created">Sort by Newest</option>
            <option value="priority">Sort by Priority</option>
            <option value="dueDate">Sort by Due Date</option>
          </select>
        </div>
        <div className="action-buttons">
          {stats.archived > 0 && (
            <button
              className="btn-action"
              onClick={() => setShowArchived(!showArchived)}
              title={showArchived ? "Hide archived" : "Show archived"}
            >
              {showArchived ? "📦 Hide Archived" : "📦 Show Archived"}
            </button>
          )}
          <button
            className="btn-action"
            onClick={() => setShowStats(!showStats)}
            title="Show task statistics"
          >
            📊 Stats
          </button>
          <button
            className="btn-action"
            onClick={handleExportTasks}
            title="Export tasks to CSV"
          >
            📥 Export
          </button>
          <button
            className="btn-dark-mode"
            onClick={() => setDarkMode(!darkMode)}
            title="Toggle Dark Mode (Ctrl+L)"
          >
            {darkMode ? "☀️ Light" : "🌙 Dark"}
          </button>
        </div>
      </div>

      {/* New Task Form */}
      <div className="new-task-section">
        {!showNewTaskForm ? (
          <button
            className="btn-add-task"
            onClick={() => setShowNewTaskForm(true)}
          >
            + Add New Task
          </button>
        ) : (
          <div className="new-task-form">
            <input
              type="text"
              placeholder="Task title"
              value={newTaskData.title}
              onChange={(e) =>
                setNewTaskData({ ...newTaskData, title: e.target.value })
              }
              className="form-input"
            />
            <textarea
              placeholder="Description"
              value={newTaskData.description}
              onChange={(e) =>
                setNewTaskData({ ...newTaskData, description: e.target.value })
              }
              className="form-textarea"
            ></textarea>
            <div className="form-row">
              <select
                value={newTaskData.priority}
                onChange={(e) =>
                  setNewTaskData({ ...newTaskData, priority: e.target.value })
                }
                className="form-select"
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
              <select
                value={newTaskData.category}
                onChange={(e) =>
                  setNewTaskData({ ...newTaskData, category: e.target.value })
                }
                className="form-select"
              >
                <option>Bug</option>
                <option>Feature</option>
                <option>Enhancement</option>
              </select>
              <input
                type="text"
                placeholder="Time estimate (hours)"
                value={newTaskData.timeEstimate}
                onChange={(e) =>
                  setNewTaskData({ ...newTaskData, timeEstimate: e.target.value })
                }
                className="form-input"
              />
              <input
                type="text"
                placeholder="Tags (comma-separated)"
                value={newTaskData.tags}
                onChange={(e) =>
                  setNewTaskData({ ...newTaskData, tags: e.target.value })
                }
                className="form-input"
              />
            </div>
            <div className="form-actions">
              <button
                className="btn-create"
                onClick={handleCreateTask}
              >
                Create Task
              </button>
              <button
                className="btn-cancel"
                onClick={() => setShowNewTaskForm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Stats Panel */}
      {showStats && (() => {
        const taskStats = calculateTaskStats();
        return (
          <div className="stats-panel">
            <div className="stats-close" onClick={() => setShowStats(false)}>✕</div>
            <h2>Task Statistics</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-number">{taskStats.total}</div>
                <div className="stat-name">Total Tasks</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{taskStats.favorite}</div>
                <div className="stat-name">Favorites</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{taskStats.totalHours}</div>
                <div className="stat-name">Est. Hours</div>
              </div>
              <div className="stat-card overdue">
                <div className="stat-number">{taskStats.overdue}</div>
                <div className="stat-name">Overdue</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{taskStats.byPriority.high}</div>
                <div className="stat-name">High Priority</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{taskStats.byPriority.medium}</div>
                <div className="stat-name">Medium Priority</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{taskStats.byPriority.low}</div>
                <div className="stat-name">Low Priority</div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Kanban Board */}
      <div className="kanban-board">
        {columns.map((columnName) => (
          <div
            key={columnName}
            className="kanban-column"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDropOnColumn(e, columnName)}
          >
            <div className="column-header">
              <h2>{columnName}</h2>
              <span className="column-count">
                {filteredTasks.filter((t) => t.column === columnName).length}
              </span>
            </div>
            <div className="tasks-container">
              {filteredTasks
                .filter((task) => task.column === columnName)
                .map((task) => (
                  <div
                    key={task.id}
                    className="task-card"
                    draggable
                    onDragStart={(e) => handleDragStart(e, task)}
                  >
                    {editingTask?.id === task.id ? (
                      <TaskEditForm
                        task={task}
                        onUpdate={handleUpdateTask}
                        onCancel={() => setEditingTask(null)}
                      />
                    ) : (
                      <TaskCard
                        task={task}
                        onEdit={() => setEditingTask(task)}
                        onDelete={() => handleDeleteTask(task.id)}
                        onArchive={() => handleArchiveTask(task.id)}
                        onDuplicate={() => handleDuplicateTask(task)}
                        onToggleFavorite={() => handleToggleFavorite(task.id)}
                        onChangeStatus={(newStatus) => handleChangeStatus(task.id, newStatus)}
                        onOpenStatusModal={() => setStatusModalTaskId(task.id)}
                        onUploadFile={(e) => handleFileUpload(e, task.id)}
                        fileInputRef={fileInputRef}
                      />
                    )}
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* Status Modal - Rendered at root level using Portal */}
      {statusModalTaskId && ReactDOM.createPortal(
        <StatusModal
          task={tasks.find(t => t.id === statusModalTaskId)}
          onStatusChange={(status) => {
            handleChangeStatus(statusModalTaskId, status);
            setStatusModalTaskId(null);
          }}
          onClose={() => setStatusModalTaskId(null)}
        />,
        document.body
      )}
    </div>
  );
}

// Task Card Component
function TaskCard({ task, onEdit, onDelete, onArchive, onDuplicate, onToggleFavorite, onChangeStatus, onOpenStatusModal, onUploadFile, fileInputRef }) {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High":
        return "#e74c3c";
      case "Medium":
        return "#f39c12";
      case "Low":
        return "#27ae60";
      default:
        return "#95a5a6";
    }
  };

  const handleStatusChange = (newStatus) => {
    onChangeStatus(newStatus);
    setShowStatusModal(false);
  };

  return (
    <div className="task-content">
      <div className="task-header">
        <h3>{task.title}</h3>
        <div className="task-priority" style={{ backgroundColor: getPriorityColor(task.priority) }}>
          {task.priority}
        </div>
      </div>
      {task.description && <p className="task-description">{task.description}</p>}
      <div className="task-meta">
        <span className="task-category">{task.category}</span>
        {task.dueDate && (
          <span className="task-duedate">
            📅 {new Date(task.dueDate).toLocaleDateString()}
          </span>
        )}
        {task.timeEstimate && (
          <span className="task-time-estimate">
            ⏱️ {task.timeEstimate}h
          </span>
        )}
      </div>

      {/* Tags */}
      {task.tags && (
        <div className="task-tags">
          {task.tags.split(",").map((tag, idx) => (
            <span key={idx} className="tag">{tag.trim()}</span>
          ))}
        </div>
      )}

      {/* Attachments */}
      {task.attachments && task.attachments.length > 0 && (
        <div className="task-attachments">
          <h4>Attachments:</h4>
          <div className="attachments-list">
            {task.attachments.map((attachment) => (
              <div key={attachment.id} className="attachment-item">
                {attachment.type?.startsWith("image/") ? (
                  <img
                    src={attachment.data}
                    alt={attachment.name}
                    className="attachment-preview"
                  />
                ) : (
                  <a href={attachment.data} download={attachment.name} className="attachment-link">
                    📎 {attachment.name}
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="task-actions">
        <button className="btn-edit" onClick={onEdit}>
          Edit
        </button>
        <button className="btn-attach" onClick={() => fileInputRef.current?.click()}>
          Attach
        </button>
        <button 
          className="btn-status" 
          onClick={onOpenStatusModal}
        >
          Move
        </button>
        <button
          className={`btn-favorite ${task.isFavorite ? "active" : ""}`}
          onClick={onToggleFavorite}
          title={task.isFavorite ? "Remove favorite" : "Add to favorites"}
        >
          {task.isFavorite ? "⭐" : "☆"}
        </button>
        <button 
          className="btn-duplicate" 
          onClick={onDuplicate}
          title="Duplicate task"
        >
          📋 Copy
        </button>
        <button 
          className="btn-archive" 
          onClick={onArchive}
          title={task.archived ? "Restore task" : "Archive task"}
        >
          {task.archived ? "📂 Restore" : "📦 Archive"}
        </button>
        <button className="btn-delete" onClick={onDelete}>
          Delete
        </button>
        <input
          ref={fileInputRef}
          type="file"
          onChange={onUploadFile}
          style={{ display: "none" }}
        />
      </div>
    </div>
  );
}

// Status Modal Component - Rendered at root level
function StatusModal({ task, onStatusChange, onClose }) {
  if (!task) return null;

  return ReactDOM.createPortal(
    <div className="status-modal-overlay" onClick={onClose}>
      <div className="status-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Change Status</h3>
        <div className="status-options">
          {["To Do", "In Progress", "Done"].map((status) => (
            <button
              key={status}
              className={`status-option ${task.column === status ? "active" : ""}`}
              onClick={() => onStatusChange(status)}
            >
              {status === "To Do" ? "📋" : status === "In Progress" ? "⚙️" : "✅"} {status}
            </button>
          ))}
        </div>
        <button 
          className="btn-close-modal"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>,
    document.body
  );
}

// Task Edit Form Component
function TaskEditForm({ task, onUpdate, onCancel }) {
  const [editData, setEditData] = useState({
    title: task.title,
    description: task.description,
    priority: task.priority,
    category: task.category,
  });

  return (
    <div className="task-edit-form">
      <input
        type="text"
        value={editData.title}
        onChange={(e) => setEditData({ ...editData, title: e.target.value })}
        className="form-input"
      />
      <textarea
        value={editData.description}
        onChange={(e) =>
          setEditData({ ...editData, description: e.target.value })
        }
        className="form-textarea"
      ></textarea>
      <div className="form-row">
        <select
          value={editData.priority}
          onChange={(e) =>
            setEditData({ ...editData, priority: e.target.value })
          }
          className="form-select"
        >
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
        </select>
        <select
          value={editData.category}
          onChange={(e) =>
            setEditData({ ...editData, category: e.target.value })
          }
          className="form-select"
        >
          <option>Bug</option>
          <option>Feature</option>
          <option>Enhancement</option>
        </select>
      </div>
      <div className="form-actions">
        <button
          className="btn-save"
          onClick={() => onUpdate(editData)}
        >
          Save
        </button>
        <button className="btn-cancel" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export default KanbanBoard;
