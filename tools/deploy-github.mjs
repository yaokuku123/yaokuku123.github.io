import { mkdtemp, mkdir, access } from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { projectRoot } from './build.mjs';
import { exportSource } from './lib/publish-source.mjs';

const repository = 'yaokuku123/yaokuku123.github.io';
const run = (command, args, cwd = projectRoot) => execFileSync(command, args, { cwd, stdio: 'inherit' });
run('npm', ['test']);
run('npm', ['run', 'build']);
await mkdir(path.join(projectRoot, 'tmp'), { recursive: true });
const checkout = await mkdtemp(path.join(projectRoot, 'tmp/publish-'));
run('git', ['clone', `git@github.com:${repository}.git`, checkout]);
let sourceExists = false;
try { await access(path.join(checkout, 'package.json')); sourceExists = true; } catch (error) { if (error.code !== 'ENOENT') throw error; }
if (sourceExists) throw Error('This repository already owns editable content. Refusing to replace it with a workspace copy. Edit the GitHub source or pull that repository before making changes.');
// This command is the one-time migration, explicitly invoked after reviewing the prepared source.
run('git', ['rm', '-r', '--ignore-unmatch', '.'], checkout);
await exportSource(projectRoot, checkout);
run('npm', ['ci'], checkout);
run('npm', ['test'], checkout);
run('npm', ['run', 'build'], checkout);
run('git', ['add', '--all'], checkout);
run('git', ['-c', 'user.name=Yorick', '-c', 'user.email=yaoqijun@outlook.com', 'commit', '-m', 'Enable content-driven website and automatic Pages builds'], checkout);
// Check access before the push; gh uses the existing login and no new secrets.
run('gh', ['api', `repos/${repository}/pages`]);
run('git', ['push', 'origin', 'HEAD:main'], checkout);
run('gh', ['api', '--method', 'PUT', `repos/${repository}/pages`, '-f', 'build_type=workflow']);
// Dispatch also recovers if the initial push arrived before the Pages setting changed.
run('gh', ['workflow', 'run', 'pages.yml', '--repo', repository, '--ref', 'main']);
console.log(`Source: https://github.com/${repository}/tree/main/content`);
console.log(`Check deployment: https://github.com/${repository}/actions`);
console.log('Website: https://yaokuku123.github.io/ (deployment must finish successfully)');
