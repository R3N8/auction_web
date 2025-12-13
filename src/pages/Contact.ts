import { renderNavbar } from "../main";

export default async function Contact() {
  const element = document.createElement("div");

  element.innerHTML = `
    <div class="min-h-screen w-full flex items-center justify-center px-4">
      <div class="sm:mx-auto sm:w-full sm:max-w-3xl">
        <div class="text-center mb-8">
          <h1>Contact</h1>
          <p class="text-text/70">
            We'd love to hear from you!
          </p>
        </div>
      </div>
    </div>
  `;

  renderNavbar();

  return element;
}
