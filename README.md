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
