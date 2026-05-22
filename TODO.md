# Duck Hunt Game — Implementation TODO

## 1. `FlyingGameContext.jsx` — Game State Machine ✅
- [x] Create context with: `score`, `lives`, `round`, `isPlaying`, `highScore`, `combo`, `targetsSpawned`, `targetsHit`
- [x] Persist `highScore` in `localStorage`
- [x] Actions: `startGame`, `incrementScore`, `loseLife`, `nextRound`, `endGame`, `recordHit`, `recordMiss`
- [x] Round completion logic: all targets either hit or escaped
- [x] Difficulty scaling per round

## 2. `useGameSounds.jsx` — Audio Effects ✅
- [x] Hit sound (reuse existing hitmarker)
- [x] Miss sound (swoosh)
- [x] Round start fanfare
- [x] Game over sound
- [x] Combo escalating beep
- [x] All via Web Audio API, no external files

## 3. Refactor `FlyingImage.jsx` — Game Integration ✅
- [x] Accept game callbacks: `onHit`, `onMiss`
- [x] Track miss when target flies off screen without being clicked
- [x] Speed scales with round number (reduce duration range)
- [x] Support rendering multiple concurrent targets via context
- [x] Duck wobble animation (subtle sine-wave offset while flying)

## 4. `GameOverlay.jsx` — HUD + Screens ✅
- [x] HUD: score, lives (❤️), round, combo indicator
- [x] Start screen: "JAGEN!" button + high score display
- [x] Game over screen: final score, high score, "Opnieuw?" button
- [x] Round transition: brief "Round N" flash
- [x] z-index: 10000 (above FlyingImage's 9997)

## 5. `GameTrigger.jsx` — Start Button
- N/A — merged into GameOverlay as StartScreen

## 6. Wire Up in `App.jsx` ✅
- [x] Wrap with `FlyingGameProvider`
- [x] Add `GameOverlay` and ScreenShake
- [x] Conditional: periodic fly vs game mode

## 7. Polish ✅
- [x] Floating "+100" score popup on hit (at click position, fades up)
- [x] Combo indicator (pulsing text that grows)
- [x] Screen flash on perfect round
- [x] Score popup component

### Difficulty Scaling

| Round | Targets | Speed | Miss Penalty |
|-------|---------|-------|-------------|
| 1 | 3 | Normal | None |
| 2 | 4 | 10% faster | None |
| 3+ | +1/round | +10%/round | -1 life |

### Scoring

- Hit: +100 × combo multiplier (max 5x)
- Miss (duck escapes): -50, combo reset
- Perfect round (all hit): +200 bonus
- Combo resets on miss
