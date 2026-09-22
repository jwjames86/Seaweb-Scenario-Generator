const $ = (id) => document.getElementById(id);
const state = {
  mode: "trainer",
  selectedSailing: null,
  currentScenario: null,
  validation: [],
  sailings: []
};

window.addEventListener("error",(event)=>{
  const notice=document.getElementById("searchNotice");
  if(!notice)return;
  const onSearchPage=document.getElementById("search")?.classList.contains("active");
  if(onSearchPage){
    notice.className="notice error";
    notice.textContent=`Search tool error: ${event.message || "A browser script error occurred."}`;
  }
});

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
  {department:"Guest Services",day:6,focus:"Basic Reservation",difficulty:"Beginner",desc:"Guest Services basic reservation and hold/offer workflow."},
  {department:"Guest Services",day:7,focus:"Applying FCC",difficulty:"Intermediate",desc:"Guest Services offer-first FCC/CruiseNext and coupon workflow."},
  {department:"Outbound Sales",day:6,focus:"Basic Reservation",difficulty:"Beginner",desc:"Outbound qualifying, new reservation, and initial deposit."},
  {department:"Outbound Sales",day:10,focus:"Dining, Ent & Spa",difficulty:"Advanced",desc:"Outbound follow-up servicing, paid add-ons, and dining."}
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
  const selected=$("scenarioType")?.selectedOptions?.[0];
  const day=selected?.dataset?.day||$("trainingDay")?.value||"6";
  if($("trainingDay")) $("trainingDay").value=String(day);
  return (scenarioCatalog[dept]?.[day]||[]).find(x=>x.name===$("scenarioType")?.value) || null;
}

function populateMarketAgencies(){
  $("marketAgency").innerHTML=marketAgencies.map(([label,value])=>`<option value="${escapeAttr(value)}" data-market="${escapeAttr(label)}">${escapeHtml(label)}</option>`).join("");
}

function populateTrainingCards(){
  $("trainingCardProfile").innerHTML=Object.entries(trainingCards).map(([key,c])=>`<option value="${key}">${escapeHtml(c.label)}</option>`).join("");
}

function renderTrainingCard(){
  const c=trainingCards[$("trainingCardProfile").value]||trainingCards.standardSesame;
  $("trainingCardNumber").value=c.number||"";
  $("trainingCardExpiration").value=c.expiration||"";
  $("trainingCardCcv").value=c.ccv||"";
  $("trainingCardAddress").value=c.address||"";
}

function currentTrainingCard(){
  return {
    label:trainingCards[$("trainingCardProfile").value]?.label||"Custom Training Card",
    number:$("trainingCardNumber")?.value.trim()||"",
    expiration:$("trainingCardExpiration")?.value.trim()||"",
    ccv:$("trainingCardCcv")?.value.trim()||"",
    address:$("trainingCardAddress")?.value.trim()||""
  };
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
  updateGdprPreview();
}

function updateScenarioFocus(preferred,preferredDay){
  const dept=$("department").value;
  const days=Object.keys(scenarioCatalog[dept]||{}).map(Number).sort((a,b)=>a-b);
  const all=days.flatMap(day=>(scenarioCatalog[dept]?.[day]||[]).map(item=>({day,item})));
  $("scenarioType").innerHTML=all.map(({day,item})=>`<option value="${escapeAttr(item.name)}" data-day="${day}">${escapeHtml(item.name)}</option>`).join("");

  const options=[...$("scenarioType").options];
  const match=preferred
    ? options.find(o=>o.value===preferred && (!preferredDay || o.dataset.day===String(preferredDay)))
      || options.find(o=>o.value===preferred)
    : options[0];

  if(match) match.selected=true;
  syncScenarioFocusSelection();
}

function syncScenarioFocusSelection(){
  const selected=$("scenarioType")?.selectedOptions?.[0];
  if(selected?.dataset?.day) $("trainingDay").value=String(selected.dataset.day);
  applyFocusDefaults();
}

const modificationLabels={
  special_request:"Add / Update Special Request",
  shore_excursion:"Add / Change Shore Excursion",
  stateroom:"Change / Upgrade Stateroom",
  add_guest:"Add Guest",
  remove_guest:"Remove Guest",
  fas:"Add / Remove Free at Sea",
  travel_protection:"Add / Remove Travel Protection",
  psc:"Add Prepaid Service Charges",
  payment:"Make / Update Payment",
  credit_coupon:"Apply FCC / CruiseNext / Coupon",
  air_transfer:"Add / Change Air or Transfers",
  hotel_cruisetour:"Add / Change Hotel or Cruisetour",
  cancel_reinstate:"Cancel / Reinstate Reservation",
  general:"General Reservation Update"
};

const gdprProfiles={
  direct_guest:{
    label:"Direct Guest",
    alwaysMandatory:["Reservation Number"],
    askFirst:["Reservation Number","Guest Full Name","Ship & Full Sail Date"],
    fallback:["Date of Birth","First Line of Address"],
    instruction:"Ask the primary verification items first. Reservation Number is always mandatory. If one of the other primary items cannot be obtained, use the fallback questions until 3 verification pieces are obtained in total."
  },
  travel_agent:{
    label:"Travel Agent",
    alwaysMandatory:["Reservation Number","ABTA # / Agency ID / Phone #"],
    askFirst:["Reservation Number","ABTA # or Agency ID or Phone #","Guest Full Name","Ship & Full Sail Date"],
    fallback:["Date of Birth","First Line of Address"],
    instruction:"Ask all primary items first. To service the caller as a Travel Agent, Reservation Number and the agency identifier (ABTA #, Agency ID, or Phone #) are mandatory. If the agency identifier cannot be provided, do not continue under the Travel Agent verification path; use the Travel Agency Guest path once 3 pieces are obtained from Guest Full Name, Ship & Full Sail Date, Date of Birth, and First Line of Address."
  },
  travel_agency_guest:{
    label:"Travel Agency Guest",
    alwaysMandatory:["Reservation Number"],
    askFirst:["Reservation Number","Guest Full Name","Ship & Full Sail Date"],
    fallback:["Agency Name","Date of Birth","First Line of Address"],
    instruction:"Ask the primary verification items first. Reservation Number is always mandatory. If one of the other primary items cannot be obtained, use the fallback questions until 3 verification pieces are obtained in total."
  },
  ta_group:{
    label:"TA Group",
    alwaysMandatory:["Reservation Number","ABTA # / Agency ID / Phone #"],
    askFirst:["Reservation Number","ABTA # or Agency ID or Phone #","Guest Full Name","Ship & Full Sail Date"],
    fallback:["Date of Birth","First Line of Address"],
    instruction:"Ask all primary items first. To service the caller as a Travel Agent / TA Group, Reservation Number and the agency identifier (ABTA #, Agency ID, or Phone #) are mandatory. If the agency identifier cannot be provided, use the Travel Agency Guest path once 3 pieces are obtained from Guest Full Name, Ship & Full Sail Date, Date of Birth, and First Line of Address."
  },
  friends_family:{
    label:"Friends & Family / Team Member",
    alwaysMandatory:["Reservation Number"],
    askFirst:["Reservation Number","Guest Full Name","Ship & Full Sail Date"],
    fallback:["Agency Name","Date of Birth","First Line of Address"],
    instruction:"Ask the primary verification items first. Reservation Number is always mandatory. If one of the other primary items cannot be obtained, use the fallback questions until 3 verification pieces are obtained in total."
  },
  casino_guest:{
    label:"Casino Guest",
    alwaysMandatory:["Reservation Number"],
    askFirst:["Reservation Number","Guest Full Name","Ship & Full Sail Date"],
    fallback:["Agency Name","Date of Birth","First Line of Address"],
    instruction:"Ask the primary verification items first. Reservation Number is always mandatory. If one of the other primary items cannot be obtained, use the fallback questions until 3 verification pieces are obtained in total."
  },
  pcc_guest:{
    label:"PCC Guest",
    alwaysMandatory:["Reservation Number"],
    askFirst:["Reservation Number","Guest Full Name","Ship & Full Sail Date"],
    fallback:["Agency Name","Date of Birth","First Line of Address"],
    instruction:"Ask the primary verification items first. Reservation Number is always mandatory. If one of the other primary items cannot be obtained, use the fallback questions until 3 verification pieces are obtained in total. Complete GDPR before following PCC servicing / transfer guidance."
  },
  direct_group:{
    label:"Direct Group",
    alwaysMandatory:["Reservation Number"],
    askFirst:["Reservation Number","Guest Full Name","Ship & Full Sail Date"],
    fallback:["Agency Name","Date of Birth","First Line of Address"],
    instruction:"Ask the primary verification items first. Reservation Number is always mandatory. If one of the other primary items cannot be obtained, use the fallback questions until 3 verification pieces are obtained in total. Complete GDPR before following Direct Group transfer guidance."
  },
  charter_sixthman:{
    label:"Charter / Sixthman",
    alwaysMandatory:["Reservation Number"],
    askFirst:["Reservation Number","Guest Full Name","Ship & Full Sail Date"],
    fallback:["Agency Name","Date of Birth","First Line of Address"],
    instruction:"Ask the primary verification items first. Reservation Number is always mandatory. If one of the other primary items cannot be obtained, use the fallback questions until 3 verification pieces are obtained in total."
  }
};

const directGroupRoutes={
  direct_groups_sot:{label:"Direct Groups SOT",sot:"11185"},
  direct_canadian:{label:"Direct Canadian Groups (CAD)",sot:"11185"},
  latam:{label:"LATAM Direct Groups",sot:"11195"},
  miami_outbound:{label:"Miami Outbound Direct Groups",sot:"11195"},
  remote_outbound_pcc:{label:"Remote Outbound PCC Groups",sot:"11195"},
  sawgrass_outbound:{label:"Sawgrass Outbound Direct Groups",sot:"11195"}
};

function gdprProfile(value){
  return gdprProfiles[value]||null;
}

function directGroupRoute(value){
  return directGroupRoutes[value]||directGroupRoutes.direct_groups_sot;
}

function pccActionText(d){
  if(d.modificationType==="shore_excursion"){
    return "PCC Guest handling: Shore Excursions may be serviced.";
  }
  if(d.modificationType==="cancel_reinstate"){
    return "PCC Guest cancellation handling: advise the guest to contact the PCC directly. If the guest says they already attempted to contact the PCC and/or refuses transfer, follow standard cancellation procedures and document the reservation.";
  }
  return "PCC Guest handling: advise the caller that they have a PCC and attempt to transfer them to the PCC. If the PCC is unavailable or the guest refuses transfer, you may service reservation requests except cancellation requests.";
}

function directGroupActionText(d){
  const route=directGroupRoute(d.directGroupMarket);
  return `Direct Group handling: transfer the reservation to the PCC listed on the reservation or to the Direct Groups SOT Pilot #${route.sot}. Selected route: ${route.label}.`;
}

function gdprActionText(d){
  if(d.gdprCallerType==="pcc_guest")return pccActionText(d);
  if(d.gdprCallerType==="direct_group")return directGroupActionText(d);
  return "";
}

function gdprItemClass(profile,item){
  const mandatory=(profile.alwaysMandatory||[]).some(x=>x===item || (item.includes("ABTA")&&x.includes("ABTA")));
  return mandatory?"gdpr-always-mandatory":"gdpr-primary-item";
}

function gdprVerificationListsHtml(profile){
  const askFirst=(profile.askFirst||[]).map((item,i)=>{
    const cls=gdprItemClass(profile,item);
    const mandatory=cls==="gdpr-always-mandatory";
    return `<li class="${cls}"><span class="gdpr-number">${i+1}.</span><span>${escapeHtml(item)}</span>${mandatory?`<strong class="gdpr-mandatory-tag">MANDATORY</strong>`:""}</li>`;
  }).join("");

  const fallback=(profile.fallback||[]).map((item,i)=>`<li><span class="gdpr-number">${(profile.askFirst||[]).length+i+1}.</span><span>${escapeHtml(item)}</span></li>`).join("");

  return `<div class="gdpr-question-groups">
    <div class="gdpr-question-group primary">
      <div class="gdpr-group-title">ASK FIRST</div>
      <ol class="gdpr-primary-list">${askFirst}</ol>
    </div>
    <div class="gdpr-question-group fallback">
      <div class="gdpr-group-title">IF NEEDED — ADDITIONAL VERIFICATION</div>
      <p>Only use these when one of the non-mandatory primary verification items cannot be obtained.</p>
      <ol class="gdpr-fallback-list">${fallback}</ol>
    </div>
  </div>`;
}

function gdprScenarioHtml(d){
  if(d.department!=="Guest Services"||d.reservationWorkflow!=="modify")return "";
  const profile=gdprProfile(d.gdprCallerType);
  if(!profile){
    return `<section class="scenario-section gdpr-output-section"><div class="section-label">GDPR — REQUIRED</div><h3>Complete GDPR Verification First</h3><p>Caller type has not been selected. The trainer must identify the correct GDPR caller / reservation type before this scenario is assigned.</p></section>`;
  }
  const action=gdprActionText(d);
  return `<section class="scenario-section gdpr-output-section">
    <div class="section-label">GDPR — REQUIRED • GUEST SERVICES</div>
    <h3>Complete GDPR Verification First</h3>
    <p><strong>Caller / Reservation Type:</strong> ${escapeHtml(profile.label)}</p>
    <div class="gdpr-rule-banner"><strong>Verification order matters:</strong> ask the primary items first. Reservation Number is always mandatory.${["travel_agent","ta_group"].includes(d.gdprCallerType)?` The agency identifier is also mandatory to continue under the Travel Agent verification path.`:""}</div>
    <p class="gdpr-instruction">${escapeHtml(profile.instruction)}</p>
    ${gdprVerificationListsHtml(profile)}
    ${action?`<div class="gdpr-action-card"><strong>Required Handling</strong><span>${escapeHtml(action)}</span></div>`:""}
  </section>`;
}

