# Instagram Downloader Chrome Extension 📸

![Logo](assets/icons/icon.svg)

Ever wanted to keep that photo, reel or story before it vanishes into the
algorithm? This Chrome extension sticks a little download button on pretty much
everything Instagram shows you. Photos, videos, carousels, stories, highlights,
a whole account, even every account you follow. Yes, all of them. 🙃

## Install 🛠️

```bash
npm ci
```

```bash
npm run build
```

Then open `chrome://extensions`, flip on Developer mode, hit **Load unpacked**
and pick the `dist` folder. After a rebuild, press the little reload arrow on
the extension and you're good.

## Features ⬇️

| Where you are                            | What shows up                                                                                                        |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Feed posts, post and reel pages          | A download button next to the bookmark. On a carousel it grabs the slide you're on, and a second one grabs them all. |
| Profile, explore, saved and tagged grids | A tiny button in the corner of each thumbnail that saves the whole post.                                             |
| Someone's profile                        | **Download all posts**, **Download profile picture** and **Change download folder**.                                 |
| Your own profile                         | **Download following**, which archives everyone you follow. Go make a cup of tea. ☕                                 |
| The story viewer                         | **Download this story** and **Download all**, for stories and highlights.                                            |

Single downloads land in Chrome's usual download folder. Bulk downloads ask you
for a folder once per tab (it forgets when you close the tab, on purpose), put
each account in `<folder>/<username>/`, and skip anything already there, so
running one again only fetches what's new.

## Slow and steady 🐢

Bulk downloads take their time, on purpose, because nobody wants an angry
Instagram. Every API call waits a random 4 to 9 seconds and stays under 120 an
hour. Accounts are 30 to 90 seconds apart. If Instagram says no, it backs off
for 15, 30, 60 and then 120 minutes before giving up for the day.

Hit Stop whenever you like: it remembers where it got to and the button turns
into **Resume**. An account you've fully archived before is only read until it
reaches posts you already have. Want to fiddle with the numbers? They live in
[`src/content/pacing/pacing.ts`](src/content/pacing/pacing.ts).

Most single downloads don't cost a request at all. The page script just reads
the post and story data Instagram already sent to draw the page. Sneaky. 🕵️

## No tracking 🔒

No analytics, no tracking, no ads, no accounts, and nothing phoning home. The
only things it ever fetches come from Instagram itself: the posts you asked for
and the photos and videos in them. Files go straight into the folder you
picked, and nothing about what you download goes anywhere else.

## How it's put together 🧩

TypeScript, bundled by esbuild into two scripts that talk to each other:

- `src/page/` lives inside Instagram's own page (`world: MAIN`). It reads the
  JSON Instagram's requests come back with, caches any media it spots, and runs
  Instagram's own Relay queries for anything it hasn't seen yet.
- `src/content/` lives in the extension's isolated world. It adds the buttons,
  asks the page script for media over a `MessageChannel`, and saves the files.
- `src/shared/` is the protocol and media model both sides agree on.

Every class gets its collaborators through its constructor, and only the two
`start*` functions build anything, so each piece can be tested on its own.

## Keeping it honest ✅

```bash
npm run ci
```

One command, lots of gates: Prettier, ESLint (typescript-eslint strict
type-checked, SonarJS, complexity and size limits, import cycles, and layering
rules that keep page, content and shared code apart), `tsc`, Knip for anything
unused, Vitest with 100% statement, branch, function and line coverage, and the
build. The pre-push hook and CI run exactly the same thing.
