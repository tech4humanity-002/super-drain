import {readState,writeState} from "./storage.mjs";

const esc=s=>String(s??"").replace(/[&<>\"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'\"':"&quot;","'":"&#39;"}[c]));
const now=()=>new Date().toISOString();
const tokens=s=>new Set((String(s||"").toLowerCase().match(/[a-z0-9]{5,}/g)||[]));
const overlap=(a,b)=>{if(!a.size||!b.size)return 0;let n=0;for(const x of a)if(b.has(x))n++;return n/Math.max(a.size,b.size)};

async function learn(){
  const items=await readState("super-drain-items",[]);
  const jobs=await readState("super-drain-jobs",[]);
  const receipts=await readState("super-drain-learning-receipts",[]);
  const knowledge=await readState("super-drain-knowledge-index",{});
  const changes=[];
  const active=new Set();

  for(const x of items){
    const id=x.occurrence_id||x.page_id||`${x.source_file}:${x.occurrence_number}`;
    active.add(id);
    const fingerprint=x.content_hash||`${x.title}|${x.content}`;
    const previous=knowledge[id];
    let state="KNOWN";
    if(!previous) state="NEW";
    else if(previous.fingerprint!==fingerprint) state="CHANGED";
    knowledge[id]={fingerprint,title:x.title,source_file:x.source_file,url:x.url,last_seen_at:now(),first_seen_at:previous?.first_seen_at||now(),status:state};
    if(state!=="KNOWN")changes.push({id,title:x.title,source:x.source_file,state});
  }

  const corpus=items.map(x=>({id:x.occurrence_id||x.page_id||x.source_file,title:x.title,text:`${x.title} ${x.content||""}`,tokens:tokens(`${x.title} ${x.content||""}`)}));
  const themes=new Map();
  for(const x of corpus){
    for(const y of corpus){if(x.id===y.id)continue;const score=overlap(x.tokens,y.tokens);if(score<0.55)continue;const key=[x.id,y.id].sort().join("|");themes.set(key,{a:x.title,b:y.title,score:Math.round(score*100)});}
  }

  const wordCounts=new Map();
  for(const x of corpus)for(const t of x.tokens)wordCounts.set(t,(wordCounts.get(t)||0)+1);
  const recurring=[...wordCounts.entries()].filter(([,n])=>n>=3).sort((a,b)=>b[1]-a[1]).slice(0,20).map(([term,count])=>({term,count}));

  const completed=jobs.filter(j=>["succeeded","failed","cancelled"].includes(j.status));
  const operational={
    jobs:jobs.length,
    completed:completed.length,
    succeeded:completed.filter(j=>j.status==="succeeded").length,
    failed:completed.filter(j=>j.status==="failed").length,
    cancelled:completed.filter(j=>j.status==="cancelled").length,
    receipts:receipts.length,
    runtime_independent:true
  };

  const result={schema:"t4h.super-drain.learning.v1",learned_at:now(),items:items.length,new:changes.filter(x=>x.state==="NEW").length,changed:changes.filter(x=>x.state==="CHANGED").length,known:items.length-changes.length,relationships:themes.size,recurring,operational,changes:changes.slice(0,100)};
  await writeState("super-drain-knowledge-index",knowledge);
  await writeState("super-drain-learning-latest",result);
  await writeState("super-drain-learning-receipts",[...receipts,{learned_at:result.learned_at,items:items.length,new:result.new,changed:result.changed,relationships:result.relationships}].slice(-100));
  return result;
}

function card(title,value,detail){return `<div class="metric"><b>${esc(value)}</b><span>${esc(title)} · ${esc(detail)}</span></div>`}
function render(result){
  const root=document.querySelector("#learning");if(!root)return;
  root.querySelector("#learningMetrics").innerHTML=[
    card("Knowledge loop",result.new,"new"),card("Knowledge loop",result.changed,"changed"),card("Knowledge loop",result.known,"known"),
    card("Organisation loop",result.relationships,"relationships"),card("Organisation loop",result.recurring.length,"recurring themes"),
    card("Operational loop",result.operational.succeeded,"successful jobs"),card("Operational loop",result.operational.failed,"failed jobs")
  ].join("");
  root.querySelector("#learningChanges").innerHTML=result.changes.length?result.changes.map(x=>`<div class="finding"><b>${esc(x.state)} · ${esc(x.title)}</b><small>${esc(x.source)} · ${esc(x.id)}</small></div>`).join(""):"<p>No new or changed knowledge since the previous learning pass.</p>";
  root.querySelector("#learningThemes").innerHTML=result.recurring.length?result.recurring.map(x=>`<div class="finding"><b>${esc(x.term)}</b><small>appears across ${x.count} knowledge items</small></div>`).join(""):"<p>No recurring themes detected yet.</p>";
  root.querySelector("#learningOps").innerHTML=`<p><b>${result.operational.jobs}</b> jobs · <b>${result.operational.completed}</b> completed · <b>${result.operational.receipts}</b> learning receipts.</p><p>This loop observes operational evidence but does not grant execution authority.</p>`;
  root.querySelector("#learningStatus").textContent=`Learned ${new Date(result.learned_at).toLocaleString()}`;
}

function install(){
  const tabs=document.querySelector("#tabs");
  const main=document.querySelector("main");
  if(!tabs||!main||document.querySelector("#learning"))return;
  const button=document.createElement("button");button.dataset.tab="learning";button.textContent="Learning";tabs.appendChild(button);
  const section=document.createElement("section");section.id="learning";section.className="view hidden";section.innerHTML=`<div class="panel"><div class="actions"><div><h2>Three learning loops</h2><p>Knowledge learns from the whole corpus. Organisation learning connects patterns across it. Operational learning observes execution evidence without becoming the execution authority.</p></div><button id="learnNow" class="primary">Learn now</button></div><p id="learningStatus">Not yet learned</p><div id="learningMetrics" class="metrics"></div></div><div class="grid"><article class="panel"><h2>1 · Knowledge</h2><p>Older data remains historical. New, changed and known material are distinguished by durable fingerprints.</p><div id="learningChanges"></div></article><article class="panel"><h2>2 · Organisation</h2><p>Repeated concepts and relationships emerge across documents, pages and other intake sources.</p><div id="learningThemes"></div></article><article class="panel"><h2>3 · Operational</h2><p>Jobs, receipts and outcomes can feed learning whether or not the Runtime repository changed.</p><div id="learningOps"></div></article></div>`;main.appendChild(section);
  const allTabs=[...tabs.querySelectorAll("button")];
  const show=()=>{document.querySelectorAll("main .view").forEach(v=>v.classList.add("hidden"));section.classList.remove("hidden");allTabs.forEach(b=>b.classList.toggle("active",b===button));};
  button.onclick=async()=>{show();render(await learn())};
  section.querySelector("#learnNow").onclick=async()=>render(await learn());
  learn().then(render);
}

if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install);else install();