function updateGdprPreview(){
  const gsModify=$("department").value==="Guest Services" && $("reservationWorkflow").value==="modify";
  $("gdprPanel")?.classList.toggle("hidden-field",!gsModify);
  if(!gsModify)return;

  const caller=$("gdprCallerType")?.value||"";
  const profile=gdprProfile(caller);
  const directGroup=caller==="direct_group";
  $("directGroupMarketField")?.classList.toggle("hidden-field",!directGroup);

  const preview=$("gdprRequirementsPreview");
  if(!preview)return;
  if(!profile){
    preview.innerHTML=`<div class="notice warning">Choose the caller / reservation type. GDPR verification is mandatory before servicing an existing Guest Services reservation.</div>`;
    return;
  }

  const draft={
    modificationType:$("modificationType")?.value||"general",
    gdprCallerType:caller,
    directGroupMarket:$("directGroupMarket")?.value||"direct_groups_sot"
  };
  const action=gdprActionText(draft);
  preview.innerHTML=`
    <div class="gdpr-preview-title">${escapeHtml(profile.label)} Verification</div>
    <div class="gdpr-rule-banner compact"><strong>Ask first:</strong> the highlighted primary verification items below. Reservation Number is always mandatory.${["travel_agent","ta_group"].includes(caller)?` Agency ID / Phone # (or ABTA # where applicable) is also mandatory to remain on the Travel Agent path.`:""}</div>
    <p>${escapeHtml(profile.instruction)}</p>
    ${gdprVerificationListsHtml(profile)}
    ${action?`<div class="gdpr-preview-action"><strong>Required Handling</strong><span>${escapeHtml(action)}</span></div>`:""}`;
}

function modificationLabel(value){
  return modificationLabels[value]||"General Reservation Update";
}

function inferModificationType(meta){
  const t=`${meta?.name||""} ${meta?.objective||""}`.toLowerCase();
  if(/cancel|reinstate/.test(t))return "cancel_reinstate";
  if(/special request|ada|dietary/.test(t))return "special_request";
  if(/hotel|cruisetour|land pkg/.test(t))return "hotel_cruisetour";
  if(/air|transfer/.test(t))return "air_transfer";
  if(/free at sea|price programs|fas/.test(t))return "fas";
  if(/norwegian care|travel protection/.test(t))return "travel_protection";
  if(/fcc|cruisenext|coupon|cruise first/.test(t))return "credit_coupon";
  if(/payment/.test(t))return "payment";
  return "general";
}

function modificationTaskText(d){
  const target=d.modificationTarget?` for ${d.modificationTarget}`:"";
  const request=d.modificationRequest?` ${d.modificationRequest}`:"";
  const map={
    special_request:`Add or update the requested special request${target} in the correct Seaweb location and enter any required reservation comments.`,
    shore_excursion:`Add or change the requested Shore Excursion${target}; review availability, pricing, and any payment or cancellation requirements.`,
    stateroom:`Review available inventory and complete the requested stateroom change or upgrade${target}. Reprice the reservation and explain any fare or promotion impact.`,
    add_guest:`Add the requested guest${target}. Create or locate the guest profile, verify occupancy/capacity, reprice the reservation, and review any new amount due.`,
    remove_guest:`Remove the requested guest${target}. Review occupancy, fare, promotion, cancellation-fee, and payment impacts before saving.`,
    fas:`Add, remove, or update the requested Free at Sea selection${target}; verify eligibility, deadlines, pricing, and any service-charge impact.`,
    travel_protection:`Add or remove travel protection${target}; verify timing, eligibility, price, and any refund/removal rules before saving.`,
    psc:`Add prepaid service charges${target} and review the updated reservation total.`,
    payment:`Review the reservation balance and complete the requested payment action${target} using the training payment information when required.`,
    credit_coupon:`Apply or update the requested FCC / CruiseNext / coupon${target} in the correct status/order, then review the resulting pricing.`,
    air_transfer:`Add or change the requested air or ground-transfer component${target}; review applicable timing, terms, pricing, and transfer details.`,
    hotel_cruisetour:`Add or change the requested hotel, land package, or cruisetour${target}; review availability, timing, pricing, and related reservation details.`,
    cancel_reinstate:`Complete the requested cancellation or reinstatement${target}; verify final-payment status, refund timing, and any fare/category/promotion changes.`,
    general:`Complete the requested reservation update${target} and verify all resulting pricing, status, and deadline changes.`
  };
  return `${map[d.modificationType]||map.general}${request}`;
}

function updateModificationDefaults(){
  if($("reservationWorkflow").value!=="modify")return;
  const type=$("modificationType").value;

  $("fasToggle").checked=type==="fas";
  $("travelToggle").checked=type==="travel_protection";
  $("pscToggle").checked=type==="psc";
  $("commentToggle").checked=true;

  const paymentDefaults={
    payment:"Initial Deposit",
    credit_coupon:"FCC / CruiseNext",
    cancel_reinstate:"Refund / Reinstate"
  };
  if(paymentDefaults[type]) $("paymentAction").value=paymentDefaults[type];
  else if(["special_request","shore_excursion","stateroom","add_guest","remove_guest","fas","travel_protection","psc","air_transfer","hotel_cruisetour","general"].includes(type)){
    $("paymentAction").value="No Payment / Service Only";
  }

  refreshTrainingCardPanel();
}

function updateModificationTypeUI(applyDefaults=false){
  const modify=$("reservationWorkflow").value==="modify";
  const type=$("modificationType")?.value||"general";

  $("modificationPanel").classList.toggle("hidden-field",!modify);
  $("selectedSailingSummary").classList.toggle("workflow-hidden",modify);

  const needsStateroom=modify && type==="stateroom";
  const needsAddedGuest=modify && type==="add_guest";

  ["categoryField","locationField","sideField"].forEach(id=>{
    $(id)?.classList.toggle("workflow-hidden",modify&&!needsStateroom);
  });
  $("pricingField")?.classList.toggle("workflow-hidden",modify&&!needsStateroom);
  $("guestCountField")?.classList.toggle("workflow-hidden",modify);
  $("guest2Field")?.classList.toggle("workflow-hidden",modify);

  $("guestStatusTaskControl")?.classList.toggle("workflow-hidden",modify);
  if(modify){
    $("latitudesToggle").checked=false;
    $("latitudesNumberPanel").classList.add("hidden-field");
  }

  $("modificationGuestStatusField")?.classList.toggle("hidden-field",!needsAddedGuest);
  const addedPast=needsAddedGuest && $("modificationGuestStatus")?.value==="past";
  $("modificationLatitudesField")?.classList.toggle("hidden-field",!addedPast);

  const target=$("modificationTarget");
  if(target){
    const placeholders={
      special_request:"Guest or request being updated",
      shore_excursion:"Shore Excursion being added or changed",
      stateroom:"Optional: current stateroom / category",
      add_guest:"Name of guest being added",
      remove_guest:"Name of guest being removed",
      fas:"Free at Sea selection being changed",
      travel_protection:"Guest / protection change",
      psc:"Guest(s) receiving prepaid service charges",
      payment:"Payment amount or payment action",
      credit_coupon:"FCC / CruiseNext / coupon being applied",
      air_transfer:"Air / transfer component being changed",
      hotel_cruisetour:"Hotel / cruisetour component being changed",
      cancel_reinstate:"Cancellation or reinstatement request",
      general:"Guest / item being changed"
    };
    target.placeholder=placeholders[type]||placeholders.general;
  }

  if(applyDefaults)updateModificationDefaults();
  updateGdprPreview();
}

function updateWorkflowUI(applyDefaults=false){
  const modify=$("reservationWorkflow").value==="modify";
  $("guest1Field").querySelector(":scope > text")?.remove?.();
  // Primary guest remains visible because it is the quickest way to identify
  // the training reservation along with the reservation number.
  updateModificationTypeUI(applyDefaults);
  updateGdprPreview();
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

function collectLatitudesNumbers(){
  const count=+$('guestCount').value||1;
  return Array.from({length:count},(_,i)=>($(`latitudeNumber${i+1}`)?.value||'').trim());
}

function collectPastGuestFlags(){
  const count=+$('guestCount').value||1;
  return Array.from({length:count},(_,i)=>!!$(`pastGuest${i+1}`)?.checked);
}

function guestDisplayName(index){
  if(index===0)return $('guest1').value.trim()||'Guest 1';
  if(index===1)return $('guest2').value.trim()||'Guest 2';
  return `Guest ${index+1}`;
}

function normalizeGuestStatusFlags(count,flags,values,hasExistingControls){
  return Array.from({length:count},(_,i)=>{
    if(Array.isArray(flags) && typeof flags[i]==='boolean') return flags[i];
    if(Array.isArray(values) && values[i]) return true;
    if(hasExistingControls) return !!$(`pastGuest${i+1}`)?.checked;
    return !!$('latitudesToggle').checked;
  });
}

function syncGuestStatusCard(card){
  const past=card.querySelector('.past-guest-radio');
  const inputWrap=card.querySelector('.latitudes-number-wrap');
  const note=card.querySelector('.guest-status-note');
  const input=card.querySelector('.latitude-number-input');
  const isPast=!!past?.checked;
  inputWrap?.classList.toggle('hidden-field',!isPast);
  card.classList.toggle('is-past-guest',isPast);
  card.classList.toggle('is-new-guest',!isPast);
  if(note) note.textContent=isPast
    ? 'Past Guest — enter the training Latitudes number.'
    : 'New Guest — no Latitudes number is required.';
  if(input && !isPast) input.value='';
}

function renderLatitudesFields(values,flags){
  const count=+$('guestCount').value||1;
  const host=$('latitudesGuestFields');
  if(!host)return;
  const hasExistingControls=!!host.querySelector('.guest-status-radio');
  const existingValues=Array.isArray(values)?values:collectLatitudesNumbers();
  const existingFlags=normalizeGuestStatusFlags(count,Array.isArray(flags)?flags:null,existingValues,hasExistingControls);

  host.innerHTML=Array.from({length:count},(_,i)=>{
    const guest=guestDisplayName(i);
    const value=existingValues[i]||'';
    const isPast=!!existingFlags[i];
    return `<div class="latitudes-guest-card ${isPast?'is-past-guest':'is-new-guest'}">
      <div class="latitudes-guest-head"><strong>${escapeHtml(guest)}</strong><span>Guest ${i+1}</span></div>
      <div class="guest-status-choice" role="group" aria-label="Guest ${i+1} status">
        <label><input id="pastGuest${i+1}" class="guest-status-radio past-guest-radio" type="radio" name="guestStatus${i+1}" value="past" ${isPast?'checked':''} /> Past Guest</label>
        <label><input id="newGuest${i+1}" class="guest-status-radio new-guest-radio" type="radio" name="guestStatus${i+1}" value="new" ${!isPast?'checked':''} /> New Guest</label>
      </div>
      <div class="guest-status-note">${isPast?'Past Guest — enter the training Latitudes number.':'New Guest — no Latitudes number is required.'}</div>
      <label class="latitudes-number-wrap ${isPast?'':'hidden-field'}"><span>Latitudes number</span><input id="latitudeNumber${i+1}" class="latitude-number-input" inputmode="numeric" autocomplete="off" maxlength="12" placeholder="Latitudes number" value="${escapeAttr(value)}" /></label>
    </div>`;
  }).join('');

  host.querySelectorAll('.latitudes-guest-card').forEach(card=>{
    card.querySelectorAll('.guest-status-radio').forEach(radio=>radio.addEventListener('change',()=>syncGuestStatusCard(card)));
    syncGuestStatusCard(card);
  });
  host.querySelectorAll('.latitude-number-input').forEach(input=>{
    input.addEventListener('input',()=>{input.value=input.value.replace(/[^0-9]/g,'')});
  });
}

function refreshLatitudesPanel(values,flags){
  const enabled=$('latitudesToggle').checked;
  $('latitudesNumberPanel').classList.toggle('hidden-field',!enabled);
  if(enabled)renderLatitudesFields(values,flags);
}

function getGuestProfileMix(d){
  const count=+d.guestCount||1;
  const numbers=Array.isArray(d.latitudesNumbers)?d.latitudesNumbers:[];
  const flags=Array.from({length:count},(_,i)=>{
    if(Array.isArray(d.pastGuestFlags) && typeof d.pastGuestFlags[i]==='boolean') return d.pastGuestFlags[i];
    return !!numbers[i];
  });
  const pastCount=flags.filter(Boolean).length;
  const newCount=count-pastCount;
  return {count,numbers,flags,pastCount,newCount};
}

function applyFocusDefaults(){
  const meta=currentFocusMeta();
  if(!meta)return;
  const focusText=`${meta.name} ${meta.objective}`.toLowerCase();

  $("difficulty").value=meta.difficulty||"Intermediate";
  $("paymentAction").value=meta.payment||"No Payment / Service Only";
  $("commentToggle").checked=!!meta.commenting;
  $("confirmToggle").checked=true;

  // Match source-curriculum components automatically so a generated variation
  // does not contradict the skill being practiced.
  $("fasToggle").checked=/\bfas\b|free at sea/.test(focusText);
  $("travelToggle").checked=/norwegian care|travel protection/.test(focusText);
  $("pscToggle").checked=/ppsrvchg|prepaid service charge/.test(focusText);
  $("latitudesToggle").checked=!/new guest/.test(focusText);
  refreshLatitudesPanel();

  // ADA scenarios must request an accessible category. Location and side are
  // left flexible because accessible inventory controls what can actually be sold.
  if(/\bada\b|accessible/.test(focusText)){
    $("category").value="ADA / Accessible";
    $("locationPref").value="Any";
    $("sidePref").value="Any";
  }

  if($("reservationWorkflow")?.value==="modify" && $("modificationType")){
    $("modificationType").value=inferModificationType(meta);
    updateModificationTypeUI(true);
  }else{
    updateWorkflowUI(false);
  }

  refreshTrainingCardPanel(meta.cardProfile);
  const level=trainingSupportLabel(+$("trainingDay").value);
  $("curriculumNote").innerHTML=`<strong>${escapeHtml($("department").value)} • ${escapeHtml(meta.name)}</strong><span>${escapeHtml(meta.objective)}</span><span class="support-level">Trainee support: ${escapeHtml(level)}</span>`;
}

function renderStarters(){
  $("starterTemplates").innerHTML=starters.map((s,i)=>`
    <div class="template-card">
      <div class="meta"><span class="chip">${escapeHtml(s.department)}</span></div>
      <h4>${escapeHtml(s.focus)}</h4><p>${escapeHtml(s.desc)}</p>
      <button class="secondary" onclick="loadStarter(${i})">Use Quick Start</button>
    </div>`).join("");
}
window.loadStarter=(i)=>{
  const s=starters[i];
  $("department").value=s.department;
  $("trainingDay").value=String(s.day);
  updateDepartmentUI();
  updateScenarioFocus(s.focus,String(s.day));
  $("difficulty").value=s.difficulty;
  go("generator");
};

$("department").addEventListener("change",updateDepartmentUI);
$("scenarioType").addEventListener("change",syncScenarioFocusSelection);
$("reservationWorkflow").addEventListener("change",()=>updateWorkflowUI(true));
$("modificationType").addEventListener("change",()=>updateModificationTypeUI(true));
$("modificationGuestStatus").addEventListener("change",()=>updateModificationTypeUI(false));
$("modificationLatitudes").addEventListener("input",()=>{$("modificationLatitudes").value=$("modificationLatitudes").value.replace(/[^0-9]/g,"")});
$("gdprCallerType").addEventListener("change",updateGdprPreview);
$("directGroupMarket").addEventListener("change",updateGdprPreview);
$("marketAgency").addEventListener("change",()=>{$("agency").value=$("marketAgency").value});
$("trainingCardProfile").addEventListener("change",renderTrainingCard);
$("resetTrainingCardBtn").addEventListener("click",renderTrainingCard);
$("trainingCardNumber").addEventListener("input",()=>{$("trainingCardNumber").value=$("trainingCardNumber").value.replace(/[^0-9 ]/g,"")});
$("trainingCardCcv").addEventListener("input",()=>{$("trainingCardCcv").value=$("trainingCardCcv").value.replace(/[^0-9]/g,"")});
$("paymentAction").addEventListener("change",()=>refreshTrainingCardPanel());
$("latitudesToggle").addEventListener("change",()=>refreshLatitudesPanel());
$("guestCount").addEventListener("change",()=>refreshLatitudesPanel());
$("guest1").addEventListener("input",()=>{if($("latitudesToggle").checked)renderLatitudesFields()});
$("guest2").addEventListener("input",()=>{if($("latitudesToggle").checked)renderLatitudesFields()});

$("generateNamesBtn").onclick=()=>{
  const pair=namePairs[Math.floor(Math.random()*namePairs.length)];
  $("guest1").value=pair[0]; $("guest2").value=pair[1];
  if($("latitudesToggle").checked)renderLatitudesFields();
};

const anchorSuggestions = {
  destination:[
    {value:"Caribbean",detail:"Bahamas, Eastern & Southern Caribbean"},
    {value:"Alaska",detail:"Glaciers, wildlife & Inside Passage"},
    {value:"Canada & New England",detail:"Northeast U.S. & Canadian ports"},
    {value:"Bermuda",detail:"Island itineraries"},
    {value:"Bahamas",detail:"Short & weeklong island sailings"},
    {value:"Europe",detail:"Mediterranean & Northern Europe"},
    {value:"Mediterranean",detail:"Spain, Italy, Greece & more"},
    {value:"Northern Europe",detail:"Iceland, Norway & Baltic region"},
    {value:"Hawaii",detail:"Hawaiian Islands"},
    {value:"Panama Canal",detail:"Canal & Central America itineraries"},
    {value:"South America",detail:"South American itineraries"},
    {value:"Asia",detail:"Asia itineraries"},
    {value:"Australia & New Zealand",detail:"Australia, New Zealand & South Pacific"}
  ],
  departure:[
    {value:"Miami",detail:"Miami, Florida"},
    {value:"Port Canaveral",detail:"Orlando / Port Canaveral, Florida"},
    {value:"New York",detail:"New York, New York"},
    {value:"Boston",detail:"Boston, Massachusetts"},
    {value:"Seattle",detail:"Seattle, Washington"},
    {value:"Los Angeles",detail:"Los Angeles, California"},
    {value:"New Orleans",detail:"New Orleans, Louisiana"},
    {value:"Tampa",detail:"Tampa, Florida"},
    {value:"San Juan",detail:"San Juan, Puerto Rico"},
    {value:"Honolulu",detail:"Honolulu, Hawaii"},
    {value:"Barcelona",detail:"Barcelona, Spain"},
    {value:"Rome (Civitavecchia)",detail:"Civitavecchia / Rome, Italy"},
    {value:"Southampton",detail:"Southampton, England"}
  ],
  ship:[
    {value:"Norwegian Aqua",detail:"Norwegian Cruise Line ship"},
    {value:"Norwegian Luna",detail:"Norwegian Cruise Line ship"},
    {value:"Norwegian Prima",detail:"Norwegian Cruise Line ship"},
    {value:"Norwegian Viva",detail:"Norwegian Cruise Line ship"},
    {value:"Norwegian Encore",detail:"Norwegian Cruise Line ship"},
    {value:"Norwegian Bliss",detail:"Norwegian Cruise Line ship"},
    {value:"Norwegian Joy",detail:"Norwegian Cruise Line ship"},
    {value:"Norwegian Breakaway",detail:"Norwegian Cruise Line ship"},
    {value:"Norwegian Getaway",detail:"Norwegian Cruise Line ship"},
    {value:"Norwegian Escape",detail:"Norwegian Cruise Line ship"},
    {value:"Norwegian Epic",detail:"Norwegian Cruise Line ship"},
    {value:"Norwegian Gem",detail:"Norwegian Cruise Line ship"},
    {value:"Norwegian Jade",detail:"Norwegian Cruise Line ship"},
    {value:"Norwegian Pearl",detail:"Norwegian Cruise Line ship"},
    {value:"Norwegian Dawn",detail:"Norwegian Cruise Line ship"},
    {value:"Norwegian Star",detail:"Norwegian Cruise Line ship"},
    {value:"Norwegian Sun",detail:"Norwegian Cruise Line ship"},
    {value:"Norwegian Spirit",detail:"Norwegian Cruise Line ship"},
    {value:"Pride of America",detail:"Norwegian Cruise Line ship"}
  ]
};

const anchorLabels={destination:"Destination",departure:"Embarkation Port",ship:"Ship"};
const anchorPlaceholders={
  destination:"Select or type a destination…",
  departure:"Select or type an embarkation port…",
  ship:"Select or type a ship…"
};
const anchorSearchPlaceholders={
  destination:"Search destinations…",
  departure:"Search embarkation ports…",
  ship:"Search ships…"
};
let anchorActiveIndex=0;

function anchorIconSvg(anchor=currentAnchor()){
  if(anchor==="departure") return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s7-6.1 7-13A7 7 0 1 0 5 9c0 6.9 7 13 7 13Zm0-9.5A3.5 3.5 0 1 1 12 5a3.5 3.5 0 0 1 0 7.5Z"/></svg>`;
  if(anchor==="ship") return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 10h14l-1.2 7.2L12 20l-5.8-2.8L5 10Zm3-5h8v4H8V5Zm2-3h4v2h-4V2ZM3 20.2c1.4 0 1.9.8 3 .8s1.6-.8 3-.8 1.9.8 3 .8 1.6-.8 3-.8 1.9.8 3 .8 1.6-.8 3-.8V22c-1.4 0-1.9-.8-3-.8s-1.6.8-3 .8-1.9-.8-3-.8-1.6.8-3 .8-1.9-.8-3-.8-1.6.8-3 .8v-1.8Z"/></svg>`;
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm3.8 6.2-2.1 5.5-5.5 2.1 2.1-5.5 5.5-2.1Zm-4.2 3.4-.8 1.6 1.6-.8.8-1.6-1.6.8Z"/></svg>`;
}

