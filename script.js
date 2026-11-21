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
    'Andhra Pradesh':['AP'],'Arunachal Pradesh':['AR'],'Assam':['AS'],'Bihar':['BR'],'Chhattisgarh':['CG'],'Goa':['GA'],'Gujarat':['GJ'],'Haryana':['HR'],'Himachal Pradesh':['HP'],'Jharkhand':['JH'],'Karnataka':['KA'],'Kerala':['KL'],'Madhya Pradesh':['MP'],'Maharashtra':['MH'],'Manipur':['MN'],'Meghalaya':['ML'],'Mizoram':['MZ'],'Nagaland':['NL'],'Odisha':['OD'],'Punjab':['PB'],'Rajasthan':['RJ'],'Sikkim':['SK'],'Tamil Nadu':['TN'],'Telangana':['TG'],'Tripura':['TR'],'Uttar Pradesh':['UP'],'Uttarakhand':['UK'],'West Bengal':['WB'],
    'Andaman and Nicobar Islands':['AN'],'Chandigarh':['CH'],'Dadra and Nagar Haveli and Daman and Diu':['DD'],'Delhi':['DL'],'Jammu and Kashmir':['JK'],'Ladakh':['LA'],'Lakshadweep':['LD'],'Puducherry':['PY']
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
  function typeOf(name) { return mode==='airports' ? (name==='Warangal (WGC)'?'Domestic airport (under redevelopment)':DOMESTIC_AIRPORTS.has(name)?'Domestic airport':'International airport') : mode==='districts' ? (LK_NAMES.includes(name)?'Sub-division':'District') : (STATES.includes(name) ? 'State' : 'Union Territory'); }
  function noun() { return mode==='airports' ? 'airport' : mode==='districts' ? 'district' : mode==='outlines' ? 'outline' : 'region'; }
  // Show the licence plate code in brackets for states/UTs (States & UTs and Outlines modes).
  function lab(n) { return (mode==='country'||mode==='outlines') && PLATE[n] ? `${n} (${codeOf(n)})` : n; }
  const dset = () => DISTRICT_SETS[districtKey] || {};
  function modeLabel() { return mode==='airports' ? 'Airports' : mode==='outlines' ? 'Outlines' : mode==='districts' ? (dset().modeName||`${districtKey||'State'} districts`) : 'All regions'; }
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
      $('side-description').textContent=mode==='airports'?`Point out all ${AIRPORTS.length} international and major domestic airports. Tapping within the airport’s radius (about ${AIRPORT_RADIUS_KM} km; less for nearby airports) counts.`:mode==='districts'?(!districtKey?'Choose a state from the menu to practise its districts.':poolNames.length?`Find all ${poolNames.length} districts of ${dset().of||districtKey} by tapping them on the map.`:`Find every district of ${dset().of||districtKey} by tapping it on the map.`):mode==='outlines'?'Recognise the outline of each of the 36 states and Union Territories and type its 2-letter licence plate code (like KA or MH). It submits as soon as you type 2 letters.':'Find all 36 states and Union Territories by tapping them on the map.';
      $('skip').disabled=true; $('side-skip').disabled=true; return;
    }
    $('prompt-name').textContent=mode==='outlines'?'Which state or UT is this?':lab(current);
    $('prompt-kind').textContent=mode==='outlines'?'GUESS THE OUTLINE':typeOf(current).toUpperCase();
    $('prompt-hint').textContent=mode==='airports'?`Tap within about ${radiusFor(current)} km of the airport.`:mode==='outlines'?'Type its 2-letter licence plate code — it submits automatically.':`Tap the matching ${noun()} on the map.`;
    $('side-prompt').textContent=mode==='outlines'?'Guess this outline':lab(current);
    $('side-description').textContent=mode==='airports'?`${typeOf(current)} · tap within ${radiusFor(current)} km of it.`:mode==='districts'?`${typeOf(current)} of ${dset().parents?`${dset().parents[current]} (${codeOf(dset().parents[current])})`:districtKey} · Find it on the map.`:mode==='outlines'?'State or Union Territory · type its licence plate code.':`${typeOf(current)} · Find it on the map.`;
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
    [['A','B','C','D','G','H','J'],['K','L','M','N','O','P','R'],['S','T','U','W','Y','Z']].forEach(row=>{
      const r=document.createElement('div'); r.className='osk-row';
      row.forEach(k=>{
        const b=document.createElement('button'); b.type='button'; b.className='osk-key'; b.textContent=k; b.setAttribute('aria-label',k);
        const press=()=>typeLetter(k);
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
    $('result-icon').textContent=completed?'🎉':'🗺️'; $('result-title').textContent=completed?(mode==='airports'?'All airports found!':mode==='outlines'?'All outlines named!':mode==='districts'?(dset().doneTitle||`${districtKey} mapped!`):'India mapped!'):'Round over';
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
  const LK_NAMES = ['Bitra','Chetlat','Kiltan','Kadmat','Amini','Agatti','Kavaratti','Androth','Kalpeni','Minicoy']; // the 10 sub-divisions (Wikipedia), same order as LK_ISLANDS
  const LK_LEN = [0.8,1.6,2.5,8,4,7,6,4.5,3.5,10]; // approx. island length in km, same order — used only to vary the drawn size a little
  let mapK = 1;
  // Each island is drawn like the rest of the map: a tiny land-coloured island with the usual border, sitting in a faint lagoon halo, and it takes the same found/missed colour as its region.
  function addLakshadweepMarkers(clickable, sizeScale=1, perIsland=false) {
    mapK = 1;
    LK_ISLANDS.forEach(([lat,lon],i)=>{
      const [x,y]=projection([lon,lat]), len=LK_LEN[i], ry=(1.7+0.12*len)*sizeScale, rx=(0.95+0.04*len)*sizeScale;
      const g=mapGroup.append('g').datum({x,y,properties:{quizName:perIsland?LK_NAMES[i]:'Lakshadweep'}}).attr('class','lk-isl'+(clickable?' clickable':'')).attr('transform',`translate(${x},${y})`);
      g.append('ellipse').attr('class','lk-halo').attr('rx',rx*3.4).attr('ry',ry*1.5);
      g.append('ellipse').attr('class','lk-land').attr('rx',rx).attr('ry',ry);
      if (clickable) g.on('click',event=>{event.stopPropagation();handleRegionTap(perIsland?LK_NAMES[i]:'Lakshadweep');});
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
    mapSvg=d3.select(host).append('svg').attr('role','img').attr('aria-label',mode==='districts'?`Map of ${dset().of||districtKey} showing its districts`:'Map of India showing 28 states and 8 Union Territories').attr('viewBox','0 0 1000 760').attr('preserveAspectRatio','xMidYMid meet');
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
    if (collection.context?.length) mapGroup.insert('g',':first-child').attr('class','context-layer').selectAll('path').data(collection.context).join('path').attr('class','context-region').attr('d',path);
    if (collection.features.some(d=>d.properties.quizName==='Lakshadweep')) addLakshadweepMarkers(true);
    else if (collection.features.some(d=>LK_NAMES.includes(d.properties.quizName))) addLakshadweepMarkers(true,1,true);
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
  const norm = v => String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/&/g,' and ').replace(/[^a-z0-9]+/g,' ').trim();
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
      districts:['Adilabad','Bhadradri Kothagudem','Hanumakonda','Hyderabad','Jagtial','Jangaon','Jayashankar Bhupalpally','Jogulamba Gadwal','Kamareddy','Karimnagar','Khammam','Kumuram Bheem Asifabad','Mahabubabad','Mahabubnagar','Mancherial','Medak','Medchal–Malkajgiri','Mulugu','Nagarkurnool','Nalgonda','Narayanpet','Nirmal','Nizamabad','Peddapalli','Rajanna Sircilla','Rangareddy','Sangareddy','Siddipet','Suryapet','Vikarabad','Wanaparthy','Warangal','Yadadri Bhuvanagiri'],
      // Spelling variants / older names found in public boundary files -> current official name.
      aliases:{
        'Hanumakonda':['Hanamkonda','Warangal Urban','Warangal (Urban)'],
        'Warangal':['Warangal Rural','Warangal (Rural)'],
        'Rangareddy':['Ranga Reddy','Rangareddi','K.V. Rangareddy','K V Rangareddy'],
        'Jangaon':['Jangoan'],
        'Mahabubnagar':['Mahbubnagar','Mahaboobnagar'],
        'Mahabubabad':['Mahbubabad'],
        'Kumuram Bheem Asifabad':['Kumuram Bheem','Komaram Bheem','Komaram Bheem Asifabad','Komram Bheem Asifabad','Kumurambheem Asifabad','Asifabad'],
        'Jayashankar Bhupalpally':['Jayashankar Bhupalapally','Jayashankar','Bhupalpally'],
        'Jogulamba Gadwal':['Jogulamba','Gadwal'],
        'Bhadradri Kothagudem':['Bhadradri','Kothagudem'],
        'Yadadri Bhuvanagiri':['Yadadri Bhongir','Yadadri','Bhuvanagiri','Bhongir'],
        'Rajanna Sircilla':['Rajanna','Sircilla'],
        'Medchal–Malkajgiri':['Medchal-Malkajgiri','Medchal Malkajgiri','Medchal','Malkajgiri'],
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
    },
    'Goa': {
      slug:'goa', expected:3,
      districts:['Kushavati','North Goa','South Goa'],
      aliases:{'North Goa':['Goa North'],'South Goa':['Goa South'],'Kushavati':['Kushawati','Kushavathi']},
      // Open boundary files predate Kushavati (notified 1 Jan 2026: Dharbandora, Sanguem, Quepem, Canacona talukas, carved out of South Goa).
      // If the file still has 2 districts, South Goa is cut along an approximate taluka boundary (see splitDistrict). Skipped automatically once the data has Kushavati.
      split:{from:'South Goa',newName:'Kushavati',ref:[74.12,15.22],
        line:[[73.85,15.10],[73.99,15.12],[74.02,15.17],[74.04,15.22],[74.03,15.27],[74.05,15.31],[74.08,15.33],[74.13,15.36],[74.12,15.52]]}
    },
    'Karnataka': {
      slug:'karnataka', expected:31,
      districts:['Bagalkote','Ballari','Belagavi','Bengaluru Rural','Bengaluru South','Bengaluru Urban','Bidar','Chamarajanagar','Chikkaballapura','Chikkamagaluru','Chitradurga','Dakshina Kannada','Davanagere','Dharwad','Gadag','Hassan','Haveri','Kalaburagi','Kodagu','Kolar','Koppal','Mandya','Mysuru','Raichur','Shivamogga','Tumakuru','Udupi','Uttara Kannada','Vijayanagara','Vijayapura','Yadgir'],
      aliases:{
        'Bagalkote':['Bagalkot'],'Ballari':['Bellary'],'Belagavi':['Belgaum'],'Bengaluru Rural':['Bangalore Rural'],'Bengaluru Urban':['Bangalore Urban','Bangalore','Bengaluru'],
        'Bengaluru South':['Ramanagara','Ramanagar','Bangalore South','Bengaluru Dakshina'],'Chamarajanagar':['Chamarajanagara','Chamrajnagar','Chamarajnagar'],
        'Chikkaballapura':['Chikballapur','Chikkaballapur','Chickballapur'],'Chikkamagaluru':['Chikmagalur','Chikkamagalur'],'Dakshina Kannada':['Dakshin Kannada','South Canara','Dakshina Kannad'],
        'Davanagere':['Davangere'],'Kalaburagi':['Gulbarga'],'Kodagu':['Coorg'],'Mysuru':['Mysore'],'Shivamogga':['Shimoga'],'Tumakuru':['Tumkur'],
        'Uttara Kannada':['Uttar Kannada','North Canara','Uttara Kannad'],'Vijayapura':['Bijapur'],'Yadgir':['Yadagiri','Yadgiri'],'Vijayanagara':['Vijayanagar','Hosapete','Hospet']
      }
    },
    'Kerala': {
      slug:'kerala', expected:14,
      districts:['Alappuzha','Ernakulam','Idukki','Kannur','Kasaragod','Kollam','Kottayam','Kozhikode','Malappuram','Palakkad','Pathanamthitta','Thiruvananthapuram','Thrissur','Wayanad'],
      aliases:{
        'Alappuzha':['Alleppey','Alapuzha'],'Ernakulam':['Cochin','Kochi'],'Kasaragod':['Kasargod','Kasaragode'],'Kollam':['Quilon'],'Kozhikode':['Calicut'],'Palakkad':['Palghat'],
        'Pathanamthitta':['Pathanamtitta','Pattanamtitta'],'Thiruvananthapuram':['Trivandrum','Thiruvanathapuram'],'Thrissur':['Trichur'],'Kannur':['Cannanore'],'Wayanad':['Wynad'],'Malappuram':['Mallapuram']
      }
    },
    'Sikkim': {
      slug:'sikkim', expected:6,
      districts:['Gangtok','Gyalshing','Mangan','Namchi','Pakyong','Soreng'],
      aliases:{'Gangtok':['East Sikkim','East','East District'],'Gyalshing':['West Sikkim','West','Geyzing','West District'],'Mangan':['North Sikkim','North','North District'],'Namchi':['South Sikkim','South','South District']}
    },
    'Tamil Nadu': {
      slug:'tamil-nadu', expected:38,
      districts:['Ariyalur','Chengalpattu','Chennai','Coimbatore','Cuddalore','Dharmapuri','Dindigul','Erode','Kallakurichi','Kancheepuram','Kanniyakumari','Karur','Krishnagiri','Madurai','Mayiladuthurai','Nagapattinam','Namakkal','Nilgiris','Perambalur','Pudukkottai','Ramanathapuram','Ranipet','Salem','Sivaganga','Tenkasi','Thanjavur','Theni','Thoothukudi','Tiruchirappalli','Tirunelveli','Tirupathur','Tiruppur','Tiruvallur','Tiruvannamalai','Tiruvarur','Vellore','Viluppuram','Virudhunagar'],
      aliases:{
        'Kancheepuram':['Kanchipuram','Kanchipuram'],'Kanniyakumari':['Kanyakumari','Kanniyakumari'],'Nilgiris':['Nilgiri','The Nilgiris'],'Pudukkottai':['Pudukottai'],'Thoothukudi':['Tuticorin','Thoothukkudi'],
        'Tiruchirappalli':['Tiruchirapalli','Trichy','Tiruchchirappalli'],'Tiruppur':['Tirupur'],'Tiruvallur':['Thiruvallur'],'Tiruvannamalai':['Thiruvannamalai'],'Tiruvarur':['Thiruvarur'],
        'Viluppuram':['Villupuram','Vizhupuram'],'Virudhunagar':['Virudhnagar'],'Tirupathur':['Tirupattur','Thirupathur'],'Thanjavur':['Tanjore'],'Ramanathapuram':['Ramnad'],
        'Chengalpattu':['Chengalpet','Chengai'],'Kallakurichi':['Kalakurichi'],'Mayiladuthurai':['Mayiladudurai','Mayiladuthurai'],'Sivaganga':['Sivagangai'],'Tirunelveli':['Tirunelveli Kattabo','Nellai']
      }
    },
    'Tripura': {
      slug:'tripura', expected:8,
      districts:['Dhalai','Gomati','Khowai','North Tripura','Sepahijala','South Tripura','Unakoti','West Tripura'],
      aliases:{'Gomati':['Gomoti'],'Sepahijala':['Sipahijala'],'Unakoti':['Unokoti']}
    },
    'Arunachal Pradesh': {
      slug:'arunachal-pradesh', expected:27,
      districts:['Anjaw','Bichom','Changlang','Dibang Valley','East Kameng','East Siang','Kamle','Keyi Panyor','Kra Daadi','Kurung Kumey','Lepa Rada','Lohit','Longding','Lower Dibang Valley','Lower Siang','Lower Subansiri','Namsai','Pakke-Kessang','Papum Pare','Shi Yomi','Siang','Tawang','Tirap','Upper Siang','Upper Subansiri','West Kameng','West Siang'],
      aliases:{'Dibang Valley':['Upper Dibang Valley','Dibang'],'Lepa Rada':['Lepa-Rada','Leparada'],'Pakke-Kessang':['Pakke Kessang','Pakke-Kesang'],'Shi Yomi':['Shi-Yomi','Shiyomi'],'Kra Daadi':['Kra Dadi'],'Keyi Panyor':['Keyi-Panyor']}
    },
    'Himachal Pradesh': {
      slug:'himachal-pradesh', expected:12,
      districts:['Bilaspur','Chamba','Hamirpur','Kangra','Kinnaur','Kullu','Lahaul and Spiti','Mandi','Shimla','Sirmaur','Solan','Una'],
      aliases:{'Lahaul and Spiti':['Lahul and Spiti','Lahaul & Spiti','Lahul Spiti','Lahaul Spiti']}
    },
    'Manipur': {
      slug:'manipur', expected:16,
      districts:['Bishnupur','Chandel','Churachandpur','Imphal East','Imphal West','Jiribam','Kakching','Kamjong','Kangpokpi','Noney','Pherzawl','Senapati','Tamenglong','Tengnoupal','Thoubal','Ukhrul'],
      aliases:{'Tengnoupal':['Tengnopal'],'Kangpokpi':['Sadar Hills'],'Pherzawl':['Pherzol'],'Kakching':['Kakching Khunou']}
    },
    'Meghalaya': {
      slug:'meghalaya', expected:12,
      districts:['East Garo Hills','East Jaintia Hills','East Khasi Hills','Eastern West Khasi Hills','North Garo Hills','Ri-Bhoi','South Garo Hills','South West Garo Hills','South West Khasi Hills','West Garo Hills','West Jaintia Hills','West Khasi Hills'],
      aliases:{'Ri-Bhoi':['Ribhoi','Ri Bhoi'],'Eastern West Khasi Hills':['East West Khasi Hills','Mairang']}
    },
    'Mizoram': {
      slug:'mizoram', expected:11,
      districts:['Aizawl','Champhai','Hnahthial','Khawzawl','Kolasib','Lawngtlai','Lunglei','Mamit','Saitual','Serchhip','Siaha'],
      aliases:{'Siaha':['Saiha'],'Lawngtlai':['Lawngtlai','Lawngtalai']}
    },
    'Nagaland': {
      slug:'nagaland', expected:17,
      districts:['Chümoukedima','Dimapur','Kiphire','Kohima','Longleng','Meluri','Mokokchung','Mon','Niuland','Noklak','Peren','Phek','Shamator','Tseminyü','Tuensang','Wokha','Zünheboto'],
      aliases:{'Chümoukedima':['Chumoukedima','Chumukedima'],'Tseminyü':['Tseminyu'],'Zünheboto':['Zunheboto','Zunhebot'],'Kohima':['Kohima']}
    },
    'Uttarakhand': {
      slug:'uttarakhand', expected:13,
      districts:['Almora','Bageshwar','Chamoli','Champawat','Dehradun','Haridwar','Nainital','Pauri Garhwal','Pithoragarh','Rudraprayag','Tehri Garhwal','Udham Singh Nagar','Uttarkashi'],
      aliases:{'Pauri Garhwal':['Pauri','Garhwal'],'Udham Singh Nagar':['US Nagar','U.S. Nagar'],'Tehri Garhwal':['Tehri'],'Nainital':['Naini Tal'],'Haridwar':['Hardwar'],'Dehradun':['Dehra Dun']}
    },
    // One dropdown choice for all the Union Territories (Delhi, Jammu & Kashmir, Ladakh, Lakshadweep, Puducherry, A&N, DNH&DD, Chandigarh).
    'Union Territories': {
      slug:'union-territories', context:true,
      modeName:'UT districts', doneTitle:'UT districts mapped!', loadName:'UT district map', of:'the Union Territories',
      // Ladakh's 8 districts (Leh, Kargil, Sham, Nubra, Changthang, Zanskar, Drass, Sankoo; per Wikipedia) are cut from the open Leh/Kargil outlines along approximate lines (LADAKH_DISTRICTS). Lakshadweep's 10 sub-divisions are the islands' polygons grouped by nearest island.
      expected:62,
      sources:[{embed:'delhi'},{slug:'jammu-and-kashmir',drop:['Mirpur','Muzaffarabad']},{slug:'puducherry'},{slug:'andaman-and-nicobar-islands'},{slug:'dnh-and-dd'},{embed:'ladakh'},{slug:'lakshadweep',islands:true},{slug:'chandigarh',fallback:'Chandigarh'}],
      contextSkip:['Delhi','Puducherry','Andaman and Nicobar Islands','Dadra and Nagar Haveli and Daman and Diu','Ladakh','Lakshadweep','Chandigarh'],
      districts:['Central Delhi','Central North Delhi','East Delhi','New Delhi','North Delhi','North East Delhi','North West Delhi','Old Delhi','Outer North Delhi','South Delhi','South East Delhi','South West Delhi','West Delhi'].concat(['Anantnag','Bandipora','Baramulla','Budgam','Doda','Ganderbal','Jammu','Kathua','Kishtwar','Kulgam','Kupwara','Poonch','Pulwama','Rajouri','Ramban','Reasi','Samba','Shopian','Srinagar','Udhampur'],['Puducherry','Karaikal','Mahe','Yanam','Nicobar','North and Middle Andaman','South Andaman','Dadra and Nagar Haveli','Daman','Diu','Leh','Kargil','Sham','Nubra','Changthang','Zanskar','Drass','Sankoo','Bitra','Chetlat','Kiltan','Kadmat','Amini','Agatti','Kavaratti','Androth','Kalpeni','Minicoy','Chandigarh']),
      parents:Object.assign({'Central Delhi':'Delhi','Central North Delhi':'Delhi','East Delhi':'Delhi','New Delhi':'Delhi','North Delhi':'Delhi','North East Delhi':'Delhi','North West Delhi':'Delhi','Old Delhi':'Delhi','Outer North Delhi':'Delhi','South Delhi':'Delhi','South East Delhi':'Delhi','South West Delhi':'Delhi','West Delhi':'Delhi','Anantnag':'Jammu and Kashmir','Bandipora':'Jammu and Kashmir','Baramulla':'Jammu and Kashmir','Budgam':'Jammu and Kashmir','Doda':'Jammu and Kashmir','Ganderbal':'Jammu and Kashmir','Jammu':'Jammu and Kashmir','Kathua':'Jammu and Kashmir','Kishtwar':'Jammu and Kashmir','Kulgam':'Jammu and Kashmir','Kupwara':'Jammu and Kashmir','Poonch':'Jammu and Kashmir','Pulwama':'Jammu and Kashmir','Rajouri':'Jammu and Kashmir','Ramban':'Jammu and Kashmir','Reasi':'Jammu and Kashmir','Samba':'Jammu and Kashmir','Shopian':'Jammu and Kashmir','Srinagar':'Jammu and Kashmir','Udhampur':'Jammu and Kashmir'},{'Puducherry':'Puducherry','Karaikal':'Puducherry','Mahe':'Puducherry','Yanam':'Puducherry','Nicobar':'Andaman and Nicobar Islands','North and Middle Andaman':'Andaman and Nicobar Islands','South Andaman':'Andaman and Nicobar Islands','Dadra and Nagar Haveli':'Dadra and Nagar Haveli and Daman and Diu','Daman':'Dadra and Nagar Haveli and Daman and Diu','Diu':'Dadra and Nagar Haveli and Daman and Diu','Leh':'Ladakh','Kargil':'Ladakh','Sham':'Ladakh','Nubra':'Ladakh','Changthang':'Ladakh','Zanskar':'Ladakh','Drass':'Ladakh','Sankoo':'Ladakh','Bitra':'Lakshadweep','Chetlat':'Lakshadweep','Kiltan':'Lakshadweep','Kadmat':'Lakshadweep','Amini':'Lakshadweep','Agatti':'Lakshadweep','Kavaratti':'Lakshadweep','Androth':'Lakshadweep','Kalpeni':'Lakshadweep','Minicoy':'Lakshadweep','Chandigarh':'Chandigarh'}),
      aliases:{
        'Poonch':['Punch'],'Shopian':['Shopiyan'],'Budgam':['Badgam'],'Bandipora':['Bandipore'],'Baramulla':['Baramula'],'Rajouri':['Rajauri'],'Anantnag':['Islamabad'],'Central Delhi':['Central'],'East Delhi':['East'],'North Delhi':['North'],'South Delhi':['South'],'West Delhi':['West'],
        'Puducherry':['Pondicherry','Pondicherry District'],'Karaikal':['Karikal'],'Mahe':['Mahé'],'Yanam':['Yanaon'],
        'Nicobar':['Nicobars','Nicobar Islands'],'North and Middle Andaman':['North Middle Andaman','North Andaman','Middle Andaman','North and Middle Andaman Islands','Middle and North Andaman'],'South Andaman':['South Andamans'],
        'Dadra and Nagar Haveli':['Dadra','Nagar Haveli','Dadra Nagar Haveli','DNH'],'Daman':['Daman District'],'Diu':['Diu District'],
        'Leh':['Leh Ladakh','Leh (Ladakh)'],'Drass':['Dras'],'Sankoo':['Sanku'],'Changthang':['Changtang'],'Nubra':['Nubra Valley'],'Androth':['Andrott','Androth Island'],'Kiltan':['Keltan','Kiltan Island'],'Kavaratti':['Kavaratti Island'],'Minicoy':['Maliku','Minicoy Island'],'Kalpeni':['Kalpeni Island'],'Amini':['Amini Island'],'Agatti':['Agatti Island'],'Kadmat':['Kadmat Island','Cadmat'],'Chetlat':['Chetlat Island','Chetlath'],'Bitra':['Bitra Island']
      }
    }
  };
  // Ladakh's 8 districts (Wikipedia): Leh, Kargil, Sham, Nubra, Changthang, Zanskar, Drass, Sankoo. Approximate outlines [lon,lat], cut from the open Leh/Kargil boundaries. Parts of Gilgit-Baltistan/Aksai Chin that the data attaches to Leh are included in Nubra/Changthang.
  const LADAKH_DISTRICTS = {"Nubra":[[[[75.9345,34.624],[75.894,34.545],[75.79,34.4995],[75.5995,34.5015],[75.5565,34.494],[75.5085,34.4565],[75.494,34.412],[75.467,34.3835],[75.3845,34.357],[75.378,34.3875],[75.3655,34.3925],[75.3725,34.4065],[75.3195,34.435],[75.3575,34.53],[75.3015,34.589],[75.256,34.606],[75.239,34.628],[75.1315,34.6465],[75.078,34.6385],[75.061,34.6265],[75.0205,34.626],[74.925,34.6635],[74.8645,34.663],[74.849,34.6745],[74.833,34.6635],[74.733,34.6715],[74.651,34.697],[74.6065,34.7265],[74.5935,34.757],[74.5715,34.768],[74.319,34.786],[74.396,34.804],[74.414,34.7995],[74.457,34.8525],[74.505,34.8635],[74.53,34.857],[74.568,34.873],[74.577,34.9105],[74.5715,34.9655],[74.587,35.0095],[74.5355,35.031],[74.5415,35.0665],[74.4985,35.1065],[74.4395,35.118],[74.38,35.0575],[74.308,35.06],[74.2975,35.0445],[74.269,35.0355],[74.2535,35.0375],[74.2495,35.067],[74.227,35.067],[74.2225,35.0865],[74.152,35.0935],[74.11,35.13],[74.1135,35.1515],[74.0385,35.147],[74.0085,35.1655],[73.999,35.184],[73.9585,35.1735],[73.9165,35.2115],[73.8645,35.21],[73.846,35.229],[73.7955,35.245],[73.731,35.2165],[73.7155,35.2255],[73.7265,35.278],[73.6995,35.323],[73.6995,35.3575],[73.738,35.4275],[73.794,35.46],[73.784,35.525],[73.7345,35.536],[73.7195,35.553],[73.6715,35.551],[73.6345,35.5715],[73.57,35.5545],[73.481,35.5765],[73.406,35.5635],[73.3665,35.605],[73.272,35.629],[73.215,35.6745],[73.135,35.7185],[73.135,35.7935],[73.1535,35.841],[73.0885,35.883],[73.075,35.885],[73.037,35.854],[72.999,35.863],[72.929,35.845],[72.904,35.853],[72.901,35.8815],[72.857,35.877],[72.8295,35.887],[72.8245,35.874],[72.7985,35.867],[72.7975,35.855],[72.7765,35.8435],[72.7365,35.858],[72.6905,35.832],[72.6445,35.8655],[72.601,35.8705],[72.569,35.9065],[72.533,35.9165],[72.5305,35.952],[72.548,35.962],[72.5555,35.996],[72.5725,35.996],[72.5955,36.027],[72.585,36.05],[72.5495,36.056],[72.5305,36.074],[72.536,36.1135],[72.573,36.15],[72.5505,36.1805],[72.5595,36.212],[72.5845,36.23],[72.5945,36.262],[72.636,36.276],[72.6935,36.2495],[72.6915,36.275],[72.778,36.3095],[72.8285,36.3605],[72.883,36.3865],[72.8895,36.424],[72.879,36.4425],[72.9215,36.4625],[72.943,36.458],[72.962,36.467],[72.991,36.4575],[73.0035,36.4755],[72.9895,36.4795],[72.995,36.5145],[73.061,36.537],[73.1115,36.6095],[73.091,36.6345],[73.0845,36.699],[73.1255,36.686],[73.1885,36.721],[73.2145,36.6995],[73.252,36.7085],[73.314,36.706],[73.36,36.7145],[73.3715,36.7345],[73.399,36.7315],[73.441,36.7445],[73.543,36.7085],[73.5995,36.7195],[73.6065,36.698],[73.6325,36.6895],[73.654,36.6955],[73.7,36.6845],[73.7245,36.7095],[73.7825,36.7015],[73.8085,36.716],[73.8835,36.6985],[73.901,36.7065],[73.899,36.749],[73.8625,36.7875],[73.8285,36.789],[73.8055,36.8145],[73.723,36.834],[73.7185,36.8565],[73.6805,36.885],[73.689,36.9115],[73.7445,36.8955],[73.767,36.904],[73.809,36.896],[73.817,36.885],[73.848,36.899],[73.878,36.8935],[73.9125,36.871],[73.937,36.8735],[73.9935,36.826],[74.0255,36.826],[74.055,36.8055],[74.0915,36.838],[74.12,36.832],[74.142,36.8395],[74.168,36.902],[74.26,36.886],[74.368,36.958],[74.415,36.9725],[74.4295,36.9895],[74.5315,36.986],[74.554,36.953],[74.5775,36.948],[74.5855,37.0445],[74.658,37.057],[74.708,37.077],[74.7335,37.02],[74.7515,37.011],[74.7775,37.029],[74.8395,37.022],[74.8455,36.9895],[74.921,36.9055],[74.94,36.934],[75.018,36.976],[75.095,36.942],[75.15,36.9665],[75.208,37.036],[75.264,37.051],[75.3425,37.0515],[75.3505,36.9805],[75.375,36.9595],[75.4,36.9675],[75.4215,36.96],[75.426,36.9385],[75.4075,36.9165],[75.413,36.8915],[75.4425,36.8865],[75.473,36.81],[75.615,36.761],[75.674,36.6955],[75.747,36.588],[75.768,36.5725],[75.848,36.544],[75.9225,36.502],[76.076,36.4735],[76.172,36.3895],[76.1975,36.3865],[76.254,36.347],[76.3515,36.3595],[76.431,36.308],[76.4485,36.269],[76.432,36.2505],[76.456,36.24],[76.4805,36.211],[76.5435,36.192],[76.5615,36.1725],[76.6,36.165],[76.6435,36.1835],[76.7025,36.1285],[76.7185,36.083],[76.8005,36.0475],[76.8065,36.018],[76.7685,36.009],[76.7215,35.953],[76.778,35.898],[76.8105,35.8445],[76.8565,35.8305],[76.894,35.7995],[76.9335,35.7835],[77.0195,35.774],[77.079,35.797],[77.1145,35.7975],[77.142,35.769],[77.163,35.766],[77.166,35.734],[77.22,35.7275],[77.2265,35.712],[77.2665,35.7085],[77.276,35.72],[77.314,35.699],[77.326,35.7185],[77.357,35.717],[77.4005,35.662],[77.4295,35.654],[77.4355,35.6215],[77.4255,35.61],[77.4555,35.593],[77.464,35.573],[77.4595,35.547],[77.485,35.5315],[77.471,35.5205],[77.4505,35.526],[77.4345,35.517],[77.377,35.5495],[77.3195,35.532],[77.3475,35.493],[77.4385,35.4615],[77.5115,35.488],[77.5675,35.4845],[77.613,35.4695],[77.6435,35.4885],[77.671,35.47],[77.722,35.475],[77.723,35.515],[77.732,35.524],[77.771,35.4945],[77.817,35.5125],[77.863,35.4805],[77.8855,35.4845],[77.9,35.4675],[77.9205,35.494],[77.981,35.455],[77.983,35.4645],[77.964,35.4785],[77.9635,35.4955],[77.93,35.5155],[77.9655,35.571],[77.951,35.6065],[77.9895,35.5815],[78.0405,35.587],[78.05,35.577],[78.043,35.536],[78.012,35.4965],[78.015,35.4665],[77.9775,35.3905],[77.929,35.3945],[77.897,35.381],[77.8825,35.3575],[77.884,35.3445],[77.874,35.3515],[77.859,35.349],[77.858,35.3335],[77.913,35.292],[77.9535,35.203],[77.995,35.148],[78.054,35.093],[78.055,35.0465],[78.0695,35.0175],[78.1105,34.989],[78.1355,34.932],[78.1625,34.889],[78.2035,34.85],[78.166,34.8245],[78.1445,34.777],[78.08,34.758],[78.0545,34.725],[78.023,34.7295],[77.9965,34.713],[77.9845,34.6725],[78.0035,34.5835],[78.001,34.5515],[77.9345,34.423],[77.8805,34.4125],[77.862,34.385],[77.869,34.3465],[77.9115,34.298],[77.86,34.3365],[77.758,34.431],[77.7105,34.461],[77.7095,34.4315],[77.731,34.353],[77.717,34.3025],[77.7135,34.2435],[77.7075,34.2295],[77.663,34.1985],[77.6435,34.159],[77.5325,34.288],[77.4985,34.401],[77.4515,34.4535],[77.427,34.472],[77.4095,34.4785],[77.401,34.4735],[77.3995,34.4395],[77.386,34.444],[77.2095,34.548],[77.12,34.578],[77.052,34.5745],[77.0305,34.581],[76.9245,34.6425],[76.8485,34.676],[76.823,34.678],[76.8085,34.671],[76.792,34.639],[76.72,34.6855],[76.6975,34.6905],[76.684,34.684],[76.6795,34.666],[76.6885,34.597],[76.68,34.588],[76.5765,34.6145],[76.557,34.6155],[76.547,34.6115],[76.5435,34.602],[76.5105,34.646],[76.4365,34.7135],[76.417,34.721],[76.377,34.7185],[76.334,34.7255],[76.1775,34.7995],[76.1585,34.793],[76.1515,34.7685],[76.142,34.7675],[76.0655,34.7925],[76.013,34.8],[75.9975,34.7835],[75.994,34.762],[76.0,34.725],[75.973,34.734],[75.9345,34.624]]]],"Changthang":[[[[77.2925,33.0365],[77.3145,33.0325],[77.3165,33.043],[77.337,33.048],[77.3395,33.085],[77.3645,33.078],[77.4085,33.084],[77.419,33.134],[77.403,33.17],[77.42,33.197],[77.469,33.1995],[77.5385,33.156],[77.5215,33.2175],[77.477,33.274],[77.5005,33.2995],[77.4985,33.329],[77.5085,33.343],[77.543,33.359],[77.536,33.374],[77.493,33.389],[77.4995,33.4115],[77.4795,33.42],[77.443,33.4925],[77.397,33.491],[77.3615,33.4745],[77.3375,33.491],[77.3005,33.485],[77.278,33.506],[77.364,33.523],[77.428,33.5175],[77.541,33.521],[77.632,33.509],[77.707,33.488],[77.7545,33.4885],[77.79,33.508],[77.8165,33.54],[77.823,33.563],[77.8245,33.648],[77.832,33.6655],[77.8465,33.6705],[77.879,33.655],[77.8955,33.6605],[77.929,33.76],[77.9335,33.783],[77.9145,33.8325],[77.916,33.8605],[77.9285,33.8735],[77.9075,33.8875],[77.894,33.9135],[77.9,33.933],[77.918,33.9335],[77.9325,33.919],[77.935,33.9835],[77.928,33.9995],[77.89,34.0385],[77.885,34.0615],[77.892,34.0715],[77.8575,34.085],[77.84,34.111],[77.845,34.1305],[77.867,34.1295],[77.8895,34.108],[77.8875,34.156],[77.899,34.2],[77.887,34.2385],[77.8925,34.266],[77.9115,34.298],[77.869,34.3465],[77.862,34.385],[77.8805,34.4125],[77.9345,34.423],[78.001,34.5515],[78.0035,34.5835],[77.9845,34.6725],[77.9965,34.713],[78.023,34.7295],[78.0545,34.725],[78.08,34.758],[78.1445,34.777],[78.166,34.8245],[78.2035,34.85],[78.1625,34.889],[78.1355,34.932],[78.1105,34.989],[78.0695,35.0175],[78.055,35.0465],[78.054,35.093],[77.995,35.148],[77.9535,35.203],[77.913,35.292],[77.858,35.3335],[77.859,35.349],[77.874,35.3515],[77.884,35.3445],[77.8825,35.3575],[77.897,35.381],[77.929,35.3945],[77.9775,35.3905],[78.015,35.4665],[78.012,35.4965],[78.043,35.536],[78.05,35.577],[78.0765,35.5485],[78.091,35.556],[78.136,35.5385],[78.1555,35.552],[78.15,35.5775],[78.165,35.613],[78.161,35.629],[78.1845,35.6235],[78.198,35.6685],[78.2535,35.6455],[78.2705,35.6685],[78.272,35.7215],[78.3375,35.72],[78.385,35.735],[78.422,35.7845],[78.52,35.7635],[78.5595,35.792],[78.5735,35.7895],[78.579,35.8075],[78.618,35.8165],[78.6635,35.857],[78.767,35.869],[78.8225,35.8555],[78.938,35.879],[78.959,35.892],[79.02,35.8485],[79.131,35.836],[79.1925,35.8865],[79.1885,35.947],[79.214,35.9785],[79.3765,35.995],[79.3855,35.99],[79.4015,35.918],[79.4205,35.896],[79.5165,35.8835],[79.5585,35.8615],[79.7105,35.819],[79.736,35.8015],[79.8695,35.7825],[79.9285,35.827],[79.9705,35.8405],[79.9975,35.8375],[80.037,35.7995],[80.0565,35.7495],[80.087,35.7245],[80.1065,35.6805],[80.2355,35.6415],[80.29,35.607],[80.3265,35.4695],[80.296,35.4605],[80.2795,35.4405],[80.2815,35.3875],[80.2695,35.344],[80.2345,35.2765],[80.224,35.2195],[80.1815,35.166],[80.1845,35.063],[80.173,35.002],[80.122,34.8935],[80.0715,34.828],[80.067,34.7145],[79.943,34.6805],[79.859,34.6885],[79.815,34.643],[79.7745,34.6275],[79.791,34.589],[79.7695,34.582],[79.7565,34.554],[79.809,34.531],[79.813,34.4995],[79.7925,34.485],[79.6605,34.4795],[79.5915,34.5005],[79.5695,34.4865],[79.507,34.474],[79.526,34.445],[79.5265,34.4175],[79.56,34.4095],[79.5525,34.3875],[79.558,34.3325],[79.5905,34.2825],[79.584,34.244],[79.5705,34.2225],[79.543,34.207],[79.518,34.2125],[79.506,34.2055],[79.488,34.157],[79.493,34.1355],[79.4185,34.0775],[79.413,34.0545],[79.436,34.028],[79.4255,34.017],[79.354,34.0365],[79.1965,34.051],[79.1695,34.0725],[79.15,34.068],[79.1345,34.027],[79.1115,34.0195],[79.0605,34.0285],[79.0205,34.0505],[78.9505,34.0285],[78.9045,33.976],[78.947,33.9205],[78.942,33.9085],[78.999,33.803],[79.018,33.7985],[79.0155,33.7785],[79.033,33.7835],[79.0455,33.766],[79.0585,33.78],[79.0665,33.756],[79.0415,33.7495],[79.0195,33.7055],[79.0525,33.678],[79.0895,33.6865],[79.089,33.6565],[79.1055,33.6165],[79.0465,33.6275],[78.988,33.6105],[78.9205,33.633],[78.913,33.6275],[78.914,33.5745],[78.9415,33.509],[78.93,33.4735],[78.932,33.4325],[78.9485,33.408],[78.9525,33.3805],[78.9675,33.375],[78.9875,33.333],[79.0165,33.335],[79.1095,33.292],[79.239,33.2975],[79.3145,33.273],[79.3685,33.282],[79.4535,33.2585],[79.445,33.2055],[79.376,33.0845],[79.392,33.036],[79.3305,33.012],[79.3825,32.989],[79.384,32.968],[79.4205,32.9615],[79.5665,32.7865],[79.5855,32.774],[79.602,32.777],[79.6255,32.739],[79.514,32.608],[79.4685,32.576],[79.447,32.532],[79.4055,32.5295],[79.393,32.572],[79.319,32.5925],[79.2935,32.55],[79.2725,32.532],[79.2495,32.5335],[79.2365,32.5055],[79.194,32.4825],[79.1355,32.4765],[79.1295,32.466],[79.145,32.4425],[79.143,32.4225],[79.124,32.4135],[79.1135,32.384],[79.032,32.3855],[79.0135,32.377],[78.98,32.3375],[78.9605,32.366],[78.9025,32.3925],[78.8575,32.44],[78.826,32.4385],[78.775,32.558],[78.775,32.573],[78.7955,32.598],[78.761,32.655],[78.7665,32.6975],[78.7215,32.661],[78.661,32.654],[78.638,32.6095],[78.6195,32.5965],[78.572,32.6175],[78.5345,32.6085],[78.4985,32.581],[78.4585,32.5795],[78.4355,32.5615],[78.4265,32.5315],[78.3985,32.5255],[78.3265,32.472],[78.295,32.504],[78.315,32.5255],[78.313,32.5735],[78.3485,32.581],[78.405,32.6195],[78.3875,32.6345],[78.3795,32.668],[78.3945,32.7155],[78.3875,32.757],[78.3565,32.7575],[78.3045,32.7345],[78.3125,32.709],[78.253,32.691],[78.246,32.6715],[78.2195,32.6645],[78.1425,32.682],[78.1475,32.6545],[78.111,32.6625],[78.0925,32.648],[78.0985,32.63],[78.087,32.624],[78.061,32.626],[78.0465,32.645],[78.016,32.6195],[77.97,32.647],[77.971,32.655],[77.9465,32.6615],[77.9185,32.691],[77.9345,32.726],[77.926,32.772],[77.904,32.7715],[77.884,32.788],[77.8885,32.7985],[77.8695,32.827],[77.839,32.842],[77.826,32.8365],[77.7805,32.8655],[77.7895,32.8905],[77.811,32.9065],[77.741,32.969],[77.72,32.969],[77.713,32.9825],[77.6825,32.9885],[77.674,32.9605],[77.602,32.943],[77.596,32.9275],[77.539,32.887],[77.513,32.8775],[77.5015,32.8855],[77.469,32.8585],[77.452,32.864],[77.4445,32.88],[77.405,32.883],[77.374,32.8545],[77.373,32.8235],[77.339,32.8165],[77.3235,32.8505],[77.301,32.8495],[77.274,32.874],[77.318,32.8945],[77.2765,32.9945],[77.2925,33.0365]]]],"Leh":[[[[77.209,33.6205],[77.2075,33.6375],[77.15,33.6775],[77.13,33.6835],[77.1015,33.67],[77.055,33.7065],[77.021,33.7025],[76.985,33.7245],[76.9655,33.7115],[76.9405,33.7165],[76.901,33.742],[76.9135,33.7585],[76.8895,33.781],[76.8595,33.7745],[76.829,33.794],[76.759,33.805],[76.739,33.8305],[76.724,33.8225],[76.705,33.8525],[76.6535,33.9],[76.719,33.893],[76.7915,33.8705],[76.8085,33.879],[76.8795,33.8725],[76.9185,33.8945],[76.942,33.894],[77.0195,33.8635],[77.1845,33.7735],[77.207,33.7725],[77.2515,33.788],[77.2845,33.791],[77.327,33.785],[77.456,33.7485],[77.4755,33.754],[77.4695,33.7715],[77.477,33.785],[77.4575,33.805],[77.4555,33.8325],[77.4765,33.872],[77.408,33.9645],[77.3605,34.101],[77.3745,34.123],[77.405,34.137],[77.434,34.142],[77.447,34.152],[77.45,34.2305],[77.466,34.28],[77.501,34.3385],[77.4985,34.401],[77.5325,34.288],[77.6435,34.159],[77.663,34.1985],[77.7075,34.2295],[77.7135,34.2435],[77.717,34.3025],[77.731,34.353],[77.7075,34.453],[77.7105,34.461],[77.7285,34.453],[77.86,34.3365],[77.9115,34.298],[77.8925,34.266],[77.887,34.2385],[77.899,34.2],[77.8875,34.156],[77.8895,34.108],[77.867,34.1295],[77.845,34.1305],[77.84,34.111],[77.8575,34.085],[77.892,34.0715],[77.885,34.0615],[77.89,34.0385],[77.928,33.9995],[77.935,33.9835],[77.9325,33.919],[77.918,33.9335],[77.9,33.933],[77.894,33.9135],[77.9075,33.8875],[77.9285,33.8735],[77.916,33.8605],[77.9145,33.8325],[77.9335,33.783],[77.8955,33.6605],[77.879,33.655],[77.8465,33.6705],[77.832,33.6655],[77.8245,33.648],[77.823,33.563],[77.8165,33.54],[77.805,33.5225],[77.773,33.497],[77.733,33.485],[77.5845,33.518],[77.541,33.521],[77.428,33.5175],[77.364,33.523],[77.278,33.506],[77.2565,33.527],[77.234,33.5885],[77.239,33.6],[77.209,33.6205]]],[[[76.5995,33.869],[76.573,33.8645],[76.556,33.886],[76.528,33.892],[76.524,33.9],[76.5825,33.8895],[76.628,33.9],[76.5995,33.869]]]],"Sham":[[[[76.5105,34.646],[76.5435,34.602],[76.547,34.6115],[76.557,34.6155],[76.5765,34.6145],[76.68,34.588],[76.6885,34.597],[76.6795,34.666],[76.684,34.684],[76.6975,34.6905],[76.7465,34.671],[76.792,34.639],[76.8085,34.671],[76.823,34.678],[76.8485,34.676],[76.9245,34.6425],[77.0305,34.581],[77.052,34.5745],[77.12,34.578],[77.2095,34.548],[77.386,34.444],[77.3995,34.4395],[77.401,34.4735],[77.4095,34.4785],[77.4515,34.4535],[77.4985,34.401],[77.501,34.3385],[77.466,34.28],[77.45,34.2305],[77.447,34.152],[77.434,34.142],[77.405,34.137],[77.3745,34.123],[77.3605,34.101],[77.408,33.9645],[77.4765,33.872],[77.4555,33.8325],[77.4575,33.805],[77.477,33.785],[77.4695,33.7715],[77.4755,33.754],[77.456,33.7485],[77.327,33.785],[77.2845,33.791],[77.2515,33.788],[77.207,33.7725],[77.1845,33.7735],[77.0195,33.8635],[76.942,33.894],[76.9185,33.8945],[76.8795,33.8725],[76.8085,33.879],[76.7915,33.8705],[76.719,33.893],[76.6535,33.9],[76.646,33.907],[76.5825,33.8895],[76.524,33.9],[76.517,33.9155],[76.529,33.9345],[76.515,33.945],[76.554,34.003],[76.584,34.007],[76.58,34.0455],[76.6085,34.064],[76.661,34.0615],[76.688,34.0795],[76.662,34.1455],[76.682,34.178],[76.672,34.22],[76.676,34.238],[76.691,34.24],[76.7015,34.256],[76.703,34.305],[76.7235,34.3245],[76.625,34.3775],[76.59,34.415],[76.5635,34.4255],[76.5745,34.455],[76.557,34.488],[76.5495,34.5435],[76.561,34.5705],[76.53,34.5745],[76.525,34.5945],[76.4755,34.5755],[76.4525,34.5805],[76.473,34.6335],[76.4485,34.6585],[76.4455,34.6855],[76.421,34.7195],[76.4365,34.7135],[76.5105,34.646]]],[[[76.279,34.682],[76.2355,34.66],[76.216,34.676],[76.1335,34.663],[76.0435,34.6845],[76.0155,34.7195],[76.0,34.725],[75.994,34.762],[75.9975,34.7835],[76.013,34.8],[76.0655,34.7925],[76.142,34.7675],[76.1515,34.7685],[76.1585,34.793],[76.1775,34.7995],[76.334,34.7255],[76.377,34.7185],[76.419,34.72],[76.279,34.682]]]],"Zanskar":[[[[76.552,33.9995],[76.5435,33.9875],[76.569,33.968],[76.5885,33.9405],[76.5895,33.93],[76.569,33.9415],[76.536,33.976],[76.515,33.945],[76.529,33.9345],[76.517,33.9155],[76.528,33.892],[76.556,33.886],[76.573,33.8645],[76.5995,33.869],[76.622,33.8975],[76.646,33.907],[76.705,33.8525],[76.724,33.8225],[76.739,33.8305],[76.759,33.805],[76.829,33.794],[76.8595,33.7745],[76.8895,33.781],[76.9135,33.7585],[76.901,33.742],[76.9405,33.7165],[76.9655,33.7115],[76.985,33.7245],[77.021,33.7025],[77.055,33.7065],[77.1015,33.67],[77.13,33.6835],[77.15,33.6775],[77.2075,33.6375],[77.209,33.6205],[77.239,33.6],[77.234,33.5885],[77.2565,33.527],[77.3005,33.485],[77.3375,33.491],[77.3615,33.4745],[77.397,33.491],[77.443,33.4925],[77.4795,33.42],[77.4995,33.4115],[77.493,33.389],[77.536,33.374],[77.543,33.359],[77.5085,33.343],[77.4985,33.329],[77.5005,33.2995],[77.477,33.274],[77.5215,33.2175],[77.5385,33.156],[77.4545,33.204],[77.4195,33.196],[77.403,33.17],[77.419,33.134],[77.4085,33.084],[77.3645,33.078],[77.3395,33.085],[77.337,33.048],[77.3165,33.043],[77.3145,33.0325],[77.2925,33.0365],[77.2765,32.9945],[77.318,32.8945],[77.304,32.883],[77.2545,32.8635],[77.237,32.881],[77.2435,32.8925],[77.199,32.909],[77.188,32.929],[77.1705,32.9105],[77.157,32.9115],[77.1635,32.937],[77.161,32.953],[77.149,32.956],[77.1495,32.978],[77.1165,32.985],[77.111,32.9755],[77.086,32.9725],[77.0485,32.999],[77.01,32.989],[76.9925,33.0015],[76.9715,33.0005],[76.933,33.0285],[76.9055,33.079],[76.9095,33.094],[76.885,33.1215],[76.855,33.1145],[76.8445,33.1375],[76.8165,33.16],[76.8175,33.194],[76.8345,33.205],[76.8255,33.2155],[76.843,33.247],[76.831,33.2495],[76.82,33.236],[76.799,33.256],[76.7565,33.2485],[76.7375,33.261],[76.718,33.3285],[76.6965,33.328],[76.6705,33.342],[76.632,33.4095],[76.6285,33.435],[76.616,33.44],[76.5815,33.426],[76.569,33.466],[76.5495,33.4645],[76.509,33.499],[76.502,33.516],[76.459,33.534],[76.465,33.5455],[76.45,33.563],[76.436,33.5425],[76.415,33.5395],[76.3795,33.553],[76.381,33.5775],[76.3585,33.6035],[76.308,33.6095],[76.3,33.5985],[76.31,33.5715],[76.26,33.565],[76.2455,33.5455],[76.2245,33.5475],[76.205,33.569],[76.2255,33.5775],[76.2315,33.587],[76.224,33.6005],[76.2405,33.605],[76.2295,33.63],[76.2705,33.6435],[76.2845,33.661],[76.266,33.68],[76.2655,33.7465],[76.239,33.772],[76.201,33.7755],[76.17,33.795],[76.1395,33.8485],[76.0975,33.8765],[76.0475,33.929],[76.032,33.972],[76.0525,33.982],[76.1065,34.03],[76.143,34.0525],[76.2125,34.079],[76.278,34.096],[76.3325,34.0895],[76.4195,34.066],[76.47,34.041],[76.5315,33.997],[76.552,33.9995]]]],"Kargil":[[[[75.973,34.734],[76.0155,34.7195],[76.0435,34.6845],[76.1335,34.663],[76.216,34.676],[76.2355,34.66],[76.279,34.682],[76.4205,34.7205],[76.4455,34.6855],[76.4485,34.6585],[76.473,34.6335],[76.4525,34.5805],[76.4755,34.5755],[76.525,34.5945],[76.53,34.5745],[76.561,34.5705],[76.5495,34.5435],[76.557,34.488],[76.5745,34.455],[76.5635,34.4255],[76.59,34.415],[76.625,34.3775],[76.7235,34.3245],[76.703,34.305],[76.7015,34.256],[76.691,34.24],[76.676,34.238],[76.672,34.22],[76.682,34.178],[76.662,34.1455],[76.688,34.0795],[76.661,34.0615],[76.6125,34.064],[76.614,34.0755],[76.664,34.153],[76.6605,34.171],[76.596,34.242],[76.551,34.3245],[76.54,34.332],[76.4935,34.3355],[76.4745,34.324],[76.452,34.2655],[76.4325,34.261],[76.309,34.2925],[76.2635,34.2985],[76.225,34.2955],[76.1505,34.262],[76.1255,34.261],[76.058,34.2865],[75.8415,34.4005],[75.7945,34.417],[75.764,34.418],[75.756,34.4375],[75.7705,34.4495],[75.8075,34.445],[75.819,34.4705],[75.8485,34.4945],[75.9045,34.5195],[75.9125,34.5355],[75.92,34.5955],[75.973,34.734]]]],"Sankoo":[[[[75.9805,33.979],[75.9435,33.987],[75.864,33.9785],[75.8565,33.9695],[75.862,34.0175],[75.8195,34.0455],[75.8,34.0425],[75.773,34.0555],[75.748,34.097],[75.7095,34.12],[75.7265,34.1225],[75.7525,34.137],[75.771,34.1735],[75.7785,34.1755],[75.7625,34.2275],[75.775,34.236],[75.7625,34.247],[75.765,34.266],[75.784,34.28],[75.8025,34.284],[75.7625,34.358],[75.7585,34.398],[75.764,34.418],[75.7945,34.417],[75.8415,34.4005],[76.058,34.2865],[76.1255,34.261],[76.1505,34.262],[76.225,34.2955],[76.2635,34.2985],[76.309,34.2925],[76.4325,34.261],[76.452,34.2655],[76.4745,34.324],[76.4935,34.3355],[76.54,34.332],[76.551,34.3245],[76.596,34.242],[76.6605,34.171],[76.664,34.153],[76.652,34.128],[76.614,34.0755],[76.612,34.058],[76.621,34.0265],[76.603,33.978],[76.5895,33.967],[76.569,33.968],[76.442,34.057],[76.3045,34.095],[76.254,34.092],[76.143,34.0525],[76.1065,34.03],[76.0525,33.982],[76.032,33.972],[76.0225,33.9975],[75.979,34.002],[75.9805,33.979]]]],"Drass":[[[[75.6915,34.231],[75.6755,34.228],[75.655,34.243],[75.595,34.1985],[75.58,34.2145],[75.555,34.2115],[75.497,34.2335],[75.4745,34.281],[75.4135,34.283],[75.3935,34.295],[75.3975,34.3205],[75.377,34.3485],[75.467,34.3835],[75.494,34.412],[75.5085,34.4565],[75.5565,34.494],[75.5995,34.5015],[75.79,34.4995],[75.894,34.545],[75.92,34.5955],[75.9125,34.5355],[75.9045,34.5195],[75.8485,34.4945],[75.819,34.4705],[75.8075,34.445],[75.7705,34.4495],[75.756,34.4375],[75.7575,34.4255],[75.7645,34.422],[75.7585,34.398],[75.7625,34.358],[75.8025,34.284],[75.784,34.28],[75.765,34.266],[75.7625,34.247],[75.775,34.236],[75.7625,34.2275],[75.7785,34.1755],[75.771,34.1735],[75.7525,34.137],[75.7265,34.1225],[75.7095,34.12],[75.687,34.159],[75.699,34.215],[75.6915,34.231]]]]};
  // Delhi's 13 revenue districts (from 1 Jan 2026): approximate outlines, a Voronoi-style partition of the Delhi boundary around each district's core area, then roughened to look like real boundaries.
  const DELHI_DISTRICTS = {"Outer North Delhi":[[[[76.9445,28.754],[76.956,28.7675],[76.9535,28.791],[76.942,28.7985],[76.9515,28.818],[76.9675,28.8125],[76.9665,28.827],[76.9795,28.8215],[76.994,28.8385],[76.997,28.839],[77.04,28.832],[77.058,28.868],[77.0745,28.8675],[77.0825,28.8835],[77.121,28.8585],[77.1405,28.862],[77.137,28.855],[77.1325,28.8485],[77.1245,28.8395],[77.1175,28.834],[77.1155,28.83],[77.1075,28.795],[77.1005,28.7695],[77.058,28.7555],[76.965,28.73],[76.96,28.7265],[76.9555,28.719],[76.95,28.7155],[76.96,28.733],[76.9445,28.754]]]],"South West Delhi":[[[[77.0465,28.5165],[77.007,28.541],[77.0005,28.532],[77.016,28.5215],[77.0105,28.5145],[76.978,28.5215],[76.95,28.5045],[76.908,28.514],[76.8845,28.503],[76.8795,28.505],[76.887,28.5205],[76.8455,28.55],[76.8395,28.5825],[76.864,28.586],[76.8885,28.632],[76.906,28.624],[76.9205,28.6315],[76.9345,28.6185],[76.9435,28.628],[76.925,28.65],[76.935,28.6675],[76.9535,28.667],[76.9575,28.674],[76.9605,28.6725],[76.96,28.6705],[76.965,28.666],[77.017,28.6245],[77.073,28.573],[77.1135,28.5425],[77.1085,28.5235],[77.1065,28.5205],[77.0965,28.5135],[77.0945,28.5105],[77.0805,28.518],[77.0465,28.5165]]]],"South Delhi":[[[[77.233,28.458],[77.246,28.453],[77.249,28.4295],[77.2305,28.416],[77.224,28.413],[77.206,28.41],[77.1845,28.4105],[77.1745,28.4045],[77.166,28.426],[77.1235,28.4455],[77.111,28.4715],[77.119,28.489],[77.1205,28.496],[77.0945,28.5105],[77.0965,28.5135],[77.1065,28.5205],[77.1085,28.5235],[77.1135,28.5425],[77.117,28.5465],[77.226,28.545],[77.254,28.504],[77.255,28.4995],[77.2525,28.486],[77.253,28.4825],[77.2435,28.479],[77.233,28.458]]]],"Central North Delhi":[[[[77.203,28.7375],[77.206,28.725],[77.1945,28.7045],[77.1845,28.683],[77.1325,28.65],[77.119,28.6735],[77.1195,28.7165],[77.1205,28.741],[77.203,28.7375]]]],"North West Delhi":[[[[76.9485,28.713],[76.95,28.7155],[76.9555,28.719],[76.962,28.7285],[76.9685,28.731],[77.058,28.7555],[77.1005,28.7695],[77.1205,28.741],[77.1195,28.7165],[77.119,28.6735],[77.097,28.6725],[77.073,28.672],[76.965,28.676],[76.9625,28.6755],[76.9605,28.6725],[76.9575,28.674],[76.972,28.6975],[76.9485,28.713]]]],"West Delhi":[[[[77.073,28.573],[77.017,28.6245],[76.962,28.6685],[76.96,28.672],[76.9615,28.674],[76.9625,28.6755],[76.965,28.676],[77.073,28.672],[77.097,28.6725],[77.119,28.6735],[77.1325,28.65],[77.1325,28.6025],[77.1255,28.579],[77.117,28.5465],[77.1135,28.5425],[77.073,28.573]]]],"North Delhi":[[[[77.239,28.76],[77.236,28.7585],[77.22,28.762],[77.216,28.761],[77.203,28.7375],[77.1205,28.741],[77.1005,28.7695],[77.1075,28.795],[77.1155,28.83],[77.1175,28.834],[77.1245,28.8395],[77.1325,28.8485],[77.137,28.855],[77.1405,28.862],[77.1425,28.839],[77.157,28.8365],[77.1755,28.8585],[77.216,28.8525],[77.2225,28.8315],[77.219,28.8085],[77.2015,28.8125],[77.2025,28.793],[77.234,28.784],[77.222,28.7775],[77.2355,28.761],[77.239,28.76]]]],"Central Delhi":[[[[77.209,28.6505],[77.221,28.633],[77.1825,28.621],[77.1325,28.6025],[77.1325,28.65],[77.1845,28.683],[77.209,28.6505]]]],"North East Delhi":[[[[77.2605,28.734],[77.2765,28.7355],[77.291,28.7225],[77.2895,28.7075],[77.331,28.713],[77.323,28.6985],[77.3265,28.693],[77.3225,28.6925],[77.308,28.7],[77.3,28.7],[77.278,28.6935],[77.2595,28.687],[77.239,28.703],[77.206,28.725],[77.203,28.7375],[77.216,28.761],[77.22,28.762],[77.236,28.7585],[77.239,28.76],[77.2565,28.7565],[77.2605,28.734]]]],"Old Delhi":[[[[77.1945,28.7045],[77.206,28.725],[77.239,28.703],[77.2595,28.687],[77.254,28.6195],[77.221,28.633],[77.209,28.6505],[77.1845,28.683],[77.1945,28.7045]]]],"New Delhi":[[[[77.1825,28.621],[77.221,28.633],[77.254,28.6195],[77.26,28.608],[77.237,28.567],[77.226,28.545],[77.117,28.5465],[77.1255,28.579],[77.1325,28.6025],[77.1825,28.621]]]],"East Delhi":[[[[77.3235,28.6765],[77.316,28.6415],[77.3425,28.622],[77.342,28.6095],[77.3135,28.5965],[77.308,28.5865],[77.3045,28.588],[77.291,28.6],[77.26,28.608],[77.254,28.6195],[77.2595,28.687],[77.289,28.697],[77.3,28.7],[77.304,28.7005],[77.308,28.7],[77.3225,28.6925],[77.3265,28.693],[77.333,28.682],[77.3235,28.6765]]]],"South East Delhi":[[[[77.3475,28.5205],[77.337,28.5055],[77.314,28.4835],[77.2905,28.4965],[77.253,28.4825],[77.2525,28.486],[77.255,28.4995],[77.254,28.504],[77.226,28.545],[77.237,28.567],[77.26,28.608],[77.291,28.6],[77.3045,28.588],[77.308,28.5865],[77.297,28.566],[77.3475,28.5205]]]]};
  function lkSubdivisions(feats) { // group Lakshadweep's island polygons into the 10 sub-divisions by nearest island centre
    const items=[], seen=new Set();
    feats.forEach(f=>polysOf(f.geometry).forEach(poly=>{
      const r=poly[0], cx=r.reduce((a,p)=>a+p[0],0)/r.length, cy=r.reduce((a,p)=>a+p[1],0)/r.length;
      let bi=0, bd=Infinity; LK_ISLANDS.forEach(([la,lo],i)=>{const d=d3.geoDistance([cx,cy],[lo,la]); if (d<bd){bd=d;bi=i;}});
      seen.add(bi); items.push({name:LK_NAMES[bi],geometry:{type:'Polygon',coordinates:poly}});
    }));
    LK_ISLANDS.forEach(([la,lo],i)=>{ if (!seen.has(i)) { const e=0.012; items.push({name:LK_NAMES[i],geometry:{type:'Polygon',coordinates:[[[lo-e,la-e],[lo+e,la-e],[lo+e,la+e],[lo-e,la+e],[lo-e,la-e]]]}}); } });
    return items;
  }
  // Districts created after the open boundary data (2022 file) was made. For each, the parent district is replaced by two simplified outlines (new district + remainder), cut along approximate lines. Skipped automatically if the data already has the new district.
  // Karnataka: Vijayanagara (from Ballari) · Tamil Nadu: Mayiladuthurai (from Nagapattinam) · Andhra Pradesh: Polavaram (from Alluri Sitharama Raju), Markapuram (from Prakasam) · Sikkim: Pakyong (from Gangtok/East), Soreng (from Gyalshing/West)
  const DISTRICT_PATCHES = {"Karnataka":[{"parent":"Ballari","geoms":{"Vijayanagara":[[[[76.678,14.887],[76.6975,14.888],[76.7135,14.8655],[76.7115,14.8375],[76.742,14.8185],[76.7045,14.818],[76.6675,14.794],[76.667,14.775],[76.649,14.7565],[76.645,14.713],[76.6085,14.6875],[76.6105,14.669],[76.598,14.6695],[76.5975,14.6535],[76.612,14.6485],[76.596,14.631],[76.601,14.621],[76.585,14.6175],[76.5675,14.5875],[76.5345,14.561],[76.511,14.5605],[76.505,14.5655],[76.424,14.5815],[76.432,14.6185],[76.3935,14.627],[76.39,14.6485],[76.3745,14.6465],[76.3795,14.662],[76.343,14.666],[76.3355,14.6865],[76.3335,14.6875],[76.2795,14.685],[76.263,14.6965],[76.255,14.697],[76.2305,14.6495],[76.184,14.7005],[76.201,14.739],[76.1925,14.7685],[76.181,14.764],[76.169,14.7855],[76.1495,14.784],[76.143,14.793],[76.1465,14.8235],[76.1605,14.83],[76.1945,14.821],[76.191,14.8465],[76.1595,14.847],[76.155,14.861],[76.1305,14.861],[76.129,14.869],[76.0725,14.869],[76.0665,14.884],[76.0845,14.9135],[76.051,14.916],[76.045,14.9305],[76.013,14.896],[76.0105,14.9055],[75.997,14.898],[75.9845,14.9085],[75.977,14.8985],[75.966,14.9085],[75.873,14.868],[75.869,14.8545],[75.8535,14.8635],[75.854,14.8835],[75.832,14.8835],[75.816,14.9],[75.8015,14.869],[75.8095,14.8375],[75.8145,14.832],[75.818,14.8345],[75.834,14.81],[75.825,14.779],[75.7985,14.769],[75.773,14.792],[75.7595,14.775],[75.7565,14.7395],[75.759,14.734],[75.739,14.73],[75.718,14.7195],[75.7045,14.725],[75.7225,14.772],[75.692,14.7825],[75.664,14.807],[75.69,14.857],[75.7125,14.8525],[75.733,14.8635],[75.739,14.8875],[75.728,14.8975],[75.696,14.892],[75.683,14.94],[75.6915,14.943],[75.701,14.9485],[75.7085,14.9475],[75.7205,14.951],[75.741,14.9455],[75.779,14.977],[75.785,15.0025],[75.8075,15.0245],[75.833,15.0285],[75.846,15.045],[75.874,15.0355],[75.884,15.0525],[75.9045,15.059],[75.909,15.077],[75.8845,15.1075],[75.9025,15.132],[75.928,15.142],[75.9525,15.1385],[75.9785,15.153],[76.0355,15.145],[76.0465,15.1485],[76.057,15.157],[76.094,15.1625],[76.1115,15.199],[76.156,15.196],[76.16,15.215],[76.1875,15.235],[76.231,15.2315],[76.219,15.1965],[76.249,15.1905],[76.2575,15.2065],[76.2915,15.223],[76.303,15.2555],[76.334,15.2635],[76.364,15.3285],[76.4045,15.3255],[76.477,15.3495],[76.4935,15.345],[76.5,15.3505],[76.4995,15.332],[76.502,15.321],[76.516,15.2895],[76.5145,15.284],[76.505,15.2675],[76.504,15.26],[76.5065,15.226],[76.5,15.1855],[76.508,15.117],[76.523,15.0935],[76.542,15.055],[76.557,15.031],[76.574,15.011],[76.608,14.979],[76.651,14.9195],[76.6775,14.895],[76.678,14.887]]]],"Ballari":[[[[76.8345,15.628],[76.8575,15.6425],[76.8895,15.685],[76.917,15.6995],[76.943,15.762],[76.996,15.8055],[77.0255,15.8375],[77.0655,15.8275],[77.0675,15.7875],[77.046,15.7405],[77.049,15.7305],[77.0795,15.7275],[77.079,15.716],[77.0875,15.7155],[77.0785,15.6955],[77.129,15.666],[77.1215,15.631],[77.083,15.659],[77.0305,15.6345],[77.03,15.5025],[76.9745,15.5105],[76.9755,15.4925],[77.032,15.4355],[77.0295,15.4045],[77.047,15.39],[77.042,15.362],[77.065,15.3435],[77.0635,15.328],[77.113,15.334],[77.1185,15.295],[77.1515,15.2925],[77.147,15.273],[77.1675,15.263],[77.144,15.2575],[77.126,15.24],[77.1255,15.227],[77.1515,15.216],[77.159,15.2025],[77.1655,15.1835],[77.163,15.1575],[77.141,15.1585],[77.138,15.1435],[77.15,15.143],[77.157,15.1405],[77.152,15.119],[77.13,15.101],[77.113,15.034],[77.085,15.0305],[77.0825,15.006],[77.044,15.01],[77.0495,15.033],[77.004,15.034],[76.986,15.0265],[76.9855,15.0155],[76.9185,15.0355],[76.877,15.0305],[76.866,15.0595],[76.836,15.0795],[76.8005,15.096],[76.777,15.0785],[76.7735,15.059],[76.79,15.021],[76.7735,14.993],[76.734,14.9855],[76.7305,15.027],[76.722,15.033],[76.7035,15.0335],[76.7015,15.016],[76.688,15.025],[76.6735,15.019],[76.689,14.9785],[76.7155,14.973],[76.7165,14.948],[76.697,14.9275],[76.6585,14.9415],[76.6765,14.9155],[76.683,14.9005],[76.681,14.894],[76.671,14.9005],[76.651,14.9195],[76.6155,14.9705],[76.574,15.011],[76.557,15.031],[76.542,15.055],[76.523,15.0935],[76.508,15.117],[76.5,15.1855],[76.5065,15.226],[76.504,15.26],[76.505,15.2675],[76.5145,15.284],[76.516,15.2895],[76.502,15.321],[76.4995,15.332],[76.5,15.3505],[76.555,15.3965],[76.5925,15.413],[76.6125,15.443],[76.6665,15.4505],[76.709,15.4885],[76.7915,15.5005],[76.8115,15.514],[76.811,15.5475],[76.8345,15.564],[76.8345,15.628]]]]}}],"Tamil Nadu":[{"parent":"Nagapattinam","geoms":{"Mayiladuthurai":[[[[79.511,11.042],[79.5295,11.056],[79.553,11.1275],[79.5265,11.1835],[79.5615,11.2085],[79.596,11.2175],[79.656,11.3035],[79.6905,11.3165],[79.7245,11.3455],[79.7595,11.3525],[79.7645,11.3825],[79.803,11.381],[79.813,11.424],[79.8235,11.379],[79.8435,11.3515],[79.8345,11.3215],[79.856,11.1765],[79.8555,11.0015],[79.7485,10.9965],[79.7005,11.0155],[79.647,11.0115],[79.621,10.9715],[79.591,10.983],[79.557,10.97],[79.5155,10.97],[79.5315,11.011],[79.511,11.042]]]],"Nagapattinam":[[[[79.501,10.369],[79.5355,10.359],[79.56,10.386],[79.634,10.379],[79.6305,10.4455],[79.69,10.45],[79.7145,10.5255],[79.668,10.5745],[79.6735,10.6245],[79.6665,10.6505],[79.7035,10.783],[79.7295,10.7985],[79.7285,10.828],[79.655,10.838],[79.6525,10.886],[79.6685,10.9145],[79.7245,10.9295],[79.777,10.897],[79.824,10.8845],[79.821,10.8455],[79.851,10.8275],[79.853,10.636],[79.8715,10.3675],[79.8825,10.323],[79.86,10.2825],[79.7685,10.272],[79.68,10.282],[79.6365,10.2945],[79.472,10.316],[79.4765,10.351],[79.501,10.369]]],[[[79.54,10.97],[79.557,10.97],[79.545,10.9655],[79.5155,10.97],[79.54,10.97]]]]}}],"Andhra Pradesh":[{"parent":"Alluri Sitharama Raju","geoms":{"Polavaram":[[[[82.15,17.3175],[82.15,17.2995],[82.1465,17.3],[82.1435,17.303],[82.146,17.309],[82.1445,17.311],[82.133,17.3065],[82.131,17.308],[82.13,17.3115],[82.136,17.3175],[82.134,17.3185],[82.1315,17.315],[82.127,17.313],[82.132,17.3275],[82.1435,17.345],[82.1295,17.347],[82.1235,17.3445],[82.122,17.325],[82.1205,17.3235],[82.113,17.3265],[82.1,17.327],[82.0995,17.329],[82.108,17.3385],[82.105,17.3415],[82.0935,17.3435],[82.092,17.346],[82.095,17.355],[82.105,17.3595],[82.1125,17.369],[82.1105,17.3725],[82.112,17.3765],[82.1205,17.3825],[82.1165,17.391],[82.112,17.3935],[82.1065,17.3865],[82.1015,17.3865],[82.0985,17.391],[82.102,17.394],[82.099,17.3955],[82.1005,17.4005],[82.0985,17.4025],[82.0935,17.401],[82.0945,17.395],[82.089,17.39],[82.087,17.391],[82.085,17.3975],[82.0785,17.4035],[82.072,17.401],[82.073,17.399],[82.079,17.3975],[82.08,17.3925],[82.0765,17.392],[82.0745,17.387],[82.072,17.3865],[82.068,17.387],[82.068,17.391],[82.0665,17.391],[82.064,17.387],[82.057,17.3835],[82.053,17.375],[82.0535,17.3705],[82.0605,17.366],[82.062,17.362],[82.057,17.352],[82.0545,17.351],[82.054,17.347],[82.0615,17.333],[82.0595,17.3265],[82.053,17.3165],[82.059,17.3145],[82.0595,17.3065],[82.0625,17.3045],[82.0685,17.3065],[82.0735,17.3035],[82.088,17.301],[82.094,17.2925],[82.0925,17.29],[82.0775,17.284],[82.0695,17.29],[82.066,17.295],[82.0495,17.2825],[82.0395,17.288],[82.0375,17.3035],[82.026,17.312],[82.0135,17.3115],[82.0085,17.3165],[82.003,17.31],[81.9755,17.3145],[81.9745,17.304],[81.965,17.3025],[81.9645,17.294],[81.9565,17.2885],[81.9435,17.2835],[81.9245,17.2815],[81.9155,17.283],[81.9245,17.3095],[81.923,17.3135],[81.9175,17.3075],[81.911,17.305],[81.89,17.3185],[81.8825,17.315],[81.879,17.312],[81.8785,17.309],[81.881,17.305],[81.8805,17.2975],[81.879,17.2945],[81.873,17.2945],[81.868,17.2885],[81.859,17.292],[81.859,17.2975],[81.847,17.302],[81.8445,17.306],[81.8455,17.31],[81.8325,17.308],[81.829,17.31],[81.826,17.3085],[81.8245,17.304],[81.8245,17.294],[81.823,17.288],[81.826,17.2785],[81.826,17.2595],[81.8085,17.2605],[81.806,17.2485],[81.8025,17.245],[81.7875,17.245],[81.7835,17.249],[81.7735,17.2455],[81.7725,17.2485],[81.766,17.249],[81.7615,17.2475],[81.7565,17.242],[81.757,17.2385],[81.753,17.234],[81.75,17.239],[81.729,17.234],[81.7185,17.234],[81.719,17.2245],[81.717,17.222],[81.709,17.2245],[81.7,17.2315],[81.682,17.2315],[81.681,17.235],[81.6845,17.2405],[81.685,17.244],[81.6795,17.2525],[81.685,17.2705],[81.683,17.2725],[81.6585,17.2755],[81.6665,17.285],[81.6795,17.292],[81.6775,17.3035],[81.673,17.3075],[81.6495,17.3185],[81.6375,17.3265],[81.6215,17.326],[81.6155,17.3295],[81.6115,17.343],[81.6125,17.355],[81.6055,17.371],[81.605,17.384],[81.6095,17.395],[81.6155,17.402],[81.6125,17.4075],[81.607,17.4105],[81.6,17.4105],[81.5895,17.405],[81.5845,17.4065],[81.579,17.413],[81.5755,17.43],[81.563,17.44],[81.558,17.4415],[81.538,17.437],[81.5295,17.441],[81.5165,17.4585],[81.5135,17.471],[81.5085,17.476],[81.496,17.4805],[81.491,17.4785],[81.481,17.469],[81.4645,17.4685],[81.444,17.4605],[81.4255,17.4645],[81.409,17.4645],[81.394,17.4705],[81.389,17.475],[81.383,17.4925],[81.38,17.496],[81.3635,17.5],[81.35,17.4995],[81.316,17.488],[81.3025,17.491],[81.296,17.4955],[81.2925,17.5005],[81.291,17.528],[81.2715,17.56],[81.265,17.564],[81.2515,17.564],[81.2425,17.5665],[81.234,17.5735],[81.228,17.575],[81.2185,17.5735],[81.2125,17.565],[81.2085,17.5635],[81.2025,17.565],[81.1945,17.571],[81.146,17.5775],[81.132,17.5825],[81.127,17.5875],[81.118,17.613],[81.1135,17.6195],[81.1085,17.623],[81.1015,17.6205],[81.0855,17.6095],[81.0585,17.607],[81.047,17.5995],[81.0365,17.5965],[81.014,17.5975],[81.008,17.604],[81.006,17.618],[81.008,17.643],[81.005,17.6485],[80.9975,17.6515],[80.9895,17.652],[80.974,17.6495],[80.9555,17.641],[80.947,17.6335],[80.9375,17.632],[80.9,17.6395],[80.9085,17.647],[80.911,17.6545],[80.903,17.6585],[80.9095,17.676],[80.906,17.6805],[80.9015,17.682],[80.8915,17.68],[80.8855,17.6835],[80.89,17.689],[80.894,17.703],[80.8945,17.7215],[80.8915,17.7415],[80.9025,17.742],[80.8995,17.748],[80.9,17.752],[80.906,17.7465],[80.9065,17.7485],[80.911,17.7485],[80.915,17.751],[80.9175,17.748],[80.919,17.757],[80.9235,17.7575],[80.9265,17.7555],[80.926,17.759],[80.928,17.7615],[80.9465,17.7605],[80.958,17.7745],[80.963,17.7765],[80.965,17.7795],[80.97,17.7775],[80.9735,17.7795],[80.977,17.777],[80.9785,17.769],[80.984,17.7565],[80.992,17.7505],[81.016,17.7445],[81.022,17.7495],[81.025,17.7495],[81.0355,17.745],[81.0355,17.74],[81.0405,17.7345],[81.042,17.7275],[81.0195,17.7205],[81.037,17.7175],[81.0475,17.719],[81.06,17.7155],[81.057,17.7135],[81.059,17.705],[81.066,17.6965],[81.073,17.697],[81.0785,17.709],[81.0785,17.7145],[81.0735,17.7105],[81.0665,17.716],[81.064,17.724],[81.066,17.7275],[81.063,17.7285],[81.067,17.733],[81.0815,17.723],[81.082,17.7185],[81.0855,17.7185],[81.089,17.722],[81.089,17.735],[81.0855,17.735],[81.075,17.7605],[81.0845,17.7605],[81.082,17.774],[81.0955,17.7755],[81.0875,17.7895],[81.082,17.794],[81.089,17.811],[81.1595,17.8525],[81.192,17.847],[81.254,17.812],[81.3245,17.8155],[81.371,17.8085],[81.381,17.804],[81.3875,17.7955],[81.3945,17.795],[81.3945,17.8165],[81.3995,17.82],[81.409,17.819],[81.416,17.813],[81.4255,17.8205],[81.4335,17.831],[81.4375,17.831],[81.4405,17.825],[81.444,17.8245],[81.458,17.828],[81.4725,17.836],[81.4775,17.8365],[81.481,17.831],[81.4825,17.8235],[81.4865,17.8195],[81.4885,17.8115],[81.4925,17.8105],[81.496,17.811],[81.5015,17.815],[81.5215,17.817],[81.5315,17.823],[81.537,17.8215],[81.555,17.826],[81.563,17.826],[81.5715,17.836],[81.5775,17.8375],[81.5975,17.832],[81.611,17.8245],[81.6185,17.823],[81.623,17.833],[81.63,17.8325],[81.636,17.8365],[81.6405,17.8335],[81.6335,17.8295],[81.638,17.8265],[81.659,17.82],[81.669,17.8195],[81.6785,17.821],[81.7015,17.8305],[81.708,17.831],[81.714,17.829],[81.72,17.8225],[81.749,17.772],[81.7685,17.7485],[81.7785,17.741],[81.789,17.736],[81.819,17.7305],[81.8365,17.7225],[81.852,17.706],[81.877,17.6725],[81.8895,17.6665],[81.9115,17.6615],[81.941,17.5975],[81.9765,17.527],[81.9935,17.4995],[82.005,17.487],[82.039,17.4655],[82.0935,17.4385],[82.1575,17.415],[82.2035,17.4025],[82.184,17.384],[82.167,17.3735],[82.156,17.3625],[82.1535,17.3425],[82.154,17.333],[82.15,17.3225],[82.1475,17.3205],[82.15,17.3175]]]],"Alluri Sitharama Raju":[[[[83.1355,18.182],[83.134,18.1755],[83.1175,18.1875],[83.106,18.188],[83.108,18.1815],[83.114,18.1785],[83.1195,18.169],[83.1085,18.1575],[83.1175,18.157],[83.1185,18.1545],[83.114,18.1455],[83.113,18.139],[83.106,18.1405],[83.104,18.1395],[83.1025,18.134],[83.1235,18.1205],[83.1235,18.1175],[83.1235,18.116],[83.116,18.1115],[83.108,18.1125],[83.1045,18.1105],[83.1085,18.1085],[83.127,18.11],[83.1295,18.107],[83.13,18.0995],[83.1255,18.0975],[83.1085,18.0955],[83.1025,18.0915],[83.0925,18.0885],[83.0745,18.0855],[83.07,18.0735],[83.0635,18.0725],[83.048,18.0715],[83.046,18.078],[83.0435,18.08],[83.03,18.08],[83.0275,18.082],[83.026,18.0885],[83.028,18.0895],[83.032,18.086],[83.034,18.091],[83.03,18.0955],[83.0165,18.088],[83.003,18.0725],[83.006,18.057],[82.9965,18.0525],[82.9845,18.0335],[82.979,18.0285],[82.979,18.0195],[82.9815,18.0175],[82.973,18.0145],[82.965,18.0085],[82.961,18.01],[82.948,17.9905],[82.9445,17.99],[82.938,17.994],[82.9395,18.01],[82.937,18.012],[82.9285,18.0115],[82.927,18.015],[82.9245,18.0155],[82.916,18.012],[82.9165,18.0145],[82.8885,18.0105],[82.887,18.018],[82.892,18.025],[82.888,18.027],[82.888,18.029],[82.881,18.024],[82.878,18.014],[82.869,18.01],[82.8605,18.0015],[82.858,18.0045],[82.8535,18.0015],[82.8505,18.002],[82.849,18.007],[82.8475,18.0045],[82.842,18.0065],[82.821,18.0005],[82.817,17.996],[82.8175,17.993],[82.8245,17.9905],[82.829,17.994],[82.845,17.9885],[82.85,17.985],[82.85,17.982],[82.8445,17.98],[82.8445,17.9735],[82.8555,17.967],[82.855,17.9605],[82.848,17.9545],[82.8415,17.9535],[82.838,17.951],[82.832,17.937],[82.8235,17.9315],[82.8175,17.9325],[82.813,17.937],[82.8105,17.936],[82.8075,17.9255],[82.797,17.9235],[82.776,17.939],[82.781,17.9295],[82.778,17.929],[82.755,17.9595],[82.7535,17.948],[82.75,17.947],[82.736,17.9485],[82.7135,17.956],[82.7145,17.9525],[82.7105,17.948],[82.7185,17.9465],[82.726,17.9405],[82.725,17.938],[82.726,17.934],[82.7255,17.932],[82.7145,17.9285],[82.7065,17.923],[82.711,17.914],[82.707,17.9095],[82.7095,17.906],[82.7055,17.901],[82.7035,17.894],[82.6955,17.8935],[82.6925,17.8965],[82.681,17.9005],[82.6765,17.8985],[82.6715,17.9045],[82.6695,17.904],[82.6665,17.899],[82.676,17.8955],[82.678,17.892],[82.689,17.891],[82.7085,17.8755],[82.7175,17.8725],[82.717,17.8705],[82.713,17.8665],[82.6985,17.866],[82.698,17.8635],[82.7,17.862],[82.695,17.8535],[82.6905,17.851],[82.687,17.852],[82.6835,17.8575],[82.6765,17.8565],[82.6335,17.835],[82.626,17.838],[82.624,17.8435],[82.621,17.842],[82.62,17.8405],[82.631,17.8225],[82.643,17.7945],[82.634,17.795],[82.63,17.7915],[82.627,17.7845],[82.6225,17.78],[82.6185,17.7825],[82.6185,17.79],[82.6175,17.793],[82.616,17.793],[82.6085,17.787],[82.6035,17.775],[82.5915,17.768],[82.589,17.7675],[82.5895,17.774],[82.5655,17.7735],[82.5625,17.7705],[82.562,17.7655],[82.5635,17.749],[82.5545,17.7475],[82.5545,17.7445],[82.548,17.7295],[82.547,17.722],[82.5265,17.7055],[82.523,17.7045],[82.521,17.7015],[82.5075,17.6995],[82.501,17.7],[82.497,17.703],[82.4955,17.7075],[82.5085,17.7165],[82.5105,17.7245],[82.501,17.717],[82.495,17.7265],[82.4645,17.7405],[82.4595,17.74],[82.454,17.737],[82.4555,17.7295],[82.454,17.727],[82.4375,17.7275],[82.4255,17.7175],[82.4295,17.713],[82.427,17.7055],[82.3985,17.685],[82.3925,17.686],[82.3845,17.6805],[82.3775,17.6875],[82.373,17.6885],[82.3665,17.684],[82.361,17.683],[82.3605,17.677],[82.3555,17.6765],[82.3485,17.6795],[82.3525,17.661],[82.346,17.6545],[82.3435,17.6485],[82.35,17.643],[82.3565,17.6405],[82.3725,17.6405],[82.3825,17.6515],[82.389,17.655],[82.388,17.6565],[82.3795,17.6585],[82.3785,17.6635],[82.3805,17.667],[82.3955,17.6645],[82.394,17.67],[82.3975,17.673],[82.405,17.6715],[82.4095,17.6645],[82.409,17.662],[82.3975,17.656],[82.3945,17.653],[82.395,17.6505],[82.403,17.649],[82.405,17.6445],[82.4075,17.6435],[82.424,17.6535],[82.431,17.655],[82.433,17.6505],[82.431,17.6465],[82.435,17.64],[82.4415,17.6405],[82.4625,17.6355],[82.465,17.6285],[82.4645,17.6175],[82.4595,17.614],[82.46,17.6095],[82.428,17.602],[82.423,17.6],[82.4235,17.597],[82.4025,17.5915],[82.3675,17.577],[82.3625,17.578],[82.357,17.5755],[82.354,17.583],[82.3615,17.583],[82.373,17.588],[82.3785,17.5955],[82.384,17.597],[82.381,17.6005],[82.3735,17.601],[82.3585,17.5935],[82.3425,17.5895],[82.3415,17.588],[82.3435,17.578],[82.3385,17.5705],[82.334,17.569],[82.333,17.563],[82.329,17.558],[82.3305,17.542],[82.3375,17.5255],[82.333,17.5175],[82.334,17.512],[82.318,17.5025],[82.3025,17.4875],[82.291,17.481],[82.286,17.467],[82.2855,17.451],[82.2835,17.443],[82.25,17.433],[82.2475,17.424],[82.2335,17.4095],[82.2175,17.3975],[82.22,17.3945],[82.2185,17.3895],[82.2015,17.3835],[82.1995,17.377],[82.189,17.3755],[82.1645,17.3595],[82.158,17.357],[82.1585,17.353],[82.1705,17.3445],[82.1705,17.3405],[82.1615,17.3305],[82.15,17.3225],[82.154,17.333],[82.1535,17.3425],[82.156,17.3625],[82.167,17.3735],[82.184,17.384],[82.2035,17.4025],[82.1575,17.415],[82.1085,17.4325],[82.0515,17.459],[82.0115,17.482],[81.9935,17.4995],[81.9765,17.527],[81.941,17.5975],[81.9115,17.6615],[81.8895,17.6665],[81.877,17.6725],[81.852,17.706],[81.8365,17.7225],[81.819,17.7305],[81.789,17.736],[81.7785,17.741],[81.7685,17.7485],[81.749,17.772],[81.7265,17.813],[81.714,17.829],[81.708,17.831],[81.7015,17.8305],[81.6785,17.821],[81.669,17.8195],[81.6485,17.8225],[81.6335,17.8295],[81.6405,17.8335],[81.636,17.8365],[81.653,17.8585],[81.656,17.872],[81.6665,17.885],[81.675,17.888],[81.6875,17.885],[81.6915,17.8885],[81.6955,17.897],[81.699,17.9005],[81.702,17.9005],[81.7045,17.8865],[81.71,17.873],[81.7125,17.8715],[81.7245,17.8765],[81.755,17.8985],[81.773,17.914],[81.7855,17.9205],[81.7885,17.924],[81.7925,17.9345],[81.8015,17.946],[81.811,17.952],[81.8765,17.9675],[81.89,17.9735],[81.903,17.977],[81.909,17.9845],[81.919,17.9905],[81.9405,17.9935],[81.963,17.999],[81.982,18.0175],[81.9925,18.0195],[81.995,18.027],[82.01,18.0305],[82.0105,18.036],[82.006,18.0455],[82.008,18.057],[82.019,18.0625],[82.0285,18.064],[82.0325,18.069],[82.0365,18.068],[82.0385,18.0655],[82.041,18.0565],[82.065,18.0555],[82.0675,18.057],[82.0675,18.062],[82.071,18.0695],[82.0775,18.075],[82.088,18.068],[82.095,18.067],[82.0975,18.0625],[82.102,18.0595],[82.1085,18.0625],[82.116,18.061],[82.1215,18.0635],[82.125,18.0595],[82.1335,18.0595],[82.1355,18.0575],[82.1375,18.0435],[82.1475,18.0515],[82.154,18.048],[82.169,18.051],[82.184,18.0285],[82.1795,18.022],[82.18,18.019],[82.19,18.015],[82.205,18.018],[82.209,18.0105],[82.2215,18.002],[82.2385,18.0015],[82.2495,17.992],[82.2555,17.992],[82.2675,17.996],[82.2715,18.007],[82.274,18.021],[82.268,18.0355],[82.2625,18.0405],[82.2695,18.0445],[82.273,18.056],[82.2835,18.063],[82.2885,18.0625],[82.292,18.0685],[82.2985,18.0675],[82.301,18.07],[82.3055,18.068],[82.3005,18.064],[82.299,18.0555],[82.3065,18.0555],[82.3105,18.054],[82.3075,18.05],[82.308,18.045],[82.3175,18.047],[82.321,18.045],[82.3225,18.049],[82.3195,18.0565],[82.323,18.06],[82.33,18.0585],[82.3345,18.0515],[82.3415,18.0545],[82.352,18.076],[82.348,18.0805],[82.35,18.0875],[82.347,18.0975],[82.339,18.0995],[82.334,18.12],[82.3365,18.124],[82.3345,18.1275],[82.3425,18.1365],[82.339,18.144],[82.3395,18.1485],[82.3415,18.15],[82.355,18.1425],[82.363,18.1345],[82.368,18.137],[82.3695,18.1435],[82.3725,18.147],[82.353,18.172],[82.3355,18.173],[82.316,18.184],[82.3115,18.2045],[82.3255,18.211],[82.337,18.2235],[82.3315,18.225],[82.325,18.232],[82.3265,18.2355],[82.3365,18.2405],[82.336,18.2495],[82.334,18.2525],[82.3365,18.2605],[82.3405,18.2645],[82.3405,18.2725],[82.3445,18.28],[82.3595,18.2815],[82.366,18.2775],[82.377,18.2805],[82.3925,18.298],[82.3925,18.3105],[82.395,18.3155],[82.393,18.3255],[82.3895,18.3285],[82.384,18.3295],[82.378,18.327],[82.375,18.3285],[82.3675,18.3235],[82.364,18.3185],[82.3575,18.316],[82.352,18.3175],[82.3495,18.3165],[82.341,18.3215],[82.3395,18.326],[82.343,18.33],[82.3475,18.3295],[82.3635,18.3445],[82.3645,18.3525],[82.3685,18.354],[82.3705,18.3585],[82.374,18.3585],[82.3855,18.3675],[82.385,18.3845],[82.3865,18.3865],[82.3815,18.3905],[82.38,18.404],[82.376,18.4055],[82.3655,18.422],[82.3755,18.43],[82.3825,18.4325],[82.387,18.4455],[82.396,18.4495],[82.3965,18.454],[82.4035,18.4635],[82.432,18.4875],[82.438,18.4945],[82.434,18.4985],[82.4375,18.5015],[82.438,18.5065],[82.4435,18.509],[82.4455,18.515],[82.4565,18.5215],[82.4735,18.5425],[82.4855,18.5495],[82.4905,18.5485],[82.4935,18.543],[82.493,18.5415],[82.4845,18.543],[82.482,18.541],[82.484,18.5355],[82.4875,18.533],[82.487,18.528],[82.4935,18.525],[82.505,18.5135],[82.5115,18.518],[82.515,18.518],[82.5265,18.516],[82.5325,18.5115],[82.5315,18.5085],[82.527,18.506],[82.5295,18.501],[82.5265,18.4955],[82.532,18.4925],[82.533,18.489],[82.528,18.481],[82.5335,18.48],[82.534,18.4775],[82.531,18.473],[82.5245,18.4715],[82.519,18.4665],[82.5235,18.4635],[82.5285,18.4635],[82.527,18.46],[82.5335,18.458],[82.5395,18.444],[82.544,18.4495],[82.5415,18.4535],[82.5425,18.4575],[82.5485,18.453],[82.5545,18.455],[82.557,18.45],[82.562,18.4475],[82.5525,18.435],[82.552,18.429],[82.543,18.4215],[82.5435,18.417],[82.5485,18.413],[82.5485,18.411],[82.539,18.4065],[82.541,18.401],[82.545,18.3985],[82.552,18.398],[82.5555,18.394],[82.563,18.3995],[82.572,18.394],[82.5755,18.396],[82.5835,18.387],[82.588,18.391],[82.595,18.389],[82.599,18.38],[82.6055,18.3825],[82.6055,18.3755],[82.6035,18.373],[82.606,18.3665],[82.621,18.36],[82.615,18.351],[82.6025,18.3515],[82.6035,18.344],[82.607,18.3415],[82.6105,18.3355],[82.6115,18.332],[82.6095,18.328],[82.6025,18.3255],[82.5945,18.328],[82.5885,18.3195],[82.583,18.3185],[82.582,18.315],[82.5855,18.309],[82.5955,18.3105],[82.5985,18.3045],[82.595,18.2995],[82.595,18.292],[82.5915,18.29],[82.5945,18.285],[82.592,18.281],[82.5885,18.28],[82.5875,18.276],[82.5965,18.2745],[82.5975,18.265],[82.604,18.2645],[82.615,18.2575],[82.6235,18.2465],[82.6275,18.2455],[82.6375,18.2365],[82.652,18.2495],[82.6495,18.258],[82.6435,18.2635],[82.6425,18.268],[82.649,18.273],[82.6525,18.2805],[82.6435,18.2895],[82.6415,18.296],[82.6425,18.3015],[82.6505,18.302],[82.6565,18.296],[82.667,18.2985],[82.6765,18.3065],[82.6805,18.3035],[82.6855,18.3035],[82.692,18.3075],[82.6945,18.312],[82.701,18.311],[82.709,18.3135],[82.709,18.316],[82.715,18.3225],[82.725,18.3245],[82.7345,18.3205],[82.736,18.3235],[82.741,18.3225],[82.7385,18.327],[82.743,18.33],[82.7555,18.3305],[82.7565,18.3335],[82.7595,18.3335],[82.7595,18.3395],[82.763,18.339],[82.7645,18.336],[82.768,18.338],[82.7715,18.337],[82.775,18.34],[82.775,18.346],[82.7775,18.3495],[82.7835,18.3535],[82.791,18.363],[82.788,18.3745],[82.783,18.382],[82.794,18.386],[82.7915,18.3965],[82.7995,18.4075],[82.7885,18.41],[82.7875,18.417],[82.7835,18.423],[82.783,18.4295],[82.797,18.441],[82.798,18.444],[82.8015,18.445],[82.804,18.4495],[82.815,18.4505],[82.8245,18.4465],[82.825,18.4425],[82.8305,18.4425],[82.847,18.4325],[82.8515,18.4205],[82.856,18.4245],[82.871,18.4185],[82.877,18.4215],[82.8825,18.421],[82.8925,18.424],[82.897,18.4225],[82.8995,18.401],[82.893,18.3885],[82.8985,18.378],[82.904,18.3735],[82.911,18.373],[82.913,18.3685],[82.9155,18.3695],[82.918,18.375],[82.9235,18.3745],[82.927,18.3675],[82.942,18.3605],[82.953,18.361],[82.961,18.366],[82.965,18.3595],[82.969,18.359],[82.984,18.3665],[82.9825,18.3675],[82.988,18.3775],[82.9875,18.379],[82.9905,18.381],[82.993,18.379],[82.997,18.386],[83.0005,18.3835],[83.005,18.383],[83.0105,18.386],[83.0115,18.3885],[83.015,18.387],[83.02,18.3885],[83.021,18.3915],[83.0325,18.3835],[83.04,18.3825],[83.0435,18.379],[83.053,18.3795],[83.062,18.386],[83.064,18.3905],[83.0765,18.4015],[83.077,18.4055],[83.0815,18.403],[83.087,18.4065],[83.088,18.411],[83.102,18.413],[83.105,18.4105],[83.0975,18.394],[83.091,18.389],[83.076,18.368],[83.076,18.3615],[83.0785,18.357],[83.08,18.347],[83.092,18.3425],[83.0945,18.346],[83.095,18.352],[83.104,18.3565],[83.106,18.3565],[83.1075,18.352],[83.112,18.3525],[83.1115,18.349],[83.1135,18.3485],[83.121,18.3505],[83.136,18.349],[83.152,18.341],[83.1495,18.3295],[83.151,18.325],[83.1605,18.329],[83.163,18.328],[83.1605,18.323],[83.1615,18.3205],[83.166,18.319],[83.1665,18.3135],[83.171,18.313],[83.1765,18.3145],[83.1775,18.32],[83.194,18.33],[83.209,18.334],[83.2205,18.3335],[83.22,18.3225],[83.211,18.309],[83.213,18.3035],[83.2105,18.3005],[83.213,18.296],[83.211,18.2855],[83.2195,18.2845],[83.2245,18.281],[83.2285,18.282],[83.2295,18.2875],[83.2325,18.2875],[83.2485,18.279],[83.2575,18.2775],[83.262,18.2735],[83.259,18.2515],[83.261,18.2385],[83.266,18.23],[83.2665,18.2165],[83.2625,18.2165],[83.255,18.2255],[83.2395,18.23],[83.238,18.2345],[83.2335,18.236],[83.233,18.223],[83.2425,18.2225],[83.243,18.203],[83.2285,18.206],[83.228,18.218],[83.2235,18.2225],[83.22,18.223],[83.222,18.214],[83.216,18.203],[83.217,18.2005],[83.2255,18.196],[83.2255,18.1925],[83.223,18.189],[83.2095,18.1895],[83.1965,18.199],[83.191,18.1975],[83.186,18.204],[83.182,18.218],[83.1855,18.2225],[83.1795,18.222],[83.1755,18.2275],[83.1725,18.2215],[83.169,18.221],[83.1675,18.211],[83.158,18.2095],[83.159,18.2],[83.1485,18.1965],[83.146,18.198],[83.147,18.1915],[83.157,18.1915],[83.15,18.1865],[83.141,18.1865],[83.1355,18.182]]],[[[82.173,17.319],[82.1925,17.323],[82.18,17.312],[82.1565,17.299],[82.15,17.2995],[82.15,17.3175],[82.173,17.319]]]]}},{"parent":"Prakasam","geoms":{"Markapuram":[[[[79.708,15.213],[79.697,15.2195],[79.685,15.2175],[79.6745,15.2255],[79.6735,15.237],[79.676,15.249],[79.666,15.247],[79.6545,15.248],[79.6465,15.2265],[79.634,15.204],[79.6275,15.1805],[79.6245,15.1785],[79.622,15.17],[79.623,15.167],[79.6295,15.167],[79.635,15.1765],[79.6395,15.1775],[79.647,15.1715],[79.651,15.156],[79.65,15.1525],[79.6465,15.1515],[79.626,15.1515],[79.629,15.135],[79.6275,15.123],[79.6335,15.1015],[79.629,15.097],[79.6255,15.081],[79.6195,15.077],[79.6095,15.0595],[79.602,15.056],[79.5895,15.0395],[79.581,15.0365],[79.5805,15.0425],[79.5635,15.043],[79.564,15.034],[79.5595,15.0305],[79.559,15.022],[79.55,15.022],[79.5295,15.038],[79.519,15.037],[79.5135,15.044],[79.506,15.047],[79.506,15.053],[79.502,15.0555],[79.4765,15.058],[79.4705,15.068],[79.466,15.068],[79.4625,15.062],[79.454,15.064],[79.4375,15.0555],[79.4225,15.0565],[79.4165,15.06],[79.419,15.0735],[79.408,15.0755],[79.404,15.078],[79.3905,15.075],[79.3905,15.0845],[79.3935,15.087],[79.3935,15.091],[79.391,15.091],[79.388,15.086],[79.3675,15.0855],[79.3585,15.1005],[79.3575,15.1055],[79.3595,15.1115],[79.353,15.116],[79.349,15.115],[79.3515,15.109],[79.351,15.1035],[79.3465,15.088],[79.3445,15.0855],[79.3365,15.0905],[79.33,15.0905],[79.3275,15.094],[79.327,15.0975],[79.329,15.1],[79.3335,15.0975],[79.3365,15.1],[79.3365,15.1085],[79.3385,15.113],[79.335,15.1165],[79.327,15.1145],[79.328,15.111],[79.324,15.1095],[79.321,15.1035],[79.3165,15.1025],[79.3135,15.091],[79.308,15.0865],[79.309,15.0935],[79.304,15.0955],[79.285,15.099],[79.2705,15.099],[79.2655,15.0965],[79.2665,15.1035],[79.262,15.1065],[79.2485,15.105],[79.218,15.0875],[79.211,15.0855],[79.165,15.0895],[79.1535,15.097],[79.1365,15.101],[79.1295,15.1],[79.128,15.098],[79.1305,15.086],[79.1005,15.0845],[79.1015,15.073],[79.094,15.066],[79.0945,15.0545],[79.09,15.049],[79.0825,15.0845],[79.074,15.112],[79.073,15.1235],[79.072,15.1495],[79.074,15.1655],[79.083,15.174],[79.018,15.179],[79.0125,15.1765],[79.0115,15.1705],[79.009,15.169],[78.9915,15.1685],[78.9825,15.1655],[78.9755,15.1675],[78.969,15.173],[78.958,15.176],[78.955,15.192],[78.948,15.2035],[78.9495,15.211],[78.948,15.2285],[78.9275,15.228],[78.9215,15.209],[78.9195,15.1875],[78.9065,15.188],[78.9035,15.1915],[78.8775,15.1945],[78.8725,15.1975],[78.778,15.2],[78.7585,15.185],[78.742,15.1825],[78.737,15.1995],[78.7365,15.2435],[78.7395,15.2685],[78.7365,15.328],[78.7425,15.3535],[78.7485,15.3705],[78.7605,15.394],[78.771,15.4215],[78.77,15.471],[78.776,15.515],[78.7765,15.5435],[78.7705,15.6055],[78.7695,15.633],[78.771,15.6655],[78.8105,15.868],[78.837,15.907],[78.8645,15.9325],[78.9105,15.968],[78.9115,15.9705],[78.931,16.093],[78.923,16.127],[78.9245,16.132],[78.924,16.1385],[78.9155,16.1485],[78.9115,16.163],[78.905,16.175],[78.904,16.18],[78.907,16.185],[78.931,16.1995],[78.9475,16.204],[78.9615,16.21],[78.97,16.2115],[78.9855,16.2115],[78.9995,16.226],[79.009,16.2405],[79.013,16.2425],[79.0285,16.2435],[79.054,16.239],[79.0715,16.2275],[79.084,16.231],[79.0995,16.224],[79.104,16.2245],[79.1105,16.2305],[79.122,16.2325],[79.147,16.2145],[79.1595,16.21],[79.1755,16.213],[79.2075,16.2225],[79.214,16.227],[79.2165,16.226],[79.218,16.225],[79.2155,16.185],[79.2215,16.1635],[79.249,16.179],[79.259,16.1935],[79.326,16.2285],[79.3715,16.233],[79.4475,16.303],[79.4725,16.291],[79.5005,16.2905],[79.5275,16.297],[79.5375,16.3065],[79.55,16.285],[79.5665,16.276],[79.562,16.263],[79.56,16.2415],[79.5625,16.2375],[79.563,16.2235],[79.558,16.221],[79.5565,16.214],[79.561,16.205],[79.559,16.1945],[79.552,16.1845],[79.552,16.1805],[79.5465,16.1735],[79.5385,16.1715],[79.536,16.1645],[79.537,16.16],[79.5395,16.1585],[79.54,16.1475],[79.537,16.1435],[79.5385,16.1345],[79.545,16.121],[79.554,16.1125],[79.5525,16.109],[79.5555,16.1005],[79.553,16.0855],[79.547,16.077],[79.5465,16.0725],[79.553,16.0505],[79.5635,16.033],[79.5625,16.028],[79.567,16.018],[79.563,16.0125],[79.5725,16.005],[79.5685,15.984],[79.562,15.9725],[79.56,15.9635],[79.561,15.955],[79.5595,15.9485],[79.5725,15.9375],[79.589,15.9405],[79.603,15.939],[79.6155,15.9325],[79.611,15.9225],[79.6165,15.919],[79.617,15.906],[79.622,15.887],[79.6435,15.8235],[79.6435,15.8115],[79.64,15.803],[79.5975,15.7465],[79.5875,15.73],[79.603,15.668],[79.6165,15.6405],[79.6565,15.5825],[79.663,15.5625],[79.676,15.5015],[79.691,15.473],[79.7065,15.4555],[79.7845,15.4005],[79.807,15.3825],[79.8265,15.3635],[79.843,15.344],[79.8555,15.325],[79.8645,15.308],[79.875,15.282],[79.8725,15.2745],[79.87,15.2735],[79.8465,15.27],[79.821,15.262],[79.7905,15.2495],[79.763,15.234],[79.7415,15.219],[79.7305,15.2075],[79.708,15.213]]]],"Prakasam":[[[[79.843,15.344],[79.817,15.3735],[79.7845,15.4005],[79.7165,15.448],[79.7065,15.4555],[79.691,15.473],[79.676,15.5015],[79.663,15.5625],[79.6565,15.5825],[79.6165,15.6405],[79.605,15.662],[79.5875,15.73],[79.6045,15.756],[79.6345,15.7945],[79.6435,15.8115],[79.6435,15.8235],[79.622,15.887],[79.617,15.906],[79.6165,15.919],[79.6355,15.9075],[79.6495,15.9135],[79.655,15.9205],[79.6625,15.9175],[79.675,15.9035],[79.6815,15.903],[79.686,15.898],[79.6895,15.8995],[79.6945,15.895],[79.688,15.876],[79.6945,15.8765],[79.715,15.868],[79.719,15.86],[79.72,15.8515],[79.7165,15.8435],[79.711,15.8375],[79.716,15.8355],[79.734,15.835],[79.7375,15.828],[79.762,15.824],[79.7655,15.827],[79.771,15.825],[79.772,15.8425],[79.7545,15.848],[79.7525,15.856],[79.747,15.859],[79.7545,15.871],[79.756,15.9],[79.7625,15.901],[79.7685,15.9075],[79.774,15.9075],[79.7855,15.9185],[79.7915,15.9415],[79.848,15.9285],[79.8475,15.9225],[79.8705,15.9165],[79.878,15.9255],[79.88,15.9195],[79.8835,15.9195],[79.885,15.9145],[79.8915,15.909],[79.8985,15.896],[79.9075,15.885],[79.928,15.878],[79.9355,15.869],[79.9375,15.858],[79.939,15.8565],[79.9475,15.858],[79.95,15.8525],[79.944,15.84],[79.946,15.8335],[79.9285,15.8275],[79.921,15.8295],[79.917,15.8075],[79.917,15.789],[79.9085,15.7655],[79.9115,15.76],[79.92,15.7525],[79.9205,15.7465],[79.917,15.737],[79.908,15.7335],[79.905,15.724],[79.8935,15.7155],[79.8905,15.7115],[79.9,15.7025],[79.9085,15.704],[79.9265,15.6915],[79.939,15.6885],[79.941,15.698],[79.9495,15.701],[79.955,15.7095],[79.967,15.7105],[79.969,15.717],[79.973,15.7065],[79.977,15.702],[79.9925,15.7015],[80.0025,15.696],[80.017,15.692],[80.019,15.6875],[80.0245,15.6865],[80.0245,15.692],[80.0355,15.709],[80.047,15.703],[80.054,15.6955],[80.0675,15.694],[80.0695,15.685],[80.0725,15.684],[80.0845,15.688],[80.0885,15.6875],[80.1,15.683],[80.096,15.677],[80.1195,15.6695],[80.123,15.6705],[80.1295,15.683],[80.122,15.6845],[80.1145,15.6895],[80.1125,15.692],[80.1125,15.702],[80.128,15.701],[80.1355,15.693],[80.139,15.692],[80.141,15.699],[80.1515,15.699],[80.163,15.718],[80.1655,15.7265],[80.171,15.724],[80.1775,15.734],[80.184,15.737],[80.1895,15.7535],[80.1875,15.7585],[80.196,15.768],[80.205,15.7645],[80.2235,15.7825],[80.226,15.793],[80.2255,15.808],[80.246,15.8],[80.2715,15.7825],[80.2725,15.7795],[80.269,15.775],[80.2715,15.772],[80.2575,15.7565],[80.229,15.775],[80.2235,15.77],[80.216,15.7595],[80.204,15.7345],[80.1975,15.73],[80.1985,15.7255],[80.189,15.7115],[80.1945,15.7025],[80.1945,15.699],[80.1885,15.689],[80.184,15.6865],[80.1805,15.6885],[80.179,15.686],[80.177,15.6705],[80.17,15.6525],[80.1715,15.6475],[80.179,15.64],[80.1795,15.6375],[80.1745,15.632],[80.1745,15.6265],[80.177,15.623],[80.1795,15.6215],[80.2425,15.6125],[80.226,15.557],[80.2305,15.5405],[80.218,15.518],[80.2155,15.512],[80.2155,15.4995],[80.2005,15.4645],[80.141,15.3935],[80.123,15.368],[80.1115,15.3485],[80.105,15.321],[80.0935,15.2975],[80.0845,15.269],[80.0835,15.2545],[80.0875,15.2165],[80.0775,15.2145],[80.07,15.215],[80.0715,15.204],[80.068,15.2025],[80.059,15.205],[80.052,15.2105],[80.0405,15.216],[80.0295,15.2155],[80.021,15.213],[80.016,15.215],[80.0075,15.198],[79.9985,15.203],[79.992,15.1985],[79.978,15.198],[79.9775,15.2065],[79.973,15.2105],[79.9725,15.216],[79.977,15.2415],[79.9765,15.2495],[79.9855,15.2725],[79.9545,15.29],[79.9535,15.296],[79.959,15.3155],[79.944,15.3155],[79.9405,15.3125],[79.9375,15.3015],[79.919,15.299],[79.918,15.3125],[79.913,15.3195],[79.9125,15.327],[79.9095,15.3285],[79.905,15.316],[79.8955,15.302],[79.8895,15.3025],[79.886,15.3135],[79.8805,15.316],[79.8655,15.3095],[79.866,15.305],[79.843,15.344]]],[[[79.846,15.2435],[79.84,15.215],[79.8375,15.212],[79.83,15.2115],[79.8145,15.219],[79.8155,15.212],[79.813,15.208],[79.79,15.203],[79.777,15.197],[79.771,15.1965],[79.754,15.2015],[79.7535,15.206],[79.7305,15.2075],[79.7415,15.219],[79.763,15.234],[79.7905,15.2495],[79.821,15.262],[79.856,15.272],[79.853,15.258],[79.846,15.2435]]],[[[79.6265,15.0435],[79.629,15.043],[79.629,15.034],[79.626,15.0325],[79.6195,15.0335],[79.6085,15.0405],[79.602,15.0385],[79.5895,15.0395],[79.602,15.056],[79.6095,15.0595],[79.6105,15.0555],[79.6175,15.053],[79.6265,15.0435]]]]}}],"Sikkim":[{"parent":"Gangtok","geoms":{"Pakyong":[[[[88.832,27.2625],[88.803,27.248],[88.791,27.1855],[88.7665,27.178],[88.761,27.1525],[88.739,27.1365],[88.722,27.1395],[88.7065,27.1665],[88.6885,27.1755],[88.653,27.16],[88.597,27.1885],[88.532,27.176],[88.497,27.187],[88.4855,27.2035],[88.4885,27.229],[88.4875,27.237],[88.4385,27.2645],[88.482,27.2615],[88.519,27.2485],[88.537,27.247],[88.621,27.257],[88.667,27.265],[88.6925,27.267],[88.7355,27.2645],[88.784,27.267],[88.8185,27.265],[88.887,27.265],[88.879,27.2615],[88.832,27.2625]]]],"Gangtok":[[[[88.551,27.393],[88.5885,27.4005],[88.6275,27.387],[88.692,27.3995],[88.7285,27.4205],[88.794,27.416],[88.838,27.379],[88.861,27.387],[88.8835,27.343],[88.9155,27.3305],[88.919,27.3205],[88.9035,27.2725],[88.887,27.265],[88.8185,27.265],[88.784,27.267],[88.7355,27.2645],[88.68,27.2665],[88.621,27.257],[88.537,27.247],[88.519,27.2485],[88.482,27.2615],[88.4385,27.265],[88.4485,27.314],[88.482,27.3315],[88.481,27.374],[88.5205,27.4015],[88.551,27.393]]]]}},{"parent":"Gyalshing","geoms":{"Soreng":[[[[88.302,27.229],[88.3315,27.1945],[88.299,27.1715],[88.28,27.1295],[88.232,27.1185],[88.2155,27.1315],[88.1815,27.1325],[88.1535,27.11],[88.096,27.1335],[88.074,27.1855],[88.079,27.201],[88.04,27.2205],[88.032,27.221],[88.014,27.2125],[88.0315,27.2505],[88.032,27.27],[88.0415,27.2715],[88.08,27.287],[88.1425,27.2935],[88.191,27.2915],[88.2075,27.2885],[88.25,27.2745],[88.2895,27.27],[88.301,27.2595],[88.302,27.229]]]],"Gyalshing":[[[[88.2415,27.535],[88.2815,27.513],[88.264,27.5],[88.275,27.405],[88.3295,27.4125],[88.3355,27.4005],[88.3495,27.408],[88.358,27.398],[88.3555,27.3755],[88.33,27.3685],[88.321,27.345],[88.297,27.3305],[88.312,27.3095],[88.3075,27.2995],[88.2755,27.283],[88.2895,27.27],[88.25,27.2745],[88.199,27.29],[88.159,27.2935],[88.08,27.287],[88.0415,27.2715],[88.032,27.27],[88.0325,27.2855],[88.0685,27.335],[88.042,27.371],[88.0475,27.4055],[88.0755,27.433],[88.0675,27.4575],[88.045,27.478],[88.044,27.4965],[88.0605,27.512],[88.059,27.5365],[88.08,27.5645],[88.083,27.589],[88.1145,27.6185],[88.21,27.5815],[88.2415,27.535]]]]}}],"Nagaland":[{"parent":"Dimapur","geoms":{"Dimapur":[[[[93.7515,25.933],[93.7455,25.9425],[93.751,25.9445],[93.7635,25.942],[93.7855,25.9345],[93.7955,25.906],[93.782,25.864],[93.7635,25.8545],[93.753,25.8425],[93.7135,25.8555],[93.697,25.8645],[93.6815,25.9045],[93.7515,25.933]]]],"Niuland":[[[[93.7535,25.944],[93.751,25.9445],[93.761,25.9485],[93.76,25.943],[93.7535,25.944]]],[[[93.5125,25.675],[93.5225,25.698],[93.527,25.691],[93.541,25.699],[93.5425,25.731],[93.5615,25.738],[93.568,25.7585],[93.578,25.7545],[93.6175,25.776],[93.625,25.8025],[93.646,25.8225],[93.668,25.822],[93.6885,25.846],[93.714,25.8445],[93.702,25.8515],[93.697,25.8645],[93.7135,25.8555],[93.7525,25.8425],[93.747,25.8235],[93.738,25.7635],[93.7425,25.71],[93.7405,25.688],[93.7345,25.6795],[93.713,25.6645],[93.71,25.657],[93.6595,25.6495],[93.5125,25.675]]]],"Chümoukedima":[[[[94.0135,25.9505],[93.9775,25.883],[94.0175,25.846],[94.0115,25.8065],[93.9645,25.6935],[93.9285,25.671],[93.8835,25.6585],[93.7945,25.669],[93.71,25.657],[93.713,25.6645],[93.7345,25.6795],[93.7405,25.688],[93.7425,25.71],[93.738,25.756],[93.739,25.771],[93.7495,25.8335],[93.7525,25.8425],[93.7585,25.8505],[93.766,25.8565],[93.782,25.864],[93.7775,25.85],[93.7955,25.809],[93.8395,25.8565],[93.8815,25.8435],[93.916,25.884],[93.934,25.885],[93.938,25.8965],[93.9785,25.917],[93.9685,25.9575],[93.954,25.9695],[93.9725,25.9925],[94.002,25.9905],[94.0135,25.9505]]],[[[93.7755,25.9685],[93.774,25.9655],[93.7855,25.9345],[93.76,25.943],[93.761,25.9485],[93.768,25.951],[93.7655,25.969],[93.7755,25.9685]]]]}},{"parent":"Kohima","geoms":{"Tseminyü":[[[[94.0175,25.846],[93.9775,25.883],[94.0135,25.9505],[94.002,25.9905],[94.0975,25.9915],[94.1,25.9855],[94.1395,25.9925],[94.161,25.973],[94.1925,25.989],[94.219,26.0185],[94.2445,26.002],[94.275,26.004],[94.284,25.9395],[94.244,25.922],[94.2145,25.876],[94.268,25.8095],[94.296,25.81],[94.288,25.8045],[94.2785,25.802],[94.216,25.7925],[94.168,25.778],[94.1115,25.7745],[94.0975,25.772],[94.056,25.756],[93.9755,25.7205],[94.0115,25.8065],[94.0175,25.846]]]],"Kohima":[[[[93.914,25.613],[93.914,25.6225],[93.9295,25.625],[93.9285,25.671],[93.9645,25.6935],[93.9755,25.7205],[94.056,25.756],[94.0975,25.772],[94.1115,25.7745],[94.168,25.778],[94.2055,25.79],[94.2685,25.7995],[94.288,25.8045],[94.273,25.795],[94.213,25.6715],[94.22,25.657],[94.208,25.6285],[94.214,25.61],[94.197,25.582],[94.19,25.549],[94.178,25.5505],[94.165,25.5415],[94.156,25.551],[94.1405,25.5195],[94.108,25.522],[94.0845,25.5305],[94.094,25.5375],[94.085,25.5545],[94.067,25.5525],[94.048,25.5755],[94.038,25.57],[94.013,25.5925],[94.002,25.5865],[94.007,25.5685],[94.006,25.5675],[93.983,25.5685],[93.9575,25.551],[93.949,25.553],[93.9355,25.559],[93.94,25.586],[93.914,25.613]]]]}},{"parent":"Tuensang","geoms":{"Tuensang":[[[[94.766,26.4605],[94.8465,26.382],[94.913,26.38],[94.91,26.3565],[94.9235,26.355],[94.9215,26.316],[94.899,26.26],[94.863,26.188],[94.8495,26.1535],[94.8255,26.1375],[94.7965,26.109],[94.734,26.069],[94.677,26.0265],[94.7045,26.049],[94.6875,26.115],[94.7055,26.1715],[94.6965,26.1715],[94.6895,26.198],[94.6665,26.2125],[94.6565,26.203],[94.638,26.217],[94.6125,26.1935],[94.5995,26.1975],[94.5835,26.219],[94.583,26.2385],[94.56,26.256],[94.5645,26.2875],[94.5815,26.2895],[94.5825,26.301],[94.5925,26.2955],[94.6145,26.3265],[94.6505,26.3385],[94.6635,26.3715],[94.6575,26.376],[94.678,26.3815],[94.6935,26.413],[94.7025,26.4085],[94.7095,26.446],[94.744,26.462],[94.766,26.4605]]]],"Noklak":[[[[94.9545,26.331],[94.942,26.3065],[94.967,26.297],[95.0005,26.2935],[95.0375,26.3265],[95.0685,26.3375],[95.082,26.338],[95.122,26.348],[95.1285,26.3395],[95.1195,26.265],[95.1275,26.2535],[95.1145,26.233],[95.1425,26.2115],[95.122,26.185],[95.117,26.159],[95.126,26.129],[95.116,26.1075],[95.1495,26.087],[95.1645,26.0925],[95.1855,26.0735],[95.161,26.0375],[95.14,26.0445],[95.098,26.054],[95.045,26.0755],[95.005,26.087],[94.932,26.125],[94.8495,26.1535],[94.863,26.188],[94.899,26.26],[94.9175,26.305],[94.9215,26.316],[94.9235,26.355],[94.9525,26.353],[94.9545,26.331]]]],"Shamator":[[[[95.089,25.9505],[95.044,25.927],[95.031,25.9315],[95.0135,25.891],[94.973,25.8815],[94.968,25.9015],[94.937,25.913],[94.928,25.946],[94.925,25.9485],[94.9105,25.9485],[94.8945,25.9425],[94.864,25.948],[94.8425,25.9335],[94.8575,25.972],[94.888,26.0085],[94.8805,26.018],[94.8645,26.0165],[94.8455,26.041],[94.7865,26.009],[94.7665,26.023],[94.7185,26.023],[94.689,26.01],[94.6695,26.0205],[94.734,26.069],[94.7965,26.109],[94.8255,26.1375],[94.8495,26.1535],[94.932,26.125],[95.005,26.087],[95.045,26.0755],[95.098,26.054],[95.14,26.0445],[95.161,26.0375],[95.126,25.986],[95.089,25.9505]]]]}},{"parent":"Phek","geoms":{"Phek":[[[[94.531,25.6435],[94.521,25.639],[94.4885,25.6045],[94.481,25.614],[94.478,25.614],[94.425,25.5865],[94.4165,25.5365],[94.385,25.5325],[94.3215,25.503],[94.2845,25.508],[94.25,25.4945],[94.2085,25.496],[94.186,25.5315],[94.197,25.582],[94.214,25.61],[94.208,25.6285],[94.22,25.657],[94.213,25.6715],[94.273,25.795],[94.286,25.788],[94.3805,25.832],[94.457,25.8535],[94.4655,25.8305],[94.4945,25.8315],[94.511,25.8165],[94.518,25.825],[94.542,25.812],[94.5355,25.7845],[94.5535,25.7795],[94.5595,25.732],[94.5965,25.7685],[94.5805,25.706],[94.5745,25.691],[94.572,25.692],[94.531,25.6435]]]],"Meluri":[[[[94.8455,25.5615],[94.825,25.5425],[94.808,25.494],[94.784,25.4805],[94.762,25.482],[94.7515,25.4935],[94.718,25.469],[94.6835,25.466],[94.6755,25.4455],[94.6165,25.462],[94.5765,25.4955],[94.554,25.5035],[94.5665,25.548],[94.556,25.5545],[94.5645,25.5635],[94.551,25.5795],[94.5835,25.6345],[94.5935,25.6355],[94.574,25.6405],[94.5865,25.664],[94.5805,25.669],[94.5965,25.6825],[94.5745,25.691],[94.584,25.718],[94.5965,25.7685],[94.607,25.7785],[94.6365,25.7695],[94.6585,25.7775],[94.696,25.7575],[94.713,25.759],[94.7175,25.722],[94.727,25.725],[94.725,25.7485],[94.755,25.782],[94.819,25.764],[94.8565,25.7175],[94.846,25.65],[94.8515,25.6105],[94.866,25.609],[94.8985,25.5655],[94.8455,25.5615]]]]}}],"Arunachal Pradesh":[{"parent":"Lower Subansiri","geoms":{"Keyi Panyor":[[[[93.827,27.358],[93.8065,27.3715],[93.785,27.3505],[93.7405,27.3525],[93.666,27.336],[93.631,27.36],[93.613,27.3575],[93.6005,27.3675],[93.5785,27.435],[93.557,27.438],[93.568,27.472],[93.6075,27.494],[93.618,27.532],[93.5625,27.602],[93.543,27.6215],[93.5775,27.6175],[93.6285,27.652],[93.647,27.635],[93.7055,27.5935],[93.7215,27.5775],[93.7345,27.559],[93.758,27.504],[93.7685,27.485],[93.781,27.47],[93.8065,27.4475],[93.8165,27.4355],[93.817,27.4305],[93.8145,27.4225],[93.82,27.412],[93.831,27.399],[93.8355,27.3635],[93.827,27.358]]]],"Lower Subansiri":[[[[93.8525,27.465],[93.85,27.4405],[93.8275,27.4245],[93.831,27.399],[93.816,27.418],[93.8145,27.4225],[93.817,27.4305],[93.8165,27.4355],[93.812,27.442],[93.781,27.47],[93.763,27.494],[93.7345,27.559],[93.7215,27.5775],[93.6965,27.6005],[93.647,27.635],[93.6285,27.652],[93.6765,27.685],[93.709,27.686],[93.768,27.73],[93.7685,27.7895],[93.8645,27.817],[93.89,27.82],[93.9075,27.797],[93.8905,27.743],[93.9195,27.7235],[93.9255,27.6595],[93.9415,27.6375],[94.0535,27.608],[94.049,27.5825],[94.1065,27.554],[94.1065,27.544],[94.072,27.5155],[93.942,27.5115],[93.8885,27.4915],[93.8525,27.465]]]]}},{"parent":"East Kameng","geoms":{"Bichom":[[[[92.8955,27.134],[92.8575,27.14],[92.839,27.132],[92.8285,27.1615],[92.8085,27.177],[92.8145,27.176],[92.809,27.2005],[92.834,27.2145],[92.8285,27.2245],[92.8365,27.233],[92.7995,27.26],[92.806,27.2955],[92.821,27.2875],[92.8445,27.293],[92.8045,27.3295],[92.8035,27.334],[92.843,27.3195],[92.853,27.3125],[92.868,27.2975],[92.9075,27.2915],[92.9215,27.2835],[92.9285,27.2715],[92.947,27.2305],[92.956,27.2045],[92.9835,27.151],[92.9585,27.1585],[92.8955,27.134]]]],"East Kameng":[[[[92.503,27.841],[92.5455,27.8165],[92.562,27.8205],[92.6065,27.877],[92.6705,27.8995],[92.7345,27.9765],[92.757,27.9575],[92.86,27.9585],[92.8655,27.9455],[92.9315,27.925],[92.9315,27.8785],[92.944,27.8505],[92.9785,27.824],[93.0745,27.827],[93.096,27.809],[93.131,27.8225],[93.176,27.8215],[93.199,27.8445],[93.239,27.8005],[93.225,27.7605],[93.201,27.732],[93.2235,27.7105],[93.195,27.6745],[93.2295,27.646],[93.239,27.614],[93.2285,27.6025],[93.2715,27.595],[93.284,27.588],[93.282,27.577],[93.3,27.5785],[93.3305,27.556],[93.294,27.5215],[93.321,27.487],[93.3275,27.461],[93.315,27.4415],[93.33,27.4425],[93.3705,27.415],[93.3735,27.37],[93.33,27.3545],[93.2995,27.3995],[93.195,27.378],[93.165,27.3115],[93.0025,27.2495],[92.9845,27.22],[93.0095,27.2005],[93.0725,27.203],[93.0805,27.1865],[93.069,27.171],[93.012,27.1425],[92.9835,27.151],[92.956,27.2045],[92.947,27.2305],[92.9285,27.2715],[92.9215,27.2835],[92.9075,27.2915],[92.868,27.2975],[92.853,27.3125],[92.843,27.3195],[92.8035,27.334],[92.8005,27.35],[92.8145,27.3545],[92.812,27.379],[92.823,27.3785],[92.823,27.4],[92.819,27.4145],[92.804,27.417],[92.811,27.4255],[92.804,27.4485],[92.7005,27.45],[92.6845,27.4725],[92.66,27.4825],[92.6515,27.5005],[92.658,27.5255],[92.644,27.552],[92.6065,27.5625],[92.6205,27.587],[92.607,27.598],[92.6105,27.619],[92.5945,27.6305],[92.547,27.621],[92.531,27.629],[92.53,27.68],[92.5105,27.7145],[92.516,27.7345],[92.4695,27.7775],[92.461,27.782],[92.4685,27.8145],[92.503,27.841]]]]}},{"parent":"West Kameng","geoms":{"Bichom":[[[[92.8445,27.293],[92.821,27.2875],[92.806,27.2955],[92.7995,27.26],[92.8365,27.233],[92.8285,27.2245],[92.834,27.2145],[92.809,27.2005],[92.8145,27.176],[92.7525,27.1935],[92.69,27.172],[92.6155,27.143],[92.601,27.1175],[92.5945,27.095],[92.598,27.053],[92.657,27.008],[92.645,26.987],[92.6005,26.967],[92.563,26.958],[92.4475,26.959],[92.426,26.941],[92.412,26.9425],[92.4055,26.9345],[92.4025,26.9375],[92.4075,26.927],[92.4065,26.925],[92.398,26.9285],[92.3895,26.94],[92.3785,26.9615],[92.3515,27.0375],[92.342,27.0815],[92.3405,27.102],[92.342,27.1215],[92.3485,27.1465],[92.3725,27.1935],[92.389,27.232],[92.4265,27.2625],[92.4405,27.2775],[92.4605,27.304],[92.47,27.312],[92.498,27.3265],[92.537,27.352],[92.5565,27.358],[92.5885,27.356],[92.635,27.3445],[92.6605,27.341],[92.69,27.342],[92.746,27.3495],[92.766,27.349],[92.7815,27.3445],[92.8035,27.334],[92.8045,27.3295],[92.8445,27.293]]]],"West Kameng":[[[[92.112,27.5255],[92.152,27.5775],[92.209,27.5805],[92.2225,27.603],[92.2225,27.627],[92.2445,27.651],[92.27,27.6485],[92.343,27.6725],[92.393,27.6725],[92.4135,27.709],[92.413,27.7555],[92.461,27.782],[92.4695,27.7775],[92.516,27.7345],[92.5105,27.7145],[92.53,27.68],[92.531,27.629],[92.547,27.621],[92.5945,27.6305],[92.6105,27.619],[92.607,27.598],[92.6205,27.587],[92.6065,27.5625],[92.644,27.552],[92.658,27.5255],[92.6515,27.5005],[92.66,27.4825],[92.6845,27.4725],[92.7005,27.45],[92.804,27.4485],[92.811,27.4255],[92.804,27.417],[92.819,27.4145],[92.823,27.4],[92.823,27.3785],[92.812,27.379],[92.8145,27.3545],[92.8005,27.35],[92.8035,27.334],[92.7815,27.3445],[92.766,27.349],[92.746,27.3495],[92.69,27.342],[92.6605,27.341],[92.635,27.3445],[92.5885,27.356],[92.5565,27.358],[92.537,27.352],[92.498,27.3265],[92.47,27.312],[92.4605,27.304],[92.4405,27.2775],[92.4265,27.2625],[92.389,27.232],[92.3725,27.1935],[92.3485,27.1465],[92.343,27.128],[92.3405,27.109],[92.3415,27.0885],[92.3515,27.0375],[92.375,26.9695],[92.3895,26.94],[92.4,26.927],[92.398,26.925],[92.36,26.926],[92.365,26.932],[92.3025,26.923],[92.303,26.907],[92.276,26.902],[92.255,26.9095],[92.1945,26.89],[92.108,26.893],[92.1175,26.9595],[92.103,26.982],[92.104,27.007],[92.0805,27.02],[92.0645,27.0515],[92.0455,27.0515],[92.0345,27.064],[92.023,27.114],[92.0375,27.138],[92.024,27.1615],[92.057,27.189],[92.0705,27.223],[92.0665,27.2445],[92.0405,27.266],[92.071,27.2765],[92.103,27.2685],[92.1195,27.2755],[92.1215,27.287],[92.0595,27.3265],[92.0615,27.345],[92.0475,27.368],[92.056,27.3995],[92.04,27.436],[92.0205,27.447],[92.014,27.49],[92.0495,27.517],[92.112,27.5255]]]]}}],"Mizoram":[{"parent":"Aizawl","geoms":{"Aizawl":[[[[92.6435,23.9645],[92.648,23.958],[92.6555,23.9555],[92.664,23.9615],[92.6665,23.966],[92.677,23.9585],[92.6895,23.959],[92.7145,23.928],[92.761,23.895],[92.8005,23.8515],[92.8515,23.8185],[92.8675,23.8015],[92.8885,23.7735],[92.9295,23.7355],[92.9355,23.7265],[92.9495,23.695],[92.96,23.676],[92.987,23.6465],[93.013,23.6045],[93.0365,23.587],[93.0565,23.5605],[93.045,23.4755],[93.0595,23.4165],[93.0445,23.4105],[92.972,23.4775],[92.9475,23.514],[92.92,23.5225],[92.881,23.5185],[92.8525,23.4805],[92.839,23.4275],[92.812,23.368],[92.831,23.335],[92.8535,23.3225],[92.8275,23.2985],[92.8125,23.273],[92.791,23.276],[92.781,23.2995],[92.7565,23.3045],[92.736,23.3135],[92.712,23.298],[92.702,23.297],[92.6895,23.328],[92.6905,23.355],[92.6845,23.367],[92.675,23.3685],[92.6785,23.371],[92.6785,23.379],[92.6675,23.391],[92.6695,23.4015],[92.6595,23.422],[92.6575,23.489],[92.661,23.4975],[92.6545,23.518],[92.6405,23.5215],[92.635,23.5335],[92.638,23.5395],[92.644,23.541],[92.648,23.553],[92.6565,23.554],[92.6605,23.5705],[92.654,23.577],[92.652,23.59],[92.672,23.6],[92.675,23.609],[92.675,23.623],[92.6525,23.6305],[92.6525,23.635],[92.637,23.6475],[92.637,23.6585],[92.6475,23.668],[92.6675,23.7075],[92.652,23.714],[92.644,23.728],[92.6355,23.7585],[92.6295,23.7625],[92.6405,23.772],[92.6425,23.7855],[92.6395,23.793],[92.63,23.793],[92.625,23.7965],[92.638,23.8155],[92.643,23.812],[92.651,23.811],[92.656,23.8185],[92.646,23.82],[92.6465,23.8275],[92.6615,23.832],[92.6625,23.837],[92.654,23.848],[92.643,23.8725],[92.6415,23.892],[92.6595,23.9015],[92.663,23.9085],[92.658,23.92],[92.6465,23.922],[92.6445,23.9295],[92.623,23.935],[92.63,23.945],[92.6275,23.9535],[92.6355,23.956],[92.6435,23.9645]]]],"Saitual":[[[[92.684,23.967],[92.689,23.9825],[92.704,23.982],[92.709,23.978],[92.7165,23.98],[92.7235,23.975],[92.74,23.979],[92.746,23.984],[92.7445,23.9925],[92.7575,23.9895],[92.7595,24.0005],[92.7715,24.012],[92.785,24.018],[92.806,24.0185],[92.8175,24.0225],[92.832,24.0125],[92.8315,24.0185],[92.836,24.022],[92.841,24.014],[92.844,24.0245],[92.8475,24.027],[92.8455,24.034],[92.85,24.036],[92.8485,24.0625],[92.852,24.0705],[92.8565,24.0715],[92.86,24.0875],[92.8565,24.094],[92.861,24.1055],[92.87,24.1105],[92.8695,24.12],[92.879,24.1285],[92.8745,24.139],[92.886,24.153],[92.885,24.158],[92.8885,24.165],[92.8855,24.168],[92.8945,24.1715],[92.895,24.199],[92.9005,24.2045],[92.9005,24.2105],[92.898,24.21],[92.9025,24.2215],[92.9015,24.231],[92.893,24.242],[92.8835,24.2325],[92.8755,24.2405],[92.8635,24.241],[92.863,24.2485],[92.8675,24.25],[92.866,24.257],[92.862,24.2575],[92.8675,24.2615],[92.8645,24.269],[92.87,24.276],[92.8765,24.2765],[92.8735,24.282],[92.876,24.286],[92.8645,24.3075],[92.8575,24.308],[92.861,24.314],[92.869,24.3165],[92.87,24.32],[92.863,24.324],[92.864,24.3275],[92.8655,24.3255],[92.874,24.33],[92.8935,24.3555],[92.887,24.363],[92.889,24.368],[92.8935,24.369],[92.895,24.377],[92.887,24.3805],[92.892,24.3905],[92.8955,24.3865],[92.8955,24.3915],[92.9045,24.3915],[92.911,24.41],[92.9225,24.4025],[92.927,24.3955],[92.935,24.3925],[92.94,24.398],[92.9505,24.402],[92.9595,24.393],[92.9795,24.4065],[92.9945,24.399],[92.9995,24.4],[93.0235,24.3875],[93.016,24.377],[93.021,24.371],[93.0185,24.3555],[93.0205,24.3435],[93.0425,24.34],[93.034,24.315],[93.017,24.29],[93.01,24.285],[93.007,24.2775],[93.013,24.2685],[93.006,24.2595],[93.0055,24.251],[93.017,24.233],[93.0255,24.2295],[93.0185,24.2255],[93.0225,24.2145],[93.0155,24.197],[93.002,24.1945],[93.01,24.179],[93.002,24.171],[93.0045,24.1575],[92.992,24.15],[92.99,24.1435],[92.992,24.137],[92.985,24.126],[92.9725,24.121],[92.9735,24.114],[92.9755,24.112],[92.9995,24.112],[93.013,24.1015],[93.0205,24.098],[93.026,24.1005],[93.0365,24.092],[93.0525,24.0875],[93.0785,24.0995],[93.088,24.0805],[93.101,24.0705],[93.0995,24.053],[93.1025,24.0495],[93.098,24.0455],[93.0995,24.0415],[93.1095,24.047],[93.111,24.052],[93.118,24.053],[93.1195,24.057],[93.128,24.0605],[93.134,24.0695],[93.134,24.076],[93.141,24.0835],[93.1465,24.0845],[93.157,24.0805],[93.16,24.074],[93.1685,24.068],[93.1655,24.0575],[93.1685,24.0515],[93.1925,24.053],[93.197,24.049],[93.207,24.0475],[93.1715,23.94],[93.189,23.907],[93.1615,23.8825],[93.165,23.84],[93.15,23.8105],[93.075,23.7745],[93.0445,23.7655],[93.046,23.6535],[93.0565,23.5605],[93.0365,23.587],[93.013,23.6045],[92.987,23.6465],[92.96,23.676],[92.9495,23.695],[92.9355,23.7265],[92.9295,23.7355],[92.8885,23.7735],[92.86,23.8105],[92.842,23.826],[92.8005,23.8515],[92.761,23.895],[92.7145,23.928],[92.6895,23.959],[92.677,23.9585],[92.6665,23.966],[92.6685,23.9695],[92.684,23.967]]]]}}],"Meghalaya":[{"parent":"West Khasi Hills","geoms":{"West Khasi Hills":[[[[91.284,25.412],[91.268,25.4095],[91.2305,25.462],[91.2225,25.4485],[91.209,25.4615],[91.1915,25.4615],[91.18,25.448],[91.169,25.466],[91.106,25.436],[91.1155,25.4135],[91.138,25.3995],[91.0895,25.358],[91.0985,25.3305],[91.0855,25.32],[91.05,25.3425],[91.0245,25.3385],[90.989,25.379],[90.986,25.365],[90.971,25.358],[90.9755,25.3395],[90.9235,25.3515],[90.892,25.329],[90.867,25.33],[90.839,25.3075],[90.845,25.346],[90.8385,25.355],[90.8075,25.3685],[90.7765,25.3635],[90.748,25.3795],[90.7635,25.417],[90.7555,25.43],[90.7615,25.445],[90.7515,25.451],[90.76,25.4585],[90.7735,25.4515],[90.7895,25.4675],[90.7735,25.469],[90.7895,25.4855],[90.79,25.5065],[90.761,25.5505],[90.7715,25.5775],[90.7815,25.584],[90.7875,25.5695],[90.8005,25.5885],[90.8135,25.576],[90.824,25.59],[90.8745,25.6075],[90.9835,25.743],[90.9415,25.7545],[90.9445,25.7725],[90.9575,25.777],[90.9825,25.802],[91.0015,25.825],[91.012,25.8245],[91.0485,25.8495],[91.0785,25.853],[91.072,25.839],[91.0485,25.8295],[91.062,25.821],[91.1205,25.833],[91.1475,25.8505],[91.18,25.844],[91.196,25.8615],[91.2035,25.8435],[91.186,25.8185],[91.178,25.7775],[91.1905,25.748],[91.2225,25.7225],[91.2745,25.7505],[91.327,25.828],[91.3305,25.819],[91.3375,25.812],[91.3635,25.795],[91.37,25.7875],[91.3735,25.777],[91.376,25.7525],[91.3815,25.7295],[91.4025,25.6875],[91.4065,25.6725],[91.405,25.647],[91.382,25.5105],[91.3825,25.48],[91.3865,25.458],[91.309,25.4445],[91.284,25.412]]]],"Eastern West Khasi Hills":[[[[91.3665,25.806],[91.418,25.803],[91.423,25.7935],[91.4585,25.7885],[91.587,25.812],[91.6445,25.804],[91.6595,25.8145],[91.6975,25.805],[91.7075,25.82],[91.7495,25.8275],[91.7875,25.7905],[91.769,25.746],[91.774,25.742],[91.8085,25.7335],[91.8285,25.674],[91.8085,25.659],[91.8,25.6095],[91.781,25.5895],[91.733,25.575],[91.689,25.526],[91.67,25.522],[91.6585,25.528],[91.654,25.552],[91.542,25.5115],[91.549,25.482],[91.529,25.4795],[91.517,25.4555],[91.3865,25.458],[91.3825,25.48],[91.382,25.5105],[91.405,25.647],[91.4065,25.6725],[91.4025,25.6875],[91.3815,25.7295],[91.376,25.7525],[91.3735,25.777],[91.37,25.7875],[91.3635,25.795],[91.3375,25.812],[91.3305,25.819],[91.327,25.828],[91.336,25.841],[91.352,25.817],[91.3665,25.806]]]]}}]};
  function applyPatches(items,key) {
    const had=new Set(items.map(x=>x.name));
    (DISTRICT_PATCHES[key]||[]).forEach(p=>{
      const names=Object.keys(p.geoms);
      if (names.some(n=>n!==p.parent && had.has(n)) || !items.some(x=>x.name===p.parent)) return;
      items=items.filter(x=>x.name!==p.parent);
      names.forEach(n=>items.push({name:n,geometry:{type:'MultiPolygon',coordinates:p.geoms[n]}}));
    });
    return items;
  }
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
  // ---- Splitting a district along an approximate line (used for Goa's Kushavati, which postdates the open boundary data) ----
  function segHit(p,p2,q,q2) {
    const rx=p2[0]-p[0], ry=p2[1]-p[1], sx=q2[0]-q[0], sy=q2[1]-q[1], d=rx*sy-ry*sx;
    if (Math.abs(d)<1e-12) return null;
    const t=((q[0]-p[0])*sy-(q[1]-p[1])*sx)/d, u=((q[0]-p[0])*ry-(q[1]-p[1])*rx)/d;
    return (t>=0&&t<1&&u>=0&&u<1) ? {t,u,pt:[p[0]+t*rx,p[1]+t*ry]} : null;
  }
  function inRing(pt,ring) {
    let c=false;
    for (let i=0,j=ring.length-1;i<ring.length;j=i++) {
      const [xi,yi]=ring[i],[xj,yj]=ring[j];
      if ((yi>pt[1])!==(yj>pt[1]) && pt[0]<(xj-xi)*(pt[1]-yi)/(yj-yi)+xi) c=!c;
    }
    return c;
  }
  function splitPolygon(poly,line) { // -> [ringA,ringB] or null unless the line crosses the outer ring exactly twice
    const ring=poly[0], cuts=[];
    for (let i=0;i<ring.length-1;i++) for (let j=0;j<line.length-1;j++) { const h=segHit(ring[i],ring[i+1],line[j],line[j+1]); if (h) cuts.push({i,j,...h}); }
    if (cuts.length!==2) return null;
    cuts.sort((x,y)=>(x.i+x.t)-(y.i+y.t));
    const [c1,c2]=cuts, body=ring.slice(0,-1);
    const along=(a,b)=>(a.j+a.u)<=(b.j+b.u)?[a.pt,...line.slice(a.j+1,b.j+1),b.pt]:[a.pt,...line.slice(b.j+1,a.j+1).reverse(),b.pt];
    const p12=[c1.pt,...body.slice(c1.i+1,c2.i+1),c2.pt];
    const p21=[c2.pt,...body.slice(c2.i+1),...body.slice(0,c1.i+1),c1.pt];
    return [[...p12,...along(c2,c1).slice(1)],[...p21,...along(c1,c2).slice(1)]];
  }
  function splitDistrict(items,cfg) {
    const sp=cfg.split; if (!sp || items.some(x=>x.name===sp.newName)) return items;
    const out=[]; let made=0;
    items.forEach(it=>{
      if (it.name!==sp.from) { out.push(it); return; }
      polysOf(it.geometry).forEach(poly=>{
        const parts=splitPolygon(poly,sp.line);
        if (parts) parts.forEach(r=>{ const inside=inRing(sp.ref,r); if (inside) made++; out.push({name:inside?sp.newName:sp.from,geometry:{type:'Polygon',coordinates:[r]}}); });
        else { const inside=inRing(sp.ref,poly[0]); out.push({name:inside?sp.newName:sp.from,geometry:{type:'Polygon',coordinates:poly}}); if (inside) made++; }
      });
    });
    if (!made) { console.warn(`Could not carve ${sp.newName} out of ${sp.from}; keeping the original districts`); return items; }
    return out;
  }
  async function fetchDistricts(key) {
    const cfg=DISTRICT_SETS[key];
    const toItems=(feats,fallback)=>feats.map(f=>({name:pickDistrictName(f.properties,key)||fallback||null,geometry:f.geometry}));
    const finish=items=>{
      const unnamed=items.filter(x=>!x.name).length;
      if (unnamed) console.warn(`${unnamed} ${key} feature(s) had no readable district name`);
      const merged=mergeFeatures(splitDistrict(applyPatches(items.filter(x=>x.name),key),cfg),'District');
      return merged.size>=2 ? [...merged.values()] : null;
    };
    const build=feats=>finish(toItems(feats));
    // Several boundary files combined into one quiz (e.g. the Union Territories)
    if (cfg.sources) {
      const items=[];
      for (const src of cfg.sources) {
        if (src.embed) { Object.entries(src.embed==='delhi'?DELHI_DISTRICTS:LADAKH_DISTRICTS).forEach(([name,rings])=>rings.forEach(r=>items.push({name,geometry:{type:'Polygon',coordinates:r}}))); continue; }
        let feats=null;
        for (const [dir,ext] of [['geojson','geojson'],['topojson','json'],['topojson','geojson']]) {
          try { feats=toFeatures(await fetchJson(`${dir}/states/${src.slug}.${ext}`),['districts',src.slug]); if (feats.length) break; } catch(e) { console.warn('District file failed:',src.slug,dir,e); }
        }
        if (feats?.length) items.push(...(src.islands?lkSubdivisions(feats):toItems(feats,src.fallback)).filter(it=>!(src.drop||[]).includes(it.name))); else console.warn('No district data for',src.slug);
      }
      const r=finish(items); if (r) return r;
      throw new Error(`Could not load district boundaries for ${key}`);
    }
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
    const label=mode==='districts'?`Loading ${dset().loadName?'the '+dset().loadName:districtKey+'’s districts'}…`:mode==='airports'?'Loading airports map…':mode==='outlines'?'Loading outlines…':'Loading India’s map…';
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
      let context=null;
      if (m==='districts' && DISTRICT_SETS[key].context) { try { let c=mapCache.get('country'); if (!c) { c=await fetchBoundaries(); mapCache.set('country',c); } context=c.filter(f=>!(DISTRICT_SETS[key].contextSkip||[]).includes(f.properties.quizName)); } catch(e) { console.warn('Context layer unavailable',e); } }
      if (token!==loadToken) return; // the player switched mode while this was loading
      if (m==='airports') { featureByName=new Map(airportFeatures.map(f=>[f.properties.quizName,f])); features=airportFeatures; poolNames=AIRPORT_NAMES.slice(); }
      else {
      featureByName=new Map(mapped.map(f=>[f.properties.quizName,f]));
      features=mapped;
      poolNames=m==='districts'?mapped.map(f=>f.properties.quizName).sort((a,b)=>a.localeCompare(b)):ALL.map(x=>x.name);
      }
      drawMap({type:'FeatureCollection',features:mapped,context});
      $('map').classList.add('ready'); updateStats(); showPrompt();
      if (m==='districts') {
        const exp=DISTRICT_SETS[key].expected;
        if (exp && poolNames.length!==exp) { $('map-message').textContent=`Map ready · boundary data has ${poolNames.length} of ${exp} districts`; console.info(`${key}: boundary data has ${poolNames.length} districts, expected ${exp}`); }
      }
    } catch(error) {
      if (token!==loadToken) return;
      console.error(error);
      const what=m==='districts'?(DISTRICT_SETS[key].loadName||`${key}’s district map`):'India’s boundary map';
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
