#!/usr/bin/env python3
"""Builds Wupiko's public site into docs/, which GitHub Pages serves.

Run `python3 scripts/build-site.py` after changing copy here. It writes the
landing page, the guides and sitemap.xml. Images and CSS live in docs/site/.
"""
import html
import json
from datetime import date
from pathlib import Path

BASE = "https://jouleka.github.io/Wupiko/"
APP_STORE = "https://apps.apple.com/app/wupiko-wake-up-alarm/id6833561415"
APP_ID = "6833561415"
DOCS = Path(__file__).resolve().parent.parent / "docs"
TODAY = date.today().isoformat()

FAQ = [
    ("Is Wupiko free?",
     "Yes. Wupiko is free, with no ads, no in-app purchases and no account."),
    ("Can I snooze the alarm?",
     "No. Wupiko has no snooze button. A wake-up alarm is only finished once you get up and feed Wupiko some light."),
    ("What happens if I silence the alarm and stay in bed?",
     "It rings again. Hushing the alarm does not check you in, so Wupiko keeps coming back until you open the app and "
     "feed it light. If you never do, the morning counts as missed and a little rain falls on your island."),
    ("How does feeding Wupiko light work?",
     "After the alarm, Wupiko is frozen. Turn on the room lights or face a window and hold your phone there for a few "
     "seconds while it warms up. A dim bedside lamp is not bright enough, which is the point: you have to get out of bed."),
    ("Does Wupiko take photos with my camera?",
     "No. On iPhone the front camera is used only to measure how bright the room is. No photos or video are taken, "
     "stored or sent. If you would rather not allow the camera, Wupiko gives you a short mini-game instead."),
    ("Does the alarm ring if the app is closed?",
     "Yes. On iPhone, Wupiko schedules alarms with Apple's AlarmKit, so iOS itself delivers them. The app does not "
     "need to be open."),
    ("Does Wupiko collect my data?",
     "No. Everything stays on your phone. There are no accounts, no analytics and no tracking, and the app works "
     "without an internet connection."),
    ("Which phones does Wupiko work on?",
     "Wupiko is on the App Store for iPhone and iPad running iOS 26 or later."),
    ("Can I use it for reminders too?",
     "Yes. Besides wake-ups you can set plain reminders for things like lunch, water or medicine. They ring once and "
     "stop when you tap Stop, with no check-in."),
]


def page(path, title, description, body, schema=None, og_type="website"):
    url = BASE + ("" if path == "index.html" else path)
    schemas = "".join(
        f'\n<script type="application/ld+json">{json.dumps(item, ensure_ascii=False)}</script>' for item in schema or [])
    e = html.escape
    out = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{e(title)}</title>
<meta name="description" content="{e(description)}">
<link rel="canonical" href="{url}">
<meta name="apple-itunes-app" content="app-id={APP_ID}">
<meta name="theme-color" content="#FFF8EC" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#1D1830" media="(prefers-color-scheme: dark)">
<meta property="og:type" content="{og_type}">
<meta property="og:site_name" content="Wupiko">
<meta property="og:title" content="{e(title)}">
<meta property="og:description" content="{e(description)}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{BASE}site/share.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="586">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/png" href="site/favicon.png">
<link rel="apple-touch-icon" href="site/icon-180.png">
<link rel="preload" href="site/BricolageDisplay.ttf" as="font" type="font/ttf" crossorigin>
<link rel="stylesheet" href="site/style.css">{schemas}
</head>
<body>
<header class="wrap top">
  <a class="brand" href="./"><img src="site/icon-180.png" alt="" width="40" height="40" style="border-radius:10px">wupiko</a>
  <nav>
    <a class="optional" href="./#how">How it works</a>
    <a class="optional" href="./#faq">Questions</a>
    <a href="{APP_STORE}">Get the app</a>
  </nav>
</header>
<main>
{body}
</main>
<footer>
  <div class="wrap">
    <span>Wupiko, the no-snooze alarm clock. Free, private, no ads.</span>
    <nav>
      <a href="./">Home</a>
      <a href="no-snooze-alarm.html">How to stop hitting snooze</a>
      <a href="alarm-for-heavy-sleepers.html">Alarms for heavy sleepers</a>
      <a href="privacy.html">Privacy</a>
      <a href="https://github.com/jouleka/Wupiko/issues">Support</a>
    </nav>
  </div>
