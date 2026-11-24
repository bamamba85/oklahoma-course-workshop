// Shape tracing in the hole editor (owner, Nov 24 2026): greens, fairways, tees, bunkers, water, buildings,
// clubhouse (shapes) and cart / walking paths (lines), drawn point by point on the USGS photo like OpenStreetMap's
// iD editor. Saved with the course's holes in 'okw-trace' (mine.f). "Save for TGC" writes one .osm with every hole
// and shape, for TGC Designer Tools' Local OSM File box, while his OpenStreetMap account is blocked. Shapes copied in
// with "Load OSM shapes" keep their OpenStreetMap id (o) so a later JOSM upload can leave them out.
// Tags are the ones TGC Designer Tools reads (OSMTGC.py).
function okwFeatures(D){
 const {map,c,slug,mine,save,st}=D,$b=id=>document.getElementById(id);
 // listed (and so the buttons ordered) like the stacking, bottom to top (owner, Nov 24 2026)
 const K={building:{t:'Building',tags:{building:'yes'},sty:{fillColor:'#8A8A8A',fillOpacity:.6,color:'#EEE',weight:2}},
  clubhouse:{t:'Clubhouse',tags:{building:'yes',golf:'clubhouse'},sty:{fillColor:'#B04A3A',fillOpacity:.6,color:'#FFE0D8',weight:2}},
  creek:{t:'Creek',line:1,tags:{waterway:'stream'},sty:{color:'#3C8DDC',weight:4,opacity:.95}},
  water:{t:'Water',tags:{natural:'water'},sty:{fillColor:'#3C8DDC',fillOpacity:.45,color:'#BFE3FF',weight:2}},
  rough:{t:'Light rough',tags:{golf:'rough'},sty:{fillColor:'rgb(140,180,70)',fillOpacity:.35,color:'rgb(190,215,120)',weight:2}},  // owner, Nov 24 2026
  driving_range:{t:'Driving range',tags:{golf:'driving_range'}},  // owner, Nov 24 2026; TGC makes it fairway
  fairway:{t:'Fairway',tags:{golf:'fairway'}},
  cartpath:{t:'Cart path',line:1,tags:{highway:'path',golf:'cartpath',golf_cart:'designated'},sty:{color:'#F2F2F2',weight:4,opacity:.95}},
  path:{t:'Walking path',line:1,tags:{highway:'footway',golf:'path'},sty:{color:'#E0B070',weight:3,opacity:.95,dashArray:'6 5'}},
  tee:{t:'Tee',tags:{golf:'tee'}},bunker:{t:'Bunker',tags:{golf:'bunker'}},green:{t:'Green',tags:{golf:'green'}}};
 // see-through fills (owner, Nov 24 2026: tees hard to see under a shape while tracing); fainter still while drawing
 const sty=k=>{const s={...(K[k].sty||{...SHAPE_STYLE[k],opacity:1})};if(s.fillOpacity!=null)s.fillOpacity=Math.min(.3,s.fillOpacity*.5)*(mode?.5:1);return s};
 const F=mine.f=mine.f||[];
 map.createPane('feat').style.zIndex=380;
 const lay=L.layerGroup().addTo(map);
 let mode=null,pts=[],sel=-1,dsel=-1,joining=false;
 function delDot(){if(sel<0||dsel<0)return;const f=F[sel];
  if(f.g.length<=(K[f.k].line?2:3)){st.textContent='That is the fewest dots this shape can have. Use Delete shape to remove it.';return}
  snap();f.g.splice(dsel,1);f.ed=1;dsel=-1;save();render()}
 // Undo (owner, Nov 24 2026): while drawing, the last point; otherwise the last change to a shape (add, move a dot,
 // add/remove a dot, delete), up to 100 steps this visit. Ctrl+Z does the same.
 const hist=[],snap=()=>{hist.push(JSON.stringify(F));if(hist.length>100)hist.shift()};
 function undo(){if(mode){if(pts.length){pts.pop();render()}else cancel();return}
  if(!hist.length){st.textContent='Nothing to undo.';return}
  F.splice(0,F.length,...JSON.parse(hist.pop()));sel=-1;save();render();st.textContent='Undone. '+st.textContent}
 const icon=(cls,sz)=>L.divIcon({className:'',html:`<div class="${cls}" style="width:${sz}px;height:${sz}px"></div>`,iconSize:[sz,sz],iconAnchor:[sz/2,sz/2]});
 // the toolbar row
 const row=$b('dfeat');
 // buttons top-of-stack first (owner, Nov 24 2026): Green, Bunker, Tee ... Building
 row.innerHTML='<span class="flab">Shapes:</span>'+Object.entries(K).reverse().map(([k,v])=>`<button class="btn fk" type="button" data-k="${k}"><i style="background:${v.line?sty(k).color:sty(k).fillColor};border-color:${sty(k).color}"></i>${v.t}</button>`).join('')
  +'<button class="btn" id="fdone" type="button" hidden>Finish shape</button><button class="btn" id="fsm" type="button" hidden title="Even out the dots of the selected shape so bumps flatten; no dots added (Undo puts it back)">Smooth</button><button class="btn" id="ffew" type="button" hidden title="Thin out dots that add little to the selected shape (Undo puts them back)">Fewer dots</button><button class="btn" id="fjoin" type="button" hidden title="Then click another line of the same type: the two become one line, joined at their nearest ends">Join</button><button class="btn" id="fjall" type="button" hidden title="Join every piece of this line type whose end touches the end of another piece (within 3 m)">Join all touching</button><button class="btn" id="fsplit" type="button" hidden title="Cut the line in two at the picked (red) dot">Split here</button><button class="btn" id="fdel" type="button" hidden>Delete shape</button>'
  +'<span class="fsp"></span><button class="btn" id="fopen" type="button">Open .osm file</button><button class="btn" id="fload" type="button">Load OSM shapes</button><button class="btn go" id="ftgc" type="button">Save for TGC</button>';
 // Shapes on/off: his traced shapes (owner, Nov 24 2026); the guide's background shapes have their own Background button
 {const sb=$b('dshp');sb.hidden=false;sb.title='Your traced shapes';
  sb.onclick=()=>{const was=sb.getAttribute('aria-pressed')!='false';
   sb.setAttribute('aria-pressed',!was);sb.textContent=was?'Shapes off':'Shapes on';was?map.removeLayer(lay):lay.addTo(map)}}
 const showShapes=()=>{const sb=$b('dshp');if(sb.getAttribute('aria-pressed')=='false')sb.click()};
 // Undo sits in the hole row, after Shapes on, away from Finish shape (owner, Nov 24 2026: clicked it by mistake)
 {const u=document.createElement('button');u.className='btn';u.id='fundo';u.type='button';u.title='Undo the last shape click (Ctrl+Z)';u.textContent='Undo';$b('dlines').after(u)}
 const count=()=>{const n={};F.forEach(f=>n[f.k]=(n[f.k]||0)+1);return Object.entries(n).map(([k,v])=>`${v} ${K[k].t.toLowerCase()}${v>1&&k!='water'?'s':''}`).join(', ')};
 function hint(){if(mode){const v=K[mode],need=v.line?2:3;st.textContent=`${v.t}: click points around it`+(pts.length>=need?(v.line?'. Click Finish (or Enter) at the end.':'. Click the first point (or Enter) to close it.'):'.')+' Backspace removes the last point, Esc cancels.';return}
  if(sel>=0){const f=F[sel];st.textContent=`${K[f.k].t} selected${f.o?' (from OpenStreetMap)':''}. `+(joining?`Now click the ${K[f.k].t.toLowerCase()} to join onto this one. Esc or click the map to stop.`:extending()?'End picked: click the map to carry the line on from here. Esc or click the red dot to stop; Delete removes it.':dsel>=0?'Dot picked: press Delete to remove it, drag it'+(K[f.k].line?', or Split here to cut the line in two there.':'.'):K[f.k].line?`Drag its dots to adjust, click an END dot to carry the line on, click a dot then Delete to remove it or Split here to cut the line there (click the line to add a dot). ${f.g.length} dots.`:`Drag its dots to adjust, click its edge to add a dot, click a dot then Delete (or right-click it) to remove it. ${f.g.length} dots.`);return}
  st.textContent=F.length?`Shapes drawn: ${count()}. Pick a shape type to draw another, or click a shape to edit it.`:'Pick a shape type (Green, Fairway ...) and click points around it on the photo.'}
 // the type being drawn, or the selected shape's type, is highlighted (owner, Nov 24 2026)
 function buttons(){const on=mode||(sel>=0?F[sel]?.k:null);row.querySelectorAll('.fk').forEach(b=>b.setAttribute('aria-pressed',b.dataset.k==on));
  $b('fdone').hidden=!mode;$b('fdel').hidden=mode||sel<0;$b('ffew').hidden=mode||sel<0;$b('fsm').hidden=mode||sel<0||sharp(F[sel]?.k);
  const ln=!mode&&sel>=0&&!!K[F[sel]?.k]?.line;$b('fjoin').hidden=!ln;$b('fjall').hidden=!ln;$b('fsplit').hidden=!ln||dsel<=0||dsel>=F[sel].g.length-1;
  $b('fjoin').setAttribute('aria-pressed',joining);
  $b('dmap').classList.toggle('placing',!!mode||D.placing()||extending()||joining)}
 function render(){lay.clearLayers();
  // stacked by type, not drawing order (owner, Nov 24 2026: couldn't click hole 9's green under its fairway):
  // big shapes at the bottom so greens, tees and bunkers inside them can always be clicked
  // owner's order, bottom to top (Nov 24 2026): buildings/clubhouse, creeks/water, fairway, paths, tees, bunkers, greens
  const RANK={building:0,clubhouse:0,creek:1,water:1,rough:2,driving_range:3,fairway:4,path:5,cartpath:5,tee:6,bunker:7,green:8};
  // a shape keeps only his clicked dots (g); the smooth curve through them is drawn here and saved by Save for TGC
  // (owner, Nov 24 2026: "too many points")
  F.map((f,i)=>i).sort((a,b)=>(RANK[F[a].k]??9)-(RANK[F[b].k]??9)||a-b).forEach(i=>{const f=F[i];if(i==sel)return;const v=K[f.k];const s={...sty(f.k),pane:'feat'};
   const g=v.line?L.polyline(sm(f.k,f.g),s):L.polygon(sm(f.k,f.g),s);g.on('click',e=>{L.DomEvent.stopPropagation(e);if(joining){join(i);return}if(mode||D.placing()||extending()){if(D.placing()&&!mode&&!extending())return;click(e.latlng);return}sel=i;dsel=-1;render()});g.addTo(lay)});
  if(sel>=0){const f=F[sel],v=K[f.k],s={...sty(f.k),pane:'feat',weight:(sty(f.k).weight||2)+2,color:'#FFD84A'};
   const g=v.line?L.polyline(sm(f.k,f.g),s):L.polygon(sm(f.k,f.g),s);
   g.on('click',e=>{L.DomEvent.stopPropagation(e);if(joining){joining=false;render();return}if(mode||extending()){click(e.latlng);return}
    // add a dot on the nearest edge
    const pt=map.latLngToLayerPoint(e.latlng),n=f.g.length,ring=!v.line;let best=1,bd=1e18;
    for(let j=1;j<=(ring?n:n-1);j++){const a=f.g[j-1],b=f.g[j%n];const d=L.LineUtil.pointToSegmentDistance(pt,map.latLngToLayerPoint(a),map.latLngToLayerPoint(b));if(d<bd){bd=d;best=j}}
    snap();f.g.splice(best,0,[e.latlng.lat,e.latlng.lng]);f.ed=1;dsel=best;save();render()});g.addTo(lay);
   f.g.forEach((q,j)=>{const m=L.marker(q,{draggable:true,autoPan:true,icon:icon(j==dsel?'fdot on':'fdot',j==dsel?16:12),zIndexOffset:j==dsel?2100:2000}).addTo(lay);
    m.on('dragstart',()=>{snap();dsel=j});m.on('drag',e=>{const ll=e.target.getLatLng();f.g[j]=[ll.lat,ll.lng];g.setLatLngs(sm(f.k,f.g))});m.on('dragend',()=>{f.ed=1;save();render()});
    // click a dot to pick it (then Delete removes it)
    m.on('click',e=>{L.DomEvent.stopPropagation(e);dsel=dsel==j?-1:j;render()});
    m.on('contextmenu',()=>{dsel=j;delDot()})})}
  // while drawing, show the shape already rounded the way Finish will save it (owner: smooth as I go), with the
  // clicked points as faint straight lines underneath
  if(mode&&pts.length){const s={...sty(mode),pane:'feat'},ln=K[mode].line,ring=!ln&&pts.length>=3;
   L.polyline(ring?[...pts,pts[0]]:pts,{pane:'feat',color:'#fff',weight:1,opacity:.6,dashArray:'3 4',interactive:false}).addTo(lay);
   if(pts.length>=2)(ring?L.polygon(sm(mode,pts),s):L.polyline(sm(mode,pts),s)).addTo(lay);
   pts.forEach((q,j)=>{const m=L.marker(q,{icon:icon(j==0&&!K[mode].line&&pts.length>=3?'fdot first':'fdot',j==0?16:12),zIndexOffset:2000}).addTo(lay);
    m.on('click',e=>{L.DomEvent.stopPropagation(e);if(j==0&&!K[mode].line&&pts.length>=3)finish();else if(j==pts.length-1&&K[mode].line&&pts.length>=2)finish()})})}
  buttons();hint()}
 // smooth as he draws and on Finish (owner, Nov 24 2026): a rounded curve that passes through every clicked point
 // (Catmull-Rom, 2 extra points between clicks), so the edge still lands where he clicked
 // Centripetal Catmull-Rom (Nov 24 2026): unlike the plain kind it doesn't overshoot or loop where dots are unevenly
 // spaced (e.g. after Fewer dots); a curve point about every 2 m between dots (1 to 8 per gap)
 function smooth(g,ln){const n=g.length;if(n<3)return g.slice();const out=[],P=i=>ln?g[Math.max(0,Math.min(n-1,i))]:g[(i+n)%n];
  const xy=p=>[p[1]*Math.cos(p[0]*Math.PI/180)*111320,p[0]*110540],d=(a,b)=>Math.max(1e-3,Math.sqrt(Math.hypot(xy(a)[0]-xy(b)[0],xy(a)[1]-xy(b)[1])));
  for(let i=0;i<(ln?n-1:n);i++){let p0=P(i-1),p1=P(i),p2=P(i+1),p3=P(i+2);out.push(p1);
   if(ln&&i==0)p0=[2*p1[0]-p2[0],2*p1[1]-p2[1]];if(ln&&i==n-2)p3=[2*p2[0]-p1[0],2*p2[1]-p1[1]];
   const t0=0,t1=d(p0,p1),t2=t1+d(p1,p2),t3=t2+d(p2,p3),seg=d(p1,p2)**2,k=Math.max(1,Math.min(8,Math.round(seg/2)));
   for(let s=1;s<=k;s++){const t=t1+(t2-t1)*s/(k+1),L=(a,b,ta,tb)=>[0,1].map(j=>(tb-t)/(tb-ta)*a[j]+(t-ta)/(tb-ta)*b[j]);
    const A1=L(p0,p1,t0,t1),A2=L(p1,p2,t1,t2),A3=L(p2,p3,t2,t3),B1=L(A1,A2,t0,t2),B2=L(A2,A3,t1,t3);out.push(L(B1,B2,t1,t2))}}
  if(ln)out.push(g[n-1]);return out}
 // buildings and the clubhouse keep straight walls (owner, Nov 24 2026): no smoothing for them
 const sharp=k=>k=='building'||k=='clubhouse',sm=(k,g)=>sharp(k)?g.slice():smooth(g,K[k].line);
 // extend a line (owner, Nov 24 2026): select a path or creek, click one of its END dots (it turns red), then each map
 // click adds a dot beyond that end; Esc or clicking the red dot again stops
 function extending(){return !mode&&sel>=0&&!!K[F[sel]?.k]?.line&&(dsel==0||dsel==F[sel].g.length-1)}
 function click(ll){const p=[ll.lat,ll.lng];
  if(extending()){const f=F[sel];snap();if(dsel==0&&f.g.length>1){f.g.unshift(p);dsel=0}else{f.g.push(p);dsel=f.g.length-1}f.ed=1;save();render();return}
  if(!mode)return;pts.push(p);render()}
 // Join / Split lines (owner, Nov 24 2026: OpenStreetMap cart paths come in cut-up pieces; he keeps his continuous,
 // and splits a line where it crosses a street). A joined line keeps the first line's type and tags; the OpenStreetMap
 // ids of pieces folded into it (m) keep Load OSM shapes from copying them in again.
 const mxy=p=>[p[1]*Math.cos(p[0]*Math.PI/180)*111320,p[0]*110540],dist=(a,b)=>Math.hypot(mxy(a)[0]-mxy(b)[0],mxy(a)[1]-mxy(b)[1]);
 const ids=f=>[f.o,...(f.m||[])].filter(Boolean);
 // a and b (lines) become one: nearest ends meet; ends within 3 m become one dot halfway, farther ends get a straight link
 function merge(a,b){const A=a.g,B=b.g,c=[[dist(A.at(-1),B[0]),0,0],[dist(A.at(-1),B.at(-1)),0,1],[dist(A[0],B[0]),1,0],[dist(A[0],B.at(-1)),1,1]].sort((x,y)=>x[0]-y[0])[0];
  const g1=c[1]?A.slice().reverse():A.slice(),g2=c[2]?B.slice().reverse():B.slice();
  if(c[0]<3){const p=g1.pop(),q=g2.shift();g1.push([(p[0]+q[0])/2,(p[1]+q[1])/2])}
  a.g=g1.concat(g2);a.m=[...new Set([...(a.m||[]),...ids(b)])];a.ed=1;return c[0]}
 function join(i){joining=false;if(i==sel){render();return}const a=F[sel],b=F[i];
  if(!b||b.k!=a.k){st.textContent=`That's ${b?'a '+K[b.k].t.toLowerCase():'not a line'}; only another ${K[a.k].t.toLowerCase()} can be joined to this one. Click Join to try again.`;buttons();return}
  snap();const d=merge(a,b);F.splice(i,1);if(i<sel)sel--;dsel=-1;save();render();
  st.textContent=`Joined into one ${K[a.k].t.toLowerCase()} (${a.g.length} dots)`+(d>=3?`, with a straight link across the ${Math.round(d)} m gap; click it to add a dot and bend it.`:'.')+' Undo splits them again.'}
 function joinAll(){const k=F[sel].k,keep=F[sel];snap();let n=0;
  for(;;){let best=null;const L_=F.map((f,i)=>[f,i]).filter(([f])=>f.k==k);
   for(let x=0;x<L_.length;x++)for(let y=x+1;y<L_.length;y++){const A=L_[x][0].g,B=L_[y][0].g;
    const d=Math.min(dist(A.at(-1),B[0]),dist(A.at(-1),B.at(-1)),dist(A[0],B[0]),dist(A[0],B.at(-1)));if(d<3&&(!best||d<best[0]))best=[d,L_[x][1],L_[y][1]]}
   if(!best)break;let [,i,j]=best;if(F[j]==keep)[i,j]=[j,i];merge(F[i],F[j]);F.splice(j,1);n++}
  sel=F.indexOf(keep);dsel=-1;if(!n)hist.pop();save();render();
  st.textContent=n?`Joined ${n} touching piece${n>1?'s':''}: ${F.filter(f=>f.k==k).length} ${K[k].t.toLowerCase()} line${F.filter(f=>f.k==k).length>1?'s':''} now. Undo puts them back.`:`No ${K[k].t.toLowerCase()} ends touch (within 3 m); use Join to link two with a gap.`}
 function split(){if(sel<0)return;const f=F[sel],j=dsel;if(!K[f.k].line||j<=0||j>=f.g.length-1)return;
  snap();const b={...f,g:f.g.slice(j),m:ids(f)};delete b.o;f.g=f.g.slice(0,j+1);f.ed=1;b.ed=1;F.splice(sel+1,0,b);dsel=-1;save();render();
  st.textContent=`Split in two at that dot. Click either piece to edit it, change its type or delete it (e.g. the bit across a street). Undo puts it back.`}
 function start(k){if(D.placing())D.stopPlacing();joining=false;if(mode==k){cancel();return}showShapes();pts=[];sel=-1;mode=k;render()}
 function cancel(){mode=null;pts=[];render()}
 function finish(){const v=K[mode];if(pts.length<(v.line?2:3)){st.textContent=v.line?'A path needs at least 2 points.':'A shape needs at least 3 points.';return}
  snap();F.push({k:mode,g:pts.slice(),s:3});save();const k=mode;mode=null;pts=[];sel=-1;render();st.textContent=`${K[k].t} added. `+st.textContent}
 // with a shape selected, another type of the same sort (line <-> line, area <-> area) changes it (owner, Nov 24 2026:
 // walking path -> cart path); otherwise the button starts drawing a new shape of that type
 row.querySelectorAll('.fk').forEach(b=>b.onclick=()=>{const k=b.dataset.k;
  if(!mode&&sel>=0&&F[sel].k!=k&&!!K[F[sel].k].line==!!K[k].line){const f=F[sel],was=K[f.k].t;snap();f.k=k;delete f.t;f.ed=1;dsel=-1;save();render();
   st.textContent=`Changed ${was} to ${K[k].t}. Undo changes it back.`;return}
  start(k)});
 $b('fdone').onclick=()=>finish();
 let armed=0;const del=()=>{if(sel<0)return;if(!armed){armed=setTimeout(()=>{armed=0;$b('fdel').textContent='Delete shape'},4000);$b('fdel').textContent='Click again to delete';return}
  clearTimeout(armed);armed=0;$b('fdel').textContent='Delete shape';snap();F.splice(sel,1);sel=-1;save();render()};
 $b('fdel').onclick=del;$b('fundo').onclick=undo;
 $b('fjoin').onclick=()=>{if(sel<0)return;joining=!joining;dsel=-1;render()};$b('fjall').onclick=()=>{if(sel>=0){joining=false;joinAll()}};$b('fsplit').onclick=split;
 // Smooth (owner, Nov 24 2026: Fewer dots left it bumpy): Taubin smoothing of the dots themselves, each dot pulled
 // toward its neighbours' midpoint then pushed back slightly, two rounds per press, so bumps flatten without the
 // shape shrinking; same number of dots; a path's two ends stay put. Undo puts it back.
 $b('fsm').onclick=()=>{if(sel<0)return;const f=F[sel],ln=K[f.k].line,n=f.g.length;if(n<4)return;
  const step=(g,lam)=>g.map((p,i)=>{if(ln&&(i==0||i==n-1))return p;const a=g[(i-1+n)%n],b=g[(i+1)%n];return [0,1].map(k=>p[k]+lam*((a[k]+b[k])/2-p[k]))});
  let g=f.g;for(let r=0;r<2;r++)g=step(step(g,.5),-.53);
  snap();f.g=g;f.ed=1;save();render();st.textContent='Smoothed. Press again for smoother, or Undo.'};
 // Fewer dots (owner, Nov 24 2026): drop dots the outline barely bends at (within 0.4 m, then 0.8 m on a second
 // press ...), keeping its shape; for drafts and OpenStreetMap copies with dense outlines. Undo puts them back.
 let fewTol=0.4,fewFor=-1;
 $b('ffew').onclick=()=>{if(sel<0)return;const f=F[sel],ln=K[f.k].line,min=ln?2:3;if(fewFor!=sel){fewTol=0.4;fewFor=sel}
  const xy=p=>[p[1]*Math.cos(p[0]*Math.PI/180)*111320,p[0]*110540];
  const dp=(g,tol)=>{if(g.length<3)return g;const A=xy(g[0]),B=xy(g.at(-1));let bi=0,bd=-1;
   for(let i=1;i<g.length-1;i++){const P=xy(g[i]),dx=B[0]-A[0],dy=B[1]-A[1],L2=dx*dx+dy*dy;let t=L2?((P[0]-A[0])*dx+(P[1]-A[1])*dy)/L2:0;t=Math.max(0,Math.min(1,t));
    const d=Math.hypot(P[0]-A[0]-t*dx,P[1]-A[1]-t*dy);if(d>bd){bd=d;bi=i}}
   return bd>tol?[...dp(g.slice(0,bi+1),tol).slice(0,-1),...dp(g.slice(bi),tol)]:[g[0],g.at(-1)]};
  const n=f.g.length;let g;
  if(ln)g=dp(f.g,fewTol);else{const far=f.g.reduce((b,p,i)=>{const d=Math.hypot(xy(p)[0]-xy(f.g[0])[0],xy(p)[1]-xy(f.g[0])[1]);return d>b[0]?[d,i]:b},[0,0])[1];
   g=[...dp(f.g.slice(0,far+1),fewTol).slice(0,-1),...dp([...f.g.slice(far),f.g[0]],fewTol).slice(0,-1)]}
  if(g.length<min||g.length==n){st.textContent=g.length==n?`No dots to spare at ${fewTol} m; press again to allow more.`:'Too few dots would be left.';fewTol*=2;return}
  snap();f.g=g;f.ed=1;dsel=-1;save();render();st.textContent=`Fewer dots: ${n} → ${g.length} (within ${fewTol} m). Press again for fewer, or Undo.`;fewTol*=2};
 map.on('click',e=>{if(joining){joining=false;render();return}if(mode||extending()){click(e.latlng);return}if(sel>=0){sel=-1;dsel=-1;render()}});
 addEventListener('keydown',e=>{if(/INPUT|TEXTAREA/.test(e.target.tagName))return;
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()=='z'){undo();e.preventDefault();e.stopImmediatePropagation();return}
  if(mode){if(e.key=='Escape'){cancel();e.stopImmediatePropagation()}else if(e.key=='Enter'){finish();e.preventDefault()}else if(e.key=='Backspace'){pts.pop();render();e.preventDefault()}return}
  if(sel>=0){if(e.key=='Escape'){if(joining)joining=false;else if(dsel>=0)dsel=-1;else sel=-1;render()}
   else if(e.key=='Delete'||e.key=='Backspace'){e.preventDefault();if(dsel>=0)delDot();else if(e.key=='Delete'){del();if(armed)del()}}}},true);
 // which shape type an OpenStreetMap feature is (null = not one we draw)
 const kind=tg=>{const g=tg.golf;
  if(g=='clubhouse')return 'clubhouse';if(['green','fairway','tee','bunker','driving_range','rough'].includes(g))return g;if(g=='water_hazard'||g=='lateral_water_hazard'||tg.natural=='water')return 'water';
  if(g=='cartpath')return 'cartpath';if(g=='path')return 'path';if(tg.building)return 'building';
  // creeks and plain paths (owner, Nov 24 2026), read the way TGC Designer Tools does: a waterway line is water;
  // a path-type highway is a cart path when golf_cart allows it, else a walking path (unless foot=no). Streets stay out.
  if(/^(stream|ditch|drain|river|canal|brook)$/.test(tg.waterway||''))return 'creek';
  const h=tg.highway||'',cart=tg.golf_cart&&tg.golf_cart!='no';
  if(/^(footway|path|track|pedestrian|cycleway|bridleway|steps)$/.test(h))return cart?'cartpath':tg.foot=='no'?null:'path';
  if(h=='service'&&cart)return 'cartpath';return null};
 // a copied feature keeps its own OpenStreetMap tags for Save for TGC (t), minus a relation's type
 const own=tg=>{const t={...tg};delete t.type;delete t['okw:dots'];return t};
 // Open .osm file (owner, Nov 24 2026): load a saved file's holes and shapes, e.g. his own hole export in
 // HD Courses\...\00Partial\<course>\, or a downloaded OpenStreetMap file. Holes replace drawn lines for the same
 // numbers; shapes are added (ones with a real OpenStreetMap id only once, so Load OSM shapes won't double them).
 const pick=document.createElement('input');pick.type='file';pick.accept='.osm,.xml';pick.hidden=true;row.append(pick);
 // Edge/Chrome: the same remembered folder as Save for TGC (id okw-tgc-export); a page can't name a folder itself
 // The Claude app's browser pane won't read a file picked that way (NotAllowedError, Nov 24 2026): then it
 // switches to the ordinary file window for the rest of the visit.
 let plain=false;
 $b('fopen').onclick=async()=>{if(window.showOpenFilePicker&&!plain){let fh;
   try{[fh]=await showOpenFilePicker({id:'okw-tgc-export',types:[{description:'OpenStreetMap file',accept:{'application/xml':['.osm']}}]})}catch(e){if(e.name=='AbortError')return;fh=null}
   if(fh){let file;try{file=await fh.getFile()}catch{plain=true;st.textContent="This browser wouldn't open the file that way. Click Open .osm file again and pick it in the ordinary file window.";return}
    openFile(file);return}}
  pick.value='';pick.click()};
 pick.onchange=()=>{if(pick.files[0])openFile(pick.files[0])};
 const openFile=async file=>{let d;
  try{d=new DOMParser().parseFromString(await file.text(),'application/xml');if(d.querySelector('parsererror'))throw 0}catch{st.textContent=`${file.name} isn't an OpenStreetMap file the editor can read.`;return}
  const nd=new Map([...d.querySelectorAll('node')].map(x=>[x.getAttribute('id'),[+x.getAttribute('lat'),+x.getAttribute('lon')]]));
  const tags=x=>Object.fromEntries([...x.querySelectorAll(':scope>tag')].map(t=>[t.getAttribute('k'),t.getAttribute('v')]));
  const geo=w=>[...w.querySelectorAll('nd')].map(x=>nd.get(x.getAttribute('ref'))).filter(Boolean);
  const wy=new Map([...d.querySelectorAll('way')].map(w=>[w.getAttribute('id'),w]));
  const nums=D.card.map(h=>h.n),gotH=[],gotS=[],skip=[];
  const addShape=(k,g,id,tg)=>{
   // a file saved by Save for TGC lists which points were his clicked dots (okw:dots); bring back just those
   if(tg['okw:dots']){const ix=tg['okw:dots'].split(',').map(Number).filter(i=>i>=0&&i<g.length);if(ix.length>=2)g=ix.map(i=>g[i])}
   if(!K[k].line){if(g.length>3&&g[0][0]==g.at(-1)[0]&&g[0][1]==g.at(-1)[1])g=g.slice(0,-1);if(g.length<3)return}else if(g.length<2)return;
   const o=id&&!id.includes('-')?id:null;gotS.push({k,g,o:o||undefined,s:3,t:own(tg)})};
  for(const [id,w] of wy){const tg=tags(w);
   if(tg.golf=='hole'){const m=String(tg.ref||'').match(/^\s*(\d+)\s*$/),h=m?+m[1]:null,g=geo(w);
    if(h!=null&&nums.includes(h)&&g.length>=2)gotH.push([h,g]);else skip.push(tg.ref||'?');continue}
   const k=kind(tg);if(k)addShape(k,geo(w),'w'+id,tg)}
  for(const r of d.querySelectorAll('relation')){const rt=tags(r),k=kind(rt);if(!k||K[k].line)continue;
   [...r.querySelectorAll('member[type="way"][role="outer"]')].forEach((m,i)=>{const w=wy.get(m.getAttribute('ref'));if(w)addShape(k,geo(w),'r'+r.getAttribute('id')+'.'+i,rt)})}
  // shapes already here (owner, Nov 24 2026): ask Replace / Add / Cancel so reopening a save never doubles them
  if(F.length&&gotS.length){pendOpen={file,gotH,gotS,skip};$b('faskq').textContent=`${file.name} has ${gotS.length} shape${gotS.length>1?'s':''}`+(gotH.length?` and ${gotH.length} hole${gotH.length>1?'s':''}`:'')+`. You already have ${F.length} shape${F.length>1?'s':''} here. Replace them with the file's, or add the file's to them?`;$b('fask').hidden=false;$b('frep').focus();return}
  applyOpen(file,gotH,gotS,skip,false)};
 let pendOpen=null;
 const applyOpen=(file,gotH,gotS,skip,replace)=>{snap();if(replace){F.length=0;sel=-1;dsel=-1}
  const have=new Set(F.flatMap(ids)),holes=[];let n=0;
  for(const [h,g] of gotH){D.R[h]=g;D.mine.osm=D.mine.osm.filter(x=>x!=h);holes.push(h)}
  for(const s of gotS){if(s.o&&have.has(s.o))continue;F.push(s);if(s.o)have.add(s.o);n++}
  D.save();D.redraw();render();const all=[...Object.values(D.R).flat(),...F.flatMap(f=>f.g)];if(all.length)map.fitBounds(L.latLngBounds(all),{padding:[40,40]});
  holes.sort((a,b)=>a-b);
  st.textContent=`Opened ${file.name}: `+(holes.length?`hole${holes.length>1?'s':''} ${holes.join(', ')}`:'no holes')+(n?`, ${n} shape${n>1?'s':''}`:'')+(replace?' (replaced the shapes that were here; Undo brings them back)':'')+'.'+(skip.length?` Left out hole line${skip.length>1?'s':''} numbered ${skip.join(', ')} (not a plain hole number on this course's card).`:'')};
 const unaskOpen=()=>{$b('fask').hidden=true;pendOpen=null};
 $b('frep').onclick=()=>{const p=pendOpen;unaskOpen();if(p)applyOpen(p.file,p.gotH,p.gotS,p.skip,true)};
 $b('fadd').onclick=()=>{const p=pendOpen;unaskOpen();if(p)applyOpen(p.file,p.gotH,p.gotS,p.skip,false)};
 $b('fcan').onclick=()=>{unaskOpen();st.textContent='Nothing opened; your shapes are as they were.'};
 // Load OSM shapes: copy the course area's current OpenStreetMap shapes in (each once, by id) to edit and save with the rest.
 // Fairways drawn as multipolygons (outer/inner rings) come in as their outer rings only.
 $b('fload').onclick=async()=>{const b=$b('fload');b.disabled=true;st.textContent='Asking OpenStreetMap for this course\'s shapes…';
  const bb=c.ob.join(','),q=`[out:json][timeout:50];(way["golf"~"^(green|fairway|tee|bunker|driving_range|rough|water_hazard|lateral_water_hazard|cartpath|path|clubhouse)$"](${bb});way["natural"="water"](${bb});way["building"](${bb});way["waterway"~"^(stream|ditch|drain|river|canal|brook)$"](${bb});way["highway"~"^(footway|path|track|pedestrian|cycleway|bridleway|steps)$"](${bb});way["highway"="service"]["golf_cart"](${bb});relation["golf"="fairway"](${bb});relation["natural"="water"](${bb}););out meta geom;`;
  let j;const stop=new AbortController(),t=setTimeout(()=>stop.abort(),60000);
  try{j=await Promise.any(OVERPASS.map(async u=>{const r=await fetch(u+'?data='+encodeURIComponent(q),{signal:stop.signal});if(!r.ok)throw 0;const x=await r.json();if(!x.elements)throw 0;return x}))}
  catch{st.textContent="Couldn't get an answer from OpenStreetMap. Its servers may be busy; try again in a few minutes.";b.disabled=false;return}finally{clearTimeout(t);stop.abort()}
  b.disabled=false;const have=new Set(F.flatMap(ids));
  let n=0;for(const e of j.elements){const k=kind(e.tags||{});if(!k)continue;
   const rings=e.type=='way'?[e.geometry]:(e.members||[]).filter(m=>m.role=='outer'&&m.geometry).map(m=>m.geometry);
   rings.forEach((r,ri)=>{const id=`${e.type[0]}${e.id}${rings.length>1?'.'+ri:''}`;if(have.has(id)||!r||r.length<2)return;
    let g=r.map(p=>[p.lat,p.lon]);if(!K[k].line){if(g.length>3&&g[0][0]==g.at(-1)[0]&&g[0][1]==g.at(-1)[1])g.pop();if(g.length<3)return}
    F.push({k,g,o:id,s:3,t:own(e.tags||{})});have.add(id);n++})}
  save();render();st.textContent=n?`Copied ${n} shape${n>1?'s':''} from OpenStreetMap: ${count()} in all. They're yours to edit now.`:'OpenStreetMap has no other shapes here that aren\'t already copied.'};
 // Save for TGC: every hole (drawn or from OpenStreetMap) and every shape in one file, new ids throughout.
 // For TGC Designer Tools' Local OSM File box only; it is not an upload file (shapes copied from OSM would be doubled).
 const xml=()=>{const q=s=>String(s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));let id=0;const nodes=[],ways=[];
  const add=(g,closed,tags)=>{const refs=g.map(p=>{id--;nodes.push(`  <node id="${id}" visible="true" lat="${p[0].toFixed(7)}" lon="${p[1].toFixed(7)}"/>`);return id});if(closed)refs.push(refs[0]);ways.push([refs,tags])};
  for(const h of D.card){const p=D.R[h.n];if(!p||p.length<2)continue;add(p,false,{golf:'hole',ref:String(h.n),...(h.par?{par:String(h.par)}:{}),...(D.pre?{name:`${D.pre} ${h.n}`}:{}),'golf:course:name':c.n})}
  // okw:dots: which saved points are his clicked dots, so Open .osm file brings back just those (TGC ignores the tag)
  for(const f of F){const cv=sm(f.k,f.g),ix=cv.map((p,i)=>f.g.includes(p)?i:-1).filter(i=>i>=0);
   add(cv,!K[f.k].line,{...(f.t&&kind(f.t)==f.k?f.t:{...K[f.k].tags,...(f.k=='clubhouse'?{name:`${c.n} Clubhouse`}:{})}),...(ix.length<cv.length?{'okw:dots':ix.join(',')}:{})})}
  // <bounds> (the tool's flat-course and local-OSM boundary steps read it): every point plus ~100 m.
  // upload="never": JOSM refuses to upload this copy (shapes copied from OSM would be doubled).
  const all=[...D.card.flatMap(h=>D.R[h.n]?.length>=2?D.R[h.n]:[]),...F.flatMap(f=>f.g)],la=all.map(p=>p[0]),lo=all.map(p=>p[1]),m=.001;
  const bnd=all.length?`  <bounds minlat="${(Math.min(...la)-m).toFixed(7)}" minlon="${(Math.min(...lo)-m).toFixed(7)}" maxlat="${(Math.max(...la)+m).toFixed(7)}" maxlon="${(Math.max(...lo)+m).toFixed(7)}"/>`:'';
  const out=['<?xml version="1.0" encoding="UTF-8"?>','<osm version="0.6" upload="never" generator="Oklahoma Course Workshop (for TGC)">',...(bnd?[bnd]:[]),...nodes];
  for(const [refs,tags] of ways){id--;out.push(`  <way id="${id}" visible="true">`,...refs.map(r=>`    <nd ref="${r}"/>`),...Object.entries(tags).map(([k,v])=>`    <tag k="${q(k)}" v="${q(v)}"/>`),'  </way>')}
  return {text:out.concat('</osm>').join('\n')+'\n',holes:D.card.filter(h=>D.R[h.n]?.length>=2).length}};
 $b('ftgc').onclick=async()=>{const {text,holes}=xml(),what=`${holes} hole${holes==1?'':'s'}`+(F.length?`, ${count()}`:'');
  if(!holes&&!F.length){st.textContent='Nothing to save yet.';return}
  const tail='In TGC Designer Tools, pick it in Local OSM File (Load OSM tab).';
  // own Save as id so the browser remembers his HD Courses course folder apart from the OSM-upload folder
  if(window.showSaveFilePicker){let fh;
   try{fh=await showSaveFilePicker({id:'okw-tgc-export',suggestedName:`${slug} tgc.osm`,types:[{description:'OpenStreetMap file',accept:{'application/xml':['.osm']}}]})}
   catch(e){if(e.name=='AbortError'){st.textContent='Save cancelled; nothing was saved.';return}fh=null}
   if(fh){try{const w=await fh.createWritable();await w.write(text);await w.close();st.textContent=`Saved ${fh.name} (${what}). ${tail}`;return}catch{st.textContent="Couldn't save there; saving to your Downloads instead."}}}
  fileout(`${slug} tgc.osm`,text,'application/xml');st.textContent=`Saved ${slug} tgc.osm (${what}) to your Downloads. ${tail}`};
 // once (owner, Nov 24 2026, "too many points"): shapes now keep only his clicked dots (s 3). Ones saved already
 // smoothed (s 1/2: two extra points after each click) go back to every third point, but only where that really
 // rebuilds the same outline (an edited shape may not follow the pattern; it is left as it is).
 {let n=0;const xy=p=>[p[1]*Math.cos(p[0]*Math.PI/180)*111320,p[0]*110540];
  for(const f of F){if(f.s==3)continue;
   if((f.s==1||f.s==2)&&!f.o&&!f.t){const ln=K[f.k].line,L_=f.g.length;
    if(ln?(L_+2)%3==0&&L_>=7:L_%3==0&&L_>=9){const c=f.g.filter((_,i)=>i%3==0),back=sharp(f.k)?smooth(c,ln):sm(f.k,c);
     const ok=back.length==L_&&back.every((p,i)=>Math.hypot(xy(p)[0]-xy(f.g[i])[0],xy(p)[1]-xy(f.g[i])[1])<0.3);
     if(ok||(sharp(f.k)&&f.s==1)){f.g=c;n++}}}
   f.s=3}
  save();if(n)setTimeout(()=>{st.textContent=`Thinned ${n} shape${n>1?'s':''} back to the dots you clicked; the smooth edge is drawn through them.`},50)}
 render();
 return {busy:()=>!!mode||extending()||joining,click,cancel};
}
