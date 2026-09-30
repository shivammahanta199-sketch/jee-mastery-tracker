import * as THREE from 'three';

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x777a75);
scene.fog=new THREE.FogExp2(0x737671,0.009);
const camera=new THREE.PerspectiveCamera(72,innerWidth/innerHeight,.05,900);
camera.rotation.order='YXZ';
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;
document.body.appendChild(renderer.domElement);

const hemi=new THREE.HemisphereLight(0xb8c0bf,0x302c25,1.7);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xd4d0c1,2.0);sun.position.set(-70,120,30);sun.castShadow=true;scene.add(sun);

const world=new THREE.Group();scene.add(world);
const mat=(c,r=0)=>new THREE.MeshStandardMaterial({color:c,roughness:r||.92});
const groundMat=mat(0x4f5048), mudMat=mat(0x3b3932), woodMat=mat(0x4b3a2c), sandMat=mat(0x69665b);
const metalMat=mat(0x353733), clothA=mat(0x4a514a), clothB=mat(0x343b3b);

function box(x,y,z,sx,sy,sz,m,rot=0){const o=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),m);o.position.set(x,y,z);o.rotation.y=rot;o.castShadow=o.receiveShadow=true;world.add(o);return o}
function cyl(x,y,z,rad,h,m){const o=new THREE.Mesh(new THREE.CylinderGeometry(rad,rad*.9,h,8),m);o.position.set(x,y,z);o.castShadow=true;world.add(o);return o}
function terrain(){
  const g=new THREE.PlaneGeometry(500,500,70,70);g.rotateX(-Math.PI/2);
  const p=g.attributes.position;
  for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);p.setY(i,-1.5+Math.sin(x*.018)*.7+Math.cos(z*.021)*.55+Math.sin((x+z)*.047)*.25)}
  g.computeVertexNormals();const o=new THREE.Mesh(g,groundMat);o.receiveShadow=true;world.add(o);
}
function trench(z,depth=2.2){
  box(0,0,z-5,145,depth,2.5,mudMat);
  box(0,.1,z+5,145,depth,2.5,mudMat);
  for(let x=-68;x<69;x+=7){box(x,.85,z-3.7,5.5,1.25,.42,woodMat,(Math.random()-.5)*.08);box(x,.85,z+3.7,5.5,1.25,.42,woodMat,(Math.random()-.5)*.08)}
  for(let x=-66;x<67;x+=5){box(x,.15,z,3.8,.28,.45,woodMat)}
}
function crater(x,z,s){const r=s||3;const ring=new THREE.Mesh(new THREE.TorusGeometry(r,r*.12,6,14),mudMat);ring.rotation.x=Math.PI/2;ring.position.set(x,-1.25,z);world.add(ring);for(let i=0;i<6;i++){const rock=cyl(x+(Math.random()-.5)*r*1.7,-.8,z+(Math.random()-.5)*r*1.7,.18+Math.random()*.3,.3,soilRock);rock.rotation.z=Math.random()*2}}
const soilRock=mat(0x5b5549);
terrain();
[-92,-55,-18,18,55,92].forEach((z,i)=>trench(z));
for(let i=0;i<95;i++)crater((Math.random()-.5)*180,(Math.random()-.5)*185,1.5+Math.random()*4);
for(let i=0;i<240;i++){const x=(Math.random()-.5)*220,z=(Math.random()-.5)*220;const h=.15+Math.random()*.5;box(x,-1.05+h/2,z,.18+Math.random()*.45,h,.18+Math.random()*.45,Math.random()>.35?mudMat:sandMat,Math.random()*3)}
function barbed(x,z){
  for(let i=-1;i<=1;i++){const p=box(x+i*2,-.4,z,3,.08,.08,metalMat,Math.PI/2);p.rotation.z=.15}
}
for(let z of [-73,-37,0,37,73])for(let x=-65;x<66;x+=10)barbed(x,z);

const squads=[];let player={pos:new THREE.Vector3(0,1.7,102),vel:new THREE.Vector3(),yaw:Math.PI,pitch:0,crouch:false,order:'HOLD',morale:100};
const ray=new THREE.Raycaster();
function soldier(team,x,z){
  const g=new THREE.Group();g.position.set(x,-.85,z);g.userData={team,home:new THREE.Vector3(x,-.85,z),state:'hold',phase:Math.random()*6.28,alive:true};
  const body=new THREE.Mesh(new THREE.CapsuleGeometry(.23,.72,4,7),team==='ally'?clothA:clothB);body.position.y=.7;body.castShadow=true;g.add(body);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.19,8,6),mat(0x9b8068));head.position.y=1.25;head.castShadow=true;g.add(head);
  const pack=new THREE.Mesh(new THREE.BoxGeometry(.28,.42,.16),mat(0x2d332f));pack.position.set(0,.72,.18);g.add(pack);
  world.add(g);squads.push(g);return g;
}
for(let i=0;i<18;i++)soldier('ally',(Math.random()-.5)*80,70+Math.random()*25);
for(let i=0;i<22;i++)soldier('ally',(Math.random()-.5)*100,20+Math.random()*18);
for(let i=0;i<24;i++)soldier('enemy',(Math.random()-.5)*105,-20-Math.random()*22);
for(let i=0;i<20;i++)soldier('enemy',(Math.random()-.5)*100,-67-Math.random()*22);

