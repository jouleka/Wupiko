# Wupiko

Wupiko is a sunseed with a three-lobed flame crest, upturned side fins, a pear-shaped body and tiny charcoal feet. The face leans to one side. That asymmetry and the taller middle crest distinguish the silhouette at icon size.

The awake expression introduces the app. Closed eyes belong to the quiet home state. A broad smile confirms a saved alarm, and the bright-eyed open mouth accompanies ringing. The small breathing motion respects the device’s reduced motion preference. Ringing always offers an immediately accessible Stop Alarm action.

## Artwork

The editable SVG files and transparent PNG illustrations live in [assets/brand](../assets/brand). The mobile UI uses the transparent illustrations and the outlined wordmark. Keep the source aspect ratios intact. Allow clearance around the top crest and side fins. Use the full opaque icon for iOS and the padded transparent foreground on an apricot background for Android adaptive masks. The splash art has its own transparent canvas.

Run `python3 scripts/render-brand.py` with `rsvg-convert` installed to regenerate the mascot, icon, adaptive foreground and splash exports from the vector paths. The wordmark is outlined for consistent rendering across platforms.

## Color and type

| Role | Light | Dark |
| --- | --- | --- |
| Page | Oat paper · #F9F5EA | Charcoal olive · #242520 |
| Primary text | #242520 | #FAF4E5 |
| Supporting text | #625F53 | #C0BDAC |
| Primary action | Clay · #A64029 | Apricot · #FFAE87 |
| Action text | #FFF9ED | #362218 |

Sunseed yellow (#FFD45D), shell shadow (#EAA647), espresso outline (#352D26) and cheek apricot (#EA8D57) stay consistent across appearances. The two illustrated horizons use warm ochre for waking and sage at night.

Bricolage Grotesque supplies the lowercase wordmark, headlines and prominent times. The bundled Latin subset uses optical size 48 and weight 680. System typography handles instructions and settings, and the time picker follows the device’s clock format. The SIL Open Font License is bundled in [assets/fonts](../assets/fonts).
