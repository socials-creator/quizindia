# India Map Quiz — States & Union Territories

A mobile-friendly, tap-the-map geography game based on the interaction model of the existing Where in the World pointing game.

## Files
- `index.html` — app structure and metadata
- `style.css` — responsive interface
- `script.js` — game logic, map rendering, progress, history and score

## Deploy to GitHub Pages
1. Create a new repository (or use a separate branch/repository for the India quiz).
2. Upload all files to the repository root.
3. In **Settings → Pages**, choose **Deploy from a branch**, select `main` and `/ (root)`.
4. Open the published GitHub Pages URL.

## Map and reference data
- Clickable boundaries: GeoJSON/TopoJSON from https://github.com/udit-001/india-maps-data, loaded via jsDelivr (with raw.githubusercontent fallback). Individual state/UT files fill in anything missing from the country file.
- Official political map reference and official state/UT map downloads: https://surveyofindia.gov.in/pages/political-map-of-india
- Union Territory list: Ministry of Home Affairs, https://www.mha.gov.in/union-territories-divisions

The app checks that all 28 States and 8 Union Territories are available before starting a round. D3.js and topojson-client are loaded from jsDelivr.

## Gameplay
Pick a mode with the switch at the top of the page:
- **States & UTs:** all 28 States + 8 Union Territories (36 regions).
- **Districts:** point out the districts of one state. Currently **Telangana** and **Andhra Pradesh** (28 districts incl. Markapuram and Polavaram, created Dec 2025); choose the state from the dropdown under the mode switch (alphabetical; no state is pre-selected). More states will appear in that list.
- **Airports (new in v2.1):** point out 75 airports: India's international (incl. limited-international/customs) airports plus major domestic ones, and Warangal (Mamnoor, under redevelopment). Same-city/nearby airports use smaller tap radii (30–50 km) to limit overlap. The tap target is a ~60 km radius (30–35 km for same-city airports: Delhi/Noida, Mumbai/Navi Mumbai, Goa's two airports; the nearest airport within range wins) around each airport (`AIRPORT_RADIUS_KM` in `script.js`); tapping elsewhere counts as a miss. Found/missed airports reveal their tap circle. Edit the `AIRPORTS` list to add or remove airports.
- A round ends after every region in the mode is found or after 5 misses.
- Wrong taps and skips reveal the target region.
- Last 10 rounds are saved on the current device/browser. Best score is tracked separately for each mode, and your last-used mode is remembered.

## Adding more states to Districts mode
In `script.js`, add an entry to `DISTRICT_SETS` (state name, boundary-file `slug`, the official district list, and an `aliases` map for older/variant spellings). The dropdown entry, boundary loading, scoring and best-score tracking pick it up automatically. District names are read from the boundary file, so the number of districts in a round follows the data.

## Changelog
- **v2.1** — New **Airports** mode: locate India's international airports with a 25 km tap radius.
- **v2.6** — Airport names now follow the format “Official name without ‘airport’ (IATA code)”, e.g. Rajiv Gandhi Int’l (HYD), Alluri Sitarama Raju Int’l (VTZ), Warangal (WGC). “Int’l” is used where the official name includes “International”.
- **v2.5** — Airports mode now has 75 airports: added Warangal (Mamnoor, WGC — under redevelopment, no scheduled service yet) and 19 more domestic airports (Gorakhpur, Hubballi, Belagavi, Mysuru, Rajahmundry, Jabalpur, Kolhapur, Nashik, Jamnagar, Bhuj, Prayagraj, Agra, Gwalior, Jorhat, Silchar, Dimapur, Aizawl, Jharsuguda, Thoothukudi). Reduced tap radii for closely spaced pairs (Gorakhpur/Kushinagar, Hubballi/Belagavi, Nashik/Shirdi, Agra/Gwalior, Jamnagar, Dimapur).
- **v2.4** — Airports mode now has 55 airports: added Patna, Bhopal, Aurangabad (Chhatrapati Sambhajinagar), Vadodara and 8 major domestic airports. Prompts label each airport International or Domestic.
- **v2.2** — Airports mode: tap radius raised to 60 km (30–35 km for same-city airports); added Navi Mumbai (NMI), Noida/Jewar (DXN), Tirupati, Shirdi, Bhubaneswar; Visakhapatnam (VTZ) moved to the new Alluri Sitarama Raju airport at Bhogapuram; corrected Mopa and Rajkot coordinates. 43 airports.
- **v2.0** — Districts mode now starts with a **Select a state** dropdown (alphabetical) instead of a default state.
- **v1.9** — Districts mode adds **Andhra Pradesh** (28 districts). If the boundary data predates a reorganisation, the round uses the districts present in the data and the map footer says how many of the official total it has.
- **v1.8** — New **Districts** mode (Telangana). Mode switcher, per-mode best score, remembered last mode, small-district tap targets, finer borders on district maps.

## Important
This is an educational quiz, not a legal or survey-grade boundary product. Map service availability, CORS policy, and map data revisions are controlled by the service provider. Check the official Survey of India reference map for authoritative use.
