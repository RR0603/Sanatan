# Morning Briefing Bot

A daily briefing — weather, headlines, on-this-day, a thought for the day —
delivered to your phone every morning via Telegram.

**Cost: ₹0.** No server, no API keys, no credit card.

```
🌅 Good morning, Rahul
Monday, 21 September 2026

Weather in Delhi
🌧️ Light rain, 24°C to 31°C
Right now 24°C (feels like 28°C)
Chance of rain 70%
Sunrise 06:12 · Sunset 18:24
💡 Carry an umbrella

Top stories
• Rupee steadies as oil slips  The Hindu
• Monsoon retreats from north India  PTI

On this day
• 1991 — Armenia declares independence from the Soviet Union.
...
```

## Why Telegram and not WhatsApp

WhatsApp has no free bot API. Sending yourself an automated WhatsApp message
requires the WhatsApp Business Platform: a Meta Business account, a verified
business, a template approved before you may send it, and per-message
charges. Unofficial libraries that drive your personal account violate
WhatsApp's terms and get numbers banned.

Telegram bots are free, unlimited, take about two minutes to set up, and
deliver to the same phone with the same notification. That is what this
repo builds. The upgrade paths are in
[Going further](#going-further) — including WhatsApp and actual voice calls,
both of which cost money.

## What it costs to run

| Piece | Service | Price |
|---|---|---|
| Scheduler | GitHub Actions | Free (unlimited on public repos, 2000 min/month private — this uses ~1 min/day) |
| Messaging | Telegram Bot API | Free |
| Weather | [Open-Meteo](https://open-meteo.com) | Free, no key |
| Headlines | Any RSS feed | Free, no key |
| On this day | Wikimedia feed API | Free, no key |
| AI intro *(optional)* | Groq / OpenRouter free tier | Free tier |

No dependencies either — the bot is pure Python standard library.

## Setup (about 5 minutes)

### 1. Create the bot

In Telegram, message [@BotFather](https://t.me/BotFather):

1. Send `/newbot`
2. Give it a name (e.g. `My Morning Briefing`) and a username ending in `bot`
3. Copy the token it gives you — it looks like `8123456789:AAH…`

### 2. Get your chat id

**Send your new bot a message first** ("hi" is fine) — Telegram will not let
a bot message you until you have opened the conversation. Then:

```bash
git clone https://github.com/<you>/<this-repo>.git && cd <this-repo>
TELEGRAM_BOT_TOKEN=8123456789:AAH… python3 scripts/get_chat_id.py
```

It prints your chat id, a number like `987654321`.

### 3. Add the secrets to GitHub

In your repo: **Settings → Secrets and variables → Actions → Secrets → New repository secret**

| Secret | Value |
|---|---|
| `TELEGRAM_BOT_TOKEN` | the token from BotFather |
| `TELEGRAM_CHAT_ID` | the number from step 2 |

### 4. Set your location and name

Same page, the **Variables** tab (these are not secret, so they go here):

| Variable | Example | Default |
|---|---|---|
| `BRIEFING_NAME` | `Rahul` | *(no name in greeting)* |
| `BRIEFING_PLACE` | `Mumbai` | `Delhi` |
| `BRIEFING_LAT` | `19.0760` | `28.6139` |
| `BRIEFING_LON` | `72.8777` | `77.2090` |
| `BRIEFING_TZ` | `Asia/Kolkata` | `Asia/Kolkata` |
| `BRIEFING_UNITS` | `metric` or `imperial` | `metric` |
| `BRIEFING_SECTIONS` | `weather,news,onthisday,quote` | all four |
| `NEWS_FEEDS` | comma-separated RSS URLs | Google News India |
| `NEWS_LIMIT` | `5` | `5` |

Coordinates for any city: search it on [openstreetmap.org](https://www.openstreetmap.org)
and read them off the URL.

### 5. Test it

Go to **Actions → Daily briefing → Run workflow**. Tick *dry run* to see the
message in the log first, or leave it unticked to get the real thing on your
phone.

If nothing arrives, check the Actions log — a bad token or chat id is
reported in plain English.

That's it. It now runs every morning on its own.

## Changing the delivery time

GitHub's scheduler runs on **UTC only**, so edit the cron line in
[`.github/workflows/daily-briefing.yml`](.github/workflows/daily-briefing.yml):

```yaml
- cron: "30 1 * * *"   # 01:30 UTC = 07:00 IST
```

| You want (IST) | cron |
|---|---|
| 6:00 am | `30 0 * * *` |
| 7:00 am | `30 1 * * *` |
| 8:00 am | `30 2 * * *` |
| 9:00 am | `30 3 * * *` |

For other zones: subtract your UTC offset from the local time you want. If
that goes below 00:00, wrap around and it fires the previous UTC day —
which is fine for a daily schedule.

**Two things to know about GitHub's free scheduler:**

- Scheduled runs are queued on shared infrastructure and can be **late by
  5–30 minutes** at busy times. Jobs on the hour are worst, which is why the
  default is `:30`.
- GitHub **disables scheduled workflows after 60 days of no repository
  activity**, and emails you when it does. A commit re-enables it. If you
  never touch the repo, this will eventually stop on its own.

## Optional: an AI-written intro

With an LLM key, the briefing opens with a sentence or two about what
actually matters today rather than raw data. Without one, this is silently
skipped.

Add `LLM_API_KEY` as a **secret**. Defaults target [Groq](https://console.groq.com)
(free tier, no card). To use something else, set these **variables**:

| Variable | Groq (default) | OpenRouter | Anthropic |
|---|---|---|---|
| `LLM_PROVIDER` | `openai` | `openai` | `anthropic` |
| `LLM_BASE_URL` | `https://api.groq.com/openai/v1` | `https://openrouter.ai/api/v1` | *(ignored)* |
| `LLM_MODEL` | `llama-3.3-70b-versatile` | e.g. `meta-llama/llama-3.3-70b-instruct:free` | `claude-haiku-4-5-20251001` |

## Running it locally

```bash
python3 -m briefing --dry-run          # print the briefing, no credentials needed
python3 -m briefing --check            # verify the token and chat id work
python3 -m briefing                    # build and send
python3 -m briefing --message "test"   # send arbitrary text
python3 -m unittest discover -s tests  # run the tests
```

Copy `.env.example` to `.env` and `source .env` to set things locally.

## Adding your own section

Each section is one small function. It gets config and today's date, and
returns lines. If it raises, only that section shows as unavailable — the
rest of the briefing still goes out.

```python
# briefing/sections/mysection.py
from .base import Context, Section

def build(ctx: Context) -> Section:
    return Section(key="mysection", title="My heading", lines=["• something useful"])
```

Register it in `briefing/report.py`:

```python
REGISTRY = {..., "mysection": mysection.build}
```

Then add `mysection` to the `BRIEFING_SECTIONS` variable. Body lines may use
Telegram's HTML subset (`<b>`, `<i>`, `<a href>`); run anything you did not
write yourself through `briefing.telegram.escape()` first.

Ideas: your calendar for the day, stock or crypto prices, a Panchang/Tithi
line, unread-email count, cricket scores, your task list.

## Going further

**Telegram voice calls, or a real phone call.** Telegram bots cannot place
calls. For an actual voice call you need telephony — Twilio charges per
minute, and a text-to-speech or voice-agent service (ElevenLabs, Vapi,
Retell) sits on top. Expect a few rupees per call, and a phone number rental
on top. There is no free version of this.

**WhatsApp.** Once you have a Meta Business account and an approved message
template, swap `briefing/telegram.py` for a Cloud API call. Meta's free tier
covers a limited number of service conversations per month; beyond that it is
billed per conversation.

**Replying to the bot.** This project only sends. To make it answer back you
need a webhook and somewhere to host it — Cloudflare Workers and Vercel both
have free tiers that suit a Telegram webhook well.

## How it works

```
.github/workflows/daily-briefing.yml   cron → runs the bot on GitHub's servers
briefing/__main__.py                   CLI: --dry-run, --check, --message
briefing/config.py                     all settings, read from the environment
briefing/report.py                     runs sections, renders the message
briefing/telegram.py                   Bot API calls, HTML escaping, splitting
briefing/http.py                       urllib + retries (no dependencies)
briefing/digest.py                     optional LLM intro
briefing/sections/                     weather, news, onthisday, quote
scripts/get_chat_id.py                 one-time setup helper
tests/                                 62 tests, no network needed
```

Design rule: **the briefing always sends.** Every network call can fail, and
each one is contained to its own section so a dead API costs you one block,
not the whole message.
