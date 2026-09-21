const $ = (id) => document.getElementById(id);
const state = {
  mode: "trainer",
  selectedSailing: null,
  currentScenario: null,
  validation: [],
  sailings: []
};

const marketAgencies = [
  ["Miami – US Currency","304548"],["Miami – Canadian Currency","501874"],
  ["Miami Webchat – US Currency","671675"],["Miami Webchat – Canadian Currency","674215"],
  ["Remote Outbound – US Currency","622001"],["Remote Outbound – Canadian Currency","622055"],
  ["Sawgrass – US Currency","246598"],["Sawgrass – Canadian Currency","502395"],
  ["Groups – US Currency","432234"],["Groups – Canadian Currency","484500"],
  ["International – LATAM","562094"],["International – Brazil","542760"],["International – Russia","302311"],
  ["International – Spain","257840"],["International – Israel","655664"],["International – UK (London / GBP)","256393"],
  ["International – Ireland / EUR","565102"],["International – Italy","271269"],["International – MEA (Middle East/Africa)","655662"],
  ["International – South Africa","655662"],["International – Germany","257839"],["International – Scandinavia","25784830"],
  ["Webchat UK – UK","688136"]
];

const trainingCards = {
  standardSesame:{label:"Standard Training Card – Sesame St.",number:"4444 3333 2222 1111",expiration:"04/2027",ccv:"123",address:"123 Sesame Street, Miami, FL 33126"},
  standardMain:{label:"Standard Training Card – Main St.",number:"4444 3333 2222 1111",expiration:"04/2027",ccv:"123",address:"100 Main St., Miami, FL 33126"},
  alternateMain:{label:"Alternate Training Card – Main St.",number:"4917 6100 0000 0000",expiration:"04/2027",ccv:"123",address:"100 Main St., Miami, FL 33126"},
  obSpecial:{label:"OB Special Requests Training Card",number:"4444 3333 2222 1111",expiration:"05/2028",ccv:"456",address:"123 Sesame Street, Miami, FL 33126"}
};

