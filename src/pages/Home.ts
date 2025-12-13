import { getCurrentUser } from "../services/auth";
import { fetchListings, getListingById } from "../services/listings";
import { createListingCard } from "../components/ListingCard";
import { createPagination } from "../components/Pagination";
import { getHighestBid } from "../utils/getHighestBid";
import { showAlert } from "../utils/alerts";
import type { Listing, FetchListingsParams } from "../types/index";
import { API } from "../api/constants";
import { authHeaders } from "../services/apiKey";

export default function Home(): HTMLDivElement {
  const element = document.createElement("div");

  element.innerHTML = `
    <div class="max-w-full overflow-hidden">
      <section class="w-full min-h-screen px-4 sm:px-6 py-10 bg-bg flex justify-center">
        <div class="max-w-7xl w-full mx-auto flex flex-col">
          <div id="alert-container" class="mb-6"></div>
          
          <div class="w-full mb-6">
            <div class="flex flex-col sm:flex-row gap-3 sm:items-center">
              <input
                id="home-search"
                type="text"
                placeholder="Search for items..."
                class="flex-1 min-w-0 px-4 py-3 rounded-md border border-accent text-text/80 transition"
              />
              <div class="flex flex-row justify-between gap-3 items-center">
                <button id="create-listing" class="flex items-center gap-2 rounded cursor-pointer bg-primary px-4 py-2 text-text capitalize hover:bg-secondary transition">
                  <i class="fa-solid fa-circle-plus"></i>
                  <p>create</p>
                </button>
                <button id="sort-by-bids" class="flex items-center gap-2 rounded cursor-pointer bg-accent px-4 py-2 text-text capitalize hover:bg-surface transition">
                  <i class="fa-solid fa-up-down"></i>
                  <p>sort</p>
                </button>
              </div>
            </div>
          </div>

          <div id="listings" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-6">
            Loading listings...
          </div>

          <div id="pagination" class="flex justify-center mt-10 gap-2 overflow-x-auto"></div>
        </div>
      </section>
    </div>
  `;

  const alertContainer =
    element.querySelector<HTMLDivElement>("#alert-container")!;
  const listingsContainer = element.querySelector<HTMLDivElement>("#listings")!;
  const pagination = element.querySelector<HTMLDivElement>("#pagination")!;
  const searchInput = element.querySelector<HTMLInputElement>("#home-search")!;
  const createBtn =
    element.querySelector<HTMLButtonElement>("#create-listing")!;
  const sortBtn = element.querySelector<HTMLButtonElement>("#sort-by-bids")!;

  const user = getCurrentUser();
  if (!user) {
    showAlert(alertContainer, "info", "Login to bid on items!");
    createBtn.style.display = "none";
  }

  let allListings: Listing[] = [];
  let priceSort: "asc" | "desc" | null = null;

  function getItemsPerPage() {
    const width = window.innerWidth;
    if (width < 700) return 6;
    if (width < 1024) return 8;
    return 12;
  }

  function isListingActive(listing: Listing): boolean {
    return new Date(listing.endsAt).getTime() > Date.now();
  }

  let scrollHandler: (() => void) | null = null;
  let isLoading = false;

  function renderLocalOnly() {
    listingsContainer.innerHTML = "";
    const itemsPerPage = getItemsPerPage();
    const pageItems = allListings.slice(0, itemsPerPage);
    pageItems.forEach((item) =>
      listingsContainer.appendChild(createListingCard(item)),
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function render(query?: string) {
    listingsContainer.innerHTML = "Loading…";
    pagination.innerHTML = "";

    if (scrollHandler) {
      window.removeEventListener("scroll", scrollHandler);
      scrollHandler = null;
    }

    try {
      let all: Listing[] = [];

      if (query) {
        // Search: fetch page 1 only
        const params: FetchListingsParams = {
          q: query,
          _seller: true,
          _bids: true,
          page: 1,
        };
        const fetched = await fetchListings(params);
        all = Array.isArray(fetched) ? fetched : [];
      } else {
        // Normal load: fetch all pages
        let page = 1;
        let fetched: Listing[];
        do {
          const params: FetchListingsParams = {
            _seller: true,
            _bids: true,
            page,
          };
          fetched = await fetchListings(params);
          all = all.concat(fetched);
          page++;
        } while (fetched.length > 0);
      }

      allListings = all;

      // Ensure seller and bids exist
      allListings.forEach((listing) => {
        if (!listing.bids) listing.bids = [];
        if (!listing.seller)
          listing.seller = { name: "Unknown", email: "", wins: [] };
      });

      // SORT logic
      if (priceSort === "asc") {
        allListings.sort((a, b) => getHighestBid(a) - getHighestBid(b));
      } else if (priceSort === "desc") {
        allListings.sort((a, b) => getHighestBid(b) - getHighestBid(a));
      } else {
        allListings.sort((a, b) => {
          const aActive = isListingActive(a) ? 1 : 0;
          const bActive = isListingActive(b) ? 1 : 0;
          if (aActive !== bActive) return bActive - aActive;
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        });
      }

      if (!allListings.length) {
        showAlert(alertContainer, "warning", "No listings found.");
        listingsContainer.innerHTML = "";
        return;
      }

      const isMobile = window.innerWidth < 640;
      let currentPage = 1;
      const itemsPerPage = getItemsPerPage();
      const totalPages = Math.ceil(allListings.length / itemsPerPage);

      function renderPage(page: number) {
        currentPage = page;
        listingsContainer.innerHTML = "";
        const start = (page - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        allListings
          .slice(start, end)
          .forEach((item) =>
            listingsContainer.appendChild(createListingCard(item)),
          );

        if (!isMobile) {
          pagination.innerHTML = "";
          pagination.appendChild(
            createPagination({
              currentPage,
              totalPages,
              onPageChange: renderPage,
            }),
          );
        }

        window.scrollTo({ top: 0, behavior: "smooth" });
      }

      // --- MOBILE INFINITE SCROLL ---
      if (isMobile) {
        pagination.style.display = "none";
        let currentMobilePage = 1;

        const loadMore = () => {
          if (isLoading || currentMobilePage > totalPages) return;
          isLoading = true;
          const start = (currentMobilePage - 1) * itemsPerPage;
          const end = start + itemsPerPage;
          allListings
            .slice(start, end)
            .forEach((item) =>
              listingsContainer.appendChild(createListingCard(item)),
            );
          currentMobilePage++;
          isLoading = false;
        };

        listingsContainer.innerHTML = "";
        loadMore();

        scrollHandler = () => {
          const scrollPosition = window.scrollY + window.innerHeight;
          const documentHeight = document.documentElement.scrollHeight;
          if (scrollPosition >= documentHeight - 300) loadMore();
        };
        window.addEventListener("scroll", scrollHandler);
      }

      // --- SEARCH RESULTS (no pagination) ---
      if (query) {
        pagination.style.display = "none";
        listingsContainer.innerHTML = "";
        allListings.forEach((item) =>
          listingsContainer.appendChild(createListingCard(item)),
        );
        return; // stop here so normal pagination never runs
      }

      // --- NORMAL DESKTOP PAGINATION ---
      if (!isMobile) {
        pagination.style.display = "flex";
        renderPage(1);
      }
    } catch (error) {
      showAlert(alertContainer, "error", `Error: ${(error as Error).message}`);
      listingsContainer.innerHTML = "";
    }
  }

  // Search
  searchInput.addEventListener("input", (e) =>
    render((e.target as HTMLInputElement).value.trim()),
  );

  // Sort button
  sortBtn.addEventListener("click", () => {
    if (!priceSort) priceSort = "asc";
    else if (priceSort === "asc") priceSort = "desc";
    else priceSort = null;

    sortBtn.querySelector("p")!.textContent =
      priceSort === "asc"
        ? "low - high"
        : priceSort === "desc"
          ? "high - low"
          : "sort";

    render(searchInput.value.trim());
  });

  // Create Listing Modal
  const createModal: HTMLDivElement = document.createElement("div");
  createModal.id = "create-listing-modal";
  createModal.className =
    "fixed inset-0 bg-bg flex justify-center items-center hidden z-50 p-4";
  createModal.innerHTML = `
    <div class="bg-bg rounded-sm p-6 w-full max-w-sm sm:max-w-md mx-auto relative">
      <h2 class="text-center mg-4">create listing</h2>
      <form class="create-listing-form flex flex-col gap-4">
        <label><p>title:</p><input name="title" required class="block w-full rounded-md bg-surface text-text px-3 py-1.5"/></label>
        <label><p>description:</p><textarea name="description" class="block w-full rounded-md bg-surface text-text px-3 py-1.5"></textarea></label>
        <label><p>image URL:</p><input name="image" class="block w-full rounded-md bg-surface text-text px-3 py-1.5"/></label>
        <label><p>ends at:</p><input type="datetime-local" name="endsAt" required class="block w-full rounded-md bg-surface text-text px-3 py-1.5"/></label>
        <div class="flex gap-4 mt-4">
          <button type="button" class="cancel-create-btn w-full rounded cursor-pointer bg-accent text-text px-3 py-1.5 capitalize hover:bg-surface">cancel</button>
          <button type="submit" class="w-full rounded cursor-pointer bg-primary text-bg px-3 py-1.5 capitalize hover:bg-secondary">create</button>
        </div>
      </form>
      <button class="close-create-btn absolute top-2 right-2 text-xl">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>
  `;
  document.body.appendChild(createModal);
  const createForm: HTMLFormElement =
    createModal.querySelector<HTMLFormElement>(".create-listing-form")!;

  createBtn.addEventListener("click", () => {
    if (!user) {
      showAlert(
        alertContainer,
        "warning",
        "You must be logged in to create item.",
      );
      return;
    }

    createForm.reset();
    createModal.classList.remove("hidden");

    // Disable main create button while modal is open (optional)
    createBtn.disabled = true;
  });

  // 3️⃣ Close modal → re-enable main button
  const closeCreateModal = () => {
    createModal.classList.add("hidden");
    createBtn.disabled = false;
  };

  createModal
    .querySelector(".cancel-create-btn")
    ?.addEventListener("click", closeCreateModal);
  createModal
    .querySelector(".close-create-btn")
    ?.addEventListener("click", closeCreateModal);

  // 4️⃣ Form submission → show loading state, submit, handle response
  createForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const submitBtn = createForm.querySelector<HTMLButtonElement>(
      "button[type='submit']",
    )!;
    const originalText = submitBtn.textContent;

    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <span class="mr-2 inline-block w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></span>
      Creating...
    `;

    const formData = new FormData(createForm);
    const payload = {
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || undefined,
      endsAt: new Date(formData.get("endsAt") as string).toISOString(),
      tags: [],
      media: formData.get("image")
        ? [{ url: formData.get("image") as string, alt: "listing image" }]
        : [],
    };

    try {
      const headers = await authHeaders();
      const response = await fetch(`${API}/auction/listings`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok)
        throw new Error(`Failed to create listing: ${response.status}`);
      const result = await response.json();
      const listingId = result.data.id;

      const fullListing = await getListingById(listingId, true, true);
      allListings.unshift(fullListing);

      renderLocalOnly();
      showAlert(alertContainer, "success", "Listing created successfully!");
      createModal.classList.add("hidden");
      createBtn.disabled = false;
    } catch (err) {
      console.error(err);
      showAlert(alertContainer, "error", "Failed to create listing.");
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });

  render();
  return element;
}
