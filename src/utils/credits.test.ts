import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  ensureCreditsForUser,
  getCredits,
  addCredits,
  subtractCredits,
} from "./credits";
import * as storage from "../utils/storage";

describe("Credits system", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("ensures credits for a new user", () => {
    vi.spyOn(storage, "load").mockReturnValue(null);
    const saveMock = vi.spyOn(storage, "save").mockImplementation(() => {});

    const credits = ensureCreditsForUser("alice");

    expect(credits).toBe(1000);
    expect(saveMock).toHaveBeenCalledWith("credits:alice", 1000);
  });

  it("retrieves existing credits for a user", () => {
    const loadMock = vi
      .spyOn(storage, "load")
      .mockImplementation((key: string) =>
        key === "credits:bob" ? 500 : null,
      );

    expect(getCredits("bob")).toBe(500);
    expect(getCredits("unknown")).toBe(0);

    loadMock.mockRestore();
  });

  it("adds credits to a user", () => {
    vi.spyOn(storage, "load").mockReturnValue(200);
    const saveMock = vi.spyOn(storage, "save").mockImplementation(() => {});

    addCredits("charlie", 300);

    expect(saveMock).toHaveBeenCalledWith("credits:charlie", 500);
  });

  it("subtracts credits from a user", () => {
    vi.spyOn(storage, "load").mockReturnValue(400);
    const saveMock = vi.spyOn(storage, "save").mockImplementation(() => {});

    subtractCredits("dave", 150);

    expect(saveMock).toHaveBeenCalledWith("credits:dave", 250);
  });

  it("throws if subtracting too many credits", () => {
    vi.spyOn(storage, "load").mockReturnValue(100);

    expect(() => subtractCredits("eve", 200)).toThrow("Not enough credits");
  });
});