const scenarioCatalog = {
  "Guest Services": {
    6: [
      {name:"Basic Reservation",payment:"Offer / Hold only",cardRequired:false,commenting:false,difficulty:"Beginner",kind:"new",objective:"Create a basic reservation, review stateroom choices and pricing, verify guest details, place the booking on hold/offer, and explain the deposit deadline."},
      {name:"Payments",payment:"Minimum Deposit",cardRequired:true,cardProfile:"standardMain",commenting:false,difficulty:"Beginner",kind:"new",objective:"Create a reservation, process the minimum deposit, discuss refundability, remaining balance, split payments, and Auto Final Payment."}
    ],
    7: [
      {name:"Applying FCC",payment:"FCC / CruiseNext",cardRequired:false,commenting:true,difficulty:"Intermediate",kind:"new",objective:"Place the booking in offer status before applying CruiseNext/FCC and guest discount coupons, review the updated pricing, and add reservation comments."},
      {name:"NorwegianCare",payment:"Minimum Deposit",cardRequired:true,cardProfile:"alternateMain",commenting:true,difficulty:"Intermediate",kind:"followup",objective:"Service the Basic Reservation, add NorwegianCare, answer removal/refund timing questions, review updated pricing, process a payment when accepted, and notate the reservation."}
    ],
    8: [
      {name:"Special Requests",payment:"No Payment / Service Only",cardRequired:false,commenting:true,difficulty:"Intermediate",kind:"followup",objective:"Service the Payments reservation, complete GDPR verification, add stateroom preferences and special-occasion notes, recap changes, and send an updated confirmation."},
      {name:"Price Programs & FAS",payment:"No Payment / Service Only",cardRequired:false,commenting:true,difficulty:"Intermediate",kind:"followup",objective:"Service the Basic Reservation, add Free at Sea selections and prepaid service charges, review applicable deadlines and pricing, and notate the reservation."}
    ],
    9: [
      {name:"ADA & Special Requests",payment:"Minimum Deposit",cardRequired:true,cardProfile:"standardMain",commenting:true,difficulty:"Advanced",kind:"new",objective:"Create an accessible-stateroom booking, add ADA and dietary requests, apply eligible promotions/coupons in the correct order, process the deposit, and document the reservation."},
      {name:"Infants & Guests 3-8",payment:"FCC / CruiseNext",cardRequired:false,commenting:true,difficulty:"Advanced",kind:"new",objective:"Create a multi-occupancy family booking with an infant, create/verify guest profiles, handle occupancy rules, PPSRVCHG/FAS selections, special requests, and CruiseNext/discount coupons."}
    ],
    10: [
      {name:"Agencies: TA Booking",payment:"FCC / CruiseNext",cardRequired:false,commenting:true,difficulty:"Advanced",kind:"ta",objective:"Create a travel-agent booking, apply agency/FlexNet requirements, secure the reservation with CruiseNext, apply guest coupons in the correct order, and recap/notate the booking."},
      {name:"Multiple Reservations",payment:"Initial Deposit",cardRequired:true,cardProfile:"standardMain",commenting:true,difficulty:"Advanced",kind:"new",objective:"Create two related family reservations, handle authorized-person guidance, deposits, adjacent/connecting rooms, special requests, FAS/PPSRVCHG/travel protection, and link bookings with TWITH."},
      {name:"Bundled Air & Ground Transfers",payment:"Initial Deposit",cardRequired:true,cardProfile:"alternateMain",commenting:true,difficulty:"Advanced",kind:"ta",objective:"Create a travel-agent reservation with bundled air and ground-transfer requirements, review air terms, document special requests, process payment, and send the correct confirmation."}
    ],
    11: [
      {name:"Cancel & Reinstate",payment:"Refund / Reinstate",cardRequired:false,commenting:true,difficulty:"Advanced",kind:"followup",objective:"Complete GDPR verification, evaluate final-payment status, cancel with refund guidance, then practice reinstatement while checking fare, category, stateroom, and promotion changes."},
      {name:"Price Drops - TRAINER DEMO",payment:"No Payment / Service Only",cardRequired:false,commenting:false,difficulty:"Advanced",kind:"demo",objective:"Trainer-led demonstration of the price-drop workflow and the required Seaweb/NCLHelp checks."},
      {name:"Land Pkgs / Cruisetour",payment:"No Payment / Service Only",cardRequired:false,commenting:true,difficulty:"Advanced",kind:"followup",objective:"Service an existing travel-agent reservation and add the best available land package/cruisetour after GDPR verification, then recap and document the change."}
    ]
  },
  "Outbound Sales": {
    6: [
      {name:"Basic Reservation",payment:"Initial Deposit",cardRequired:true,cardProfile:"standardSesame",commenting:false,difficulty:"Beginner",kind:"outbound-new",objective:"Qualify the outbound guest, create the reservation, quote pricing, collect the initial deposit, and send the guest confirmation."}
    ],
    7: [
      {name:"Payments",payment:"Initial Deposit",cardRequired:true,cardProfile:"standardSesame",commenting:true,difficulty:"Beginner",kind:"outbound-new",objective:"Qualify the guest, create the reservation, process payment, complete mandatory fields/comments, and review final-payment and Auto Final Payment information."},
      {name:"Special Requests",payment:"Full Payment",cardRequired:true,cardProfile:"obSpecial",commenting:true,difficulty:"Intermediate",kind:"outbound-new",objective:"Qualify the guest, create the reservation, add stateroom and dietary requests, collect full payment, document the booking, and send confirmation."}
    ],
    8: [
      {name:"Norwegian Care",payment:"No Payment / Service Only",cardRequired:false,commenting:true,difficulty:"Intermediate",kind:"followup",objective:"Follow up on the Basic Reservation, add Norwegian Care, review updated pricing and coverage/removal timing, recap, and notate the reservation."},
      {name:"Price Programs & FAS",payment:"FCC / CruiseNext",cardRequired:false,commenting:true,difficulty:"Intermediate",kind:"new",objective:"Build a booking with FAS/PPSRVCHG, travel protection and special requests; place it in offer before applying guest discount coupons, then review updated pricing."},
      {name:"GTY Categories - Trainer Demo",payment:"No Payment / Service Only",cardRequired:false,commenting:false,difficulty:"Intermediate",kind:"demo",objective:"Trainer-led demonstration of Guarantee (GTY) category behavior and how to explain it to a guest."},
      {name:"Singles / Infants / Guests 3-8",payment:"Initial Deposit",cardRequired:true,cardProfile:"standardSesame",commenting:true,difficulty:"Intermediate",kind:"new",objective:"Practice solo, infant, and multi-guest bookings; handle occupancy, FAS/PPSRVCHG, travel protection, special requests, CruiseNext, and required deposit rules."},
      {name:"Cruise First",payment:"Initial Deposit",cardRequired:true,cardProfile:"standardSesame",commenting:false,difficulty:"Intermediate",kind:"followup",objective:"Follow up on the Basic Reservation to purchase/apply CruiseFirst, collect the required payment, and review CruiseFirst terms and system workflow."}
    ],
    9: [
      {name:"ADA & Special Request",payment:"FCC / CruiseNext",cardRequired:false,commenting:true,difficulty:"Advanced",kind:"new",objective:"Create an ADA booking with accessible stateroom requirements, dietary/special requests, FAS/PPSRVCHG and travel protection, then apply CruiseNext and document actionable requests correctly."},
      {name:"New Guest",payment:"Initial Deposit",cardRequired:true,cardProfile:"standardSesame",commenting:true,difficulty:"Advanced",kind:"new",objective:"Create new guest profiles that match travel documents, build the reservation, add selected promotions/special requests, take the initial deposit, and document/send confirmation."},
      {name:"Multiple Reservations / Travel With",payment:"Full Payment",cardRequired:true,cardProfile:"standardSesame",commenting:true,difficulty:"Advanced",kind:"new",objective:"Create two separate related reservations, locate connecting/adjacent staterooms, apply different protection choices, take full payment, add TWITH, and complete follow-up dining/entertainment work."}
    ],
    10: [
      {name:"Dining, Ent & Spa",payment:"Amenity Payment",cardRequired:true,cardProfile:"standardSesame",commenting:true,difficulty:"Advanced",kind:"followup",objective:"Service an existing reservation, add FAS dining/internet/shore excursions and Essentials TP as appropriate, collect required payment, make dining reservations, and notate changes."},
      {name:"Amenities",payment:"Amenity Payment",cardRequired:true,cardProfile:"standardSesame",commenting:true,difficulty:"Advanced",kind:"followup",objective:"Add paid onboard amenities, complete the card message fields, collect payment, notate the reservation, and send the amenity invoice."},
      {name:"Bundled Air / Ground Transfers",payment:"FCC / CruiseNext",cardRequired:false,commenting:true,difficulty:"Advanced",kind:"new",objective:"Build a reservation with bundled air and ground transfers, review air terms, apply CruiseNext, add special requests/celebration details, and document the booking."},
      {name:"Air Deviations",payment:"Amenity Payment",cardRequired:true,cardProfile:"standardSesame",commenting:true,difficulty:"Advanced",kind:"followup",objective:"Service bundled air with deviation requests, review applicable terms/fees, update the reservation, collect any required payment, and document the change."},
      {name:"Cancellations / Reinstatements",payment:"Refund / Reinstate",cardRequired:false,commenting:true,difficulty:"Advanced",kind:"followup",objective:"Cancel a reservation after verification, explain refund timing and card refund details, then practice reinstatement and identify any fare/category/stateroom/promotion changes."}
    ],
    11: [
      {name:"Hotel",payment:"No Payment / Service Only",cardRequired:false,commenting:true,difficulty:"Advanced",kind:"followup",objective:"Follow up on the Bundled Air/Ground Transfer reservation and add a two-night pre-cruise hotel in the Land tab, then recap and notate the change."},
      {name:"Cruisetours",payment:"Initial Deposit",cardRequired:true,cardProfile:"standardSesame",commenting:true,difficulty:"Advanced",kind:"new",objective:"Create a pre-cruisetour reservation with FAS/PPSRVCHG, Norwegian Care, bundled air and special requests, take necessary payment, and send confirmation."},
      {name:"Air Choice",payment:"Initial Deposit",cardRequired:true,cardProfile:"standardSesame",commenting:true,difficulty:"Advanced",kind:"new",objective:"Practice Interactive Air/Air Choice, remove or adjust transfers, explain flexible-air terms, handle CruiseNext/deposit questions, take required payment, and document the reservation."}
    ]
  }
};

const starters = [
  {department:"Guest Services",day:6,focus:"Basic Reservation",difficulty:"Beginner",desc:"GS Day 6: basic reservation and hold/offer workflow."},
  {department:"Guest Services",day:7,focus:"Applying FCC",difficulty:"Intermediate",desc:"GS Day 7: offer-first FCC/CruiseNext and coupon workflow."},
  {department:"Outbound Sales",day:6,focus:"Basic Reservation",difficulty:"Beginner",desc:"OB Day 6: qualifying, new reservation, and initial deposit."},
  {department:"Outbound Sales",day:10,focus:"Dining, Ent & Spa",difficulty:"Advanced",desc:"OB Day 10: follow-up servicing, paid add-ons, and dining."}
];

const namePairs = [
  ["Maxim De Winter","Rebecca De Winter"],["William Darcy","Elizabeth Bennet"],
  ["Bill Baggins","Kat Everdeen"],["Nick Carraway","Daisy Buchanan"],
  ["Jo March","Friedrich Bhaer"],["Sherlock Holmes","Irene Adler"],
  ["Atticus Finch","Jean Louise Finch"],["Jane Eyre","Edward Rochester"]
];

function go(page){
  document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
  document.querySelectorAll(".nav").forEach(n=>n.classList.remove("active"));
  $(page).classList.add("active");
  document.querySelector(`.nav[data-page="${page}"]`)?.classList.add("active");
  if(page==="library") renderLibrary();
  if(page==="dashboard") updateStats();
}
document.querySelectorAll(".nav").forEach(n=>n.onclick=()=>go(n.dataset.page));
document.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>go(b.dataset.go));