function currentAnchor(){
  return document.querySelector('input[name="searchAnchor"]:checked')?.value||"destination";
}
function updateAnchorTrigger(){
  const anchor=currentAnchor(), value=$("searchAnchorValue").value.trim();
  $("anchorSelectIcon").innerHTML=anchorIconSvg(anchor);
  $("anchorSelectText").textContent=value||anchorPlaceholders[anchor];
  $("anchorSelectTrigger").classList.toggle("has-value",!!value);
}
function renderAnchorOptions(){
  const anchor=currentAnchor();
  const q=$("searchAnchorValue").value.toLowerCase().trim();
  const options=anchorSuggestions[anchor].filter(o=>`${o.value} ${o.detail}`.toLowerCase().includes(q));
  anchorActiveIndex=Math.max(0,Math.min(anchorActiveIndex,Math.max(0,options.length-1)));
  $("anchorOptions").innerHTML=options.length?options.map((o,i)=>`
    <button type="button" class="smart-option ${i===anchorActiveIndex?"active":""} ${o.value===$("searchAnchorValue").value?"selected":""}" data-value="${escapeAttr(o.value)}" role="option" aria-selected="${o.value===$("searchAnchorValue").value}">
      <span class="smart-option-icon">${anchorIconSvg(anchor)}</span>
      <span class="smart-option-copy"><strong>${escapeHtml(o.value)}</strong><small>${escapeHtml(o.detail)}</small></span>
      <span class="smart-option-check" aria-hidden="true">✓</span>
    </button>`).join(""):`<div class="smart-option-empty"><strong>Use “${escapeHtml($("searchAnchorValue").value)}”</strong><span>No preset match — you can still search this value.</span></div>`;
  $("anchorOptionCount").textContent=`${options.length} matching option${options.length===1?"":"s"}`;
}
function openAnchorMenu(){
  $("anchorSelectMenu").classList.add("open");
  $("anchorSelectTrigger").setAttribute("aria-expanded","true");
  anchorActiveIndex=0;
  renderAnchorOptions();
  setTimeout(()=>{$("searchAnchorValue").focus();$("searchAnchorValue").select();},0);
}
function closeAnchorMenu(commit=true){
  $("anchorSelectMenu").classList.remove("open");
  $("anchorSelectTrigger").setAttribute("aria-expanded","false");
  if(commit) updateAnchorTrigger();
}
function chooseAnchorValue(value){
  $("searchAnchorValue").value=value;
  updateAnchorTrigger();
  renderAnchorOptions();
  closeAnchorMenu(true);
}
function updateAnchorUI(){
  const anchor=currentAnchor();
  $("anchorFieldTitle").textContent=anchorLabels[anchor];
  $("searchAnchorValue").placeholder=anchorSearchPlaceholders[anchor];
  $("searchAnchorValue").value="";
  anchorActiveIndex=0;
  updateAnchorTrigger();
  renderAnchorOptions();
  closeAnchorMenu(false);
  document.querySelectorAll(".anchor-card").forEach(c=>c.classList.toggle("active",c.querySelector("input").checked));
}

document.querySelectorAll('input[name="searchAnchor"]').forEach(r=>r.addEventListener("change",updateAnchorUI));
$("anchorSelectTrigger").addEventListener("click",()=>$("anchorSelectMenu").classList.contains("open")?closeAnchorMenu(true):openAnchorMenu());
$("searchAnchorValue").addEventListener("input",()=>{anchorActiveIndex=0;renderAnchorOptions();updateAnchorTrigger();});
$("anchorOptions").addEventListener("click",e=>{const b=e.target.closest("[data-value]");if(b)chooseAnchorValue(b.dataset.value);});
$("searchAnchorValue").addEventListener("keydown",e=>{
  const visible=[...$("anchorOptions").querySelectorAll("[data-value]")];
  if(e.key==="ArrowDown"){e.preventDefault();anchorActiveIndex=Math.min(anchorActiveIndex+1,Math.max(0,visible.length-1));renderAnchorOptions();}
  if(e.key==="ArrowUp"){e.preventDefault();anchorActiveIndex=Math.max(anchorActiveIndex-1,0);renderAnchorOptions();}
  if(e.key==="Enter"){
    e.preventDefault();
    const choice=visible[anchorActiveIndex];
    if(choice)chooseAnchorValue(choice.dataset.value);else closeAnchorMenu(true);
  }
  if(e.key==="Escape"){e.preventDefault();closeAnchorMenu(true);$("anchorSelectTrigger").focus();}
});
document.addEventListener("click",e=>{if(!$("anchorSelect").contains(e.target))closeAnchorMenu(true);});


function parseIsoLocal(iso){
  const parts=String(iso||"").split("-").map(Number);
  if(parts.length!==3 || parts.some(Number.isNaN)) return null;
  return new Date(parts[0],parts[1]-1,parts[2],12,0,0,0);
}

function formatIsoLocal(date){
  if(!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  const y=date.getFullYear();
  const m=String(date.getMonth()+1).padStart(2,"0");
  const d=String(date.getDate()).padStart(2,"0");
  return `${y}-${m}-${d}`;
}

function addDays(iso,days){
  const date=parseIsoLocal(iso);
  if(!date)return "";
  date.setDate(date.getDate()+Number(days||0));
  return formatIsoLocal(date);
}

function daysBetween(from,to){
  const a=parseIsoLocal(from),b=parseIsoLocal(to);
  if(!a||!b)return NaN;
  return Math.round((b-a)/86400000);
}

function initSearchDates(){
  // Keep existing values when present; otherwise initialize a 30-day window
  // beginning today. Any later From-date change resets To to +30 days.
  const fromEl=$("searchFrom"),toEl=$("searchTo");
  if(!fromEl||!toEl)return;

  let from=fromEl.value;
  if(!from){
    const today=new Date();
    from=formatIsoLocal(today);
    fromEl.value=from;
  }

  const autoTo=addDays(from,30);
  toEl.min=from;
  toEl.max=autoTo;

  if(!toEl.value || Number.isNaN(daysBetween(from,toEl.value)) || daysBetween(from,toEl.value)<0 || daysBetween(from,toEl.value)>30){
    toEl.value=autoTo;
  }
  updateDateHint();
}

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
  const autoTo=addDays(from,30);
  $("searchTo").min=from;
  $("searchTo").max=autoTo;
  // Seaweb-style behavior: every new From date automatically creates
  // the full 30-day search window. Trainers can shorten To afterward.
  $("searchTo").value=autoTo;
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
    $("searchNotice").className="notice "+(state.sailings.length?"success":"warning");
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
  return opt ? (opt.dataset.market || opt.textContent) : "";
}

function scenarioData(){
  const meta=currentFocusMeta()||{};
  const cardKey=$("trainingCardProfile")?.value||meta.cardProfile||"standardSesame";
  return {
    id: state.currentScenario?.id || crypto.randomUUID(),
    department:$("department").value,
    trainingDay:+$("trainingDay").value,
    approach:$("scenarioApproach").value,
    title:`${$("department").value} – ${$("scenarioType").value}`,
    type:$("scenarioType").value,
    reservationWorkflow:$("reservationWorkflow")?.value||"new",
    existingReservationNumber:$("existingReservationNumber")?.value.trim()||"",
    modificationType:$("modificationType")?.value||"general",
    modificationTarget:$("modificationTarget")?.value.trim()||"",
    modificationRequest:$("modificationRequest")?.value.trim()||"",
    modificationGuestStatus:$("modificationGuestStatus")?.value||"new",
    modificationLatitudes:$("modificationLatitudes")?.value.trim()||"",
    gdprCallerType:$("gdprCallerType")?.value||"",
    directGroupMarket:$("directGroupMarket")?.value||"direct_groups_sot",
    difficulty:$("difficulty").value,
    guestCount:+$("guestCount").value,
    agency:$("agency").value,
    market:$("department").value==="Outbound Sales"?selectedMarketLabel():"Agency 5",
    guest1:$("guest1").value.trim(),guest2:$("guest2").value.trim(),
    latitudesNumbers:collectLatitudesNumbers(),
    pastGuestFlags:collectPastGuestFlags(),
    category:$("category").value,location:$("locationPref").value,side:$("sidePref").value,
    payment:$("paymentAction").value,pricing:$("pricing").value.trim(),email:$("confirmationEmail").value.trim(),
    latitudes:$("reservationWorkflow").value==="new"&&$("latitudesToggle").checked,commenting:$("commentToggle").checked,confirmation:$("confirmToggle").checked,
    fas:$("fasToggle").checked,travel:$("travelToggle").checked,psc:$("pscToggle").checked,
    trainerNotes:$("trainerNotes").value.trim(),sailing:state.selectedSailing,
    cardRequired:!!meta.cardRequired || paymentActionNeedsCard(),
    cardProfile:cardKey,
    card:(!!meta.cardRequired || paymentActionNeedsCard()) ? currentTrainingCard() : null,
    curriculumObjective:meta.objective||"",
    curriculumKind:meta.kind||"",
    createdAt:state.currentScenario?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString(),
    favorite:state.currentScenario?.favorite||false,archived:false
  };
}

