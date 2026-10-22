import {
  escapeHtml as e,
  pageHead,
  searchField,
  missingPage,
} from "../lib/html.js";
import { articlePage } from "./writing.js";
function topic(title) {
  if (/MQ|消息/.test(title)) return "消息队列";
  if (/线程|并发|Semaphore|CompletableFuture|超卖/.test(title))
    return "并发编程";
  if (
    /MySQL|MySql|MyBatis|Redis|数据|事务|分库|分表|余额|支付|BigDecimal|幂等/.test(
      title,
    )
  )
    return "数据与事务";
  return "工程实践";
}
function firstArticleLink(posts) {
  const post = posts.find((post) => post.lesson !== undefined);
  return post
    ? `<a class="gold-button" href="#/writing/${encodeURIComponent(post.slug)}">阅读学习样章 ↗</a>`
    : "";
}
export function coursePage(posts) {
  return `<section class="page">${pageHead("ARCHITECTURE FIELDNOTES", "一课一题，慢慢吃透。", "从路人甲Java的实战案例出发，学习并发、微服务与性能优化背后的设计思想。")}<div class="course-banner"><div><div class="eyebrow">HOW WE LEARN</div><h3>案例 → 思路 → 实现 → 边界</h3><p>先建立直觉，再走进代码，最后把方案讲给别人听。</p></div>${firstArticleLink(posts)}</div><div class="filters-bar">${searchField("搜索课时、Redis、MQ、事务…")}<select aria-label="按主题筛选课程" id="course-topic">${["全部主题", "并发编程", "消息队列", "数据与事务", "工程实践"].map((value) => `<option>${value}</option>`).join("")}</select></div><p class="course-summary" id="course-summary"></p><div id="course-list" class="course-list"></div></section>`;
}
export function mountCourse(root, lessons, posts) {
  let query = "",
    category = "全部主题";
  const controller = new AbortController();
  function update() {
    const items = lessons.filter(
      (lesson) =>
        (category === "全部主题" || topic(lesson.title) === category) &&
        `${lesson.id} ${lesson.title}`.toLowerCase().includes(query),
    );
    root.querySelector("#course-summary").textContent =
      `本地目录 ${lessons.length} 篇文档 · 当前显示 ${items.length} 篇`;
    root.querySelector("#course-list").innerHTML = items.length
      ? items
          .map(
            (lesson) =>
              `<a class="writing-row" href="#/lesson/${encodeURIComponent(lesson.key)}"><span class="course-number">${String(lesson.id).padStart(2, "0")}</span><div class="row-copy"><h2>${e(lesson.title)}</h2><p>${topic(lesson.title)}${lesson.module ? " · 配套代码" : " · 文档专题"}</p></div><span class="row-meta">${posts.some((post) => String(post.lesson) === lesson.key) ? "查看笔记" : "待学习"}</span><span class="row-arrow">→</span></a>`,
          )
          .join("")
      : '<p class="empty">没有匹配的课程。</p>';
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
      if (event.target.id === "course-topic") {
        category = event.target.value;
        update();
      }
    },
    { signal: controller.signal },
  );
  update();
  return () => controller.abort();
}
export function lessonPage(lessons, posts, key) {
  const post = posts.find((post) => String(post.lesson) === key);
  if (post) return articlePage(posts, post.slug);
  const lesson = lessons.find((lesson) => lesson.key === key);
  if (!lesson) return missingPage();
  return `<section class="page article"><a class="eyebrow text-link" href="#/course">← ALL LESSONS</a><h1>${e(lesson.title)}</h1><div class="article-meta"><span>LESSON ${String(lesson.id).padStart(3, "0")}</span><span>${topic(lesson.title)}</span><span>待学习</span></div><div class="article-body"><h2>这一课，等我们一起展开。</h2><p>课程原文与配套材料已经收录到学习索引。正式学习时，我们会先用一个生活案例明确问题，再讨论方案、代码、边界与面试表达。</p><div class="notice">原始文档：${e(lesson.document)}<br>${lesson.module ? `配套模块：${e(lesson.module)}` : "此专题没有独立 lesson 模块，请以原文引用为准。"}<br>${lesson.note ? e(lesson.note) + "<br>" : ""}材料来自本地 luren-master；这里暂未发布原课全文。</div><p>${firstArticleLink(posts)}</p></div></section>`;
}
