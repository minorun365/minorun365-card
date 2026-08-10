import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import chalk from 'chalk';
import stringWidth from 'string-width';
import ansiEscapes from 'ansi-escapes';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LIGHT_BACKGROUND_CODES = new Set([7, 10, 11, 14, 15]);

async function loadData() {
  const candidates = [
    path.join(__dirname, '..', 'data.json'),
    path.join(__dirname, '..', '..', 'python', 'src', 'minorun365', 'data.json'),
  ];
  for (const p of candidates) {
    try {
      const raw = await readFile(p, 'utf-8');
      return JSON.parse(raw);
    } catch {}
  }
  throw new Error('data.json not found');
}

function isLightBackground(colorfgbg = process.env.COLORFGBG ?? '') {
  const background = Number.parseInt(colorfgbg.split(';').at(-1), 10);
  return LIGHT_BACKGROUND_CODES.has(background);
}

function createPalette(lightBackground = isLightBackground()) {
  if (lightBackground) {
    return {
      title: chalk.bold.blue,
      section: chalk.bold.ansi256(30),
      label: chalk.ansi256(242),
      value: (text) => text,
      link: chalk.underline,
      border: chalk.ansi256(245),
    };
  }
  return {
    title: chalk.bold.blueBright,
    section: chalk.bold.cyanBright,
    label: chalk.ansi256(250),
    value: (text) => text,
    link: chalk.underline,
    border: chalk.ansi256(240),
  };
}

function applyStyle(styleName, text, palette) {
  return palette[styleName]?.(text) ?? text;
}

function buildSegments(data) {
  const allLabels = [
    ...data.info.map((i) => i.label),
    ...data.sections.flatMap((s) => s.links.map((l) => l.label)),
  ];
  const labelWidth = Math.max(...allLabels.map((lbl) => `${lbl}:`.length)) + 2;
  const padded = (label) => `${label}:`.padEnd(labelWidth, ' ');

  const segs = [];
  segs.push({ text: `\n${data.name}\n\n`, style: 'title' });

  data.info.forEach((item, idx) => {
    segs.push({ text: padded(item.label), style: 'label' });
    const suffix = idx === data.info.length - 1 ? '\n\n' : '\n';
    segs.push({ text: item.value + suffix, style: 'value' });
  });

  data.sections.forEach((section, sIdx) => {
    segs.push({ text: `[${section.title}]\n`, style: 'section' });
    section.links.forEach((link, lIdx) => {
      segs.push({ text: padded(link.label), style: 'label' });
      const isLastLink = lIdx === section.links.length - 1;
      const isLastSection = sIdx === data.sections.length - 1;
      const sep = isLastLink && !isLastSection ? '\n\n' : '\n';
      segs.push({ text: link.url + sep, style: 'link' });
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

function renderUpTo(chars, n, palette = createPalette()) {
  let out = '';
  let buf = '';
  let curStyle = null;
  const flush = () => {
    if (buf) {
      out += applyStyle(curStyle, buf, palette);
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
  const maxLineWidth = Math.max(...lines.map((l) => stringWidth(l)));
  const sidePadding = 2;
  const innerWidth = maxLineWidth + sidePadding * 2;
  const top = borderColorFn('╭' + '─'.repeat(innerWidth) + '╮');
  const bottom = borderColorFn('╰' + '─'.repeat(innerWidth) + '╯');
  const middle = lines
    .map((l) => {
      const rightFill = innerWidth - sidePadding - stringWidth(l);
      return borderColorFn('│') + ' '.repeat(sidePadding) + l + ' '.repeat(rightFill) + borderColorFn('│');
    })
    .join('\n');
  return [top, middle, bottom].join('\n');
}

function frame(content, borderColorFn) {
  return drawBox(content, borderColorFn);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export { loadData, isLightBackground, createPalette, buildSegments, flattenChars, renderUpTo, frame };

export async function renderCard() {
  const data = await loadData();
  const segments = buildSegments(data);
  const chars = flattenChars(segments);
  const totalChars = chars.length;
  const palette = createPalette();

  process.stdout.write(ansiEscapes.cursorHide);
  let prevHeight = 0;
  const repaint = (framed) => {
    if (prevHeight > 0) {
      process.stdout.write(ansiEscapes.cursorUp(prevHeight) + ansiEscapes.eraseDown);
    }
    process.stdout.write(framed + '\n');
    prevHeight = framed.split('\n').length;
  };

  try {
    for (let n = 1; n <= totalChars; n++) {
      const partial = renderUpTo(chars, n, palette);
      repaint(frame(partial, palette.border));
      const lastChar = chars[n - 1];
      await sleep(lastChar.char === '\n' ? 100 : 20);
    }
  } finally {
    process.stdout.write(ansiEscapes.cursorShow);
  }
}