function tank(x,z,team,dir){
 const g=new THREE.Group();g.position.set(x,-.7,z);g.rotation.y=dir;
 const hull=new THREE.Mesh(new THREE.BoxGeometry(4.2,1.3,2.5),mat(team==='ally'?0x4a5144:0x454642));hull.castShadow=true;g.add(hull);
 const top=new THREE.Mesh(new THREE.BoxGeometry(2.2,.8,1.8),metalMat);top.position.y=1;g.add(top);
 for(let s of [-1,1])for(let i=-1;i<=1;i++){const w=new THREE.Mesh(new THREE.CylinderGeometry(.55,.55,.35,12),metalMat);w.rotation.z=Math.PI/2;w.position.set(i*1.35,0,s*1.28);g.add(w)}
 world.add(g);return g;
}
const tanks=[tank(-38,52,'ally',0),tank(42,-48,'enemy',Math.PI),tank(75,15,'ally',Math.PI/2)];
const fx=[];
function burst(x,z,scale=1){
 const s=new THREE.Mesh(new THREE.SphereGeometry(.7*scale,10,8),new THREE.MeshBasicMaterial({color:0xb6a58b,transparent:true,opacity:.75}));
 s.position.set(x,-.7,z);world.add(s);fx.push({m:s,t:0,d:.6+Math.random()*.35});
}
function flare(x,z){const l=new THREE.PointLight(0xffc477,18,24);l.position.set(x,4,z);world.add(l);fx.push({m:l,t:0,d:.9})}
function rain(){
 const geo=new THREE.BufferGeometry(),n=700,a=new Float32Array(n*3);
 for(let i=0;i<n;i++){a[i*3]=(Math.random()-.5)*230;a[i*3+1]=Math.random()*55;a[i*3+2]=(Math.random()-.5)*230}
 geo.setAttribute('position',new THREE.BufferAttribute(a,3));const p=new THREE.Points(geo,new THREE.PointsMaterial({color:0xb9c1c0,size:.06,transparent:true,opacity:.45}));scene.add(p);return p
}
const rainP=rain();

