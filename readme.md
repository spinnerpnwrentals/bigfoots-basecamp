# Bigfoot's Basecamp Scavenger Hunt: Test deployment

A static, browser-only guest portal and scavenger hunt for Bigfoot's Basecamp in Snoqualmie Pass, Washington. The app uses HTML, CSS, and vanilla JavaScript only. Guest progress and admin edits are stored in `localStorage` on the current device.

## Structure

- `index.html` controls the homepage and scavenger hunt.
- `styles.css` controls the shared guest portal styling.
- `script.js` controls the scavenger hunt, progress, completion state, and admin mode.
- `_redirects` serves the app at `/scavenger` and `/scavenger/` on Netlify.
- `assets/images/`, `assets/icons/`, and `assets/backgrounds/` are reserved for future visual assets.
- Guest portal placeholder pages live in `guest-guide/`, `explore/`, `food-coffee/`, `mountain-conditions/`, `hot-tub/`, `family-activities/`, `bigfoot-sightings/`, `reviews/`, and `book-direct/`.

The official logo lives at `assets/images/bigfoots-basecamp-logo.png`.

## Deploy to Netlify

1. Keep the project folder structure intact.
2. Drag and drop the project folder into Netlify's deploy area.
3. Set the QR code destination to `https://bigfootsbasecamp.com/scavenger`.
4. The included `_redirects` file serves the app at `/scavenger` and `/scavenger/` without a backend.

## Change Clues

Edit the `defaultBigfoots` array in `script.js`. Each Bigfoot supports:

```js
{
  name: "Bigfoot #1",
  clue: "Where snowy boots rest after an adventure.",
  hint: "Look near the entry or mudroom where guests naturally leave footwear."
}
```

Guests can also use the hidden Admin button at the bottom of the page to edit clues locally on a device.

## Add Bigfoots

Add another object to the `defaultBigfoots` array in `script.js`, or use Admin Mode and choose "Add Bigfoot." The progress bar automatically adapts to any number of entries.

## Change Password

Update `DEFAULT_PASSWORD` near the top of `script.js`.

## Reset Progress

Use Admin Mode and choose "Reset Progress." To fully clear all local edits and found states, use "Restore Default Hunt" or clear the browser's site data for this domain.

## Customize Colors

Edit the CSS variables at the top of `styles.css`, especially `--forest`, `--moss`, `--cedar`, `--copper`, `--paper`, and `--cream`.

## Replace Images

The current design uses CSS textures and does not require image files. Add future photos or icons inside:

- `assets/images/`
- `assets/icons/`

Then reference them from `index.html` or `styles.css`.

## Future Features

The JavaScript is structured around a central hunt state and render functions so future features can be added cleanly, including QR check-ins, photo uploads, leaderboards, seasonal hunts, AI hints, guest accounts, and direct booking integrations.
