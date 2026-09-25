# Seaweb Scenario Generator

## V1.8 – Teams attachment sharing + Latitudes numbers

### Teams sharing
- **Download PNG for Teams** creates a trainee-only PNG file. Attach the downloaded PNG in Teams rather than pasting it inline. This gives recipients a file attachment they can select/open for a larger preview.
- **Copy as Image** remains available for quick inline pasting.
- **Copy Editable** and **Copy Plain Text** remain available.
- Trainer-only content is excluded from all share-card outputs.

### Latitudes numbers
- When **Past Guests / Latitudes** is selected, a Latitudes entry panel appears in the Scenario Generator.
- One training Latitudes-number field is created for each selected guest (1–8).
- Entered Latitudes numbers are saved with the scenario, restored from the Saved Scenario Library, included in the trainee scenario, and included in exported JSON.
- The validator warns if Past Guests / Latitudes is selected but no Latitudes number has been entered.


## V1.8.1 – Teams-optimized page set

The original full-scenario PNG is intentionally retained, but Teams scales very tall images to fit the viewer, which makes text look small even after the image is opened. V1.8.1 adds **Download Teams Page Set**. It automatically splits the trainee scenario into 3–4 logical, higher-resolution PNG pages and packages them into one ZIP file. After extracting the ZIP, attach the PNGs together in Teams. Each page has a much shorter aspect ratio and larger type so it opens at a readable size with much less zooming.

Page groups are: Guest Scenario & Request; Tasks & Call Flow; Reservation Reference; Final Check & Knowledge Review. Trainer-only content remains excluded.


## V1.8.3 – One-upload sharing bundle with PDF

This release combines the sharing reliability hotfix with a new **Download PDF** option, so everything can be uploaded in one pass.

### What changed
- Added **Download PDF** to the Share Card menu.
- Reworked **Download Teams Page Set** so it uses a single server render and then splits that result locally into multiple page images. This avoids the Cloudflare Browser Run rate-limit issue caused by multiple back-to-back renders.
- Kept the stable **Copy as Image** and **Download Full PNG** behavior from the last working sharing build.
- Preserved the new **Latitudes / past guest number** fields and scenario output.

### Recommended sharing order
1. **Download PDF** – best for Teams, email, printing, and zooming.
2. **Download Teams Page Set** – best when you want image-by-image review in Teams chat.
3. **Download Full PNG** – best when you specifically want one long image.


## V1.8.4 – Teams / PDF Cutoff Fix

This hotfix fixes the cut-off pages seen in the Teams Page Set and PDF export.

### What changed
- Page splitting now follows **server-rendered separator markers** instead of guessing crop dimensions from the local browser.
- The full width of each rendered page is preserved, so left/right content is no longer clipped.
- Page boundaries are detected from the actual final screenshot, so vertical sections are no longer cut between pages.
- Teams page images use larger typography for easier reading.
- PDF pages automatically choose **portrait or landscape** orientation per page to maximize readability.
- Teams Page Set and PDF reuse the same cached rendered pages during the current scenario, reducing Cloudflare Browser Run requests and helping avoid rate-limit errors.
- Copy as Image and Download Full PNG remain unchanged.


## V1.8.5 – Teams / PDF Runtime Fix

Restores the missing `makeTeamsPageClones()` function that was accidentally removed in V1.8.4. The V1.8.4 full-width and page-boundary fixes remain in place. This resolves the `makeTeamsPageClones is not defined` error for both **Download Teams Page Set** and **Download PDF**.


## V1.8.6 – Share Export Dependency Fix

This hotfix restores all helper functions required by the Teams Page Set and PDF workflows: ZIP creation, filename generation, byte concatenation, and CRC handling. The cutoff/cropping fixes from V1.8.4/V1.8.5 remain in place.


## V1.8.7 – Unified 8.5 x 11 export layout

