const $=i=>document.getElementById(i),esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const fmt=n=>n==null?'':Number(n).toLocaleString('en-US');
const store={get(){try{return JSON.parse(localStorage.getItem('okw')||'{}')}catch{return {}}},set(v){try{localStorage.setItem('okw',JSON.stringify(v))}catch{}}};
const DONE=['Built','Done by Others'];
// Status shown for a course: his own (saved in 'okw': LIDAR done, In progress, Built, Done by Others, in build
// order: converted for 2K25, then building, then built and published; owner, Nov 10 2026) or, if he
// hasn't set one, the automatic map status from the build (No OSM, Partial OSM, Full OSM). Saved values never change.
const stat=(c,s)=>s[c.s]?.st||c.os||'No OSM',slbl=v=>v==='In progress'?'In Progress':v;
// Progress line (top bar): the total done on the left, then every course counted under the status it shows, in build
// order (owner, Nov 10 2026). L: the course list from data/index.json. Saved values are never renamed.
// [saved value, label, colour]: each status has its own colour, used for its bullet and its piece of the bar
const PORDER=[['No OSM','No OSM','#93A39C'],['Partial OSM','Partial OSM','#E0A458'],['Full OSM','Full OSM','#6CC489'],['LIDAR done','LIDAR done','#B39DE8'],
 ['In progress','in progress','#F07F6C'],['Built','built','#D8BE78'],['Done by Others','by others','#8CC7E8']];
function progress(L){const total=L.length,sv=store.get(),cnt={};L.forEach(c=>{const k=stat(c,sv);cnt[k]=(cnt[k]||0)+1});const n=k=>cnt[k]||0,b=n('Built'),o=n('Done by Others');
 // three lines (owner, Nov 10 2026): the total beside the bar, level with the top links; then the automatic map
 // statuses; then his own build statuses, each in small type with its own coloured bullet
 const row=(lab,ks)=>{const h=PORDER.filter(([k])=>ks.includes(k)).map(([k,t,c])=>{const x=n(k);return x?`<span style="--c:${c}"><b>${x}</b> ${t}</span>`:''}).join('');
  return h?`<span class="pl"><i>${lab}</i>${h}</span>`:''};
 // (no "X of N done" text: the bar and the counts under it say it; owner, Nov 10 2026)
 $('pt').innerHTML=row('Maps',['No OSM','Partial OSM','Full OSM'])+row('Your builds',['LIDAR done','In progress','Built','Done by Others']);
 // the bar: one piece per status, as wide as its share of all courses, in the same order and colours
 const bar=document.querySelector('.prog .bar');
 if(bar){bar.innerHTML=PORDER.map(([k,t,c])=>n(k)?`<i style="flex:${n(k)} 1 0;background:${c}"></i>`:'').join('');
  bar.title=`${b+o} of ${total} done: `+PORDER.filter(([k])=>n(k)).map(([k,t])=>`${n(k)} ${t}`).join(' · ')}}
