import Home from "../pages/Home";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Profile from "../pages/Profile";
import Listing from "../pages/Listing";
import LiveBid from "../pages/LiveBid";

const routes: Record<
  string,
  (
    params?: Record<string, string>,
  ) => string | HTMLElement | Promise<string | HTMLElement>
> = {
  "#/": Home,
  "#/login": Login,
  "#/register": Register,
  "#/profile": Profile, // always your own profile
  "#/listing/:id": Listing,
  "#/livebid/:id": LiveBid,
};

function normalizePath(hash: string): string {
  if (!hash || hash === "#") return "#/";
  return hash.split("?")[0].replace(/\/$/, "");
}

// Match routes like "#/listing/id:"
function matchRoute(path: string) {
  for (const route in routes) {
    const routeParts = route.split("/");
    const pathParts = path.split("/");

    if (routeParts.length !== pathParts.length) continue;

    const params: Record<string, string> = {};
    let matched = true;

    for (let i = 0; i < routeParts.length; i++) {
      if (routeParts[i].startsWith(":")) {
        const paramName = routeParts[i].slice(1);
        params[paramName] = pathParts[i];
      } else if (routeParts[i] !== pathParts[i]) {
        matched = false;
        break;
      }
    }

    if (matched) return { route, params };
  }

  return { route: "#/", params: {} };
}

export async function router() {
  const rawHash = window.location.hash;
  const path = normalizePath(rawHash);
  const { route, params } = matchRoute(path);

  const page = routes[route];
  const result = await page(params);

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
