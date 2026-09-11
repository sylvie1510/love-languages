/* ============================================================
   העברה בין מכשירים · ותזכורת ליומן
   ------------------------------------------------------------
   כל התשובות חיות ב-localStorage של דפדפן אחד. שני הדברים כאן
   הם הדרך להוציא אותן משם: קוד להעברה, ותזכורת חוזרת ליומן.
   ============================================================ */
(function(){
'use strict';

const KEYS = ['lovelang.couple','lovelang.global','lovelang.progress',
              'lovelang.st01','lovelang.st02','lovelang.st03','lovelang.st04','lovelang.st05','lovelang.st06'];

/* ---------- קוד ההעברה ---------- */
/* base64 של UTF-8. לא הצפנה, רק אריזה שאפשר להעתיק בוואטסאפ. */
function pack(){
  const bag = {};
  KEYS.forEach(k=>{ const v = localStorage.getItem(k); if(v) bag[k] = v; });
  const json = JSON.stringify(bag);
  const bytes = new TextEncoder().encode(json);
  let bin = ''; bytes.forEach(b => bin += String.fromCharCode(b));
  return 'LL1.' + btoa(bin);
}
function unpack(code){
  code = String(code||'').trim().replace(/\s+/g,'');
  if(code.indexOf('LL1.') !== 0) throw new Error('זה לא נראה כמו קוד העברה. הוא מתחיל ב-LL1.');
  const bin = atob(code.slice(4));
  const bytes = new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++) bytes[i] = bin.charCodeAt(i);
  const bag = JSON.parse(new TextDecoder().decode(bytes));
  const keys = Object.keys(bag).filter(k => KEYS.indexOf(k) > -1);
  if(!keys.length) throw new Error('הקוד תקין אבל ריק.');
  keys.forEach(k => localStorage.setItem(k, bag[k]));
  return keys.length;
}

/* ---------- תזכורת ליומן ---------- */
const RRULE = {
  'פעם בשבוע':                'FREQ=WEEKLY',
  'כל יום ראשון':              'FREQ=WEEKLY;BYDAY=SU',
  'בסוף כל חודש':              'FREQ=MONTHLY;BYMONTHDAY=-1',
  'בכל פעם שמשהו מרגיש רחוק':  null,
};
function pad(n){ return String(n).padStart(2,'0'); }
function nextSunday(){
  const d = new Date(); d.setHours(20,0,0,0);
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7 || 7));
  return d;
}
function stamp(d){
  return d.getUTCFullYear()+pad(d.getUTCMonth()+1)+pad(d.getUTCDate())+'T'+
         pad(d.getUTCHours())+pad(d.getUTCMinutes())+'00Z';
}
function buildICS(choice, names){
  const rule = RRULE[choice];
  if(!rule) return null;
  const start = nextSunday(), end = new Date(start.getTime() + 30*60000);
  const desc = 'לשאול אחד את השנייה: מה ממלא אותי עכשיו, ומה השתנה מאז הפעם הקודמת.\\n' +
               'ושלוש הפעולות של השבוע, כל אחד בשפה של השני.';
  return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//sylvie//love-languages//HE','CALSCALE:GREGORIAN',
    'BEGIN:VEVENT','UID:lovelang-'+Date.now()+'@sylvie','DTSTAMP:'+stamp(new Date()),
    'DTSTART:'+stamp(start),'DTEND:'+stamp(end),'RRULE:'+rule,
    'SUMMARY:'+(names ? 'חמש שפות · '+names : 'חמש שפות · לשאול מחדש'),
    'DESCRIPTION:'+desc,
    'BEGIN:VALARM','TRIGGER:-PT30M','ACTION:DISPLAY','DESCRIPTION:לשאול מחדש','END:VALARM',
    'END:VEVENT','END:VCALENDAR'].join('\r\n');
}
function download(name, text, type){
  const b = new Blob([text], {type:type||'text/plain;charset=utf-8'});
  const u = URL.createObjectURL(b), a = document.createElement('a');
  a.href = u; a.download = name; document.body.appendChild(a); a.click();
  setTimeout(()=>{ document.body.removeChild(a); URL.revokeObjectURL(u); }, 400);
}

/* ---------- חיווט ---------- */
function say(el, msg, ok){
  const m = el.querySelector('.msg'); if(!m) return;
  m.textContent = msg; m.className = 'msg' + (ok ? ' ok' : '');
}
function boot(){
  const box = document.getElementById('transfer');
  if(box){
    const ta = box.querySelector('textarea');
    box.addEventListener('click', e=>{
      const b = e.target.closest('button'); if(!b) return;
      if(b.dataset.act === 'make'){
        try{
          ta.value = pack();
          ta.select();
          say(box, 'הקוד מוכן. העתיקו אותו, ופתחו את האפליקציה במכשיר השני כדי להדביק שם.', true);
        }catch(err){ say(box, 'לא הצלחתי לייצר קוד: ' + err.message); }
      }
      if(b.dataset.act === 'load'){
        try{
          const n = unpack(ta.value);
          say(box, 'נטענו ' + n + ' חלקים. טוענים מחדש…', true);
          setTimeout(()=>location.reload(), 900);
        }catch(err){ say(box, err.message); }
      }
      if(b.dataset.act === 'file'){
        try{ download('חמש-שפות.txt', pack()); say(box, 'הקובץ ירד. אפשר לשלוח אותו לעצמכם במייל.', true); }
        catch(err){ say(box, 'לא הצלחתי: ' + err.message); }
      }
    });
  }

  const cal = document.getElementById('calbtn');
  if(cal){
    const sync = () => {
      let a = {}; try{ a = JSON.parse(localStorage.getItem('lovelang.st05')||'{}'); }catch(e){}
      const choice = a.checkin || '';
      const ok = !!RRULE[choice];
      cal.disabled = !ok;
      cal.textContent = ok ? 'להוסיף תזכורת ליומן' :
        (choice ? 'הבחירה הזאת לא נכנסת ליומן' : 'בחרו מועד למעלה');
    };
    sync();
    document.addEventListener('click', e=>{
      if(e.target.closest('[data-act="sselect"]')) setTimeout(sync, 60);
    });
    cal.addEventListener('click', ()=>{
      let a = {}, c = {};
      try{ a = JSON.parse(localStorage.getItem('lovelang.st05')||'{}'); }catch(e){}
      try{ c = JSON.parse(localStorage.getItem('lovelang.couple')||'{}'); }catch(e){}
      const names = (c.p||[]).map(p=>p.name).filter(Boolean).join(' & ');
      const ics = buildICS(a.checkin, names);
      if(ics) download('חמש-שפות-לשאול-מחדש.ics', ics, 'text/calendar;charset=utf-8');
    });
  }
}
document.readyState==='loading' ? addEventListener('DOMContentLoaded', boot) : boot();
})();
