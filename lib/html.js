export function escapeHtml(value = "") {
  return String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ],
  );
}
export function pageHead(eyebrow, title, description) {
  return `<div class="page-head"><div class="eyebrow"><b>✦</b>${escapeHtml(eyebrow)}</div><h1>${escapeHtml(title)}</h1><p class="page-lead">${escapeHtml(description)}</p></div>`;
}
export function searchField(placeholder) {
  const label = escapeHtml(placeholder);
  return `<div class="search" role="search"><span aria-hidden="true">⌕</span><input type="search" name="q" aria-label="${label}" placeholder="${label}"><kbd>⌘ K</kbd></div>`;
}
export function tableOfContents(sections) {
  return `<aside class="article-toc"><div><b>ON THIS PAGE</b>${sections.map((section) => `<a href="#${section.id}" data-scroll="${section.id}">${escapeHtml(section.title)}</a>`).join("")}</div></aside>`;
}
export function missingPage() {
  return `<section class="page">${pageHead("404 / A LITTLE LOST", "这片星空还没有内容。", "可以回到首页，换一个方向继续探索。")}<a class="gold-button" href="#/">回到首页 →</a></section>`;
}
