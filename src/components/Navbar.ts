import { renderNavbar } from "../main";
import { getCurrentUser, logout } from "../services/auth";
import { getCredits } from "../utils/credits";

export default function Navbar(): string {
  const user = getCurrentUser();
  if (!user) {
    return `
        <nav class="shadow-md">
            <!-- Top row -->
            <div class="bg-bg px-6 py-4 flex flex-wrap items-center justify-around">
                
                <!-- Logo -->
                <div class="font-display text-text mb-2 sm:mb-0">Auction Web</div>

                <!-- Search bar -->
                <div class="flex items-center space-x-2 mb-2 sm:mb-0">
                    <input id="q" type="text" placeholder="search your next item..." class="rounded-full border-2 border-accent px-4 py-2 w-auto focus:outline-none focus:ring-primary transition-all duration-300"/>
                </div>

                <!-- Auth links -->
                <div>
                    <a href="#/register" class="px-4 py-2 rounded-md text-text font-medium font-body capitalize bg-accent hover:bg-secondary hover:text-bg transition-all backdrop-blur-sm">register</a>
                    <a href="#/login" class="px-4 py-2 rounded-md bg-primary text-bg font-medium font-body capitalize hover:bg-accent hover:text-primary transition-all shadow-sm">login</a>
                </div>
            </div>

            <!-- Bottom row -->
            <div class="bg-surface px-6 py-2 border-t border-gray-200">
                <a href="#/" class="text-gray-700 hover:underline mr-6">Home</a>
            </div>
        </nav>
        `;
  }

  const credits = getCredits(user.name);
  return `
    <nav>
    <!-- Top row -->
        <div class="bg-bg px-6 py-4 flex flex-wrap items-center justify-around">
            <!-- Logo -->
            <div class="font-display text-text mb-2 sm:mb-0">Auction Web</div>

            <!-- Search bar -->
            <div class="flex items-center space-x-2 mb-2 sm:mb-0">
                <input id="navbar-search" type="text" placeholder="search your next item..." class="rounded-full border-2 border-accent px-4 py-2 w-auto focus:outline-none focus:ring-primary transition-all duration-300"/>
            </div>

            <!-- Create item -->
            <a href="#/create-item" class="text-text hover:underline">create item</a>

            <!-- User info and logout -->
            <div>
                <a href="#/credits" class="text-text hover:underline">credits: ${credits}</a>
                <img src="${user.avatarUrl}" alt="avatar" class="inline-block w-8 h-8 rounded-full ml-4 mr-2 align-middle"/>
                <button id="logoutBtn" class="px-4 py-2 rounded-md bg-primary text-bg font-medium hover:bg-accent transition-all">log out</button>
            </div>
        </div>

        <!-- Bottom Row -->
        <div class="bg-surface px-6 py-2 border-t border-gray-200">
            <a href="#/" class="text-gray-700 hover:underline mr-6">Home</a>
            <a href="#/profile" class="text-gray-700 hover:underline mr-6">Profile</a>
        </div>
    </nav>
    `;
}

export function attachNavbarEventListeners() {
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      logout();
      renderNavbar();
      window.location.hash = "#/";
    });
  }

  const searchInput = document.getElementById(
    "navbar-search",
  ) as HTMLInputElement | null;
  if (searchInput) {
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const query = searchInput.value.trim();
        window.location.hash = `#/search?q=${encodeURIComponent(query)}`;
      }
    });
  }
}
