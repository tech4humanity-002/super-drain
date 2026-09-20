const drop=document.querySelector("#drop");
const input=document.querySelector("#files");
const urlInput=document.querySelector("#url");
const addUrl=document.querySelector("#addUrl");

function urlsFromDrop(event){
  const dt=event.dataTransfer;if(!dt)return[];const urls=[];
  for(const type of ["text/uri-list","text/plain","text/html"]){let value="";try{value=dt.getData(type)||""}catch{}
    if(type==="text/uri-list")urls.push(...value.split(/\r?\n/).map(x=>x.trim()).filter(x=>/^https?:\/\//i.test(x)));
    else if(type==="text/plain"&&/^https?:\/\/\S+$/i.test(value.trim()))urls.push(value.trim());
    else if(type==="text/html"){const doc=new DOMParser().parseFromString(value,"text/html");urls.push(...[...doc.querySelectorAll("a[href]")].map(a=>a.href).filter(x=>/^https?:\/\//i.test(x)));}}
  return[...new Set(urls)];
}
function escapeHtml(value){return String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
async function fetchUrl(url){const response=await fetch("/api/fetch-url",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({url})});const result=await response.json().catch(()=>({}));if(!response.ok||result.status!=="REAL")throw new Error(result.error||`URL fetch failed (${response.status})`);const source=escapeHtml(result.url||url),content=String(result.content||"");const body=/text\/html/i.test(result.content_type||"")?content:`<pre>${escapeHtml(content)}</pre>`;return new File([`<p>Source URL: <a href="${source}">${source}</a></p>${body}`],`url-${Date.now()}.html`,{type:"text/html"});}
async function injectUrls(urls){if(!input||!urls.length)return;const files=[];for(const url of urls.slice(0,10))files.push(await fetchUrl(url));const dt=new DataTransfer();files.forEach(file=>dt.items.add(file));input.files=dt.files;input.dispatchEvent(new Event("change",{bubbles:true}));}
if(addUrl&&urlInput)addUrl.addEventListener("click",async()=>{const url=urlInput.value.trim();if(!/^https?:\/\//i.test(url)){alert("Enter an HTTP or HTTPS URL");return}addUrl.disabled=true;try{await injectUrls([url]);urlInput.value=""}catch(error){alert(error.message)}finally{addUrl.disabled=false}});
if(drop)drop.addEventListener("drop",async event=>{const urls=urlsFromDrop(event);if(!urls.length)return;event.preventDefault();event.stopImmediatePropagation();try{await injectUrls(urls)}catch(error){alert(error.message)}},{capture:true});
