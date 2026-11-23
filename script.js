const KEY='studydeck_tasks_v1';
const SUBJECTS=['Data Structures and Algorithms','Digital Electronics','Mathematics','Computer Networks','Operating Systems','Other'];
const NAV=[['dashboard','Dashboard','▦'],['all','All Tasks','☰'],['today','Today’s Tasks','◉'],['upcoming','Upcoming','➜'],['completed','Completed','✓'],['overdue','Overdue','!'],['calendar','Calendar','▣']];
const ymd=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const todayStr=()=>ymd(new Date());
const off=n=>{const d=new Date();d.setDate(d.getDate()+n);return ymd(d)};
const daysLeft=t=>Math.round((new Date(t.due+'T00:00:00')-new Date(todayStr()+'T00:00:00'))/864e5);
const isOver=t=>t.status!=='Completed'&&daysLeft(t)<0;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $=id=>document.getElementById(id);

let tasks=load(),view='dashboard',editId=null,delId=null,calM=new Date(),selDay=todayStr();
let F={q:'',pri:'',sub:'',sta:'',due:''};

function load(){
  try{const r=localStorage.getItem(KEY);if(r!==null)return JSON.parse(r)||[]}catch(e){}
  const mk=(i,title,description,subject,due,priority,status)=>({id:'s'+i,title,description,subject,due,priority,status,created:Date.now()-i*1000});
  return [
    mk(1,'Solve 10 linked list problems','Practice reversal, cycle detection and merge problems.',SUBJECTS[0],off(-2),'High','In Progress'),
    mk(2,'Digital Electronics lab record','Complete flip-flop and counter experiments.',SUBJECTS[1],off(0),'High','Pending'),
    mk(3,'Mathematics assignment 4','Eigenvalues and matrix diagonalisation.',SUBJECTS[2],off(1),'Medium','Pending'),
    mk(4,'Revise OSI and TCP/IP models','Prepare short notes for the quiz.',SUBJECTS[3],off(3),'Medium','In Progress'),
    mk(5,'Process scheduling worksheet','FCFS, SJF and Round Robin numericals.',SUBJECTS[4],off(6),'Low','Pending'),
    mk(6,'Prepare internship project report','Outline chapters and collect screenshots.',SUBJECTS[5],off(10),'High','Pending'),
    mk(7,'Submit DSA lab file','Handed over to the lab coordinator.',SUBJECTS[0],off(-1),'Medium','Completed')];
}
function save(){try{localStorage.setItem(KEY,JSON.stringify(tasks))}catch(e){}}

/* ---------- helpers ---------- */
function dueChip(t){
  if(t.status==='Completed')return '<span class="due done">Done</span>';
  const n=daysLeft(t);
  if(n<0)return `<span class="due late">Overdue by ${-n} day${n===-1?'':'s'}</span>`;
  if(n===0)return '<span class="due soon">Due today</span>';
  return `<span class="due ${n<=3?'soon':'ok'}">${n} day${n===1?'':'s'} left</span>`;
}
const fmtDate=s=>new Date(s+'T00:00:00').toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'});
const cls=s=>s.replace(' ','-');
function list(v){
  const t=todayStr();
  return tasks.filter(x=>({all:1,today:x.due===t,upcoming:x.due>t&&x.status!=='Completed',completed:x.status==='Completed',overdue:isOver(x)}[v]));
}
function applyFilters(arr){
  return arr.filter(x=>(!F.q||(x.title+' '+x.description).toLowerCase().includes(F.q.toLowerCase()))&&(!F.pri||x.priority===F.pri)&&(!F.sub||x.subject===F.sub)&&(!F.sta||x.status===F.sta)&&(!F.due||x.due===F.due))
    .sort((a,b)=>a.due.localeCompare(b.due));
}
function taskCard(t){
  return `<div class="card task ${t.status==='Completed'?'done':''}">
    <input type="checkbox" data-act="toggle" data-id="${t.id}" ${t.status==='Completed'?'checked':''} aria-label="Mark complete">
    <div class="b"><h3>${esc(t.title)}</h3>${t.description?`<p>${esc(t.description)}</p>`:'<div style="height:8px"></div>'}
      <div class="tags"><span class="badge">${esc(t.subject)}</span><span class="badge ${t.priority}">${t.priority}</span><span class="badge ${cls(t.status)}">${t.status}</span>
      <span class="badge">📅 ${fmtDate(t.due)}</span>${dueChip(t)}</div></div>
    <button class="icon" data-act="edit" data-id="${t.id}" title="Edit">✎</button>
    <button class="icon" data-act="del" data-id="${t.id}" title="Delete">🗑</button></div>`;
}
const miniRow=t=>`<div class="row"><div class="g"><div class="t">${esc(t.title)}</div><small>${esc(t.subject)} · ${fmtDate(t.due)}</small></div>${dueChip(t)}</div>`;

