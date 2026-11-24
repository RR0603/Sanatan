# Launch day checklist

Do these in order on the day you start taking memberships. Until then,
nothing changes: the current site keeps running as it is.

Your address stays **https://rr0603.github.io/Sanatan/** throughout.

## Before you start

- [ ] You have your private backup of the member text (`premium-kv.json`).
      Without it, the member writing can't be restored once the old repo is
      private.
- [ ] Accounts ready: Dodo Payments, Cloudflare (free), Resend (free).

## Part 1: set up the payment server

Follow `SUBSCRIPTIONS.md`, steps 1–4: Dodo products and keys, Resend,
deploy the Cloudflare Worker, and upload the member text. When it's done you
have a Worker address like `https://sanatan-premium.yourname.workers.dev`.

## Part 2: move to a clean repo

The old repo's history still contains the member text, so the site moves to
a fresh repo that starts without it.

1. **Rename the old repo.** On GitHub, open the `Sanatan` repo →
   Settings → General → Repository name → type `Sanatan-archive` → Rename.
   *(Your site is offline from here until step 5. That's usually 5–10 minutes.)*
2. **Make the old repo private.** Same Settings page → scroll to
   "Danger Zone" → Change visibility → Private. **Don't delete it.**
3. **Create the new repo.** Go to https://github.com/new → name it
   `Sanatan` → choose **Public** → leave README, .gitignore and license
   **unticked** → Create repository.
4. **Put the clean code in it.** Easiest: start a new Claude Code session on
   `rr0603/Sanatan-archive` and say:

   > Put the members-paywall branch into the new empty rr0603/Sanatan repo as
   > a single fresh commit on main (no old history). Set the premium-api meta
   > tag in index.html to <your Worker address> first.

   Or, if you're comfortable with a terminal:

   ```bash
   git clone --branch members-paywall https://github.com/rr0603/Sanatan-archive.git sanatan-clean
   ```
   ```bash
   cd sanatan-clean && git checkout --orphan main
   ```
   Edit `index.html`: put your Worker address in
   `<meta name="premium-api" content="">`. Then:
   ```bash
   git add -A && git commit -m "The Living Sanatan Timeline"
   ```
   ```bash
   git remote set-url origin https://github.com/rr0603/Sanatan.git && git push -u origin main
   ```
5. **Turn the website on.** New `Sanatan` repo → Settings → Pages →
   Source: "Deploy from a branch" → Branch: `main`, folder `/ (root)` →
   Save. After a few minutes the site is back at the same address.

## Part 3: check it, then go live

1. Open the site in a private browser window. Eras 1–3 are fully readable.
   On era 4 and later, the Metaphysics tab shows "For members".
2. With Dodo still in **test mode**, subscribe using a Dodo test card. The
   layers should unlock. Try Members → Manage billing, cancel, and check that
   the layers lock again.
3. Switch Dodo to **live mode** (`SUBSCRIPTIONS.md`, step 6).
4. Optional: add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` as
   secrets on the **new** repo so server updates deploy automatically.

## If something goes wrong

- **Site not showing after step 5:** wait 10 minutes, then check
  Settings → Pages on the new repo for an error.
- **Need to undo the move:** delete the new `Sanatan` repo, rename
  `Sanatan-archive` back to `Sanatan`, make it Public, and turn Pages back on.
  The old site returns exactly as it was.
