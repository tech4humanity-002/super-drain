export const POVS=Object.freeze([
  {id:"BLENDED",label:"Blended",description:"A balanced view across the recovered work."},
  {id:"CEO",label:"CEO",description:"Strategy, decisions, business impact and opportunities."},
  {id:"CFO",label:"CFO",description:"Money, cost, commercial exposure and value questions."},
  {id:"CTO",label:"CTO",description:"Technology, delivery, dependencies and technical risk."},
  {id:"CHRO",label:"CHRO",description:"People, capability, workload and organisational change."},
  {id:"COO",label:"COO",description:"Operations, execution, process and delivery flow."}
]);

const RULES={
  CEO:/\b(strategy|strategic|decision|decide|business|market|customer|revenue|growth|opportunit|product|partner|commercial|competitive|goal|priority|investment)\w*/i,
  CFO:/\b(cost|budget|price|pricing|revenue|margin|profit|billing|funding|financial|finance|roi|return|cash|waste|commercial|investment|value)\w*/i,
  CTO:/\b(technology|technical|architecture|architect|code|software|api|database|cloud|github|deploy|deployment|integration|system|security|data|infrastructure|bug|build|test|technical debt)\w*/i,
  CHRO:/\b(people|person|team|worker|staff|employee|hr|human|capability|skill|skills|training|culture|workload|role|change|organisation|organisational|family|user)\w*/i,
  COO:/\b(operation|operational|process|workflow|delivery|execute|execution|implementation|service|support|admin|administration|procedure|handoff|handover|queue|dependency|deadline|follow-up)\w*/i
};

const KIND_WEIGHT={
  CEO:{opportunities:3,decisions:3,intents:2,unfinished_work:1,actions:1,risks:2},
  CFO:{commercial_candidates:4,opportunities:3,opportunity_costs:3,risks:2,unfinished_work:1},
  CTO:{assets:3,capability_gaps:3,asset_mismatches:3,risks:3,actions:2,unfinished_work:2},
  CHRO:{capability_gaps:4,unfinished_work:2,intents:2,risks:2,actions:1},
  COO:{actions:3,unfinished_work:3,risks:2,intents:2,decisions:2}
};

export function scorePov(item,povId){
  if(!povId||povId==="BLENDED") return {score:item?.analysis?.scores?.total||0,evidence:[]};
  const rule=RULES[povId]; if(!rule) return {score:0,evidence:[]};
  const analysis=item?.analysis||{}, evidence=[];
  for(const [kind,weight] of Object.entries(KIND_WEIGHT[povId]||{})){
    for(const value of (analysis[kind]||[])){
      const text=typeof value==="string"?value:(value?.value||value?.title||value?.summary||"");
      if(text && rule.test(text)) evidence.push({kind,value:text});
    }
  }
  const source=[item?.title,item?.content,item?.url].filter(Boolean).join(" ");
  const snippets=source.split(/(?<=[.!?])\\s+|\\n+/).map(x=>x.trim()).filter(x=>x.length>12&&rule.test(x)).slice(0,6);
  snippets.forEach(value=>evidence.push({kind:"source_signal",value:value.slice(0,500)}));
  const contextMatches=snippets.length;
  const score=Math.min(100,Math.round((analysis.scores?.total||0)*0.45 + evidence.reduce((n,x)=>n+(KIND_WEIGHT[povId]?.[x.kind]||1)*6,0) + Math.min(20,contextMatches*3)));
  return {score,evidence:evidence.slice(0,8)};
}

export function applyPov(items,povId="BLENDED"){
  const rows=items.map(item=>({...item,pov:scorePov(item,povId)}));
  return rows.sort((a,b)=>(b.pov.score-a.pov.score)||(b.analysis.scores.total-a.analysis.scores.total));
}
