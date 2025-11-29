import Home from "../pages/Home";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Profile from "../pages/Profile";

const routes: Record<
  string,
  () => string | HTMLElement | Promise<string | HTMLElement>
> = {
  "#/": Home,
  "#/login": Login,
  "#/register": Register,
  "#/profile": Profile, // always your own profile
};

function normalizePath(hash: string): string {
  if (!hash || hash === "#") return "#/";
  return hash.split("?")[0].replace(/\/$/, "");
}

export async function router() {
  const rawHash = window.location.hash;
  const path = normalizePath(rawHash);

  const routeKey =
    Object.keys(routes)
      .sort((a, b) => b.length - a.length)
      .find((route) => path.startsWith(route)) || "#/";

  const page = routes[routeKey];
  const result = await page();

  const app = document.getElementById("app")!;
  app.innerHTML = "";

  if (typeof result === "string") {
    app.innerHTML = result;
  } else if (result instanceof HTMLElement) {
    app.appendChild(result);
  } else {
    throw new Error("Invalid page result");
  }
}

// Hash listeners
window.addEventListener("hashchange", router);
window.addEventListener("load", router);
