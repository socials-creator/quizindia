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
- **Districts:** point out the districts of one state. Choose from the dropdown under the mode switch (alphabetical; nothing is pre-selected): **Andhra Pradesh** (28), **Goa** (3, incl. Kushavati), **Karnataka** (31), **Kerala** (14), **Sikkim** (6), **Tamil Nadu** (38), **Telangana** (33), **Tripura** (8), and **UTs except DL,JK** — one combined map of Puducherry, Andaman & Nicobar, Dadra & Nagar Haveli and Daman & Diu, Ladakh, Lakshadweep and Chandigarh with the other states shown faintly for orientation.
- **Outlines (new in v3.2):** a single state/UT outline is shown on its own; type its 2-letter licence plate code and it submits automatically after 2 letters (on-screen letter keyboard on touch devices, physical keyboard on desktop). Outlines use the same boundary data as the States & UTs mode and follow light/dark mode. Current codes are shown in brackets in this mode and in States & UTs mode (e.g. Karnataka (KA)). Only the current code is accepted (e.g. Telangana TG, Odisha OD, Uttarakhand UK, Chhattisgarh CG, Dadra & Nagar Haveli and Daman & Diu DD). The code table is `PLATE` in `script.js`.
- **Airports (new in v2.1):** point out 111 airports: India's international (incl. limited-international/customs) airports plus major domestic ones, and Warangal (Mamnoor, under redevelopment). Same-city/nearby airports use smaller tap radii (35–50 km) to limit overlap. The tap target is a ~60 km radius (35 km for same-city airports: Delhi/Noida, Mumbai/Navi Mumbai, Goa's two airports; the nearest airport within range wins) around each airport (`AIRPORT_RADIUS_KM` in `script.js`); tapping elsewhere counts as a miss. Found/missed airports reveal their tap circle. Edit the `AIRPORTS` list to add or remove airports.
- A round ends after every region in the mode is found or after 5 misses.
- Wrong taps and skips reveal the target region.
- Last 10 rounds are saved on the current device/browser. Best score is tracked separately for each mode, and your last-used mode is remembered.

## Adding more states to Districts mode
A set can also list several boundary files (`sources`, see "UTs except DL,JK"), a `parents` map (shown as "District of …"), faint `context` states, and a `split` (cut one district into two along a line).
In `script.js`, add an entry to `DISTRICT_SETS` (state name, boundary-file `slug`, the official district list, and an `aliases` map for older/variant spellings). The dropdown entry, boundary loading, scoring and best-score tracking pick it up automatically. District names are read from the boundary file, so the number of districts in a round follows the data.

## Changelog
- **v3.5** — Districts mode adds Goa, Karnataka, Kerala, Sikkim, Tamil Nadu, Tripura and a combined **UTs except DL,JK** choice (Puducherry, A&N, DNH&DD, Ladakh, Lakshadweep, Chandigarh). Goa's third district Kushavati (notified 1 Jan 2026) is not in the open boundary file, so it is cut out of South Goa along an approximate taluka boundary (Dharbandora, Sanguem, Quepem, Canacona); this is skipped automatically if the data already contains it. Ladakh's five districts created in Apr 2026 are not in the open data either, so Ladakh shows Leh and Kargil. Outlines/States modes show only current plate codes (DD for Dadra & Nagar Haveli and Daman & Diu, TG, OD, UK, CG). Airports: tap radii 30 km (IXC, GAU, Bagdogra) / 35 km (Shimla, Shillong, Pakyong). Outlines: map above the code boxes, on-screen 20-letter keypad (7/7/6) on touch devices.
- **v3.4** — Outlines on-screen keyboard now has only the 20 letters used in plate codes (A B C D G H J / K L M N O P R / S T U W Y Z, rows of 7-7-6), with larger keys and no backspace key. Desktop still accepts any letter plus Backspace from the physical keyboard.
- **v3.3** — Airports: tap radii of 30 km (IXC, GAU, Bagdogra) and 35 km (Shimla, Shillong, Pakyong); a little overlap is accepted. Outlines mode: the map now sits above the code boxes; on touch devices an on-screen A–Z keyboard replaces the phone keyboard (so the map and feedback stay visible), and the page scrolls the map into view when a round starts. On desktop, type with the physical keyboard (letters + Backspace).
- **v3.2** — New **Outlines** mode (guess each state/UT from its outline by typing its 2-letter licence plate code; auto-submits at 2 letters). Licence plate codes now appear in brackets in States & UTs mode and in answer feedback. Airports: smaller tap radii for Chandigarh/IXC (25 km, near Shimla), Guwahati/GAU (25 km, near Shillong), Bagdogra (30 km) and Pakyong (35 km). Lakshadweep islands are now drawn as small land-coloured islands in a faint lagoon (instead of black/white dots), take the found/missed colours, and are shown at a larger scale in Outlines mode. Airports tab no longer carries the “New” badge.
- **v3.1** — Airports mode now has 111 airports: 20 more operational domestic airports added in states/UTs that had fewer than 8 (Himachal Pradesh: Kangra, Shimla, Kullu-Manali; Haryana: Hisar; Sikkim: Pakyong; Meghalaya: Shillong; Arunachal Pradesh: Pasighat; Assam: Tezpur; Uttarakhand: Pantnagar; Jharkhand: Deoghar; Chhattisgarh: Bilaspur, Jagdalpur; West Bengal: Andal; Bihar: Darbhanga; Rajasthan: Kishangarh, Bikaner, Jaisalmer; Madhya Pradesh: Khajuraho; Gujarat: Porbandar; Punjab: Adampur). Close pairs use 35–45 km tap radii.
- **v3.1** — Lakshadweep: 10 small dots (Bitra, Chetlat, Kiltan, Kadmat, Amini, Agatti, Kavaratti, Androth, Kalpeni, Minicoy) mark the 10 sub-divisions in all modes (about 36% smaller than the v2.7 dots). Telangana districts: names synced with telangana.gov.in/about/districts (33 districts; “Komaram Bheem Asifabad” is now “Kumuram Bheem”, old spellings kept as aliases).
- **v2.7** — Kavaratti (capital) and Agatti (airport) are marked with dots on the map in all modes. Airports mode now has 111 airports: added 16 operational domestic airports — Andhra Pradesh (Kadapa, Kurnool), Tamil Nadu (Salem), Karnataka (Kalaburagi, Shivamogga, Ballari/Vidyanagar, Bidar), Maharashtra (Jalgaon, Nanded, Sindhudurg, Gondia, Amravati, Solapur), Puducherry, Lakshadweep (Agatti) and Dadra & Nagar Haveli and Daman & Diu (Diu). Telangana has no further operational airports beyond Hyderabad (and Warangal, already included). Every airport has a tap radius of at least 35 km (60 km by default; 35–50 km where airports are close together), so a little overlap between neighbouring circles is accepted; the nearest airport within range still wins.
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
