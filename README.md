# Morning brief → Telegram

A daily message on Telegram every morning at **8:30 AM IST**: Panchang,
weather and air quality, your calendar, headlines, and a verse.

Runs entirely on GitHub Actions. **Total cost: ₹0 / month.** No server, no
hosting, no paid API, no dependencies to install.

```
🕉️ Good morning
Sunday, 18 October 2026

📜 Panchang
Ravivara · Ashwina Shukla · VS 2083
• Tithi: Saptami till 08:28, then Ashtami
• Nakshatra: Purva Ashadha till 12:48, then Uttara Ashadha
• Yoga: Sukarma till 23:54, then Dhriti
• Karana: Vanija till 08:28, then Vishti
• Moon: Dhanu (Sagittarius) · Sun: Tula (Libra)

🌅 Sunrise 06:23 · Sunset 17:48
• Brahma Muhurta: 04:47–05:35
• Abhijit (auspicious): 11:43–12:28
• Rahu Kaal (avoid): 16:23–17:48

🌫️ Weather — Delhi
Haze, 18°–32°C
• Feels like up to 33°C
• Rain 5% chance
• UV index 6.3
• AQI 318 🟣 Very Poor (PM2.5 168.4)

📅 Today
• 09:30–09:45 — Team standup @ Zoom

📰 Headlines
• Markets close higher as rupee steadies
• Cabinet clears new policy

🎴 Verse of the day
सर्वधर्मान्परित्यज्य मामेकं शरणं व्रज।
Let go of all else and take refuge in Me alone.
— Bhagavad Gita 18.66
```

---

## Why Telegram and not WhatsApp

WhatsApp cannot do this for free. Sending automated messages needs the
WhatsApp Business API, which requires business verification and charges per
conversation; the unofficial libraries that work around this get numbers
banned. Telegram bots are free, unlimited, officially supported, and take
two minutes to set up. If you saw this in a reel, it was almost certainly
Telegram.

---

## Setup

Three steps, about ten minutes. Only the first two are required.

### 1. Create the bot (2 min)

