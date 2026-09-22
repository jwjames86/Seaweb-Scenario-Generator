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


## V1.8.8 – legal-size export + mixed guest status
- PDF and PNG page-set exports now use **8.5 x 14 legal-size pages** to reduce page count and use more of the page.
- The export render groups were rebalanced so earlier pages do not have large empty gaps.
- The export image size was increased for sharper PNG and PDF output.
- The generator now supports **mixed guest types** in the same scenario: each guest can be marked as a **past guest** or **new guest**, and only past guests require a Latitudes number.
