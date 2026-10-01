const $ = (id) => document.getElementById(id);
const state = {
  mode: "trainer",
  selectedSailing: null,
  currentScenario: null,
  validation: [],
  sailings: [],
  pendingSailingIndex: null
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
  alternateSesame:{label:"4917 Training Card – Sesame St.",number:"4917 6100 0000 0000",expiration:"04/2027",ccv:"123",address:"123 Sesame Street, Miami, FL 33126"},
  obSpecial:{label:"OB Special Requests Training Card",number:"4444 3333 2222 1111",expiration:"05/2028",ccv:"456",address:"123 Sesame Street, Miami, FL 33126"}
};

const airPrograms = {
  bundled:{
    label:"Bundled Air / AIRPROM3 — Select Pride of America Sailings",
    nclAir:true,
    terms:[
      "Training eligibility: Bundled Air / AIRPROM3 is only available on select Pride of America sailings. Verify the specific sailing is eligible before assigning the scenario.",
      "For an eligible Pride of America sailing, AIRPROM3 applies to qualifying new individual FIT reservations; air must be added more than 80 days prior to sailing.",
      "Guarantee categories IX, OX, BX and MX are not eligible.",
      "Guests 1–2 are eligible under the promotion; Guests 3–8 pay the full promotional airfare amount.",
      "Round-trip air uses the applicable promotional airfare. One-way air is charged at 50% of the applicable promotional air pricing for the selected gateway.",
      "Air is economy from select, capacity-controlled gateways and pricing must be confirmed in the reservation system.",
      "NCL Air is scheduled to arrive at least one day prior to embarkation.",
      "The guest is responsible for the pre-cruise hotel and the ground transportation associated with that early arrival.",
      "Airport transfers are an additional cost when selected; airline baggage and other personal airline charges are not included.",
      "Current AIRPROM3 air deviations are priced at $0.00 and a hotel add-on is not required for the deviation request."
    ]
  },
  air_choice:{
    label:"Air Choice (US / Canada)",
    nclAir:true,
    terms:[
      "Air Choice is available for qualifying domestic reservations, including US and Canada, from 330 to 4 days prior to sailing.",
      "Air Choice can be used on new or existing reservations and is not combinable with AIRPROM3.",
      "Outside final payment, a $250 non-refundable Air Choice deposit per stateroom applies for standard Economy flexible air; upgraded class / specific layover requests have higher deposit requirements.",
      "Inside final payment, the air must be paid in full at booking. Restricted Air requires full non-refundable payment at booking.",
      "Flights are booked immediately; an air confirmation is sent within 24 hours and tickets are generally issued 30 days prior to sailing.",
      "Changing or canceling Air Choice flight plans forfeits the applicable non-refundable air deposit.",
      "Economy is the default class unless an upgraded class of service is requested.",
      "NCL Air guests are required to arrive at least one day prior to sailing and are responsible for accommodations and ground transportation associated with the early arrival.",
      "Seat assignments, frequent-flyer additions, special meals and similar airline ancillary requests are handled directly with the airline after booking."
    ]
  },
  air_choice_plus:{
    label:"Air Choice Plus",
    nclAir:true,
    terms:[
      "Air Choice Plus is offered to select guests and allows eligible guests to select and book their desired flight itinerary.",
      "Travel Partner reservations are eligible.",
      "Air Choice Plus can be added and customized up to 4 days prior to sailing.",
      "A $250 non-refundable Air Choice Plus deposit is assessed per stateroom; customizations within final payment require full payment.",
      "Guests use the email offer link to schedule an appointment with the Air Choice Plus team; the link expires after 9 business days.",
      "The program provides exact-flight selection and flexible fares; class-of-service upgrades can be handled directly with the airline.",
      "For NCL Miami, the program applies to US and Canada, appears in Seaweb in the Bundle Air tab as Interactive, and comments are notated as Air Choice Plus.",
      "Air Choice Plus is NCL Air, so use the one-day-prior arrival rule when building the training scenario."
    ]
  },
  independent_no_flights:{
    label:"Independent Air — No Flights / Transfer Setup",
    nclAir:false,
    terms:[
      "Use this workflow when guests arrive in the embarkation city prior to sailing, remain in the debarkation city after sailing, or have an Air Deviation and want a transfer to or from the pier.",
      "Enter the applicable departure / arrival airport gateway information; do not use the same air gateway for both Arrival and Departure.",
      "For the generic outbound entry, use 8:00 AM–10:00 AM. For the generic return entry, use 2:00 PM–5:00 PM.",
      "Use airline carrier/code T1 (BAGGAGE PICKUP) and flight number 999 only.",
      "Advise the guest of the recommended airport arrival / departure times in NCLHelp because the generic times do not guarantee the actual transfer time.",
      "When multiple airports are available, select the correct airport transfer or the guest will not be met.",
      "Cruisetour guests who arrive earlier must make their own transfer arrangements; T1 / flight 999 cannot be used."
    ]
  }
};

function airProgramMeta(value){
  return airPrograms[value]||null;
}

function bundledAirEligibility(d){
  const ship=(d?.sailing?.ship||"").trim();
  if(!ship){
    return {status:"verify",message:"Bundled Air / AIRPROM3 is only available on select Pride of America sailings. No sailing is attached, so the trainer must verify an eligible Pride of America sailing before assigning the scenario."};
  }
  if(!/pride of america/i.test(ship)){
    return {status:"ineligible",message:`Bundled Air / AIRPROM3 should not be used with ${ship}. It is only available on select Pride of America sailings.`};
  }
  return {status:"verify",message:"Pride of America is selected. Verify that this specific sailing is one of the select sailings eligible for Bundled Air / AIRPROM3 before assigning the scenario."};
}

function airTripLabel(d){
  if(d.airTripType==="one_way"){
    return d.airOneWayDirection==="from_cruise" ? "One Way — From Cruise" : "One Way — To Cruise";
  }
  return "Round Trip";
}

function defaultAirProgramForMeta(meta){
  const text=`${meta?.name||""} ${meta?.objective||""}`.toLowerCase();
  if(text.includes("air choice plus"))return "air_choice_plus";
  if(text.includes("air choice"))return "air_choice";
  if(text.includes("independent air"))return "independent_no_flights";
  if(text.includes("bundled air")||text.includes("airprom3"))return "bundled";
  if(text.includes("air deviation"))return "bundled";
  return "";
}

function isAirFocus(meta){
  return /\bair\b|ground transfer|air deviation/.test(`${meta?.name||""} ${meta?.objective||""}`.toLowerCase());
}

function airTransferReminder(program){
  if(program==="independent_no_flights"){
    return "Independent Air / No Flights is a transfer-setup workflow. Use the T1 / flight 999 setup and select the correct airport transfer.";
  }
  return "Trainer hint: remove the pre-cruise transfer when adding NCL Air. NCL Air is scheduled to arrive at least 1 day before embarkation, so the guest is responsible for the hotel and ground transportation associated with that early arrival. Review post-cruise transfer needs separately.";
}

function updateAirProgramPreview(){
  const enabled=$("airToggle")?.checked;
  $("airProgramPanel")?.classList.toggle("hidden-field",!enabled);
  if(!enabled)return;

  const program=$("airProgram").value;
  const meta=airProgramMeta(program);
  const trip=$("airTripType").value;
  $("airOneWayDirectionField").classList.toggle("hidden-field",trip!=="one_way");

  if(!meta){
    $("airTransferHint").className="air-transfer-hint neutral";
    $("airTransferHint").innerHTML="<strong>Select an Air Program</strong><span>Choose the NCL Air Program that applies to this scenario. Bundled Air / AIRPROM3 remains available here as an option for eligible select Pride of America sailings.</span>";
    $("airProgramPreview").innerHTML='<div class="air-preview-title">Choose an NCL Air Program</div><p class="air-empty-copy">Program-specific terms will appear here after you make a selection.</p>';
    return;
  }

  const hint=$("airTransferHint");
  hint.className=`air-transfer-hint ${meta.nclAir?"important":"neutral"}`;
  hint.innerHTML=`<strong>${meta.nclAir?"Pre-Cruise Transfer Reminder":"Transfer Setup Reminder"}</strong><span>${escapeHtml(airTransferReminder(program))}</span>`;

  const eligibilityNote=program==="bundled"
    ? `<div class="air-eligibility-note"><strong>Eligibility Guardrail:</strong> Bundled Air / AIRPROM3 is only available on select Pride of America sailings. Verify the sailing before assigning the scenario.</div>`
    : "";

  const oneWayNote=program==="bundled" && trip==="one_way"
    ? `<div class="air-pricing-note"><strong>One-Way Bundled Air:</strong> use 50% of the applicable promotional air pricing for the selected gateway.</div>`
    : "";

  $("airProgramPreview").innerHTML=`
    <div class="air-preview-title">${escapeHtml(meta.label)} • ${escapeHtml(trip==="one_way"?"One Way":"Round Trip")}</div>
    ${eligibilityNote}
    ${oneWayNote}
    <ul>${meta.terms.map(term=>`<li>${escapeHtml(term)}</li>`).join("")}</ul>`;
}

function syncAirPanelFromScenario(applyDefault=false){
  const metas=selectedFocusMetas();
  const combined={name:metas.map(m=>m.name).join(' '),objective:metas.map(m=>m.objective).join(' ')};
  const modifyAir=$("reservationWorkflow")?.value==="modify" && $("modificationType")?.value==="air_transfer";
  const airFocus=metas.some(isAirFocus);

  if(applyDefault && (modifyAir||airFocus)){
    $("airToggle").checked=true;
    const specific=metas.map(defaultAirProgramForMeta).find(Boolean)||defaultAirProgramForMeta(combined);
    $("airProgram").value=specific||"";
  }else if(modifyAir){
    $("airToggle").checked=true;
  }
  updateAirProgramPreview();
}

function airScenarioHtml(d){
  if(!d.airEnabled)return "";
  const meta=airProgramMeta(d.airProgram);
  if(!meta){
    return `<section class="scenario-section air-output-section">
      <div class="section-label">AIR PROGRAM</div>
      <h3>NCL Air Program Required</h3>
      <div class="air-scenario-callout"><strong>Trainer action:</strong><span>Select the applicable NCL Air Program before assigning this scenario.</span></div>
    </section>`;
  }
  const gateway=d.airGateway?`<p><strong>Gateway / Airport(s):</strong> ${escapeHtml(d.airGateway)}</p>`:"";
  const bundledEligibility=d.airProgram==="bundled"
    ? `<div class="air-scenario-callout air-eligibility-callout"><strong>Bundled Air eligibility:</strong><span>${escapeHtml(bundledAirEligibility(d).message)}</span></div>`
    : "";
  const oneWay=d.airProgram==="bundled"&&d.airTripType==="one_way"
    ? `<div class="air-scenario-callout"><strong>Bundled Air one-way pricing:</strong><span>Use 50% of the applicable promotional air pricing for the selected gateway.</span></div>`
    : "";
  const independent=d.airProgram==="independent_no_flights"
    ? `<div class="air-scenario-callout"><strong>Independent Air / No Flights setup:</strong><span>Use T1 (BAGGAGE PICKUP), flight number 999, the approved generic time ranges, and the correct airport transfer.</span></div>`
    : "";

  return `<section class="scenario-section air-output-section">
    <div class="section-label">AIR PROGRAM</div>
    <h3 class="visual-section-heading"><span class="scenario-icon">✈️</span><span>${escapeHtml(meta.label)}</span></h3>
    <div class="air-output-meta"><span>${escapeHtml(airTripLabel(d))}</span>${d.airGateway?`<span>${escapeHtml(d.airGateway)}</span>`:""}</div>
    ${gateway}
    <div class="air-scenario-hint"><strong>${meta.nclAir?"Pre-Cruise Transfer Hint":"Transfer Setup Hint"}</strong><span>${escapeHtml(airTransferReminder(d.airProgram))}</span></div>
    ${bundledEligibility}${oneWay}${independent}
    <details class="air-terms-details" open>
      <summary>Key Terms & Conditions for This Training Scenario</summary>
      <ul>${meta.terms.map(term=>`<li>${escapeHtml(term)}</li>`).join("")}</ul>
    </details>
  </section>`;
}

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
      {name:"Solo Guest / Studio Booking",payment:"Minimum Deposit",cardRequired:true,cardProfile:"alternateSesame",commenting:true,difficulty:"Intermediate",kind:"solo_studio",objective:"Travel Agent Kyle James with Norwegian Training Travel books Tom Holland as a solo guest on the June 27, 2027 Norwegian Aqua sailing. Search the guest by last name and date of birth, select a Studio, quote advertised pricing, include applicable Free at Sea, Pre-Paid Service Charges, Kosher Meals, Norwegian Care, collect the minimum deposit, send guest and agent confirmations, and add Compass comments."},
      {name:"Multiple Reservations",payment:"Initial Deposit",cardRequired:true,cardProfile:"standardMain",commenting:true,difficulty:"Advanced",kind:"new",objective:"Create two related family reservations, handle authorized-person guidance, deposits, adjacent/connecting rooms, special requests, FAS/PPSRVCHG/travel protection, and link bookings with TWITH."},
      {name:"Multiple Reservations & Authorized Person",payment:"Initial Deposit",cardRequired:true,cardProfile:"alternateSesame",commenting:true,difficulty:"Advanced",kind:"multi_authorized",objective:"Direct Guest Maria Lopez books two connecting Balcony reservations from Galveston in March 2027 for herself, Sofia, Ana and Luis. Verify all guest details, Free at Sea, Pre-Paid Service Charges, Norwegian Care, special requests, separate deposits, Authorized Person guidance/commenting, confirmations, recap, and TWITH."},
      {name:"NCL Air & Ground Transfers",payment:"Initial Deposit",cardRequired:true,cardProfile:"alternateMain",commenting:true,difficulty:"Advanced",kind:"new",objective:"Create an NCL Air reservation with ground-transfer requirements, select the appropriate Air Program, review applicable air terms, document special requests, process payment when required, and send the correct confirmation."}
    ],
    11: [
      {name:"Cancel & Reinstate",payment:"Refund / Reinstate",cardRequired:false,commenting:true,difficulty:"Advanced",kind:"followup",objective:"Complete GDPR verification, evaluate final-payment status, cancel with refund guidance, then practice reinstatement while checking fare, category, stateroom, and promotion changes."},
      {name:"Reinstate Cancelled Reservation – Roleplay",payment:"Refund / Reinstate",cardRequired:false,commenting:true,difficulty:"Advanced",kind:"roleplay",objective:"Two-person servicing roleplay using a reservation cancelled yesterday. Complete GDPR with Reservation Number required, verify cancellation occurred within the last 24 hours, confirm the previous stateroom and pricing are still available, reinstate when eligible, Store Changes, add comments, send confirmation, recap, then switch roles."},
      {name:"Add Guest & Upgrade Stateroom – Roleplay",payment:"No Payment / Service Only",cardRequired:true,cardProfile:"alternateSesame",commenting:true,difficulty:"Advanced",kind:"add_guest_upgrade_roleplay",objective:"Two-person servicing roleplay using today's Solo Guest / Studio Booking reservation. Travel Agent Kyle James calls to add Taylor using Latitudes #272279126. Complete GDPR with Reservation Number required, upgrade the Studio to a category for two guests near elevators/stairs when possible, quote new pricing, preserve Free at Sea, Pre-Paid Service Charges and Norwegian Care for both guests, set Twin Beds, add Taylor's mushroom allergy while retaining Tom's Kosher Meals, check for additional deposit, Store Changes, add Compass comments, send guest and agent confirmations, recap, then switch roles."},
      {name:"Price Drops - TRAINER DEMO",payment:"No Payment / Service Only",cardRequired:false,commenting:false,difficulty:"Advanced",kind:"demo",objective:"Trainer-led demonstration of the price-drop workflow and the required Seaweb/NCLHelp checks."},
      {name:"Land Pkgs / Cruisetour",payment:"No Payment / Service Only",cardRequired:false,commenting:true,difficulty:"Advanced",kind:"followup",objective:"Service an existing travel-agent reservation and add the best available land package/cruisetour after GDPR verification, then recap and document the change."},
      {name:"Multiple Reservations & Authorized Person – Cruisetour",payment:"Initial Deposit",cardRequired:true,cardProfile:"alternateSesame",commenting:true,difficulty:"Advanced",kind:"multi_authorized_cruisetour",objective:"Direct Guest Maria Lopez books two connecting Balcony reservations on Pride of America from Honolulu in March 2027 using the 11-Day Oahu Explorer Hyatt Waikiki Ocean View Cruisetour with a 4-day pre-cruise land portion. Include Authorized Person handling, separate deposits, Free at Sea, Pre-Paid Service Charges, Norwegian Care, special requests, confirmations, recap, and TWITH."}
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
      {name:"NCL Air & Ground Transfers",payment:"FCC / CruiseNext",cardRequired:false,commenting:true,difficulty:"Advanced",kind:"new",objective:"Build a reservation with NCL Air and ground transfers, select the appropriate Air Program, review applicable air terms, apply CruiseNext, add special requests/celebration details, and document the booking."},
      {name:"Air Deviations",payment:"Amenity Payment",cardRequired:true,cardProfile:"standardSesame",commenting:true,difficulty:"Advanced",kind:"followup",objective:"Service bundled air with deviation requests, review applicable terms/fees, update the reservation, collect any required payment, and document the change."},
      {name:"Cancellations / Reinstatements",payment:"Refund / Reinstate",cardRequired:false,commenting:true,difficulty:"Advanced",kind:"followup",objective:"Cancel a reservation after verification, explain refund timing and card refund details, then practice reinstatement and identify any fare/category/stateroom/promotion changes."}
    ],
    11: [
      {name:"Hotel",payment:"No Payment / Service Only",cardRequired:false,commenting:true,difficulty:"Advanced",kind:"followup",objective:"Follow up on the NCL Air/Ground Transfer reservation and add a two-night pre-cruise hotel in the Land tab, then recap and notate the change."},
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

function allFocusRecords(dept=$("department")?.value||"Guest Services"){
  const days=Object.keys(scenarioCatalog[dept]||{}).map(Number).sort((a,b)=>a-b);
  return days.flatMap(day=>(scenarioCatalog[dept]?.[day]||[]).map(meta=>({day,meta})));
}

function selectedFocusRecords(){
  const checked=[...document.querySelectorAll('#focusPickerOptions .focus-choice-input:checked')];
  if(checked.length){
    const dept=$("department")?.value||"Guest Services";
    const all=allFocusRecords(dept);
    return checked.map(input=>all.find(r=>r.meta.name===input.value && String(r.day)===input.dataset.day)).filter(Boolean);
  }
  const selected=$("scenarioType")?.selectedOptions?.[0];
  if(!selected)return [];
  const dept=$("department")?.value||"Guest Services";
  return allFocusRecords(dept).filter(r=>r.meta.name===selected.value && String(r.day)===String(selected.dataset.day||r.day)).slice(0,1);
}

function selectedFocusMetas(){return selectedFocusRecords().map(r=>r.meta)}
function selectedFocusNames(){return selectedFocusRecords().map(r=>r.meta.name)}

function currentFocusMeta(){
  const record=selectedFocusRecords()[0];
  if(record){
    $("trainingDay").value=String(Math.max(...selectedFocusRecords().map(r=>r.day)));
    return record.meta;
  }
  return null;
}

function focusNamesForData(d){
  return Array.isArray(d.focuses)&&d.focuses.length?d.focuses:[d.type].filter(Boolean);
}

function focusSearchText(d){
  return `${focusNamesForData(d).join(' ')} ${(d.curriculumObjectives||[]).join(' ')} ${d.curriculumObjective||''}`.toLowerCase();
}

function isReinstateRoleplay(dOrNames){
  const names=Array.isArray(dOrNames)?dOrNames:focusNamesForData(dOrNames||{});
  return names.some(name=>{
    const n=String(name||"").toLowerCase();
    return n.includes("reinstate cancelled reservation") && n.includes("roleplay");
  });
}

function isSoloStudioScenario(dOrNames){
  const names=Array.isArray(dOrNames)?dOrNames:focusNamesForData(dOrNames||{});
  return names.some(name=>String(name||"").toLowerCase().includes("solo guest / studio booking"));
}

function isAddGuestUpgradeRoleplay(dOrNames){
  const names=Array.isArray(dOrNames)?dOrNames:focusNamesForData(dOrNames||{});
  return names.some(name=>String(name||"").toLowerCase().includes("add guest & upgrade stateroom"));
}

function isMultipleAuthorizedScenario(dOrNames){
  const names=Array.isArray(dOrNames)?dOrNames:focusNamesForData(dOrNames||{});
  return names.some(name=>{
    const n=String(name||"").toLowerCase();
    return n.includes("multiple reservations & authorized person") && !n.includes("cruisetour");
  });
}

function isMultipleAuthorizedCruisetourScenario(dOrNames){
  const names=Array.isArray(dOrNames)?dOrNames:focusNamesForData(dOrNames||{});
  return names.some(name=>String(name||"").toLowerCase().includes("multiple reservations & authorized person – cruisetour"));
}

function isMultipleAuthorizedAny(dOrNames){
  return isMultipleAuthorizedScenario(dOrNames)||isMultipleAuthorizedCruisetourScenario(dOrNames);
}

function setSailingSearchPreset(anchor,value,from,to,duration=""){
  const radio=document.querySelector(`input[name="searchAnchor"][value="${anchor}"]`);
  if(radio){
    radio.checked=true;
    updateAnchorUI();
    chooseAnchorValue(value);
  }
  if($("searchFrom"))$("searchFrom").value=from;
  if($("searchTo")){
    $("searchTo").min=from;
    $("searchTo").max=addDays(from,30);
    $("searchTo").value=to;
  }
  if($("searchDuration"))$("searchDuration").value=duration;
  updateDateHint();
}

function applyMultipleAuthorizedGuests(){
  $("guestCount").value="4";
  $("guest1").value="Maria Lopez";
  $("guest2").value="Sofia";
  $("latitudesToggle").checked=true;
  renderLatitudesFields(
    ["279019549","279019550","279019849","279019848"],
    [true,true,true,true]
  );
}

function isDedicatedRoleplay(d){
  if(!d)return false;
  if(isReinstateRoleplay(d)||isAddGuestUpgradeRoleplay(d))return true;
  return Array.isArray(d.curriculumKinds)&&d.curriculumKinds.some(k=>String(k).includes("roleplay"));
}

function isRoleplayScenario(d){
  return !!d && (Boolean(d.roleplayMode)||isDedicatedRoleplay(d));
}

function roleplayCallerLabel(d){
  if(isAddGuestUpgradeRoleplay(d)||isSoloStudioScenario(d))return "Travel Agent — Kyle James";
  if(d.gdprCallerType==="travel_agent"||d.gdprCallerType==="ta_group")return "Travel Agent";
  if(d.gdprCallerType==="direct_guest")return "Direct Guest";
  if(d.gdprCallerType){
    const profile=gdprProfile(d.gdprCallerType);
    if(profile?.label)return profile.label;
  }
  if(d.department==="Guest Services"&&d.reservationWorkflow==="new"){
    const caller=newReservationCallerInfo(d.newCallerType);
    return caller.type==="travel_agent"?"Travel Agent":caller.label.replace(" — US","").replace(" — Canada","");
  }
  if(d.department==="Outbound Sales")return "Guest";
  return "Caller";
}

function focusTitle(d){return focusNamesForData(d).join(' + ')||'SEAweb Practice'}

function updateFocusPickerDisplay(){
  const records=selectedFocusRecords();
  const names=records.map(r=>r.meta.name);
  const btn=$("focusPickerText");
  if(btn)btn.textContent=names.length?`${names.length} selected • ${names.slice(0,2).join(' + ')}${names.length>2?'…':''}`:'Choose one or more focuses…';
  const chips=$("selectedFocusChips");
  if(chips)chips.innerHTML=names.map(n=>`<span class="focus-chip">${escapeHtml(n)}</span>`).join('');
  const hidden=$("scenarioType");
  if(hidden){
    const first=records[0];
    if(first){
      const opt=[...hidden.options].find(o=>o.value===first.meta.name&&o.dataset.day===String(first.day));
      if(opt)opt.selected=true;
    }else hidden.selectedIndex=-1;
  }
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

function newReservationCallerInfo(value){
  const caller=value||"direct_us";
  if(caller==="direct_ca")return {type:"direct_ca",label:"Direct Guest — Canada",agency:"7"};
  if(caller==="travel_agent")return {type:"travel_agent",label:"Travel Agent",agency:""};
  return {type:"direct_us",label:"Direct Guest — US",agency:"5"};
}

function newReservationCallerLabel(d){
  if(d.department!=="Guest Services")return "Outbound Guest";
  return newReservationCallerInfo(d.newCallerType).label;
}

function guestServicesAgencyInfo(value){
  const agency=String(value||"").trim();
  if(agency==="5")return {type:"direct_us",caller:"direct_guest",label:"Direct Guest — US",display:"Agency 5 • Direct Guest (US)"};
  if(agency==="7")return {type:"direct_ca",caller:"direct_guest",label:"Direct Guest — Canada",display:"Agency 7 • Direct Guest (Canada)"};
  if(agency)return {type:"travel_agent",caller:"travel_agent",label:"Travel Agent Booking",display:`Travel Agent • Agency ID / Phone: ${agency}`};
  return {type:"unknown",caller:"",label:"Booking Source Not Set",display:"Agency / booking identifier not entered"};
}

function guestServicesAgencyDisplay(value){
  return guestServicesAgencyInfo(value).display;
}

function syncAgencyCallerLogic(){
  const dept=$("department")?.value;
  const workflow=$("reservationWorkflow")?.value||"new";
  const outbound=dept==="Outbound Sales";
  const agency=$("agency");
  const newCallerField=$("newCallerTypeField");
  const newCaller=$("newCallerType");
  if(!agency)return;

  newCallerField?.classList.toggle("workflow-hidden",outbound||workflow!=="new");

  if(outbound){
    agency.readOnly=true;
    agency.value=$("marketAgency")?.value||marketAgencies[0][1];
    $("agencyHint").textContent="Outbound agency is set by the selected Market / Currency.";
    $("agencyField")?.classList.add("agency-locked");
  }else if(workflow==="new"){
    const caller=newReservationCallerInfo(newCaller?.value||"direct_us");

    if(caller.type==="direct_us"){
      agency.value="5";
      agency.readOnly=true;
      $("agencyHint").textContent="Direct Guest — US automatically uses Agency 5.";
      $("newCallerTypeHint").textContent="Direct Guest — US: scenario wording uses a direct guest caller and Agency 5.";
      $("agencyField")?.classList.add("agency-locked");
    }else if(caller.type==="direct_ca"){
      agency.value="7";
      agency.readOnly=true;
      $("agencyHint").textContent="Direct Guest — Canada automatically uses Agency 7.";
      $("newCallerTypeHint").textContent="Direct Guest — Canada: scenario wording uses a Canadian direct guest caller and Agency 7.";
      $("agencyField")?.classList.add("agency-locked");
    }else{
      if(["5","7"].includes(agency.value.trim()))agency.value="";
      agency.readOnly=false;
      $("agencyHint").textContent="Travel Agent booking: enter the Travel Agent's Agency ID or phone number.";
      $("newCallerTypeHint").textContent="Travel Agent: scenario wording uses a Travel Advisor caller. Enter the Travel Agent's Agency ID or phone number below.";
      $("agencyField")?.classList.remove("agency-locked");
    }
  }else{
    agency.readOnly=false;
    $("agencyHint").textContent="Agency 5 = Direct Guest (US) • Agency 7 = Direct Guest (Canada) • Travel Agent booking = enter the Travel Agent's Agency ID or phone number.";
    $("agencyField")?.classList.remove("agency-locked");
  }

  if(dept==="Guest Services" && workflow==="modify"){
    const info=guestServicesAgencyInfo(agency.value);
    const caller=$("gdprCallerType");
    const hint=$("gdprCallerHint");

    if(info.type==="direct_us" || info.type==="direct_ca"){
      caller.value="direct_guest";
      caller.disabled=true;
      if(hint)hint.textContent=`${info.label}: GDPR caller type is automatically Direct Guest.`;
    }else{
      caller.disabled=false;
      if(caller.value==="direct_guest")caller.value="";
      if(hint)hint.textContent="Travel Agent booking: enter the Travel Agent's Agency ID or phone number above and select Travel Agent. PCC, Direct Group, Casino, and other caller types can still be selected when applicable.";
    }
  }else{
    $("gdprCallerType").disabled=false;
    if($("gdprCallerHint"))$("gdprCallerHint").textContent="";
  }

  updateGdprPreview();
}

function updateDepartmentUI(){
  const dept=$("department").value;
  const outbound=dept==="Outbound Sales";
  $("marketAgencyField").classList.toggle("hidden-field",!outbound);
  if(outbound){
    $("agency").value=$("marketAgency").value||marketAgencies[0][1];
  }
  syncAgencyCallerLogic();
  updateScenarioFocus();
  updateGdprPreview();
}

function updateScenarioFocus(preferred,preferredDay,preferredList){
  const dept=$("department").value;
  const all=allFocusRecords(dept);
  $("scenarioType").innerHTML=all.map(({day,meta})=>`<option value="${escapeAttr(meta.name)}" data-day="${day}">${escapeHtml(meta.name)}</option>`).join("");

  const requested=Array.isArray(preferredList)&&preferredList.length?preferredList:(preferred?[preferred]:[]);
  $("focusPickerOptions").innerHTML=all.map(({day,meta})=>{
    const checked=requested.some(name=>name===meta.name) || (!requested.length && all[0]?.meta.name===meta.name && all[0]?.day===day);
    return `<label class="focus-choice"><input class="focus-choice-input" type="checkbox" value="${escapeAttr(meta.name)}" data-day="${day}" ${checked?'checked':''}/><span><strong>${escapeHtml(meta.name)}</strong><small>${escapeHtml(meta.objective)}</small></span></label>`;
  }).join("");

  $("focusPickerOptions").querySelectorAll('.focus-choice-input').forEach(input=>input.addEventListener('change',syncScenarioFocusSelection));
  if(preferred && preferredDay){
    const exact=[...$("focusPickerOptions").querySelectorAll('.focus-choice-input')].find(i=>i.value===preferred&&i.dataset.day===String(preferredDay));
    if(exact && requested.length<=1){
      $("focusPickerOptions").querySelectorAll('.focus-choice-input').forEach(i=>i.checked=false);
      exact.checked=true;
    }
  }
  syncScenarioFocusSelection();
}

function clearScenarioFocusSelections(){
  $("focusPickerOptions")?.querySelectorAll('.focus-choice-input').forEach(i=>i.checked=false);
  $("scenarioType").selectedIndex=-1;
  $("trainingDay").value="6";
  updateFocusPickerDisplay();
  $("curriculumNote").innerHTML="";
  if($("couponToggle"))$("couponToggle").checked=false;
  if(typeof refreshCouponPanel==="function")refreshCouponPanel();
}

function syncScenarioFocusSelection(){
  const records=selectedFocusRecords();
  if(records.length)$("trainingDay").value=String(Math.max(...records.map(r=>r.day)));
  updateFocusPickerDisplay();
  applyFocusDefaults();
}

function openFocusPicker(){$("focusPickerMenu").classList.add('open');$("focusPickerBtn").setAttribute('aria-expanded','true')}
function closeFocusPicker(){$("focusPickerMenu").classList.remove('open');$("focusPickerBtn").setAttribute('aria-expanded','false')}

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
    return `<section class="scenario-section gdpr-output-section"><div class="section-label">GDPR — REQUIRED</div><h3 class="visual-section-heading"><span class="scenario-icon">🔐</span><span>Complete GDPR Verification First</span></h3><p>Caller type has not been selected. The trainer must identify the correct GDPR caller / reservation type before this scenario is assigned.</p></section>`;
  }
  const action=gdprActionText(d);
  return `<section class="scenario-section gdpr-output-section">
    <div class="section-label">GDPR — REQUIRED • GUEST SERVICES</div>
    <h3 class="visual-section-heading"><span class="scenario-icon">🔐</span><span>Complete GDPR Verification First</span></h3>
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
  $("guest1Field")?.classList.toggle("workflow-hidden",modify);
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

  if(type==="air_transfer") $("airToggle").checked=true;
  if(applyDefaults)updateModificationDefaults();
  syncAirPanelFromScenario(applyDefaults);
  refreshCouponPanel();
  updateGdprPreview();
}

function updateWorkflowUI(applyDefaults=false){
  const modify=$("reservationWorkflow").value==="modify";
  if(modify){
    $("guest1").value="";
    $("guest2").value="";
  }
  updateModificationTypeUI(applyDefaults);
  syncAgencyCallerLogic();
  updateGdprPreview();
}
function paymentActionNeedsCard(){
  return ["Minimum Deposit","Initial Deposit","Full Payment","Amenity Payment"].includes($("paymentAction").value);
}

function refreshTrainingCardPanel(preferredProfile){
  const meta=currentFocusMeta()||{};
  const metas=selectedFocusMetas();
  const showCard=metas.some(m=>m.cardRequired)||!!meta.cardRequired||paymentActionNeedsCard();
  $("trainingCardPanel").classList.toggle("hidden-field",!showCard);
  if(showCard){
    const focusCard=metas.find(m=>m.cardRequired&&m.cardProfile)?.cardProfile||metas.find(m=>m.cardProfile)?.cardProfile;
    const desired=preferredProfile||focusCard||meta.cardProfile||$("trainingCardProfile").value||"standardSesame";
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

const couponTypes=[
  "CruiseNext Credit",
  "Future Cruise Credit (FCC)",
  "10% Discount Coupon",
  "CruiseFirst Credit",
  "Latitudes / Guest Coupon",
  "Other Credit / Coupon"
];
let couponRowSequence=0;

function couponWorkflowRequested(){
  const text=selectedFocusMetas().map(m=>`${m.name} ${m.objective}`).join(" ").toLowerCase();
  return !!$("couponToggle")?.checked || /fcc|cruisenext|cruise first|coupon|credit/.test(text) || $("paymentAction")?.value==="FCC / CruiseNext" || ($("reservationWorkflow")?.value==="modify" && $("modificationType")?.value==="credit_coupon");
}

function couponGuestNames(){
  const count=+$("guestCount")?.value||1;
  return Array.from({length:count},(_,i)=>guestDisplayName(i)).filter(Boolean);
}

function refreshCouponGuestOptions(){
  const list=$("couponGuestOptions");
  if(!list)return;
  list.innerHTML=couponGuestNames().map(name=>`<option value="${escapeAttr(name)}"></option>`).join("");
}

function latitudeForGuestName(name){
  const target=String(name||"").trim().toLowerCase();
  if(!target)return "";
  const names=couponGuestNames();
  const nums=collectLatitudesNumbers();
  const idx=names.findIndex(n=>n.toLowerCase()===target);
  return idx>=0?(nums[idx]||""):"";
}

function addCouponRow(data={}){
  const host=$("couponRows");
  if(!host)return;
  const id=++couponRowSequence;
  const row=document.createElement("div");
  row.className="coupon-row";
  row.style.minWidth="0";
  row.dataset.couponRow=String(id);
  row.innerHTML=`
    <label>Credit / Coupon Type
      <select class="coupon-type">
        <option value="">Choose credit / coupon...</option>
        ${couponTypes.map(type=>`<option value="${escapeAttr(type)}" ${data.type===type?'selected':''}>${escapeHtml(type)}</option>`).join('')}
      </select>
    </label>
    <label>Source Guest
      <input class="coupon-guest" list="couponGuestOptions" value="${escapeAttr(data.guest||'')}" placeholder="Guest whose profile owns the coupon" />
    </label>
    <label>Source Latitudes #
      <input class="coupon-latitudes" inputmode="numeric" maxlength="12" value="${escapeAttr(data.latitudes||'')}" placeholder="Latitudes number" />
    </label>
    <label>Details / Value <span class="optional-label">optional</span>
      <input class="coupon-detail" value="${escapeAttr(data.detail||'')}" placeholder="Example: 10% off, $250, certificate #..." />
    </label>
    <button type="button" class="coupon-remove secondary tiny" aria-label="Remove credit or coupon">Remove</button>`;
  host.appendChild(row);
  const guest=row.querySelector('.coupon-guest');
  const lat=row.querySelector('.coupon-latitudes');
  guest.addEventListener('change',()=>{if(!lat.value.trim()){const found=latitudeForGuestName(guest.value);if(found)lat.value=found;}});
  guest.addEventListener('blur',()=>{if(!lat.value.trim()){const found=latitudeForGuestName(guest.value);if(found)lat.value=found;}});
  lat.addEventListener('input',()=>{lat.value=lat.value.replace(/[^0-9]/g,'')});
  row.querySelector('.coupon-remove').addEventListener('click',()=>{row.remove();if(!$("couponRows").children.length && couponWorkflowRequested())addCouponRow();});
}

function collectCoupons(){
  return [...document.querySelectorAll('#couponRows .coupon-row')].map(row=>({
    type:row.querySelector('.coupon-type')?.value||"",
    guest:row.querySelector('.coupon-guest')?.value.trim()||"",
    latitudes:row.querySelector('.coupon-latitudes')?.value.trim()||"",
    detail:row.querySelector('.coupon-detail')?.value.trim()||""
  })).filter(x=>x.type||x.guest||x.latitudes||x.detail);
}

function setCouponRows(items=[]){
  $("couponRows").innerHTML="";
  (Array.isArray(items)?items:[]).forEach(item=>addCouponRow(item));
  if(!$("couponRows").children.length && couponWorkflowRequested())addCouponRow();
  refreshCouponGuestOptions();
}

function refreshCouponPanel(){
  const show=couponWorkflowRequested();
  $("couponPanel")?.classList.toggle('hidden-field',!show);
  refreshCouponGuestOptions();
  if(show && !$("couponRows").children.length)addCouponRow();
}

function couponLabel(item){
  return `${item.type||'Credit / Coupon'}${item.detail?` — ${item.detail}`:''}`;
}

function couponScenarioHtml(d){
  if(!Array.isArray(d.coupons)||!d.coupons.length)return '';
  const rows=d.coupons.map((item,i)=>`<div class="scenario-coupon-card"><span>Credit / Coupon ${i+1}</span><strong>${escapeHtml(couponLabel(item))}</strong><small>${escapeHtml(item.guest||'Source guest not entered')} • Latitudes # ${escapeHtml(item.latitudes||'Not entered')}</small></div>`).join('');
  return `<section class="scenario-section visual-section coupon-output-section">${scenarioIconHeading('🎟️','Credits & Coupons')}<div class="scenario-coupon-grid">${rows}</div><p class="scenario-reminder">Apply each credit/coupon from the specified training Latitudes profile and follow the required reservation-status / sequencing workflow before saving.</p></section>`;
}

