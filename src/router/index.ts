import Home from "../pages/Home";
import Login from "../pages/Login";
import Register from "../pages/Register";

// All pages can return string or Promise<string>
const routes: Record<
  string,
  () => string | HTMLElement | Promise<string | HTMLElement>
> = {
  "#/": Home,
  "#/login": Login,
  "#/register": Register,
};

function normalizePath(hash: string): string {
  if (!hash || hash === "#") return "#/";
  return hash.split("?")[0];
}

export async function router() {
  // Get the current path from the URL hash
  const rawHash = window.location.hash;
  const path = normalizePath(rawHash);

  const page = routes[path] || Home;
  const result = await page();

  const app = document.getElementById("app")!;
  app.innerHTML = "";

  // Append result based on its type
  if (typeof result === "string") {
    app.innerHTML = result;
    // Added type check for HTMLElement
  } else if (result instanceof HTMLElement) {
    app.appendChild(result);
    // Fallback for unexpected types
  } else {
    throw new Error("Invalid page result");
  }
}

// Listen to hash changes and load the appropriate page
window.addEventListener("hashchange", router);
window.addEventListener("load", router);