/* ---------- views ---------- */
function renderNav(){
  const counts={all:tasks.length,today:list('today').length,upcoming:list('upcoming').length,completed:list('completed').length,overdue:list('overdue').length};
  $('sideNav').innerHTML=NAV.map(([k,l,i])=>`<button class="nav ${view===k?'on':''}" data-nav="${k}"><span>${i}</span>${l}${counts[k]!==undefined?`<b>${counts[k]}</b>`:''}</button>`).join('');
  $('mNav').innerHTML=NAV.map(([k,l,i])=>`<button class="${view===k?'on':''}" data-nav="${k}"><span>${i}</span>${l.replace('Today’s Tasks','Today').replace('All Tasks','All')}</button>`).join('');
}
function head(title,subtitle){return `<div class="top"><div><h1>${title}</h1><p class="sub">${subtitle}</p></div><button class="btn" data-act="add">+ Add Task</button></div>`}

function dashboard(){
  const total=tasks.length,done=tasks.filter(t=>t.status==='Completed').length,over=list('overdue').length,pend=total-done;
  const pct=total?Math.round(done/total*100):0;
  const inprog=tasks.filter(t=>t.status==='In Progress'&&!isOver(t)).length,pnd=tasks.filter(t=>t.status==='Pending'&&!isOver(t)).length;
  const parts=[[done,'#16a34a','Completed'],[inprog,'#2f5bd6','In Progress'],[pnd,'#9aa6c4','Pending'],[over,'#dc2626','Overdue']];
  let acc=0;const stops=total?parts.map(([n,c])=>{const s=acc/total*100;acc+=n;return `${c} ${s}% ${acc/total*100}%`}).join(','):'#e4e8f0 0 100%';
  const up=tasks.filter(t=>t.status!=='Completed'&&daysLeft(t)>=0).sort((a,b)=>a.due.localeCompare(b.due)).slice(0,5);
  const rec=[...tasks].sort((a,b)=>b.created-a.created).slice(0,5);
  return head('Welcome back, Student!','Here’s what’s on your plate today, '+new Date().toLocaleDateString(undefined,{weekday:'long',day:'numeric',month:'long'})+'.')+
  `<div class="stats">${[['Total Tasks',total],['Completed Tasks',done],['Pending Tasks',pend],['Overdue Tasks',over]].map(([l,v])=>`<div class="card stat"><small>${l}</small><div>${v}</div></div>`).join('')}</div>
  <div class="card"><div style="display:flex;justify-content:space-between"><h2 style="margin:0">Overall completion</h2><b>${pct}%</b></div><div class="bar"><span style="width:${pct}%"></span></div></div>
  <div class="grid2"><div class="card"><h2>Upcoming deadlines</h2>${up.length?up.map(miniRow).join(''):'<div class="empty">No upcoming deadlines 🎉</div>'}</div>
  <div class="card"><h2>Task completion chart</h2><div class="donut" style="background:conic-gradient(${stops})"><div>${pct}%</div></div>
  <div class="legend">${parts.map(([n,c,l])=>`<span><i style="background:${c}"></i>${l} (${n})</span>`).join('')}</div></div></div>
  <div class="card" style="margin-top:16px"><h2>Recent tasks</h2>${rec.length?rec.map(miniRow).join(''):'<div class="empty">No tasks yet</div>'}</div>`;
}
function taskView(v){
  const titles={all:['All Tasks','Everything in one place.'],today:['Today’s Tasks','Due today.'],upcoming:['Upcoming Tasks','Due after today and not yet completed.'],completed:['Completed Tasks','Nice work.'],overdue:['Overdue Tasks','Past the deadline and still open.']};
  const arr=applyFilters(list(v));
  return head(titles[v][0],titles[v][1])+`<div class="filters">
    <input class="s" id="q" type="search" placeholder="Search tasks…" value="${esc(F.q)}">
    <select data-f="pri"><option value="">All priorities</option>${['High','Medium','Low'].map(p=>`<option ${F.pri===p?'selected':''}>${p}</option>`).join('')}</select>
    <select data-f="sub"><option value="">All subjects</option>${SUBJECTS.map(p=>`<option ${F.sub===p?'selected':''}>${p}</option>`).join('')}</select>
    <select data-f="sta"><option value="">All statuses</option>${['Pending','In Progress','Completed'].map(p=>`<option ${F.sta===p?'selected':''}>${p}</option>`).join('')}</select>
    <input type="date" data-f="due" value="${F.due}" title="Due date"><button class="btn ghost" data-act="clear">Clear</button></div>
    <div id="tasklist">${arr.length?arr.map(taskCard).join(''):'<div class="card empty">No tasks match here.</div>'}</div>`;
}
function calendar(){
  const y=calM.getFullYear(),m=calM.getMonth(),first=new Date(y,m,1).getDay(),days=new Date(y,m+1,0).getDate();
  let cells='';for(let i=0;i<first;i++)cells+='<div class="cell blank"></div>';
  for(let d=1;d<=days;d++){
    const s=ymd(new Date(y,m,d)),ts=tasks.filter(t=>t.due===s);
    cells+=`<button class="cell ${s===todayStr()?'today':''} ${s===selDay?'sel':''}" data-day="${s}"><b>${d}</b><div class="dots">${ts.slice(0,6).map(t=>`<i class="${t.status==='Completed'?'done':isOver(t)?'late':''}"></i>`).join('')}</div></button>`;
  }
  const sel=tasks.filter(t=>t.due===selDay);
  return head('Calendar','Blue dots are upcoming, red are overdue, green are completed.')+
  `<div class="card"><div class="cal-h"><button class="icon" data-act="prev">‹</button><h2 style="margin:0">${calM.toLocaleDateString(undefined,{month:'long',year:'numeric'})}</h2><button class="icon" data-act="next">›</button></div>
  <div class="cal">${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=>`<div class="d">${d}</div>`).join('')}${cells}</div></div>
  <div class="card" style="margin-top:16px"><h2>${fmtDate(selDay)}</h2>${sel.length?sel.map(t=>`<div class="row"><div class="g"><div class="t">${esc(t.title)}</div><small>${esc(t.subject)} · ${t.priority} priority · ${t.status}</small></div>${dueChip(t)}</div>`).join(''):'<div class="empty">No deadlines on this day.</div>'}</div>`;
}
function render(){
  renderNav();
  $('view').innerHTML=view==='dashboard'?dashboard():view==='calendar'?calendar():taskView(view);
}

