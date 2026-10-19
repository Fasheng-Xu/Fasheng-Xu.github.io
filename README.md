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

Its chosen main design is editorial, with source in `Fasheng-Xu/co-professor`.
To refresh it, run this command from that repository:

```sh
python3 site/build_static.py --design editorial --include-design-previews
```

Copy all contents of `site/dist/` into this repository's `co-professor/`
directory, including the main `index.html`, `editorial.css`, `editorial.js`,
and `shared/` assets. Preserve the personal homepage's root `index.html`.

The main page includes the local project brief tool and does not collect form submissions.
No university email address or email contact link is published on the Co-Professor pages.

Both design comparison URLs remain available:

- https://www.fashengxu.com/co-professor/editorial/
- https://www.fashengxu.com/co-professor/cinematic/

The command above also rebuilds these comparison pages. Include
`site/dist/editorial` and `site/dist/cinematic` when copying the output.
The pages use local fonts and licensed Scroll Craft
assets, with no AI requests or form submission service.
