# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A one-page landing site for **다해드림**, a free pilot service doing errands for older adults
(taxi, online orders, hospital bookings, train tickets, scam checks). It exists to test one
assumption: that adult children — or elders themselves — will hand over a real errand. All
user-facing copy is Korean. The phone number 010-3990-0935 is the primary call to action; the
form is the secondary one.

Static files only, served by GitHub Pages from the root of `main`. There is no build step, no
dependencies, and no server — an earlier version had a Node backend writing to local JSON, and
that was removed when the site moved to Pages. Anything suggesting `npm start`, `/api/*`, or
`data/` is stale.

```bash
python3 -m http.server 3456   # local preview; push to main to deploy
```

## Architecture

- `index.html` — the whole page: pitch, five errand cards, phone CTA, intake form.
- `styles.css` — hand-written, large type and large tap targets for older readers. Keep that bias.
- `app.js` — client-side validation, the Google Forms POST, and GoatCounter event tracking.

Submissions go to a **Google Form** via `POST` to its `formResponse` endpoint. Responses live in
that form's Responses tab; nothing is stored in this repo.

### Two things must be filled in for the site to work

`FORM_ID` and `FIELDS` at the top of `app.js`, and the GoatCounter site code in `index.html`.
Until then the form silently posts into the void. README has the retrieval steps.

### The Google Forms POST is opaque and unofficial

`mode: "no-cors"` is forced — Google sends no CORS headers on `formResponse`, so the response is
unreadable and a rejected submission is indistinguishable from an accepted one. Consequences that
constrain any change here:

- The success message is optimistic, not confirmed. It must always include the phone number so a
  silent failure still leaves the visitor a way through. Don't remove that.
- `ROLE_ANSWER` and `JOB_ANSWER` in `app.js` map internal values to the Google Form's **option
  labels**, which must match character for character — Google drops answers it can't match, with
  no error. Changing a checkbox label in `index.html` means changing the map *and* the Form.
- Verify changes by submitting for real and checking the Responses tab. Nothing else proves it.

### Adding or renaming an errand type

Three places, all of which must agree: the checkbox `value` and label in `index.html`, the entry in
`JOB_ANSWER` in `app.js`, and the option text in the Google Form itself. Same shape for `role`
(`child` / `self`) via `ROLE_ANSWER`.

### Validation moved to the client

`app.js` re-implements what the Node server used to enforce: name 1–40 chars, contact 8–80, a role
chosen, at least one job checked. These are UX guardrails only — there is no longer anywhere to
enforce anything. Error strings are shown to visitors verbatim, so write them in Korean.

## Measurement

GoatCounter counts page views (the conversion denominator) and two events: `phone-cta` on any
`tel:` click, and `signup` on form submit. Calls themselves are unmeasurable — `phone-cta` is a
proxy for intent, not a count of calls that connected.

## Privacy copy

The page tells visitors their contact details go to Google and are used only to call them back.
That claim has to stay true — if data starts flowing anywhere else, the fine print in `index.html`
changes in the same commit.
