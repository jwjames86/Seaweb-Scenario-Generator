export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/api/sailings") {
      const cache = caches.default;
      const cacheKey = new Request(url.toString(), { method: "GET" });
      const cached = await cache.match(cacheKey);
      if (cached) return cached;

      const response = await handleSailings(request, url, env);
      if (response.ok) {
        const headers = new Headers(response.headers);
        headers.set("Cache-Control", "public, max-age=600");
        const cacheable = new Response(response.clone().body, {
          status: response.status,
          statusText: response.statusText,
          headers
        });
        ctx.waitUntil(cache.put(cacheKey, cacheable));
      }
      return response;
    }

    if (url.pathname === "/api/share-card") {
      return handleShareCard(request, env);
    }

    if (env.ASSETS) return env.ASSETS.fetch(request);
    return new Response("Not found", { status: 404 });
  }
};

async function handleShareCard(request, env) {
  if (request.method !== "POST") {
    return json({ error: "Share-card rendering requires POST." }, 405);
  }
  if (!env.BROWSER || typeof env.BROWSER.quickAction !== "function") {
    return json({ error: "Browser rendering is not available." }, 503);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "Invalid share-card request." }, 400);
  }

  const raw = String(payload?.html || "");
  if (!raw || raw.length > 250000) {
    return json({ error: "The scenario card is empty or too large to render." }, 400);
  }

  const safeBody = sanitizeShareHtml(raw);
  const page = shareCardDocument(safeBody);

  try {
    const shot = await env.BROWSER.quickAction("screenshot", {
      html: page,
      viewport: { width: 1220, height: 1400 },
      screenshotOptions: { fullPage: true, type: "png" }
    });

    if (!shot.ok) {
      const detail = await shot.text().catch(() => "");
      return json({
        error: "The share-card image renderer could not create the PNG.",
        detail: detail.slice(0, 300)
      }, 502);
    }

    return new Response(shot.body, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
        "Content-Disposition": 'inline; filename="seaweb-training-scenario.png"'
      }
    });
  } catch (e) {
    return json({
      error: "The share-card image renderer failed.",
      detail: String(e?.message || e).slice(0, 300)
    }, 502);
  }
}

function sanitizeShareHtml(raw) {
  let html = String(raw || "");
  html = html
    .replace(/<\s*(script|style|link|meta|base|iframe|object|embed|form|img|video|audio|source|canvas|svg)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\s*(script|style|link|meta|base|iframe|object|embed|form|img|video|audio|source|canvas|svg)\b[^>]*\/?>/gi, "")
    .replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son[a-z]+\s*=\s*'[^']*'/gi, "")
    .replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, "")
    .replace(/\s(?:src|href|srcset|style)\s*=\s*"[^"]*"/gi, "")
    .replace(/\s(?:src|href|srcset|style)\s*=\s*'[^']*'/gi, "")
    .replace(/\s(?:src|href|srcset|style)\s*=\s*[^\s>]+/gi, "");
  return html;
}