</footer>
</body>
</html>
"""
    (DOCS / path).write_text(out)


def aside(text):
    return f"""<div class="aside">
  <img src="site/wupiko-awake.svg" alt="Wupiko, a round yellow mascot" width="96" height="96">
  <div><p><strong>{text}</strong></p><a class="cta" href="{APP_STORE}">Get Wupiko on the App Store</a></div>
</div>"""


# ---------------------------------------------------------------- landing page
steps = [
    ("ring", "It rings. There is no snooze.",
     "Wupiko's ringing screen: a wide-eyed mascot at dawn with no snooze button",
     "One alarm, no snooze button. Hush it and it comes back."),
    ("light", "Get up and feed it real light.",
     "Light check-in: Wupiko warming up as the room gets brighter, with a light meter reading in lux",
     "Wupiko wakes up frozen. Turn on the room lights or face a window for a few seconds. A bedside lamp won't do."),
    ("story", "A new story chapter is waiting.",
     "Morning story screen: a postcard from Wupiko's night trip and the next chapter",
     "While you slept, Wupiko traveled. Each morning brings a postcard, the next chapter, and a keepsake if you stay up."),
    ("island", "Good mornings grow your island.",
     "Wupiko's island with flowers, a pond and a hut earned from good mornings",
     "Every morning you get up adds something to Wupiko's island. Missed ones only bring a little rain."),
]
steps_html = "\n".join(
    f"""    <li>
      <img src="site/screen-{name}.jpg" alt="{html.escape(alt)}" width="600" height="1303" loading="lazy">
      <h3>{n}. {title}</h3>
      <p>{text}</p>
    </li>""" for n, (name, title, alt, text) in enumerate(steps, 1))

cards = [
    ("Built for heavy sleepers", "You can't end a wake-up from under the covers. You have to stand up, reach a light and stay there."),
    ("Something to get up for", "A story that only moves forward in the morning is a nicer reason to get up than a blaring phone."),
    ("Kind, not punishing", "No streaks to lose and nothing taken away. A missed morning brings rain, and tomorrow is a fresh start."),
    ("Reminders too", "Set plain reminders for lunch, water or medicine. They ring once and stop when you tap Stop."),
    ("Private by design", "No account, no ads, no analytics. Everything stays on your phone and works offline."),
    ("Free", "No subscription and no in-app purchases."),
]
cards_html = "\n".join(f'    <div class="card"><h3>{t}</h3><p>{p}</p></div>' for t, p in cards)
faq_html = "\n".join(
    f"    <details><summary>{html.escape(q)}</summary><p>{html.escape(a)}</p></details>" for q, a in FAQ)

description = ("Wupiko is a free no-snooze alarm clock app for iPhone. To finish the alarm you have to get out of bed "
               "and turn on the lights. Then a new story chapter is waiting.")
app_schema = {
    "@context": "https://schema.org", "@type": "MobileApplication", "name": "Wupiko: Wake-Up Alarm",
    "alternateName": "Wupiko", "url": BASE, "description": description,
    "applicationCategory": "LifestyleApplication", "operatingSystem": "iOS 26.0 or later",
    "installUrl": APP_STORE, "downloadUrl": APP_STORE,
    "image": BASE + "site/share.jpg", "screenshot": [BASE + f"site/screen-{s[0]}.jpg" for s in steps],
    "offers": {"@type": "Offer", "price": "0", "priceCurrency": "USD"},
    "featureList": ["No snooze button", "Light check-in that gets you out of bed", "A new story chapter every morning",
                    "Plain reminders", "No account, ads or tracking", "Works offline"],
}
faq_schema = {
    "@context": "https://schema.org", "@type": "FAQPage",
    "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in FAQ],
}

page("index.html", "Wupiko: No-Snooze Alarm Clock App for Heavy Sleepers", description, f"""<div class="wrap">
  <div class="hero">
    <div>
      <h1>The alarm clock you can't snooze</h1>
      <p class="lead">Wupiko is an alarm app for people who sleep through alarms. To finish it, you have to get out of bed and turn on the lights. Then Wupiko tells you where it traveled last night.</p>
      <a class="cta" href="{APP_STORE}">Download on the App Store</a>
      <p class="fine">Free. No ads, no account. iPhone and iPad, iOS 26 or later.</p>
    </div>
    <img class="mascot" src="site/wupiko-ringing.svg" alt="Wupiko, a round yellow mascot, ringing wide-eyed" width="300" height="300">
  </div>
</div>

