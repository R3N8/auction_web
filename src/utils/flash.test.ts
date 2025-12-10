import { describe, it, expect, beforeEach } from "vitest";
import { flash } from "./flash";

describe("flash message store", () => {
  beforeEach(() => {
    flash.message = null;
    flash.type = null;
  });

  it("pops the flash mssage and clears values", () => {
    flash.message = "Hello World!";
    flash.type = "success";

    const result = flash.pop();

    expect(flash.message).toBeNull();
    expect(flash.type).toBeNull();
    expect(result).toEqual({ message: "Hello World!", type: "success" });
  });

  it("returns null values when empty", () => {
    const result = flash.pop();
    expect(result).toEqual({ message: null, type: null });
  });
});
