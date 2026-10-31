import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { renderMarkdown } from './markdown.mjs';

export const documentExtensions = new Set(['.pdf', '.docx', '.xlsx', '.pptx', '.txt', '.csv', '.zip']);
export async function documents(root, relative = '') {
  let entries;
  try { entries = await readdir(path.join(root, relative), { withFileTypes: true }); }
  catch (error) { if (error.code === 'ENOENT') return []; throw error; }
  const records = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.name.startsWith('.')) continue;
    const file = path.posix.join(relative, entry.name);
    if (entry.isDirectory()) { records.push(...await documents(root, file)); continue; }
    if (!entry.isFile() || !documentExtensions.has(path.extname(file).toLowerCase()))
      throw Error(`files/${file}: unsupported document type (use PDF, DOCX, XLSX, PPTX, TXT, CSV or ZIP)`);
    const extension = path.extname(file).slice(1).toUpperCase();
    const title = path.basename(file, path.extname(file));
    const url = '/files/' + file.split('/').map(part => encodeURIComponent(part).replace(/[!'()*]/g, character => '%' + character.charCodeAt(0).toString(16))).join('/');
    records.push({
      slug: 'file-' + Buffer.from(file).toString('hex'), title,
      date: '', dateLabel: extension, category: '资料', type: '附件', label: 'DOCUMENT',
      minutes: '下载阅读', desc: `${extension} 文档 · ${file}`,
      searchText: file, sections: [], example: false, order: 0,
      html: renderMarkdown(`文档原件：[打开或下载 ${title.replace(/[\[\]\\]/g, '\\$&')}](${url})\n\n${extension === 'PDF' ? 'PDF 可在支持的浏览器中直接阅读。' : '下载后使用对应软件打开。'}`).html,
    });
  }
  return records;
}
