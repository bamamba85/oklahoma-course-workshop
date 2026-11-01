const $=i=>document.getElementById(i),esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const fmt=n=>n==null?'':Number(n).toLocaleString('en-US');
const store={get(){try{return JSON.parse(localStorage.getItem('okw')||'{}')}catch{return {}}},set(v){try{localStorage.setItem('okw',JSON.stringify(v))}catch{}}};
function progress(total){const s=store.get(),b=Object.values(s).filter(x=>x.st==='Built').length,w=Object.values(s).filter(x=>x.st==='In progress').length;
 $('pt').textContent=`${b} of ${total} built${w?`, ${w} in progress`:''}`;$('pb').style.width=(100*b/total)+'%'}
const TC={Ready:'#2F7A4B',Good:'#B8922F',Thin:'#8FA096'};
async function home(){
 const [D,M]=await Promise.all([fetch('data/index.json').then(r=>r.json()),fetch('data/map.json').then(r=>r.json())]);
 progress(D.length);
 const T=[['18 holes',c=>c.h==18&&c.st!=='Inactive'],['9 holes',c=>c.h==9&&c.st!=='Inactive'],['Lost courses',c=>c.st==='Inactive'],['Everything',c=>true]];
 let tab=0;
 $('tabs').innerHTML=T.map((t,i)=>`<button role="tab" data-i="${i}" aria-selected="${i==0}">${t[0]}<small></small></button>`).join('');
 [...new Set(D.map(c=>c.r))].sort().forEach(r=>$('reg').add(new Option(r)));
 const svg=$('map');svg.setAttribute('viewBox',M.vb.join(' '));
 svg.innerHTML=M.p.map(p=>`<path d="${p}"/>`).join('')+D.filter(c=>c.mx!=null).map(c=>`<a class="pin" data-s="${c.s}" href="course.html?c=${c.s}" aria-label="${esc(c.n)}"><circle class="dot" cx="${c.mx}" cy="${c.my}" r="4.2" fill="${TC[c.tier]}"/></a>`).join('')+M.towns.map(t=>`<text class="town" x="${t[1]}" y="${t[2]+14}" text-anchor="middle">${t[0]}</text>`).join('')+'<g id="hi"></g><text id="tip"></text>';
 const pins=Object.fromEntries([...svg.querySelectorAll('.pin')].map(p=>[p.dataset.s,p]));
 const tip=svg.querySelector('#tip'),hi=svg.querySelector('#hi');
 let cur=null;
 function clear(){if(!cur)return;document.querySelector(`.rows a[data-s="${cur}"]`)?.classList.remove('on');pins[cur]?.classList.remove('on');hi.textContent='';tip.textContent='';cur=null}
 function mark(s,on){if(!on){if(s===cur)clear();return}
  if(s===cur)return;clear();cur=s;const p=pins[s],c=D.find(x=>x.s==s);document.querySelector(`.rows a[data-s="${s}"]`)?.classList.add('on');if(!p)return;p.classList.add('on');
  const left=c.mx>M.vb[2]*.62;hi.innerHTML=`<line x1="${c.mx}" y1="${c.my}" x2="${c.mx}" y2="${c.my-24}" stroke="#12302A" stroke-width="1.2"/><path style="fill:#C9281F;stroke:none" d="M${c.mx} ${c.my-24}l14 5l-14 5z"/><circle cx="${c.mx}" cy="${c.my}" r="4.8" fill="#C9281F" stroke="#fff"/>`;tip.textContent=c.n;tip.setAttribute('x',left?c.mx-6:c.mx+18);tip.setAttribute('y',c.my-20);tip.setAttribute('text-anchor',left?'end':'start')}
 const rank={Ready:0,Good:1,Thin:2};
 function draw(){const q=$('q').value.toLowerCase().trim(),s=store.get();
  [...$('tabs').children].forEach((b,i)=>{const L=D.filter(T[i][1]);b.querySelector('small').textContent=`${L.filter(c=>s[c.s]?.st==='Built').length} of ${L.length} built`});
  let R=D.filter(T[tab][1]).filter(c=>(!q||(c.n+' '+c.ci+' '+(c.ar||'')+' '+(c.aka||'')).toLowerCase().includes(q))&&(!$('tier').value||c.tier==$('tier').value)&&(!$('reg').value||c.r==$('reg').value));
  const o=$('sort').value;R.sort(o=='c'?(a,b)=>a.ci.localeCompare(b.ci)||a.n.localeCompare(b.n):o=='t'?(a,b)=>rank[a.tier]-rank[b.tier]||a.n.localeCompare(b.n):o=='y'?(a,b)=>(b.y||0)-(a.y||0):(a,b)=>a.n.localeCompare(b.n));
  $('ct').textContent=R.length+(R.length==1?' course':' courses');
  $('rows').innerHTML=R.length?R.map(c=>`<li><a data-s="${c.s}" href="course.html?c=${c.s}"><b>${esc(c.n)}</b><span class="num">${c.p?'Par '+c.p:''}${c.y?', '+fmt(c.y)+' yds':''}</span><span class="m">${esc(c.ci)}${c.st=='Unconfirmed'?', unconfirmed':''}${s[c.s]?.st?`, <span class="mine">${esc(s[c.s].st)}</span>`:''}</span><span class="num tier ${c.tier}">${c.tier}</span></a></li>`).join(''):'<li class="empty">No courses match. Clear the search or choose another tab.</li>';
  const show=new Set(R.map(c=>c.s));for(const k in pins)pins[k].classList.toggle('off',!show.has(k))}
 $('tabs').onclick=e=>{const b=e.target.closest('button');if(!b)return;tab=+b.dataset.i;[...$('tabs').children].forEach(x=>x.setAttribute('aria-selected',x==b));draw()};
 ['q','tier','reg','sort'].forEach(i=>$(i).oninput=draw);
 const ev=(el,sel)=>{el.addEventListener('mouseover',e=>{const a=e.target.closest(sel);if(a)mark(a.dataset.s,true)});el.addEventListener('mouseout',e=>{const a=e.target.closest(sel);if(a)mark(a.dataset.s,false)});el.addEventListener('focusin',e=>{const a=e.target.closest(sel);if(a)mark(a.dataset.s,true)});el.addEventListener('focusout',e=>{const a=e.target.closest(sel);if(a)mark(a.dataset.s,false)})};
 ev($('rows'),'a');ev(svg,'.pin');svg.addEventListener('mouseleave',clear);$('rows').addEventListener('mouseleave',clear);addEventListener('pageshow',e=>{clear();if(e.persisted){progress(D.length);draw()}});addEventListener('scroll',clear,{passive:true,capture:true});draw();
 $('bk').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(store.get(),null,1)],{type:'application/json'}));a.download='oklahoma-workshop-progress.json';a.click();URL.revokeObjectURL(a.href)};
 $('rs').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const v=JSON.parse(await f.text());if(typeof v!='object'||Array.isArray(v)||!v)throw 0;const ok=Object.fromEntries(Object.entries(v).filter(([k])=>D.some(c=>c.s==k)));store.set({...store.get(),...ok});progress(D.length);draw();$('rsm').textContent=(n=>`Restored ${n} ${n==1?'course':'courses'}.`)(Object.keys(ok).length)}catch{$('rsm').textContent='That file is not a progress backup. Choose the file made by Download my progress.'}}}
