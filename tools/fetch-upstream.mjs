import fs from "node:fs";
import crypto from "node:crypto";
import { dirname } from "node:path";

const OUT_DIR = "official-docs";
const REPORT_PATH = process.env.FETCH_REPORT_PATH || ".tmp/upstream-fetch-report.json";
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(dirname(REPORT_PATH), { recursive: true });

const URLS = [
  "https://code.claude.com/docs/en/plugins-reference.md",
  "https://code.claude.com/docs/en/plugins.md",
  "https://code.claude.com/docs/en/plugin-marketplaces.md",
  "https://code.claude.com/docs/en/discover-plugins.md",
  "https://code.claude.com/docs/en/settings.md",
];

async function fetchText(url) {
  const res = await fetch(url, { headers: { "user-agent": "claude-code-json-schema-monitor/0.1" } });
  if (!res.ok) throw new Error(`Fetch failed ${res.status} for ${url}`);
  return await res.text();
}

function sha256(s) {
  return crypto.createHash("sha256").update(s, "utf8").digest("hex");
}

const report = {
  generatedAt: new Date().toISOString(),
  totalUrls: URLS.length,
  successes: [],
  failures: [],
};

for (const url of URLS) {
  const safe = url.replace(/^https?:\/\//, "").replace(/[^\w.-]+/g, "_");

  try {
    const txt = await fetchText(url);
    const hash = sha256(txt);

    fs.writeFileSync(`${OUT_DIR}/${safe}.txt`, txt);
    fs.writeFileSync(`${OUT_DIR}/${safe}.sha256`, hash + "\n");
    report.successes.push({ url });
    console.log(`✅ ${url}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    report.failures.push({ url, error: message });
    console.warn(`⚠️  ${url} :: ${message}`);
  }
}

fs.writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(
  `Fetch summary: ${report.successes.length} succeeded, ${report.failures.length} failed (report: ${REPORT_PATH})`,
);
