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


## V1.9.18 – Select Itinerary + Specific Sailing Date

Real Sailing Search now uses an explicit two-step workflow:

### Step 1 — Select Itinerary
Search results show itinerary choices. Select **Select Itinerary** on the route / ship you want.

### Step 2 — Choose Specific Sailing Date
A dedicated panel opens underneath the results. The trainer then chooses the exact departure date before the itinerary can be sent to Scenario Generator.

- If NCL.com U.S. exposes exact dates, they appear as quick-select date buttons.
- A date field is always available so the trainer can enter another exact sailing date after verifying it on NCL.com U.S. or in Seaweb.
- The date is restricted to the current From/To search window.
- The itinerary is visually highlighted while its date is being selected.
- **Use This Sailing in Scenario** remains disabled by workflow until an exact date is entered.
- The chosen exact date continues through the generated scenario, validator, saved scenario, PNG and PDF.

This separates itinerary selection from sailing-date selection so trainers can clearly choose both.


## V1.9.19 – Always-Visible Itinerary + Sailing Date Selector

The sailing selection workflow has been simplified again so the trainer does not need a hidden secondary panel.

After search results load, an **always-visible** selector appears underneath the results:

1. **Itinerary** dropdown
2. **Specific Sailing Date** dropdown

If NCL.com U.S. exposes exact dates, the sailing-date dropdown is populated with those dates.

If the public NCL result does not expose exact dates, the second dropdown is replaced with a clearly labeled **Verified Sailing Date** field. The trainer can enter the exact date after confirming it on NCL.com U.S. or in Seaweb.

Each result card also includes **Choose This Itinerary**, which selects that itinerary in the dropdown and scrolls to the selector.

This removes the hidden-panel dependency and makes both selections visible at the same time.


## V1.9.20 – Cloudflare Deploy Fix

The V1.9.16–V1.9.19 builds could fail during Wrangler deployment because the exact sailing-date parser used an escaped slash inside a JavaScript regular-expression literal that Cloudflare's build parser rejected.

### Fixed
- Replaced the affected date-parsing regex literals with explicit `RegExp` constructors.
- Removes the Wrangler / esbuild syntax error reported at `worker.js:758`.
- Keeps the V1.9.19 always-visible **Itinerary** and **Specific Sailing Date** selectors.
- No feature rollback: all V1.9.19, coupon, NCL.com U.S., export, caller-type, Air, and multi-focus updates remain included.


## V1.9.21 – NCL U.S. Inventory API Search

The U.S. `ncl.com/vacations` page is JavaScript-driven and can return only the page shell to an automated browser even when the page itself loads normally for a guest. This caused the Scenario Generator to report that NCL loaded but no readable itinerary cards were found.

### New search path
Real Sailing Search now requests NCL's structured public itinerary inventory first:

`https://www.ncl.com/api/vacations/v1/itineraries`

The request explicitly asks for the U.S. / English storefront. The app then filters the returned NCL inventory locally by:

- Destination
- Embarkation Port
- Ship
- 30-day date window
- Optional vacation length

### Exact sailing dates
Structured inventory includes the sailing records for each itinerary, so the **Specific Sailing Date** dropdown can now be populated from exact departure dates instead of trying to infer dates from the public result card.

### U.S. market protection
When NCL returns an explicit currency, the API result is only accepted as U.S. inventory when USD is present. This prevents another market from silently being labeled as U.S.

### Fallback
The Browser Rendering / public-page parser remains in place as a fallback if the itinerary inventory endpoint is temporarily unavailable.


## V1.9.22 – Current NCL U.S. Search API

V1.9.21 used an incorrect guessed inventory endpoint. The live NCL.com U.S. site currently requests:

`https://www.ncl.com/api/v2/vacations/search?limit=12&offset=0`

The Real Sailing Search now uses the current `/api/v2/vacations/search` endpoint.

