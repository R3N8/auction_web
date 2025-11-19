import "./styles/style.css";
import { router } from "./router";
import Navbar, { attachNavbarEventListeners } from "./components/Navbar";

//localStorage.removeItem("user"); // Clear invalid user data once at startup

function App() {
  // Render Navbar
  const navbarContainer = document.createElement("div");
  navbarContainer.id = "navbar";
  document.body.prepend(navbarContainer);

  // Create main app container
  let app = document.getElementById("app");
  if (!app) {
    app = document.createElement("div");
    app.id = "app";
    document.body.appendChild(app);
  }

  // Initial render
  renderNavbar();
  router();
}

// Function to render the Navbar
export function renderNavbar() {
  const navbarContainer = document.getElementById("navbar");
  if (!navbarContainer) return;

  // Remove/hide Navbar on auth routes
  const currentRoute = window.location.hash;
  const authRoutes = ["#/login", "#/register"];

  if (authRoutes.includes(currentRoute)) {
    navbarContainer.innerHTML = ""; // Clear Navbar on auth routes
    navbarContainer.style.display = "none";
    return;
  }

  navbarContainer.style.display = "block";
  navbarContainer.innerHTML = Navbar();
  attachNavbarEventListeners(); // Attach logout event listener
}

// Handle hash changes for routing
window.addEventListener("hashchange", () => {
  router();
  renderNavbar();
});

// Initialize the app on window load
window.addEventListener("load", () => {
  App();
});
