import { escapeHtml as e, pageHead, missingPage } from "../lib/html.js";
function emptyProjects() {
  return `<div class="repo-placeholders">${["第一个仓库，留在这里。", "下一个想法，正在路上。", "还有一些尚未命名的尝试。"].map((text, index) => `<article class="repo-placeholder"><span class="repo-index">0${index + 1}</span><div><div class="skeleton-name"></div><h2>${text}</h2><p>等待添加开源项目</p></div><span class="repo-status">COMING SOON</span></article>`).join("")}</div>`;
}
function repositoryRows(projects) {
  return `<div class="repo-placeholders">${projects.map((project, index) => `<article class="repo-placeholder repo-entry"><span class="repo-index">${String(index + 1).padStart(2, "0")}</span><div><h2><a href="#/projects/${encodeURIComponent(project.slug)}">${e(project.title)}</a></h2><p>${e(project.desc)}</p><div class="repo-labels"><span>${project.fork ? "FORK" : "PUBLIC"}${project.archived ? " · ARCHIVED" : ""}</span>${project.tags.map((tag) => `<span>${e(tag)}</span>`).join("")}</div></div><a class="repo-status" href="${e(project.github)}" target="_blank" rel="noreferrer" aria-label="在 GitHub 查看 ${e(project.title)}">GitHub ↗</a></article>`).join("")}</div>`;
}
export function projectsPage(projects) {
  const owned = projects.filter((project) => !project.fork);
  const forks = projects.filter((project) => project.fork);
  const list = projects.length
    ? `${owned.length ? `<h2 class="repo-group-title">Repositories <span>我的公开仓库 / ${owned.length}</span></h2>${repositoryRows(owned)}` : ""}${forks.length ? `<h2 class="repo-group-title">In good company. <span>Fork · 协作与探索 / ${forks.length}</span></h2><p class="repo-group-note">以下为 Fork 仓库，保留上游项目的名称与简介。</p>${repositoryRows(forks)}` : ""}`
    : emptyProjects();
  return `<section class="page open-source-page">${pageHead("> ls ./projects", "Projects", "一些慢慢成形的作品，与沿途的探索。")}<div class="project-toolbar"><span>PUBLIC REPOSITORIES / ${projects.length ? `${projects.length} 个仓库` : "待同步"}</span><a class="text-link" href="https://github.com/yaokuku123" target="_blank" rel="noreferrer">GitHub ↗</a></div>${list}<p class="project-caption">仓库名称、简介与语言同步自 GitHub；没有简介的仓库保留空白说明。<br>工作经历与过往项目，完整收录在 <a class="text-link" href="#/resume">简历</a> 中。</p></section>`;
}
export function projectDetailPage(projects, slug) {
  const project = projects.find((project) => project.slug === slug);
  if (!project) return missingPage();
  return `<section class="page article"><a class="eyebrow text-link" href="#/projects">← BACK TO PROJECTS</a><h1>${e(project.title)}</h1><p class="article-deck">${e(project.desc)}</p><div class="article-meta"><span>${e(project.status)}${project.archived ? " · 已归档" : ""}</span><span>${project.tags.map(e).join(" / ")}</span></div>${project.fork ? '<p class="repo-group-note">这是 Fork 仓库，项目原始介绍与代码归属请查看 GitHub 的上游来源。</p>' : ""}<div class="article-body">${project.html}</div><p><a class="gold-button" href="${e(project.github)}" target="_blank" rel="noreferrer">在 GitHub 查看代码与文档 ↗</a></p></section>`;
}
