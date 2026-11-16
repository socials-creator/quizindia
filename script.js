(() => {
  'use strict';
  const SERVICE = 'https://livingatlas.esri.in/server/rest/services/IAB2024/IAB_State_2024/MapServer/0/query';
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
    if (!s.length) {toast('The map is still loading.');return;}
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
  async function loadMap() {
    const params=new URLSearchParams({where:'1=1',outFields:'*',returnGeometry:'true',outSR:'4326',f:'geojson'});
    const url=`${SERVICE}?${params.toString()}`;
    try {
      const response=await fetch(url,{mode:'cors',credentials:'omit'});
      if(!response.ok) throw new Error(`Map service returned ${response.status}`);
      const data=await response.json();
      if(!data.features?.length) throw new Error('No boundary features were returned.');
      const mapped=[];
      data.features.forEach(feature=>{
        const raw=feature.properties?.state || feature.properties?.STATE || feature.properties?.State || feature.properties?.stname || feature.properties?.STNAME;
        const name=canonical(raw);
        if(!ALL.some(x=>x.name===name)) {console.warn('Ignoring unrecognized boundary name',raw,feature.properties);return;}
        feature.properties.quizName=name; feature.properties.quizType=typeOf(name); mapped.push(feature); featureByName.set(name,feature);
      });
      const missing=ALL.map(x=>x.name).filter(n=>!featureByName.has(n));
      if(missing.length) throw new Error(`The boundary service did not return all 36 regions. Missing: ${missing.join(', ')}`);
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
