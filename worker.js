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
  if (!raw || raw.length > 600000) {
    return json({ error: "The scenario card is empty or too large to render." }, 400);
  }

  const safeBody = sanitizeShareHtml(raw);
  const exact=payload?.exact===true;
  const requestedWidth=Math.max(480,Math.min(1100,Number(payload?.width)||760));
  const scale=Math.max(1,Math.min(2,Number(payload?.scale)||1));
  const page = exact ? exactShareCardDocument(safeBody,requestedWidth,scale) : shareCardDocument(safeBody);

  try {
    const shot = await env.BROWSER.quickAction("screenshot", {
      html: page,
      viewport: exact ? { width: Math.ceil(requestedWidth*scale)+40, height: 900 } : { width: 2080, height: 3400 },
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
    .replace(/\s(?:src|href|srcset)\s*=\s*"[^"]*"/gi, "")
    .replace(/\s(?:src|href|srcset)\s*=\s*'[^']*'/gi, "")
    .replace(/\s(?:src|href|srcset|style)\s*=\s*[^\s>]+/gi, "");
  return html;
}

function exactShareCardDocument(bodyHtml,width,scale){
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  *{box-sizing:border-box}html,body{margin:0;padding:0;background:#EBE7DF}body{padding:10px;width:max-content;min-width:0}.exact-generator-view{width:${width}px;zoom:${scale};}
  </style></head><body><div class="exact-generator-view">${bodyHtml}</div></body></html>`;
}

function shareCardDocument(bodyHtml) {
  return `<!doctype html>
<html><head><meta charset="utf-8">
<style>
*{box-sizing:border-box}
html,body{margin:0;padding:0;background:#EBE7DF}
body{padding:20px;font-family:Arial,Helvetica,sans-serif;color:#101828}
.shared-trainee-card,.scenario-paper{width:2040px;margin:0 auto;background:#fff;border:0;border-radius:0;padding:0;color:#101828}
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

.teams-page-stack{width:2040px;margin:0 auto}
.teams-page-stack .teams-share-page,.export-legal-page{width:2040px;min-height:3360px;margin:0;background:#fff;border:0;border-radius:0;padding:46px 58px 38px;display:flex;flex-direction:column}
.export-page-body{flex:1 1 auto}
.share-page-split-marker{width:2040px;height:20px;margin:0;background:#FF00FF}
.export-page-bar{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;margin:0 0 26px;padding:18px 22px;background:#00484F;color:#fff;border-radius:5px}
.export-page-bar div{display:flex;flex-direction:column;gap:5px}.export-page-bar strong{font-size:25px;color:#fff;line-height:1.2}.export-page-bar small{font-size:15px;color:#D4ECEB}.export-page-bar span{font-size:15px;color:#fff;font-weight:700;white-space:nowrap}
.export-page-footer{display:flex;justify-content:space-between;align-items:center;margin-top:22px;padding-top:13px;border-top:1px solid #D8D5CE;font-size:12px;color:#667085;text-transform:uppercase;letter-spacing:1px}
.teams-page-stack h2{font-size:39px;line-height:1.18;margin:8px 0 18px}.teams-page-stack h3{font-size:26px;line-height:1.25;margin:0 0 12px}.teams-page-stack h4{font-size:19px;margin:20px 0 9px}
.teams-page-stack p,.teams-page-stack li{font-size:17px;line-height:1.48}.teams-page-stack .scenario-intro{font-size:17px;line-height:1.52;margin:0 0 20px}.teams-page-stack .scenario-section{margin:20px 0}
.teams-page-stack .section-label{font-size:11px}.teams-page-stack .chip,.teams-page-stack .status-badge{font-size:13px;padding:6px 9px}.teams-page-stack .call-section{padding:18px 22px}
.teams-page-stack .glance-grid{grid-template-columns:repeat(3,1fr);gap:11px}.teams-page-stack .glance-card{min-height:96px;padding:14px}.teams-page-stack .glance-card>span{font-size:11px}.teams-page-stack .glance-card>strong{font-size:16px}.teams-page-stack .glance-card>small{font-size:13px}
.teams-page-stack .task-checklist li{padding:8px 0}.teams-page-stack .latitudes-output-section{padding:16px 18px}.teams-page-stack .latitudes-output-card{padding:12px 14px}.teams-page-stack .latitudes-output-card>span{font-size:10px}.teams-page-stack .latitudes-output-card>strong{font-size:15px}.teams-page-stack .latitudes-output-card>small{font-size:13px}
.teams-page-stack .share-expanded-section{margin:18px 0}.teams-page-stack .share-expanded-heading{font-size:17px;padding:12px 15px}.teams-page-stack .support-body{padding:12px 16px}.teams-page-stack .support-list{columns:2;column-gap:32px}
.teams-page-stack .details-section{padding-top:18px}.teams-page-stack .instruction-strip{margin:10px 0 14px}.teams-page-stack .end-call-section{padding:16px 18px}


/* V1.9.0 one-page trainee legal export: 2040 × 3360 at ~240 PPI */
.one-page-export{width:2040px;height:3360px;margin:0 auto;background:#fff;padding:36px 44px 30px;color:#101828;display:flex;flex-direction:column;overflow:hidden;font-family:Arial,Helvetica,sans-serif}
.one-page-header{display:flex;justify-content:space-between;align-items:center;gap:24px;background:#00484F;color:#fff;padding:18px 24px;border-radius:4px;margin-bottom:18px}
.one-page-header>div:first-child{min-width:0}.one-page-kicker{display:block;font-size:12px;letter-spacing:1.6px;text-transform:uppercase;color:#CDE4E2;font-weight:700;margin-bottom:4px}.one-page-header h1{margin:0;font-size:36px;line-height:1.08;color:#fff}.one-page-header p{margin:5px 0 0;font-size:15px;color:#E4F2F1;line-height:1.35}.one-page-header-badge{flex:0 0 auto;background:#fff;color:#00484F;font-size:13px;font-weight:800;letter-spacing:1.2px;padding:9px 12px;border-radius:3px}
.one-page-label{font-size:11px;font-weight:800;letter-spacing:1.8px;color:#006099;margin-bottom:4px;text-transform:uppercase}.one-page-export h2{font-size:23px;line-height:1.2;margin:0 0 9px;color:#101828}.one-page-export p,.one-page-export li{font-size:17px;line-height:1.43;color:#273248}
.one-page-call{background:#EBE7DF;border-left:6px solid #68ACAA;padding:15px 19px;margin-bottom:18px}.one-page-call p{margin:0}.one-page-layout{display:grid;grid-template-columns:minmax(0,1.62fr) minmax(0,.88fr);gap:18px;flex:1 1 auto;min-height:0}.one-page-main,.one-page-side{display:flex;flex-direction:column;gap:15px;min-width:0}.one-page-section{margin:0}.one-page-side-section{background:#F7F5F0;padding:15px 17px;border-radius:4px}.one-page-side-title{font-size:18px;font-weight:800;color:#00484F;margin-bottom:10px}
.one-page-export .glance-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.one-page-export .glance-card{border:0;border-radius:4px;background:#F6F5F1;min-height:78px;padding:10px 11px}.one-page-export .glance-card.wide{grid-column:1/-1;min-height:auto}.one-page-export .glance-card>span{font-size:9px;letter-spacing:.8px}.one-page-export .glance-card>strong{font-size:14px;line-height:1.25;margin:3px 0}.one-page-export .glance-card>small{font-size:11px;line-height:1.25}.one-page-status{background:#F0F7F6;padding:13px 15px;border-left:5px solid #68ACAA}.one-page-guest-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.one-page-guest-row{display:flex;justify-content:space-between;align-items:center;gap:12px;background:#fff;padding:10px 11px;border-radius:3px}.one-page-guest-row>div{display:flex;flex-direction:column;min-width:0}.one-page-guest-row strong{font-size:14px;line-height:1.25}.one-page-guest-row span{font-size:10px;color:#667085}.one-page-guest-row b{font-size:11px;text-transform:uppercase;letter-spacing:.7px;color:#00484F}.one-page-guest-row.new b{color:#6B6254}.one-page-guest-row small{font-size:11px;line-height:1.25;color:#006099;margin-top:2px}.one-page-muted{font-size:13px;color:#667085;background:#fff;padding:10px 11px;border-radius:3px}
.one-page-tasks{flex:1 1 auto}.one-page-export .task-checklist{margin:0}.one-page-export .task-checklist li{padding:7px 0;gap:8px;border-bottom:1px solid #ECE8E0;font-size:15px;line-height:1.35}.one-page-export .check-box{width:15px;height:15px;flex-basis:15px;margin-top:2px}
.one-page-reference-list{display:grid;gap:0}.one-page-reference-list>div{padding:8px 0;border-bottom:1px solid #E5E0D6}.one-page-reference-list>div:last-child{border-bottom:0}.one-page-reference-list span{display:block;font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#667085;font-weight:800;margin-bottom:2px}.one-page-reference-list strong{display:block;font-size:13px;line-height:1.3;color:#101828}.one-page-flow-list{margin:0;padding-left:20px}.one-page-flow-list li{font-size:14px;line-height:1.36;margin:0 0 7px}.one-page-flow-list li:last-child{margin-bottom:0}
.one-page-training-card{background:#FFF9E9}.one-page-training-card .training-only-label{font-size:9px;margin-bottom:8px}.one-page-card-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px}.one-page-card-grid span{display:block;background:#fff;padding:8px 9px;border-radius:3px;font-size:12px;line-height:1.3}.one-page-card-grid b{display:block;font-size:9px;text-transform:uppercase;color:#8A5B00;letter-spacing:.7px;margin-bottom:2px}.one-page-card-grid .wide{grid-column:1/-1}
.one-page-final .task-checklist li{font-size:13px;padding:6px 0}.one-page-closing{margin-top:9px;padding-top:9px;border-top:1px solid #DED9CF;font-size:12px;line-height:1.4;color:#454949}.one-page-footer{display:flex;justify-content:space-between;align-items:center;gap:12px;padding-top:11px;margin-top:14px;border-top:1px solid #D8D5CE;color:#667085;font-size:10px;text-transform:uppercase;letter-spacing:1px}

.adaptive-export{width:2040px;margin:0 auto;background:#fff;border:0;border-radius:0;padding:30px 40px;color:#101828;font-family:Arial,Helvetica,sans-serif}
.adaptive-export-header{display:flex;justify-content:space-between;align-items:center;gap:20px;background:#00484F;color:#fff;padding:15px 19px;border-radius:4px;margin-bottom:18px}
.adaptive-export-header>div{display:flex;flex-direction:column;gap:2px;min-width:0}
.adaptive-export-kicker{font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:#CDE4E2;font-weight:800}
.adaptive-export-header strong{font-size:24px;color:#fff;line-height:1.15}
.adaptive-export-header small{font-size:12px;color:#E4F2F1}
.adaptive-export-mode{font-size:11px;font-weight:800;letter-spacing:1px;background:#fff;color:#00484F;padding:7px 10px;border-radius:3px;white-space:nowrap}
.adaptive-export .scenario-section{margin:16px 0}
.adaptive-export h2{font-size:31px;line-height:1.2;margin:7px 0 13px}
.adaptive-export h3{font-size:21px;line-height:1.25;margin:0 0 8px}
.adaptive-export h4{font-size:16px;margin:16px 0 7px}
.adaptive-export p,.adaptive-export li{font-size:15px;line-height:1.45}
.adaptive-export .scenario-intro{font-size:15px;line-height:1.5;margin:0 0 15px}
.adaptive-export .scenario-meta-row{margin-bottom:8px}
.adaptive-export .chip,.adaptive-export .status-badge{font-size:11px;padding:5px 7px}
.adaptive-export .call-section{padding:14px 17px}
.adaptive-export .glance-grid{grid-template-columns:repeat(3,1fr);gap:8px}
.adaptive-export .glance-card{min-height:70px;padding:10px 11px}
.adaptive-export .glance-card>span{font-size:9px}
.adaptive-export .glance-card>strong{font-size:13px;line-height:1.3}
.adaptive-export .glance-card>small{font-size:10px;line-height:1.3}
.adaptive-export .latitudes-output-section{padding:13px 15px}
.adaptive-export .latitudes-output-grid{gap:7px}
.adaptive-export .latitudes-output-card{padding:9px 10px}
.adaptive-export .latitudes-output-card>strong{font-size:12px}
.adaptive-export .latitudes-output-card>small{font-size:10px}
.adaptive-export .task-checklist li{padding:6px 0}
.adaptive-export .check-box{width:13px;height:13px;flex-basis:13px}
.adaptive-export .details-section{padding-top:14px}
.adaptive-export .detail-list{columns:2;column-gap:34px}
.adaptive-export .detail-list li{break-inside:avoid}
.adaptive-export .instruction-strip{margin:8px 0 11px;padding:10px 12px}
.adaptive-export .payment-section{padding:12px 14px}
.adaptive-export .end-call-section{padding:13px 15px}
.adaptive-export .share-expanded-section{margin:14px 0}
.adaptive-export .share-expanded-heading{padding:10px 12px;font-size:14px}
.adaptive-export .support-body{padding:10px 13px}
.adaptive-export .support-list{columns:2;column-gap:30px}
.adaptive-export.trainee-export .trainer-section{display:none!important}
.adaptive-export.trainer-export .trainer-section{display:block!important;margin-top:18px;padding-top:16px;border-top:2px solid #00484F}
.adaptive-export.trainer-export .trainer-info-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.adaptive-export.trainer-export .trainer-info-card{padding:10px 12px}
.adaptive-export.trainer-export .trainer-workflow{columns:2;column-gap:36px}
.adaptive-export.trainer-export .trainer-workflow li{break-inside:avoid}
.adaptive-export.trainer-export .trainer-guide>ul{columns:2;column-gap:36px}
.adaptive-export.trainer-export .trainer-guide>ul li{break-inside:avoid}

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
      sourceUrl = normalizeNclUsUrl(u).toString();
    } catch {
      return json({ error: "That NCL URL is not valid." }, 400);
    }

    const parsed = await renderAndParse(env, sourceUrl);
    if (!parsed.ok) return json({ error: parsed.error }, 502);

    return json({
      live: true,
      sourceUrl,
      sourceMarket: "US",
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

  // NCL's U.S. vacation page is JavaScript-driven. Pull the structured
  // itinerary inventory first so the search is not dependent on rendered
  // result cards appearing in the page HTML.
  const apiAttempt = await fetchNclUsInventory(criterion, value, from, to, duration);
  if (apiAttempt.ok && apiAttempt.results.length) {
    const sourceUrl = buildNclSearchUrls(criterion, value, from, to)[0];
    return json({
      live: true,
      sourceUrl,
      sourceMarket: "US",
      retrievedAt: new Date().toISOString(),
      message: `Found ${apiAttempt.results.length} NCL.com U.S. itinerary option${apiAttempt.results.length === 1 ? "" : "s"} with specific sailing dates.`,
      results: apiAttempt.results.slice(0, 40),
      diagnostic: {
        method: apiAttempt.diagnostic?.method || "ncl-us-inventory-api",
        inventoryCount: apiAttempt.diagnostic?.inventoryCount || 0,
        matchedCount: apiAttempt.results.length,
        currency: apiAttempt.diagnostic?.currency || "",
        criterion,
        value,
        wantedMonths
      }
    });
  }

  const candidateUrls = buildNclSearchUrls(criterion, value, from, to);

  // Page parsing remains as a public NCL fallback if the inventory API is
  // temporarily unavailable.
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

    if (from && to && r.sailingDates?.length) {
      r.sailingDates = r.sailingDates.filter(d => d >= from && d <= to);
      if (!r.sailingDates.length) return false;
    }
    return true;
  }).slice(0, 40);

  return json({
    live: true,
    sourceUrl,
    retrievedAt: new Date().toISOString(),
    message: results.length
      ? `Found ${results.length} public NCL U.S. itinerary option${results.length === 1 ? "" : "s"}. Select a specific sailing date before using an itinerary. When NCL does not expose an exact date on the public card, verify the date on NCL.com U.S. or in Seaweb.`
      : parsed.results.length
        ? "NCL.com U.S. itineraries loaded, but no visible public card matched this 30-day window and optional vacation length. Try Any Length or another single search option."
        : apiAttempt?.error
          ? `NCL.com U.S. loaded, but the itinerary inventory service did not return usable results (${apiAttempt.error}).`
          : "NCL.com U.S. loaded, but no readable itinerary data was returned.",
    results,
    diagnostic: {
      ...parsed.diagnostic,
      parsedCards: parsed.results.length,
      filteredCards: results.length,
      criterion,
      value,
      wantedMonths,
      apiAttempt: apiAttempt?.diagnostic || { error: apiAttempt?.error || "" },
      attempts
    }
  });
}

async function fetchNclUsInventory(criterion, value, from, to, duration) {
  const apiUrls = [
    "https://www.ncl.com/api/vacations/v1/itineraries?guests=2",
    "https://www.ncl.com/api/vacations/v1/itineraries?guests=2&currency=USD&locale=en-US"
  ];

  const attempts = [];
  for (const apiUrl of apiUrls) {
    try {
      const response = await fetch(apiUrl, {
        redirect: "follow",
        headers: {
          "Accept": "application/json, text/plain, */*",
          "Accept-Language": "en-US,en;q=0.9",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/153 Safari/537.36",
          "Referer": "https://www.ncl.com/vacations",
          "Cookie": "NCL_LOCALE=en-US; MP_COUNTRY=us; MP_LANG=en"
        },
        cf: { cacheTtl: 300, cacheEverything: true }
      });

      const contentType = response.headers.get("content-type") || "";
      attempts.push({ url: apiUrl, status: response.status, contentType });

      if (!response.ok || !/json/i.test(contentType)) continue;

      const data = await response.json();
      const rawItineraries = Array.isArray(data?.itineraries)
        ? data.itineraries
        : Array.isArray(data?.results)
          ? data.results
          : Array.isArray(data)
            ? data
            : [];

      if (!rawItineraries.length) continue;

      const parsed = rawItineraries
        .map(x => normalizeNclApiItinerary(x))
        .filter(Boolean);

      if (!parsed.length) continue;

      const explicitCurrencies = [...new Set(parsed.map(x => x.currencyCode).filter(Boolean))];
      // The U.S. endpoint should quote USD when currency is present. If NCL
      // returns another storefront, do not mislabel it as U.S. data.
      if (explicitCurrencies.length && !explicitCurrencies.includes("USD")) {
        attempts[attempts.length - 1].currencyMismatch = explicitCurrencies.join(",");
        continue;
      }

      const results = filterNclInventory(parsed, criterion, value, from, to, duration);
      return {
        ok: true,
        results,
        diagnostic: {
          method: "ncl-us-inventory-api",
          inventoryCount: parsed.length,
          currency: explicitCurrencies.join(",") || "USD requested",
          attempts
        }
      };
    } catch (e) {
      attempts.push({ url: apiUrl, error: String(e?.message || e) });
    }
  }

  return {
    ok: false,
    results: [],
    error: "U.S. itinerary inventory unavailable",
    diagnostic: { method: "ncl-us-inventory-api", attempts }
  };
}

function normalizeNclApiItinerary(raw) {
  if (!raw || typeof raw !== "object") return null;

  const title = clean(
    raw?.title?.fullTitle ||
    raw?.title?.title ||
    raw?.fullTitle ||
    raw?.itineraryTitle ||
    raw?.name ||
    raw?.title ||
    ""
  );

  const ship = apiLabel(
    raw.ship ||
    raw.shipName ||
    raw.cruiseDetails?.ship ||
    raw.vessel
  );

  let duration = Number(
    raw.duration ??
    raw.days ??
    raw.nights ??
    raw.cruiseLength ??
    raw.length ??
    0
  );
  if (!duration && title) {
    const m = title.match(/(\d{1,2})\s*[-–—]?\s*day/i);
    if (m) duration = Number(m[1]);
  }

  const destinations = apiList(raw.destination || raw.destinations)
    .map(apiLabel)
    .filter(Boolean);

  const rawPorts =
    raw.portsOfCall ||
    raw.ports ||
    raw.itineraryPorts ||
    raw.cruiseDetails?.portsOfCall ||
    [];
  const ports = apiList(rawPorts).map(apiLabel).filter(Boolean);

  const embarkation =
    apiLabel(raw.embarkationPort) ||
    apiLabel(raw.departurePort) ||
    apiLabel(raw.embarkPort) ||
    apiLabel(raw.originPort) ||
    ports[0] ||
    "";

  const sailings = apiList(
    raw.sailings ||
    raw.cruiseDetails?.sailings ||
    raw.departures ||
    []
  );

  const sailingDates = [...new Set(
    sailings
      .map(s => normalizeNclApiDate(
        s?.departureDate ??
        s?.sailDate ??
        s?.startDate ??
        s?.embarkDate ??
        s?.date
      ))
      .filter(Boolean)
  )].sort();

  const sailingMonths = [...new Set(
    sailingDates.map(d => {
      const dt = new Date(d + "T12:00:00Z");
      return dt.toLocaleString("en-US", {
        month: "long",
        year: "numeric",
        timeZone: "UTC"
      });
    })
  )];

  const currencyCode = clean(
    raw?.currency?.code ||
    raw?.currency?.currencyCode ||
    raw?.currencyCode ||
    ""
  ).toUpperCase();

  const currencySymbol = clean(
    raw?.currency?.symbol ||
    raw?.currencySymbol ||
    ""
  );

  let lowestPrice = null;
  for (const sailing of sailings) {
    for (const pricing of apiList(sailing?.pricing || sailing?.prices || sailing?.staterooms)) {
      const candidate = Number(
        pricing?.combinedPrice ??
        pricing?.price ??
        pricing?.totalPrice ??
        pricing?.fare
      );
      if (Number.isFinite(candidate) && (lowestPrice === null || candidate < lowestPrice)) {
        lowestPrice = candidate;
      }
    }
  }

  const code = clean(
    raw.itineraryCode ||
    raw.code ||
    raw.id ||
    raw.cruiseDetails?.itineraryCode ||
    ""
  );

  const sourceUrl = nclApiDetailUrl(raw, code, title);

  return {
    duration,
    ship,
    title: title || "NCL itinerary",
    departure: embarkation,
    destinations,
    sailingMonths,
    sailingDates,
    hasMoreDates: false,
    ports,
    price: lowestPrice !== null
      ? `${currencySymbol || (currencyCode === "USD" ? "$" : "")}${lowestPrice.toLocaleString("en-US")} PP${currencyCode ? ` / ${currencyCode}` : ""}`
      : "",
    taxes: "",
    offers: [],
    sourceUrl,
    currencyCode,
    itineraryCode: code,
    retrievedAt: new Date().toISOString()
  };
}

function filterNclInventory(items, criterion, value, from, to, duration) {
  const wanted = clean(value).toLowerCase();

  return items.filter(r => {
    const haystack = criterion === "destination"
      ? `${r.destinations.join(" ")} ${r.title} ${r.ports.join(" ")}`.toLowerCase()
      : criterion === "departure"
        ? `${r.departure} ${embarkationCode((r.departure || "").toLowerCase())}`.toLowerCase()
        : `${r.ship}`.toLowerCase();

    const criterionNeedle = criterion === "departure"
      ? `${wanted} ${embarkationCode(wanted)}`.trim()
      : wanted;

    const matchesCriterion = criterionNeedle
      .split(/\s+/)
      .filter(Boolean)
      .some(part => haystack.includes(part));

    if (!matchesCriterion) return false;

    const d = Number(r.duration || 0);
    if (duration === "1-4" && !(d >= 1 && d <= 4)) return false;
    if (duration === "5-8" && !(d >= 5 && d <= 8)) return false;
    if (duration === "9-14" && !(d >= 9 && d <= 14)) return false;
    if (duration === "15+" && !(d >= 15)) return false;

    if (from && to) {
      r.sailingDates = (r.sailingDates || []).filter(date => date >= from && date <= to);
      if (!r.sailingDates.length) return false;
      r.sailingMonths = [...new Set(r.sailingDates.map(date => {
        const dt = new Date(date + "T12:00:00Z");
        return dt.toLocaleString("en-US", {
          month: "long",
          year: "numeric",
          timeZone: "UTC"
        });
      }))];
    }

    return true;
  }).slice(0, 40);
}

function apiList(value) {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  return [value];
}

function apiLabel(value) {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number") return clean(value);
  if (typeof value !== "object") return "";
  return clean(
    value.title?.fullTitle ||
    value.title ||
    value.name ||
    value.fullTitle ||
    value.displayName ||
    value.description ||
    value.label ||
    value.code ||
    ""
  );
}

function normalizeNclApiDate(value) {
  if (value == null || value === "") return "";

  if (typeof value === "number" || /^\d{10,13}$/.test(String(value))) {
    let n = Number(value);
    if (!Number.isFinite(n)) return "";
    if (n < 100000000000) n *= 1000;
    const dt = new Date(n);
    return Number.isNaN(dt.getTime()) ? "" : dt.toISOString().slice(0, 10);
  }

  const text = String(value).trim();
  const iso = text.match(/^(20\d{2})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  const dt = new Date(text);
  return Number.isNaN(dt.getTime()) ? "" : dt.toISOString().slice(0, 10);
}

function nclApiDetailUrl(raw, code, title) {
  const direct =
    raw?.detailUrl ||
    raw?.url ||
    raw?.bookingUrl ||
    raw?.cruiseUrl ||
    raw?.cruiseDetails?.url ||
    "";
  if (direct) {
    try {
      return normalizeNclUsUrl(new URL(direct, "https://www.ncl.com")).toString();
    } catch (_) {}
  }

  if (code) {
    const titleSlug = slug(title || "cruise");
    return `https://www.ncl.com/cruises/${titleSlug}-${encodeURIComponent(code)}?itineraryCode=${encodeURIComponent(code)}`;
  }
  return "https://www.ncl.com/vacations";
}

function normalizeNclUsUrl(input) {
  const u = input instanceof URL ? new URL(input.toString()) : new URL(String(input || ""));
  u.protocol = "https:";
  u.hostname = "www.ncl.com";
  u.port = "";

  // Remove country/language prefixes so manual imports always use the U.S. site.
  // Examples: /uk/en/vacations, /ca/en/vacations, /au/en/vacations.
  u.pathname = u.pathname.replace(
    /^\/(?:uk|ca|au|nz|no|de|fr|es|it|br|mx|se|dk|fi|nl|be|ch|at)\/(?:en|de|fr|es|it|pt|nl|sv|da|fi|no)\//i,
    "/"
  );
  return u;
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
  const base = "https://www.ncl.com/vacations";
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
    const sailingDates = extractExactSailingDates(beforeAccolades);

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
      sailingDates,
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

function isoDate(year, month, day) {
  const m = String(month).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  const iso = `${year}-${m}-${d}`;
  const test = new Date(`${iso}T12:00:00Z`);
  if (
    Number.isNaN(test.getTime()) ||
    test.getUTCFullYear() !== Number(year) ||
    test.getUTCMonth() + 1 !== Number(month) ||
    test.getUTCDate() !== Number(day)
  ) return "";
  return iso;
}

function extractExactSailingDates(text) {
  const out = new Set();
  const source = String(text || "");
  const months = {
    january:1,february:2,march:3,april:4,may:5,june:6,
    july:7,august:8,september:9,october:10,november:11,december:12,
    jan:1,feb:2,mar:3,apr:4,jun:6,jul:7,aug:8,sep:9,sept:9,oct:10,nov:11,dec:12
  };

  const monthFirst = new RegExp(
    "\\b(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\\s+(\\d{1,2}),?\\s+(20\\d{2})\\b",
    "gi"
  );
  for (const m of source.matchAll(monthFirst)) {
    const iso = isoDate(Number(m[3]), months[m[1].toLowerCase()], Number(m[2]));
    if (iso) out.add(iso);
  }

  const dayFirst = new RegExp(
    "\\b(\\d{1,2})\\s+(January|February|March|April|May|June|July|August|September|October|November|December)\\s+(20\\d{2})\\b",
    "gi"
  );
  for (const m of source.matchAll(dayFirst)) {
    const iso = isoDate(Number(m[3]), months[m[2].toLowerCase()], Number(m[1]));
    if (iso) out.add(iso);
  }

  const isoPattern = new RegExp("\\b(20\\d{2})-(\\d{2})-(\\d{2})\\b", "g");
  for (const m of source.matchAll(isoPattern)) {
    const iso = isoDate(Number(m[1]), Number(m[2]), Number(m[3]));
    if (iso) out.add(iso);
  }

  const usNumeric = new RegExp("\\b(\\d{1,2})/(\\d{1,2})/(20\\d{2})\\b", "g");
  for (const m of source.matchAll(usNumeric)) {
    const iso = isoDate(Number(m[3]), Number(m[1]), Number(m[2]));
    if (iso) out.add(iso);
  }

  return [...out].sort();
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
