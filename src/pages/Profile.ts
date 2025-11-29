import { getProfile, updateProfile } from "../services/profiles";
import { getCredits } from "../utils/credits";
import { fetchListings } from "../services/listings";
import { showAlert } from "../utils/alerts";
import type { Listing, Profile } from "../types";
import { renderNavbar } from "../main";

export default async function Profile(): Promise<HTMLElement> {
  const element = document.createElement("div");
  element.className = "profile-page";

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  if (!user?.name) {
    element.innerHTML =
      "<p class='text-center mt-8'>Please log in to view your profile.</p>";
    return element;
  }

  let userProfile: Profile;
  let userListings: Listing[] = [];
  let userBids: Listing[] = [];
  let userWins: Listing[] = [];

  try {
    userProfile = await getProfile(user.name);

    const allListings: Listing[] = await fetchListings();
    userListings = allListings.filter(
      (l: Listing) => l.seller?.name === user.name,
    );

    userBids = allListings.filter((l: Listing) =>
      l.bids?.some((bid) => bid.bidder?.name === user.name),
    );

    userWins = allListings.filter((l) => userProfile.wins?.includes(l.id));
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
        if (userListings.length === 0) {
          return "<p class='text-text/70 text-center py-8'>No active listings yet.</p>";
        }
        return `
          <div class="grid gap-4">
            ${userListings
              .map(
                (listing) => `
              <div class="border rounded-lg p-4">
                <div class="flex gap-4">
                  ${
                    listing.media?.[0]
                      ? `
                    <img src="${listing.media[0].url}" alt="${listing.title}" 
                         class="w-24 h-24 object-cover rounded" />
                  `
                      : ""
                  }
                  <div class="flex-1">
                    <h3>${listing.title}</h3>
                    <p class="text-text/70 text-sm mt-1">${listing.description?.substring(0, 100) || ""}...</p>
                    <div class="flex justify-between items-center mt-2">
                      <span class="text-priary font-bold">${listing.bids?.length || 0} bids</span>
                      <span class="text-sm text-text/70">Ends: ${new Date(listing.endsAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            `,
              )
              .join("")}
          </div>
        `;

      case "Bids":
        if (userBids.length === 0) {
          return "<p class='text-text/70 text-center py-8'>No active bids yet.</p>";
        }
        return `
          <div class="grid gap-4">
            ${userBids
              .map((listing) => {
                const userBid = listing.bids
                  ?.filter((b) => b.bidder?.name === user.name)
                  .sort((a, b) => b.amount - a.amount)[0];
                const highestBid = listing.bids?.sort(
                  (a, b) => b.amount - a.amount,
                )[0];
                const isWinning = userBid?.amount === highestBid?.amount;

                return `
                <div class="border rounded-lg p-4 ${isWinning ? "border-green-500" : ""}">
                  <div class="flex gap-4">
                    ${
                      listing.media?.[0]
                        ? `
                      <img src="${listing.media[0].url}" alt="${listing.title}" 
                           class="w-24 h-24 object-cover rounded" />
                    `
                        : ""
                    }
                    <div class="flex-1">
                      <div class="flex justify-between items-start">
                        <h3>${listing.title}</h3>
                        ${isWinning ? '<span class="bg-green-500 text-text text-xs px-2 py-1 rounded">Winning</span>' : ""}
                      </div>
                      <p class="text-text/70 text-sm mt-1">Your bid: <strong>${userBid?.amount || 0} credits</strong></p>
                      <p class="text-text/70 text-sm">Highest bid: <strong>${highestBid?.amount || 0} credits</strong></p>
                      <span class="text-sm text-text/70 block mt-2">Ends: ${new Date(listing.endsAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              `;
              })
              .join("")}
          </div>
        `;

      case "Wins":
        if (userWins.length === 0) {
          return "<p class='text-text/70 text-center py-8'>No wins yet. Keep bidding!</p>";
        }
        return `
          <div class="grid gap-4">
            ${userWins
              .map(
                (listing) => `
              <div class="border border-green-500 rounded-lg p-4">
                <div class="flex gap-4">
                  ${
                    listing.media?.[0]
                      ? `
                    <img src="${listing.media[0].url}" alt="${listing.title}" 
                         class="w-24 h-24 object-cover rounded" />
                  `
                      : ""
                  }
                  <div class="flex-1">
                    <div class="flex justify-between items-start">
                      <h3">${listing.title}</h3>
                      <span class="bg-green-500 text-text text-xs px-2 py-1 rounded">Won</span>
                    </div>
                    <p class="text-text/70 text-sm mt-1">${listing.description?.substring(0, 100) || ""}...</p>
                    <p class="text-primary font-bold mt-2">
                      Won for: ${listing.bids?.sort((a, b) => b.amount - a.amount)[0]?.amount || 0} credits
                    </p>
                  </div>
                </div>
              </div>
            `,
              )
              .join("")}
          </div>
        `;

      default:
        return "<p class='text-text/70'>Select a tab to view content.</p>";
    }
  };

  element.innerHTML = `
    <div id="alert-container"></div>
    <!-- Banner --> 
    <div class="h-60"> 
        <img src="${userProfile.banner?.url}" alt="Banner" class="w-full h-full object-cover" />
    s</div>
    <div class="-mt-20">
        <!-- Centered container -->
        <div class="w-full px-4 flex flex-col gap-8 py-8">

        <div class="shrink-0 md:w-80 mx-auto">   <!-- <— add mx-auto to keep it centered -->
            <div class="relative w-32 h-32 mx-auto">
            <img src="${userProfile.avatar?.url || user.avatar || "no image"}" alt="Avatar" class="border-4 border-bg rounded-full w-full h-full object-cover" />
            <button id="edit-profile-btn" class="absolute items-center h-8 w-8 bottom-0 right-0 bg-primary text-text text-sm rounded-full hover:bg-secondary transition">
                <i class="fa-solid fa-pen"></i>
            </button>
        </div>

        <h2 class="text-center">${userProfile.name}</h2>

        ${
          userProfile.bio
            ? `
        <p class="mt-4 text-center text-text/70 italic">"${userProfile.bio}"</p>
        `
            : ""
        }

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

    <div class="w-full bg-surface rounded-sm p-6 flex flex-col">   <!-- <— full width now -->
        <div class="border-b border-accent flex gap-4 mb-6 overflow-x-auto">
            ${tabs
              .map(
                (tab) => `
                <button data-tab="${tab}" class="tab-button pb-2 px-4 whitespace-nowrap transition cursor-pointer ${
                  tab === activeTab
                    ? "border-b-2 border-primary text-primary font-semibold"
                    : "text-accent hover:text-primary"
                }"> ${tab}
                </button>
            `,
              )
              .join("")}
        </div>

        <div id="tab-content">
            ${renderTabContent(activeTab)}
        </div>
    </div>
  `;

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

      if (tabContent) {
        tabContent.innerHTML = renderTabContent(tab);
      }
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
                <button type="button" class="cancel-edit-btn w-full rounded-md bg-accent px-3 py-1.5 font-display text-text capitalize hover:bg-surface hover:cursor-pointer">cancel</button>
                <button type="submit" class="w-full rounded-md bg-primary px-3 py-1.5 font-display font-semibold text-bg capitalize hover:bg-secondary hover:cursor-pointer">save</button>
            </div>
        </form>
        <button class="close-modal-btn absolute top-2 right-2 text-text text-xl hover:cursor-pointer">
            <i class="fa-solid fa-xmark"></i>
        </button>
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
  modal
    .querySelector(".close-modal-btn")
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