This update rebuilds the PDF and PNG exports so they use the same page design. Both exports now render from one shared letter-size layout that is styled to look much closer to the scenario card shown in the generator.

### What changed
- **PDF and PNG now use the same 8.5 x 11 page layout**.
- **Download Teams Page Set** has been reframed as a **PNG page set**: each page is a letter-size PNG.
- Each page is rendered as a fixed portrait sheet, so the export fills the page instead of appearing as a long or inconsistently cropped image.
- The export styling was adjusted to more closely match the in-generator scenario view.
- The PDF now embeds those same portrait page images, so the PDF and PNG versions look nearly identical.


## V1.8.9 – full-page legal export + true mixed guest status
- Corrects the hybrid deployment where the Worker was newer than the public app files.
- Uses **two 8.5 x 14 legal pages for normal scenarios** instead of four lightly filled pages.
- Removes the outer page border and redistributes content to use the page area more efficiently.
- Renders exports at approximately **240 pixels per inch** for sharper PNG and PDF output.
- Adds explicit **Past Guest / New Guest radio choices for each guest**. Only Past Guests display or require a Latitudes number.
- Saves/restores per-guest status in the scenario library and includes it in trainee output and validation.


## V1.9.0 – One-Page Trainee Export

V1.9.0 adds two export styles instead of forcing every trainee scenario into the same multi-page layout.

### Recommended trainee export
- **One-Page Trainee PDF** — one 8.5 × 14 legal-size page designed for Teams, email, printing, and classroom use.
- **One-Page Trainee PNG** — the same layout as the PDF in a single image.
- The one-page layout keeps the customer scenario, At a Glance, Past/New Guest status, required tasks, key booking details, compact call-flow guidance, required training payment data, and the final call check.
- Trainer-only coaching and the expanded knowledge review remain out of the one-page handout.

### Full-detail export
- **Full Detail PDF** and **Full Detail PNG Page Set** preserve the expanded trainee version when the trainer wants every reference section included.

The mixed Past Guest / New Guest controls and per-guest Latitudes behavior from V1.8.9 are preserved.


## V1.9.1 – Adaptive Full-Space Export

The fixed 8.5 × 14 export has been replaced with an **adaptive content-fit export**.

- The PDF page height now follows the actual rendered scenario content.
- The PNG is cropped to the exact scenario bounds.
- No forced legal/letter height means there is no large blank bottom area.
- Export follows the active **Trainer View** or **Trainee View**.
- Trainer View includes the Trainer Guide and uses a compact two-column coaching layout to reduce unnecessary height.
- Trainee View automatically excludes trainer-only content.
- The Share Card menu is simplified to **Download Current View PDF**, **Download Current View PNG**, and current-view copy options.
- The export keeps a normal 8.5-inch PDF width while allowing the height to expand or contract to the content.


## V1.9.2 – Generator Layout + Tight Export Fix

This hotfix addresses two regressions introduced in V1.9.1:

- Restores the generated scenario to the **right-hand preview panel beneath the Share / Print / Save toolbar**.
- Restores compact toolbar spacing so Share Card, Print and Save stay grouped together.
- Replaces fixed viewport cropping with **actual rendered-card boundary detection**. The PNG and PDF now crop at the true bottom of the Trainer/Trainee scenario instead of retaining unused Browser Run viewport space.
- Both Trainer and Trainee exports use the same tight content-fit behavior.


## V1.9.3 – Full Focus List, Reservation Workflow, and View Printing

- Removed the visible **Training Day** dropdown. Training day is now assigned automatically from the selected curriculum focus.
- **Scenario Focus** now shows the full department curriculum in one grouped list, organized by Day 6–11.
- Added **Reservation Workflow** with:
  - Create New Reservation
  - Modify Existing Reservation
- The selected workflow changes the customer story, trainee task list, call-flow support, expected completion state, reference details, and validator output.
- Saved scenarios preserve the selected workflow.
- Added **Print Trainee View** and **Print Trainer View** inside Share Card.
- The top Print button continues to print whichever view is currently active.


