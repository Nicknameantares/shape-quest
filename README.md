# Shape Quest

A daily logic trainer for kids and adults: which figure goes in place of the question mark?

- 10 new puzzles every day at midnight (local time), from easy to hard.
- Three difficulty levels: easy (for kids), normal (levels 1–10), hard (for adults).
- Several players on one device, each with their own score, streak and difficulty.
- Hints that explain the rule, plus a practice mode with extra sets.
- English and Russian.

Puzzles are generated in the browser from the date, so everyone with the same date and difficulty gets the same set. Progress is stored in the browser (localStorage); the “Move progress” code transfers it to another device.

## Pages
- `index.html`: landing with a countdown, a playable sample, today's set and a 7-day archive.
- `play.html`: the trainer.

## Run locally
Open `index.html` in a browser, or serve the folder: `python3 -m http.server`.

## Deploy
GitHub Pages: Settings → Pages → Deploy from a branch → `main` / root.
