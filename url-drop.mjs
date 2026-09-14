const drop=document.querySelector("#drop");
const input=document.querySelector("#files");

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

if(drop&&input)drop.addEventListener("drop",event=>{
  const urls=urlsFromDrop(event);
  if(!urls.length)return;
  event.preventDefault();
  event.stopImmediatePropagation();
  const dt=new DataTransfer();
  urls.forEach((url,i)=>dt.items.add(new File([url],`url-${Date.now()}-${i+1}.txt`,{type:"text/plain"})));
  input.files=dt.files;
  input.dispatchEvent(new Event("change",{bubbles:true}));
},{capture:true});
