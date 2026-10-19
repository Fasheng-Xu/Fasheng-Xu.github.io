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

Two alternative designs are available for comparison without replacing that page:

- https://www.fashengxu.com/co-professor/editorial/
- https://www.fashengxu.com/co-professor/cinematic/

To rebuild these previews, add `--include-design-previews` to the command above.
Copy `site/dist/editorial`, `site/dist/cinematic`, and `site/dist/shared` into
`co-professor/` together. Preserve the current `co-professor/index.html` until
a design is selected. The previews use local fonts and licensed Scroll Craft
assets, with no AI requests or form submission service.
