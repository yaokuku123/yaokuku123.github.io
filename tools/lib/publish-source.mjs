import { cp, mkdir, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';

// Only the site's public inputs and build system enter the standalone repository.
export async function exportSource(root, destination) {
  await mkdir(destination, { recursive: true });
  for (const name of ['src', 'tools', 'tests', 'package.json', 'package-lock.json', '.gitignore', '.github'])
    await cp(path.join(root, name), path.join(destination, name), { recursive: true });
  async function copyContent(relative = '') {
    const directory = path.join(root, 'content', relative);
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (entry.name.startsWith('.') && entry.name !== '.gitkeep') continue;
      const file = path.join(relative, entry.name);
      if (entry.isDirectory()) { await copyContent(file); continue; }
      if (!entry.isFile()) throw Error(`Refusing non-regular content: ${file}`);
      if (entry.name.endsWith('.md') && matter(await readFile(path.join(directory, entry.name), 'utf8')).data.draft === true) continue;
      await mkdir(path.dirname(path.join(destination, 'content', file)), { recursive: true });
      await cp(path.join(directory, entry.name), path.join(destination, 'content', file));
    }
  }
  await copyContent();
  await mkdir(path.join(destination, 'docs'), { recursive: true });
  await cp(path.join(root, 'docs/content-publishing.md'), path.join(destination, 'docs/content-publishing.md'));
  await cp(path.join(root, 'docs/content-publishing.md'), path.join(destination, 'README.md'));
}
