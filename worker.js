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
  let sourceUrl;

  if (manual) {
    try {
      const u = new URL(manual);
      if (!/(^|\.)ncl\.com$/i.test(u.hostname)) {
        return json({ error: "Manual imports must use an ncl.com URL." }, 400);
      }
      sourceUrl = u.toString();
    } catch {
      return json({ error: "That NCL URL is not valid." }, 400);
    }
  } else {
    // Keep the public query deliberately broad, mirroring Seaweb training:
    // date window + exactly one of destination, embarkation port, or ship.
    const criterion = reqUrl.searchParams.get("criterion") || "destination";
    const value = (reqUrl.searchParams.get("value") || "").trim();
    const u = new URL("https://www.ncl.com/vacations");

    // Public NCL URL parameters are not stable enough to guarantee a direct ID-based filter
    // from free text. We fetch the public vacation results and apply the single chosen
    // training criterion after parsing. This avoids stacking filters that hide choices.
    u.searchParams.set("autoPopulate", "f");
    u.searchParams.set("from", "resultpage");
    sourceUrl = u.toString();
  }

  let response;
  try {
    response = await fetch(sourceUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; SeawebTrainingScenarioGenerator/1.0)",
        "Accept": "text/html,application/xhtml+xml"
      },
      cf: { cacheTtl: 300, cacheEverything: true }
    });
  } catch (e) {
    return json({ error: "Could not reach NCL.com from the live adapter." }, 502);
  }

  if (!response.ok) {
    return json({ error: `NCL.com returned HTTP ${response.status}. Try the manual URL fallback.` }, 502);
  }

  const html = await response.text();
  const text = normalize(html);
  let results = parseCruises(text, sourceUrl);

  const filters = {
    criterion: (reqUrl.searchParams.get("criterion") || "destination").toLowerCase(),
    value: (reqUrl.searchParams.get("value") || "").toLowerCase().trim(),
    from: reqUrl.searchParams.get("from") || "",
    to: reqUrl.searchParams.get("to") || "",
    duration: (reqUrl.searchParams.get("duration") || "").trim()
  };

  results = results.filter(r => {
    const haystack = {
      destination: `${r.title} ${r.ports.join(" ")}`.toLowerCase(),
      departure: (r.departure || "").toLowerCase(),
      ship: (r.ship || "").toLowerCase()
    }[filters.criterion] || "";

    if (filters.value && !haystack.includes(filters.value)) return false;

    if (filters.duration) {
      const d = Number(r.duration || 0);
      if (filters.duration === "1-4" && !(d >= 1 && d <= 4)) return false;
      if (filters.duration === "5-8" && !(d >= 5 && d <= 8)) return false;
      if (filters.duration === "9-14" && !(d >= 9 && d <= 14)) return false;
      if (filters.duration === "15+" && !(d >= 15)) return false;
    }

    // Public cards may expose month-level availability rather than exact sail dates.
    // Apply a conservative month-overlap check when month data exists.
    if (filters.from && filters.to && r.sailingMonths?.length) {
      const wantedMonths = monthsInWindow(filters.from, filters.to);
      const cardMonths = r.sailingMonths.map(x => x.toLowerCase());
      if (!wantedMonths.some(m => cardMonths.includes(m.toLowerCase()))) return false;
    }
    return true;
  }).slice(0, 40);

  return json({
    live: true,
    sourceUrl,
    retrievedAt: new Date().toISOString(),
    message: results.length
      ? `Found ${results.length} public NCL itinerary option${results.length === 1 ? "" : "s"} using the Seaweb-style broad search. Public cards can be month-level, so verify the exact departure date and cabin inventory in Seaweb.`
      : "NCL.com responded, but the public page did not expose a matching itinerary card for this broad search. Try a different single search option or use the NCL URL fallback.",
    results
  });
}

function parseCruises(text, sourceUrl) {
  const starts = [...text.matchAll(/(\d{1,2})-day Cruise on (Norwegian [^\n]+)\n/gi)];
  const out = [];

  for (let i = 0; i < starts.length; i++) {
    const start = starts[i].index;
    const end = i + 1 < starts.length ? starts[i + 1].index : Math.min(text.length, start + 6000);
    const chunk = text.slice(start, end);
    const head = chunk.match(/^(\d{1,2})-day Cruise on (Norwegian [^\n]+)\n([^\n]+)\nfrom ([^\n]+)/i);
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
