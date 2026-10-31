import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm, readFile } from "node:fs/promises";
import path from "node:path";
import { compileContent, githubRepository } from "../tools/lib/content.mjs";
import { renderMarkdown } from "../tools/lib/markdown.mjs";
import { projectRoot } from "../tools/build.mjs";

async function fixture(t) {
  await mkdir(path.join(projectRoot, "tmp"), { recursive: true });
  const root = await mkdtemp(path.join(projectRoot, "tmp/content-test-"));
  await Promise.all(
    ["posts", "ideas", "projects"].map((kind) => mkdir(path.join(root, kind))),
  );
  await writeFile(path.join(root, "projects/repos.txt"), "");
  t.after(() => rm(root, { recursive: true, force: true }));
  return root;
}
test("new assets become articles, categories, dates and GitHub projects without code changes", async (t) => {
  const root = await fixture(t);
  await writeFile(
    path.join(root, "posts/new-topic.md"),
    '---\ntitle: A new subject\ncategory: 新分类\ndate: "2026-10-18"\n---\n\n## A new section\n\n**Independent content**, with an image ![diagram](/media/example.png).',
  );
  await writeFile(
    path.join(root, "ideas/new-thought.md"),
    '---\ntitle: 新想法\ncategory: 新分类\ndate: "2026-10-18"\n---\n\n今天记录的一件事。',
  );
  await writeFile(
    path.join(root, "projects/repos.txt"),
    "# Repository links\nhttps://github.com/yorick/example.git\n",
  );
  const result = await compileContent(root);
  assert.equal(result.posts[0].slug, "new-topic");
  assert.equal(result.posts[0].category, "新分类");
  assert.match(result.posts[0].html, /<strong>Independent content<\/strong>/);
  assert.equal(result.posts[0].sections[0].title, "A new section");
  assert.match(result.posts[0].html, /src="\/media\/example.png"/);
  assert.equal(result.ideas[0].date, "2026-10-18");
  assert.equal(result.ideas[0].category, "新分类");
  assert.equal(result.projects[0].github, "https://github.com/yorick/example");
  assert.equal(result.projects[0].title, "yorick/example");
});
test("a Markdown project enriches the same link without duplicate entries", async (t) => {
  const root = await fixture(t);
  await writeFile(
    path.join(root, "projects/example.md"),
    "---\ngithub: https://github.com/yorick/example\ntitle: 我自己的项目名\ntags: [Java, Redis]\n---\n\n## 为什么做\n\n我想解决的问题。",
  );
  await writeFile(
    path.join(root, "projects/repos.txt"),
    "https://github.com/yorick/example\n",
  );
  const result = await compileContent(root);
  assert.equal(result.projects.length, 1);
  assert.equal(result.projects[0].title, "我自己的项目名");
  assert.match(result.projects[0].html, /我想解决的问题/);
});
test("drafts stay unpublished and invalid metadata reports the source file", async (t) => {
  const root = await fixture(t);
  await writeFile(
    path.join(root, "posts/private.md"),
    "---\ndraft: true\n---\n\nThis must not be published.",
  );
  assert.equal((await compileContent(root)).posts.length, 0);
  await writeFile(
    path.join(root, "ideas/bad-date.md"),
    '---\ndate: "2026-02-31"\n---\n\nBad date.',
  );
  await assert.rejects(
    compileContent(root),
    /ideas\/bad-date.md.*valid YYYY-MM-DD/,
  );
});
test("duplicate lesson mappings and unsafe project links are rejected", async (t) => {
  const root = await fixture(t);
  for (const name of ["one", "two"])
    await writeFile(
      path.join(root, `posts/${name}.md`),
      '---\ntitle: Title\ndate: "2026-10-17"\nlesson: 1\n---\n\nContent.',
    );
  await assert.rejects(compileContent(root), /Each lesson/);
  assert.throws(() => githubRepository("javascript:alert(1)"), /HTTPS/);
  assert.throws(
    () => githubRepository("https://github.com/owner/repo/issues"),
    /repository link/,
  );
});
test("Markdown supports tables and allowed components while escaping scripts and unsafe links", () => {
  const result = renderMarkdown(
    "## One\n\n<script>alert(1)</script>\n\n[x](javascript:alert(1))\n\n| A | B |\n|---|---|\n| 1 | 2 |\n\n```component\nupload-demo\n```",
    "article",
  );
  assert.ok(!result.html.includes("<script>"));
  assert.ok(!result.html.includes('href="javascript:'));
  assert.match(result.html, /<div class="resume-table"><table>/);
  assert.match(result.html, /class="upload-demo"/);
  assert.equal(result.sections[0].id, "article-0");
  assert.throws(
    () => renderMarkdown("```component\nrun-any-code\n```"),
    /Unknown content component/,
  );
});

test("GitHub snapshot preserves fork attribution and allows Markdown overrides without duplicates", async (t) => {
  const root = await fixture(t);
  await writeFile(
    path.join(root, "projects/github.json"),
    JSON.stringify({
      projects: [
        {
          github: "https://github.com/yorick/example",
          title: "example",
          desc: "GitHub description",
          tags: ["Java"],
          fork: true,
          archived: false,
          status: "Fork",
        },
        {
          github: "https://github.com/yorick/second",
          title: "second",
          desc: "Another repository",
          tags: [],
          fork: false,
          status: "公开仓库",
        },
      ],
    }),
  );
  await writeFile(
    path.join(root, "projects/example.md"),
    "---\ngithub: https://github.com/yorick/example\ntitle: 自己写的说明\n---\n\n说明正文。",
  );
  await writeFile(
    path.join(root, "projects/repos.txt"),
    "https://github.com/yorick/example\n",
  );
  const { projects } = await compileContent(root);
  assert.equal(projects.length, 2);
  assert.equal(projects[0].title, "自己写的说明");
  assert.equal(projects[0].fork, true);
  assert.equal(projects[1].fork, false);
  assert.match(projects[0].html, /说明正文/);
});

