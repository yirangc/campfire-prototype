# Campfire design system

Design tokens, assets, components and a browsable showcase for the Campfire exercise, built from the Campfire Figma references. All data in the showcase is labelled as either transcribed from Figma or sample data.

## Run locally

```sh
npm install
npm run dev      # http://localhost:5173
npm test
npm run build && npm run preview
```

See [CLAUDE.md](CLAUDE.md) for structure and design rules, and [docs/design-flags.md](docs/design-flags.md) for conflicts, undocumented choices, accessibility concerns and unverified items.

## Deploy to GitHub Pages (not done yet)

The build is static and uses relative asset paths, so it works from a project subpath such as `https://<user>.github.io/<repo>/`.

1. Create the GitHub repository and push `main`.
2. In the repository, open Settings, then Pages, and set Source to "GitHub Actions".
3. Open Actions, choose "Deploy showcase to GitHub Pages", and click "Run workflow". The workflow (`.github/workflows/pages.yml`) runs tests, builds and publishes `dist/`. It runs only when started by hand.
4. To deploy on every push instead, add `push: branches: [main]` under `on:` in the workflow.

### When to use Netlify instead

GitHub Pages stays suitable while the app is a static single page. Switch to Netlify if the prototype needs any of these: client-side routes that must work on refresh or direct links (Pages has no rewrite rules, only a 404.html workaround), a private repository on a plan without private Pages, deploy previews for pull requests, or serverless functions and environment secrets. On Netlify, set the build command to `npm run build`, the publish directory to `dist`, and add a `/* /index.html 200` rewrite if routing is added.