/* ---------- modal ---------- */
$('fSub').innerHTML=SUBJECTS.map(s=>`<option>${s}</option>`).join('');
function openForm(id){
  editId=id||null;const t=tasks.find(x=>x.id===id);
  $('mTitle').textContent=t?'Edit Task':'Add Task';
  $('fTitle').value=t?t.title:'';$('fDesc').value=t?t.description:'';$('fSub').value=t?t.subject:SUBJECTS[0];
  $('fDue').value=t?t.due:todayStr();$('fPri').value=t?t.priority:'Medium';$('fSta').value=t?t.status:'Pending';
  $('modal').showModal();
}
$('fCancel').onclick=()=>$('modal').close();
$('form').addEventListener('submit',e=>{
  e.preventDefault();
  const data={title:$('fTitle').value.trim(),description:$('fDesc').value.trim(),subject:$('fSub').value,due:$('fDue').value,priority:$('fPri').value,status:$('fSta').value};
  if(!data.title||!data.due)return;
  if(editId)tasks=tasks.map(t=>t.id===editId?{...t,...data}:t);
  else tasks.push({id:'t'+Date.now(),created:Date.now(),...data});
  save();$('modal').close();render();
});
$('cNo').onclick=()=>$('confirm').close();
$('cYes').onclick=()=>{tasks=tasks.filter(t=>t.id!==delId);save();$('confirm').close();render()};

/* ---------- events ---------- */
document.addEventListener('click',e=>{
  const n=e.target.closest('[data-nav]');if(n){view=n.dataset.nav;render();window.scrollTo(0,0);return}
  const dEl=e.target.closest('[data-day]');if(dEl){selDay=dEl.dataset.day;render();return}
  const a=e.target.closest('[data-act]');if(!a)return;
  const id=a.dataset.id,act=a.dataset.act;
  if(act==='add')openForm();
  else if(act==='edit')openForm(id);
  else if(act==='del'){delId=id;const t=tasks.find(x=>x.id===id);$('cMsg').textContent='“'+t.title+'” will be permanently removed.';$('confirm').showModal()}
  else if(act==='toggle'){tasks=tasks.map(t=>t.id===id?{...t,status:t.status==='Completed'?'Pending':'Completed'}:t);save();render()}
  else if(act==='clear'){F={q:'',pri:'',sub:'',sta:'',due:''};render()}
  else if(act==='prev'){calM=new Date(calM.getFullYear(),calM.getMonth()-1,1);render()}
  else if(act==='next'){calM=new Date(calM.getFullYear(),calM.getMonth()+1,1);render()}
});
document.addEventListener('change',e=>{const f=e.target.dataset.f;if(f){F[f]=e.target.value;render()}});
document.addEventListener('input',e=>{
  if(e.target.id==='q'){F.q=e.target.value;const arr=applyFilters(list(view));
    $('tasklist').innerHTML=arr.length?arr.map(taskCard).join(''):'<div class="card empty">No tasks match here.</div>'}
});
save();render();