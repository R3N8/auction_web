import { DateTime } from "luxon";

export function startCountdown(element: HTMLElement, endsAt: DateTime) {
  function updateCountdown() {
    const now = DateTime.now();
    const diff = endsAt
      .diff(now, ["days", "hours", "minutes", "seconds"])
      .toObject();

    // Auction end
    if (diff.seconds! <= 0) {
      element.textContent = "Auction ended";
      element.style.color = "gray";
      return;
    }

    const hoursLeft = diff.days! * 24 + diff.hours!;
    element.style.color =
      hoursLeft > 72
        ? "green"
        : hoursLeft > 48
          ? "yellow"
          : hoursLeft > 0
            ? "red"
            : "gray";
    element.textContent = `${diff.days}d ${diff.hours}h ${diff.minutes}m ${Math.floor(diff.seconds!)}s`;

    requestAnimationFrame(updateCountdown);
  }

  updateCountdown(); // loop
}