### Improvements
- Uses NCL's current U.S. vacation-search endpoint instead of the obsolete/incorrect `/api/vacations/v1/itineraries` path.
- Reads the response defensively so modest JSON-shape changes do not immediately break the tool.
- Supports pagination and local filtering by Destination, Embarkation Port, Ship, date window and vacation length.
- Extracts exact sailing dates when the NCL response exposes them.
- If an itinerary is returned without exact dates, the itinerary remains selectable and the UI shows the Verified Sailing Date field rather than discarding the itinerary.
- Checks explicit currency fields and will not silently label a non-USD storefront as U.S. data.
- Retains the public-page Browser Run parser as a fallback.


## V1.9.23 – Browser-Context NCL Search

The V1.9.22 direct request to NCL's current `/api/v2/vacations/search` endpoint can be challenged when it comes from a Cloudflare Worker, even though the exact same endpoint is used successfully by the NCL website in a browser.

### Search changes
1. Try the current NCL U.S. search API directly.
2. If NCL blocks or challenges that server-to-server request, retry the same endpoint through **Cloudflare Browser Run**.
3. If the structured endpoint still cannot be read, load the actual NCL U.S. Vacations results page and allow its JavaScript/XHR requests to finish before parsing the rendered itinerary cards.

### Timing fix
NCL's search XHR can occur roughly 9 seconds after page initialization. Previous versions only waited about 1.8 seconds. The Browser Run results-page fallback now waits **12 seconds** before reading the rendered content.

This keeps the current U.S. NCL source while avoiding reliance on a direct Worker request that NCL may reject.


## V1.9.24 – Automatic Exact Sailing Dates

Trainers no longer need to type a sailing date whenever NCL.com U.S. exposes the itinerary's exact departures.

### New behavior
1. Search for itineraries.
2. Choose an itinerary.
3. If exact dates were not included in the first search result, the generator automatically performs a second lookup against NCL.com U.S.
4. The tool discovers the itinerary's NCL cruise-detail / dates-and-prices page and extracts the exact departure dates.
5. The **Specific Sailing Date** dropdown is automatically populated.

While the second lookup is running, the dropdown displays **Loading exact sailing dates from NCL.com U.S.…**

### Fallback
The manual **Verified Sailing Date** field is now only shown when NCL's public pages still do not expose exact dates after the automatic lookup. This avoids inventing dates while still giving trainers a way to use a date that they personally verified in NCL.com U.S. or Seaweb.

The selected sailing also keeps the itinerary's more specific NCL detail URL when one is discovered.


## V1.9.25 – Hidden NCL Sailing Date Extraction

The NCL vacations result cards usually display only month-level availability. Exact dates may still exist in the page's underlying HTML, data attributes or serialized itinerary data.

### Changes
- The exact-date lookup now scans the **raw rendered NCL HTML/JSON before stripping tags or scripts**.
- Recognizes NCL URLs containing **`sail-id` / `sail_id`** as sailing-detail links.
- Searches date values next to sailing/departure/start-date keys and data attributes.
- Searches the serialized context around NCL sail IDs for ISO, U.S. numeric and named dates.
- Supports compact `YYYYMMDD` dates in page data.
- Continues filtering all extracted dates to the trainer's original From/To search window so unrelated page dates are discarded.
- If exact dates are found, the Specific Sailing Date dropdown populates automatically.
- Manual Verified Sailing Date remains only as the final fallback when NCL's public data truly does not expose the dates.


## V1.9.26 – Live Browser Sailing-Date Capture

Previous versions used Browser Run Quick Actions to read the final page content. That can miss itinerary dates because NCL loads the dates through background API requests and may never write all of them into the visible HTML.

V1.9.26 switches the sailing-date lookup to a full **Cloudflare Browser Run Puppeteer session**.