function scorecard(c){if(!c.holes.length)return `<p>No hole-by-hole card has been found for this course. ${c.card==='Totals only'?'Course totals are listed under tees.':'A phone call or a photo of the paper card would fill this in.'}</p>`;
 const H=c.holes,nine=H.length<=9,part=(a,b,f)=>H.slice(a,b).reduce((s,h)=>s+(f(h)||0),0);
 const cols=[...H.slice(0,9).map(h=>({h})),...(nine?[]:[{t:'Out',a:0,b:9}]),...H.slice(9).map(h=>({h})),...(nine?[{t:'Total',a:0,b:H.length}]:[{t:'In',a:9,b:18},{t:'Total',a:0,b:18}])];
 const row=(l,f,sum)=>`<tr><td>${esc(l)}</td>${cols.map(x=>x.h?`<td>${f(x.h)??''}</td>`:`<td class="tot">${sum?part(x.a,x.b,f)||'':''}</td>`).join('')}</tr>`;
 return `<div class="sw"><table><thead><tr><th scope="col">Hole</th>${cols.map(x=>`<th scope="col">${x.h?x.h[0]:x.t}</th>`).join('')}</tr></thead><tbody>${c.tees.map((t,i)=>row(t,h=>h[3][i],1)).join('')}${row('Par',h=>h[1],1)}${row('Handicap',h=>h[2])}</tbody></table></div>`}
