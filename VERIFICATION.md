# Release verification

Prepared on 2026-10-26 for GitHub Pages. No build step is required.

## Passed

- All linked JavaScript, stylesheet, favicon, and font files exist. Relative asset paths resolve correctly for both `https://USERNAME.github.io/` and `https://USERNAME.github.io/REPOSITORY/`.
- All interface element references resolve to elements in `index.html`; JavaScript parses and the bundled PDF scripts execute.
- All ten bundled WOFF font faces parse as Latin Modern fonts.
- Markdown parsing covers the eight requested sections, entry headings, fields, paragraphs, bullets, unknown sections, duplicate sections, line endings, BOMs, empty input, and titles such as C#.
- Selection changes affect only the selected output. Empty selections disable export. Markdown round trips, section order, and LaTeX escaping pass checks.
- Profile, website, email, phone, ORCID, and explicit Markdown links have the expected targets in previews and LaTeX. Unsafe link schemes do not become active links.
- CV names use the browser's local date, zero-padded as YYYY-MM-DD. Existing date names receive unique `(1)`, `(2)`, etc. counters. A new day starts with its own date. Restoring an older automatic name and saving creates the next available name and a new record.
- Manual names remain editable. Snapshots are appended rather than replaced. Renaming preserves the record's original date.
- History reload restores Markdown, selected items, section order, style, and font. Storage quota errors and unreadable history preserve existing data and leave downloads available.
- Unapplied Markdown changes cannot be exported with outdated checks.
- Markdown imports work; oversized or unreadable files are handled without replacing the current source.
- The actual bundled PDF library and font data produce PDF files for all six styles and three fonts: 18 combinations. PDF export creates a saved snapshot on success and avoids adding one when generation fails.
- All 18 PDFs contain complete selectable sample text, embedded TrueType fonts, expected contact links, and link annotations within page bounds.
- PDF pages for every style were rendered and visually inspected, including continuation pages.
- The release ZIP was checked for integrity and includes the application, bundled assets, sample, tests, and licenses. Generated test output is excluded.

## Verification limits

The interface checks used a simulated DOM. A real browser layout and native download/clipboard smoke test could not run because the browser preview service was unavailable in the preparation environment.

Actual LaTeX compilation could not be verified in this environment. The exported source targets XeLaTeX or LuaLaTeX with the packages listed in README.md. Direct PDF generation was verified separately and does not use a LaTeX compiler.

GitHub Pages asset paths and deployment instructions were checked; publication to your own GitHub repository happens after upload and Pages configuration.

## Reproduce application checks

Run `node tests/verify.cjs` with Node.js 20 or newer. No package installation is required. The command generates test PDFs and TeX files in `test-output/`.
