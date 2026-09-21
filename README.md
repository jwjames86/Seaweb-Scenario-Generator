# Seaweb Scenario Generator – V1

A free, no-sign-in training prototype for generating and validating Norwegian Cruise Line Seaweb scenarios.

## Included

- Dashboard
- Real Sailing Search using public NCL.com vacation pages
- Scenario Generator
- Scenario Validator
- Trainer / Trainee views
- Saved Scenario Library using browser localStorage
- Export / Import JSON backups
- Copy and Print
- Four starter templates
- Cloudflare Worker + static assets in one free project

## Important training-data rules

The app intentionally separates:
- **Verified from NCL.com**: public ship, itinerary, departure port, sailing month/date when exposed, ports, public starting fare/taxes/offers.
- **Trainer / Seaweb data**: Agency, training guests, internal promo codes, exact cabin inventory/capacity/square footage, deposit/final-payment details, cancellation deadlines, Commenting Tool tasks and answer-key notes.

The live adapter never invents a sailing or public price. If NCL blocks the request or changes its page structure, the generator/validator/library still work and the app shows a manual NCL URL fallback.

## Free deployment on Cloudflare

1. Create a free Cloudflare account.
2. Install Node.js if you do not already have it.
3. Unzip this project.
4. In the project folder, run:
   - `npx wrangler login`
   - `npx wrangler deploy`
5. Wrangler will return your free `workers.dev` URL.
6. Open that URL and test **Real Sailing Search**.

No paid database is required for V1. Saved scenarios live in the user's browser.

## GitHub option

If you create an empty GitHub repository, upload this project there. Cloudflare can then be connected to the repository for version control and future updates.

## V1 limitation

NCL.com is a public website, not an official training API. The adapter parses public vacation-result cards and can be affected by NCL site changes or anti-bot behavior. For production/internal NCL use, replace the adapter with an approved internal NCL feed/API if one is available.
