(() => {
  'use strict';
  const MAX_MISSES = 5;
  const HISTORY_KEY = 'indiaMapQuiz.history.v1';
  const BEST_KEY = 'indiaMapQuiz.best.v1';
  const STATES = [
    'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal'
  ];
  const UTS = [
    'Andaman and Nicobar Islands','Chandigarh','Dadra and Nagar Haveli and Daman and Diu','Delhi','Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry'
  ];
  const ALIASES = new Map([
    ['NCT of Delhi','Delhi'],['National Capital Territory of Delhi','Delhi'],['Delhi (NCT)','Delhi'],['Andaman & Nicobar Islands','Andaman and Nicobar Islands'],['Andaman and Nicobar','Andaman and Nicobar Islands'],['Jammu & Kashmir','Jammu and Kashmir'],['Jammu & Kashmir (UT)','Jammu and Kashmir'],['Dadra & Nagar Haveli and Daman & Diu','Dadra and Nagar Haveli and Daman and Diu'],['Dadra and Nagar Haveli & Daman and Diu','Dadra and Nagar Haveli and Daman and Diu'],['Dadra and Nagar Haveli','Dadra and Nagar Haveli and Daman and Diu'],['Daman and Diu','Dadra and Nagar Haveli and Daman and Diu'],['Orissa','Odisha'],['Uttaranchal','Uttarakhand']
  ]);
  const ALL = [...STATES.map(name => ({name,type:'State'})), ...UTS.map(name => ({name,type:'Union Territory'}))];
  const $ = id => document.getElementById(id);
  let features = [], featureByName = new Map(), currentMode = 'all', queue = [], current = null;
  let found = new Set(), missed = new Set(), mistakes = 0, roundActive = false, mapSvg, mapGroup, zoom, projection, path;
  let toastTimer = null;

  function canonical(raw) {
    const clean = String(raw || '').trim().replace(/\s+/g,' ');
    if (ALIASES.has(clean)) return ALIASES.get(clean);
    return ALL.find(x => x.name.toLowerCase() === clean.toLowerCase())?.name || clean;
  }
  function listForMode(mode=currentMode) { return mode === 'state' ? STATES : mode === 'ut' ? UTS : ALL.map(x=>x.name); }
  function typeOf(name) { return STATES.includes(name) ? 'State' : 'Union Territory'; }
  function toast(message) {
    $('toast').textContent = message; $('toast').classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(()=>$('toast').classList.remove('show'),1700);
  }
  function setStatus() {
    const el=$('offline-status');
    if (!navigator.onLine) {el.textContent='● Offline';el.dataset.state='offline';}
    else {el.textContent='● Online';el.dataset.state='online';}
  }
  function readJSON(key,fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } }
  function saveHistory(item) {
    const history=readJSON(HISTORY_KEY,[]); history.unshift(item); localStorage.setItem(HISTORY_KEY,JSON.stringify(history.slice(0,10))); renderHistory();
    const best=readJSON(BEST_KEY,null);
    if (!best || item.score>best.score || (item.score===best.score && item.misses<best.misses)) {localStorage.setItem(BEST_KEY,JSON.stringify(item));renderBest();}
  }
  function renderHistory() {
    const history=readJSON(HISTORY_KEY,[]); const ol=$('history'); ol.innerHTML='';
    if (!history.length) {ol.innerHTML='<li class="empty-history">No games yet</li>';return;}
    history.forEach(h=>{const li=document.createElement('li');if(h.misses===0&&h.score===h.total)li.className='perfect';li.textContent=`${h.score}/${h.total} · ${h.modeLabel} · ${h.date}`;ol.append(li);});
  }
  function renderBest() { const b=readJSON(BEST_KEY,null); $('best-score').textContent=b?`${b.score} / ${b.total}`:'—'; $('best-label').textContent=b?`${b.modeLabel} · ${b.date}`:'No completed rounds yet'; }
  function updateStats() {
    const total=listForMode().length, done=found.size+missed.size, left=Math.max(0,total-done);
    $('found').textContent=found.size; $('missed').textContent=`${mistakes} / ${MAX_MISSES}`; $('remaining').textContent=left;
    $('progress-label').textContent=`${found.size} / ${total}`; $('progress-fill').style.width=`${total?found.size/total*100:0}%`;
  }
  function addRecent(name,ok) {
    const ol=$('recent-answers'); if (ol.children.length===1 && ol.firstElementChild.textContent==='Answers will appear here.') ol.innerHTML='';
    const li=document.createElement('li'), mark=document.createElement('span'), label=document.createElement('span');
    mark.className='answer-mark'+(ok?'':' wrong'); mark.textContent=ok?'✓':'×'; label.textContent=name; li.append(mark,label); ol.prepend(li);
    while(ol.children.length>8)ol.lastElementChild.remove();
  }
  function showPrompt() {
    if (!current) { $('prompt-name').textContent=roundActive?'Round complete':'Press New game'; $('prompt-kind').textContent='FIND THIS REGION'; $('prompt-hint').textContent='Tap the matching state or Union Territory on the map.'; $('side-prompt').textContent='Ready when you are'; $('side-description').textContent='Find all regions in the selected group by tapping their shapes on the map.'; $('skip').disabled=true; $('side-skip').disabled=true; return; }
    $('prompt-name').textContent=current; $('prompt-kind').textContent=typeOf(current).toUpperCase(); $('prompt-hint').textContent='Tap the matching region on the map.';
    $('side-prompt').textContent=current; $('side-description').textContent=`${typeOf(current)} · Find it on the map.`; $('skip').disabled=false; $('side-skip').disabled=false;
  }
  function startGame() {
    const pool=listForMode();
    if (!features.length) {toast('The map is still loading.');return;}
    const missing=pool.filter(n=>!featureByName.has(n));
    if (missing.length) {toast(`Map data missing: ${missing.join(', ')}`);console.warn('Unmatched map regions',missing);return;}
    queue=d3.shuffle([...pool]); found=new Set(); missed=new Set(); mistakes=0; roundActive=true; current=null;
    $('recent-answers').innerHTML='<li>Answers will appear here.</li>';
    features.forEach(f=>{const n=f.properties.quizName;const el=mapGroup.selectAll('.region').filter(d=>d.properties.quizName===n);el.classed('found',false).classed('missed',false).classed('target-reveal',false);});
    $('map-message').textContent='Round in progress · tap a region'; updateStats(); nextQuestion(); resetMapView();
  }
  function nextQuestion() {
    if (!roundActive) return;
    if (queue.length===0) {finishGame(found.size===listForMode().length);return;}
    current=queue.shift(); showPrompt(); updateStats();
  }
  function findPath(name) { return mapGroup.selectAll('.region').filter(d=>d.properties.quizName===name); }
  function handleRegionTap(name) {
    if (!roundActive || !current) return;
    if (found.has(name)||missed.has(name)) {toast(`${name} has already been answered.`);return;}
    if (name===current) {
      found.add(name); findPath(name).classed('found',true).classed('target-reveal',false); addRecent(name,true); $('map-message').textContent=`✓ ${name} found`; current=null; updateStats();
      if (queue.length===0) finishGame(found.size===listForMode().length); else nextQuestion();
    } else {
      mistakes++; missed.add(current); findPath(current).classed('missed',true); findPath(name).classed('target-reveal',true); addRecent(`${name} · target: ${current}`,false);
      $('map-message').textContent=`Not quite — the target was ${current}`; toast(`That’s ${name}. Find ${current}.`);
      const reveal=current; current=null; updateStats();
      if (mistakes>=MAX_MISSES) {finishGame(false);return;}
      setTimeout(()=>{findPath(reveal).classed('target-reveal',false);nextQuestion();},1000);
    }
  }
  function skipQuestion() {
    if (!roundActive || !current) return;
    const name=current; mistakes++; missed.add(name); findPath(name).classed('missed',true).classed('target-reveal',true); addRecent(`${name} · skipped`,false);
    $('map-message').textContent=`Skipped · ${name} highlighted on the map`; current=null; updateStats();
    if (mistakes>=MAX_MISSES) {finishGame(false);return;}
    setTimeout(()=>{findPath(name).classed('target-reveal',false);nextQuestion();},1300);
  }
  function finishGame(completed) {
    roundActive=false; current=null; showPrompt(); updateStats();
    const total=listForMode().length, score=found.size, modeLabel=currentMode==='all'?'All regions':currentMode==='state'?'States':'UTs';
    const date=new Date().toLocaleDateString(undefined,{day:'numeric',month:'short'});
    saveHistory({score,total,misses:mistakes,modeLabel,date,completed});
    $('result-icon').textContent=completed?'🎉':'🗺️'; $('result-title').textContent=completed?'India mapped!':'Round over';
    $('result-copy').textContent=completed?'You found every region in this round. Excellent map knowledge.':`You found ${score} of ${total} regions. Review the highlighted misses and try another round.`;
    $('result-score').textContent=`${score} / ${total}`; $('result-overlay').classList.add('open'); $('result-overlay').setAttribute('aria-hidden','false');
    $('map-message').textContent=completed?'All regions found!':'Round ended · start a new game to try again';
  }
  function resetMapView() { if(mapSvg&&zoom) mapSvg.transition().duration(450).call(zoom.transform,d3.zoomIdentity); }
  function drawMap(collection) {
    const host=$('map'); host.innerHTML='';
    mapSvg=d3.select(host).append('svg').attr('role','img').attr('aria-label','Map of India showing 28 states and 8 Union Territories').attr('viewBox','0 0 1000 760').attr('preserveAspectRatio','xMidYMid meet');
    mapGroup=mapSvg.append('g').attr('class','map-world');
    projection=d3.geoMercator().center([82.5,22.5]).scale(1050).translate([500,390]);
    path=d3.geoPath(projection);
    const fc={type:'FeatureCollection',features:collection.features};
    // Fit the full administrative extent, including the island territories, without clipping.
    projection.fitExtent([[65,65],[935,690]],fc);
    mapGroup.selectAll('path').data(collection.features).join('path')
      .attr('class','region').attr('d',path).attr('data-name',d=>d.properties.quizName)
      .attr('tabindex',0).attr('role','button').attr('aria-label',d=>d.properties.quizName)
      .on('click',(event,d)=>{event.stopPropagation();handleRegionTap(d.properties.quizName);})
      .on('keydown',(event,d)=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();handleRegionTap(d.properties.quizName);}})
      .append('title').text(d=>d.properties.quizName);
    zoom=d3.zoom().scaleExtent([1,9]).filter(event=>event.type==='wheel'||event.type==='mousedown'||event.type==='touchstart'||event.type==='dblclick').on('zoom',event=>mapGroup.attr('transform',event.transform));
    mapSvg.call(zoom).on('dblclick.zoom',null);
    $('map-message').textContent='Map ready · choose New game';
  }
  // ---- Boundary data: https://github.com/udit-001/india-maps-data (GeoJSON / TopoJSON) ----
  const REPO_BASES = [
    'https://cdn.jsdelivr.net/gh/udit-001/india-maps-data@2884453',
    'https://cdn.jsdelivr.net/gh/udit-001/india-maps-data@main',
    'https://raw.githubusercontent.com/udit-001/india-maps-data/main'
  ];
  const SLUGS = {
    'Andhra Pradesh':'andhra-pradesh','Arunachal Pradesh':'arunachal-pradesh','Assam':'assam','Bihar':'bihar','Chhattisgarh':'chhattisgarh','Goa':'goa','Gujarat':'gujarat','Haryana':'haryana','Himachal Pradesh':'himachal-pradesh','Jharkhand':'jharkhand','Karnataka':'karnataka','Kerala':'kerala','Madhya Pradesh':'madhya-pradesh','Maharashtra':'maharashtra','Manipur':'manipur','Meghalaya':'meghalaya','Mizoram':'mizoram','Nagaland':'nagaland','Odisha':'odisha','Punjab':'punjab','Rajasthan':'rajasthan','Sikkim':'sikkim','Tamil Nadu':'tamil-nadu','Telangana':'telangana','Tripura':'tripura','Uttar Pradesh':'uttar-pradesh','Uttarakhand':'uttarakhand','West Bengal':'west-bengal',
    'Andaman and Nicobar Islands':'andaman-and-nicobar-islands','Chandigarh':'chandigarh','Dadra and Nagar Haveli and Daman and Diu':'dnh-and-dd','Delhi':'delhi','Jammu and Kashmir':'jammu-and-kashmir','Ladakh':'ladakh','Lakshadweep':'lakshadweep','Puducherry':'puducherry'
  };
  const norm = v => String(v||'').toLowerCase().replace(/&/g,' and ').replace(/[^a-z0-9]+/g,' ').trim();
  const NORM_NAMES = new Map(ALL.map(x=>[norm(x.name),x.name]));
  [['nct of delhi','Delhi'],['national capital territory of delhi','Delhi'],['andaman and nicobar','Andaman and Nicobar Islands'],['andaman nicobar islands','Andaman and Nicobar Islands'],['dnh and dd','Dadra and Nagar Haveli and Daman and Diu'],['dadra and nagar haveli','Dadra and Nagar Haveli and Daman and Diu'],['daman and diu','Dadra and Nagar Haveli and Daman and Diu'],['dadra nagar haveli and daman diu','Dadra and Nagar Haveli and Daman and Diu'],['orissa','Odisha'],['uttaranchal','Uttarakhand'],['pondicherry','Puducherry'],['jammu kashmir','Jammu and Kashmir']].forEach(([k,v])=>NORM_NAMES.set(k,v));
  function pickName(props) {
    if (!props) return null;
    const pref=['st_nm','ST_NM','state','STATE','State','name','NAME','Name','NAME_1','stname','STNAME','state_name','STATE_NAME'];
    for (const k of pref) if (typeof props[k]==='string' && NORM_NAMES.has(norm(props[k]))) return NORM_NAMES.get(norm(props[k]));
    for (const v of Object.values(props)) if (typeof v==='string' && NORM_NAMES.has(norm(v))) return NORM_NAMES.get(norm(v));
    return null;
  }
  // d3 needs exterior rings clockwise and holes counter-clockwise (lon/lat, north up).
  function ringArea(r){let a=0;for(let i=0,n=r.length-1;i<n;i++)a+=r[i][0]*r[i+1][1]-r[i+1][0]*r[i][1];return a/2;}
  function fixRing(r,exterior){const a=ringArea(r);return (exterior?a>0:a<0)?r.slice().reverse():r;}
  function polysOf(geom) {
    if (!geom) return [];
    if (geom.type==='Polygon') return [geom.coordinates];
    if (geom.type==='MultiPolygon') return geom.coordinates;
    if (geom.type==='GeometryCollection') return geom.geometries.flatMap(polysOf);
    return [];
  }
  function mergeFeatures(items) { // items: [{name, geometry}] -> one MultiPolygon feature per region
    const groups=new Map();
    items.forEach(({name,geometry})=>{ if(!groups.has(name)) groups.set(name,[]); groups.get(name).push(...polysOf(geometry)); });
    const out=new Map();
    groups.forEach((polys,name)=>{
      if(!polys.length) return;
      const coords=polys.map(p=>p.map((ring,i)=>fixRing(ring,i===0)));
      out.set(name,{type:'Feature',properties:{quizName:name,quizType:typeOf(name)},geometry:{type:'MultiPolygon',coordinates:coords}});
    });
    return out;
  }
  async function fetchJson(path) {
    let lastError;
    for (const base of REPO_BASES) {
      try {
        const res=await fetch(`${base}/${path}`,{mode:'cors',credentials:'omit'});
        if(!res.ok) throw new Error(`${path} returned ${res.status}`);
        return await res.json();
      } catch(e) { console.warn('Map data source failed:',base,path,e); lastError=e; }
    }
    throw lastError;
  }
  function toFeatures(data) {
    if (data?.type==='Topology') {
      if (!window.topojson) throw new Error('topojson-client failed to load');
      return Object.values(data.objects).flatMap(o=>{const f=topojson.feature(data,o);return f.type==='FeatureCollection'?f.features:[f];});
    }
    if (data?.type==='FeatureCollection') return data.features;
    if (data?.type==='Feature') return [data];
    return [];
  }
  async function fetchBoundaries() {
    const collected=new Map();
    // 1) Whole-country file (GeoJSON, then TopoJSON)
    for (const file of ['geojson/india.geojson','topojson/india.json']) {
      try {
        const feats=toFeatures(await fetchJson(file));
        const items=feats.map(f=>({name:pickName(f.properties),geometry:f.geometry})).filter(x=>x.name);
        mergeFeatures(items).forEach((f,n)=>collected.set(n,f));
        if (collected.size>=ALL.length) break;
      } catch(e) { console.warn('Country file failed:',file,e); }
    }
    // 2) Fill any region still missing from its own state/UT file
    const missing=ALL.map(x=>x.name).filter(n=>!collected.has(n));
    await Promise.all(missing.map(async name=>{
      for (const [dir,ext] of [['geojson','geojson'],['topojson','json']]) {
        try {
          const feats=toFeatures(await fetchJson(`${dir}/states/${SLUGS[name]}.${ext}`));
          const m=mergeFeatures(feats.map(f=>({name,geometry:f.geometry})));
          if (m.has(name)) { collected.set(name,m.get(name)); return; }
        } catch(e) { console.warn('State file failed:',name,e); }
      }
    }));
    const still=ALL.map(x=>x.name).filter(n=>!collected.has(n));
    if (still.length) throw new Error(`Could not load map data for: ${still.join(', ')}`);
    return [...collected.values()];
  }
  async function loadMap() {
    try {
      const mapped=await fetchBoundaries();
      featureByName=new Map(mapped.map(f=>[f.properties.quizName,f]));
      features=mapped; drawMap({type:'FeatureCollection',features:mapped});
      $('map').classList.add('ready');
    } catch(error) {
      console.error(error);
      $('map').innerHTML=`<div class="map-loading map-error"><strong>Could not load India’s boundary map</strong><small>${error.message}</small><button class="primary-btn" id="retry-map">Try again</button><small>Check your connection or open the official Survey of India map reference from the menu.</small></div>`;
      $('retry-map')?.addEventListener('click',loadMap);
      $('map-message').textContent='Map unavailable';
    }
  }
  function setMode(mode) {
    if (roundActive) {toast('Finish the current round before changing the quiz area.');return;}
    currentMode=mode;
    document.querySelectorAll('.mode-tab').forEach(b=>{const active=b.dataset.mode===mode;b.classList.toggle('active',active);b.setAttribute('aria-selected',String(active));});
    updateStats(); $('remaining').textContent=listForMode().length; $('progress-label').textContent=`0 / ${listForMode().length}`; $('progress-fill').style.width='0%';
    $('map-message').textContent=`${listForMode().length} ${mode==='all'?'regions':mode==='state'?'States':'Union Territories'} ready`;
  }
  function openDrawer(open) { $('info-drawer').classList.toggle('open',open); $('drawer-scrim').classList.toggle('open',open); $('info-drawer').setAttribute('aria-hidden',String(!open)); }
  function init() {
    renderHistory();renderBest();setStatus();window.addEventListener('online',setStatus);window.addEventListener('offline',setStatus);
    document.querySelectorAll('.mode-tab').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
    $('new-game').addEventListener('click',startGame);$('skip').addEventListener('click',skipQuestion);$('side-skip').addEventListener('click',skipQuestion);
    $('zoom-in').addEventListener('click',()=>mapSvg?.transition().call(zoom.scaleBy,1.5));$('zoom-out').addEventListener('click',()=>mapSvg?.transition().call(zoom.scaleBy,1/1.5));$('zoom-reset').addEventListener('click',resetMapView);
    $('info-toggle').addEventListener('click',()=>openDrawer(true));$('drawer-close').addEventListener('click',()=>openDrawer(false));$('drawer-scrim').addEventListener('click',()=>openDrawer(false));
    $('play-again').addEventListener('click',()=>{$('result-overlay').classList.remove('open');$('result-overlay').setAttribute('aria-hidden','true');startGame();});$('close-result').addEventListener('click',()=>{$('result-overlay').classList.remove('open');$('result-overlay').setAttribute('aria-hidden','true');});
    loadMap();
  }
  init();
})();
