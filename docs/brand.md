# Wupiko

Wupiko is a round, glossy sunseed with a three-lobed flame crest that fades from tangerine to honey, stubby fins, a cream belly, rosy cheeks and tiny plum feet. The taller middle crest keeps the silhouette readable at icon size.

## Personality and moods

Wupiko is cheerful, a little dramatic about mornings and loves being booped. The mascot is drawn live with `react-native-svg` (`src/ui/Mascot.tsx`), so every mood animates:

| Mood | Face | Where |
| --- | --- | --- |
| Awake | Sparkly eyes, cat-like "w" mouth, blinks at random | Home hero by day, editor, welcome |
| Sleepy | Closed eyes, periwinkle nightcap, floating "z"s | Empty state, night-time hero, editor at night |
| Happy | `^ ^` eyes, open grin, fins up | Confirmations, settings, onboarding |
| Ringing | Wide eyes, shouting mouth, shaking with sound waves | Ringing screen |
| Wink | One eye closed | Reaction to a boop |

Tapping Wupiko squishes it, makes it hop and pops a speech bubble with a quip. Every seventh boop gets a count. All looping motion stops when the device asks for reduced motion; blinking and bubbles remain. Ringing always offers an immediately accessible Stop Alarm action.

## Time-of-day skies

Skies follow the part of the day: dawn (5–9), day (9–17), dusk (17–21) and night. The home hero follows the current time, alarm cards take their sticker and tint from their own hour, and the editor preview changes as you scroll the time picker while Wupiko comments on the choice. Clouds drift by day; stars twinkle at night.

## Artwork

`python3 scripts/render-brand.py` (needs `rsvg-convert`) renders the static PNG/SVG moods in [assets/brand](../assets/brand), the app icon (Wupiko on a sunrise), the transparent Android adaptive foreground, the splash art and the Android native ringing drawable. Its geometry mirrors `WupikoArt`; change both together. The wordmark is outlined for consistent rendering across platforms.

## Colour and type

| Role | Light | Dark |
| --- | --- | --- |
| Page | Cream · #FFF8EC | Night plum · #1D1830 |
| Primary text | Plum ink · #2E2340 | #FFF4E2 |
| Supporting text | #76698A | #B7ABCB |
| Primary button | Sunny #FFC83D on a #E79A12 edge, ink label | Sunny #FFC83D on a #C77F0B edge |
| Accent | Coral · #FF6B4A | Peach · #FF9A7A |

Candy accents: sun #FFC83D, coral #FF6B4A, pink #FF8FB1, mint #5FD3A8, sky #6EC6FF and lilac #A98BFF. Buttons, cards and chips are "candy" shapes with a thicker bottom edge that squish when pressed. The alarm switch is a sun when on and a moon when off.

Bricolage Grotesque supplies the lowercase wordmark, headlines, times and speech bubbles. The bundled Latin subset uses optical size 48 and weight 680. System typography handles instructions and settings, and the time picker follows the device's clock format. The SIL Open Font License is bundled in [assets/fonts](../assets/fonts).
