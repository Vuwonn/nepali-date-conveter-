# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.
You can also try [the experimental native React Compiler support in plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md#rust-react-compiler) by using `compiler: true` in the plugin options instead of using the Babel plugin.

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.

## Nepali Patro events

Festival/holiday data for the patro at `src/pages/NepaliPatro.tsx` lives in
`src/lib/events/<year>.ts` and is merged in `src/lib/nepaliEvents.ts`.

### Regenerating a year

```sh
npm run events:generate 2084   # scrape + generate src/lib/events/2084.ts
npm run events:generate        # defaults to 2083
npm run events:generate 2084 --force   # refetch even if cached
```

- Source: [nepalicalendar.rat32.com](https://nepalicalendar.rat32.com/) (the
  scraper target of `the-value-crew/nepali-calendar-api/`). Note that
  the-value-crew's committed JSON only covers through 2080 BS.
- Raw per-month JSON is cached under `data/raw/<year>/` so re-runs work offline.
- The script validates every day's AD date and weekday against
  `nepali-date-library` and prints per-month mismatch counts. If the source
  month length differs from the library (Jestha/Shrawan/Falgun 2083), it is
  reported as `MISMATCH` — do not hand-fix, the library drives the calendar grid.
- Type rules: `public-holiday` = the source's official holiday list (red rows)
  or a non-Saturday red cell; `festival` = named occasions; `observance` =
  Ekadashi / Purnima / Aunsi / Sankranti. Saturdays are red in the source but
  never emitted as plain events.
