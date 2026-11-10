"""Render the original Wupiko artwork with librsvg (rsvg-convert)."""
from pathlib import Path
import subprocess

ASSETS = Path(__file__).resolve().parents[1] / "assets"
INK = "#352D26"
HONEY = "#FFD45D"
SHADOW = "#EAA647"
BISQUE = "#FFF4CB"
VERMILION = "#B94A32"


def path(d, fill=INK, stroke=None, width=4):
    outline = f' stroke="{stroke}" stroke-width="{width}" stroke-linejoin="round" stroke-linecap="round"' if stroke else ""
    return f'<path d="{d}" fill="{fill}"{outline}/>'


def oval(cx, cy, rx, ry, fill, transform=""):
    return f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="{fill}" transform="{transform}"/>'


def character(mood):
    sleepy = mood == "sleepy"
    bright = mood == "ringing"
    happy = mood == "happy"
    # The tiny feet lean in opposite directions under a single fluted sunseed.
    feet = path("M74 152 Q66 158 63 166 Q60 171 67 172 Q78 174 88 167 L93 152 Z")
    feet += path("M115 152 L115 164 Q116 172 132 171 Q138 170 134 166 L126 152 Z")
    body = "M51 115 Q52 95 65 78 Q75 63 86 60 Q94 56 88 47 L81 36 Q77 29 82 26 Q90 21 106 35 Q111 21 120 16 Q129 11 131 20 Q131 31 126 41 Q139 34 147 35 Q156 36 151 45 Q146 53 134 61 Q151 65 160 81 Q167 95 169 106 Q174 112 184 110 Q189 110 187 117 Q182 135 163 138 Q154 153 135 161 Q112 171 84 164 Q62 159 52 144 Q38 145 26 132 Q21 126 23 122 Q24 119 30 121 Q39 123 51 115 Z"
    outline = path(body, HONEY, INK, 4.4)
    ridge = path("M88 154 Q112 161 139 147 Q155 139 166 124 Q161 145 136 157 Q113 168 88 159 Q83 157 88 154 Z", SHADOW)
    flick = path("M72 81 Q82 68 92 67", "none", BISQUE, 5)
    # Two asymmetrical ivory eye windows and dark pupils preserve the face at icon size.
    if sleepy:
        eyes = path("M66 104 Q77 116 89 104 M112 102 Q124 113 134 100", "none", INK, 5)
    elif happy:
        eyes = path("M65 107 Q75 89 88 101 M111 101 Q121 84 135 96", "none", INK, 5)
    else:
        eyes = oval(79, 99, 15, 18, BISQUE, "rotate(7 79 99)") + oval(122, 95, 15, 19, BISQUE, "rotate(7 122 95)")
        eyes += oval(82 if not bright else 80, 100, 7, 11, INK) + oval(124 if not bright else 122, 96, 7, 12, INK)
        eyes += oval(84, 97, 1.7, 2.6, "white") + oval(126, 93, 1.7, 2.6, "white")
    cheeks = oval(64, 118, 7, 3.8, "#EA8D57", "rotate(8 64 118)") + oval(141, 110, 7.6, 4, "#EA8D57", "rotate(-14 141 110)")
    if sleepy:
        mouth = oval(100, 118, 3.8, 2.4, INK)
    elif bright or happy:
        mouth = path("M89 112 Q101 116 114 108 Q115 124 104 127 Q94 130 89 112 Z") + path("M98 122 Q104 116 112 117 Q108 127 101 125 Z", "#F39A76")
    else:
        mouth = path("M91 114 Q101 123 112 111", "none", INK, 4)
    return feet + outline + ridge + flick + eyes + cheeks + mouth


def render(svg, dest, size, save_vector=True):
    if save_vector:
        dest.with_suffix(".svg").write_text(svg + "\n")
    subprocess.run(["rsvg-convert", "-w", str(size), "-h", str(size), "-o", dest, "-"], input=svg.encode(), check=True)


def svg(contents, viewbox="0 0 208 188"):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{viewbox}">{contents}</svg>'


for mood in ["awake", "sleepy", "happy", "ringing"]:
    render(svg(character(mood)), ASSETS / "brand" / f"wupiko-{mood}.png", 480)

figure = character("awake")
render(svg('<rect width="208" height="208" fill="#F4AC76"/><g transform="translate(-6 -3) scale(1.06)">' + figure + '</g>', "0 0 208 208"), ASSETS / "icon.png", 1024)
render(svg('<g transform="translate(33 34) scale(.68)">' + figure + '</g>', "0 0 208 208"), ASSETS / "adaptive-icon.png", 1024)
render(svg(figure, "0 -10 208 208"), ASSETS / "splash.png", 600)
