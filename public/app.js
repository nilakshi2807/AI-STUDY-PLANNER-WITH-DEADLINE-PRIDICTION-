const $=s=>document.querySelector(s);let mode='login',user=null,tasks=[],materials=[];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function api(url,opt={}){const r=await fetch(url,{credentials:'same-origin',headers:{'Content-Type':'application/json'},...opt});const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.error||'Something went wrong');return d}
function msg(t,where='#globalMessage'){$(where).textContent=t||''}
function setMode(m){mode=m;$('#authTitle').textContent=m==='login'?'Welcome back':'Create your account';$('#authSubmit').textContent=m==='login'?'Log in':'Create account';$('#nameLabel').hidden=m==='login';$('#name').required=m==='register';$('#switchAuth').textContent=m==='login'?'Create account':'Log in';}
$('#switchAuth').onclick=()=>setMode(mode==='login'?'register':'login');
$('#authForm').onsubmit=async e=>{e.preventDefault();let b={email:$('#email').value,password:$('#password').value};if(mode==='register')b.name=$('#name').value;try{let d=await api('/api/'+mode,{method:'POST',body:JSON.stringify(b)});user=d.user;await enter()}catch(x){msg(x.message,'#authMessage')}};
$('#logoutBtn').onclick=async()=>{await api('/api/logout',{method:'POST',body:'{}'}).catch(()=>{});user=null;$('#appContent').hidden=true;$('#authView').hidden=false;setMode('login')};
function view(n){document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));$('#'+n+'View').classList.add('active');document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===n));$('#crumb').textContent=n[0].toUpperCase()+n.slice(1)}
document.addEventListener('click',e=>{let n=e.target.closest('[data-view]');if(n)view(n.dataset.view);});
async function enter(){$('#authView').hidden=true;$('#appContent').hidden=false;$('#userName').textContent=user.name;await Promise.all([loadTasks(),loadMaterials(),loadAttendance(),loadMarks(),loadSessions()]);view('dashboard')}
async function loadTasks(){tasks=(await api('/api/tasks')).tasks;let done=tasks.filter(t=>t.done).length;$('#completedStat').textContent=done;$('#pendingStat').textContent=tasks.length-done;$('#progressStat').textContent=(tasks.length?Math.round(done/tasks.length*100):0)+'%';let h=tasks.length?tasks.map(t=>`<div class="list-row"><input type="checkbox" data-check="${t.id}" ${t.done?'checked':''}><div class="row-main"><strong>${esc(t.title)}</strong><small>${esc(t.subject)} · ${t.duration} min · Due ${esc(t.deadline)} · ${esc(t.priority)}</small></div><button class="delete" data-del-task="${t.id}">×</button></div>`).join(''):'<p>No tasks yet.</p>';$('#dashboardTasks').innerHTML=h;$('#plannerTasks').innerHTML=h}
$('#taskForm').onsubmit=async e=>{e.preventDefault();try{await api('/api/tasks',{method:'POST',body:JSON.stringify({title:$('#taskTitle').value,subject:$('#taskSubject').value,deadline:$('#taskDeadline').value,duration:+$('#taskDuration').value,priority:$('#taskPriority').value})});e.target.reset();$('#taskDuration').value=45;await loadTasks();msg('Task saved.')}catch(x){msg(x.message)}};
document.addEventListener('change',async e=>{if(e.target.dataset.check)try{await api('/api/tasks/'+e.target.dataset.check,{method:'PATCH',body:JSON.stringify({done:e.target.checked})});await loadTasks()}catch(x){msg(x.message)}});
document.addEventListener('click',async e=>{try{if(e.target.dataset.delTask){await api('/api/tasks/'+e.target.dataset.delTask,{method:'DELETE'});await loadTasks()}if(e.target.dataset.delMat){await api('/api/materials/'+e.target.dataset.delMat,{method:'DELETE'});await loadMaterials()}if(e.target.dataset.delAtt){await api('/api/attendance/'+e.target.dataset.delAtt,{method:'DELETE'});await loadAttendance()}}catch(x){msg(x.message)}});
async function loadMaterials(){materials=(await api('/api/materials')).materials;$('#materialsList').innerHTML=materials.length?materials.map(m=>`<div class="list-row"><div class="row-main"><strong>${esc(m.title)}</strong><small>${esc(m.subject)}</small><a href="${esc(m.url)}" target="_blank" rel="noopener noreferrer">Open resource ↗</a></div><button class="delete" data-del-mat="${m.id}">×</button></div>`).join(''):'<p>No resources saved yet.</p>'}
$('#materialForm').onsubmit=async e=>{e.preventDefault();try{await api('/api/materials',{method:'POST',body:JSON.stringify({subject:$('#materialSubject').value,title:$('#materialTitle').value,url:$('#materialUrl').value})});e.target.reset();await loadMaterials();msg('Resource saved.')}catch(x){msg(x.message)}};
async function loadAttendance(){let a=(await api('/api/attendance')).attendance;$('#attendanceStat').textContent=a.length?Math.round(a.reduce((s,x)=>s+x.attended/x.total*100,0)/a.length)+'%':'—';$('#attendanceList').innerHTML=a.length?a.map(x=>{let p=Math.round(x.attended/x.total*100);return `<div class="list-row"><div class="row-main"><strong>${esc(x.subject)}</strong><small>${x.attended}/${x.total} classes · <b class="${p<75?'status-low':'status-good'}">${p}% ${p<75?'LOW ATTENDANCE':'Good'}</b></small><div class="bar-track"><div class="bar-fill" style="width:${p}%"></div></div></div><button class="delete" data-del-att="${x.id}">×</button></div>`}).join(''):'<p>No attendance records yet.</p>'}
$('#attendanceForm').onsubmit=async e=>{e.preventDefault();try{await api('/api/attendance',{method:'POST',body:JSON.stringify({subject:$('#attendanceSubject').value,attended:+$('#attended').value,total:+$('#totalClasses').value})});await loadAttendance();msg('Attendance saved.')}catch(x){msg(x.message)}};
async function loadMarks(){let m=(await api('/api/marks')).marks,avg=m.length?m.reduce((s,x)=>s+x.score/x.max_score*100,0)/m.length:null;$('#averageMarksStat').textContent=avg===null?'—':Math.round(avg)+'%';$('#marksList').innerHTML=m.length?m.map(x=>`<div class="list-row"><div class="row-main"><strong>${esc(x.subject)}</strong><small>${x.score}/${x.max_score} · ${Math.round(x.score/x.max_score*100)}%</small></div></div>`).join(''):'<p>No marks yet.</p>';$('#marksChart').innerHTML=m.map(x=>{let p=Math.round(x.score/x.max_score*100);return `<div class="chart-row"><span>${esc(x.subject)}</span><div class="bar-track"><div class="bar-fill" style="width:${p}%"></div></div><b>${p}%</b></div>`}).join('');$('#cgpaEstimate').textContent=avg===null?'Add marks to see performance.':`Average ${avg.toFixed(1)}%. Approximate CGPA estimate: ${(avg/9.5).toFixed(2)} (check your university formula).`}
$('#marksForm').onsubmit=async e=>{e.preventDefault();try{await api('/api/marks',{method:'POST',body:JSON.stringify({subject:$('#marksSubject').value,score:+$('#marksScore').value,maxScore:+$('#marksMax').value})});e.target.reset();$('#marksMax').value=100;await loadMarks();msg('Marks saved.')}catch(x){msg(x.message)}};
async function loadSessions(){let s=(await api('/api/study-sessions')).sessions,total=s.reduce((a,x)=>a+x.minutes,0);$('#studyMinutesStat').textContent=total;$('#focusTotal').textContent=total}
let secs=1500,timer=null;function paint(){ $('#timerDisplay').textContent=String(Math.floor(secs/60)).padStart(2,'0')+':'+String(secs%60).padStart(2,'0')}
$('#focusLength').onchange=()=>{if(!timer){secs=+$('#focusLength').value*60;paint()}};
$('#timerStart').onclick=()=>{if(timer){clearInterval(timer);timer=null;$('#timerStart').textContent='Resume';return}$('#timerStart').textContent='Pause';timer=setInterval(async()=>{secs--;paint();if(secs<=0){clearInterval(timer);timer=null;let minutes=+$('#focusLength').value;try{await api('/api/study-sessions',{method:'POST',body:JSON.stringify({minutes})});await loadSessions();$('#timerMessage').textContent='Great work! Session saved.'}catch(x){$('#timerMessage').textContent=x.message}$('#timerStart').textContent='Start focus';secs=minutes*60;paint()}},1000)};
$('#timerReset').onclick=()=>{clearInterval(timer);timer=null;secs=+$('#focusLength').value*60;paint();$('#timerStart').textContent='Start focus'};
async function init(){try{let d=await api('/api/me');if(d.user){user=d.user;await enter()}else setMode('login')}catch{setMode('login')}}init();
function updateDateTime() {
  const now = new Date();

  const dateElement = document.getElementById("currentDate");
  const timeElement = document.getElementById("currentTime");

  if (dateElement && timeElement) {
    dateElement.textContent = now.toLocaleDateString("en-IN", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric"
    });

    timeElement.textContent = now.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
    });
  }
}

updateDateTime();
setInterval(updateDateTime, 1000);