function setMode(mode){
  state.mode=mode;
  document.body.classList.toggle("trainee-mode",mode==="trainee");
  $("trainerModeBtn").classList.toggle("active",mode==="trainer");
  $("traineeModeBtn").classList.toggle("active",mode==="trainee");
  if(mode==="trainee" && $("validator").classList.contains("active")) go("generator");
}
$("trainerModeBtn").onclick=()=>setMode("trainer");
$("traineeModeBtn").onclick=()=>setMode("trainee");
$("previewTraineeBtn").onclick=()=>{setMode("trainee");go("generator")};

function currentFocusMeta(){
  const dept=$("department")?.value||"Guest Services";
  const day=$("trainingDay")?.value||"6";
  return (scenarioCatalog[dept]?.[day]||[]).find(x=>x.name===$("scenarioType")?.value) || null;
}

function populateMarketAgencies(){
  $("marketAgency").innerHTML=marketAgencies.map(([label,value])=>`<option value="${escapeAttr(value)}">${escapeHtml(label)} — ${escapeHtml(value)}</option>`).join("");
}

function populateTrainingCards(){
  $("trainingCardProfile").innerHTML=Object.entries(trainingCards).map(([key,c])=>`<option value="${key}">${escapeHtml(c.label)}</option>`).join("");
}

function renderTrainingCard(){
  const c=trainingCards[$("trainingCardProfile").value]||trainingCards.standardSesame;
  $("trainingCardPreview").innerHTML=`
    <div><span>Card Number</span><strong>${escapeHtml(c.number)}</strong></div>
    <div><span>Expiration</span><strong>${escapeHtml(c.expiration)}</strong></div>
    <div><span>CCV</span><strong>${escapeHtml(c.ccv)}</strong></div>
    <div class="wide"><span>Billing Address</span><strong>${escapeHtml(c.address)}</strong></div>`;
}

function updateDepartmentUI(){
  const dept=$("department").value;
  const outbound=dept==="Outbound Sales";
  $("marketAgencyField").classList.toggle("hidden-field",!outbound);
  if(outbound){
    $("agency").value=$("marketAgency").value||marketAgencies[0][1];
  }else{
    $("agency").value="5";
  }
  updateScenarioFocus();
}

function updateScenarioFocus(preferred){
  const dept=$("department").value;
  const day=$("trainingDay").value;
  const options=scenarioCatalog[dept]?.[day]||[];
  $("scenarioType").innerHTML=options.map(x=>`<option value="${escapeAttr(x.name)}">${escapeHtml(x.name)}</option>`).join("");
  if(preferred && options.some(x=>x.name===preferred)) $("scenarioType").value=preferred;
  applyFocusDefaults();
}

function paymentActionNeedsCard(){
  return ["Minimum Deposit","Initial Deposit","Full Payment","Amenity Payment"].includes($("paymentAction").value);
}

function refreshTrainingCardPanel(preferredProfile){
  const meta=currentFocusMeta()||{};
  const showCard=!!meta.cardRequired||paymentActionNeedsCard();
  $("trainingCardPanel").classList.toggle("hidden-field",!showCard);
  if(showCard){
    const desired=preferredProfile||meta.cardProfile||$("trainingCardProfile").value||"standardSesame";
    if(trainingCards[desired]) $("trainingCardProfile").value=desired;
    renderTrainingCard();
  }
}

function applyFocusDefaults(){
  const meta=currentFocusMeta();
  if(!meta)return;
  $("difficulty").value=meta.difficulty||"Intermediate";
  $("paymentAction").value=meta.payment||"No Payment / Service Only";
  $("commentToggle").checked=!!meta.commenting;
  $("confirmToggle").checked=true;
  refreshTrainingCardPanel(meta.cardProfile);
  $("curriculumNote").innerHTML=`<strong>${escapeHtml($("department").value)} • Day ${escapeHtml($("trainingDay").value)} • ${escapeHtml(meta.name)}</strong><span>${escapeHtml(meta.objective)}</span>`;
}

function renderStarters(){
  $("starterTemplates").innerHTML=starters.map((s,i)=>`
    <div class="template-card">
      <div class="meta"><span class="chip">${escapeHtml(s.department)}</span><span class="chip">Day ${s.day}</span></div>
      <h4>${escapeHtml(s.focus)}</h4><p>${escapeHtml(s.desc)}</p>
      <button class="secondary" onclick="loadStarter(${i})">Use Quick Start</button>
    </div>`).join("");
}
window.loadStarter=(i)=>{
  const s=starters[i];
  $("department").value=s.department;
  $("trainingDay").value=String(s.day);
  updateDepartmentUI();
  updateScenarioFocus(s.focus);
  $("difficulty").value=s.difficulty;
  go("generator");
};

$("department").addEventListener("change",updateDepartmentUI);
$("trainingDay").addEventListener("change",()=>updateScenarioFocus());
$("scenarioType").addEventListener("change",applyFocusDefaults);
$("marketAgency").addEventListener("change",()=>{$("agency").value=$("marketAgency").value});
$("trainingCardProfile").addEventListener("change",renderTrainingCard);
$("paymentAction").addEventListener("change",()=>refreshTrainingCardPanel());

$("generateNamesBtn").onclick=()=>{
  const pair=namePairs[Math.floor(Math.random()*namePairs.length)];
  $("guest1").value=pair[0]; $("guest2").value=pair[1];
};

const anchorSuggestions = {
  destination:["Caribbean","Alaska","Canada & New England","Bermuda","Bahamas","Europe","Mediterranean","Northern Europe","Hawaii","Panama Canal","South America","Asia","Australia & New Zealand"],
  departure:["Miami","Port Canaveral","New York","Boston","Seattle","Los Angeles","New Orleans","Tampa","San Juan","Honolulu","Barcelona","Rome (Civitavecchia)","Southampton"],
  ship:["Norwegian Aqua","Norwegian Luna","Norwegian Prima","Norwegian Viva","Norwegian Encore","Norwegian Bliss","Norwegian Joy","Norwegian Breakaway","Norwegian Getaway","Norwegian Escape","Norwegian Epic","Norwegian Gem","Norwegian Jade","Norwegian Pearl","Norwegian Dawn","Norwegian Star","Norwegian Sun","Norwegian Spirit","Pride of America"]
};

