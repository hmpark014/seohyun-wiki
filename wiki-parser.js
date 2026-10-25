(function () {
  const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
  const escapeText = value => String(value ?? "").replace(/[&<>]/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;"
  })[char]);
  const safeUrl = value => {
    try {
      const url = new URL(String(value || "").trim());
      return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch { return ""; }
  };
  const safeColor = value => {
    const color = String(value || "").trim();
    if (!color || /[;{}<>]/.test(color)) return "";
    try { return CSS.supports("color", color) ? color : ""; }
    catch { return /^#[\da-f]{3}(?:[\da-f]{3}|[\da-f]{5})?$/i.test(color) || /^[a-z]+$/i.test(color) ? color : ""; }
  };
  const safeStyleLength = value => {
    const text = String(value || "").trim().toLowerCase();
    if (text === "auto" || text === "0") return text;
    const match = text.match(/^(-?\d{1,4}(?:\.\d{1,2})?)(px|em|rem|%|vw|vh)$/);
    if (!match || Math.abs(Number(match[1])) > 1600) return "";
    return text;
  };
  function safeWikiStyle(raw) {
    const styles = [];
    for (const declaration of String(raw || "").split(";")) {
      const colon = declaration.indexOf(":");
      if (colon < 1) continue;
      let property = declaration.slice(0, colon).trim().toLowerCase();
      const value = declaration.slice(colon + 1).trim();
      let safe = "";
      if (property === "background") property = "background-color";
      if (["color", "background-color", "border-color"].includes(property)) safe = safeColor(value);
      else if (property === "text-align" && /^(left|center|right|justify)$/i.test(value)) safe = value.toLowerCase();
      else if (property === "text-decoration" && /^(none|underline|line-through)$/i.test(value)) safe = value.toLowerCase();
      else if (property === "display" && /^(block|inline|inline-block)$/i.test(value)) safe = value.toLowerCase();
      else if (property === "float" && /^(left|right)$/i.test(value)) safe = value.toLowerCase();
      else if (property === "clear" && /^(left|right|both|none)$/i.test(value)) safe = value.toLowerCase();
      else if (property === "vertical-align" && /^(top|middle|bottom|baseline)$/i.test(value)) safe = value.toLowerCase();
      else if (property === "font-weight" && /^(normal|bold|[1-9]00)$/i.test(value)) safe = value.toLowerCase();
      else if (property === "font-size") {
        const length = safeStyleLength(value);
        if (length && !length.startsWith("-")) safe = length;
      } else if (["width", "max-width", "min-width", "height", "min-height", "max-height", "border-radius"].includes(property)) {
        const length = safeStyleLength(value);
        if (length && !length.startsWith("-")) safe = length;
      } else if (["padding", "padding-top", "padding-right", "padding-bottom", "padding-left", "margin", "margin-top", "margin-right", "margin-bottom", "margin-left"].includes(property)) {
        const values = value.split(/\s+/);
        const lengths = values.map(item => safeStyleLength(item));
        if (values.length <= 4 && lengths.every(Boolean)) safe = lengths.join(" ");
      } else if (property === "border") {
        const match = value.match(/^(\d{1,2}px)\s+(solid|dashed|dotted)\s+(.+)$/i);
        const color = match && safeColor(match[3]);
        if (match && color) safe = match[1] + " " + match[2].toLowerCase() + " " + color;
      } else if (property === "line-height") {
        const match = value.match(/^(\d{1,2}(?:\.\d{1,2})?)(px|em|rem|%)?$/i);
        if (match && Number(match[1]) > 0 && Number(match[1]) <= 5) safe = value;
      } else if (property === "word-break" && /^(normal|break-all|keep-all)$/i.test(value)) safe = value.toLowerCase();
      if (safe) styles.push(property + ":" + safe);
    }
    return styles.join(";");
  }
  function themeColorStyles(property, raw) {
    const colors = String(raw || "").split(",").map(value => safeColor(value.trim()));
    if (!colors[0] || colors.length > 2) return "";
    const stem = property === "background-color" ? "wiki-bg" : property === "border-color" ? "wiki-border" : "wiki-text";
    return "--" + stem + "-light:" + colors[0] + ";" + (colors[1] ? "--" + stem + "-dark:" + colors[1] + ";" : "") +
      (property === "border-color" ? "--wiki-table-border-light:" + colors[0] + ";" + (colors[1] ? "--wiki-table-border-dark:" + colors[1] + ";" : "") : "");
  }
  const slug = value => String(value || "").normalize("NFKC").toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70) || "section";
  const plainText = value => String(value || "").replace(/'''|__|~~|--|\^\^|,,/g, "").replace(/\{\{\{[^}]*\}\}\}/g, "").trim();
  const parseHeading = line => {
    const match = String(line || "").trim().match(/^(={1,6})\s*(.*?)\s*\1\s*$/);
    return match ? { level: Math.min(6, match[1].length + 1), title: plainText(match[2]) || "제목 없음" } : null;
  };
  function migrateBody(text) {
    return String(text || "").split(/\r?\n/).map(raw => {
      const line = raw.trim();
      if (line.startsWith("##")) return raw;
      let match = line.match(/^(?:#목차#?|\[목차\])\s*(.*)$/);
      if (match) return match[1] ? "== " + match[1].trim() + " ==" : "[목차]";
      match = line.match(/^(?:#(제목|소제목|강조|목록|인용|문서|링크|사진|영상|선)#?|\[(제목|소제목|강조|목록|인용|문서|링크|사진|영상|선)\])\s*(.*)$/);
      if (match) {
        const kind = match[1] || match[2], value = match[3];
        if (kind === "제목") return "= " + value + " =";
        if (kind === "소제목") return "== " + value + " ==";
        if (kind === "강조") return "'''" + value + "'''";
        if (kind === "목록") return " * " + value;
        if (kind === "인용") return "> " + value;
        if (kind === "문서") { const [target, label] = value.split("|"); return "[[" + target.trim() + (label ? "|" + label.trim() : "") + "]]"; }
        if (kind === "링크") { const [url, label] = value.split("|"); return "[[" + url.trim() + (label ? "|" + label.trim() : "") + "]]"; }
        if (kind === "사진") { const [url, alt] = value.split("|"); return "[[파일:" + url.trim() + (alt ? "|alt=" + alt.trim() : "") + "]]"; }
        if (kind === "영상") {
          const id = value.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{6,20})/i)?.[1];
          return id ? "[youtube(" + id + ")]" : value;
        }
        if (kind === "선") return "----";
      }
      match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) return "=".repeat(Math.min(6, match[1].length)) + " " + match[2].trim() + " " + "=".repeat(Math.min(6, match[1].length));
      if (/^[-*]\s+/.test(line)) return " * " + line.slice(2);
      return raw;
    }).join("\n")
      .replace(/!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g, (_, alt, url) => "[[파일:" + url + (alt ? "|alt=" + alt : "") + "]]")
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, (_, label, url) => "[[" + url + "|" + label + "]]")
      .replace(/\*\*([^*\n]+)\*\*/g, "'''$1'''")
      .replace(/`([^`\n]+)`/g, "{{{$1}}}");
  }
  function documentHeadings(text = "") {
    const headings = [];
    let codeDepth = 0;
    for (const raw of migrateBody(text).split(/\r?\n/)) {
      const line = raw.trim();
      if (codeDepth) {
        codeDepth += (line.match(/\{\{\{/g) || []).length;
        codeDepth -= (line.match(/\}\}\}/g) || []).length;
        codeDepth = Math.max(0, codeDepth);
        continue;
      }
      if (line.startsWith("{{{") && !/^\{\{\{#!(?:folding|wiki)\b/i.test(line) && !line.includes("}}}")) { codeDepth = 1; continue; }
      if (!line || line.startsWith("##")) continue;
      const heading = parseHeading(line);
      if (heading) headings.push(heading);
    }
    return headings.map((heading, index) => ({ ...heading, id: "doc-section-" + (index + 1) + "-" + slug(heading.title) }));
  }
  function findSectionHeading(headings, section) {
    const match = String(section || "").trim().match(/^s-(\d+(?:[.-]\d+)*)$/i);
    if (!match) return headings.find(item => slug(item.title) === slug(section) || item.title === section) || null;
    const wanted = match[1].split(/[.-]/).map(Number), counters = [0, 0, 0, 0, 0, 0, 0];
    for (const heading of headings) {
      const level = Math.max(2, Math.min(6, heading.level || 2));
      counters[level]++;
      for (let deeper = level + 1; deeper <= 6; deeper++) counters[deeper] = 0;
      const path = counters.slice(2, level + 1);
      if (path.length === wanted.length && path.every((part, index) => part === wanted[index])) return heading;
    }
    return null;
  }
  function buildFootnotes(text) {
    const notes = [], named = new Map();
    const entries = migrateBody(text).match(/\[\*[^\]]+\]/g) || [];
    for (const entry of entries) {
      const raw = entry.slice(2, -1).trim();
      const definition = raw.match(/^([\p{L}][\p{L}\p{N}_-]*)\s+([\s\S]+)$/u);
      const reference = raw.match(/^[\p{L}][\p{L}\p{N}_-]*$/u);
      if (definition) {
        if (!named.has(definition[1])) {
          const index = notes.push({ name: definition[1], text: definition[2].trim(), refs: 0 }) - 1;
          named.set(definition[1], index);
        } else notes[named.get(definition[1])].text = definition[2].trim();
      } else if (reference) {
        if (!named.has(raw)) {
          const index = notes.push({ name: raw, text: "각주 내용이 아직 없습니다.", refs: 0 }) - 1;
          named.set(raw, index);
        }
      } else if (raw) notes.push({ name: "", text: raw, refs: 0 });
    }
    return { notes, named };
  }
  const makeContext = (text, headings, options = {}) => ({
    notes: buildFootnotes(text), headings, options, footnoteRefCount: new Map(), printedFootnotes: new Set(), unnamedFootnoteCursor: 0, includeDepth: 0
  });
  function renderFootnotes(context) {
    const notes = context.notes.notes.map((note, index) => ({ note, index })).filter(({ index }) =>
      context.footnoteRefCount.has(index + 1) && !context.printedFootnotes.has(index));
    if (!notes.length) return "";
    return '<section class="wiki-footnotes" aria-label="각주"><strong>각주</strong><ol>' +
      notes.map(({ note, index }) => {
        context.printedFootnotes.add(index);
        const firstRef = "wiki-footnote-ref-" + (index + 1) + "-1";
        return '<li id="wiki-footnote-' + (index + 1) + '">' + renderInline(note.text, context) +
          ' <a class="wiki-footnote-back" href="#' + firstRef + '" aria-label="본문으로 돌아가기">↩</a></li>';
      }).join("") + "</ol></section>";
  }
  function imageMarkup(value) {
    const parts = String(value || "").split("|").map(part => part.trim());
    const url = safeUrl(parts.shift());
    if (!url) return "";
    let caption = "", width = "", height = "", align = "", borderRadius = "", objectFit = "";
    const options = parts.flatMap(part => part.split("&").map(option => option.trim()));
    for (const part of options) {
      let match;
      if ((match = part.match(/^width\s*=\s*(\d{1,4})$/i))) width = Math.max(40, Math.min(1600, Number(match[1]))) + "px";
      else if ((match = part.match(/^height\s*=\s*(\d{1,4})$/i))) height = Math.max(40, Math.min(1200, Number(match[1]))) + "px";
      else if ((match = part.match(/^align\s*=\s*(left|center|right)$/i))) align = match[1].toLowerCase();
      else if ((match = part.match(/^border-radius\s*=\s*(\d{1,2})$/i))) borderRadius = Math.min(32, Number(match[1])) + "px";
      else if ((match = part.match(/^object-fit\s*=\s*(contain|cover|fill|none|scale-down)$/i))) objectFit = match[1].toLowerCase();
      else if (/^alt\s*=/i.test(part)) caption = part.replace(/^alt\s*=\s*/i, "");
      else if (part && !part.includes("=") && !/^(?:link|theme|#!)/i.test(part) && !caption) caption = part;
    }
    const style = (width ? "width:" + width + ";" : "") + (height ? "height:" + height + ";" : "") +
      (borderRadius ? "border-radius:" + borderRadius + ";" : "") + (objectFit ? "object-fit:" + objectFit + ";" : "");
    return '<figure class="wiki-image' + (align ? " align-" + align : "") + '"><img src="' + escapeHtml(url) +
      '" alt="' + escapeHtml(caption || "문서 사진") + '" loading="lazy" decoding="async"' +
      (style ? ' style="' + style + '"' : "") + '>' +
      (caption ? "<figcaption>" + escapeHtml(caption) + "</figcaption>" : "") + "</figure>";
  }
  function videoMarkup(platform, raw) {
    const parts = String(raw || "").split(",").map(part => part.trim());
    const id = parts[0] || "";
    let src = "", title = "";
    if (/^youtube$/i.test(platform) && /^[A-Za-z0-9_-]{6,20}$/.test(id)) {
      src = "https://www.youtube-nocookie.com/embed/" + id; title = "YouTube 동영상";
    } else if (/^vimeo$/i.test(platform) && /^\d{5,12}$/.test(id)) {
      src = "https://player.vimeo.com/video/" + id; title = "Vimeo 동영상";
    } else if (/^nicovideo$/i.test(platform) && /^(?:sm|nm|so)\d{1,12}$/.test(id)) {
      src = "https://embed.nicovideo.jp/watch/" + encodeURIComponent(id); title = "니코니코 동영상";
    } else if (/^navertv$/i.test(platform) && /^\d{5,12}$/.test(id)) {
      src = "https://tv.naver.com/embed/v/" + encodeURIComponent(id); title = "네이버TV 동영상";
    } else return "";
    return '<div class="wiki-video"><iframe src="' + escapeHtml(src) + '" title="' + title +
      '" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>';
  }
  function parseVideoUrl(raw) {
    let source = String(raw || "").trim();
    while (/[.,!?;:]$/.test(source)) source = source.slice(0, -1);
    const safe = safeUrl(source);
    if (!safe) return null;
    let url;
    try { url = new URL(safe); } catch { return null; }
    if (url.protocol !== "https:") return null;
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    if (["youtube.com", "m.youtube.com", "music.youtube.com", "youtube-nocookie.com", "youtu.be"].includes(host)) {
      const id = host === "youtu.be" ? url.pathname.split("/").filter(Boolean)[0] :
        url.searchParams.get("v") || url.pathname.match(/^\/(?:embed|shorts|live)\/([A-Za-z0-9_-]{6,20})/)?.[1];
      if (id && /^[A-Za-z0-9_-]{6,20}$/.test(id)) {
        return { key: "youtube:" + id, html: videoMarkup("youtube", id) };
      }
      return null;
    }
    if (["vimeo.com", "player.vimeo.com"].includes(host)) {
      const segments = url.pathname.split("/").filter(Boolean);
      const id = segments.find(segment => /^\d{5,12}$/.test(segment));
      const idIndex = segments.indexOf(id);
      const hash = url.searchParams.get("h") || segments.find((segment, index) => index > idIndex && /^[A-Za-z0-9]{6,32}$/.test(segment)) || "";
      if (id) {
        const src = "https://player.vimeo.com/video/" + id + (hash ? "?h=" + encodeURIComponent(hash) : "");
        return { key: "vimeo:" + id + (hash ? ":" + hash : ""), html: '<div class="wiki-video"><iframe src="' + escapeHtml(src) + '" title="Vimeo 동영상" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></div>' };
      }
      return null;
    }
    const extension = url.pathname.match(/\.(mp4|webm|ogv)$/i)?.[1]?.toLowerCase();
    if (!extension) return null;
    const mime = extension === "ogv" ? "video/ogg" : "video/" + extension;
    return { key: "file:" + url.href, html: '<div class="wiki-video wiki-video-file"><video controls playsinline preload="metadata"><source src="' + escapeHtml(url.href) + '" type="' + mime + '">이 브라우저에서 재생할 수 없는 영상이에요.</video></div>' };
  }
  function internalLink(target, label, context) {
    const name = String(target || "").trim();
    if (/^분류\s*:/i.test(name)) return '<span class="wiki-category">' + escapeHtml(name.replace(/^분류\s*:/i, "").trim()) + "</span>";
    if (/^파일\s*:/i.test(name)) return imageMarkup(name.replace(/^파일\s*:/i, ""));
    if (name === "목차") return "";
    if (context.options.isPreview) return '<span class="wiki-preview-link">' + escapeHtml(label || name) + "</span>";
    if (/^https?:\/\//i.test(name)) {
      const url = safeUrl(name);
      if (context.options.isPreview) return '<span class="wiki-preview-link">' + escapeHtml(label || name) + "</span>";
      return url ? '<a href="' + escapeHtml(url) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(label || url) + "</a>" : escapeHtml(label || name);
    }
    if (/^#/.test(name)) {
      const section = name.slice(1).trim();
      const heading = findSectionHeading(context.headings, section);
      const id = heading?.id || "wiki-anchor-" + slug(section);
      return '<a class="wiki-section-link" href="#' + id + '" data-action="toc-jump" data-heading-id="' + id + '">' + escapeHtml(label || section) + "</a>";
    }
    const parts = name.split("#");
    const title = parts.shift().trim().replace(/^(?:\.\/|\/)+/, "");
    const section = parts.join("#").trim();
    if (!title) return escapeHtml(label || name);
    return '<button type="button" class="wiki-inline-link" data-action="wiki-link" data-title="' + escapeHtml(title) +
      (section ? '" data-section="' + escapeHtml(section) : "") + '">' + escapeHtml(label || title) + "</button>";
  }
  function renderInline(input, context) {
    const tokens = [];
    const stash = html => "\uE000" + (tokens.push(html) - 1) + "\uE001";
    let source = String(input ?? "");
    source = source.replace(/\\(\[\[|\]\]|\{\{\{|\}\}\}|\[|\]|\*|_|~|\^|,|\\)/g, (_, value) => stash(escapeHtml(value)));
    source = source.replace(/\{\{\{\s*#([^,{}\s]+)(?:,([^,{}\s]+))?\s+([\s\S]+?)\}\}\}/g,
      (_, light, dark, content) => {
        const color = safeColor(light), darkColor = dark ? safeColor(dark) : "";
        return color ? stash('<span class="wiki-colored-text" style="--wiki-color-light:' + escapeHtml(color) +
          ';' + (darkColor ? '--wiki-color-dark:' + escapeHtml(darkColor) + ";" : "") + '">' + renderInline(content, context) + "</span>") : escapeHtml(content);
      });
    source = source.replace(/\{\{\{\s*([+-][1-5])\s+([\s\S]+?)\}\}\}/g, (_, amount, content) =>
      stash('<span class="wiki-size-' + Math.abs(Number(amount)) + (amount.startsWith("-") ? " wiki-size-down" : "") + '">' + renderInline(content, context) + "</span>"));
    source = source.replace(/\{\{\{([\s\S]+?)\}\}\}/g, (_, literal) => stash('<code class="wiki-inline-code">' + escapeHtml(literal) + "</code>"));
    source = source.replace(/\[\[?include\(([^)]+)\)\]\]?/gi, (_, title) => {
      const name = title.trim();
      const docs = context.options.docs || [];
      const doc = docs.find(item => String(item.title).toLowerCase() === name.toLowerCase());
      if (!doc || context.includeDepth > 0) return stash(internalLink(name, "문서 포함: " + name, context));
      const includedBody = String(doc.body || doc.summary || "");
      const includeContext = { ...context, headings: documentHeadings(includedBody).map(heading => ({ ...heading, id: "include-" + slug(name) + "-" + heading.id })), includeDepth: context.includeDepth + 1 };
      return stash('<section class="wiki-include"><div class="wiki-include-title">' + escapeHtml(name) +
        '</div><div class="wiki-include-body">' + renderBlocks(includedBody, includeContext, { headingIndex: 0 }) +
        '</div><button type="button" class="wiki-inline-link" data-action="wiki-link" data-title="' + escapeHtml(name) + '">문서 열기</button></section>');
    });
    source = source.replace(/\[\[anchor\(([^)]+)\)\]\]/gi, (_, anchor) => stash('<span id="wiki-anchor-' + slug(anchor) + '" class="wiki-anchor"></span>'));
    source = source.replace(/\[\[([\s\S]+?)\]\]/g, (_, inside) => {
      const [target, ...labels] = inside.split("|");
      const html = internalLink(target, labels.join("|").trim(), context);
      return stash(html || "");
    });
    source = source.replace(/\[(youtube|vimeo|nicovideo|navertv)\(([^)]*)\)\]/gi, (_, platform, data) => stash(videoMarkup(platform, data) || escapeHtml("[" + platform + "(" + data + ")]")));
    source = source.replace(/\[ruby\(([^,\]]+),([^\]]+)\)\]/gi, (_, base, reading) =>
      stash("<ruby>" + escapeHtml(base.trim()) + "<rp>(</rp><rt>" + escapeHtml(reading.trim()) + "</rt><rp>)</rp></ruby>"));
    source = source.replace(/\[(https?:\/\/[^\s\]]+)(?:\s+([^\]]+))?\]/gi, (_, rawUrl, label) => {
      const url = safeUrl(rawUrl);
      if (context.options.isPreview) return stash('<span class="wiki-preview-link">' + escapeHtml(label || rawUrl) + "</span>");
      return stash(url ? '<a href="' + escapeHtml(url) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(label || url) + "</a>" : escapeHtml("[" + rawUrl + (label ? " " + label : "") + "]"));
    });
    source = source.replace(/\[anchor\(([^)]+)\)\]/gi, (_, anchor) => {
      const id = "wiki-anchor-" + slug(anchor);
      return stash('<span id="' + id + '" class="wiki-anchor"></span>');
    });
    source = source.replace(/\[br\]/gi, () => stash("<br>"));
    source = source.replace(/(\[date\]|\[datetime\])/gi, whole => {
      const now = new Date();
      const date = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
      const time = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).format(now);
      return stash(escapeHtml(whole.toLowerCase() === "[date]" ? date : date + " " + time));
    });
    source = source.replace(/\[age\((\d{4}-\d{2}-\d{2})\)\]/gi, (_, dateText) => {
      const [year, month, day] = dateText.split("-").map(Number), born = new Date(Date.UTC(year, month - 1, day));
      if (born.getUTCFullYear() !== year || born.getUTCMonth() !== month - 1 || born.getUTCDate() !== day) return stash("잘못된 날짜");
      const todayParts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
      const today = Object.fromEntries(todayParts.map(part => [part.type, Number(part.value)]));
      let age = today.year - year;
      if (today.month < month || (today.month === month && today.day < day)) age--;
      return stash(escapeHtml(String(Math.max(0, age))));
    });
    source = source.replace(/\[(?:dday|디데이)\((\d{4}-\d{2}-\d{2})\)\]/gi, (_, dateText) => {
      const [year, month, day] = dateText.split("-").map(Number);
      const target = Date.UTC(year, month - 1, day);
      const todayParts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
      const today = Object.fromEntries(todayParts.map(part => [part.type, Number(part.value)]));
      const delta = Math.round((target - Date.UTC(today.year, today.month - 1, today.day)) / 86400000);
      return stash(escapeHtml(delta === 0 ? "D-Day" : delta > 0 ? "D-" + delta : "D+" + Math.abs(delta)));
    });
    source = source.replace(/\[\*([^\]]+)\]/g, (_, raw) => {
      const value = raw.trim(), definition = value.match(/^([\p{L}][\p{L}\p{N}_-]*)\s+([\s\S]+)$/u);
      let index;
      if (definition) index = context.notes.named.get(definition[1]);
      else if (/^[\p{L}][\p{L}\p{N}_-]*$/u.test(value)) index = context.notes.named.get(value);
      else {
        const unnamed = [];
        context.notes.notes.forEach((note, noteIndex) => { if (!note.name) unnamed.push(noteIndex); });
        index = unnamed[context.unnamedFootnoteCursor++];
      }
      if (index == null || index < 0) return stash(escapeHtml("[*" + raw + "]"));
      const number = index + 1, ref = (context.footnoteRefCount.get(number) || 0) + 1;
      context.footnoteRefCount.set(number, ref);
      if (definition) context.notes.notes[index].text = definition[2].trim();
      return stash('<sup class="wiki-footnote-ref"><a id="wiki-footnote-ref-' + number + "-" + ref +
        '" href="#wiki-footnote-' + number + '" aria-label="각주 ' + number + '">[' + number + "]</a></sup>");
    });
    source = source.replace(/https?:\/\/[^\s<>\]]+/gi, raw => {
      let urlText = raw, tail = "";
      while (/[.,!?;:)]$/.test(urlText)) { tail = urlText.slice(-1) + tail; urlText = urlText.slice(0, -1); }
      const url = safeUrl(urlText);
      if (url && context.options.isPreview) return stash('<span class="wiki-preview-link">' + escapeHtml(urlText) + "</span>" + escapeHtml(tail));
      return url ? stash('<a href="' + escapeHtml(url) + '" target="_blank" rel="noopener noreferrer" class="media-url">' + escapeHtml(urlText) + "</a>" + escapeHtml(tail)) : raw;
    });
    // Apostrophes are safe in text nodes; keep them intact so bold markup can
    // be recognized after escaping HTML characters.
    let safe = escapeText(source);
    safe = safe.replace(/'''([\s\S]+?)'''/g, "<strong>$1</strong>")
      .replace(/__(.+?)__/g, "<u>$1</u>")
      .replace(/~~([\s\S]+?)~~|--([\s\S]+?)--/g, (_, a, b) => "<del>" + (a || b) + "</del>")
      .replace(/\^\^([\s\S]+?)\^\^/g, "<sup>$1</sup>")
      .replace(/,,([\s\S]+?),,/g, "<sub>$1</sub>");
    return safe.replace(/\uE000(\d+)\uE001/g, (_, index) => tokens[Number(index)] || "");
  }
  function parseTableCell(raw) {
    let value = raw.trim(), attrs = { colspan: 1, rowspan: 1, align: "", valign: "", styles: [], nopad: false };
    const directives = /^(<[^<>]+>)/;
    while (directives.test(value)) {
      const directive = value.match(directives)[1].slice(1, -1).trim();
      value = value.slice(directives.lastIndex || value.match(directives)[0].length).trimStart();
      let match;
      if ((match = directive.match(/^(?:<)?([|^])\|?(\d+)$/))) attrs.rowspan = Math.min(30, Math.max(1, Number(match[2])));
      else if ((match = directive.match(/^-(?:\|)?(\d+)$/))) attrs.colspan = Math.min(30, Math.max(1, Number(match[1])));
      else if ((match = directive.match(/^\|(\d+)$/))) attrs.rowspan = Math.min(30, Math.max(1, Number(match[1])));
      else if (directive === "(") attrs.align = "left";
      else if (directive === ":") attrs.align = "center";
      else if (directive === ")") attrs.align = "right";
      else if (/^nopad$/i.test(directive)) attrs.nopad = true;
      else if ((match = directive.match(/^(?:width|height)\s*=\s*(\d{1,4}%?)$/i))) {
        const prop = directive.toLowerCase().startsWith("width") ? "width" : "height";
        attrs.styles.push(prop + ":" + Math.min(1200, Number.parseInt(match[1], 10)) + (match[1].endsWith("%") ? "%" : "px"));
      } else if ((match = directive.match(/^(?:bgcolor|color)\s*=\s*(.+)$/i))) {
        const color = themeColorStyles(directive.toLowerCase().startsWith("bg") ? "background-color" : "color", match[1]);
        if (color) attrs.styles.push(color);
      } else if ((match = directive.match(/^valign\s*=\s*(top|middle|bottom)$/i))) attrs.valign = match[1].toLowerCase();
      else if (/^(?:table(?:width|height|align|bgcolor|color|bordercolor)|row(?:bgcolor|color)|col(?:bgcolor|color))\s*=/i.test(directive)) {
        value = "<" + directive + ">" + value;
        break;
      }
    }
    return { ...attrs, value };
  }
  function renderTable(lines, context) {
    const options = { styles: [], align: "" }, rows = [], columnStyles = new Map();
    for (const line of lines) {
      let raw = line.trim().replace(/^\|\|/, "").replace(/\|\|$/, "");
      const cells = raw.split("||").map(parseTableCell);
      const kept = [], rowStyles = [];
      for (const [cellIndex, cell] of cells.entries()) {
        let meta;
        while ((meta = cell.value.match(/^<((?:table(?:width|height|align|bgcolor|color|bordercolor)|row(?:bgcolor|color)|col(?:bgcolor|color))\s*=\s*[^>]+)>([\s\S]*)$/i))) {
          const [, directive, rest] = meta, [key, value] = directive.slice(1).split("=");
          const name = key.toLowerCase(), safe = value.trim();
          if (name === "tablealign" && /^(left|center|right)$/i.test(safe)) options.align = safe.toLowerCase();
          else if (name === "tablewidth" || name === "tableheight") {
            const size = safe.match(/^(\d{1,4})(%|px)?$/i);
            if (size) options.styles.push((name === "tablewidth" ? "width:" : "min-height:") + Math.min(1600, Number(size[1])) + (size[2] || "px"));
          } else if (/^(tablebgcolor|tablecolor|tablebordercolor)$/.test(name)) {
            const color = name === "tablebordercolor" ? themeColorStyles("border-color", safe) : themeColorStyles(name === "tablebgcolor" ? "background-color" : "color", safe);
            if (color) options.styles.push(color);
          } else if (/^row(?:bgcolor|color)$/.test(name)) {
            const color = themeColorStyles(name === "rowbgcolor" ? "background-color" : "color", safe);
            if (color) rowStyles.push(color);
          } else if (/^col(?:bgcolor|color)$/.test(name)) {
            const color = themeColorStyles(name === "colbgcolor" ? "background-color" : "color", safe);
            if (color) columnStyles.set(cellIndex, [...(columnStyles.get(cellIndex) || []), color]);
          }
          cell.value = rest;
        }
        if (cell.value || cell.colspan > 1 || cell.rowspan > 1 || cell.styles.length || cell.align) kept.push(cell);
      }
      rows.push({ cells: kept, styles: rowStyles });
    }
    const tableStyle = options.styles.length ? ' style="' + escapeHtml(options.styles.join(";")) + '"' : "";
    const tableClass = "wiki-table" + (options.align ? " table-align-" + options.align : "");
    const htmlRows = rows.map(row => {
      const rowStyle = row.styles.length ? ' style="' + escapeHtml(row.styles.join(";")) + '"' : "";
      return "<tr" + rowStyle + ">" + row.cells.map((cell, cellIndex) => {
      const cellStyles = cell.styles.slice();
      if (columnStyles.has(cellIndex)) cellStyles.push(...columnStyles.get(cellIndex));
      if (cell.align) cellStyles.push("text-align:" + cell.align);
      if (cell.valign) cellStyles.push("vertical-align:" + cell.valign);
      const style = cellStyles.length ? ' style="' + escapeHtml(cellStyles.join(";")) + '"' : "";
      return "<td" + (cell.colspan > 1 ? ' colspan="' + cell.colspan + '"' : "") +
        (cell.rowspan > 1 ? ' rowspan="' + cell.rowspan + '"' : "") +
        (cell.nopad ? ' class="wiki-table-nopad"' : "") + style + ">" + renderInline(cell.value, context) + "</td>";
      }).join("") + "</tr>";
    }).join("");
    return '<div class="wiki-table-wrap"><table class="' + tableClass + '"' + tableStyle + "><tbody>" + htmlRows + "</tbody></table></div>";
  }
  function listMarker(line) {
    const match = String(line).match(/^(\s+)(\*+|\d+\.|[A-Za-z]\.)(?:#(\d+))?\s+(.*)$/);
    if (!match) return null;
    const indent = match[1].replace(/\t/g, "  ").length;
    const marker = match[2];
    return {
      depth: Math.max(0, indent - 1) + (marker.startsWith("*") ? marker.length - 1 : 0),
      type: marker.startsWith("*") ? "ul" : "ol",
      order: marker === "A." ? "A" : marker === "a." ? "a" : marker === "I." ? "I" : marker === "i." ? "i" : "1",
      start: Math.max(1, Number(match[3] || 1)),
      text: match[4]
    };
  }
  function renderList(nodes, context) {
    let html = "", index = 0;
    while (index < nodes.length) {
      const first = nodes[index], listType = first.type + (first.type === "ol" ? "-" + first.order : "");
      let end = index;
      while (end < nodes.length && nodes[end].type + (nodes[end].type === "ol" ? "-" + nodes[end].order : "") === listType) end++;
      const tag = first.type, typeAttr = first.type === "ol" ? ' type="' + first.order + '"' + (first.start > 1 ? ' start="' + first.start + '"' : "") : "";
      html += "<" + tag + ' class="wiki-list"' + typeAttr + ">" + nodes.slice(index, end).map(node =>
        "<li>" + renderInline(node.text, context) + (node.children.length ? renderList(node.children, context) : "") + "</li>").join("") + "</" + tag + ">";
      index = end;
    }
    return html;
  }
  function renderBlocks(text, context, cursor) {
    const lines = String(text).split(/\r?\n/), output = [], roots = [], stack = [];
    const flushList = () => { if (roots.length) { output.push(renderList(roots.splice(0), context)); stack.length = 0; } };
    const addList = item => {
      const node = { ...item, children: [] };
      if (item.depth <= 0 || !stack.length) { roots.push(node); stack.length = 0; stack.push(node); return; }
      const parent = stack[Math.min(item.depth - 1, stack.length - 1)];
      parent.children.push(node);
      stack.length = Math.min(item.depth, stack.length);
      stack.push(node);
    };
    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i], trimmed = raw.trim();
      if (!trimmed) { flushList(); continue; }
      if (trimmed.startsWith("##")) { flushList(); continue; }
      const fold = trimmed.match(/^\{\{\{#!folding(?:\s+(.+))?$/i);
      const wikiBox = trimmed.match(/^\{\{\{#!wiki(?:\s+(.+))?$/i);
      const code = trimmed.match(/^\{\{\{(?:#!(?:syntax|code|wiki|html)\s*([^\s}]*)|(\w+))?\s*$/i);
      if (fold || wikiBox || code || (trimmed.startsWith("{{{") && !trimmed.includes("}}}"))) {
        flushList();
        let depth = 1, content = [], end = i + 1;
        for (; end < lines.length; end++) {
          const current = lines[end], opens = (current.match(/\{\{\{/g) || []).length, closes = (current.match(/\}\}\}/g) || []).length;
          if (end === i) continue;
          if (opens || closes) {
            const textPart = current.replace(/\{\{\{|\}\}\}/g, "");
            if (depth + opens - closes <= 0) {
              if (textPart.trim()) content.push(textPart);
              depth = 0; break;
            }
            content.push(current);
            depth += opens - closes;
          } else content.push(current);
        }
        i = Math.min(end, lines.length - 1);
        if (fold) {
          const label = fold[1] || "내용 펼치기";
          output.push('<details class="wiki-folding"><summary>' + renderInline(label, context) + "</summary><div>" +
            renderBlocks(content.join("\n"), context, cursor) + "</div></details>");
        } else if (wikiBox) {
          const args = wikiBox[1] || "";
          const styleMatch = args.match(/\bstyle\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s]+))/i);
          const safeStyle = safeWikiStyle(styleMatch?.[1] || styleMatch?.[2] || styleMatch?.[3] || "");
          output.push('<div class="wiki-box"' + (safeStyle ? ' style="' + escapeHtml(safeStyle) + '"' : "") + ">" + renderBlocks(content.join("\n"), context, cursor) + "</div>");
        } else {
          const language = code?.[1] || code?.[2] || "";
          output.push('<pre class="wiki-code"' + (language ? ' data-language="' + escapeHtml(language.toLowerCase()) + '"' : "") +
            "><code>" + escapeHtml(content.join("\n")) + "</code></pre>");
        }
        continue;
      }
      const tocMacro = trimmed.match(/^\[(?:목차|tableofcontents)(?:\(\s*(hide)\s*\))?\]$/i);
      if (tocMacro) {
        flushList();
        const toc = renderTocMarkup(context.headings);
        output.push(tocMacro[1] && toc ? '<details class="wiki-toc-folding"><summary>목차 보기</summary>' + toc + "</details>" : toc);
        continue;
      }
      if (/^\[\[?include\([^)]+\)\]\]?$/i.test(trimmed)) { flushList(); output.push(renderInline(trimmed, context)); continue; }
      if (/^\[(?:각주|footnote)\]$/i.test(trimmed)) { flushList(); output.push(renderFootnotes(context)); continue; }
      const heading = parseHeading(trimmed);
      if (heading) {
        flushList();
        const item = context.headings[cursor.headingIndex++];
        const level = heading.level;
        output.push("<h" + level + (item ? ' id="' + item.id + '"' : "") + ">" + renderInline(heading.title, context) + "</h" + level + ">");
        continue;
      }
      const redirect = trimmed.match(/^#redirect\s+(.+)$/i);
      if (redirect) {
        flushList();
        const [target, ...label] = redirect[1].split("|");
        output.push('<p class="wiki-redirect">이 문서는 ' + internalLink(target.trim(), label.join("|").trim() || target.trim(), context) + " 문서로 연결됩니다.</p>");
        continue;
      }
      if (/^\[\[(?:분류|category)\s*:/i.test(trimmed)) {
        flushList();
        output.push('<p class="wiki-category-row">' + renderInline(trimmed, context) + "</p>");
        continue;
      }
      if (/^\|\|/.test(trimmed)) {
        flushList();
        const tableLines = [];
        while (i < lines.length && /^\s*\|\|.*\|\|\s*$/.test(lines[i])) tableLines.push(lines[i++]);
        i--;
        output.push(renderTable(tableLines, context));
        continue;
      }
      const item = listMarker(raw);
      if (item) { addList(item); continue; }
      const video = parseVideoUrl(trimmed);
      if (video) { flushList(); output.push(video.html); continue; }
      flushList();
      if (/^-{4,}$/.test(trimmed)) output.push('<hr class="wiki-divider">');
      else if (/^\[clearfix\]$/i.test(trimmed)) output.push('<div class="wiki-clearfix"></div>');
      else if (/^>\s?/.test(trimmed)) output.push('<blockquote class="wiki-quote">' + renderInline(trimmed.replace(/^>\s?/, ""), context) + "</blockquote>");
      else output.push("<p>" + renderInline(trimmed, context) + "</p>");
    }
    flushList();
    return output.join("");
  }
  function renderTocMarkup(headings = []) {
    if (!headings.length) return "";
    return '<nav class="article-toc article-toc-top" aria-label="문서 목차"><div class="toc-title">목차</div><div class="toc-items">' +
      headings.map((heading, index) => '<button type="button" class="toc-item' + (heading.level > 2 ? " level-" + heading.level : "") +
        '" data-action="toc-jump" data-heading-id="' + heading.id + '"><span class="toc-number">' + (index + 1) +
        "</span><span>" + escapeHtml(heading.title) + "</span></button>").join("") + "</div></nav>";
  }
  function markdownHtml(text = "", headingIds = null, tocMarkup = null, options = {}) {
    const normalized = migrateBody(text);
    const headings = documentHeadings(normalized);
    if (headingIds && headingIds.length) headings.forEach((heading, index) => { if (headingIds[index]) heading.id = headingIds[index]; });
    const context = makeContext(normalized, headings, options);
    const html = renderBlocks(normalized, context, { headingIndex: 0 });
    return html + renderFootnotes(context);
  }
  function countImages(text) {
    return (migrateBody(text).match(/\[\[파일\s*:\s*https?:\/\/[^|\]]+(?:\|[^\]]*)?\]\]/gi) || []).length;
  }
  function countVideos(text) {
    const source = migrateBody(text), videos = new Set();
    for (const match of source.matchAll(/\[(youtube|vimeo|nicovideo|navertv)\(([^)]*)\)\]/gi)) {
      const platform = match[1].toLowerCase(), raw = match[2].split(",")[0].trim();
      if (videoMarkup(platform, raw)) videos.add(platform + ":" + raw);
    }
    for (const line of source.split(/\r?\n/)) {
      const video = parseVideoUrl(line.trim());
      if (video) videos.add(video.key);
    }
    return videos.size;
  }
  function editorGuideHtml() {
    const groups = [
      { title: "제목과 목차", items: [
        ["= 큰 제목 =", "문서의 큰 제목을 만들어요. = 기호를 늘리면 더 작은 제목이 돼요.", "= 큰 제목 =\n\n", "큰 제목"],
        ["== 작은 제목 ==", "큰 제목 아래에 소제목을 만들어요.", "== 작은 제목 ==\n\n", "작은 제목"],
        ["[tableofcontents]", "이 줄에 목차를 표시해요. 먼저 제목 문법으로 제목을 작성해 주세요.", "[tableofcontents]\n", ""],
        ["[tableofcontents(hide)]", "‘목차 보기’를 눌러 펼치는 접힌 목차예요.", "[tableofcontents(hide)]\n", ""]
      ]},
      { title: "글자 서식", items: [
        ["'''굵게'''", "굵은 글자", "'''텍스트'''", "텍스트"],
        ["__밑줄__", "밑줄", "__텍스트__", "텍스트"],
        ["~~취소선~~ · --취소선--", "두 방식 모두 취소선", "~~텍스트~~", "텍스트"],
        ["^^위첨자^^ · ,,아래첨자,,", "위첨자와 아래첨자", "^^텍스트^^", "텍스트"],
        ["{{{+2 크게}}} · {{{-2 작게}}}", "글자 크기 -5부터 +5", "{{{+2 크게}}}", "크게"],
        ["{{{#red 글자}}}", "글자색 지정", "{{{#red 텍스트}}}", "텍스트"],
        ["{{{#red,#ff0 글자}}}", "앞은 라이트 모드, 뒤는 다크 모드 글자색", "{{{#red,#ff0 텍스트}}}", "텍스트"],
        ["{{{[[기호]]}}}", "안쪽 문법을 적용하지 않고 그대로 표시", "{{{[[기호]]}}}", "[[기호]]"]
      ]},
      { title: "링크와 사진·동영상", items: [
        ["[[문서명]] · [[문서명|표시할 글자]]", "다른 문서로 연결", "[[문서명|표시할 글자]]", "표시할 글자"],
        ["[[문서명#문단|표시]]", "다른 문서의 문단으로 연결", "[[문서명#문단|표시]]", "표시"],
        ["[[문서명#s-1|첫 문단으로]]", "문서 안의 번호가 있는 문단으로 연결", "[[문서명#s-1|첫 문단으로]]", "첫 문단으로"],
        ["[include(문서명)]", "기존 문서의 본문을 이 자리에 보여 줘요.", "[include(문서명)]", "문서명"],
        ["[https://주소 표시할 글자]", "대괄호 한 쌍으로 외부 사이트 연결", "[https://example.com 서현위키 안내]", "서현위키 안내"],
        ["YouTube 또는 Vimeo 주소", "영상 주소를 한 줄에 붙여 넣으면 재생 화면으로 보여요.", "https://youtu.be/영상ID\n", "https://youtu.be/영상ID"],
        ["MP4 · WebM · OGV 주소", "공개된 영상 파일의 HTTPS 주소를 한 줄에 붙여 넣어요.", "https://example.com/video.mp4\n", "https://example.com/video.mp4"]
      ]},
      { title: "목록과 문단 꾸미기", items: [
        [" * 항목", "글머리 목록 · 앞에 공백 한 칸", " * 항목\n * 다음 항목", "항목"],
        [" 1. 항목", "번호 목록 · 숫자는 1.로 반복", " 1. 항목\n 1. 다음 항목", "항목"],
        [" a. 항목 · A. 항목 · i. 항목", "알파벳·로마 숫자 목록", " a. 항목", "항목"],
        [" > 인용문", "인용 문단", " > 인용문", "인용문"],
        ["----", "구분선", "----\n", ""],
        ["{{{#!folding 제목\n내용\n}}}", "누르면 펼쳐지는 접기 영역", "{{{#!folding 제목\n내용\n}}}", "제목"],
        ["{{{#!wiki style=\"background-color:#ffffcc; padding:12px; border:1px solid #ddddaa\"\n내용\n}}}", "안전한 범위의 배경색·여백·테두리 상자", "{{{#!wiki style=\"background-color:#ffffcc; padding:12px; border:1px solid #ddddaa\"\n내용\n}}}", "내용"],
        ["[br] · [clearfix]", "강제 줄바꿈과 배치 초기화", "[br]", ""]
      ]},
      { title: "표", items: [
        ["|| 제목 || 제목 ||\n|| 내용 || 내용 ||", "두 칸 표", "|| 제목 || 제목 ||\n|| 내용 || 내용 ||", "제목"],
        ["<-2> · <|2>", "셀을 가로 또는 세로로 합치기", "||<-2> 넓은 칸 ||\n||<|2> 높은 칸 || 내용 ||", "넓은 칸"],
        ["<(> · <:> · <)>", "왼쪽·가운데·오른쪽 정렬", "||<:> 가운데 정렬 ||", "가운데 정렬"],
        ["<width=50%> · <bgcolor=#ffffcc>", "셀 너비와 배경색", "||<width=50%><bgcolor=#ffffcc> 셀 ||", "셀"]
      ]},
      { title: "각주와 자동 표시", items: [
        ["[* 설명]", "본문에 각주 표시", "설명[* 각주 내용]", "설명"],
        ["[*참고 학교 안내] · [*참고]", "이름을 붙인 각주를 다시 사용해요.", "내용[*참고 학교 안내] 다음 내용[*참고]", "내용"],
        ["[각주] · [footnote]", "각주를 이 위치에 모아 표시", "[각주]\n", ""],
        ["[date] · [datetime]", "오늘 날짜와 접속 시각", "[date] · [datetime]", ""],
        ["[dday(2026-12-31)]", "기준일까지 남은 날 또는 지난 날", "[dday(2026-12-31)]", "2026-12-31"],
        ["[age(2000-01-01)]", "생년월일 기준 만 나이 · 개인 정보 입력에 주의", "[age(2000-01-01)]", "2000-01-01"]
      ]},
      { title: "읽기 보조", items: [
        ["[ruby(한글,읽는 법)]", "글자 위에 읽는 법 표시", "[ruby(漢字,한자)]", "漢字"]
      ]},
      { title: "문서 관리 문법", items: [
        ["[[분류:학교생활]]", "문서 분류", "[[분류:학교생활]]\n", "학교생활"],
        ["#redirect 문서명", "다른 문서로 연결하는 안내", "#redirect 문서명\n", "문서명"],
        ["## 편집자에게만 보이는 메모", "본문에는 표시되지 않는 주석", "## 편집 메모\n", "편집 메모"],
        ["[anchor(이름)] · [[#이름]]", "문서 안의 원하는 위치로 연결", "[anchor(위치)]", "위치"],
        ["{{{코드 그대로}}} · {{{#!syntax js", "코드 예시 표시 · HTML/스크립트 실행은 차단", "{{{#!syntax js\nconsole.log('안전한 예시');\n}}}", "console.log"]
      ]}
    ];
    const rows = items => items.map(([example, description, markup, selection]) => {
      const search = (example + " " + description).toLocaleLowerCase("ko");
      return '<article class="editor-syntax-card" data-syntax-search="' + escapeHtml(search) + '"><div class="editor-syntax-copy"><code>' + escapeHtml(example) + '</code><small>' + escapeHtml(description) + '</small></div><button type="button" data-action="insert-markup" data-markup="' + escapeHtml(markup) + '"' + (selection ? ' data-select-markup="' + escapeHtml(selection) + '"' : "") + '>넣기</button></article>';
    }).join("");
    return '<p class="editor-guide-intro">기본 작성은 위 도구만으로 할 수 있어요. 아래 문법은 직접 입력하거나 더 세밀하게 꾸미고 싶을 때 참고하세요.</p>' +
      '<label class="editor-guide-search">고급 문법 검색<input id="syntaxHelpSearch" type="search" placeholder="예: 목차, 표, 글자색" autocomplete="off"></label>' +
      groups.map(group => '<details class="editor-guide-group"><summary>' + escapeHtml(group.title) + '</summary><div class="editor-syntax-list">' + rows(group.items) + '</div></details>').join("") +
      '<p class="editor-guide-empty" id="editorGuideEmpty" hidden>검색한 문법이 없어요. 다른 단어로 찾아보세요.</p>' +
      '<p class="editor-markup-note">사진은 편집기의 사진 추가 버튼으로 넣고, 동영상은 재생 가능한 HTTPS 링크를 한 줄에 붙여 넣으세요. 일부 영상은 원본 사이트의 퍼가기 설정에 따라 재생되지 않을 수 있어요. 개인정보가 보이는 사진은 올리지 마세요. 임의 HTML·CSS·스크립트 실행이나 지원하지 않는 사이트 전용 문법은 사용할 수 없습니다.</p>';
  }
  window.WikiParser = { markdownHtml, inlineMarkdown: (line, context = {}) => renderInline(line, context.notes ? context : makeContext(line, context.headings || [], context)), documentHeadings, findSectionHeading, renderTocMarkup, countImages, countVideos, editorGuideHtml, migrateBody };
})();