function couponTaskItems(d){
  if(!Array.isArray(d.coupons)||!d.coupons.length)return [];
  return d.coupons.map(item=>`Apply ${couponLabel(item)}${item.guest?` from ${item.guest}`:''}${item.latitudes?` (Latitudes # ${item.latitudes})`:''} using the required reservation-status and sequencing workflow.`);
}

function applyFocusDefaults(){
  const records=selectedFocusRecords();
  const metas=records.map(r=>r.meta);
  const meta=metas[0];
  if(!meta){
    updateFocusPickerDisplay();
    return;
  }
  const focusText=metas.map(m=>`${m.name} ${m.objective}`).join(' ').toLowerCase();
  const difficultyRank={Beginner:1,Intermediate:2,Advanced:3,Challenge:4};
  const difficulty=metas.reduce((best,m)=>(difficultyRank[m.difficulty]||0)>(difficultyRank[best]||0)?m.difficulty:best,metas[0].difficulty||'Intermediate');
  const paymentRank={"No Payment / Service Only":0,"Auto Final Payment discussion":1,"Offer / Hold only":2,"FCC / CruiseNext":3,"Amenity Payment":4,"Minimum Deposit":5,"Initial Deposit":6,"Full Payment":7,"Refund / Reinstate":8};
  const payment=metas.reduce((best,m)=>(paymentRank[m.payment]??0)>(paymentRank[best]??0)?m.payment:best,metas[0].payment||"No Payment / Service Only");
  const cardMeta=metas.find(m=>m.cardRequired&&m.cardProfile)||metas.find(m=>m.cardProfile)||meta;

  $("difficulty").value=difficulty||"Intermediate";
  $("paymentAction").value=payment;

  const reinstateRoleplay=metas.some(m=>m.kind==="roleplay" || m.name==="Reinstate Cancelled Reservation – Roleplay");
  const soloStudio=metas.some(m=>m.kind==="solo_studio" || m.name==="Solo Guest / Studio Booking");
  const addGuestUpgrade=metas.some(m=>m.kind==="add_guest_upgrade_roleplay" || m.name==="Add Guest & Upgrade Stateroom – Roleplay");
  const multiAuthorized=metas.some(m=>m.kind==="multi_authorized" || m.name==="Multiple Reservations & Authorized Person");
  const multiAuthorizedCruisetour=metas.some(m=>m.kind==="multi_authorized_cruisetour" || m.name==="Multiple Reservations & Authorized Person – Cruisetour");

  if(reinstateRoleplay && $("department").value==="Guest Services"){
    $("reservationWorkflow").value="modify";
    updateWorkflowUI(false);
    $("modificationType").value="cancel_reinstate";
    if(!$("modificationRequest").value.trim()){
      $("modificationRequest").value="Reinstate a training reservation that was cancelled yesterday. Verify it was cancelled within the last 24 hours, confirm the previous stateroom is still available, verify pricing is the same as before, then Store Changes.";
    }
    $("commentToggle").checked=true;
    $("confirmToggle").checked=true;
    $("paymentAction").value="Refund / Reinstate";
    updateModificationTypeUI(false);
    syncAgencyCallerLogic();
  }

  if(soloStudio && $("department").value==="Guest Services"){
    $("reservationWorkflow").value="new";
    updateWorkflowUI(false);
    $("newCallerType").value="travel_agent";
    syncAgencyCallerLogic();
    $("agency").value="305-436-1000";
    $("guestCount").value="1";
    $("guest1").value="Tom Holland";
    $("guest2").value="";
    $("category").value="Studio / Solo";
    $("locationPref").value="Any";
    $("sidePref").value="Any";
    $("paymentAction").value="Minimum Deposit";
    $("commentToggle").checked=true;
    $("confirmToggle").checked=true;
    $("fasToggle").checked=true;
    $("pscToggle").checked=true;
    $("travelToggle").checked=true;
    $("latitudesToggle").checked=false;
    $("confirmationEmail").value="training123@ncl.com";
    $("trainingCardProfile").value="alternateSesame";
    renderTrainingCard();
  }

  if(addGuestUpgrade && $("department").value==="Guest Services"){
    $("reservationWorkflow").value="modify";
    updateWorkflowUI(false);
    $("agency").value="305-436-1000";
    $("gdprCallerType").value="travel_agent";
    $("modificationType").value="add_guest";
    $("modificationTarget").value="Taylor";
    $("modificationGuestStatus").value="past";
    $("modificationLatitudes").value="272279126";
    $("modificationRequest").value="Use today's Solo Guest / Studio Booking reservation. Add Taylor, upgrade the Studio to a category that accommodates two guests, find a stateroom as close as possible to elevators/stairs, set Twin Beds, retain Tom's Kosher Meal request, add Taylor's mushroom allergy, verify Free at Sea, Pre-Paid Service Charges and Norwegian Care for both guests, quote the new pricing/reservation total, check for any additional deposit due, then Store Changes.";
    $("category").value="Balcony";
    $("locationPref").value="Near stairs/elevators";
    $("sidePref").value="Any";
    $("paymentAction").value="No Payment / Service Only";
    $("commentToggle").checked=true;
    $("confirmToggle").checked=true;
    $("fasToggle").checked=true;
    $("pscToggle").checked=true;
    $("travelToggle").checked=true;
    $("confirmationEmail").value="training123@ncl.com";
    $("trainingCardProfile").value="alternateSesame";
    renderTrainingCard();
    updateModificationTypeUI(false);
    syncAgencyCallerLogic();
  }

  if((multiAuthorized||multiAuthorizedCruisetour) && $("department").value==="Guest Services"){
    $("reservationWorkflow").value="new";
    updateWorkflowUI(false);
    $("newCallerType").value="direct_us";
    syncAgencyCallerLogic();
    $("agency").value="5";
    applyMultipleAuthorizedGuests();
    $("category").value="Balcony";
    $("locationPref").value="Any";
    $("sidePref").value="Any";
    $("paymentAction").value="Initial Deposit";
    $("commentToggle").checked=true;
    $("confirmToggle").checked=true;
    $("fasToggle").checked=true;
    $("pscToggle").checked=true;
    $("travelToggle").checked=true;
    $("confirmationEmail").value="training123@ncl.com";
    $("trainingCardProfile").value="alternateSesame";
    renderTrainingCard();

    // Prevent a sailing from a previous practice from silently carrying over.
    state.selectedSailing=null;
    renderSelectedSailing();

    if(multiAuthorizedCruisetour){
      setSailingSearchPreset("ship","Pride of America","2027-03-01","2027-03-31","");
    }else{
      setSailingSearchPreset("departure","Galveston","2027-03-01","2027-03-31","");
    }
  }

  if($("department").value==="Guest Services" && $("reservationWorkflow").value==="new" && metas.some(m=>m.name==="Agencies: TA Booking")){
    $("newCallerType").value="travel_agent";
    syncAgencyCallerLogic();
  }
  $("commentToggle").checked=metas.some(m=>m.commenting);
  $("confirmToggle").checked=true;
  $("fasToggle").checked=soloStudio||addGuestUpgrade||multiAuthorized||multiAuthorizedCruisetour||/\bfas\b|free at sea/.test(focusText);
  $("travelToggle").checked=soloStudio||addGuestUpgrade||multiAuthorized||multiAuthorizedCruisetour||/norwegian care|travel protection/.test(focusText);
  $("pscToggle").checked=soloStudio||addGuestUpgrade||multiAuthorized||multiAuthorizedCruisetour||/ppsrvchg|prepaid service charge/.test(focusText);
  $("couponToggle").checked=/fcc|cruisenext|cruise first|coupon|credit/.test(focusText);
  $("latitudesToggle").checked=soloStudio?false:(multiAuthorized||multiAuthorizedCruisetour?true:(!/\bnew guest\b/.test(focusText)));
  if(multiAuthorized||multiAuthorizedCruisetour){
    renderLatitudesFields(["279019549","279019550","279019849","279019848"],[true,true,true,true]);
  }else{
    refreshLatitudesPanel();
  }

  if(/\bada\b|accessible/.test(focusText)){
    $("category").value="ADA / Accessible";
    $("locationPref").value="Any";
    $("sidePref").value="Any";
  }

  if($("reservationWorkflow")?.value==="modify" && $("modificationType")){
    if(addGuestUpgrade){
      $("modificationType").value="add_guest";
      updateModificationTypeUI(false);
    }else if(reinstateRoleplay){
      $("modificationType").value="cancel_reinstate";
      updateModificationTypeUI(false);
    }else{
      const modMeta=metas.find(m=>m.kind==='followup')||meta;
      $("modificationType").value=inferModificationType(modMeta);
      updateModificationTypeUI(true);
    }
  }else updateWorkflowUI(false);

  refreshTrainingCardPanel(cardMeta.cardProfile);
  refreshCouponPanel();
  syncAirPanelFromScenario(true);
  const level=trainingSupportLabel(+$("trainingDay").value);
  $("curriculumNote").innerHTML=`<strong>${escapeHtml($("department").value)} • ${metas.length} focus${metas.length===1?'':'es'}</strong><span>${metas.map(m=>escapeHtml(m.name)).join(' • ')}</span><span class="support-level">Trainee support: ${escapeHtml(level)}</span>`;
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
$("focusPickerBtn").addEventListener("click",e=>{e.stopPropagation();$("focusPickerMenu").classList.contains("open")?closeFocusPicker():openFocusPicker()});
$("clearFocusBtn").addEventListener("click",()=>{clearScenarioFocusSelections();applyFocusDefaults()});
$("doneFocusBtn").addEventListener("click",closeFocusPicker);
document.addEventListener("click",e=>{const picker=$("focusPicker");if(picker&&!picker.contains(e.target))closeFocusPicker()});
$("reservationWorkflow").addEventListener("change",()=>updateWorkflowUI(true));
$("modificationType").addEventListener("change",()=>updateModificationTypeUI(true));
$("modificationGuestStatus").addEventListener("change",()=>updateModificationTypeUI(false));
$("modificationLatitudes").addEventListener("input",()=>{$("modificationLatitudes").value=$("modificationLatitudes").value.replace(/[^0-9]/g,"")});
$("airToggle").addEventListener("change",updateAirProgramPreview);
$("airProgram").addEventListener("change",updateAirProgramPreview);
$("airTripType").addEventListener("change",updateAirProgramPreview);
$("airOneWayDirection").addEventListener("change",updateAirProgramPreview);
$("gdprCallerType").addEventListener("change",updateGdprPreview);
$("directGroupMarket").addEventListener("change",updateGdprPreview);
$("agency").addEventListener("input",syncAgencyCallerLogic);
$("newCallerType").addEventListener("change",syncAgencyCallerLogic);
$("marketAgency").addEventListener("change",()=>{$("agency").value=$("marketAgency").value});
$("trainingCardProfile").addEventListener("change",renderTrainingCard);
$("resetTrainingCardBtn").addEventListener("click",renderTrainingCard);
$("trainingCardNumber").addEventListener("input",()=>{$("trainingCardNumber").value=$("trainingCardNumber").value.replace(/[^0-9 ]/g,"")});
$("trainingCardCcv").addEventListener("input",()=>{$("trainingCardCcv").value=$("trainingCardCcv").value.replace(/[^0-9]/g,"")});
$("paymentAction").addEventListener("change",()=>{refreshTrainingCardPanel();refreshCouponPanel()});
$("addCouponBtn").addEventListener("click",()=>addCouponRow());
$("couponToggle").addEventListener("change",refreshCouponPanel);
$("latitudesToggle").addEventListener("change",()=>refreshLatitudesPanel());
$("guestCount").addEventListener("change",()=>{refreshLatitudesPanel();refreshCouponGuestOptions()});
$("guest1").addEventListener("input",()=>{if($("latitudesToggle").checked)renderLatitudesFields();refreshCouponGuestOptions()});
$("guest2").addEventListener("input",()=>{if($("latitudesToggle").checked)renderLatitudesFields();refreshCouponGuestOptions()});

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
    {value:"Galveston",detail:"Galveston, Texas"},
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

function formatSailingDate(iso){
  if(!iso)return "";
  const d=parseIsoLocal(iso);
  if(!d)return iso;
  return d.toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"});
}

function sailingDateText(s){
  if(!s)return "";
  if(s.sailingDate)return formatSailingDate(s.sailingDate);
  return (s.sailingMonths||[]).join(", ");
}

function sailingDateControlHtml(s,i){
  const exact=(s.sailingDates||[]).filter(Boolean);
  if(exact.length){
    return `<label class="result-sailing-date"><span>Specific Sailing Date</span><select id="sailingDate-${i}">
      <option value="">Choose a sailing date…</option>
      ${exact.map(d=>`<option value="${escapeAttr(d)}">${escapeHtml(formatSailingDate(d))}</option>`).join("")}
    </select><small>Exact date exposed by NCL.com U.S.</small></label>`;
  }

  const min=$("searchFrom")?.value||"";
  const max=$("searchTo")?.value||"";
  return `<label class="result-sailing-date"><span>Specific Sailing Date</span><input id="sailingDate-${i}" type="date"${min?` min="${escapeAttr(min)}"`:""}${max?` max="${escapeAttr(max)}"`:""} />
    <small>NCL's public card did not expose an exact date. Enter the sailing date after verifying it on NCL.com U.S. or in Seaweb.</small></label>`;
}

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
  resetItineraryChooser();
  $("searchResults").innerHTML="";
  state.sailings=[];
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

  resetItineraryChooser();
  const btn=$("searchSailingsBtn"); btn.disabled=true; btn.textContent="Searching…";
  $("searchNotice").className="notice info";
  $("searchNotice").textContent=`Loading NCL.com U.S. itinerary data from ${from} through ${to} by ${currentAnchor()==="departure"?"embarkation port":currentAnchor()} only…`;
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
  resetItineraryChooser();
  $("searchNotice").className="notice info";$("searchNotice").textContent="Importing the NCL page…";
  try{
    const r=await fetch(`/api/sailings?url=${encodeURIComponent(url)}`), data=await r.json();
    if(!r.ok) throw new Error(data.error||"Import failed");
    state.sailings=data.results||[]; renderSearchResults();
    $("searchNotice").className="notice success";$("searchNotice").textContent=data.message||"Imported.";
  }catch(e){$("searchNotice").className="notice error";$("searchNotice").textContent=e.message}
};

function renderSearchResults(){
  if(!state.sailings.length){
    $("searchResults").innerHTML=`<div class="panel muted">No matching sailings were found in the retrieved NCL results.</div>`;
    populateItineraryChooser();
    return;
  }
  $("searchResults").innerHTML=state.sailings.map((s,i)=>`
    <div class="result-card" data-sailing-index="${i}">
      <div class="verified">● NCL.com U.S. itinerary</div>
      <h3>${escapeHtml(s.duration ? `${s.duration}-day Cruise on ${s.ship}` : s.ship||"NCL Sailing")}</h3>
      <strong>${escapeHtml(s.title||"")}</strong>
      <div class="meta">
        ${s.departure?`<span class="chip">From ${escapeHtml(s.departure)}</span>`:""}
        ${(s.sailingDates||[]).length
          ? `<span class="chip">${escapeHtml(String(s.sailingDates.length))} exact date${s.sailingDates.length===1?"":"s"} found</span>`
          : (s.sailingMonths||[]).map(x=>`<span class="chip">${escapeHtml(x)}</span>`).join("")}
      </div>
      ${s.ports?.length?`<div class="port-list"><strong>Ports:</strong> ${s.ports.map(escapeHtml).join(" • ")}</div>`:""}
      <div class="meta">
        ${s.price?`<span class="price">${escapeHtml(s.price)}</span>`:""}
        ${s.taxes?`<span class="chip">${escapeHtml(s.taxes)}</span>`:""}
        ${(s.offers||[]).map(x=>`<span class="chip">${escapeHtml(x)}</span>`).join("")}
      </div>
      <div class="muted" style="font-size:11px">Retrieved ${new Date(s.retrievedAt||Date.now()).toLocaleString()}</div>
      <div class="actions">
        <button class="secondary" type="button" onclick="chooseItineraryFromCard(${i})">Choose This Itinerary</button>
        <a class="secondary" href="${escapeAttr(s.sourceUrl)}" target="_blank" rel="noopener" style="text-decoration:none">Open NCL Source</a>
      </div>
    </div>`).join("");
  populateItineraryChooser();
}
function itineraryOptionLabel(s){
  const bits=[];
  if(s.ship)bits.push(s.ship);
  if(s.title)bits.push(s.title);
  if(s.departure)bits.push(`From ${s.departure}`);
  if(s.duration)bits.push(`${s.duration} days`);
  return bits.join(" • ")||"NCL itinerary";
}

function resetItineraryChooser(){
  state.pendingSailingIndex=null;
  const itinerary=$("itinerarySelect");
  const exact=$("exactSailingDateSelect");
  const manual=$("manualSailingDate");
  if(itinerary)itinerary.value="";
  if(exact){
    exact.innerHTML='<option value="">Choose an itinerary first…</option>';
    exact.disabled=true;
  }
  if(manual)manual.value="";
  if(state.pendingSailingIndex!==null && state.sailings[state.pendingSailingIndex]){
    const s=state.sailings[state.pendingSailingIndex];
    delete s.scheduleDateSource;
    delete s.scheduleDateSourceType;
    delete s.scheduleSourceUrl;
    delete s.scheduleVerificationRequired;
  }
  $("manualDateField")?.classList.add("hidden-field");
  $("exactDateSelectField")?.classList.remove("hidden-field");
  $("useItineraryDateBtn").disabled=true;
  $("itineraryChooserNotice").className="notice info";
  $("itineraryChooserNotice").textContent=state.sailings.length
    ?"Choose an itinerary from the first dropdown."
    :"Search for itineraries to populate the dropdown.";
  document.querySelectorAll(".result-card.itinerary-selected").forEach(el=>el.classList.remove("itinerary-selected"));
}

function populateItineraryChooser(){
  const itinerary=$("itinerarySelect");
  if(!itinerary)return;

  if(!state.sailings.length){
    itinerary.innerHTML='<option value="">Search itineraries first…</option>';
    itinerary.disabled=true;
    resetItineraryChooser();
    return;
  }

  itinerary.disabled=false;
  itinerary.innerHTML='<option value="">Choose an itinerary…</option>'+
    state.sailings.map((s,i)=>`<option value="${i}">${escapeHtml(itineraryOptionLabel(s))}</option>`).join("");

  resetItineraryChooser();
}

async function updateDateChooserForItinerary(){
  const itinerary=$("itinerarySelect");
  const value=itinerary?.value??"";
  const index=value===""?null:Number(value);
  const exactSelect=$("exactSailingDateSelect");
  const manual=$("manualSailingDate");

  state.pendingSailingIndex=Number.isInteger(index)?index:null;
  document.querySelectorAll(".result-card.itinerary-selected").forEach(el=>el.classList.remove("itinerary-selected"));

  if(state.pendingSailingIndex===null || !state.sailings[state.pendingSailingIndex]){
    exactSelect.innerHTML='<option value="">Choose an itinerary first…</option>';
    exactSelect.disabled=true;
    manual.value="";
    $("manualDateField").classList.add("hidden-field");
    $("exactDateSelectField").classList.remove("hidden-field");
    $("useItineraryDateBtn").disabled=true;
    $("itineraryChooserNotice").className="notice info";
    $("itineraryChooserNotice").textContent="Choose an itinerary from the first dropdown.";
    return;
  }

  const selectedIndex=state.pendingSailingIndex;
  const s=state.sailings[selectedIndex];
  document.querySelector(`.result-card[data-sailing-index="${selectedIndex}"]`)?.classList.add("itinerary-selected");

  manual.min=$("searchFrom")?.value||"";
  manual.max=$("searchTo")?.value||"";
  manual.value="";

  let exact=(s.sailingDates||[]).filter(Boolean);

  if(!exact.length){
    $("exactDateSelectField").classList.remove("hidden-field");
    $("manualDateField").classList.add("hidden-field");
    exactSelect.disabled=true;
    exactSelect.innerHTML='<option value="">Loading specific sailing dates from the public schedule…</option>';
    $("useItineraryDateBtn").disabled=true;
    $("itineraryChooserNotice").className="notice info";
    $("itineraryChooserNotice").textContent="Loading the matching departure dates for this itinerary…";

    try{
      const params=new URLSearchParams({
        source:s.sourceUrl||"https://www.ncl.com/vacations",
        ship:s.ship||"",
        title:s.title||"",
        departure:s.departure||"",
        duration:String(s.duration||""),
        ports:(s.ports||[]).join("|"),
        from:$("searchFrom")?.value||"",
        to:$("searchTo")?.value||""
      });
      const controller=new AbortController();
      const timeoutId=setTimeout(()=>controller.abort(),18000);
      let res;
      let data={};
      try{
        res=await fetch(`/api/sailing-dates?${params.toString()}&_v=1.9.30`,{
          cache:"no-store",
          signal:controller.signal
        });
        data=await res.json().catch(()=>({}));
      }finally{
        clearTimeout(timeoutId);
      }

      // Ignore a response if the trainer selected a different itinerary while
      // this lookup was running.
      if(state.pendingSailingIndex!==selectedIndex)return;

      if(res.ok && Array.isArray(data.dates) && data.dates.length){
        s.sailingDates=[...new Set(data.dates)].sort();
        if(data.detailUrl)s.detailSourceUrl=data.detailUrl;
        s.scheduleDateSource=data.sourceLabel||"Public sailing schedule";
        s.scheduleDateSourceType=data.sourceType||"public-schedule";
        s.scheduleSourceUrl=data.scheduleSourceUrl||"";
        s.scheduleVerificationRequired=data.verificationRequired!==false;
        exact=s.sailingDates;
      }
    }catch(err){
      if(state.pendingSailingIndex!==selectedIndex)return;
      $("itineraryChooserNotice").className="notice warning";
      $("itineraryChooserNotice").textContent=err?.name==="AbortError"
        ?"The sailing-date lookup took too long. Use the verified date field or choose the itinerary again to retry."
        :"The sailing-date lookup could not be completed. Use the verified date field or choose the itinerary again to retry.";
    }
  }

  if(state.pendingSailingIndex!==selectedIndex)return;

  if(exact.length){
    $("exactDateSelectField").classList.remove("hidden-field");
    $("manualDateField").classList.add("hidden-field");
    exactSelect.disabled=false;
    exactSelect.innerHTML='<option value="">Choose a specific sailing date…</option>'+
      exact.map(d=>`<option value="${escapeAttr(d)}">${escapeHtml(formatSailingDate(d))}</option>`).join("");
    const sourceLabel=s.scheduleDateSource||"NCL.com U.S.";
    const verify=s.scheduleVerificationRequired
      ?" Verify the final selection in NCL.com U.S. or Seaweb before class."
      :"";
    $("itineraryChooserNotice").className=s.scheduleVerificationRequired?"notice info":"notice success";
    $("itineraryChooserNotice").textContent=`${exact.length} sailing date${exact.length===1?"":"s"} loaded from ${sourceLabel}.${verify}`;
  }else{
    $("exactDateSelectField").classList.add("hidden-field");
    $("manualDateField").classList.remove("hidden-field");
    exactSelect.innerHTML='<option value="">No exact public dates returned</option>';
    exactSelect.disabled=true;
    $("itineraryChooserNotice").className="notice warning";
    $("itineraryChooserNotice").textContent="No matching public schedule dates were returned within this search window. You can use the verified date field, or adjust the search dates and try again.";
  }

  updateUseSailingButton();
}

function selectedChooserDate(){
  const i=state.pendingSailingIndex;
  const s=Number.isInteger(i)?state.sailings[i]:null;
  if(!s)return "";
  return (s.sailingDates||[]).length
    ? $("exactSailingDateSelect").value
    : $("manualSailingDate").value;
}

function updateUseSailingButton(){
  const date=selectedChooserDate();
  $("useItineraryDateBtn").disabled=!(Number.isInteger(state.pendingSailingIndex)&&date);
}

window.chooseItineraryFromCard=(i)=>{
  $("itinerarySelect").value=String(i);
  updateDateChooserForItinerary();
  $("itineraryDateChooser")?.scrollIntoView({behavior:"smooth",block:"start"});
};

$("itinerarySelect").addEventListener("change",updateDateChooserForItinerary);
$("exactSailingDateSelect").addEventListener("change",()=>{
  updateUseSailingButton();
  const value=$("exactSailingDateSelect").value;
  if(value){
    const s=Number.isInteger(state.pendingSailingIndex)?state.sailings[state.pendingSailingIndex]:null;
    const sourceLabel=s?.scheduleDateSource||"NCL.com U.S.";
    const verify=s?.scheduleVerificationRequired
      ?" • Verify this date in NCL.com U.S. or Seaweb before class."
      :"";
    $("itineraryChooserNotice").className=s?.scheduleVerificationRequired?"notice info":"notice success";
    $("itineraryChooserNotice").textContent=`Selected ${formatSailingDate(value)} from ${sourceLabel}${verify}`;
  }
});
$("manualSailingDate").addEventListener("change",()=>{
  updateUseSailingButton();
  const value=$("manualSailingDate").value;
  if(value){
    $("itineraryChooserNotice").className="notice info";
    $("itineraryChooserNotice").textContent=`${formatSailingDate(value)} will be used. Verify this exact sailing date on NCL.com U.S. or in Seaweb before class.`;
  }
});

$("clearItineraryChooserBtn").addEventListener("click",resetItineraryChooser);

$("useItineraryDateBtn").addEventListener("click",()=>{
  const i=state.pendingSailingIndex;
  const source=Number.isInteger(i)?state.sailings[i]:null;
  if(!source){
    alert("Choose an itinerary first.");
    return;
  }

  const sailingDate=selectedChooserDate();
  if(!sailingDate){
    alert("Choose the specific sailing date.");
    return;
  }

  const from=$("searchFrom")?.value||"";
  const to=$("searchTo")?.value||"";
  if((from && sailingDate<from)||(to && sailingDate>to)){
    alert("The sailing date must fall inside the current From/To search window.");
    return;
  }

  const exactDates=source.sailingDates||[];
  const cameFromLoadedSchedule=exactDates.includes(sailingDate);
  state.selectedSailing={
    ...source,
    sourceUrl:source.detailSourceUrl||source.sourceUrl,
    sailingDate,
    sailingDateVerified:cameFromLoadedSchedule,
    sailingDateSource:cameFromLoadedSchedule
      ? (source.scheduleDateSource||"NCL.com U.S.")
      : "Trainer verified",
    sailingDateSourceType:cameFromLoadedSchedule
      ? (source.scheduleDateSourceType||"ncl")
      : "manual",
    sailingDateVerificationRequired:cameFromLoadedSchedule
      ? Boolean(source.scheduleVerificationRequired)
      : true
  };

  renderSelectedSailing();
  go("generator");
});


function renderSelectedSailing(){
  const s=state.selectedSailing;
  if(!s){$("selectedSailingSummary").className="selected-sailing empty";$("selectedSailingSummary").textContent="No real sailing selected yet.";return}
  $("selectedSailingSummary").className="selected-sailing";
  const dateSource=s.sailingDateSource||"";
  const dateNote=s.sailingDate
    ? (s.sailingDateSourceType==="ncl"
        ? `<div class="selected-date-source ncl-date-source">Sailing date: ${escapeHtml(dateSource)}</div>`
        : `<div class="selected-date-note">Sailing date source: ${escapeHtml(dateSource||"Trainer verified")} — verify in NCL.com U.S. / Seaweb before class.</div>`)
    : "";
  $("selectedSailingSummary").innerHTML=`<div class="verified">● Itinerary verified from NCL.com U.S.</div><strong>${escapeHtml(s.ship||"")} • ${escapeHtml(s.title||"")}</strong><br><span class="muted">${s.sailingDate?`<strong>${escapeHtml(formatSailingDate(s.sailingDate))}</strong> • `:""}${s.departure?"From "+escapeHtml(s.departure)+" • ":""}${s.duration?s.duration+" days":""}</span>${dateNote}`;
}

function selectedMarketLabel(){
  const opt=$("marketAgency")?.selectedOptions?.[0];
  return opt ? (opt.dataset.market || opt.textContent) : "";
}

function scenarioData(){
  const records=selectedFocusRecords();
  const metas=records.map(r=>r.meta);
  const meta=metas[0]||{};
  const focusNames=metas.map(m=>m.name);
  const focusDays=records.map(r=>r.day);
  const cardKey=$("trainingCardProfile")?.value||metas.find(m=>m.cardProfile)?.cardProfile||"standardSesame";
  const cardRequired=metas.some(m=>m.cardRequired)||paymentActionNeedsCard();
  return {
    id: state.currentScenario?.id || crypto.randomUUID(),
    department:$("department").value,
    trainingDay:focusDays.length?Math.max(...focusDays):+$("trainingDay").value,
    approach:$("scenarioApproach").value,
    title:`${$("department").value} – ${focusNames.join(" + ")||"Scenario"}`,
    type:focusNames[0]||"",
    focuses:focusNames,
    focusDays,
    reservationWorkflow:$("reservationWorkflow")?.value||"new",
    newCallerType:$("department").value==="Guest Services"&&$("reservationWorkflow").value==="new"?$("newCallerType").value:"",
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
    agency:$("agency").value.trim(),
    bookingSource:$("department").value==="Guest Services"
      ? ($("reservationWorkflow").value==="new"?newReservationCallerInfo($("newCallerType").value).type:guestServicesAgencyInfo($("agency").value).type)
      :"outbound_market",
    market:$("department").value==="Outbound Sales"
      ? selectedMarketLabel()
      : ($("reservationWorkflow").value==="new"?newReservationCallerInfo($("newCallerType").value).label:guestServicesAgencyInfo($("agency").value).label),
    guest1:$("guest1").value.trim(),guest2:$("guest2").value.trim(),
    latitudesNumbers:collectLatitudesNumbers(),pastGuestFlags:collectPastGuestFlags(),
    category:$("category").value,location:$("locationPref").value,side:$("sidePref").value,
    payment:$("paymentAction").value,pricing:$("pricing").value.trim(),email:$("confirmationEmail").value.trim(),
    latitudes:$("reservationWorkflow").value==="new"&&$("latitudesToggle").checked,commenting:$("commentToggle").checked,confirmation:$("confirmToggle").checked,
    fas:$("fasToggle").checked,travel:$("travelToggle").checked,psc:$("pscToggle").checked,
    airEnabled:$("airToggle")?.checked||false,airProgram:$("airProgram")?.value||"",airTripType:$("airTripType")?.value||"round_trip",airOneWayDirection:$("airOneWayDirection")?.value||"to_cruise",airGateway:$("airGateway")?.value.trim()||"",
    couponEnabled:couponWorkflowRequested(),
    coupons:couponWorkflowRequested()?collectCoupons():[],
    trainerNotes:$("trainerNotes").value.trim(),sailing:state.selectedSailing,
    cardRequired,cardProfile:cardKey,card:cardRequired?currentTrainingCard():null,
    curriculumObjective:metas.map(m=>m.objective).join(" | "),
    curriculumObjectives:metas.map(m=>m.objective),
    curriculumKind:meta.kind||"",
    curriculumKinds:metas.map(m=>m.kind),
    roleplayMode:Boolean(state.currentScenario?.roleplayMode),
    createdAt:state.currentScenario?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString(),favorite:state.currentScenario?.favorite||false,archived:false
  };
}

function trainingSupportLabel(day){
  if(day<=6)return "Guided";
  if(day===7)return "Supported";
  if(day<=9)return "Light guidance";
  return "Independent";
}

function focusConsiderations(d){
  const name=focusSearchText(d);
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
  if(d.airEnabled){
    const airMeta=airProgramMeta(d.airProgram);
    if(!airMeta)items.push("Select the applicable NCL Air Program before releasing the scenario.");
    else items.push(`Confirm the selected ${airMeta.label} terms, ${airTripLabel(d)} itinerary, payment/deposit timing, and transfer handling.`);
    if(d.airProgram==="bundled")items.push("Verify that the selected sailing is one of the select Pride of America sailings eligible for Bundled Air / AIRPROM3.");
    if(airMeta?.nclAir)items.push("Verify the trainee removes the pre-cruise transfer because the NCL Air arrival is at least one day prior.");
  }else if(name.includes("hotel")||name.includes("cruisetour")||name.includes("land pkg")) items.push("Review the applicable land terms, deposit requirements, confirmation timing, and transfer details.");
  if(isSoloStudioScenario(d)){
    items.push(
      "Did the Cruise Specialist confirm Kyle's information without making him repeat himself?",
      "Was Tom searched by Last Name and Date of Birth?",
      "Does the Studio selection support the solo occupancy?",
      "Was the advertised price quoted using the required wording?",
      "Were Free at Sea, Pre-Paid Service Charges and Norwegian Care handled correctly?",
      "Was Tom's Kosher Meals request added and the capacity-controlled reminder provided when applicable?",
      "Was the minimum deposit collected?",
      "Were both Guest and Travel Agent confirmations sent and Compass comments added?"
    );
  }
  if(isAddGuestUpgradeRoleplay(d)){
    items.push(
      "Was Travel Agent GDPR completed before discussing the reservation, with Reservation Number required?",
      "Did the Cruise Specialist explain why the Studio must be changed for two guests?",
      "Does the selected category and stateroom accommodate two guests and address the elevators/stairs request?",
      "Was Taylor located using Latitudes #272279126?",
      "Were Twin Beds selected?",
      "Did Tom retain Kosher Meals while Taylor received only the mushroom allergy request?",
      "Were Free at Sea, Pre-Paid Service Charges and Norwegian Care verified for both guests?",
      "Was any additional deposit due checked and collected when applicable?",
      "Were changes stored, comments added, both confirmations sent, and the reservation fully recapped?"
    );
  }

  if(isReinstateRoleplay(d)){
    items.push(
      "Was the Reservation Number obtained before servicing the reservation?",
      "Was the correct GDPR path completed for the Direct Guest or Travel Agent?",
      "Was the reservation cancelled within the last 24 hours?",
      "Is the previous stateroom still available?",
      "Is the pricing the same as it was before cancellation?",
      "If the stateroom or pricing changed, what must be explained to the caller before proceeding?",
      "Were all completed changes stored in Seaweb?",
      "Were reservation comments added and the updated confirmation sent?",
      "Did the Cruise Specialist complete a full recap before closing the call?"
    );
  }else if(name.includes("cancel")||name.includes("reinstate")) items.push("Is the reservation inside or outside final payment?","What refund timeline should be quoted, and what may change when a canceled reservation is reinstated?");
  if(name.includes("amenities")||name.includes("dining")) items.push("Is payment due immediately for the selected add-on?","Which confirmation or amenity invoice must be sent after the transaction?");
  if(name.includes("cruise first")) items.push("What are the CruiseFirst terms and where is the credit purchased/applied?");
  if(name.includes("gty")) items.push("What expectations must be set for a Guarantee category, including stateroom assignment and location?");
  if(d.sailing?.ports?.length) items.push(`Confirm any requested port of call against the selected itinerary: ${d.sailing.ports.join(", ")}.`);
  if(isMultipleAuthorizedAny(d)){
    const isTour=isMultipleAuthorizedCruisetourScenario(d);
    return [
      "Anticipate the steps based on the reason for the call to control the call flow and guide the interaction effectively.",
      "How many days prior to sailing is the booking being made?",
      "Is each reservation inside or outside the final payment date?",
      "What is the gross amount due and final payment date for each reservation?",
      "What are the current promo codes?",
      "Which Free at Sea selections have a package fee?",
      "Is the applicable package fee different for Sofia as a child?",
      "What is the deadline for guests to change their selection or remove the Free at Sea promotion?",
      "What is the square footage of the selected Balcony staterooms?",
      "What are the bed arrangements for each room? Is there a sofa bed?",
      "Are you POSITIVE the selected staterooms connect?",
      "Were the Authorized Person guidelines explained and the exact Authorized Person comment added to the parents' reservation?",
      "Were the two $250 deposits processed separately?",
      "Were both reservations recapped, notated and confirmed?",
      "Were the reservations linked using TWITH before ending the call?",
      ...(isTour?[
        "Did both reservations use the exact 11-Day Oahu Explorer Hyatt Waikiki Ocean View Cruisetour?",
        "What are the dates of the 4-day pre-cruise portion?",
        "When does the Pride of America sailing begin?",
        "What is included in the selected Cruisetour and are there any Cruisetour-specific requirements the guests should know?"
      ]:[])
    ];
  }

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

function focusStoryDetailForName(name,d){
  const n=(name||"").toLowerCase();
  if(n.includes("basic reservation")) return "They want a straightforward booking and need the pricing, stateroom and deposit expectations explained clearly.";
  if(n.includes("payments")) return "They are ready to move forward and need the correct amount due, remaining balance and payment options reviewed.";
  if(n.includes("applying fcc")) return "They have training credits or discount coupons that must be applied in the correct sequence.";
  if(n.includes("norwegian")) return "They want travel protection properly offered and added using the approved workflow.";
  if(n.includes("special request")&&!n.includes("ada")) return "They have personal or stateroom requests that must be entered and documented correctly.";
  if(n.includes("price programs")||n.includes("fas")) return "They want all applicable Free at Sea selections and eligible pricing programs reviewed.";
  if(n.includes("ada")) return "Accessibility and dietary needs must be handled in the correct Seaweb locations without promising unavailable inventory.";
  if(n.includes("infant")||n.includes("guests 3-8")||n.includes("singles")) return "The party mix requires extra attention to occupancy, profiles, promotions and deposit rules.";
  if(n.includes("multiple")) return "The party needs multiple related reservations coordinated and linked correctly.";
  if(n.includes("ta booking")) return d.newCallerType==="travel_agent"?"The travel advisor expects the booking to follow the correct agency workflow.":"The booking source and agency workflow must match the selected caller type.";
  if(n.includes("ncl air")||n.includes("bundled air")||n.includes("air choice")||n.includes("air deviation")) return "The applicable NCL Air Program, itinerary direction, terms and transfer handling must be reviewed carefully.";
  if(n.includes("cancel")||n.includes("reinstate")) return "Cancellation or reinstatement requires careful review of status, refunds, fare, stateroom and promotion changes.";
  if(n.includes("price drop")) return "Use the approved price-drop workflow and verify all required conditions before making changes.";
  if(n.includes("cruisetour")||n.includes("land pkg")) return "The appropriate land package or cruisetour must be reviewed and added using the correct workflow.";
  if(n.includes("hotel")) return "The requested hotel component must be reviewed for availability, timing and reservation impact.";
  if(n.includes("amenit")) return "The requested onboard amenity must be added with any required payment and confirmation.";
  if(n.includes("dining")||n.includes("ent")||n.includes("spa")) return "The requested onboard experiences must be checked for availability and any immediate payment requirement.";
  if(n.includes("cruise first")) return "CruiseFirst terms and the correct purchase/application workflow must be followed.";
  if(n.includes("gty")) return "Guarantee-category expectations must be explained clearly, including what is and is not guaranteed.";
  return "Complete the applicable Seaweb workflow and verify the result before saving.";
}

function focusStoryDetail(d,meta){
  const pieces=focusNamesForData(d).map(name=>focusStoryDetailForName(name,d));
  return [...new Set(pieces)].join(' ');
}

function customerStoryHtml(d,meta,sailText,guestNames){
  const modifying=d.reservationWorkflow==="modify";

  if(isMultipleAuthorizedCruisetourScenario(d)){
    return `<p>You receive a call from <strong>Maria Lopez</strong>, who is excited about planning a Hawaiian vacation for herself, her daughter Sofia, and her parents Ana and Luis. Maria wants two reservations on <strong>Pride of America</strong> sailing from <strong>Honolulu in March 2027</strong> and specifically wants the <strong>11-Day Oahu Explorer Hyatt Waikiki Ocean View Cruisetour</strong>, including the <strong>4-day pre-cruise Cruisetour</strong>. Maria will make both reservations and pay both deposits. Confirm the Recipe for Success naturally without making her repeat information she has already provided.</p>`;
  }

  if(isMultipleAuthorizedScenario(d)){
    return `<p>You receive a call from <strong>Maria Lopez</strong>, who sounds excited but slightly overwhelmed with the website. She is planning a vacation for herself, her daughter Sofia, and her parents Ana and Luis. They live near Galveston and want a <strong>Caribbean cruise in March 2027 departing from Galveston</strong>. Maria will make both reservations and pay both deposits. Confirm all applicable Recipe for Success questions without making her repeat information she has already provided.</p>`;
  }

  if(isSoloStudioScenario(d)){
    return `<p><strong>Kyle James</strong>, a travel agent with <strong>Norwegian Training Travel</strong>, calls to book a new cruise for his client <strong>Tom Holland</strong>, who will be traveling alone. Kyle already knows exactly what he is looking for because he called earlier in the day for pricing and options. Express your willingness to assist, confirm the information Kyle provides without making him repeat himself, quote the booking as you would for any new reservation, and complete a full recap.</p>`;
  }

  if(isAddGuestUpgradeRoleplay(d)){
    return `<p><strong>Kyle James</strong>, a travel agent with <strong>Norwegian Training Travel</strong>, calls regarding the reservation created during today's <strong>Solo Guest / Studio Booking</strong> practice. He wants to add a second guest. Complete Travel Agent GDPR verification first — <strong>Reservation Number is REQUIRED.</strong> Kyle advises the reservation is currently in a Studio, so explain that the category must be upgraded to one that can accommodate two guests before the second guest can be added.</p>`;
  }

  if(meta.kind==="demo"){
    return `<p>This is a <strong>trainer-led demonstration</strong>. Use the selected or trainer-provided reservation/sailing to demonstrate the ${escapeHtml(d.type)} workflow.</p>`;
  }

  if(modifying){
    const reservation=d.existingReservationNumber?` <strong>${escapeHtml(d.existingReservationNumber)}</strong>`:"";
    const target=d.modificationTarget?` The requested change involves <strong>${escapeHtml(d.modificationTarget)}</strong>.`:"";
    const request=d.modificationRequest?` ${escapeHtml(d.modificationRequest)}`:"";
    const gdpr=d.department==="Guest Services"&&d.gdprCallerType
      ? ` Before servicing the reservation, complete GDPR verification for the ${escapeHtml(gdprProfile(d.gdprCallerType)?.label||"selected caller type")}.`
      :"";

    const source=d.department==="Guest Services"?guestServicesAgencyInfo(d.agency):null;
    let callerLead="A guest contacts Norwegian Cruise Line";
    if(source?.type==="direct_us"){
      callerLead="A direct guest contacts Norwegian Cruise Line";
    }else if(source?.type==="direct_ca"){
      callerLead="A direct guest from Canada contacts Norwegian Cruise Line";
    }else if(d.gdprCallerType==="travel_agent"||d.gdprCallerType==="ta_group"){
      callerLead="A travel advisor contacts Norwegian Cruise Line";
    }else if(d.gdprCallerType==="travel_agency_guest"){
      callerLead="A travel agency guest contacts Norwegian Cruise Line";
    }else if(d.gdprCallerType==="pcc_guest"){
      callerLead="A PCC guest contacts Norwegian Cruise Line";
    }else if(d.gdprCallerType==="casino_guest"){
      callerLead="A casino guest contacts Norwegian Cruise Line";
    }else if(d.gdprCallerType==="friends_family"){
      callerLead="A Friends & Family / Team Member guest contacts Norwegian Cruise Line";
    }else if(d.gdprCallerType==="direct_group"){
      callerLead="A Direct Group caller contacts Norwegian Cruise Line";
    }else if(d.gdprCallerType==="charter_sixthman"){
      callerLead="A Charter / Sixthman guest contacts Norwegian Cruise Line";
    }

    if(isReinstateRoleplay(d)){
      return `<p>Use one of the training reservations from <strong>yesterday that was cancelled</strong>. One trainee will act as the <strong>Cruise Specialist</strong> and the other will act as the <strong>${escapeHtml(roleplayCallerLabel(d))}</strong>. The caller contacts Norwegian Cruise Line because they want the reservation <strong>reinstated</strong>. Before discussing or servicing the reservation, complete the correct GDPR verification. <strong>Reservation Number is REQUIRED.</strong> Use the guest name(s) and booking details already on the selected training reservation.</p>`;
    }

    return `<p>${callerLead} about an existing training reservation${reservation}. They want to <strong>${escapeHtml(modificationLabel(d.modificationType).toLowerCase())}</strong>.${target}${request}${gdpr} Use the guest name(s) already on the existing training reservation.</p>`;
  }

  const primary=guestNames[0]||"The guest";
  const companion=guestNames[1]||"";
  const names=companion?`<strong>${escapeHtml(primary)}</strong> and <strong>${escapeHtml(companion)}</strong>`:`<strong>${escapeHtml(primary)}</strong>`;

  if(d.department==="Guest Services"){
    const caller=newReservationCallerInfo(d.newCallerType);
    if(caller.type==="direct_ca"){
      return `<p>${names} are calling Norwegian Cruise Line directly from Canada to create a new reservation for ${escapeHtml(sailText)}. ${escapeHtml(focusStoryDetail(d,meta))}</p>`;
    }
    if(caller.type==="travel_agent"){
      return `<p>A travel advisor is calling Norwegian Cruise Line on behalf of ${names} to create a new reservation for ${escapeHtml(sailText)}. ${escapeHtml(focusStoryDetail(d,meta))}</p>`;
    }
    return `<p>${names} are calling Norwegian Cruise Line directly to create a new reservation for ${escapeHtml(sailText)}. ${escapeHtml(focusStoryDetail(d,meta))}</p>`;
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
  const n=focusSearchText(d);
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
      ["Guest Name(s)","Use names on existing reservation","Do not replace with generated new-booking names"],
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
    ${d.department==="Guest Services"?`<div class="glance-card"><span>Caller Type</span><strong>${escapeHtml(newReservationCallerLabel(d))}</strong><small>${escapeHtml(d.market||guestServicesAgencyDisplay(d.agency))}</small></div>`:""}
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
  const name=focusSearchText(d);
  const tasks=[];

  if(isMultipleAuthorizedAny(d)){
    const isTour=isMultipleAuthorizedCruisetourScenario(d);
    return [
      "Express willingness to assist and control the call using the Recipe for Success without making Maria repeat information she already provided.",
      isTour
        ? "Search Pride of America from Honolulu in March 2027 and select an appropriate sailing for the 11-Day Oahu Explorer Hyatt Waikiki Ocean View Cruisetour."
        : "Search for a Caribbean sailing departing from Galveston in March 2027 and select an appropriate qualifying sailing.",
      isTour
        ? "Add the exact 11-Day Oahu Explorer Hyatt Waikiki Ocean View Cruisetour to BOTH reservations and verify the 4-day pre-cruise land component."
        : "Create two separate reservations on the same selected sailing.",
      "Create Reservation 1 for Maria Lopez (Latitudes #279019549) and Sofia, age 4 (Latitudes #279019550).",
      "Create Reservation 2 for Ana Martinez (Latitudes #279019849) and Luis Martinez (Latitudes #279019848).",
      "Confirm every guest's legal name exactly as shown on travel documents and verify all required dates of birth / guest information.",
      "Book two Balcony staterooms that actually connect. Any location is acceptable, but adjacent rooms are not enough — verify the connecting door.",
      "Include all applicable Free at Sea offers, Pre-Paid Service Charges and Norwegian Care / Travel Protection on both reservations.",
      "Add Sofia's peanut allergy to Reservation 1.",
      "For Ana and Luis, request beds pushed together and extra pillows.",
      "Quote the advertised pricing. If both reservations have identical components, one quote may represent the price per reservation; if anything differs, quote each booking separately.",
      "Explain the Authorized Person guidelines because Maria is booking and paying for her parents' reservation.",
      "Add the exact parents' reservation comment: Authorized Person: Maria Lopez, CC 0000.",
      "Process the $250 deposit on each reservation separately using the training credit card.",
      "Recap and notate each reservation separately.",
      "Send a confirmation for each reservation.",
      "Link both reservations with TWITH (Travel With) before ending the call.",
      "Save both reservation numbers and post both reservation numbers in the class chat."
    ];
  }

  if(isSoloStudioScenario(d)){
    return [
      "Express willingness to assist and follow the Recipe for Success without making Kyle repeat information he already provided.",
      "Identify Kyle James as the Travel Agent with Norwegian Training Travel (305-436-1000).",
      "Book Tom Holland as one solo guest and search for him using Last Name + Date of Birth (06/01/1996).",
      "Use the June 27, 2027 Norwegian Aqua 7-Day Caribbean sailing.",
      "Book a Studio category and assign any available Studio stateroom.",
      "Quote the advertised Studio pricing using the required cruise fare, taxes, fees, and port expenses wording.",
      "Include all applicable Free at Sea offers and Pre-Paid Service Charges.",
      "Add Tom's Kosher Meals request and, when applicable, advise that the option is capacity controlled.",
      "Include Norwegian Care.",
      "Collect the minimum required deposit using the training credit card.",
      "Send both the Guest and Travel Agent confirmations to training123@ncl.com.",
      "Leave the appropriate reservation comments using Compass.",
      "Complete a full reservation recap and proper closing.",
      "Save and post the reservation number in the class chat."
    ];
  }

  if(isAddGuestUpgradeRoleplay(d)){
    return [
      "Use the reservation created during today's Solo Guest / Studio Booking practice.",
      "Assign roles: one trainee is the Cruise Specialist and the other is Travel Agent Kyle James.",
      "Express willingness to assist.",
      "Complete Travel Agent GDPR verification before discussing the reservation. Reservation Number is REQUIRED.",
      "Explain that the existing Studio must be upgraded because the reservation will now have two guests.",
      "Go into Edit and upgrade to a category that can accommodate two guests.",
      "Select an available stateroom as close as possible to elevators / stairs.",
      "Quote the updated advertised pricing and new reservation total using the required pricing wording.",
      "Verify the applicable Free at Sea promotions remain correct.",
      "Include Pre-Paid Service Charges for both guests.",
      "Keep Norwegian Care for both guests.",
      "Add Taylor using Latitudes #272279126.",
      "Set the bed configuration to Twin Beds.",
      "Retain Tom's Kosher Meal request.",
      "Add Taylor's mushroom allergy; Taylor does not need Kosher Meals.",
      "Check whether an additional deposit is due. If so, advise Kyle and collect the additional deposit using the training card.",
      "Store Changes after all updates are complete.",
      "Send both the Guest and Travel Agent confirmations to training123@ncl.com.",
      "Leave the appropriate reservation comments using Compass.",
      "Complete a full recap and proper closing.",
      "Switch roles and repeat so both trainees practice the Cruise Specialist role."
    ];
  }

  if(isReinstateRoleplay(d)){
    const profile=gdprProfile(d.gdprCallerType);
    tasks.push("Use one of the training reservations from yesterday that was cancelled.");
    tasks.push(`Assign roles: one trainee is the Cruise Specialist and the other is the ${roleplayCallerLabel(d)}.`);
    tasks.push(profile
      ? `Complete GDPR verification for the ${profile.label}. Reservation Number is REQUIRED.${["travel_agent","ta_group"].includes(d.gdprCallerType)?" The Agency ID / ABTA # / Travel Agency phone number is also mandatory for the Travel Agent path.":""}`
      : "Complete the correct Guest Services GDPR verification before discussing the reservation. Reservation Number is REQUIRED.");
    tasks.push("Verify the reservation was cancelled within the last 24 hours and qualifies for reinstatement.");
    tasks.push("Verify whether the previous stateroom is still available.");
    tasks.push("Verify whether the pricing is the same as it was before cancellation.");
    tasks.push("If the reservation qualifies, reinstate it using the appropriate Seaweb workflow.");
    tasks.push("Store Changes after the reinstatement and any required updates are complete.");
    tasks.push("Recap the reinstated reservation and any differences with the caller.");
    tasks.push("Add the appropriate reservation comments.");
    tasks.push(`Send the appropriate updated confirmation${d.email?` to ${d.email}`:""}.`);
    tasks.push("Complete the appropriate call closing.");
    tasks.push("Switch roles and repeat the roleplay so both trainees practice the Cruise Specialist role.");
    return [...new Set(tasks)];
  }

  if(d.reservationWorkflow==="modify"){
    if(d.department==="Guest Services"){
      const profile=gdprProfile(d.gdprCallerType);
      tasks.push(profile
        ? `Complete GDPR verification for the ${profile.label} before servicing the reservation. Ask the primary verification items first. Reservation Number is always mandatory.${["travel_agent","ta_group"].includes(d.gdprCallerType)?" The agency identifier (ABTA #, Agency ID, or Phone #) is also mandatory to continue under the Travel Agent path.":""}`
        : "Complete required Guest Services GDPR verification before servicing the reservation.");
      const action=gdprActionText(d);
      if(action)tasks.push(action);
    }
    tasks.push(`Locate training reservation ${d.existingReservationNumber||"(trainer-provided reservation)"} and use the guest name(s) already on that reservation. Complete required verification before making changes.`);
    tasks.push(modificationTaskText(d));
    tasks.push(...couponTaskItems(d));
    if(d.airEnabled){
      const airMeta=airProgramMeta(d.airProgram);
      if(!airMeta){
        tasks.push("Select the applicable NCL Air Program before completing the Air workflow.");
      }else{
        tasks.push(`Review the ${airMeta.label} terms for the selected ${airTripLabel(d)} itinerary.`);
      }
      if(airMeta?.nclAir)tasks.push("Remove the pre-cruise transfer because NCL Air is scheduled to arrive at least one day before embarkation; review the guest's hotel and ground-transportation responsibility.");
      if(d.airProgram==="bundled"){
        tasks.push("Confirm the selected sailing is an eligible Pride of America sailing before applying Bundled Air / AIRPROM3.");
        if(d.airTripType==="one_way")tasks.push("For one-way Bundled Air, use 50% of the applicable promotional air pricing for the selected gateway.");
      }
      if(d.airProgram==="independent_no_flights")tasks.push("For Independent Air / No Flights, use T1 (BAGGAGE PICKUP), flight number 999, the approved generic times, and the correct airport transfer.");
    }
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
  if(d.coupons?.length)tasks.push(...couponTaskItems(d));
  else if(name.includes("fcc")||d.payment==="FCC / CruiseNext"||name.includes("cruise first"))tasks.push("Apply the applicable training credit/coupon using the required offer/status sequence, then review the updated pricing before saving.");
  if(name.includes("special request")||name.includes("ada")||name.includes("infant")||name.includes("multiple"))tasks.push("Enter special/accessibility/dietary requests in the correct Seaweb location and add any required comments.");
  if(name.includes("multiple"))tasks.push("Link related reservations with TWITH when required and verify room relationship/authorized-person notes.");
  if(d.airEnabled){
    const airMeta=airProgramMeta(d.airProgram);
    if(!airMeta)tasks.push("Select the applicable NCL Air Program before completing the Air workflow.");
    else tasks.push(`Review the ${airMeta.label} terms for the selected ${airTripLabel(d)} itinerary.`);
    if(airMeta?.nclAir)tasks.push("Remove the pre-cruise transfer because NCL Air is scheduled to arrive at least one day before embarkation; review the guest's responsibility for the pre-cruise hotel and related ground transportation.");
    if(d.airProgram==="bundled"){
        tasks.push("Confirm the selected sailing is an eligible Pride of America sailing before applying Bundled Air / AIRPROM3.");
        if(d.airTripType==="one_way")tasks.push("For one-way Bundled Air, use 50% of the applicable promotional air pricing for the selected gateway.");
      }
    if(d.airProgram==="independent_no_flights")tasks.push("For Independent Air / No Flights, use T1 (BAGGAGE PICKUP), flight number 999, the approved generic times, and the correct airport transfer.");
  }else if(name.includes("hotel")||name.includes("cruisetour")||name.includes("land pkg")){
    tasks.push("Review the applicable land/hotel terms, timing, deposits, transfers, and confirmation expectations.");
  }
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
  const n=focusSearchText(d);
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
  if(d.airEnabled){
    const airMeta=airProgramMeta(d.airProgram);
    if(!airMeta)items.unshift("Not selecting the applicable NCL Air Program before assigning the scenario.");
    else items.unshift(`Using the wrong terms for ${airMeta.label} or missing the selected ${airTripLabel(d)} itinerary.`);
    if(d.airProgram==="bundled")items.unshift("Using Bundled Air / AIRPROM3 on a sailing that has not been verified as an eligible Pride of America sailing.");
    if(airMeta?.nclAir)items.unshift("Leaving a pre-cruise transfer on an NCL Air reservation even though the flight is scheduled to arrive one day before embarkation.");
  }
  if(isReinstateRoleplay(d)){
    items.unshift(
      "Beginning to discuss the reservation before GDPR is complete or without obtaining the required Reservation Number.",
      "Assuming the reservation qualifies without confirming it was cancelled within the last 24 hours.",
      "Assuming the previous stateroom is still available.",
      "Assuming the previous pricing will automatically return.",
      "Forgetting to Store Changes after the reinstatement.",
      "Missing reservation comments, confirmation, recap, or the role switch."
    );
  }else if(n.includes("cancel")||n.includes("reinstate"))items.unshift("Canceling before offering the applicable alternative or checking final-payment status.","Assuming original fare/category/promotions will automatically return on reinstatement.");
  return [...new Set(items)];
}

function expectedCompletionState(d,meta){
  if(isMultipleAuthorizedCruisetourScenario(d))return "Two active Pride of America Cruisetour reservations are created for the same March 2027 departure, both contain the 11-Day Oahu Explorer Hyatt Waikiki Ocean View Cruisetour, the Balcony rooms connect, deposits are processed separately, the parents' Authorized Person notation is present, confirmations are sent, and both reservations are linked with TWITH.";
  if(isMultipleAuthorizedScenario(d))return "Two active reservations are created on the same March 2027 Galveston sailing, the Balcony rooms connect, deposits are processed separately, the parents' Authorized Person notation is present, confirmations are sent, and both reservations are linked with TWITH.";
  if(isReinstateRoleplay(d))return "If eligible, the cancelled training reservation is active/booked again; previous stateroom and pricing are verified, changes are stored, comments are added, confirmation is sent, and the caller receives a full recap.";
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
      <div class="trainer-info-card"><span>Learning objective</span><strong>${(d.curriculumObjectives||[d.curriculumObjective]).filter(Boolean).map(x=>escapeHtml(x)).join(" • ")||"Use the selected curriculum focus."}</strong></div>
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
    ${s?`<h4>Public source metadata</h4><p><span class="verified">Verified from NCL.com U.S.</span><br>${escapeHtml(s.sourceUrl||"")}<br>Retrieved ${new Date(s.retrievedAt||Date.now()).toLocaleString()}</p>`:""}
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
        <li><strong>Guest Name(s):</strong> Use the guest name(s) already on the existing training reservation</li>
        <li><strong>Booking Source:</strong> ${escapeHtml(agencyDisplay)}</li>
        <li><strong>Modification:</strong> ${escapeHtml(modificationLabel(d.modificationType))}</li>
        ${d.department==="Guest Services"?`<li><strong>GDPR Caller Type:</strong> ${escapeHtml(gdprProfile(d.gdprCallerType)?.label||"Not selected")}</li>`:""}
        ${d.gdprCallerType==="direct_group"?`<li><strong>Direct Group Route:</strong> ${escapeHtml(directGroupRoute(d.directGroupMarket).label)} • SOT #${escapeHtml(directGroupRoute(d.directGroupMarket).sot)}</li>`:""}
        ${d.modificationTarget?`<li><strong>Guest / Item:</strong> ${escapeHtml(d.modificationTarget)}</li>`:""}
        ${d.modificationRequest?`<li><strong>Requested Change:</strong> ${escapeHtml(d.modificationRequest)}</li>`:""}
        ${addedGuest}
      </ul>
      ${stateroom}
      ${d.airEnabled?`<h4>Air Program</h4><p>${escapeHtml(airProgramMeta(d.airProgram)?.label||"Select NCL Air Program")} • ${escapeHtml(airTripLabel(d))}${d.airGateway?` • ${escapeHtml(d.airGateway)}`:""}</p>`:""}
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
        <li><strong>Booking Source:</strong> ${escapeHtml(agencyDisplay)}</li>
        ${s?`<li><strong>Ship:</strong> ${escapeHtml(s.ship||"Verify")}</li><li><strong>Itinerary:</strong> ${escapeHtml(s.title||"Verify")}</li><li><strong>Sail Date:</strong> ${escapeHtml(s.sailingDate?formatSailingDate(s.sailingDate):"Verify exact date in Seaweb")}</li><li><strong>Departure:</strong> ${escapeHtml(s.departure||"Verify")}</li><li><strong>Duration:</strong> ${escapeHtml(String(s.duration||"Verify"))}${s.duration?" days":""}</li>`:`<li><strong>Real Sailing:</strong> Not selected — trainer must provide/verify sailing details.</li>`}
        <li><strong>Total Guests:</strong> ${d.guestCount}</li>
      </ul>

      <h4>Category & Stateroom</h4>
      <p>${escapeHtml(d.category)}${d.location!=="Any"?`, ${escapeHtml(d.location)} location`:""}${d.side!=="Any"?`, ${escapeHtml(d.side)} side preference`:""}. Review actual available staterooms in Seaweb before selecting.</p>
      ${pricing}

      <h4>Guest Information</h4>
      <ul class="detail-list">${guestInfoItems}</ul>

      ${d.airEnabled?`<h4>Air Program</h4><p>${escapeHtml(airProgramMeta(d.airProgram)?.label||"Select NCL Air Program")} • ${escapeHtml(airTripLabel(d))}${d.airGateway?` • ${escapeHtml(d.airGateway)}`:""}</p>`:""}

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
  $("newCallerType").value="direct_us";
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
  $("airToggle").checked=false;
  $("couponToggle").checked=false;
  $("airProgram").value="";
  $("airTripType").value="round_trip";
  $("airOneWayDirection").value="to_cruise";
  $("airGateway").value="";
  updateAirProgramPreview();
  $("couponRows").innerHTML="";
  refreshCouponPanel();

  $("trainingCardProfile").value="standardSesame";
  renderTrainingCard();

  updateDepartmentUI();
  // updateDepartmentUI selects the first focus so clear it afterward.
  clearScenarioFocusSelections();
  updateWorkflowUI(false);
  refreshLatitudesPanel();
  refreshTrainingCardPanel();

  renderSelectedSailing();
  $("scenarioOutput").innerHTML='<p class="empty-copy">Start a new scenario by choosing your options, then click <strong>Generate Scenario</strong>.</p>';
  $("scenarioStatus").className="status-badge neutral";
  $("scenarioStatus").textContent="Draft";
  updateRoleplayScenarioButton();
  updateFollowUpRoleplayButton();
  clearValidationDisplay();
  setMode("trainer");
  flash("Scenario cleared. You can start a brand-new exercise.");
  $("department").focus();
}

function scenarioIconHeading(icon,title){return `<h3 class="visual-section-heading"><span class="scenario-icon" aria-hidden="true">${icon}</span><span>${escapeHtml(title)}</span></h3>`}

function focusSummaryHtml(d){
  return `<section class="scenario-section visual-section focus-summary-section"><div class="section-label">SCENARIO FOCUS</div>${scenarioIconHeading('🎯','Skills Included')}<div class="scenario-focus-badges">${focusNamesForData(d).map(x=>`<span>${escapeHtml(x)}</span>`).join('')}</div></section>`;
}

function roleplaySetupHtml(d){
  if(!isRoleplayScenario(d))return "";

  let specialistText="Lead the call naturally, express willingness to assist, ask the right questions, complete the required Seaweb workflow, recap, document and close.";
  let callerText="Respond naturally to the Cruise Specialist. Do not volunteer every detail at once; provide information as the Cruise Specialist asks the appropriate questions.";
  let useText="Use the scenario details below as the caller's information and requests.";
  if(isReinstateRoleplay(d)){
    specialistText="Lead the call, complete GDPR, research eligibility, reinstate when appropriate, Store Changes, document, confirm and recap.";
    callerText="Use the caller type that matches the cancelled reservation. Respond naturally and allow the Cruise Specialist to guide the interaction.";
    useText="Use one of the training reservations from yesterday that was cancelled. Do not create a new reservation for this exercise.";
  }else if(isAddGuestUpgradeRoleplay(d)){
    specialistText="Express willingness to assist, complete Travel Agent GDPR, identify the Studio occupancy issue, service the reservation, quote the new price, check additional deposit, Store Changes, document, confirm and recap.";
    callerText="You are Kyle James with Norwegian Training Travel. Reveal the requests naturally as the Cruise Specialist asks questions. Do not give every detail at the beginning of the call.";
    useText="Use the reservation created during today's Solo Guest / Studio Booking practice.";
  }

  return `<section class="scenario-section visual-section roleplay-setup-section">
    <div class="section-label">ROLEPLAY SETUP</div>
    ${scenarioIconHeading('🎭','Partner Roleplay')}
    <div class="roleplay-role-grid">
      <div class="roleplay-role-card"><span>🎧 ROLE 1</span><strong>Cruise Specialist</strong><small>${escapeHtml(specialistText)}</small></div>
      <div class="roleplay-role-card"><span>☎️ ROLE 2</span><strong>${escapeHtml(roleplayCallerLabel(d))}</strong><small>${escapeHtml(callerText)}</small></div>
    </div>
    <div class="instruction-strip"><strong>Scenario to use</strong><span>${escapeHtml(useText)}</span></div>
    <div class="roleplay-switch-banner"><strong>🔄 Switch Roles</strong><span>After the first interaction is complete, switch roles and repeat the exercise so both trainees practice the Cruise Specialist role.</span></div>
  </section>`;
}

function completionInstructionsHtml(d){
  if(isRoleplayScenario(d)){
    return `<div class="scenario-completion-box"><strong>✅ When you are finished</strong><span>Confirm the servicing workflow, comments, confirmation and recap are complete.</span><span>Switch roles with your partner and repeat the exercise.</span></div>`;
  }
  if(isMultipleAuthorizedAny(d)){
    return `<div class="scenario-completion-box"><strong>✅ When you are finished</strong><span>Save BOTH reservation numbers.</span><span>Post BOTH reservation numbers in the class chat.</span><span>Verify the reservations are linked with TWITH.</span></div>`;
  }
  return `<div class="scenario-completion-box"><strong>✅ When you are finished</strong><span>Save your reservation number.</span><span>Post your reservation number in the class chat.</span></div>`;
}

function curriculumScenarioDetailsHtml(d){
  if(isMultipleAuthorizedAny(d))return multipleAuthorizedDetailsHtml(d);

  if(isSoloStudioScenario(d)){
    return `<section class="scenario-section visual-section curriculum-specific-section">
      <div class="section-label">SCENARIO DETAILS</div>
      ${scenarioIconHeading('🧾','Solo Guest / Studio Booking')}
      <div class="scenario-detail-grid">
        <div><span>Travel Agency</span><strong>Norwegian Training Travel</strong><small>305-436-1000</small></div>
        <div><span>Travel Agent</span><strong>Kyle James</strong><small>Caller</small></div>
        <div><span>Guest</span><strong>Tom Holland</strong><small>DOB: 06/01/1996</small></div>
        <div><span>Guest Search</span><strong>Last Name + Date of Birth</strong><small>Use the training profile found in Seaweb</small></div>
        <div><span>Category</span><strong>Studio</strong><small>Assign any available Studio stateroom</small></div>
        <div><span>Special Request</span><strong>Kosher Meals</strong><small>If available, remind the caller this option is capacity controlled</small></div>
      </div>
      <div class="instruction-strip"><strong>💬 Quote Advertised Pricing</strong><span>“The pricing for your Studio stateroom is $_____ per person, which includes the cruise fare, taxes, fees, and port expenses for a reservation total of $_____. How does that sound?”</span></div>
      <div class="instruction-strip"><strong>Offers / Protection</strong><span>Include all applicable Free at Sea offers, Pre-Paid Service Charges, and Norwegian Care.</span></div>
    </section>`;
  }

  if(isAddGuestUpgradeRoleplay(d)){
    return `<section class="scenario-section visual-section curriculum-specific-section">
      <div class="section-label">ROLEPLAY DETAILS</div>
      ${scenarioIconHeading('🛏️','Add Guest & Upgrade Stateroom')}
      <div class="scenario-detail-grid">
        <div><span>Reservation</span><strong>Today's Solo Practice</strong><small>Use the reservation created earlier today</small></div>
        <div><span>Travel Agent</span><strong>Kyle James</strong><small>Norwegian Training Travel • 305-436-1000</small></div>
        <div><span>Guest Being Added</span><strong>Taylor</strong><small>Latitudes #272279126</small></div>
        <div><span>Room Change</span><strong>Upgrade from Studio</strong><small>Choose a category that accommodates two guests</small></div>
        <div><span>Location Request</span><strong>Near elevators / stairs</strong><small>As close as available</small></div>
        <div><span>Bed Setup</span><strong>Twin Beds</strong><small>Two separate beds</small></div>
        <div><span>Tom</span><strong>Keep Kosher Meals</strong><small>Retain his existing request</small></div>
        <div><span>Taylor</span><strong>Mushroom Allergy</strong><small>Taylor does not need Kosher Meals</small></div>
      </div>
      <div class="instruction-strip"><strong>💬 Quote Updated Advertised Pricing</strong><span>“The pricing for your _____ stateroom is $_____ per person, which includes the cruise fare, taxes, fees, and port expenses for a reservation total of $_____. How does that sound?”</span></div>
      <div class="instruction-strip"><strong>Payment Check</strong><span>Check whether the changes create an additional deposit due. If additional deposit is required, advise Kyle and collect it using the training card.</span></div>
    </section>`;
  }
  return "";
}

function multipleAuthorizedDetailsHtml(d){
  if(!isMultipleAuthorizedAny(d))return "";

  const isTour=isMultipleAuthorizedCruisetourScenario(d);
  const selected=d.sailing;
  const selectedText=selected
    ? `${selected.ship||"NCL Ship"}${selected.sailingDate?` • ${formatSailingDate(selected.sailingDate)}`:""}${selected.departure?` • From ${selected.departure}`:""}`
    : (isTour
        ? "Search Pride of America • Honolulu • March 2027"
        : "Search Caribbean • Galveston • March 2027");

  return `<section class="scenario-section visual-section curriculum-specific-section multi-res-section">
    <div class="section-label">SCENARIO DETAILS</div>
    ${scenarioIconHeading(isTour?'🌺':'👨‍👩‍👧‍👦',isTour?'Multiple Reservations, Authorized Person & Cruisetour':'Multiple Reservations & Authorized Person')}
    <div class="scenario-detail-grid">
      <div><span>Caller</span><strong>Maria Lopez</strong><small>Direct Guest — U.S. Funds • Agency 5</small></div>
      <div><span>Travel Party</span><strong>4 Guests • 2 Reservations</strong><small>Maria + Sofia / Ana + Luis</small></div>
      <div><span>Sailing Search</span><strong>${escapeHtml(selectedText)}</strong><small>${isTour?'Use the exact selected Pride of America sailing and add the Cruisetour package in Seaweb.':'Choose a qualifying Caribbean sailing from Galveston in March 2027.'}</small></div>
      <div><span>Staterooms</span><strong>2 Balcony Staterooms</strong><small>They MUST connect • Any location</small></div>
      ${isTour?`<div><span>Cruisetour</span><strong>11-DAY OAHU EXPLORER HYATT WAIKIKI OCEAN VIEW CRUISETOUR</strong><small>4-day pre-cruise land portion • Do not substitute another package</small></div>`:""}
      <div><span>Payment</span><strong>Separate deposit on each reservation</strong><small>Maria is paying both deposits using the training card</small></div>
    </div>

    <div class="multi-res-grid">
      <article class="multi-res-card">
        <div class="multi-res-card-head"><span>RESERVATION 1</span><strong>Maria & Sofia</strong></div>
        <ul>
          <li><strong>Maria Lopez</strong> • Latitudes #279019549</li>
          <li><strong>Sofia</strong> • Age 4 • Latitudes #279019550</li>
          <li>Balcony stateroom connecting to Ana & Luis</li>
          <li>All applicable Free at Sea offers</li>
          <li>Pre-Paid Service Charges</li>
          <li>Norwegian Care / Travel Protection</li>
          <li>Sofia: <strong>Peanut Allergy</strong></li>
        </ul>
      </article>

      <article class="multi-res-card">
        <div class="multi-res-card-head"><span>RESERVATION 2</span><strong>Ana & Luis</strong></div>
        <ul>
          <li><strong>Ana Martinez</strong> • Latitudes #279019849</li>
          <li><strong>Luis Martinez</strong> • Latitudes #279019848</li>
          <li>Balcony stateroom connecting to Maria & Sofia</li>
          <li>Beds pushed together</li>
          <li>Extra pillows</li>
          <li>All applicable Free at Sea offers</li>
          <li>Pre-Paid Service Charges</li>
          <li>Norwegian Care / Travel Protection</li>
        </ul>
      </article>
    </div>

    <div class="instruction-strip"><strong>💬 Advertised Quote</strong><span>“The _____ stateroom is priced at $_____ per person for guests 1 & 2. This includes the cruise fare, taxes, fees, and port expenses.”</span></div>
    <div class="instruction-strip"><strong>Quote Rule</strong><span>When both bookings have identical components — same stateroom type, promotions, add-ons, number of guests and guest types — one quote may reflect the price per reservation. If anything differs, quote each reservation separately.</span></div>
    ${isTour?`<div class="instruction-strip"><strong>🌺 Cruisetour Check</strong><span>Make sure both reservations contain the exact <strong>11-Day Oahu Explorer Hyatt Waikiki Ocean View Cruisetour</strong> and the 4-day pre-cruise component. Do not book only the cruise portion.</span></div>`:""}
  </section>

  <section class="scenario-section visual-section authorized-person-section">
    <div class="section-label">AUTHORIZED PERSON</div>
    ${scenarioIconHeading('👤','Maria Is Booking for Her Parents')}
    <p>Maria is making Ana and Luis's reservation on their behalf and paying their deposit. Explain the Authorized Person guidelines before completing the parents' reservation.</p>
    <blockquote class="authorized-script">“Since you’re making a reservation for your parents, there are just a few important things to keep in mind. The payment being placed today is for each reservation and must be paid separately. You’ll be responsible for each $250 deposit made at this time, however your parents' reservation itself will be under their names, and they will have full access to manage it. I have added the authorized user so that you will also have access to manage it.”</blockquote>
    <div class="authorized-comment-box"><span>Required Parents' Reservation Comment</span><strong>Authorized Person: Maria Lopez, CC 0000</strong></div>
  </section>

  <section class="scenario-section visual-section">
    <div class="section-label">CONNECT & LINK</div>
    ${scenarioIconHeading('🔗','Connecting Staterooms + TWITH')}
    <div class="critical-callout"><strong>Do not assume adjacent rooms connect.</strong><span>Verify in Seaweb that the selected Balcony staterooms actually have a connecting door.</span></div>
    ${checklistHtml([
      "Both Balcony staterooms actually connect.",
      "Each room accommodates its assigned guests.",
      "Ana and Luis's beds are pushed together.",
      "Extra pillows are requested for Ana and Luis.",
      "Both reservations are linked with TWITH (Travel With) before ending the call."
    ])}
  </section>`;
}

function bookingSourceSectionHtml(d,agencyDisplay){
  const travelAgent=d.department==="Guest Services"&&d.reservationWorkflow==="new"&&d.newCallerType==="travel_agent";
  const title=travelAgent?'Travel Agency Information':'Caller / Booking Information';
  const icon=travelAgent?'🏢':'☎️';
  const rows=[`<li><strong>Department:</strong> ${escapeHtml(d.department)}</li>`,`<li><strong>Booking Source:</strong> ${escapeHtml(agencyDisplay)}</li>`];
  if(d.reservationWorkflow==="modify")rows.push(`<li><strong>Training Reservation #:</strong> ${escapeHtml(d.existingReservationNumber||'Trainer to provide')}</li>`);
  return `<section class="scenario-section visual-section">${scenarioIconHeading(icon,title)}<ul class="scenario-fact-list">${rows.join('')}</ul></section>`;
}

function sailingDetailsVisualHtml(d,pricing){
  if(d.reservationWorkflow==="modify")return '';
  const s=d.sailing;
  return `<section class="scenario-section visual-section">${scenarioIconHeading('🚢','Sailing Details')}<div class="scenario-detail-grid">
    <div><span>Sailing</span><strong>${escapeHtml(s?`${s.ship||'NCL Ship'}${s.title?` • ${s.title}`:''}`:'Trainer-selected NCL sailing')}</strong></div>
    <div><span>Departure</span><strong>${escapeHtml(s?.departure||'Verify in Seaweb')}</strong></div>
    <div><span>Sail Date</span><strong>${escapeHtml(s?.sailingDate?formatSailingDate(s.sailingDate):'Select / verify exact date')}</strong></div>
    <div><span>Guests</span><strong>${d.guestCount} ${d.guestCount===1?'Guest':'Guests'}</strong></div>
  </div><h4>🛏️ Category & Stateroom</h4><p>Book a <strong>${escapeHtml(d.category)}</strong>${d.location!=="Any"?` in the ${escapeHtml(d.location)} area`:''}${d.side!=="Any"?` with a ${escapeHtml(d.side)}-side preference`:''}. Review actual available inventory before selecting.</p>${pricing}</section>`;
}

function guestInformationVisualHtml(d){
  if(d.reservationWorkflow==="modify"||isMultipleAuthorizedAny(d))return '';
  const mix=getGuestProfileMix(d);
  const cards=Array.from({length:d.guestCount},(_,i)=>{
    const name=i===0?(d.guest1||`Guest ${i+1}`):i===1?(d.guest2||`Guest ${i+1}`):`Guest ${i+1}`;
    const past=d.latitudes&&mix.flags[i];
    const status=d.latitudes?(past?`Past Guest${mix.numbers[i]?` • Guest ID: ${escapeHtml(mix.numbers[i])}`:' • Verify Latitudes number'}`:'New Guest'):'Verify guest profile';
    return `<div class="scenario-guest-card"><span>Guest ${i+1}</span><strong>${escapeHtml(name)}</strong><small>${status}</small></div>`;
  }).join('');
  return `<section class="scenario-section visual-section">${scenarioIconHeading('👥','Guest Information')}<div class="scenario-guest-grid">${cards}</div><p class="scenario-reminder">Before proceeding, confirm legal names exactly as they appear on travel documents, dates of birth, and all other required guest details.</p></section>`;
}

function offersAddonsVisualHtml(d){
  const n=focusSearchText(d); const items=[];
  if(d.fas||/price programs|free at sea|\bfas\b/.test(n))items.push('All applicable Free at Sea offers');
  if(d.travel||/norwegian care|travel protection/.test(n))items.push('Norwegian Care / Travel Protection');
  if(d.psc||/prepaid service charge|ppsrvchg/.test(n))items.push('Pre-Paid Service Charges');
  if(/teacher/.test(n))items.push('Teacher Appreciation Offer, when eligible');
  if((/fcc|cruisenext|cruise first|coupon/.test(n)||d.payment==='FCC / CruiseNext') && !(d.coupons||[]).length)items.push('Applicable FCC / CruiseNext / CruiseFirst / discount coupon workflow');
  if(/special request|ada|dietary/.test(n))items.push('Applicable special, accessibility, or dietary requests');
  if(!items.length)return '';
  return `<section class="scenario-section visual-section">${scenarioIconHeading('🎁','Offers & Add-Ons')}<ul class="visual-check-list">${[...new Set(items)].map(x=>`<li>✅ ${escapeHtml(x)}</li>`).join('')}</ul><p class="scenario-reminder">Use Compass and the approved internal resources for the applicable offer conversations and current eligibility.</p></section>`;
}

function modificationDetailsVisualHtml(d){
  if(d.reservationWorkflow!=="modify")return '';
  return `<section class="scenario-section visual-section">${scenarioIconHeading('🗂️','Existing Reservation')}<p>Locate training reservation <strong>${escapeHtml(d.existingReservationNumber||'provided by the trainer')}</strong> and use the guest name(s) already on that reservation.</p><div class="scenario-detail-grid"><div><span>Modification</span><strong>${escapeHtml(modificationLabel(d.modificationType))}</strong></div>${d.modificationTarget?`<div><span>Guest / Item</span><strong>${escapeHtml(d.modificationTarget)}</strong></div>`:''}</div>${d.modificationRequest?`<div class="instruction-strip"><strong>Requested Change</strong><span>${escapeHtml(d.modificationRequest)}</span></div>`:''}</section>`;
}

function paymentVisualHtml(d,paymentInstruction){
  const card=d.cardRequired&&d.card?`<div class="scenario-payment-card"><div class="training-only-label">TRAINING / TEST DATA ONLY</div><p><strong>Card #:</strong> ${escapeHtml(d.card.number)}<br><strong>Expiration:</strong> ${escapeHtml(d.card.expiration)}<br><strong>CCV:</strong> ${escapeHtml(d.card.ccv)}<br><strong>Billing Address:</strong> ${escapeHtml(d.card.address)}</p></div>`:'';
  return `<section class="scenario-section visual-section payment-section">${scenarioIconHeading('💳','Payment')}<p>${escapeHtml(paymentInstruction)}</p>${card}</section>`;
}

function requiredActionsVisualHtml(d){
  const items=[];
  if(isMultipleAuthorizedAny(d)){
    return `<section class="scenario-section visual-section required-actions-section">
      <div class="section-label">REQUIRED ACTIONS</div>
      ${scenarioIconHeading('✅','Complete Both Reservations')}
      ${checklistHtml([
        "Recap Reservation 1 – Maria & Sofia.",
        "Recap Reservation 2 – Ana & Luis.",
        "Add appropriate reservation comments to BOTH reservations.",
        "Add the exact parents' reservation note: Authorized Person: Maria Lopez, CC 0000.",
        `Send a confirmation for EACH reservation to ${d.email||"training123@ncl.com"}.`,
        "Verify both deposits were processed separately.",
        "Link both reservations using TWITH (Travel With)."
      ])}
    </section>`;
  }
  if(isReinstateRoleplay(d))items.push("Store Changes after the reinstatement and all required updates are complete.");
  if(isAddGuestUpgradeRoleplay(d))items.push("Store Changes after the guest, stateroom, pricing, bed configuration, special requests and any payment are complete.");
  if(d.confirmation && (isSoloStudioScenario(d)||isAddGuestUpgradeRoleplay(d))){
    items.push(`Send the Guest confirmation to ${d.email||'training123@ncl.com'}.`);
    items.push(`Send the Travel Agent confirmation to ${d.email||'training123@ncl.com'}.`);
  }else if(d.confirmation){
    items.push(`Send the appropriate confirmation to ${d.email||'training123@ncl.com'}.`);
  }
  if(d.newCallerType==='travel_agent'&&d.reservationWorkflow==='new'&&d.confirmation&&!isSoloStudioScenario(d))items.push(`Send the Travel Agent confirmation to ${d.email||'training123@ncl.com'}.`);
  if(d.commenting)items.push('Leave the appropriate reservation comments using Compass / the Commenting Tool.');
  items.push('Complete a full reservation recap with the caller.');
  return `<section class="scenario-section visual-section">${scenarioIconHeading('📧','Required Actions')}<ul class="visual-check-list">${[...new Set(items)].map(x=>`<li>✅ ${escapeHtml(x)}</li>`).join('')}</ul></section>`;
}

function recapVisualHtml(d){
  if(isMultipleAuthorizedAny(d)){
    const tour=isMultipleAuthorizedCruisetourScenario(d);
    const items=[
      "Selected ship, sail date and itinerary",
      ...(tour?["11-Day Oahu Explorer Hyatt Waikiki Ocean View Cruisetour","4-day pre-cruise Cruisetour details"]:[]),
      "Reservation 1 – Maria & Sofia: Balcony stateroom, connecting room, pricing, offers, service charges, Norwegian Care, Sofia's peanut allergy and deposit",
      "Reservation 2 – Ana & Luis: Balcony stateroom, connecting room, pricing, offers, service charges, Norwegian Care, beds together, extra pillows, Authorized Person and deposit",
      "Both confirmations sent",
      "Both reservations linked with TWITH"
    ];
    return `<section class="scenario-section visual-section">${scenarioIconHeading('🗣️','Recap Both Reservations')}<p>Review each reservation separately with Maria before ending the call.</p>${checklistHtml(items)}</section>`;
  }

  const items=isSoloStudioScenario(d)
    ? ["Norwegian Aqua and June 27, 2027 sail date","7-Day Caribbean itinerary","Tom Holland traveling solo","Studio category and selected stateroom","Reservation pricing / total","Free at Sea","Pre-Paid Service Charges","Kosher Meals","Norwegian Care","Deposit collected","Confirmations and comments"]
    : isAddGuestUpgradeRoleplay(d)
      ? ["Tom and Taylor traveling together","New category and stateroom location","Twin-bed configuration","Updated pricing / reservation total","Free at Sea for the updated reservation","Pre-Paid Service Charges for both guests","Norwegian Care for both guests","Tom's Kosher Meals","Taylor's mushroom allergy","Additional deposit collected, if applicable","Confirmations and comments"]
      : isReinstateRoleplay(d)
        ? ["Reservation successfully reinstated, if eligible","Ship and sail date","Guests","Stateroom / any stateroom change","Pricing / any pricing change","Any offers or other reservation details affected by reinstatement","Confirmation sent","Any next steps"]
        : d.reservationWorkflow==='modify'?["Modification completed","Updated pricing / amount due","Promotion or deadline changes","Confirmation / comments","Any next steps"]:["Ship and sailing","Itinerary","Stateroom","Guests","Offers and add-ons",d.airEnabled?'Air / transfer arrangements':null,"Payment / deposit information","Any other important reservation details"].filter(Boolean);
  return `<section class="scenario-section visual-section">${scenarioIconHeading('🗣️','Recap the Reservation')}<p>Before ending the call, review the completed reservation or servicing outcome with the caller.</p><ul>${items.map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul></section>`;
}

function closingVisualHtml(d,primary){
  const isTravelAgent=d.department==="Guest Services"&&d.reservationWorkflow==="new"&&d.newCallerType==="travel_agent";
  const name=d.reservationWorkflow==='new'&&!isTravelAgent?(primary.split(' ')[0]||''):'';
  return `<section class="scenario-section visual-section close-call-section">${scenarioIconHeading('☎️','Close the Call')}<p>Before ending the call, ensure customer satisfaction by asking:</p><blockquote>“Is there anything else I can help you with today${name?`, ${escapeHtml(name)}`:''}?”</blockquote><p>Then close with:</p><blockquote>“Thank you for choosing Norwegian Cruise Line.”</blockquote></section>`;
}

function considerationsVisualHtml(d){
  return `<section class="scenario-section visual-section knowledge-visual-section">${scenarioIconHeading('🧠','Things to Consider')}<p>Anticipate the steps based on the reason for the call so you can control the call flow and guide the interaction effectively.</p><ul>${focusConsiderations(d).map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul><p class="scenario-reminder">📚 Use <strong>NCLHelp</strong> to research and confirm information when needed.</p></section>`;
}

function finalReservationCheckHtml(d,meta){
  const items=fullTaskList(d,meta);
  if(isMultipleAuthorizedAny(d)){
    const core=[
      ...items,
      "Both reservation numbers saved",
      "Both reservation numbers posted in the class chat",
      "Proper closing completed"
    ];
    return `<section class="scenario-section visual-section final-check-section">${scenarioIconHeading('✅','Final Reservation Check')}${checklistHtml([...new Set(core)])}</section>`;
  }
  const core=isRoleplayScenario(d)
    ? [...items,"Full reservation recap completed","Proper closing statements used","Roles switched and exercise repeated"]
    : [...items,"Reservation recap completed","Proper closing statements used","Reservation number saved","Reservation number posted in the class chat"];
  return `<section class="scenario-section visual-section final-check-section">${scenarioIconHeading('✅','Final Reservation Check')}${checklistHtml([...new Set(core)])}</section>`;
}
const FOLLOW_UP_CHANGE_LIBRARY={
  add_guest:{label:"Add a Guest",trainee:"Add the requested guest. Confirm required guest information, occupancy, pricing, promotions and deposit implications before saving.",caller:"You want to add another guest. Provide the new guest information only as the Cruise Specialist asks for it."},
  remove_guest:{label:"Remove a Guest",trainee:"Remove the requested guest only after reviewing the reservation impact, updated pricing, occupancy, promotions and any applicable refund or amount due.",caller:"You want to remove a guest. Allow the Cruise Specialist to review the impact before agreeing to proceed."},
  stateroom:{label:"Change / Upgrade Stateroom",trainee:"Research an appropriate category and available stateroom, review occupancy and location, quote updated advertised pricing and the reservation total, then receive approval before changing the room.",caller:"You want to change the category or stateroom. Give your room preferences as the Cruise Specialist asks about them."},
  guest_info:{label:"Update Guest Information",trainee:"Review the requested guest-information change and follow the applicable Seaweb / NCLHelp workflow before saving it.",caller:"You need information on a guest updated. Provide the details only when the Cruise Specialist asks the appropriate questions."},
  special_request:{label:"Special Request / Allergy",trainee:"Add or update the requested special request, meal need or allergy and make sure it is associated with the correct guest.",caller:"You need a special request, meal need or allergy added or updated."},
  bed_config:{label:"Bed Configuration",trainee:"Review the requested bed setup and update it when supported by the assigned stateroom.",caller:"You want the bed setup changed. Let the Cruise Specialist determine whether the stateroom supports the request."},
  fas:{label:"Free at Sea",trainee:"Review the applicable Free at Sea selections and complete the requested addition, removal or verification using the approved workflow.",caller:"You are calling about the Free at Sea selections on the reservation."},
  ppsrvc:{label:"Pre-Paid Service Charges",trainee:"Review and complete the requested Pre-Paid Service Charges change, then verify the updated reservation total.",caller:"You want to add, remove or review Pre-Paid Service Charges."},
  care:{label:"Norwegian Care",trainee:"Review the Travel Protection request and complete the applicable Norwegian Care workflow, including any required pricing or eligibility discussion.",caller:"You want to add, remove or discuss Norwegian Care."},
  air_transfer:{label:"Air / Transfers",trainee:"Review the applicable air or transfer request in the approved guidance and complete the requested servicing changes, including any payment or transfer implications.",caller:"You want to make a change involving air or transfers. Provide the trip details as the Cruise Specialist asks."},
  dining_amenity:{label:"Dining / Entertainment / Amenity",trainee:"Review availability and complete the requested dining, entertainment, spa or amenity action, including any payment or confirmation required.",caller:"You want to add or change an onboard dining, entertainment, spa or amenity item."},
  coupon_credit:{label:"Coupon / Credit",trainee:"Review the requested coupon or credit for eligibility, apply it in the correct order when eligible, and verify the updated balance.",caller:"You have a coupon, FCC, CruiseNext or other credit you want reviewed or applied."},
  price_drop:{label:"Price Drop",trainee:"Research current pricing and follow the approved price-drop workflow. Explain the outcome and any effect on the reservation before making changes.",caller:"You noticed a different price and want the reservation reviewed."},
  payment:{label:"Payment / Additional Deposit",trainee:"Review the amount due and collect the requested payment or additional deposit using training payment information when appropriate.",caller:"You are prepared to make any required payment after the servicing changes are reviewed."},
  cancel_reinstate:{label:"Cancel / Reinstate",trainee:"Follow the applicable cancellation or reinstatement workflow, including eligibility, pricing, stateroom availability, refund or amount-due information and documentation.",caller:"You are calling about cancelling or reinstating the reservation. Allow the Cruise Specialist to determine the applicable workflow."}
};

function followUpOriginalCallerType(source){
  if(!source)return "direct_guest";
  if(source.followUpRoleplay&&source.sourceScenarioSnapshot)return source.sourceScenarioSnapshot.originalCaller||"direct_guest";
  if(source.reservationWorkflow==="modify"){
    if(["travel_agent","ta_group"].includes(source.gdprCallerType))return "travel_agent";
    if(source.gdprCallerType==="direct_guest")return "direct_guest";
  }
  if(source.department==="Guest Services"&&source.reservationWorkflow==="new")return source.newCallerType==="travel_agent"?"travel_agent":"direct_guest";
  return "direct_guest";
}
function followUpResolvedCaller(source,selection){return selection==="same"?followUpOriginalCallerType(source):selection}
function followUpSelectedChanges(){return [...document.querySelectorAll('#followUpChangeOptions input[type="checkbox"]:checked')].map(x=>x.value)}

function followUpSourceSnapshot(source){
  const sailing=source.sailing||{};
  return {
    sourceTitle:source.title||focusTitle(source),
    focuses:focusNamesForData(source),
    guests:[source.guest1,source.guest2].filter(Boolean),
    ship:sailing.ship||"",sailDate:sailing.sailingDate||"",itinerary:sailing.title||"",departure:sailing.departure||"",duration:sailing.duration||"",
    category:source.category||"",location:source.location||"",side:source.side||"",agency:source.agency||"",market:source.market||"",
    originalCaller:followUpOriginalCallerType(source),fas:!!source.fas,travel:!!source.travel,psc:!!source.psc,airEnabled:!!source.airEnabled,
    confirmationEmail:source.email||"training123@ncl.com"
  };
}

function followUpSourceSummaryHtml(source){
  const snap=source.followUpRoleplay&&source.sourceScenarioSnapshot?source.sourceScenarioSnapshot:followUpSourceSnapshot(source);
  const guests=(snap.guests||[]).length?snap.guests.join(" + "):"Guest(s) from the original reservation";
  const sail=snap.ship?`${snap.ship}${snap.sailDate?` • ${formatSailingDate(snap.sailDate)}`:""}`:"Use the original practice reservation";
  return `<div class="followup-source-label">ORIGINAL PRACTICE RESERVATION</div><strong>${escapeHtml(snap.sourceTitle||"Previous Scenario")}</strong><span>${escapeHtml(guests)} • ${escapeHtml(sail)}</span><small>The follow-up uses this same reservation after the original practice has been completed.</small>`;
}

function updateFollowUpAgencyField(){
  const source=state.currentScenario;
  const resolved=followUpResolvedCaller(source,$("followUpCallerType")?.value||"same");
  $("followUpAgencyField")?.classList.toggle("hidden-field",resolved!=="travel_agent");
}

function openFollowUpRoleplayBuilder(){
  const current=state.currentScenario;if(!current)return;
  const cfg=current.followUpRoleplay?(current.followUpConfig||{}):{};
  $("followUpSourceSummary").innerHTML=followUpSourceSummaryHtml(current);
  $("followUpCallerType").value=cfg.callerSelection||"same";
  $("followUpAgency").value=cfg.agency||(followUpOriginalCallerType(current)==="travel_agent"?String(current.agency||current.sourceScenarioSnapshot?.agency||""):"");
  document.querySelectorAll('#followUpChangeOptions input[type="checkbox"]').forEach(cb=>cb.checked=(cfg.changes||[]).includes(cb.value));
  $("followUpCustomChanges").value=cfg.customChanges||"";
  $("followUpIncludeCard").checked=cfg.includeCard!==false;
  $("followUpKeepBenefits").checked=cfg.keepBenefits!==false;
  $("followUpBuilderNotice").className="notice warning hidden-field";
  $("followUpBuilderNotice").textContent="";
  updateFollowUpAgencyField();
  $("followUpRoleplayDialog").showModal();
}
function closeFollowUpRoleplayBuilder(){if($("followUpRoleplayDialog")?.open)$("followUpRoleplayDialog").close()}

function followUpGdprHtml(d){
  const ta=d.gdprCallerType==="travel_agent";
  return `<section class="scenario-section visual-section gdpr-section"><div class="section-label">VERIFY BEFORE SERVICING</div>${scenarioIconHeading('🔐','GDPR Verification')}<div class="critical-callout"><strong>Reservation Number is REQUIRED.</strong><span>Do not discuss or modify the reservation until the appropriate verification has been completed.</span></div><div class="gdpr-grid"><div><span>Caller Type</span><strong>${ta?"Travel Agent":"Direct Guest"}</strong></div><div><span>Required First</span><strong>Reservation Number</strong></div>${ta?`<div><span>Travel Agent Identifier</span><strong>Agency ID / Agency Phone Number</strong><small>${d.followUpConfig?.agency?escapeHtml(d.followUpConfig.agency):"Caller must provide the appropriate agency identifier"}</small></div>`:""}<div><span>Reservation Verification</span><strong>Guest Full Name</strong><small>Use the guest(s) on the original practice reservation</small></div><div><span>Sailing Verification</span><strong>Ship & Full Sail Date</strong><small>Confirm against the existing reservation</small></div></div></section>`;
}

function followUpSnapshotHtml(d){
  const s=d.sourceScenarioSnapshot||{};
  const guests=(s.guests||[]).length?s.guests.join(" + "):"Use guest(s) from original practice";
  const benefits=[s.fas?"Free at Sea":null,s.psc?"Pre-Paid Service Charges":null,s.travel?"Norwegian Care":null,s.airEnabled?"Air / Transfers":null].filter(Boolean);
  return `<section class="scenario-section visual-section followup-snapshot-section"><div class="section-label">EXISTING RESERVATION</div>${scenarioIconHeading('🗂️','Use the Reservation from the Previous Practice')}<div class="scenario-detail-grid"><div><span>Original Scenario</span><strong>${escapeHtml(s.sourceTitle||"Previous Scenario")}</strong><small>${escapeHtml((s.focuses||[]).join(" + "))}</small></div><div><span>Guest(s)</span><strong>${escapeHtml(guests)}</strong><small>Use the reservation created by the trainee</small></div><div><span>Sailing</span><strong>${escapeHtml(s.ship||"Original sailing")}</strong><small>${s.sailDate?escapeHtml(formatSailingDate(s.sailDate)):escapeHtml(s.itinerary||"Use original reservation")}</small></div><div><span>Current Stateroom / Category</span><strong>${escapeHtml(s.category||"Review in Seaweb")}</strong><small>Verify the actual reservation before servicing</small></div><div><span>Existing Benefits</span><strong>${escapeHtml(benefits.join(" • ")||"Review existing reservation")}</strong><small>Do not assume they remain unchanged after servicing</small></div><div><span>Reservation Number</span><strong>Use the reservation created in the original practice</strong><small>The caller must provide it during GDPR</small></div></div></section>`;
}

function followUpChangesHtml(d){
  const cfg=d.followUpConfig||{};
  const changes=(cfg.changes||[]).map(k=>FOLLOW_UP_CHANGE_LIBRARY[k]).filter(Boolean);
  const cards=changes.map((item,i)=>`<div class="followup-change-card"><span>${String(i+1).padStart(2,"0")}</span><div><strong>${escapeHtml(item.label)}</strong><small>${escapeHtml(item.trainee)}</small></div></div>`).join("");
  const custom=cfg.customChanges?`<div class="instruction-strip followup-custom-request"><strong>Caller-Specific Details</strong><span>${escapeHtml(cfg.customChanges).replace(/\n/g,"<br>")}</span></div>`:"";
  return `<section class="scenario-section visual-section followup-request-section"><div class="section-label">SERVICING REQUEST</div>${scenarioIconHeading('🛠️','Changes Requested by the Caller')}<p>Listen to the caller, research the request, explain any impact, and receive approval before completing changes that affect pricing or the reservation.</p><div class="followup-change-card-list">${cards}</div>${custom}${cfg.keepBenefits?`<div class="instruction-strip"><strong>Verify Existing Benefits</strong><span>After making the requested changes, verify that the reservation's existing promotions, add-ons, service charges, protection and other applicable items remain correct.</span></div>`:""}</section>`;
}

function followUpCallerRoleHtml(d){
  const cfg=d.followUpConfig||{};
  const prompts=(cfg.changes||[]).map(k=>FOLLOW_UP_CHANGE_LIBRARY[k]).filter(Boolean).map(item=>`<li>${escapeHtml(item.caller)}</li>`).join("");
  return `<section class="scenario-section visual-section caller-role-section"><div class="section-label">CALLER ROLE CARD</div>${scenarioIconHeading('☎️',d.gdprCallerType==="travel_agent"?"Travel Agent":"Direct Guest")}<div class="roleplay-caller-rule"><strong>Do not give the Cruise Specialist everything at once.</strong><span>Respond naturally. Let the Cruise Specialist ask questions, complete GDPR, research the reservation and control the servicing flow.</span></div><ul class="scenario-bullets">${prompts}</ul>${cfg.customChanges?`<div class="caller-private-note"><strong>Use these details during the call:</strong><span>${escapeHtml(cfg.customChanges).replace(/\n/g,"<br>")}</span></div>`:""}</section>`;
}

function followUpPaymentHtml(d){
  const cfg=d.followUpConfig||{};
  if(!cfg.includeCard)return `<section class="scenario-section visual-section payment-section"><div class="section-label">PAYMENT REVIEW</div>${scenarioIconHeading('💳','Check the Updated Amount Due')}<p>After servicing the reservation, review whether the changes create an additional deposit, payment, refund or other balance impact. Advise the caller before completing the transaction.</p></section>`;
  const card=d.card||currentTrainingCard();
  return `<section class="scenario-section visual-section payment-section"><div class="section-label">PAYMENT REVIEW</div>${scenarioIconHeading('💳','Check for Additional Payment')}<p>Review whether the servicing changes create an additional deposit or other amount due. If payment is required and the caller agrees to proceed, use the training card below.</p><div class="scenario-payment-card"><div class="training-only-label">TRAINING / TEST DATA ONLY</div><p><strong>Card #:</strong> ${escapeHtml(card?.number||"4917 6100 0000 0000")}<br><strong>Expiration:</strong> ${escapeHtml(card?.expiration||"04/2027")}<br><strong>CCV:</strong> ${escapeHtml(card?.ccv||"123")}<br><strong>Billing Address:</strong> ${escapeHtml(card?.address||"123 Sesame Street, Miami, FL 33126")}</p></div></section>`;
}

function followUpRequiredActionsHtml(d){
  const email=d.sourceScenarioSnapshot?.confirmationEmail||d.email||"training123@ncl.com";
  return `<section class="scenario-section visual-section required-actions-section"><div class="section-label">REQUIRED ACTIONS</div>${scenarioIconHeading('✅','Complete the Servicing Call')}${checklistHtml(["Go into Edit and make the approved servicing changes.","Review the updated pricing / reservation total and any amount due or refund before finalizing the changes.","Store Changes after all approved updates are complete.","Leave the appropriate reservation comments using Compass.",`Send the appropriate updated confirmation${d.gdprCallerType==="travel_agent"?"s to the Guest and Travel Agent":""} to ${email}.`,"Recap every completed change and any important reservation information with the caller.","Complete the appropriate customer-satisfaction question and Norwegian Cruise Line closing.","Switch roles and repeat the exercise so both trainees practice the Cruise Specialist role."])}</section>`;
}

function followUpFinalCheckHtml(d){
  const cfg=d.followUpConfig||{};
  const selected=(cfg.changes||[]).map(k=>FOLLOW_UP_CHANGE_LIBRARY[k]?.label).filter(Boolean);
  const checks=["Reservation Number obtained",d.gdprCallerType==="travel_agent"?"Travel Agent GDPR completed":"Direct Guest GDPR completed","Willingness to assist expressed",...selected.map(x=>`${x} request addressed`),cfg.customChanges?"Caller-specific change instructions completed":null,"Updated pricing / reservation impact reviewed",cfg.keepBenefits?"Existing promotions / add-ons verified after changes":null,"Any additional payment / refund requirement checked","Store Changes completed","Compass reservation comments added","Updated confirmation sent","Full reservation recap completed","Proper closing completed","Trainees switched roles and repeated the exercise"].filter(Boolean);
  return `<section class="scenario-section visual-section final-check-section">${scenarioIconHeading('✅','Final Roleplay Check')}${checklistHtml(checks)}</section>`;
}

function buildFollowUpRoleplayHtml(d){
  const source=d.sourceScenarioSnapshot||{};
  const callerLabel=d.gdprCallerType==="travel_agent"?"Travel Agent":"Direct Guest";
  return `<div class="scenario-meta-row"><span class="chip">Guest Services</span><span class="chip">Follow-Up Servicing</span><span class="chip">Roleplay</span><span class="chip">${escapeHtml(callerLabel)}</span></div><h2 class="scenario-main-title">🎭 SEAweb Follow-Up Servicing Roleplay – ${escapeHtml(source.sourceTitle||"Existing Reservation")}</h2><p class="scenario-intro">Use the reservation completed during the original practice scenario. One trainee will be the <strong>Cruise Specialist</strong> and the other will be the <strong>${escapeHtml(callerLabel)}</strong>. The caller is contacting Norwegian Cruise Line again to make changes to the existing reservation.</p><div class="scenario-completion-box"><strong>✅ When you are finished</strong><span>Store all approved changes, complete comments and confirmations, recap the reservation, then switch roles and repeat.</span></div>${roleplaySetupHtml(d)}${followUpSnapshotHtml(d)}${followUpGdprHtml(d)}${followUpCallerRoleHtml(d)}${followUpChangesHtml(d)}${followUpPaymentHtml(d)}${followUpRequiredActionsHtml(d)}${followUpFinalCheckHtml(d)}<section class="scenario-section visual-section trainer-only"><div class="section-label">TRAINER GUIDE</div>${scenarioIconHeading('🧭','Follow-Up Roleplay Coaching')}<p>This roleplay intentionally follows the original practice reservation. Allow the caller to reveal the requested changes naturally. The Cruise Specialist should complete GDPR first, research each change rather than assuming the outcome, explain pricing / reservation impact, obtain approval, Store Changes, document, confirm and recap.</p><div class="instruction-strip"><strong>Original Scenario</strong><span>${escapeHtml(source.sourceTitle||"Previous practice")} • ${escapeHtml((source.focuses||[]).join(" + "))}</span></div></section>`;
}

function createFollowUpRoleplay(){
  const current=state.currentScenario;if(!current)return;
  const base=current.followUpRoleplay?current.sourceScenarioSnapshot:followUpSourceSnapshot(current);
  const changes=followUpSelectedChanges();
  const customChanges=$("followUpCustomChanges").value.trim();
  if(!changes.length&&!customChanges){const n=$("followUpBuilderNotice");n.className="notice warning";n.textContent="Select at least one servicing change or enter the caller's custom change request.";return}
  const callerSelection=$("followUpCallerType").value;
  const resolvedCaller=callerSelection==="same"?(base.originalCaller||followUpOriginalCallerType(current)):callerSelection;
  const agency=$("followUpAgency").value.trim()||(resolvedCaller==="travel_agent"?String(base.agency||""):"");
  const config={callerSelection,callerType:resolvedCaller,agency,changes,customChanges,includeCard:$("followUpIncludeCard").checked,keepBenefits:$("followUpKeepBenefits").checked};
  const sourceCard=current.card||currentTrainingCard();
  const now=new Date().toISOString();
  const d={...current,id:crypto.randomUUID(),department:"Guest Services",title:`Follow-Up Roleplay – ${base.sourceTitle||current.title||"Scenario"}`,type:"Follow-Up Servicing Roleplay",reservationWorkflow:"modify",newCallerType:"",existingReservationNumber:"",modificationType:"general",modificationTarget:"",modificationRequest:[...changes.map(k=>FOLLOW_UP_CHANGE_LIBRARY[k]?.label).filter(Boolean),customChanges].filter(Boolean).join(" • "),gdprCallerType:resolvedCaller,agency:agency||base.agency||"",market:resolvedCaller==="travel_agent"?"Travel Agent":"Direct Guest",payment:"No Payment / Service Only",email:base.confirmationEmail||current.email||"training123@ncl.com",commenting:true,confirmation:true,roleplayMode:true,followUpRoleplay:true,followUpConfig:config,sourceScenarioId:current.followUpRoleplay?current.sourceScenarioId:current.id,sourceScenarioSnapshot:base,cardRequired:!!config.includeCard,card:config.includeCard?(sourceCard||null):null,curriculumKind:"followup_roleplay",curriculumKinds:[...(current.curriculumKinds||[]),"followup_roleplay"],curriculumObjective:"Service the existing reservation through a callback roleplay using trainer-selected reservation changes.",curriculumObjectives:[...(current.curriculumObjectives||[]),"Follow-up servicing roleplay with trainer-selected changes."],createdAt:now,updatedAt:now,favorite:false,archived:false};
  d.html=buildFollowUpRoleplayHtml(d);state.currentScenario=d;$("scenarioOutput").innerHTML=d.html;closeFollowUpRoleplayBuilder();runValidator();$("scenarioStatus").textContent=blockingErrors()?"Needs Review":"Ready for Trainee";$("scenarioStatus").className="status-badge "+(blockingErrors()?"review":"ready");updateRoleplayScenarioButton();updateFollowUpRoleplayButton();flash("Follow-up servicing roleplay created.");
}

function updateFollowUpRoleplayButton(){
  const btn=$("followUpRoleplayBtn");if(!btn)return;const d=state.currentScenario;btn.disabled=!d;btn.textContent=d?.followUpRoleplay?"Edit Follow-Up Roleplay":"Create Follow-Up Roleplay";btn.title=d?"Build a new servicing callback using this reservation and choose the changes the caller wants to make.":"Generate a scenario first.";
}


function generateScenario(){
  const focusRecords=selectedFocusRecords();
  if(!focusRecords.length){
    alert("Choose at least one Scenario Focus before generating the scenario.");
    openFocusPicker();
    return;
  }
  const d=scenarioData();
  const metas=focusRecords.map(r=>r.meta);
  const meta=metas[0]||{};
  const guestNames=[d.guest1,d.guest2].filter(Boolean);
  const primary=guestNames[0]||"the guest";
  const s=d.sailing;
  const sailText=s?`${s.duration?`${s.duration}-day `:""}${s.title||"cruise"} on ${s.ship||"Norwegian Cruise Line"}${s.departure?`, departing from ${s.departure}`:""}${s.sailingDate?` on ${formatSailingDate(s.sailingDate)}`:(s.sailingMonths?.length?` during ${s.sailingMonths.join(", ")}`:"")}`:"a trainer-selected Norwegian Cruise Line sailing";
  const addOns=[];if(d.fas)addOns.push("Free at Sea");if(d.travel)addOns.push("Travel Protection");if(d.psc)addOns.push("Prepaid Service Charges");
  const pricing=d.pricing?`<div class="instruction-strip"><strong>💬 Quote Advertised Pricing</strong><span>${escapeHtml(d.pricing)}. Reconfirm current Seaweb pricing before class.</span></div>`:`<div class="instruction-strip"><strong>💬 Quote Advertised Pricing</strong><span>Review the current Seaweb pricing and practice quoting what Seaweb displays. Do not use a fabricated amount.</span></div>`;
  const paymentInstruction={
    "No Payment / Service Only":"Complete the servicing task without collecting a new card payment unless Seaweb shows a newly due amount that is part of the trainer's instructions.",
    "Offer / Hold only":"Place the reservation in Offer/Hold status without collecting payment. Explain the applicable deposit deadline shown in Seaweb.",
    "Minimum Deposit":"Process only the minimum amount due using the training credit card information below.",
    "Initial Deposit":"Process the required initial deposit using the training credit card information below.",
    "Full Payment":"Review the full amount due and process full payment using the training credit card information below.",
    "FCC / CruiseNext":"Use the applicable training FCC/CruiseNext/CruiseFirst credit according to the scenario workflow. Do not substitute a card unless an additional payment is required.",
    "Amenity Payment":"Process the payment due for the amenity/add-on using the training credit card information below and send the appropriate invoice/confirmation.",
    "Auto Final Payment discussion":"Discuss Auto Final Payment and complete the enrollment steps in the training environment if instructed.",
    "Refund / Reinstate":"Follow the cancellation/refund or reinstatement workflow. Verify the original form of payment and applicable refund timing."
  }[d.payment]||"Complete the payment/booking action shown in Seaweb.";
  const approachText={current:"Use the selected curriculum focus and preserve its core workflow.",variation:"Trainer-generated variation that preserves the required workflow while varying guests, sailing, stateroom, or preferences.",new:"New practice case built around the selected learning objectives."}[d.approach];
  const agencyDisplay=d.department==="Outbound Sales"?`${d.market} | Agency ${d.agency}`:(d.reservationWorkflow==="new"?(d.newCallerType==="travel_agent"?`Travel Agent • Agency ID / Phone: ${d.agency||"Not entered"}`:`${newReservationCallerLabel(d)} • Agency ${d.agency}`):guestServicesAgencyDisplay(d.agency));

  const html=`
    <div class="scenario-meta-row"><span class="chip">${escapeHtml(d.department)}</span><span class="chip">${escapeHtml(d.reservationWorkflow==="modify"?"Modify Existing Reservation":"Create New Reservation")}</span><span class="chip">${escapeHtml(d.difficulty)}</span><span class="chip">${d.focuses.length} focus${d.focuses.length===1?'':'es'}</span></div>
    <h2 class="scenario-main-title">${isRoleplayScenario(d)?'🎭 SEAweb Roleplay Scenario':'🛳️ SEAweb Practice Scenario'} – ${escapeHtml(focusTitle(d))}</h2>
    <p class="scenario-intro">${isRoleplayScenario(d)?'Work with a partner and allow the Cruise Specialist to control the call naturally.':'Please complete the following scenario <strong>independently</strong>.'} If you encounter any difficulties, refer to the <strong>Seaweb User Guide in NCLHelp</strong> for step-by-step guidance.</p>
    ${completionInstructionsHtml(d)}
    ${focusSummaryHtml(d)}
    ${roleplaySetupHtml(d)}

    <section class="scenario-section visual-section call-section">${scenarioIconHeading('☎️','Call Scenario')}${customerStoryHtml(d,meta,sailText,guestNames)}</section>
    ${curriculumScenarioDetailsHtml(d)}

    ${bookingSourceSectionHtml(d,agencyDisplay)}
    ${d.reservationWorkflow==='modify'?gdprScenarioHtml(d):''}
    ${modificationDetailsVisualHtml(d)}
    ${sailingDetailsVisualHtml(d,pricing)}
    ${guestInformationVisualHtml(d)}
    ${offersAddonsVisualHtml(d)}
    ${couponScenarioHtml(d)}
    ${d.airEnabled?airScenarioHtml(d):''}
    ${paymentVisualHtml(d,paymentInstruction)}
    ${requiredActionsVisualHtml(d)}
    ${callFlowSupportHtml(d,meta)}
    ${recapVisualHtml(d)}
    ${closingVisualHtml(d,primary)}
    ${considerationsVisualHtml(d)}
    ${finalReservationCheckHtml(d,meta)}
    ${trainerGuideHtml(d,meta,approachText,s)}`;

  $("scenarioOutput").innerHTML=html;
  d.html=html;state.currentScenario=d;runValidator();
  $("scenarioStatus").textContent=blockingErrors()?"Needs Review":"Ready for Trainee";
  $("scenarioStatus").className="status-badge "+(blockingErrors()?"review":"ready");
  updateRoleplayScenarioButton();
  updateFollowUpRoleplayButton();
}

function updateRoleplayScenarioButton(){
  const btn=$("roleplayScenarioBtn");
  if(!btn)return;
  const d=state.currentScenario;
  btn.disabled=!d;
  if(!d){
    btn.textContent="Make Roleplay";
    btn.title="Generate a scenario first.";
    return;
  }
  if(isDedicatedRoleplay(d)||d.followUpRoleplay){
    btn.textContent=d.followUpRoleplay?"Follow-Up Roleplay":"Roleplay Scenario";
    btn.title=d.followUpRoleplay?"This callback scenario is already a roleplay.":"This Scenario Focus is designed as a roleplay.";
    btn.disabled=true;
    btn.classList.add("active");
    return;
  }
  btn.disabled=false;
  btn.classList.toggle("active",isRoleplayScenario(d));
  btn.textContent=isRoleplayScenario(d)?"Standard Scenario":"Make Roleplay";
  btn.title=isRoleplayScenario(d)?"Convert this card back to a standard individual practice scenario.":"Convert this completed scenario into a two-person roleplay.";
}

$("roleplayScenarioBtn").onclick=()=>{
  if(!state.currentScenario)return;
  if(isDedicatedRoleplay(state.currentScenario))return;
  state.currentScenario.roleplayMode=!state.currentScenario.roleplayMode;
  generateScenario();
  flash(state.currentScenario.roleplayMode?"Roleplay version created.":"Returned to the standard scenario.");
};

$("followUpRoleplayBtn").onclick=openFollowUpRoleplayBuilder;
$("followUpCallerType").onchange=updateFollowUpAgencyField;
$("clearFollowUpChangesBtn").onclick=()=>document.querySelectorAll('#followUpChangeOptions input[type="checkbox"]').forEach(cb=>cb.checked=false);
$("buildFollowUpRoleplayBtn").onclick=createFollowUpRoleplay;
$("followUpRoleplayDialog").addEventListener("click",e=>{if(e.target===$("followUpRoleplayDialog"))closeFollowUpRoleplayBuilder()});

$("generateBtn").onclick=generateScenario;
$("clearScenarioBtn").onclick=()=>{if(confirm("Clear the current scenario and start a brand-new one? Unsaved changes will be lost."))resetScenarioForm();};

function runValidator(){
  const d=state.currentScenario||scenarioData(), s=d.sailing, checks=[];
  const add=(severity,title,detail)=>checks.push({severity,title,detail});
  const meta=currentFocusMeta()||{};
  const metas=selectedFocusMetas();

  if(d.followUpRoleplay){
    const cfg=d.followUpConfig||{};
    add("passed","Follow-up servicing roleplay","Uses the reservation created in the original practice scenario.");
    add("passed","Reservation verification rule","Reservation Number is REQUIRED before discussing or servicing the reservation.");
    add("passed","GDPR caller path",d.gdprCallerType==="travel_agent"?"Travel Agent GDPR":"Direct Guest GDPR");
    if(d.gdprCallerType==="travel_agent"&&!cfg.agency)add("warning","Travel Agency identifier not entered","Provide an Agency ID or agency phone number for the Travel Agent GDPR path.");
    if(!(cfg.changes||[]).length&&!cfg.customChanges)add("error","No servicing change selected","Choose at least one follow-up change or enter a custom caller request.");
    else add("passed","Servicing request configured",[...(cfg.changes||[]).map(k=>FOLLOW_UP_CHANGE_LIBRARY[k]?.label).filter(Boolean),cfg.customChanges?"Custom request details":null].filter(Boolean).join(" • "));
    if(d.cardRequired&&d.card)add("passed","Training payment fallback included",`${d.card.label||"Training Card"} • TRAINING / TEST DATA ONLY`);
    if(d.confirmation&&d.email)add("passed","Updated confirmation required",d.email);
    if(d.commenting)add("passed","Compass comments required","The generated roleplay requires reservation comments.");
    state.validation=checks;
    renderValidator();
    return checks;
  }

  if(!d.department)add("error","Department missing","Choose Guest Services or Outbound Sales.");
  else add("passed","Department selected",`${d.department} • ${focusNamesForData(d).join(" + ")}`);
  add("passed","Reservation workflow selected",d.reservationWorkflow==="modify"?"Modify Existing Reservation":"Create New Reservation");
  if(d.reservationWorkflow==="new"&&!d.guest1 && !metas.some(m=>m.kind==="demo"))add("error","Missing primary guest","Guest 1 is required for new-reservation trainee scenarios.");
  else if(d.guest1)add("passed","Primary guest present",d.guest1);
  if(d.reservationWorkflow==="new"&&d.guestCount>1 && !d.guest2 && !metas.some(m=>m.kind==="demo"))add("warning","Guest 2 is blank","The scenario has multiple guests selected. Guest 2 should normally be named or intentionally created by the trainee.");
  if(d.latitudes){
    const mix=getGuestProfileMix(d);
    const missing=mix.flags.reduce((list,isPast,i)=>{if(isPast&&!mix.numbers[i])list.push(i+1);return list;},[]);
    if(missing.length)add("warning","Past Guest Latitudes number missing",`Guest ${missing.join(", Guest ")} ${missing.length===1?"is":"are"} marked Past Guest but missing a training Latitudes number.`);
    else add("passed","Guest status configured",`${mix.pastCount} Past Guest${mix.pastCount===1?"":"s"} • ${mix.newCount} New Guest${mix.newCount===1?"":"s"}.`);
  }

  if(isMultipleAuthorizedAny(d)){
    if(d.reservationWorkflow!=="new")add("error","Multiple-reservation workflow mismatch","This scenario must use Create New Reservation.");
    if(d.newCallerType!=="direct_us")add("error","Caller type mismatch","Maria Lopez is a Direct Guest — U.S. caller.");
    if(d.guestCount!==4)add("warning","Travel party should contain four guests","Maria, Sofia, Ana and Luis are traveling across two reservations.");
    if(d.category!=="Balcony")add("warning","Balcony category expected","Both reservations require connecting Balcony staterooms.");
    if(d.payment!=="Initial Deposit")add("warning","Separate deposits required","Process the $250 deposit on each reservation separately.");
    if(!d.cardRequired||!d.card)add("error","Training card required","Maria is paying both deposits with the training credit card.");
    if(d.sailing){
      if(isMultipleAuthorizedCruisetourScenario(d) && String(d.sailing.ship||"").toLowerCase()!=="pride of america")add("error","Pride of America required","The Cruisetour scenario must use Pride of America.");
      if(isMultipleAuthorizedCruisetourScenario(d) && !/honolulu/i.test(d.sailing.departure||""))add("warning","Honolulu departure expected","Verify the selected Pride of America sailing departs Honolulu.");
      if(isMultipleAuthorizedScenario(d) && !/galveston/i.test(d.sailing.departure||""))add("warning","Galveston departure expected","The standard scenario requires a March 2027 Caribbean sailing from Galveston.");
    }else{
      add("warning","Select the training sailing","Use Real Sailing Search to choose the exact March 2027 sailing before assigning the scenario.");
    }
    add("passed","Authorized Person requirement","Parents' reservation must include: Authorized Person: Maria Lopez, CC 0000.");
    add("passed","TWITH requirement","Both reservations must be linked using TWITH before ending the call.");
    if(isMultipleAuthorizedCruisetourScenario(d))add("passed","Cruisetour requirement","Use the exact 11-Day Oahu Explorer Hyatt Waikiki Ocean View Cruisetour with the 4-day pre-cruise component on both reservations.");
  }

  if(isSoloStudioScenario(d)){
    if(d.reservationWorkflow!=="new")add("error","Solo practice workflow mismatch","Solo Guest / Studio Booking must use Create New Reservation.");
    if(d.newCallerType!=="travel_agent")add("error","Solo practice caller mismatch","Kyle James must be set as a Travel Agent caller.");
    if(d.guestCount!==1)add("error","Solo occupancy mismatch","This practice scenario requires exactly 1 guest.");
    if(d.category!=="Studio / Solo")add("warning","Studio category not selected","The Solo practice requires a Studio category.");
    if(d.payment!=="Minimum Deposit")add("warning","Minimum deposit expected","The Solo practice requires taking the minimum deposit.");
  }

  if(isAddGuestUpgradeRoleplay(d)){
    if(d.reservationWorkflow!=="modify")add("error","Service roleplay workflow mismatch","Add Guest & Upgrade Stateroom – Roleplay must use Modify Existing Reservation.");
    if(d.gdprCallerType!=="travel_agent")add("error","Travel Agent GDPR required","Kyle James is the Travel Agent caller for this roleplay.");
    if(d.modificationType!=="add_guest")add("error","Add Guest modification required","The service roleplay must use Add Guest.");
    if(d.modificationLatitudes!=="272279126")add("warning","Taylor Latitudes number","Expected training Latitudes #272279126 for Taylor.");
    add("passed","Reservation verification rule","Reservation Number is REQUIRED before servicing the reservation.");
  }

  if(d.department==="Guest Services"){
    if(d.reservationWorkflow==="new"){
      const caller=newReservationCallerInfo(d.newCallerType);
      if(caller.type==="direct_us"){
        if(String(d.agency)!=="5")add("error","Direct Guest agency mismatch","Direct Guest — US must use Agency 5.");
        else add("passed","Caller / booking source","Direct Guest — US • Agency 5");
      }else if(caller.type==="direct_ca"){
        if(String(d.agency)!=="7")add("error","Direct Guest agency mismatch","Direct Guest — Canada must use Agency 7.");
        else add("passed","Caller / booking source","Direct Guest — Canada • Agency 7");
      }else{
        if(!d.agency)add("error","Travel Agent identifier missing","Enter the Travel Agent's Agency ID or phone number.");
        else if(["5","7"].includes(String(d.agency)))add("error","Travel Agent identifier invalid","Agency 5 and Agency 7 are Direct Guest bookings. Enter the Travel Agent's Agency ID or phone number.");
        else add("passed","Caller / booking source",`Travel Agent • Agency ID / Phone: ${d.agency}`);
      }
      if(focusNamesForData(d).includes("Agencies: TA Booking") && caller.type!=="travel_agent"){
        add("error","Caller type does not match scenario focus","Agencies: TA Booking requires Caller Type = Travel Agent.");
      }
    }else{
      const source=guestServicesAgencyInfo(d.agency);
      if(source.type==="unknown"){
        add("error","Agency / booking identifier missing","Use Agency 5 for a US Direct Guest, Agency 7 for a Canadian Direct Guest, or enter the Travel Agent's Agency ID / phone number.");
      }else if(source.type==="direct_us"){
        add("passed","Guest Services booking source","Agency 5 • Direct Guest (US)");
        if(d.gdprCallerType!=="direct_guest")add("error","GDPR caller mismatch","Agency 5 is always a Direct Guest. Use the Direct Guest GDPR requirements.");
      }else if(source.type==="direct_ca"){
        add("passed","Guest Services booking source","Agency 7 • Direct Guest (Canada)");
        if(d.gdprCallerType!=="direct_guest")add("error","GDPR caller mismatch","Agency 7 is always a Direct Guest from Canada. Use the Direct Guest GDPR requirements.");
      }else{
        add("passed","Guest Services Travel Agent identifier",`Agency ID / Phone: ${d.agency}`);
        if(["travel_agent","ta_group"].includes(d.gdprCallerType)){
          add("passed","Travel Agent caller setup","Travel Agent booking uses an Agency ID / phone number and the Travel Agent GDPR path.");
        }
        if(d.gdprCallerType==="direct_guest"){
          add("error","Agency / caller mismatch","Direct Guest bookings should use Agency 5 (US) or Agency 7 (Canada), not a Travel Agent identifier.");
        }
      }
    }
  }else if(d.department==="Outbound Sales"){
    if(!d.agency)add("error","Outbound agency missing","Choose the market/currency agency before assigning the scenario.");
    else add("passed","Outbound market agency selected",`${d.market}`);
  }

  if(d.reservationWorkflow==="modify"){
    if(isReinstateRoleplay(d)){
      if(d.department!=="Guest Services")add("error","Roleplay department mismatch","Reinstate Cancelled Reservation – Roleplay is designed for Guest Services.");
      if(d.modificationType!=="cancel_reinstate")add("error","Roleplay workflow mismatch","This roleplay must use Cancel / Reinstate Reservation.");
      if(!["direct_guest","travel_agent","ta_group"].includes(d.gdprCallerType))add("warning","Select the roleplay caller type","Choose Direct Guest or Travel Agent based on the cancelled reservation being used.");
      else add("passed","Roleplay caller type selected",gdprProfile(d.gdprCallerType)?.label||d.gdprCallerType);
      add("passed","Roleplay verification rule","Reservation Number is REQUIRED before servicing the reservation.");
    }
    if(d.existingReservationNumber)add("passed","Existing reservation identified",d.existingReservationNumber);
    else add("warning","Training reservation number not entered","Enter the previously created training reservation number or provide it to the trainee separately.");

    if(d.department==="Guest Services"){
      const profile=gdprProfile(d.gdprCallerType);
      if(!profile)add("error","GDPR caller type required","Guest Services modifications must identify the caller / reservation type so the correct GDPR verification can be completed.");
      else add("passed","GDPR verification required",`${profile.label} • Ask primary items first • Reservation Number always mandatory${["travel_agent","ta_group"].includes(d.gdprCallerType)?" • Agency identifier mandatory for Travel Agent path":""}`);
      if(["travel_agent","ta_group"].includes(d.gdprCallerType) && ["5","7"].includes(String(d.agency).trim())){
        add("error","Travel Agent identifier required","Agency 5 and Agency 7 are Direct Guest bookings. Enter the Travel Agent's Agency ID or phone number for a Travel Agent / TA Group scenario.");
      }
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
      if(!s.sailingDate){
        add("error","Specific sailing date required","Choose the exact sailing date before assigning the scenario.");
      }else if(s.sailingDateSourceType==="ncl"){
        add("passed","Exact sailing date selected",`${formatSailingDate(s.sailingDate)} • NCL.com U.S.`);
      }else if(s.sailingDateSourceType==="public-schedule"){
        add("warning","Public schedule date selected",`${formatSailingDate(s.sailingDate)} • ${s.sailingDateSource||"Public schedule"}. Verify the final date in NCL.com U.S. or Seaweb before class.`);
      }else{
        add("warning","Verify trainer-entered sailing date",`${formatSailingDate(s.sailingDate)} was entered by the trainer. Verify it in NCL.com U.S. or Seaweb before class.`);
      }
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

  if(couponWorkflowRequested() || (d.coupons||[]).length){
    if(!(d.coupons||[]).length){
      add("warning","Credits / coupons not specified","This scenario includes a credit/coupon workflow. Add each training credit/coupon and identify the source guest and Latitudes number.");
    }else{
      d.coupons.forEach((item,i)=>{
        const n=i+1;
        if(!item.type)add("error",`Credit / Coupon ${n} type missing`,`Choose the credit or coupon being applied.`);
        if(!item.guest)add("error",`Credit / Coupon ${n} source guest missing`,`Identify which guest owns the credit/coupon.`);
        if(!item.latitudes)add("error",`Credit / Coupon ${n} Latitudes number missing`,`Enter the training Latitudes number the credit/coupon is being applied from.`);
        if(item.type&&item.guest&&item.latitudes)add("passed",`Credit / Coupon ${n} configured`,`${couponLabel(item)} • ${item.guest} • Latitudes # ${item.latitudes}`);
      });
    }
  }

  if(d.airEnabled){
    const airMeta=airProgramMeta(d.airProgram);
    if(!airMeta){
      add("error","NCL Air Program not selected","Choose the applicable NCL Air Program before assigning the scenario.");
    }else{
      add("passed","Air program selected",`${airMeta.label} • ${airTripLabel(d)}`);
      if(airMeta.nclAir)add("info","Pre-cruise transfer reminder","Remove the pre-cruise transfer because NCL Air guests are scheduled to arrive at least one day before embarkation. Review hotel and related ground-transportation responsibility.");
    }
    if(d.airProgram==="bundled"){
      const eligibility=bundledAirEligibility(d);
      if(eligibility.status==="ineligible")add("error","Bundled Air sailing is not eligible",eligibility.message);
      else add("warning","Verify Bundled Air sailing eligibility",eligibility.message);
      if(d.airTripType==="one_way")add("info","Bundled Air one-way pricing","Use 50% of the applicable promotional air pricing for the selected gateway.");
    }
    if(d.airProgram==="independent_no_flights"){
      add("info","Independent Air transfer setup","Use T1 / flight 999, the approved generic time ranges, and the correct airport transfer.");
      if(d.airTripType==="one_way")add("warning","Verify Independent Air one-way setup","The source article describes required information for both outbound and inbound flight records. Confirm the intended one-way training setup in NCLHelp before class.");
    }
  }

  if(/\bada\b|accessible/i.test(focusSearchText(d))){
    if(d.category!=="ADA / Accessible")add("error","ADA category mismatch","This training focus requires an ADA / accessible stateroom category. Do not assign a standard Balcony/Oceanview/Inside category.");
    else add("passed","Accessible category aligned","ADA / Accessible is selected and location/side should remain availability-driven.");
  }

  if(d.cardRequired){
    if(!d.card)add("error","Training credit card missing","This scenario requires a card payment, but no training card profile is attached.");
    else add("passed","Training credit card included",`${d.card.label} • TRAINING / TEST DATA ONLY`);
    if(metas.some(m=>m.cardRequired) && ["No Payment / Service Only","Offer / Hold only","FCC / CruiseNext","Refund / Reinstate"].includes(d.payment)) add("warning","Payment action may conflict with curriculum","The selected training focus is tagged as requiring a card payment, but the current payment action may not collect one.");
    if(!metas.some(m=>m.cardRequired) && paymentActionNeedsCard()) add("info","Trainer-added card payment","This variation adds a card payment even though the source curriculum focus does not require one by default.");
  }else add("passed","Payment method aligned","No training credit card is required for this focus by default.");

  if((focusSearchText(d).includes("fcc")||focusSearchText(d).includes("price programs")) && d.payment!=="FCC / CruiseNext" && !focusSearchText(d).includes("price programs")) add("warning","FCC workflow review","Confirm the selected payment action preserves the offer-first coupon/FCC workflow.");
  if(d.confirmation && !d.email)add("error","Confirmation email missing","Confirmation is required but no training email is entered.");
  else if(d.confirmation)add("passed","Confirmation task included",d.email);
  if(metas.some(m=>m.commenting) && !d.commenting)add("warning","Commenting Tool expected","The current curriculum focus includes reservation notation/comments.");

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
  if(!includeTrainer)clone.querySelectorAll(".trainer-section").forEach(el=>el.remove());
  clone.querySelectorAll("button,input,select,textarea").forEach(el=>el.remove());
  clone.removeAttribute("id");
  return clone;
}

function makeExactSharePayload(includeTrainer=state.mode==="trainer"){
  const source=$("scenarioOutput");
  const width=Math.max(520,Math.round(source.getBoundingClientRect().width));
  const host=makeOffscreenShareHost();
  host.style.width=`${width}px`;
  const clone=makeViewShareClone(includeTrainer);
  host.appendChild(clone);
  inlineComputedStyles(clone);
  const html=clone.outerHTML;
  host.remove();
  return {html,width};
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
  "flex-direction","flex-wrap","flex","white-space","min-height","max-height",
  "box-shadow","overflow","opacity","vertical-align","text-decoration","justify-items","align-content","place-items",
  "background-image","background-size","background-position","background-repeat"
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
    el.setAttribute("style",inline.join(";"));
  });
}

const INTERACTIVE_SHARE_LOGO_DATA='';
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

async function renderShareHtmlToPng(html,mode="full",renderWidth=null){
  const response=await fetch("/api/share-card",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({html,exact:true,width:renderWidth||null,scale:2})
  });

  if(!response.ok){
    let message=`Image renderer returned HTTP ${response.status}.`;
    try{
      const data=await response.json();
      if(data?.error) message=data.error;
      if(data?.detail) message+=` ${data.detail}`;
    }catch(_){
      try{const text=await response.text();if(text)message+=` ${text.slice(0,220)}`;}catch(__){}
    }
    throw new Error(message);
  }
  const blob=await response.blob();
  if(!blob||!blob.size)throw new Error("The image renderer returned an empty PNG.");
  return blob.type==="image/png"?blob:new Blob([blob],{type:"image/png"});
}

async function renderShareCardToPng(){
  const payload=makeExactSharePayload(state.mode==="trainer");
  return renderShareHtmlToPng(payload.html,"full",payload.width);
}



let adaptiveExportCache={key:null,mode:null,blob:null};

function adaptiveExportFilename(ext){
  const d=state.currentScenario||scenarioData();
  const dept=(d.department||"Seaweb").replace(/[^A-Za-z0-9]+/g,"-").replace(/^-|-$/g,"");
  const focus=(focusTitle(d)||"Scenario").replace(/[^A-Za-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,48);
  const view=state.mode==="trainer"?"Trainer":"Trainee";
  return `${dept}-${focus}-${view}.${ext}`;
}

async function cropAdaptiveExportBlob(blob){
  const img=await loadImageFromBlob(blob);
  const width=img.naturalWidth||img.width;
  const height=img.naturalHeight||img.height;
  const canvas=document.createElement("canvas");canvas.width=width;canvas.height=height;
  const ctx=canvas.getContext("2d",{willReadFrequently:true});ctx.drawImage(img,0,0);
  const data=ctx.getImageData(0,0,width,height).data;
  const sand=[235,231,223];
  const different=(x,y)=>{const i=(y*width+x)*4;return Math.abs(data[i]-sand[0])+Math.abs(data[i+1]-sand[1])+Math.abs(data[i+2]-sand[2])>22 && data[i+3]>220};
  let left=width-1,right=0,top=height-1,bottom=0,found=false;
  const step=2;
  for(let y=0;y<height;y+=step){
    for(let x=0;x<width;x+=step){
      if(different(x,y)){found=true;if(x<left)left=x;if(x>right)right=x;if(y<top)top=y;if(y>bottom)bottom=y;}
    }
  }
  if(!found)return blob;
  const pad=3;left=Math.max(0,left-pad);top=Math.max(0,top-pad);right=Math.min(width-1,right+pad);bottom=Math.min(height-1,bottom+pad);
  const w=Math.max(1,right-left+1),h=Math.max(1,bottom-top+1);
  const out=document.createElement("canvas");out.width=w;out.height=h;
  const octx=out.getContext("2d");octx.fillStyle="#ffffff";octx.fillRect(0,0,w,h);octx.drawImage(canvas,left,top,w,h,0,0,w,h);
  return await new Promise((resolve,reject)=>out.toBlob(b=>b?resolve(b):reject(new Error("Could not prepare the exact-view export.")),"image/png"));
}

async function getAdaptiveCurrentViewPng(){
  const key=`${currentSharePageCacheKey()}|exact-v1915`;
  const mode=state.mode;
  if(adaptiveExportCache.key===key && adaptiveExportCache.mode===mode && adaptiveExportCache.blob){
    return adaptiveExportCache.blob;
  }

  const payload=makeExactSharePayload(mode==="trainer");
  const rendered=await renderShareHtmlToPng(payload.html,"full",payload.width);
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
  return `${s.ship||"NCL ship"}${s.title?` • ${s.title}`:""}${s.sailingDate?` • ${formatSailingDate(s.sailingDate)}`:""}${s.departure?` • From ${s.departure}`:""}`;
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
  const sailText=s?`${s.duration?`${s.duration}-day `:""}${s.title||"cruise"} on ${s.ship||"Norwegian Cruise Line"}${s.departure?`, departing from ${s.departure}`:""}${s.sailingDate?` on ${formatSailingDate(s.sailingDate)}`:(s.sailingMonths?.length?` during ${s.sailingMonths.join(", ")}`:"")}`:"a trainer-selected Norwegian Cruise Line sailing";
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
  const focus=(focusTitle(d)||'Scenario').replace(/[^A-Za-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,48);
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


function interactiveScenarioFilename(mode="trainee"){
  const d=state.currentScenario||scenarioData();
  const dept=(d.department||"Seaweb").replace(/[^A-Za-z0-9]+/g,"-").replace(/^-|-$/g,"");
  const focus=(focusTitle(d)||"Scenario").replace(/[^A-Za-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,54);
  const type=isRoleplayScenario(d)||d.followUpRoleplay?"Roleplay":"Scenario";
  const view=mode==="trainer"?"Trainer":"Trainee";
  return `${dept}-${focus}-${type}-${view}-Interactive.html`;
}

async function currentGeneratorStylesForInteractiveShare(){
  try{
    const response=await fetch("/styles.css?v=1.9.34",{cache:"no-store"});
    if(response.ok)return await response.text();
  }catch(_){}
  return "";
}

function interactiveShareOverrides(){
  return `
:root{
  --interactive-sand:#EBE7DF;--interactive-white:#fff;--interactive-black:#101828;
  --interactive-mid:#475467;--interactive-border:#D0D5DD;--interactive-aqua:#A7CAC6;
  --interactive-teal:#00484F;--interactive-ocean:#006099;--interactive-blue:#0A84BD;
  --interactive-success:#147A5B;
}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body.interactive-share-page{
  margin:0!important;background:var(--interactive-sand)!important;color:var(--interactive-black)!important;
  font-family:Poppins,"Segoe UI",Arial,sans-serif!important;
}
.interactive-top-accent{height:10px;background:var(--interactive-aqua)}
.interactive-shell{max-width:1460px;margin:0 auto;padding:16px 22px 46px}
.interactive-brand{min-height:56px;display:flex;align-items:center;justify-content:space-between;gap:18px;margin-bottom:8px}
.interactive-brand img{height:39px;max-width:176px;object-fit:contain;object-position:left center}
.interactive-brand-fallback{font-weight:850;letter-spacing:.03em}
.interactive-brand-meta{text-align:right}
.interactive-brand-meta strong{display:block;font-size:14px}
.interactive-brand-meta span{display:block;color:var(--interactive-mid);font-size:12px;margin-top:1px}
.interactive-toolbar{
  position:sticky;top:0;z-index:50;display:flex;gap:9px;align-items:center;flex-wrap:wrap;
  padding:10px 0 12px;margin-bottom:8px;background:rgba(235,231,223,.96);
  backdrop-filter:blur(10px);border-bottom:1px solid rgba(167,202,198,.8)
}
.interactive-toolbar-spacer{flex:1}
.interactive-btn{
  border:1px solid var(--interactive-border);background:#fff;color:var(--interactive-black);
  border-radius:7px;padding:9px 13px;font-weight:750;font-size:13px;cursor:pointer
}
.interactive-btn:hover{border-color:var(--interactive-blue)}
.interactive-btn.primary{background:var(--interactive-blue);border-color:var(--interactive-blue);color:#fff}
.interactive-btn.teal{background:var(--interactive-teal);border-color:var(--interactive-teal);color:#fff}
.interactive-btn.danger{color:#B42318;background:transparent}
.interactive-save-note{font-size:11px;color:var(--interactive-mid)}
.interactive-header{margin:13px 0 14px}
.interactive-header h1{margin:7px 0 5px;font-size:32px;line-height:1.1;letter-spacing:-.02em}
.interactive-header p{margin:0;color:var(--interactive-mid);font-size:14px}
.interactive-progress-wrap{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;margin:13px 0 18px}
.interactive-progress-track{height:12px;border-radius:999px;background:#DCE4E5;overflow:hidden}
.interactive-progress-bar{height:100%;width:0;background:linear-gradient(90deg,var(--interactive-teal),var(--interactive-blue));transition:width .25s ease}
.interactive-progress-text{min-width:108px;text-align:right;color:var(--interactive-teal);font-size:13px;font-weight:850}
.interactive-layout{display:grid;grid-template-columns:235px minmax(0,1fr);gap:18px;align-items:start}
.interactive-nav{
  position:sticky;top:76px;max-height:calc(100vh - 98px);overflow:auto;background:#fff;
  border:1px solid var(--interactive-border);border-radius:10px;box-shadow:0 8px 25px rgba(16,24,40,.07)
}
.interactive-nav-title{padding:14px 14px 10px;font-weight:850;font-size:13px;border-bottom:1px solid #EAECF0}
.interactive-nav a{
  display:flex;gap:9px;align-items:flex-start;padding:10px 12px;border-bottom:1px solid #EAECF0;
  color:var(--interactive-black);text-decoration:none;font-size:12px
}
.interactive-nav a:hover{background:#F2F8F7}
.interactive-nav a.active{background:#F3F8FB;box-shadow:inset 4px 0 0 var(--interactive-blue)}
.interactive-nav a.done .interactive-nav-num{background:var(--interactive-success);color:#fff}
.interactive-nav-num{
  width:23px;height:23px;border-radius:50%;display:grid;place-items:center;flex:0 0 auto;
  background:#EAF4F6;color:var(--interactive-ocean);font-size:11px;font-weight:850
}
.interactive-main{min-width:0}
.interactive-scenario-wrap{background:transparent!important;padding:0!important;margin:0!important;max-width:none!important;border:0!important;box-shadow:none!important}
.interactive-step{
  position:relative;scroll-margin-top:90px;margin-bottom:16px!important;background:#fff!important;
  border:1px solid var(--interactive-border)!important;border-radius:10px!important;
  box-shadow:0 3px 14px rgba(16,24,40,.04)!important;padding:18px 20px!important
}
.interactive-stepbar{
  display:flex;align-items:center;justify-content:space-between;gap:12px;padding:0 0 10px;
  margin:0 0 12px;border-bottom:1px solid #EAECF0
}
.interactive-stepbar-label{color:var(--interactive-ocean);font-size:10px;font-weight:900;letter-spacing:.07em;text-transform:uppercase}
.interactive-complete-btn{
  border:1px solid var(--interactive-aqua);background:#EEF7F7;color:var(--interactive-teal);
  border-radius:7px;padding:7px 10px;font-size:12px;font-weight:850;cursor:pointer
}
.interactive-complete-btn.done{background:var(--interactive-success);border-color:var(--interactive-success);color:#fff}
.interactive-section-notes{margin-top:14px;padding-top:12px;border-top:1px dashed #D0D5DD}
.interactive-section-notes summary{cursor:pointer;color:var(--interactive-ocean);font-weight:800;font-size:12px}
.interactive-section-notes textarea{
  width:100%;min-height:80px;margin-top:9px;border:1px solid #98A2B3;border-radius:7px;
  padding:10px 11px;resize:vertical;font:inherit;color:var(--interactive-black);background:#fff
}
.interactive-task-input{width:18px;height:18px;accent-color:var(--interactive-teal);flex:0 0 auto;margin:1px 0 0}
.interactive-step .task-checklist li,.interactive-step .visual-check-list li{display:flex!important;align-items:flex-start!important;gap:9px!important}
.interactive-step .task-checklist .check-box{display:none!important}
.interactive-step li.interactive-task-done>span:last-child{color:#667085;text-decoration:line-through;text-decoration-thickness:1px}
.interactive-roleplay-banner{
  display:none;margin-bottom:14px;padding:12px 14px;border-left:5px solid var(--interactive-teal);
  background:#F2F8F7;border-radius:0 8px 8px 0
}
.interactive-roleplay-banner strong{display:block;margin-bottom:2px}
body.interactive-roleplay .interactive-roleplay-banner{display:block}
body.interactive-trainee .trainer-only,body.interactive-trainee .trainer-section{display:none!important}
body.interactive-trainer .trainer-only,body.interactive-trainer .trainer-section{display:block}
.interactive-share-page .scenario-main-title{font-size:30px!important;line-height:1.12!important;margin-bottom:6px!important}
.interactive-share-page .scenario-intro{font-size:14px!important;line-height:1.5!important}
.interactive-share-page .scenario-completion-box{
  margin:13px 0 16px!important;background:#F3F8FB!important;border-left:5px solid var(--interactive-blue)!important;border-radius:7px!important
}
.interactive-share-page .visual-section-heading{font-size:19px!important}
.interactive-share-page .section-label{font-weight:900!important;letter-spacing:.06em!important}
.interactive-share-page strong{font-weight:800}
.interactive-bottom-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px}
@media(max-width:1000px){
  .interactive-layout{grid-template-columns:1fr}.interactive-nav{display:none}.interactive-shell{padding:13px}
}
@media(max-width:700px){
  .interactive-header h1{font-size:26px}.interactive-brand-meta{display:none}.interactive-toolbar{position:relative}.interactive-step{padding:15px!important}
}
@media print{
  @page{
    size:letter portrait;
    margin:.42in .42in .48in;
  }

  html,body{
    width:auto!important;
    min-width:0!important;
    height:auto!important;
    overflow:visible!important;
  }

  body.interactive-share-page{
    background:#fff!important;
    color:#101828!important;
    -webkit-print-color-adjust:exact;
    print-color-adjust:exact;
  }

  /* Keep the PDF visually consistent with the interactive scenario. */
  .interactive-top-accent{
    display:block!important;
    height:7px!important;
    margin:0 0 8px!important;
    background:var(--interactive-aqua)!important;
  }
  .interactive-toolbar,
  .interactive-nav,
  .interactive-save-note,
  .interactive-bottom-actions{
    display:none!important;
  }

  .interactive-shell{
    width:100%!important;
    max-width:none!important;
    min-width:0!important;
    margin:0!important;
    padding:0!important;
  }

  .interactive-brand{
    display:flex!important;
    min-height:34px!important;
    margin:0 0 8px!important;
    break-after:avoid-page;
    page-break-after:avoid;
  }
  .interactive-brand img{
    height:28px!important;
    max-width:142px!important;
  }
  .interactive-brand-meta strong{font-size:10px!important}
  .interactive-brand-meta span{font-size:8px!important}

  .interactive-header{
    margin:7px 0 8px!important;
    break-after:avoid-page;
    page-break-after:avoid;
  }
  .interactive-header h1{
    margin:0 0 4px!important;
    font-size:19px!important;
    line-height:1.16!important;
    letter-spacing:-.01em!important;
  }
  .interactive-header p{
    margin:0!important;
    font-size:9.5px!important;
    line-height:1.4!important;
  }

  .interactive-roleplay-banner{
    margin:7px 0 9px!important;
    padding:8px 10px!important;
    font-size:9px!important;
    break-inside:avoid!important;
    page-break-inside:avoid!important;
  }

  .interactive-progress-wrap{
    display:grid!important;
    grid-template-columns:1fr auto!important;
    gap:8px!important;
    margin:6px 0 10px!important;
    break-after:avoid-page;
    page-break-after:avoid;
  }
  .interactive-progress-track{height:7px!important}
  .interactive-progress-text{
    min-width:68px!important;
    font-size:8.5px!important;
  }

  .interactive-layout,
  .interactive-main,
  .interactive-scenario-wrap{
    display:block!important;
    width:100%!important;
    max-width:none!important;
    min-width:0!important;
    margin:0!important;
    padding:0!important;
    overflow:visible!important;
  }

  /* Allow long steps to flow across pages rather than leaving large blank areas. */
  .interactive-step,
  .interactive-scenario-wrap .scenario-section,
  .interactive-scenario-wrap .trainer-section{
    width:100%!important;
    max-width:100%!important;
    min-width:0!important;
    box-sizing:border-box!important;
    margin:0 0 9px!important;
    padding:11px 12px!important;
    border:1px solid #D0D5DD!important;
    border-radius:8px!important;
    box-shadow:none!important;
    background:#fff!important;
    break-inside:auto!important;
    page-break-inside:auto!important;
    overflow:visible!important;
  }

  /* Keep the Step header from the interactive view. */
  .interactive-stepbar{
    display:flex!important;
    align-items:center!important;
    justify-content:space-between!important;
    gap:8px!important;
    margin:0 0 7px!important;
    padding:0 0 6px!important;
    border-bottom:1px solid #EAECF0!important;
    break-after:avoid-page;
    page-break-after:avoid;
  }
  .interactive-stepbar-label{
    font-size:7.5px!important;
    line-height:1.2!important;
  }
  .interactive-complete-btn{
    display:none!important;
  }

  /* Keep individual cards / callouts together where practical. */
  .interactive-step .scenario-detail-grid>div,
  .interactive-step .scenario-guest-card,
  .interactive-step .roleplay-role-card,
  .interactive-step .multi-res-card,
  .interactive-step .followup-change-card,
  .interactive-step .training-card-box,
  .interactive-step .scenario-payment-card,
  .interactive-step .instruction-strip,
  .interactive-step .critical-callout,
  .interactive-step .authorized-comment-box,
  .interactive-step blockquote{
    break-inside:avoid!important;
    page-break-inside:avoid!important;
  }

  /* Portrait-friendly layout while preserving the same card organization. */
  .interactive-share-page .scenario-detail-grid,
  .interactive-share-page .scenario-guest-grid,
  .interactive-share-page .trainer-info-grid,
  .interactive-share-page .roleplay-role-grid,
  .interactive-share-page .multi-res-grid,
  .interactive-share-page .gdpr-grid,
  .interactive-share-page .followup-change-card-list{
    grid-template-columns:repeat(2,minmax(0,1fr))!important;
    gap:7px!important;
  }

  .interactive-share-page .scenario-main-title{
    margin:0 0 5px!important;
    font-size:18px!important;
    line-height:1.2!important;
    break-after:avoid-page;
    page-break-after:avoid;
  }
  .interactive-share-page .scenario-intro{
    margin:0 0 8px!important;
    font-size:9.5px!important;
    line-height:1.45!important;
  }
  .interactive-share-page .scenario-meta-row{
    gap:4px!important;
    margin:0 0 6px!important;
  }
  .interactive-share-page .scenario-meta-row .chip{
    font-size:7px!important;
    padding:3px 5px!important;
  }
  .interactive-share-page .scenario-completion-box{
    margin:7px 0 9px!important;
    padding:7px 9px!important;
    border-left-width:4px!important;
    break-inside:avoid!important;
    page-break-inside:avoid!important;
  }
  .interactive-share-page .scenario-completion-box strong{font-size:8.5px!important}
  .interactive-share-page .scenario-completion-box span{font-size:8px!important}

  .interactive-share-page .visual-section-heading{
    margin:0 0 6px!important;
    font-size:13px!important;
    line-height:1.25!important;
    break-after:avoid-page;
    page-break-after:avoid;
  }
  .interactive-share-page .scenario-icon{
    width:20px!important;
    height:20px!important;
    flex-basis:20px!important;
    font-size:15px!important;
  }
  .interactive-share-page .section-label{
    font-size:7px!important;
    line-height:1.15!important;
  }

  .interactive-share-page p,
  .interactive-share-page li{
    font-size:9px!important;
    line-height:1.42!important;
    orphans:2;
    widows:2;
  }
  .interactive-share-page small{
    font-size:7.7px!important;
    line-height:1.35!important;
  }

  .interactive-share-page .scenario-detail-grid>div,
  .interactive-share-page .scenario-guest-card,
  .interactive-share-page .roleplay-role-card,
  .interactive-share-page .multi-res-card,
  .interactive-share-page .followup-change-card{
    padding:7px 8px!important;
  }
  .interactive-share-page .scenario-detail-grid span,
  .interactive-share-page .scenario-guest-card>span{
    font-size:6.8px!important;
  }
  .interactive-share-page .scenario-detail-grid strong,
  .interactive-share-page .scenario-guest-card>strong{
    font-size:9px!important;
    line-height:1.35!important;
  }

  .interactive-task-input{
    width:13px!important;
    height:13px!important;
    margin-top:1px!important;
  }
  .interactive-step .task-checklist,
  .interactive-step .visual-check-list{
    gap:3px!important;
  }
  .interactive-step .task-checklist li,
  .interactive-step .visual-check-list li{
    gap:6px!important;
    margin:0!important;
  }

  /* Empty notes disappear from the PDF; completed notes print with the scenario. */
  .interactive-section-notes{
    display:none!important;
  }
  .interactive-section-notes.interactive-print-has-content{
    display:block!important;
    margin-top:8px!important;
    padding-top:7px!important;
    border-top:1px dashed #D0D5DD!important;
  }
  .interactive-section-notes.interactive-print-has-content summary{
    display:none!important;
  }
  .interactive-section-notes.interactive-print-has-content textarea{
    display:block!important;
    width:100%!important;
    min-height:42px!important;
    padding:6px 7px!important;
    border:1px solid #D0D5DD!important;
    border-radius:5px!important;
    background:#fff!important;
    font-size:8px!important;
    line-height:1.35!important;
    overflow:visible!important;
    resize:none!important;
  }

  body.interactive-trainee .trainer-only,
  body.interactive-trainee .trainer-section{
    display:none!important;
  }

  /* Constrain inherited Generator content to the portrait printable width. */
  .interactive-share-page table,
  .interactive-share-page img,
  .interactive-share-page svg,
  .interactive-share-page .scenario-paper,
  .interactive-share-page .scenario-section,
  .interactive-share-page .trainer-section{
    max-width:100%!important;
  }
  .interactive-share-page table{
    width:100%!important;
    table-layout:auto!important;
  }
}
`;
}

function interactiveStandaloneClient(config){
  const STORAGE_KEY=config.storageKey;
  const title=config.title;
  const viewLabel=config.viewLabel;
  const state={completed:{},fields:{}};
  const $=(sel,root=document)=>root.querySelector(sel);
  const $$=(sel,root=document)=>Array.from(root.querySelectorAll(sel));
  const safeText=value=>String(value||"").replace(/\s+/g," ").trim();

  function loadState(){
    try{
      const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||"{}");
      if(saved&&typeof saved==="object"){
        state.completed=saved.completed||{};
        state.fields=saved.fields||{};
      }
    }catch(_){}
  }
  function persist(){
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch(_){}
    const status=$("#interactiveSaveStatus");
    if(status){
      status.textContent="Saved just now";
      clearTimeout(persist._t);
      persist._t=setTimeout(()=>status.textContent="Progress saves automatically on this device.",1400);
    }
  }

  const content=$("#interactiveScenarioContent");
  const rawSections=$$(".scenario-section, .trainer-section",content).filter(el=>el.parentElement===content);
  const visibleSections=rawSections.filter(el=>getComputedStyle(el).display!=="none");

  visibleSections.forEach((section,index)=>{
    const id=`interactive-step-${index+1}`;
    section.id=id;
    section.classList.add("interactive-step");
    const label=section.querySelector(".section-label")?.textContent
      ||section.querySelector(".trainer-kicker")?.textContent
      ||`STEP ${index+1}`;
    const heading=section.querySelector(".visual-section-heading")?.textContent
      ||section.querySelector("h3")?.textContent
      ||label;

    const bar=document.createElement("div");
    bar.className="interactive-stepbar";
    bar.innerHTML=`<span class="interactive-stepbar-label">STEP ${index+1} • ${safeText(label)}</span><button type="button" class="interactive-complete-btn" data-step="${id}">Mark Complete</button>`;
    section.insertBefore(bar,section.firstChild);

    const notes=document.createElement("details");
    notes.className="interactive-section-notes";
    notes.innerHTML=`<summary>Notes / answers for this section</summary><textarea data-interactive-save="${id}-notes" placeholder="Write notes, answers, reservation details, or coaching reminders here..."></textarea>`;
    section.appendChild(notes);

    const nav=document.createElement("a");
    nav.href=`#${id}`;
    nav.dataset.step=id;
    nav.innerHTML=`<span class="interactive-nav-num">${index+1}</span><span>${safeText(heading)}</span>`;
    $("#interactiveNav").appendChild(nav);
  });

  $$(".task-checklist li, .visual-check-list li",content).forEach((li,index)=>{
    const oldBox=li.querySelector(".check-box");
    if(oldBox)oldBox.remove();
    const input=document.createElement("input");
    input.type="checkbox";
    input.className="interactive-task-input";
    input.dataset.interactiveSave=`task-${index}`;
    li.insertBefore(input,li.firstChild);
    input.addEventListener("change",()=>{
      li.classList.toggle("interactive-task-done",input.checked);
      saveFields();
    });
  });

  function saveFields(){
    $$("[data-interactive-save]").forEach(el=>{
      const key=el.dataset.interactiveSave;
      state.fields[key]=el.type==="checkbox"?el.checked:el.value;
    });
    persist();
  }
  function restoreFields(){
    $$("[data-interactive-save]").forEach(el=>{
      const key=el.dataset.interactiveSave;
      if(!(key in state.fields))return;
      if(el.type==="checkbox")el.checked=!!state.fields[key];
      else el.value=state.fields[key]??"";
      const li=el.closest("li");
      if(li&&el.type==="checkbox")li.classList.toggle("interactive-task-done",el.checked);
    });
  }
  function renderCompleted(){
    $$(".interactive-complete-btn").forEach(btn=>{
      const done=!!state.completed[btn.dataset.step];
      btn.classList.toggle("done",done);
      btn.textContent=done?"Completed ✓":"Mark Complete";
      const nav=$(`#interactiveNav a[data-step="${btn.dataset.step}"]`);
      if(nav)nav.classList.toggle("done",done);
    });
  }
  function updateProgress(){
    const buttons=$$(".interactive-complete-btn");
    const done=buttons.filter(btn=>state.completed[btn.dataset.step]).length;
    const pct=buttons.length?Math.round(done/buttons.length*100):0;
    $("#interactiveProgressBar").style.width=pct+"%";
    $("#interactiveProgressText").textContent=`${pct}% complete`;
  }

  $$(".interactive-complete-btn").forEach(btn=>{
    btn.addEventListener("click",()=>{
      const key=btn.dataset.step;
      state.completed[key]=!state.completed[key];
      renderCompleted();updateProgress();persist();
      if(state.completed[key]){
        const buttons=$$(".interactive-complete-btn");
        const idx=buttons.indexOf(btn);
        const next=buttons[idx+1]?.closest(".interactive-step");
        if(next)setTimeout(()=>next.scrollIntoView({behavior:"smooth",block:"start"}),160);
      }
    });
  });
  $$("[data-interactive-save]").forEach(el=>el.addEventListener(el.type==="checkbox"?"change":"input",saveFields));

  function buildSummary(){
    const lines=[title,viewLabel,"",`Progress: ${$("#interactiveProgressText").textContent}`,""];
    visibleSections.forEach((section,index)=>{
      const heading=safeText(section.querySelector(".visual-section-heading")?.textContent||section.querySelector("h3")?.textContent||`Step ${index+1}`);
      const done=!!state.completed[section.id];
      const notes=section.querySelector(".interactive-section-notes textarea")?.value?.trim()||"";
      const tasks=$$(".interactive-task-input",section);
      const checked=tasks.filter(x=>x.checked).length;
      lines.push(`${done?"✓":"○"} ${index+1}. ${heading}`);
      if(tasks.length)lines.push(`   Checklist: ${checked}/${tasks.length}`);
      if(notes)lines.push(`   Notes: ${notes}`);
      lines.push("");
    });
    return lines.join("\n");
  }
  async function copySummary(){
    const text=buildSummary();
    try{
      await navigator.clipboard.writeText(text);
      alert("Progress summary copied.");
    }catch(_){
      const ta=document.createElement("textarea");
      ta.value=text;document.body.appendChild(ta);ta.select();
      document.execCommand("copy");ta.remove();
      alert("Progress summary copied.");
    }
  }

  $("#interactivePrintBtn").addEventListener("click",()=>window.print());
  $("#interactiveBottomPrintBtn").addEventListener("click",()=>window.print());
  $("#interactiveCopyBtn").addEventListener("click",copySummary);
  $("#interactiveBottomCopyBtn").addEventListener("click",copySummary);
  $("#interactiveNotesBtn").addEventListener("click",()=>{
    const notes=$$(".interactive-section-notes");
    const openSome=notes.some(x=>!x.open);
    notes.forEach(x=>x.open=openSome);
    $("#interactiveNotesBtn").textContent=openSome?"Close All Notes":"Open All Notes";
  });
  $("#interactiveResetBtn").addEventListener("click",()=>{
    if(!confirm("Reset this interactive worksheet? All saved progress and notes on this device will be cleared."))return;
    try{localStorage.removeItem(STORAGE_KEY);}catch(_){}
    location.reload();
  });

  if("IntersectionObserver" in window){
    const observer=new IntersectionObserver(entries=>{
      const hit=entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
      if(!hit)return;
      $$("#interactiveNav a").forEach(a=>a.classList.toggle("active",a.dataset.step===hit.target.id));
    },{rootMargin:"-90px 0px -60% 0px",threshold:[0,.15,.4]});
    visibleSections.forEach(section=>observer.observe(section));
  }

  function prepareInteractivePrint(){
    $$(".interactive-section-notes").forEach(details=>{
      const textarea=details.querySelector("textarea");
      const hasText=!!textarea?.value?.trim();
      details.classList.toggle("interactive-print-has-content",hasText);
      if(hasText)details.open=true;
    });
  }
  function cleanupInteractivePrint(){
    $$(".interactive-section-notes").forEach(details=>{
      details.classList.remove("interactive-print-has-content");
    });
  }
  window.addEventListener("beforeprint",prepareInteractivePrint);
  window.addEventListener("afterprint",cleanupInteractivePrint);

  loadState();restoreFields();renderCompleted();updateProgress();
}

async function buildInteractiveScenarioDocument(mode="trainee"){
  if(!ensureScenarioReady())return "";
  const d=state.currentScenario;
  const roleplay=!!(isRoleplayScenario(d)||d.followUpRoleplay);
  const scenarioHtml=d.html||$("scenarioOutput").innerHTML;
  const generatorCss=await currentGeneratorStylesForInteractiveShare();
  const title=`${roleplay?"SEAweb Interactive Roleplay":"SEAweb Interactive Practice Scenario"} – ${focusTitle(d)}`;
  const storageId=(d.id||`${d.department}-${focusTitle(d)}`).replace(/[^A-Za-z0-9_-]+/g,"-");
  const viewLabel=mode==="trainer"?"Trainer View":"Trainee View";
  const bodyClass=`interactive-share-page interactive-${mode}${roleplay?" interactive-roleplay":""}`;
  const clientScript=`(${interactiveStandaloneClient.toString()})(${JSON.stringify({
    storageKey:`seawebInteractive-${storageId}-${mode}`,
    title,
    viewLabel
  })});`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
${generatorCss}
${interactiveShareOverrides()}
</style>
</head>
<body class="${bodyClass}">
<div class="interactive-top-accent"></div>
<div class="interactive-shell">
  <header class="interactive-brand">
    <div>${INTERACTIVE_SHARE_LOGO_DATA?`<img src="${INTERACTIVE_SHARE_LOGO_DATA}" alt="Norwegian Cruise Line">`:`<div class="interactive-brand-fallback">NORWEGIAN CRUISE LINE</div>`}</div>
    <div class="interactive-brand-meta"><strong>${roleplay?"SEAweb INTERACTIVE ROLEPLAY":"SEAweb INTERACTIVE SCENARIO"}</strong><span>${escapeHtml(d.department)} • ${escapeHtml(viewLabel)}</span></div>
  </header>

  <div class="interactive-toolbar">
    <button class="interactive-btn teal" id="interactivePrintBtn">Print / Save PDF (Portrait)</button>
    <button class="interactive-btn" id="interactiveCopyBtn">Copy Progress Summary</button>
    <button class="interactive-btn" id="interactiveNotesBtn">Open All Notes</button>
    <span class="interactive-toolbar-spacer"></span>
    <span class="interactive-save-note" id="interactiveSaveStatus">Progress saves automatically on this device.</span>
    <button class="interactive-btn danger" id="interactiveResetBtn">Reset Worksheet</button>
  </div>

  <section class="interactive-header">
    <h1>${escapeHtml(title)}</h1>
    <p>Follow the scenario step by step. Complete the interactive checklists, mark each section complete, and use the notes areas as you work.</p>
  </section>

  <div class="interactive-roleplay-banner"><strong>🎭 Partner Roleplay</strong><span>Use the role assignments and caller information in the scenario. Let the Cruise Specialist control the call naturally, then switch roles when instructed.</span></div>

  <div class="interactive-progress-wrap">
    <div class="interactive-progress-track"><div class="interactive-progress-bar" id="interactiveProgressBar"></div></div>
    <div class="interactive-progress-text" id="interactiveProgressText">0% complete</div>
  </div>

  <div class="interactive-layout">
    <nav class="interactive-nav" id="interactiveNav"><div class="interactive-nav-title">Scenario Progress</div></nav>
    <main class="interactive-main">
      <article id="interactiveScenarioContent" class="interactive-scenario-wrap scenario-paper">${scenarioHtml}</article>
      <div class="interactive-bottom-actions">
        <button class="interactive-btn teal" id="interactiveBottomPrintBtn">Print / Save PDF (Portrait)</button>
        <button class="interactive-btn primary" id="interactiveBottomCopyBtn">Copy Progress Summary</button>
      </div>
    </main>
  </div>
</div>
<script>${clientScript.replace(/<\/script/gi,"<\\/script")}</script>
</body>
</html>`;
}

async function downloadInteractiveScenario(mode="trainee"){
  if(!ensureScenarioReady())return;
  const btn=mode==="trainer"?$("downloadInteractiveTrainerBtn"):$("downloadInteractiveTraineeBtn");
  const old=btn?.innerHTML||"";
  if(btn){
    btn.disabled=true;
    btn.innerHTML=`<span class="share-menu-icon">…</span><span><strong>Building Interactive HTML…</strong><small>Creating a self-contained guided worksheet</small></span>`;
  }
  try{
    const html=await buildInteractiveScenarioDocument(mode);
    if(!html)throw new Error("The interactive scenario could not be generated.");
    const blob=new Blob([html],{type:"text/html;charset=utf-8"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;
    a.download=interactiveScenarioFilename(mode);
    document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),2500);
    closeShareMenu();
    flash(`${mode==="trainer"?"Trainer":"Trainee"} interactive scenario downloaded.`);
  }catch(err){
    alert(`Could not create the interactive scenario: ${err.message}`);
  }finally{
    if(btn){btn.disabled=false;btn.innerHTML=old;}
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
$("downloadInteractiveTraineeBtn").onclick=()=>downloadInteractiveScenario("trainee");
$("downloadInteractiveTrainerBtn").onclick=()=>downloadInteractiveScenario("trainer");
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
    return !q||JSON.stringify([x.title,x.type,x.focuses,x.department,x.reservationWorkflow,x.newCallerType,x.modificationType,x.airProgram,x.airTripType,x.difficulty,x.sailing?.ship,x.sailing?.title]).toLowerCase().includes(q);
  });
  $("libraryList").innerHTML=items.length?items.map(x=>`
    <div class="result-card ${x.archived?"archived":""}">
      <div style="display:flex;justify-content:space-between;gap:12px">
        <div>
          <div class="meta"><span class="chip">${escapeHtml(x.department||"Legacy")}</span>${(x.focuses||[x.type]).filter(Boolean).slice(0,3).map(f=>`<span class="chip">${escapeHtml(f)}</span>`).join("")}<span class="chip">${escapeHtml(x.difficulty)}</span><span class="status-badge ${x.validationStatus==="Ready"?"ready":"review"}">${escapeHtml(x.validationStatus||"Draft")}</span></div>
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
  updateScenarioFocus(x.type,String(x.trainingDay||6),x.focuses||[x.type].filter(Boolean));
  $("reservationWorkflow").value=x.reservationWorkflow||((x.curriculumKind==="followup")?"modify":"new");
  $("newCallerType").value=x.newCallerType||(
    String(x.agency)==="7"?"direct_ca":(["5",""].includes(String(x.agency||""))?"direct_us":"travel_agent")
  );
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
  $("couponToggle").checked=!!x.couponEnabled || !!(x.coupons&&x.coupons.length);
  setCouponRows(x.coupons||[]);
  refreshCouponPanel();
  $("fasToggle").checked=!!x.fas;$("travelToggle").checked=!!x.travel;$("pscToggle").checked=!!x.psc;
  $("airToggle").checked=!!x.airEnabled;
  $("airProgram").value=x.airProgram||"";
  $("airTripType").value=x.airTripType||"round_trip";
  $("airOneWayDirection").value=x.airOneWayDirection||"to_cruise";
  $("airGateway").value=x.airGateway||"";
  updateAirProgramPreview();
  $("trainerNotes").value=x.trainerNotes||"";
  if(x.cardProfile && trainingCards[x.cardProfile])$("trainingCardProfile").value=x.cardProfile;
  renderTrainingCard();
  if(x.card){
    $("trainingCardNumber").value=x.card.number||"";
    $("trainingCardExpiration").value=x.card.expiration||"";
    $("trainingCardCcv").value=x.card.ccv||"";
    $("trainingCardAddress").value=x.card.address||"";
  }
  syncAgencyCallerLogic();
  renderSelectedSailing();$("scenarioOutput").innerHTML=x.html||"";runValidator();updateRoleplayScenarioButton();updateFollowUpRoleplayButton();go("generator");
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

populateMarketAgencies();populateTrainingCards();updateDepartmentUI();renderStarters();renderSelectedSailing();updateStats();initSearchDates();updateAnchorUI();refreshLatitudesPanel();updateFollowUpRoleplayButton();
