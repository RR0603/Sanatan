# Living Sanatan — Reel Engine

The toolkit used to make the Living Sanatan reels ("Shiva never destroyed anything",
"You were never born", "God is not up there", "The Night Journey"). Lives on the
`reel-engine` branch of RR0603/Sanatan so a fresh session can rebuild everything.

## Setup (fresh container)
```sh
git clone --depth 1 -b reel-engine https://github.com/RR0603/Sanatan /home/claude/reel-engine
/home/claude/reel-engine/setup.sh        # pip deps, fonts -> /home/claude/fonts, Kokoro model -> /home/claude/tts
```
Chromium for Playwright is pre-installed (PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers). Never run `playwright install`.

## Make one video (folder = /home/claude/<slug>, sibling of /home/claude/fonts)
1. **Script** → `lines.json`: `[[id, say, cap], ...]`. `say` is what the voice reads; wrap Sanskrit/Hindi
   in `{देवनागरी}` so `tts.py` uses the phoneme override table (add new words to `OVR`). `cap` is the on-screen caption.
2. **Voice** → copy `examples/god-not-up-there/tts.py`, run it: writes `vo_<id>.wav` + `vo.json` (durations, rms),
   and checks every line with Whisper ASR. Voice = Kokoro **af_heart**, speed ~0.9–1.0. Fix any mispronunciation in OVR and re-run.
3. **Timeline** → copy `examples/god-not-up-there/tl.py` (edit the GAP dict for pauses) → `tl.json`.
4. **Scenes** → write `scenes.js` (an `SCN` object: one function per line id, `(t, lt)` → draws on canvas `X`, size `W×H`,
   portrait or landscape) + `tail.js` (transitions `TR`, `R(t)` compositor). Use the drawing kit in
   `engine/base.js` (captions, palm-leaf Sanskrit `leaf()`, glow, ring pulses, rays, `sweepFX`, stars, embers, smoke, grain,
   vignette, `WT(lineId, wordPrefix)` = time a word is spoken), `helpers.js` (cosmos, `cam()` zoom about a point, trident,
   third eye, mandala, `leafV`, verse tags), `extra.js`, `gu_h.js`, `med_h.js` (Gaṇeśa line-art, Kailāsa, subtle body with
   chakras, serpent, lotus, lying figure, kaleidoscope). Study the four examples first.
5. **Build** → `python3 ../reel-engine/engine/build.py ../reel-engine/engine/base.js,../reel-engine/engine/helpers.js,...,scenes.js,tail.js`
   → `film_port.html`, `film_land.html`.
6. **Check frames** before rendering: `python3 <engine>/snap.py port 1.5,6,12,... sn` then `python3 <engine>/mont.py sn port 6`
   → look at the contact sheet. Check every scene in both formats: nothing cut off, captions readable, no overlap.
7. **Sound** → copy an `audio_*.py` (procedural tanpura/pads/bells/whooshes + voice + ducking) → `sound.wav`.
   Music sits low under the voice.
8. **Render** → `SLUG=living-sanatan-<slug> <engine>/pipeline.sh` (run in the video folder, in the background; 30 s chunks,
   resumable; vertical first, then 16:9) → `out/<slug>-vertical-1080x1920.mp4`, `out/<slug>-1920x1080.mp4`.
   A 2-core box renders ~10 fps per format, so a 90 s reel takes ~10 min.
9. **Cover + SRT** → adapt `examples/*/cover.py`; write an .srt from `tl.json` VO words.
10. **Verify** → pull 6–8 frames from the final mp4s, look at them, and play-check the audio levels before delivering.

## Rahul's standing rules for these videos
- Every reel carries a **non-dual (Advaita) insight**. Logic first → then the realization. No plain story-retelling or
  "basic context building". No cartoon characters; cosmic motion graphics, sacred geometry, light, particles.
- Narration voice: Kokoro **af_heart** (he rejected the Hindi-blend and Supertonic voices as robotic).
- Pronounce Sanskrit correctly; "Sanātan" stressed on the 2nd syllable; possessive 's joined to the word.
- Cite real sources on screen (verse tags: Upaniṣad, Gītā, Yoga Sūtra, Haṭha Yoga Pradīpikā, Śiva Sūtra, etc.). Accurate only — mark
  philosophical parallels to science as parallels, not proof.
- Deliver **both** 1080×1920 and 1920×1080, plus covers and an .srt. Brand: bg #050402, gold #C9A84C, cream #D0BC98;
  Cinzel + Cormorant Garamond + IBM Plex Mono. End card "LIVING SANĀTAN · livingsanatan.com · @awarenessawakeness".
- Use the correct official map of India if a map appears. Animated camera moves (zoom into the relevant detail).
- Never publish or post anything publicly without his explicit OK — make and deliver only.

## Already made (don't repeat the topic)
See `MADE.md`.
