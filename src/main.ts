import "./styles/style.css";
import { router } from "./router";
import Navbar, { attachNavbarEventListeners } from "./components/Navbar";
import Footer from "./components/Footer";
import { flash } from "./utils/flash";
import { showAlert } from "./utils/alerts";

// Initialize the app
async function App() {
  // Render Navbar container
  const navbarContainer = document.createElement("div");
  navbarContainer.id = "navbar";
  document.body.prepend(navbarContainer);

  // Render footer container
  const footerContainer = document.createElement("div");
  footerContainer.id = "footer-container";
  document.body.appendChild(footerContainer);

  // Create main app container
  let app = document.getElementById("app");
  if (!app) {
    app = document.createElement("div");
    app.id = "app";
    document.body.appendChild(app);
  }

  // Initial render
  await renderApp();
}

// Render Navbar
export function renderNavbar() {
  const navbarContainer = document.getElementById("navbar");
  if (!navbarContainer) return;

  const currentRoute = window.location.hash;
  const authRoutes = ["#/login", "#/register"];

  if (authRoutes.includes(currentRoute)) {
    navbarContainer.innerHTML = "";
    navbarContainer.style.display = "none";
    return;
  }

  navbarContainer.style.display = "block";
  navbarContainer.innerHTML = Navbar();
  attachNavbarEventListeners();
}

// Render footer
function renderFooter() {
  const footerContainer = document.getElementById("footer-container");
  if (!footerContainer) return;

  footerContainer.innerHTML = Footer();
}

// Render router and handle flash messages
async function renderApp() {
  await router();

  const app = document.getElementById("app");
  if (app && flash.message && flash.type) {
    const alertContainer =
      app.querySelector<HTMLDivElement>("#alert-container");
    if (alertContainer) {
      showAlert(alertContainer, flash.type, flash.message);
      flash.message = null;
      flash.type = null;
    }
  }

  renderNavbar();
  renderFooter();
}

// Hashchange listener
window.addEventListener("hashchange", async () => {
  await renderApp();
});

// Initialize app on window load
window.addEventListener("load", async () => {
  await App();
});
