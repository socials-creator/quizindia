(() => {
  'use strict';
  const MAX_MISSES = 5;
  const HISTORY_KEY = 'indiaMapQuiz.history.v1';
  const BEST_KEY = 'indiaMapQuiz.best.v1';
  const MODE_KEY = 'indiaMapQuiz.mode.v1';
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
  let features = [], featureByName = new Map(), queue = [], current = null;
  let mode = 'country', districtKey = null, poolNames = ALL.map(x => x.name), loadToken = 0, gameId = 0;
  const mapCache = new Map();
  let found = new Set(), missed = new Set(), mistakes = 0, roundActive = false, mapSvg, mapGroup, zoom, projection, path;
  let toastTimer = null;

  function canonical(raw) {
    const clean = String(raw || '').trim().replace(/\s+/g,' ');
    if (ALIASES.has(clean)) return ALIASES.get(clean);
    return ALL.find(x => x.name.toLowerCase() === clean.toLowerCase())?.name || clean;
  }
  function listForMode() { return poolNames; }
  function typeOf(name) { return mode==='districts' ? 'District' : (STATES.includes(name) ? 'State' : 'Union Territory'); }
  function noun() { return mode==='districts' ? 'district' : 'region'; }
  function modeLabel() { return mode==='districts' ? `${districtKey||'State'} districts` : 'All regions'; }
  function bestKey() { return mode==='districts' && districtKey ? `indiaMapQuiz.best.districts.${DISTRICT_SETS[districtKey].slug}.v1` : BEST_KEY; }
  function toast(message) {
    $('toast').textContent = message; $('toast').classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(()=>$('toast').classList.remove('show'),1700);
  }
  function setStatus() {
    const el=$('offline-status');
    if (!navigator.onLine) {el.textContent='Offline';el.dataset.state='offline';}
    else {el.textContent='Online';el.dataset.state='online';}
  }
  function readJSON(key,fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } }
  function saveHistory(item) {
    const history=readJSON(HISTORY_KEY,[]); history.unshift(item); localStorage.setItem(HISTORY_KEY,JSON.stringify(history.slice(0,10))); renderHistory();
    const best=readJSON(bestKey(),null);
    if (!best || item.score>best.score || (item.score===best.score && item.misses<best.misses)) {localStorage.setItem(bestKey(),JSON.stringify(item));renderBest();}
  }
  function renderHistory() {
    const history=readJSON(HISTORY_KEY,[]); const ol=$('history'); ol.innerHTML='';
    if (!history.length) {ol.innerHTML='<li class="empty-history">No games yet</li>';return;}
    history.forEach(h=>{const li=document.createElement('li');if(h.misses===0&&h.score===h.total)li.className='perfect';li.textContent=`${h.score}/${h.total} · ${h.modeLabel} · ${h.date}`;ol.append(li);});
  }
  function renderBest() { const b=readJSON(bestKey(),null); $('best-score').textContent=b?`${b.score} / ${b.total}`:'—'; $('best-label').textContent=b?`${b.modeLabel} · ${b.date}`:'No completed rounds yet'; }
  function updateStats() {
    const total=listForMode().length, done=found.size+missed.size, left=Math.max(0,total-done);
    $('found').textContent=found.size; $('missed').textContent=`${mistakes} / ${MAX_MISSES}`; $('remaining').textContent=total?left:'—';
    $('progress-label').textContent=total?`${found.size} / ${total}`:'0 / —'; $('progress-fill').style.width=`${total?found.size/total*100:0}%`;
  }
  function addRecent(name,ok) {
    const ol=$('recent-answers'); if (ol.children.length===1 && ol.firstElementChild.textContent==='Answers will appear here.') ol.innerHTML='';
    const li=document.createElement('li'), mark=document.createElement('span'), label=document.createElement('span');
    mark.className='answer-mark'+(ok?'':' wrong'); mark.textContent=ok?'✓':'×'; label.textContent=name; li.append(mark,label); ol.prepend(li);
    while(ol.children.length>8)ol.lastElementChild.remove();
  }
  function showPrompt() {
    $('side-skip').textContent=`Skip this ${noun()} →`;
    if (!current) { $('prompt-name').textContent=roundActive?'Round complete':(mode==='districts'&&!districtKey?'Choose a state':'Press New game'); $('prompt-kind').textContent=mode==='districts'?'FIND THIS DISTRICT':'FIND THIS REGION'; $('prompt-hint').textContent=mode==='districts'?'Tap the matching district on the map.':'Tap the matching state or Union Territory on the map.'; $('side-prompt').textContent='Ready when you are'; $('side-description').textContent=mode==='districts'?(!districtKey?'Choose a state from the menu to practise its districts.':poolNames.length?`Find all ${poolNames.length} districts of ${districtKey} by tapping them on the map.`:`Find every district of ${districtKey} by tapping it on the map.`):'Find all 36 states and Union Territories by tapping them on the map.'; $('skip').disabled=true; $('side-skip').disabled=true; return; }
    $('prompt-name').textContent=current; $('prompt-kind').textContent=typeOf(current).toUpperCase(); $('prompt-hint').textContent=`Tap the matching ${noun()} on the map.`;
    $('side-prompt').textContent=current; $('side-description').textContent=mode==='districts'?`District of ${districtKey} · Find it on the map.`:`${typeOf(current)} · Find it on the map.`; $('skip').disabled=false; $('side-skip').disabled=false;
  }
  function startGame() {
    const pool=listForMode();
    if (mode==='districts' && !districtKey) {toast('Select a state first.');return;}
    if (!features.length) {toast('The map is still loading.');return;}
    const missing=pool.filter(n=>!featureByName.has(n));
    if (missing.length) {toast(`Map data missing: ${missing.join(', ')}`);console.warn('Unmatched map regions',missing);return;}
    gameId++; queue=d3.shuffle([...pool]); found=new Set(); missed=new Set(); mistakes=0; roundActive=true; current=null;
    $('recent-answers').innerHTML='<li>Answers will appear here.</li>';
    features.forEach(f=>{const n=f.properties.quizName;const el=mapGroup.selectAll('.region').filter(d=>d.properties.quizName===n);el.classed('found',false).classed('missed',false).classed('target-reveal',false);});
    $('map-message').textContent=`Round in progress · tap a ${noun()}`; updateStats(); nextQuestion(); resetMapView();
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
      const gid=gameId; setTimeout(()=>{if(gid!==gameId)return;findPath(reveal).classed('target-reveal',false);nextQuestion();},1000);
    }
  }
  function skipQuestion() {
    if (!roundActive || !current) return;
    const name=current; mistakes++; missed.add(name); findPath(name).classed('missed',true).classed('target-reveal',true); addRecent(`${name} · skipped`,false);
    $('map-message').textContent=`Skipped · ${name} highlighted on the map`; current=null; updateStats();
    if (mistakes>=MAX_MISSES) {finishGame(false);return;}
    const gid=gameId; setTimeout(()=>{if(gid!==gameId)return;findPath(name).classed('target-reveal',false);nextQuestion();},1300);
  }
  function finishGame(completed) {
    roundActive=false; current=null; showPrompt(); updateStats();
    const total=listForMode().length, score=found.size, label=modeLabel();
    const date=new Date().toLocaleDateString(undefined,{day:'numeric',month:'short'});
    saveHistory({score,total,misses:mistakes,modeLabel:label,date,completed});
    $('result-icon').textContent=completed?'🎉':'🗺️'; $('result-title').textContent=completed?(mode==='districts'?`${districtKey} mapped!`:'India mapped!'):'Round over';
    $('result-copy').textContent=completed?`You found every ${noun()} in this round. Excellent map knowledge.`:`You found ${score} of ${total} ${noun()}s. Review the highlighted misses and try another round.`;
    $('result-score').textContent=`${score} / ${total}`; $('result-unit').textContent=`${noun()}s found`; $('result-overlay').classList.add('open'); $('result-overlay').setAttribute('aria-hidden','false');
    $('map-message').textContent=completed?'All regions found!':'Round ended · start a new game to try again';
  }
  function resetMapView() { if(mapSvg&&zoom) mapSvg.transition().duration(450).call(zoom.transform,d3.zoomIdentity); }
  function drawMap(collection) {
    const host=$('map'); host.innerHTML=''; host.classList.toggle('districts',mode==='districts');
    mapSvg=d3.select(host).append('svg').attr('role','img').attr('aria-label',mode==='districts'?`Map of ${districtKey} showing its districts`:'Map of India showing 28 states and 8 Union Territories').attr('viewBox','0 0 1000 760').attr('preserveAspectRatio','xMidYMid meet');
    mapGroup=mapSvg.append('g').attr('class','map-world');
    projection=d3.geoMercator().center([82.5,22.5]).scale(1050).translate([500,390]);
    path=d3.geoPath(projection);
    const fc={type:'FeatureCollection',features:collection.features};
    // Fit the full administrative extent, including the island territories, without clipping.
    projection.fitExtent([[65,65],[935,690]],fc);
    mapGroup.selectAll('path').data(collection.features).join('path')
      .attr('class','region').attr('d',path)
      .attr('tabindex',0).attr('role','button').attr('aria-label','Map region')
      .on('click',(event,d)=>{event.stopPropagation();handleRegionTap(d.properties.quizName);})
      .on('keydown',(event,d)=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();handleRegionTap(d.properties.quizName);}});
    // Invisible, wider tap area for tiny regions (Lakshadweep's islands; small districts such as Hyderabad). No visual change.
    collection.features.forEach(d=>{
      const [[x0,y0],[x1,y1]]=path.bounds(d), small=Math.min(x1-x0,y1-y0)<26;
      if (d.properties.quizName!=='Lakshadweep' && !(mode==='districts' && small)) return;
      mapGroup.append('path').attr('class','hit-area'+(mode==='districts'?' hit-small':'')).attr('d',path(d))
        .on('click',(event)=>{event.stopPropagation();handleRegionTap(d.properties.quizName);});
    });
    zoom=d3.zoom().scaleExtent([1,40]).filter(event=>event.type==='wheel'||event.type==='mousedown'||event.type==='touchstart'||event.type==='dblclick').on('zoom',event=>mapGroup.attr('transform',event.transform));
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
  function mergeFeatures(items, quizType) { // items: [{name, geometry}] -> one MultiPolygon feature per region
    const groups=new Map();
    items.forEach(({name,geometry})=>{ if(!groups.has(name)) groups.set(name,[]); groups.get(name).push(...polysOf(geometry)); });
    const out=new Map();
    groups.forEach((polys,name)=>{
      if(!polys.length) return;
      const coords=polys.map(p=>p.map((ring,i)=>fixRing(ring,i===0)));
      out.set(name,{type:'Feature',properties:{quizName:name,quizType:quizType||(STATES.includes(name)?'State':'Union Territory')},geometry:{type:'MultiPolygon',coordinates:coords}});
    });
    return out;
  }

  // ---- District mode: one entry per state/UT that has a district quiz. Add more states here later. ----
  const DISTRICT_SETS = {
    'Telangana': {
      slug:'telangana', expected:33,
      districts:['Adilabad','Bhadradri Kothagudem','Hanumakonda','Hyderabad','Jagtial','Jangaon','Jayashankar Bhupalpally','Jogulamba Gadwal','Kamareddy','Karimnagar','Khammam','Komaram Bheem Asifabad','Mahabubabad','Mahabubnagar','Mancherial','Medak','Medchal-Malkajgiri','Mulugu','Nagarkurnool','Nalgonda','Narayanpet','Nirmal','Nizamabad','Peddapalli','Rajanna Sircilla','Rangareddy','Sangareddy','Siddipet','Suryapet','Vikarabad','Wanaparthy','Warangal','Yadadri Bhuvanagiri'],
      // Spelling variants / older names found in public boundary files -> current official name.
      aliases:{
        'Hanumakonda':['Hanamkonda','Warangal Urban','Warangal (Urban)'],
        'Warangal':['Warangal Rural','Warangal (Rural)'],
        'Rangareddy':['Ranga Reddy','Rangareddi','K.V. Rangareddy','K V Rangareddy'],
        'Jangaon':['Jangoan'],
        'Mahabubnagar':['Mahbubnagar','Mahaboobnagar'],
        'Mahabubabad':['Mahbubabad'],
        'Komaram Bheem Asifabad':['Kumuram Bheem Asifabad','Komram Bheem Asifabad','Kumurambheem Asifabad','Asifabad'],
        'Jayashankar Bhupalpally':['Jayashankar Bhupalapally','Jayashankar','Bhupalpally'],
        'Jogulamba Gadwal':['Jogulamba','Gadwal'],
        'Bhadradri Kothagudem':['Bhadradri','Kothagudem'],
        'Yadadri Bhuvanagiri':['Yadadri Bhongir','Yadadri','Bhuvanagiri','Bhongir'],
        'Rajanna Sircilla':['Rajanna','Sircilla'],
        'Medchal-Malkajgiri':['Medchal Malkajgiri','Medchal','Malkajgiri'],
        'Narayanpet':['Narayanapet'],
        'Nagarkurnool':['Nagar Kurnool']
      }
    },
    'Andhra Pradesh': {
      slug:'andhra-pradesh', expected:28,
      districts:['Alluri Sitharama Raju','Anakapalli','Anantapur','Annamayya','Bapatla','Chittoor','Dr. B.R. Ambedkar Konaseema','East Godavari','Eluru','Guntur','Kakinada','Krishna','Kurnool','Markapuram','Nandyal','NTR','Palnadu','Parvathipuram Manyam','Polavaram','Prakasam','Sri Potti Sriramulu Nellore','Sri Sathya Sai','Srikakulam','Tirupati','Visakhapatnam','Vizianagaram','West Godavari','YSR Kadapa'],
      aliases:{
        'Alluri Sitharama Raju':['Alluri Sitarama Raju','Alluri Seetharama Raju','ASR'],
        'Anakapalli':['Anakapalle','Anakapalli'],
        'Anantapur':['Ananthapuramu','Anantapuramu','Ananthapur'],
        'Dr. B.R. Ambedkar Konaseema':['Konaseema','Ambedkar Konaseema','B.R. Ambedkar Konaseema','Dr B R Ambedkar Konaseema'],
        'Sri Potti Sriramulu Nellore':['Nellore','SPSR Nellore','S.P.S.R. Nellore','Sri Potti Sri Ramulu Nellore'],
        'Sri Sathya Sai':['Sathya Sai','Puttaparthi'],
        'YSR Kadapa':['Kadapa','Cuddapah','YSR','Y.S.R.','Y.S.R. Kadapa','YSR District'],
        'NTR':['NTR Vijayawada','Vijayawada'],
        'Tirupati':['Sri Balaji','Sri Balaji Tirupati'],
        'Parvathipuram Manyam':['Parvathipuram','Manyam'],
        'Visakhapatnam':['Vishakhapatnam','Visakhapatnam'],
        'Palnadu':['Palnad'],
        'Kurnool':['Kurnul']
      }
    }
  };
  const compact = v => norm(v).replace(/ /g,'');
  const districtLookupCache = new Map();
  function districtLookup(key) {
    if (districtLookupCache.has(key)) return districtLookupCache.get(key);
    const cfg=DISTRICT_SETS[key], map=new Map();
    cfg.districts.forEach(n=>map.set(compact(n),n));
    Object.entries(cfg.aliases||{}).forEach(([official,list])=>list.forEach(a=>map.set(compact(a),official)));
    districtLookupCache.set(key,map); return map;
  }
  function cleanLabel(raw) {
    const t=String(raw).trim().replace(/\s+/g,' ');
    return (t===t.toUpperCase()||t===t.toLowerCase()) ? t.toLowerCase().replace(/(^|[\s(-])([a-z])/g,(m,a,b)=>a+b.toUpperCase()) : t;
  }
  function pickDistrictName(props, key) {
    if (!props) return null;
    const stateKey=norm(key), known=districtLookup(key);
    const ok=v=>typeof v==='string' && v.trim() && norm(v)!==stateKey && !/^[\d.\s]+$/.test(v);
    const pref=['district','DISTRICT','District','dtname','DTNAME','dt_name','DT_NAME','dist_name','DIST_NAME','district_name','DISTRICT_NAME','NAME_2','name_2','dname','DNAME','name','NAME','Name'];
    let raw=null;
    for (const k of pref) if (ok(props[k])) {raw=props[k];break;}
    if (!raw) for (const v of Object.values(props)) if (ok(v) && known.has(compact(v))) {raw=v;break;}
    if (!raw) return null;
    return known.get(compact(raw)) || cleanLabel(raw);
  }
  async function fetchDistricts(key) {
    const cfg=DISTRICT_SETS[key];
    const build=feats=>{
      const items=feats.map(f=>({name:pickDistrictName(f.properties,key),geometry:f.geometry}));
      const unnamed=items.filter(x=>!x.name).length;
      if (unnamed) console.warn(`${unnamed} ${key} feature(s) had no readable district name`);
      const merged=mergeFeatures(items.filter(x=>x.name),'District');
      return merged.size>=2 ? [...merged.values()] : null;
    };
    // 1) The state's own boundary file (GeoJSON, then TopoJSON)
    for (const [dir,ext] of [['geojson','geojson'],['topojson','json']]) {
      try {
        const r=build(toFeatures(await fetchJson(`${dir}/states/${cfg.slug}.${ext}`),['districts',cfg.slug]));
        if (r) return r;
      } catch(e) { console.warn('District file failed:',key,dir,e); }
    }
    // 2) District layer of the whole-country TopoJSON, filtered to this state
    try {
      const data=await fetchJson('topojson/india.json');
      if (data?.type==='Topology' && window.topojson) {
        const obj=data.objects.districts||Object.entries(data.objects).find(([k])=>k!=='states')?.[1];
        if (obj) {
          const feats=topojson.feature(data,obj).features.filter(f=>Object.values(f.properties||{}).some(v=>typeof v==='string'&&norm(v)===norm(key)));
          const r=build(feats); if (r) return r;
        }
      }
    } catch(e) { console.warn('Country district layer failed:',e); }
    throw new Error(`Could not load district boundaries for ${key}`);
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
  function toFeatures(data, preferred=['states']) {
    if (data?.type==='Topology') {
      if (!window.topojson) throw new Error('topojson-client failed to load');
      // Use the dissolved 'states' object (36 state/UT outlines), not the district-level object.
      const o=preferred.map(k=>data.objects[k]).find(Boolean)||Object.values(data.objects)[0];
      const f=topojson.feature(data,o);return f.type==='FeatureCollection'?f.features:[f];
    }
    if (data?.type==='FeatureCollection') return data.features;
    if (data?.type==='Feature') return [data];
    return [];
  }
  async function fetchBoundaries() {
    const collected=new Map();
    // 1) Whole-country file (GeoJSON, then TopoJSON)
    for (const file of ['topojson/india.json','geojson/india.geojson']) {
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
  function showMapLoading() {
    const label=mode==='districts'?`Loading ${districtKey}’s districts…`:'Loading India’s map…';
    $('map').classList.remove('ready','districts');
    $('map').innerHTML=`<div class="map-loading"><span class="loader"></span><strong>${label}</strong><small>Loading boundary data</small></div>`;
    $('map-message').textContent='Loading map…';
  }
  async function loadMap() {
    const token=++loadToken, m=mode, key=districtKey, cacheKey=m==='districts'?`districts:${key}`:'country';
    features=[]; featureByName=new Map(); poolNames=m==='districts'?[]:ALL.map(x=>x.name);
    if (m==='districts' && !key) {
      $('map').classList.remove('ready','districts');
      $('map').innerHTML='<div class="map-loading"><span class="map-empty-icon">🗺️</span><strong>Select a state</strong><small>Choose a state from the menu above to practise its districts.</small></div>';
      $('map-message').textContent='Choose a state to begin'; updateStats(); showPrompt(); return;
    }
    showMapLoading(); updateStats(); showPrompt();
    try {
      let mapped=mapCache.get(cacheKey);
      if (!mapped) { mapped=m==='districts'?await fetchDistricts(key):await fetchBoundaries(); mapCache.set(cacheKey,mapped); }
      if (token!==loadToken) return; // the player switched mode while this was loading
      featureByName=new Map(mapped.map(f=>[f.properties.quizName,f]));
      features=mapped;
      poolNames=m==='districts'?mapped.map(f=>f.properties.quizName).sort((a,b)=>a.localeCompare(b)):ALL.map(x=>x.name);
      drawMap({type:'FeatureCollection',features:mapped});
      $('map').classList.add('ready'); updateStats(); showPrompt();
      if (m==='districts') {
        const exp=DISTRICT_SETS[key].expected;
        if (exp && poolNames.length!==exp) { $('map-message').textContent=`Map ready · boundary data has ${poolNames.length} of ${exp} districts`; console.info(`${key}: boundary data has ${poolNames.length} districts, expected ${exp}`); }
      }
    } catch(error) {
      if (token!==loadToken) return;
      console.error(error);
      const what=m==='districts'?`${key}’s district map`:'India’s boundary map';
      $('map').innerHTML=`<div class="map-loading map-error"><strong>Could not load ${what}</strong><small>${error.message}</small><button class="primary-btn" id="retry-map">Try again</button><small>Check your connection or open the official Survey of India map reference from the menu.</small></div>`;
      $('retry-map')?.addEventListener('click',loadMap);
      $('map-message').textContent='Map unavailable';
    }
  }
  // ---- Mode switching (States & UTs  /  Districts) ----
  function renderStateSelect() {
    const sel=$('state-select'); sel.innerHTML='';
    const ph=document.createElement('option'); ph.value=''; ph.textContent='Select a state…'; ph.disabled=true; sel.append(ph);
    Object.keys(DISTRICT_SETS).sort((x,y)=>x.localeCompare(y)).forEach(k=>{const o=document.createElement('option'); o.value=k; o.textContent=k; sel.append(o);});
    sel.value=districtKey||'';
  }
  function applyModeUI() {
    document.querySelectorAll('.seg-btn').forEach(b=>{const on=b.dataset.mode===mode;b.classList.toggle('active',on);b.setAttribute('aria-selected',String(on));});
    $('region-picker').hidden=mode!=='districts'; renderStateSelect();
  }
  function setMode(newMode,newKey=null) {
    if (newMode!=='districts') newKey=null;
    if (newMode===mode && newKey===districtKey) return;
    const wasActive=roundActive;
    mode=newMode; districtKey=newKey;
    try { localStorage.setItem(MODE_KEY,JSON.stringify({mode})); } catch {}
    gameId++; roundActive=false; current=null; queue=[]; found=new Set(); missed=new Set(); mistakes=0;
    $('result-overlay').classList.remove('open'); $('result-overlay').setAttribute('aria-hidden','true');
    $('recent-answers').innerHTML='<li>Answers will appear here.</li>';
    applyModeUI(); renderBest(); loadMap();
    if (wasActive) toast('Round ended · mode changed');
  }
  function openDrawer(open) { $('info-drawer').classList.toggle('open',open); $('drawer-scrim').classList.toggle('open',open); $('info-drawer').setAttribute('aria-hidden',String(!open)); }
  function init() {
    const saved=readJSON(MODE_KEY,null);
    if (saved && (saved.mode==='country'||saved.mode==='districts')) mode=saved.mode;
    document.querySelectorAll('.seg-btn').forEach(b=>b.addEventListener('click',()=>{ if (b.dataset.mode!==mode) setMode(b.dataset.mode); }));
    $('state-select').addEventListener('change',e=>setMode('districts',e.target.value||null));
    applyModeUI();
    renderHistory();renderBest();setStatus();window.addEventListener('online',setStatus);window.addEventListener('offline',setStatus);
    $('new-game').addEventListener('click',startGame);$('skip').addEventListener('click',skipQuestion);$('side-skip').addEventListener('click',skipQuestion);
    $('zoom-in').addEventListener('click',()=>mapSvg?.transition().call(zoom.scaleBy,2));$('zoom-out').addEventListener('click',()=>mapSvg?.transition().call(zoom.scaleBy,1/2));$('zoom-reset').addEventListener('click',resetMapView);
    $('info-toggle').addEventListener('click',()=>openDrawer(true));$('drawer-close').addEventListener('click',()=>openDrawer(false));$('drawer-scrim').addEventListener('click',()=>openDrawer(false));
    $('play-again').addEventListener('click',()=>{$('result-overlay').classList.remove('open');$('result-overlay').setAttribute('aria-hidden','true');startGame();});$('close-result').addEventListener('click',()=>{$('result-overlay').classList.remove('open');$('result-overlay').setAttribute('aria-hidden','true');});
    loadMap();
  }
  init();
})();
