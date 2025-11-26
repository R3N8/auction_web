import { login } from "../services/auth";
import { flash } from "../utils/flash";
import type { LoginData } from "../types/index";
import { renderNavbar } from "../main";
import { showAlert } from "../utils/alerts";

export default async function Login() {
  const element = document.createElement("div");

  element.innerHTML = `
      <div class="min-h-screen w-full flex items-center justify-center">
        <div class="sm:mx-auto sm:w-full sm:max-w-sm">
            <div class="text-center mb-6">
                <h1 class="font-display text-3xl capitalize">welcome back!</h1>
                <p class="text-text/50 font-body text-l capitalize-first-letter">login to your account to continue bidding</p>
            </div>
            <div id="alert-container" class="mb-4"></div>
            <form id="loginForm" class="space-y-6">
                <input type="email" id="login-email" placeholder="name.example@stud.noroff.no" required class="block w-full rounded-md bg-surface px-3 py-1.5 text-base text-text font-body outline-1 -outline-offset-1 outline-accent placeholder:text-text/50 focus:outline-2 focus:-outline-offset-2 focus:outline-primary sm:text-sm/6"/>
                <input type="password" id="login-password" placeholder="pass needs 8 chars and numbers" required class="block w-full rounded-md bg-surface px-3 py-1.5 text-base text-text font-body outline-1 -outline-offset-1 outline-accent placeholder:text-text/50 focus:outline-2 focus:-outline-offset-2 focus:outline-primary sm:text-sm/6"/>
                
                <div class="flex justify-between gap-4">
                    <button type="button" id="cancelBtn" class="flex w-full justify-center rounded-md bg-accent px-3 py-1.5 font-display text-text capitalize hover:bg-surface hover:cursor-pointer">cancel</button>
                    <button type="submit" class="flex w-full justify-center rounded-md bg-primary px-3 py-1.5 font-display font-semibold text-bg capitalize hover:bg-secondary hover:cursor-pointer">login</button>
                </div>
            </form>
        </div>
      </div>
    `;
  const alertContainer =
    element.querySelector<HTMLDivElement>("#alert-container")!;
  const cancelBtn = element.querySelector("#cancelBtn")!;
  const form = element.querySelector<HTMLFormElement>("#loginForm")!;

  cancelBtn.addEventListener("click", () => {
    window.location.hash = "#/";
  });

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const emailEl = element.querySelector<HTMLInputElement>("#login-email")!;
    const passwordEl =
      element.querySelector<HTMLInputElement>("#login-password")!;

    const data: LoginData = {
      email: emailEl.value.trim(),
      password: passwordEl.value.trim(),
    };

    const email = emailEl.value.trim();
    const password = passwordEl.value.trim();

    if (!email || !password) {
      showAlert(alertContainer, "error", "All fields are required");
      return;
    }

    const noroffEmailPattern = /^[a-zA-Z]+\.[a-zA-Z]+@stud\.noroff\.no$/;
    if (!noroffEmailPattern.test(email)) {
      showAlert(
        alertContainer,
        "error",
        "Email must be in the format firstname.lastname@stud.noroff.no",
      );
      return;
    }

    if (password.length < 8) {
      showAlert(
        alertContainer,
        "error",
        "Password must be at least 8 charachters",
      );
      return;
    }

    try {
      await login(data);
      flash.message = "Login successful!";
      flash.type = "success";
      window.location.hash = "#/";
      renderNavbar();
    } catch (error) {
      showAlert(alertContainer, "error", (error as Error).message);
    }
  });

  return element;
}
