// src/pages/Home.ts
import { getCurrentUser } from "../services/auth";
import { fetchListings } from "../services/listings";
import type { Listing } from "../types/index";

export default function Home(): HTMLDivElement {
  const element = document.createElement("div");

  element.innerHTML = `
    <h1>Marketplace</h1>
    <div id="top-note"></div>

    <div id="listings">Loading listings...</div>
  `;

  const topNote = element.querySelector<HTMLDivElement>("#top-note")!;
  const listingsContainer = element.querySelector<HTMLDivElement>("#listings")!;

  // Render user status
  const user = getCurrentUser();
  if (!user) {
    topNote.innerHTML = `<p class="note">Please log in to bid on items.</p>`;
  } else {
    topNote.innerHTML = `<p class="ok">Logged in as ${user.name}</p>`;
  }

  // Render function
  async function render(query?: string) {
    listingsContainer.innerHTML = "Loading…";

    try {
      const listings: Listing[] = await fetchListings(
        query ? { q: query, active: true } : { active: true },
      );

      if (listings.length === 0) {
        listingsContainer.innerHTML = "<p>No listings found.</p>";
        return;
      }

      listingsContainer.innerHTML = listings
        .map(
          (item) => `
            <div class="item-card">
              <a href="#/listing/${item.id}">${item.title}</a>
              <p>${item.description}</p>
              <div>Bids: ${item._count?.bids ?? 0}</div>
              <div>Ends: ${new Date(item.endsAt).toLocaleString()}</div>
              ${item.seller ? `<div>Seller: ${item.seller.name}</div>` : ""}
            </div>
          `,
        )
        .join("");
    } catch (error) {
      const err = error as Error;
      listingsContainer.innerHTML = `<p>Error loading listings: ${err.message}</p>`;
    }
  }

  // Initial load
  render();

  return element;
}
