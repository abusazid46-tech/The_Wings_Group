import fs from "node:fs";
import path from "node:path";

type LegacyAsset = {
  src?: string;
  content?: string;
};

type LegacyPageParts = {
  title: string;
  styles: string[];
  body: string;
  scripts: LegacyAsset[];
};

const legacyRoot = path.join(process.cwd(), "src", "legacy");

function getBasePath() {
  return process.env.NEXT_PUBLIC_BASE_PATH || "";
}

function prefixRoute(route: string) {
  const basePath = getBasePath();
  return `${basePath}${route}`;
}

function normalizeRoutes(html: string) {
  return html
    .replaceAll('href="index.html#', `href="${prefixRoute("/")}#`)
    .replaceAll('href="index.html"', `href="${prefixRoute("/")}"`)
    .replaceAll('href="about.html#', `href="${prefixRoute("/about/")}#`)
    .replaceAll('href="about.html"', `href="${prefixRoute("/about/")}"`);
}

function parseLegacyHtml(fileName: string): LegacyPageParts {
  const raw = fs.readFileSync(path.join(legacyRoot, fileName), "utf8");
  const title = raw.match(/<title>(.*?)<\/title>/s)?.[1] ?? "The Wings Group";
  const styles = [...raw.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((match) => match[1] ?? "");
  const scripts: LegacyAsset[] = [...raw.matchAll(/<script(?:\s+src="([^"]+)")?[^>]*>([\s\S]*?)<\/script>/g)].map(
    (match) => ({
      src: match[1],
      content: match[2]?.trim() || undefined
    })
  );

  const bodyMatch = raw.match(/<body[^>]*>([\s\S]*?)<\/body>/);
  const bodyWithoutScripts = (bodyMatch?.[1] ?? "")
    .replace(/<script(?:\s+src="([^"]+)")?[^>]*>[\s\S]*?<\/script>/g, "")
    .trim();

  return {
    title,
    styles,
    body: normalizeRoutes(bodyWithoutScripts),
    scripts
  };
}

export function LegacyPage({ fileName }: { fileName: string }) {
  const page = parseLegacyHtml(fileName);

  return (
    <>
      <title>{page.title}</title>
      {page.styles.map((style, index) => (
        <style key={`style-${index}`} dangerouslySetInnerHTML={{ __html: style }} />
      ))}
      <div dangerouslySetInnerHTML={{ __html: page.body }} />
      {page.scripts.map((script, index) =>
        script.src ? (
          <script key={`script-${index}`} src={script.src} />
        ) : (
          <script key={`script-${index}`} dangerouslySetInnerHTML={{ __html: script.content ?? "" }} />
        )
      )}
    </>
  );
}
