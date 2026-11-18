(() => {
  'use strict';
  const MAX_MISSES = 5;
  const HISTORY_KEY = 'indiaMapQuiz.history.v1';
  const BEST_KEY = 'indiaMapQuiz.best.v1';
  const MODE_KEY = 'indiaMapQuiz.mode.v1';
  // ---- Airports mode: international airports of India. Tap radius is geographic (km), so it scales with zoom. ----
  const AIRPORT_RADIUS_KM = 60;
  // Smaller tap radius for airports that share a metro area, so their zones overlap less.
  const AIRPORT_RADIUS_OVERRIDES = {'Delhi (Indira Gandhi)':35,'Noida (Jewar)':35,'Mumbai (Chhatrapati Shivaji Maharaj)':30,'Navi Mumbai':30,'Goa (Dabolim)':30,'Goa (Mopa)':30,'Kushinagar':30,'Gorakhpur':30,'Hubballi':35,'Belagavi':35,'Nashik':40,'Shirdi (Sai Baba)':40,'Jamnagar':40,'Agra':45,'Gwalior':45,'Dimapur':50};
  const radiusFor = n => AIRPORT_RADIUS_OVERRIDES[n] || AIRPORT_RADIUS_KM;
  const EARTH_KM = 6371;
  const AIRPORTS = [
    ['Delhi (Indira Gandhi)',28.5562,77.1000],['Mumbai (Chhatrapati Shivaji Maharaj)',19.0896,72.8656],['Chennai',12.9941,80.1709],['Kolkata (Netaji Subhas Chandra Bose)',22.6547,88.4467],
    ['Bengaluru (Kempegowda)',13.1986,77.7066],['Hyderabad (Rajiv Gandhi)',17.2403,78.4294],['Ahmedabad (Sardar Vallabhbhai Patel)',23.0772,72.6347],['Kochi (Cochin)',10.1520,76.4019],
    ['Thiruvananthapuram',8.4821,76.9201],['Kozhikode (Calicut)',11.1368,75.9553],['Kannur',11.9186,75.5472],['Goa (Dabolim)',15.3808,73.8314],['Goa (Mopa)',15.7428,73.8617],
    ['Pune',18.5821,73.9197],['Jaipur',26.8242,75.8122],['Lucknow (Chaudhary Charan Singh)',26.7606,80.8893],['Varanasi (Lal Bahadur Shastri)',25.4524,82.8593],['Ayodhya (Maharishi Valmiki)',26.7433,82.1465],
    ['Kushinagar',26.7761,83.8884],['Gaya',24.7443,84.9512],['Amritsar (Sri Guru Ram Dass Jee)',31.7096,74.7973],['Chandigarh',30.6735,76.7885],['Srinagar (Sheikh ul-Alam)',33.9871,74.7742],
    ['Guwahati (Lokpriya Gopinath Bordoloi)',26.1061,91.5859],['Bagdogra',26.6812,88.3286],['Imphal (Bir Tikendrajit)',24.7600,93.8967],['Agartala (Maharaja Bir Bikram)',23.8870,91.2404],
    ['Port Blair (Veer Savarkar)',11.6412,92.7297],['Tiruchirappalli',10.7654,78.7097],['Coimbatore',11.0300,77.0434],['Madurai',9.8345,78.0934],['Mangaluru',12.9613,74.8901],
    ['Nagpur (Dr. Babasaheb Ambedkar)',21.0922,79.0472],['Indore (Devi Ahilya Bai Holkar)',22.7218,75.8011],['Surat',21.1141,72.7418],['Rajkot (Hirasar)',22.3881,71.0283],
    ['Visakhapatnam (Alluri Sitarama Raju, Bhogapuram)',17.9715,83.5036],['Vijayawada',16.5304,80.7968],
    ['Navi Mumbai',18.9846,73.0653],['Noida (Jewar)',28.1799,77.6118],['Tirupati',13.6325,79.5433],['Shirdi (Sai Baba)',19.6886,74.3789],['Bhubaneswar (Biju Patnaik)',20.2444,85.8178],
    ['Patna (Jay Prakash Narayan)',25.5913,85.0880],['Bhopal (Raja Bhoj)',23.2875,77.3374],['Aurangabad (Chhatrapati Sambhajinagar)',19.8627,75.3981],['Vadodara',22.3362,73.2263],
    // Major domestic airports
    ['Raipur (Swami Vivekananda)',21.1804,81.7388],['Ranchi (Birsa Munda)',23.3143,85.3217],['Dehradun (Jolly Grant)',30.1897,78.1803],['Jammu',32.6891,74.8374],
    ['Leh (Kushok Bakula Rimpochee)',34.1359,77.5465],['Dibrugarh',27.4839,95.0169],['Udaipur (Maharana Pratap)',24.6177,73.8961],['Jodhpur',26.2511,73.0489],
    ['Warangal (Mamnoor)',17.9167,79.6],
    ['Gorakhpur',26.7397,83.4497],
    ['Hubballi',15.3617,75.0849],
    ['Belagavi',15.8593,74.6183],
    ['Mysuru',12.23,76.6558],
    ['Rajahmundry',17.1104,81.8182],
    ['Jabalpur',23.1778,80.052],
    ['Kolhapur',16.6647,74.2894],
    ['Nashik',20.1191,73.9129],
    ['Jamnagar',22.4655,70.0126],
    ['Bhuj',23.2878,69.6702],
    ['Prayagraj',25.4401,81.7339],
    ['Agra',27.1558,77.9609],
    ['Gwalior',26.2933,78.2278],
    ['Jorhat',26.7315,94.1755],
    ['Silchar',24.9129,92.9788],
    ['Dimapur',25.8839,93.7711],
    ['Aizawl (Lengpui)',23.8406,92.6196],
    ['Jharsuguda',21.9135,84.0504],
    ['Thoothukudi',8.7241,78.0258]
  ];
  const DOMESTIC_AIRPORTS = new Set(['Warangal (Mamnoor)','Gorakhpur','Hubballi','Belagavi','Mysuru','Rajahmundry','Jabalpur','Kolhapur','Nashik','Jamnagar','Bhuj','Prayagraj','Agra','Gwalior','Jorhat','Silchar','Dimapur','Aizawl (Lengpui)','Jharsuguda','Thoothukudi','Raipur (Swami Vivekananda)','Ranchi (Birsa Munda)','Dehradun (Jolly Grant)','Jammu','Leh (Kushok Bakula Rimpochee)','Dibrugarh','Udaipur (Maharana Pratap)','Jodhpur']);
  const AIRPORT_NAMES = AIRPORTS.map(a=>a[0]);
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
  function typeOf(name) { return mode==='airports' ? (name==='Warangal (Mamnoor)'?'Domestic airport (under redevelopment)':DOMESTIC_AIRPORTS.has(name)?'Domestic airport':'International airport') : mode==='districts' ? 'District' : (STATES.includes(name) ? 'State' : 'Union Territory'); }
  function noun() { return mode==='airports' ? 'airport' : mode==='districts' ? 'district' : 'region'; }
  function modeLabel() { return mode==='airports' ? 'Airports' : mode==='districts' ? `${districtKey||'State'} districts` : 'All regions'; }
  function bestKey() { return mode==='airports' ? 'indiaMapQuiz.best.airports.v1' : mode==='districts' && districtKey ? `indiaMapQuiz.best.districts.${DISTRICT_SETS[districtKey].slug}.v1` : BEST_KEY; }
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
    if (!current) { $('prompt-name').textContent=roundActive?'Round complete':(mode==='districts'&&!districtKey?'Choose a state':'Press New game'); $('prompt-kind').textContent=mode==='airports'?'FIND THIS AIRPORT':mode==='districts'?'FIND THIS DISTRICT':'FIND THIS REGION'; $('prompt-hint').textContent=mode==='airports'?`Tap within about ${AIRPORT_RADIUS_KM} km of the airport.`:mode==='districts'?'Tap the matching district on the map.':'Tap the matching state or Union Territory on the map.'; $('side-prompt').textContent='Ready when you are'; $('side-description').textContent=mode==='airports'?`Point out all ${AIRPORTS.length} international and major domestic airports. Tapping within the airport’s radius (about ${AIRPORT_RADIUS_KM} km; less for same-city airports) counts.`:mode==='districts'?(!districtKey?'Choose a state from the menu to practise its districts.':poolNames.length?`Find all ${poolNames.length} districts of ${districtKey} by tapping them on the map.`:`Find every district of ${districtKey} by tapping it on the map.`):'Find all 36 states and Union Territories by tapping them on the map.'; $('skip').disabled=true; $('side-skip').disabled=true; return; }
    $('prompt-name').textContent=current; $('prompt-kind').textContent=typeOf(current).toUpperCase(); $('prompt-hint').textContent=mode==='airports'?`Tap within about ${radiusFor(current)} km of the airport.`:`Tap the matching ${noun()} on the map.`;
    $('side-prompt').textContent=current; $('side-description').textContent=mode==='airports'?`${typeOf(current)} · tap within ${radiusFor(current)} km of it.`:mode==='districts'?`District of ${districtKey} · Find it on the map.`:`${typeOf(current)} · Find it on the map.`; $('skip').disabled=false; $('side-skip').disabled=false;
  }
  function startGame() {
    const pool=listForMode();
    if (mode==='districts' && !districtKey) {toast('Select a state first.');return;}
    if (!features.length) {toast('The map is still loading.');return;}
    const missing=pool.filter(n=>!featureByName.has(n));
    if (missing.length) {toast(`Map data missing: ${missing.join(', ')}`);console.warn('Unmatched map regions',missing);return;}
    gameId++; queue=d3.shuffle([...pool]); found=new Set(); missed=new Set(); mistakes=0; roundActive=true; current=null;
    $('recent-answers').innerHTML='<li>Answers will appear here.</li>';
    mapGroup.selectAll('.region, .airport-node').classed('found',false).classed('missed',false).classed('target-reveal',false);
    $('map-message').textContent=`Round in progress · tap a ${noun()}`; updateStats(); nextQuestion(); resetMapView();
  }
  function nextQuestion() {
    if (!roundActive) return;
    if (queue.length===0) {finishGame(found.size===listForMode().length);return;}
    current=queue.shift(); showPrompt(); updateStats();
  }
  function findPath(name) { return mapGroup.selectAll(mode==='airports'?'.airport-node':'.region').filter(d=>d.properties.quizName===name); }
  function handleRegionTap(name) {
    if (!roundActive || !current) return;
    if (name && (found.has(name)||missed.has(name))) {toast(`${name} has already been answered.`);return;}
    if (name===current) {
      found.add(name); findPath(name).classed('found',true).classed('target-reveal',false); addRecent(name,true); $('map-message').textContent=`✓ ${name} found`; current=null; updateStats();
      if (queue.length===0) finishGame(found.size===listForMode().length); else nextQuestion();
    } else {
      mistakes++; missed.add(current); findPath(current).classed('missed',true); if(name) findPath(name).classed('target-reveal',true); addRecent(name?`${name} · target: ${current}`:`Not near an airport · target: ${current}`,false);
      $('map-message').textContent=`Not quite — the target was ${current}`; toast(name?`That’s ${name}. Find ${current}.`:`No airport there. Find ${current}.`);
      const reveal=current; current=null; updateStats();
      if (mistakes>=MAX_MISSES) {finishGame(false);return;}
      const gid=gameId; setTimeout(()=>{if(gid!==gameId)return;findPath(reveal).classed('target-reveal',false);if(name&&!found.has(name)&&!missed.has(name))findPath(name).classed('target-reveal',false);nextQuestion();},1000);
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
    $('result-icon').textContent=completed?'🎉':'🗺️'; $('result-title').textContent=completed?(mode==='airports'?'All airports found!':mode==='districts'?`${districtKey} mapped!`:'India mapped!'):'Round over';
    $('result-copy').textContent=completed?`You found every ${noun()} in this round. Excellent map knowledge.`:`You found ${score} of ${total} ${noun()}s. Review the highlighted misses and try another round.`;
    $('result-score').textContent=`${score} / ${total}`; $('result-unit').textContent=`${noun()}s found`; $('result-overlay').classList.add('open'); $('result-overlay').setAttribute('aria-hidden','false');
    $('map-message').textContent=completed?'All regions found!':'Round ended · start a new game to try again';
  }
  function resetMapView() { if(mapSvg&&zoom) mapSvg.transition().duration(450).call(zoom.transform,d3.zoomIdentity); }
  function geoCirclePath(lon,lat,km) { return path(d3.geoCircle().center([lon,lat]).radius((km||AIRPORT_RADIUS_KM)/EARTH_KM*180/Math.PI).precision(4)()); }
  function nearestAirport(lon,lat) {
    let best=null, bd=Infinity;
    airportFeatures.forEach(f=>{const d=d3.geoDistance([lon,lat],f.geometry.coordinates)*EARTH_KM; if(d<=radiusFor(f.properties.quizName)&&d<bd){bd=d;best=f.properties.quizName;}});
    return best;
  }
  let airportFeatures=[];
  function drawAirportMap(collection) {
    const host=$('map'); host.innerHTML=''; host.classList.remove('districts'); host.classList.add('airports');
    mapSvg=d3.select(host).append('svg').attr('role','img').attr('aria-label','Map of India for locating airports').attr('viewBox','0 0 1000 760').attr('preserveAspectRatio','xMidYMid meet');
    mapGroup=mapSvg.append('g').attr('class','map-world');
    projection=d3.geoMercator().center([82.5,22.5]).scale(1050).translate([500,390]);
    path=d3.geoPath(projection);
    projection.fitExtent([[65,65],[935,690]],{type:'FeatureCollection',features:collection.features});
    mapGroup.selectAll('path.base-region').data(collection.features).join('path').attr('class','base-region').attr('d',path);
    mapGroup.selectAll('g.airport-node').data(airportFeatures).join('g').attr('class','airport-node').each(function(d){
      const [lon,lat]=d.geometry.coordinates, [x,y]=projection([lon,lat]), g=d3.select(this);
      g.append('path').attr('class','airport-zone').attr('d',geoCirclePath(lon,lat,radiusFor(d.properties.quizName)));
      g.append('circle').attr('class','airport-dot').attr('cx',x).attr('cy',y).attr('r',2.2);
    });
    mapSvg.on('click',event=>{
      const [px,py]=d3.pointer(event,mapGroup.node()), inv=projection.invert([px,py]);
      if(!inv||!isFinite(inv[0])) return;
      handleRegionTap(nearestAirport(inv[0],inv[1]));
    });
    zoom=d3.zoom().scaleExtent([1,40]).filter(event=>event.type==='wheel'||event.type==='mousedown'||event.type==='touchstart'||event.type==='dblclick').on('zoom',event=>mapGroup.attr('transform',event.transform));
    mapSvg.call(zoom).on('dblclick.zoom',null);
    $('map-message').textContent='Map ready · choose New game';
  }
  function drawMap(collection) {
    if (mode==='airports') return drawAirportMap(collection);
    const host=$('map'); host.classList.remove('airports'); host.innerHTML=''; host.classList.toggle('districts',mode==='districts');
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
    const label=mode==='districts'?`Loading ${districtKey}’s districts…`:mode==='airports'?'Loading airports map…':'Loading India’s map…';
    $('map').classList.remove('ready','districts','airports');
    $('map').innerHTML=`<div class="map-loading"><span class="loader"></span><strong>${label}</strong><small>Loading boundary data</small></div>`;
    $('map-message').textContent='Loading map…';
  }
  async function loadMap() {
    const token=++loadToken, m=mode, key=districtKey, cacheKey=m==='districts'?`districts:${key}`:'country';
    airportFeatures=AIRPORTS.map(([n,lat,lon])=>({type:'Feature',properties:{quizName:n},geometry:{type:'Point',coordinates:[lon,lat]}}));
    features=[]; featureByName=new Map(); poolNames=m==='districts'?[]:m==='airports'?AIRPORT_NAMES.slice():ALL.map(x=>x.name);
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
      if (m==='airports') { featureByName=new Map(airportFeatures.map(f=>[f.properties.quizName,f])); features=airportFeatures; poolNames=AIRPORT_NAMES.slice(); }
      else {
      featureByName=new Map(mapped.map(f=>[f.properties.quizName,f]));
      features=mapped;
      poolNames=m==='districts'?mapped.map(f=>f.properties.quizName).sort((a,b)=>a.localeCompare(b)):ALL.map(x=>x.name);
      }
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
    if (saved && (saved.mode==='country'||saved.mode==='districts'||saved.mode==='airports')) mode=saved.mode;
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
