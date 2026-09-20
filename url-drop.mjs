const drop=document.querySelector("#drop");
const input=document.querySelector("#files");
const urlInput=document.querySelector("#url");
const addUrl=document.querySelector("#addUrl");

function urlsFromDrop(event){
  const dt=event.dataTransfer;
  if(!dt)return[];
  const urls=[];
  for(const type of ["text/uri-list","text/plain","text/html"]){
    let value="";
    try{value=dt.getData(type)||""}catch{}
    if(type==="text/uri-list")urls.push(...value.split(/\r?\n/).map(x=>x.trim()).filter(x=>/^https?:\/\//i.test(x)));
    else if(type==="text/plain"&&/^https?:\/\/\S+$/i.test(value.trim()))urls.push(value.trim());
    else if(type==="text/html"){
      const doc=new DOMParser().parseFromString(value,"text/html");
      urls.push(...[...doc.querySelectorAll("a[href]")].map(a=>a.href).filter(x=>/^https?:\/\//i.test(x)));
    }
  }
  return[...new Set(urls)];
}

function escapeHtml(value){return String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
async function fetchUrl(url){
  const response=await fetch("/api/fetch-url",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({url})});
  const result=await response.json().catch(()=>({status:"BLOCKED",error:"invalid URL fetch response"}));
  if(!response.ok||result.status!=="REAL")throw new Error(result.error||`URL fetch failed (${response.status})`);
  const source=escapeHtml(result.url||url);
  const content=String(result.content||"");
  const html=/text\/html/i.test(result.content_type||"")?content:`<pre>${escapeHtml(content)}</pre>`;
  const file=new File([`<p>Source URL: <a href="${source}">${source}</a></p>${html}`],`url-${Date.now()}.html`,{type:"text/html"});
  file._sourceUrl=result.url||url;
  file._requestedUrl=url;
  file._fetchStatus=result.http_status;
  return file;
}

async function addUrlValue(url){
  const value=String(url||"").trim();
  if(!/^https?:\/\//i.test(value))throw new Error("Enter an HTTP or HTTPS URL");
  const button=addUrl;if(button)button.disabled=true;
  try{const file=await fetchUrl(value);input.files=new DataTransfer().files;input._superDrainPending=[file];input.dispatchEvent(new Event("change",{bubbles:true}));}
  finally{if(button)button.disabled=false}
}

if(addUrl&&urlInput)addUrl.addEventListener("click",async()=>{try{await addUrlValue(urlInput.value);urlInput.value=""}catch(error){alert(error.message)}});

if(drop&&input)drop.addEventListener("drop",async event=>{
  const urls=urlsFromDrop(event);
  if(!urls.length)return;
  event.preventDefault();
  event.stopImmediatePropagation();
  try{
    const files=[];
    for(const url of urls.slice(0,10))files.push(await fetchUrl(url));
    input._superDrainPending=files;
    input.files=new DataTransfer().files;
    input.dispatchEvent(new Event("change",{bubbles:true}));
  }catch(error){alert(error.message)}
},{capture:true});

input.addEventListener("change",event=>{
  const pending=input._superDrainPending;
  if(!pending?.length)return;
  event.stopImmediatePropagation();
  const add=window.__superDrainAddFiles;
  if(add)add(pending);
  input._superDrainPending=[];
},{capture:true});