### What it does
- Opens the selected NCL.com U.S. search page in a real Chromium session.
- Watches the browser's network responses while NCL loads its own vacation/search data.
- Captures NCL JSON responses containing cruise, itinerary and sailing information.
- Matches those results back to the selected itinerary using ship, itinerary title, embarkation port, duration and ports of call.
- Extracts the exact sailing dates from the same data NCL's page uses.
- If necessary, follows the best matching `View Cruise`, `itineraryCode`, or `sail-id` link and watches that detail page's network traffic too.
- Filters all returned dates to the trainer's original 30-day search window.

### Project dependency
This update adds Cloudflare's supported Puppeteer package:

`@cloudflare/puppeteer`

The ZIP therefore includes **package.json** and **wrangler.toml** in addition to the normal five files. Upload all seven files for this version.

The manual Verified Sailing Date field remains only as a fallback if NCL's live browser session truly returns no selectable dates.


## V1.9.27 – Hybrid Public Sailing Schedule

NCL.com U.S. remains the authoritative source used by Real Sailing Search for the **itinerary itself**: ship, route, embarkation port, duration, ports and public offers.

NCL's public pages do not consistently expose every exact departure date to automated browser sessions. V1.9.27 therefore uses a second public source only for the **date dropdown**.

### Sailing-date source
When an NCL itinerary does not already contain exact dates, the generator checks the corresponding ship's published itinerary schedule on **CruiseMapper** and filters it by:

- ship
- departure port
- cruise duration
- the trainer's original 30-day From/To window

The returned dates populate **Specific Sailing Date** automatically.

### Source transparency
The interface keeps the sources separate:

- **Itinerary verified from NCL.com U.S.**
- **Sailing date source: CruiseMapper public schedule — verify in NCL.com U.S. / Seaweb before class**

A CruiseMapper date is never labeled as NCL-verified.

### Supported NCL ships
The public-schedule lookup includes Norwegian Aqua, Luna, Prima, Viva, Aura, Encore, Bliss, Joy, Breakaway, Getaway, Escape, Epic, Gem, Jade, Jewel, Pearl, Dawn, Star, Sun, Spirit and Pride of America.

### Fallback
If neither NCL nor the public schedule returns a usable date, the **Verified Sailing Date** field remains available for a trainer-entered date that has been personally confirmed in NCL.com U.S. or Seaweb.


## V1.9.28 – Reinstate Cancelled Reservation Roleplay

A new Guest Services Scenario Focus is available:

**Reinstate Cancelled Reservation – Roleplay**

### Automatic setup
Selecting this focus automatically:
- switches to **Modify Existing Reservation**
- selects **Cancel / Reinstate Reservation**
- sets **Refund / Reinstate**
- enables **Comments**
- enables **Confirmation**
- adds the reinstatement request to the servicing instructions

### Roleplay
- One trainee is the **Cruise Specialist**
- One trainee is the **Direct Guest or Travel Agent**, depending on the cancelled reservation being used
- Use a training reservation from **yesterday that was cancelled**
- After the first interaction, **switch roles and repeat**

### Required workflow
The generated scenario requires:
1. GDPR verification before servicing.
2. **Reservation Number — REQUIRED**.
3. Travel Agent agency identifier when the Travel Agent GDPR path applies.
4. Verify the reservation was cancelled within the **last 24 hours**.
5. Verify the **previous stateroom** is still available.
6. Verify the **pricing is the same as before**.
7. Reinstate the reservation when it qualifies.
8. **Store Changes**.
9. Recap everything with the caller.
10. Add reservation **Comments**.
11. Send the appropriate **Confirmation**.
12. Complete the call closing.
13. Switch roles and repeat.

The generated Trainee and Trainer views include a visual **Partner Roleplay** section.


## V1.9.29 – Roleplay Builder + Solo Practice