function isoDate(d){
  const x=new Date(d.getTime()-d.getTimezoneOffset()*60000);
  return x.toISOString().slice(0,10);
}
function addDays(dateString, days){
  const d=new Date(dateString+"T12:00:00");
  d.setDate(d.getDate()+days);
  return isoDate(d);
}
function daysBetween(a,b){
  return Math.round((new Date(b+"T12:00:00")-new Date(a+"T12:00:00"))/86400000);
}
function initSearchDates(){
  const today=new Date();
  const from=isoDate(today);
  $("searchFrom").value=from;
  $("searchTo").value=addDays(from,30);
  $("searchFrom").min=from;
  $("searchTo").min=from;
  $("searchTo").max=addDays(from,30);
  updateDateHint();
}
function currentAnchor(){
  return document.querySelector('input[name="searchAnchor"]:checked')?.value||"destination";
}
function updateAnchorUI(){
  const anchor=currentAnchor();
  const names={destination:"Destination",departure:"Embarkation Port",ship:"Ship"};
  const examples={destination:"Example: Caribbean",departure:"Example: Miami",ship:"Example: Norwegian Aqua"};
  $("anchorFieldLabel").childNodes[0].textContent=names[anchor]+" ";
  $("searchAnchorValue").placeholder=examples[anchor];
  $("searchAnchorValue").value="";
  $("anchorSuggestions").innerHTML=anchorSuggestions[anchor].map(v=>`<option value="${escapeAttr(v)}"></option>`).join("");
  document.querySelectorAll(".anchor-card").forEach(c=>c.classList.toggle("active",c.querySelector("input").checked));
}
document.querySelectorAll('input[name="searchAnchor"]').forEach(r=>r.addEventListener("change",updateAnchorUI));

function updateDateHint(){
  const from=$("searchFrom").value,to=$("searchTo").value;
  if(!from||!to)return;
  const diff=daysBetween(from,to);
  if(diff<0){
    $("dateWindowHint").textContent="To date cannot be before From date.";
    $("dateWindowHint").className="field-hint error-text";
  }else if(diff>30){
    $("dateWindowHint").textContent=`${diff} days selected. Seaweb searches are limited to 30 days.`;
    $("dateWindowHint").className="field-hint error-text";
  }else{
    $("dateWindowHint").textContent=`${diff} day${diff===1?"":"s"} selected • maximum 30 days.`;
    $("dateWindowHint").className="field-hint";
  }
}
$("searchFrom").addEventListener("change",()=>{
  const from=$("searchFrom").value;
  if(!from)return;
  $("searchTo").min=from;
  $("searchTo").max=addDays(from,30);
  if(!$("searchTo").value || daysBetween(from,$("searchTo").value)<0 || daysBetween(from,$("searchTo").value)>30){
    $("searchTo").value=addDays(from,30);
  }
  updateDateHint();
});
$("searchTo").addEventListener("change",updateDateHint);

function queryParams(){
  const p=new URLSearchParams();
  const from=$("searchFrom").value,to=$("searchTo").value,anchor=currentAnchor(),value=$("searchAnchorValue").value.trim();
  if(from)p.set("from",from);
  if(to)p.set("to",to);
  p.set("criterion",anchor);
  if(value)p.set("value",value);
  if($("searchDuration").value)p.set("duration",$("searchDuration").value);
  return p.toString();
}

$("clearSearchBtn").onclick=()=>{
  $("searchAnchorValue").value="";
  $("searchDuration").value="";
  document.querySelector('input[name="searchAnchor"][value="destination"]').checked=true;
  updateAnchorUI();
  initSearchDates();
};

$("searchSailingsBtn").onclick=async()=>{
  const from=$("searchFrom").value,to=$("searchTo").value,value=$("searchAnchorValue").value.trim();
  if(!from||!to){
    $("searchNotice").className="notice error";
    $("searchNotice").textContent="Enter both a From and To date.";
    return;
  }
  const diff=daysBetween(from,to);
  if(diff<0||diff>30){
    $("searchNotice").className="notice error";
    $("searchNotice").textContent="Seaweb itinerary searches must use a date range of 30 days or less.";
    return;
  }
  if(!value){
    $("searchNotice").className="notice error";
    $("searchNotice").textContent=`Choose a ${currentAnchor()==="departure"?"departure port":currentAnchor()} before searching.`;
    return;
  }

  const btn=$("searchSailingsBtn"); btn.disabled=true; btn.textContent="Searching…";
  $("searchNotice").className="notice info";
  $("searchNotice").textContent=`Searching ${from} through ${to} by ${currentAnchor()==="departure"?"embarkation port":currentAnchor()} only…`;
  $("searchResults").innerHTML="";
  try{
    const r=await fetch(`/api/sailings?${queryParams()}`);
    const data=await r.json();
    if(!r.ok) throw new Error(data.error||"Search failed");
    state.sailings=data.results||[];
    $("searchNotice").className="notice "+(data.live?"success":"warning");
    $("searchNotice").textContent=data.message||`Found ${state.sailings.length} results.`;
    renderSearchResults();
  }catch(e){
    $("searchNotice").className="notice error";
    $("searchNotice").innerHTML=`Live retrieval failed: ${escapeHtml(e.message)}. The scenario generator, validator, and library still work.`;
  }finally{btn.disabled=false;btn.textContent="Search Itineraries"}
};

$("manualImportBtn").onclick=async()=>{
  const url=$("manualUrl").value.trim(); if(!url)return;
  $("searchNotice").className="notice info";$("searchNotice").textContent="Importing the NCL page…";
  try{
    const r=await fetch(`/api/sailings?url=${encodeURIComponent(url)}`), data=await r.json();
    if(!r.ok) throw new Error(data.error||"Import failed");
    state.sailings=data.results||[]; renderSearchResults();
    $("searchNotice").className="notice success";$("searchNotice").textContent=data.message||"Imported.";
  }catch(e){$("searchNotice").className="notice error";$("searchNotice").textContent=e.message}
};

function renderSearchResults(){
  if(!state.sailings.length){$("searchResults").innerHTML=`<div class="panel muted">No matching sailings were found in the retrieved NCL results.</div>`;return}
  $("searchResults").innerHTML=state.sailings.map((s,i)=>`
    <div class="result-card">
      <div class="verified">● Verified from NCL.com</div>
      <h3>${escapeHtml(s.duration ? `${s.duration}-day Cruise on ${s.ship}` : s.ship||"NCL Sailing")}</h3>
      <strong>${escapeHtml(s.title||"")}</strong>
      <div class="meta">
        ${s.departure?`<span class="chip">From ${escapeHtml(s.departure)}</span>`:""}
        ${(s.sailingMonths||[]).map(x=>`<span class="chip">${escapeHtml(x)}</span>`).join("")}
      </div>
      ${s.ports?.length?`<div class="port-list"><strong>Ports:</strong> ${s.ports.map(escapeHtml).join(" • ")}</div>`:""}
      <div class="meta">
        ${s.price?`<span class="price">${escapeHtml(s.price)}</span>`:""}
        ${s.taxes?`<span class="chip">${escapeHtml(s.taxes)}</span>`:""}
        ${(s.offers||[]).map(x=>`<span class="chip">${escapeHtml(x)}</span>`).join("")}
      </div>
      <div class="muted" style="font-size:11px">Retrieved ${new Date(s.retrievedAt||Date.now()).toLocaleString()}</div>
      <div class="actions">
        <button class="primary" onclick="useSailing(${i})">Use in Scenario</button>
        <a class="secondary" href="${escapeAttr(s.sourceUrl)}" target="_blank" rel="noopener" style="text-decoration:none">Open NCL Source</a>
      </div>
    </div>`).join("");
}
window.useSailing=(i)=>{
  state.selectedSailing=state.sailings[i];
  renderSelectedSailing();
  go("generator");
};
function renderSelectedSailing(){
  const s=state.selectedSailing;
  if(!s){$("selectedSailingSummary").className="selected-sailing empty";$("selectedSailingSummary").textContent="No real sailing selected yet.";return}
  $("selectedSailingSummary").className="selected-sailing";
  $("selectedSailingSummary").innerHTML=`<div class="verified">● Verified from NCL.com</div><strong>${escapeHtml(s.ship||"")} • ${escapeHtml(s.title||"")}</strong><br><span class="muted">${escapeHtml((s.sailingMonths||[]).join(", "))}${s.departure?" • From "+escapeHtml(s.departure):""}${s.duration?" • "+s.duration+" days":""}</span>`;
}

