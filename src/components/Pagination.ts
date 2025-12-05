import type { PaginationProps } from "../types";

export function createPagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps): HTMLDivElement {
  const pagination = document.createElement("div");
  pagination.className = "flex justify-center mt-10 gap-2 overflow-x-auto";

  const addButton = (page: number) => {
    const btn = document.createElement("button");
    btn.innerHTML = page.toString();
    btn.className =
      "px-3 py-1 transition-all " +
      (page === currentPage
        ? "text-primary text-xl"
        : "text-accent text-md cursor-pointer hover:text-secondary");
    btn.onclick = () => onPageChange(page);
    pagination.appendChild(btn);
  };

  const addEllipsis = () => {
    const span = document.createElement("span");
    span.textContent = "...";
    span.className = "px-3 py-1 text-accent text-md";
    pagination.appendChild(span);
  };

  // Prev button
  const prevBtn = document.createElement("button");
  prevBtn.innerHTML = `<i class="fa-solid fa-arrow-left-long"></i>`;
  prevBtn.disabled = currentPage === 1;
  prevBtn.className =
    "px-3 py-1 text-xl text-accent capitalize cursor-pointer disabled:cursor-default disabled:opacity-50";
  prevBtn.onclick = () => onPageChange(currentPage - 1);
  pagination.appendChild(prevBtn);

  // Page numbers with folding/ellipsis
  let hasLeftEllipsis = false;
  let hasRightEllipsis = false;

  for (let page = 1; page <= totalPages; page++) {
    if (
      page <= 2 ||
      page > totalPages - 2 ||
      (page >= currentPage - 2 && page <= currentPage + 2)
    ) {
      addButton(page);
    } else if (page < currentPage && !hasLeftEllipsis) {
      addEllipsis();
      hasLeftEllipsis = true;
    } else if (page > currentPage && !hasRightEllipsis) {
      addEllipsis();
      hasRightEllipsis = true;
    }
  }

  // Next button
  const nextBtn = document.createElement("button");
  nextBtn.innerHTML = `<i class="fa-solid fa-arrow-right-long"></i>`;
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.className =
    "px-3 py-1 text-xl text-accent capitalize cursor-pointer disabled:cursor-default disabled:opacity-50";
  nextBtn.onclick = () => onPageChange(currentPage + 1);
  pagination.appendChild(nextBtn);

  return pagination;
}