### New Scenario Focus: Solo Guest / Studio Booking
Guest Services now includes **Solo Guest / Studio Booking**. Selecting it automatically configures:
- Create New Reservation
- Travel Agent caller
- Norwegian Training Travel / 305-436-1000
- Kyle James as the Travel Agent in the generated scenario
- Tom Holland as the solo guest
- Guest search by Last Name + DOB 06/01/1996
- Studio / Solo category
- Free at Sea
- Pre-Paid Service Charges
- Norwegian Care
- Kosher Meals reminder
- Minimum Deposit
- training card 4917 6100 0000 0000 / 04-2027 / 123 / 123 Sesame Street
- Guest + Travel Agent confirmations to training123@ncl.com
- Compass comments

The generated card includes the required advertised-pricing script.

### New Scenario Focus: Add Guest & Upgrade Stateroom – Roleplay
Guest Services now includes **Add Guest & Upgrade Stateroom – Roleplay** as the servicing follow-up to the Solo practice.

Selecting it automatically configures:
- Modify Existing Reservation
- Travel Agent GDPR
- Add Guest
- Taylor as the guest being added
- Latitudes #272279126
- Upgrade from Studio to a category accommodating two guests
- Near elevators / stairs preference
- Twin Beds
- retain Tom's Kosher Meals
- Taylor mushroom allergy
- verify Free at Sea, Pre-Paid Service Charges and Norwegian Care for both
- check for additional deposit and collect only when due
- Store Changes
- Guest + Travel Agent confirmations
- Compass comments
- partner roleplay / switch roles

### Make Any Scenario a Roleplay
After any standard scenario has been generated, a new **Make Roleplay** button appears in the Generator output toolbar.

Selecting it:
- keeps the existing sailing, guests, focuses, payment requirements and scenario instructions
- converts the card into a two-person **Cruise Specialist + Caller** roleplay
- automatically labels the caller as Direct Guest, Travel Agent, Guest, or the selected GDPR caller type
- tells the Caller to reveal information naturally rather than giving every detail at once
- adds a role-switch instruction so both trainees practice the Cruise Specialist role
- updates the final checklist for the roleplay format

Select **Standard Scenario** to change a manually converted roleplay back to the normal individual-practice version.

Dedicated roleplay Scenario Focuses remain locked as roleplays.


## V1.9.30 – Sailing Date Dropdown Fix

This update fixes the Specific Sailing Date selector.

### Root cause
The hybrid public-schedule code was requesting each CruiseMapper ship's general profile URL. The exact departure table is exposed on the **Itinerary** tab (`?tab=itinerary`). Because the wrong page variant was being parsed, the date endpoint frequently returned no usable rows and then fell into a slow NCL browser fallback.

The Worker Cache API could also retain an earlier empty response for the same itinerary query, so a new deployment could still appear broken for several minutes.

### Changes
- CruiseMapper ship URLs now request `?tab=itinerary`.
- The HTML and Markdown parsers now match the current itinerary-table format more flexibly.
- Sailing-date API responses are no longer stored in the Worker Cache API.
- The NCL browser fallback was removed from this second-stage date lookup so the UI does not remain stuck loading.
- The browser-rendered public-schedule fallback has a shorter timeout.
- The frontend aborts a date lookup after 18 seconds and exposes the verified-date fallback rather than spinning indefinitely.
- A version parameter is attached to the sailing-date request to avoid stale edge/browser responses.
- Loading copy now accurately says the app is loading dates from the public schedule.

NCL.com U.S. remains the source of the selected itinerary. Public-schedule dates are still labeled separately and must be verified in NCL.com U.S. or Seaweb before class.

## V1.9.31 – Follow-Up Servicing Roleplay Builder

Every generated scenario can now become the starting reservation for a separate callback / servicing roleplay.

### New button
After a scenario is generated, the Generator toolbar includes **Create Follow-Up Roleplay**.

This is different from **Make Roleplay**:
- **Make Roleplay** converts the current exercise itself into a two-person roleplay.
- **Create Follow-Up Roleplay** treats the current exercise as already completed and creates a new call in which the Guest or Travel Agent calls back to make changes to that reservation.