function shareCardDocument(bodyHtml) {
  return `<!doctype html>
<html><head><meta charset="utf-8">
<style>
*{box-sizing:border-box}
html,body{margin:0;padding:0;background:#EBE7DF}
body{padding:20px;font-family:Arial,Helvetica,sans-serif;color:#101828}
.shared-trainee-card,.scenario-paper{width:1180px;margin:0 auto;background:#fff;border:1px solid #B9B6AF;border-radius:3px;padding:32px;color:#101828}
h2{font-size:25px;line-height:1.25;margin:8px 0 18px;color:#101010}
h3{font-size:18px;margin:0 0 12px;color:#101828}
h4{font-size:14px;margin:20px 0 8px;color:#101828}
p,li{font-size:13px;line-height:1.55;color:#273248}
.scenario-meta-row{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:12px}
.chip,.status-badge{display:inline-block;background:#F1EEE7;border:1px solid #D7D0C6;border-radius:3px;padding:5px 8px;font-size:11px;color:#454949}
.support-chip{background:#EDF6F5;color:#00484F;border-color:#C6DFDC}
.support-level{font-size:11px;color:#006099;font-weight:700;margin-top:2px}
.scenario-intro{font-size:14px;line-height:1.65;color:#344054;margin:0 0 24px}
.scenario-section{margin:24px 0}
.section-label{font-size:10px;font-weight:700;letter-spacing:2px;color:#00484F;margin-bottom:6px}
.call-section{background:#EBE7DF;border-left:5px solid #68ACAA;padding:18px 20px}
.call-section p{margin:0;line-height:1.7}
.glance-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.glance-card{background:#fff;border:1px solid #D9D4CA;border-radius:9px;padding:13px;min-height:88px}
.glance-card.wide{grid-column:1/-1}
.glance-card>span{display:block;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#667085;font-weight:700}
.glance-card>strong{display:block;font-size:13px;line-height:1.4;color:#101828;margin:4px 0}
.glance-card>small{display:block;font-size:11px;line-height:1.35;color:#667085}
.task-checklist{list-style:none;padding:0;margin:0}
.task-checklist li{display:flex;gap:10px;line-height:1.5;padding:9px 0;border-bottom:1px solid #ECE8E0}
.task-checklist li:last-child{border-bottom:0}
.check-box{display:block;width:16px;height:16px;border:1.5px solid #006099;border-radius:3px;flex:0 0 16px;margin-top:2px}
.details-section{border-top:1px solid #DED9CF;padding-top:22px}
.detail-list{padding-left:22px}.detail-list li{margin:5px 0;line-height:1.45}
.instruction-strip{background:#EDF6F5;border-left:4px solid #68ACAA;padding:12px 14px;margin:12px 0 18px}
.instruction-strip strong{display:block;font-size:11px;text-transform:uppercase;letter-spacing:1px}
.instruction-strip span{display:block;font-size:13px;line-height:1.5;margin-top:4px}
.payment-section{background:#FFFBef;border:1px solid #E6CD88;border-radius:10px;padding:16px 18px}
.scenario-payment-card{border:1px solid #E6CD88;background:#FFFCF5;border-radius:8px;padding:14px}
.training-only-label{font-size:10px;font-weight:700;letter-spacing:1px;color:#9A6700}
.end-call-section{background:#F7F3EC;border-radius:10px;padding:18px 20px}
.closing-card{margin-top:14px;border-top:1px solid #DDD5C6;padding-top:13px}
.closing-card strong,.closing-card span{display:block;margin:4px 0}
.share-expanded-section{border:1px solid #D7D2C8;border-radius:10px;margin:22px 0;background:#fff;overflow:hidden}
.share-expanded-heading{padding:13px 16px;font-size:14px;font-weight:700;background:#F7F3EC;color:#101828}
.support-body{padding:14px 18px 16px}
.support-list{columns:2;column-gap:28px;padding-left:22px}.support-list li{margin:0 0 8px}
.independent-callout{padding:14px 16px;background:#F7F3EC;border-left:4px solid #E6CD88}
.latitudes-output-section{background:#F3F8F7;border-left:5px solid #68ACAA;padding:18px 20px;border-radius:0 10px 10px 0}
.latitudes-output-intro{margin:0 0 12px;color:#667085;font-size:12px}
.latitudes-output-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:9px}
.latitudes-output-card{background:#fff;border:1px solid #D1E3E0;border-radius:8px;padding:11px 12px}
.latitudes-output-card>span{display:block;font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#667085;font-weight:700}
.latitudes-output-card>strong{display:block;font-size:12px;color:#101828;margin:3px 0}
.latitudes-output-card>small{display:block;font-size:11px;color:#006099;font-weight:600}
.latitudes-output-card em{font-style:normal;color:#8A5B00;font-weight:500}

.teams-page-stack{width:1180px;margin:0 auto}
.teams-page-stack .teams-share-page{width:1180px;margin:0;background:#fff}
.share-page-split-marker{width:1180px;height:18px;margin:0;background:#FF00FF}
.teams-page-bar{display:flex;justify-content:space-between;align-items:center;margin:-4px 0 24px;padding:12px 15px;background:#00484F;color:#fff;border-radius:4px;font-size:16px}
.teams-page-bar strong{font-size:18px;color:#fff}
.teams-page-bar span{font-size:15px;color:#fff}
.teams-page-stack p,.teams-page-stack li{font-size:17px;line-height:1.5}
.teams-page-stack h2{font-size:31px}
.teams-page-stack h3{font-size:23px}
.teams-page-stack h4{font-size:18px}
.teams-page-stack .scenario-intro{font-size:17px}
.teams-page-stack .section-label{font-size:12px}
.teams-page-stack .chip,.teams-page-stack .status-badge{font-size:14px;padding:6px 9px}
.teams-page-stack .glance-card>span{font-size:12px}
.teams-page-stack .glance-card>strong{font-size:17px}
.teams-page-stack .glance-card>small{font-size:14px}
.teams-page-stack .latitudes-output-card>span{font-size:11px}
.teams-page-stack .latitudes-output-card>strong{font-size:16px}
.teams-page-stack .latitudes-output-card>small{font-size:14px}
.teams-page-stack .share-expanded-heading{font-size:19px}
.teams-page-stack .support-list{columns:1}

.trainer-section{display:none!important}
</style></head><body>${bodyHtml}</body></html>`;
}

