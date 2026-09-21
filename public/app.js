const $ = (id) => document.getElementById(id);
const state = {
  mode: "trainer",
  selectedSailing: null,
  currentScenario: null,
  validation: [],
  sailings: []
};

const starters = [
  {type:"Basic Reservation",difficulty:"Beginner",desc:"New reservation, category/location preference, hold/offer and confirmation."},
  {type:"Payments",difficulty:"Intermediate",desc:"New booking, minimum deposit, payment questions and final-payment discussion."},
  {type:"FCC / CruiseNext & Coupons",difficulty:"Advanced",desc:"Offer first, coupon/FCC workflow, revised pricing and Commenting Tool."},
  {type:"Special Request",difficulty:"Intermediate",desc:"Follow-up servicing call with GDPR verification, requests and reservation notes."}
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

function renderStarters(){
  $("starterTemplates").innerHTML=starters.map((s,i)=>`
    <div class="template-card">
      <span class="chip">${s.difficulty}</span>
      <h4>${s.type}</h4><p>${s.desc}</p>
      <button class="secondary" onclick="loadStarter(${i})">Use Template</button>
    </div>`).join("");
}
window.loadStarter=(i)=>{
  $("scenarioType").value=starters[i].type;
  $("difficulty").value=starters[i].difficulty;
  if(starters[i].type.includes("FCC")){$("paymentAction").value="FCC / CruiseNext";$("commentToggle").checked=true;}
  if(starters[i].type==="Payments")$("paymentAction").value="Minimum Deposit";
  if(starters[i].type==="Special Request")$("commentToggle").checked=true;
  go("generator");
};

$("generateNamesBtn").onclick=()=>{
  const pair=namePairs[Math.floor(Math.random()*namePairs.length)];
  $("guest1").value=pair[0]; $("guest2").value=pair[1];
};

function queryParams(){
  const p = new URLSearchParams();
  [["destination","searchDestination"],["ship","searchShip"],["departure","searchDeparture"],["port","searchPort"],["month","searchMonth"],["duration","searchDuration"]]
    .forEach(([k,id])=>{if($(id).value.trim())p.set(k,$(id).value.trim())});
  return p.toString();
}

$("clearSearchBtn").onclick=()=>["searchDestination","searchShip","searchDeparture","searchPort","searchMonth","searchDuration"].forEach(id=>$(id).value="");

$("searchSailingsBtn").onclick=async()=>{
  const btn=$("searchSailingsBtn"); btn.disabled=true; btn.textContent="Searching…";
  $("searchNotice").className="notice info"; $("searchNotice").textContent="Retrieving public sailing data from NCL.com…";
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
    $("searchNotice").innerHTML=`Live retrieval failed: ${escapeHtml(e.message)}. The rest of the generator still works. Use the manual NCL URL fallback or open <a href="https://www.ncl.com/vacations" target="_blank" rel="noopener">NCL Vacations</a>.`;
  }finally{btn.disabled=false;btn.textContent="Search NCL.com"}
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

function scenarioData(){
  return {
    id: state.currentScenario?.id || crypto.randomUUID(),
    title: `${$("scenarioType").value} – ${state.selectedSailing?.ship||$("guest1").value}`,
    type:$("scenarioType").value,difficulty:$("difficulty").value,guestCount:+$("guestCount").value,
    agency:$("agency").value,guest1:$("guest1").value.trim(),guest2:$("guest2").value.trim(),
    category:$("category").value,location:$("locationPref").value,side:$("sidePref").value,
    payment:$("paymentAction").value,pricing:$("pricing").value.trim(),email:$("confirmationEmail").value.trim(),
    latitudes:$("latitudesToggle").checked,commenting:$("commentToggle").checked,confirmation:$("confirmToggle").checked,
    fas:$("fasToggle").checked,travel:$("travelToggle").checked,psc:$("pscToggle").checked,
    trainerNotes:$("trainerNotes").value.trim(),sailing:state.selectedSailing,
    createdAt:state.currentScenario?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString(),
    favorite:state.currentScenario?.favorite||false,archived:false
  };
}

function generateScenario(){
  const d=scenarioData();
  const guestNames=[d.guest1,d.guest2].filter(Boolean).slice(0,d.guestCount);
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
  const ports=s?.ports?.length?s.ports.join(", "):"Verify the itinerary in Seaweb / NCL source.";
  const considerations=[
    "What are the Initial Date and Effective Date, and what does each represent?",
    "Is the reservation in Offer or Booked status?",
    "What is the first deposit date / minimum amount due for this reservation?",
    "What are the current applicable promo codes, and where can they be viewed?",
    "What is the Gross Amount Due and Final Payment Date?",
    "What is the last date the guest may cancel without penalty?",
    "Verify the selected stateroom's square footage and capacity in Seaweb.",
    "If another guest joins, does the selected stateroom capacity allow it?"
  ];
  if(d.payment.includes("Auto")) considerations.push("Where is Auto Final Payment enrolled, and may a different card be used?");
  if(d.fas) considerations.push("What is the deadline to add the applicable Free at Sea promotion?");
  if(d.travel) considerations.push("What is the deadline to add travel protection?");
  if(s?.ports?.length) considerations.push(`Confirm that the itinerary includes the requested ports. Public source ports: ${ports}.`);

  const paymentInstruction={
    "Offer / Hold only":"Place the reservation in Offer/Hold status without collecting payment. Explain the applicable deposit deadline shown in Seaweb.",
    "Minimum Deposit":"Process only the minimum amount due using approved TRAINING / TEST payment data supplied by the trainer.",
    "Full Payment":"Review the full amount due and process the approved TRAINING / TEST payment amount supplied by the trainer.",
    "FCC / CruiseNext":"Place the booking in the required status, then apply the eligible FCC/CruiseNext and any training coupons according to the Seaweb workflow.",
    "Auto Final Payment discussion":"Discuss Auto Final Payment and complete the enrollment steps in the training environment if instructed."
  }[d.payment];

  const extra = d.commenting ? " Add reservation notes using the Commenting Tool." : "";
  const addonsText = addOns.length ? ` During the interaction, address ${addOns.join(", ")} as part of the exercise.` : " The guests are not requesting additional add-ons unless instructed by the trainer.";

  const html=`
    <h2>Seaweb Scenario – ${escapeHtml(d.type)}</h2>
    <p>Please complete the following scenario independently. If you encounter any difficulties, refer to the <strong>Seaweb User Guide</strong> in <strong>NCLHelp</strong> for step-by-step guidance. Once you've completed your booking, post your reservation number in the class chat.</p>
    <h3>Customer Scenario</h3>
    <p><strong>${escapeHtml(primary)}</strong>${guestNames[1]?` and <strong>${escapeHtml(guestNames[1])}</strong>`:""} call to plan ${escapeHtml(sailText)}. They request a <strong>${escapeHtml(d.category)}</strong> stateroom${pref?` <strong>${escapeHtml(pref)}</strong>`:""}, if available.${addonsText}</p>
    <p>Create or service the reservation according to the guest's preferences. Review available options, provide accurate pricing, and confirm all guest details—including legal names exactly as they appear on travel documents and dates of birth—before completing the requested action.</p>
    <h3>Sailing Details</h3>
    <ul>
      <li><strong>Agency:</strong> ${escapeHtml(d.agency)}</li>
      ${s?`<li><strong>Ship:</strong> ${escapeHtml(s.ship||"Verify")}</li>
      <li><strong>Itinerary:</strong> ${escapeHtml(s.title||"Verify")}</li>
      <li><strong>Sailing:</strong> ${escapeHtml((s.sailingMonths||[]).join(", ")||"Verify exact date in Seaweb")}</li>
      <li><strong>Departure:</strong> ${escapeHtml(s.departure||"Verify")}</li>
      <li><strong>Duration:</strong> ${escapeHtml(String(s.duration||"Verify"))}${s.duration?" days":""}</li>`:`<li><strong>Real Sailing:</strong> Not selected — trainer must provide/verify sailing details.</li>`}
      <li><strong>Guests:</strong> ${d.guestCount}</li>
    </ul>
    <h3>Category & Stateroom</h3>
    <p>${escapeHtml(d.category)}, ${escapeHtml(d.location)} location, ${escapeHtml(d.side)} side preference. Review actual available staterooms in Seaweb before selecting.</p>
    ${pricing}
    <h3>Guest Information</h3>
    <ul>${guestNames.map((g,i)=>`<li><strong>Guest ${i+1}:</strong> ${escapeHtml(g)}${d.latitudes?" — locate/verify training Latitudes profile in Seaweb":""}</li>`).join("")}</ul>
    <h3>Payment / Booking Action</h3><p>${escapeHtml(paymentInstruction)}</p>
    <h3>Required Actions</h3>
    <ul>
      ${d.confirmation?`<li>Send the guest confirmation to <strong>${escapeHtml(d.email||"training123@ncl.com")}</strong>.</li>`:""}
      ${d.commenting?`<li>Recap the reservation and add appropriate reservation notes using the <strong>Commenting Tool</strong>.</li>`:""}
      <li>Recap the reservation and confirm the guest understands the next required action.</li>
    </ul>
    <h3>Branded Closing</h3>
    <p>Before ending the call, ensure customer satisfaction by asking, <strong>“Is there anything else I can help you with today, ${escapeHtml(primary.split(" ")[0]||"") }?”</strong> followed by <strong>“Thank you for choosing Norwegian Cruise Line.”</strong></p>
    <div class="trainer-section">
      <h3>Things to Consider</h3>
      <ul>${considerations.map(x=>`<li>${escapeHtml(x)}</li>`).join("")}</ul>
      ${d.trainerNotes?`<h3>Trainer Notes</h3><p>${escapeHtml(d.trainerNotes)}</p>`:""}
      ${s?`<h3>Public Source Metadata</h3><p><span class="verified">Verified from NCL.com</span><br>${escapeHtml(s.sourceUrl||"")}<br>Retrieved ${new Date(s.retrievedAt||Date.now()).toLocaleString()}</p>`:""}
    </div>`;
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
  if(!d.guest1)add("error","Missing primary guest","Guest 1 is required.");
  else add("passed","Primary guest present",d.guest1);
  if(d.guestCount>1 && !d.guest2)add("error","Guest count mismatch","Two or more guests selected, but Guest 2 is blank.");
  if(s){
    add("passed","Real sailing selected",`${s.ship||"NCL ship"} • ${s.title||"NCL itinerary"}`);
    if(s.duration) add("passed","Duration sourced from NCL",`${s.duration} days`);
    if(s.ports?.length)add("passed","Ports of call available",`${s.ports.length} public-source port entries loaded.`);
    else add("warning","Ports need verification","Public result did not expose a usable port list.");
    if($("searchPort").value && s.ports?.length){
      const wanted=$("searchPort").value.toLowerCase();
      const found=s.ports.some(p=>p.toLowerCase().includes(wanted));
      add(found?"passed":"error",found?"Required port is on itinerary":"Required port mismatch",found?`${$("searchPort").value} appears in the public itinerary.`:`${$("searchPort").value} does not appear in the selected public itinerary.`);
    }
  }else add("warning","No real sailing attached","Trainer must verify ship, itinerary and dates manually.");
  if(d.pricing)add("info","Trainer-entered pricing","Pricing is not being treated as verified public data. Reconfirm in Seaweb before class.");
  else add("passed","No fabricated pricing","The scenario instructs the trainee to quote the current Seaweb price.");
  if(d.category==="Random")add("info","Random category","Trainer should confirm the generated/assigned category before releasing.");
  else add("passed","Category instruction is explicit",d.category);
  if(d.payment==="Offer / Hold only" && d.type==="Payments")add("warning","Scenario type / action mismatch","Payments scenario is set to Offer/Hold only.");
  if(d.type==="FCC / CruiseNext & Coupons" && d.payment!=="FCC / CruiseNext")add("error","FCC workflow mismatch","FCC / CruiseNext scenario should use the FCC / CruiseNext payment action.");
  if(d.confirmation && !d.email)add("error","Confirmation email missing","Confirmation is required but no training email is entered.");
  else if(d.confirmation)add("passed","Confirmation task included",d.email);
  if(d.html){
    if(d.html.includes("Thank you for choosing Norwegian Cruise Line."))add("passed","Branded closing present","Required NCL closing is included.");
    else add("error","Branded closing missing","Add the NCL branded closing.");
    if(/Category & Category/i.test(d.html))add("warning","Repeated heading detected","Review duplicated wording in the scenario.");
  }
  add("info","Cabin-specific attributes need Seaweb verification","Capacity, exact square footage, minibar and exact inventory are not inferred from NCL public search data.");
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
  let items=saved().filter(x=>!q||JSON.stringify([x.title,x.type,x.difficulty,x.sailing?.ship,x.sailing?.title]).toLowerCase().includes(q));
  $("libraryList").innerHTML=items.length?items.map(x=>`
    <div class="result-card ${x.archived?"archived":""}">
      <div style="display:flex;justify-content:space-between;gap:12px">
        <div>
          <div class="meta"><span class="chip">${escapeHtml(x.type)}</span><span class="chip">${escapeHtml(x.difficulty)}</span><span class="status-badge ${x.validationStatus==="Ready"?"ready":"review"}">${escapeHtml(x.validationStatus||"Draft")}</span></div>
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
    </div>`).join(""):`<div class="panel muted">No saved scenarios match your search.</div>`;
}
$("librarySearch").oninput=renderLibrary;
window.toggleFavorite=(id)=>{const a=saved();const x=a.find(v=>v.id===id);if(x)x.favorite=!x.favorite;setSaved(a);renderLibrary()};
window.archiveSaved=(id)=>{const a=saved();const x=a.find(v=>v.id===id);if(x)x.archived=!x.archived;setSaved(a);renderLibrary()};
window.deleteSaved=(id)=>{if(!confirm("Delete this saved scenario?"))return;setSaved(saved().filter(x=>x.id!==id));renderLibrary()};
window.duplicateSaved=(id)=>{const a=saved();const x=a.find(v=>v.id===id);if(!x)return;const copy={...x,id:crypto.randomUUID(),title:x.title+" (Copy)",createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};a.unshift(copy);setSaved(a);renderLibrary()};
window.openSaved=(id)=>{
  const x=saved().find(v=>v.id===id);if(!x)return;
  state.currentScenario=x;state.selectedSailing=x.sailing||null;
  $("scenarioType").value=x.type;$("difficulty").value=x.difficulty;$("guestCount").value=x.guestCount;$("agency").value=x.agency;
  $("guest1").value=x.guest1||"";$("guest2").value=x.guest2||"";$("category").value=x.category;$("locationPref").value=x.location;$("sidePref").value=x.side;
  $("paymentAction").value=x.payment;$("pricing").value=x.pricing||"";$("confirmationEmail").value=x.email||"";
  $("latitudesToggle").checked=!!x.latitudes;$("commentToggle").checked=!!x.commenting;$("confirmToggle").checked=!!x.confirmation;
  $("fasToggle").checked=!!x.fas;$("travelToggle").checked=!!x.travel;$("pscToggle").checked=!!x.psc;$("trainerNotes").value=x.trainerNotes||"";
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

renderStarters();renderSelectedSailing();updateStats();
