import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { githubRepository } from "./lib/content.mjs";

// Explicit refresh: ordinary builds read the saved snapshot and stay offline.
export function repositoryAsset(repo) {
  const link = githubRepository(repo.html_url);
  return {
    ...link,
    title: repo.name,
    desc: repo.description || "仓库暂未填写简介，可在 GitHub 查看代码与文档。",
    fork: repo.fork === true,
    archived: repo.archived === true,
    tags: [repo.language, ...(repo.topics || [])].filter(Boolean),
    status: repo.fork ? "Fork · 协作与探索" : "公开仓库",
    updatedAt: repo.pushed_at,
  };
}
export async function syncGithub(username = "yaokuku123") {
  if (!/^[a-zA-Z0-9-]+$/.test(username)) throw Error("Invalid GitHub username");
  const repositories = [];
  for (let page = 1; ; page++) {
    const response = await fetch(
      `https://api.github.com/users/${username}/repos?type=owner&sort=pushed&per_page=100&page=${page}`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "yorick-space",
        },
        signal: AbortSignal.timeout(30000),
      },
    );
    if (!response.ok)
      throw Error(
        `GitHub returned ${response.status}; the existing snapshot has been kept.`,
      );
    const batch = await response.json();
    if (!Array.isArray(batch)) throw Error("Invalid repository response");
    repositories.push(...batch.filter((repo) => !repo.private));
    if (batch.length < 100) break;
  }
  const projects = repositories
    .map(repositoryAsset)
    .sort(
      (a, b) =>
        Number(a.fork) - Number(b.fork) ||
        (b.updatedAt || "").localeCompare(a.updatedAt || "") ||
        a.title.localeCompare(b.title),
    );
  const snapshot = { username, syncedAt: new Date().toISOString(), projects };
  const target = fileURLToPath(
    new URL("../content/projects/github.json", import.meta.url),
  );
  await writeFile(target, JSON.stringify(snapshot, null, 2) + "\n");
  console.log(
    `Synced ${projects.length} public repositories (${projects.filter((repo) => repo.fork).length} forks).`,
  );
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  syncGithub().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