async function handleSailings(request, reqUrl, env) {
  const manual = reqUrl.searchParams.get("url");

  if (manual) {
    let sourceUrl;
    try {
      const u = new URL(manual);
      if (!/(^|\.)ncl\.com$/i.test(u.hostname)) {
        return json({ error: "Manual imports must use an ncl.com URL." }, 400);
      }
      sourceUrl = u.toString();
    } catch {
      return json({ error: "That NCL URL is not valid." }, 400);
    }

    const parsed = await renderAndParse(env, sourceUrl);
    if (!parsed.ok) return json({ error: parsed.error }, 502);

    return json({
      live: true,
      sourceUrl,
      retrievedAt: new Date().toISOString(),
      message: parsed.results.length
        ? `Imported ${parsed.results.length} public NCL itinerary option${parsed.results.length === 1 ? "" : "s"}.`
        : "NCL.com loaded, but this page did not expose readable itinerary cards.",
      results: parsed.results.slice(0, 40),
      diagnostic: parsed.diagnostic
    });
  }

  const criterion = (reqUrl.searchParams.get("criterion") || "destination").toLowerCase();
  const value = (reqUrl.searchParams.get("value") || "").trim();
  const from = reqUrl.searchParams.get("from") || "";
  const to = reqUrl.searchParams.get("to") || "";
  const duration = (reqUrl.searchParams.get("duration") || "").trim();

  if (!["destination", "departure", "ship"].includes(criterion)) {
    return json({ error: "Choose Destination, Embarkation Port, or Ship." }, 400);
  }
  if (!value) return json({ error: "Enter a search value." }, 400);

  if (from && to) {
    const diff = daysBetweenIso(from, to);
    if (diff < 0 || diff > 30) {
      return json({ error: "The sailing search date range must be 30 days or less." }, 400);
    }
  }

  const wantedMonths = from && to ? monthsInWindow(from, to) : [];
  const candidateUrls = buildNclSearchUrls(criterion, value, from, to);

  // NCL currently exposes more than one public URL vocabulary depending on
  // which page generated the link (for example cruise-ship vs ships). Try the
  // current canonical form first, then known public fallbacks until cards parse.
  let parsed = null;
  let sourceUrl = candidateUrls[0];
  const attempts = [];

  for (const candidate of candidateUrls) {
    sourceUrl = candidate;
    const attempt = await renderAndParse(env, candidate);
    attempts.push({
      url: candidate,
      ok: attempt.ok,
      cards: attempt.results?.length || 0,
      method: attempt.diagnostic?.method || "unknown"
    });
    if (attempt.ok && attempt.results?.length) {
      parsed = attempt;
      break;
    }
    if (!parsed) parsed = attempt;
  }

  if (!parsed?.ok) {
    return json({
      error: parsed?.error || "The NCL public page could not be read.",
      sourceUrl,
      hint: "Try again after 10 seconds or use the NCL URL fallback.",
      diagnostic: { attempts }
    }, 502);
  }

  const wanted = value.toLowerCase();

  let results = parsed.results.filter(r => {
    const haystack = {
      destination: `${r.title} ${r.ports.join(" ")}`.toLowerCase(),
      departure: (r.departure || "").toLowerCase(),
      ship: (r.ship || "").toLowerCase()
    }[criterion] || "";

    if (!haystack.includes(wanted)) return false;

    if (duration) {
      const d = Number(r.duration || 0);
      if (duration === "1-4" && !(d >= 1 && d <= 4)) return false;
      if (duration === "5-8" && !(d >= 5 && d <= 8)) return false;
      if (duration === "9-14" && !(d >= 9 && d <= 14)) return false;
      if (duration === "15+" && !(d >= 15)) return false;
    }

    if (wantedMonths.length && r.sailingMonths?.length) {
      const cardMonths = r.sailingMonths.map(x => x.toLowerCase());
      const monthMatch = wantedMonths.some(m => cardMonths.includes(m.toLowerCase()));
      // Some NCL cards collapse additional months behind "+ View More".
      // Keep those cards rather than creating a false "no results" state.
      if (!monthMatch && !r.hasMoreDates) return false;
      if (!monthMatch && r.hasMoreDates) {
        r.dateWindowNote = "NCL shows additional hidden sailing months; verify an exact date in the requested window.";
      }
    }
    return true;
  }).slice(0, 40);

  return json({
    live: true,
    sourceUrl,
    retrievedAt: new Date().toISOString(),
    message: results.length
      ? `Found ${results.length} public NCL itinerary option${results.length === 1 ? "" : "s"} for this Seaweb-style search. NCL public cards are month-level, so verify the exact departure date in Seaweb.`
      : parsed.results.length
        ? "NCL itineraries loaded, but no visible public card matched this 30-day window and optional vacation length. Try Any Length or another single search option."
        : "NCL.com loaded, but no readable itinerary cards were returned from the public page.",
    results,
    diagnostic: {
      ...parsed.diagnostic,
      parsedCards: parsed.results.length,
      filteredCards: results.length,
      criterion,
      value,
      wantedMonths,
      attempts
    }
  });
}

