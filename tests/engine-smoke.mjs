import assert from "node:assert/strict";
import {sha256, analyseOccurrence, createOccurrence, buildReport, toCsv} from "../engine.mjs";

const digest = await sha256("super-drain");
assert.equal(digest.length, 64, "SHA-256 must be 64 hex characters");

const raw = {
  source_file: "smoke.md",
  source_type: "text_occurrence",
  occurrence_ref: "smoke.md:line-1",
  title: "Super Drain test",
  content: "This is a new opportunity to build a reusable dashboard. Next we need to test and verify the deployment. The current workflow is missing a receipt and is unfinished."
};

const analysis = analyseOccurrence(raw, new Set(["current", "workflow"]));
assert.ok(analysis.ideas.length > 0, "ideas should be detected");
assert.ok(analysis.actions.length > 0, "actions should be detected");
assert.ok(analysis.unfinished.length > 0, "unfinished work should be detected");
assert.ok(analysis.scores.total >= 0 && analysis.scores.total <= 100, "score must be bounded");

const batch = {batch_id: "batch_smoke001", source_name: "smoke.md", source_type: "bulk_file", started_at: new Date().toISOString()};
const occurrence = await createOccurrence(raw, batch, 0, new Set());
assert.match(occurrence.page_id, /^PAGE-/);
assert.match(occurrence.occurrence_id, /^occ_/);
assert.equal(occurrence.content_hash.length, 64);
assert.equal(occurrence.status, "analysed");
const sameMaterial = await createOccurrence({...raw, occurrence_ref:"smoke.md:line-999"}, batch, 1, new Set());
assert.equal(sameMaterial.content_hash, occurrence.content_hash, "same material must deduplicate regardless of occurrence reference");

const report = buildReport([occurrence]);
assert.equal(report.pages, 1);
assert.equal(report.sources, 1);
assert.equal(report.evidence_units, 1);
assert.equal(report.top_pages.length, 1);
assert.ok(Array.isArray(report.top_actions));

const csv = toCsv([occurrence]);
assert.match(csv, /^POV,POV Score,POV Evidence,Page ID,Source,Occurrence/);
assert.match(csv, /PAGE-/);

console.log("SUPER_DRAIN_SMOKE_TEST=PASS");
console.log(JSON.stringify({pages: report.pages, sources: report.sources, evidence_units: report.evidence_units, score: occurrence.analysis.scores.total, sha256: occurrence.content_hash}, null, 2));
