import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { documents } from "./documents.mjs";
import { renderMarkdown, plainText } from "./markdown.mjs";

async function markdownFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) =>
      entry.isDirectory()
        ? markdownFiles(path.join(directory, entry.name))
        : entry.name.endsWith(".md")
          ? [path.join(directory, entry.name)]
          : [],
    ),
  );
  return nested.flat().sort();
}
function assert(condition, message) {
  if (!condition) throw Error(message);
}
function text(value, name, fallback = "") {
  if (value === undefined) return fallback;
  assert(typeof value === "string", `${name} must be a string`);
  return value.trim();
}
function date(value) {
  const result =
    value instanceof Date
      ? value.toISOString().slice(0, 10)
      : text(value, "date");
  assert(
    /^\d{4}-\d{2}-\d{2}$/.test(result) &&
      new Date(result + "T00:00:00Z").toISOString().slice(0, 10) === result,
    "date must be a valid YYYY-MM-DD date",
  );
  return result;
}
export function githubRepository(value) {
  const url = new URL(value);
  assert(
    url.protocol === "https:" && url.hostname === "github.com",
    "Project links must be HTTPS github.com repository URLs",
  );
  const pieces = url.pathname
    .replace(/\/$/, "")
    .replace(/\.git$/, "")
    .split("/")
    .filter(Boolean);
  assert(
    pieces.length === 2 &&
      pieces.every((piece) => /^[a-zA-Z0-9_.-]+$/.test(piece)),
    "Use a repository link: https://github.com/owner/repo",
  );
  return {
    github: `https://github.com/${pieces.join("/")}`,
    slug: pieces.join("--").toLowerCase(),
    title: pieces.join("/"),
  };
}
async function collection(root, kind) {
  const records = [];
  for (const file of await markdownFiles(path.join(root, kind))) {
    try {
      const source = await readFile(file, "utf8");
      assert(
        !source.startsWith("---") || source.split(/\r?\n/)[0] === "---",
        "Use plain YAML front matter delimited by ---",
      );
      const { data, content } = matter(source);
      assert(
        data.draft === undefined || typeof data.draft === "boolean",
        "draft must be true or false",
      );
      if (data.draft === true) continue;
      const slug = path.basename(file, ".md");
      assert(
        /^[a-z0-9][a-z0-9-]*$/.test(slug),
        "Use lowercase English letters, numbers and hyphens in filenames",
      );
      assert(
        data.example === undefined || typeof data.example === "boolean",
        "example must be true or false",
      );
      const rendered = renderMarkdown(content, `${kind}-${slug}`);
      const common = {
        slug,
        html: rendered.html,
        sections: rendered.sections,
        searchText: plainText(content),
        example: data.example === true,
        order: Number(data.order || 0),
      };
      assert(Number.isFinite(common.order), "order must be a number");
      if (kind === "projects") {
        const repo = githubRepository(text(data.github, "github"));
        assert(
          data.tags === undefined ||
            (Array.isArray(data.tags) &&
              data.tags.every((tag) => typeof tag === "string")),
          "tags must be a list of text",
        );
        records.push({
          ...common,
          github: repo.github,
          title: text(data.title, "title", repo.title),
          desc: text(
            data.description ?? data.desc,
            "description",
            plainText(content).slice(0, 140),
          ),
          tags: data.tags || [],
          status: text(data.status, "status", "开源项目"),
        });
      } else {
        const title = text(
          data.title,
          "title",
          plainText(content).slice(0, 60),
        );
        assert(title, "title cannot be empty");
        const record = {
          ...common,
          title,
          date: date(data.date),
          category: text(
            data.category,
            "category",
            kind === "posts" ? "笔记" : "记录",
          ),
        };
        if (kind === "posts") {
          assert(data.tags === undefined || (Array.isArray(data.tags) && data.tags.every(tag => typeof tag === "string")), "tags must be a list of text");
          record.tags = [...new Set((data.tags || []).map(tag => tag.trim()).filter(Boolean))];
          record.desc = text(
            data.description ?? data.desc,
            "description",
            plainText(content).slice(0, 140),
          );
          record.label = text(data.label, "label", "FIELDNOTES");
          record.type = text(
            data.type,
            "type",
            record.example ? "示例" : "笔记",
          );
          record.dateLabel = text(data.dateLabel, "dateLabel", record.date);
          record.minutes = text(
            data.minutes,
            "minutes",
            `${Math.max(1, Math.ceil(plainText(content).length / 350))} 分钟`,
          );
          if (data.lesson !== undefined) {
            assert(
              (Number.isInteger(data.lesson) && data.lesson > 0) ||
                (typeof data.lesson === "string" &&
                  /^[0-9]+(?:-[a-z0-9-]+)?$/.test(data.lesson)),
              "lesson must be a course key",
            );
            record.lesson = data.lesson;
          }
        }
        records.push(record);
      }
    } catch (error) {
      throw Error(`${path.relative(root, file)}: ${error.message}`);
    }
  }
  assert(
    new Set(records.map((record) => record.slug)).size === records.length,
    `Duplicate slugs in ${kind}`,
  );
  return records.sort(
    (a, b) =>
      (b.date || "").localeCompare(a.date || "") ||
      a.order - b.order ||
      a.slug.localeCompare(b.slug),
  );
}
export async function compileContent(root) {
  const [posts, ideas, projects] = await Promise.all(
    ["posts", "ideas", "projects"].map((kind) => collection(root, kind)),
  );
  let githubSnapshot;
  try {
    githubSnapshot = JSON.parse(
      await readFile(path.join(root, "projects/github.json"), "utf8"),
    );
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  if (githubSnapshot) {
    assert(Array.isArray(githubSnapshot.projects), "Invalid GitHub snapshot");
    for (const repo of githubSnapshot.projects) {
      const link = githubRepository(repo.github);
      const existing = projects.find(
        (project) => project.github === link.github,
      );
      const metadata = {
        fork: repo.fork === true,
        archived: repo.archived === true,
      };
      if (existing) Object.assign(existing, metadata);
      else
        projects.push({
          ...link,
          ...metadata,
          title: text(repo.title, "title", link.title),
          desc: text(repo.desc, "description"),
          tags: Array.isArray(repo.tags)
            ? repo.tags.filter((tag) => typeof tag === "string")
            : [],
          status: text(repo.status, "status", "公开仓库"),
          html: "",
          sections: [],
        });
    }
  }
  const links = await readFile(path.join(root, "projects/repos.txt"), "utf8");
  for (const line of links
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))) {
    const repo = githubRepository(line);
    if (!projects.some((project) => project.github === repo.github))
      projects.push({
        ...repo,
        desc: "GitHub 开源仓库",
        html: "",
        sections: [],
        tags: [],
        status: "开源项目",
      });
  }
  assert(
    new Set(projects.map((project) => project.slug)).size === projects.length,
    "Project slugs must be unique",
  );
  const lessons = posts
    .filter((post) => post.lesson !== undefined)
    .map((post) => String(post.lesson));
  assert(
    new Set(lessons).size === lessons.length,
    "Each lesson can link to only one post",
  );
  posts.push(...await documents(path.join(root, "files")));
  return { posts, ideas, projects };
}
