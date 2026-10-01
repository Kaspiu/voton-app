# Contributing to Voton

You can contribute by reporting bugs, suggesting improvements or proposing code changes. All pull requests are reviewed by the maintainer before they are merged. You do not need collaborator access to contribute through a fork.

## Report a bug or suggest a feature

Check [existing issues](https://github.com/Kaspiu/voton-app/issues) first. If there is no matching discussion, [open an issue](https://github.com/Kaspiu/voton-app/issues/new/choose) using the bug report or feature request template.

- For bugs, include steps to reproduce, expected behavior, and your browser and operating system.
- For features, describe the problem and how the proposed change would help.
- Discuss larger changes in an issue before starting implementation.
- Use sample notes in screenshots and examples. Do not upload personal notes or workspace backups.

## Run the project locally

Fork the repository, clone your fork and create a branch for your change. Use Node.js and npm, then run:

```bash
npm ci
npm run dev
```

Open [localhost:3000](http://localhost:3000). The root address redirects to the workspace at `/documents`.

## Make a change

Keep each pull request focused on one problem. Follow the existing TypeScript and React patterns, and avoid unrelated refactors, formatting changes or dependency upgrades.

Voton is a local-first writing workspace:

- Pages, folders and editor content stay in the browser's IndexedDB. Small UI preferences may use localStorage.
- Discuss architectural changes such as accounts, cloud sync, tracking or remote storage with the maintainer first.
- Preserve existing user data. Do not clear or recreate the database to work around a problem.
- Change database stores, indexes, keys or persisted formats only when needed. Use the IndexedDB upgrade path and increase the database version when required.
- Preserve compatibility with existing JSON backups where practical, and validate imported content before storing or rendering it.

## Verify your change

For code changes, run:

```bash
npm run lint
npm run build
```

The build needs an internet connection to download the Geist fonts. If a check cannot finish, describe the reason in your pull request.

Manually check the affected workflow with sample data. If the change touches persistence or import/export, also check that existing notes and backups remain usable. For documentation changes, check links, commands and images.

## Open a pull request

Push your branch to your fork and open a pull request targeting `main` in `Kaspiu/voton-app`.

- Use a clear title and complete the pull request template.
- Explain the problem, the resulting behavior and how you verified the change.
- Link the related issue. Use `Fixes #123` only when the change fully resolves it.
- Include screenshots for UI changes and mention any effect on local data or backup compatibility.

The maintainer may request revisions before merging. A pull request is a proposal; submitting one does not grant permission to push directly to this repository.
