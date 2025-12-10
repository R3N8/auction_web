import { describe, it, expect, beforeEach } from "vitest";
import { save, load, remove, clear } from "./storage";

describe("storage utils", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should save and load an item", () => {
    save("user", { name: "Alice" });
    expect(load("user")).toEqual({ name: "Alice" });
  });

  it("should return null for non-existing item", () => {
    expect(load("missing")).toBeNull();
  });

  it("should handle invalid JSON gracefully", () => {
    localStorage.setItem("invalid", "not a json");
    expect(load("invalid")).toBeNull();
  });

  it("should remove an item", () => {
    save("temp", 123);
    remove("temp");
    expect(load("temp")).toBeNull();
  });

  it("should clear storage", () => {
    save("item1", 1);
    save("item2", 2);
    clear();
    expect(localStorage.length).toBe(0);
  });
});
