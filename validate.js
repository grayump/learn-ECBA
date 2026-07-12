// Validates the ECBA content JSON files against questions_schema.md's rules.
// Usage: node validate.js
const fs = require("fs");
const path = require("path");

const DIR = __dirname;
const errors = [];
const warnings = [];
const info = [];

function readJson(file) {
  const p = path.join(DIR, file);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch (e) {
    errors.push(`cannot parse ${file}: ${e.message}`);
    return null;
  }
}

const domainsFile = readJson("domains.json");
const techniquesFile = readJson("techniques.json");
const competenciesFile = readJson("competencies.json");

if (!domainsFile) errors.push("domains.json is required and could not be loaded");
if (!techniquesFile) errors.push("techniques.json is required and could not be loaded");
if (!competenciesFile) errors.push("competencies.json is required and could not be loaded");

const domains = domainsFile ? domainsFile.domains : [];
const techniques = techniquesFile ? techniquesFile.techniques : [];
const competencyCategories = competenciesFile ? competenciesFile.categories : [];

const validDomainIds = new Set(domains.map((d) => d.id));
const activityIdsByDomain = new Map();
domains.forEach((d) => {
  activityIdsByDomain.set(d.id, new Set((d.activity_statements || []).map((a) => a.id)));
});
const techniqueNames = new Set(techniques.map((t) => t.name));
const competencyNames = new Set(competencyCategories.flatMap((c) => c.competencies));

// domains.json sanity checks
if (domains.length) {
  const weightSum = domains.reduce((s, d) => s + (d.weight_pct || 0), 0);
  if (weightSum !== 100) errors.push(`domains.json: weight_pct values sum to ${weightSum}, expected 100`);

  const seenDomainIds = new Set();
  domains.forEach((d) => {
    if (seenDomainIds.has(d.id)) errors.push(`domains.json: duplicate domain id ${d.id}`);
    seenDomainIds.add(d.id);
    if (!d.activity_statements || d.activity_statements.length !== 4) {
      warnings.push(`domains.json: domain ${d.id} has ${d.activity_statements ? d.activity_statements.length : 0} activity statements, expected 4`);
    }
    const seenActIds = new Set();
    (d.activity_statements || []).forEach((a) => {
      if (seenActIds.has(a.id)) errors.push(`domains.json: duplicate activity_statement id ${a.id} in domain ${d.id}`);
      seenActIds.add(a.id);
    });
  });
}

const REQUIRED_FIELDS = ["id", "domain_id", "activity_statement_id", "question_type", "stem", "options", "correct_index", "explanation", "difficulty"];
const VALID_QUESTION_TYPES = new Set(["definition", "situational"]);
const VALID_DIFFICULTIES = new Set(["easy", "medium", "hard"]);

const allIds = new Set();
let totalLoaded = 0;
const countsByDomain = {};

for (let d = 1; d <= 9; d++) {
  const file = `questions_domain${d}.json`;
  const p = path.join(DIR, file);
  if (!fs.existsSync(p)) {
    info.push(`domain ${d}: no question file yet (${file})`);
    countsByDomain[d] = 0;
    continue;
  }

  const questions = readJson(file);
  if (!questions) continue;

  countsByDomain[d] = questions.length;
  totalLoaded += questions.length;

  questions.forEach((q, i) => {
    const label = q.id || `${file}#${i}`;

    REQUIRED_FIELDS.forEach((f) => {
      if (q[f] === undefined || q[f] === null || q[f] === "") {
        errors.push(`${label}: missing required field "${f}"`);
      }
    });
    if (!Array.isArray(q.options) || q.options.length < 2) {
      errors.push(`${label}: "options" must be an array of at least 2 items`);
    }

    if (q.id) {
      const m = /^d(\d+)-\d{3,}$/.exec(q.id);
      if (!m) {
        errors.push(`${label}: id does not match pattern d{domain}-{sequence}`);
      } else if (Number(m[1]) !== q.domain_id) {
        errors.push(`${label}: id prefix domain (${m[1]}) does not match domain_id (${q.domain_id})`);
      }
      if (allIds.has(q.id)) errors.push(`${label}: duplicate id across question files`);
      allIds.add(q.id);
    }

    if (q.domain_id !== d) errors.push(`${label}: domain_id (${q.domain_id}) does not match containing file (domain ${d})`);
    if (q.domain_id !== undefined && !validDomainIds.has(q.domain_id)) {
      errors.push(`${label}: domain_id ${q.domain_id} not found in domains.json`);
    }
    if (q.activity_statement_id !== undefined) {
      const validActIds = activityIdsByDomain.get(q.domain_id);
      if (!validActIds || !validActIds.has(q.activity_statement_id)) {
        errors.push(`${label}: activity_statement_id "${q.activity_statement_id}" not found under domain ${q.domain_id}`);
      }
    }

    if (Array.isArray(q.options)) {
      if (!Number.isInteger(q.correct_index) || q.correct_index < 0 || q.correct_index >= q.options.length) {
        errors.push(`${label}: correct_index (${q.correct_index}) is out of range for ${q.options.length} options`);
      }
    }

    if (q.question_type !== undefined && !VALID_QUESTION_TYPES.has(q.question_type)) {
      errors.push(`${label}: invalid question_type "${q.question_type}"`);
    }
    if (q.difficulty !== undefined && !VALID_DIFFICULTIES.has(q.difficulty)) {
      errors.push(`${label}: invalid difficulty "${q.difficulty}"`);
    }

    if (q.technique_tag) {
      if (!techniqueNames.has(q.technique_tag)) {
        if (competencyNames.has(q.technique_tag)) {
          warnings.push(`${label}: technique_tag "${q.technique_tag}" resolves as a competency, not a technique`);
        } else {
          warnings.push(`${label}: technique_tag "${q.technique_tag}" does not match any known technique or competency`);
        }
      }
    }
    if (q.competency_tag) {
      if (!competencyNames.has(q.competency_tag)) {
        if (techniqueNames.has(q.competency_tag)) {
          warnings.push(`${label}: competency_tag "${q.competency_tag}" resolves as a technique, not a competency`);
        } else {
          warnings.push(`${label}: competency_tag "${q.competency_tag}" does not match any known technique or competency`);
        }
      }
    }
  });
}

console.log("ECBA content validation");
console.log("========================");
for (let d = 1; d <= 9; d++) {
  console.log(`  domain ${d}: ${countsByDomain[d] || 0} questions`);
}
console.log(`  total: ${totalLoaded} / 300 target`);
console.log("");

if (info.length) {
  console.log(`INFO (${info.length}):`);
  info.forEach((m) => console.log(`  INFO: ${m}`));
  console.log("");
}
if (warnings.length) {
  console.log(`WARNINGS (${warnings.length}):`);
  warnings.forEach((m) => console.log(`  WARN: ${m}`));
  console.log("");
}
if (errors.length) {
  console.log(`ERRORS (${errors.length}):`);
  errors.forEach((m) => console.log(`  ERROR: ${m}`));
  console.log("");
}

console.log(errors.length ? `FAILED with ${errors.length} error(s), ${warnings.length} warning(s).` : `OK — 0 errors, ${warnings.length} warning(s).`);
process.exit(errors.length ? 1 : 0);
