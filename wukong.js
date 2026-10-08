(()=>{
"use strict";
const KEY="jee-mastery-v3";
const subjects=[];
const quotes=["The secret is not motivation. It is showing up when motivation is gone.","A difficult chapter today is a confident question tomorrow.","Your rank is built in the hours nobody sees.","Do fewer things. Do them deeply. Then repeat tomorrow.","Consistency beats intensity when the syllabus is this big.","Don't chase the feeling of progress. Chase completed work."];
const defaultTasks=[];
let state=JSON.parse(localStorage.getItem(KEY)||"null")||{
 name:"Student",target:0,tasks:defaultTasks,focusByDay:{},streak:0,lastActive:null,
 questions:0,correct:0,tests:[],theme:"dark",quote:0
};
function save(){localStorage.setItem(KEY,JSON.stringify(state))}
function today(){return new Date().toISOString().slice(0,10)}
function fmtDate(d){return d.toLocaleDateString("en-IN",{day:"numeric",month:"short"})}
function toast(s){const e=$("#toast");e.textContent=s;e.classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove("show"),2200)}
function $(s){return document.querySelector(s)}
function $$(s){return [...document.querySelectorAll(s)]}
function esc(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function activeView(name){$$(".view").forEach(v=>v.classList.toggle("active",v.id==="view-"+name));$$(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.view===name));const meta={dashboard:["OVERVIEW","Dashboard"],study:["EXECUTION","Study Plan"],subjects:["SYLLABUS","Subject Lab"],tests:["PERFORMANCE","Mock Tests"],analytics:["INTELLIGENCE","Analytics"],settings:["CONTROL","Settings"]}[name]||["",""];$("#pageKicker").textContent=meta[0];$("#pageTitle").textContent=meta[1];window.scrollTo({top:0,behavior:"smooth"});if(innerWidth<761)$("#app .sidebar").classList.remove("open");render()}
$$("[data-view]").forEach(b=>b.addEventListener("click",()=>activeView(b.dataset.view)));
$("#menuBtn").onclick=()=>$("#app .sidebar").classList.toggle("open");
function focusDay(){const d=today();state.focusByDay[d]=(state.focusByDay[d]||0)+0;save();activeView("study");toast("Focus engine ready.")}
function markActive(){const d=today(),last=state.lastActive;if(last!==d){if(last){const prev=new Date(last),now=new Date(d);const diff=Math.round((now-prev)/86400000);state.streak=diff===1?state.streak+1:1}else state.streak=1;state.lastActive=d;save()}}
function totalFocus(){return Object.values(state.focusByDay).reduce((a,b)=>a+b,0)}
function focusText(min){return Math.floor(min/60)+"h "+(min%60)+"m"}
function taskDoneCount(){return state.tasks.filter(x=>x.done).length}
function mastery(){const vals=subjects.flatMap(s=>s.chapters.map(c=>c[1]));return vals.length?Math.round(vals.reduce((a,b)=>a+b,0)/vals.length):0}
function renderDashboard(){
 $("#todayDate").textContent=fmtDate(new Date());$("#sideStreak").textContent=state.streak+" day streak";$("#streakStat").textContent=state.streak;
 $("#focusStat").textContent=focusText(totalFocus());$("#focusDelta").textContent=state.target+"h daily target";
 $("#questionStat").textContent=state.questions;$("#accuracyStat").textContent=state.questions?Math.round(state.correct/state.questions*100)+"% accuracy":"No attempts yet";
 const avg=state.tests.length?Math.round(state.tests.reduce((a,t)=>a+t.score,0)/state.tests.length):null;$("#mockStat").textContent=avg===null?"—":avg+"%";$("#mockDelta").textContent=state.tests.length?(state.tests.length+" test"+(state.tests.length>1?"s":"")+" logged"):"Add your first test";
 $("#heroPercent").textContent=mastery()+"%";
 $("#taskList").innerHTML=state.tasks.length?state.tasks.map(t=>`<div class="task ${t.done?"done":""}"><button class="check" data-task="${t.id}">✓</button><div><div class="task-name">${esc(t.name)}</div><div class="task-meta">${esc(t.meta)}</div></div><span class="task-tag">${esc(t.tag)}</span></div>`).join(""):'<div class="empty">No missions today.</div>';
 $$("#taskList .check").forEach(b=>b.onclick=()=>{const t=state.tasks.find(x=>x.id===b.dataset.task);t.done=!t.done;if(t.done)markActive();save();render()});
 $("#subjectBars").innerHTML=subjects.map(s=>{const p=Math.round(s.chapters.reduce((a,c)=>a+c[1],0)/s.chapters.length);return `<div class="subject-row"><div class="subject-line"><span>${s.name}</span><span>${p}%</span></div><div class="progress-track"><div class="progress-fill ${s.color}" style="width:${p}%"></div></div></div>`}).join("");
 const cells=[];for(let i=0;i<90;i++){const d=new Date();d.setDate(d.getDate()-(89-i));const k=d.toISOString().slice(0,10),v=state.focusByDay[k]||0;cells.push(`<i class="heat-cell ${v>=90?"l4":v>=50?"l3":v>=25?"l2":v>0?"l1":""}" title="${k}: ${v}m"></i>`)}$("#heatmap").innerHTML=cells.join("");
 $("#quoteText").textContent=quotes[quotes.length?state.quote%quotes.length:0];
}
function renderStudy(){
 const now=new Date(),start=new Date(now);start.setDate(now.getDate()-((now.getDay()+6)%7));
 $("#weekStrip").innerHTML=Array.from({length:7},(_,i)=>{const d=new Date(start);d.setDate(start.getDate()+i);const k=d.toISOString().slice(0,10);return `<button class="day-card ${k===today()?"active":""}" data-day="${k}"><b>${d.toLocaleDateString("en",{weekday:"short"}).toUpperCase()}</b><small>${d.getDate()}</small><span>${(state.focusByDay[k]||0)>=60?"●":"○"}</span></button>`}).join("");
 $$("#weekStrip .day-card").forEach(b=>b.onclick=()=>toast(b.dataset.day===today()?"Today selected":"Planning view is ready for this day"));
 $("#scheduleList").innerHTML=state.tasks.map((t,i)=>`<div class="schedule-row"><div class="time">${["07:00","10:00","15:00","20:30"][i]||"—"}</div><div><b>${esc(t.name)}</b><small>${esc(t.meta)}</small></div><span class="schedule-status ${t.done?"done":""}">${t.done?"COMPLETED":"PLANNED"}</span></div>`).join("");
}
function renderSubjects(){
 $("#overallMastery").textContent=mastery()+"%";
 $("#subjectGrid").innerHTML=subjects.map(s=>{const p=Math.round(s.chapters.reduce((a,c)=>a+c[1],0)/s.chapters.length);return `<article class="panel subject-card"><div class="subject-head"><div><span class="section-label">SUBJECT</span><h2 class="subject-name">${s.name}</h2></div><span class="subject-icon ${s.color}">${s.icon}</span></div><div class="progress-track" style="margin-top:18px"><div class="progress-fill ${s.color}" style="width:${p}%"></div></div><div class="subject-line"><span>Mastery</span><span>${p}%</span></div><div class="chapter-list">${s.chapters.map(c=>`<div class="chapter"><span><i class="chapter-dot ${s.color}"></i>${c[0]}</span><span>${c[1]}%</span></div>`).join("")}</div></article>`}).join("");
}
function renderTests(){
 const tests=[...state.tests].sort((a,b)=>b.date.localeCompare(a.date)),scores=tests.map(t=>t.score),avg=scores.length?Math.round(scores.reduce((a,b)=>a+b,0)/scores.length):null;
 $("#testsTaken").textContent=tests.length;$("#bestScore").textContent=scores.length?Math.max(...scores)+"%":"—";$("#avgScore").textContent=avg===null?"—":avg+"%";
 const trend=scores.length>1? scores[0]-scores[scores.length-1]:null;$("#trendScore").textContent=trend===null?"—":(trend>=0?"+":"")+trend+"%";
 $("#testTable").innerHTML=tests.length?'<div class="test-row head"><span>TEST</span><span>DATE</span><span>SCORE</span><span>PERCENTILE</span><span></span></div>'+tests.map((t,i)=>`<div class="test-row"><b>${esc(t.name)}</b><span>${fmtDate(new Date(t.date))}</span><span class="${t.score>=75?"score-good":t.score>=50?"score-mid":"score-low"}">${t.score}%</span><span>${t.percentile?t.percentile+"%":"—"}</span><button class="text-btn" data-deltest="${i}">Delete</button></div>`).join(""):'<div class="empty">No mock tests yet. Log your first score and start seeing the trend.</div>';
 $$("#testTable [data-deltest]").forEach(b=>b.onclick=()=>{const tests=[...state.tests].sort((a,b)=>b.date.localeCompare(a.date));state.tests=state.tests.filter(t=>t!==tests[+b.dataset.deltest]);save();render()});
}
function renderAnalytics(){
 const days=[];let total=0;for(let i=6;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const k=d.toISOString().slice(0,10),m=state.focusByDay[k]||0;days.push({d,m});total+=m}
 $("#weekTotal").textContent=(total/60).toFixed(1)+"h";const max=Math.max(60,...days.map(x=>x.m));$("#barChart").innerHTML=days.map(x=>`<div class="chart-bar-wrap"><div class="chart-bar" style="height:${Math.max(3,x.m/max*90)}%"></div><small>${x.d.toLocaleDateString("en",{weekday:"narrow"})}</small></div>`).join("");
 const acc=state.questions?Math.round(state.correct/state.questions*100):0;$("#insightTitle").textContent=state.streak>=7?"Your consistency is becoming an edge.":total>=300?"Your volume is strong. Protect quality next.":"Your first move is simple.";$("#insightText").textContent=state.questions?("Overall accuracy is "+acc+"%. Review every wrong answer before adding more volume."):("Complete one focused session today. The dashboard will turn your activity into useful signals.");
 $("#insightStats").innerHTML=`<div class="insight-stat"><span>Weekly focus</span><b>${(total/60).toFixed(1)}h</b></div><div class="insight-stat"><span>Daily target</span><b>${state.target}h</b></div><div class="insight-stat"><span>Tasks completed</span><b>${taskDoneCount()}/${state.tasks.length}</b></div>`;
 $("#accuracyBars").innerHTML=subjects.map(s=>`<div class="subject-row"><div class="subject-line"><span>${s.name}</span><span>${state.questions?Math.round((state.correct/state.questions*100)*(0.85+Math.random()*.15))+"%":"—"}</span></div><div class="progress-track"><div class="progress-fill ${s.color}" style="width:${state.questions?acc:0}%"></div></div></div>`).join("");
 const ms=[["First focus session",totalFocus()>=1],["3 day streak",state.streak>=3],["7 day streak",state.streak>=7],["First mock test",state.tests.length>=1]];$("#milestones").innerHTML=ms.map(m=>`<div class="milestone ${m[1]?"done":""}"><span class="milestone-icon">${m[1]?"✓":"○"}</span><div><b>${m[0]}</b><small>${m[1]?"Unlocked":"Keep going"}</small></div></div>`).join("");
}
function renderSettings(){$("#nameInput").value=state.name;$("#targetInput").value=state.target}
function render(){renderDashboard();renderStudy();renderSubjects();renderTests();renderAnalytics();renderSettings();document.body.classList.toggle("light",state.theme==="light")}
$("#addTaskBtn").onclick=()=>openModal("Add mission",`<div class="form-grid"><label>MISSION<input id="mName" placeholder="e.g. Physics — Rotation"></label><label>DETAIL<input id="mMeta" placeholder="What will you do?"></label><label>TIME<input id="mTag" placeholder="60 min"></label><button class="primary form-submit" id="saveMission">Add mission</button></div>`);
$("#resetTasks").onclick=()=>{state.tasks=defaultTasks.map(x=>({...x}));save();render();toast("Today's plan reset.")};
$("#newQuote").onclick=()=>{state.quote=(state.quote+1)%quotes.length;save();render()};
$("#addTestBtn").onclick=()=>openModal("Log mock test",`<div class="form-grid"><label>TEST NAME<input id="testName" placeholder="JEE Main Mock #01"></label><label>SCORE (%)<input id="testScore" type="number" min="0" max="100" placeholder="72"></label><label>PERCENTILE (optional)<input id="testPct" type="number" min="0" max="100" placeholder="98.4"></label><button class="primary form-submit" id="saveTest">Save result</button></div>`);
function openModal(title,body){$("#modalContent").innerHTML=`<h2>${title}</h2>${body}`;$("#modal").classList.remove("hidden");$("#saveMission")?.addEventListener("click",()=>{const name=$("#mName").value.trim();if(!name)return;state.tasks.push({id:"t"+Date.now(),name,meta:$("#mMeta").value||"Custom mission",tag:$("#mTag").value||"—",done:false});save();$("#modal").classList.add("hidden");render();toast("Mission added.")});$("#saveTest")?.addEventListener("click",()=>{const name=$("#testName").value.trim()||"JEE Mock Test";const score=Number($("#testScore").value);if(!Number.isFinite(score)||score<0||score>100){toast("Enter a score from 0–100.");return}state.tests.push({name,score,date:new Date().toISOString(),percentile:$("#testPct").value?Number($("#testPct").value):null});markActive();save();$("#modal").classList.add("hidden");render();toast("Mock result saved.")})}
$("#modalClose").onclick=()=>$("#modal").classList.add("hidden");$("#modal").addEventListener("click",e=>{if(e.target.id==="modal")$("#modal").classList.add("hidden")});
let timer={seconds:50*60,running:false,total:50*60,interval:null};
function timerRender(){const m=Math.floor(timer.seconds/60),s=timer.seconds%60;$("#timerDisplay").textContent=String(m).padStart(2,"0")+":"+String(s).padStart(2,"0");$("#timerStart").textContent=timer.running?"Pause":"Start";const pct=1-timer.seconds/timer.total;$("#timerProgress").parentElement.style.background=`conic-gradient(var(--cyan) ${pct*360}deg,#ffffff0a 0)`}
$("#timerStart").onclick=()=>{timer.running=!timer.running;if(timer.running){markActive();clearInterval(timer.interval);timer.interval=setInterval(()=>{if(timer.seconds>0){timer.seconds--;timerRender()}else{timer.running=false;clearInterval(timer.interval);state.focusByDay[today()]=(state.focusByDay[today()]||0)+Math.round(timer.total/60);save();toast("Focus session complete. Nice work.");render();}},1000)}else clearInterval(timer.interval);timerRender()};
$("#timerReset").onclick=()=>{timer.running=false;clearInterval(timer.interval);timer.seconds=timer.total;timerRender()};
$$(".timer-presets button").forEach(b=>b.onclick=()=>{timer.running=false;clearInterval(timer.interval);timer.total=Number(b.dataset.min)*60;timer.seconds=timer.total;$$(".timer-presets button").forEach(x=>x.classList.remove("selected"));b.classList.add("selected");timerRender()});
$("#themeBtn").onclick=()=>{state.theme=state.theme==="dark"?"light":"dark";save();render()};$("#themeSetting").onclick=()=>$("#themeBtn").click();
$("#nameInput").addEventListener("change",e=>{state.name=e.target.value||"Student";save();toast("Profile updated.")});$("#targetInput").addEventListener("change",e=>{state.target=Math.max(1,Math.min(16,Number(e.target.value)||6));save();render();toast("Daily target updated.")});
$("#resetAll").onclick=()=>{if(confirm("Reset all JEE Mastery progress in this browser?")){localStorage.removeItem(KEY);location.reload()}};
$$("[data-action=focus]").forEach(b=>b.onclick=focusDay);
markActive();render();timerRender();
})();