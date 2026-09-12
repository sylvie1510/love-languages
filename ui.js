/* ============================================================
   שכבת החוויה · נגן ההנחיה, רגע הנשימה, דלי האהבה, תזכורת היומן
   ------------------------------------------------------------
   נטענת אחרי engine.js. לא נוגעת בתוכן, רק מוסיפה סביבו.
   ============================================================ */
(function(){
'use strict';
const num = () => (window.STATION ? STATION.num : null);
const esc = s => String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ============================================================
   1 · נגן ההנחיה הקולית
   מחפש audio/NN.mp3. אם אין קובץ, מסיר את עצמו בשקט.
   ============================================================ */
function audio(){
  const n = num(); if(!n) return;
  const cover = document.getElementById('cover'); if(!cover) return;

  const box = document.createElement('div');
  box.className = 'voicedrop';
  box.innerHTML = `
    <button type="button" class="vd-play" aria-label="להשמיע את ההנחיה">
      <svg viewBox="0 0 24 24" class="vd-ico vd-p" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>
      <svg viewBox="0 0 24 24" class="vd-ico vd-s" aria-hidden="true"><rect x="7.5" y="5.5" width="3.2" height="13" rx="1"/><rect x="13.3" y="5.5" width="3.2" height="13" rx="1"/></svg>
    </button>
    <div class="vd-body">
      <div class="vd-label">הקשיבו להנחיה קולית לפני שמתחילים · 60 שניות</div>
      <div class="vd-track"><i></i></div>
    </div>
    <audio preload="metadata" src="audio/${esc(n)}.mp3"></audio>`;

  const hint = cover.querySelector('.scroll-hint');
  (hint ? hint.parentNode.insertBefore(box, hint) : cover.firstElementChild.appendChild(box));

  const au   = box.querySelector('audio');
  const btn  = box.querySelector('.vd-play');
  const fill = box.querySelector('.vd-track i');
  const track= box.querySelector('.vd-track');

  /* אין קובץ · לא משאירים נגן שבור על הדף */
  au.addEventListener('error', () => box.remove());
  au.addEventListener('loadedmetadata', () => {
    if(!isFinite(au.duration) || au.duration < 1){ box.remove(); return; }
    /* התגית אומרת את האורך האמיתי של הקובץ, לא מספר קבוע */
    const secs = Math.round(au.duration);
    box.querySelector('.vd-label').textContent =
      'הקשיבו להנחיה קולית לפני שמתחילים · ' + secs + ' שניות';
    box.classList.add('ready');
  });

  btn.addEventListener('click', () => {
    if(au.paused){ au.play(); } else { au.pause(); }
  });
  au.addEventListener('play',  () => box.classList.add('playing'));
  au.addEventListener('pause', () => box.classList.remove('playing'));
  au.addEventListener('ended', () => { box.classList.remove('playing'); fill.style.width='0%'; });
  au.addEventListener('timeupdate', () => {
    if(au.duration) fill.style.width = (au.currentTime/au.duration*100)+'%';
  });
  track.addEventListener('click', e => {
    if(!au.duration) return;
    const r = track.getBoundingClientRect();
    /* RTL · ההתקדמות רצה מימין לשמאל */
    au.currentTime = ((r.right - e.clientX) / r.width) * au.duration;
  });
}

/* ============================================================
   2 · רגע נשימה · לפני תחנה 04
   ============================================================ */
function breathe(){
  if(num() !== '04') return;
  const gate = document.getElementById('gate'); if(!gate) return;
  const sec = document.createElement('section');
  sec.className = 'wrap';
  sec.innerHTML = `
    <div class="rv in">
      <div class="breathe">
        <div class="br-ring"><span class="br-core"></span></div>
        <div class="br-copy">
          <div class="eyebrow">רגע לפני</div>
          <h3>קחו נשימה אחת יחד</h3>
          <p>הרפו את הכתפיים. הניחו יד על הלב. שאפו עם המעגל כשהוא גדל, נשפו כשהוא מתכווץ.</p>
          <p class="tiny">התחנה הזאת נוגעת בהתנגדות, והיא יושבת יותר טוב בגוף רגוע.</p>
        </div>
      </div>
    </div>`;
  gate.insertBefore(sec, gate.firstChild);
}

/* ============================================================
   3 · דלי האהבה · לב שמתמלא לפי החוגה
   ============================================================ */
function bucket(){
  const host = document.querySelector('[data-widget="dial"][data-field="tank"]');
  if(!host) return;
  const C = window.LoveLang ? LoveLang.couple : null; if(!C) return;

  const wrap = document.createElement('div');
  wrap.className = 'buckets';
  host.insertAdjacentElement('afterend', wrap);

  const draw = () => {
    let G = {}; try{ G = JSON.parse(localStorage.getItem('lovelang.global')||'{}'); }catch(e){}
    const vals = G.tank || ['',''];
    const people = C.solo ? [C.p[0]] : C.p;
    wrap.innerHTML = people.map((p,i)=>{
      const v = +(vals[i]||0);
      const pct = Math.max(0, Math.min(100, v*10));
      const id = 'bk'+i+'_'+Math.random().toString(36).slice(2,7);
      return `<figure class="bucket${v?' on':''}">
        <svg viewBox="0 0 100 92" role="img" aria-label="דלי האהבה ${esc(p.name||'')} · ${v} מתוך 10">
          <defs>
            <clipPath id="${id}">
              <path d="M50 88C24 70 6 53 6 33 6 18 17 8 30 8c9 0 16 5 20 11 4-6 11-11 20-11 13 0 24 10 24 25 0 20-18 37-44 55z"/>
            </clipPath>
          </defs>
          <path class="bk-out" d="M50 88C24 70 6 53 6 33 6 18 17 8 30 8c9 0 16 5 20 11 4-6 11-11 20-11 13 0 24 10 24 25 0 20-18 37-44 55z"/>
          <g clip-path="url(#${id})">
            <rect class="bk-fill" x="0" y="${100-pct}" width="100" height="100"></rect>
          </g>
        </svg>
        <figcaption>${esc(p.name)||'·'}<span>${v?v+' מתוך 10':'עוד לא'}</span></figcaption>
      </figure>`;
    }).join('');
  };
  draw();
  document.addEventListener('click', e => {
    if(e.target.closest('[data-act="dial"][data-f="tank"]')) setTimeout(draw, 40);
  });
}

/* ============================================================
   4 · תזכורת ליומן גוגל · תחנות 06 ו-07
   ============================================================ */
function calendar(){
  const n = num(); if(n !== '06' && n !== '07') return;
  const sec = document.getElementById('cardsec'); if(!sec) return;
  const row = sec.querySelector('.btnrow'); if(!row) return;

  const weekly = (n === '06');
  const pad = x => String(x).padStart(2,'0');
  const d = new Date(); d.setHours(20,0,0,0);
  d.setDate(d.getDate() + (weekly ? ((7 - d.getDay()) % 7 || 7) : 28));
  const end = new Date(d.getTime() + 30*60000);
  const st = x => x.getUTCFullYear()+pad(x.getUTCMonth()+1)+pad(x.getUTCDate())+'T'+
                  pad(x.getUTCHours())+pad(x.getUTCMinutes())+'00Z';

  let names = '';
  try{ const c = JSON.parse(localStorage.getItem('lovelang.couple')||'{}');
       names = (c.p||[]).map(p=>p.name).filter(Boolean).join(' & '); }catch(e){}

  const home = location.protocol === 'file:'
    ? 'https://sylvie1510.github.io/love-languages/'
    : location.origin + location.pathname.replace(/[^/]*$/,'');

  const p = new URLSearchParams({
    action:'TEMPLATE',
    text: 'צ׳ק-אין זוגי · חמש שפות' + (names ? ' · '+names : ''),
    details: 'לשאול אחד את השנייה מה ממלא אותנו עכשיו, ומה השתנה מאז הפעם הקודמת.\n\n' + home + 'station-' + n + '.html',
    dates: st(d)+'/'+st(end),
    recur: 'RRULE:' + (weekly ? 'FREQ=WEEKLY;BYDAY=SU' : 'FREQ=MONTHLY'),
  });
  const a = document.createElement('a');
  a.className = 'btn nudge';
  a.target = '_blank'; a.rel = 'noopener';
  a.href = 'https://calendar.google.com/calendar/render?' + p.toString();
  a.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>' +
                'הוסיפו תזכורת ליומן לצ׳ק-אין הזוגי שלנו';
  row.appendChild(a);
}

/* ============================================================
   5 · מד המסע · איפה הזוג נמצא מבין שבע התחנות
   ============================================================ */
const STATIONS = [
  {n:'01', t:'השפה שלי'}, {n:'02', t:'הצינורות'}, {n:'03', t:'השפה שלך'},
  {n:'04', t:'המבטא הזר'}, {n:'05', t:'להתנהג אהבה'},
  {n:'06', t:'כשרק אחד זז'}, {n:'07', t:'כשזה לא מתמלא'},
];
function journey(){
  const host = document.getElementById('journey'); if(!host) return;
  let pr = {}; try{ pr = JSON.parse(localStorage.getItem('lovelang.progress')||'{}'); }catch(e){}
  const done = STATIONS.filter(x => pr[x.n]).length;
  const core = STATIONS.slice(0,5).filter(x => pr[x.n]).length;
  host.innerHTML = `
    <div class="jr-head">
      <span class="jr-title">${done ? 'איפה אתם במסע' : 'המסע שלכם מתחיל כאן'}</span>
      <span class="jr-count">${done} מתוך ${STATIONS.length}</span>
    </div>
    <ol class="jr-dots">${STATIONS.map(x=>`
      <li class="${pr[x.n]?'done':''}" title="${esc(x.n)} · ${esc(x.t)}">
        <i></i><span>${esc(x.n)}</span></li>`).join('')}</ol>
    ${core===5 ? '<p class="jr-note">עברתם את חמש התחנות. שתיים האחרונות מחכות לשבועות שאחרי.</p>' : ''}`;
}

function boot(){ audio(); breathe(); bucket(); calendar(); journey(); }
document.readyState==='loading' ? addEventListener('DOMContentLoaded', boot) : boot();
})();