async function renderAndParse(env, sourceUrl) {
  if (env.BROWSER && typeof env.BROWSER.quickAction === "function") {
    // 1) Fully rendered HTML is the most reliable source for NCL's JS-heavy page.
    try {
      const response = await env.BROWSER.quickAction("content", {
        url: sourceUrl,
        gotoOptions: {
          waitUntil: "networkidle2",
          timeout: 30000
        },
        waitForTimeout: 1800,
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/153 Safari/537.36"
      });

      if (response.ok) {
        const body = await response.text();
        let html = unwrapQuickActionText(body, "content");
        const text = normalizeHtml(html);
        const results = parseCruises(text, sourceUrl);
        if (results.length) {
          return {
            ok: true,
            results,
            diagnostic: { method: "browser-content", textLength: text.length }
          };
        }
      }
    } catch (_) {}

    // 2) Markdown normalizes dynamic page content well when HTML structure shifts.
    try {
      const response = await env.BROWSER.quickAction("markdown", {
        url: sourceUrl,
        gotoOptions: {
          waitUntil: "networkidle2",
          timeout: 30000
        },
        waitForTimeout: 1800,
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/153 Safari/537.36"
      });

      if (response.ok) {
        const body = await response.text();
        const markdown = unwrapQuickActionText(body, "markdown");
        const text = normalizeMarkdown(markdown);
        const results = parseCruises(text, sourceUrl);
        return {
          ok: true,
          results,
          diagnostic: { method: "browser-markdown", textLength: text.length }
        };
      }
    } catch (_) {}
  }

  // Last-resort public HTML fetch.
  try {
    const response = await fetch(sourceUrl, {
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/153 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9"
      },
      cf: { cacheTtl: 180, cacheEverything: true }
    });

    if (!response.ok) {
      return {
        ok: false,
        error: `NCL.com returned HTTP ${response.status}.`,
        results: [],
        diagnostic: { method: "raw-fetch", status: response.status }
      };
    }

    const html = await response.text();
    const text = normalizeHtml(html);
    return {
      ok: true,
      results: parseCruises(text, response.url || sourceUrl),
      diagnostic: { method: "raw-fetch", textLength: text.length }
    };
  } catch (e) {
    return {
      ok: false,
      error: "Could not load the NCL public search page.",
      results: [],
      diagnostic: { method: "raw-fetch", error: String(e?.message || e) }
    };
  }
}

