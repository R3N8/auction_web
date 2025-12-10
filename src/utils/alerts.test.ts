import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { showAlert } from "./alerts";

describe("showAlert", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML =
      '<div id="alert"></div><div id="alert-container"></div>';
  });

  afterEach(() => {
    vi.clearAllTimers();
    document.body.innerHTML = "";
  });

  it("renders alert correctly", () => {
    showAlert("#alert", "success", "Operation completed successfully");

    const alertDiv = document.querySelector("#alert")!;
    expect(alertDiv.innerHTML).toContain("alert-success");
    expect(alertDiv.innerHTML).toContain("fa-circle-check");
    expect(alertDiv.innerHTML).toContain("Operation completed successfully");
  });

  it("removes alert after seven seconds", () => {
    showAlert("#alert", "error", "An error occurred");

    const alertDiv = document.querySelector("#alert")!;

    vi.advanceTimersByTime(7000);

    expect(alertDiv.innerHTML).toBe("");
  });

  it("do nothing if selector does not match an element", () => {
    const initialHTML = document.body.innerHTML;
    showAlert("#non-existent", "info", "This will not be shown");
    expect(document.body.innerHTML).toBe(initialHTML);
  });
});