1. Open Telegram and message [**@BotFather**](https://t.me/botfather).
2. Send `/newbot`.
3. Give it a name (e.g. `My Morning Brief`) and a username ending in `bot`
   (e.g. `rahul_morning_brief_bot`).
4. BotFather replies with a token like `8012345678:AAFd9s...`. **Copy it.**

Now message *your own new bot*: search its username, open it, press
**Start**, and send it anything (`hi` will do). This is required — Telegram
will not let a bot message you until you have messaged it first.

### 2. Find your chat ID (1 min)

On your own machine, with the token from step 1:

```bash
git clone https://github.com/rr0603/sanatan.git
cd sanatan
TELEGRAM_BOT_TOKEN='8012345678:AAFd9s...' python3 -m brief.tools.get_chat_id
```

It prints something like:

```
Bot: @rahul_morning_brief_bot (My Morning Brief)

Found these chats:

  TELEGRAM_CHAT_ID = 123456789    (private: rahul)
```

That number is your chat ID.

> No Python handy? Open
> `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates` in a browser and
> look for `"chat":{"id":123456789`.

### 3. Add the secrets to GitHub (2 min)

In this repository: **Settings → Secrets and variables → Actions → New
repository secret**. Add two:

| Secret | Value |
| --- | --- |
| `TELEGRAM_BOT_TOKEN` | the token from step 1 |
| `TELEGRAM_CHAT_ID` | the number from step 2 |

### 4. Test it

**Actions → Morning brief → Run workflow.** You should get the message
within a few seconds. From then on it arrives every morning on its own.

If nothing arrives, open the run and read the log — the error messages name
exactly what is missing.

---

## Optional: your Google Calendar

Skip this and everything else still works; the calendar section simply
does not appear.

1. Go to the [Google Cloud Console](https://console.cloud.google.com/),
   create a project.
2. **APIs & Services → Library →** enable **Google Calendar API**.
3. **APIs & Services → OAuth consent screen →** choose *External*, fill in
   the basics, and add **yourself** as a test user.
4. **Credentials → Create credentials → OAuth client ID →** application
   type **Desktop app**. Note the client ID and client secret.
5. On your own machine:

   ```bash
   python3 -m brief.tools.google_auth
   ```

   It opens a browser, you approve read-only calendar access, and it prints
   three values.

6. Add all three as repository secrets: `GOOGLE_CLIENT_ID`,
   `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`.

The scope is read-only (`calendar.readonly`) — the bot can never change
your calendar. Google's Calendar API is free at this volume.

To include more than your main calendar, list their IDs in `config.json`:

```json
"calendar_ids": ["primary", "family123@group.calendar.google.com"]
```

---

## Optional: on-demand commands

You can also message the bot and get an answer:

| Command | Does |
| --- | --- |
| `/brief` | sends today's full brief now |
| `/panchang` | just the Panchang |
| `/weather` | just the forecast |
| `/help` | the command list |

This is **off by default** because it polls on a schedule and so uses
Actions minutes. To turn it on, add a repository *variable* (not a secret):

**Settings → Secrets and variables → Actions → Variables → New**
→ name `ENABLE_COMMAND_POLLING`, value `true`

### What it costs

| Repository | Actions minutes | Verdict |
| --- | --- | --- |
| **Public** | free and unlimited | leave it on |
| **Private** | 2,000 free / month | polling every 15 min uses ~500–900 |

The daily brief alone uses about **10 minutes a month**, so it fits in the
free tier either way. Only the command polling is worth thinking about. If
you want commands on a private repo, widen the interval in
`.github/workflows/telegram-commands.yml` (`*/30` halves the cost).

The bot replies **only** to the chat ID you configured; messages from
anyone else are logged and ignored.

---

## Changing things

Everything you are likely to adjust lives in **`config.json`** — no code
changes needed.

```jsonc
{
  "name": "Rahul",              // greeted by name; "" for no name
  "location": {
    "name": "Delhi",
    "latitude": 28.6139,
    "longitude": 77.2090,
    "timezone": "Asia/Kolkata"
  },
  "sections": [                 // order here is the order in the message;
    "greeting",                 // delete any line to drop that section
    "panchang",
    "weather",
    "calendar",
    "news",
    "shloka"
  ],
  "news_feeds": [               // any RSS or Atom feed
    "https://feeds.bbci.co.uk/news/world/rss.xml"
  ],
  "news_limit": 5,
  "shloka_enabled": true,
  "calendar_ids": ["primary"]
}
```

### The delivery time

Edit the `cron` line in `.github/workflows/morning-brief.yml`. It is in
**UTC**, so subtract 5h30m from your IST time:

| You want (IST) | cron (UTC) |
| --- | --- |
| 6:00 AM | `30 0 * * *` |
| 7:00 AM | `30 1 * * *` |
| **8:30 AM** | **`0 3 * * *`** ← current |
| 9:00 AM | `30 3 * * *` |

**One caveat worth knowing:** GitHub's scheduler is best-effort. Runs are
usually a few minutes late and occasionally 15+ minutes late when the
platform is busy. If you need to-the-minute delivery, this free approach is
the wrong tool. For a morning greeting it is fine.

### Some other city

Replace the `location` block with your coordinates and
[IANA timezone](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones).
Everything — weather, sunrise, Panchang, the day's timings — follows the
location; nothing is hardcoded to India.

---

## Running it locally

```bash
python3 -m brief.main --dry-run                   # preview, sends nothing
python3 -m brief.main --dry-run --date 2026-11-08 # preview another day
python3 -m brief.main --dry-run --raw             # show the HTML markup
python3 -m unittest discover -s tests             # run the tests
```

Needs **Python 3.9+** (for `zoneinfo`) and nothing else.

---

## How it works

```
GitHub Actions cron (03:00 UTC daily)
        │
        └─> python3 -m brief.main
                │
                ├── panchang/   computed locally from the ephemeris  (no network)
                ├── weather     Open-Meteo                           (no API key)
                ├── calendar    Google Calendar API                  (your OAuth token)
                ├── news        any RSS/Atom feeds                    (no API key)
                └── shloka      bundled JSON                          (no network)
                │
                └─> Telegram sendMessage
```

| File | Does |
| --- | --- |
| `brief/main.py` | builds and sends the brief |
| `brief/render.py` | turns data into the message |
| `brief/config.py` | `config.json` + environment secrets |
| `brief/telegram.py` | Telegram API, HTML escaping, message splitting |
| `brief/http.py` | timeouts, retries, JSON |
| `brief/panchang/astro.py` | Julian day, solar/lunar longitude, ayanamsa, rise/set |
| `brief/panchang/calendar.py` | the five limbs, day timings, observances |
| `brief/sources/` | weather, news, calendar, shloka |
| `brief/commands.py` | answers `/brief` and friends |
| `brief/tools/` | one-time setup helpers |

### Two design decisions worth knowing

**No dependencies.** Standard library only, so there is no `pip install`
step in the workflow. Runs finish in seconds and no third-party package can
break or compromise your morning message.

**No source can cost you the brief.** Each section is built in isolation.
If Open-Meteo is down you still get the Panchang, and the message tells you
which section was unavailable and why rather than silently dropping it —
otherwise you would not know whether there is genuinely no news today or
the feed is broken.

---

## Accuracy

**The Panchang is computed locally**, from the standard algorithms in Jean
Meeus, *Astronomical Algorithms* (2nd ed.), using the Lahiri (Chitrapaksha)
ayanamsa. No almanac service is involved, which is why that section cannot
fail.

The test suite checks the engine against Meeus' own published worked
examples and matches them to six decimal places, and against known new and
full moon dates. Tithi, nakshatra, yoga, karana, moon sign, sunrise, sunset
and the day's timings are accurate to **within a couple of minutes**.

**Named festival dates are a different matter — treat them as indicative.**
Which Gregorian day a festival falls on depends on per-festival rules about
*when* the tithi must prevail (sunrise, dusk, or midnight) and on
tie-breaks that differ between regional almanacs. This project applies one
consistent rule — the tithi current at sunrise — so a named festival can be
**a day out either way**. Diwali is the known case: it is fixed by the tithi
at dusk, so it may be flagged a day late. Confirm festival dates against
your own panchang.

The recurring observances — Ekadashi, Purnima, Amavasya, Pradosh, Sankashti
Chaturthi — are exact, because they are nothing more than "which tithi is
it today".

---

## Troubleshooting

| Symptom | Cause |
| --- | --- |
| `chat not found` | you did not message the bot first, or the chat ID is wrong |
| `Unauthorized` | the bot token is wrong or was regenerated |
| Nothing arrives, no failed run | check the cron time is UTC, not IST |
| Scheduled runs stopped | GitHub disables cron on repos with no activity for 60 days — push any commit to re-enable |
| Weather section missing | Open-Meteo was briefly unreachable; the message says so |
| Calendar section missing | the three `GOOGLE_*` secrets are not all set |
| `credentials rejected` | the Google refresh token expired — re-run `brief.tools.google_auth` |

A refresh token for an app still in OAuth "Testing" mode expires after
**seven days**. To stop re-authorising, publish the consent screen
(**OAuth consent screen → Publish app**); since you are the only user and
the scope is read-only, Google does not require verification review.