function unwrapQuickActionText(body, preferredKey) {
  let text = String(body || "");
  try {
    const data = JSON.parse(text);
    if (typeof data?.result === "string") return data.result;
    if (typeof data?.result?.[preferredKey] === "string") return data.result[preferredKey];
    if (typeof data?.result?.content === "string") return data.result.content;
    if (typeof data?.result?.markdown === "string") return data.result.markdown;
    if (typeof data?.content === "string") return data.content;
    if (typeof data?.markdown === "string") return data.markdown;
  } catch (_) {}
  return text;
}

function buildNclSearchUrls(criterion, value, from, to) {
  const base = "https://www.ncl.com/uk/en/vacations";
  const urls = [];
  const monthParam = nclMonthParam(from, to);

  const addBaseParams = (u) => {
    u.searchParams.set("autoPopulate", "f");
    u.searchParams.set("from", "resultpage");
    u.searchParams.set("currentPage", "1");
    u.searchParams.set("pageSize", "50");
    if (monthParam) u.searchParams.set("date", monthParam);
    return u;
  };

  if (criterion === "ship") {
    // Current canonical public URL.
    let u = addBaseParams(new URL(base));
    u.searchParams.set("cruise-ship", slug(value));
    urls.push(u.toString());

    // Public results also still expose this legacy/current mixed form.
    u = addBaseParams(new URL(base));
    u.searchParams.set("ships", value.trim().replace(/\s+/g, "_").replace(/[^A-Za-z0-9_]/g, ""));
    urls.push(u.toString());

    u = addBaseParams(new URL(base));
    u.searchParams.set("ship", slug(value));
    urls.push(u.toString());
  } else if (criterion === "departure") {
    const code = embarkationCode(value.toLowerCase().trim()) || slug(value);

    let u = addBaseParams(new URL(base));
    u.searchParams.set("cruise-port", code);
    urls.push(u.toString());

    u = addBaseParams(new URL(base));
    u.searchParams.set("port", code);
    urls.push(u.toString());
  } else {
    let u = addBaseParams(new URL(base));
    u.searchParams.set("cruise-destination", destinationSlug(value));
    urls.push(u.toString());

    u = addBaseParams(new URL(base));
    u.searchParams.set("destinations", destinationSlug(value));
    urls.push(u.toString());
  }

  return [...new Set(urls)];
}

function nclMonthParam(from, to) {
  if (!from || !to) return "";
  const start = new Date(from + "T12:00:00Z");
  const end = new Date(to + "T12:00:00Z");
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "";

  const short = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
  const months = [];
  const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
  const last = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));

  while (cursor <= last) {
    months.push(`${short[cursor.getUTCMonth()]}-${cursor.getUTCFullYear()}`);
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return months.join(",");
}