## V1.9.4 – Modification Workflows + Focus Dropdown

- Scenario Focus is a standard dropdown again.
- Curriculum day remains internal for support logic, but is no longer displayed in the focus dropdown, scenario card, exports, filenames, library cards, or validator summary.
- Existing-reservation scenarios now use a dedicated **Existing Reservation Modification** panel instead of requiring full sailing / new-booking details.
- Modification types include:
  - Add / Update Special Request
  - Change / Upgrade Stateroom
  - Add Guest
  - Remove Guest
  - Add / Remove Free at Sea
  - Add / Remove Travel Protection
  - Add Prepaid Service Charges
  - Make / Update Payment
  - Apply FCC / CruiseNext / Coupon
  - Add / Change Air or Transfers
  - Add / Change Hotel or Cruisetour
  - Cancel / Reinstate Reservation
  - General Reservation Update
- Modify scenarios ask for the prior training reservation number, modification target, and requested change.
- When adding a guest, the trainer can specify New Guest or Past Guest and provide a Latitudes number only when needed.
- Sailing, stateroom preference, guest-count, and general guest-status controls are hidden when they are irrelevant to the selected modification.
- Generated modification scenarios use a simplified at-a-glance brief, modification-specific task list, and compact reservation-reference section.


## V1.9.5 – Guest Services GDPR + PCC / Direct Group Routing

For **Guest Services modifications of an existing reservation**, GDPR verification is now always part of the scenario.

### Caller / reservation types
- Direct Guest
- Travel Agent
- Travel Agency Guest
- TA Group
- Friends & Family / Team Member
- Casino Guest
- PCC Guest
- Direct Group
- Charter / Sixthman

The generator displays the applicable verification items from the provided GDPR job aids. Reservation Number is treated as mandatory.

### Travel Agent / TA Group handling
If the Travel Agent cannot provide the agency-identification item but can provide three pieces from the remaining verification items, the scenario instructs the trainee to service the interaction as a Travel Agency Guest.

### PCC Guest handling
- Shore Excursions may be serviced.
- For other servicing requests, advise the guest that they have a PCC and attempt transfer.
- If the PCC is unavailable or the guest refuses transfer, reservation requests may be serviced except cancellation.
- For cancellation, advise the guest to contact the PCC directly. If the guest says they already attempted contact and/or refuses transfer, follow standard cancellation procedures and document the reservation.

### Direct Group handling
The scenario requires transfer to the PCC listed on the reservation or the Direct Groups SOT Pilot:
- Direct Groups SOT / Direct Canadian Groups (CAD): **#11185**
- LATAM Direct Groups / Miami Outbound Direct Groups / Remote Outbound PCC Groups / Sawgrass Outbound Direct Groups: **#11195**

The GDPR requirement appears in the generator preview, trainee task list, scenario output, validator, exports, and saved scenarios.


## V1.9.6 – GDPR Ask-First Verification Logic

The GDPR workflow now follows the order shown in the provided job aids:

- Items shown as primary verification items must be **asked first**.
- **Reservation Number is always mandatory**.
- If one of the other primary verification items cannot be obtained, use the additional / fallback verification questions until the required verification threshold is met.
- For **Travel Agent / TA Group** callers, the agency identifier — **ABTA #, Agency ID, or Phone #** — is required to continue under the Travel Agent verification path.
- If a Travel Agent cannot provide the agency identifier, the scenario directs the trainee to use the **Travel Agency Guest** path once 3 pieces are obtained from:
  - Guest Full Name
  - Ship & Full Sail Date
  - Date of Birth
  - First Line of Address

The generator and exported scenario now visually separate:
1. **ASK FIRST** verification items
2. **IF NEEDED — ADDITIONAL VERIFICATION** items

Mandatory items are clearly labeled.


