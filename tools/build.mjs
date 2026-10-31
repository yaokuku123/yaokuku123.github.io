import { cp, mkdir, readFile, writeFile, mkdtemp, rename, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { compileContent } from "./lib/content.mjs";
import { renderMarkdown } from "./lib/markdown.mjs";

export const projectRoot = fileURLToPath(new URL("../", import.meta.url));
export async function buildSite({ root = projectRoot } = {}) {
  const contentRoot = path.join(root, "content");
  // Validate and compile before touching the last working output.
  const [site, work, student, course, profileSource, aboutSource] = await Promise.all([
    compileContent(contentRoot),
    readFile(path.join(contentRoot, "resume.md"), "utf8"),
    readFile(path.join(contentRoot, "student-years.md"), "utf8"),
    readFile(path.join(contentRoot, "course-index.json"), "utf8"),
    readFile(path.join(contentRoot, "profile.json"), "utf8"),
    readFile(path.join(contentRoot, "about.md"), "utf8"),
  ]);
  const resume = {
    work: renderMarkdown(work, "resume"),
    student: renderMarkdown(student, "student"),
  };
  JSON.parse(course);
  site.profile = JSON.parse(profileSource);
  const profile = site.profile;
  if (!profile?.intro || !["name", "work", "location", "education", "exploring"].every(key => typeof profile.intro[key] === "string") || !Array.isArray(profile.focus)) throw Error("profile.json: intro and focus are required");
  site.about = renderMarkdown(aboutSource, "about");
  // Preserve the established About timeline while its text stays in Markdown.
  site.about.html = site.about.html.replace(/<blockquote>/g, '<blockquote class="resume-quote">').replace(/<p><strong>([^<]+)<\/strong><\/p>\s*<h3[^>]*>(.*?)<\/h3>\s*<p>([\s\S]*?)<\/p>/g, '<div class="timeline"><div class="timeline-item"><time>$1</time><h3>$2</h3><p>$3</p></div></div>');
  const destination = path.join(root, "dist");
  const output = await mkdtemp(path.join(root, ".build-"));
  try {
    await mkdir(path.join(output, "content"), { recursive: true });
    await cp(path.join(root, "src"), output, { recursive: true });
    await cp(path.join(contentRoot, "media"), path.join(output, "media"), {
      recursive: true,
    });
    await cp(path.join(contentRoot, "files"), path.join(output, "files"), { recursive: true }).catch(error => { if (error.code !== "ENOENT") throw error; });
    const indexPath = path.join(output, "index.html");
    const index = await readFile(indexPath, "utf8");
    await writeFile(indexPath, index.replace("本地预览 · 部分内容为示例", "部分学习内容为示例 · 持续更新"));
    await writeFile(path.join(output, ".nojekyll"), "");
    await Promise.all([
      writeFile(path.join(output, "content/site.json"), JSON.stringify(site)),
      writeFile(path.join(output, "content/resume.json"), JSON.stringify(resume)),
      writeFile(path.join(output, "content/course-index.json"), course),
    ]);
    await rm(destination, { recursive: true, force: true });
    await rename(output, destination);
  } catch (error) {
    await rm(output, { recursive: true, force: true });
    throw error;
  }
  console.log(
    `Built ${site.posts.length} posts, ${site.ideas.length} ideas, ${site.projects.length} projects → dist/`,
  );
  return site;
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  buildSite().catch((error) => {
    console.error(`Build failed: ${error.message}`);
    process.exitCode = 1;
  });
}