function destinationSlug(value) {
  const map = {
    "canada & new england": "canada-new-england",
    "australia & new zealand": "australia-new-zealand",
    "northern europe": "northern-europe",
    "panama canal": "panama-canal",
    "south america": "south-america"
  };
  const key = value.toLowerCase().trim();
  return map[key] || slug(value);
}

function embarkationCode(value) {
  const map = {
    "miami":"mia",
    "miami, florida":"mia",
    "boston":"bos",
    "boston, massachusetts":"bos",
    "seattle":"sea",
    "seattle, washington":"sea",
    "san juan":"sju",
    "san juan, puerto rico":"sju",
    "new york":"nyc",
    "new york, new york":"nyc",
    "tampa":"tpa",
    "tampa, florida":"tpa",
    "new orleans":"msy",
    "new orleans, louisiana":"msy",
    "los angeles":"lax",
    "los angeles, california":"lax",
    "honolulu":"hnl",
    "honolulu, hawaii":"hnl",
    "reykjavik":"rey",
    "reykjavik, iceland":"rey",
    "southampton":"sou",
    "london (southampton)":"sou",
    "barcelona":"bcn",
    "barcelona, spain":"bcn",
    "rome":"civ",
    "rome (civitavecchia)":"civ",
    "civitavecchia":"civ",
    "venice (ravenna)":"rav",
    "ravenna":"rav",
    "copenhagen":"cph",
    "istanbul":"ist",
    "athens (piraeus)":"pir",
    "piraeus":"pir",
    "port canaveral":"pcv",
    "orlando (port canaveral)":"pcv",
    "jacksonville":"jax",
    "galveston":"gls"
  };
  return map[value] || "";
}

function daysBetweenIso(a, b) {
  const start = new Date(a + "T12:00:00Z");
  const end = new Date(b + "T12:00:00Z");
  return Math.round((end - start) / 86400000);
}

function parseCruises(text, sourceUrl) {
  const headerRe = /(?:^|\n)\s*(\d{1,2})\s*[-–—]\s*day\s+Cruise\s+on\s+((?:Norwegian\s+[^\n]+)|Pride\s+of\s+America)\s*(?=\n|$)/gi;
  const starts = [...text.matchAll(headerRe)];
  const out = [];

  for (let i = 0; i < starts.length; i++) {
    const start = starts[i].index ?? 0;
    const end = i + 1 < starts.length ? starts[i + 1].index : Math.min(text.length, start + 9000);
    const chunk = text.slice(start, end);
    const lines = chunk.split("\n").map(clean).filter(Boolean);

    const duration = Number(starts[i][1]);
    const ship = clean(starts[i][2]);

    let title = "";
    let departure = "";
    for (let j = 1; j < Math.min(lines.length, 12); j++) {
      const line = lines[j];
      if (!title && !isNoiseLine(line) && !/^from\s+/i.test(line)) {
        title = line;
        continue;
      }
      if (/^from\s+/i.test(line)) {
        departure = line.replace(/^from\s+/i, "").trim();
        break;
      }
    }

    if (!title) title = "NCL itinerary";

    const beforeAccolades = chunk.split(/\nAccolades\n/i)[0] || chunk;
    const sailingMonths = [...beforeAccolades.matchAll(
      /(January|February|March|April|May|June|July|August|September|October|November|December),?\s*(20\d{2})/gi
    )].map(m => `${cap(m[1])} ${m[2]}`);
    const uniqueMonths = [...new Set(sailingMonths)];

    const ports = extractPorts(lines);

    const priceMatch = chunk.match(/(?:^|\n)from\n?([$£€]|CA\$|AU\$)?\s?([\d\s,.]+)\n?PP\s*\/\s*([A-Z]{3})/i)
      || chunk.match(/(?:^|\n)Now\n?([$£€]|CA\$|AU\$)?\s?([\d\s,.]+)\n?PP\s*\/\s*([A-Z]{3})/i);
    const price = priceMatch
      ? `${priceMatch[1] || ""}${clean(priceMatch[2])} PP / ${priceMatch[3].toUpperCase()}`
      : "";

    const taxMatch = chunk.match(/\+\s*Taxes,\s*fees and port expenses\s*([^\n]+)/i);
    const taxes = taxMatch ? `Taxes, fees & port expenses ${clean(taxMatch[1])}` : "";

    const offers = [];
    for (const label of [
      "50% OFF All Cruises","Up to 50% Off All Cruises","KIDS SAIL FREE",
      "KIDS SAIL FROM","2-For-1 Deposits","Exclusive Limited-Time Reduced Rate",
      "Free at Sea™","Free at Sea"
    ]) {
      if (chunk.toLowerCase().includes(label.toLowerCase())) offers.push(label);
    }

    out.push({
      duration,
      ship,
      title,
      departure,
      sailingMonths: uniqueMonths,
      hasMoreDates: /\+\s*View More/i.test(chunk),
      ports,
      price,
      taxes,
      offers: [...new Set(offers)],
      sourceUrl,
      retrievedAt: new Date().toISOString()
    });
  }

  return dedupe(out);
}

