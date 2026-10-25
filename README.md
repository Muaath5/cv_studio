# CV Studio

A static Markdown CV editor for GitHub Pages. No backend, build step, API keys, or runtime CDN dependencies.

## Deploy to GitHub Pages

1. Extract this ZIP.
2. Create a GitHub repository and upload **the extracted contents** to its root on the `main` branch. `index.html` must be directly in the repository root, beside `assets/` and `.nojekyll`.
3. Open the repository's **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**, select **main** and **/(root)**, then **Save**.
5. Wait for GitHub's Pages deployment to finish. Open the site URL shown in Pages settings.

The same files work at `https://USERNAME.github.io/` or `https://USERNAME.github.io/REPOSITORY/`. All asset references are relative; no base URL needs to be edited. Include `.nojekyll` when uploading, including if your file manager hides dotfiles.

Official instructions: [Configure a GitHub Pages publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## Use

- Import `.md` or edit the sample, then click **Apply**. Applying reparses the source and resets selection.
- Check or uncheck sections, entries, and individual fields or bullets. Arrows reorder sections.
- Choose one of six styles and a separate Latin Modern font.
- Download `.tex`, `.pdf`, or selected `.md`. **Save CV** saves a snapshot without downloading.
- Expand **My CVs** to reload a saved snapshot or rename it.
- **New CV** starts from the sample with the next automatic name.

New names use the browser's local calendar date: `YYYY-MM-DD`, `YYYY-MM-DD (1)`, `YYYY-MM-DD (2)`, etc. Each successful save or export creates a new snapshot. Restoring an older automatically named CV and saving again assigns the next available date name. Custom names stay editable and may be reused across separate snapshots.

Each snapshot stores the full Markdown, checks, section order, style, font, name, export type, and date. Renaming changes only that snapshot's name. Snapshots stay in `localStorage` in the same browser and website origin. They are not uploaded to GitHub or synced across devices. Clearing site data removes local history. If browser storage is unavailable or full, downloads still work and the app shows a notice.

The initial page starts a new CV rather than automatically opening an old one. Your previous snapshots remain in My CVs.

## Markdown format

Use `##` for sections and `###` for entries. Supported section names are Information, Education, Objective, Volunteering, Awards, Publications, Skills, and Projects. Custom sections are retained with a notice.

```markdown
## Information
- Name: Alex Morgan
- Username: alexmorgan
- LinkedIn: alex-morgan
- Email: alex@example.com
- Phone: +966 50 000 0000
- Website: https://example.com

## Education
### BSc in Computer Science
- Organization: Example University
- Dates: 2022–2026
- Graduated with distinction.

## Objective
A short paragraph about your goals.

## Skills
- Python
- Technical writing
```

Recognized field keys, case-insensitively: Name, Email, Phone, Location, Website, GitHub, GitLab, LinkedIn, Username, ORCID, Scholar, Link, Organization, Institution, Dates, Date, URL, GPA, Degree, Role, Authors, Venue, Status. Other list lines become selectable bullets. Blank lines separate paragraphs.

`Username` maps a bare username to GitHub. LinkedIn accepts a profile slug or full URL. Email and phone become `mailto:` and `tel:` links. A complete `[label](https://example.com)` field or bullet creates a custom link. Other inline Markdown stays literal. Only HTTP(S), email, and phone destinations become active links.

## PDF and LaTeX

PDF generation runs locally and produces A4 documents with embedded fonts, selectable text, page breaks, and clickable links. It uses a bundled PDF renderer rather than a LaTeX compiler, so pagination and styling can differ from compiled LaTeX and the HTML preview. The selected Latin Modern fonts support their bundled character sets; unsupported PDF characters produce an error rather than silently disappearing.

Compile exported `.tex` with **XeLaTeX** or **LuaLaTeX**, using a TeX distribution that includes `fontspec`, `geometry`, `enumitem`, `titlesec`, `xcolor`, `tabularx`, `hyperref`, and the Latin Modern fonts. No compiler runs on GitHub Pages.

## Local use

You can open `index.html` directly for basic use. For reliable browser storage behavior, serve the folder locally:

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000`. Keep using the same origin to retain access to local CV history. A move from a local file to GitHub Pages uses a different storage origin.

## Verify

With Node.js 20 or newer, run:

```sh
node tests/verify.cjs
```

No installation is required. Tests exercise parsing, selection, links, history, date names, and all 18 style/font PDF combinations. Generated test files go to `test-output/`, which is ignored by Git. See `VERIFICATION.md` for the checks performed for this release and their limits.

## Files

- `index.html`: interface and relative asset links.
- `assets/app.js`: parser, selection, history, exports, and naming.
- `assets/styles.css`, `assets/fonts/`: interface, CV styles, and bundled web fonts.
- `assets/pdf-fonts.js`: embedded PDF fonts and metrics.
- `assets/vendor/pdf-lib.min.js`: bundled PDF library.
- `sample.md`: example master CV.
- `tests/verify.cjs`: dependency-free checks.
- `licenses/`: third-party licenses.

## Credits

The AutoCV layout is an original implementation inspired by [Jitin Nair's autoCV](https://github.com/jitinnair1/autoCV). Latin Modern fonts and pdf-lib are distributed under their respective licenses. See `THIRD_PARTY_NOTICES.md`.
