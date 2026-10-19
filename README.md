# Fasheng Xu — Personal Website

Research-focused personal website for **Fasheng Xu**, Assistant Professor of
Operations and Information Management, University of Connecticut.

**Live:** https://fasheng-xu.github.io

A single, self-contained `index.html` — fonts (Newsreader + Inter), headshot, and
CV are all embedded, so there are no external dependencies. Served via GitHub Pages.

To update, replace `index.html` and push to `main`.

## Co-Professor

The Co-Professor page is published at https://www.fashengxu.com/co-professor/
and linked from the homepage. Its source is `site/live/` in the private
`Fasheng-Xu/co-professor` repository (branch `claude/sharp-fermat-ybw7n4` until
merged). To refresh it, run from that repository:

```sh
python3 -I site/test_site.py
python3 site/build_static.py --mode live --release \
  --endpoint https://formspree.io/f/mvkznbry \
  --contact francisxu2025@gmail.com
```

Then replace these files in this repository's `co-professor/` folder with the
contents of `site/dist/live/`: `index.html`, `live.css`, `live.js` and `fonts/`.
Leave `editorial/`, `cinematic/` and `archive/` as they are.

- The page has a pilot request form that posts to Formspree (form `mvkznbry`).
  Requests arrive in the Formspree dashboard and by email.
- `editorial/` and `cinematic/` redirect the retired design-review URLs to the
  main page.
- `archive/2026-10-19-codex/` keeps the previous (Codex) version of the page,
  unchanged except for a `noindex` tag. It is not linked from anywhere.
