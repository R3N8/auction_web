import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderListings } from "./renderListings";
import * as CardModule from "../components/ListingCard";
import type { Listing } from "../types/index";

describe("renderListings", () => {
  beforeEach(() => {
    document.body.innerHTML = `<div id="listings-container"></div>`;
  });

  it("render listings using createListingCard", () => {
    vi.spyOn(CardModule, "createListingCard").mockImplementation((listing) => {
      const el = document.createElement("div");
      el.textContent = listing.title;
      return el;
    });

    const listings: Listing[] = [
      {
        id: "1",
        title: "Listing 1",
        bids: [],
        description: "test1",
        createdAt: "08.12.2025",
        endsAt: "10.12.25",
        _count: { bids: 0 },
      },
      {
        id: "2",
        title: "Listing 2",
        bids: [],
        description: "Test2",
        createdAt: "13.12.2025",
        endsAt: "16.12.2025",
        _count: { bids: 1 },
      },
    ];

    const container = document.querySelector<HTMLDivElement>(
      "#listings-container",
    )!;
    renderListings(listings, container);

    expect(container.children.length).toBe(listings.length);
    expect(CardModule.createListingCard).toHaveBeenCalledTimes(2);
  });

  it("clears the container before rendering", () => {
    const container = document.querySelector<HTMLDivElement>(
      "#listings-container",
    )!;
    container.innerHTML = "<div>Old Content</div>";

    vi.spyOn(CardModule, "createListingCard").mockReturnValue(
      document.createElement("div"),
    );

    renderListings([], container);
    expect(container.innerHTML).toBe("");
  });
});