function trainingSupportLabel(day){
  if(day<=6)return "Guided";
  if(day===7)return "Supported";
  if(day<=9)return "Light guidance";
  return "Independent";
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

function outboundQualificationItems(day){
  if(day<=7) return [
    "Are you currently working with a travel agent?",
    "Have you sailed with Norwegian before?",
    "Who will be joining you?",
    "Are you celebrating anything special?",
    "Which itinerary or destination interests you most?",
    "When would you like to sail?",
    "How many days would you like to vacation?",
    "Which port would you like to cruise from?",
    "What stateroom experience are you looking for?",
    "Military or teacher eligibility?",
    "Any health, mobility, or dietary needs?",
    "Interest in pre-air/hotel?",
    "Present travel protection."
  ];
  if(day<=9) return [
    "Confirm the reason for the call and whether a travel agent is involved.",
    "Confirm past-guest status and who is traveling.",
    "Qualify itinerary/date, departure port, and stateroom needs.",
    "Identify eligibility, accessibility, mobility, and dietary needs.",
    "Identify applicable add-ons and present travel protection.",
    "Summarize the guest's priorities before building or servicing the reservation."
  ];
  return [];
}

function callFlowSupportHtml(d,meta){
  const day=+d.trainingDay;
  const isNew=d.reservationWorkflow==="new";
  const fullOutbound=d.department==="Outbound Sales" && isNew;
  const items=fullOutbound?outboundQualificationItems(day):(
    day<=7?[
      "Confirm the guest's reason for calling and what outcome they want today.",
      d.reservationWorkflow==="modify"?"Locate the reservation and complete the required verification before making changes.":"Identify the sailing, stateroom, and guest details needed to build the reservation.",
      "Review status, pricing, due dates, promotions, and any deadlines before saving.",
      "Complete required notes/confirmation and recap the next step."
    ]:day<=9?[
      "Identify the reason for the call and plan the workflow before clicking.",
      "Verify the reservation/guest details and any deadline-sensitive information.",
      "Review the updated result with the guest before saving."
    ]:[]
  );

  if(!items.length){
    return `<div class="independent-callout"><strong>Independent call flow</strong><span>Plan the interaction based on the reason for the call. Use NCLHelp when you need to verify a policy or workflow.</span></div>`;
  }

  const open=day<=6?" open":"";
  return `<details class="trainee-support"${open}>
    <summary><span>Call Flow Support</span><small>${escapeHtml(trainingSupportLabel(day))}</small></summary>
    <div class="support-body">${fullOutbound?`<p class="support-intro">Use these prompts to guide the conversation. Do not read them mechanically—adapt them to what the guest has already told you.</p>`:""}
      <ol class="support-list">${items.map(x=>`<li>${escapeHtml(x)}</li>`).join("")}</ol>
    </div>
  </details>`;
}

function focusStoryDetail(d,meta){
  const n=(d.type||"").toLowerCase();
  if(n.includes("basic reservation")) return "They want a straightforward booking and are trying to balance value with their preferred stateroom. They also want to understand what is due now and what happens if they are not ready to pay immediately.";
  if(n.includes("payments")) return "They are ready to move forward today and want to understand the amount due now, the remaining balance, and the payment options available.";
  if(n.includes("applying fcc")) return "They are ready to move forward and have training credits or discount coupons they want applied correctly before the reservation is finalized.";
  if(n.includes("norwegian")) return "They are following up because they now want travel protection and have questions about deadlines, coverage timing, and how the change affects their reservation.";
  if(n.includes("special request") && !n.includes("ada")) return "They are following up to add stateroom preferences and personal requests that need to be documented correctly for the ship.";
  if(n.includes("price programs")||n.includes("fas")) return "They want to update the reservation with applicable Free at Sea selections and other eligible components, and they want to understand the resulting pricing.";
  if(n.includes("ada")) return "Accessibility is an important part of this vacation. They need an accessible stateroom and have additional dietary or special-request needs that must be documented in the correct place.";
  if(n.includes("infant")||n.includes("guests 3-8")||n.includes("singles")) return "The party size or guest mix requires extra attention to occupancy, guest profiles, deposits, promotions, and stateroom capacity.";
  if(n.includes("multiple")) return "The vacation involves more than one stateroom or reservation. The guests want the bookings coordinated and the rooms kept together whenever availability allows.";
  if(n.includes("ta booking")) return "A travel advisor is arranging the vacation on the guest's behalf and expects the reservation to be built using the applicable agency and promotional workflow.";
  if(n.includes("bundled air")) return "The caller needs the cruise reservation to include air and/or ground transportation, so the applicable air terms and transfer details must be reviewed carefully.";
  if(n.includes("cancel")||n.includes("reinstate")) return "The guest is calling about canceling or restoring an existing reservation and needs clear guidance about status, refunds, and any changes that may result.";
  if(n.includes("price drop")) return "Use this trainer-led case to demonstrate how to evaluate and process a price-drop request using the approved workflow.";
  if(n.includes("cruisetour")||n.includes("land pkg")) return "The guest or travel advisor wants to add a land package or cruisetour to an existing reservation and needs the available options reviewed.";
  if(n.includes("air deviation")||n.includes("air choice")) return "The guest wants to change or select air arrangements and needs the applicable rules, fees, timing, and confirmation expectations explained.";
  if(n.includes("hotel")) return "The guest wants to add a hotel component and needs the available options, timing, and reservation impact reviewed.";
  if(n.includes("amenit")) return "The guest wants to add an onboard amenity. Confirm availability, collect any payment due, and send the correct invoice or confirmation.";
  if(n.includes("dining")||n.includes("ent")||n.includes("spa")) return "The guest is calling to add onboard experiences. Review availability, any immediate payment requirements, and the appropriate confirmations.";
  if(n.includes("cruise first")) return "The guest is following up to purchase or use CruiseFirst and wants to understand the terms and how the credit is applied.";
  if(n.includes("gty")) return "Use this trainer-led case to explain a Guarantee category clearly, including what is and is not guaranteed about the eventual stateroom assignment.";
  return d.curriculumObjective || "Complete the appropriate Seaweb workflow based on the guest's reason for calling.";
}

function customerStoryHtml(d,meta,sailText,guestNames){
  const primary=guestNames[0]||"The guest";
  const companion=guestNames[1]||"";
  if(meta.kind==="demo"){
    return `<p>This is a <strong>trainer-led demonstration</strong>. Use the selected or trainer-provided reservation/sailing to demonstrate the ${escapeHtml(d.type)} workflow.</p>`;
  }
  const names=companion?`<strong>${escapeHtml(primary)}</strong> and <strong>${escapeHtml(companion)}</strong>`:`<strong>${escapeHtml(primary)}</strong>`;
  const modifying=d.reservationWorkflow==="modify";
  if(meta.kind==="ta"){
    return modifying
      ? `<p>A travel advisor is calling on behalf of ${names} to modify an existing training reservation for ${escapeHtml(sailText)}. ${escapeHtml(focusStoryDetail(d,meta))}</p>`
      : `<p>A travel advisor is calling on behalf of ${names} to create a new reservation for ${escapeHtml(sailText)}. ${escapeHtml(focusStoryDetail(d,meta))}</p>`;
  }
  if(modifying){
    const reservation=d.existingReservationNumber?` <strong>${escapeHtml(d.existingReservationNumber)}</strong>`:"";
    const target=d.modificationTarget?` The requested change involves <strong>${escapeHtml(d.modificationTarget)}</strong>.`:"";
    const request=d.modificationRequest?` ${escapeHtml(d.modificationRequest)}`:"";
    const gdpr=d.department==="Guest Services"&&d.gdprCallerType?` Before servicing the reservation, complete GDPR verification for the ${escapeHtml(gdprProfile(d.gdprCallerType)?.label||"selected caller type")}.`:"";
    return `<p>${names} contact Norwegian Cruise Line about existing training reservation${reservation}. They want to <strong>${escapeHtml(modificationLabel(d.modificationType).toLowerCase())}</strong>.${target}${request}${gdpr}</p>`;
  }
  return `<p>${names} are planning ${escapeHtml(sailText)} and want to create a new reservation. ${escapeHtml(focusStoryDetail(d,meta))}</p>`;
}

function promotionSummary(d){
  const parts=[];
  if(d.fas)parts.push("Free at Sea");
  if(d.psc)parts.push("Prepaid Service Charges");
  const lower=(d.curriculumObjective||"").toLowerCase();
  if(!parts.length && (lower.includes("coupon")||lower.includes("cruisenext")||lower.includes("fcc")))parts.push("Training credit/coupon workflow");
  return parts.length?parts.join(" + "):"As requested / verify in Seaweb";
}

function protectionSummary(d){
  return d.travel?"Travel protection included/discussed":"Follow scenario / guest preference";
}

function specialRequestSummary(d){
  const n=(d.type||"").toLowerCase();
  if(n.includes("ada"))return "Accessibility + dietary/special requests";
  if(n.includes("special request"))return "Stateroom preferences / special requests";
  if(n.includes("infant"))return "Infant / family occupancy requests";
  if(n.includes("multiple"))return "Linked rooms / TWITH requests";
  return d.commenting?"Reservation notes required":"As applicable";
}

function atAGlanceHtml(d,meta){
  if(d.reservationWorkflow==="modify"){
    const guestAdd=d.modificationType==="add_guest"
      ? `${d.modificationGuestStatus==="past"?"Past Guest":"New Guest"}${d.modificationGuestStatus==="past"&&d.modificationLatitudes?` • Latitudes # ${d.modificationLatitudes}`:""}`
      : "";
    const cards=[
      ["Reservation",d.existingReservationNumber||"Use prior training reservation","Locate before making changes"],
      ["Primary Guest",d.guest1||"Verify in reservation","Use existing reservation profile"],
      ...(d.department==="Guest Services"?[["GDPR Caller Type",gdprProfile(d.gdprCallerType)?.label||"Select caller type","Verification required before servicing"]]:[]),
      ["Modification",modificationLabel(d.modificationType),d.modificationTarget||"See requested change"],
      ["Payment / Action",d.payment,"Verify any resulting amount due"],
      ["Confirmation",d.confirmation?(d.email||"Send confirmation"):"Not required","Recap the completed change"],
      ["Requested Detail",d.modificationRequest||"Follow the modification instructions","Document the outcome"]
    ];
    if(guestAdd)cards.splice(3,0,["Guest Being Added",guestAdd,d.modificationTarget||"Enter guest name"]);
    return `<div class="glance-grid modification-glance">${cards.map(([label,strong,small])=>`<div class="glance-card"><span>${escapeHtml(label)}</span><strong>${escapeHtml(strong)}</strong><small>${escapeHtml(small)}</small></div>`).join("")}</div>`;
  }

  const s=d.sailing;
  const sailing=s?`${s.ship||"NCL ship"}${s.title?` • ${s.title}`:""}`:"Trainer to provide/verify sailing";
  const stateroom=`${d.category}${d.location!=="Any"?` • ${d.location}`:""}${d.side!=="Any"?` • ${d.side} side`:""}`;
  const mix=getGuestProfileMix(d);
  const guestStatus=d.latitudes
    ? `${mix.pastCount} Past Guest${mix.pastCount===1?'':'s'}${mix.newCount?` • ${mix.newCount} New Guest${mix.newCount===1?'':'s'}`:''}`
    : 'Create or verify profiles';
  return `<div class="glance-grid">
    <div class="glance-card"><span>Guests</span><strong>${d.guestCount} ${d.guestCount===1?"guest":"guests"}</strong><small>${escapeHtml(guestStatus)}</small></div>
    <div class="glance-card"><span>Sailing</span><strong>${escapeHtml(sailing)}</strong><small>${s?.departure?`From ${escapeHtml(s.departure)}`:"Verify exact date/port in Seaweb"}</small></div>
    <div class="glance-card"><span>Stateroom</span><strong>${escapeHtml(stateroom)}</strong><small>Use actual available inventory</small></div>
    <div class="glance-card"><span>Promotions</span><strong>${escapeHtml(promotionSummary(d))}</strong><small>Verify current eligibility and deadlines</small></div>
    <div class="glance-card"><span>Protection</span><strong>${escapeHtml(protectionSummary(d))}</strong><small>Use current approved guidance</small></div>
    <div class="glance-card"><span>Payment / Credit</span><strong>${escapeHtml(d.payment)}</strong><small>${d.cardRequired?"Training card details provided below":"Follow scenario workflow"}</small></div>
    <div class="glance-card wide"><span>Special Requests / Notes</span><strong>${escapeHtml(specialRequestSummary(d))}</strong><small>${d.commenting?"Commenting Tool / reservation notes may be required":"Document only what the scenario requires"}</small></div>
  </div>`;
}
function latitudesScenarioHtml(d){
  if(!d.latitudes)return '';
  const mix=getGuestProfileMix(d);
  const rows=Array.from({length:d.guestCount},(_,i)=>{
    const name=i===0?(d.guest1||'Guest 1'):i===1?(d.guest2||'Guest 2'):`Guest ${i+1}`;
    const isPast=!!mix.flags[i];
    const number=mix.numbers[i]||'';
    return `<div class="latitudes-output-card ${isPast?'past':'new'}"><span>Guest ${i+1} • ${isPast?'PAST GUEST':'NEW GUEST'}</span><strong>${escapeHtml(name)}</strong><small>${isPast?(number?`Latitudes #: ${escapeHtml(number)}`:'Latitudes number not entered — verify in Seaweb'):'Create a new training guest profile in Seaweb.'}</small></div>`;
  }).join('');
  return `<section class="scenario-section latitudes-output-section"><div class="section-label">GUEST STATUS / LATITUDES</div><h3>Past & New Guests</h3><p class="latitudes-output-intro">Use the status shown for each traveler. Only guests marked Past Guest should be located by Latitudes number.</p><div class="latitudes-output-grid">${rows}</div></section>`;
}

function fullTaskList(d,meta){
  const name=(d.type||"").toLowerCase();
  const tasks=[];
  if(d.reservationWorkflow==="modify"){
    if(d.department==="Guest Services"){
      const profile=gdprProfile(d.gdprCallerType);
      tasks.push(profile
        ? `Complete GDPR verification for the ${profile.label} before servicing the reservation. Ask the primary verification items first. Reservation Number is always mandatory.${["travel_agent","ta_group"].includes(d.gdprCallerType)?" The agency identifier (ABTA #, Agency ID, or Phone #) is also mandatory to continue under the Travel Agent path.":""}`
        : "Complete required Guest Services GDPR verification before servicing the reservation.");
      const action=gdprActionText(d);
      if(action)tasks.push(action);
    }
    tasks.push(`Locate training reservation ${d.existingReservationNumber||"(trainer-provided reservation)"} and complete required verification before making changes.`);
    tasks.push(modificationTaskText(d));
    if(d.modificationType==="add_guest" && d.modificationGuestStatus==="past"){
      tasks.push(d.modificationLatitudes?`Use training Latitudes # ${d.modificationLatitudes} to locate the guest being added.`:"Locate the Past Guest profile and verify the Latitudes number before adding the guest.");
    }
    if(["stateroom","add_guest","remove_guest","fas","travel_protection","psc","payment","credit_coupon","air_transfer","hotel_cruisetour","cancel_reinstate"].includes(d.modificationType)){
      tasks.push("Review all resulting pricing, payment, promotion, capacity, status, and deadline changes before saving.");
    }
    if(["Minimum Deposit","Initial Deposit","Full Payment","Amenity Payment"].includes(d.payment))tasks.push("Process the required payment using the provided training card.");
    if(d.commenting)tasks.push("Enter the required reservation comments using the Commenting Tool.");
    if(d.confirmation)tasks.push(`Send the updated confirmation to ${d.email||"training123@ncl.com"}.`);
    tasks.push("Recap the completed modification and next steps with the guest before ending the interaction.");
    return [...new Set(tasks)];
  }else{
    tasks.push("Search for and select a sailing that meets the guest's stated requirements, then begin a new reservation.");
  }

  if(name.includes("ada")) tasks.push("Select a qualifying ADA / accessible stateroom; verify actual capacity and available location before promising a preference.");
  else if(!name.includes("price drop")&&!name.includes("cancel")&&!name.includes("reinstate")) tasks.push("Review available staterooms and select the best match for the guest's preferences.");

  const guestMix=getGuestProfileMix(d);
  tasks.push(d.latitudes?(guestMix.pastCount&&guestMix.newCount?"Follow the individual guest statuses: locate each Past Guest using the provided training Latitudes number and create each New Guest profile, then confirm legal names and dates of birth.":guestMix.pastCount?"Locate and verify the Past Guest profile(s) using the provided training Latitudes number(s), then confirm legal names and dates of birth.":"Create the New Guest profile(s) shown in the scenario and confirm legal names and dates of birth."):"Create or verify all required guest profiles using the training details.");

  if(d.fas||name.includes("price programs"))tasks.push("Review and apply the applicable Free at Sea selections in the correct order.");
  if(d.psc)tasks.push("Add prepaid service charges where requested and verify the updated pricing.");
  if(d.travel||name.includes("norwegian"))tasks.push("Add or discuss the applicable travel protection and explain the relevant timing/deadline.");
  if(name.includes("fcc")||d.payment==="FCC / CruiseNext"||name.includes("cruise first"))tasks.push("Apply the applicable training credit/coupon using the required offer/status sequence, then review the updated pricing before saving.");
  if(name.includes("special request")||name.includes("ada")||name.includes("infant")||name.includes("multiple"))tasks.push("Enter special/accessibility/dietary requests in the correct Seaweb location and add any required comments.");
  if(name.includes("multiple"))tasks.push("Link related reservations with TWITH when required and verify room relationship/authorized-person notes.");
  if(name.includes("air")||name.includes("hotel")||name.includes("cruisetour")||name.includes("land pkg"))tasks.push("Review the applicable air/land/hotel terms, timing, deposits, transfers, and confirmation expectations.");
  if(name.includes("cancel")||name.includes("reinstate"))tasks.push("Evaluate final-payment status and complete the cancellation/reinstatement workflow before quoting any refund or pricing change.");
  if(name.includes("amenit")||name.includes("dining")||name.includes("spa"))tasks.push("Confirm availability and collect any immediate payment required for the selected onboard item.");

  if(["Minimum Deposit","Initial Deposit","Full Payment","Amenity Payment"].includes(d.payment))tasks.push("Review the amount due and process the required payment using the provided training card.");
  else if(d.payment==="Offer / Hold only")tasks.push("Place the reservation in Offer/Hold status and explain the deposit deadline shown in Seaweb.");

  if(d.commenting)tasks.push("Recap and enter the required reservation comments using the Commenting Tool.");
  if(d.confirmation)tasks.push(`Send the appropriate confirmation to ${d.email||"training123@ncl.com"}.`);
  tasks.push("Review the completed reservation or changes with the guest before ending the interaction.");
  return [...new Set(tasks)];
}

function traineeTaskList(d,meta){
  const full=fullTaskList(d,meta);
  const day=+d.trainingDay;
  if(day<=7)return full;
  if(day<=9){
    const keep=[];
    if(full[0])keep.push(full[0]);
    if(full[1])keep.push(full[1]);
    const priority=full.filter(x=>/Free at Sea|travel protection|credit|coupon|special|accessib|TWITH|air|land|hotel|cancel|payment|Commenting Tool/i.test(x));
    keep.push(...priority.slice(0,4));
    keep.push(full[full.length-1]);
    return [...new Set(keep)];
  }
  const advanced=[
    "Plan and complete the appropriate Seaweb workflow based on the guest's reason for calling.",
    ...full.filter(x=>/credit|coupon|special|accessib|TWITH|air|land|hotel|cancel|payment/i.test(x)).slice(0,2),
    "Review any pricing, status, promotion, or deadline changes with the guest before saving.",
    d.commenting?"Notate the reservation appropriately and complete the required confirmation.":"Complete the required confirmation or follow-up action.",
    "Recap the outcome and confirm the guest understands what happens next."
  ];
  return [...new Set(advanced)];
}

function checklistHtml(items){
  return `<ul class="task-checklist">${items.map(x=>`<li><span class="check-box" aria-hidden="true"></span><span>${escapeHtml(x)}</span></li>`).join("")}</ul>`;
}

function beforeEndItems(d){
  const items=["Recap the reservation or changes in plain language."];
  if(!["No Payment / Service Only","Refund / Reinstate"].includes(d.payment))items.push("Confirm the amount due now and/or next payment deadline shown in Seaweb.");
  if(d.confirmation)items.push("Confirm the guest knows where the updated confirmation will be sent.");
  if(d.commenting)items.push("Make sure required reservation notes/comments have been saved.");
  items.push("Ask the customer-satisfaction question and use the Norwegian Cruise Line branded closing.");
  return items;
}

function prerequisiteSkills(d,meta){
  const day=+d.trainingDay;
  const base=day===6?[
    "Seaweb navigation and sailing search",
    "Guest profile / Latitudes lookup",
    "Basic stateroom-category awareness",
    "Advertised-pricing and reservation-status basics"
  ]:day===7?[
    "Core booking workflow",
    "Payment/deposit basics",
    "Reservation status and due-date review",
    "GDPR / verification for follow-up calls"
  ]:day<=9?[
    "Core booking and servicing workflow",
    "Reservation comments / confirmation",
    "Promotion and travel-protection basics",
    "Guest profile and occupancy fundamentals"
  ]:[
    "Independent Seaweb navigation",
    "Final-payment and reservation-status awareness",
    "Promotion / pricing change review",
    "Accurate comments, recap and confirmation"
  ];
  if(d.department==="Outbound Sales")base.unshift("Outbound qualification and call control");
  return [...new Set(base)];
}

function commonMistakes(d,meta){
  const n=(d.type||"").toLowerCase();
  const items=[
    "Saving before all guest names and dates of birth are verified.",
    "Quoting or promising something before checking current Seaweb availability or policy.",
    "Missing the final recap, required confirmation, or reservation comments."
  ];
  if(n.includes("ada"))items.unshift("Selecting a standard stateroom instead of an ADA / accessible category.","Documenting an actionable accessibility request in the wrong Seaweb area.","Promising a side/location before checking accessible inventory.");
  if(n.includes("fcc")||n.includes("price programs"))items.unshift("Applying a coupon/credit before the reservation is in the required status.","Failing to re-quote the reservation after the credit or promotion is applied.");
  if(n.includes("payments"))items.unshift("Processing the wrong amount due or skipping the final-payment-date review.");
  if(n.includes("multiple"))items.unshift("Forgetting TWITH/linked-reservation steps or Authorized Person notation.");
  if(n.includes("norwegian"))items.unshift("Giving a travel-protection deadline without checking final-payment timing.");
  if(n.includes("air"))items.unshift("Missing arrival/deviation/transfer terms or confirmation timing.");
  if(n.includes("cancel")||n.includes("reinstate"))items.unshift("Canceling before offering the applicable alternative or checking final-payment status.","Assuming original fare/category/promotions will automatically return on reinstatement.");
  return [...new Set(items)];
}

function expectedCompletionState(d,meta){
  if(d.payment==="Offer / Hold only")return "Offer / Hold — verify the first deposit deadline before ending the call.";
  if(["Minimum Deposit","Initial Deposit","Full Payment","Amenity Payment"].includes(d.payment))return "Booked / active after the required payment processes successfully; verify the actual Seaweb status.";
  if(d.payment==="FCC / CruiseNext")return "Use Offer/status sequencing while applying credits/coupons; verify the final saved status after the exercise.";
  if(d.payment==="Refund / Reinstate")return "Cancellation step: canceled. Reinstate step: active/booked again if reinstatement succeeds; verify any fare/category/promotion changes.";
  if(d.reservationWorkflow==="modify")return "Existing reservation remains active unless the requested servicing action changes its status.";
  if(meta.kind==="demo")return "Trainer-defined demonstration state.";
  return "Verify the expected final reservation status in Seaweb before marking the exercise complete.";
}

function trainerGuideHtml(d,meta,approachText,s){
  const workflow=fullTaskList(d,meta);
  const prereqs=prerequisiteSkills(d,meta);
  const mistakes=commonMistakes(d,meta);
  const considerations=focusConsiderations(d);
  return `<section class="trainer-section trainer-guide">
    <div class="trainer-guide-head"><div><span class="trainer-kicker">TRAINER VIEW ONLY</span><h3>Trainer Guide</h3></div><span class="status-badge neutral">${escapeHtml(trainingSupportLabel(+d.trainingDay))} support</span></div>
    <div class="trainer-info-grid">
      <div class="trainer-info-card"><span>Learning objective</span><strong>${escapeHtml(d.curriculumObjective||"Use the selected curriculum focus.")}</strong></div>
      <div class="trainer-info-card"><span>Scenario approach</span><strong>${escapeHtml(approachText)}</strong></div>
      <div class="trainer-info-card"><span>Expected completion state</span><strong>${escapeHtml(expectedCompletionState(d,meta))}</strong></div>
      <div class="trainer-info-card"><span>Prerequisite skills</span><ul>${prereqs.map(x=>`<li>${escapeHtml(x)}</li>`).join("")}</ul></div>
    </div>
    <h4>Expected workflow</h4>
    <ol class="trainer-workflow">${workflow.map(x=>`<li>${escapeHtml(x)}</li>`).join("")}</ol>
    <h4>Common mistakes to watch for</h4>
    <ul>${mistakes.map(x=>`<li>${escapeHtml(x)}</li>`).join("")}</ul>
    <h4>Trainer check / answer guide</h4>
    <ul>${considerations.map(x=>`<li>${escapeHtml(x)}</li>`).join("")}</ul>
    ${d.trainerNotes?`<h4>Trainer notes</h4><p>${escapeHtml(d.trainerNotes)}</p>`:""}
    ${s?`<h4>Public source metadata</h4><p><span class="verified">Verified from NCL.com</span><br>${escapeHtml(s.sourceUrl||"")}<br>Retrieved ${new Date(s.retrievedAt||Date.now()).toLocaleString()}</p>`:""}
  </section>`;
}

function referenceDetailsHtml(d,agencyDisplay,pricing,paymentInstruction,addOns,guestInfoItems){
  if(d.reservationWorkflow==="modify"){
    const addedGuest=d.modificationType==="add_guest"
      ? `<li><strong>Guest Being Added:</strong> ${escapeHtml(d.modificationTarget||"Trainer to provide")} • ${escapeHtml(d.modificationGuestStatus==="past"?"Past Guest":"New Guest")}${d.modificationGuestStatus==="past"&&d.modificationLatitudes?` • Latitudes # ${escapeHtml(d.modificationLatitudes)}`:""}</li>`
      : "";
    const stateroom=d.modificationType==="stateroom"
      ? `<h4>Requested Stateroom Change</h4><p>${escapeHtml(d.category)}${d.location!=="Any"?`, ${escapeHtml(d.location)} location`:""}${d.side!=="Any"?`, ${escapeHtml(d.side)} side preference`:""}. Review actual inventory and reprice the reservation before confirming the change.</p>${pricing}`
      : "";
    return `<section class="scenario-section details-section modification-reference">
      <div class="section-label">REFERENCE DETAILS</div>
      <h3>Existing Reservation Modification</h3>
      <ul class="detail-list">
        <li><strong>Department:</strong> ${escapeHtml(d.department)}</li>
        <li><strong>Reservation:</strong> ${escapeHtml(d.existingReservationNumber||"Use prior training reservation")}</li>
        <li><strong>Primary Guest:</strong> ${escapeHtml(d.guest1||"Verify in reservation")}</li>
        <li><strong>Agency:</strong> ${escapeHtml(agencyDisplay)}</li>
        <li><strong>Modification:</strong> ${escapeHtml(modificationLabel(d.modificationType))}</li>
        ${d.department==="Guest Services"?`<li><strong>GDPR Caller Type:</strong> ${escapeHtml(gdprProfile(d.gdprCallerType)?.label||"Not selected")}</li>`:""}
        ${d.gdprCallerType==="direct_group"?`<li><strong>Direct Group Route:</strong> ${escapeHtml(directGroupRoute(d.directGroupMarket).label)} • SOT #${escapeHtml(directGroupRoute(d.directGroupMarket).sot)}</li>`:""}
        ${d.modificationTarget?`<li><strong>Guest / Item:</strong> ${escapeHtml(d.modificationTarget)}</li>`:""}
        ${d.modificationRequest?`<li><strong>Requested Change:</strong> ${escapeHtml(d.modificationRequest)}</li>`:""}
        ${addedGuest}
      </ul>
      ${stateroom}
      <h4>Payment / Booking Action</h4>
      <p>${escapeHtml(paymentInstruction)}</p>
      ${addOns.length?`<h4>Additional Components</h4><p>${escapeHtml(addOns.join(" • "))}</p>`:""}
    </section>`;
  }

  const s=d.sailing;
  return `<section class="scenario-section details-section">
      <div class="section-label">REFERENCE DETAILS</div>
      <h3>Sailing / Reservation Details</h3>
      <ul class="detail-list">
        <li><strong>Department:</strong> ${escapeHtml(d.department)}</li>
        <li><strong>Reservation Workflow:</strong> Create New Reservation</li>
        <li><strong>Agency:</strong> ${escapeHtml(agencyDisplay)}</li>
        ${s?`<li><strong>Ship:</strong> ${escapeHtml(s.ship||"Verify")}</li><li><strong>Itinerary:</strong> ${escapeHtml(s.title||"Verify")}</li><li><strong>Sailing:</strong> ${escapeHtml((s.sailingMonths||[]).join(", ")||"Verify exact date in Seaweb")}</li><li><strong>Departure:</strong> ${escapeHtml(s.departure||"Verify")}</li><li><strong>Duration:</strong> ${escapeHtml(String(s.duration||"Verify"))}${s.duration?" days":""}</li>`:`<li><strong>Real Sailing:</strong> Not selected — trainer must provide/verify sailing details.</li>`}
        <li><strong>Total Guests:</strong> ${d.guestCount}</li>
      </ul>

      <h4>Category & Stateroom</h4>
      <p>${escapeHtml(d.category)}${d.location!=="Any"?`, ${escapeHtml(d.location)} location`:""}${d.side!=="Any"?`, ${escapeHtml(d.side)} side preference`:""}. Review actual available staterooms in Seaweb before selecting.</p>
      ${pricing}

      <h4>Guest Information</h4>
      <ul class="detail-list">${guestInfoItems}</ul>

      <h4>Payment / Booking Action</h4>
      <p>${escapeHtml(paymentInstruction)}</p>
      ${addOns.length?`<h4>Additional Components</h4><p>${escapeHtml(addOns.join(" • "))}</p>`:""}
    </section>`;
}

function clearValidationDisplay(){
  state.validation=[];
  $("validatorSummary").innerHTML="";
  $("validatorResults").innerHTML="";
}

function resetScenarioForm(){
  state.currentScenario=null;
  state.selectedSailing=null;
  adaptiveExportCache={key:null,mode:null,blob:null};
  sharePageCache={key:null,blobs:null};

  $("department").value="Guest Services";
  $("reservationWorkflow").value="new";
  $("trainingDay").value="6";
  $("scenarioApproach").value="variation";
  $("difficulty").value="Beginner";
  $("guestCount").value="2";
  $("agency").value="5";
  $("guest1").value="";
  $("guest2").value="";
  $("category").value="Balcony";
  $("locationPref").value="Any";
  $("sidePref").value="Any";
  $("paymentAction").value="No Payment / Service Only";
  $("pricing").value="";
  $("confirmationEmail").value="";
  $("existingReservationNumber").value="";
  $("modificationType").value="special_request";
  $("modificationTarget").value="";
  $("modificationRequest").value="";
  $("modificationGuestStatus").value="new";
  $("modificationLatitudes").value="";
  $("gdprCallerType").value="";
  $("directGroupMarket").value="direct_groups_sot";
  $("trainerNotes").value="";

  $("latitudesToggle").checked=false;
  $("commentToggle").checked=false;
  $("confirmToggle").checked=false;
  $("fasToggle").checked=false;
  $("travelToggle").checked=false;
  $("pscToggle").checked=false;

  $("trainingCardProfile").value="standardSesame";
  renderTrainingCard();

  updateDepartmentUI();
  // updateDepartmentUI selects the first focus so clear it afterward.
  $("scenarioType").selectedIndex=-1;
  $("curriculumNote").innerHTML="";
  updateWorkflowUI(false);
  refreshLatitudesPanel();
  refreshTrainingCardPanel();

  renderSelectedSailing();
  $("scenarioOutput").innerHTML='<p class="empty-copy">Start a new scenario by choosing your options, then click <strong>Generate Scenario</strong>.</p>';
  $("scenarioStatus").className="status-badge neutral";
  $("scenarioStatus").textContent="Draft";
  clearValidationDisplay();
  setMode("trainer");
  flash("Scenario cleared. You can start a brand-new exercise.");
  $("department").focus();
}

function generateScenario(){
  if(!$("scenarioType").value){
    alert("Choose a Scenario Focus before generating the scenario.");
    $("scenarioType").focus();
    return;
  }
  const d=scenarioData();
  const meta=currentFocusMeta()||{};
  const guestNames=[d.guest1,d.guest2].filter(Boolean);
  const primary=guestNames[0]||"the guest";
  const s=d.sailing;
  const sailText=s ? `${s.duration?`${s.duration}-day `:""}${s.title||"cruise"} on ${s.ship||"Norwegian Cruise Line"}${s.departure?`, departing from ${s.departure}`:""}${s.sailingMonths?.length?` during ${s.sailingMonths.join(", ")}`:""}` : "a trainer-selected Norwegian Cruise Line sailing";

  const addOns=[];
  if(d.fas)addOns.push("Free at Sea");
  if(d.travel)addOns.push("Travel Protection");
  if(d.psc)addOns.push("Prepaid Service Charges");

  const pricing=d.pricing?`<div class="instruction-strip"><strong>Pricing practice</strong><span>Quote the trainer-entered advertised-pricing practice amount: ${escapeHtml(d.pricing)}. Reconfirm current Seaweb pricing before class.</span></div>`:
    `<div class="instruction-strip"><strong>Pricing task</strong><span>Review the current Seaweb pricing with the guest. Do not use a fabricated amount; quote what Seaweb displays at the time of the exercise.</span></div>`;

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
    variation:"Trainer-generated variation of the current department/day skill; preserve the required workflow while varying guests, sailing, stateroom, or preferences.",
    new:"New practice case built around the same department/day learning objective."
  }[d.approach];

  const cardHtml=d.cardRequired&&d.card?`<section class="scenario-section payment-section"><div class="section-label">TRAINING PAYMENT</div><h3>Training Credit Card Information</h3>
    <div class="scenario-payment-card"><div class="training-only-label">TRAINING / TEST DATA ONLY</div>
      <p><strong>Card #:</strong> ${escapeHtml(d.card.number)}<br><strong>Expiration:</strong> ${escapeHtml(d.card.expiration)}<br><strong>CCV:</strong> ${escapeHtml(d.card.ccv)}<br><strong>Billing Address:</strong> ${escapeHtml(d.card.address)}</p>
    </div></section>`:"";

  const guestMix=getGuestProfileMix(d);
  const guestLabel=i=>i===0?(d.guest1||"Guest 1"):i===1?(d.guest2||"Guest 2"):`Guest ${i+1}`;
  const guestInfoItems=Array.from({length:d.guestCount},(_,i)=>{
    const isPast=!!guestMix.flags[i];
    const number=guestMix.numbers[i]||"";
    const status=d.latitudes?(isPast?`Past Guest${number?` • Latitudes #: ${escapeHtml(number)}`:" • verify Latitudes number in Seaweb"}`:"New Guest • create a new training guest profile in Seaweb"):"Verify profile";
    return `<li><strong>Guest ${i+1}:</strong> ${escapeHtml(guestLabel(i))} — ${status}</li>`;
  }).join("");
  const tasks=traineeTaskList(d,meta);
  const agencyDisplay=d.department==="Outbound Sales"?`${d.market} | Agency ${d.agency}`:`Agency ${d.agency}`;

  const html=`
    <div class="scenario-meta-row"><span class="chip">${escapeHtml(d.department)}</span><span class="chip">${escapeHtml(d.reservationWorkflow==="modify"?"Modify Existing Reservation":"Create New Reservation")}</span><span class="chip">${escapeHtml(d.difficulty)}</span><span class="chip support-chip">${escapeHtml(trainingSupportLabel(+d.trainingDay))} support</span></div>
    <h2>Seaweb Scenario – ${escapeHtml(d.type)}</h2>
    <p class="scenario-intro">Complete this scenario independently using Seaweb. Use the <strong>Seaweb User Guide</strong> in <strong>NCLHelp</strong> whenever you need step-by-step guidance. When the exercise is complete, post the reservation number in the class chat.</p>

    <section class="scenario-section call-section">
      <div class="section-label">YOUR CALL</div>
      <h3>Customer Scenario</h3>
      ${customerStoryHtml(d,meta,sailText,guestNames)}
    </section>

    ${gdprScenarioHtml(d)}

    <section class="scenario-section">
      <div class="section-label">GUEST REQUEST</div>
      <h3>At a Glance</h3>
      ${atAGlanceHtml(d,meta)}
    </section>

    ${latitudesScenarioHtml(d)}

    <section class="scenario-section">
      <div class="section-label">YOUR WORK</div>
      <h3>Complete These Tasks</h3>
      ${checklistHtml(tasks)}
    </section>

    ${callFlowSupportHtml(d,meta)}

    ${referenceDetailsHtml(d,agencyDisplay,pricing,paymentInstruction,addOns,guestInfoItems)}
    ${cardHtml}

    <section class="scenario-section end-call-section">
      <div class="section-label">BEFORE YOU END THE CALL</div>
      <h3>Final Check</h3>
      ${checklistHtml(beforeEndItems(d))}
      <div class="closing-card"><strong>Branded closing</strong><span>“Is there anything else I can help you with today, ${escapeHtml(primary.split(" ")[0]||"")}?”</span><span>“Thank you for choosing Norwegian Cruise Line.”</span></div>
    </section>

    <details class="knowledge-check trainee-support">
      <summary><span>After Completion: Knowledge Check</span><small>Open after you finish in Seaweb</small></summary>
      <div class="support-body">
        <ul>${focusConsiderations(d).map(x=>`<li>${escapeHtml(x)}</li>`).join("")}</ul>
      </div>
    </details>

    ${trainerGuideHtml(d,meta,approachText,s)}`;

  $("scenarioOutput").innerHTML=html;
  d.html=html;
  state.currentScenario=d;
  runValidator();
  $("scenarioStatus").textContent=blockingErrors()?"Needs Review":"Ready for Trainee";
  $("scenarioStatus").className="status-badge "+(blockingErrors()?"review":"ready");
}
$("generateBtn").onclick=generateScenario;
$("clearScenarioBtn").onclick=()=>{if(confirm("Clear the current scenario and start a brand-new one? Unsaved changes will be lost."))resetScenarioForm();};

function runValidator(){
  const d=state.currentScenario||scenarioData(), s=d.sailing, checks=[];
  const add=(severity,title,detail)=>checks.push({severity,title,detail});
  const meta=currentFocusMeta()||{};

  if(!d.department)add("error","Department missing","Choose Guest Services or Outbound Sales.");
  else add("passed","Department selected",`${d.department} • ${d.type}`);
  add("passed","Reservation workflow selected",d.reservationWorkflow==="modify"?"Modify Existing Reservation":"Create New Reservation");
  if(!d.guest1 && meta.kind!=="demo")add("error","Missing primary guest","Guest 1 is required for trainee scenarios.");
  else if(d.guest1)add("passed","Primary guest present",d.guest1);
  if(d.guestCount>1 && !d.guest2 && meta.kind!=="demo")add("warning","Guest 2 is blank","The scenario has multiple guests selected. Guest 2 should normally be named or intentionally created by the trainee.");
  if(d.latitudes){
    const mix=getGuestProfileMix(d);
    const missing=mix.flags.reduce((list,isPast,i)=>{if(isPast&&!mix.numbers[i])list.push(i+1);return list;},[]);
    if(missing.length)add("warning","Past Guest Latitudes number missing",`Guest ${missing.join(", Guest ")} ${missing.length===1?"is":"are"} marked Past Guest but missing a training Latitudes number.`);
    else add("passed","Guest status configured",`${mix.pastCount} Past Guest${mix.pastCount===1?"":"s"} • ${mix.newCount} New Guest${mix.newCount===1?"":"s"}.`);
  }

  if(d.department==="Guest Services"){
    if(String(d.agency)!=="5")add("error","Guest Services agency mismatch","Current Guest Services scenarios use Agency 5.");
    else add("passed","Guest Services agency","Agency 5 is selected.");
  }else if(d.department==="Outbound Sales"){
    if(!d.agency)add("error","Outbound agency missing","Choose the market/currency agency before assigning the scenario.");
    else add("passed","Outbound market agency selected",`${d.market}`);
  }

  if(d.reservationWorkflow==="modify"){
    if(d.existingReservationNumber)add("passed","Existing reservation identified",d.existingReservationNumber);
    else add("warning","Training reservation number not entered","Enter the previously created training reservation number or provide it to the trainee separately.");

    if(d.department==="Guest Services"){
      const profile=gdprProfile(d.gdprCallerType);
      if(!profile)add("error","GDPR caller type required","Guest Services modifications must identify the caller / reservation type so the correct GDPR verification can be completed.");
      else add("passed","GDPR verification required",`${profile.label} • Ask primary items first • Reservation Number always mandatory${["travel_agent","ta_group"].includes(d.gdprCallerType)?" • Agency identifier mandatory for Travel Agent path":""}`);
      if(d.gdprCallerType==="pcc_guest")add("info","PCC Guest handling included",pccActionText(d));
      if(d.gdprCallerType==="direct_group")add("info","Direct Group transfer included",directGroupActionText(d));
    }

    add("passed","Modification selected",modificationLabel(d.modificationType));
    if(d.modificationType==="add_guest" && d.modificationGuestStatus==="past" && !d.modificationLatitudes){
      add("warning","Past Guest being added is missing Latitudes number","Enter the training Latitudes number or instruct the trainee to verify it in Seaweb.");
    }
  }else{
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
  }

  if(/\bada\b|accessible/i.test(`${d.type} ${d.curriculumObjective}`)){
    if(d.category!=="ADA / Accessible")add("error","ADA category mismatch","This training focus requires an ADA / accessible stateroom category. Do not assign a standard Balcony/Oceanview/Inside category.");
    else add("passed","Accessible category aligned","ADA / Accessible is selected and location/side should remain availability-driven.");
  }

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

function ensureScenarioReady(){
  if(!state.currentScenario) generateScenario();
  return !!state.currentScenario;
}

function makeViewShareClone(includeTrainer=state.mode==="trainer"){
  const source=$("scenarioOutput");
  const clone=source.cloneNode(true);

  if(!includeTrainer){
    clone.querySelectorAll(".trainer-section").forEach(el=>el.remove());
  }

  // Convert collapsible sections into static content for exported files.
  clone.querySelectorAll("details").forEach(details=>{
    const replacement=document.createElement("section");
    replacement.className="share-expanded-section";

    const summary=details.querySelector("summary");
    if(summary){
      const heading=document.createElement("div");
      heading.className="share-expanded-heading";
      const main=summary.querySelector("span")?.textContent || summary.textContent || "Additional Information";
      heading.textContent=main.trim();
      replacement.appendChild(heading);
    }

    [...details.children].forEach(child=>{
      if(child.tagName!=="SUMMARY") replacement.appendChild(child.cloneNode(true));
    });
    details.replaceWith(replacement);
  });

  clone.querySelectorAll("button,input,select,textarea").forEach(el=>el.remove());
  clone.removeAttribute("id");
  clone.classList.add("adaptive-export",includeTrainer?"trainer-export":"trainee-export");

  const d=state.currentScenario||scenarioData();
  const header=document.createElement("div");
  header.className="adaptive-export-header";
  header.innerHTML=`
    <div>
      <span class="adaptive-export-kicker">SEAweb Training Scenario</span>
      <strong>${escapeHtml(d.type||"Scenario")}</strong>
      <small>${escapeHtml(d.department||"")} • ${escapeHtml(d.reservationWorkflow==="modify"?"Modify Existing Reservation":"Create New Reservation")}</small>
    </div>
    <span class="adaptive-export-mode">${includeTrainer?"TRAINER VIEW":"TRAINEE VIEW"}</span>`;
  clone.prepend(header);

  return clone;
}

function makeTraineeShareClone(){
  return makeViewShareClone(false);
}

const shareStyleProps=[
  "display","position","box-sizing","width","max-width","min-width",
  "margin-top","margin-right","margin-bottom","margin-left",
  "padding-top","padding-right","padding-bottom","padding-left",
  "font-family","font-size","font-weight","font-style","line-height",
  "letter-spacing","text-transform","text-align","color","background-color",
  "border-top","border-right","border-bottom","border-left","border-radius",
  "list-style-type","list-style-position","column-count","column-gap",
  "grid-template-columns","grid-column","gap","align-items","justify-content",
  "flex-direction","flex-wrap","flex","white-space"
];

function inlineComputedStyles(root){
  const nodes=[root,...root.querySelectorAll("*")];
  nodes.forEach(el=>{
    const cs=getComputedStyle(el);
    const inline=[];
    shareStyleProps.forEach(prop=>{
      const value=cs.getPropertyValue(prop);
      if(value && value!=="normal" && value!=="auto" && value!=="none"){
        inline.push(`${prop}:${value}`);
      }
    });
    if(el.classList.contains("trainer-section")) inline.push("display:none");
    el.setAttribute("style",inline.join(";"));
  });
}

function makeOffscreenShareHost(){
  const host=document.createElement("div");
  host.className="share-render-host";
  host.style.cssText=[
    "position:fixed",
    "left:-12000px",
    "top:0",
    "width:900px",
    "padding:0",
    "margin:0",
    "background:#ffffff",
    "z-index:-9999",
    "pointer-events:none"
  ].join(";");
  document.body.appendChild(host);
  return host;
}

function canvasBlob(canvas){
  return new Promise((resolve,reject)=>{
    canvas.toBlob(blob=>blob?resolve(blob):reject(new Error("Could not create card image.")),"image/png");
  });
}

function escapeXml(value=""){
  return String(value).replace(/[<>&'"]/g,ch=>({
    "<":"&lt;",">":"&gt;","&":"&amp;","'":"&apos;",'"':"&quot;"
  }[ch]));
}

async function renderShareHtmlToPng(html,mode="full"){
  const response=await fetch("/api/share-card",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({html})
  });

  if(!response.ok){
    let message=`Image renderer returned HTTP ${response.status}.`;
    try{
      const data=await response.json();
      if(data?.error) message=data.error;
      if(data?.detail) message+=` ${data.detail}`;
    }catch(_){
      try{
        const text=await response.text();
        if(text) message+=` ${text.slice(0,220)}`;
      }catch(__){}
    }
    throw new Error(message);
  }

  const blob=await response.blob();
  if(!blob || !blob.size) throw new Error("The image renderer returned an empty PNG.");
  return blob.type==="image/png" ? blob : new Blob([blob],{type:"image/png"});
}

async function renderShareCardToPng(){
  const clone=makeViewShareClone(state.mode==="trainer");
  return renderShareHtmlToPng(clone.outerHTML,"full");
}



let adaptiveExportCache={key:null,mode:null,blob:null};

function adaptiveExportFilename(ext){
  const d=state.currentScenario||scenarioData();
  const dept=(d.department||"Seaweb").replace(/[^A-Za-z0-9]+/g,"-").replace(/^-|-$/g,"");
  const focus=(d.type||"Scenario").replace(/[^A-Za-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,48);
  const view=state.mode==="trainer"?"Trainer":"Trainee";
  return `${dept}-${focus}-${view}.${ext}`;
}

async function cropAdaptiveExportBlob(blob){
  const img=await loadImageFromBlob(blob);
  const width=img.naturalWidth||img.width;
  const height=img.naturalHeight||img.height;

  const canvas=document.createElement("canvas");
  canvas.width=width;
  canvas.height=height;
  const ctx=canvas.getContext("2d",{willReadFrequently:true});
  ctx.drawImage(img,0,0);

  // Browser Run screenshots the full viewport even when the scenario is shorter.
  // The page outside the export card uses the NCL sand background (#EBE7DF).
  // Detect the real white export-card bounds and crop away that unused viewport.
  const data=ctx.getImageData(0,0,width,height).data;
  const sand=[235,231,223];
  const differsFromSand=(x,y)=>{
    const i=(y*width+x)*4;
    const r=data[i],g=data[i+1],b=data[i+2],a=data[i+3];
    if(a<220)return false;
    return Math.abs(r-sand[0])+Math.abs(g-sand[1])+Math.abs(b-sand[2])>18;
  };

  // The export occupies nearly the full viewport width. Scan several columns so
  // colored/white scenario content reliably identifies the top and bottom bounds.
  const sampleXs=[
    Math.max(0,Math.round(width*0.12)),
    Math.max(0,Math.round(width*0.35)),
    Math.max(0,Math.round(width*0.50)),
    Math.max(0,Math.round(width*0.65)),
    Math.max(0,Math.round(width*0.88))
  ];

  let top=0;
  let bottom=height-1;

  outerTop:
  for(let y=0;y<height;y++){
    for(const x of sampleXs){
      if(differsFromSand(x,y)){top=y;break outerTop;}
    }
  }

  outerBottom:
  for(let y=height-1;y>=top;y--){
    for(const x of sampleXs){
      if(differsFromSand(x,y)){bottom=y;break outerBottom;}
    }
  }

  // The body uses 20px horizontal padding. Remove it too so the resulting PNG
  // is all scenario and no artificial surrounding canvas.
  const left=20;
  const right=Math.max(left+1,width-20);
  const pad=2;
  top=Math.max(0,top-pad);
  bottom=Math.min(height-1,bottom+pad);

  const cropWidth=Math.max(1,right-left);
  const cropHeight=Math.max(1,bottom-top+1);

  const out=document.createElement("canvas");
  out.width=cropWidth;
  out.height=cropHeight;
  const octx=out.getContext("2d");
  octx.fillStyle="#ffffff";
  octx.fillRect(0,0,cropWidth,cropHeight);
  octx.drawImage(canvas,left,top,cropWidth,cropHeight,0,0,cropWidth,cropHeight);

  return await new Promise((resolve,reject)=>{
    out.toBlob(
      b=>b?resolve(b):reject(new Error("Could not prepare the tightly cropped export.")),
      "image/png"
    );
  });
}

async function getAdaptiveCurrentViewPng(){
  const key=`${currentSharePageCacheKey()}|adaptive-v192`;
  const mode=state.mode;
  if(adaptiveExportCache.key===key && adaptiveExportCache.mode===mode && adaptiveExportCache.blob){
    return adaptiveExportCache.blob;
  }

  const clone=makeViewShareClone(mode==="trainer");
  const rendered=await renderShareHtmlToPng(clone.outerHTML,"full");
  const blob=await cropAdaptiveExportBlob(rendered);
  adaptiveExportCache={key,mode,blob};
  return blob;
}

function makeContentFitPdf(page){
  const encoder=new TextEncoder();
  const objects=[null];
  objects[1]=encoder.encode("<< /Type /Catalog /Pages 2 0 R >>");
  objects[2]=encoder.encode("");

  // Use a normal 8.5-inch PDF width, but let the height follow the actual
  // image aspect ratio. That removes artificial blank space completely.
  const pageWidth=612;
  const pageHeight=Math.max(180,Math.round((page.height/page.width)*pageWidth*1000)/1000);

  const imageObjNo=3;
  objects[imageObjNo]=pdfObjectFromParts([
    `<< /Type /XObject /Subtype /Image /Width ${page.width} /Height ${page.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${page.bytes.length} >>\nstream\n`,
    page.bytes,
    `\nendstream`
  ]);

  const stream=`q\n${pageWidth} 0 0 ${pageHeight} 0 0 cm\n/Im1 Do\nQ`;
  const contentObjNo=4;
  objects[contentObjNo]=encoder.encode(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  const pageObjNo=5;
  objects[pageObjNo]=encoder.encode(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Im1 ${imageObjNo} 0 R >> >> /Contents ${contentObjNo} 0 R >>`);
  objects[2]=encoder.encode(`<< /Type /Pages /Kids [ ${pageObjNo} 0 R ] /Count 1 >>`);

  let offset=0;
  const chunks=[encoder.encode("%PDF-1.4\n%ÿÿÿÿ\n")];
  offset=chunks[0].length;
  const offsets=[0];

  for(let i=1;i<objects.length;i++){
    offsets[i]=offset;
    const head=encoder.encode(`${i} 0 obj\n`);
    const tail=encoder.encode("\nendobj\n");
    chunks.push(head,objects[i],tail);
    offset+=head.length+objects[i].length+tail.length;
  }

  const xrefStart=offset;
  let xref=`xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for(let i=1;i<objects.length;i++) xref+=`${String(offsets[i]).padStart(10,"0")} 00000 n \n`;
  const trailer=`trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  chunks.push(encoder.encode(xref),encoder.encode(trailer));

  return new Blob(chunks,{type:"application/pdf"});
}

async function downloadAdaptivePng(){
  if(!ensureScenarioReady())return;
  const btn=$("downloadAdaptivePngBtn");
  const old=btn.innerHTML;
  btn.disabled=true;
  btn.innerHTML=`<span class="share-menu-icon">…</span><span><strong>Building PNG…</strong><small>Fitting to the current ${state.mode} view</small></span>`;
  try{
    const png=await getAdaptiveCurrentViewPng();
    const url=URL.createObjectURL(png);
    const a=document.createElement("a");
    a.href=url;
    a.download=adaptiveExportFilename("png");
    document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),2000);
    closeShareMenu();
    flash(`${state.mode==="trainer"?"Trainer":"Trainee"} PNG downloaded with content-fit height.`);
  }catch(err){
    alert(`Could not create the PNG: ${err.message}`);
  }finally{
    btn.disabled=false;
    btn.innerHTML=old;
  }
}

