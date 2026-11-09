// Hole editor (draw.html?c=<slug>): the owner marks tees, bends and greens on the USGS satellite map
// for a course with no hole map. Routes save in this browser (localStorage 'okw-trace', never 'okw')
// and Copy for Claude puts them on the clipboard as GeoJSON; he pastes it into the chat with /holes,
// and Build Kit/import_traced.py turns it into a traced hole map.
const tstore={get(){try{return JSON.parse(localStorage.getItem('okw-trace')||'{}')}catch{return {}}},set(v){try{localStorage.setItem('okw-trace',JSON.stringify(v))}catch{}}};
(async function draw(){
 const slug=new URLSearchParams(location.search).get('c'),st=$('dst');
 // computer only (owner, Nov 8 2026): on a phone or tablet (no mouse pointer) show a note, load no map or tools
 if(matchMedia('(hover:none)').matches){const ok=slug&&/^[a-z0-9-]+$/.test(slug);
  document.body.innerHTML=`<main class="sec" style="padding:24px 16px;max-width:560px"><a class="back" href="${ok?'course.html?c='+slug:'index.html'}">← Back to ${ok?'course':'courses'}</a><h1>Draw hole map</h1><p>The hole editor works on a computer only. Open this page on your PC.</p></main>`;
  document.body.classList.remove('draw');return}
 if(!slug||!/^[a-z0-9-]+$/.test(slug)){st.textContent='No course chosen. Open this from a course page.';return}
 let c;try{c=await fetch(`data/c/${slug}.json`).then(r=>{if(!r.ok)throw 0;return r.json()})}catch{st.textContent='That course was not found.';return}
 document.title=`Draw ${c.n}`;$('dname').textContent=c.n;$('dback').href=`course.html?c=${slug}`;
 // came here from this course's page: go back to it instead of stacking another visit in the history
 $('dback').onclick=e=>{try{const r=new URL(document.referrer);if(r.origin===location.origin&&r.pathname.endsWith('course.html')&&r.searchParams.get('c')===slug&&history.length>1){e.preventDefault();history.back()}}catch{}};
 if(!c.la){st.textContent='This course has no location yet, so there is nothing to draw on.';return}
 if(!window.L){st.textContent='The map could not load. Check the internet connection and reload.';return}
 // holes from the scorecard: number, par, back-tee yards
 const card=c.holes.length?c.holes.map(h=>({n:+h[0],par:h[1],yd:h[3]?.[0]??null})):Array.from({length:c.h||18},(_,i)=>({n:i+1,par:null,yd:null}));
 const all=tstore.get(),mine=all[slug]||{at:'',h:{}},R=mine.h;let sel=card.find(h=>!(R[h.n]?.length>=2))?.n??card[0].n;
 const save=()=>{mine.at=new Date().toISOString();const a=tstore.get();if(Object.keys(R).length)a[slug]=mine;else delete a[slug];tstore.set(a)};
 // zoom to 20 in half steps for fine placement; sharper NAIP photos from zoom 17 (imagery() in app.js)
 const map=L.map('dmap',{zoomControl:true,doubleClickZoom:false,maxZoom:20,zoomSnap:.5,zoomDelta:.5,wheelPxPerZoomLevel:120}).setView([c.la,c.lo],16);
 imagery(map,20);
 // a partly mapped course: show its OpenStreetMap shapes, and start from its numbered OSM holes the first time
 mine.osm=mine.osm||[];
 if(c.gj)try{const g=await fetch(`files/geojson/${slug}.geojson`).then(r=>r.json());
  // fairways, greens, tees and bunkers in the same colors as the hole-map pictures (no water), under the hole lines
  map.createPane('shapes').style.zIndex=350;const shp=shapeLayer(g,'shapes');
  if(shp.getLayers().length){shp.addTo(map);shapeKey(g).addTo(map);const sb=$('dshp');sb.hidden=false;
   sb.onclick=()=>{const on=map.hasLayer(shp);on?map.removeLayer(shp):shp.addTo(map);sb.setAttribute('aria-pressed',!on);sb.textContent=on?'Shapes off':'Shapes on'}}
  if(!mine.at)for(const f of g.features){const n=parseInt(f.properties.ref);if(f.properties.kind=='hole'&&card.some(h=>h.n==n)&&!R[n]&&f.geometry.type=='LineString'){R[n]=f.geometry.coordinates.map(q=>[q[1],q[0]]);if(!c.osm||c.osm.h.some(h=>h[2]==n))mine.osm.push(n)}}
  if(mine.osm.length)sel=card.find(h=>!(R[h.n]?.length>=2))?.n??sel}catch{}
 const done=Object.values(R).flat();if(done.length>1)map.fitBounds(L.latLngBounds(done),{padding:[40,40]});
 const layer=L.layerGroup().addTo(map);
 const yards=p=>Math.round(p.slice(1).reduce((s,q,i)=>s+L.latLng(p[i]).distanceTo(L.latLng(q)),0)*1.0936);
 const icon=(cls,html,sz)=>L.divIcon({className:'',html:`<div class="${cls}" style="width:${sz}px;height:${sz}px">${html}</div>`,iconSize:[sz,sz],iconAnchor:[sz/2,sz/2]});
 function chips(){const box=$('dholes');box.textContent='';
  card.forEach(h=>{const p=R[h.n],b=document.createElement('button');b.type='button';const ok=p&&p.length>=2;b.className='hc'+(h.n==sel?' on':'')+(ok?'':' todo');
   let txt='not placed';if(ok){const y=yards(p),d=h.yd?y-h.yd:null;txt=`${y} yd`+(d==null?'':` <span class="${Math.abs(d)<=25?'ok':Math.abs(d)<=60?'mid':'bad'}">${d>0?'+':''}${d}</span>`)}
   b.innerHTML=`<b>${h.n}</b><span>${txt}</span>${h.par?`<small>par ${h.par}${h.yd?' · '+h.yd:''}</small>`:''}${mine.osm.includes(h.n)?'<small title="Already in OpenStreetMap">OSM</small>':''}`;b.onclick=()=>{if(placing){if(R[sel]?.length==1){delete R[sel];save()}setPlacing(false)}sel=h.n;render();const q=R[h.n];if(q&&q.length)map.fitBounds(L.latLngBounds(q),{padding:[80,80],maxZoom:18})};box.append(b)});
  const n=card.filter(h=>R[h.n]?.length>=2).length;$('dcp').disabled=!n;$('dosm').disabled=!fresh().length}
 const fresh=()=>card.filter(h=>R[h.n]?.length>=2&&!mine.osm.includes(h.n));
 let placing=false;
 function hint(){const p=R[sel]||[];st.textContent=placing?(p.length==0?`Hole ${sel}: click its tee.`:`Hole ${sel}: now click its green.`)+' (Esc or Cancel to stop)'
  :p.length<2?`Hole ${sel} isn't placed yet. Click Add hole, then click its tee and its green.`:`Hole ${sel} placed. Drag the dots to adjust; click its line to add a bend; right-click or long-press a white bend to remove it.`}
 function render(){layer.clearLayers();
  const order=[...card.filter(h=>h.n!=sel),...card.filter(h=>h.n==sel)];
  for(const h of order){const p=R[h.n];if(!p||!p.length)continue;const on=h.n==sel;
   if(p.length>1){L.polyline(p,{color:'#000',opacity:.45,weight:on?8:6,interactive:false}).addTo(layer);
    const ln=L.polyline(p,{color:on?'#FFD84A':'#fff',weight:on?4:3}).addTo(layer);
    ln.on('click',e=>{L.DomEvent.stopPropagation(e);if(placing){place(e.latlng);return}sel=h.n;let best=1,bd=1e18;const pt=map.latLngToLayerPoint(e.latlng);
     for(let i=1;i<p.length;i++){const d=L.LineUtil.pointToSegmentDistance(pt,map.latLngToLayerPoint(p[i-1]),map.latLngToLayerPoint(p[i]));if(d<bd){bd=d;best=i}}
     p.splice(best,0,[e.latlng.lat,e.latlng.lng]);save();render()})}
   p.forEach((q,i)=>{const first=i==0,last=i==p.length-1&&p.length>1;
    const m=L.marker(q,{draggable:true,autoPan:true,zIndexOffset:on?1000:0,icon:first?icon('tee'+(on?' on':''),h.n,28):last?icon('grn','',22):icon('bend','',14)}).addTo(layer);
    m.on('dragstart',()=>{sel=h.n});m.on('drag',e=>{const ll=e.target.getLatLng();p[i]=[ll.lat,ll.lng];layer.eachLayer(x=>{if(x instanceof L.Polyline&&x.getLatLngs().length==p.length)x.setLatLngs(p)})});
    m.on('dragend',()=>{save();render()});m.on('click',e=>{if(placing){place(e.latlng);return}if(sel!=h.n){sel=h.n;render()}});
    if(!first&&!last)m.on('contextmenu',()=>{p.splice(i,1);save();render()})})}
  chips();hint()}
 // Add hole: the map switches to crosshairs; the next two clicks are the tee and the green.
 function setPlacing(on){placing=on;$('dmap').classList.toggle('placing',on);$('dadd').setAttribute('aria-pressed',on);$('dadd').textContent=on?'Cancel':'Add hole';hint()}
 function place(ll){const p=R[sel]||(R[sel]=[]);p.push([ll.lat,ll.lng]);save();
  if(p.length<2){render();return}
  const was=sel,nx=card.find(h=>!(R[h.n]?.length>=2));setPlacing(false);if(nx)sel=nx.n;render();
  st.textContent=`Hole ${was} placed.`+(nx?` Click Add hole to place hole ${nx.n}.`:' Every hole is placed. Click Copy for Claude when they look right.')}
 $('dadd').onclick=()=>{
  if(placing){if(R[sel]?.length==1){delete R[sel];save()}setPlacing(false);render();return}
  const h=R[sel]?.length>=2?card.find(x=>!(R[x.n]?.length>=2)):card.find(x=>x.n==sel);
  if(!h){st.textContent='Every hole is placed. To redo one, pick it and click Clear hole.';return}
  sel=h.n;delete R[sel];render();setPlacing(true)};
 addEventListener('keydown',e=>{if(e.key=='Escape'&&placing)$('dadd').click()});
 map.on('click',e=>{if(placing){place(e.latlng);return}if(!(R[sel]?.length>=2))st.textContent=`Click Add hole to place hole ${sel}.`});
 const cur=()=>R[sel]||[];
 $('dbend').onclick=()=>{const p=cur();if(p.length<2){hint();return}let bi=1,bl=0;for(let i=1;i<p.length;i++){const l=L.latLng(p[i-1]).distanceTo(L.latLng(p[i]));if(l>bl){bl=l;bi=i}}
  p.splice(bi,0,[(p[bi-1][0]+p[bi][0])/2,(p[bi-1][1]+p[bi][1])/2]);save();render()};
 $('dunb').onclick=()=>{const p=cur();if(p.length>2){p.splice(p.length-2,1);save();render()}else st.textContent=`Hole ${sel} has no bends.`};
 let armed=0;$('dclr').onclick=()=>{if(!cur().length)return;if(!armed){armed=setTimeout(()=>{armed=0;$('dclr').textContent='Clear hole'},4000);$('dclr').textContent=`Click again to clear hole ${sel}`;return}
  clearTimeout(armed);armed=0;$('dclr').textContent='Clear hole';delete R[sel];save();render()};
 const geo=()=>JSON.stringify({type:'FeatureCollection',course:slug,name:c.n,
  source:`Drawn by the owner on the USGS aerial in the site's hole editor, ${new Date().toISOString().slice(0,10)}. Hole order from the owner. Approximate.`,
  features:card.filter(h=>R[h.n]?.length>=2).map(h=>({type:'Feature',properties:{kind:'hole',ref:String(h.n),par:String(h.par??''),...(mine.osm.includes(h.n)?{osm:true}:{})},geometry:{type:'LineString',coordinates:R[h.n].map(q=>[+q[1].toFixed(7),+q[0].toFixed(7)])}}))},null,1);
 // Export to OSM: a JOSM file with only the holes drawn here (not ones that came from OpenStreetMap),
 // in the same form as Build Kit/import_traced.py's OSM Uploads files. He checks and uploads it in JOSM himself.
 const osmXml=hs=>{const q=s=>String(s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));let id=0;const nodes=[],ways=[];
  for(const h of hs){const refs=R[h.n].map(p=>{id--;nodes.push(`  <node id="${id}" action="modify" visible="true" lat="${p[0].toFixed(7)}" lon="${p[1].toFixed(7)}"/>`);return id});
   ways.push([refs,{golf:'hole',ref:String(h.n),...(h.par?{par:String(h.par)}:{})}])}
  const out=['<?xml version="1.0" encoding="UTF-8"?>','<osm version="0.6" generator="Oklahoma Course Workshop">',...nodes];
  for(const [refs,tags] of ways){id--;out.push(`  <way id="${id}" action="modify" visible="true">`,...refs.map(r=>`    <nd ref="${r}"/>`),...Object.entries(tags).map(([k,v])=>`    <tag k="${q(k)}" v="${q(v)}"/>`),'  </way>')}
  return out.concat('</osm>').join('\n')+'\n'};
 $('dosm').onclick=()=>{const hs=fresh();if(!hs.length){st.textContent='Nothing new to export: every placed hole already came from OpenStreetMap.';return}
  const ns=hs.map(h=>h.n).join(', ');
  if(!confirm(`Export hole${hs.length>1?'s':''} ${ns} of ${c.n} as an OpenStreetMap file?\n\nOnly upload holes whose order you know first-hand. You check and upload the file yourself in JOSM.`))return;
  fileout(`${slug}.osm`,osmXml(hs),'application/xml');st.textContent=`Saved ${slug}.osm (hole${hs.length>1?'s':''} ${ns}) to your Downloads. Open it in JOSM, check it against the imagery, then upload it.`};
 // Import from OSM: load this course's current OpenStreetMap holes onto the map, replacing drawn lines for those numbers.
 $('dimp').onclick=async()=>{const b=$('dimp');b.disabled=true;st.textContent='Checking OpenStreetMap…';let ws;
  try{ws=await osmHoles(c)}catch{st.textContent="Couldn't get an answer from OpenStreetMap. Its servers may be busy; try again in a few minutes.";b.disabled=false;return}
  b.disabled=false;const got=osmPick(c,ws,card.map(h=>h.n),n=>R[n]?.[0]),ns=Object.keys(got).map(Number).sort((a,b)=>a-b);
  if(!ns.length){st.textContent=`OpenStreetMap has no numbered holes for ${c.n} yet.`;return}
  const over=ns.filter(n=>R[n]?.length&&!mine.osm.includes(n));
  if(!confirm(`OpenStreetMap has hole${ns.length>1?'s':''} ${ns.join(', ')} for ${c.n}.`+(over.length?`\n\nThis replaces your drawn line${over.length>1?'s':''} for hole${over.length>1?'s':''} ${over.join(', ')}.`:'')+'\n\nLoad them onto the map?')){hint();return}
  for(const n of ns){R[n]=got[n];if(!mine.osm.includes(n))mine.osm.push(n)}save();render();
  map.fitBounds(L.latLngBounds(Object.values(R).flat()),{padding:[40,40]});st.textContent=`Loaded hole${ns.length>1?'s':''} ${ns.join(', ')} from OpenStreetMap.`};
 $('dcp').onclick=async()=>{const t=$('dtxt');t.value=geo();try{await navigator.clipboard.writeText(t.value);st.textContent='Copied. In the chat with Claude, type /holes, press Ctrl+V and send.'}catch{t.style.display='block';t.select();st.textContent='Press Ctrl+C to copy. In the chat with Claude, type /holes, press Ctrl+V and send.'}};
 render();
})();