const keys={};addEventListener('keydown',e=>{keys[e.code]=true;if(e.code==='KeyC')player.crouch=!player.crouch;if(e.code==='Digit1')setOrder('ADVANCE');if(e.code==='Digit2')setOrder('HOLD');if(e.code==='Digit3')setOrder('FALL BACK');if(e.code==='Escape'&&started)togglePause()});addEventListener('keyup',e=>keys[e.code]=false);
let started=false,paused=false;
document.getElementById('start').onclick=()=>{started=true;document.getElementById('menu').classList.add('hidden');document.getElementById('hud').classList.remove('hidden');renderer.domElement.requestPointerLock?.();log('Company commander','Move with the next wave. Stay with your squad.')};
function togglePause(){paused=!paused;document.getElementById('pause').classList.toggle('hidden',!paused);if(paused)document.exitPointerLock?.();else renderer.domElement.requestPointerLock?.()}
document.addEventListener('mousemove',e=>{if(!started||paused||document.pointerLockElement!==renderer.domElement)return;player.yaw-=e.movementX*.0022;player.pitch-=e.movementY*.0018;player.pitch=Math.max(-1.35,Math.min(1.35,player.pitch))});
function setOrder(o){player.order=o;document.getElementById('orderText').textContent=o==='ADVANCE'?'ADVANCE':o==='FALL BACK'?'FALL BACK':'HOLD POSITION';document.getElementById('orderHint').textContent='ORDER RECEIVED · SQUAD MOVING';squads.filter(s=>s.userData.team==='ally').forEach(s=>s.userData.state=o.toLowerCase());log('ORDER',o==='ADVANCE'?'The line is moving forward.':'The squad adjusts to your command.')}
function log(a,b){const el=document.createElement('div');el.className='log';el.innerHTML='<b>'+a+'</b> · '+b;document.getElementById('eventLog').appendChild(el);setTimeout(()=>el.remove(),7000)}
let front=52,simTime=0,nextBurst=0,nextEvent=5;
function updateAI(dt){
 for(const s of squads){if(!s.userData.alive)continue;const u=s.userData;u.phase+=dt;
   const toward=u.team==='ally'?1:-1;let targetZ=u.home.z;
   if(u.team==='ally'&&player.order==='ADVANCE')targetZ-=20;
   if(u.team==='ally'&&player.order==='FALL BACK')targetZ+=18;
   if(u.team==='enemy')targetZ+=Math.sin(simTime*.18+u.phase)*2;
   const dx=(Math.sin(simTime*.13+u.phase)*2.8);const target=new THREE.Vector3(u.home.x+dx,-.85,targetZ);
   const d=s.position.distanceTo(target);if(d>.4)s.position.lerp(target,Math.min(1,dt*.35));
   s.position.y=-.85+Math.sin(simTime*2.5+u.phase)*.025;s.rotation.y=Math.sin(simTime*.3+u.phase)*.25;
 }
}
function updatePlayer(dt){
 const speed=(keys.ShiftLeft||keys.ShiftRight?7.2:4.2)*(player.crouch?.48:1);
 const f=new THREE.Vector3(-Math.sin(player.yaw),0,-Math.cos(player.yaw)),r=new THREE.Vector3(Math.cos(player.yaw),0,-Math.sin(player.yaw));
 const dir=new THREE.Vector3();if(keys.KeyW)dir.add(f);if(keys.KeyS)dir.sub(f);if(keys.KeyD)dir.add(r);if(keys.KeyA)dir.sub(r);if(dir.lengthSq())dir.normalize();
 player.pos.addScaledVector(dir,speed*dt);player.pos.x=THREE.MathUtils.clamp(player.pos.x,-72,72);player.pos.z=THREE.MathUtils.clamp(player.pos.z,-112,112);
 const bob=dir.lengthSq()?Math.sin(simTime*(keys.ShiftLeft?12:8))*.025:0;
 camera.position.set(player.pos.x,player.pos.y-(player.crouch?.52:0)+bob,player.pos.z);camera.rotation.set(player.pitch,player.yaw,0);
}
function frontline(dt){
 let pressure=0;for(const s of squads){if(!s.userData.alive)continue;pressure+=(s.userData.team==='ally'?s.position.z<frontlineZ():0?0:0)}
 const ally=squads.filter(s=>s.userData.team==='ally').reduce((a,s)=>a+(s.position.z<20?1:0),0);
 const enemy=squads.filter(s=>s.userData.team==='enemy').reduce((a,s)=>a+(s.position.z>-20?1:0),0);
 const delta=(player.order==='ADVANCE'?.38:-.04)+(ally-enemy)*.008;
 front=THREE.MathUtils.clamp(front+delta*dt,8,92);document.getElementById('frontFill').style.width=front+'%';
 const state=front>68?'ADVANCING':front<32?'FALLING BACK':'HOLDING';document.getElementById('frontText').textContent=state;
 if(Math.random()<dt*.05)log('FRONTLINE',state==='ADVANCING'?'Our men are crossing the next communication trench.':state==='FALLING BACK'?'The forward line is under pressure.':'The sector holds.');
}
function frontlineZ(){return (52-front)*1.65}
function simulateBattle(dt){
 nextBurst-=dt;if(nextBurst<0){nextBurst=1.2+Math.random()*2.8;const z=frontlineZ()+(Math.random()-.5)*24,x=(Math.random()-.5)*120;burst(x,z,.5+Math.random()*1.3);if(Math.random()<.55)flare(x*.7,z-12)}
 nextEvent-=dt;if(nextEvent<0){nextEvent=10+Math.random()*14;const msgs=['Runners are moving along the communication trench.','A tank is moving through the smoke ahead.','The rain is making the parapets slick.','Someone whistles from the reserve line.','A flare hangs over the wire.'];log('FIELD REPORT',msgs[Math.floor(Math.random()*msgs.length)])}
 const danger=Math.max(0,1-Math.abs(player.pos.z-frontlineZ())/26);document.body.classList.toggle('danger',danger>.7);
 player.morale=THREE.MathUtils.clamp(100-danger*32,54,100);document.getElementById('squadText').textContent=Math.round(8*player.morale/100)+' / 8';document.getElementById('moraleText').textContent=player.morale<70?'MORALE SHAKEN':'MORALE STEADY';
}
function animate(t){requestAnimationFrame(animate);const dt=Math.min(.05,(t-(animate.last||t))/1000);animate.last=t;if(!started||paused){renderer.render(scene,camera);return}simTime+=dt;updatePlayer(dt);updateAI(dt);frontline(dt);simulateBattle(dt);
 for(let i=fx.length-1;i>=0;i--){const f=fx[i];f.t+=dt;const q=f.t/f.d;if(f.m.isMesh){f.m.scale.setScalar(1+q*2.5);f.m.material.opacity=(1-q)*.75}else f.m.intensity=(1-q)*18;if(q>=1){world.remove(f.m);f.m.material?.dispose?.();fx.splice(i,1)}}
 rainP.rotation.y+=dt*.025;document.getElementById('clock').textContent=new Date(1917,5,18,6,14+Math.floor(simTime/4)).toTimeString().slice(0,5);
 renderer.render(scene,camera)}
animate(0);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
setTimeout(()=>document.getElementById('loading').style.opacity='0',1300);setTimeout(()=>document.getElementById('loading').remove(),2200);