async function kit(){
 const slug=new URLSearchParams(location.search).get('c'),K=$('kit');
 if(!slug||!/^[a-z0-9-]+$/.test(slug)){K.innerHTML='<p>Choose a course from the <a href="index.html">course list</a>.</p>';return}
 let c;try{c=await fetch(`data/c/${slug}.json`).then(r=>{if(!r.ok)throw 0;return r.json()})}catch{K.innerHTML='<p>That course was not found. Go back to the <a href="index.html">course list</a>.</p>';return}
 fetch('data/index.json').then(r=>r.json()).then(d=>progress(d.length));
 document.title=c.n+' Build Kit';const s=store.get(),me=s[c.s]||{};
 const ck=(st,t,sub)=>`<li><i class="${st}">${st=='y'?'✓':st=='p'?'~':'✕'}</i><span>${t}${sub?`<small>${sub}</small>`:''}</span></li>`;
 const lat=c.la,lon=c.lo,mb=a=>a.reduce((x,i)=>x+i.mb,0),feet=(c.pn||'').includes('ftUS');
 const ft=a=>`<div class="sw"><table><thead><tr><th>File</th><th>EPSG</th><th>Size</th><th>Published</th></tr></thead><tbody>${a.map(f=>`<tr><td><a href="${esc(f.u)}">${esc(f.t.replace('USGS Lidar Point Cloud ','').replace('USGS 1 Meter ',''))}</a></td><td>${f.e??''}</td><td>${f.mb} MB</td><td>${esc(f.d||'')}</td></tr>`).join('')}</tbody></table></div>`;
 const links=[];
 if(lat){links.push(['Satellite view in Google Maps',`https://www.google.com/maps/@${lat},${lon},1200m/data=!3m1!1e3`,'Latest imagery, good for checking bunkers and paths']);links.push(['Open in Google Earth',`https://earth.google.com/web/@${lat},${lon},400a,2500d,35y,0h,0t,0r`,'3D view for reading slopes']);links.push(['OpenStreetMap',`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=16/${lat}/${lon}`,'The source of the hole lines'])}
 if(c.w)links.push(['Club website',c.w,'Clubhouse photos and current details']);if(c.curl)links.push(['Scorecard source',c.curl,c.csrc==='Official'?'Official card':'Directory listing']);
 const facts=[['Address',[c.a,c.ci,c.z].filter(Boolean).join(', ')],['Phone',c.ph],['Type',c.t],['Designer',c.ar],['Opened',c.yr],['Rating and slope',c.sl?`${c.ra} / ${c.sl}`:''],['Our difficulty label',c.d],['Grass',[c.fg,c.gg].filter(Boolean).join(' fairways, ')+(c.gg?' greens':'')],['Also known as',c.aka],['Ranking',c.rk],['On site',c.am.join(', ')],['Tournaments',c.ev.map(e=>e.y+' '+e.e).join('; ')]].filter(x=>x[1]);
 K.innerHTML=`<p class="crumb"><a href="index.html">All courses</a> / ${esc(c.r)} / ${esc(c.ci)}</p><h1>${esc(c.n)}</h1>
 <p class="sum">${c.st!='Active'?`<span class="lost ${c.st}">${c.st}</span> `:''}${[c.h?c.h+' holes':'',c.p?'par '+c.p:'',c.y?fmt(c.y)+' yards':''].filter(Boolean).join(', ')}${c.ci?' in '+esc(c.ci):''}.</p>
 <div class="acts"><button class="btn go" onclick="print()">Print build sheet</button>${c.gj?`<a class="btn" href="files/geojson/${c.s}.geojson" download>Download hole shapes</a>`:''}${c.img?`<a class="btn" href="img/aerial/${c.s}.jpg" download>Download clean aerial</a>`:''}${c.lidar.length?`<a class="btn" href="#lidar">Point cloud files, EPSG ${c.pe}</a>`:''}</div>
 <div class="lead"><figure class="view">${c.img?`<div class="vt"><button aria-pressed="true" data-v="holes">Hole map</button><button aria-pressed="false" data-v="aerial">Clean aerial</button></div><img id="vi" width="1200" height="900" src="img/holes/${c.s}.jpg" alt="Aerial of ${esc(c.n)} with mapped holes"><figcaption>${c.mapped?`${c.mapped} numbered tees mapped. White lines are hole routes, shaded areas are greens, fairways, bunkers and water.`:'No hole routes mapped here yet, so this is the plain aerial.'}${c.size?` Area shown is about ${c.size[0]} by ${c.size[1]} km.`:''}${c.geo?' Location comes from the street address and may be off.':''}</figcaption>`:'<div class="none">No location on record, so there is no aerial for this course.</div>'}</figure>
 <aside class="rail"><h2>What's ready</h2><ul class="check">
 ${ck(c.card=='Full'?'y':c.card=='None'?'n':'p','Scorecard',c.card=='Full'?`Hole by hole, ${c.csrc=='OpenGolfAPI'?'database record':c.csrc.toLowerCase()+' source'}`:c.card)}
 ${ck(c.lay=='Full hole map'?'y':c.lay=='Partial hole map'?'p':'n','Hole map',c.lay)}
 ${ck(c.gj?'y':'n','Hole shapes',c.gj?'GeoJSON download':'Not mapped')}
 ${ck(c.lidar.length?'y':'n','Point cloud',c.lidar.length?`EPSG ${c.pe}, ${feet?'US survey feet':'meters'}, ${c.lidar.length} ${c.lidar.length==1?'tile':'tiles'}, about ${fmt(Math.round(mb(c.lidar)))} MB`:'No match, location unknown')}
 ${ck(c.sl?'y':'n','Rating and slope',c.sl?`${c.ra} / ${c.sl}`:'Not found')}</ul>
 <h2>Your build</h2><label for="bs">Status</label><select id="bs"><option value="">Not started</option><option>In progress</option><option>Built</option></select><label for="bn">Notes</label><textarea id="bn" placeholder="Share code, corrections, what's left"></textarea></aside></div>
 <section class="printonly"><table><thead><tr><th>Hole</th><th>Par</th><th>Hcp</th><th>${esc(c.tees[0]||'Yards')}</th><th>In game</th><th>Notes</th></tr></thead><tbody>${c.holes.map(h=>`<tr><td>${h[0]}</td><td>${h[1]??''}</td><td>${h[2]??''}</td><td>${h[3][0]??''}</td><td style="width:70px"></td><td style="width:220px"></td></tr>`).join('')}</tbody></table></section>
 ${c.lidar.length?`<section class="sec" id="lidar"><h2>Point cloud files</h2><p>These are the primary terrain files for this course. Use them on their own, with no conversion.</p>
 <dl class="facts pc"><dt>EPSG</dt><dd><b>${c.pe}</b>, ${esc(c.pn)}</dd><dt>Units</dt><dd>${feet?'US survey feet, for position and height':'Meters, for position and height'}</dd><dt>Files</dt><dd>${c.lidar.length} ${c.lidar.length==1?'tile':'tiles'}, about ${fmt(Math.round(mb(c.lidar)))} MB</dd><dt>In TGC Tools</dt><dd>Leave Force EPSG and the unit override blank. If the tool can't detect the projection, enter EPSG ${c.pe}${feet?' and a unit of 0.3048006096012192':''}.</dd></dl>
 <p class="acts"><a class="btn go" href="files/lidar/${c.s}.txt" download>Download point cloud link list</a> <a class="btn" href="files/Primary_Build_Files.csv" download>Download EPSG list, all courses</a></p>
 <p>USGS limits rapid requests, so set a download manager to one or two files at a time and retry any that fail. Save all of a course's tiles in one folder.</p>
 <details open><summary>Point cloud tiles (LAZ): ${c.lidar.length} ${c.lidar.length==1?'file':'files'}</summary>${ft(c.lidar)}</details>
 <details><summary>Using LIDAR in 2K25</summary><p>The <a href="https://github.com/malifica/TGC-Designer-Tools/releases" rel="noopener">2K25 version of TGC Designer Tools</a> (Beta 3.1 or later) reads the coordinate system from each file and scales feet to meters itself, for both position and height. It works from local LAZ files and a local OpenStreetMap file, and exports a .course file. This workflow hasn't been tested here, so try one course before relying on it.</p><ul class="lk"><li><a href="https://tgctours.proboards.com/board/97/tgc-golf-tools-lidar-osm" rel="noopener">TGC Golf Tools, LIDAR and OSM forum</a></li><li><a href="https://tgctours.proboards.com/thread/36147/lidar-courses-2k25-resolution-bunkers" rel="noopener">LIDAR courses in 2K25 thread</a></li></ul></details>
 ${c.dem.length?`<details><summary>Backup only: 1-meter elevation model, ${c.dem.length} ${c.dem.length==1?'file':'files'}</summary><p>You don't need these for a normal build. Use them only if the point cloud won't load, and never combine them with it, because they use a different coordinate system.</p>${ft(c.dem)}</details>`:''}</section>`:''}
 <section class="sec"><h2>Scorecard</h2>${c.cnote?`<p class="warn">${esc(c.cnote)}</p>`:''}${c.pnote?`<p class="warn">${esc(c.pnote)}</p>`:''}${scorecard(c)}
 ${c.teelist.length?`<details open><summary>Tees, ratings and slopes</summary><div class="sw"><table><thead><tr><th>Tee</th><th>Gender</th><th>Par</th><th>Yards</th><th>Rating</th><th>Slope</th></tr></thead><tbody>${c.teelist.map(t=>`<tr><td>${esc(t.tee_name)}</td><td>${esc(t.gender)}</td><td>${t.par??''}</td><td>${fmt(t.yardage)}</td><td>${t.course_rating??''}</td><td>${t.slope??''}</td></tr>`).join('')}</tbody></table></div></details>`:''}</section>
 <section class="sec two"><div><h2>Course facts</h2><dl class="facts">${facts.map(f=>`<dt>${f[0]}</dt><dd>${esc(f[1])}</dd>`).join('')}</dl></div><div><h2>Reference links</h2><ul class="lk">${links.map(l=>`<li><a href="${esc(l[1])}" target="_blank" rel="noopener">${esc(l[0])}</a><small>${esc(l[2])}</small></li>`).join('')}</ul></div></section>
 ${c.note&&c.st!='Active'?`<section class="sec"><h2>Data note</h2><p>${esc(c.note)}</p></section>`:''}`;
 document.querySelectorAll('.vt button').forEach(b=>b.onclick=()=>{document.querySelectorAll('.vt button').forEach(x=>x.setAttribute('aria-pressed',x==b));$('vi').src=`img/${b.dataset.v}/${c.s}.jpg`});
 $('bs').value=me.st||'';$('bn').value=me.note||'';
 const save=()=>{const v=store.get();v[c.s]={st:$('bs').value,note:$('bn').value};if(!v[c.s].st&&!v[c.s].note)delete v[c.s];store.set(v);fetch('data/index.json').then(r=>r.json()).then(d=>progress(d.length))};
 $('bs').oninput=save;$('bn').oninput=save}
