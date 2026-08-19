# Public Content Configuration

Public pages load deployable content from `config/public-content/`:

- `manifest.json` tracks the global revision, update time, and relative file paths.
- `system.json` contains public brand and locale settings only.
- `about.json`, `notices.json`, and `legal/*.json` contain the seven localized content sets.

About, notices, and legal pages use these JSON files as their content source. The web build publishes the files at `/public-content/`. At runtime the app loads `manifest.json` and its referenced files with `cache: no-store`; while loading it shows a localized progress state, and a failed load shows a retry action rather than stale legal content.

The JSON files own localized public content. General UI labels, navigation, status text, and documentation remain in the existing i18n/content modules.

Validate without making changes:

```bash
python3 scripts/manage_content.py --validate
```

Open the interactive manager:

```bash
python3 scripts/manage_content.py
```

Long text opens with `$VISUAL`, then `$EDITOR`, falling back to `vi`. Saving first validates the complete configuration, creates a timestamped snapshot in the gitignored `.content-backups/public-content/` directory, and atomically replaces each JSON file.

`system.json` intentionally accepts only public brand and locale fields. Do not add passwords, tokens, SMTP or database credentials, API keys, or other secrets to any public-content file.

Run the standard-library tests with:

```bash
python3 -m unittest discover -s tests -p 'test_*.py'
```

Before deployment, build the web app and verify that `apps/web/dist/public-content/manifest.json` exists. The release packager requires this directory and copies it to `release/web/public-content/`. Deploy content through a complete versioned release candidate so the manifest and all referenced files change atomically.

For repeatable Codex-assisted updates, use the Chinese prompt templates and i18n rules in [CODEX_PUBLIC_CONTENT_GUIDE.md](CODEX_PUBLIC_CONTENT_GUIDE.md).
