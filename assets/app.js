const $=id=>document.getElementById(id),W=window.W,FIELDS=window.FIELDS,LEVELS=window.LEVELS,bdt=n=>'৳ '+Math.round(n).toLocaleString('en-BD');
const root=document.documentElement;let cur=null;
function theme(t){root.dataset.theme=t;$('theme').textContent=t=='dark'?'☀ Raise the sun':'☾ Wait for moonrise';try{localStorage.setItem('theme',t)}catch(e){}}
let s='light';try{s=localStorage.getItem('theme')||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light')}catch(e){}
theme(s);$('theme').onclick=()=>theme(root.dataset.theme=='dark'?'light':'dark');
const opts=(a,fn)=>a.map(fn).join(''),ph='<option value="">Select...</option>';
function list(f=''){ $('countries').innerHTML=''; W.filter(c=>c.name.toLowerCase().includes(f.toLowerCase())).forEach(c=>{
 const b=document.createElement('button');b.type='button';b.setAttribute('aria-pressed',cur&&cur.code==c.code);b.innerHTML=`<span>${c.flag}</span>${c.name}`;b.onclick=()=>pick(c);$('countries').appendChild(b)});}
$('q').placeholder='Search '+W.length+' countries';list();$('q').oninput=e=>list(e.target.value);
$('level').innerHTML=opts(Object.keys(LEVELS),k=>`<option>${k}</option>`);
function fee(base){return base*FIELDS[$('field').value]*LEVELS[$('level').value]}
function fieldOpts(){const u=uni();const k=$('field').value;$('field').innerHTML=ph+opts(Object.keys(FIELDS),f=>`<option value="${f}">${f}${u?': '+bdt(u.base*FIELDS[f]*LEVELS[$('level').value])+'/yr':''}</option>`);$('field').value=k}
const city=()=>cur&&cur.cities[$('city').value],uni=()=>{const c=city();return c&&c.unis.find(u=>u.name==$('uni').value)};
function pick(c){cur=c;list($('q').value);const v=c.vinfo;
 $('infoList').innerHTML=[['Cities charted',Object.keys(c.cities).join(', ')],
 ['Visa centre',`<b>${v.place}</b>${v.addr?'<br>'+v.addr:''}${v.verified?'':'<br><i>Exact address not verified</i>'}<br>${v.note}<br><a href="${v.map}" target="_blank" rel="noopener">Open on map</a>${v.url?` · <a href="${v.url}" target="_blank" rel="noopener">Official site</a>`:''}`],
 ['Visa cost',bdt(c.visa)],['Return flight',bdt(c.flight)],['Permanent residence',c.pr]].map(([k,x])=>`<dt>${k}</dt><dd>${x}</dd>`).join('');
 $('city').innerHTML=ph+opts(Object.keys(c.cities),n=>`<option>${n}</option>`);$('uni').innerHTML=ph;$('acc').innerHTML=ph;fieldOpts();
 ['info','plan'].forEach(i=>$(i).classList.remove('hide'));$('result').classList.add('hide');$('info').scrollIntoView({behavior:'smooth'})}
$('city').onchange=()=>{const ct=city();if(!ct)return;
 const g=t=>{const l=ct.unis.filter(u=>u.type==t);return l.length?`<optgroup label="${t=='public'?'Public':'Private'} universities">`+opts(l,u=>`<option>${u.name}</option>`)+'</optgroup>':''};
 $('uni').innerHTML=ph+g('public')+g('private');$('acc').innerHTML=ph+opts(Object.entries(ct.acc),([n,r])=>`<option value="${n}">${n}: ${bdt(r)}/month</option>`);fieldOpts();calc()};
$('uni').onchange=()=>{fieldOpts();calc()};$('level').onchange=()=>{fieldOpts();calc()};
['field','acc','trips'].forEach(i=>$(i).onchange=calc);
function calc(){const b={country:cur.code,city:$('city').value,uni:$('uni').value,field:$('field').value,level:$('level').value,acc:$('acc').value,trips:$('trips').value};
 if(!b.city||!b.uni||!b.field||!b.acc){$('result').classList.add('hide');return}
 const j=compute(b);$('result').classList.remove('hide');
 if(j.error){$('err').textContent=j.error;$('out').innerHTML='';return}$('err').textContent='';
 const rows=Object.entries(j.items).map(([k,v])=>`<tr><td>${k}</td><td><i class="bar"><u style="width:${(v/j.recurring*100).toFixed(1)}%"></u></i></td><td>${(v/j.recurring*100).toFixed(0)}%</td><td>${bdt(v)}</td></tr>`).join('');
 $('out').innerHTML=`<table>${rows}<tr><td>Visa (first year only)</td><td></td><td></td><td>${bdt(j.visa)}</td></tr></table>
 <div class="chest"><div><small>Year 1 total</small><strong>${bdt(j.year1)}</strong><small>${bdt(j.monthly)} a month</small></div>
 <div><small>Each later year</small><strong>${bdt(j.recurring)}</strong><small>${bdt(j.monthlyLater)} a month</small></div>
 <div><small>Whole degree (${j.years} yr${j.years>1?'s':''})</small><strong>${bdt(j.program)}</strong><small>typical length</small></div></div>
 <p class="rank">For this subject and level, ${cur.name} ranks <b>#${j.rank}</b> of ${j.n} for lowest first-year cost (shared room, one flight, first listed university).</p>
 <h3>Cheapest ports for the same course</h3><ol>${opts(j.cheapest,x=>`<li>${x.flag} ${x.name}: ${bdt(x.y1)}</li>`)}</ol>`}

function costs(c,ct,u,f,l,acc,trips){const liv=c.liv*ct.mult;return{'Tuition fee':Math.round(u.base*FIELDS[f]*LEVELS[l]),'Room rent':ct.acc[acc]*12,'Food':Math.round(liv*.55*12),'Local transport':Math.round(liv*.15*12),'Other living costs':Math.round(liv*.30*12),'Return flights':c.flight*trips}}
const sum=o=>Object.values(o).reduce((x,y)=>x+y,0);
function compute(b){const ct=cur.cities[b.city],u=ct.unis.find(x=>x.name==b.uni),trips=Math.max(0,Math.min(4,parseInt(b.trips)||0));
 const items=costs(cur,ct,u,b.field,b.level,b.acc,trips),rec=sum(items),y1=rec+cur.visa;
 const yrs=b.level=='Master'?(['uk','ie'].includes(cur.code)?1:2):(['uk','au'].includes(cur.code)?3:4);
 const all=W.map(x=>{const c1=Object.values(x.cities)[0];return{name:x.name,flag:x.flag,y1:sum(costs(x,c1,c1.unis[0],b.field,b.level,'Shared room',1))+x.visa}}).sort((p,q)=>p.y1-q.y1);
 return{items,visa:cur.visa,recurring:rec,year1:y1,monthly:Math.round(y1/12),monthlyLater:Math.round(rec/12),years:yrs,program:y1+(yrs-1)*rec,rank:all.findIndex(x=>x.name==cur.name)+1,n:all.length,cheapest:all.slice(0,5)}}
