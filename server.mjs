/**
 * Minimal download + static server for the Cognia demo site.
 *
 * Zero dependencies (node:http + node:fs only). Serves:
 *  - `/`                 the static site (website/)
 *  - `/icon.png`         app artwork (repo assets/)
 *  - `/assets/<file>`    artwork: site-local `website/assets/` first, then
 *                        repo `assets/` (Cognia.jpg, icon.png, icon.ico, …),
 *                        each confined to its directory
 *  - `/downloads/<file>` every `*.zip` discovered under `out/make/`, streamed
 *                        with resume (Range) support and attachment download
 *
 * Only exact discovered basenames are served — no traversal, no listing.
 *
 * Usage:  npm run serve:website        (port 8080)
 *         PORT=9000 npm run serve:website
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const WEBSITE_ROOT = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(WEBSITE_ROOT, '..');
const OUT_MAKE = path.join(REPO_ROOT, 'out', 'make');
const ASSETS_DIR = path.join(REPO_ROOT, 'assets');
const SITE_ASSETS_DIR = path.join(WEBSITE_ROOT, 'assets');
const ICON_FILE = path.join(ASSETS_DIR, 'icon.png');
const PORT = Number(process.env.PORT ?? 8080);

const STATIC_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

/** Recursively collects *.zip files; keyed by basename for safe lookup. */
function discoverZips() {
  const found = new Map();
  const walk = (dir) => {
    let entries = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile() && entry.name.endsWith('.zip')) {
        if (found.has(entry.name)) {
          console.warn(`duplicate zip basename ignored: ${full}`);
        } else {
          found.set(entry.name, full);
        }
      }
    }
  };
  walk(OUT_MAKE);
  return found;
}

const zips = discoverZips();

function sendFile(res, filePath, contentType, downloadName) {
  let stat;
  try {
    stat = fs.statSync(filePath);
    if (!stat.isFile()) throw new Error('not a file');
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }
  res.setHeader('content-type', contentType);
  res.setHeader('accept-ranges', 'bytes');
  if (downloadName) {
    res.setHeader('content-disposition', `attachment; filename="${downloadName}"`);
  }
  res.setHeader('cache-control', 'no-store');
  fs.createReadStream(filePath).pipe(res);
}

/** Streams a download with single-range resume support. */
function sendDownload(req, res, filePath, downloadName) {
  let stat;
  try {
    stat = fs.statSync(filePath);
    if (!stat.isFile()) throw new Error('not a file');
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }
  const total = stat.size;
  const headers = {
    'content-type': 'application/zip',
    'content-disposition': `attachment; filename="${downloadName}"`,
    'accept-ranges': 'bytes',
    'cache-control': 'no-store',
  };
  const range = req.headers.range;
  if (typeof range === 'string') {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
    if (match) {
      let start = match[1] === '' ? null : Number(match[1]);
      let end = match[2] === '' ? null : Number(match[2]);
      if (start === null && end !== null) {
        start = Math.max(0, total - end);
        end = total - 1;
      }
      if (start === null) start = 0;
      if (end === null || end >= total) end = total - 1;
      if (Number.isInteger(start) && Number.isInteger(end) && start <= end && start < total) {
        res.writeHead(206, {
          ...headers,
          'content-range': `bytes ${start}-${end}/${total}`,
          'content-length': end - start + 1,
        });
        fs.createReadStream(filePath, { start, end }).pipe(res);
        return;
      }
      res.writeHead(416, { 'content-range': `bytes */${total}` });
      res.end();
      return;
    }
  }
  res.writeHead(200, { ...headers, 'content-length': total });
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const pathname = decodeURIComponent(url.pathname);

  if (pathname === '/' || pathname === '/index.html') {
    sendFile(res, path.join(WEBSITE_ROOT, 'index.html'), STATIC_TYPES['.html']);
    return;
  }
  if (pathname === '/icon.png') {
    sendFile(res, ICON_FILE, STATIC_TYPES['.png']);
    return;
  }
  if (pathname.startsWith('/assets/')) {
    // Confined to the two asset dirs (site-local wins): no absolute paths,
    // no `..` escapes.
    const rel = pathname.slice('/assets/'.length);
    if (!rel || rel.includes('..') || path.isAbsolute(rel)) {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }
    let full = null;
    for (const base of [SITE_ASSETS_DIR, ASSETS_DIR]) {
      const candidate = path.normalize(path.join(base, rel));
      if (!candidate.startsWith(base + path.sep)) {
        continue;
      }
      try {
        if (fs.statSync(candidate).isFile()) {
          full = candidate;
          break;
        }
      } catch {
        // Try the next dir.
      }
    }
    if (!full) {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }
    sendFile(res, full, STATIC_TYPES[path.extname(full).toLowerCase()] ?? 'application/octet-stream');
    return;
  }
  if (pathname === '/styles.css' || pathname === '/script.js') {
    const file = path.join(WEBSITE_ROOT, path.basename(pathname));
    sendFile(res, file, STATIC_TYPES[path.extname(file)] ?? 'application/octet-stream');
    return;
  }
  const download = /^\/downloads\/([^/]+)$/.exec(pathname);
  if (download) {
    const filePath = zips.get(download[1]);
    if (!filePath) {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }
    console.log(`${req.method} ${pathname} (${fs.statSync(filePath).size} bytes)`);
    sendDownload(req, res, filePath, download[1]);
    return;
  }
  res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`Cognia demo site on http://localhost:${PORT}/`);
  if (zips.size === 0) {
    console.warn(`warning: no zips discovered under ${OUT_MAKE}`);
  } else {
    for (const [name, full] of zips) {
      console.log(`download: /downloads/${name} (${fs.statSync(full).size} bytes)`);
    }
  }
});
