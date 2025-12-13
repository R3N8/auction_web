import {
  getProfile,
  updateProfile,
  getProfileListings,
  getProfileBids,
  getProfileWins,
} from "../services/profiles";
import {
  getListingById,
  updateListing,
  deleteListing,
} from "../services/listings";
import { createListingModal } from "../components/ListingModal";
import { getCredits } from "../utils/credits";
import { showAlert } from "../utils/alerts";
import type { Listing, Profile, Bid } from "../types";
import { renderNavbar } from "../main";
import { getHighestBid } from "../utils/getHighestBid";

export default async function Profile(): Promise<HTMLElement> {
  const element = document.createElement("div");
  element.className = "profile-page";

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  if (!user?.name) {
    element.innerHTML = `
      <div class="min-h-screen flex flex-col items-center justify-center">
        <div class="alert-info w-full max-w-3xl mx-auto mt-8">
          <i class="fa-solid fa-circle-info"></i>
          <p>Please log in to view your profile and manage your listings and bids.</p>
        </div>
      </div>
    `;
    return element;
  }

  let userProfile: Profile;
  let userListings: Listing[] = [];
  let userBids: (Bid & { listing?: Listing })[] = [];
  let userWins: Listing[] = [];

  try {
    userProfile = await getProfile(user.name);

    userListings = await getProfileListings(user.name);
    userBids = await getProfileBids(user.name);
    userWins = await getProfileWins(user.name);
  } catch (err) {
    console.error(err);
    element.innerHTML =
      "<p class='text-center mt-8 text-red-500'>Failed to load profile. Please try again.</p>";
    return element;
  }

  const winAmount = userProfile.wins?.length || 0;
  const credits = getCredits(user.name);

  let activeTab = "Listings";
  const tabs: string[] = ["Listings", "Bids", "Wins"];

  const getExperienceLevel = (profile: Profile): string => {
    const wins = profile.wins?.length || 0;
    if (wins >= 50) return "Master Bidder";
    if (wins >= 20) return "Expert Bidder";
    if (wins >= 5) return "Experienced Bidder";
    return "Novice Bidder";
  };

  const renderTabContent = (tab: string): string => {
    switch (tab) {
      case "Listings":
        if (userListings.length === 0)
          return "<p class='text-text/70 text-center py-8'>No active listings yet.</p>";
        return `
          <div class="grid gap-4">
            ${userListings
              .map((listing) => {
                const highestBid = getHighestBid(listing);

                return `
              <div class="bg-accent rounded-lg p-4 relative">
                <div class="absolute top-1 right-1 flex justify-end gap-2">
                  <button title="edit" data-action="edit" data-id="${listing.id}" class="p-2 rounded text-text text-lg cursor-pointer hover:text-primary">
                    <i class="fa-regular fa-pen-to-square"></i>
                  </button>

                  <button title="delete" data-action="delete" data-id="${listing.id}" class="p-2 rounded text-text text-lg cursor-pointer hover:text-primary">
                    <i class="fa-solid fa-trash-can"></i>
                  </button>
                </div>

                <div class="flex items-end justify-baseline gap-4">
                  <a href="#/listing/${listing.id}">
                    ${listing.media?.[0] ? `<img src="${listing.media[0].url}" alt="${listing.title}" class="w-24 h-24 object-cover rounded" />` : ""}
                  </a>
                    <div class="flex-1">
                    <p class="text-xl font-semibold capitalize">${listing.title}</p>
                    <div class="flex justify-between items-center mt-2">
                      <span class="text-text">${highestBid !== null ? `${highestBid} $` : "No bids"}</span>
                      <span class="text-sm text-text/70">Ends: ${new Date(listing.endsAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            `;
              })
              .join("")}
          </div>
        `;
      case "Bids": {
        if (userBids.length === 0)
          return "<p class='text-text/70 text-center py-8'>No active bids yet.</p>";

        const listingsMap = new Map<string, Listing>();
        userBids.forEach((bid) => {
          if (bid.listing) listingsMap.set(bid.listing.id, bid.listing);
        });
        const uniqueListings = Array.from(listingsMap.values());

        return `
          <div class="grid gap-4">
            ${uniqueListings
              .map((listing) => {
                if (!listing) return "";

                // All bids user made on this listing
                const bidsOnListing = userBids.filter(
                  (b) => b.listing?.id === listing.id,
                );

                // User's highest bid
                const userBidObj = bidsOnListing.sort(
                  (a, b) => Number(b.amount) - Number(a.amount),
                )[0];
                const userBid = userBidObj ? Number(userBidObj.amount) : 0;

                // Highest bid among all bids (use your getHighestBid util if you have it)
                const highestBid = bidsOnListing.length
                  ? Math.max(...bidsOnListing.map((b) => Number(b.amount)))
                  : 0;

                const auctionEnded = new Date(listing.endsAt) <= new Date();

                let borderClass = "border-bg";
                let statusTag = "Ended";

                if (!auctionEnded) {
                  if (userBid === highestBid && userBid > 0) {
                    borderClass = "border-green-500";
                    statusTag = "Winning";
                  } else {
                    borderClass = "border-orange-500";
                    statusTag = "Losing";
                  }
                }

                return `
                  <div class="border-2 ${borderClass} rounded-lg p-4 bg-accent">
                    <div class="flex gap-4">
                      <a href="#/listing/${listing.id}">
                        ${
                          listing.media?.[0]
                            ? `<img src="${listing.media[0].url}" alt="${listing.title}" class="w-24 h-24 object-cover rounded" />`
                            : ""
                        }
                      </a>
                      <div class="flex-1">
                        <div class="flex justify-between items-start">
                          <h3>${listing.title}</h3>
                          <span class="text-xs px-2 py-1 rounded ${
                            auctionEnded
                              ? "bg-bg text-text"
                              : userBid === highestBid
                                ? "bg-green-500 text-text"
                                : "bg-orange-500 text-text"
                          }">${statusTag}</span>
                        </div>
                        <p>Your bid: ${userBid} $</p>
                        <p>Highest bid: ${highestBid} $</p>
                        <p class="text-end text-sm text-text/70 block mt-1">Ends: ${new Date(
                          listing.endsAt,
                        ).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                `;
              })
              .join("")}
          </div>
        `;
      }
      case "Wins":
        if (userWins.length === 0)
          return "<p class='text-text/70 text-center py-8'>No wins yet. Keep bidding!</p>";

        return `
          <div class="grid gap-4">
            ${userWins
              .map((listing) => {
                const winningBid =
                  listing.bids && listing.bids.length
                    ? Math.max(...listing.bids.map((b) => Number(b.amount)))
                    : 0;

                return `
                  <div class="bg-accent rounded-lg p-4">
                    <a href="#/listing/${listing.id}">
                      <div class="flex gap-4">
                        ${
                          listing.media?.[0]
                            ? `<img src="${listing.media[0].url}" alt="${listing.title}" class="w-24 h-24 object-cover rounded" />`
                            : ""
                        }
                        <p class="text-xl font-semibold mt-2">
                          Won for: ${winningBid} $
                        </p>
                      </div>
                    </a>
                  </div>
                `;
              })
              .join("")}
          </div>
        `;
      default:
        return "<p class='text-text/70'>Select a tab to view content.</p>";
    }
  };

  // ... The rest of your modal and edit form code stays exactly the same

  element.innerHTML = `
    <div id="alert-container"></div>
    <div class="h-60">
        <img src="${userProfile.banner?.url}" alt="Banner" class="w-full h-full object-cover" />
    </div>
    <div class="-mt-20">
        <div class="w-full px-4 flex flex-col gap-8 py-8">
          <div class="shrink-0 md:w-80 mx-auto">
            <div class="relative w-32 h-32 mx-auto">
              <img src="${userProfile.avatar?.url || user.avatar || "no image"}" alt="Avatar" class="border-4 border-bg rounded-full w-full h-full object-cover" />
              <button id="edit-profile-btn" class="absolute items-center h-8 w-8 bottom-0 right-0 bg-primary text-text text-sm cursor-pointer rounded-full hover:bg-secondary transition">
                <i class="fa-solid fa-pen"></i>
              </button>
            </div>
            <h2 class="text-center">${userProfile.name}</h2>
            ${userProfile.bio ? `<p class="mt-4 text-center text-text/70 italic">"${userProfile.bio}"</p>` : ""}
            <p class="mt-4 font-bold text-center text-primary">${getExperienceLevel(userProfile)}</p>
            <div class="flex justify-around mt-6 text-center cursor-default">
              <div>
                <p class="font-bold text-2xl">${userListings.length}</p>
                <p class="text-text/70 text-sm">Listings</p>
              </div>
              <div>
                <p class="font-bold text-2xl">${winAmount}</p>
                <p class="text-text/70 text-sm">Wins</p>
              </div>
              <div>
                <p class="font-bold text-2xl">${credits}</p>
                <p class="text-text/70 text-sm capitalize">credits</p>
              </div>
            </div>
          </div>
          <div class="w-full bg-surface rounded-sm p-6 flex flex-col">
            <div class="border-b border-accent flex gap-4 mb-6 overflow-x-auto">
              ${tabs
                .map(
                  (tab) => `
                <button data-tab="${tab}" class="tab-button pb-2 px-4 whitespace-nowrap transition cursor-pointer ${tab === activeTab ? "border-b-2 border-primary text-primary font-semibold" : "text-accent hover:text-primary"}"> ${tab}</button>
              `,
                )
                .join("")}
            </div>
            <div id="tab-content">${renderTabContent(activeTab)}</div>
          </div>
        </div>
    </div>
  `;
  // Edit & Delete Btns
  document.addEventListener("click", async (e) => {
    const target = e.target as HTMLElement;
    const btn = target.closest(
      "button[data-action]",
    ) as HTMLButtonElement | null;
    if (!btn) return;

    const action = btn.dataset.action;
    const id = btn.dataset.id;
    if (!action || !id) return;

    // Edit
    if (action === "edit") {
      const listing = await getListingById(id, true, true);

      const editModal = createListingModal({
        mode: "edit",
        listing,
        onSubmit: async (data) => {
          try {
            await updateListing(id, data);
            showAlert(alertContainer, "success", "Listing updated!");
            location.reload(); // or re-render instead
          } catch {
            showAlert(alertContainer, "error", "Failed to update listing");
          }
        },
      });

      editModal.classList.remove("hidden");
    }

    // Delete
    if (action === "delete") {
      if (!confirm("Are you sure you want to delete this item?")) return;

      try {
        await deleteListing(id);
        showAlert(alertContainer, "success", "Listing deleted successfully!");
        location.reload();
      } catch {
        showAlert(alertContainer, "error", "Failed to delete listing.");
      }
    }
  });

  // Tab switching logic stays the same
  const alertContainer =
    element.querySelector<HTMLDivElement>("#alert-container")!;
  const tabButtons = element.querySelectorAll<HTMLButtonElement>(".tab-button");
  const tabContent = element.querySelector<HTMLDivElement>("#tab-content");

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const tab = button.getAttribute("data-tab");
      if (!tab) return;
      activeTab = tab;
      tabButtons.forEach((btn) => {
        btn.classList.remove(
          "border-b-2",
          "border-primary",
          "text-primary",
          "font-semibold",
        );
        btn.classList.add("text-accent");
      });
      button.classList.add(
        "border-b-2",
        "border-primary",
        "text-primary",
        "font-semibold",
      );
      button.classList.remove("text-accent");
      if (tabContent) tabContent.innerHTML = renderTabContent(tab);
    });
  });

  // Pop-Up for editing profile
  const modal = document.createElement("div");
  modal.id = "edit-profile-modal";
  modal.className =
    "fixed inset-0 bg-bg flex justify-center items-center hidden z-50 p-4";
  modal.innerHTML = `
    <div class="bg-bg rounded-sm p-6 w-full max-w-sm sm:max-w-md mx-auto">
        <h2 class="text-center">edit profile</h2>
        <form class="edit-profile-form flex flex-col gap-4">
            <label>
                <p>Bio:</p>
                <textarea name="bio" class="block w-full rounded-md bg-surface px-3 py-1.5 text-base text-text font-body outline-1 -outline-offset-1 outline-accent placeholder:text-text/50 focus:outline-2 focus:-outline-offset-2 focus:outline-primary sm:text-sm/6">${userProfile.bio || ""}</textarea>
            </label>
            <label>
                <p>Avatar URL:</p>
                <input type="text" name="avatar" value="${userProfile.avatar?.url || ""}" class="block w-full rounded-md bg-surface px-3 py-1.5 text-base text-text font-body outline-1 -outline-offset-1 outline-accent placeholder:text-text/50 focus:outline-2 focus:-outline-offset-2 focus:outline-primary sm:text-sm/6"/>
            </label>
            <label>
                <p>Banner URL:</p>
                <input type="text" name="banner" value="${userProfile.banner?.url || ""}" class="block w-full rounded-md bg-surface px-3 py-1.5 text-base text-text font-body outline-1 -outline-offset-1 outline-accent placeholder:text-text/50 focus:outline-2 focus:-outline-offset-2 focus:outline-primary sm:text-sm/6"/>
            </label>
            <div class="flex gap-4 mt-4">
                <button type="button" class="cancel-edit-btn w-full rounded-md bg-accent px-3 py-1.5 font-display text-text capitalize cursor-pointer hover:bg-surface">cancel</button>
                <button type="submit" class="w-full rounded-md bg-primary px-3 py-1.5 font-display font-semibold text-bg capitalize cursor-pointer hover:bg-secondary">save</button>
            </div>
        </form>
    </div>
  `;
  document.body.appendChild(modal);

  // Edit profile btn
  const editBtn = element.querySelector<HTMLButtonElement>("#edit-profile-btn");
  editBtn?.addEventListener("click", () => {
    modal.classList.remove("hidden");
  });

  // Close modal
  const closeModal = () => modal.classList.add("hidden");
  modal
    .querySelector(".cancel-edit-btn")
    ?.addEventListener("click", closeModal);

  // Form Submission
  const form = modal.querySelector<HTMLFormElement>(".edit-profile-form");
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const updatedProfile = {
      bio: formData.get("bio") as string,
      avatar: {
        url: formData.get("avatar") as string,
        alt: userProfile.avatar?.alt || "",
      },
      banner: {
        url: formData.get("banner") as string,
        alt: userProfile.banner?.alt || "",
      },
    };

    try {
      await updateProfile(updatedProfile);

      // Merge the new data into userProfile
      userProfile = { ...userProfile, ...updatedProfile };

      // Update avatar/banner in profile page
      const avatarEl =
        element.querySelector<HTMLImageElement>("img[alt='Avatar']");
      if (avatarEl) avatarEl.src = updatedProfile.avatar.url;

      const bannerEl =
        element.querySelector<HTMLImageElement>("img[alt='Banner']");
      if (bannerEl) bannerEl.src = updatedProfile.banner.url;

      const bioEl =
        element.querySelector<HTMLParagraphElement>("p.mt-4.italic");
      if (bioEl) bioEl.textContent = `"${updatedProfile.bio}"`;

      // ⚡ Update localStorage user object so Navbar sees new avatar
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem(
        "user",
        JSON.stringify({
          ...storedUser,
          avatar: updatedProfile.avatar,
          banner: updatedProfile.banner,
          bio: updatedProfile.bio,
        }),
      );

      renderNavbar(); // now navbar will read the updated avatar
      showAlert(alertContainer, "success", "Profile updated successfully!");
      closeModal();
    } catch {
      showAlert(alertContainer, "error", "Failed to upload profile");
    }
  });

  return element;
}