function selectedMarketLabel(){
  const opt=$("marketAgency")?.selectedOptions?.[0];
  return opt ? opt.textContent : "";
}

function scenarioData(){
  const meta=currentFocusMeta()||{};
  const cardKey=$("trainingCardProfile")?.value||meta.cardProfile||"standardSesame";
  return {
    id: state.currentScenario?.id || crypto.randomUUID(),
    department:$("department").value,
    trainingDay:+$("trainingDay").value,
    approach:$("scenarioApproach").value,
    title:`${$("department").value} Day ${$("trainingDay").value} – ${$("scenarioType").value}`,
    type:$("scenarioType").value,
    difficulty:$("difficulty").value,
    guestCount:+$("guestCount").value,
    agency:$("agency").value,
    market:$("department").value==="Outbound Sales"?selectedMarketLabel():"Agency 5",
    guest1:$("guest1").value.trim(),guest2:$("guest2").value.trim(),
    category:$("category").value,location:$("locationPref").value,side:$("sidePref").value,
    payment:$("paymentAction").value,pricing:$("pricing").value.trim(),email:$("confirmationEmail").value.trim(),
    latitudes:$("latitudesToggle").checked,commenting:$("commentToggle").checked,confirmation:$("confirmToggle").checked,
    fas:$("fasToggle").checked,travel:$("travelToggle").checked,psc:$("pscToggle").checked,
    trainerNotes:$("trainerNotes").value.trim(),sailing:state.selectedSailing,
    cardRequired:!!meta.cardRequired || paymentActionNeedsCard(),
    cardProfile:cardKey,
    card:(!!meta.cardRequired || paymentActionNeedsCard()) ? trainingCards[cardKey] : null,
    curriculumObjective:meta.objective||"",
    curriculumKind:meta.kind||"",
    createdAt:state.currentScenario?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString(),
    favorite:state.currentScenario?.favorite||false,archived:false
  };
}

function focusConsiderations(d){
  const name=(d.type||"").toLowerCase();
  const items=[
    "Anticipate the steps based on the reason for the call and control the call flow.",
    "Verify all guest names match travel documents exactly and confirm dates of birth before saving.",
    "Confirm the reservation status, gross amount due, and final payment date in Seaweb.",
    "Review the current applicable promo codes in the approved internal sources."
  ];
  if(name.includes("fcc")||name.includes("price programs")) items.push("Why must the booking be in the correct status before applying coupons or discounts?","What is the deadline to add or change applicable Free at Sea selections?");
  if(name.includes("norwegian")) items.push("What is the deadline to add/remove travel protection, and how does final-payment status affect available coverage?");
  if(name.includes("special request")||name.includes("ada")) items.push("Is the request actionable, and should it be entered in Special Requests, Reservation Comments, or both?","Does the itinerary include tender ports or other accessibility considerations?");
  if(name.includes("infant")||name.includes("guests 3-8")||name.includes("singles")) items.push("Does the selected stateroom capacity support the full occupancy?","How do deposit, promotion, and service-charge rules differ for infants, children, solos, or Guests 3–8?");
  if(name.includes("multiple")) items.push("Should the reservations be linked with TWITH?","If one caller pays for another reservation, what Authorized Person guidance and notation are required?");
  if(name.includes("ta booking")||d.curriculumKind==="ta") items.push("What information must the travel agent provide before pricing or creating a reservation?","Where is commission displayed and what servicing restrictions apply to a travel-agent booking?");
  if(name.includes("air")||name.includes("hotel")||name.includes("cruisetour")||name.includes("land pkg")) items.push("Review the applicable air/land terms, deposit requirements, ticketing or confirmation timing, and transfer details.");
  if(name.includes("cancel")||name.includes("reinstate")) items.push("Is the reservation inside or outside final payment?","What refund timeline should be quoted, and what may change when a canceled reservation is reinstated?");
  if(name.includes("amenities")||name.includes("dining")) items.push("Is payment due immediately for the selected add-on?","Which confirmation or amenity invoice must be sent after the transaction?");
  if(name.includes("cruise first")) items.push("What are the CruiseFirst terms and where is the credit purchased/applied?");
  if(name.includes("gty")) items.push("What expectations must be set for a Guarantee category, including stateroom assignment and location?");
  if(d.sailing?.ports?.length) items.push(`Confirm any requested port of call against the selected itinerary: ${d.sailing.ports.join(", ")}.`);
  return [...new Set(items)];
}

function outboundQualificationHtml(){
  return `<h3>Outbound Qualification</h3><ol class="compact-list">
    <li>Are you currently working with a travel agent?</li><li>Have you sailed with Norwegian before?</li>
    <li>Who will be joining you?</li><li>Are you celebrating anything special?</li>
    <li>Which itinerary or destination interests you most?</li><li>When would you like to sail?</li>
    <li>How many days would you like to vacation?</li><li>Which port would you like to cruise from?</li>
    <li>What stateroom experience are you looking for?</li><li>Military or teacher eligibility?</li>
    <li>Any health, mobility, or dietary needs?</li><li>Interest in pre-air/hotel?</li><li>Present travel protection.</li>
  </ol>`;
}

