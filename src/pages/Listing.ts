import { DateTime } from "luxon";
import { startCountdown } from "../utils/countdown";
import type { Listing, Bid } from "../types/index";
import { getListingById } from "../services/listings";

export default async function Listing(params?: { id?: string }) {
  const listingId = params?.id;
  if (!listingId) return "Listing not found";

  const listing = await getListingById(listingId, true, true);
  const bids: Bid[] = listing.bids || [];
  const countdownId = `countdown-${listing.id}`;
  const isActive = DateTime.fromISO(listing.endsAt) > DateTime.now();
  const highestBid =
    bids.length > 0 ? Math.max(...bids.map((b) => Number(b.amount))) : 0;

  const element = document.createElement("div");
  element.className =
    "min-h-screen bg-bg w-full flex-flex-col items-center justify-start p-6";

  element.innerHTML = `
    <div>
      <!-- Details -->
      <div class="flex flex-col md:flex-row gap-10">
        <!-- Listing Image -->
        <div class="w-full md:w-1/2 h-120 object-cover rounded">
          <img 
            src="${listing.media?.[0]?.url || "/placeholder.png"}" 
            alt="${listing.title}" 
            class="w-full h-full rounded"
          >
        </div>

        <!-- Listing Info -->
        <div class="w-full md:w-1/2 flex flex-col">
          <div class="flex flex-row justify-between items-baseline">
              <p>Seller: ${listing.seller?.name || "unknown"}</p>

            ${
              isActive
                ? `<p>Time left: <span id="${countdownId}"></span></p>`
                : `<p>Auction ended: ${new Date(listing.endsAt).toLocaleString()}</p>`
            }
          </div> 

          <h1 class="mt-5">${listing.title}</h1>
          <p class="mb-5 text-lg text-text/70">${listing.description}</p>

          <div class="mt-5 flex flex-row justify-between items-center">
            <p class="capitalize">highest bid: <span class="text-primary">${highestBid}$</span></p>
            
            <!-- Place Bid Button -->
            ${
              isActive
                ? `
              <button 
                id="place-bid-btn" 
                type="button" 
                class="flex items-center gap-2 btn-bid rounded-md bg-primary py-2 px-4 cursor-pointer hover:bg-secondary"
                data-id="${listing.id}"
              >
                <i class="fa-solid fa-gavel text-small text-text"></i>
                <p class="capitalize">place bid</p>
              </button>
            `
                : ""
            }
          </div>
        </div>
      </div>

      <!-- Bidding History -->
      <section id="bid-history" class="mt-10">
        <h2 class="mb-5">bidding history</h2>
        ${
          bids.length === 0
            ? `<p class="text-text/70">Be the first to place a bid!</p>`
            : `<div class="overflow-x-auto rounded">
              <table class="min-w-full">
                <thead class="bg-surface text-text">
                  <tr>
                    <th class="px-4 py-2 text-center">Bidder</th>
                    <th class="px-4 py-2 text-center">Amount</th>
                    <th class="px-4 py-2 text-center">Time</th>
                  </tr>
                </thead>
                <tbody>
                  ${[...bids]
                    .sort((a, b) => Number(b.amount) - Number(a.amount))
                    .map(
                      (bid) => `
                      <tr class="bg-bg border-t border-accent text-text">
                        <td class="px-4 py-2 text-left">${bid.bidder?.name || "anonymous"}</td>
                        <td class="px-4 py-2 text-center">${bid.amount}$</td>
                        <td class="px-4 py-2 text-center">${new Date(bid.created).toLocaleString()}</td>
                      </tr>
                    `,
                    )
                    .join("")}
                </tbody>
              </table>
            </div>`
        }
      </section>
    </div>
  `;

  // If bid is active - start countdown
  if (isActive) {
    const countdownEl = element.querySelector<HTMLSpanElement>(
      `#${countdownId}`,
    );
    if (countdownEl) {
      startCountdown(countdownEl, DateTime.fromISO(listing.endsAt));
    }
  }

  // Place Bid Btn
  const placeBidBtn =
    element.querySelector<HTMLButtonElement>("#place-bid-btn");

  if (placeBidBtn) {
    placeBidBtn.addEventListener("click", () => {
      window.location.hash = `#/bid/${listing.id}`;
    });
  }

  return element;
}