const TC={Ready:'#2F7A4B',Good:'#B8922F',Thin:'#8FA096'};
const RC={Green:'#2E6B4F',Frontier:'#C8631C','Red Carpet':'#8E2F3C','Great Plains':'#B9842B',Chickasaw:'#3F6F8C',Choctaw:'#5B4E7E'};
// [name, description]: on phones only the name shows (owner, Nov 10 2026)
const TK=[['Ready','scorecard and full hole map'],['Good','scorecard'],['Thin','needs research']];
async function home(){
 const [D,M]=await Promise.all([fetch('data/index.json').then(r=>r.json()),fetch('data/map.json').then(r=>r.json())]);
 progress(D);
 // Everything first and the default (owner, Nov 10 2026); Done by Others is in the status menu, not a tab
 const T=[['Everything',c=>true],['18 holes',c=>c.h==18&&c.st!=='Inactive'],['9 holes',c=>c.h==9&&c.st!=='Inactive'],['Lost courses',c=>c.st==='Inactive']];
 let tab=0;
 $('tabs').innerHTML=T.map((t,i)=>`<button role="tab" data-i="${i}" aria-selected="${i==0}">${t[0]}<small></small></button>`).join('');
 let view='tier',ft='',fr='';
 const svg=$('map');svg.setAttribute('viewBox',M.vb.join(' '));
 svg.innerHTML=M.p.map((p,i)=>`<path class="co" d="${p}" data-r="${esc((M.pr||[])[i]||'').replace(' Country','')}"/>`).join('')+D.filter(c=>c.mx!=null).map(c=>`<a class="pin" data-s="${c.s}" href="course.html?c=${c.s}" aria-label="${esc(c.n)}"><circle class="dot" cx="${c.mx}" cy="${c.my}" r="4.2" fill="${TC[c.tier]}"/></a>`).join('')+M.towns.map(t=>`<text class="town" x="${t[1]}" y="${t[2]+14}" text-anchor="middle">${t[0]}</text>`).join('')+'<g id="hi"></g><text id="tip"></text>';
 const pins=Object.fromEntries([...svg.querySelectorAll('.pin')].map(p=>[p.dataset.s,p]));
 const tip=svg.querySelector('#tip'),hi=svg.querySelector('#hi');
 let cur=null;
 function clear(){if(!cur)return;document.querySelector(`.rows a[data-s="${cur}"]`)?.classList.remove('on');pins[cur]?.classList.remove('on');hi.textContent='';tip.textContent='';cur=null}
 function mark(s,on){if(!on){if(s===cur)clear();return}
  if(s===cur)return;clear();cur=s;const p=pins[s],c=D.find(x=>x.s==s);document.querySelector(`.rows a[data-s="${s}"]`)?.classList.add('on');if(!p)return;p.classList.add('on');
  // Near the top edge the flag hangs below the pin and the name sits beside it.
  const [vx,vy,vw,vh]=M.vb,left=c.mx>vx+vw*.62,low=c.my-34<vy,fy=low?c.my+24:c.my-24;
  hi.innerHTML=`<line x1="${c.mx}" y1="${c.my}" x2="${c.mx}" y2="${fy}" stroke="#12302A" stroke-width="1.2"/><path style="fill:#C9281F;stroke:none" d="M${c.mx} ${low?fy-10:fy}l14 5l-14 5z"/><circle cx="${c.mx}" cy="${c.my}" r="4.8" fill="#C9281F" stroke="#fff"/>`;
  label(c.n,c.mx+(left?-1:1)*(low?10:18),low?c.my+5:c.my-20,left,!low)}
 // Writes the name, wrapping long ones onto extra lines, then nudges it so it stays inside the map.
 function label(n,x,y,left,up){const [vx,vy,vw,vh]=M.vb,LH=16,maxW=Math.max(120,(left?x-vx:vx+vw-x)-4);
  tip.removeAttribute('transform');tip.textContent='';tip.setAttribute('text-anchor',left?'end':'start');
  const lines=[];let t=null;
  for(const w of n.split(' ')){const prev=t?.textContent;if(!t){t=document.createElementNS(svg.namespaceURI,'tspan');tip.appendChild(t);t.textContent=w}else t.textContent=prev+' '+w;
   if(prev!=null&&t.getComputedTextLength()>maxW){t.textContent=prev;lines.push(t);t=document.createElementNS(svg.namespaceURI,'tspan');tip.appendChild(t);t.textContent=w}}
  lines.push(t);const top=up?y-(lines.length-1)*LH:y;lines.forEach((s,i)=>{s.setAttribute('x',x);s.setAttribute('y',top+i*LH)});
  const b=tip.getBBox(),dx=Math.max(vx+2-b.x,0)+Math.min(vx+vw-2-(b.x+b.width),0),dy=Math.max(vy+2-b.y,0)+Math.min(vy+vh-2-(b.y+b.height),0);
  if(dx||dy)tip.setAttribute('transform',`translate(${dx} ${dy})`)}
 const rank={Ready:0,Good:1,Thin:2};
 function draw(){const q=$('q').value.toLowerCase().trim(),s=store.get();
  [...$('tabs').children].forEach((b,i)=>{const L=D.filter(T[i][1]);b.querySelector('small').textContent=`${L.filter(c=>DONE.includes(s[c.s]?.st)).length} of ${L.length} done`});
  let R=D.filter(q?()=>true:T[tab][1]).filter(c=>(!q||(c.n+' '+c.ci+' '+(c.ar||'')+' '+(c.aka||'')).toLowerCase().includes(q))&&(!ft||c.tier==ft)&&(!fr||c.r==fr)&&(!$('mst').value||stat(c,s)==$('mst').value));
  const o=$('sort').value;R.sort(o=='c'?(a,b)=>a.ci.localeCompare(b.ci)||a.n.localeCompare(b.n):o=='t'?(a,b)=>rank[a.tier]-rank[b.tier]||a.n.localeCompare(b.n):o=='y'?(a,b)=>(b.y||0)-(a.y||0):(a,b)=>a.n.localeCompare(b.n));
  $('ct').textContent=R.length+(R.length==1?' course':' courses')+(q?', searching all tabs':'');
  $('rows').innerHTML=R.length?R.map(c=>`<li><a data-s="${c.s}" href="course.html?c=${c.s}"><b>${esc(c.n)}${c.st=='Unconfirmed'?' <span class="nc">Not Confirmed</span>':''}</b><span class="num">${[c.p?'Par '+c.p:'',c.y?fmt(c.y)+' yds':''].filter(Boolean).join(', ')}</span><span class="m">${esc(c.ci)}${c.mx==null?', not on the map yet':''}, <span class="mine ${s[c.s]?.st?s[c.s].st.split(' ')[0]:'auto'}">${esc(slbl(stat(c,s)))}</span></span>${c.st=='Inactive'?'<span class="num"><span class="lost">Inactive</span></span>':`<span class="num tier ${c.tier}">${c.tier}</span>`}</a></li>`).join(''):'<li class="empty">No courses match. Clear the search, tap the selected map color again, or choose another tab.</li>';
  const show=new Set(R.map(c=>c.s));for(const k in pins)pins[k].classList.toggle('off',!show.has(k));save()}
 // The search, tab, sort, filters and scroll position stay for this browser tab, so coming back to the list keeps them.
 const SK='okw-list';let saved=null;
 function save(){try{sessionStorage.setItem(SK,JSON.stringify({tabn:T[tab][0],q:$('q').value,sort:$('sort').value,mst:$('mst').value,view,ft,fr,y:scrollY}))}catch{}}
 try{saved=JSON.parse(sessionStorage.getItem(SK)||'null')}catch{}
 if(saved){tab=Math.max(0,T.findIndex(t=>t[0]===saved.tabn));  // the tab is kept by name; anything else opens on Everything
  $('q').value=saved.q||'';$('sort').value=saved.sort||'n';$('mst').value=saved.mst=='-'?'':saved.mst||'';if($('mst').selectedIndex<0)$('mst').value='';
  view=saved.view=='reg'?'reg':'tier';ft=saved.ft||'';fr=saved.fr||'';
  [...$('tabs').children].forEach((x,i)=>x.setAttribute('aria-selected',i==tab));[...$('views').children].forEach(x=>x.setAttribute('aria-pressed',x.dataset.v==view))}
 addEventListener('pagehide',save);
 $('tabs').onclick=e=>{const b=e.target.closest('button');if(!b)return;tab=+b.dataset.i;[...$('tabs').children].forEach(x=>x.setAttribute('aria-selected',x==b));draw()};
 ['q','sort','mst'].forEach(i=>$(i).oninput=draw);
 function paint(){const rg=view=='reg';svg.classList.toggle('rg',rg);
  svg.querySelectorAll('.co').forEach(p=>p.style.fill=rg&&RC[p.dataset.r]?RC[p.dataset.r]:'');
  svg.querySelectorAll('.pin').forEach(a=>{const c=D.find(x=>x.s==a.dataset.s);a.firstChild.setAttribute('fill',rg?RC[c.r]||'#8FA096':TC[c.tier])});
  const items=rg?Object.keys(RC).map(r=>[r,r+' Country',RC[r],D.filter(c=>c.r==r).length]):TK.map(t=>[t[0],t[1],TC[t[0]],D.filter(c=>c.tier==t[0]).length]),sel=rg?fr:ft;
  $('key').classList.toggle('tk',!rg);  // Ready/Good/Thin: one row of three on phones
  $('key').innerHTML=items.map(i=>`<button type="button" data-k="${esc(i[0])}" aria-pressed="${sel==i[0]}" style="--c:${i[2]}">${rg?`<span>${esc(i[0])}<span class="kc"> Country</span></span>`:`<span>${esc(i[0])}<span class="kd">: ${esc(i[1])}</span></span>`} <small>${i[3]}</small></button>`).join('')}
 $('views').onclick=e=>{const b=e.target.closest('button');if(!b||b.dataset.v==view)return;view=b.dataset.v;ft=fr='';[...$('views').children].forEach(x=>x.setAttribute('aria-pressed',x==b));paint();draw()};
 $('key').onclick=e=>{const b=e.target.closest('button');if(!b)return;const k=b.dataset.k;if(view=='reg')fr=fr==k?'':k;else ft=ft==k?'':k;paint();draw()};
 paint();
 const ev=(el,sel)=>{el.addEventListener('mouseover',e=>{const a=e.target.closest(sel);if(a)mark(a.dataset.s,true)});el.addEventListener('mouseout',e=>{const a=e.target.closest(sel);if(a)mark(a.dataset.s,false)});el.addEventListener('focusin',e=>{const a=e.target.closest(sel);if(a)mark(a.dataset.s,true)});el.addEventListener('focusout',e=>{const a=e.target.closest(sel);if(a)mark(a.dataset.s,false)})};
 ev($('rows'),'a');ev(svg,'.pin');svg.addEventListener('mouseleave',clear);$('rows').addEventListener('mouseleave',clear);addEventListener('pageshow',e=>{clear();if(e.persisted){progress(D);draw()}});addEventListener('scroll',()=>{if(cur&&document.activeElement?.dataset?.s===cur)return;clear()},{passive:true,capture:true});draw();
 if(saved?.y)requestAnimationFrame(()=>scrollTo(0,saved.y));
 if(matchMedia('(hover:none)').matches)svg.addEventListener('click',e=>{e.preventDefault();const m=svg.getScreenCTM();let b=null,bd=28;D.forEach(c=>{if(!pins[c.s]||pins[c.s].classList.contains('off'))return;const d=Math.hypot(m.a*c.mx+m.e-e.clientX,m.d*c.my+m.f-e.clientY);if(d<bd){bd=d;b=c}});clear();$('pick').hidden=!b;if(b){mark(b.s,true);$('pick').innerHTML=`<a class="btn go" href="course.html?c=${b.s}">Open ${esc(b.n)}</a>`}});
 // The backup also carries 2K25 setting changes under "_2k25" and hand-drawn hole routes (draw.js) under "_trace" (never slugs), and the CSV button exports the 2K25 changes for the Details 25 sheet.
 const known=s=>D.some(c=>c.s==s),gk=()=>{$('gk').hidden=!Object.keys(gstore.get()).some(known)};gk();addEventListener('pageshow',gk);
 const tget=()=>{try{return JSON.parse(localStorage.getItem('okw-trace')||'{}')}catch{return {}}};
 $('bk').onclick=()=>{const g=gstore.get(),t=tget();fileout('oklahoma-workshop-progress.json',JSON.stringify({...store.get(),...(Object.keys(g).length?{_2k25:g}:{}),...(Object.keys(t).length?{_trace:t}:{})},null,1),'application/json')};
 $('gk').onclick=async()=>{const all=gstore.get(),cs=await Promise.all(Object.keys(all).filter(known).map(s=>fetch(`data/c/${s}.json`).then(r=>r.json())));
  cs.sort((a,b)=>a.n.localeCompare(b.n));fileout('oklahoma-workshop-2k25-settings.csv',gcsv(cs.map(c=>{const b=gbase(c),m=all[c.s];return [c.n,k=>k in m?m[k]:b[k]??'']})),'text/csv')};
 $('rs').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const v=JSON.parse(await f.text());if(typeof v!='object'||Array.isArray(v)||!v)throw 0;const ok=Object.fromEntries(Object.entries(v).filter(([k])=>known(k)));store.set({...store.get(),...ok});
  const g=v._2k25&&typeof v._2k25=='object'?Object.fromEntries(Object.entries(v._2k25).filter(([k,x])=>known(k)&&x&&typeof x=='object')):{};if(Object.keys(g).length)gstore.set({...gstore.get(),...g});
  const tr=v._trace&&typeof v._trace=='object'?Object.fromEntries(Object.entries(v._trace).filter(([k,x])=>known(k)&&x&&typeof x.h=='object')):{};if(Object.keys(tr).length)try{localStorage.setItem('okw-trace',JSON.stringify({...tget(),...tr}))}catch{}
  progress(D);draw();gk();const n=Object.keys(ok).length,m=Object.keys(g).length,t=Object.keys(tr).length;const cn=x=>`${x} ${x==1?'course':'courses'}`;
  $('rsm').textContent=[n?`Restored ${cn(n)}.`:'',m?`2K25 setting changes for ${cn(m)}.`:'',t?`Drawn hole routes for ${cn(t)}.`:''].filter(Boolean).join(' ')||'Nothing in that file matched a course.'}catch{$('rsm').textContent='That file is not a progress backup. Choose the file made by Download my progress.'}}}
