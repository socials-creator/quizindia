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
    // One dropdown choice for the Union Territories that have no district quiz of their own (Delhi and J&K are left out on purpose).
    'UTs except DL,JK': {
      slug:'uts-except-dl-jk', context:true,
      modeName:'UT districts', doneTitle:'UT districts mapped!', loadName:'UT district map', of:'the Union Territories (except DL, JK)',
      // Ladakh's 8 districts (Leh, Kargil, Sham, Nubra, Changthang, Zanskar, Drass, Sankoo; per Wikipedia) are cut from the open Leh/Kargil outlines along approximate lines (LADAKH_DISTRICTS). Lakshadweep's 10 sub-divisions are the islands' polygons grouped by nearest island.
      expected:29,
      sources:[{slug:'puducherry'},{slug:'andaman-and-nicobar-islands'},{slug:'dnh-and-dd'},{embed:'ladakh'},{slug:'lakshadweep',islands:true},{slug:'chandigarh',fallback:'Chandigarh'}],
      contextSkip:['Puducherry','Andaman and Nicobar Islands','Dadra and Nagar Haveli and Daman and Diu','Ladakh','Lakshadweep','Chandigarh'],
      districts:['Puducherry','Karaikal','Mahe','Yanam','Nicobar','North and Middle Andaman','South Andaman','Dadra and Nagar Haveli','Daman','Diu','Leh','Kargil','Sham','Nubra','Changthang','Zanskar','Drass','Sankoo','Bitra','Chetlat','Kiltan','Kadmat','Amini','Agatti','Kavaratti','Androth','Kalpeni','Minicoy','Chandigarh'],
      parents:{'Puducherry':'Puducherry','Karaikal':'Puducherry','Mahe':'Puducherry','Yanam':'Puducherry','Nicobar':'Andaman and Nicobar Islands','North and Middle Andaman':'Andaman and Nicobar Islands','South Andaman':'Andaman and Nicobar Islands','Dadra and Nagar Haveli':'Dadra and Nagar Haveli and Daman and Diu','Daman':'Dadra and Nagar Haveli and Daman and Diu','Diu':'Dadra and Nagar Haveli and Daman and Diu','Leh':'Ladakh','Kargil':'Ladakh','Sham':'Ladakh','Nubra':'Ladakh','Changthang':'Ladakh','Zanskar':'Ladakh','Drass':'Ladakh','Sankoo':'Ladakh','Bitra':'Lakshadweep','Chetlat':'Lakshadweep','Kiltan':'Lakshadweep','Kadmat':'Lakshadweep','Amini':'Lakshadweep','Agatti':'Lakshadweep','Kavaratti':'Lakshadweep','Androth':'Lakshadweep','Kalpeni':'Lakshadweep','Minicoy':'Lakshadweep','Chandigarh':'Chandigarh'},
      aliases:{
        'Puducherry':['Pondicherry','Pondicherry District'],'Karaikal':['Karikal'],'Mahe':['Mahé'],'Yanam':['Yanaon'],
        'Nicobar':['Nicobars','Nicobar Islands'],'North and Middle Andaman':['North Middle Andaman','North Andaman','Middle Andaman','North and Middle Andaman Islands','Middle and North Andaman'],'South Andaman':['South Andamans'],
        'Dadra and Nagar Haveli':['Dadra','Nagar Haveli','Dadra Nagar Haveli','DNH'],'Daman':['Daman District'],'Diu':['Diu District'],
        'Leh':['Leh Ladakh','Leh (Ladakh)'],'Drass':['Dras'],'Sankoo':['Sanku'],'Changthang':['Changtang'],'Nubra':['Nubra Valley'],'Androth':['Andrott','Androth Island'],'Kiltan':['Keltan','Kiltan Island'],'Kavaratti':['Kavaratti Island'],'Minicoy':['Maliku','Minicoy Island'],'Kalpeni':['Kalpeni Island'],'Amini':['Amini Island'],'Agatti':['Agatti Island'],'Kadmat':['Kadmat Island','Cadmat'],'Chetlat':['Chetlat Island','Chetlath'],'Bitra':['Bitra Island']
      }
    }
  };
  // Ladakh's 8 districts (Wikipedia): Leh, Kargil, Sham, Nubra, Changthang, Zanskar, Drass, Sankoo. Approximate outlines [lon,lat], cut from the open Leh/Kargil boundaries. Parts of Gilgit-Baltistan/Aksai Chin that the data attaches to Leh are included in Nubra/Changthang.
  const LADAKH_DISTRICTS = {"Leh":[[[77.292,33.037],[77.315,33.033],[77.317,33.043],[77.337,33.048],[77.34,33.085],[77.365,33.078],[77.409,33.084],[77.419,33.134],[77.403,33.17],[77.42,33.197],[77.469,33.199],[77.539,33.156],[77.522,33.217],[77.477,33.274],[77.501,33.299],[77.499,33.329],[77.509,33.343],[77.543,33.359],[77.536,33.374],[77.493,33.389],[77.499,33.412],[77.48,33.42],[77.443,33.492],[77.397,33.491],[77.361,33.475],[77.338,33.491],[77.3,33.485],[77.256,33.527],[77.234,33.588],[77.239,33.6],[77.209,33.62],[77.208,33.637],[77.15,33.677],[77.13,33.683],[77.101,33.67],[77.055,33.707],[77.021,33.703],[76.985,33.724],[76.966,33.712],[76.94,33.716],[76.901,33.742],[76.913,33.759],[76.89,33.781],[76.859,33.774],[76.829,33.794],[76.759,33.805],[76.739,33.83],[76.724,33.822],[76.705,33.853],[76.654,33.9],[77.4,33.9],[77.4,34.42],[77.6,34.3],[77.9,34.35],[78.05,34.32],[77.9,33.85],[77.8,33.6],[77.6,33.0],[77.598,32.932],[77.596,32.927],[77.539,32.887],[77.513,32.877],[77.501,32.885],[77.469,32.859],[77.452,32.864],[77.444,32.88],[77.405,32.883],[77.374,32.855],[77.373,32.823],[77.339,32.817],[77.323,32.851],[77.301,32.85],[77.274,32.874],[77.318,32.895],[77.277,32.995],[77.292,33.037]],[[76.6,33.869],[76.573,33.864],[76.556,33.886],[76.528,33.892],[76.524,33.9],[76.628,33.9],[76.6,33.869]]],"Nubra":[[[75.935,34.624],[75.894,34.545],[75.79,34.5],[75.6,34.502],[75.556,34.494],[75.508,34.457],[75.494,34.412],[75.467,34.383],[75.385,34.357],[75.378,34.387],[75.366,34.392],[75.372,34.407],[75.32,34.435],[75.357,34.53],[75.301,34.589],[75.256,34.606],[75.239,34.628],[75.132,34.647],[75.078,34.639],[75.061,34.626],[75.021,34.626],[74.925,34.663],[74.864,34.663],[74.849,34.674],[74.833,34.663],[74.733,34.671],[74.651,34.697],[74.607,34.726],[74.594,34.757],[74.571,34.768],[74.319,34.786],[74.396,34.804],[74.414,34.799],[74.457,34.852],[74.505,34.863],[74.53,34.857],[74.568,34.873],[74.577,34.91],[74.571,34.966],[74.587,35.01],[74.536,35.031],[74.542,35.067],[74.498,35.107],[74.439,35.118],[74.38,35.058],[74.308,35.06],[74.297,35.044],[74.269,35.035],[74.253,35.037],[74.249,35.067],[74.227,35.067],[74.222,35.086],[74.152,35.093],[74.11,35.13],[74.113,35.152],[74.038,35.147],[74.009,35.166],[73.999,35.184],[73.958,35.174],[73.917,35.212],[73.864,35.21],[73.846,35.229],[73.795,35.245],[73.731,35.217],[73.716,35.225],[73.726,35.278],[73.699,35.323],[73.699,35.358],[73.738,35.427],[73.794,35.46],[73.784,35.525],[73.735,35.536],[73.72,35.553],[73.672,35.551],[73.634,35.571],[73.57,35.554],[73.481,35.577],[73.406,35.563],[73.367,35.605],[73.272,35.629],[73.215,35.675],[73.135,35.719],[73.135,35.793],[73.153,35.841],[73.089,35.883],[73.075,35.885],[73.037,35.854],[72.999,35.863],[72.929,35.845],[72.904,35.853],[72.901,35.881],[72.857,35.877],[72.829,35.887],[72.825,35.874],[72.798,35.867],[72.798,35.855],[72.777,35.843],[72.737,35.858],[72.691,35.832],[72.645,35.866],[72.601,35.871],[72.569,35.907],[72.533,35.917],[72.53,35.952],[72.548,35.962],[72.555,35.996],[72.572,35.996],[72.595,36.027],[72.585,36.05],[72.549,36.056],[72.53,36.074],[72.536,36.114],[72.573,36.15],[72.551,36.18],[72.559,36.212],[72.585,36.23],[72.595,36.262],[72.636,36.276],[72.693,36.25],[72.691,36.275],[72.778,36.309],[72.829,36.36],[72.883,36.387],[72.89,36.424],[72.879,36.443],[72.921,36.462],[72.943,36.458],[72.962,36.467],[72.991,36.457],[73.003,36.476],[72.99,36.48],[72.995,36.514],[73.061,36.537],[73.112,36.609],[73.091,36.634],[73.084,36.699],[73.126,36.686],[73.189,36.721],[73.214,36.699],[73.252,36.709],[73.314,36.706],[73.36,36.715],[73.371,36.734],[73.399,36.731],[73.441,36.744],[73.543,36.709],[73.599,36.72],[73.607,36.698],[73.632,36.689],[73.654,36.695],[73.7,36.684],[73.724,36.71],[73.783,36.701],[73.808,36.716],[73.883,36.698],[73.901,36.707],[73.899,36.749],[73.862,36.787],[73.829,36.789],[73.806,36.815],[73.723,36.834],[73.718,36.857],[73.68,36.885],[73.689,36.912],[73.745,36.896],[73.767,36.904],[73.809,36.896],[73.817,36.885],[73.848,36.899],[73.878,36.894],[73.912,36.871],[73.937,36.873],[73.994,36.826],[74.025,36.826],[74.055,36.806],[74.092,36.838],[74.12,36.832],[74.142,36.839],[74.168,36.902],[74.26,36.886],[74.368,36.958],[74.415,36.972],[74.429,36.99],[74.531,36.986],[74.554,36.953],[74.577,36.948],[74.586,37.045],[74.658,37.057],[74.708,37.077],[74.734,37.02],[74.751,37.011],[74.778,37.029],[74.839,37.022],[74.845,36.99],[74.921,36.906],[74.94,36.934],[75.018,36.976],[75.095,36.942],[75.15,36.966],[75.208,37.036],[75.264,37.051],[75.343,37.052],[75.351,36.98],[75.375,36.96],[75.4,36.967],[75.422,36.96],[75.426,36.938],[75.408,36.916],[75.413,36.891],[75.443,36.886],[75.473,36.81],[75.615,36.761],[75.674,36.695],[75.747,36.588],[75.768,36.573],[75.848,36.544],[75.922,36.502],[76.076,36.474],[76.172,36.39],[76.198,36.387],[76.254,36.347],[76.351,36.359],[76.431,36.308],[76.449,36.269],[76.432,36.251],[76.456,36.24],[76.48,36.211],[76.543,36.192],[76.562,36.172],[76.6,36.165],[76.643,36.183],[76.702,36.128],[76.719,36.083],[76.8,36.048],[76.807,36.018],[76.769,36.009],[76.721,35.953],[76.778,35.898],[76.811,35.844],[76.857,35.831],[76.894,35.799],[76.934,35.784],[77.02,35.774],[77.079,35.797],[77.114,35.797],[77.142,35.769],[77.163,35.766],[77.166,35.734],[77.22,35.728],[77.227,35.712],[77.267,35.708],[77.276,35.72],[77.314,35.699],[77.326,35.719],[77.357,35.717],[77.4,35.662],[77.43,35.654],[77.436,35.622],[77.426,35.61],[77.455,35.593],[77.464,35.573],[77.459,35.547],[77.485,35.532],[77.471,35.52],[77.451,35.526],[77.434,35.517],[77.377,35.55],[77.319,35.532],[77.348,35.493],[77.438,35.461],[77.511,35.488],[77.568,35.485],[77.613,35.469],[77.643,35.489],[77.671,35.47],[77.722,35.475],[77.723,35.515],[77.732,35.524],[77.771,35.495],[77.817,35.512],[77.863,35.481],[77.886,35.485],[77.9,35.467],[77.921,35.494],[77.981,35.455],[77.983,35.464],[77.964,35.478],[77.963,35.496],[77.93,35.515],[77.965,35.571],[77.951,35.606],[77.99,35.582],[78.04,35.587],[78.05,35.577],[78.05,34.32],[77.9,34.35],[77.6,34.3],[77.4,34.42],[76.85,34.55],[76.5,34.78],[76.0,34.8],[76.0,34.725],[75.973,34.734],[75.935,34.624]]],"Sham":[[[76.628,33.9],[76.524,33.9],[76.517,33.915],[76.529,33.935],[76.515,33.945],[76.554,34.003],[76.584,34.007],[76.58,34.045],[76.608,34.064],[76.661,34.061],[76.688,34.08],[76.662,34.145],[76.682,34.178],[76.672,34.22],[76.676,34.238],[76.691,34.24],[76.702,34.256],[76.703,34.305],[76.723,34.325],[76.625,34.377],[76.59,34.415],[76.564,34.425],[76.574,34.455],[76.557,34.488],[76.549,34.544],[76.561,34.57],[76.53,34.574],[76.525,34.595],[76.476,34.575],[76.453,34.58],[76.473,34.634],[76.449,34.658],[76.445,34.686],[76.42,34.72],[76.279,34.682],[76.236,34.66],[76.216,34.676],[76.133,34.663],[76.043,34.685],[76.016,34.719],[76.0,34.725],[76.0,34.8],[76.5,34.78],[76.85,34.55],[77.4,34.42],[77.4,33.9],[76.654,33.9],[76.646,33.907],[76.628,33.9]]],"Changthang":[[[78.091,35.556],[78.136,35.539],[78.155,35.552],[78.15,35.578],[78.165,35.613],[78.161,35.629],[78.185,35.624],[78.198,35.669],[78.254,35.645],[78.27,35.669],[78.272,35.722],[78.337,35.72],[78.385,35.735],[78.422,35.785],[78.52,35.764],[78.559,35.792],[78.574,35.789],[78.579,35.807],[78.618,35.817],[78.664,35.857],[78.767,35.869],[78.822,35.855],[78.938,35.879],[78.959,35.892],[79.02,35.848],[79.131,35.836],[79.193,35.886],[79.188,35.947],[79.214,35.978],[79.377,35.995],[79.385,35.99],[79.402,35.918],[79.421,35.896],[79.517,35.883],[79.559,35.862],[79.711,35.819],[79.736,35.801],[79.87,35.783],[79.929,35.827],[79.971,35.84],[79.998,35.837],[80.037,35.799],[80.056,35.749],[80.087,35.725],[80.106,35.681],[80.236,35.642],[80.29,35.607],[80.326,35.469],[80.296,35.46],[80.28,35.441],[80.282,35.388],[80.27,35.344],[80.234,35.276],[80.224,35.22],[80.182,35.166],[80.184,35.063],[80.173,35.002],[80.122,34.893],[80.071,34.828],[80.067,34.714],[79.943,34.681],[79.859,34.689],[79.815,34.643],[79.774,34.627],[79.791,34.589],[79.77,34.582],[79.757,34.554],[79.809,34.531],[79.813,34.5],[79.793,34.485],[79.661,34.479],[79.592,34.501],[79.569,34.486],[79.507,34.474],[79.526,34.445],[79.527,34.418],[79.56,34.41],[79.552,34.387],[79.558,34.332],[79.59,34.282],[79.584,34.244],[79.571,34.223],[79.543,34.207],[79.518,34.213],[79.506,34.205],[79.488,34.157],[79.493,34.136],[79.418,34.078],[79.413,34.054],[79.436,34.028],[79.425,34.017],[79.354,34.037],[79.197,34.051],[79.17,34.073],[79.15,34.068],[79.134,34.027],[79.111,34.019],[79.061,34.029],[79.021,34.05],[78.95,34.029],[78.904,33.976],[78.947,33.92],[78.942,33.908],[78.999,33.803],[79.018,33.799],[79.015,33.778],[79.033,33.783],[79.046,33.766],[79.059,33.78],[79.067,33.756],[79.042,33.75],[79.019,33.706],[79.053,33.678],[79.09,33.686],[79.089,33.657],[79.105,33.617],[79.046,33.627],[78.988,33.611],[78.921,33.633],[78.913,33.627],[78.914,33.574],[78.942,33.509],[78.93,33.474],[78.932,33.432],[78.948,33.408],[78.952,33.381],[78.967,33.375],[78.988,33.333],[79.017,33.335],[79.109,33.292],[79.239,33.297],[79.314,33.273],[79.368,33.282],[79.454,33.258],[79.445,33.205],[79.376,33.085],[79.392,33.036],[79.331,33.012],[79.383,32.989],[79.384,32.968],[79.421,32.961],[79.567,32.786],[79.586,32.774],[79.602,32.777],[79.625,32.739],[79.514,32.608],[79.469,32.576],[79.447,32.532],[79.406,32.53],[79.393,32.572],[79.319,32.592],[79.293,32.55],[79.272,32.532],[79.249,32.534],[79.237,32.505],[79.194,32.483],[79.136,32.477],[79.13,32.466],[79.145,32.443],[79.143,32.423],[79.124,32.413],[79.113,32.384],[79.032,32.386],[79.013,32.377],[78.98,32.338],[78.96,32.366],[78.902,32.393],[78.858,32.44],[78.826,32.439],[78.775,32.558],[78.775,32.573],[78.795,32.598],[78.761,32.655],[78.766,32.697],[78.722,32.661],[78.661,32.654],[78.638,32.61],[78.62,32.596],[78.572,32.618],[78.534,32.609],[78.498,32.581],[78.459,32.58],[78.436,32.562],[78.427,32.532],[78.398,32.526],[78.327,32.472],[78.295,32.504],[78.315,32.526],[78.313,32.574],[78.348,32.581],[78.405,32.62],[78.388,32.634],[78.379,32.668],[78.394,32.716],[78.388,32.757],[78.356,32.758],[78.304,32.734],[78.312,32.709],[78.253,32.691],[78.246,32.672],[78.22,32.665],[78.143,32.682],[78.147,32.654],[78.111,32.663],[78.093,32.648],[78.099,32.63],[78.087,32.624],[78.061,32.626],[78.047,32.645],[78.016,32.62],[77.97,32.647],[77.971,32.655],[77.946,32.662],[77.919,32.691],[77.934,32.726],[77.926,32.772],[77.904,32.772],[77.884,32.788],[77.888,32.799],[77.869,32.827],[77.839,32.842],[77.826,32.836],[77.781,32.866],[77.789,32.891],[77.811,32.907],[77.741,32.969],[77.72,32.969],[77.713,32.982],[77.683,32.989],[77.674,32.961],[77.602,32.943],[77.598,32.932],[77.6,33.0],[77.8,33.6],[77.9,33.85],[78.05,34.32],[78.05,35.577],[78.076,35.549],[78.091,35.556]]],"Kargil":[[[76.016,34.719],[76.043,34.685],[76.133,34.663],[76.216,34.676],[76.236,34.66],[76.279,34.682],[76.42,34.72],[76.445,34.686],[76.449,34.658],[76.473,34.634],[76.453,34.58],[76.476,34.575],[76.525,34.595],[76.53,34.574],[76.561,34.57],[76.549,34.544],[76.557,34.488],[76.574,34.455],[76.564,34.425],[76.59,34.415],[76.625,34.377],[76.723,34.325],[76.703,34.305],[76.702,34.256],[76.691,34.24],[76.676,34.238],[76.672,34.22],[76.682,34.178],[76.662,34.145],[76.688,34.08],[76.661,34.061],[76.608,34.064],[76.58,34.045],[76.584,34.007],[76.554,34.003],[76.552,34.0],[76.4,34.03],[76.55,34.1],[76.5,34.38],[75.97,34.38],[75.973,34.734],[76.016,34.719]]],"Drass":[[[75.699,34.215],[75.692,34.231],[75.675,34.228],[75.655,34.243],[75.595,34.198],[75.58,34.215],[75.555,34.212],[75.497,34.233],[75.475,34.281],[75.414,34.283],[75.393,34.295],[75.397,34.321],[75.377,34.348],[75.467,34.383],[75.494,34.412],[75.508,34.457],[75.556,34.494],[75.6,34.502],[75.79,34.5],[75.894,34.545],[75.935,34.624],[75.97,34.725],[75.97,34.12],[75.71,34.12],[75.687,34.159],[75.699,34.215]]],"Sankoo":[[[75.979,34.002],[75.981,33.979],[75.943,33.987],[75.864,33.979],[75.857,33.969],[75.862,34.017],[75.82,34.045],[75.8,34.043],[75.773,34.055],[75.748,34.097],[75.71,34.12],[75.97,34.12],[75.97,34.38],[76.5,34.38],[76.55,34.1],[76.4,34.03],[76.032,33.972],[76.022,33.997],[75.979,34.002]]],"Zanskar":[[[77.419,33.196],[77.403,33.17],[77.419,33.134],[77.409,33.084],[77.365,33.078],[77.34,33.085],[77.337,33.048],[77.317,33.043],[77.315,33.033],[77.292,33.037],[77.277,32.995],[77.318,32.895],[77.304,32.883],[77.254,32.864],[77.237,32.881],[77.244,32.893],[77.199,32.909],[77.188,32.929],[77.17,32.911],[77.157,32.912],[77.164,32.937],[77.161,32.953],[77.149,32.956],[77.15,32.978],[77.116,32.985],[77.111,32.975],[77.086,32.972],[77.049,32.999],[77.01,32.989],[76.993,33.002],[76.972,33.001],[76.933,33.028],[76.905,33.079],[76.909,33.094],[76.885,33.121],[76.855,33.114],[76.844,33.138],[76.817,33.16],[76.817,33.194],[76.834,33.205],[76.825,33.215],[76.843,33.247],[76.831,33.249],[76.82,33.236],[76.799,33.256],[76.756,33.248],[76.738,33.261],[76.718,33.329],[76.696,33.328],[76.671,33.342],[76.632,33.41],[76.629,33.435],[76.616,33.44],[76.581,33.426],[76.569,33.466],[76.549,33.465],[76.509,33.499],[76.502,33.516],[76.459,33.534],[76.465,33.545],[76.45,33.563],[76.436,33.542],[76.415,33.539],[76.38,33.553],[76.381,33.577],[76.359,33.604],[76.308,33.61],[76.3,33.599],[76.31,33.572],[76.26,33.565],[76.246,33.545],[76.225,33.547],[76.205,33.569],[76.225,33.577],[76.232,33.587],[76.224,33.601],[76.24,33.605],[76.229,33.63],[76.271,33.643],[76.284,33.661],[76.266,33.68],[76.265,33.747],[76.239,33.772],[76.201,33.775],[76.17,33.795],[76.14,33.849],[76.098,33.876],[76.048,33.929],[76.032,33.972],[76.4,34.03],[76.552,34.0],[76.515,33.945],[76.529,33.935],[76.517,33.915],[76.528,33.892],[76.556,33.886],[76.573,33.864],[76.6,33.869],[76.622,33.898],[76.646,33.907],[76.705,33.853],[76.724,33.822],[76.739,33.83],[76.759,33.805],[76.829,33.794],[76.859,33.774],[76.89,33.781],[76.913,33.759],[76.901,33.742],[76.94,33.716],[76.966,33.712],[76.985,33.724],[77.021,33.703],[77.055,33.707],[77.101,33.67],[77.13,33.683],[77.15,33.677],[77.208,33.637],[77.209,33.62],[77.239,33.6],[77.234,33.588],[77.256,33.527],[77.3,33.485],[77.338,33.491],[77.361,33.475],[77.397,33.491],[77.443,33.492],[77.48,33.42],[77.499,33.412],[77.493,33.389],[77.536,33.374],[77.543,33.359],[77.509,33.343],[77.499,33.329],[77.501,33.299],[77.477,33.274],[77.522,33.217],[77.539,33.156],[77.455,33.204],[77.419,33.196]]]};
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
      const merged=mergeFeatures(splitDistrict(items.filter(x=>x.name),cfg),'District');
      return merged.size>=2 ? [...merged.values()] : null;
    };
    const build=feats=>finish(toItems(feats));
    // Several boundary files combined into one quiz (e.g. the Union Territories)
    if (cfg.sources) {
      const items=[];
      for (const src of cfg.sources) {
        if (src.embed) { Object.entries(LADAKH_DISTRICTS).forEach(([name,rings])=>rings.forEach(r=>items.push({name,geometry:{type:'Polygon',coordinates:[r]}}))); continue; }
        let feats=null;
        for (const [dir,ext] of [['geojson','geojson'],['topojson','json'],['topojson','geojson']]) {
          try { feats=toFeatures(await fetchJson(`${dir}/states/${src.slug}.${ext}`),['districts',src.slug]); if (feats.length) break; } catch(e) { console.warn('District file failed:',src.slug,dir,e); }
        }
        if (feats?.length) items.push(...(src.islands?lkSubdivisions(feats):toItems(feats,src.fallback))); else console.warn('No district data for',src.slug);
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