### Follow-Up Roleplay Builder
The trainer can choose the callback caller: Same caller / booking source, Direct Guest, or Travel Agent. The generated roleplay automatically uses the appropriate GDPR path and makes **Reservation Number REQUIRED**. Travel Agent follow-ups also use the Travel Agency ID / phone-number requirement.

### Trainer-selectable servicing changes
Any combination can be selected: Add Guest, Remove Guest, Change / Upgrade Stateroom, Update Guest Information, Special Request / Allergy, Bed Configuration, Free at Sea, Pre-Paid Service Charges, Norwegian Care, Air / Transfers, Dining / Entertainment / Amenity, Coupon / Credit, Price Drop, Payment / Additional Deposit, or Cancel / Reinstate.

A free-text **Specific changes / caller details** field lets the trainer add names, Latitudes numbers, categories, stateroom preferences, special requests, amounts or any other custom servicing instruction.

### Generated roleplay
The follow-up card includes an Existing Reservation snapshot, GDPR verification, Caller Role Card, trainer-selected servicing changes, custom caller details, optional training payment card, verification of existing benefits, Store Changes, Compass comments, updated confirmation(s), full recap, closing, role switch and a Final Roleplay Check.

The follow-up roleplay receives a new scenario ID and can be saved independently in the Saved Scenario Library. The original Generator form remains in place; selecting **Generate Scenario** again recreates the original scenario.


## V1.9.32 – Multiple Reservations + Authorized Person

Two dedicated Guest Services Scenario Focuses were added.

### Multiple Reservations & Authorized Person
Automatically configures:
- Direct Guest — U.S. / Agency 5
- Maria Lopez as the caller
- March 1–31, 2027 sailing search preset
- Embarkation Port = Galveston
- 4 travelers across 2 reservations
- Maria Lopez — Latitudes #279019549
- Sofia, age 4 — Latitudes #279019550
- Ana Martinez — Latitudes #279019849
- Luis Martinez — Latitudes #279019848
- two Balcony staterooms that MUST connect
- Free at Sea, Pre-Paid Service Charges and Norwegian Care
- Sofia peanut allergy
- Ana/Luis beds together + extra pillows
- separate $250 deposits
- training card 4917 6100 0000 0000 / 04-2027 / 123 / 123 Sesame Street
- Authorized Person guidance
- exact parents' reservation comment: `Authorized Person: Maria Lopez, CC 0000`
- recap and comments on each reservation
- confirmation for each reservation
- TWITH
- both reservation numbers saved and posted

### Multiple Reservations & Authorized Person – Cruisetour
Uses the same caller and guests, but automatically presets:
- Ship = Pride of America
- March 1–31, 2027
- Honolulu departure expectation
- exact package: **11-DAY OAHU EXPLORER HYATT WAIKIKI OCEAN VIEW CRUISETOUR**
- 4-day pre-cruise Cruisetour
- package required on BOTH reservations

The generated scenario specifically warns trainees not to substitute a different package or book only the cruise portion.

### Search improvements
Galveston is now included in the searchable Embarkation Port dropdown.

### Scenario output
Both dedicated focuses include:
- separate Reservation 1 and Reservation 2 cards
- Authorized Person script
- exact Authorized Person reservation note
- connecting-stateroom verification
- advertised-quote wording and identical-booking quote rule
- separate-deposit reminder
- detailed Things to Consider
- dedicated recap for both reservations
- TWITH and two-confirmation requirements
- final check requiring both reservation numbers


## V1.9.33 – Interactive Scenario Sharing

The primary sharing workflow has been changed from a static scenario card to a **standalone interactive HTML scenario**.

### Share Scenario
The Generator toolbar now says **Share Scenario** instead of **Share Card**.

The recommended share options are:

- **Download Interactive Trainee Scenario**
- **Download Interactive Trainer Scenario**

