# vDavin website

The public GitHub Pages website for vDavin, a Windows hardware monitor.

- Website: <https://vdavin.nnnnq.cc/>
- Downloads and issues: <https://github.com/Misaka-Nnnnq/vDavin-releases>

The visual direction takes inspiration from the editor and terminal aesthetic
of [LLVM-MSVC](https://www.llvm-msvc.com/), with an original implementation and
vDavin's existing branding, fonts, and colors.

## Local development

The site uses plain HTML, CSS, and browser JavaScript. No package installation or
frontend build step is needed.

```sh
python -m http.server 4173 --bind 127.0.0.1 --directory site
```

Open <http://127.0.0.1:4173>. Use Node.js 24 and Python 3.9+ for checks:

```sh
node --test tests/site.test.mjs
python scripts/check_site.py
```

Only `site/` is uploaded to GitHub Pages. Pushes to `main` validate and publish;
pull requests run checks without deployment. Actions use pinned revisions.
Repository **Settings → Pages → Build and deployment → Source** must be set to
**GitHub Actions**.

## Content and download links

Edit `site/index.html` for content and `site/styles.css` for presentation.
Increment the stylesheet URL's `v` query when publishing CSS changes so returning
visitors receive the new stylesheet without waiting for their cached copy.
`site/app.js` implements the responsive navigation, accessible preview tabs,
illustrative charts, and checksum-command copy action. Preview values are
explicitly illustrative; the website does not sample a visitor's hardware.

Download links default to the public Releases page and work without JavaScript.
The script reads the public releases API, including prereleases, and selects a
published Windows x64 runtime ZIP. If the API fails, is rate-limited, or has no
matching asset, the static links remain usable. No GitHub token is embedded in
the website. There are no analytics or third-party JavaScript libraries.

Keep the test-build, AI participation, partial human review, and driver-source
availability disclosures when updating the page. Application source and its
development history remain in a separate private repository.

## Managing this repository as a submodule

The application repository mounts this repository at `website/`. Edit and commit
website files here, push `main`, then commit the updated `website` submodule
pointer in the application repository. Application code changes and the
application CI remain independent of this website.

## License and assets

Website code is MIT licensed; see [LICENSE](LICENSE).

- JetBrains Mono 2.304: SIL Open Font License 1.1, included at
  `site/assets/JetBrainsMono-OFL.txt`.
- Bootstrap Icons 1.13.1: MIT, included at `site/assets/bootstrap-icons-LICENSE.txt`.
- The Davin icon is the application's existing AI-generated brand asset.

The website does not redistribute application or driver binaries. Their notices
are included with the downloadable application ZIPs.
