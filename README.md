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
