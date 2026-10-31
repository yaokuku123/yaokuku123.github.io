import { escapeHtml as e, searchField } from "../lib/html.js";
import { startVisuals } from "../visuals.js";
export function ideasPage(ideas) {
  const categories = ["全部", ...new Set(ideas.map((idea) => idea.category))];
  const dates = [...new Set(ideas.map((idea) => idea.date))];
  const exampleLabel =
    ideas.length && ideas.every((idea) => idea.example)
      ? "示例内容"
      : `${ideas.length} 条记录`;
  return `<section class="ideas-page" aria-label="Ideas 灵感"><h1 class="writing-heading">Ideas · 灵感</h1><div class="ideas-singularity" aria-hidden="true"><img src="assets/reference/ideas-black-hole-overlay-v4.webp" alt=""><svg viewBox="0 0 380 250"><ellipse cx="190" cy="125" rx="175" ry="90"/><ellipse cx="190" cy="125" rx="145" ry="55"/></svg></div><div class="ideas-column"><div class="ideas-toolbar">${searchField("搜索灵感或关键词")}<select id="idea-date" aria-label="按日期筛选灵感"><option>全部日期</option>${dates.map((date) => `<option>${e(date)}</option>`).join("")}</select></div><div class="ideas-categories"><span>分类索引</span>${categories.map((category, index) => `<button data-idea-filter="${e(category)}" aria-pressed="${index === 0}" class="${index === 0 ? "selected" : ""}">${e(category)} <small>${index === 0 ? ideas.length : ideas.filter((idea) => idea.category === category).length}</small></button>`).join("")}<span class="ideas-demo-label">${e(exampleLabel)}</span></div><div class="ideas-thread"><svg aria-hidden="true" class="ideas-track"></svg><ol id="idea-list" aria-label="灵感时间线"></ol></div><div class="thread-end"><span>✧</span><p>To be continued.</p><small>让想法沿着时间，慢慢生长。</small></div></div></section>`;
}
export function mountIdeas(root, ideas) {
  let category = "全部",
    date = "全部日期",
    query = "";
  const controller = new AbortController();
  function update() {
    const items = ideas.filter(
      (idea) =>
        (category === "全部" || idea.category === category) &&
        (date === "全部日期" || idea.date === date) &&
        `${idea.title}${idea.searchText}${idea.category}`
          .toLowerCase()
          .includes(query),
    );
    root.querySelector("#idea-list").innerHTML = items.length
      ? items
          .map(
            (idea, index) =>
              `<li class="idea-entry"><div class="idea-stamp"><div><b>${String(index + 1).padStart(2, "0")}</b><span>${e(idea.category)}</span></div><time>${e(idea.date)}</time></div><details><summary><h2>${e(idea.title)}</h2><span class="idea-expand">↗</span></summary>${idea.html}</details></li>`,
          )
          .join("")
      : '<li class="empty">没有匹配的灵感，试试其他关键词。</li>';
    root.querySelectorAll("[data-idea-filter]").forEach((button) => {
      const selected = button.dataset.ideaFilter === category;
      button.classList.toggle("selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    startVisuals();
  }
  root.addEventListener(
    "input",
    (event) => {
      if (event.target.name === "q") {
        query = event.target.value.trim().toLowerCase();
        update();
      }
    },
    { signal: controller.signal },
  );
  root.addEventListener(
    "change",
    (event) => {
      if (event.target.id === "idea-date") {
        date = event.target.value;
        update();
      }
    },
    { signal: controller.signal },
  );
  root.addEventListener(
    "click",
    (event) => {
      const button = event.target.closest("[data-idea-filter]");
      if (button) {
        category = button.dataset.ideaFilter;
        update();
      }
    },
    { signal: controller.signal },
  );
  update();
  return () => controller.abort();
}
