# Handoff: Oklahoma Golf Guide: maps, statuses, OSM tools (Nov 6–8 2026)
Created: 2026-11-08 14:37 | Working dir: C:\Users\pboyd\OneDrive\Documents\GitHub\oklahoma-course-workshop

## Goal
Keep improving the Oklahoma Golf Guide site (https://bamamba85.github.io/oklahoma-course-workshop/) for the owner,
who builds the courses in PGA Tour 2K25. House rules are in C:\Users\pboyd\OneDrive\Documents\GitHub\CLAUDE.md (read it first).

## Status
Everything is published. origin/main = 185adeb, working tree clean. No task is in progress.

## Done (all pushed; newest first)
- 185adeb: cart paths + clubhouse collected per course (update_hole_map.extras()) and listed in the course page "Hole shapes" text; statewide refresh of 115 courses. Service roads excluded.
- 6112325: Fairview Lakeside CC renamed "Legacy Golf Course" (slug kept: fairview-lakeside-country-club), the duplicate legacy-golf-course entry moved to Build Kit\data\excluded.json (guide = 244 courses); "Not Confirmed" pill on home list; Pawhuska, Gil Morgan, Comanche Nation, The Acre, Wetumka notes/contacts updated.
- a6cd37a: Fire Ridge (ex-Peoria Ridge) Active; confirmed by live TeeQuest tee times on Nov 8.
- e4cfa2b: 5 courses with nothing mapped set to "Aerial only" (No OSM); build_site.py forces No OSM when there are no hole lines and no turf shapes.
- 10d445a: "Done by Others" removed from the All statuses filter (it's a tab).
- 2a77660: all hole-map pictures redrawn (C:\Users\pboyd\OneDrive\Documents\GitHub\Build Kit\hole_map_style.py: fairways/greens/tees/bunkers, no water, color key); course page Hole map tab is a zoomable Leaflet map (holemap() in app.js); multipolygon fairways now read (parse()/rings() in update_hole_map.py; refresh_shapes.py statewide); statuses changed; strict Hole shapes rating; editor Shapes on/off; button "Download Course Preview".
- 6f3dd30: editor Export to OSM / Import from OSM; course page Check OpenStreetMap (Overpass from browser) + Copy update request; OSM revision stamps in maps.json (`osm`); back-button loop fix.
- Atoka Trails, Alva, Shangri-La Champions, Elk City now full OSM maps.
- Skills in C:\Users\pboyd\.claude\skills: /publish ("Fetch to Push", auto-pushes), /checkme ("Check me": fetch, report, pull, then a "Check me report").
- Git on this PC is signed in (Windows Credential Manager `git:https://github.com`), so pushes from here work.

## Decisions (settled — don't reopen)
- Statuses: No OSM / Partial OSM / Full OSM are automatic (build_site.py `os`); In Progress, LIDAR done, Built, Done by Others are the owner's and override. Saved localStorage values unchanged ("In progress" shown as "In Progress"). Owner asked for this order.
- Hole shapes ✓ = a green for every hole plus fairways or bunkers (strict, owner's choice). Fairway-count requirement NOT added (only 3 courses would change after the multipolygon fix; owner never chose).
- Owner-drawn traces count as Full/Partial hole map (he uploads them to OSM).
- No water drawn anywhere; shape colors fixed (owner chose softer darker-green fairway outline).
- Cart paths/clubhouse: text only, not drawn, not in rating. Service roads excluded (owner).
- Course page downloads: only "Download Course Preview" (img/holes JPG). GeoJSON download dropped (TGC reads OSM itself).
- Slugs never change (statuses keyed by slug).

## User preferences & constraints
- Plain, short answers; show previews before publishing; he says "publish" → run /publish (commit + auto push).
- Before site changes: fetch/pull first (Daegan97 may push). Never force push.
- Test on local server http://127.0.0.1:8766 (port 8765 belongs to another session). Preview artifact: https://claude.ai/artifact/HRaUpBmEkcQKa4K44y7bMd via Build Kit\preview_sync.py <scratchpad>\preview\site then --done.
- Cite a source in the course `note` for any fact change; back up data files before big edits.
- Build statuses live per browser; PC↔phone sync is via Download my progress / Restore progress (file oklahoma-workshop-progress.json). He declined automatic sync for now.
- He wanted the Store List rename forgotten (unrelated).

## Dead ends
- Hole editor in the Claude app's browser pane: downloads are silently dropped there (Export/Download for Claude look like they work but no file). Use Chrome/Edge.
- overpass.kumi.systems is down; app.js uses overpass-api.de + maps.mail.ru in parallel.
- Per-course Overpass queries for backfills are too slow; use one statewide download (refresh_shapes.py / backfill_osm_stamps.py pattern).

## Key files
- C:\Users\pboyd\OneDrive\Documents\GitHub\CLAUDE.md: house rules and all script docs (updated through 185adeb).
- C:\Users\pboyd\OneDrive\Documents\GitHub\Build Kit\update_hole_map.py: OSM pull (parse, kind, extras, pick, stamp, draw).
- C:\Users\pboyd\OneDrive\Documents\GitHub\Build Kit\refresh_shapes.py: statewide turf + cart path/clubhouse refresh.
- C:\Users\pboyd\OneDrive\Documents\GitHub\Build Kit\hole_map_style.py / redraw_hole_maps.py: picture style / redraw.
- C:\Users\pboyd\OneDrive\Documents\GitHub\Build Kit\build_site.py: site data (sh, shp, os, ob, osm, nclub).
- C:\Users\pboyd\OneDrive\Documents\GitHub\oklahoma-course-workshop\app.js (v=31), app.css (v=29), draw.js (v=29).

## Open questions / possible next work (only if he asks)
- "Copy for Claude" + /holes routine (read hole drawing from the clipboard) was planned, never approved or built.
- Unconfirmed courses left: Comanche Nation, Five-Hole, Pawhuska, The Acre, Wetumka.
- OSM upload files waiting for him in C:\Users\pboyd\OneDrive\Documents\GitHub\OSM Uploads (River Bend North holes 8–9 still not in OSM).
- New Build Kit scripts aren't in the repo; Daegan needs them via /senddaegan.
- His printed cheat sheet still lacks /publish, /checkme and the new statuses.

## How to verify state
- In the repo: git status -sb (expect `## main...origin/main`, clean) and git log -1 (185adeb).
- python -m http.server 8766 in the repo, open http://127.0.0.1:8766/course.html?c=arrowhead-state-park-golf-course (zoomable map; Hole shapes ends "· clubhouse · 7.7 km of cart paths").
