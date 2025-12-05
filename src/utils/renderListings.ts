import { createListingCard } from "../components/ListingCard";
import type { Listing } from "../types";

export function renderListings(listings: Listing[], container: HTMLDivElement) {
  container.innerHTML = "";
  listings.forEach((listing) =>
    container.appendChild(createListingCard(listing)),
  );
}
