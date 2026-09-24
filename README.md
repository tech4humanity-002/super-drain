# drAIn Lite

**Recover the work that got lost in the work.**

drAIn Lite is an intelligence recovery tool for messy source material such as documents, folders, URLs, CSV/JSON data, code, bookmarks and conversation exports.

It preserves the source, analyses each occurrence, and produces a structured recovery report covering:

- ideas and opportunities
- unfinished work and gaps
- next actions
- intended outputs
- opportunity costs
- claims that still need verification
- evidence-backed receipts and hashes

The useful idea is simple: **drain the backlog before it disappears into history.**

## Why use it?

Most work is not lost because nobody had the idea. It is lost because the idea, decision, unfinished task or useful signal is buried in a document, chat export, folder or web page.

drAIn Lite turns that material into a reviewable work register.

**No Tech 4 Humanity account. No AI API key. No special customer account.**

It can run **in the cloud or locally**.

## Try it

### Cloud

Open the public application and drop in a URL, files or a folder:

https://super-drain.troy-latter.workers.dev

The cloud version can optionally collect submitted material for product improvement and review. The collection setting is visible in the application and can be turned off before submitting.

### Local

Clone the repository, install dependencies, run the tests, then serve the directory with any static HTTP server.

    git clone https://github.com/tech4humanity-002/super-drain.git
    cd super-drain
    npm install
    npm test
    npx serve .

Then open the local address shown by the server.

The core browser workflow does not require an AI service, T4H infrastructure or a private account.

## Point of view

The free Lite release adds a lightweight point-of-view layer. Choose **Blended, CEO, CFO, CTO, CHRO or COO**. The documents are analysed once; the selected POV changes which existing signals are prioritised and shown. It does not create six separate copies of the corpus.

The POV is therefore a presentation and prioritisation layer, not six independent AI analyses. The exported CSV includes the selected POV, POV score and supporting POV evidence.

## No customer setup required

You do not need:

- a Tech 4 Humanity account
- an AI API key
- an AWS account
- AWS SSM
- OpenRouter
- the T4H MCP
- a private repository
- a pre-existing T4H environment

Optional integrations are separate from the core application.

## Cloud collection

drAIn Lite includes an optional product-improvement collection path.

When collection is **ON**, submitted material and analysis results may be retained for product review and improvement. When collection is **OFF**, the core analysis remains local to the browser and the application does not send the submission to the collection service.

Do not submit confidential or sensitive material unless you are comfortable with the collection setting and the published privacy terms.

The collection service is deliberately separate from the core analysis so the application remains useful without it.

## What is local?

The browser application performs ingestion, extraction, analysis, SHA-256 hashing, receipt generation and CSV export locally.

Local persistence uses IndexedDB.

ZIP extraction uses JSZip from jsDelivr. If you need a fully offline environment, download or vendor that dependency as part of your own deployment.

## What happens to a URL?

When a URL is supplied through the application, the URL intake path retrieves the page and preserves the requested and final URL alongside the extracted occurrence.

Private/local network targets are blocked by the URL intake safety checks.

## Optional T4H integration

The public project is intended to work without T4H infrastructure.

The repository also contains an optional world-runtime integration adapter. It is **disabled unless explicitly configured at runtime** and must not be treated as a requirement for the core application.

**Core = usable by anyone.  
Adapters = optional integrations.**

## Product family

**drAIn Lite** is the simple public/free entry point. Deeper role perspectives and broader organisational capabilities can be added above the same Drain evidence model without changing the basic intake workflow.

## Files

- index.html — application shell and public-facing entry point.
- app-v2.mjs — UI, ingestion, reporting and DRAIN controller.
- engine.mjs — extraction, analysis, hashing and report/CSV logic.
- storage.mjs — local persistence and release-data reset.
- collection.mjs — optional product-improvement collection.
- jobs.mjs — job envelope and state transitions.
- src/ — local runtime, storage, intelligence, outtake and quality-review components.
- tests/ — deterministic smoke tests.
- scripts/ — runtime and quality acceptance checks.

## Test commands

    npm test

Runtime acceptance against a running local runtime:

    npm run acceptance:runtime

Quality acceptance against a running local runtime:

    npm run acceptance:quality

## Fresh-machine principle

A public repository is not considered usable merely because the source is visible.

The intended release test is:

**clone → install → run → submit real input → inspect meaningful output**

with no T4H credentials or private infrastructure.

That is the standard for public release.

## Security

Please do not commit API keys, passwords, tokens, private URLs or other credentials.

If you find a security issue, use the repository's security reporting mechanism rather than publishing credentials or exploit details in an issue.

## Licence

This repository is currently published for inspection and use while its licensing position is being finalised. Check the repository before redistributing it as a third-party package.

## Contact

Questions, support or product feedback:

- info@aisweetspots.com
- support@aisweetspots.com
- innovation@aisweetspots.com

## Status

drAIn Lite is an active project. Expect the public version to evolve as people test it, report problems and contribute improvements.

**If you find something that makes it better, please open an issue or pull request.**