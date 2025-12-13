import type { Listing } from "../types";

export function createListingModal(options: {
  mode: "create" | "edit";
  listing?: Listing;
  onSubmit: (data: {
    title: string;
    description?: string;
    media?: { url: string; alt: string }[];
    endsAt: string;
  }) => void;
}) {
  const { mode, listing, onSubmit } = options;

  const modal = document.createElement("div");
  modal.className =
    "fixed inset-0 bg-bg flex justify-center items-center hidden z-50 p-4";

  modal.innerHTML = `
    <div class="bg-bg rounded-sm p-6 w-full max-w-sm sm:max-w-md mx-auto relative">
      <h2 class="text-center mb-4">${mode === "create" ? "Create Listing" : "Edit Listing"}</h2>
      <form class="listing-form flex flex-col gap-4">
        <label>
          <p>Title:</p>
          <input name="title" required value="${listing?.title || ""}" class="block w-full rounded-md bg-surface text-text px-3 py-1.5"/>
        </label>
        <label>
          <p>Description:</p>
          <textarea name="description" class="block w-full rounded-md bg-surface text-text px-3 py-1.5">${listing?.description || ""}</textarea>
        </label>
        <label>
          <p>Image URL:</p>
          <input name="image" value="${listing?.media?.[0]?.url || ""}" class="block w-full rounded-md bg-surface text-text px-3 py-1.5"/>
        </label>
        <label>
          <p>Ends at:</p>
          <input type="datetime-local" name="endsAt" value="${listing?.endsAt ? new Date(listing.endsAt).toISOString().slice(0, 16) : ""}" required class="block w-full rounded-md bg-surface text-text px-3 py-1.5"/>
        </label>
        <div class="flex gap-4 mt-4">
          <button type="button" class="cancel-btn w-full rounded bg-accent text-text px-3 py-1.5 capitalize hover:bg-surface">Cancel</button>
          <button type="submit" class="w-full rounded bg-primary text-bg px-3 py-1.5 capitalize">${mode === "create" ? "Create" : "Save"}</button>
        </div>
      </form>
      <button class="close-btn absolute top-2 right-2 text-xl">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>
  `;

  document.body.appendChild(modal);

  const submitBtn = modal.querySelector<HTMLButtonElement>(
    "button[type='submit']",
  )!;
  const form = modal.querySelector<HTMLFormElement>(".listing-form")!;
  const closeModal = () => modal.classList.add("hidden");

  modal.querySelector(".cancel-btn")?.addEventListener("click", closeModal);
  modal.querySelector(".close-btn")?.addEventListener("click", closeModal);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    submitBtn.disabled = true;
    const originalText = submitBtn.textContent;
    submitBtn.innerHTML = `
      <span class="mr-2 inline-block w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></span>
      ${mode === "create" ? "Creating..." : "Saving..."}
    `;

    const formData = new FormData(form);

    const data = {
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || undefined,
      endsAt: new Date(formData.get("endsAt") as string).toISOString(),
      media: formData.get("image")
        ? [{ url: formData.get("image") as string, alt: "listing image" }]
        : [],
    };

    try {
      await onSubmit(data);
      closeModal();
    } catch {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });

  return modal;
}