function generateScenario(){
  const d=scenarioData();
  const meta=currentFocusMeta()||{};
  const guestNames=[d.guest1,d.guest2].filter(Boolean);
  const primary=guestNames[0]||"the guest";
  const s=d.sailing;
  const sailText=s ? `${s.duration?`${s.duration}-day `:""}${s.title||"cruise"} on ${s.ship||"Norwegian Cruise Line"}${s.departure?`, departing from ${s.departure}`:""}${s.sailingMonths?.length?` during ${s.sailingMonths.join(" / ")}`:""}` : "a Norwegian Cruise Line sailing selected according to the trainer's instructions";
  const pref=[d.location!=="Any"?d.location.toLowerCase():null,d.side!=="Any"?`on the ${d.side.toLowerCase()} side`:null].filter(Boolean).join(" ");
  const addOns=[];
  if(d.fas)addOns.push("Free at Sea");
  if(d.travel)addOns.push("travel protection");
  if(d.psc)addOns.push("prepaid service charges");
  const pricing = d.pricing ? `<p><strong>Quote Advertised Pricing:</strong> “The current training quote is ${escapeHtml(d.pricing)}. How does that sound?”</p>` :
    `<p><strong>Pricing Task:</strong> Review the current Seaweb pricing with the guest. Do not use a fabricated amount; quote what Seaweb displays at the time of the exercise.</p>`;

  const paymentInstruction={
    "No Payment / Service Only":"Complete the servicing task without collecting a new card payment unless Seaweb shows a newly due amount that is part of the trainer's instructions.",
    "Offer / Hold only":"Place the reservation in Offer/Hold status without collecting payment. Explain the applicable deposit deadline shown in Seaweb.",
    "Minimum Deposit":"Process only the minimum amount due using the training credit card information below.",
    "Initial Deposit":"Process the required initial deposit using the training credit card information below.",
    "Full Payment":"Review the full amount due and process full payment using the training credit card information below.",
    "FCC / CruiseNext":"Use the applicable training FCC/CruiseNext/CruiseFirst credit according to the scenario workflow. Do not substitute a card unless the exercise specifically requires an additional payment.",
    "Amenity Payment":"Process the payment due for the amenity/add-on using the training credit card information below and send the appropriate invoice/confirmation.",
    "Auto Final Payment discussion":"Discuss Auto Final Payment and complete the enrollment steps in the training environment if instructed.",
    "Refund / Reinstate":"Follow the cancellation/refund or reinstatement workflow. Verify the original form of payment and applicable refund timing; do not collect a new card payment unless required by the updated booking."
  }[d.payment]||"Complete the payment/booking action shown in Seaweb.";

  const approachText={
    current:"Use the current department/day training focus and preserve its core workflow.",
    variation:"This is a trainer-generated variation of the current department/day skill. Keep the required workflow while varying guests, sailing, stateroom, or preferences.",
    new:"This is a new practice case built around the same department/day learning objective."
  }[d.approach];

  const cardHtml=d.cardRequired&&d.card?`<h3>Training Credit Card Information</h3>
    <div class="scenario-payment-card"><div class="training-only-label">TRAINING / TEST DATA ONLY</div>
      <p><strong>Card #:</strong> ${escapeHtml(d.card.number)}<br><strong>Expiration:</strong> ${escapeHtml(d.card.expiration)}<br><strong>CCV:</strong> ${escapeHtml(d.card.ccv)}<br><strong>Billing Address:</strong> ${escapeHtml(d.card.address)}</p>
    </div>`:"";

  const extraGuests=d.guestCount>2?Array.from({length:d.guestCount-2},(_,i)=>`<li><strong>Guest ${i+3}:</strong> Create or locate an appropriate training guest profile and verify all required fields.</li>`).join(""):"";
  const customerLead=meta.kind==="demo"?`This is a <strong>trainer-led demonstration</strong>. Use the selected or trainer-provided reservation/sailing to demonstrate the ${escapeHtml(d.type)} workflow.`:
    (meta.kind==="followup"?`<strong>${escapeHtml(primary)}</strong> calls regarding an existing training reservation. ${escapeHtml(d.curriculumObjective)}`:
    `<strong>${escapeHtml(primary)}</strong>${guestNames[1]?` and <strong>${escapeHtml(guestNames[1])}</strong>`:""} are working with you on ${escapeHtml(sailText)}. ${escapeHtml(d.curriculumObjective)}`);

  const html=`
    <div class="scenario-meta-row"><span class="chip">${escapeHtml(d.department)}</span><span class="chip">Day ${d.trainingDay}</span><span class="chip">${escapeHtml(d.difficulty)}</span></div>
    <h2>Seaweb Scenario – ${escapeHtml(d.type)}</h2>
    <p>Please complete the following scenario independently. If you encounter any difficulties, refer to the <strong>Seaweb User Guide</strong> in <strong>NCLHelp</strong> for step-by-step guidance. Once you've completed your booking or servicing task, post the reservation number in the class chat.</p>
    <p class="trainer-section"><strong>Scenario approach:</strong> ${escapeHtml(approachText)}</p>
    <h3>Customer Scenario</h3>
    <p>${customerLead}</p>
    ${d.department==="Outbound Sales" && ["outbound-new","new"].includes(meta.kind)?outboundQualificationHtml():""}
    <p>Review the available options, provide accurate pricing, and confirm all guest details—including legal names exactly as they appear on travel documents and dates of birth—before saving or completing the requested action.</p>
    <h3>Sailing / Reservation Details</h3>
    <ul>
      <li><strong>Department:</strong> ${escapeHtml(d.department)}</li>
      <li><strong>Training Day:</strong> Day ${d.trainingDay}</li>
      <li><strong>Agency:</strong> ${escapeHtml(d.agency)}${d.department==="Outbound Sales"?` — ${escapeHtml(d.market)}`:""}</li>
      ${s?`<li><strong>Ship:</strong> ${escapeHtml(s.ship||"Verify")}</li><li><strong>Itinerary:</strong> ${escapeHtml(s.title||"Verify")}</li><li><strong>Sailing:</strong> ${escapeHtml((s.sailingMonths||[]).join(", ")||"Verify exact date in Seaweb")}</li><li><strong>Departure:</strong> ${escapeHtml(s.departure||"Verify")}</li><li><strong>Duration:</strong> ${escapeHtml(String(s.duration||"Verify"))}${s.duration?" days":""}</li>`:`<li><strong>Real Sailing:</strong> Not selected — trainer must provide/verify sailing details.</li>`}
      <li><strong>Total Guests:</strong> ${d.guestCount}</li>
    </ul>
    <h3>Category & Stateroom</h3><p>${escapeHtml(d.category)}, ${escapeHtml(d.location)} location, ${escapeHtml(d.side)} side preference. Review actual available staterooms in Seaweb before selecting.</p>
    ${pricing}
    <h3>Guest Information</h3><ul>${guestNames.map((g,i)=>`<li><strong>Guest ${i+1}:</strong> ${escapeHtml(g)}${d.latitudes?" — locate/verify the training Latitudes profile in Seaweb":""}</li>`).join("")}${extraGuests}</ul>
    <h3>Payment / Booking Action</h3><p>${escapeHtml(paymentInstruction)}</p>
    ${cardHtml}
    ${addOns.length?`<h3>Additional Components</h3><p>Include or discuss: ${escapeHtml(addOns.join(", "))}.</p>`:""}
    <h3>Required Actions</h3><ul>${d.confirmation?`<li>Send the appropriate guest/agency confirmation to <strong>${escapeHtml(d.email||"training123@ncl.com")}</strong>.</li>`:""}${d.commenting?`<li>Recap and add appropriate reservation notes using the <strong>Commenting Tool</strong>.</li>`:""}<li>Recap the reservation or changes and confirm the guest understands the next required action.</li></ul>
    <h3>Branded Closing</h3><p>Before ending the call, ensure customer satisfaction and use the appropriate Norwegian Cruise Line branded closing. When addressing the primary guest by name: <strong>“Is there anything else I can help you with today, ${escapeHtml(primary.split(" ")[0]||"")}?”</strong> followed by <strong>“Thank you for choosing Norwegian Cruise Line.”</strong></p>
    <div class="trainer-section"><h3>Curriculum Objective</h3><p>${escapeHtml(d.curriculumObjective)}</p><h3>Things to Consider</h3><ul>${focusConsiderations(d).map(x=>`<li>${escapeHtml(x)}</li>`).join("")}</ul>${d.trainerNotes?`<h3>Trainer Notes</h3><p>${escapeHtml(d.trainerNotes)}</p>`:""}${s?`<h3>Public Source Metadata</h3><p><span class="verified">Verified from NCL.com</span><br>${escapeHtml(s.sourceUrl||"")}<br>Retrieved ${new Date(s.retrievedAt||Date.now()).toLocaleString()}</p>`:""}</div>`;

  $("scenarioOutput").innerHTML=html;
  d.html=html;
  state.currentScenario=d;
  runValidator();
  $("scenarioStatus").textContent=blockingErrors()?"Needs Review":"Ready for Trainee";
  $("scenarioStatus").className="status-badge "+(blockingErrors()?"review":"ready");
}
$("generateBtn").onclick=generateScenario;

