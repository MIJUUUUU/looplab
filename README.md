# Looplab

React/TypeScript, Vue SFC/TypeScript, HTML/CSS/JS browser playground with Tailwind CSS, automatic preview, console/fetch logs, API requests, mobile preview, local autosave, and JSON export.

## Run

```sh
python3 -m http.server 4173 --directory dist
```

Open http://localhost:4173. No build required. CDN access is required for Babel, Vue, React, and Tailwind.

## Scope

- Each mode has its own editable entry point and CSS; HTML additionally has a JS tab.
- React entry point must default-export its component. Vue supports script setup, TypeScript, templates, and scoped CSS.
- Tailwind uses its browser compiler for this development playground.
- Preview executes in an iframe with allow-scripts, without same-origin permission.
- Arbitrary local modules, npm installation, backend runtimes, Sass, and production bundling are not implemented.
- API calls originate in the browser; the target must permit CORS. Credentials/cookies are omitted. API headers are not saved. Do not put secret keys into the editor or headers.
- Edits trigger a full preview reload; component state resets. Infinite loops can still block the browser tab.
- Project code is saved in browser localStorage, not a cloud database. Export downloads the current mode as JSON.

## Validation

JavaScript syntax, actual React TSX / Vue SFC / HTML compilation, generated module parsing, Tailwind injection, and compile-error reporting were checked. Local HTTP returned 200. Interactive browser QA was unavailable because the browser access host could not connect.

## Preview execution

Manual Run (or Cmd/Ctrl+Enter) cancels any scheduled automatic run and reads the current editor value immediately. Automatic preview runs 250 ms after the last edit, pausing during IME composition. Obsolete compilation results and ready messages are ignored. Pending, loading, completion, and visible errors are shown beside the editor/preview. Full reloads still reset preview state.

Regression checks: `BABEL_PATH=/path/to/babel.cjs VUE_COMPILER_PATH=/path/to/compiler-sfc.mjs node tests/preview.test.cjs`. Use the official `@babel/standalone@7/babel.min.js` and `@vue/compiler-sfc@3.5.22/dist/compiler-sfc.esm-browser.js` builds. These checks cover scheduling, stale runs, manual execution, IME, errors, and all three compilation modes, using a simulated DOM; they do not replace browser rendering QA.
