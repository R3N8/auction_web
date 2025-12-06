import { io } from "socket.io-client";
import { getCurrentUser } from "../services/auth";
import { getListingById } from "../services/listings";
import { addCredits, subtractCredits } from "../utils/credits";
import { showAlert } from "../utils/alerts";
import type { Listing, Bid } from "../types";
import { getHighestBid } from "../utils/getHighestBid";

const socket = io("http://localhost:3000", {
  path: "/auction/socket.io",
});

export default async function Livebid(params?: { id?: string }) {
  const listingId = params?.id;
  if (!listingId) return "Listing not found";

  const currentUser = getCurrentUser();
  const username = currentUser?.name;

  const listing: Listing = await getListingById(listingId, true, true);
  const bids: Bid[] = listing.bids || [];
  let highestBid = getHighestBid(listing);
  let auctionEnded = false;

  const isOwner = listing.seller?.name === username;

  let pendingBidAmount: number | null = null;

  const el = document.createElement("div");
  el.className = "min-h-screen bg-bg flex justify-center p-2 md:p-6";

  el.innerHTML = `
    <div class="w-full max-w-full">
      <div class="flex gap-2 items-center mb-2">
        ${listing.media?.[0] ? `<img src="${listing.media[0].url}" alt="${listing.title}" class="w-auto h-20 rounded object-cover" />` : ""}
        <div>
          <p class="text-2xl capitalize">${listing.title}</p>
          <p id="highestBid" class="text-sm text-text/70">Highest bid: ${highestBid}$</p>
        </div>
      </div>

      <div id="alert-container"></div>

      <!-- Bids -->
      <ul id="bids" class="mt-5 max-h-70 overflow-y-auto bg-surface text-text rounded">
        ${
          bids.length === 0
            ? `<li class="p-2 text-text/70"><p>No bids yet</p></li>`
            : bids
                .sort((a, b) => Number(a.amount) - Number(b.amount))
                .map(
                  (bid) => `
                <li class="p-4">
                  <div class="border-l-2 border-tertiary pl-2">
                    <p class="text-tertiary">${bid.bidder?.name || "anonymous"}</p>
                    <p>${bid.amount}$</p>
                  </div>
                </li>
              `,
                )
                .join("")
        }
      </ul>

      <!-- Typing Indicator -->
      <div id="typing-indicator" class="text-sm italic text-text/70 mb-2"></div>

      <!-- Bid Input -->
      <div class="flex justify-end items-center gap-2 mt-4">
        ${
          isOwner
            ? `
          <button id="endAuctionBtn" class="flex items-center gap-2 rounded bg-primary px-3 py-1.5 cursor-pointer hover:bg-secondary">
            <i class="fa-solid fa-calendar-xmark text-text text-lg"></i>
            <p class="font-display text-text font-semibold capitalize">end auction</p>
          </button>
        `
            : `
          <input id="bidInput" type="number" min="1" step="1" placeholder="Enter bid..." class="p-2 flex-1 rounded bg-surface text-text/80"/>
          <button id="bidBtn" class="flex items-center gap-2 rounded bg-primary py-2 px-2 cursor-pointer hover:bg-secondary">
            <i class="fa-solid fa-gavel text-lg text-bg"></i>
            <p class="font-display text-bg capitalize">bid</p>
          </button>
        `
        }
      </div>
    </div>
  `;
  const bidList = el.querySelector<HTMLUListElement>("#bids")!;
  const highestEl = el.querySelector<HTMLParagraphElement>("#highestBid");
  const typingIndicator =
    el.querySelector<HTMLDivElement>("#typing-indicator")!;
  const alertContainer = el.querySelector<HTMLDivElement>("#alert-container")!;

  if (highestEl) highestEl.textContent = `Highest bid: ${highestBid}$`;

  // scroll chat to bottom load
  requestAnimationFrame(() => {
    bidList.scrollTop = bidList.scrollHeight;
  });

  // join auction room (server-side will initialize auction state if needed)
  socket.emit("join-auction", listingId);

  socket.on("bid-update", (bid: Bid) => {
    bids.unshift(bid);
    highestBid = Math.max(highestBid, Number(bid.amount));

    // if this update corresponds to the pending bid we subtracted for, clear pending
    if (
      pendingBidAmount !== null &&
      bid.bidder.name === username &&
      Number(bid.amount) === pendingBidAmount
    ) {
      pendingBidAmount = null;
    }

    // update highest UI
    if (highestEl) highestEl.textContent = `Highest bid: ${highestBid}$`;

    // remove "No bids yet"
    const empty = bidList.querySelector("li p");
    if (empty?.textContent?.includes("No bids")) bidList.innerHTML = "";

    // create list item
    const li = document.createElement("li");
    li.className = "p-4";

    const isMine = bid.bidder.name === username;

    li.innerHTML = `
      <div class="border-l-2 pl-2 ${isMine ? "border-primary bg-primary/10" : "border-tertiary"}">
        <p class="${isMine ? "text-primary font-bold" : "text-tertiary"}">
          ${isMine ? "You" : bid.bidder}
        </p>
        <p>${bid.amount}$</p>
      </div>
    `;

    bidList.prepend(li);
  });

  socket.on("bid-rejected", (message: string) => {
    showAlert(alertContainer, "warning", message);

    // refund pending bid if any
    if (pendingBidAmount && pendingBidAmount > 0) {
      addCredits(username, pendingBidAmount);
      pendingBidAmount = null;
    }
  });

  socket.on("user-typing", () => {
    typingIndicator.textContent = "Someone is bidding...";
  });

  socket.on("user-stop-typing", () => {
    typingIndicator.textContent = "";
  });

  socket.on(
    "auction-ended",
    ({ winner, losers }: { winner: Bid; losers: Bid[] }) => {
      auctionEnded = true;

      // UI notification
      showAlert(
        alertContainer,
        "success",
        `Auction ended. ${winner.bidder.name} won with ${winner.amount}$`,
      );

      // disable inputs for non-owners
      const bidBtn = el.querySelector<HTMLButtonElement>("#bidBtn");
      const bidInput = el.querySelector<HTMLInputElement>("#bidInput");

      if (bidBtn) bidBtn.disabled = true;
      if (bidInput) bidInput.disabled = true;

      // if we had a pending attempted bid, refund it
      if (pendingBidAmount && pendingBidAmount > 0) {
        addCredits(username, pendingBidAmount);
        pendingBidAmount = null;
      }

      losers.forEach((bid) => {
        console.log(`${bid.bidder.name} was refunded ${bid.amount}`);
      });
    },
  );

  // Owner: end auction early
  if (isOwner) {
    const endAuctionBtn =
      el.querySelector<HTMLButtonElement>("#endAuctionBtn")!;
    endAuctionBtn.addEventListener("click", () => {
      if (bids.length === 0) {
        showAlert(alertContainer, "info", "No bids to end the auction.");
        return;
      }

      const sortedBids = [...bids].sort(
        (a, b) => Number(b.amount) - Number(a.amount),
      );
      const winner = sortedBids[0];
      const losers = sortedBids.slice(1);

      // award winner
      addCredits(winner.bidder.name, Number(winner.amount));

      // refund losers
      losers.forEach((bid) => {
        addCredits(bid.bidder.name, Number(bid.amount));
      });

      showAlert(
        alertContainer,
        "success",
        `Auction ended early. ${winner.bidder.name} won ${winner.amount}$!`,
      );

      // notify server so everyone is locked out
      socket.emit("auction-ended", {
        listingId,
        winner,
        losers,
      });

      endAuctionBtn.disabled = true;
    });
  }

  // Non-owner: bidding flow
  if (!isOwner) {
    const bidInput = el.querySelector<HTMLInputElement>("#bidInput")!;
    const bidBtn = el.querySelector<HTMLButtonElement>("#bidBtn")!;

    // disable UI if auction already ended on load
    if (auctionEnded) {
      bidBtn.disabled = true;
      bidInput.disabled = true;
    }

    // typing detection
    let typingTimeout: number;
    bidInput.addEventListener("input", () => {
      socket.emit("typing", listingId);
      clearTimeout(typingTimeout);
      typingTimeout = window.setTimeout(() => {
        socket.emit("stop-typing", listingId);
      }, 1500);
    });

    bidBtn.addEventListener("click", () => {
      if (auctionEnded) {
        showAlert(alertContainer, "warning", "Auction has ended.");
        return;
      }

      const amount = Number(bidInput.value);
      if (!Number.isFinite(amount) || amount <= 0) {
        showAlert(
          alertContainer,
          "warning",
          "Please enter a valid bid amount.",
        );
        return;
      }

      // rule 1: first bid must be > 0 (we already ensured amount > 0)
      // rule 2: must be higher than current highest
      if (bids.length > 0 && amount <= highestBid) {
        showAlert(
          alertContainer,
          "warning",
          `Bid must be higher than ${highestBid}$!`,
        );
        return;
      }

      // subtract credits safely (this will throw if not enough)
      try {
        subtractCredits(username, amount);
      } catch {
        showAlert(alertContainer, "warning", "Not enough credits!");
        return;
      }

      // register pending amount so we can refund on server rejection
      pendingBidAmount = amount;

      const newBid = {
        listingId,
        amount,
        bidder: {
          name: currentUser.name,
          email: currentUser.email,
          bio: currentUser.bio,
          avatar: currentUser.avatar,
          banner: currentUser.banner,
        },
      };

      socket.emit("new-bid", newBid);
      socket.emit("stop-typing", listingId);

      // clear input
      bidInput.value = "";
    });
  }

  return el;
}
