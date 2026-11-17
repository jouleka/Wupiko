# Store listing

Shared copy for App Store Connect and Google Play. Character limits are noted in brackets.

## Name

- App Store name [30]: **Wupiko: No-Snooze Alarm Clock**
- App Store subtitle [30]: **For heavy sleepers. Wake up!**
- Play title [30]: **Wupiko: No-Snooze Alarm Clock**

Live in 1.0.2: name "Wupiko: Wake-Up Alarm", subtitle "Get up. A story is waiting." The new name, subtitle, keywords, description, release notes and review notes are saved in App Store Connect on the 1.0.3 draft and go live when that version is approved (see [Search](#search)).

## Core idea

Wupiko is a no-snooze alarm that gives you a reason to get up. After the alarm, you feed Wupiko real light (room lights or a window), which gets you out of bed. Then it shares where it traveled last night: a new chapter of a story every morning, and a keepsake you only get if you stay up. Good mornings grow Wupiko's island; nothing is ever taken away.

## Short description (Play) [80]

No-snooze alarm clock for heavy sleepers. Get up, turn on the lights, stay up.

## Promotional text (App Store) [170]

The alarm you can't snooze. Get out of bed and turn on the lights to finish it, then hear where Wupiko traveled last night. A new story chapter every morning.

## Keywords (App Store) [100]

loud,morning,routine,habit,light,sunrise,sunlight,story,cute,bed,early,riser,oversleep,sleep,mission

## Screenshots (store-assets/ios-1.0.2)

1. No snooze. Just get up. (ringing screen)
2. Feed Wupiko real light (light check-in)
3. A new story every morning (chapter + postcard)
4. Your island grows with you (island)
5. Collect keepsakes from its travels (album + season)
6. Wake-ups and gentle reminders (reminder editor)

iPad: story, island, album.

## Full description [4000]

See the description saved in App Store Connect for 1.0.2 (store-assets/release-1.0.2.md). For the next version:

- Open with the search terms in a plain sentence, since Google indexes the App Store page and Play indexes the description: "Wupiko is a no-snooze alarm clock for heavy sleepers. To finish the alarm you have to get out of bed and turn on the lights."
- Replace "the alarm rings again after 1, 3 and 6 minutes" with "the alarm keeps ringing, loud, until you do".

## Categories

- App Store: primary **Lifestyle**, secondary **Productivity**
- Play: **Lifestyle**

## URLs

- Privacy policy: https://jouleka.github.io/Wupiko/privacy.html
- Marketing: https://jouleka.github.io/Wupiko/
- Support: https://github.com/jouleka/Wupiko/issues

## Search

How people find Wupiko, and what each piece is for.

- **App Store search** reads the name, the subtitle and the keyword field, in that order of weight, and never the description. Words are matched singly and combined across the three, so none is repeated: the name carries *no snooze alarm clock*, the subtitle *heavy sleepers wake up*, and the keyword field everything else. The old keyword field spent a third of its 100 characters on words already in the name.
- **Google Play search** reads the title, the short description and the full description.
- **Web search** lands on the site in `docs/`, written by `scripts/build-site.py`: a landing page aimed at "no snooze alarm clock app" and "alarm app for heavy sleepers", and two guides aimed at "how to stop hitting snooze" and "alarm for heavy sleepers". Each carries structured data, and the pages are listed in `sitemap.xml`.
- "Loud" is only true from the build where wake-ups ring until Wupiko is fed, so the keyword and the description line ship with that version, not before.

To do by hand, since they are account settings: set the Marketing URL in App Store Connect to the site, set the repository's website to it on GitHub, and add the site in Google Search Console and submit `sitemap.xml`. A `robots.txt` would be ignored here, because the site lives under a path of `jouleka.github.io` and crawlers only read that file at the root of a host.

## Content and ratings

- Price: free. No in-app purchases, no ads.
- Age rating: 4+ / Everyone. No user-generated content, no social features, no web access.
- Camera: front camera estimates brightness only during the check-in; no images are shown, stored or sent.
- Data: none collected (App Store "Data Not Collected"; Play Data safety "no data collected or shared").

## App Review notes (iOS)

Wupiko intentionally has no snooze. Each wake-up alarm also schedules AlarmKit follow-ups over the next 30 minutes. Stopping the system alert does not cancel them; finishing the short in-app check-in (feeding Wupiko light) does. While the app is open and a check-in is pending, Wupiko plays the alarm sound itself until the check-in is finished, including when the phone is locked; this is the only use of the audio background mode. This is the app's core feature and is explained in the alarm editor. No sign-in is required. To test: create an alarm two minutes ahead, lock the device, stop the alert, open Wupiko and complete the ritual.
