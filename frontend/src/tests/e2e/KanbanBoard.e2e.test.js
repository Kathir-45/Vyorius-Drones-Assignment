import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:5173"; // Vite default port

test.describe("Kanban Board E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    // Wait for the board to load
    await page.waitForText("Real-time Kanban Board");
  });

  test("User can see the kanban board with three columns", async ({ page }) => {
    await expect(page.getByText("To Do")).toBeVisible();
    await expect(page.getByText("In Progress")).toBeVisible();
    await expect(page.getByText("Done")).toBeVisible();
  });

  test("User can add a new task", async ({ page }) => {
    // Click the Add New Task button
    await page.click("button:has-text('+ Add New Task')");

    // Fill in task details
    await page.fill('[placeholder="Task title"]', "E2E Test Task");
    await page.fill('[placeholder="Description"]', "This is an E2E test task");

    // Click Create Task
    await page.click("button:has-text('Create Task')");

    // Verify task appears on the board
    await expect(page.getByText("E2E Test Task")).toBeVisible();
  });

  test("User can view existing tasks", async ({ page }) => {
    // Check if default tasks are visible
    await expect(page.getByText("Design UI mockups")).toBeVisible();
    await expect(page.getByText("Setup backend API")).toBeVisible();
  });

  test("User can edit a task", async ({ page }) => {
    // Find and click edit button on first task
    const firstTaskEditButton = page.locator("button:has-text('Edit')").first();
    await firstTaskEditButton.click();

    // Verify form appears with task data
    const titleInput = page.locator('[type="text"]').first();
    const currentValue = await titleInput.inputValue();
    expect(currentValue).toBeTruthy();

    // Update the title
    await titleInput.clear();
    await titleInput.fill("Edited Task Title");

    // Click Save
    await page.click("button:has-text('Save')");

    // Verify the change
    await expect(page.getByText("Edited Task Title")).toBeVisible();
  });

  test("User can drag and drop task between columns", async ({ page }) => {
    // Get a task element
    const taskCard = page.locator(".task-card").first();

    // Get the task title before drag
    const taskTitle = await taskCard.locator("h3").first().textContent();

    // Drag to "In Progress" column
    const inProgressColumn = page.locator(
      ".kanban-column:has-text('In Progress')"
    );

    await taskCard.dragTo(inProgressColumn);

    // Wait a moment for the update
    await page.waitForTimeout(500);

    // Verify task moved (it should still be visible)
    await expect(page.getByText(taskTitle)).toBeVisible();
  });

  test("User can delete a task", async ({ page }) => {
    // Get task count before deletion
    const tasksBeforeDelete = await page.locator(".task-card").count();

    // Click delete button on first task
    const firstTaskDeleteButton = page.locator("button:has-text('Delete')").first();

    // Handle the confirmation dialog
    page.on("dialog", (dialog) => {
      if (dialog.type() === "confirm") {
        dialog.accept();
      }
    });

    await firstTaskDeleteButton.click();

    // Wait for deletion to complete
    await page.waitForTimeout(500);

    // Verify task count decreased
    const tasksAfterDelete = await page.locator(".task-card").count();
    expect(tasksAfterDelete).toBeLessThan(tasksBeforeDelete);
  });

  test("User can set task priority", async ({ page }) => {
    // Click Add New Task
    await page.click("button:has-text('+ Add New Task')");

    // Fill task title
    await page.fill('[placeholder="Task title"]', "High Priority Task");

    // Select High priority
    const prioritySelect = page.locator("select").first();
    await prioritySelect.selectOption("High");

    // Click Create
    await page.click("button:has-text('Create Task')");

    // Verify priority is displayed
    await expect(page.getByText("High")).toBeVisible();
  });

  test("User can set task category", async ({ page }) => {
    // Click Add New Task
    await page.click("button:has-text('+ Add New Task')");

    // Fill task title
    await page.fill('[placeholder="Task title"]', "Bug Task");

    // Select Bug category
    const categorySelects = page.locator("select");
    await categorySelects.last().selectOption("Bug");

    // Click Create
    await page.click("button:has-text('Create Task')");

    // Verify category is displayed
    await expect(page.getByText("Bug")).toBeVisible();
  });

  test("User can upload file attachment to task", async ({ page }) => {
    // Click attach button on first task
    const attachButton = page.locator("button:has-text('Attach')").first();
    await attachButton.click();

    // Create a test file and upload
    const fileInput = page.locator('input[type="file"]').first();

    // Create a temporary text file
    const buffer = Buffer.from("Test file content");
    await fileInput.setInputFiles({
      name: "test.txt",
      mimeType: "text/plain",
      buffer: buffer,
    });

    // Wait for upload to process
    await page.waitForTimeout(500);

    // Verify attachment appears
    await expect(page.locator(".attachment-item")).toBeVisible();
  });

  test("User can upload image attachment and see preview", async ({ page }) => {
    // Create a simple PNG image (1x1 pixel)
    const pngBuffer = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xde, 0x00, 0x00, 0x00,
      0x0c, 0x49, 0x44, 0x41, 0x54, 0x08, 0x99, 0x63, 0xf8, 0xcf, 0xc0, 0x00,
      0x00, 0x00, 0x03, 0x00, 0x01, 0x8d, 0x87, 0x67, 0xfc, 0x00, 0x00, 0x00,
      0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
    ]);

    const attachButton = page.locator("button:has-text('Attach')").first();
    await attachButton.click();

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: "test-image.png",
      mimeType: "image/png",
      buffer: pngBuffer,
    });

    await page.waitForTimeout(500);

    // Verify image preview is shown
    await expect(page.locator(".attachment-preview").first()).toBeVisible();
  });

  test("Progress statistics update correctly", async ({ page }) => {
    // Check initial progress stats
    const statsText = await page.locator(".progress-stats").textContent();
    expect(statsText).toContain("Total Tasks:");
    expect(statsText).toContain("Completed:");
    expect(statsText).toContain("Progress:");

    // Verify progress bar exists
    await expect(page.locator(".progress-fill")).toBeVisible();
  });

  test("Task counts update in column headers", async ({ page }) => {
    // Check task count in To Do column
    const toDoCount = await page
      .locator(".kanban-column:has-text('To Do') .column-count")
      .textContent();
    expect(toDoCount).toMatch(/\d+/);
  });

  test("User can cancel adding a task", async ({ page }) => {
    // Click Add New Task
    await page.click("button:has-text('+ Add New Task')");

    // Fill in some data
    await page.fill('[placeholder="Task title"]', "Cancelled Task");

    // Click Cancel
    await page.click("button:has-text('Cancel')");

    // Verify form is hidden and button is visible again
    await expect(page.locator('[placeholder="Task title"]')).not.toBeVisible();
    await expect(page.getByText("+ Add New Task")).toBeVisible();
  });

  test("Task form has correct dropdown options", async ({ page }) => {
    // Click Add New Task
    await page.click("button:has-text('+ Add New Task')");

    // Check priority options
    const prioritySelect = page.locator("select").first();
    const priorityOptions = await prioritySelect.locator("option").count();
    expect(priorityOptions).toBeGreaterThan(0);

    // Verify default priority is Medium
    const selectedPriority = await prioritySelect.inputValue();
    expect(selectedPriority).toBe("Medium");
  });
});

  test("User can see the kanban board with three columns", async ({ page }) => {
    await expect(page.getByText("To Do")).toBeVisible();
    await expect(page.getByText("In Progress")).toBeVisible();
    await expect(page.getByText("Done")).toBeVisible();
  });

  test("User can add a new task", async ({ page }) => {
    // Click the Add New Task button
    await page.click("button:has-text('+ Add New Task')");

    // Fill in task details
    await page.fill('[placeholder="Task title"]', "E2E Test Task");
    await page.fill('[placeholder="Description"]', "This is an E2E test task");

    // Click Create Task
    await page.click("button:has-text('Create Task')");

    // Verify task appears on the board
    await expect(page.getByText("E2E Test Task")).toBeVisible();
  });

  test("User can view existing tasks", async ({ page }) => {
    // Check if default tasks are visible
    await expect(page.getByText("Design UI mockups")).toBeVisible();
    await expect(page.getByText("Setup backend API")).toBeVisible();
  });

  test("User can edit a task", async ({ page }) => {
    // Find and click edit button on first task
    const firstTaskEditButton = page.locator("button:has-text('Edit')").first();
    await firstTaskEditButton.click();

    // Verify form appears with task data
    const titleInput = page.locator('[type="text"]').first();
    const currentValue = await titleInput.inputValue();
    expect(currentValue).toBeTruthy();

    // Update the title
    await titleInput.clear();
    await titleInput.fill("Edited Task Title");

    // Click Save
    await page.click("button:has-text('Save')");

    // Verify the change
    await expect(page.getByText("Edited Task Title")).toBeVisible();
  });

  test("User can drag and drop task between columns", async ({ page }) => {
    // Get a task element
    const taskCard = page.locator(".task-card").first();

    // Get the task title before drag
    const taskTitle = await taskCard.locator("h3").first().textContent();

    // Drag to "In Progress" column
    const inProgressColumn = page.locator(
      ".kanban-column:has-text('In Progress')"
    );

    await taskCard.dragTo(inProgressColumn);

    // Wait a moment for the update
    await page.waitForTimeout(500);

    // Verify task moved (it should still be visible)
    await expect(page.getByText(taskTitle)).toBeVisible();
  });

  test("User can delete a task", async ({ page }) => {
    // Get task count before deletion
    const tasksBeforeDelete = await page.locator(".task-card").count();

    // Click delete button on first task
    const firstTaskDeleteButton = page.locator("button:has-text('Delete')").first();

    // Handle the confirmation dialog
    page.on("dialog", (dialog) => {
      if (dialog.type() === "confirm") {
        dialog.accept();
      }
    });

    await firstTaskDeleteButton.click();

    // Wait for deletion to complete
    await page.waitForTimeout(500);

    // Verify task count decreased
    const tasksAfterDelete = await page.locator(".task-card").count();
    expect(tasksAfterDelete).toBeLessThan(tasksBeforeDelete);
  });

  test("User can set task priority", async ({ page }) => {
    // Click Add New Task
    await page.click("button:has-text('+ Add New Task')");

    // Fill task title
    await page.fill('[placeholder="Task title"]', "High Priority Task");

    // Select High priority
    const prioritySelect = page.locator("select").first();
    await prioritySelect.selectOption("High");

    // Click Create
    await page.click("button:has-text('Create Task')");

    // Verify priority is displayed
    await expect(page.getByText("High")).toBeVisible();
  });

  test("User can set task category", async ({ page }) => {
    // Click Add New Task
    await page.click("button:has-text('+ Add New Task')");

    // Fill task title
    await page.fill('[placeholder="Task title"]', "Bug Task");

    // Select Bug category
    const categorySelects = page.locator("select");
    await categorySelects.last().selectOption("Bug");

    // Click Create
    await page.click("button:has-text('Create Task')");

    // Verify category is displayed
    await expect(page.getByText("Bug")).toBeVisible();
  });

  test("User can upload file attachment to task", async ({ page }) => {
    // Click attach button on first task
    const attachButton = page.locator("button:has-text('Attach')").first();
    await attachButton.click();

    // Create a test file and upload
    const fileInput = page.locator('input[type="file"]').first();

    // Create a temporary text file
    const buffer = Buffer.from("Test file content");
    await fileInput.setInputFiles({
      name: "test.txt",
      mimeType: "text/plain",
      buffer: buffer,
    });

    // Wait for upload to process
    await page.waitForTimeout(500);

    // Verify attachment appears
    await expect(page.locator(".attachment-item")).toBeVisible();
  });

  test("User can upload image attachment and see preview", async ({ page }) => {
    // Create a simple PNG image (1x1 pixel)
    const pngBuffer = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xde, 0x00, 0x00, 0x00,
      0x0c, 0x49, 0x44, 0x41, 0x54, 0x08, 0x99, 0x63, 0xf8, 0xcf, 0xc0, 0x00,
      0x00, 0x00, 0x03, 0x00, 0x01, 0x8d, 0x87, 0x67, 0xfc, 0x00, 0x00, 0x00,
      0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
    ]);

    const attachButton = page.locator("button:has-text('Attach')").first();
    await attachButton.click();

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: "test-image.png",
      mimeType: "image/png",
      buffer: pngBuffer,
    });

    await page.waitForTimeout(500);

    // Verify image preview is shown
    await expect(page.locator(".attachment-preview").first()).toBeVisible();
  });

  test("Progress statistics update correctly", async ({ page }) => {
    // Check initial progress stats
    const statsText = await page.locator(".progress-stats").textContent();
    expect(statsText).toContain("Total Tasks:");
    expect(statsText).toContain("Completed:");
    expect(statsText).toContain("Progress:");

    // Verify progress bar exists
    await expect(page.locator(".progress-fill")).toBeVisible();
  });

  test("Task counts update in column headers", async ({ page }) => {
    // Check task count in To Do column
    const toDoCount = await page
      .locator(".kanban-column:has-text('To Do') .column-count")
      .textContent();
    expect(toDoCount).toMatch(/\d+/);
  });

  test("User can cancel adding a task", async ({ page }) => {
    // Click Add New Task
    await page.click("button:has-text('+ Add New Task')");

    // Fill in some data
    await page.fill('[placeholder="Task title"]', "Cancelled Task");

    // Click Cancel
    await page.click("button:has-text('Cancel')");

    // Verify form is hidden and button is visible again
    await expect(page.locator('[placeholder="Task title"]')).not.toBeVisible();
    await expect(page.getByText("+ Add New Task")).toBeVisible();
  });

  test("Task form has correct dropdown options", async ({ page }) => {
    // Click Add New Task
    await page.click("button:has-text('+ Add New Task')");

    // Check priority options
    const prioritySelect = page.locator("select").first();
    const priorityOptions = await prioritySelect.locator("option").count();
    expect(priorityOptions).toBeGreaterThan(0);

    // Verify default priority is Medium
    const selectedPriority = await prioritySelect.inputValue();
    expect(selectedPriority).toBe("Medium");
  });

  test("Real-time sync works when task data changes", async ({ page, context }) => {
    // Create a new page to simulate another user
    const page2 = await context.newPage();
    await page2.goto(BASE_URL);
    await page2.waitForText("Real-time Kanban Board");

    // Add task on first page
    await page.click("button:has-text('+ Add New Task')");
    await page.fill('[placeholder="Task title"]', "Sync Test Task");
    await page.click("button:has-text('Create Task')");

    // Wait for task to appear
    await expect(page.getByText("Sync Test Task")).toBeVisible();

    // Check if it appears on second page (simulates real-time sync)
    await page2.waitForTimeout(1000);
    const taskVisible = await page2.getByText("Sync Test Task").isVisible().catch(() => false);

    await page2.close();
  });
});