// Leaflet (the map library) loads only when a map is first shown; resolves false if it can't load.
const USGS='https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/tile/{z}/{y}/{x}';let LL;
// (named loadLeaflet, not leaflet: Leaflet 1.9 sets window.leaflet to itself, which overwrote the old name and broke the pin map)
function loadLeaflet(){if(window.L)return Promise.resolve(true);if(LL)return LL;
 const l=document.createElement('link');l.rel='stylesheet';l.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';l.integrity='sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';l.crossOrigin='';document.head.append(l);
 return LL=new Promise(r=>{const s=document.createElement('script');s.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';s.integrity='sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';s.crossOrigin='';s.onload=()=>r(true);s.onerror=()=>r(false);document.head.append(s)})}
// Shape colors, the same as the hole-map pictures (Build Kit/hole_map_style.py). Water is left out on purpose.
// Listed bottom to top: the driving range sits under everything (owner, Nov 8 2026: range and tees with green edges).
const SHAPE_STYLE={driving_range:{fillColor:'rgb(200,235,120)',fillOpacity:.27,color:'rgb(85,170,85)',weight:3},
 fairway:{fillColor:'rgb(60,200,60)',fillOpacity:.37,color:'rgb(105,190,75)',weight:2},tee:{fillColor:'rgb(170,225,150)',fillOpacity:.67,color:'rgb(40,120,45)',weight:2},
 green:{fillColor:'rgb(110,255,140)',fillOpacity:.59,color:'rgb(235,255,235)',weight:3},bunker:{fillColor:'rgb(255,236,170)',fillOpacity:.92,color:'rgb(110,80,20)',weight:2}};
// Satellite layers: USGS's ready-made tiles stop at zoom 16, so from 17 up the sharper USGS NAIP photos are asked for
// tile by tile (sharp to about 18, enlarged past that). The zoom-16 tiles stay underneath in case NAIP is slow or down.
const NAIP='https://imagery.nationalmap.gov/arcgis/rest/services/USGSNAIPPlus/ImageServer/exportImage';
function imagery(map,max){const u=L.tileLayer(USGS,{maxNativeZoom:16,maxZoom:max,attribution:'USGS'}).addTo(map);
 const N=L.TileLayer.extend({getTileUrl(c){const W=20037508.342789244,s=2*W/2**c.z,x=-W+c.x*s,y=W-c.y*s;
  return `${NAIP}?bbox=${x},${y-s},${x+s},${y}&bboxSR=3857&imageSR=3857&size=256,256&format=jpg&f=image`}});
 new N('',{minZoom:17,maxNativeZoom:18,maxZoom:max,attribution:'USGS NAIP'}).addTo(map);return u}
function shapeLayer(g,pane){const order=Object.keys(SHAPE_STYLE),fs=g.features.filter(f=>SHAPE_STYLE[f.properties.kind]&&/Polygon/.test(f.geometry.type)).sort((a,b)=>order.indexOf(a.properties.kind)-order.indexOf(b.properties.kind));
 return L.geoJSON({type:'FeatureCollection',features:fs},{pane,interactive:false,style:f=>({...SHAPE_STYLE[f.properties.kind],opacity:1})})}
function shapeKey(g){const k=L.control({position:'bottomleft'});k.onAdd=()=>{const d=L.DomUtil.create('div','skey');
 d.innerHTML=[['Fairway','fairway'],['Green','green'],['Tee','tee'],['Bunker','bunker'],...(g?.features.some(f=>f.properties.kind=='driving_range')?[['Range','driving_range']]:[])].map(([t,s])=>`<span><i style="background:${SHAPE_STYLE[s].fillColor};border-color:${SHAPE_STYLE[s].color}"></i>${t}</span>`).join('');return d};return k}
// Hole map view: zoomable USGS satellite map with the course's shapes, hole lines and numbered tees. Shows the
// hole-map picture instead in the preview, when the map library can't load, or when the USGS tiles fail.
let hm,hmFail=false;async function holemap(c){const box=$('vh'),pic=()=>{hmFail=true;box.hidden=true;$('vz').hidden=true;$('vi').hidden=false;$('vi').src=`img/holes/${c.s}.jpg`};
 if(hm){box.hidden=false;$('vz').hidden=false;$('vi').hidden=true;hm.invalidateSize();return}
 if(hmFail||window.OKW_PREVIEW||!c.ob||!await loadLeaflet())return pic();
 box.hidden=false;$('vz').hidden=false;$('vi').hidden=true;
 // one finger on the map moves it (phones and tablets too, owner Nov 8 2026); outside the map the page scrolls
 // whole zoom steps only (Nov 11 2026): resting between steps scales the photo tiles and leaves thin grid lines
 hm=L.map(box,{dragging:true,scrollWheelZoom:false,maxZoom:19,zoomSnap:1});hm.createPane('shapes').style.zIndex=350;
 const t=imagery(hm,19);let got=0,bad=0;
 t.on('tileload',()=>got++);t.on('tileerror',()=>{if(++bad>=4&&!got&&hm){hm.remove();hm=null;pic()}});
 const frame=L.latLngBounds([[c.ob[0],c.ob[1]],[c.ob[2],c.ob[3]]]);hm.fitBounds(frame);
 let g=null,a=null;if(c.gj)try{g=await fetch(`files/geojson/${c.s}.geojson`).then(r=>r.json())}catch{}
 // every other OpenStreetMap golf shape around the course (other courses next door, practice greens ...), same colours,
 // under the course's own shapes (owner, Nov 12 2026; Build Kit/around_shapes.py). Not counted anywhere.
 if(c.ag)try{a=await fetch(`files/around/${c.s}.geojson`).then(r=>r.json())}catch{}
 if(!hm)return;const shp=L.layerGroup();for(const x of [a,g])if(x)shapeLayer(x,'shapes').addTo(shp);
 const all={features:[...(a?.features||[]),...(g?.features||[])]},has=shp.getLayers().some(l=>l.getLayers().length),holes=L.layerGroup().addTo(hm);if(has)shp.addTo(hm);
 for(const f of g?.features||[]){if(f.properties.kind!='hole'||f.geometry.type!='LineString')continue;const p=f.geometry.coordinates.map(q=>[q[1],q[0]]);
  L.polyline(p,{color:'#000',opacity:.55,weight:6,interactive:false}).addTo(holes);L.polyline(p,{color:'#fff',weight:3,interactive:false}).addTo(holes);
  const n=String(f.properties.ref??'').split(';')[0].match(/(\d+)\s*$/)?.[1];if(n)L.marker(p[0],{interactive:false,keyboard:false,icon:L.divIcon({className:'',html:`<div class="htee">${n}</div>`,iconSize:[26,26],iconAnchor:[13,13]})}).addTo(holes)}
 const ctl=L.control({position:'topright'});ctl.onAdd=()=>{const d=L.DomUtil.create('div','hmctl');d.innerHTML='<button type="button" data-a="fit">Fit course</button>'+(has?'<button type="button" data-a="shp" aria-pressed="true">Shapes on</button>':'');
  L.DomEvent.disableClickPropagation(d);d.onclick=e=>{const a=e.target.dataset.a;if(a=='fit')hm.fitBounds(frame);
   if(a=='shp'){const on=hm.hasLayer(shp);on?hm.removeLayer(shp):shp.addTo(hm);e.target.setAttribute('aria-pressed',!on);e.target.textContent=on?'Shapes off':'Shapes on'}};return d};ctl.addTo(hm);
 if(has)shapeKey(all).addTo(hm);
 // the mouse wheel zooms only after a click on the map, so scrolling the page doesn't get caught by it
 hm.on('click',()=>hm.scrollWheelZoom.enable());hm.on('mouseout',()=>hm.scrollWheelZoom.disable())}
let pm;async function pinmap(p){if(pm){pm.invalidateSize();return}
 if(!await loadLeaflet()){$('vf').innerHTML='<p class="none">The map could not load. Use the Google Earth link below.</p>';return}
 pm=L.map('vf',{dragging:true,scrollWheelZoom:false}).setView(p,15);
 L.tileLayer(USGS,{maxNativeZoom:16,maxZoom:18,attribution:'USGS'}).addTo(pm);
 L.marker(p,{title:'Open in Google Earth',alt:'Open this pin in Google Earth',icon:L.divIcon({className:'pinflag',html:'<svg viewBox="0 0 28 36" width="28" height="36" aria-hidden="true"><path d="M5 2v31" stroke="#fff" stroke-width="3"/><path d="M5 2v31" stroke="#12302A" stroke-width="1.5"/><path d="M6 3l20 7-20 7z" fill="#C9281F" stroke="#fff"/></svg>',iconSize:[28,36],iconAnchor:[5,34]})}).on('click',()=>window.open(document.querySelector('#vp a').href,'_blank','noopener')).addTo(pm)}
// Tee colour bullets (owner, Nov 11 2026). cs: one or two colour names from the build (tc / teelist tc); a two-colour
// tee (White/Blue) gets a half-and-half bullet. A tee with a colour shows the bullet alone, no name (owner: the yardages
// tell the tees apart); the name stays in the tooltip and for screen readers. A tee with no known colour shows its name.
// The bullet is a small golf tee (owner), split down the middle for two colours. Both tee tables list the forward tees
// first, longest last, like the 2K25 scorecard (owner); the data keeps longest first (draw.js reads tee 0 as the longest).
let TGID=0;
const TCOL={black:'#1b1b1b',blue:'#1f5fbf',white:'#ffffff',red:'#d42a20',gold:'#e0a91f',yellow:'#f2d33a',green:'#2f8a3c',silver:'#b8bec4',maroon:'#7a1f2b',orange:'#ef7d1a',gray:'#8a8f94',copper:'#b8733a',bronze:'#9c6b30',purple:'#6d3fa0'};
function tlab(cs,name){cs=(cs||[]).filter(x=>TCOL[x]);name=String(name??'');if(!cs.length)return esc(name);const w=cs.join('/'),said=cs.every(x=>new RegExp(`\\b${x}\\b`,'i').test(name)),t=said?name:`${name} (${w})`;
 const g=`tg${++TGID}`,a=TCOL[cs[0]],b=TCOL[cs[1]||cs[0]];
 return `<svg class="tdot" viewBox="0 0 14 22" aria-hidden="true"><title>${esc(t)}</title><defs><linearGradient id="${g}"><stop offset=".5" stop-color="${a}"/><stop offset=".5" stop-color="${b}"/></linearGradient></defs><path d="M1 1.5H13Q13 5.2 8.7 6.4L8.4 17.6L7 21L5.6 17.6L5.3 6.4Q1 5.2 1 1.5Z" fill="url(#${g})"/></svg><span class="vh">${esc(t)}</span>`}
function scorecard(c){if(!c.holes.length)return `<p>No hole-by-hole card has been found for this course. ${c.card==='Totals only'?'Course totals are listed under tees.':'A phone call or a photo of the paper card would fill this in.'}</p>`;
 const H=c.holes,nine=H.length<=9,part=(a,b,f)=>H.slice(a,b).reduce((s,h)=>s+(f(h)||0),0);
 const cols=[...H.slice(0,9).map(h=>({h})),...(nine?[]:[{t:'Out',a:0,b:9}]),...H.slice(9).map(h=>({h})),...(nine?[{t:'Total',a:0,b:H.length}]:[{t:'In',a:9,b:18},{t:'Total',a:0,b:18}])];
 const row=(l,f,sum,lab)=>`<tr><td>${lab??esc(l)}</td>${cols.map(x=>x.h?`<td>${f(x.h)??''}</td>`:`<td class="tot">${sum?part(x.a,x.b,f)||'':''}</td>`).join('')}</tr>`;
 // nn: the names of the two nines of an 18 made from two named nines (e.g. Heritage/Legends), shown above each nine's columns
 const nn=H.length==18&&Array.isArray(c.nn)&&c.nn.length==2?`<tr class="nines"><td></td>${c.nn.map(n=>`<th scope="colgroup" colspan="10">${esc(n)}</th>`).join('')}<td></td></tr>`:'';
 return `<div class="sw"><table><thead>${nn}<tr><th scope="col">Hole</th>${cols.map(x=>`<th scope="col">${x.h?x.h[0]:x.t}</th>`).join('')}</tr></thead><tbody>${c.tees.map((t,i)=>[t,i]).reverse().map(([t,i])=>row(t,h=>h[3][i],1,tlab(c.tc&&c.tc[i],t))).join('')}${row('Par',h=>h[1],1)}${row('Handicap',h=>h[2])}</tbody></table></div>`}
// The Game tab: the owner's PGA Tour 2K25 designer settings, from his workbook (import_game_settings.py).
// Panels follow the game's own menus and labels, scorecard-style: Fairway, Green, Rough on the left; Bunker, Environment on the right.
// Every value can be edited; edits stay in this browser (localStorage 'okw-game', never 'okw') and download as a CSV row
// laid out like the owner's "Details 25" sheet (column A name, settings in C to V, theme in W), ready to paste in.
const GL=['Fairway Texture','Fairway Mow Width','Fairway Mow Intensity','Light Rough Texture','Heavy Rough Texture','Green Texture','Green Mow Width','Green Mow Intensity','Bunker Texture','Terrain Water','Terrain Hills','Terrain Trees','Terrain Plants','Terrain Grass','Terrain Rocks'];
// THEMES: the 2K25 designer's Theme menu, in its order (owner's photo, Nov 2026).
const GCOL=[2,3,4,6,8,10,11,12,14,16,17,18,19,20,21],THEMES=['Desert','Boreal','Tropical','Countryside','Harvest','Winter','Delta','Rustic','Swiss','Steppe','Autumn','Highlands','Temperate','Fjordlands'];
const GS=[['Fairway','fw',/^Fairway /],['Green','gr',/^Green /],['Rough','ro',/ Rough /],['Theme','th',/^Theme$/],['Bunker','bu',/^Bunker /],['Terrain','te',/^Terrain /]];
const gstore={get(){try{return JSON.parse(localStorage.getItem('okw-game')||'{}')}catch{return {}}},set(v){try{localStorage.setItem('okw-game',JSON.stringify(v))}catch{}}};
const gbase=c=>{const g=c.gm||{};return Object.assign(Object.fromEntries(g.set||[]),{Theme:g.theme??''})};
// One CSV laid out like Details 25: list holds [course name, value getter] pairs.
function gcsv(list){const q=x=>/[",\r\n]/.test(x)?`"${x.replace(/"/g,'""')}"`:x,row=(n,v)=>{const r=Array(23).fill('');r[0]=n;GL.forEach((k,i)=>r[GCOL[i]]=v(k));r[22]=v('Theme');return r};
 return [row('Course Name',k=>k.replace('Terrain Water','Terrain Water Level')),...list.map(([n,v])=>row(n,v))].map(r=>r.map(x=>q(String(x??''))).join(',')).join('\r\n')+'\r\n'}
// OpenStreetMap check. c.ob is the course's map area [south,west,north,east]; c.osm is what the last
// update_hole_map.py pull used: {at: OpenStreetMap data time, h: [[way id, version, hole number], ...]}.
// Two public Overpass servers are asked at once; the first good answer wins and the other request is cancelled.
const OVERPASS=['https://overpass-api.de/api/interpreter','https://maps.mail.ru/osm/tools/overpass/api/interpreter'];
async function osmHoles(c){const q=`[out:json][timeout:50];way["golf"="hole"](${c.ob.join(',')});out meta geom;`,stop=new AbortController(),t=setTimeout(()=>stop.abort(),60000);
 try{const d=await Promise.any(OVERPASS.map(async u=>{const r=await fetch(u+'?data='+encodeURIComponent(q),{signal:stop.signal});if(!r.ok)throw new Error(r.status);const j=await r.json();if(!j.elements)throw new Error('bad answer');return j}));
  return d.elements.filter(e=>e.geometry?.length>1).map(e=>{const ref=String(e.tags?.ref??'').split(';')[0],m=ref.match(/(\d+)\s*$/);
   return {id:e.id,v:e.version,ts:e.timestamp,n:m?+m[1]:null,g:e.geometry.map(p=>[p.lat,p.lon])}})}
 finally{clearTimeout(t);stop.abort()}}
function osmCompare(c,ws){const by=new Map(ws.map(w=>[w.id,w])),o=c.osm;
 if(!o)return {found:[...new Set(ws.filter(w=>w.n).map(w=>w.n))].sort((a,b)=>a-b)};
 const mine=new Set(o.h.map(h=>h[0])),r={edited:[],removed:[],added:[]};
 for(const [id,v,n] of o.h){const w=by.get(id);if(!w)r.removed.push({n});else if(w.v!=v)r.edited.push({n,ts:w.ts})}
 r.added=ws.filter(w=>!mine.has(w.id)&&w.n&&w.ts>o.at);return r}
// This course's holes from an OpenStreetMap answer: the lines the last pull used (in this course's numbering),
// plus numbered lines added since. With no pull on record, every numbered line in the area, nearest first.
function osmPick(c,ws,nums,start){const known=new Map((c.osm?.h||[]).map(h=>[h[0],h[2]])),got={},d2=(a,b)=>(a[0]-b[0])**2+((a[1]-b[1])*Math.cos(a[0]*Math.PI/180))**2;
 for(const w of ws){let n=known.get(w.id);if(n==null){if(c.osm&&!(w.ts>c.osm.at))continue;n=w.n}if(!nums.includes(n))continue;
  const d=d2(start(n)||[c.la,c.lo],w.g[0]);if(!got[n]||d<got[n].d)got[n]={g:w.g,d}}
 return Object.fromEntries(Object.entries(got).map(([n,x])=>[n,x.g]))}
async function osmCheck(c){const st=$('osmst'),b=$('osmck'),day=t=>new Date(t).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}),rng=ns=>{const o=[];for(let i=0;i<ns.length;){let j=i;while(j+1<ns.length&&ns[j+1]==ns[j]+1)j++;o.push(j-i>=2?`${ns[i]}–${ns[j]}`:ns.slice(i,j+1).join(', '));i=j+1}return o.join(', ')},
  list=a=>rng([...new Set(a.map(x=>x.n).filter(n=>n!=null))].sort((x,y)=>x-y)),s=a=>a.length>1?'s':'';
 st.hidden=false;if(window.OKW_PREVIEW){st.textContent="The OpenStreetMap check can't reach OpenStreetMap from this preview. It works on the website and the local test site.";return}
 b.disabled=true;st.textContent='Checking OpenStreetMap… (this can take up to a minute when its servers are busy)';
 try{const r=osmCompare(c,await osmHoles(c));let msg,ch=false;
  if(!c.osm){if(!r.found.length)msg='No holes in OpenStreetMap here yet.';else{ch=true;msg=c.mapped?`This map has no record of which OpenStreetMap lines it came from, so it can't be compared. OpenStreetMap has numbered hole lines in this area: ${rng(r.found)}.`:`OpenStreetMap has numbered hole lines in this area (${rng(r.found)}) that this map doesn't use yet.`}}
  else{const p=[];if(r.added.length)p.push(`new hole line${s(r.added)} ${list(r.added)}`);if(r.edited.length)p.push(`hole${s(r.edited)} ${list(r.edited)} changed`);if(r.removed.length)p.push(`hole${s(r.removed)} ${list(r.removed)} removed`);
   const last=[...r.added,...r.edited].map(x=>x.ts).sort().pop();
   if(p.length){ch=true;msg=`OpenStreetMap has changes: ${p.join(', ')}${last?` (latest ${day(last)})`:''}.`}else msg=`Up to date: no changes to these holes in OpenStreetMap since ${day(c.osm.at)}.`}
  st.innerHTML=esc(msg)+(ch?` <button class="btn" id="osmcp" type="button">Copy update request</button> <small>Paste it to Claude to redraw this map from OpenStreetMap.</small>`:'');
  if(ch)$('osmcp').onclick=async()=>{const t=`/updatecourse ${c.s}`;try{await navigator.clipboard.writeText(t);$('osmcp').textContent='Copied'}catch{prompt('Copy this and paste it to Claude:',t)}}}
 catch{st.textContent="Couldn't get an answer from OpenStreetMap. Its servers may be busy; try again in a few minutes."}finally{b.disabled=false}}
function fileout(name,text,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
function game(c){const g=c.gm||{},base=gbase(c),mine=gstore.get()[c.s]||{},val=k=>String(k in mine?mine[k]:base[k]??'');
 const pub={you:'Published by Oklahoma Course Workshop',others:'Published by another designer'}[g.pub]||'Not published yet';
 const lab=l=>l.replace(/^(Fairway|Green) Mow/,'Mow').replace('Terrain Water','Water Level').replace('Terrain ','');
 const field=k=>{const id='g-'+k.replace(/ /g,'-').toLowerCase();return `<div><label for="${id}">${esc(lab(k))}</label>${k=='Theme'?`<select id="${id}" data-k="Theme"><option value="">Not set</option>${(!val(k)||THEMES.includes(val(k))?THEMES:[val(k),...THEMES]).map(t=>`<option${t==val(k)?' selected':''}>${esc(t)}</option>`).join('')}</select>`:`<input id="${id}" data-k="${esc(k)}" type="number" inputmode="numeric" min="0" max="100" step="1" value="${esc(val(k))}">`}</div>`};
 const panel=([t,k,re])=>`<section class="gp ${k}"><h3>${t}</h3>${['Theme',...GL].filter(l=>re.test(l)).map(field).join('')}</section>`;
 const col=ks=>GS.filter(s=>ks.includes(s[1])).map(panel).join('');
 return `<div class="gh"><h2>PGA Tour 2K25</h2><span>${pub}</span></div>
 <div class="gt"><button type="button" class="btn" id="gdl">Download Game Setting (CSV)</button><button type="button" class="btn" id="grs" hidden>Undo my edits</button><span id="gst" role="status"></span></div>
 <div class="gc"><div>${col(['fw','gr','ro'])}</div><div>${col(['th','bu','te'])}</div></div>
 <p class="gn">${g.set&&g.set.length?'Settings from the 2K25 course designer. Textures are the slot numbers in each picker.':'No 2K25 settings recorded yet. Type yours in.'} Changes save in this browser only. The CSV row lines up with your Details 25 sheet, so it pastes straight in.</p>`}
// The printed build sheet's 2K25 block (owner, Nov 8 2026): every game setting as plain text, values as the Game tab
// shows them in this browser (✱ = changed here, not yet in the workbook); blank lines to write on when there's none.
const GPRINT=[['Theme',[['','Theme']]],['Fairway',[['Texture','Fairway Texture'],['Mow width','Fairway Mow Width'],['Mow intensity','Fairway Mow Intensity']]],
 ['Green',[['Texture','Green Texture'],['Mow width','Green Mow Width'],['Mow intensity','Green Mow Intensity']]],['Rough',[['Light texture','Light Rough Texture'],['Heavy texture','Heavy Rough Texture']]],
 ['Bunker',[['Texture','Bunker Texture']]],['Terrain',[['Water level','Terrain Water'],['Hills','Terrain Hills'],['Trees','Terrain Trees'],['Plants','Terrain Plants'],['Grass','Terrain Grass'],['Rocks','Terrain Rocks']]]];
// TGC Designer Tools hole name filter (owner, Nov 11 2026): only for courses with other courses' holes nearby
// (osm_check.py -> data/tgc_filter.json -> c.tgc). The tool keeps holes whose OpenStreetMap `name` contains the
// filter text and needs plain hole numbers; this says what to type, or what to fix in OpenStreetMap first.
const TGCST={ready:'Ready',names:'Needs hole names',refs:'Needs plain hole numbers',clash:'Needs different hole names'};
function tgcbox(c){const t=c.tgc;if(!t)return'';const pl=s=>/[-,]/.test(s);
 const near=[...t.near.map(n=>n.replace(' - ',' – ')),...(t.unl?[`${t.unl} hole${t.unl>1?'s':''} not in the guide`]:[])].join(', ');
 const say=t.st=='ready'?`<p>Type <code>${esc(t.f)}</code> in the hole name filter. It matches all ${t.holes} holes here and none nearby.</p>`
  :t.st=='names'?`<p>Hole${pl(t.miss)?'s':''} ${esc(t.miss)} ${pl(t.miss)?'have':'has'} no <code>name</code> tag in OpenStreetMap, so the filter would skip ${pl(t.miss)?'them':'it'}. Add <code>name=${esc(t.ex)}</code> (and so on) in JOSM, then type <code>${esc(t.f)}</code> in the filter.</p>`
  :t.st=='refs'?`<p>Hole${pl(t.bad)?'s':''} ${esc(t.bad)} ${pl(t.bad)?'have':'has'} a hole number (<code>ref</code>) or par the tool can't read. Make ${pl(t.bad)?'each':'it'} a plain number in JOSM.</p>`
  :`<p>No text is in every hole name here and in none of the nearby ones. Rename this course's holes (e.g. <code>${esc(t.ex)}</code>).</p>`;
 return `<div class="tgcf ${t.st=='ready'?'ok':'todo'}"><h3>TGC hole name filter <span class="chip">${TGCST[t.st]||''}</span></h3>${say}<p class="tgn">Other holes nearby: ${esc(near)}.</p></div>`}
function gprint(c){const g=c.gm||{},base=gbase(c),mine=gstore.get()[c.s]||{};let ed=false;
 const v=k=>{const x=String((k in mine?mine[k]:base[k])??'').trim();if(!x)return '<span class="blank"></span>';if(k in mine)ed=true;return esc(x)+(k in mine?'<sup>✱</sup>':'')};
 const pub={you:'Published by Oklahoma Course Workshop',others:'Published by another designer'}[g.pub]||'Not published yet';
 const rows=GPRINT.map(([t,fs])=>`<dt>${t}</dt><dd>${fs.map(([l,k])=>`<span>${l?esc(l)+' ':''}<b>${v(k)}</b></span>`).join('')}</dd>`).join('');
 const tg=c.tgc?`<p class="pgtgc">TGC hole name filter: <b>${esc(c.tgc.f||'none yet')}</b>${c.tgc.st=='ready'?'':` (${TGCST[c.tgc.st].toLowerCase()} first)`}</p>`:'';
 return `<h2>PGA Tour 2K25 settings</h2><p class="pgpub">${pub}</p>${tg}<dl class="pg">${rows}</dl>${ed?'<p class="pgnote">✱ changed in this browser, not yet in your workbook</p>':''}`}
function gwire(c){const base=gbase(c),box=$('vg');
 function mark(){const m=gstore.get()[c.s]||{},n=Object.keys(m).length;box.querySelectorAll('[data-k]').forEach(i=>i.classList.toggle('ed',i.dataset.k in m));$('grs').hidden=!n;$('gst').textContent=n?`${n} ${n==1?'change':'changes'} saved in this browser`:''}
 box.oninput=e=>{const k=e.target.dataset.k;if(!k)return;const all=gstore.get(),m=all[c.s]||{},v=e.target.value.trim();
  if(v===String(base[k]??''))delete m[k];else m[k]=v;if(Object.keys(m).length)all[c.s]=m;else delete all[c.s];gstore.set(all);mark()};
 $('grs').onclick=()=>{if(!confirm('Put this course back to the saved 2K25 settings? Your changes here will be removed.'))return;const all=gstore.get();delete all[c.s];gstore.set(all);box.querySelectorAll('[data-k]').forEach(i=>i.value=String(base[i.dataset.k]??''));mark()};
 $('gdl').onclick=()=>fileout(`${c.s}-2k25-settings.csv`,gcsv([[c.n,k=>box.querySelector(`[data-k="${k}"]`).value.trim()]]),'text/csv');
 mark()}
async function kit(){
 const slug=new URLSearchParams(location.search).get('c'),K=$('kit');
 if(!slug||!/^[a-z0-9-]+$/.test(slug)){K.innerHTML='<p>Choose a course from the <a href="index.html">course list</a>.</p>';return}
 let c;try{c=await fetch(`data/c/${slug}.json`).then(r=>{if(!r.ok)throw 0;return r.json()})}catch{K.innerHTML='<p>That course was not found. Go back to the <a href="index.html">course list</a>.</p>';return}
 fetch('data/index.json').then(r=>r.json()).then(d=>progress(d));
 document.title=c.n+' Build Kit';const s=store.get(),me=s[c.s]||{};
 const ck=(st,t,sub)=>`<li><i class="${st}">${st=='y'?'✓':st=='p'?'~':'✕'}</i><span>${t}${sub?`<small>${sub}</small>`:''}</span></li>`;
 // Hole shapes: what OpenStreetMap really has (c.sh counts; c.shp is the build's strict rating: ✓ a green for
 // every hole plus fairways or bunkers, ~ incomplete, ✕ none — hole lines or water alone don't count).
 const shapes=c=>{const s=c.sh||{},nm={green:['green','greens'],fairway:['fairway','fairways'],tee:['tee box','tee boxes'],bunker:['bunker','bunkers'],water:['water area','water areas']},
  list=Object.entries(s).filter(([k])=>nm[k]).map(([k,n])=>`${n} ${nm[k][n>1?1:0]}`).join(', '),st=c.shp||'n',nh=c.h||c.mapped||18,
  // clubhouse, driving range and cart paths: listed so he knows they're in OpenStreetMap (not part of the rating;
  // the range is drawn on the map, the others aren't)
  ext=[s.clubhouse?(s.clubhouse>1?`${s.clubhouse} clubhouses`:'clubhouse'):'',s.driving_range?(s.driving_range>1?`${s.driving_range} driving ranges`:'driving range'):'',s.tee_names&&s.tee_names.length?`tees named ${s.tee_names.join(', ')}`:'',s.cartpath_m?`${s.cartpath_m>=1000?(s.cartpath_m/1000).toFixed(1)+' km':s.cartpath_m+' m'} of cart paths`:''].filter(Boolean).join(' · '),xt=ext?` · ${ext}`:'';
  const miss=st=='p'?[(s.green||0)<nh?`${(s.green||0)?'only '+s.green:'no'} green${s.green==1?'':'s'} for ${nh} holes`:'',!(s.fairway||s.bunker)?'no fairways or bunkers':''].filter(Boolean).join(', '):'';
  return ck(st,'Hole shapes',(st=='y'?list:st=='p'?`Incomplete: ${miss}. Has ${list}`:c.mapped?`No greens, fairways or bunkers mapped yet${s.water?` (only ${list})`:''}`:ext?'No greens, fairways or bunkers mapped':'Not mapped')+xt)};
 const lat=c.la,lon=c.lo,mb=a=>a.reduce((x,i)=>x+i.mb,0),feet=(c.pn||'').includes('ftUS');
 const ft=a=>`<div class="sw"><table><thead><tr><th>File</th><th>EPSG</th><th>Size</th><th>Published</th></tr></thead><tbody>${a.map(f=>`<tr><td><a href="${esc(f.u)}">${esc(f.t.replace('USGS Lidar Point Cloud ','').replace('USGS 1 Meter ',''))}</a></td><td>${f.e??''}</td><td>${f.mb} MB</td><td>${esc(f.d||'')}</td></tr>`).join('')}</tbody></table></div>`;
 const earth=c.pin?`https://earth.google.com/web/search/${c.pin[0]},${c.pin[1]}`:`https://earth.google.com/web/@${lat},${lon},400a,2500d,35y,0h,0t,0r`;
 // PC: a computer with a mouse or trackpad. Phones and tablets (no mouse pointer) don't get the PC-only tools:
 // Download Course Preview, Draw hole map and Check OpenStreetMap (owner, Nov 8 2026).
 const PC=!matchMedia('(hover:none)').matches,links=[];
 if(lat){links.push(['Satellite view in Google Maps',`https://www.google.com/maps/@${lat},${lon},1200m/data=!3m1!1e3`,'Latest imagery, good for checking bunkers and paths']);links.push(['Open in Google Earth',earth,c.pin?'Goes to this course\'s pin. 3D view for reading slopes':'3D view for reading slopes']);links.push(['OpenStreetMap',`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=16/${lat}/${lon}`,c.lay=='Traced hole map'?'Not mapped there yet. Add the holes to replace the traced ones':'The source of the hole lines'])}
 if(c.w)links.push(['Club website',c.w,'Clubhouse photos and current details']);{const g=encodeURIComponent;links.push(['Find on GolfPass',c.curl&&c.curl.includes('golfpass.com')?c.curl:`https://www.google.com/search?q=${g(`site:golfpass.com "${c.n}" ${c.ci} Oklahoma`)}`,'Scorecard and hole-by-hole layout']);links.push(['Find on GolfTraxx',`https://www.google.com/search?q=${g(`GolfTraxx "${c.n}" ${c.ci} Oklahoma`)}`,'Hole info and GPS layout (also in the GolfTraxx app)'])}if(c.curl)links.push(['Scorecard source',c.curl,c.csrc==='Official'?'Official card':'Directory listing']);
 const facts=[['Address',[c.a,c.ci,c.z].filter(Boolean).join(', ')],['Type',c.t],['Designer',c.ar],['Opened',c.yr],['Rating and slope',c.sl?`${c.ra} / ${c.sl}`:''],['Our difficulty label',c.d],['Grass',[c.fg,c.gg].filter(Boolean).join(' fairways, ')+(c.gg?' greens':'')],['Also known as',c.aka],['Ranking',c.rk],['On site',c.am.join(', ')],['Tournaments',c.ev.map(e=>e.y+' '+e.e).join('; ')]].filter(x=>x[1]);
 K.innerHTML=`<a class="back" id="back" href="index.html">← Back to courses</a><p class="crumb"><a href="index.html">All courses</a> / ${esc(c.r)} / ${esc(c.ci)}</p><h1>${esc(c.n)}</h1>
 <p class="sum">${c.st!='Active'?`<span class="lost ${c.st}">${c.st=='Unconfirmed'?'Not Confirmed':c.st}</span> `:''}${[c.h?c.h+' holes':'',c.p?'par '+c.p:'',c.y?fmt(c.y)+' yards':''].filter(Boolean).join(', ')}${c.ci?' in '+esc(c.ci):''}.</p>
 <div class="acts"><button class="btn go" onclick="print()">Print build sheet</button>${PC&&c.img?`<a class="btn" href="img/holes/${c.s}.jpg" download="${esc(c.n.replace(/[\\/:*?"<>|]/g,''))} course preview.jpg">Download Course Preview</a>`:''}${PC&&c.la&&['Aerial only','None','Partial hole map'].includes(c.lay)?`<a class="btn" href="draw.html?c=${c.s}">Draw hole map</a>`:''}${PC&&c.ob?'<button class="btn" id="osmck" type="button">Check OpenStreetMap</button>':''}${c.lidar.length?`<a class="btn" href="#lidar">Point cloud files, EPSG ${c.pe}</a>`:''}</div>${PC&&c.ob?'<p class="osmst" id="osmst" role="status" hidden></p>':''}
 <div class="lead"><figure class="view"><div class="vt">${c.img?`<button aria-pressed="true" data-v="holes">Hole map</button><button aria-pressed="false" data-v="aerial">Clean aerial</button>${c.pin?'<button aria-pressed="false" data-v="pin">Satellite pin</button>':''}`:'<button aria-pressed="true" data-v="none">Aerial</button>'}<button aria-pressed="false" data-v="game">Game</button></div><div id="vg" hidden role="region" aria-label="PGA Tour 2K25 settings for ${esc(c.n)}">${game(c)}</div>${c.img?`<img id="vi" width="1200" height="900" src="img/holes/${c.s}.jpg" alt="Aerial of ${esc(c.n)} with mapped holes"><div id="vh" hidden role="region" aria-label="Zoomable hole map of ${esc(c.n)}"></div>${c.pin?`<div id="vf" hidden role="region" aria-label="Satellite map with the pin for ${esc(c.n)}"></div>`:''}<figcaption><span id="vc">${c.lay=='Traced hole map'?`${c.mapped} holes traced by hand on this aerial. Routes are approximate; check them against the course before building.`:c.mapped?`${c.mapped} numbered tees mapped. White lines are hole routes; shaded areas are fairways, greens, tees and bunkers.`:'No hole routes mapped here yet, so this is the plain aerial.'}${c.size?` Area shown is about ${c.size[0]} by ${c.size[1]} km.`:''}${c.geo?' Location comes from the street address and may be off.':''}<span id="vz" hidden> ${PC?'Click the map, then scroll to zoom; drag to move.':'Drag with one finger to move the map; pinch to zoom. Scroll the page outside the map.'}</span></span>${c.pin?`<span id="vp" hidden>Satellite map centered on this course's Google Earth pin. Click the flag or this link: <a href="${earth}" target="_blank" rel="noopener">Open the pin in Google Earth</a></span>`:''}</figcaption>`:'<div class="none" id="vn">No location on record, so there is no aerial for this course.</div>'}</figure>
 <aside class="rail"><h2>What's ready</h2><ul class="check">
 ${ck(c.card=='Full'?'y':c.card=='None'?'n':'p','Scorecard',c.card=='Full'?`Hole by hole, ${c.csrc=='OpenGolfAPI'?'database record':c.csrc.toLowerCase()+' source'}`:c.card)}
 ${ck(c.lay=='Full hole map'?'y':c.lay=='Partial hole map'||c.lay=='Traced hole map'?'p':'n','Hole map',c.lay=='Traced hole map'?'Traced from the aerial, approximate':c.lay)}
 ${shapes(c)}
 ${ck(c.lidar.length?'y':'n','Point cloud',c.lidar.length?`EPSG ${c.pe}, ${feet?'US survey feet':'meters'}, ${c.lidar.length} ${c.lidar.length==1?'tile':'tiles'}, about ${fmt(Math.round(mb(c.lidar)))} MB`:'No match, location unknown')}
 ${ck(c.sl?'y':'n','Rating and slope',c.sl?`${c.ra} / ${c.sl}`:'Not found')}</ul>
 <h2>Your build</h2><label for="bs">Status</label><select id="bs"><option value="">${esc(c.os||'No OSM')} (automatic)</option><option>LIDAR done</option><option value="In progress">In Progress</option><option>Built</option><option>Done by Others</option></select><label for="bn">Notes</label><textarea id="bn" placeholder="Share code, corrections, what's left"></textarea></aside></div>
 <section class="printonly pgame" id="pgame">${gprint(c)}</section><section class="printonly pnotes"><h2>Notes:</h2><div class="pnl"></div></section>
 ${c.lidar.length?`<section class="sec" id="lidar"><h2>Point cloud files</h2><p>These are the primary terrain files for this course. Use them on their own, with no conversion.</p>
 <dl class="facts pc"><dt>EPSG</dt><dd><b>${c.pe}</b>, ${esc(c.pn)}</dd><dt>Units</dt><dd>${feet?'US survey feet, for position and height':'Meters, for position and height'}</dd><dt>Files</dt><dd>${c.lidar.length} ${c.lidar.length==1?'tile':'tiles'}, about ${fmt(Math.round(mb(c.lidar)))} MB</dd><dt>In TGC Tools</dt><dd>Leave Force EPSG and the unit override blank. If the tool can't detect the projection, enter EPSG ${c.pe}${feet?' and a unit of 0.3048006096012192':''}.</dd></dl>${tgcbox(c)}
 <p class="acts"><a class="btn go" href="files/lidar/${c.s}.txt" download>Download point cloud link list</a> <a class="btn" href="files/Primary_Build_Files.csv" download>Download EPSG list, all courses</a></p>
 <p>USGS limits rapid requests, so set a download manager to one or two files at a time and retry any that fail. Save all of a course's tiles in one folder.</p>
 <details open><summary>Point cloud tiles (LAZ): ${c.lidar.length} ${c.lidar.length==1?'file':'files'}</summary>${ft(c.lidar)}</details>
 <details><summary>Using LIDAR in 2K25</summary><p>The <a href="https://github.com/malifica/TGC-Designer-Tools/releases" rel="noopener">2K25 version of TGC Designer Tools</a> (Beta 3.1 or later) reads the coordinate system from each file and scales feet to meters itself, for both position and height. It works from local LAZ files and a local OpenStreetMap file, and exports a .course file. This workflow hasn't been tested here, so try one course before relying on it.</p><ul class="lk"><li><a href="https://tgctours.proboards.com/board/97/tgc-golf-tools-lidar-osm" rel="noopener">TGC Golf Tools, LIDAR and OSM forum</a></li><li><a href="https://tgctours.proboards.com/thread/36147/lidar-courses-2k25-resolution-bunkers" rel="noopener">LIDAR courses in 2K25 thread</a></li></ul></details>
 ${c.dem.length?`<details><summary>Backup only: 1-meter elevation model, ${c.dem.length} ${c.dem.length==1?'file':'files'}</summary><p>You don't need these for a normal build. Use them only if the point cloud won't load, and never combine them with it, because they use a different coordinate system.</p>${ft(c.dem)}</details>`:''}</section>`:''}
 ${!c.lidar.length&&c.tgc?`<section class="sec"><h2>LIDAR tool</h2>${tgcbox(c)}</section>`:''}
 <section class="sec"><h2>Scorecard</h2>${scorecard(c)}
 ${c.teelist.length?`<details open><summary>Tees, ratings and slopes</summary><div class="sw"><table><thead><tr><th>Tee</th><th>Gender</th><th>Par</th><th>Yards</th><th>Rating</th><th>Slope</th></tr></thead><tbody>${[...c.teelist].sort((a,b)=>(a.yardage??1e9)-(b.yardage??1e9)).map(t=>`<tr><td>${tlab(t.tc,t.tee_name)}</td><td>${esc(t.gender)}</td><td>${t.par??''}</td><td>${fmt(t.yardage)}</td><td>${t.course_rating??''}</td><td>${t.slope??''}</td></tr>`).join('')}</tbody></table></div></details>`:''}</section>
 <section class="sec two"><div><h2>Course facts</h2><dl class="facts">${facts.map(f=>`<dt>${f[0]}</dt><dd>${esc(f[1])}</dd>`).join('')}</dl></div><div><h2>Reference links</h2><ul class="lk">${links.map(l=>`<li><a href="${esc(l[1])}" target="_blank" rel="noopener">${esc(l[0])}</a><small>${esc(l[2])}</small></li>`).join('')}</ul></div></section>
 ${c.note&&c.st!='Active'?`<section class="sec"><h2>Data note</h2><p>${esc(c.note)}</p></section>`:''}
 ${c.cnote||c.pnote?`<section class="sec cnotes"><h2>Scorecard notes</h2>${[c.cnote,c.pnote].filter(Boolean).map(t=>`<p>${esc(t)}</p>`).join('')}</section>`:''}`;
 document.querySelectorAll('.vt button').forEach(b=>b.onclick=()=>{document.querySelectorAll('.vt button').forEach(x=>x.setAttribute('aria-pressed',x==b));const v=b.dataset.v,pin=v=='pin',gm=v=='game';
  $('vg').hidden=!gm;if($('vn'))$('vn').hidden=gm;if(!c.img)return;
  $('vi').hidden=pin||gm;$('vc').hidden=pin||gm;$('vh').hidden=true;$('vz').hidden=true;if(c.pin){$('vf').hidden=!pin;$('vp').hidden=!pin}
  if(pin)pinmap(c.pin);else if(v=='holes')holemap(c);else if(!gm)$('vi').src=`img/${v}/${c.s}.jpg`});
 if(c.img)holemap(c);  // the Hole map view opens as the zoomable map
 gwire(c);addEventListener('beforeprint',()=>{$('pgame').innerHTML=gprint(c)});  // print the Game tab as it is now
 // Back returns to the list as it was: browser history when we came from it, otherwise the saved search.
 // Go back (keeping the list's search and scroll) only when the page before was the home page, never the hole editor.
 $('back').onclick=e=>{try{const r=new URL(document.referrer);if(r.origin===location.origin&&/(\/|index\.html|home\.html)$/.test(r.pathname)&&history.length>1){e.preventDefault();history.back()}}catch{}};
 if(PC&&c.ob)$('osmck').onclick=()=>osmCheck(c);
 $('bs').value=me.st||'';$('bn').value=me.note||'';
 const save=()=>{const v=store.get();v[c.s]={st:$('bs').value,note:$('bn').value};if(!v[c.s].st&&!v[c.s].note)delete v[c.s];store.set(v);fetch('data/index.json').then(r=>r.json()).then(d=>progress(d))};
 $('bs').oninput=save;$('bn').oninput=save}
