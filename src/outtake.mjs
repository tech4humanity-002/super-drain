import crypto from "node:crypto";
import {flattenRecoveredWork} from "./intelligence.mjs";
const normalise=value=>String(value||"").replace(/\s+/g," ").trim().toLowerCase();
const clamp=(value,fallback,max)=>Math.min(max,Math.max(1,Number(value)||fallback));
const stableHash=value=>crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
const stableId=key=>`recovered:${crypto.createHash("sha256").update(key).digest("hex").slice(0,20)}`;
export function buildOuttake(state={}, {limit=200,evidenceLimit=25}={}) {
  const groups=new Map(),resultLimit=clamp(limit,200,1000),evidenceWindow=clamp(evidenceLimit,25,100);
  for(const item of state.items||[]) for(const work of flattenRecoveredWork(item.intelligence||{})){
    const key=`${work.kind}:${normalise(work.summary)}:${normalise(work.next_action)}`;
    const evidence={occurrence_id:item.occurrence_id,source_system:item.source_system,source_session:item.source_session,source_occurrence_ref:item.source_occurrence_ref,title:item.title,url:item.url,state:item.state,content_hash:item.content_hash};
    const existing=groups.get(key);
    if(existing){if(existing.evidence.length<evidenceWindow)existing.evidence.push(evidence);existing.occurrence_count++;existing.confidence=Math.max(existing.confidence,Number(work.confidence||0));continue}
    groups.set(key,{work_id:stableId(key),kind:work.kind,summary:work.summary,next_action:work.next_action||null,confidence:Number(work.confidence||0),occurrence_count:1,evidence:[evidence]});
  }
  const work=[...groups.values()].sort((a,b)=>(b.confidence-a.confidence)||(b.occurrence_count-a.occurrence_count)||a.work_id.localeCompare(b.work_id)).slice(0,resultLimit).map(item=>({...item,evidence_returned:item.evidence.length,evidence_truncated:item.occurrence_count>item.evidence.length}));
  const byKind=work.reduce((out,item)=>(out[item.kind]=(out[item.kind]||0)+1,out),{});
  const stablePayload={schema:"t4h.super-drain.outtake.v1",source_occurrences:(state.items||[]).length,recovered_work:work.length,result_limit:resultLimit,evidence_limit:evidenceWindow,by_kind:byKind,work};
  return {...stablePayload,generated_at:new Date().toISOString(),readback_hash:stableHash(stablePayload)};
}
