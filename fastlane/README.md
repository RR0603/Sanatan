# Ready-to-upload store kit

Everything the App Store and Google Play ask for, apart from the app binaries, is in this folder. Regenerate it with `npm run store-kit` after changing `STORE_LISTING.md` or the screenshots in `store/`; every text field is checked against its store limit.

The binaries come from GitHub Actions:

- **iOS release** uploads the build straight to App Store Connect / TestFlight.
- **Android release** produces the signed `app-release.aab` (download it from the run's artifacts, or let the workflow upload it to Play).

## App Store Connect (paste these, or run `fastlane ios metadata`)

| App Store Connect field | File |
| --- | --- |
| Name | `metadata/ios/en-US/name.txt` |
| Subtitle | `metadata/ios/en-US/subtitle.txt` |
| Promotional text | `metadata/ios/en-US/promotional_text.txt` |
| Description | `metadata/ios/en-US/description.txt` |
| Keywords | `metadata/ios/en-US/keywords.txt` |
| What's New | `metadata/ios/en-US/release_notes.txt` |
| Support URL / Marketing URL / Privacy Policy URL | `support_url.txt`, `marketing_url.txt`, `privacy_url.txt` |
| Category | `primary_category.txt` (Education), `secondary_category.txt` (Reference) |
| Copyright | `metadata/ios/copyright.txt` (put your legal name here if you prefer) |
| App Review notes and contact e-mail | `metadata/ios/review_information/` |
| iPhone 6.9" screenshots (1320 × 2868) | `screenshots/en-US/*_iphone69_*.jpg` |
| iPad 13" screenshots (2064 × 2752) | `screenshots/en-US/*_ipadPro13_*.jpg` |
| Hindi localisation | `metadata/ios/hi/` |

## Google Play Console (paste these, or run `fastlane android metadata`)

| Play Console field | File |
| --- | --- |
| App name | `metadata/android/en-US/title.txt` |
| Short description (80) | `metadata/android/en-US/short_description.txt` |
| Full description (4000) | `metadata/android/en-US/full_description.txt` |
| App icon 512 × 512 | `metadata/android/en-US/images/icon.png` |
| Feature graphic 1024 × 500 | `metadata/android/en-US/images/featureGraphic.jpg` |
| Phone screenshots (1080 × 1920) | `metadata/android/en-US/images/phoneScreenshots/` |
| 10-inch tablet screenshots | `metadata/android/en-US/images/tenInchScreenshots/` |
| Release notes (500) | `metadata/android/en-US/changelogs/default.txt` |
| Hindi listing | `metadata/android/hi-IN/` |

Data safety, content rating and App privacy answers: see `STORE_LISTING.md`.