## V1.9.7 – Trainer Instructions, New Scenario Reset, and Editable Payment

### Start New Scenario
Scenario Generator now includes **Start New Scenario**. It clears:
- current generated scenario
- selected sailing
- guest names and Latitudes selections
- existing reservation / modification details
- GDPR selections
- pricing, confirmation email and trainer notes
- task checkboxes
- payment action and edited training-card information
- validator results

The trainer returns to a clean draft and chooses a new Scenario Focus before generating.

### Trainer instructions
- Dashboard includes an expanded **Trainer Instructions — How to Use the Seaweb Scenario Generator** walkthrough.
- Real Sailing Search, Scenario Generator, Scenario Validator and Saved Scenario Library each have their own collapsible **How to Use This Tab** instructions.
- Instruction panels are trainer-only and are hidden in Trainee View.

### Editable training credit-card information
When a scenario requires payment:
- Choose a predefined Training Card Profile as a starting point.
- Edit Card Number, Expiration, CCV and Billing Address directly.
- **Reset to Profile** restores the original profile values.
- Generated scenarios use the edited values and clearly label them **TRAINING / TEST DATA ONLY**.
- Saved scenarios restore the edited payment values.


## V1.9.8 – Generic Existing-Reservation Guest Wording

Existing-reservation scenarios no longer use the fictional guest names from new-booking exercises.

- When **Modify Existing Reservation** is selected, Guest 1 / Guest 2 inputs are hidden.
- Any new-booking guest names are cleared when switching into a modification workflow.
- The customer story uses neutral wording such as **“A guest contacts Norwegian Cruise Line about an existing training reservation.”**
- When the GDPR caller type is more specific, the scenario uses appropriate wording such as Travel Advisor, PCC Guest, Casino Guest, or Direct Group caller.
- The scenario explicitly instructs trainees to **use the guest name(s) already on their existing training reservation**.
- At a Glance and Reference Details no longer display a generated Primary Guest name for modification scenarios.
- Names can still be supplied when the actual modification specifically requires one, such as **Add Guest** or **Remove Guest**, through the Guest / Item Being Changed field.


## V1.9.9 – NCL Air Programs + Round-Trip / One-Way

The Scenario Generator now has a dedicated Air workflow for four NCL training products:

1. Bundled Air / AIRPROM3
2. Air Choice (US / Canada)
3. Air Choice Plus
4. Independent Air — No Flights / Transfer Setup

### Air controls
- Include Air / Transfers
- Air Type
- Round Trip or One Way
- One-Way direction (to cruise / from cruise)
- Optional gateway / airport
- Program-specific Terms & Conditions preview

Air-focused curriculum selections and **Add / Change Air or Transfers** modification scenarios automatically enable the Air panel.

### Pre-cruise transfer reminder
For NCL Air products, the generator instructs the trainee to **remove the pre-cruise transfer** because NCL Air is scheduled to arrive at least one day before embarkation. It also reminds the trainee to review the guest's pre-cruise hotel and ground-transportation responsibility.

Independent Air / No Flights is handled separately because its source workflow specifically uses transfer setup with T1 / flight 999.

### Program-aware logic
- Bundled Air one-way: 50% of applicable promotional Air pricing.
- Air Choice: eligibility, deposit/final-payment, ticketing and change rules.
- Air Choice Plus: selected-guest customization, $250 deposit, 4-day cutoff and 9-business-day email-link timing.
- Independent Air / No Flights: T1, flight 999, generic time windows and correct-airport transfer setup.


## V1.9.10 – Bundled Air / AIRPROM3 Pride of America Guardrail

Trainer clarification incorporated:

- **Bundled Air / AIRPROM3 is only available on select Pride of America sailings.**
- The Air dropdown now identifies Bundled Air as a select Pride of America product.
- The trainer preview and generated scenario display an eligibility warning.
- Validator behavior:
  - Non–Pride of America sailing selected → **Error**
  - Pride of America sailing selected → **Warning to verify that the specific sailing is eligible**
  - No sailing attached → **Warning to verify an eligible Pride of America sailing**
