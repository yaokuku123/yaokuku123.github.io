import {
  escapeHtml as e,
  searchField,
  tableOfContents,
  missingPage,
} from "../lib/html.js";

export function filterPosts(posts, category = "全部", tag = "", query = "") {
  return posts.filter(post => (category === "全部" || post.category === category) &&
    (!tag || (post.tags || []).includes(tag)) &&
    `${post.title} ${post.desc} ${post.category} ${(post.tags || []).join(" ")} ${post.searchText}`.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => (b.date || "").localeCompare(a.date || "") || (a.order || 0) - (b.order || 0) || a.slug.localeCompare(b.slug));
}
function postTags(post) {
  return (post.tags || []).length ? `<div class="post-tags">${post.tags.map(tag => `<span class="post-tag"># ${e(tag)}</span>`).join("")}</div>` : "";
}
export function writingPage(posts) {
  const tags = [...new Set(posts.flatMap(post => post.tags || []))];
  const categories = ["全部", ...new Set(posts.map((post) => post.category))];
  return `<section class="page"><h1 class="writing-heading">Writing · 学习笔记</h1><div class="phase-line" aria-hidden="true"><img src="assets/reference/writing-moon-phases-1200.webp" alt=""></div>${searchField("搜索文章、主题或关键词")}<div class="collection-heading"><h2>Writing <span style="margin-left:10px">学习与记录</span></h2><span>THOUGHTS IN ORBIT</span></div><div class="tabs" role="group" aria-label="文章分类">${categories.map((category, index) => `<button data-filter="${e(category)}" class="${index === 0 ? "selected" : ""}" aria-pressed="${index === 0}">${e(category)}</button>`).join("")}</div><div class="tabs tag-filters" role="group" aria-label="文章标签"><button data-tag="" class="selected" aria-pressed="true">全部标签</button>${tags.map(tag => `<button data-tag="${e(tag)}" aria-pressed="false">${e(tag)}</button>`).join("")}</div><div id="post-list" aria-live="polite"></div><div class="course-banner"><div><div class="eyebrow">THE ARCHITECTURE FIELDNOTES</div><h3>路人 · 架构实战学习计划</h3><p>从一个具体问题开始，理解代码背后的通用思路。</p></div><a class="gold-button" href="#/course">浏览全部课时 ↗</a></div><div class="collection-foot"><span>${posts.length} 篇笔记</span><span>持续学习，逐步归档。</span></div></section>`;
}
export function mountWriting(root, posts) {
  let category = "全部",
    query = "", tag = "";
  const controller = new AbortController();
  function update() {
    const items = filterPosts(posts, category, tag, query);
    root.querySelector("#post-list").innerHTML = items.length
      ? items
          .map(
            (post) =>
              `<a class="writing-row" href="#/writing/${encodeURIComponent(post.slug)}"><div class="row-copy"><span class="row-kicker">${e(post.label)} · ${e(post.type)}</span><h2>${e(post.title)}</h2><p>${e(post.desc)}</p>${postTags(post)}</div><div class="row-meta">${e(post.dateLabel)}<span>${e(post.minutes)}</span></div><span class="row-arrow">↗</span></a>`,
          )
          .join("")
      : '<p class="empty">暂时没有匹配的笔记，试试其他关键词。</p>';
    root.querySelectorAll("[data-filter]").forEach((button) => {
      const selected = button.dataset.filter === category;
      button.classList.toggle("selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    root.querySelectorAll("[data-tag]").forEach(button => {
      const selected = button.dataset.tag === tag;
      button.classList.toggle("selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
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
    "click",
    (event) => {
      const tagButton = event.target.closest("[data-tag]");
      if (tagButton) { tag = tagButton.dataset.tag; update(); }
      const button = event.target.closest("[data-filter]");
      if (button) {
        category = button.dataset.filter;
        update();
      }
    },
    { signal: controller.signal },
  );
  update();
  return () => controller.abort();
}
export function articlePage(posts, slug) {
  const post = posts.find((post) => post.slug === slug);
  if (!post) return missingPage();
  return `<section class="page article-layout"><article class="article"><a class="eyebrow text-link" href="#/writing">← BACK TO WRITING</a><h1>${e(post.title)}</h1><p class="article-deck">${e(post.desc)}</p><div class="article-meta"><span>YORICK / 姚启钧</span><span>${e(post.label)}</span><span>${e(post.type)} · ${e(post.minutes)}</span></div>${postTags(post)}<div class="article-body">${post.html}</div><div class="collection-foot"><a class="text-link" href="#/course">浏览课程目录 →</a><a class="text-link" href="#/writing">返回全部笔记</a></div></article>${tableOfContents(post.sections)}</section>`;
}