function extractPorts(lines) {
  const start = lines.findIndex(x => /^Ports of Call$/i.test(x) || /^\d+\s+Ports? of Call$/i.test(x));
  if (start < 0) return [];
  const ports = [];

  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i];
    if (/^(Itinerary Map|Accolades|from|Free at Sea|More Offers|View Cruise|VIEW DATES)/i.test(line)) break;
    if (/^\d+\s+Ports? of Call$/i.test(line)) continue;
    if (isNoiseLine(line)) continue;
    if (line.includes(",") && line.length < 110) ports.push(line);
  }
  return [...new Set(ports)];
}

function isNoiseLine(line) {
  return /^(Image|Share|Sailing|Accolades|Ports of Call|Itinerary Map|View Cruise|VIEW DATES & PRICES|\+ View More)$/i.test(line);
}

function monthsInWindow(from, to) {
  const out = [];
  const start = new Date(from + "T12:00:00Z");
  const end = new Date(to + "T12:00:00Z");
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return out;
  const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
  const last = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));

  while (cursor <= last) {
    out.push(cursor.toLocaleString("en-US", {
      month: "long",
      year: "numeric",
      timeZone: "UTC"
    }));
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return out;
}

function normalizeMarkdown(md) {
  return decode(String(md || ""))
    .replace(/\r/g, "")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "\nImage\n")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s*/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s+/g, "\n")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

function normalizeHtml(html) {
  return decode(String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<(br|\/p|\/div|\/li|\/h[1-6]|\/section|\/article)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s+/g, "\n")
    .replace(/\n{2,}/g, "\n"))
    .trim();
}

function decode(s) {
  return s.replace(/&nbsp;|&#160;/gi," ")
    .replace(/&amp;/gi,"&")
    .replace(/&quot;/gi,'"')
    .replace(/&#39;|&apos;/gi,"'")
    .replace(/&trade;/gi,"™")
    .replace(/&reg;/gi,"®")
    .replace(/&#(\d+);/g,(_,n)=>String.fromCharCode(Number(n)));
}

function clean(s="") { return String(s).replace(/\s+/g," ").trim(); }
function cap(s) { return s.charAt(0).toUpperCase()+s.slice(1).toLowerCase(); }
function slug(s) { return s.toLowerCase().trim().replace(/^norwegian\s+/,"norwegian-").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""); }
function dedupe(a) {
  const m = new Map();
  for (const x of a) m.set([x.duration,x.ship,x.title,x.departure].join("|"),x);
  return [...m.values()];
}
function json(data,status=200) {
  return new Response(JSON.stringify(data),{
    status,
    headers:{
      "content-type":"application/json; charset=utf-8",
      "cache-control":"no-store",
      "access-control-allow-origin":"*"
    }
  });
}
