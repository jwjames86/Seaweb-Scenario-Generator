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

    if (env.ASSETS) return env.ASSETS.fetch(request);
    return new Response("Not found", { status: 404 });
  }
};

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

  // IMPORTANT: Do NOT stack the date into NCL's public URL.
  // Seaweb training uses a date window + ONE anchor, but NCL's public URL
  // date parameters are not stable enough for this prototype. We fetch the
  // broad public result set for the chosen anchor, then apply the 30-day
  // month window locally.
  const sourceUrl = buildNclSearchUrl(criterion, value);
  const parsed = await renderAndParse(env, sourceUrl);

  if (!parsed.ok) {
    return json({
      error: parsed.error,
      sourceUrl,
      hint: "The NCL public page could not be read. Try again after 10 seconds or use the NCL URL fallback.",
      diagnostic: parsed.diagnostic
    }, 502);
  }

  const wantedMonths = from && to ? monthsInWindow(from, to) : [];
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
      wantedMonths
    }
  });
}

async function renderAndParse(env, sourceUrl) {
  // Markdown is much easier and more stable to parse than NCL's rendered DOM.
  // It also uses only one Browser Run request, important on Cloudflare Free.
  if (env.BROWSER && typeof env.BROWSER.quickAction === "function") {
    try {
      const response = await env.BROWSER.quickAction("markdown", {
        url: sourceUrl,
        gotoOptions: {
          waitUntil: "networkidle2",
          timeout: 30000
        },
        waitForTimeout: 1500,
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/153 Safari/537.36"
      });

      if (response.ok) {
        const body = await response.text();
        let markdown = body;
        try {
          const data = JSON.parse(body);
          if (typeof data?.result === "string") markdown = data.result;
          else if (typeof data?.result?.markdown === "string") markdown = data.result.markdown;
        } catch (_) {}

        const text = normalizeMarkdown(markdown);
        const results = parseCruises(text, sourceUrl);
        return {
          ok: true,
          results,
          diagnostic: { method: "browser-markdown", textLength: text.length }
        };
      }
    } catch (e) {
      // Fall through to the raw public page as a backup.
    }
  }

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

function buildNclSearchUrl(criterion, value) {
  const u = new URL("https://www.ncl.com/uk/en/vacations");
  u.searchParams.set("autoPopulate", "f");
  u.searchParams.set("from", "resultpage");
  u.searchParams.set("currentPage", "1");
  u.searchParams.set("pageSize", "50");

  if (criterion === "destination") {
    u.searchParams.set("cruise-destination", destinationSlug(value));
  } else if (criterion === "ship") {
    const shipToken = value.trim().replace(/\s+/g, "_").replace(/[^A-Za-z0-9_]/g, "");
    u.searchParams.set("ships", shipToken);
  } else if (criterion === "departure") {
    const code = embarkationCode(value.toLowerCase().trim());
    // NCL's current public results use "port" for embarkation filters.
    u.searchParams.set("port", code || slug(value));
  }

  return u.toString();
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
  const headerRe = /(?:^|\n)(\d{1,2})-day Cruise on ((?:Norwegian [^\n]+)|Pride of America)(?=\n|$)/gi;
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