The existing PDF, PNG, print and copy tools remain available under **Other Export Options**.

### Works with every generated scenario
The interactive export uses the actual scenario HTML already generated by the app, so it works automatically with:
- standard new-reservation scenarios
- Guest Services servicing scenarios
- multiple-focus scenarios
- scenarios converted with **Make Roleplay**
- dedicated roleplay scenarios
- **Follow-Up Servicing Roleplays**
- multiple-reservation / Authorized Person scenarios
- Cruisetour scenarios
- future scenario focuses that use the normal Generator section structure

### Interactive Trainee Scenario
The downloaded `.html` file includes:
- the same Generator / NCL scenario styling
- sticky section navigation
- automatic step numbering
- a live completion progress bar
- **Mark Complete** buttons for each section
- generated task lists converted into clickable checkboxes
- a collapsible **Notes / Answers** area for every section
- browser-local autosave for progress, checklist status and notes
- **Print / Save PDF**
- **Copy Progress Summary**
- **Open All Notes**
- **Reset Worksheet**
- responsive desktop/mobile layout

### Roleplay support
Roleplay scenarios use the same interactive workflow while retaining:
- Partner Roleplay instructions
- Cruise Specialist / Caller roles
- caller details
- GDPR sections
- role-switch instructions
- servicing requirements
- final roleplay checklist

A Roleplay banner is displayed at the top of the shared file.

### Trainer interactive version
The Trainer version contains everything in the trainee version plus the generated Trainer Guide and trainer-only coaching content.

### Self-contained
The NCL brand lockup, Generator styling, scenario content and interactive behavior are packaged into one downloaded HTML file, so trainers can send the file directly to trainees.


## V1.9.34 – Portrait Interactive PDF

The interactive scenario's **Print / Save PDF** layout has been rebuilt.

### Portrait by default
Interactive scenarios now use **Letter – Portrait** when printed or saved as PDF.

The standalone button now reads:

**Print / Save PDF (Portrait)**

### Mirrors the interactive scenario
The saved PDF retains the same visual hierarchy trainees see in the interactive HTML:
- NCL header
- interactive title and instructions
- progress bar
- scenario cards
- step labels
- scenario-focus callouts
- roleplay content
- checklist boxes
- NCL / Generator styling

Only browser controls such as navigation, reset, export buttons and completion buttons are removed.

### Better page flow
Large interactive sections are now allowed to continue naturally onto the next page. The previous version attempted to keep entire sections together, which could create large blank areas or awkward page breaks.

Smaller content blocks such as role cards, guest cards, pricing callouts, payment cards and Authorized Person callouts stay together when practical.

### Portrait-friendly sizing
Typography, margins, cards, icons and scenario grids are automatically resized for an 8.5 × 11 portrait PDF.

Generator elements are constrained to the printable width so they cannot extend beyond the right edge.

### Notes
Empty Notes / Answers areas are omitted from the PDF.

If the trainee entered notes in a section, those notes are automatically included in the printed PDF.

### Applies to every interactive share
The new portrait PDF styling works with:
- standard scenarios
- multiple-focus scenarios
- dedicated curriculum scenarios
- Roleplays
- Make Roleplay scenarios
- Follow-Up Servicing Roleplays
- Multiple Reservations / Authorized Person
- Cruisetours
- Trainer interactive scenarios


## V1.9.35 – Interactive PDF Safe Margins

The standalone interactive trainee/trainer **Print / Save PDF (Portrait)** layout now has a larger print-safe gutter.

### PDF margin fix
- Increased the Letter portrait page margins, especially on the left and right.
- Added a small inner print gutter so content does not sit directly against the printable boundary.
- Constrained cards, sections, tables, images and inherited Generator content to the available page width.
- Added print-only text wrapping so long sailing names, labels, values and other content cannot force a section past the right edge.
- Overrode inherited `white-space: nowrap` rules during printing where they could cause clipping.

