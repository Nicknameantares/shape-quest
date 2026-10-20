# Shape Quest

A daily logic trainer for kids and adults: find the missing figure, spot the odd one out, say what comes next.

- 10 new puzzles every day at midnight (local time), from easy to hard, mixing three kinds:
  - **Missing figure**: a 2×2 or 3×3 grid with a gap.
  - **Odd one out**: five pictures, four share a rule (shape, color, opposite sectors, round inside straight, cell count, inner polygon with one side fewer, symmetry, half-black circles facing outward, turned vs. mirrored, numbers built from the side count).
  - **What comes next**: a row that repeats, fills, turns or moves, up to turns that grow and mirror-image traps.
- A second section, **Matchsticks**: move one or two matches so an equation becomes true or a new number appears (a given number, the largest or the smallest). Same daily set of 10, same three difficulty levels; tap a match to pick it up, tap an empty place to put it down.
- Practice mode can drill one kind at a time.
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
