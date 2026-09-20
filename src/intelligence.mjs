const normalise = value => String(value || "").replace(/\s+/g, " ").trim();

const rules = {
  actions: /\b(build|create|fix|finish|complete|test|review|migrate|deploy|research|investigate|contact|follow[ -]?up|write|update|integrate|connect|verify|audit|commerciali[sz]e|implement|prepare|attach|assign|requeue|repair)\b/i,
  unfinished_work: /\b(todo|to do|next|pending|incomplete|unfinished|remaining|needs? (?:to )?be|awaiting|follow[ -]?up|blocked|partial)\b/i,
  opportunities: /\b(opportunit|revenue|customer|grant|partner|commercial|product|sell|sales|market|white[ -]?label|cross[ -]?sell|pilot)\w*/i,
  risks: /\b(risk|broken|failure|failed|blocker|security|legal|missing|error|incident|degraded|unsafe)\w*/i,
  ideas: /\b(idea|could|should|maybe|concept|proposal|possib|consider|what if|use case)\w*/i,
  decisions: /\b(decision|decided|agreed|approved|selected|chose|chosen|adopt|adopted|committed to|go with|will use)\b/i,
  intents: /\b(intend|intends|intended|plan|planned|planning|aim|goal|want to|need to|must|going to|we will|i will)\b/i,
  research_gaps: /\b(research gap|evidence gap|needs? (?:more |further )?research|further research|missing evidence|not yet validated|unvalidated research)\b/i,
  capability_gaps: /\b(agent overlap|duplicate agents?|overlapping agents?|worker overlap|duplicate workers?|capability gap|missing capability|worker gap|agent gap|no (?:agent|worker) (?:covers|owns|handles))\b/i,
  asset_mismatches: /\b(domain mismatch|product mismatch|ip mismatch|unmapped domain|unmapped product|unmapped ip|orphan(?:ed)? domain|orphan(?:ed)? product|orphan(?:ed)? ip|domain (?:is )?not linked|product (?:is )?not linked|ip (?:is )?not linked)\b/i,
  commercial_candidates: /\b(commerciali[sz]ation candidate|commercial candidate|pricing needed|price missing|needs? pricing|go[- ]to[- ]market|gtm candidate|moneti[sz]ation candidate|ready to (?:sell|commerciali[sz]e))\b/i,
  assets: /\b(repo|repository|domain|website|document|workbook|agent|worker|dataset|research|api|service|product|ip|code|model)\w*/i
};
const actionVerb = text => text.match(rules.actions)?.[1]?.toLowerCase() || null;
export function inferIntelligence(raw = {}) {
  const title = normalise(raw.title), content = normalise(raw.content), text = normalise(`${title}. ${content}`);
  const source = raw.url || raw.source_file || null;
  const evidence = { title: title || null, source, occurrence_ref: raw.occurrence_ref || null };
  const fileLikeTitle = /\.(?:html?|json|md|txt|csv)$/i.test(title);
  const contentSubject = content.slice(0, 240);
  const summarySubject = (title && !fileLikeTitle ? title : contentSubject || title) || "Untitled recovered item";
  const actionSubject = (title && !fileLikeTitle ? title : content.slice(0, 180) || title) || "recovered work";
  const make = (type, confidence, extra = {}) => ({type,summary:summarySubject,confidence,evidence,...extra});
  const intelligence = {ideas:[],actions:[],unfinished_work:[],decisions:[],intents:[],research_gaps:[],capability_gaps:[],asset_mismatches:[],commercial_candidates:[],assets:[],risks:[],opportunities:[]};
  if (!text) return intelligence;
  const verb = actionVerb(text);
  if (rules.actions.test(text)) intelligence.actions.push(make("action", title ? .78 : .66,{next_action:verb ? `${verb}: ${actionSubject}` : actionSubject}));
  if (rules.unfinished_work.test(text)) intelligence.unfinished_work.push(make("unfinished_work",.76,{next_action:verb ? `${verb}: ${actionSubject}` : `review and complete: ${actionSubject}`}));
  if (rules.decisions.test(text)) intelligence.decisions.push(make("decision",.74,{next_action:`execute or verify decision: ${actionSubject}`}));
  if (rules.intents.test(text)) intelligence.intents.push(make("intent",.64,{next_action:`convert intent to concrete action: ${actionSubject}`}));
  if (rules.research_gaps.test(text)) intelligence.research_gaps.push(make("research_gap",.76,{next_action:`close evidence gap: ${actionSubject}`}));
  if (rules.capability_gaps.test(text)) intelligence.capability_gaps.push(make("capability_gap",.74,{next_action:`reconcile agent ownership/capability: ${actionSubject}`}));
  if (rules.asset_mismatches.test(text)) intelligence.asset_mismatches.push(make("asset_mismatch",.74,{next_action:`reconcile domain/product/IP mapping: ${actionSubject}`}));
  if (rules.commercial_candidates.test(text)) intelligence.commercial_candidates.push(make("commercial_candidate",.72,{next_action:`qualify pricing and go-to-market: ${actionSubject}`}));
  if (rules.opportunities.test(text)) intelligence.opportunities.push(make("opportunity",.68,{next_action:`qualify opportunity: ${actionSubject}`}));
  if (rules.risks.test(text)) intelligence.risks.push(make("risk",.72,{next_action:`verify and remediate: ${actionSubject}`}));
  if (rules.ideas.test(text)) intelligence.ideas.push(make("idea",.58,{next_action:`evaluate: ${actionSubject}`}));
  if (rules.assets.test(text)) intelligence.assets.push(make("asset",.62));
  return intelligence;
}
export function flattenRecoveredWork(intelligence = {}) {
  return ["unfinished_work","actions","decisions","intents","research_gaps","capability_gaps","asset_mismatches","commercial_candidates","opportunities","risks","ideas"].flatMap(kind => (intelligence[kind] || []).map(item => ({kind,...item}))).sort((a,b)=>(b.confidence||0)-(a.confidence||0));
}