<section id="how" class="wrap">
  <h2>How a morning with Wupiko goes</h2>
  <ol class="steps">
{steps_html}
  </ol>
</section>

<section class="wrap">
  <h2>Why it gets you up when other alarms don't</h2>
  <p class="muted narrow" style="margin-top:14px">Most alarms can be beaten half asleep: one tap on snooze and you're gone again. Wupiko asks for the one thing you can't do from bed, which is standing in a bright room. By the time it's fed, you're up, the lights are on and you're awake enough to stay that way.</p>
  <div class="cards">
{cards_html}
  </div>
</section>

<section id="faq" class="wrap narrow">
  <h2>Questions</h2>
  <div class="faq">
{faq_html}
  </div>
</section>

<section class="wrap closing">
  <img src="site/wupiko-awake.svg" alt="" width="150" height="150">
  <h2>Tomorrow, get up for real</h2>
  <a class="cta" href="{APP_STORE}">Download Wupiko, free</a>
  <p class="fine muted">More reading: <a href="no-snooze-alarm.html">how to stop hitting snooze</a> and <a href="alarm-for-heavy-sleepers.html">what to look for in an alarm for heavy sleepers</a>.</p>
</section>""", [app_schema, faq_schema])


# ---------------------------------------------------------------------- guides
def guide(path, title, headline, description, body):
    schema = {
        "@context": "https://schema.org", "@type": "Article", "headline": headline, "description": description,
        "datePublished": "2026-11-17", "dateModified": TODAY, "image": BASE + "site/share.jpg",
        "mainEntityOfPage": BASE + path, "author": {"@type": "Organization", "name": "Wupiko", "url": BASE},
        "publisher": {"@type": "Organization", "name": "Wupiko", "url": BASE},
    }
    page(path, title, description, f'<article class="wrap narrow">\n<h1>{headline}</h1>\n{body}\n</article>',
         [schema], og_type="article")


guide("no-snooze-alarm.html", "How to Stop Hitting Snooze: 7 Things That Work | Wupiko",
      "How to stop hitting snooze", "Why the snooze button wins, and seven practical ways to stop hitting it, "
      "from moving your phone to using a no-snooze alarm that makes you get out of bed.", f"""
<p class="lead">You set the alarm with good intentions. Then the half-asleep version of you makes a different decision, and makes it nine minutes at a time. Here is why that happens and what helps.</p>

<h2>Why snooze is so hard to resist</h2>
<p>When an alarm goes off you are in the groggiest minutes of your day. That fog has a name, sleep inertia, and it is when judgment and willpower are at their lowest. The snooze button offers an instant reward (the noise stops, the bed is warm) for one small tap. The cost comes later, so the tap wins.</p>
<p>The extra minutes are not good sleep, either. They are short and broken, and many people feel worse after three snoozes than they would have getting up at the first alarm.</p>
<p>So the fix is rarely more willpower. It is setting things up so the easy choice and the right choice are the same.</p>

<h2>Seven things that work</h2>
<ol>
  <li><strong>Remove the snooze button.</strong> If the option is not there, you can't take it. Most phone clocks let you switch snooze off per alarm, and a <a href="./">no-snooze alarm app</a> never offers it at all.</li>
  <li><strong>Put the phone out of reach.</strong> Across the room, or in the hallway. Standing up is most of the battle.</li>
  <li><strong>Get into bright light straight away.</strong> Light is the strongest signal your body gets that the day has started. Open the curtains or turn on the main room light, not just a bedside lamp.</li>
  <li><strong>Set one alarm for the real time.</strong> A row of alarms ten minutes apart is snooze with extra steps. Pick the latest time that still works and set only that.</li>
  <li><strong>Give yourself something to get up for.</strong> Coffee on a timer, a podcast you only play in the morning, ten quiet minutes before anyone else is up. A small reward beats a big threat.</li>
  <li><strong>Keep the same wake-up time.</strong> Including weekends, within an hour or so. A steady time makes waking easier within a couple of weeks.</li>
  <li><strong>Go to bed earlier.</strong> Not a trick, but nothing above fixes a real shortage of sleep. If mornings are a fight every day, look at your bedtime first.</li>
</ol>

<h2>What a no-snooze alarm does differently</h2>
<p>A normal alarm asks you to tap the screen. A no-snooze alarm asks you to prove you are up. Some make you solve sums, scan a barcode in the bathroom or shake the phone. Each one pulls you a little further out of sleep before the sound stops.</p>
<p>Wupiko uses light. After the alarm, its mascot is frozen, and it only warms up when your phone sees a properly bright room for a few seconds. That takes care of points one to three above in a single step: no snooze, out of bed, lights on. Then there is a new story chapter waiting, which is point five.</p>
{aside("Wupiko is a free no-snooze alarm for iPhone. No ads, no account.")}

