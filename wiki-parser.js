(function () {
  const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
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
  const slug = value => String(value || "").normalize("NFKC").toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70) || "section";
  const plainText = value => String(value || "").replace(/'''|''|__|~~|--|\^\^|,,/g, "").replace(/\{\{\{[^}]*\}\}\}/g, "").trim();
  const parseHeading = line => {
    const match = String(line || "").trim().match(/^(={1,6})\s*(.*?)\s*\1\s*$/);
    return match ? { level: Math.min(6, match[1].length + 1), title: plainText(match[2]) || "제목 없음" } : null;
  };
  function migrateBody(text) {
    return String(text || "").split(/\r?\n/).map(raw => {
      const line = raw.trim();
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
  function buildFootnotes(text) {
    const notes = [], named = new Map();
    const entries = migrateBody(text).match(/\[\*[^\]]+\]/g) || [];
    for (const entry of entries) {
      const raw = entry.slice(2, -1).trim();
      const definition = raw.match(/^([A-Za-z][\w-]*)\s+([\s\S]+)$/);
      const reference = raw.match(/^[A-Za-z][\w-]*$/);
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
    notes: buildFootnotes(text), headings, options, footnoteRefCount: new Map(), unnamedFootnoteCursor: 0, includeDepth: 0
  });
  function renderFootnotes(context) {
    const notes = context.notes.notes;
    if (!notes.length) return "";
    return '<section class="wiki-footnotes" aria-label="각주"><strong>각주</strong><ol>' +
      notes.map((note, index) => {
        const firstRef = "wiki-footnote-ref-" + (index + 1) + "-1";
        return '<li id="wiki-footnote-' + (index + 1) + '">' + renderInline(note.text, context) +
          ' <a class="wiki-footnote-back" href="#' + firstRef + '" aria-label="본문으로 돌아가기">↩</a></li>';
      }).join("") + "</ol></section>";
  }
  function imageMarkup(value) {
    const parts = String(value || "").split("|").map(part => part.trim());
    const url = safeUrl(parts.shift());
    if (!url) return "";
    let caption = "", width = "", height = "", align = "", borderRadius = "";
    for (const part of parts) {
      let match;
      if ((match = part.match(/^width\s*=\s*(\d{1,4})$/i))) width = Math.max(40, Math.min(1600, Number(match[1]))) + "px";
      else if ((match = part.match(/^height\s*=\s*(\d{1,4})$/i))) height = Math.max(40, Math.min(1200, Number(match[1]))) + "px";
      else if ((match = part.match(/^align\s*=\s*(left|center|right)$/i))) align = match[1].toLowerCase();
      else if ((match = part.match(/^border-radius\s*=\s*(\d{1,2})$/i))) borderRadius = Math.min(32, Number(match[1])) + "px";
      else if (/^alt\s*=/i.test(part)) caption = part.replace(/^alt\s*=\s*/i, "");
      else if (part && !/^(?:link|theme|#!)/i.test(part)) caption = part;
    }
    const style = (width ? "width:" + width + ";" : "") + (height ? "height:" + height + ";" : "") +
      (borderRadius ? "border-radius:" + borderRadius + ";" : "");
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
    } else return "";
    return '<div class="wiki-video"><iframe src="' + escapeHtml(src) + '" title="' + title +
      '" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>';
  }
  function internalLink(target, label, context) {
    const name = String(target || "").trim();
    if (/^분류\s*:/i.test(name)) return '<span class="wiki-category">' + escapeHtml(name.replace(/^분류\s*:/i, "").trim()) + "</span>";
    if (/^파일\s*:/i.test(name)) return imageMarkup(name.replace(/^파일\s*:/i, ""));
    if (name === "목차") return "";
    if (/^https?:\/\//i.test(name)) {
      const url = safeUrl(name);
      return url ? '<a href="' + escapeHtml(url) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(label || url) + "</a>" : escapeHtml(label || name);
    }
    if (/^#/.test(name)) {
      const section = name.slice(1).trim();
      const heading = context.headings.find(item => slug(item.title) === slug(section) || item.title === section);
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
    source = source.replace(/\{\{\{\s*#([^,{}\s]+)(?:,([^{}]+))?\s+([\s\S]+?)\}\}\}/g,
      (_, light, dark, content) => {
        const color = safeColor(light), darkColor = dark ? safeColor(dark) : "";
        return color ? stash('<span class="wiki-colored-text" style="--wiki-color-light:' + escapeHtml(color) +
          ';' + (darkColor ? '--wiki-color-dark:' + escapeHtml(darkColor) + ";" : "") + '">' + renderInline(content, context) + "</span>") : escapeHtml(content);
      });
    source = source.replace(/\{\{\{\s*([+-][1-5])\s+([\s\S]+?)\}\}\}/g, (_, amount, content) =>
      stash('<span class="wiki-size-' + Math.abs(Number(amount)) + (amount.startsWith("-") ? " wiki-size-down" : "") + '">' + renderInline(content, context) + "</span>"));
    source = source.replace(/\{\{\{([\s\S]+?)\}\}\}/g, (_, literal) => stash('<code class="wiki-inline-code">' + escapeHtml(literal) + "</code>"));
    source = source.replace(/\[\[include\(([^)]+)\)\]\]/gi, (_, title) => {
      const name = title.trim();
      const docs = context.options.docs || [];
      const doc = docs.find(item => String(item.title).toLowerCase() === name.toLowerCase());
      if (!doc || context.includeDepth > 0) return stash(internalLink(name, "문서 포함: " + name, context));
      const excerpt = String(doc.summary || doc.body || "").split(/\r?\n/).filter(line => line.trim() && !parseHeading(line)).slice(0, 4).join(" ");
      return stash('<section class="wiki-include"><div class="wiki-include-title">' + escapeHtml(name) + "</div><p>" +
        renderInline(excerpt.slice(0, 500), { ...context, includeDepth: context.includeDepth + 1 }) +
        '</p><button type="button" class="wiki-inline-link" data-action="wiki-link" data-title="' + escapeHtml(name) + '">문서 열기</button></section>');
    });
    source = source.replace(/\[\[anchor\(([^)]+)\)\]\]/gi, (_, anchor) => stash('<span id="wiki-anchor-' + slug(anchor) + '" class="wiki-anchor"></span>'));
    source = source.replace(/\[\[([\s\S]+?)\]\]/g, (_, inside) => {
      const [target, ...labels] = inside.split("|");
      const html = internalLink(target, labels.join("|").trim(), context);
      return stash(html || "");
    });
    source = source.replace(/\[(youtube|vimeo)\(([^)]*)\)\]/gi, (_, platform, data) => stash(videoMarkup(platform, data) || escapeHtml("[" + platform + "(" + data + ")]")));
    source = source.replace(/\[anchor\(([^)]+)\)\]/gi, (_, anchor) => {
      const id = "wiki-anchor-" + slug(anchor);
      return stash('<span id="' + id + '" class="wiki-anchor"></span>');
    });
    source = source.replace(/\[br\]/gi, () => stash("<br>"));
    source = source.replace(/(\[date\]|\[datetime\])/gi, whole => stash(escapeHtml(new Intl.DateTimeFormat("ko-KR", whole.toLowerCase() === "[date]" ? { dateStyle: "long" } : { dateStyle: "long", timeStyle: "short" }).format(new Date()))));
    source = source.replace(/\[(?:dday|디데이)\((\d{4}-\d{2}-\d{2})\)\]/gi, (_, dateText) => {
      const target = new Date(dateText + "T00:00:00"), today = new Date();
      today.setHours(0, 0, 0, 0);
      const delta = Math.ceil((target - today) / 86400000);
      return stash(escapeHtml(delta === 0 ? "D-Day" : delta > 0 ? "D-" + delta : "D+" + Math.abs(delta)));
    });
    source = source.replace(/\[\*([^\]]+)\]/g, (_, raw) => {
      const value = raw.trim(), definition = value.match(/^([A-Za-z][\w-]*)\s+([\s\S]+)$/);
      let index;
      if (definition) index = context.notes.named.get(definition[1]);
      else if (/^[A-Za-z][\w-]*$/.test(value)) index = context.notes.named.get(value);
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
      return url ? stash('<a href="' + escapeHtml(url) + '" target="_blank" rel="noopener noreferrer" class="media-url">' + escapeHtml(urlText) + "</a>" + escapeHtml(tail)) : raw;
    });
    let safe = escapeHtml(source);
    safe = safe.replace(/'''([\s\S]+?)'''/g, "<strong>$1</strong>")
      .replace(/''([\s\S]+?)''/g, "<em>$1</em>")
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
      if ((match = directive.match(/^(?:<)?([|^])\|(\d+)$/))) attrs.rowspan = Math.min(30, Math.max(1, Number(match[2])));
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
        const color = safeColor(match[1]);
        if (color) attrs.styles.push((directive.toLowerCase().startsWith("bg") ? "background-color:" : "color:") + color);
      } else if ((match = directive.match(/^valign\s*=\s*(top|middle|bottom)$/i))) attrs.valign = match[1].toLowerCase();
      else if (/^(?:table(?:width|height|align|bgcolor|color|bordercolor)|row(?:bgcolor|color)|col(?:bgcolor|color))\s*=/i.test(directive)) {
        value = "<" + directive + ">" + value;
        break;
      }
    }
    return { ...attrs, value };
  }
  function renderTable(lines, context) {
    const options = { styles: [], align: "" }, rows = [];
    for (const line of lines) {
      let raw = line.trim().replace(/^\|\|/, "").replace(/\|\|$/, "");
      const cells = raw.split("||").map(parseTableCell);
      const kept = [], rowStyles = [];
      for (const cell of cells) {
        let meta;
        while ((meta = cell.value.match(/^<((?:table(?:width|height|align|bgcolor|color|bordercolor)|row(?:bgcolor|color)|col(?:bgcolor|color))\s*=\s*[^>]+)>([\s\S]*)$/i))) {
          const [, directive, rest] = meta, [key, value] = directive.slice(1).split("=");
          const name = key.toLowerCase(), safe = value.trim();
          if (name === "tablealign" && /^(left|center|right)$/i.test(safe)) options.align = safe.toLowerCase();
          else if (name === "tablewidth" || name === "tableheight") {
            const size = safe.match(/^(\d{1,4})(%|px)?$/i);
            if (size) options.styles.push((name === "tablewidth" ? "width:" : "min-height:") + Math.min(1600, Number(size[1])) + (size[2] || "px"));
          } else if (/^(tablebgcolor|tablecolor|tablebordercolor)$/.test(name)) {
            const color = safeColor(safe);
            if (color) options.styles.push(({ tablebgcolor: "background-color:", tablecolor: "color:", tablebordercolor: "--wiki-table-border:" })[name] + color);
          } else if (/^row(?:bgcolor|color)$/.test(name)) {
            const color = safeColor(safe);
            if (color) rowStyles.push((name === "rowbgcolor" ? "background-color:" : "color:") + color);
          } else if (/^col(?:bgcolor|color)$/.test(name)) {
            const color = safeColor(safe);
            if (color) cell.styles.push((name === "colbgcolor" ? "background-color:" : "color:") + color);
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
      return "<tr" + rowStyle + ">" + row.cells.map(cell => {
      const cellStyles = cell.styles.slice();
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
    const match = String(line).match(/^(\s+)(\*+|\d+\.|[A-Za-z]\.)\s+(.*)$/);
    if (!match) return null;
    const indent = match[1].replace(/\t/g, "  ").length;
    const marker = match[2];
    return {
      depth: Math.max(0, indent - 1) + (marker.startsWith("*") ? marker.length - 1 : 0),
      type: marker.startsWith("*") ? "ul" : "ol",
      order: marker === "A." ? "A" : marker === "a." ? "a" : "1",
      text: match[3]
    };
  }
  function renderList(nodes, context) {
    let html = "", index = 0;
    while (index < nodes.length) {
      const first = nodes[index], listType = first.type + (first.type === "ol" ? "-" + first.order : "");
      let end = index;
      while (end < nodes.length && nodes[end].type + (nodes[end].type === "ol" ? "-" + nodes[end].order : "") === listType) end++;
      const tag = first.type, typeAttr = first.type === "ol" ? ' type="' + first.order + '"' : "";
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
      const wikiBox = trimmed.match(/^\{\{\{#!wiki(?:\s+.*)?$/i);
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
          output.push('<div class="wiki-box">' + renderBlocks(content.join("\n"), context, cursor) + "</div>");
        } else {
          const language = code?.[1] || code?.[2] || "";
          output.push('<pre class="wiki-code"' + (language ? ' data-language="' + escapeHtml(language.toLowerCase()) + '"' : "") +
            "><code>" + escapeHtml(content.join("\n")) + "</code></pre>");
        }
        continue;
      }
      if (trimmed === "[목차]") { flushList(); output.push(renderTocMarkup(context.headings)); continue; }
      if (trimmed === "[각주]") { flushList(); output.push(renderFootnotes(context)); continue; }
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
    if (context.notes.notes.length && !html.includes('class="wiki-footnotes"')) return html + renderFootnotes(context);
    return html;
  }
  function countImages(text) {
    return (migrateBody(text).match(/\[\[파일\s*:\s*https?:\/\/[^|\]]+(?:\|[^\]]*)?\]\]/gi) || []).length;
  }
  function countVideos(text) {
    return (migrateBody(text).match(/\[(?:youtube|vimeo)\([A-Za-z0-9_-]{5,20}(?:,[^\]]*)?\)\]/gi) || []).length;
  }
  function editorGuideHtml() {
    return '<p>나무위키에서 쓰는 문서 문법을 바탕으로 제목, 서식, 링크, 목록, 표, 접기, 각주와 미디어를 표시합니다.</p>' +
      '<div class="editor-markup-grid">' +
      '<span><code>= 제목 = · == 제목 ==</code><small>제목 단계 (1~6개의 =)</small></span>' +
      '<span><code>[목차]</code><small>목차를 표시할 위치</small></span>' +
      '<span><code>\'\'\'굵게\'\'\' · \'\'기울임\'\'</code><small>굵게와 기울임</small></span>' +
      '<span><code>__밑줄__ · ~~취소선~~</code><small>밑줄과 취소선</small></span>' +
      '<span><code>^^위첨자^^ · ,,아래첨자,,</code><small>위·아래 첨자</small></span>' +
      '<span><code>{{{+2 크게}}} · {{{-1 작게}}}</code><small>글자 크기</small></span>' +
      '<span><code>{{{#red,#ff0 색상}}}</code><small>라이트·다크 글자색</small></span>' +
      '<span><code>[[문서명|표시]] · [[문서#항목]]</code><small>내부 문서와 항목 연결</small></span>' +
      '<span><code>[[https://주소|표시]]</code><small>외부 링크</small></span>' +
      '<span><code>&nbsp;* 항목 · &nbsp;1. 항목</code><small>들여쓰기 목록</small></span>' +
      '<span><code>|| 칸 1 || 칸 2 ||</code><small>표 행과 셀 병합·정렬 지시자</small></span>' +
      '<span><code>&gt; 인용문 · ----</code><small>인용과 구분선</small></span>' +
      '<span><code>[* 각주 내용] · [각주]</code><small>각주와 각주 목록</small></span>' +
      '<span><code>{{{#!folding 제목</code><small>접기 블록 (마지막 줄에 }}})</small></span>' +
      '<span><code>[[파일:https://주소/사진.jpg|width=600]]</code><small>사진 링크</small></span>' +
      '<span><code>[youtube(영상ID)] · [vimeo(ID)]</code><small>동영상 삽입</small></span>' +
      '<span><code>[[분류:학교생활]] · ## 주석</code><small>분류 표기와 편집 주석</small></span>' +
      '<span><code>[br] · [anchor(이름)]</code><small>줄바꿈과 이동 지점</small></span>' +
      '</div><p class="editor-markup-note">외부 파일 주소만 사진으로 표시하며, 임의 HTML/CSS·스크립트는 실행하지 않습니다. 플랫폼 전용 매크로와 나무위키 파일 저장소는 연결되지 않습니다.</p>';
  }
  window.WikiParser = { markdownHtml, inlineMarkdown: (line, context = {}) => renderInline(line, context.notes ? context : makeContext(line, context.headings || [], context)), documentHeadings, renderTocMarkup, countImages, countVideos, editorGuideHtml, migrateBody };
})();
