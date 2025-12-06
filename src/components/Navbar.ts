import { renderNavbar } from "../main";
import { getCurrentUser, logout } from "../services/auth";
import { ensureCreditsForUser } from "../utils/credits";

export default function Navbar(): string {
  const user = getCurrentUser();
  const credits = user ? ensureCreditsForUser(user.name) : 0;

  if (!user) {
    return `
      <nav>
        <div class="bg-bg px-6 py-4 flex justify-end gap-4">
          <a href="#/register" class="px-4 py-2 rounded-md border border-accent text-muted capitalize cursor-pointer hover:text-text hover:bg-accent transition-all">
            Register
          </a>
          <a href="#/login" class="px-4 py-2 rounded-md bg-tertiary capitalize cursor-pointer hover:bg-primary transition-all">
            Login
          </a>
        </div>
      </nav>
    `;
  }

  return `
  <nav class="bg-bg w-full z-50 relative">
    <div class="py-4 px-2 sm:px-6 flex flex-wrap items-center justify-between">

      <!-- Links --> 
      <div class="hidden sm:flex items-center text-text font-body text-xl capitalize"> 
        <a href="#/" class="mr-6"> 
          <p class="text-xl hover:underline decoration-primary">Home</p> 
        </a> 
        <span class="mr-6 cursor-default">about</span> 
        <a href="#/profile" class="mr-6"> 
          <p class="text-xl hover:underline decoration-primary">Profile</p> 
        </a> 
        <span class="cursor-default">contact</span> 
      </div>

      <!-- Profile widget -->
      <div id="profile-widget" class="relative flex flex-row-reverse md:flex-row items-center gap-2 cursor-pointer select-none min-w-0">
        <div class="text-text font-body text-2xl truncate"><span class="text-primary">${credits}</span> $</div>
        <p class="text-2xl font-semibold">|</p>
        <img src="${user.avatar?.url}" alt="${user.avatar?.alt || user.name}" class="w-10 h-10 bg-accent rounded-full object-cover shrink-0">

        <div id="profile-dropdown" class="absolute left-0 top-full mt-1 w-36 bg-surface rounded hidden z-50">
          <div class="flex flex-col">
            <button type="button" aria-label="Settings" class="px-4 py-3 rounded-md text-muted capitalize hover:text-text hover:bg-accent transition-all flex items-center gap-2">
              <i class="fa-solid fa-gear"></i>
              <div>settings</div>
            </button>
            <button id="widget-logout-btn" type="button" aria-label="Log out" class="px-4 py-3 rounded-md text-muted capitalize cursor-pointer hover:text-text hover:bg-accent transition-all flex items-center gap-2">
              <i class="fa-solid fa-arrow-right-from-bracket"></i>
              <div>log out</div>
            </button>
          </div>
        </div>
      </div>

      <!-- Hamburger (mobile only) -->
      <button id="nav-toggle" type="button" class="sm:hidden text-2xl text-text" aria-label="Open Menu">
        <i class="fa-solid fa-bars"></i>
      </button>

      <!-- Full-screen mobile menu -->
      <div id="mobile-menu" class="fixed top-0 left-0 w-full h-full bg-bg z-50 flex flex-col -translate-x-full transition-transform duration-500 ease-in-out">

        <!-- Close button -->
        <div class="flex justify-end p-6">
          <button id="menu-close" type="button" class="text-2xl text-text" aria-label="Close Menu">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <!-- Menu links -->
        <div class="flex flex-col items-start justify-start gap-3 px-4 text-xl text-text font-body">
          <a href="#/">Home</a>
          <span>About</span>
          <a href="#/profile">Profile</a>
          <span>Contact</span>
        </div>

        <!-- Logout button at bottom -->
        <div>
          <button id="mobile-logout-btn" type="button" aria-label="Log out" class="px-4 py-3 rounded-md text-muted capitalize hover:text-text hover:bg-accent transition-all flex items-center gap-2">
            <i class="fa-solid fa-arrow-right-from-bracket"></i>
            <div>log out</div>
          </button>
        </div>
      </div>

    </div>
  </nav>
  `;
}

export function attachNavbarEventListeners() {
  const navToggle = document.getElementById("nav-toggle");
  const mobileMenu = document.getElementById("mobile-menu");
  const menuClose = document.getElementById("menu-close");
  const mobileLogoutBtn = document.getElementById("mobile-logout-btn");
  const profileWidget = document.getElementById("profile-widget");
  const profileDropDown = document.getElementById("profile-dropdown");
  const widgetLogoutBtn = document.getElementById("widget-logout-btn");

  // Prevent menu click from closing itself
  mobileMenu?.addEventListener("click", (e) => e.stopPropagation());

  // Toggle mobile menu
  if (navToggle && mobileMenu) {
    navToggle.addEventListener("click", () => {
      mobileMenu.classList.toggle("-translate-x-full");
      mobileMenu.classList.toggle("translate-x-0");
    });
  }

  // Close button
  if (menuClose && mobileMenu) {
    menuClose.addEventListener("click", () => {
      mobileMenu.classList.add("-translate-x-full");
      mobileMenu.classList.remove("translate-x-0");
    });
  }

  // Logout button
  if (mobileLogoutBtn) {
    mobileLogoutBtn.addEventListener("click", () => {
      mobileMenu?.classList.add("-translate-x-full");
      mobileMenu?.classList.remove("translate-x-0");
      logout();
      renderNavbar();
      window.location.hash = "#/";
    });
  }

  // Close menu on outside click
  document.addEventListener("click", (e) => {
    if (
      mobileMenu &&
      !mobileMenu.contains(e.target as Node) &&
      !navToggle?.contains(e.target as Node)
    ) {
      mobileMenu.classList.add("-translate-x-full");
      mobileMenu.classList.remove("translate-x-0");
    }
  });

  profileWidget?.addEventListener("click", (e) => {
    e.stopPropagation();
    profileDropDown?.classList.toggle("hidden");
  });

  widgetLogoutBtn?.addEventListener("click", () => {
    logout();
    renderNavbar();
    window.location.hash = "#/";
  });

  // Close dropdown if clicking outside
  document.addEventListener("click", () => {
    profileDropDown?.classList.add("hidden");
  });
}
