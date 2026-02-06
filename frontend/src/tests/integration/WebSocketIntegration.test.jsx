import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import io from "socket.io-client";
import KanbanBoard from "../../components/KanbanBoard";

// Mock socket.io-client
vi.mock("socket.io-client");

describe("WebSocket Integration Tests", () => {
  let mockSocket;
  let socketListeners = {};

  beforeEach(() => {
    socketListeners = {};

    mockSocket = {
      emit: vi.fn(),
      on: vi.fn((event, callback) => {
        socketListeners[event] = callback;
      }),
      disconnect: vi.fn(),
    };

    io.mockReturnValue(mockSocket);
  });

  it("initializes WebSocket connection on mount", () => {
    render(<KanbanBoard />);
    expect(io).toHaveBeenCalledWith("http://localhost:5000");
  });

  it("receives initial tasks via sync:tasks event", async () => {
    render(<KanbanBoard />);

    const initialTasks = [
      {
        id: "1",
        title: "Test Task",
        description: "Test Description",
        column: "To Do",
        priority: "High",
        category: "Feature",
        attachments: [],
      },
    ];

    socketListeners["sync:tasks"](initialTasks);

    await waitFor(() => {
      expect(screen.queryByText("Loading tasks...")).not.toBeInTheDocument();
    });
  });

  it("handles real-time task creation event", async () => {
    render(<KanbanBoard />);

    const newTask = {
      id: "new-1",
      title: "New Task",
      description: "Created in real-time",
      column: "To Do",
      priority: "Medium",
      category: "Bug",
      attachments: [],
    };

    socketListeners["sync:tasks"]([]);

    await waitFor(() => {
      socketListeners["task:created"](newTask);
    });

    await waitFor(() => {
      expect(screen.getByText("New Task")).toBeInTheDocument();
    });
  });

  it("handles real-time task update event", async () => {
    const initialTasks = [
      {
        id: "1",
        title: "Old Title",
        description: "Original",
        column: "To Do",
        priority: "Low",
        category: "Feature",
        attachments: [],
      },
    ];

    render(<KanbanBoard />);
    socketListeners["sync:tasks"](initialTasks);

    const updatedTask = {
      id: "1",
      title: "Updated Title",
      description: "Updated Description",
      column: "To Do",
      priority: "High",
      category: "Feature",
      attachments: [],
    };

    await waitFor(() => {
      socketListeners["task:updated"](updatedTask);
    });

    await waitFor(() => {
      expect(screen.getByText("Updated Title")).toBeInTheDocument();
      expect(screen.queryByText("Old Title")).not.toBeInTheDocument();
    });
  });

  it("handles real-time task move event", async () => {
    const initialTasks = [
      {
        id: "1",
        title: "Task to Move",
        description: "Moving between columns",
        column: "To Do",
        priority: "Medium",
        category: "Feature",
        attachments: [],
      },
    ];

    render(<KanbanBoard />);
    socketListeners["sync:tasks"](initialTasks);

    const movedTask = {
      id: "1",
      title: "Task to Move",
      description: "Moving between columns",
      column: "In Progress",
      priority: "Medium",
      category: "Feature",
      attachments: [],
    };

    await waitFor(() => {
      socketListeners["task:moved"](movedTask);
    });

    await waitFor(() => {
      expect(screen.getByText("Task to Move")).toBeInTheDocument();
    });
  });

  it("handles real-time task deletion event", async () => {
    const initialTasks = [
      {
        id: "1",
        title: "Task to Delete",
        description: "Will be removed",
        column: "Done",
        priority: "Low",
        category: "Bug",
        attachments: [],
      },
    ];

    render(<KanbanBoard />);
    socketListeners["sync:tasks"](initialTasks);

    await waitFor(() => {
      expect(screen.getByText("Task to Delete")).toBeInTheDocument();
    });

    socketListeners["task:deleted"]("1");

    await waitFor(() => {
      expect(screen.queryByText("Task to Delete")).not.toBeInTheDocument();
    });
  });

  it("emits task:create event when creating a task", async () => {
    render(<KanbanBoard />);
    socketListeners["sync:tasks"]([]);

    await waitFor(() => {
      const addButton = screen.getByText("+ Add New Task");
      fireEvent.click(addButton);
    });

    const titleInput = screen.getByPlaceholderText("Task title");
    fireEvent.change(titleInput, { target: { value: "New Task" } });

    const createButton = screen.getByText("Create Task");
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(mockSocket.emit).toHaveBeenCalledWith(
        "task:create",
        expect.objectContaining({
          title: "New Task",
        })
      );
    });
  });

  it("emits task:update event when updating a task", async () => {
    const initialTasks = [
      {
        id: "1",
        title: "Original Title",
        description: "Desc",
        column: "To Do",
        priority: "Low",
        category: "Feature",
        attachments: [],
      },
    ];

    render(<KanbanBoard />);
    socketListeners["sync:tasks"](initialTasks);

    await waitFor(() => {
      const editButtons = screen.getAllByText("Edit");
      fireEvent.click(editButtons[0]);
    });

    const titleInput = screen.getByDisplayValue("Original Title");
    fireEvent.change(titleInput, { target: { value: "Updated Title" } });

    const saveButton = screen.getByText("Save");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockSocket.emit).toHaveBeenCalledWith(
        "task:update",
        expect.objectContaining({
          id: "1",
          title: "Updated Title",
        })
      );
    });
  });

  it("emits task:delete event when deleting a task", async () => {
    const initialTasks = [
      {
        id: "1",
        title: "Task to Delete",
        description: "Removable",
        column: "To Do",
        priority: "Medium",
        category: "Bug",
        attachments: [],
      },
    ];

    render(<KanbanBoard />);
    socketListeners["sync:tasks"](initialTasks);

    await waitFor(() => {
      const deleteButtons = screen.getAllByText("Delete");
      window.confirm = vi.fn(() => true);
      fireEvent.click(deleteButtons[0]);
    });

    await waitFor(() => {
      expect(mockSocket.emit).toHaveBeenCalledWith("task:delete", "1");
    });
  });

  it("emits task:move event when moving task between columns", async () => {
    const initialTasks = [
      {
        id: "1",
        title: "Draggable Task",
        description: "Can be moved",
        column: "To Do",
        priority: "High",
        category: "Feature",
        attachments: [],
      },
    ];

    render(<KanbanBoard />);
    socketListeners["sync:tasks"](initialTasks);

    await waitFor(() => {
      expect(screen.getByText("Draggable Task")).toBeInTheDocument();
    });

    const taskCard = screen.getByText("Draggable Task").closest(".task-card");
    fireEvent.dragStart(taskCard);

    const inProgressColumn = screen.getByText("In Progress").closest(
      ".kanban-column"
    );
    fireEvent.dragOver(inProgressColumn);
    fireEvent.drop(inProgressColumn);

    await waitFor(() => {
      expect(mockSocket.emit).toHaveBeenCalledWith(
        "task:move",
        expect.objectContaining({
          id: "1",
        })
      );
    });
  });

  it("disconnects socket on component unmount", () => {
    const { unmount } = render(<KanbanBoard />);
    unmount();
    expect(mockSocket.disconnect).toHaveBeenCalled();
  });
});