- Trainer Guide includes this eligibility check as a required coaching point.
- One-way Bundled Air pricing guidance remains available only after the eligibility guardrail.


## V1.9.11 – Generic NCL Air Scenario Focus

The curriculum focus has been future-proofed so it no longer treats Bundled Air / AIRPROM3 as the scenario itself.

### Scenario Focus
- **Bundled Air & Ground Transfers** / **Bundled Air / Ground Transfers** are now **NCL Air & Ground Transfers**.
- The scenario focus is product-neutral so trainers can use the same exercise with the Air product that applies at the time.

### NCL Air Program
Bundled Air remains available under **NCL Air Program**:
- Bundled Air / AIRPROM3 — Select Pride of America Sailings
- Air Choice
- Air Choice Plus
- Independent Air — No Flights / Transfer Setup

Selecting **NCL Air & Ground Transfers** automatically opens the Air panel, but the trainer must choose the applicable program instead of the generator assuming Bundled Air.

The Validator flags an Air scenario if no Air Program has been selected.


## V1.9.12 – Guest Services Agency / Caller Logic

Guest Services booking-source logic now follows these training rules:

- **Agency 5 = Direct Guest (US)**
- **Agency 7 = Direct Guest (Canada)**
- For a **Travel Agent booking**, enter the Travel Agent's **Agency ID or phone number** instead of Agency 5 / 7.

### Generator behavior
- Guest Services uses an editable **Agency / Booking Identifier** field.
- Agency 5 / 7 automatically identify the booking as Direct Guest.
- For Guest Services modifications, Agency 5 / 7 automatically set and lock the GDPR caller type to **Direct Guest**.
- Travel Agent bookings use the Travel Agent's Agency ID / phone number and the Travel Agent / TA Group GDPR path.
- Outbound Sales continues to use the Market / Currency agency selector and keeps the Agency field read-only.

### Scenario wording
- Agency 5 / 7 scenarios use direct-guest wording and never describe the caller as a Travel Advisor.
- A non-5/7 Guest Services identifier is shown as **Travel Agent • Agency ID / Phone**.
- Reference Details now label the value as **Booking Source**.

### Validator
- Agency 5 validates as Direct Guest (US).
- Agency 7 validates as Direct Guest (Canada).
- Travel Agent / TA Group scenarios require a Travel Agent Agency ID or phone number rather than Agency 5 / 7.
- Mismatches between Agency value and GDPR caller type are flagged.


## V1.9.13 – New Reservation Caller Type

Guest Services new-reservation scenarios now have an explicit **Caller Type** selector:

- Direct Guest — US
- Direct Guest — Canada
- Travel Agent

### Caller Type controls booking source and wording
- Direct Guest — US automatically sets and locks **Agency 5**.
- Direct Guest — Canada automatically sets and locks **Agency 7**.
- Travel Agent unlocks the Agency / Booking Identifier field and requires the Travel Agent's **Agency ID or phone number**.

The Customer Scenario, At a Glance, Reference Details, and Validator use Caller Type as the source of truth.

### NCL Air correction
**NCL Air & Ground Transfers** is now caller-neutral. It no longer carries a Travel Agent-only curriculum objective. Direct Guest scenarios use direct-guest wording, while Travel Agent scenarios use travel-advisor wording.

### TA-specific focus
Choosing **Agencies: TA Booking** automatically switches Caller Type to Travel Agent. The Validator flags that focus if paired with a Direct Guest caller.


## V1.9.14 – Multi-Focus + Visual Scenario Format

