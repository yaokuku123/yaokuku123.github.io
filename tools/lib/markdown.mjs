import MarkdownIt from "markdown-it";
import { escapeHtml } from "../../src/lib/html.js";
import { uploadDemoMarkup } from "../../src/components/upload-demo.js";

const markdown = new MarkdownIt({
  html: false,
  linkify: false,
  typographer: false,
  breaks: true,
});
markdown.renderer.rules.table_open = () => '<div class="resume-table"><table>';
markdown.renderer.rules.table_close = () => "</table></div>";
const defaultFence = markdown.renderer.rules.fence;
markdown.renderer.rules.fence = (
  tokens,
  index,
  options,
  environment,
  renderer,
) => {
  const token = tokens[index],
    kind = token.info.trim();
  if (kind === "component") {
    if (token.content.trim() !== "upload-demo")
      throw Error(`Unknown content component: ${token.content.trim()}`);
    return uploadDemoMarkup();
  }
  if (kind === "flow")
    return `<div class="flow">${token.content
      .trim()
      .split("\n")
      .map(escapeHtml)
      .map((text) => `<span>${text}</span>`)
      .join("<i>→</i>")}</div>`;
  return defaultFence(tokens, index, options, environment, renderer);
};
markdown.renderer.rules.heading_open = (
  tokens,
  index,
  options,
  environment,
  renderer,
) => {
  const id = `${environment.prefix}-${environment.headingIndex++}`;
  tokens[index].attrSet("id", id);
  if (tokens[index].tag === "h2")
    environment.sections.push({
      id,
      title: plainText(tokens[index + 1].content),
    });
  return renderer.renderToken(tokens, index, options);
};
markdown.renderer.rules.blockquote_open = (
  tokens,
  index,
  options,
  environment,
  renderer,
) => {
  const inline = tokens[index + 2];
  if (inline?.type === "inline" && inline.content.startsWith("[!NOTE]")) {
    tokens[index].attrSet("class", "notice");
    inline.content = inline.content.replace(/^\[!NOTE\]\s*/, "");
    if (inline.children?.[0]?.type === "text")
      inline.children[0].content = inline.children[0].content.replace(
        /^\[!NOTE\]\s*/,
        "",
      );
  }
  return renderer.renderToken(tokens, index, options);
};
export function renderMarkdown(source, prefix = "section") {
  const environment = { prefix, headingIndex: 0, sections: [] };
  return {
    html: markdown.render(source, environment),
    sections: environment.sections,
  };
}
export function plainText(source) {
  return source
    .replace(/```[\s\S]*?```/g, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[#*>`_]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
