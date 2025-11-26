import { getCurrentUser } from "../services/auth";
import { fetchListings } from "../services/listings";
import { createListingCard } from "../components/ListingCard";
import { showAlert } from "../utils/alerts";
import type { Listing } from "../types/index";

export default function Home(): HTMLDivElement {
  const element = document.createElement("div");

  element.innerHTML = `
    <div class="max-w-full overflow-hidden">
      <section class="w-full min-h-screen px-4 sm:px-6 py-10 bg-bg flex justify-center">
        <div class="max-w-7xl w-full mx-auto flex flex-col">

          <!-- Alert Container -->
          <div id="alert-container" class="mb-6"></div>

          <!-- Search Bar -->
          <div class="w-full mb-6">
            <div class="flex flex-col sm:flex-row gap-3 sm:items-center">
              <input
                id="home-search"
                type="text"
                placeholder="Search for items..."
                class="w-full px-4 py-3 rounded-xl border border-accent text-text/80 shadow-md focus:outline-none focus:ring-2 focus:ring-primary transition"
              />
            </div>
          </div>

          <!-- Listings -->
          <div id="listings" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-6">
            Loading listings...
          </div>

          <!-- Pagination -->
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

  // Render user status
  const user = getCurrentUser();
  if (!user) {
    showAlert(alertContainer, "info", "Login to bid on items!");
  }

  // Determine items per page dynamically based on screen width
  function getItemsPerPage(): number {
    const width = window.innerWidth;
    if (width < 700) return 6; // mobile
    if (width < 1024) return 9; // medium screens
    return 12; // large screens
  }

  // Store scroll handler to remove it later
  let scrollHandler: (() => void) | null = null;
  let isLoading = false;

  async function render(query?: string) {
    listingsContainer.innerHTML = "Loading…";
    pagination.innerHTML = "";

    // Remove previous scroll handler if exists
    if (scrollHandler) {
      window.removeEventListener("scroll", scrollHandler);
      scrollHandler = null;
    }

    try {
      const listings: Listing[] = await fetchListings(
        query ? { q: query, active: true } : { active: true },
      );

      if (listings.length === 0) {
        showAlert(alertContainer, "warning", "No listings found.");
        listingsContainer.innerHTML = "";
        return;
      }

      const isMobile = window.innerWidth < 640;
      let currentPage = 1;
      const itemsPerPage = getItemsPerPage();
      const totalPages = Math.ceil(listings.length / itemsPerPage);

      function renderPage(page: number) {
        currentPage = page;
        listingsContainer.innerHTML = "";
        const start = (page - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const pageItems = listings.slice(start, end);
        pageItems.forEach((item) =>
          listingsContainer.appendChild(createListingCard(item)),
        );

        if (!isMobile) renderPaginationControls();

        // Scroll to top on page change
        window.scrollTo({ top: 0, behavior: "smooth" });
      }

      function renderPaginationControls() {
        pagination.innerHTML = "";

        const addButton = (page: number) => {
          const btn = document.createElement("button");
          btn.innerHTML = page.toString();
          btn.className =
            "px-3 py-1 transition-all " +
            (page === currentPage
              ? "text-primary text-xl"
              : "text-accent text-md cursor-pointer hover:text-secondary");
          btn.onclick = () => renderPage(page);
          pagination.appendChild(btn);
        };

        const addEllipsis = () => {
          const span = document.createElement("span");
          span.textContent = "...";
          span.className = "px-3 py-1 text-accent text-md";
          pagination.appendChild(span);
        };

        // Prev button (icon only)
        const prevBtn = document.createElement("button");
        prevBtn.innerHTML = `<i class="fa-solid fa-arrow-left-long"></i>`;
        prevBtn.disabled = currentPage === 1;
        prevBtn.className =
          "px-3 py-1 text-xl text-accent capitalize cursor-pointer disabled:cursor-default disabled:opacity-50";
        prevBtn.onclick = () => renderPage(currentPage - 1);
        pagination.appendChild(prevBtn);

        // Page buttons with folding logic
        let hasLeftEllipsis = false;
        let hasRightEllipsis = false;

        for (let page = 1; page <= totalPages; page++) {
          if (
            page <= 2 ||
            page > totalPages - 2 ||
            (page >= currentPage - 2 && page <= currentPage + 2)
          ) {
            addButton(page);
          } else if (page < currentPage && !hasLeftEllipsis) {
            addEllipsis();
            hasLeftEllipsis = true;
          } else if (page > currentPage && !hasRightEllipsis) {
            addEllipsis();
            hasRightEllipsis = true;
          }
        }

        // Next button (icon only)
        const nextBtn = document.createElement("button");
        nextBtn.innerHTML = `<i class="fa-solid fa-arrow-right-long"></i>`;
        nextBtn.disabled = currentPage === totalPages;
        nextBtn.className =
          "px-3 py-1 text-xl text-accent capitalize cursor-pointer disabled:cursor-default disabled:opacity-50";
        nextBtn.onclick = () => renderPage(currentPage + 1);
        pagination.appendChild(nextBtn);
      }

      // --- Mobile infinite scroll ---
      if (isMobile) {
        pagination.style.display = "none";
        let currentMobilePage = 1;

        const loadMore = () => {
          if (isLoading || currentMobilePage > totalPages) return;

          isLoading = true;
          const start = (currentMobilePage - 1) * itemsPerPage;
          const end = start + itemsPerPage;
          const pageItems = listings.slice(start, end);

          pageItems.forEach((item) =>
            listingsContainer.appendChild(createListingCard(item)),
          );
          currentMobilePage++;
          isLoading = false;
        };

        // Clear and load first page
        listingsContainer.innerHTML = "";
        loadMore();

        // Create and store scroll handler
        scrollHandler = () => {
          const scrollPosition = window.scrollY + window.innerHeight;
          const documentHeight = document.documentElement.scrollHeight;

          // Load more when user is within 300px of bottom
          if (
            scrollPosition >= documentHeight - 300 &&
            !isLoading &&
            currentMobilePage <= totalPages
          ) {
            loadMore();
          }
        };

        window.addEventListener("scroll", scrollHandler);
      } else {
        pagination.style.display = "flex";
        renderPage(1);
      }
    } catch (error) {
      const err = error as Error;
      showAlert(
        alertContainer,
        "error",
        `Error loading listings: ${err.message}`,
      );
      listingsContainer.innerHTML = "";
    }
  }

  // --- SEARCH ---
  const debouncedSearch = debounce((query: string) => render(query), 300);
  searchInput.addEventListener("input", (e) => {
    debouncedSearch((e.target as HTMLInputElement).value.trim());
  });

  function debounce<Args extends unknown[]>(
    func: (...args: Args) => void,
    wait = 300,
  ) {
    let timeout: number | undefined;

    return (...args: Args) => {
      if (timeout !== undefined) clearTimeout(timeout);
      timeout = window.setTimeout(() => func(...args), wait);
    };
  }

  render();
  return element;
}
