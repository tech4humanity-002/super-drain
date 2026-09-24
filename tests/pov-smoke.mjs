import assert from "node:assert/strict";
import {applyPov,POVS,scorePov} from "../pov.mjs";
const item={title:"Budget migration",content:"The CTO needs to deploy the API. The project has a technical risk and a missing integration.",analysis:{scores:{total:60},actions:["deploy the API"],unfinished_work:["missing integration"],risks:["technical risk"],opportunities:[],decisions:[],intents:[],research_gaps:[],capability_gaps:[],asset_mismatches:[],commercial_candidates:[],assets:[],ideas:[]}};
assert.equal(POVS.length,6);
assert.equal(scorePov(item,"CTO").evidence.length>0,true);
assert.equal(applyPov([item],"CTO")[0].pov.score>0,true);
assert.equal(applyPov([item],"BLENDED")[0].pov.score,60);
console.log(JSON.stringify({status:"REAL",test:"pov-smoke",povs:POVS.map(x=>x.id)}));
