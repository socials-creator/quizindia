# India Map Quiz — States & Union Territories

A mobile-friendly, tap-the-map geography game based on the interaction model of the existing Where in the World pointing game.

## Files
- `index.html` — app structure and metadata
- `style.css` — responsive interface
- `script.js` — game logic, map rendering, progress, history and score

## Deploy to GitHub Pages
1. Create a new repository (or use a separate branch/repository for the India quiz).
2. Upload these three files to the repository root.
3. In **Settings → Pages**, choose **Deploy from a branch**, select `main` and `/ (root)`.
4. Open the published GitHub Pages URL.

## Map and reference data
- Clickable administrative boundaries: Esri India Living Atlas `LivingAtlas/IND_AdminBoundary/MapServer/1` state layer. The parent map service credits Survey of India.
- Official political map reference and official state/UT map downloads: https://surveyofindia.gov.in/pages/political-map-of-india
- Union Territory list: Ministry of Home Affairs, https://www.mha.gov.in/union-territories-divisions

The app checks that the boundary service returns all 28 States and 8 Union Territories before starting a round. It uses the service online; the game interface and saved score/history use browser local storage. D3.js is loaded from jsDelivr.

## Gameplay
- **All regions:** 28 States + 8 Union Territories.
- **States:** 28 States.
- **Union Territories:** 8 UTs.
- A round ends after every region in the selected group is found or after 5 misses.
- Wrong taps and skips reveal the target region.
- Last 10 rounds and best score are saved on the current device/browser.

## Important
This is an educational quiz, not a legal or survey-grade boundary product. Map service availability, CORS policy, and map data revisions are controlled by the service provider. Check the official Survey of India reference map for authoritative use.