### Multiple Scenario Focus skills
- Scenario Focus is now a compact dropdown-style checklist.
- Trainers can select one or multiple curriculum skills in the same scenario.
- The generator combines the selected objectives, tasks, offers/add-ons, Air requirements, considerations, validation rules, and Trainer Guide into a single exercise.
- Duplicate requirements are removed where possible so combined scenarios stay readable.
- Saved scenarios preserve all selected focus skills.

### Standardized trainee scenario format
Generated scenarios now follow one consistent, trainee-friendly structure inspired by the Independent Air scenario format:
- 🛳️ Practice Scenario title
- ✅ Finish / class-chat instructions
- 🎯 Skills Included
- ☎️ Call Scenario
- 🏢 / ☎️ Booking Source
- 🔐 GDPR when applicable
- 🗂️ Existing Reservation when modifying
- 🚢 Sailing Details
- 👥 Guest Information
- 🎁 Offers & Add-Ons
- ✈️ Air Program when applicable
- 💳 Payment
- 📧 Required Actions
- 🗣️ Reservation Recap
- ☎️ Call Closing
- 🧠 Things to Consider
- ✅ Final Reservation Check

Sections that do not apply are omitted. Small visual icons are intentionally included to help trainees scan the scenario quickly in the generator, Teams, PNG, PDF, and printed versions.


## V1.9.15 – Coupon Sources + Exact Generator Exports

### Credits & Coupons
Scenarios that use FCC, CruiseNext, CruiseFirst, guest discount coupons or other credits now display a dedicated **Credits & Coupons** setup panel. Trainers can also turn on **Include Credits / Coupons** manually for any scenario.

Trainers can add multiple items to the same scenario and specify for each one:
- Credit / Coupon Type
- Source Guest
- Source Latitudes Number
- Optional details / value (for example 10% off, $250, or a certificate number)

The generated trainee scenario includes a visual **🎟️ Credits & Coupons** section. Tasks and Final Reservation Check identify the exact credit/coupon, guest and Latitudes profile. The Validator flags missing coupon type, source guest or source Latitudes number.

Saved scenarios preserve these credit/coupon assignments.

### PDF / PNG match the Generator
Current View PDF and PNG exports now render from the exact Scenario Generator card styling instead of a separate export layout.

- Same spacing, typography, borders, backgrounds, visual icons and section layout as the Generator
- Same text wrapping by rendering at the current on-screen scenario width
- 2× render scale for sharper image quality
- Trainer / Trainee visibility is preserved
- Unused outer renderer space is cropped automatically


## V1.9.16 – Specific Sailing Date + NCL.com U.S.

### U.S. NCL public source
Real Sailing Search now builds all live search URLs from:

**https://www.ncl.com/vacations**

The previous `/uk/en/` source has been removed. Manual NCL imports are also normalized back to the U.S. `ncl.com` path when a country/language-prefixed NCL URL is pasted.

### Specific sailing date
Every real itinerary must now have a **specific sailing date** before it can be used in Scenario Generator.

- When the NCL U.S. page exposes exact sailing dates, the result shows them in a dropdown and marks the selected date as NCL-verified.
- When the public itinerary card only exposes month-level availability, the result shows a date picker limited to the trainer's search window.
- Trainer-entered dates are clearly marked for verification in NCL.com U.S. / Seaweb.
- Selected sailing summaries, the visual Sailing Details section, reference details, customer-story wording, saved scenarios, PDF/PNG exports, and Scenario Validator use the exact selected date.
- The Validator blocks a real-sailing scenario that does not have a specific date.


## V1.9.17 – Credits & Coupons Layout Fix

- Fixed the Credits & Coupons editor overflowing the Scenario Generator column.
- Coupon rows now use a responsive 12-column layout.
- Credit/Coupon Type, Source Guest, and Source Latitudes # stay on a clean first row at desktop widths.
- Details / Value and Remove use a second row so fields remain readable without extending beyond the panel.
- Inputs are constrained to the panel width.
- Narrow screens progressively reflow and mobile stacks to one column.
