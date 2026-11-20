(() => {
  'use strict';
  const MAX_MISSES = 5;
  const HISTORY_KEY = 'indiaMapQuiz.history.v1';
  const BEST_KEY = 'indiaMapQuiz.best.v1';
  const MODE_KEY = 'indiaMapQuiz.mode.v1';
  // ---- Airports mode: international airports of India. Tap radius is geographic (km), so it scales with zoom. ----
  const AIRPORT_RADIUS_KM = 60;
  // Smaller tap radius for airports that share a metro area, so their zones overlap less.
  const AIRPORT_RADIUS_OVERRIDES = {'Indira Gandhi Int’l (DEL)':35,'Noida Int’l (DXN)':35,'Chhatrapati Shivaji Maharaj Int’l (BOM)':35,'Navi Mumbai Int’l (NMI)':35,'Goa Int’l (GOI)':35,'Manohar Int’l (GOX)':35,'Kushinagar Int’l (KBK)':35,'Gorakhpur (GOP)':35,'Hubballi (HBX)':35,'Belagavi (IXG)':35,'Nashik (ISK)':40,'Shirdi Int’l (SAG)':40,'Jamnagar (JGA)':40,'Agra (AGR)':45,'Gwalior (GWL)':45,'Dimapur (DMU)':50,'Sindhudurg (SDW)':35,'Shimla (SLV)':35,'Kangra (DHM)':45,'Kullu-Manali (KUU)':45,'Shillong (SHL)':35,'Pasighat (IXT)':35,'Shaheed Bhagat Singh Int’l (IXC)':30,'Lokpriya Gopinath Bordoloi Int’l (GAU)':30,'Bagdogra Int’l (IXB)':30,'Pakyong (PYG)':35};
  const radiusFor = n => AIRPORT_RADIUS_OVERRIDES[n] || AIRPORT_RADIUS_KM;
  const EARTH_KM = 6371;
  const AIRPORTS = [
    ['Indira Gandhi Int’l (DEL)',28.5562,77.1000],['Chhatrapati Shivaji Maharaj Int’l (BOM)',19.0896,72.8656],['Chennai Int’l (MAA)',12.9941,80.1709],['Netaji Subhas Chandra Bose Int’l (CCU)',22.6547,88.4467],
    ['Kempegowda Int’l (BLR)',13.1986,77.7066],['Rajiv Gandhi Int’l (HYD)',17.2403,78.4294],['Sardar Vallabhbhai Patel Int’l (AMD)',23.0772,72.6347],['Cochin Int’l (COK)',10.1520,76.4019],
    ['Thiruvananthapuram Int’l (TRV)',8.4821,76.9201],['Calicut Int’l (CCJ)',11.1368,75.9553],['Kannur Int’l (CNN)',11.9186,75.5472],['Goa Int’l (GOI)',15.3808,73.8314],['Manohar Int’l (GOX)',15.7428,73.8617],
    ['Pune Int’l (PNQ)',18.5821,73.9197],['Jaipur Int’l (JAI)',26.8242,75.8122],['Chaudhary Charan Singh Int’l (LKO)',26.7606,80.8893],['Lal Bahadur Shastri Int’l (VNS)',25.4524,82.8593],['Maharishi Valmiki Int’l (AYJ)',26.7433,82.1465],
    ['Kushinagar Int’l (KBK)',26.7761,83.8884],['Gaya Int’l (GAY)',24.7443,84.9512],['Sri Guru Ram Dass Jee Int’l (ATQ)',31.7096,74.7973],['Shaheed Bhagat Singh Int’l (IXC)',30.6735,76.7885],['Sheikh ul-Alam Int’l (SXR)',33.9871,74.7742],
    ['Lokpriya Gopinath Bordoloi Int’l (GAU)',26.1061,91.5859],['Bagdogra Int’l (IXB)',26.6812,88.3286],['Bir Tikendrajit Int’l (IMF)',24.7600,93.8967],['Maharaja Bir Bikram (IXA)',23.8870,91.2404],
    ['Veer Savarkar Int’l (IXZ)',11.6412,92.7297],['Tiruchirappalli Int’l (TRZ)',10.7654,78.7097],['Coimbatore Int’l (CJB)',11.0300,77.0434],['Madurai Int’l (IXM)',9.8345,78.0934],['Mangaluru Int’l (IXE)',12.9613,74.8901],
    ['Dr. Babasaheb Ambedkar Int’l (NAG)',21.0922,79.0472],['Devi Ahilya Bai Holkar (IDR)',22.7218,75.8011],['Surat Int’l (STV)',21.1141,72.7418],['Rajkot Int’l (HSR)',22.3881,71.0283],
    ['Alluri Sitarama Raju Int’l (VTZ)',17.9715,83.5036],['Vijayawada Int’l (VGA)',16.5304,80.7968],
    ['Navi Mumbai Int’l (NMI)',18.9846,73.0653],['Noida Int’l (DXN)',28.1799,77.6118],['Tirupati Int’l (TIR)',13.6325,79.5433],['Shirdi Int’l (SAG)',19.6886,74.3789],['Biju Patnaik Int’l (BBI)',20.2444,85.8178],
    ['Jay Prakash Narayan Int’l (PAT)',25.5913,85.0880],['Raja Bhoj (BHO)',23.2875,77.3374],['Chhatrapati Sambhajinagar (IXU)',19.8627,75.3981],['Vadodara (BDQ)',22.3362,73.2263],
    // Major domestic airports
    ['Swami Vivekananda (RPR)',21.1804,81.7388],['Birsa Munda (IXR)',23.3143,85.3217],['Jolly Grant (DED)',30.1897,78.1803],['Jammu (IXJ)',32.6891,74.8374],
    ['Kushok Bakula Rimpochee (IXL)',34.1359,77.5465],['Dibrugarh (DIB)',27.4839,95.0169],['Maharana Pratap (UDR)',24.6177,73.8961],['Jodhpur (JDH)',26.2511,73.0489],
    ['Warangal (WGC)',17.9167,79.6],
    ['Gorakhpur (GOP)',26.7397,83.4497],
    ['Hubballi (HBX)',15.3617,75.0849],
    ['Belagavi (IXG)',15.8593,74.6183],
    ['Mysuru (MYQ)',12.23,76.6558],
    ['Rajahmundry (RJA)',17.1104,81.8182],
    ['Jabalpur (JLR)',23.1778,80.052],
    ['Kolhapur (KLH)',16.6647,74.2894],
    ['Nashik (ISK)',20.1191,73.9129],
    ['Jamnagar (JGA)',22.4655,70.0126],
    ['Bhuj (BHJ)',23.2878,69.6702],
    ['Prayagraj (IXD)',25.4401,81.7339],
    ['Agra (AGR)',27.1558,77.9609],
    ['Gwalior (GWL)',26.2933,78.2278],
    ['Jorhat (JRH)',26.7315,94.1755],
    ['Silchar (IXS)',24.9129,92.9788],
    ['Dimapur (DMU)',25.8839,93.7711],
    ['Lengpui (AJL)',23.8406,92.6196],
    ['Veer Surendra Sai (JRG)',21.9135,84.0504],
    ['Thoothukudi (TCR)',8.7241,78.0258],
    ['Kadapa (CDP)',14.51,78.7728],
    ['Uyyalawada Narasimha Reddy (KJB)',15.7186,78.1514],
    ['Salem (SXV)',11.7833,78.0656],
    ['Kalaburagi (GBI)',17.308,76.958],
    ['Kuvempu (RQY)',13.8575,75.689],
    ['Jindal Vijaynagar (VDY)',15.175,76.635],
    ['Bidar (IXX)',17.9075,77.4871],
    ['Jalgaon (JLG)',20.9619,75.6258],
    ['Shri Guru Gobind Singh Ji (NDC)',19.1833,77.3167],
    ['Sindhudurg (SDW)',16.001,73.533],
    ['Gondia (GDB)',21.589,80.295],
    ['Amravati (AMI)',20.8264,77.6772],
    ['Solapur (SSE)',17.628,75.9347],
    ['Puducherry (PNY)',11.968,79.812],
    ['Agatti (AGX)',10.8237,72.176],
    ['Diu (DIU)',20.7131,70.9211],
    ['Kangra (DHM)',32.1651,76.2634],
    ['Shimla (SLV)',31.0818,77.068],
    ['Kullu-Manali (KUU)',31.8767,77.1544],
    ['Maharaja Agrasen Int’l (HSS)',29.1794,75.7553],
    ['Pakyong (PYG)',27.2258,88.5859],
    ['Shillong (SHL)',25.7036,91.9786],
    ['Pasighat (IXT)',28.0661,95.3356],
    ['Tezpur (TEZ)',26.7091,92.7847],
    ['Pantnagar (PGH)',29.0334,79.4737],
    ['Deoghar (DGH)',24.4447,86.7025],
    ['Bilaspur (PAB)',21.9884,82.1111],
    ['Maa Danteswari (JGB)',19.0743,82.0368],
    ['Kazi Nazrul Islam (RDP)',23.6225,87.243],
    ['Darbhanga (DBR)',26.1947,85.9174],
    ['Kishangarh (KQH)',26.5973,74.8142],
    ['Bikaner (BKB)',28.0707,73.2072],
    ['Jaisalmer (JSA)',26.8887,70.865],
    ['Khajuraho (HJR)',24.8172,79.9186],
    ['Porbandar (PBD)',21.6487,69.6572],
    ['Adampur (AIP)',31.4338,75.7588]
  ];
  const DOMESTIC_AIRPORTS = new Set(['Warangal (WGC)','Gorakhpur (GOP)','Hubballi (HBX)','Belagavi (IXG)','Mysuru (MYQ)','Rajahmundry (RJA)','Jabalpur (JLR)','Kolhapur (KLH)','Nashik (ISK)','Jamnagar (JGA)','Bhuj (BHJ)','Prayagraj (IXD)','Agra (AGR)','Gwalior (GWL)','Jorhat (JRH)','Silchar (IXS)','Dimapur (DMU)','Lengpui (AJL)','Veer Surendra Sai (JRG)','Thoothukudi (TCR)','Kadapa (CDP)','Uyyalawada Narasimha Reddy (KJB)','Salem (SXV)','Kalaburagi (GBI)','Kuvempu (RQY)','Jindal Vijaynagar (VDY)','Bidar (IXX)','Jalgaon (JLG)','Shri Guru Gobind Singh Ji (NDC)','Sindhudurg (SDW)','Gondia (GDB)','Amravati (AMI)','Solapur (SSE)','Puducherry (PNY)','Agatti (AGX)','Diu (DIU)','Swami Vivekananda (RPR)','Birsa Munda (IXR)','Jolly Grant (DED)','Jammu (IXJ)','Kushok Bakula Rimpochee (IXL)','Dibrugarh (DIB)','Maharana Pratap (UDR)','Jodhpur (JDH)','Kangra (DHM)','Shimla (SLV)','Kullu-Manali (KUU)','Maharaja Agrasen Int’l (HSS)','Pakyong (PYG)','Shillong (SHL)','Pasighat (IXT)','Tezpur (TEZ)','Pantnagar (PGH)','Deoghar (DGH)','Bilaspur (PAB)','Maa Danteswari (JGB)','Kazi Nazrul Islam (RDP)','Darbhanga (DBR)','Kishangarh (KQH)','Bikaner (BKB)','Jaisalmer (JSA)','Khajuraho (HJR)','Porbandar (PBD)','Adampur (AIP)',]);
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
  // ---- Vehicle registration (licence plate) codes. First code is the current one shown in brackets; extra codes are accepted as answers too. ----
  const PLATE = {
    'Andhra Pradesh':['AP'],'Arunachal Pradesh':['AR'],'Assam':['AS'],'Bihar':['BR'],'Chhattisgarh':['CG','CT'],'Goa':['GA'],'Gujarat':['GJ'],'Haryana':['HR'],'Himachal Pradesh':['HP'],'Jharkhand':['JH'],'Karnataka':['KA'],'Kerala':['KL'],'Madhya Pradesh':['MP'],'Maharashtra':['MH'],'Manipur':['MN'],'Meghalaya':['ML'],'Mizoram':['MZ'],'Nagaland':['NL'],'Odisha':['OD','OR'],'Punjab':['PB'],'Rajasthan':['RJ'],'Sikkim':['SK'],'Tamil Nadu':['TN'],'Telangana':['TG','TS'],'Tripura':['TR'],'Uttar Pradesh':['UP'],'Uttarakhand':['UK','UA'],'West Bengal':['WB'],
    'Andaman and Nicobar Islands':['AN'],'Chandigarh':['CH'],'Dadra and Nagar Haveli and Daman and Diu':['DN','DD'],'Delhi':['DL'],'Jammu and Kashmir':['JK'],'Ladakh':['LA'],'Lakshadweep':['LD'],'Puducherry':['PY']
  };
  const CODE_OWNER = new Map(); Object.entries(PLATE).forEach(([n,cs])=>cs.forEach(c=>CODE_OWNER.set(c,n)));
  const codeOf = n => (PLATE[n]||[])[0] || '';
  const $ = id => document.getElementById(id);
  let features = [], featureByName = new Map(), queue = [], current = null;
  let awaiting = false, typedShown = '', outlineCollection = null;
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
  function typeOf(name) { return mode==='airports' ? (name==='Warangal (WGC)'?'Domestic airport (under redevelopment)':DOMESTIC_AIRPORTS.has(name)?'Domestic airport':'International airport') : mode==='districts' ? 'District' : (STATES.includes(name) ? 'State' : 'Union Territory'); }
  function noun() { return mode==='airports' ? 'airport' : mode==='districts' ? 'district' : mode==='outlines' ? 'outline' : 'region'; }
  // Show the licence plate code in brackets for states/UTs (States & UTs and Outlines modes).
  function lab(n) { return (mode==='country'||mode==='outlines') && PLATE[n] ? `${n} (${codeOf(n)})` : n; }
  function modeLabel() { return mode==='airports' ? 'Airports' : mode==='outlines' ? 'Outlines' : mode==='districts' ? `${districtKey||'State'} districts` : 'All regions'; }
  function bestKey() { return mode==='airports' ? 'indiaMapQuiz.best.airports.v1' : mode==='outlines' ? 'indiaMapQuiz.best.outlines.v1' : mode==='districts' && districtKey ? `indiaMapQuiz.best.districts.${DISTRICT_SETS[districtKey].slug}.v1` : BEST_KEY; }
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
    if (!current) {
      $('prompt-name').textContent=roundActive?'Round complete':(mode==='districts'&&!districtKey?'Choose a state':mode==='outlines'?'Name the outline':'Press New game');
      $('prompt-kind').textContent=mode==='airports'?'FIND THIS AIRPORT':mode==='districts'?'FIND THIS DISTRICT':mode==='outlines'?'GUESS THE OUTLINE':'FIND THIS REGION';
      $('prompt-hint').textContent=mode==='airports'?`Tap within about ${AIRPORT_RADIUS_KM} km of the airport.`:mode==='districts'?'Tap the matching district on the map.':mode==='outlines'?'Type the 2-letter licence plate code of the state or UT.':'Tap the matching state or Union Territory on the map.';
      $('side-prompt').textContent='Ready when you are';
      $('side-description').textContent=mode==='airports'?`Point out all ${AIRPORTS.length} international and major domestic airports. Tapping within the airport’s radius (about ${AIRPORT_RADIUS_KM} km; less for nearby airports) counts.`:mode==='districts'?(!districtKey?'Choose a state from the menu to practise its districts.':poolNames.length?`Find all ${poolNames.length} districts of ${districtKey} by tapping them on the map.`:`Find every district of ${districtKey} by tapping it on the map.`):mode==='outlines'?'Recognise the outline of each of the 36 states and Union Territories and type its 2-letter licence plate code (like KA or MH). It submits as soon as you type 2 letters.':'Find all 36 states and Union Territories by tapping them on the map.';
      $('skip').disabled=true; $('side-skip').disabled=true; return;
    }
    $('prompt-name').textContent=mode==='outlines'?'Which state or UT is this?':lab(current);
    $('prompt-kind').textContent=mode==='outlines'?'GUESS THE OUTLINE':typeOf(current).toUpperCase();
    $('prompt-hint').textContent=mode==='airports'?`Tap within about ${radiusFor(current)} km of the airport.`:mode==='outlines'?'Type its 2-letter licence plate code — it submits automatically.':`Tap the matching ${noun()} on the map.`;
    $('side-prompt').textContent=mode==='outlines'?'Guess this outline':lab(current);
    $('side-description').textContent=mode==='airports'?`${typeOf(current)} · tap within ${radiusFor(current)} km of it.`:mode==='districts'?`District of ${districtKey} · Find it on the map.`:mode==='outlines'?'State or Union Territory · type its licence plate code.':`${typeOf(current)} · Find it on the map.`;
    $('skip').disabled=false; $('side-skip').disabled=false;
  }
  function startGame() {
    const pool=listForMode();
    if (mode==='districts' && !districtKey) {toast('Select a state first.');return;}
    if (!features.length) {toast('The map is still loading.');return;}
    const missing=pool.filter(n=>!featureByName.has(n));
    if (missing.length) {toast(`Map data missing: ${missing.join(', ')}`);console.warn('Unmatched map regions',missing);return;}
    gameId++; queue=d3.shuffle([...pool]); found=new Set(); missed=new Set(); mistakes=0; roundActive=true; current=null; awaiting=false; hideCaption();
    $('recent-answers').innerHTML='<li>Answers will appear here.</li>';
    mapGroup.selectAll('.region, .airport-node, .outline-shape, .base-region, .lk-isl').classed('found',false).classed('missed',false).classed('target-reveal',false);
    $('map-message').textContent=mode==='outlines'?'Round in progress · type the plate code':`Round in progress · tap a ${noun()}`; updateStats(); nextQuestion(); resetMapView();
    if (mode==='outlines' && window.matchMedia('(hover:none) and (pointer:coarse)').matches) { const p=document.querySelector('.map-panel'); if (p) window.scrollTo({top:Math.max(0,p.getBoundingClientRect().top+window.scrollY-62),behavior:'smooth'}); }
  }
  function nextQuestion() {
    if (!roundActive) return;
    if (queue.length===0) {finishGame(found.size===listForMode().length);return;}
    current=queue.shift(); showPrompt(); updateStats();
    if (mode==='outlines') { renderOutline(current); resetCodeInput(); }
  }
  function findPath(name) { return mapGroup.selectAll(mode==='airports'?'.airport-node':mode==='outlines'?'.outline-shape, .lk-isl':'.region, .lk-isl').filter(d=>d.properties.quizName===name); }
  function handleRegionTap(name) {
    if (!roundActive || !current) return;
    if (name && (found.has(name)||missed.has(name))) {toast(`${lab(name)} has already been answered.`);return;}
    if (name===current) {
      found.add(name); findPath(name).classed('found',true).classed('target-reveal',false); addRecent(lab(name),true); $('map-message').textContent=`✓ ${lab(name)} found`; current=null; updateStats();
      if (queue.length===0) finishGame(found.size===listForMode().length); else nextQuestion();
    } else {
      mistakes++; missed.add(current); findPath(current).classed('missed',true); if(name) findPath(name).classed('target-reveal',true); addRecent(name?`${lab(name)} · target: ${lab(current)}`:`Not near an airport · target: ${current}`,false);
      $('map-message').textContent=`Not quite — the target was ${lab(current)}`; toast(name?`That’s ${lab(name)}. Find ${lab(current)}.`:`No airport there. Find ${current}.`);
      const reveal=current; current=null; updateStats();
      if (mistakes>=MAX_MISSES) {finishGame(false);return;}
      const gid=gameId; setTimeout(()=>{if(gid!==gameId)return;findPath(reveal).classed('target-reveal',false);if(name&&!found.has(name)&&!missed.has(name))findPath(name).classed('target-reveal',false);nextQuestion();},1000);
    }
  }
  function skipQuestion() {
    if (!roundActive || !current || awaiting) return;
    const name=current; mistakes++; missed.add(name); findPath(name).classed('missed',true).classed('target-reveal',mode!=='outlines'); addRecent(`${lab(name)} · skipped`,false);
    current=null; updateStats();
    if (mode==='outlines') { $('map-message').textContent=`Skipped · it was ${lab(name)}`; showCaption(`Skipped · ${lab(name)}`,'bad'); revealThenNext(1700); return; }
    $('map-message').textContent=`Skipped · ${lab(name)} highlighted on the map`;
    if (mistakes>=MAX_MISSES) {finishGame(false);return;}
    const gid=gameId; setTimeout(()=>{if(gid!==gameId)return;findPath(name).classed('target-reveal',false);nextQuestion();},1300);
  }
  // ---- Outlines mode: guess the state/UT from its outline by typing its 2-letter licence plate code ----
  function showCaption(text,kind) { const el=$('outline-caption'); el.textContent=text; el.className='outline-caption show '+kind; }
  function hideCaption() { const el=$('outline-caption'); if (el) el.className='outline-caption'; }
  function renderCode(state) {
    const v=typedShown;
    [0,1].forEach(i=>{const b=$('cb'+i); b.textContent=v[i]||''; b.className='code-box'+(v[i]?' filled':'')+(!state&&i===v.length?' next':'')+(state?' '+state:'');});
  }
  function resetCodeInput() { typedShown=''; renderCode(); }
  // Letters come from the physical keyboard (desktop) or the on-screen keyboard (touch devices); no native keyboard is ever opened.
  function typeLetter(ch) {
    if (mode!=='outlines' || !roundActive || !current || awaiting || typedShown.length>=2) return;
    typedShown+=ch; renderCode();
    if (typedShown.length===2) { const v=typedShown, gid=gameId; setTimeout(()=>{ if (gid===gameId && roundActive && current && !awaiting && typedShown===v) submitCode(v); },160); }
  }
  function backspaceCode() { if (mode!=='outlines' || !roundActive || !current || awaiting) return; typedShown=typedShown.slice(0,-1); renderCode(); }
  function buildKeyboard() {
    const host=$('osk'); if (!host) return;
    [['Q','W','E','R','T','Y','U','I','O','P'],['A','S','D','F','G','H','J','K','L'],['Z','X','C','V','B','N','M','⌫']].forEach(row=>{
      const r=document.createElement('div'); r.className='osk-row';
      row.forEach(k=>{
        const b=document.createElement('button'); b.type='button'; b.className='osk-key'+(k==='⌫'?' osk-back':''); b.textContent=k; b.setAttribute('aria-label',k==='⌫'?'Backspace':k);
        const press=()=>k==='⌫'?backspaceCode():typeLetter(k);
        b.addEventListener('pointerdown',e=>{e.preventDefault();press();});
        b.addEventListener('click',e=>{if(e.detail===0)press();}); // keyboard/assistive activation
        r.append(b);
      });
      host.append(r);
    });
  }
  function revealThenNext(ms) {
    awaiting=true; const gid=gameId;
    setTimeout(()=>{ if(gid!==gameId) return; awaiting=false; hideCaption(); if (mistakes>=MAX_MISSES) {finishGame(false);return;} nextQuestion(); },ms);
  }
  function submitCode(typed) {
    if (mode!=='outlines' || !roundActive || !current || awaiting) return;
    const target=current, ok=(PLATE[target]||[]).includes(typed);
    if (ok) {
      found.add(target); findPath(target).classed('found',true); addRecent(lab(target),true);
      $('map-message').textContent=`✓ ${lab(target)} found`; showCaption(`✓ ${lab(target)}`,'ok'); renderCode('ok');
    } else {
      mistakes++; missed.add(target); findPath(target).classed('missed',true); addRecent(`${lab(target)} · you typed ${typed}`,false);
      const owner=CODE_OWNER.get(typed);
      $('map-message').textContent=`Not quite — it was ${lab(target)}`; showCaption(`It was ${lab(target)}`,'bad'); renderCode('bad');
      toast(owner?`${typed} is the code for ${lab(owner)}.`:`${typed} isn’t a state or UT code.`);
    }
    current=null; updateStats(); revealThenNext(ok?800:1800);
  }
  function finishGame(completed) {
    roundActive=false; current=null; showPrompt(); updateStats();
    const total=listForMode().length, score=found.size, label=modeLabel();
    const date=new Date().toLocaleDateString(undefined,{day:'numeric',month:'short'});
    saveHistory({score,total,misses:mistakes,modeLabel:label,date,completed});
    if (mode==='outlines') { hideCaption(); awaiting=false; resetCodeInput(); renderOutline(null); }
    $('result-icon').textContent=completed?'🎉':'🗺️'; $('result-title').textContent=completed?(mode==='airports'?'All airports found!':mode==='outlines'?'All outlines named!':mode==='districts'?`${districtKey} mapped!`:'India mapped!'):'Round over';
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
  // Lakshadweep's islands are only a few pixels wide on the map, so mark the 10 inhabited islands (one per sub-division). Island centres from Wikipedia / Govt. of Lakshadweep island pages (lat, lon).
  const LK_ISLANDS = [[11.60,72.18],[11.68,72.72],[11.49,73.00],[11.22,72.78],[11.12,72.73],[10.85,72.18],[10.56,72.64],[10.82,73.68],[10.08,73.63],[8.28,73.05]]; // Bitra, Chetlat, Kiltan, Kadmat, Amini, Agatti, Kavaratti, Androth, Kalpeni, Minicoy
  const LK_LEN = [0.8,1.6,2.5,8,4,7,6,4.5,3.5,10]; // approx. island length in km, same order — used only to vary the drawn size a little
  let mapK = 1;
  // Each island is drawn like the rest of the map: a tiny land-coloured island with the usual border, sitting in a faint lagoon halo, and it takes the same found/missed colour as its region.
  function addLakshadweepMarkers(clickable, sizeScale=1) {
    mapK = 1;
    LK_ISLANDS.forEach(([lat,lon],i)=>{
      const [x,y]=projection([lon,lat]), len=LK_LEN[i], ry=(1.7+0.12*len)*sizeScale, rx=(0.95+0.04*len)*sizeScale;
      const g=mapGroup.append('g').datum({x,y,properties:{quizName:'Lakshadweep'}}).attr('class','lk-isl'+(clickable?' clickable':'')).attr('transform',`translate(${x},${y})`);
      g.append('ellipse').attr('class','lk-halo').attr('rx',rx*3.4).attr('ry',ry*1.5);
      g.append('ellipse').attr('class','lk-land').attr('rx',rx).attr('ry',ry);
      if (clickable) g.on('click',event=>{event.stopPropagation();handleRegionTap('Lakshadweep');});
    });
  }
  function onMapZoom(event) { mapGroup.attr('transform',event.transform); mapK=event.transform.k; mapGroup.selectAll('.lk-isl').attr('transform',d=>`translate(${d.x},${d.y}) scale(${1/Math.sqrt(mapK)})`); }
  function drawAirportMap(collection) {
    const host=$('map'); host.innerHTML=''; host.classList.remove('districts','outlines'); host.classList.add('airports');
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
    addLakshadweepMarkers(false);
    mapSvg.on('click',event=>{
      const [px,py]=d3.pointer(event,mapGroup.node()), inv=projection.invert([px,py]);
      if(!inv||!isFinite(inv[0])) return;
      handleRegionTap(nearestAirport(inv[0],inv[1]));
    });
    zoom=d3.zoom().scaleExtent([1,40]).filter(event=>event.type==='wheel'||event.type==='mousedown'||event.type==='touchstart'||event.type==='dblclick').on('zoom',onMapZoom);
    mapSvg.call(zoom).on('dblclick.zoom',null);
    $('map-message').textContent='Map ready · choose New game';
  }
  const OUT_BOX=[[70,36],[930,590]];
  function lkStatusClasses() { mapGroup.selectAll('.lk-isl').classed('found',found.has('Lakshadweep')).classed('missed',missed.has('Lakshadweep')); }
  // name=null: overview of all regions (before a round / after it, coloured by result). Otherwise: just that one outline, scaled to fill the map.
  function renderOutline(name) {
    if (!mapGroup||!outlineCollection) return;
    mapGroup.selectAll('*').remove(); mapGroup.attr('transform',null); mapK=1;
    if (!name) {
      projection=d3.geoMercator().center([82.5,22.5]).scale(1050).translate([500,390]);
      projection.fitExtent([[65,65],[935,690]],outlineCollection); path=d3.geoPath(projection);
      mapGroup.selectAll('path.base-region').data(outlineCollection.features).join('path')
        .attr('class',d=>'base-region'+(found.has(d.properties.quizName)?' found':missed.has(d.properties.quizName)?' missed':'')).attr('d',path);
      addLakshadweepMarkers(false); lkStatusClasses(); return;
    }
    const f=featureByName.get(name); if (!f) return;
    const lk=name==='Lakshadweep';
    const extent=lk?{type:'GeometryCollection',geometries:[f.geometry,{type:'MultiPoint',coordinates:LK_ISLANDS.map(([la,lo])=>[lo,la])}]}:f;
    projection=d3.geoMercator().fitExtent(OUT_BOX,extent); path=d3.geoPath(projection);
    mapGroup.append('path').datum(f).attr('class','outline-shape').attr('d',path);
    if (lk) addLakshadweepMarkers(false,5);
  }
  function drawOutlineMap(collection) {
    const host=$('map'); host.innerHTML=''; host.classList.remove('districts','airports'); host.classList.add('outlines');
    mapSvg=d3.select(host).append('svg').attr('role','img').attr('aria-label','Outline of an Indian state or Union Territory').attr('viewBox','0 0 1000 760').attr('preserveAspectRatio','xMidYMid meet');
    mapGroup=mapSvg.append('g').attr('class','map-world'); zoom=null; outlineCollection=collection;
    renderOutline(null);
    $('map-message').textContent='Map ready · choose New game';
  }
  function drawMap(collection) {
    if (mode==='airports') return drawAirportMap(collection);
    if (mode==='outlines') return drawOutlineMap(collection);
    const host=$('map'); host.classList.remove('airports','outlines'); host.innerHTML=''; host.classList.toggle('districts',mode==='districts');
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
    if (collection.features.some(d=>d.properties.quizName==='Lakshadweep')) addLakshadweepMarkers(true);
    zoom=d3.zoom().scaleExtent([1,40]).filter(event=>event.type==='wheel'||event.type==='mousedown'||event.type==='touchstart'||event.type==='dblclick').on('zoom',onMapZoom);
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
      districts:['Adilabad','Bhadradri Kothagudem','Hanumakonda','Hyderabad','Jagtial','Jangaon','Jayashankar Bhupalpally','Jogulamba Gadwal','Kamareddy','Karimnagar','Khammam','Kumuram Bheem','Mahabubabad','Mahabubnagar','Mancherial','Medak','Medchal-Malkajgiri','Mulugu','Nagarkurnool','Nalgonda','Narayanpet','Nirmal','Nizamabad','Peddapalli','Rajanna Sircilla','Rangareddy','Sangareddy','Siddipet','Suryapet','Vikarabad','Wanaparthy','Warangal','Yadadri Bhuvanagiri'],
      // Spelling variants / older names found in public boundary files -> current official name.
      aliases:{
        'Hanumakonda':['Hanamkonda','Warangal Urban','Warangal (Urban)'],
        'Warangal':['Warangal Rural','Warangal (Rural)'],
        'Rangareddy':['Ranga Reddy','Rangareddi','K.V. Rangareddy','K V Rangareddy'],
        'Jangaon':['Jangoan'],
        'Mahabubnagar':['Mahbubnagar','Mahaboobnagar'],
        'Mahabubabad':['Mahbubabad'],
        'Kumuram Bheem':['Kumuram Bheem','Kumuram Bheem Asifabad','Komram Bheem Asifabad','Kumurambheem Asifabad','Asifabad'],
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
    const label=mode==='districts'?`Loading ${districtKey}’s districts…`:mode==='airports'?'Loading airports map…':mode==='outlines'?'Loading outlines…':'Loading India’s map…';
    $('map').classList.remove('ready','districts','airports','outlines');
    $('map').innerHTML=`<div class="map-loading"><span class="loader"></span><strong>${label}</strong><small>Loading boundary data</small></div>`;
    $('map-message').textContent='Loading map…';
  }
  async function loadMap() {
    const token=++loadToken, m=mode, key=districtKey, cacheKey=m==='districts'?`districts:${key}`:'country';
    airportFeatures=AIRPORTS.map(([n,lat,lon])=>({type:'Feature',properties:{quizName:n},geometry:{type:'Point',coordinates:[lon,lat]}}));
    features=[]; featureByName=new Map(); poolNames=m==='districts'?[]:m==='airports'?AIRPORT_NAMES.slice():ALL.map(x=>x.name);
    if (m==='districts' && !key) {
      $('map').classList.remove('ready','districts','outlines');
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
    document.body.dataset.mode=mode; $('code-entry').hidden=mode!=='outlines';
  }
  function setMode(newMode,newKey=null) {
    if (newMode!=='districts') newKey=null;
    if (newMode===mode && newKey===districtKey) return;
    const wasActive=roundActive;
    mode=newMode; districtKey=newKey;
    try { localStorage.setItem(MODE_KEY,JSON.stringify({mode})); } catch {}
    gameId++; roundActive=false; current=null; queue=[]; found=new Set(); missed=new Set(); mistakes=0; awaiting=false; hideCaption(); resetCodeInput(false);
    $('result-overlay').classList.remove('open'); $('result-overlay').setAttribute('aria-hidden','true');
    $('recent-answers').innerHTML='<li>Answers will appear here.</li>';
    applyModeUI(); renderBest(); loadMap();
    if (wasActive) toast('Round ended · mode changed');
  }
  function openDrawer(open) { $('info-drawer').classList.toggle('open',open); $('drawer-scrim').classList.toggle('open',open); $('info-drawer').setAttribute('aria-hidden',String(!open)); }
  function init() {
    const saved=readJSON(MODE_KEY,null);
    if (saved && (saved.mode==='country'||saved.mode==='districts'||saved.mode==='airports'||saved.mode==='outlines')) mode=saved.mode;
    document.querySelectorAll('.seg-btn').forEach(b=>b.addEventListener('click',()=>{ if (b.dataset.mode!==mode) setMode(b.dataset.mode); }));
    $('state-select').addEventListener('change',e=>setMode('districts',e.target.value||null));
    buildKeyboard();
    document.addEventListener('keydown',e=>{
      if (mode!=='outlines' || e.ctrlKey || e.metaKey || e.altKey || $('info-drawer').classList.contains('open')) return;
      if (/^[a-z]$/i.test(e.key)) { e.preventDefault(); typeLetter(e.key.toUpperCase()); }
      else if (e.key==='Backspace') { e.preventDefault(); backspaceCode(); }
    });
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
