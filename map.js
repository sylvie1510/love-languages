/* ============================================================
   המילון שלנו · מרכיב את כל ארבע התחנות לעמוד אחד להדפסה
   ============================================================ */
(function(){
'use strict';
const get = k => { try{ return JSON.parse(localStorage.getItem(k)||'{}'); }catch(e){ return {}; } };
const esc = s => String(s==null?'':s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

const LANGS = {
  words:  {label:'מילים מחזקות', need:'הצורך להרגיש מוערך וחשוב'},
  time:   {label:'זמן איכות',    need:'הצורך להרגיש בעדיפות'},
  gifts:  {label:'מתנות ומחוות', need:'הצורך להרגיש השקעה ומחשבה'},
  service:{label:'מעשי שירות',   need:'הצורך בתמיכה ושותפות'},
  touch:  {label:'מגע',          need:'הצורך בביטחון וקירבה'},
};
const OBJ = {
  told:   'כשאומרים לי מה לעשות, זה מוריד מהנתינה',
  natural:'זה פשוט לא טבעי לי',
  forced: 'זה מרגיש מאולץ לקבל הנחיות',
  count:  'אם צריך לבקש, זה לא נחשב',
};

function render(){
  const el = document.getElementById('map'); if(!el) return;
  const couple = get('lovelang.couple');
  const P = couple.p || [{name:'',g:'f'},{name:'',g:'m'}];
  const G  = get('lovelang.global');
  const S3 = get('lovelang.st04');   /* המבטא הזר */
  const S4 = get('lovelang.st05');   /* להתנהג אהבה */
  const names = P.map(p=>p.name).filter(Boolean).join(' & ');
  const pick = (o,f,i) => ((o[f]||[])[i]) || '';
  let any = false;

  const people = P.map((p,i)=>{
    const you  = P[1-i];
    const mine = LANGS[pick(G,'primary',i)];
    const need = LANGS[pick(G,'primary',1-i)];
    const list = (((G.loved||[])[1-i])||[]).filter(Boolean);       /* הרשימה שלהם, שהיא המשימה שלי */
    const acts = (((S4.actions||[])[i])||[]).filter(Boolean);
    if(mine || list.length || acts.length) any = true;

    const rows = [];
    if(mine) rows.push(`<div class="row"><span>השפה שלי</span><b>${esc(mine.label)}</b></div>`);
    if(need) rows.push(`<div class="row"><span>השפה של ${esc(you.name||'·')}</span><b>${esc(need.label)}</b></div>`);
    const m = p.g === 'm';
    const eff = pick(S4,'effort',i), felt = pick(S4,'felt',i);
    if(eff)  rows.push(`<div class="row"><span>כמה אני ${m?'מתאמץ':'מתאמצת'}</span><b>${esc(eff)} מתוך 10</b></div>`);
    if(felt) rows.push(`<div class="row"><span>כמה אני ${m?'מרגיש אהוב':'מרגישה אהובה'}</span><b>${esc(felt)} מתוך 10</b></div>`);

    const obj = OBJ[pick(S3,'objection',i)];
    const tryv = pick(S3,'try',i);
    const askf = pick(S4,'askfor',i);

    return `<div class="person">
      <div class="hd"><b>${esc(p.name)||'·'}</b>${mine?`<span>${esc(mine.label)}</span>`:''}</div>
      ${rows.join('')}
      ${list.length?`<div class="lst do"><strong>מה שממלא את ${esc(you.name||'·')}, במילים ${P[1-i].g==='m'?'שלו':'שלה'}</strong>
        <ol>${list.map(x=>`<li>${esc(x)}</li>`).join('')}</ol></div>`:''}
      ${acts.length?`<div class="lst"><strong>שלוש הפעולות שלי השבוע</strong>
        <ol>${acts.map(x=>`<li>${esc(x)}</li>`).join('')}</ol></div>`:''}
      ${obj?`<p class="early-p"><strong>מה עוצר אותי</strong>${esc(obj)}</p>`:''}
      ${tryv?`<p class="early-p"><strong>ומה אני מנסה בכל זאת</strong>${esc(tryv)}</p>`:''}
      ${askf?`<p class="early-p"><strong>ומה אני ${m?'מבקש':'מבקשת'} לעצמי</strong>${esc(askf)}</p>`:''}
    </div>`;
  }).join('');

  if(!any){
    el.innerHTML = `<div class="cardhead"><b>המילון שלנו</b></div>
      <p class="hint" style="padding:1.5rem 0;color:var(--ink-soft)">
        המילון ייבנה כאן מעצמו, ככל שתעברו את התחנות. אפשר להתחיל מהתחנה הראשונה.</p>`;
    return;
  }

  const checkin = S4.checkin || '';
  el.innerHTML = `<div class="cardhead"><b>המילון שלנו</b><span>${esc(names)}</span></div>
    ${people}
    <div class="agreement"><h4>ההסכם שלנו</h4>
      <div class="row"><span>מתי נעצור ונשאל מחדש</span><b>${esc(checkin||'·')}</b></div>
      <p class="full">שלוש פעולות בשבוע, כל אחד בשפה של השני.<br>
        לא כדי לסמן וי, אלא כדי שהשריר ייבנה.<br>
        וזה שאנחנו אוהבים לא בהכרח אומר שהשני מרגיש אהוב. לכן ממשיכים לשאול.</p>
    </div>`;
}

document.readyState==='loading' ? addEventListener('DOMContentLoaded', render) : render();
})();
