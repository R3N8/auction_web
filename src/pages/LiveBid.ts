import { io } from "socket.io-client";
import { getCurrentUser } from "../services/auth";
import { getListingById } from "../services/listings";
import { addCredits, subtractCredits, getCredits } from "../utils/credits";
import { showAlert } from "../utils/alerts";
import type { Listing, Bid } from "../types";
import { getHighestBid } from "../utils/getHighestBid";
import { renderNavbar } from "../main";
import { attachNavbarEventListeners } from "../components/Navbar";
import { createBid } from "../services/bids";

const socket = io(import.meta.env.VITE_SOCKET_URL, {
  path: "/auction/socket.io",
});

export default async function Livebid(params?: { id?: string }) {
  const listingId = params?.id;
  if (!listingId) return "Listing not found";

  const currentUser = getCurrentUser();
  const username = currentUser?.name;
  if (!username) return "User not logged in";

  const listing: Listing = await getListingById(listingId, true, true);
  const bids: Bid[] = listing.bids || [];
  let highestBid = getHighestBid(listing);
  let auctionEnded = false;
  let pendingBidAmount: number | null = null;

  const isOwner = listing.seller?.name === username;

  const el = document.createElement("div");
  el.className = "min-h-screen bg-bg flex justify-center p-2 md:p-6";

  el.innerHTML = `
    <div class="w-full max-w-full">
      <div class="flex gap-2 items-center mb-2">
        <a href="#/listing/${listing.id}">
          ${listing.media?.[0] ? `<img src="${listing.media[0].url}" alt="${listing.title}" class="w-20 h-20 rounded object-cover" />` : ""}
        </a>
        <div>
          <p class="text-2xl capitalize">${listing.title}</p>
          <p id="highestBid" class="text-sm text-text/70">Highest bid: ${highestBid}$</p>
        </div>
      </div>

      <div id="alert-container"></div>

      <!-- Owner message -->
      ${
        isOwner
          ? `
        <div class="alert alert-info">
          <i class="fa-solid fa-circle-info"></i>
          <p>
            You are the owner. You cannot bid on your own item.
          </p>
        </div>`
          : ""
      }

      <ul id="bids" class="mt-5 max-h-70 overflow-y-auto bg-surface text-text rounded">
        ${
          bids.length === 0
            ? `<li class="p-2 text-text/70"><p>No bids yet</p></li>`
            : bids
                .sort((a, b) => Number(a.amount) - Number(b.amount))
                .map(
                  (bid) => `
                    <li class="p-4" data-bid-id="${bid.id}">
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

      <div id="typing-indicator" class="text-sm italic text-text/70 mb-2"></div>

      <!-- Only show bid input & button if user is NOT the owner -->
      ${
        !isOwner
          ? `
      <div class="flex justify-end items-center gap-2 mt-4">
        <div class="flex flex-col flex-1 gap-1">
          <input id="bidInput" type="number" min="1" step="1" placeholder="Enter bid..." class="p-2 flex-1 rounded bg-surface text-text/80"/>
          <p id="bidWarning" class="text-sm text-red-600 hidden"></p>
        </div>
        <button id="bidBtn" class="flex items-center gap-2 rounded bg-primary py-2 px-2 cursor-pointer hover:bg-secondary disabled:bg-accent/70 disabled:cursor-not-allowed">
          <i class="fa-solid fa-gavel text-lg text-bg"></i>
          <p class="font-display text-bg capitalize">bid</p>
        </button>
      </div>`
          : ""
      }
    </div>
  `;

  const bidList = el.querySelector<HTMLUListElement>("#bids")!;
  const highestEl = el.querySelector<HTMLParagraphElement>("#highestBid");
  const typingIndicator =
    el.querySelector<HTMLDivElement>("#typing-indicator")!;
  const alertContainer = el.querySelector<HTMLDivElement>("#alert-container")!;
  const bidBtn = el.querySelector<HTMLButtonElement>("#bidBtn");
  const bidInput = el.querySelector<HTMLInputElement>("#bidInput");
  const bidWarning = el.querySelector<HTMLParagraphElement>("#bidWarning");

  function updateCreditsDisplay() {
    renderNavbar();
    attachNavbarEventListeners();
  }

  function createBidElement(bid: Bid, isMine: boolean): HTMLLIElement {
    const li = document.createElement("li");
    li.className = "p-4";
    li.setAttribute("data-bid-id", bid.id);
    li.innerHTML = `
      <div class="border-l-2 pl-2 ${isMine ? "border-primary bg-primary/10" : "border-tertiary"}">
        <p class="${isMine ? "text-primary font-bold" : "text-tertiary"}">
          ${isMine ? "You" : bid.bidder.name}
        </p>
        <p>${bid.amount}$</p>
      </div>
    `;
    return li;
  }

  function scrollBidList() {
    bidList.scrollTo({
      top: bidList.scrollHeight,
      behavior: "smooth",
    });
  }

  requestAnimationFrame(() => {
    scrollBidList();
  });

  // join socket room
  socket.emit("join-auction", listingId);

  // USER BID LOGIC (only if not owner)
  if (!isOwner && bidBtn && bidInput && bidWarning) {
    let typingTimeout: number;

    bidInput.addEventListener("input", () => {
      const amount = Number(bidInput.value);
      let valid = true;
      let message = "";

      if (!Number.isFinite(amount) || amount <= 0) {
        valid = false;
        message = "Please enter a valid bid amount.";
      } else if (amount <= highestBid) {
        valid = false;
        message = `Bid must be higher than ${highestBid}$!`;
      } else if (
        bids.some(
          (b) => b.bidder.name === username && Number(b.amount) === amount,
        )
      ) {
        valid = false;
        message = "You already placed this exact amount.";
      } else if (amount > getCredits(username)) {
        valid = false;
        message = "You do not have enough credits.";
      }

      bidBtn.disabled = !valid;
      bidWarning.textContent = message;
      bidWarning.classList.toggle("hidden", valid);

      socket.emit("typing", listingId);
      clearTimeout(typingTimeout);
      typingTimeout = window.setTimeout(
        () => socket.emit("stop-typing", listingId),
        1500,
      );
    });

    bidBtn.addEventListener("click", async () => {
      if (auctionEnded) {
        showAlert(
          alertContainer,
          "info",
          "Auction has ended. You cannot place more bids.",
        );
        return;
      }

      const amount = Number(bidInput.value);
      if (
        !Number.isFinite(amount) ||
        amount <= highestBid ||
        amount > getCredits(username) ||
        bids.some(
          (b) => b.bidder.name === username && Number(b.amount) === amount,
        )
      ) {
        showAlert(alertContainer, "warning", "Invalid bid.");
        return;
      }

      bidBtn.disabled = true;

      try {
        const savedBid = await createBid(listingId, amount);

        // subtract credits only after permanent save
        subtractCredits(username, amount);
        updateCreditsDisplay();
        pendingBidAmount = amount;

        // Append bid instantly for this user
        const li = createBidElement(savedBid, true);
        bidList.appendChild(li);
        scrollBidList();

        socket.emit("new-bid", {
          listingId,
          amount,
          bidder: currentUser,
          id: savedBid.id,
        });
        bidInput.value = "";
      } catch (err) {
        console.error(err);
        showAlert(
          alertContainer,
          "warning",
          "Failed to place bid. Credits not deducted.",
        );
      } finally {
        bidBtn.disabled = false;
      }
    });
  }

  // SOCKET EVENTS (same as before)
  socket.on("bid-update", (bid: Bid) => {
    if (bidList.querySelector(`[data-bid-id="${bid.id}"]`)) return;

    bids.push(bid);
    const isMine = bid.bidder.name === username;
    bidList.appendChild(createBidElement(bid, isMine));

    highestBid = Math.max(highestBid, Number(bid.amount));
    if (highestEl) highestEl.textContent = `Highest bid: ${highestBid}$`;

    const empty = bidList.querySelector("li p");
    if (empty?.textContent.includes("No bids yet"))
      empty.parentElement?.remove();

    scrollBidList();
  });

  socket.on(
    "auction-ended",
    ({
      listingId,
      winner,
      losers,
    }: {
      listingId: string;
      winner: Bid;
      losers: Bid[];
    }) => {
      auctionEnded = true;
      showAlert(
        alertContainer,
        "success",
        `Auction ended. ${winner.bidder.name} won ${listing.title}`,
      );

      bidBtn?.setAttribute("disabled", "true");
      bidInput?.setAttribute("disabled", "true");

      addCredits(winner.bidder.name, Number(winner.amount));
      losers.forEach((b) => addCredits(b.bidder.name, Number(b.amount)));
      updateCreditsDisplay();

      localStorage.setItem(`auction-ended-${listingId}`, "true");
    },
  );

  socket.on(
    "user-typing",
    () => (typingIndicator.textContent = "Someone is bidding…"),
  );
  socket.on("user-stop-typing", () => (typingIndicator.textContent = ""));

  socket.on("bid-rejected", (msg: string) => {
    showAlert(alertContainer, "warning", msg);
    if (pendingBidAmount) {
      addCredits(username, pendingBidAmount);
      pendingBidAmount = null;
      updateCreditsDisplay();
    }
  });

  return el;
}
