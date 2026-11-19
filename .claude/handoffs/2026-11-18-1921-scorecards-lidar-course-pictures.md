# Handoff: Oklahoma Golf Guide — scorecards, LIDAR tile map, 2K25 course pictures
Created: 2026-11-18 19:21 | Working dir: C:\Users\pboyd\OneDrive\Documents\GitHub\oklahoma-course-workshop

## Goal
Keep improving the owner's Oklahoma Golf Guide (site + Build Kit) for building courses in PGA Tour 2K25. Recent focus:
printable scorecards on the site, per-course LIDAR tile picking, tee data cleanup, and reading his 2K25 .course files.

## Status
Everything is published (last commit b5f5e72); GitHub matches local; nothing pending. Read
C:\Users\pboyd\OneDrive\Documents\GitHub\CLAUDE.md first (house rules, paths, routines) and the memory index.

## Done (Nov 17–18 2026)
- 148 printable scorecards (make_scorecard.py) incl. closed Coffee Creek, Silverhorn, Thundercreek, White Hawk, Cedar Crest;
  PDFs in C:\Users\pboyd\OneDrive\Golf Courses\Web Course Files\Scorecards, slideshow JPGs in ...\Scorecards\Pictures
  (NNN name.jpg, name order), contact sheet C:\Users\pboyd\OneDrive\Documents\GitHub\Scorecards Contact Sheet.pdf.
- Card rules from his slideshow review: city+state under title, designer small bottom-right, clubhouse from OSM else
  `clubhouse_pin` else his Google Earth `pin`, two-colour tees colour row in one colour (never black first), "Web" rows
  dropped, combo tees dropped past 8 rows, women's handicap row only if different, Roman numerals upper-case.
- Site: Download scorecard button (PC only) + full-width card picture (1600 px; phones picture only); build_site.py copies
  cards to Website\files\scorecards and img\scorecards (`sc` flag). app.js `sclink()`.
- Tee data fixed from GolfTraxx/GolfPass/BlueGolf for ~25 courses (each with source in `card_note`); new tee colour `cream`.
  No "Web" rows remain. Oak Tree East/West/National renamed to Pro/Champ/Mens/Womens/Juniors (black/blue/white/red/green).
- Shangri-La courses' town = Afton (owner visited); clubhouse_pin 36.563090,-94.841489 on Heritage/Legends + Champions.
- Show LIDAR: compact numbered file list under the map, tile<->file highlight (separate non-interactive layer),
  click yellow tile downloads. LIDAR lists changed: Indian Springs Windmill (6 tiles), Mohawk Pecan Valley (10 tiles).
- Hole map zoom re-fits on resize (holemap() ResizeObserver). Excel database repair fixed (package.py: tee columns
  case-insensitive). app.js?v=74, app.css?v=68.
- Silverhorn: holes 11, 16, 17, 18 drawn as stand-ins from his 2K25 build (features `standin: true`,
  record C:\Users\pboyd\OneDrive\Documents\GitHub\Build Kit\data\traced\silverhorn-golf-club.geojson), layout Full (owner).
- New script C:\Users\pboyd\OneDrive\Documents\GitHub\Build Kit\course_picture.py: bird's-eye picture from a 2K25 .course
  file; `--slug` lines it up with the guide's holes and uses OpenStreetMap water + streams; `--compare` adds a side-by-side
  with the USGS aerial. Output for Silverhorn in C:\Users\pboyd\OneDrive\Golf Courses\Web Course Files\Course Pictures.

## Next steps
1. Nothing queued. Likely asks: more course pictures from his .course files
   (C:\Users\pboyd\OneDrive\Documents\My Games\PGA TOUR 2K25\Courses\Published), more tee cards, LIDAR tile edits.
2. After any tee/hole change: make_scorecard.py <slug>, renumber JPGs, scorecard_sheet.py, build.py, then offer publish.

## Decisions (settled — don't reopen)
- LIDAR: he picks tiles himself via Show LIDAR; "check lidar <course>" only on request; no statewide runs (keeps USGS traffic down).
- Keep tile lists he chooses even if >6 (Windmill 6, Pecan Valley 10) — his call.
- Sulphur Hills stays on Golfify's Blue card (GolfPass hole order doesn't fit the map). Riverlinks: no card found.
- Westwood Park keeps the city's May 2026 card with GolfTraxx colours. Quail Creek uses GolfTraxx's card.
- Scorecard JPG-instead-of-PDF plan is shelved (memory scorecard-jpg-plan.md): show it again only if he mentions it.
- Silverhorn stand-in holes stay out of OpenStreetMap; re-add from the traced file if update_hole_map.py is run.

## User preferences & constraints
- He and his wife use iPhones with the guide on the home screen (left-edge swipe = Back).
- Publish only when he says "publish" (/publish routine); never force push; back up courses.json before edits; cite sources.
- Local test server is the default preview: preview_start "golf-guide" (http://127.0.0.1:8765).
- OSM: his old account Bamamba85 is still blocked (checked Nov 17); hold OSM uploads until the DWG replies.
- He uses TGC Golf Tools 0.4.5 (chadrockey logic): "Match Hole Names" must match exactly (a hidden space broke River Bend South).

## Dead ends
- Windows' WPF decoder can't read iPhone HEIC photos; use pillow-heif (installed) with ImageOps.exif_transpose.
- trace_hole_map.py would drop a course's cart paths/OSM records; for partial courses add holes to the shapes file directly.
- Game water squares look blocky from above; use OSM water via --slug instead.

## Key files
- C:\Users\pboyd\OneDrive\Documents\GitHub\CLAUDE.md: project rules and how everything works (updated this session)
- C:\Users\pboyd\OneDrive\Documents\GitHub\Build Kit\make_scorecard.py: printable cards
- C:\Users\pboyd\OneDrive\Documents\GitHub\Build Kit\course_picture.py: 2K25 .course -> picture
- C:\Users\pboyd\OneDrive\Documents\GitHub\Build Kit\build_site.py, package.py: site data / Excel
- C:\Users\pboyd\OneDrive\Documents\GitHub\oklahoma-course-workshop\app.js: site behaviour (lidarCheck, holemap, sclink)
- Workshop To-Do artifact: https://claude.ai/artifact/NEWrPPGdc5vn7PgxvYwD67 (db `tasks`)

## How to verify state
- In the site folder: git status -sb (should be main...origin/main), git log -1 (b5f5e72).
- python course_picture.py "<.course>" --slug <slug> --compare  (from Build Kit) runs end to end.
