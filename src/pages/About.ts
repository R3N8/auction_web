import { renderNavbar } from "../main";

export default async function About() {
  const element = document.createElement("div");

  element.innerHTML = `
    <div class="min-h-screen w-full flex items-center justify-center px-4">
      <div class="sm:mx-auto sm:w-full sm:max-w-3xl">
        <div class="text-center mb-8">
          <h1>About This Website</h1>
          <p class="text-text/70 text-lg mt-2">
            Learn how this auction platform works and what you can do as a user.
          </p>
        </div>

        <section class="mb-6">
          <h2>How It Works</h2>
          <p class="text-lg">
            This website is an online auction platform where users can register, log in, and manage listings. Only emails ending with <span class="font-semibold">@stud.noroff.no</span> can register.
          </p>
          <p class="text-lg mt-3">
            Registered users can create, update, and delete listings, place bids on items, and manage their profile with a custom avatar and bio. Your total credits are always visible for easy tracking of your bidding power.
          </p>
          <p class="text-lg mt-3">
            Unregistered visitors can browse and search listings, but must register to participate in bidding. The search feature lets you filter items by keywords, categories, or other attributes.
          </p>
        </section>
      </div>
    </div>
  `;

  renderNavbar();

  return element;
}