function runValidator(){
  const d=state.currentScenario||scenarioData(), s=d.sailing, checks=[];
  const add=(severity,title,detail)=>checks.push({severity,title,detail});
  const meta=currentFocusMeta()||{};

  if(!d.department)add("error","Department missing","Choose Guest Services or Outbound Sales.");
  else add("passed","Department selected",`${d.department} • Day ${d.trainingDay} • ${d.type}`);
  if(!d.guest1 && meta.kind!=="demo")add("error","Missing primary guest","Guest 1 is required for trainee scenarios.");
  else if(d.guest1)add("passed","Primary guest present",d.guest1);
  if(d.guestCount>1 && !d.guest2 && meta.kind!=="demo")add("warning","Guest 2 is blank","The scenario has multiple guests selected. Guest 2 should normally be named or intentionally created by the trainee.");

  if(d.department==="Guest Services"){
    if(String(d.agency)!=="5")add("error","Guest Services agency mismatch","Current Guest Services scenarios use Agency 5.");
    else add("passed","Guest Services agency","Agency 5 is selected.");
  }else if(d.department==="Outbound Sales"){
    if(!d.agency)add("error","Outbound agency missing","Choose the market/currency agency before assigning the scenario.");
    else add("passed","Outbound market agency selected",`${d.market}`);
  }

  if(s){
    add("passed","Real sailing selected",`${s.ship||"NCL ship"} • ${s.title||"NCL itinerary"}`);
    if(s.duration) add("passed","Duration sourced from NCL",`${s.duration} days`);
    if(s.ports?.length)add("passed","Ports of call available",`${s.ports.length} public-source port entries loaded.`);
    else add("warning","Ports need verification","Public result did not expose a usable port list. Verify the itinerary in Seaweb/NCL.com before class.");
    if(s.ports?.length) add("info","Port-of-call review available","Confirm any scenario-specific port requirement after selecting the sailing rather than over-filtering the initial search.");
  }else add("warning","No real sailing attached","Trainer must verify ship, itinerary and dates manually.");

  if(d.pricing)add("info","Trainer-entered pricing","Pricing is not being treated as verified public data. Reconfirm in Seaweb before class.");
  else add("passed","No fabricated pricing","The scenario instructs the trainee to quote the current Seaweb price.");

  if(d.category==="Random")add("info","Random category","Trainer should confirm the assigned category before releasing the scenario.");
  else add("passed","Category instruction is explicit",d.category);

  if(d.cardRequired){
    if(!d.card)add("error","Training credit card missing","This scenario requires a card payment, but no training card profile is attached.");
    else add("passed","Training credit card included",`${d.card.label} • TRAINING / TEST DATA ONLY`);
    if(meta.cardRequired && ["No Payment / Service Only","Offer / Hold only","FCC / CruiseNext","Refund / Reinstate"].includes(d.payment)) add("warning","Payment action may conflict with curriculum","The selected training focus is tagged as requiring a card payment, but the current payment action may not collect one.");
    if(!meta.cardRequired && paymentActionNeedsCard()) add("info","Trainer-added card payment","This variation adds a card payment even though the source curriculum focus does not require one by default.");
  }else add("passed","Payment method aligned","No training credit card is required for this focus by default.");

  if((d.type.includes("FCC")||d.type.includes("Price Programs")) && d.payment!=="FCC / CruiseNext" && !d.type.includes("Price Programs")) add("warning","FCC workflow review","Confirm the selected payment action preserves the offer-first coupon/FCC workflow.");
  if(d.confirmation && !d.email)add("error","Confirmation email missing","Confirmation is required but no training email is entered.");
  else if(d.confirmation)add("passed","Confirmation task included",d.email);
  if(meta.commenting && !d.commenting)add("warning","Commenting Tool expected","The current curriculum focus includes reservation notation/comments.");

  if(d.html){
    if(d.html.includes("Thank you for choosing Norwegian Cruise Line."))add("passed","Branded closing present","Required NCL closing is included.");
    else add("warning","Branded closing missing","Add the appropriate NCL branded closing.");
    if(/Category & Category/i.test(d.html))add("warning","Repeated heading detected","Review duplicated wording in the scenario.");
  }
  add("info","Cabin-specific attributes need Seaweb verification","Capacity, exact square footage, minibar, exact inventory, policy deadlines, and internal promo codes are not inferred from public NCL search data.");
  state.validation=checks;
  renderValidator();
  return checks;
}
$("runValidatorBtn").onclick=()=>{runValidator();go("validator")};
function blockingErrors(){return state.validation.some(c=>c.severity==="error")}
function renderValidator(){
  const errors=state.validation.filter(x=>x.severity==="error").length;
  const warnings=state.validation.filter(x=>x.severity==="warning").length;
  $("validatorSummary").innerHTML=state.validation.length?`<div class="notice ${errors?"error":warnings?"warning":"success"}"><strong>${errors?`${errors} blocking error${errors>1?"s":""}`:warnings?`${warnings} warning${warnings>1?"s":""}`:"Scenario ready for trainee"}</strong>${errors?" — resolve errors before assigning.":warnings?" — review recommended.":" — no blocking errors detected."}</div>`:"";
  $("validatorResults").innerHTML=state.validation.map(c=>`<div class="validation-item ${c.severity}"><strong>${c.severity.toUpperCase()} • ${escapeHtml(c.title)}</strong><span>${escapeHtml(c.detail)}</span></div>`).join("");
}

$("copyScenarioBtn").onclick=async()=>{
  await navigator.clipboard.writeText($("scenarioOutput").innerText);
  flash("Scenario copied to clipboard.");
};
$("printScenarioBtn").onclick=()=>window.print();

