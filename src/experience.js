import { escapeHtml as e } from "./lib/html.js";
export function resumePage(data) {
  if (!data)
    return '<section class="page"><h1>简历暂时无法加载</h1><p>请刷新页面重试。</p></section>';
  const toc = [...data.work.sections, ...data.student.sections];
  return `<section class="page resume-page"><div class="resume-topline"><span class="eyebrow">CURRICULUM VITAE / 姚启钧</span><div><a href="#/about" class="text-link">关于我</a><button class="print-resume" data-print>打印 / 存为 PDF ↗</button></div></div><div class="resume-layout"><article class="resume-document"><div class="resume-part-label">01 / PROFESSIONAL EXPERIENCE</div>${data.work.html}<div class="resume-divider"><span>✧</span><p>Before the work.</p><small>02 / UNIVERSITY & RESEARCH</small></div>${data.student.html}</article><aside class="resume-index"><div><span class="eyebrow">CONTENTS</span>${toc.map((s) => `<a href="#${s.id}" data-scroll="${s.id}">${s.title}</a>`).join("")}<p>工作经历与校园积累<br>一份持续生长的个人档案</p></div></aside></div></section>`;
}
export function aboutPage(profile, about) {
  return `<section class="page about-revised"><div class="eyebrow"><b>✧</b>THE PERSON BEHIND THE NOTES</div><div class="about-title"><h1>${e(profile.aboutTitle)}</h1><a class="gold-button" href="#/resume">阅读完整简历 ↗</a></div><p class="page-lead">${e(profile.aboutLead)}</p><div class="about-layout"><div class="about-body">${about.html}</div><aside class="about-side"><div><h3>FOCUS</h3><p>${profile.focus.map(e).join("<br>")}</p></div><div><h3>ELSEWHERE</h3><a href="${e(profile.github)}" target="_blank" rel="noreferrer">GitHub ↗</a><a href="${e(profile.blog)}" target="_blank" rel="noreferrer">早期博客 · 简书 ↗</a><a href="mailto:${e(profile.email)}">${e(profile.email)} ↗</a><button type="button" class="wechat-contact-link" data-wechat aria-haspopup="dialog">微信 · ${e(profile.wechat.name)} ↗</button></div><div><h3>THE FULL STORY</h3><a class="gold-button" href="#/resume">我的简历 ↗</a></div></aside></div></section>`;
}
