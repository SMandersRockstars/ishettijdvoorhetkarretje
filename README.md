# Tijd voor het Karretje 🚗

Welkom bij deze GitHub-repository!

## 🚀 Enterprise-Grade Refactoring Complete!

We've successfully refactored the codebase into a clean, maintainable structure while keeping it simple with plain HTML, CSS, and JavaScript.

### 📁 New Project Structure

```
src/
├── index.html          # Main HTML file
├── config.json         # Party time defaults and date overrides
├── styles/
│   └── main.css        # All styles separated
├── js/
│   ├── timeManager.js  # Time calculations and state management
│   ├── coinCursor.js   # Interactive coin effects
│   └── main.js         # Application initialization
└── assets/             # All images and videos
```

### 🛠️ Development

**Local Development:**
```bash
node serve.js
```
Then visit `http://localhost:3000`

**Docker Development:**
```bash
docker-compose up --build
```
Then visit `http://localhost:6969`

### ✨ Improvements Made

- **Modular JavaScript**: Separated concerns into focused modules
- **Clean CSS**: All styles in dedicated file
- **Better Organization**: Logical file structure
- **Maintainable Code**: Easy to understand and modify
- **Development Server**: Simple local development setup

### ⏰ Time Overrides

Party time defaults to Friday 16:00. To change the time for a specific date (e.g. Carnaval), edit `src/config.json`:

```json
{
  "defaultPartyTime": { "hour": 16, "minute": 0 },
  "overrides": [
    { "date": "2026-02-13", "hour": 15, "minute": 30, "reason": "Carnaval vrijmibo" }
  ]
}
```

Add entries to `overrides` with a `YYYY-MM-DD` date to set a custom start time for that Friday. If the config can't be loaded, it falls back to 16:00.

### 🧪 Testing

**To test "Party Time" (Het Karretje time) without waiting for Friday:**

1. Open the browser console (F12)
2. Run this command:
   ```javascript
   window.timeManager.toggleTestMode()
   ```
3. The page will immediately switch to party mode! 🎉
4. Run the same command again to toggle it off

This is useful for testing the party time animations, effects, and seasonal themes.

### 🚜 FULL PULL — tractor pulling minigame

On the main page there is a **FULL PULL** button (bottom-left). It opens a full-screen
overlay where you drag the company karretje 100 m down the track, tractor-pull style.

Controls (keyboard only):

| Key | Action |
|-----|--------|
| `A` / `←` | clutch — **held down = disengaged** |
| `L` / `→` | gas — held down = on it |
| `Space` | start / restart |
| `Esc` | close |

How to drive it: hold the clutch in, rev the engine, then let the clutch come up
*slowly*. Release too fast and the engine is dragged down or over-revs and blows.
Release too slowly and you stall. Once hooked up, ride the edge of grip — too much
gas and the tyres break away, which buys you smoke, no distance and a tyre that
destroys itself in about two seconds of full slip.

The physics lives in `src/utils/pullSim.js` as a pure, framework-free module with a
fixed internal timestep. It is covered by unit tests:

```bash
npm test          # node --test tests/*.test.js
```

High score is stored in `localStorage` under `karretje-full-pull-highscore`.
Track grip is randomised per run (dry / damp / wet / mud). Sound is synthesised and
respects the "volledige ervaring" gate; animation respects `prefers-reduced-motion`.

## Feedback en bijdragen!!

Heb je ideeën voor verbeteringen, nieuwe functionaliteiten, of wil je gewoon meedenken over het karretje?  
Maak dan gerust een nieuw **Issue** aan! Zo kunnen we samen sparren over mogelijke implementaties en deze legendarische tool nóg beter maken.

Pull requests zijn ook welkom — maar overleg via een Issue wordt aangemoedigd als startpunt voor discussie 💬

## Doel van deze repository

Deze repository wordt gebruikt om bij te houden wanneer het **tijd is voor het karretje**.  
Oftewel: een handige manier om te registreren, herinneren of automatiseren wanneer we weer kunnen gaan 🛒, 🍻, 🥳, of wat jouw definitie van "het karretje" ook is.

## Wat je hier kunt vinden

- Logs of timestamps van eerdere karretje-momenten
- Scripts of tools om meldingen te sturen
- Notities of ideeën rondom het concept "het karretje"
- Experimentele code om het karretje automatisch te detecteren 👀

Blijf rollen, blijf bouwen – en vergeet het karretje niet.

Wacht niet langer in spanning en klik     
## →→→→→  [HIER](https://ishettijdvoorhetkarretje.nl/)  ←←←←←