async function downloadAdaptivePdf(){
  if(!ensureScenarioReady())return;
  const btn=$("downloadAdaptivePdfBtn");
  const old=btn.innerHTML;
  btn.disabled=true;
  btn.innerHTML=`<span class="share-menu-icon">…</span><span><strong>Building PDF…</strong><small>Removing unused page space</small></span>`;
  try{
    const png=await getAdaptiveCurrentViewPng();
    const descriptor=await blobToJpegDescriptor(png,0.995);
    const pdf=makeContentFitPdf(descriptor);
    const url=URL.createObjectURL(pdf);
    const a=document.createElement("a");
    a.href=url;
    a.download=adaptiveExportFilename("pdf");
    document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),2000);
    closeShareMenu();
    flash(`${state.mode==="trainer"?"Trainer":"Trainee"} PDF downloaded with an adaptive page size and no forced blank area.`);
  }catch(err){
    alert(`Could not create the PDF: ${err.message}`);
  }finally{
    btn.disabled=false;
    btn.innerHTML=old;
  }
}

function onePageSailText(d){
  const s=d.sailing;
  if(!s)return "Trainer-selected Norwegian Cruise Line sailing";
  return `${s.ship||"NCL ship"}${s.title?` • ${s.title}`:""}${s.departure?` • From ${s.departure}`:""}${s.sailingMonths?.length?` • ${s.sailingMonths.join(", ")}`:""}`;
}

