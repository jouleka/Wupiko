"""Render the Wupiko artwork with librsvg (rsvg-convert).

The geometry mirrors `WupikoArt` in src/ui/Mascot.tsx. Keep the two in step.
"""
from pathlib import Path
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
INK = "#3A2A3E"
STROKE = f'stroke="{INK}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"'


def eye(x):
    return (f'<ellipse cx="{x}" cy="108" rx="11" ry="14" fill="{INK}"/>'
            f'<circle cx="{x + 4}" cy="102" r="4.5" fill="#fff"/><circle cx="{x - 3}" cy="114" r="2" fill="#fff"/>')


def features(mood):
    line = f'fill="none" {STROKE}'
    if mood == "sleepy":
        return f'<path d="M62 108 Q74 117 86 108 M114 108 Q126 117 138 108" {line}/><ellipse cx="100" cy="128" rx="5" ry="4" fill="{INK}"/>'
    if mood == "happy":
        return (f'<path d="M62 112 Q74 98 86 112 M114 112 Q126 98 138 112" {line}/>'
                f'<path d="M84 122 Q100 146 116 122 Z" fill="{INK}" stroke="{INK}" stroke-width="4" stroke-linejoin="round"/>'
                '<ellipse cx="100" cy="134" rx="7" ry="4" fill="#FF7A8A"/>')
    if mood == "ringing":
        eyes = "".join(f'<circle cx="{x}" cy="106" r="16" fill="#fff" {STROKE}/><circle cx="{x}" cy="108" r="6.5" fill="{INK}"/>'
                       f'<circle cx="{x + 2}" cy="105" r="2" fill="#fff"/>' for x in (72, 128))
        return eyes + f'<ellipse cx="100" cy="136" rx="10" ry="12" fill="{INK}"/><ellipse cx="100" cy="142" rx="6" ry="4" fill="#FF7A8A"/>'
    return eye(74) + eye(126) + f'<path d="M90 124 Q95 131 100 125 Q105 131 110 124" {line}/>'


def character(mood):
    cheer = mood in ("happy", "ringing")
    out = ['<defs><linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE680"/><stop offset="1" stop-color="#FFC23A"/></linearGradient>'
           '<linearGradient id="c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF8A3D"/><stop offset="1" stop-color="#FFC23A"/></linearGradient></defs>',
           f'<ellipse cx="78" cy="186" rx="16" ry="9" fill="{INK}"/><ellipse cx="122" cy="186" rx="16" ry="9" fill="{INK}"/>']
    arm = f'fill="#FFD24D" stroke="{INK}" stroke-width="5"'
    if cheer:
        out.append(f'<ellipse cx="30" cy="92" rx="11" ry="19" transform="rotate(-28 30 92)" {arm}/><ellipse cx="170" cy="92" rx="11" ry="19" transform="rotate(28 170 92)" {arm}/>')
    else:
        out.append(f'<ellipse cx="27" cy="142" rx="10" ry="17" transform="rotate(50 27 142)" {arm}/><ellipse cx="173" cy="142" rx="10" ry="17" transform="rotate(-50 173 142)" {arm}/>')
    out.append(f'<path d="M80 60 C68 50 66 36 76 30 C80 40 86 44 92 46 C88 32 94 16 106 8 C108 22 114 34 116 46 C122 38 132 34 142 38 C136 46 130 56 124 62 Z" fill="url(#c)" {STROKE}/>')
    out.append(f'<path d="M100 46 C146 46 172 86 172 128 C172 164 142 184 100 184 C58 184 28 164 28 128 C28 86 54 46 100 46 Z" fill="url(#b)" stroke="{INK}" stroke-width="5"/>')
    out.append('<ellipse cx="100" cy="156" rx="42" ry="22" fill="#FFF3C4" opacity=".85"/>')
    out.append('<ellipse cx="66" cy="74" rx="13" ry="7" transform="rotate(-38 66 74)" fill="#fff" opacity=".75"/><circle cx="54" cy="90" r="3.5" fill="#fff" opacity=".75"/>')
    blush = ".95" if cheer else ".75"
    out.append(f'<ellipse cx="58" cy="128" rx="12" ry="7" fill="#FF8FA3" opacity="{blush}"/><ellipse cx="142" cy="128" rx="12" ry="7" fill="#FF8FA3" opacity="{blush}"/>')
    out.append(features(mood))
    if mood == "sleepy":
        out.append(f'<path d="M58 78 C62 44 96 30 124 36 C150 42 170 62 176 92 C170 96 164 92 160 86 C154 68 146 62 140 62 C126 66 100 64 58 78 Z" fill="#8C9BFF" {STROKE}/>'
                   '<path d="M56 80 C90 62 126 58 146 62" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round"/>'
                   f'<circle cx="174" cy="98" r="10" fill="#fff" stroke="{INK}" stroke-width="5"/>')
    return "".join(out)


def render(svg, dest, size, save_vector=True):
    if save_vector:
        dest.with_suffix(".svg").write_text(svg + "\n")
    subprocess.run(["rsvg-convert", "-w", str(size), "-h", str(size), "-o", dest, "-"], input=svg.encode(), check=True)


def svg(contents, viewbox="0 0 200 200"):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{viewbox}">{contents}</svg>'


for mood in ["awake", "sleepy", "happy", "ringing"]:
    render(svg(character(mood)), ASSETS / "brand" / f"wupiko-{mood}.png", 480)
shutil.copy(ASSETS / "brand" / "wupiko-ringing.png", ROOT / "modules/wupiko-alarm/android/src/main/res/drawable-nodpi/wupiko_ringing.png")

figure = character("awake")
sky = ('<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFB38A"/><stop offset="1" stop-color="#FFE0A3"/></linearGradient></defs>'
       '<rect width="200" height="200" fill="url(#sky)"/><circle cx="150" cy="58" r="30" fill="#FFF3C9" opacity=".7"/>'
       '<path d="M-10 168 Q60 138 120 156 T210 150 V210 H-10 Z" fill="#F7A673"/>')
render(svg(sky + '<g transform="translate(22 26) scale(.78)">' + figure + '</g>'), ASSETS / "icon.png", 1024)
render(svg('<g transform="translate(46 44) scale(.54)">' + figure + '</g>'), ASSETS / "adaptive-icon.png", 1024)
render(svg(figure, "-10 -10 220 220"), ASSETS / "splash.png", 600)
