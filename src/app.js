import { mountWechatContact } from "./components/wechat-contact.js";
import { homePage } from "./pages/home.js";
import { writingPage, mountWriting, articlePage } from "./pages/writing.js";
import { ideasPage, mountIdeas } from "./pages/ideas.js";
import { projectsPage, projectDetailPage } from "./pages/projects.js";
import { coursePage, mountCourse, lessonPage } from "./pages/course.js";
import { resumePage, aboutPage } from "./experience.js";
import { missingPage } from "./lib/html.js";
import { mountUploadDemo } from "./components/upload-demo.js";
import { paintSky } from "./sky.js";
import { startVisuals, stopVisuals, drawThread } from "./visuals.js";

const main = document.querySelector("main");
let dispose = () => {};
async function loadJson(file) {
  const response = await fetch(`./content/${file}.json`);
  if (!response.ok) throw Error(`Unable to load ${file}`);
  return response.json();
}
function createRouter({ posts, ideas, projects, profile, about }, lessons, resume) {
  const routes = {
    home: {
      title: "Yorick — A small universe",
      render: () => homePage(profile, projects),
    },
    writing: {
      title: "Writing · 学习笔记",
      render: (slug) => (slug ? articlePage(posts, slug) : writingPage(posts)),
      mount: (slug) => (slug ? () => {} : mountWriting(main, posts)),
    },
    ideas: {
      title: "Ideas · 随想",
      render: () => ideasPage(ideas),
      mount: () => mountIdeas(main, ideas),
    },
    projects: {
      title: "Projects · 项目",
      render: (slug) =>
        slug ? projectDetailPage(projects, slug) : projectsPage(projects),
    },
    course: {
      title: "路人架构学习计划",
      render: () => coursePage(posts),
      mount: () => mountCourse(main, lessons, posts),
    },
    lesson: {
      title: "课程详情",
      render: (key) => lessonPage(lessons, posts, key),
    },
    about: { title: "About · 姚启钧", render: () => aboutPage(profile, about) },
    resume: { title: "Resume · 姚启钧", render: () => resumePage(resume) },
  };
  return function render() {
    dispose();
    stopVisuals();
    let parts;
    try {
      parts = decodeURIComponent(location.hash.slice(1) || "/")
        .split("/")
        .filter(Boolean);
    } catch {
      parts = ["404"];
    }
    const [page = "home", slug] = parts,
      route = routes[page];
    document.body.dataset.page = page;
    document.body.classList.toggle(
      "paper",
      ["writing", "ideas", "course", "lesson", "about", "resume"].includes(
        page,
      ),
    );
    document.querySelectorAll("[data-nav]").forEach((link) => {
      const active =
        link.dataset.nav === page ||
        (link.dataset.nav === "about" && page === "resume") ||
        (link.dataset.nav === "writing" && ["course", "lesson"].includes(page));
      link.classList.toggle("active", active);
      if (active) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
    main.innerHTML = route ? route.render(slug) : missingPage();
    document.title = route
      ? route.title + (page === "home" ? "" : " — Yorick")
      : "404 — Yorick";
    const pageCleanup = route?.mount?.(slug) || (() => {});
    const demoCleanups = [...main.querySelectorAll(".upload-demo")].map(
      (demo) => mountUploadDemo(demo),
    );
    dispose = () => {
      pageCleanup();
      demoCleanups.forEach((cleanup) => cleanup());
    };
    paintSky();
    startVisuals();
    window.scrollTo(0, 0);
  };
}
// Shared navigation only. Page filters and experiments own their event listeners.
document.addEventListener("click", (event) => {
  if (event.target.closest(".skip")) {
    event.preventDefault();
    main.focus();
    main.scrollIntoView();
  }
  const anchor = event.target.closest("[data-scroll]");
  if (anchor) {
    event.preventDefault();
    document.getElementById(anchor.dataset.scroll)?.scrollIntoView({
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  }
  if (event.target.closest("[data-print]")) window.print();
});
document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === "k") {
    const input = main.querySelector('input[type="search"]');
    if (input) {
      event.preventDefault();
      input.focus();
    }
  }
});
let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    paintSky();
    drawThread();
  }, 120);
});
try {
  const [content, lessons, resume] = await Promise.all(
    ["site", "course-index", "resume"].map(loadJson),
  );
  mountWechatContact(content.profile);
  const render = createRouter(content, lessons, resume);
  window.addEventListener("hashchange", render);
  render();
} catch (error) {
  console.error(error);
  main.innerHTML =
    '<section class="page"><h1>内容暂时无法加载</h1><p>请确认网站已生成完整，再刷新重试。</p><button class="gold-button" id="reload-content">重新加载</button></section>';
  main
    .querySelector("#reload-content")
    .addEventListener("click", () => location.reload());
}