function onePageGuestStatusHtml(d){
  if(!d.latitudes)return `<div class="one-page-muted">Create or verify all guest profiles using the training details.</div>`;
  const mix=getGuestProfileMix(d);
  return `<div class="one-page-guest-list">${Array.from({length:d.guestCount},(_,i)=>{
    const name=i===0?(d.guest1||"Guest 1"):i===1?(d.guest2||"Guest 2"):`Guest ${i+1}`;
    const isPast=!!mix.flags[i];
    const number=mix.numbers[i]||"";
    return `<div class="one-page-guest-row ${isPast?"past":"new"}"><div><strong>${escapeHtml(name)}</strong><span>Guest ${i+1}</span></div><div><b>${isPast?"Past Guest":"New Guest"}</b>${isPast?`<small>${number?`Latitudes # ${escapeHtml(number)}`:"Latitudes # — verify in Seaweb"}</small>`:`<small>Create training profile</small>`}</div></div>`;
  }).join("")}</div>`;
}

function onePageReferenceHtml(d){
  const s=d.sailing;
  const agency=d.department==="Outbound Sales"?`${d.market} • Agency ${d.agency}`:`Agency ${d.agency}`;
  const items=[
    ["Agency",agency],
    ["Sailing",onePageSailText(d)],
    ["Stateroom",`${d.category}${d.location!=="Any"?` • ${d.location}`:""}${d.side!=="Any"?` • ${d.side} side`:""}`],
    ["Payment / Credit",d.payment],
    ["Promotions",promotionSummary(d)],
    ["Protection",protectionSummary(d)],
    ["Special Requests",specialRequestSummary(d)],
    ["Confirmation",d.confirmation?(d.email||"Send guest confirmation"):"Not required"]
  ];
  return `<div class="one-page-reference-list">${items.map(([label,value])=>`<div><span>${escapeHtml(label)}</span><strong>${escapeHtml(String(value||"Verify in Seaweb"))}</strong></div>`).join("")}</div>`;
}

function onePageCallFlowHtml(d,meta){
  const n=(d.type||"").toLowerCase();
  const steps=[];
  if(d.reservationWorkflow==="modify"){if(d.department==="Guest Services")steps.push("Complete GDPR verification before servicing the reservation.");steps.push("Locate the correct reservation and complete verification.");}
  else steps.push("Qualify the request and build the correct sailing / stateroom option.");
  if(d.latitudes)steps.push("Follow each guest's Past Guest / New Guest status before saving profiles.");
  if(n.includes("special request")||n.includes("ada")||n.includes("multiple"))steps.push("Enter requests, links and comments in the correct Seaweb locations.");
  if(d.fas||d.travel||d.psc)steps.push("Review applicable add-ons, promotions and timing before saving.");
  steps.push("Review the updated reservation, amount due / deadline, and next step with the guest.");
  if(d.confirmation||d.commenting)steps.push("Complete required comments / confirmation and recap the interaction.");
  return `<ol class="one-page-flow-list">${[...new Set(steps)].slice(0,5).map(x=>`<li>${escapeHtml(x)}</li>`).join("")}</ol>`;
}

function onePageTrainingCardHtml(d){
  if(!d.cardRequired||!d.card)return "";
  return `<section class="one-page-side-section one-page-training-card"><div class="one-page-side-title">Training Payment</div><div class="training-only-label">TRAINING / TEST DATA ONLY</div><div class="one-page-card-grid"><span><b>Card</b>${escapeHtml(d.card.number)}</span><span><b>Exp / CCV</b>${escapeHtml(d.card.expiration)} • ${escapeHtml(d.card.ccv)}</span><span class="wide"><b>Billing</b>${escapeHtml(d.card.address)}</span></div></section>`;
}

function makeOnePageTraineeClone(){
  const d=state.currentScenario||scenarioData();
  const meta=currentFocusMeta()||{};
  const guestNames=[d.guest1,d.guest2].filter(Boolean);
  const primary=guestNames[0]||"the guest";
  const companion=guestNames[1]||"";
  const s=d.sailing;
  const sailText=s?`${s.duration?`${s.duration}-day `:""}${s.title||"cruise"} on ${s.ship||"Norwegian Cruise Line"}${s.departure?`, departing from ${s.departure}`:""}${s.sailingMonths?.length?` during ${s.sailingMonths.join(", ")}`:""}`:"a trainer-selected Norwegian Cruise Line sailing";
  const tasks=traineeTaskList(d,meta);
  const finalChecks=beforeEndItems(d);
  const page=document.createElement("article");
  page.className="one-page-export";
  page.innerHTML=`
    <header class="one-page-header">
      <div><span class="one-page-kicker">SEAweb Training Scenario</span><h1>${escapeHtml(d.type)}</h1><p>${escapeHtml(d.department)} • ${escapeHtml(d.difficulty)} • ${escapeHtml(trainingSupportLabel(+d.trainingDay))} support</p></div>
      <div class="one-page-header-badge">TRAINEE</div>
    </header>

    <section class="one-page-call">
      <div class="one-page-label">YOUR CALL</div>
      <h2>Customer Scenario</h2>
      ${customerStoryHtml(d,meta,sailText,guestNames)}
    </section>

    <div class="one-page-layout">
      <main class="one-page-main">
        <section class="one-page-section one-page-glance">
          <div class="one-page-label">GUEST REQUEST</div><h2>At a Glance</h2>
          ${atAGlanceHtml(d,meta)}
        </section>

        <section class="one-page-section one-page-status">
          <div class="one-page-label">GUEST STATUS / LATITUDES</div><h2>Past & New Guests</h2>
          ${onePageGuestStatusHtml(d)}
        </section>

        <section class="one-page-section one-page-tasks">
          <div class="one-page-label">YOUR WORK</div><h2>Complete These Tasks</h2>
          ${checklistHtml(tasks)}
        </section>
      </main>

      <aside class="one-page-side">
        <section class="one-page-side-section">
          <div class="one-page-side-title">Key Booking Details</div>
          ${onePageReferenceHtml(d)}
        </section>

        ${onePageTrainingCardHtml(d)}

        <section class="one-page-side-section one-page-flow">
          <div class="one-page-side-title">Call Flow Support</div>
          ${onePageCallFlowHtml(d,meta)}
        </section>

        <section class="one-page-side-section one-page-final">
          <div class="one-page-side-title">Before You End the Call</div>
          ${checklistHtml(finalChecks)}
          <div class="one-page-closing"><strong>Close:</strong> “Is there anything else I can help you with today, ${escapeHtml(primary.split(" ")[0]||"")}?”<br>“Thank you for choosing Norwegian Cruise Line.”</div>
        </section>
      </aside>
    </div>

    <footer class="one-page-footer"><span>${escapeHtml(d.department)}</span><span>${escapeHtml(d.type)}</span><span>Training Use</span></footer>`;
  return page;
}

let onePageExportCache={key:null,blob:null};

async function cropOnePageLegalBlob(blob){
  const img=await loadImageFromBlob(blob);
  const width=img.naturalWidth||img.width;
  const height=img.naturalHeight||img.height;
  const scale=width/2080;
  const sx=Math.round(20*scale);
  const sy=Math.round(20*scale);
  const sw=Math.min(Math.round(2040*scale),width-sx);
  const sh=Math.min(Math.round(3360*scale),height-sy);
  const canvas=document.createElement("canvas");
  canvas.width=sw;canvas.height=sh;
  const ctx=canvas.getContext("2d");
  ctx.fillStyle="#ffffff";ctx.fillRect(0,0,sw,sh);
  ctx.drawImage(img,sx,sy,sw,sh,0,0,sw,sh);
  return await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error("Could not prepare the one-page export.")),"image/png"));
}

async function getOnePageTraineePng(){
  const key=`${currentSharePageCacheKey()}|one-page-v190`;
  if(onePageExportCache.key===key && onePageExportCache.blob)return onePageExportCache.blob;
  const page=makeOnePageTraineeClone();
  const rendered=await renderShareHtmlToPng(page.outerHTML,"full");
  const blob=await cropOnePageLegalBlob(rendered);
  onePageExportCache={key,blob};
  return blob;
}

function onePageExportFilename(ext){
  return scenarioShareFilename().replace(/\.png$/i,`-One-Page-Trainee.${ext}`);
}

async function downloadOnePagePng(){
  if(!ensureScenarioReady())return;
  const btn=$("downloadOnePagePngBtn");
  const old=btn.innerHTML;
  btn.disabled=true;
  btn.innerHTML=`<span class="share-menu-icon">…</span><span><strong>Building one-page PNG…</strong><small>Optimizing for legal-size viewing</small></span>`;
  try{
    const png=await getOnePageTraineePng();
    const url=URL.createObjectURL(png);
    const a=document.createElement("a");a.href=url;a.download=onePageExportFilename("png");document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),2000);
    closeShareMenu();
    flash("One-page trainee PNG downloaded.");
  }catch(err){alert(`Could not create the one-page PNG: ${err.message}`)}finally{btn.disabled=false;btn.innerHTML=old;}
}

async function downloadOnePagePdf(){
  if(!ensureScenarioReady())return;
  const btn=$("downloadOnePagePdfBtn");
  const old=btn.innerHTML;
  btn.disabled=true;
  btn.innerHTML=`<span class="share-menu-icon">…</span><span><strong>Building one-page PDF…</strong><small>Creating one legal-size trainee sheet</small></span>`;
  try{
    const png=await getOnePageTraineePng();
    const page=await blobToJpegDescriptor(png,0.99);
    const pdf=makeJpegPdf([page],{margin:0});
    const url=URL.createObjectURL(pdf);
    const a=document.createElement("a");a.href=url;a.download=onePageExportFilename("pdf");document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),2000);
    closeShareMenu();
    flash("One-page trainee PDF downloaded.");
  }catch(err){alert(`Could not create the one-page PDF: ${err.message}`)}finally{btn.disabled=false;btn.innerHTML=old;}
}

function makeTeamsPageClones(){
  const full=makeTraineeShareClone();
  const headerNodes=[];
  const contentNodes=[];
  [...full.children].forEach((node,index)=>{
    if(index<3)headerNodes.push(node.cloneNode(true));
    else contentNodes.push(node.cloneNode(true));
  });

  const labelOf=node=>node.querySelector?.('.section-label')?.textContent?.trim().toUpperCase()||'';
  const headingOf=node=>node.querySelector?.('h3,.share-expanded-heading')?.textContent?.trim().toUpperCase()||'';
  const clsHas=(node,name)=>node.classList?.contains?.(name);
  const groups=[[],[]];

  contentNodes.forEach(node=>{
    const label=labelOf(node);
    const heading=headingOf(node);
    const goesPage1 = label==='YOUR CALL' || label==='GUEST REQUEST' || label==='GUEST STATUS / LATITUDES' || label==='YOUR WORK' || heading.includes('CALL FLOW SUPPORT') || clsHas(node,'latitudes-output-section');
    (goesPage1?groups[0]:groups[1]).push(node);
  });

  const titles=['Scenario & Trainee Workflow','Reservation Reference & Final Check'];
  const subtitles=['Guest request, guest status, task checklist and call-flow support','Reservation details, payment guidance, closing actions and knowledge review'];
  const pages=[];
  groups.forEach((nodes,groupIndex)=>{
    if(!nodes.length)return;
    const page=document.createElement('article');
    page.className='shared-trainee-card teams-share-page export-legal-page';
    const bar=document.createElement('div');
    bar.className='export-page-bar';
    bar.innerHTML=`<div><strong>${escapeHtml(titles[groupIndex])}</strong><small>${escapeHtml(subtitles[groupIndex])}</small></div><span>Page ${pages.length+1}</span>`;
    page.appendChild(bar);
    const body=document.createElement('div');
    body.className='export-page-body';
    headerNodes.forEach(n=>body.appendChild(n.cloneNode(true)));
    nodes.forEach(n=>body.appendChild(n.cloneNode(true)));
    page.appendChild(body);
    const footer=document.createElement('div');
    footer.className='export-page-footer';
    footer.innerHTML=`<span>${escapeHtml((state.currentScenario||{}).department||'Seaweb')}</span><span>${escapeHtml((state.currentScenario||{}).type||'Scenario')}</span><span class="page-marker"></span>`;
    page.appendChild(footer);
    pages.push(page);
  });
  pages.forEach((page,i)=>{
    page.querySelector('.export-page-bar span').textContent=`Page ${i+1} of ${pages.length}`;
    page.querySelector('.page-marker').textContent=`Page ${i+1} of ${pages.length}`;
  });
  return pages;
}

function makeSharePageWrapper(pages){
  const wrapper=document.createElement('div');
  wrapper.className='teams-page-stack';
  pages.forEach((page,index)=>{
    wrapper.appendChild(page);
    if(index<pages.length-1){
      const marker=document.createElement('div');
      marker.className='share-page-split-marker';
      marker.setAttribute('aria-hidden','true');
      wrapper.appendChild(marker);
    }
  });
  return wrapper;
}

let sharePageCache={key:null,blobs:null};

function currentSharePageCacheKey(){
  const scenario=state.currentScenario||{};
  return [
    scenario.id||'draft',
    scenario.updatedAt||'',
    $("scenarioOutput")?.innerHTML?.length||0,
    $("scenarioOutput")?.innerText?.length||0
  ].join('|');
}

async function renderTeamsPageSetArtifacts(){
  const pages=makeTeamsPageClones();
  const wrapper=makeSharePageWrapper(pages.map(page=>page.cloneNode(true)));
  const fullBlob=await renderShareHtmlToPng(wrapper.outerHTML,'full');
  return {fullBlob,expectedPages:pages.length};
}

async function loadImageFromBlob(blob){
  return await new Promise((resolve,reject)=>{
    const url=URL.createObjectURL(blob);
    const img=new Image();
    img.onload=()=>{URL.revokeObjectURL(url);resolve(img)};
    img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Could not read the rendered image.'))};
    img.src=url;
  });
}

async function splitRenderedStackIntoPageBlobs(artifact){
  const img=await loadImageFromBlob(artifact.fullBlob);
  const width=img.naturalWidth||img.width;
  const height=img.naturalHeight||img.height;

  const canvas=document.createElement('canvas');
  canvas.width=width;
  canvas.height=height;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  ctx.drawImage(img,0,0);
  const pixels=ctx.getImageData(0,0,width,height).data;

  // The Worker places a hidden magenta separator between pages. Detect those
  // separator rows in the final server-rendered image so cropping follows the
  // actual rendered layout instead of guessing heights from the local browser.
  const sampleXs=[
    Math.round(width*0.25),
    Math.round(width*0.5),
    Math.round(width*0.75)
  ];
  const isMarkerRow=(y)=>{
    let matches=0;
    for(const x of sampleXs){
      const i=(y*width+x)*4;
      const r=pixels[i],g=pixels[i+1],b=pixels[i+2],a=pixels[i+3];
      if(a>240 && r>245 && g<20 && b>245) matches++;
    }
    return matches>=2;
  };

  const runs=[];
  let runStart=-1;
  for(let y=0;y<height;y++){
    if(isMarkerRow(y)){
      if(runStart<0)runStart=y;
    }else if(runStart>=0){
      runs.push([runStart,y-1]);
      runStart=-1;
    }
  }
  if(runStart>=0)runs.push([runStart,height-1]);

  if(runs.length!==Math.max(0,artifact.expectedPages-1)){
    throw new Error(`Could not identify all page boundaries (${runs.length+1} of ${artifact.expectedPages} pages found).`);
  }

  // The server-rendered card spans from x=20 to x=width-20.
  const cropX=20;
  const cropWidth=Math.max(1,width-40);
  const pageRanges=[];
  let yStart=20;
  for(const [markerStart,markerEnd] of runs){
    pageRanges.push([yStart,markerStart]);
    yStart=markerEnd+1;
  }
  pageRanges.push([yStart,height-20]);

  const out=[];
  for(const [top,bottom] of pageRanges){
    const pageHeight=Math.max(1,bottom-top);
    const pageCanvas=document.createElement('canvas');
    pageCanvas.width=cropWidth;
    pageCanvas.height=pageHeight;
    const pctx=pageCanvas.getContext('2d');
    pctx.fillStyle='#ffffff';
    pctx.fillRect(0,0,cropWidth,pageHeight);
    pctx.drawImage(canvas,cropX,top,cropWidth,pageHeight,0,0,cropWidth,pageHeight);
    const blob=await new Promise((resolve,reject)=>{
      pageCanvas.toBlob(b=>b?resolve(b):reject(new Error('Could not create a page image.')),'image/png');
    });
    out.push(blob);
  }
  return out;
}

async function getTeamsPageBlobs(){
  const key=currentSharePageCacheKey();
  if(sharePageCache.key===key && Array.isArray(sharePageCache.blobs) && sharePageCache.blobs.length){
    return sharePageCache.blobs;
  }
  const artifact=await renderTeamsPageSetArtifacts();
  const blobs=await splitRenderedStackIntoPageBlobs(artifact);
  sharePageCache={key,blobs};
  return blobs;
}

function scenarioPdfFilename(){
  return scenarioShareFilename().replace(/\.png$/i,'.pdf');
}

async function blobToJpegDescriptor(blob,quality=0.9){
  const img=await loadImageFromBlob(blob);
  const canvas=document.createElement('canvas');
  canvas.width=img.naturalWidth||img.width;
  canvas.height=img.naturalHeight||img.height;
  const ctx=canvas.getContext('2d');
  ctx.fillStyle='#ffffff';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(img,0,0);
  const jpegBlob=await new Promise((resolve,reject)=>{
    canvas.toBlob(b=>b?resolve(b):reject(new Error('Could not prepare a PDF page.')),'image/jpeg',quality);
  });
  const bytes=new Uint8Array(await jpegBlob.arrayBuffer());
  return {bytes,width:canvas.width,height:canvas.height};
}

function pdfObjectFromParts(parts){
  const encoder=new TextEncoder();
  return concatBytes(parts.map(part=>part instanceof Uint8Array?part:encoder.encode(String(part))));
}

function makeJpegPdf(pages,{margin=0}={}){
  const encoder=new TextEncoder();
  const objects=[null];
  objects[1]=encoder.encode('<< /Type /Catalog /Pages 2 0 R >>');
  objects[2]=encoder.encode('');
  const pageRefs=[];

  const pageWidth=612;
  const pageHeight=1008;

  pages.forEach(page=>{
    const imageObjNo=objects.length;
    objects.push(pdfObjectFromParts([
      `<< /Type /XObject /Subtype /Image /Width ${page.width} /Height ${page.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${page.bytes.length} >>\nstream\n`,
      page.bytes,
      `\nendstream`
    ]));

    const maxW=pageWidth-(margin*2);
    const maxH=pageHeight-(margin*2);
    const scale=Math.min(maxW/page.width,maxH/page.height);
    const drawW=Math.round(page.width*scale*1000)/1000;
    const drawH=Math.round(page.height*scale*1000)/1000;
    const x=Math.round(((pageWidth-drawW)/2)*1000)/1000;
    const y=Math.round(((pageHeight-drawH)/2)*1000)/1000;
    const stream=`q\n${drawW} 0 0 ${drawH} ${x} ${y} cm\n/Im1 Do\nQ`;
    const contentObjNo=objects.length;
    objects.push(encoder.encode(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`));

    const pageObjNo=objects.length;
    objects.push(encoder.encode(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Im1 ${imageObjNo} 0 R >> >> /Contents ${contentObjNo} 0 R >>`));
    pageRefs.push(`${pageObjNo} 0 R`);
  });

  objects[2]=encoder.encode(`<< /Type /Pages /Kids [ ${pageRefs.join(' ')} ] /Count ${pageRefs.length} >>`);
  let offset=0;
  const chunks=[encoder.encode('%PDF-1.4\n%ÿÿÿÿ\n')];
  offset=chunks[0].length;
  const offsets=[0];
  for(let i=1;i<objects.length;i++){
    offsets[i]=offset;
    const objHeader=encoder.encode(`${i} 0 obj\n`);
    const objFooter=encoder.encode('\nendobj\n');
    chunks.push(objHeader,objects[i],objFooter);
    offset+=objHeader.length+objects[i].length+objFooter.length;
  }
  const xrefStart=offset;
  let xref=`xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for(let i=1;i<objects.length;i++) xref+=`${String(offsets[i]).padStart(10,'0')} 00000 n \n`;
  const trailer=`trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  chunks.push(encoder.encode(xref),encoder.encode(trailer));
  return new Blob(chunks,{type:'application/pdf'});
}

function crc32(bytes){
  let crc=0xFFFFFFFF;
  for(let i=0;i<bytes.length;i++){
    crc^=bytes[i];
    for(let j=0;j<8;j++) crc=(crc>>>1)^((crc&1)?0xEDB88320:0);
  }
  return (crc^0xFFFFFFFF)>>>0;
}

function u16(n){return new Uint8Array([n&255,(n>>>8)&255])}
function u32(n){return new Uint8Array([n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255])}

function concatBytes(parts){
  const total=parts.reduce((n,p)=>n+p.length,0);
  const out=new Uint8Array(total);
  let pos=0;
  parts.forEach(p=>{out.set(p,pos);pos+=p.length});
  return out;
}

async function makeStoredZip(files){
  const encoder=new TextEncoder();
  const locals=[];
  const centrals=[];
  let offset=0;

  for(const file of files){
    const name=encoder.encode(file.name);
    const data=new Uint8Array(await file.blob.arrayBuffer());
    const crc=crc32(data);
    const local=concatBytes([
      u32(0x04034b50),u16(20),u16(0),u16(0),u16(0),u16(0),
      u32(crc),u32(data.length),u32(data.length),u16(name.length),u16(0),name,data
    ]);
    locals.push(local);

    const central=concatBytes([
      u32(0x02014b50),u16(20),u16(20),u16(0),u16(0),u16(0),u16(0),
      u32(crc),u32(data.length),u32(data.length),u16(name.length),u16(0),u16(0),
      u16(0),u16(0),u32(0),u32(offset),name
    ]);
    centrals.push(central);
    offset+=local.length;
  }

  const centralData=concatBytes(centrals);
  const end=concatBytes([
    u32(0x06054b50),u16(0),u16(0),u16(files.length),u16(files.length),
    u32(centralData.length),u32(offset),u16(0)
  ]);
  return new Blob([concatBytes([...locals,centralData,end])],{type:'application/zip'});
}

function teamsPageFilename(page,total){
  const base=scenarioShareFilename().replace(/\.png$/i,'');
  return `${base}-Teams-${String(page).padStart(2,'0')}-of-${String(total).padStart(2,'0')}.png`;
}

async function downloadTeamsPageSet(){
  if(!ensureScenarioReady())return;
  const btn=$('downloadTeamsPagesBtn');
  const old=btn.innerHTML;
  btn.disabled=true;
  btn.innerHTML=`<span class="share-menu-icon">…</span><span><strong>Building full-detail PNGs…</strong><small>Creating expanded legal-size pages</small></span>`;
  try{
    const blobs=await getTeamsPageBlobs();
    const files=blobs.map((blob,i)=>({name:teamsPageFilename(i+1,blobs.length),blob}));
    const zip=await makeStoredZip(files);
    const url=URL.createObjectURL(zip);
    const a=document.createElement('a');
    const base=scenarioShareFilename().replace(/\.png$/i,'');
    a.href=url;
    a.download=`${base}-Teams-Image-Set.zip`;
    document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),2000);
    closeShareMenu();
    flash(`Downloaded ${files.length} full-detail PNG pages.`);
  }catch(err){
    alert(`Could not create the Teams page set: ${err.message}`);
  }finally{
    btn.disabled=false;
    btn.innerHTML=old;
  }
}

async function downloadScenarioPdf(){
  if(!ensureScenarioReady())return;
  const btn=$('downloadScenarioPdfBtn');
  const old=btn.innerHTML;
  btn.disabled=true;
  btn.innerHTML=`<span class="share-menu-icon">…</span><span><strong>Building PDF…</strong><small>Creating the expanded full-detail PDF</small></span>`;
  try{
    const pageBlobs=await getTeamsPageBlobs();
    const pages=[];
    for(const blob of pageBlobs) pages.push(await blobToJpegDescriptor(blob,0.99));
    const pdf=makeJpegPdf(pages,{margin:0});
    const url=URL.createObjectURL(pdf);
    const a=document.createElement('a');
    a.href=url;
    a.download=scenarioPdfFilename();
    document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),2000);
    closeShareMenu();
    flash(`PDF downloaded with ${pages.length} page${pages.length===1?'':'s'}. The PDF uses the exact same page design as the PNG export.`);
  }catch(err){
    alert(`Could not create the PDF: ${err.message}`);
  }finally{
    btn.disabled=false;
    btn.innerHTML=old;
  }
}

function scenarioShareFilename(){
  const d=state.currentScenario||scenarioData();
  const dept=(d.department||'Seaweb').replace(/[^A-Za-z0-9]+/g,'-').replace(/^-|-$/g,'');
  const focus=(d.type||'Scenario').replace(/[^A-Za-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,48);
  return `${dept}-${focus}.png`;
}

async function downloadCardImage(){
  if(!ensureScenarioReady())return;
  const btn=$('downloadCardImageBtn');
  const old=btn.innerHTML;
  btn.disabled=true;
  btn.innerHTML=`<span class="share-menu-icon">…</span><span><strong>Creating PNG…</strong><small>Please wait</small></span>`;
  try{
    const png=await renderShareCardToPng();
    const url=URL.createObjectURL(png);
    const a=document.createElement('a');
    a.href=url;
    a.download=scenarioShareFilename();
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1500);
    closeShareMenu();
    flash('PNG downloaded. For Teams and email, the new Download PDF option is usually the easiest format to read.');
  }catch(err){
    alert(`Could not download the card image: ${err.message}`);
  }finally{
    btn.disabled=false;
    btn.innerHTML=old;
  }
}

async function copyCardAsImage(){
  if(!ensureScenarioReady())return;
  if(!navigator.clipboard || typeof ClipboardItem==="undefined"){
    alert("This browser does not support copying images to the clipboard. Use Copy Editable instead.");
    return;
  }
  const btn=$("copyCardImageBtn");
  const old=btn.innerHTML;
  btn.disabled=true;
  btn.innerHTML=`<span class="share-menu-icon">…</span><span><strong>Creating image…</strong><small>Please wait</small></span>`;
  try{
    const png=await getAdaptiveCurrentViewPng();
    await navigator.clipboard.write([new ClipboardItem({"image/png":png})]);
    closeShareMenu();
    flash(`${state.mode==="trainer"?"Trainer":"Trainee"} view copied as an image.`);
  }catch(err){
    alert(`Could not copy the card image: ${err.message}\n\nTry Copy Editable instead.`);
  }finally{
    btn.disabled=false;
    btn.innerHTML=old;
  }
}

async function copyCardFormatted(){
  if(!ensureScenarioReady())return;
  const host=makeOffscreenShareHost();
  const clone=makeViewShareClone(state.mode==="trainer");
  clone.style.width="760px";
  clone.style.maxWidth="760px";
  clone.style.padding="28px";
  clone.style.background="#ffffff";
  host.appendChild(clone);

  await new Promise(resolve=>requestAnimationFrame(resolve));
  inlineComputedStyles(clone);

  const html=`<div style="background:#ffffff;padding:4px">${clone.outerHTML}</div>`;
  const text=clone.innerText;

  try{
    if(navigator.clipboard && typeof ClipboardItem!=="undefined"){
      await navigator.clipboard.write([new ClipboardItem({
        "text/html":new Blob([html],{type:"text/html"}),
        "text/plain":new Blob([text],{type:"text/plain"})
      })]);
    }else{
      await navigator.clipboard.writeText(text);
    }
    closeShareMenu();
    flash("Editable trainee card copied — paste it into Teams or Outlook.");
  }catch(err){
    await navigator.clipboard.writeText(text);
    closeShareMenu();
    flash("Formatted copy was blocked, so plain text was copied instead.");
  }finally{
    host.remove();
  }
}

function openShareMenu(){
  $("shareScenarioMenu").classList.add("open");
  $("shareScenarioBtn").setAttribute("aria-expanded","true");
}
function closeShareMenu(){
  $("shareScenarioMenu").classList.remove("open");
  $("shareScenarioBtn").setAttribute("aria-expanded","false");
}
$("shareScenarioBtn").onclick=(e)=>{
  e.stopPropagation();
  $("shareScenarioMenu").classList.contains("open")?closeShareMenu():openShareMenu();
};
$("downloadAdaptivePdfBtn").onclick=downloadAdaptivePdf;
$("downloadAdaptivePngBtn").onclick=downloadAdaptivePng;
$("copyCardImageBtn").onclick=copyCardAsImage;
$("copyCardFormattedBtn").onclick=copyCardFormatted;
document.addEventListener("click",e=>{
  const control=$("shareControl");
  if(control && !control.contains(e.target))closeShareMenu();
});

$("copyScenarioBtn").onclick=async()=>{
  if(!ensureScenarioReady())return;
  const clone=makeViewShareClone(state.mode==="trainer");
  await navigator.clipboard.writeText(clone.innerText);
  closeShareMenu();
  flash(`${state.mode==="trainer"?"Trainer":"Trainee"} view copied as plain text.`);
};

function printScenarioView(mode){
  if(!ensureScenarioReady())return;
  document.body.classList.remove("print-trainer","print-trainee");
  document.body.classList.add(mode==="trainer"?"print-trainer":"print-trainee");
  closeShareMenu();

  let cleaned=false;
  const cleanup=()=>{
    if(cleaned)return;
    cleaned=true;
    document.body.classList.remove("print-trainer","print-trainee");
  };
  window.addEventListener("afterprint",cleanup,{once:true});
  setTimeout(()=>{
    window.print();
    setTimeout(cleanup,1000);
  },40);
}

$("printTraineeViewBtn").onclick=()=>printScenarioView("trainee");
$("printTrainerViewBtn").onclick=()=>printScenarioView("trainer");
$("printScenarioBtn").onclick=()=>printScenarioView(state.mode);

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
  let items=saved().filter(x=>{
    if(deptFilter && x.department!==deptFilter)return false;
    return !q||JSON.stringify([x.title,x.type,x.department,x.reservationWorkflow,x.modificationType,x.difficulty,x.sailing?.ship,x.sailing?.title]).toLowerCase().includes(q);
  });
  $("libraryList").innerHTML=items.length?items.map(x=>`
    <div class="result-card ${x.archived?"archived":""}">
      <div style="display:flex;justify-content:space-between;gap:12px">
        <div>
          <div class="meta"><span class="chip">${escapeHtml(x.department||"Legacy")}</span><span class="chip">${escapeHtml(x.type)}</span><span class="chip">${escapeHtml(x.difficulty)}</span><span class="status-badge ${x.validationStatus==="Ready"?"ready":"review"}">${escapeHtml(x.validationStatus||"Draft")}</span></div>
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
  updateScenarioFocus(x.type,String(x.trainingDay||6));
  $("reservationWorkflow").value=x.reservationWorkflow||((x.curriculumKind==="followup")?"modify":"new");
  $("existingReservationNumber").value=x.existingReservationNumber||"";
  $("modificationType").value=x.modificationType||"general";
  $("modificationTarget").value=x.modificationTarget||"";
  $("modificationRequest").value=x.modificationRequest||"";
  $("modificationGuestStatus").value=x.modificationGuestStatus||"new";
  $("modificationLatitudes").value=x.modificationLatitudes||"";
  $("gdprCallerType").value=x.gdprCallerType||"";
  $("directGroupMarket").value=x.directGroupMarket||"direct_groups_sot";
  updateWorkflowUI(false);
  updateGdprPreview();
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
  refreshLatitudesPanel(x.latitudesNumbers||[],x.pastGuestFlags||[]);
  $("fasToggle").checked=!!x.fas;$("travelToggle").checked=!!x.travel;$("pscToggle").checked=!!x.psc;$("trainerNotes").value=x.trainerNotes||"";
  if(x.cardProfile && trainingCards[x.cardProfile])$("trainingCardProfile").value=x.cardProfile;
  renderTrainingCard();
  if(x.card){
    $("trainingCardNumber").value=x.card.number||"";
    $("trainingCardExpiration").value=x.card.expiration||"";
    $("trainingCardCcv").value=x.card.ccv||"";
    $("trainingCardAddress").value=x.card.address||"";
  }
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

populateMarketAgencies();populateTrainingCards();updateDepartmentUI();renderStarters();renderSelectedSailing();updateStats();initSearchDates();updateAnchorUI();refreshLatitudesPanel();