The interactive browser layout is unchanged; these adjustments apply only when the standalone interactive scenario is printed or saved as a PDF.

## V1.9.36 – Multiple Reservation Detail Entry

Multiple-reservation Scenario Focus combinations now provide separate data-entry areas for both bookings instead of forcing all guest and stateroom information into one reservation.

### What changed
- When **Multiple Reservations** is selected as any Scenario Focus, the original guest/stateroom fields become **Reservation 1** fields.
- A new **Reservation 2 Details** panel appears with its own guest count, guest names, stateroom category, location preference, side preference, and optional advertised pricing.
- Added a **Reservation Relationship** selector for Connecting, Adjacent / Next Door, Near Each Other, Same Sailing / Linked, or No Preference.
- Guest counts from both reservations are combined correctly for Latitudes / Past Guest setup, coupon source choices, validation, scenario output, and exports.
- Guest 3–8 name fields now appear automatically when a reservation contains more than two guests.
- Generated trainee scenarios show Reservation 1 and Reservation 2 separately, including the entered names, stateroom preferences, pricing, and relationship.
- Saved scenarios restore both reservations and all entered guest names.
- Validator checks each reservation independently and flags missing primary guest names or incomplete multi-reservation setup.
- Existing **Multiple Reservations & Authorized Person** scenarios now populate the same two-reservation input structure while keeping their specialized training instructions.


## V1.9.37 – Step-by-Step Wizard Generator

The Scenario Generator has been reorganized into a guided 4-step wizard to reduce trainer overwhelm and make the setup flow easier to follow.

### What changed
- Replaced the dense single-page form with 4 guided steps: **Scenario Type**, **Reservation Details**, **Additional Options**, and **Review & Generate**.
- Added a clickable progress header so trainers can move between steps more easily.
- Converted **Scenario Focus** into an always-visible card layout inside Step 1 so trainers can scan the options faster without opening a long dropdown menu.
- Added a **Review Summary** in Step 4 that recaps the key scenario choices before generation.
- Preserved the current right-side output preview and all existing generation logic, multiple-reservation setup, and exports.

### Notes
- The live Cloudflare site must be redeployed with this build for the wizard layout to appear online.


## V1.9.38 – Full-Screen Guided Wizard

The Scenario Generator now follows the approved Option A experience as a true multi-screen wizard instead of showing the form and generated output side by side.

### Trainer flow
1. **Scenario Type** — select department/workflow/caller context, difficulty, and one or more large visual Scenario Focus cards.
2. **Reservation Details** — enter guest, stateroom, sailing, booking-source, pricing, payment and multi-reservation/modification details in organized section cards.
3. **Additional Options** — select scenario tasks using visual toggle cards, then complete any Air, Latitudes, coupon, or training-card details that appear.
4. **Review & Generate** — review Scenario Type, Reservation Details and Additional Options in three summary cards, edit any prior step, add trainer notes, and generate.
5. **Generated Scenario Screen** — after Generate Scenario, the setup wizard is replaced by a full-width scenario screen with a success banner and the existing Share Scenario, Roleplay, Follow-Up Roleplay, Print and Save tools.

### Design
- Uses the current NCL brand palette and typography already built into the Generator.
- Scenario Focus options use large icon-based cards rather than a dropdown-style menu.
- The top progress indicator shows completed, current and upcoming steps.
- **Edit Setup** returns directly to Review & Generate without losing the generated scenario.
- Existing scenario logic, validation, multiple reservations, interactive HTML sharing and PDF-safe export behavior are preserved.


## V1.9.39 – Compact Scenario Focus Cards

The Scenario Focus area in the guided wizard was tightened up so trainers can see more options at once without scrolling.

### What changed
- Hid the long focus descriptions by default.
- Added a **Details** expand/collapse control on each Scenario Focus card.
- Reduced the default card size so more focus options fit on one screen.
- Expanded the desktop grid so the Scenario Focus cards can display in more columns when space allows.