test('uploaded documents support nested Chinese filenames and safe download links', async (t) => {
  const root = await fixture(t);
  await mkdir(path.join(root, 'files/研究'), { recursive: true });
  await writeFile(path.join(root, 'files/研究/我的体会 (新版).pdf'), '%PDF-1.4');
  const { posts } = await compileContent(root);
  assert.equal(posts[0].category, '资料');
  assert.equal(posts[0].title, '我的体会 (新版)');
  assert.match(posts[0].html, /href="\/files\//);
  assert.ok(!posts[0].html.includes('href="javascript:'));
  await writeFile(path.join(root, 'files/unknown.exe'), 'not publishable');
  await assert.rejects(compileContent(root), /unsupported document type/);
});

test('standalone source builds new content and resume, excludes drafts, removes obsolete files, and keeps the last build on failure', async (t) => {
  const { exportSource } = await import('../tools/lib/publish-source.mjs');
  const { buildSite } = await import('../tools/build.mjs');
  const { access, appendFile, unlink } = await import('node:fs/promises');
  const root = await fixture(t);
  const standalone = path.join(root, 'standalone');
  await exportSource(projectRoot, standalone);
  await writeFile(path.join(standalone, 'content/posts/integration-note.md'), '---\ntitle: 新内容回归\ndate: "2026-10-31"\ncategory: 心得\n---\n\n## 新章节\n\n正文内容');
  await writeFile(path.join(standalone, 'content/ideas/integration-idea.md'), '---\ntitle: 新想法回归\ndate: "2026-10-31"\n---\n\n想法正文');
  await writeFile(path.join(standalone, 'content/posts/local-draft.md'), '---\ndraft: true\n---\n\nPrivate draft sentinel');
  await mkdir(path.join(standalone, 'content/files'), { recursive: true });
  await writeFile(path.join(standalone, 'content/files/test.pdf'), '%PDF-1.4');
  await appendFile(path.join(standalone, 'content/resume.md'), '\n\n## 新增简历章节回归\n\n新经历');
  await appendFile(path.join(standalone, 'content/about.md'), '\n\n## 新增个人介绍回归\n\n新的介绍');
  const site = await buildSite({ root: standalone });
  assert.ok(site.posts.some(post => post.title === '新内容回归'));
  assert.ok(site.ideas.some(idea => idea.title === '新想法回归'));
  assert.match(site.about.html, /新增个人介绍回归/);
  assert.ok(!JSON.stringify(site).includes('Private draft sentinel'));
  const resume = JSON.parse(await readFile(path.join(standalone, 'dist/content/resume.json'), 'utf8'));
  assert.ok(resume.work.sections.some(section => section.title === '新增简历章节回归'));
  await access(path.join(standalone, 'dist/files/test.pdf'));
  const exported = path.join(root, 'exported');
  await exportSource(standalone, exported);
  await assert.rejects(access(path.join(exported, 'content/posts/local-draft.md')), { code: 'ENOENT' });
  await assert.rejects(access(path.join(exported, 'research')), { code: 'ENOENT' });
  await unlink(path.join(standalone, 'content/files/test.pdf'));
  await buildSite({ root: standalone });
  await assert.rejects(access(path.join(standalone, 'dist/files/test.pdf')), { code: 'ENOENT' });
  const previous = await readFile(path.join(standalone, 'dist/content/site.json'), 'utf8');
  await writeFile(path.join(standalone, 'content/posts/broken.md'), '---\ndate: impossible\n---\n\nBroken');
  await assert.rejects(buildSite({ root: standalone }), /broken.md/);
  assert.equal(await readFile(path.join(standalone, 'dist/content/site.json'), 'utf8'), previous);
});

test("article tags normalize and combine with category/search while keeping newest first", async (t) => {
  const { filterPosts, writingPage, articlePage } = await import('../src/pages/writing.js');
  const root = await fixture(t);
  for (const [slug, date, tags] of [['older', '2026-10-01', '[创业, 融资]'], ['newer', '2026-10-31', '[创业, " 融资 ", 融资, ""]'], ['other', '2026-10-30', '[]']]) {
    await writeFile(path.join(root, `posts/${slug}.md`), `---\ntitle: ${slug}\ndate: "${date}"\ncategory: 笔记\ntags: ${tags}\n---\n\n## 正文\n\n内容`);
  }
  const { posts } = await compileContent(root);
  assert.deepEqual(posts[0].tags, ['创业', '融资']);
  assert.deepEqual(filterPosts([...posts].reverse(), '全部', '融资').map(p => p.slug), ['newer', 'older']);
  assert.deepEqual(filterPosts(posts, '笔记', '融资', 'newer').map(p => p.slug), ['newer']);
  assert.equal(filterPosts(posts, '其他', '融资').length, 0);
  assert.equal(filterPosts(posts, '全部', '', '融资').length, 2);
  assert.equal(filterPosts(posts).length, 3);
  assert.match(writingPage(posts), /文章标签/);
  assert.match(articlePage(posts, 'newer'), /# 融资/);
  await writeFile(path.join(root, 'posts/bad.md'), '---\ndate: "2026-10-31"\ntags: 融资\n---\n正文');
  await assert.rejects(compileContent(root), /tags must be a list/);
});
