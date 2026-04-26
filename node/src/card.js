import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import chalk from 'chalk';
import stringWidth from 'string-width';
import ansiEscapes from 'ansi-escapes';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function loadData() {
  const candidates = [
    path.join(__dirname, '..', 'data.json'),
    path.join(__dirname, '..', '..', 'data.json'),
  ];
  for (const p of candidates) {
    try {
      const raw = await readFile(p, 'utf-8');
      return JSON.parse(raw);
    } catch {}
  }
  throw new Error('data.json not found');
}

function applyStyle(styleName, text) {
  if (!styleName) return text;
  let fn = chalk;
  for (const part of styleName.split(/\s+/)) {
    if (fn[part]) fn = fn[part];
  }
  return typeof fn === 'function' ? fn(text) : text;
}

function buildSegments(data) {
  const allLabels = [
    ...data.info.map((i) => i.label),
    ...data.sections.flatMap((s) => s.links.map((l) => l.label)),
  ];
  const labelWidth = Math.max(...allLabels.map((lbl) => `  ${lbl}:`.length)) + 2;
  const padded = (label) => `  ${label}:`.padEnd(labelWidth, ' ');

  const segs = [];
  segs.push({ text: ` \n ${data.name}\n\n`, style: 'bold cyan' });

  data.info.forEach((item, idx) => {
    segs.push({ text: padded(item.label), style: 'green' });
    const suffix = idx === data.info.length - 1 ? '\n\n' : '\n';
    segs.push({ text: item.value + suffix, style: 'yellow' });
  });

  data.sections.forEach((section, sIdx) => {
    segs.push({ text: `  [${section.title}]\n`, style: 'bold cyan' });
    section.links.forEach((link, lIdx) => {
      segs.push({ text: padded(link.label), style: 'green' });
      const isLastLink = lIdx === section.links.length - 1;
      const isLastSection = sIdx === data.sections.length - 1;
      const sep = isLastLink && !isLastSection ? '\n\n' : '\n';
      segs.push({ text: link.url + sep, style: 'blue underline' });
    });
  });

  return segs;
}

function flattenChars(segments) {
  const chars = [];
  for (const seg of segments) {
    for (const ch of seg.text) {
      chars.push({ char: ch, style: seg.style });
    }
  }
  return chars;
}

function renderUpTo(chars, n) {
  let out = '';
  let buf = '';
  let curStyle = null;
  const flush = () => {
    if (buf) {
      out += applyStyle(curStyle, buf);
      buf = '';
    }
  };
  for (let i = 0; i < n; i++) {
    const { char, style } = chars[i];
    if (style !== curStyle) {
      flush();
      curStyle = style;
    }
    buf += char;
  }
  flush();
  return out;
}

function drawBox(content, borderColorFn) {
  const lines = content.split('\n');
  const width = Math.max(...lines.map((l) => stringWidth(l)));
  const top = borderColorFn('╭' + '─'.repeat(width + 2) + '╮');
  const bottom = borderColorFn('╰' + '─'.repeat(width + 2) + '╯');
  const middle = lines
    .map((l) => {
      const pad = ' '.repeat(width - stringWidth(l));
      return borderColorFn('│') + ' ' + l + pad + ' ' + borderColorFn('│');
    })
    .join('\n');
  return [top, middle, bottom].join('\n');
}

function frame(content, borderColorFn) {
  return drawBox(content, borderColorFn);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export { loadData, buildSegments, flattenChars, renderUpTo, frame };

export async function renderCard() {
  const data = await loadData();
  const segments = buildSegments(data);
  const chars = flattenChars(segments);
  const totalChars = chars.length;

  process.stdout.write(ansiEscapes.cursorHide);
  let prevHeight = 0;
  const defaultBorder = (s) => s;

  const repaint = (framed) => {
    if (prevHeight > 0) {
      process.stdout.write(ansiEscapes.cursorUp(prevHeight) + ansiEscapes.eraseDown);
    }
    process.stdout.write(framed + '\n');
    prevHeight = framed.split('\n').length;
  };

  try {
    for (let n = 1; n <= totalChars; n++) {
      const partial = renderUpTo(chars, n);
      repaint(frame(partial, defaultBorder));
      const lastChar = chars[n - 1];
      await sleep(lastChar.char === '\n' ? 100 : 20);
    }

    const fullContent = renderUpTo(chars, totalChars);
    for (let i = 1; i < 50; i++) {
      const borderColorFn = chalk.ansi256(i * 5);
      repaint(frame(fullContent, borderColorFn));
      await sleep(100);
    }
  } finally {
    process.stdout.write(ansiEscapes.cursorShow);
  }
}