function saved(){try{return JSON.parse(localStorage.getItem("seawebScenarios")||"[]")}catch{return[]}}
function setSaved(items){localStorage.setItem("seawebScenarios",JSON.stringify(items));updateStats()}
$("saveScenarioBtn").onclick=()=>{
  if(!state.currentScenario)generateScenario();
  state.currentScenario.validationStatus=blockingErrors()?"Needs Review":"Ready";
  const items=saved(), idx=items.findIndex(x=>x.id===state.currentScenario.id);
  if(idx>=0)items[idx]=state.currentScenario; else items.unshift(state.currentScenario);
  setSaved(items);flash("Scenario saved to this browser.");
};
function updateStats(){
  const items=saved().filter(x=>!x.archived);
  $("savedCount").textContent=items.length;
  $("readyCount").textContent=items.filter(x=>x.validationStatus==="Ready").length;
  $("reviewCount").textContent=items.filter(x=>x.validationStatus!=="Ready").length;
  $("favoriteCount").textContent=items.filter(x=>x.favorite).length;
}
function renderLibrary(){
  const q=$("librarySearch").value.toLowerCase().trim();
  const deptFilter=$("libraryDepartmentFilter").value;
  const dayFilter=$("libraryDayFilter").value;
  let items=saved().filter(x=>{
    if(deptFilter && x.department!==deptFilter)return false;
    if(dayFilter && String(x.trainingDay)!==String(dayFilter))return false;
    return !q||JSON.stringify([x.title,x.type,x.department,x.trainingDay,x.difficulty,x.sailing?.ship,x.sailing?.title]).toLowerCase().includes(q);
  });
  $("libraryList").innerHTML=items.length?items.map(x=>`
    <div class="result-card ${x.archived?"archived":""}">
      <div style="display:flex;justify-content:space-between;gap:12px">
        <div>
          <div class="meta"><span class="chip">${escapeHtml(x.department||"Legacy")}</span>${x.trainingDay?`<span class="chip">Day ${escapeHtml(String(x.trainingDay))}</span>`:""}<span class="chip">${escapeHtml(x.type)}</span><span class="chip">${escapeHtml(x.difficulty)}</span><span class="status-badge ${x.validationStatus==="Ready"?"ready":"review"}">${escapeHtml(x.validationStatus||"Draft")}</span></div>
          <h3>${escapeHtml(x.title)}</h3>
          <div class="muted">${escapeHtml(x.sailing?.ship||"No real sailing")} ${x.sailing?.title?"• "+escapeHtml(x.sailing.title):""}</div>
          <div class="muted" style="font-size:11px;margin-top:6px">Updated ${new Date(x.updatedAt).toLocaleString()}</div>
        </div>
        <button class="star" onclick="toggleFavorite('${x.id}')" title="Favorite">${x.favorite?"★":"☆"}</button>
      </div>
      <div class="library-actions actions">
        <button class="secondary" onclick="openSaved('${x.id}')">Open</button>
        <button class="secondary" onclick="duplicateSaved('${x.id}')">Duplicate</button>
        <button class="secondary" onclick="archiveSaved('${x.id}')">${x.archived?"Unarchive":"Archive"}</button>
        <button class="secondary" onclick="deleteSaved('${x.id}')">Delete</button>
      </div>
    </div>`).join(""):`<div class="panel muted">No saved scenarios match your filters.</div>`;
}
$("librarySearch").oninput=renderLibrary;
$("libraryDepartmentFilter").onchange=renderLibrary;
$("libraryDayFilter").onchange=renderLibrary;
window.toggleFavorite=(id)=>{const a=saved();const x=a.find(v=>v.id===id);if(x)x.favorite=!x.favorite;setSaved(a);renderLibrary()};
window.archiveSaved=(id)=>{const a=saved();const x=a.find(v=>v.id===id);if(x)x.archived=!x.archived;setSaved(a);renderLibrary()};
window.deleteSaved=(id)=>{if(!confirm("Delete this saved scenario?"))return;setSaved(saved().filter(x=>x.id!==id));renderLibrary()};
window.duplicateSaved=(id)=>{const a=saved();const x=a.find(v=>v.id===id);if(!x)return;const copy={...x,id:crypto.randomUUID(),title:x.title+" (Copy)",createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};a.unshift(copy);setSaved(a);renderLibrary()};
window.openSaved=(id)=>{
  const x=saved().find(v=>v.id===id);if(!x)return;
  state.currentScenario=x;state.selectedSailing=x.sailing||null;
  $("department").value=x.department||"Guest Services";
  $("trainingDay").value=String(x.trainingDay||6);
  if($("department").value==="Outbound Sales" && x.agency) $("marketAgency").value=String(x.agency);
  updateDepartmentUI();
  updateScenarioFocus(x.type);
  $("scenarioApproach").value=x.approach||"variation";
  $("difficulty").value=x.difficulty||"Intermediate";
  $("guestCount").value=String(x.guestCount||2);
  $("agency").value=x.agency||($("department").value==="Guest Services"?"5":$("marketAgency").value);
  $("guest1").value=x.guest1||"";$("guest2").value=x.guest2||"";
  if([...$("category").options].some(o=>o.value===x.category)) $("category").value=x.category;
  if([...$("locationPref").options].some(o=>o.value===x.location)) $("locationPref").value=x.location;
  if([...$("sidePref").options].some(o=>o.value===x.side)) $("sidePref").value=x.side;
  if([...$("paymentAction").options].some(o=>o.value===x.payment)) $("paymentAction").value=x.payment;
  $("pricing").value=x.pricing||"";$("confirmationEmail").value=x.email||"training123@ncl.com";
  $("latitudesToggle").checked=!!x.latitudes;$("commentToggle").checked=!!x.commenting;$("confirmToggle").checked=x.confirmation!==false;
  $("fasToggle").checked=!!x.fas;$("travelToggle").checked=!!x.travel;$("pscToggle").checked=!!x.psc;$("trainerNotes").value=x.trainerNotes||"";
  if(x.cardProfile && trainingCards[x.cardProfile]){$("trainingCardProfile").value=x.cardProfile;renderTrainingCard();}
  renderSelectedSailing();$("scenarioOutput").innerHTML=x.html||"";runValidator();go("generator");
};
$("exportBtn").onclick=()=>{
  const blob=new Blob([JSON.stringify({version:1,exportedAt:new Date().toISOString(),scenarios:saved()},null,2)],{type:"application/json"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`seaweb-scenarios-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(a.href);
};
$("importFile").onchange=async(e)=>{
  const f=e.target.files[0];if(!f)return;
  try{const data=JSON.parse(await f.text()),incoming=Array.isArray(data)?data:data.scenarios;if(!Array.isArray(incoming))throw Error("No scenarios found in backup.");
    const map=new Map(saved().map(x=>[x.id,x]));incoming.forEach(x=>map.set(x.id||crypto.randomUUID(),x));setSaved([...map.values()]);renderLibrary();flash(`Imported ${incoming.length} scenario(s).`);
  }catch(err){alert("Import failed: "+err.message)}
};

function flash(msg){const n=document.createElement("div");n.className="notice success";n.style.cssText="position:fixed;right:20px;bottom:20px;z-index:50;box-shadow:0 8px 30px rgba(0,0,0,.15)";n.textContent=msg;document.body.appendChild(n);setTimeout(()=>n.remove(),2200)}
function escapeHtml(v=""){return String(v).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]))}
function escapeAttr(v=""){return escapeHtml(v).replace(/`/g,"&#96;")}

populateMarketAgencies();populateTrainingCards();updateDepartmentUI();renderStarters();renderSelectedSailing();updateStats();initSearchDates();updateAnchorUI();
