# Fasheng Xu — Personal Website

Research-focused personal website for **Fasheng Xu**, Assistant Professor of
Operations and Information Management, University of Connecticut.

**Live:** https://fasheng-xu.github.io

A single, self-contained `index.html` — fonts (Newsreader + Inter), headshot, and
CV are all embedded, so there are no external dependencies. Served via GitHub Pages.

To update, replace `index.html` and push to `main`.

## Co-Professor

The standalone Co-Professor page is published at
https://www.fashengxu.com/co-professor/ and linked from the homepage.

Its source lives in `Fasheng-Xu/co-professor`. To refresh it, run this command
from that repository, then copy `site/dist/index.html` to
`co-professor/index.html` in this repository:

```sh
python3 site/build_static.py --contact-email fasheng.xu@uconn.edu --home-url https://www.fashengxu.com/
```

The public page uses an email contact link and does not collect form submissions.
