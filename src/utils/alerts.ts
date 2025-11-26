import type { AlertType } from "../types";

const alertIcons: Record<AlertType, string> = {
  success: "fa-solid fa-circle-check",
  error: "fa-solid fa-circle-exclamation",
  warning: "fa-solid fa-triangle-exclamation",
  info: "fa-solid fa-circle-info",
};

export function showAlert(
  container: string | HTMLElement,
  type: AlertType,
  message: string,
) {
  let alertContainer: HTMLDivElement;

  if (typeof container === "string") {
    const el = document.querySelector<HTMLDivElement>(container);
    if (!el) return;
    alertContainer = el;
  } else {
    alertContainer = container as HTMLDivElement;
  }

  alertContainer.innerHTML = `
        <div class="alert alert-${type}">
            <i class="${alertIcons[type]}"></i>
            <p>${message}</p>
        </div>
    `;

  setTimeout(() => {
    alertContainer.innerHTML = "";
  }, 7000);
}