This keeps the cleaner Option A flow while reducing visual overload in Step 1.

## V1.9.40 – Tabbed Scenario Focus + Detailed Focus Setup

The Scenario Focus step now follows the approved **Option 1 – Tabbed Categories** layout while preserving the full-screen guided wizard and current NCL brand styling.

### Scenario Focus tabs
Scenario Focus is organized into trainer-friendly categories:
- Most Common
- New Reservation
- Servicing / Changes
- Special Requests
- Air & Transfers
- Advanced

The long descriptions are no longer shown on every card. The cards stay compact so trainers can see more choices at once, while the selected focuses remain available across tabs.

### Special Requests by guest
When a Special Requests focus is selected, Step 3 now lets the trainer:
- choose the guest
- choose the exact request type
- add optional details
- add multiple requests for different guests

### ADA / accessibility needs by guest
ADA focuses now require the trainer to identify:
- which guest has the accessibility need
- the type of need or accommodation
- optional details

Examples include wheelchair/limited mobility, accessible stateroom, mobility scooter, embarkation/debarkation assistance, hearing/visual impairment, service animal, medical equipment, and other accessibility needs.

### Multiple Reservations
Multiple Reservations now includes a **Total Reservations** selector supporting **2–8 reservations**.

Each reservation can have its own:
- guest count and guest names
- stateroom category
- location preference
- side preference
- advertised pricing

The generated scenario, recap, validation, and required actions now reflect the full number of reservations instead of assuming only two.

### FCC / coupons / discounts
Credits & Coupons now uses a controlled **Source Guest** selector and supports:
- CruiseNext Credit
- Future Cruise Credit (FCC)
- CruiseFirst Credit
- 10% Discount Coupon
- Percentage Discount Coupon
- Latitudes / Guest Coupon
- Promotional / Partner Coupon
- Other Credit / Coupon

Each item continues to capture the source guest, source Latitudes number, and optional value/details.

### Price Programs & promotions
Price Programs now provides exact selections for:
- ALL4CHO
- Unlimited Open Bar
- Specialty Dining
- Internet
- Shore Excursions
- Prepaid Service Charges
- Kosher Meals
- FlexNet
- AMEXCPP
- Other Price Program / Travel Agent Promotion

Selecting **ALL4CHO** selects all four included Free at Sea components. Trainers can uncheck an individual component to build a partial selection instead.

### Air & Transfers by guest
Air and transfer setup is now configured independently for every guest.

Each guest can have a different selection for:
- No NCL Air
- Bundled Air / AIRPROM3
- Air Choice
- Air Choice Plus
- Independent Air – No Flights / Transfer Setup
- Round Trip or One Way
- Gateway / airport
- No transfer, embarkation only, debarkation only, or round-trip transfers

One guest can select air while another guest declines it, or guests can use different air products in the same training scenario.

### Generated scenario + validation
The generated trainee/trainer scenario now includes a dedicated **Scenario-Specific Setup** section showing the trainer-selected special requests, ADA needs, price programs, and per-guest air/transfer setup. Validation also checks that the required focus-specific details were completed.


## V1.9.41 – Generate Scenario + Latitudes Fix

### Generate Scenario
- Hardened the final **Generate Scenario** action so the generated scenario screen is explicitly opened after successful generation.
- Added visible error handling so a generation problem can no longer fail silently.
- Added a temporary Generating state to prevent accidental double-clicks.

### Latitudes numbers
- Restored the **Guest Status / Latitudes** section to the generated scenario output.
- Past Guest Latitudes numbers now display directly in the generated scenario.
- Multiple-reservation scenarios also show each guest's Past/New Guest status and Latitudes number inside the applicable Reservation card.
- The existing validator still flags any Past Guest that is missing a required training Latitudes number.