<h2>If you still can't get up</h2>
<p>Give any change a week or two before judging it. If you sleep seven to nine hours and still can't wake, or you regularly sleep through loud alarms, it is worth talking to a doctor. Trouble waking can be a sign of a sleep problem rather than a habit.</p>
<p>Related: <a href="alarm-for-heavy-sleepers.html">what to look for in an alarm if you are a heavy sleeper</a>.</p>""")

guide("alarm-for-heavy-sleepers.html", "Alarm Clock Apps for Heavy Sleepers: What to Look For | Wupiko",
      "Alarms for heavy sleepers: what actually gets you out of bed",
      "Louder is not the answer. What heavy sleepers should look for in an alarm clock app: no snooze, a task "
      "that gets you out of bed, alarms that come back, and light.", f"""
<p class="lead">If you sleep through alarms, or switch them off without remembering it, a louder ringtone will not fix it. What helps is an alarm you can't finish from bed.</p>

<h2>Why loud isn't enough</h2>
<p>Heavy sleepers usually do hear the alarm. The problem is the next ten seconds: a hand finds the phone, taps whatever makes the noise stop, and sleep takes over again. Often there is no memory of it.</p>
<p>So the useful question is not "how loud is it?" but "what do I have to do to turn it off, and can I do that asleep?"</p>

<h2>What to look for in an alarm app</h2>
<ul>
  <li><strong>No snooze.</strong> Or at least a way to switch it off for good. Snooze is the easiest way back to sleep.</li>
  <li><strong>A task that needs you on your feet.</strong> Sums and puzzles wake your brain, but you can do them lying down. Tasks that move your body, like walking to another room or reaching a light switch, work better.</li>
  <li><strong>It comes back if you ignore it.</strong> Silencing the alarm should not count as getting up. A good alarm for heavy sleepers rings again until you have proved you are awake.</li>
  <li><strong>It rings when the app is closed.</strong> The alarm should be delivered by the phone's own alarm system, not depend on the app staying open overnight.</li>
  <li><strong>Light.</strong> Bright light tells your body the day has begun and makes it much harder to drift off again.</li>
  <li><strong>A reason to stay up.</strong> The first minute is hard. The next ten are where most people go back to bed. Something pleasant to do next helps more than a punishment.</li>
</ul>

<h2>Habits that help any alarm work</h2>
<ul>
  <li>Charge your phone away from the bed, so that reaching it means standing up.</li>
  <li>Keep the same wake-up time every day, including weekends.</li>
  <li>Turn on the main room light or open the curtains as soon as you are up.</li>
  <li>Check the phone's volume and Do Not Disturb settings before you rely on any alarm.</li>
  <li>Aim for enough sleep. No alarm makes up for five hours a night.</li>
</ul>

<h2>How Wupiko handles it</h2>
<p><a href="./">Wupiko</a> is a no-snooze alarm clock built around those points. When it rings, the only way to finish is to feed its mascot real light: you turn on the room lights or face a window and hold the phone there for a few seconds. A dim lamp next to the bed is not enough, so you have to get up.</p>
<p>If you silence the alarm and stay in bed, it rings again. Once you are up, Wupiko has a new chapter of a story from its night trip, and a keepsake that only unpacks if you stay up a few more minutes. Good mornings grow a small island over time, and missed ones are forgiven.</p>
{aside("Wupiko is free for iPhone, with no ads and no account.")}

<h2>When to get help</h2>
<p>If you regularly sleep through alarms despite a full night's sleep, feel exhausted during the day, or have been told you snore heavily or stop breathing in your sleep, talk to a doctor. An alarm app is a tool for a habit, not a treatment.</p>
<p>Related: <a href="no-snooze-alarm.html">how to stop hitting snooze</a>.</p>""")


# --------------------------------------------------------------------- sitemap
pages = ["", "no-snooze-alarm.html", "alarm-for-heavy-sleepers.html", "privacy.html"]
(DOCS / "sitemap.xml").write_text(
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + "".join(f"  <url><loc>{BASE}{p}</loc><lastmod>{TODAY}</lastmod></url>\n" for p in pages) + "</urlset>\n")
print("Site written to", DOCS)
