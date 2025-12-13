import { DateTime } from "luxon";
import { getCurrentUser } from "../services/auth";
import { startCountdown } from "../utils/countdown";
import type { Listing } from "../types";

export function createListingCard(item: Listing) {
  const user = getCurrentUser();
  const highestBid = item.bids?.length
    ? Math.max(...item.bids.map((b) => b.amount))
    : null;

  const card = document.createElement("div");
  card.className =
    "bg-surface rounded-lg p-4 hover:scale-105 transition-all flex flex-col h-full";

  card.innerHTML = `
        <!-- Image -->
        <a href="#/listing/${item.id}"
          <div class="w-full h-55 mb-3 rounded-md overflow-hidden cursor-pointer">
              ${
                item.media && item.media.length > 0
                  ? `<img src="${item.media[0].url}" alt="${item.media[0].alt || item.title}" class="w-full h-full object-cover">`
                  : `<div class="w-full h-full flex items-center justify-center text-text/40 font-body">No image</div>`
              }
          </div>
        </a>

        <!-- Countdown -->
        <div id="countdown-${item.id}" class="text-end mb-3 cursor-default"></div>

        <!-- Title -->
        <div>
            <a href="#/listing/${item.id}">
                <p class="font-display text-2xl/8 font-semibold tracking-normal text-text line-clamp-2 capitalize">${item.title}<p/>
            </a>
        </div>
        
        <!-- Description -->
        <p class="text-text/70 mb-3 line-clamp-2 cursor-default">${item.description || "no description"}</p>
        
        <!-- Seller -->
        <div class="flex items-center justify-between text-small tracking-wider cursor-default">
            <p>Seller: ${item.seller?.name || "Unknown"}</p>
        </div>

        <!-- Item Bids -->
        <div class="flex flex-col">
            <div class="flex items-center justify-between capitalize">
                <p class="text-muted cursor-default">highest: ${highestBid !== null ? highestBid : "no bids"}$</p>
                <button type="button" class="btn-view-history flex flex-end items-center gap-1 cursor-pointer" data-id="${item.id}">
                    <i class="fa-solid fa-clock-rotate-left text-small text-text"></i>
                    <p class="capitalize hover:underline hover:text-text">history</p>
                </button>
            </div>
            <hr class="border text-muted mb-6">
        </div>
        
        <!-- CTAs -->
        <div class="flex justify-between items-center mt-auto">
            <a href="#/listing/${item.id}" class="btn-detail rounded-md bg-accent py-2 px-4 hover:bg-accent/50">
                <p class="capitalize">view item</p>
            </a>

            ${
              user
                ? `
              <button id="place-bid-btn" type="button" class="flex items-center gap-2 btn-bid rounded-md bg-primary py-2 px-4 cursor-pointer hover:bg-secondary ${!user ? "opacity-50 cursor-not-allowed" : ""}" data-id="${item.id}" ${!user ? "disabled" : ""}>
                <i class="fa-solid fa-gavel text-small text-text"></i>
                <p class="capitalize">place bid</p>
              </button>
              `
                : ""
            }
        </div>
    `;

  // countdown
  const countdownEl = card.querySelector<HTMLDivElement>(
    `#countdown-${item.id}`,
  )!;
  if (countdownEl) {
    const end = DateTime.fromISO(item.endsAt);
    startCountdown(countdownEl, end);
  }

  // view history btn
  const viewHistoryBtn =
    card.querySelector<HTMLButtonElement>(".btn-view-history");
  if (viewHistoryBtn) {
    viewHistoryBtn.addEventListener("click", () => {
      // Navigate to the correct listing route
      window.location.hash = `#/listing/${item.id}`;

      // Wait a short moment for the page to render, then scroll
      setTimeout(() => {
        const bidHistory = document.getElementById("bid-history");
        if (bidHistory) {
          bidHistory.scrollIntoView({ behavior: "smooth" });
        }
      }, 100); // 100ms delay
    });
  }

  // Place Bid Btn
  const placeBidBtn = card.querySelector<HTMLButtonElement>("#place-bid-btn");

  if (placeBidBtn) {
    placeBidBtn.addEventListener("click", () => {
      window.location.hash = `#/livebid/${item.id}`;
    });
  }

  return card;
}
