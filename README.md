# Seaweb Scenario Generator – V1.4

A no-sign-in training prototype for Norwegian Cruise Line Seaweb scenario authoring and validation.

## V1.4 curriculum update

The generator now reflects both current training tracks supplied by the trainer:

- Guest Services – Days 6 through 11
- Outbound Sales – Days 6 through 11

The Scenario Focus list changes automatically by department and training day. The catalog is based on the supplied `GS Seaweb Scenarios.pdf` and `OB Seaweb Scenarios.pdf` training scenario sets.

### Guest Services focus map

- Day 6: Basic Reservation; Payments
- Day 7: Applying FCC; NorwegianCare
- Day 8: Special Requests; Price Programs & FAS
- Day 9: ADA & Special Requests; Infants & Guests 3-8
- Day 10: Agencies: TA Booking; Multiple Reservations; Bundled Air & Ground Transfers
- Day 11: Cancel & Reinstate; Price Drops - TRAINER DEMO; Land Pkgs / Cruisetour

### Outbound Sales focus map

- Day 6: Basic Reservation
- Day 7: Payments; Special Requests
- Day 8: Norwegian Care; Price Programs & FAS; GTY Categories - Trainer Demo; Singles / Infants / Guests 3-8; Cruise First
- Day 9: ADA & Special Request; New Guest; Multiple Reservations / Travel With
- Day 10: Dining, Ent & Spa; Amenities; Bundled Air / Ground Transfers; Air Deviations; Cancellations / Reinstatements
- Day 11: Hotel; Cruisetours; Air Choice

## Department behavior

### Guest Services
- Defaults to Agency 5.
- Uses the Guest Services Day 6–11 curriculum focus list.
- Servicing scenarios emphasize GDPR verification, reservation changes, comments, confirmation, and current Seaweb/NCLHelp verification.

### Outbound Sales
- Adds Market / Currency selection and automatically fills the corresponding agency number.
- New-booking scenarios can include the outbound qualification prompts used in the current training materials.
- Uses the Outbound Sales Day 6–11 curriculum focus list.

## Training credit-card behavior

When the selected curriculum scenario explicitly requires a card payment, the generator automatically displays a **TRAINING / TEST DATA ONLY** payment panel and includes the selected training card in the trainee scenario. Trainers can switch among the card profiles represented in the supplied training materials.

When a scenario uses CruiseNext/FCC/CruiseFirst or requires no new card payment, the card panel stays hidden by default. If a trainer manually changes the Payment / Booking Action to a card-payment action, the training-card panel appears automatically.

## Real Sailing Search

- 30-day maximum date window, matching the Seaweb training search workflow.
- Choose exactly one primary search option: Destination, Embarkation Port, or Ship.
- Vacation Length is optional.
- Uses public NCL.com itinerary data only; internal Seaweb inventory, exact cabin attributes, internal promo codes, and policy dates are never inferred from public results.
- Uses Cloudflare Browser Run to render JavaScript-heavy public NCL result pages when available, with raw-fetch fallback and caching.

## Saved Scenario Library

Scenarios remain browser-local in V1.4 and can be filtered by:
- Department
- Training Day
- Scenario focus/title/ship/destination

Export and Import JSON remain available for backup.

## Deployment

This project is designed for Cloudflare Workers with static assets.

```bash
npx wrangler deploy
```

The Worker requires the browser binding included in `wrangler.toml`:

```toml
[browser]
binding = "BROWSER"
```


## V1.5 – NCL brand refresh + searchable sailing menus

- Applies the NCL 2026 brand palette with Sand as the application background and Aqua / Medium Blue / Teal primary accents.
- Uses Poppins as the Google Font substitute for Greycliff CF.
- Adds the user-provided official black NCL shield + tagline lockup to the application header.
- Replaces the browser-native datalist with a custom searchable dropdown for Destination, Embarkation Port, and Ship.
- Supports browse, type-to-filter, keyboard navigation, selected-state checkmarks, and free-text searches.
- Preserves the existing V1.4 curriculum, training-card, library, validator, and Browser Run sailing-search logic.


## V1.6 – New-hire trainee layout

V1.6 restructures generated scenarios around how new hires work through a call instead of presenting the exercise as one long reference document.

Trainee view now includes:
- **Your Call**: short natural customer story.
- **Guest Request at a Glance**: compact sailing, stateroom, promotion, protection, payment and special-request cards.
- **Complete These Tasks**: an ordered workflow checklist.
- **Progressive Call Flow Support**: guided on Day 6, supported on Day 7, lighter on Days 8–9, and intentionally more independent on Days 10–11.
- **Before You End the Call**: recap, payment/deadline, confirmation and branded-closing checks.
- **After Completion: Knowledge Check**: collapsed until the trainee finishes the operational task.

Trainer view adds:
- Learning objective
- Scenario approach
- Prerequisite skills
- Expected workflow
- Expected completion state
- Common mistakes to watch for
- Trainer check / answer guide
- Public-source metadata

Quality fixes:
- ADA / accessible scenarios automatically select **ADA / Accessible** instead of a standard Balcony category and leave location/side availability-driven.
- Outbound agency display is simplified to **Market / Currency | Agency ######** instead of repeating the number.
- Curriculum defaults now auto-toggle FAS, travel protection and prepaid service charges when those components are explicitly part of the selected training focus.


## V1.7 – Teams & Outlook share cards

The Scenario Generator now includes a **Share Card** menu in the scenario output toolbar.

- **Copy as Image** — recommended for Microsoft Teams and email. Copies a high-resolution PNG of the trainee-facing scenario so the visual design stays consistent.
- **Copy Editable** — copies rich HTML plus a plain-text fallback. This is useful when recipients need to select or copy the wording; exact formatting can vary depending on the receiving application.
- **Copy Plain Text** — simple fallback.

All share options automatically exclude the **Trainer Guide / trainer-only content**, even when the trainer is currently in Trainer View. Collapsible trainee sections are expanded in the shared copy so no required instructions are hidden.
