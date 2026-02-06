import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import io from "socket.io-client";
import KanbanBoard from "../../components/KanbanBoard";

// Mock socket.io-client
vi.mock("socket.io-client");

const createMockSocket = () => {
  const listeners = {};
  return {
    emit: vi.fn(),
    on: vi.fn((event, callback) => {
      listeners[event] = callback;
    }),
    disconnect: vi.fn(),
    _trigger: (event, data) => {
      if (listeners[event]) {
        listeners[event](data);
      }
    },
  };
};

describe("KanbanBoard Unit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state initially", () => {
    const mockSocket = createMockSocket();
    vi.mocked(io).mockReturnValue(mockSocket);

    const { container } = render(<KanbanBoard />);
    // Check for spinner component by looking for quantum-loader class
    expect(container.querySelector(".quantum-loader")).toBeInTheDocument();
  });

  it("renders the kanban board component after loading", async () => {
    const mockSocket = createMockSocket();
    vi.mocked(io).mockReturnValue(mockSocket);

    const { container } = render(<KanbanBoard />);

    // Trigger socket callback to load tasks
    mockSocket._trigger("sync:tasks", []);

    await waitFor(() => {
      expect(container.querySelector(".kanban-container")).toBeInTheDocument();
    });
  });

  it("displays the three columns: To Do, In Progress, Done", async () => {
    const mockSocket = createMockSocket();
    vi.mocked(io).mockReturnValue(mockSocket);

    render(<KanbanBoard />);
    mockSocket._trigger("sync:tasks", []);

    await waitFor(() => {
      expect(screen.getByText("To Do")).toBeInTheDocument();
      expect(screen.getByText("In Progress")).toBeInTheDocument();
      expect(screen.getByText("Done")).toBeInTheDocument();
    });
  });

  it("displays add task button", async () => {
    const mockSocket = createMockSocket();
    vi.mocked(io).mockReturnValue(mockSocket);

    render(<KanbanBoard />);
    mockSocket._trigger("sync:tasks", []);

    await waitFor(() => {
      expect(screen.getByText("+ Add New Task")).toBeInTheDocument();
    });
  });

  it("shows task form when add task button is clicked", async () => {
    const mockSocket = createMockSocket();
    vi.mocked(io).mockReturnValue(mockSocket);

    render(<KanbanBoard />);
    mockSocket._trigger("sync:tasks", []);

    await waitFor(() => {
      const addButton = screen.getByText("+ Add New Task");
      fireEvent.click(addButton);
    });

    expect(screen.getByPlaceholderText("Task title")).toBeInTheDocument();
  });

  it("displays progress statistics", async () => {
    const mockSocket = createMockSocket();
    vi.mocked(io).mockReturnValue(mockSocket);

    render(<KanbanBoard />);
    mockSocket._trigger("sync:tasks", []);

    await waitFor(() => {
      expect(screen.getByText("Total Tasks:")).toBeInTheDocument();
      expect(screen.getByText("Completed:")).toBeInTheDocument();
      expect(screen.getByText("Progress:")).toBeInTheDocument();
    });
  });

  it("renders default tasks from server", async () => {
    const mockSocket = createMockSocket();
    vi.mocked(io).mockReturnValue(mockSocket);

    const tasks = [
      {
        id: "1",
        title: "Design UI mockups",
        description: "Test",
        column: "To Do",
        priority: "High",
        category: "Feature",
        attachments: [],
      },
    ];

    render(<KanbanBoard />);
    mockSocket._trigger("sync:tasks", tasks);

    await waitFor(() => {
      expect(screen.getByText("Design UI mockups")).toBeInTheDocument();
    });
  });

  it("displays priority badge on task card", async () => {
    const mockSocket = createMockSocket();
    vi.mocked(io).mockReturnValue(mockSocket);

    const tasks = [
      {
        id: "1",
        title: "Task",
        description: "Test",
        column: "To Do",
        priority: "High",
        category: "Feature",
        attachments: [],
      },
    ];

    render(<KanbanBoard />);
    mockSocket._trigger("sync:tasks", tasks);

    await waitFor(() => {
      const priorityBadges = screen.getAllByText("High");
      expect(priorityBadges.length).toBeGreaterThan(0);
    });
  });

  it("displays task category", async () => {
    const mockSocket = createMockSocket();
    vi.mocked(io).mockReturnValue(mockSocket);

    const tasks = [
      {
        id: "1",
        title: "Task",
        description: "Test",
        column: "To Do",
        priority: "Low",
        category: "Feature",
        attachments: [],
      },
    ];

    render(<KanbanBoard />);
    mockSocket._trigger("sync:tasks", tasks);

    await waitFor(() => {
      const categoryElements = screen.getAllByText("Feature");
      expect(categoryElements.length).toBeGreaterThan(0);
    });
  });

  it("allows editing task when edit button is clicked", async () => {
    const mockSocket = createMockSocket();
    vi.mocked(io).mockReturnValue(mockSocket);

    const tasks = [
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
    mockSocket._trigger("sync:tasks", tasks);

    await waitFor(() => {
      const editButtons = screen.getAllByText("Edit");
      fireEvent.click(editButtons[0]);
    });

    expect(screen.getByDisplayValue("Original Title")).toBeInTheDocument();
  });

  it("allows canceling task form", async () => {
    const mockSocket = createMockSocket();
    vi.mocked(io).mockReturnValue(mockSocket);

    render(<KanbanBoard />);
    mockSocket._trigger("sync:tasks", []);

    await waitFor(() => {
      const addButton = screen.getByText("+ Add New Task");
      fireEvent.click(addButton);
    });

    const cancelButton = screen.getByText("Cancel");
    fireEvent.click(cancelButton);

    expect(screen.queryByPlaceholderText("Task title")).not.toBeInTheDocument();
  });

  it("shows form fields with correct default values", async () => {
    const mockSocket = createMockSocket();
    vi.mocked(io).mockReturnValue(mockSocket);

    render(<KanbanBoard />);
    mockSocket._trigger("sync:tasks", []);

    await waitFor(() => {
      const addButton = screen.getByText("+ Add New Task");
      fireEvent.click(addButton);
    });

    const prioritySelect = screen.getAllByDisplayValue("Medium")[0];
    const categorySelect = screen.getAllByDisplayValue("Feature")[0];
    expect(prioritySelect).toBeInTheDocument();
    expect(categorySelect).toBeInTheDocument();
  });

  it("formats priority levels correctly", async () => {
    const mockSocket = createMockSocket();
    vi.mocked(io).mockReturnValue(mockSocket);

    const tasks = [
      {
        id: "1",
        title: "Task",
        description: "Test",
        column: "To Do",
        priority: "High",
        category: "Feature",
        attachments: [],
      },
      {
        id: "2",
        title: "Task 2",
        description: "Test",
        column: "To Do",
        priority: "Medium",
        category: "Feature",
        attachments: [],
      },
    ];

    render(<KanbanBoard />);
    mockSocket._trigger("sync:tasks", tasks);

    await waitFor(() => {
      expect(screen.getByText("High")).toBeInTheDocument();
      expect(screen.getByText("Medium")).toBeInTheDocument();
    });
  });
});
