export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/api/sailings") {
      return handleSailings(request, url);
    }

    if (env.ASSETS) return env.ASSETS.fetch(request);
    return new Response("Not found", { status: 404 });
  }
};

async function handleSailings(request, reqUrl) {
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

    const parsed = await fetchAndParse(sourceUrl);
    if (!parsed.ok) return json({ error: parsed.error }, 502);

    return json({
      live: true,
      sourceUrls: [sourceUrl],
      retrievedAt: new Date().toISOString(),
      message: parsed.results.length
        ? `Imported ${parsed.results.length} public NCL itinerary option${parsed.results.length === 1 ? "" : "s"}.`
        : "NCL.com responded, but this page did not expose itinerary cards that the training tool could read.",
      results: parsed.results.slice(0, 40)
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

  const sourceUrls = buildNclSourceUrls(criterion, value);
  const attempts = [];
  const merged = [];

  for (const sourceUrl of sourceUrls.slice(0, 8)) {
    const parsed = await fetchAndParse(sourceUrl);
    attempts.push({
      url: sourceUrl,
      ok: parsed.ok,
      cards: parsed.results?.length || 0,
      error: parsed.error || null
    });

    if (parsed.ok && parsed.results?.length) {
      for (const r of parsed.results) merged.push(r);
      if (merged.length >= 12) break;
    }
  }

  let results = dedupe(merged);
  const wantedMonths = from && to ? monthsInWindow(from, to) : [];

  results = results.filter(r => {
    const haystack = {
      destination: `${r.title} ${r.ports.join(" ")}`.toLowerCase(),
      departure: (r.departure || "").toLowerCase(),
      ship: (r.ship || "").toLowerCase()
    }[criterion] || "";

    if (!haystack.includes(value.toLowerCase())) return false;

    if (duration) {
      const d = Number(r.duration || 0);
      if (duration === "1-4" && !(d >= 1 && d <= 4)) return false;
      if (duration === "5-8" && !(d >= 5 && d <= 8)) return false;
      if (duration === "9-14" && !(d >= 9 && d <= 14)) return false;
      if (duration === "15+" && !(d >= 15)) return false;
    }

    if (wantedMonths.length && r.sailingMonths?.length) {
      const cardMonths = r.sailingMonths.map(x => x.toLowerCase());
      if (!wantedMonths.some(m => cardMonths.includes(m.toLowerCase()))) return false;
    }

    return true;
  }).slice(0, 40);

  const readablePages = attempts.filter(a => a.cards > 0).length;

  return json({
    live: true,
    sourceUrls,
    attempts,
    retrievedAt: new Date().toISOString(),
    message: results.length
      ? `Found ${results.length} public NCL itinerary option${results.length === 1 ? "" : "s"}. Public NCL cards may show sailing month rather than the exact departure date, so confirm the exact sailing date in Seaweb.`
      : readablePages
        ? "NCL itinerary cards were retrieved, but none matched the selected 30-day window, vacation length, and single search option."
        : "NCL.com responded, but its public result pages did not expose readable itinerary cards to the live adapter. Use the NCL URL fallback while the adapter is unavailable.",
    results
  });
}

async function fetchAndParse(sourceUrl) {
  let response;
  try {
    response = await fetch(sourceUrl, {
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/153 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9"
      },
      cf: { cacheTtl: 180, cacheEverything: true }
    });
  } catch (e) {
    return { ok: false, error: "Could not reach this NCL public results page.", results: [] };
  }

  if (!response.ok) {
    return { ok: false, error: `NCL.com returned HTTP ${response.status}.`, results: [] };
  }

  const html = await response.text();
  const text = normalize(html);
  const results = parseCruises(text, response.url || sourceUrl);
  return { ok: true, results };
}

function buildNclSourceUrls(criterion, value) {
  const locales = [
    "https://www.ncl.com/uk/en/vacations",
    "https://www.ncl.com/no/en/vacations",
    "https://www.ncl.com/fr/en/vacations"
  ];

  const urls = [];

  if (criterion === "ship") {
    const shipSlug = slug(value);
    const shipToken = value.trim().replace(/\s+/g, "_").replace(/[^A-Za-z0-9_]/g, "");
    for (const base of locales) {
      urls.push(`${base}?ships=${encodeURIComponent(shipToken)}`);
      urls.push(`${base}?ship=${encodeURIComponent(shipSlug)}`);
    }
  }

  if (criterion === "destination") {
    const destSlug = slug(value);
    const destToken = value.toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "");
    for (const base of locales) {
      urls.push(`${base}?cruise-destination=${encodeURIComponent(destSlug)}`);
      urls.push(`${base}?destinations=${encodeURIComponent(destToken)}`);
    }
  }

  if (criterion === "departure") {
    const code = embarkationCode(value.toLowerCase().trim());
    const portSlug = slug(value);
    for (const base of locales) {
      if (code) {
        urls.push(`${base}?cruise-port=${encodeURIComponent(code)}`);
        urls.push(`${base}?port=${encodeURIComponent(code)}`);
      }
      urls.push(`${base}?cruise-port=${encodeURIComponent(portSlug)}`);
    }
  }

  return [...new Set(urls)];
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
  const starts = [...text.matchAll(/(\d{1,2})-day Cruise on (Norwegian [^\n]{2,90})\n+/gi)];
  const out = [];

  for (let i = 0; i < starts.length; i++) {
    const start = starts[i].index;
    const end = i + 1 < starts.length ? starts[i + 1].index : Math.min(text.length, start + 6000);
    const chunk = text.slice(start, end);
    const head = chunk.match(/^(\d{1,2})-day Cruise on (Norwegian [^\n]{2,90})\n+([^\n]{3,160})\n+from ([^\n]{2,120})/i);
    if (!head) continue;

    const duration = Number(head[1]);
    const ship = clean(head[2]);
    const title = clean(head[3]);
    const departure = clean(head[4]);

    const sailingPart = between(chunk, "Sailing\n", "Accolades\n") || "";
    const sailingMonths = [...sailingPart.matchAll(/(January|February|March|April|May|June|July|August|September|October|November|December),?\s*(20\d{2})/gi)]
      .map(m => `${cap(m[1])} ${m[2]}`);
    const uniqueMonths = [...new Set(sailingMonths)];

    const portsPart = between(chunk, "Ports of Call\n", "Itinerary Map") || "";
    const ports = portsPart
      .split("\n")
      .map(clean)
      .filter(x => x && !/^\d+\s+Ports? of Call$/i.test(x) && x.length < 90)
      .filter(x => /,/.test(x));

    const priceMatch = chunk.match(/(?:from|Now)\n?([$£€]|CA\$|AU\$)?\s?([\d\s,.]+)\n?PP\s*\/\s*([A-Z]{3})/i);
    const price = priceMatch ? `${priceMatch[1] || ""}${clean(priceMatch[2])} PP / ${priceMatch[3].toUpperCase()}` : "";

    const taxMatch = chunk.match(/\+\s*Taxes,\s*fees and port expenses\s*([^\n]+)/i);
    const taxes = taxMatch ? `Taxes, fees & port expenses ${clean(taxMatch[1])}` : "";

    const offers = [];
    for (const label of ["50% OFF All Cruises","Up to 50% Off All Cruises","KIDS SAIL FREE","2-For-1 Deposits","Exclusive Limited-Time Reduced Rate","Free at Sea™","Free at Sea"]) {
      if (chunk.toLowerCase().includes(label.toLowerCase())) offers.push(label);
    }

    out.push({
      duration, ship, title, departure,
      sailingMonths: uniqueMonths,
      ports: [...new Set(ports)],
      price, taxes, offers: [...new Set(offers)],
      sourceUrl,
      retrievedAt: new Date().toISOString()
    });
  }

  return dedupe(out);
}

function monthsInWindow(from, to) {
  const out = [];
  const start = new Date(from + "T12:00:00Z");
  const end = new Date(to + "T12:00:00Z");
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return out;
  const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
  const last = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1));
  while (cursor <= last) {
    out.push(cursor.toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" }));
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return out;
}

function normalize(html) {
  return decode(html
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
    .replace(/&amp;/gi,"&").replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'")
    .replace(/&trade;/gi,"™").replace(/&reg;/gi,"®")
    .replace(/&#(\d+);/g,(_,n)=>String.fromCharCode(Number(n)));
}
function between(s,a,b){const i=s.indexOf(a);if(i<0)return"";const j=s.indexOf(b,i+a.length);return s.slice(i+a.length,j<0?s.length:j)}
function clean(s=""){return s.replace(/\s+/g," ").trim()}
function cap(s){return s.charAt(0).toUpperCase()+s.slice(1).toLowerCase()}
function slug(s){return s.toLowerCase().trim().replace(/^norwegian\s+/,"norwegian-").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}
function dedupe(a){const m=new Map();for(const x of a)m.set([x.duration,x.ship,x.title,x.departure].join("|"),x);return [...m.values()]}
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store","access-control-allow-origin":"*"}})}
