import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js';

const mobile=matchMedia('(max-width:900px)').matches;
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x82988a);
scene.fog=new THREE.FogExp2(0x708477,mobile ? .010 : .0056);
const camera=new THREE.PerspectiveCamera(58,innerWidth/innerHeight,.05,700);
const renderer=new THREE.WebGLRenderer({antialias:!mobile,powerPreference:'high-performance',stencil:false,depth:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1:1.3));renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
renderer.shadowMap.enabled=!mobile;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=true;document.body.appendChild(renderer.domElement);

const hemi=new THREE.HemisphereLight(0xdbe8d7,0x203329,2.15);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffdfad,3.15);sun.position.set(-90,150,75);sun.castShadow=!mobile;
sun.shadow.mapSize.set(mobile?512:1024,mobile?512:1024);sun.shadow.camera.left=-130;sun.shadow.camera.right=130;sun.shadow.camera.top=130;sun.shadow.camera.bottom=-130;scene.add(sun);
const world=new THREE.Group(),fx=new THREE.Group(),actors=new THREE.Group();scene.add(world,fx,actors);

const G={box:new THREE.BoxGeometry(1,1,1),rock:new THREE.DodecahedronGeometry(1,1),trunk:new THREE.CylinderGeometry(.18,.27,1,7),leaf:new THREE.IcosahedronGeometry(1,1),sphere:new THREE.SphereGeometry(1,10,7),capsule:new THREE.CapsuleGeometry(.32,.85,5,9),ring:new THREE.TorusGeometry(1,.035,5,18)};
const M={
 ground:new THREE.MeshStandardMaterial({color:0x405b42,roughness:1}),rock:new THREE.MeshStandardMaterial({color:0x77786d,roughness:.95}),
 rockDark:new THREE.MeshStandardMaterial({color:0x3d4740,roughness:1}),trunk:new THREE.MeshStandardMaterial({color:0x49382a,roughness:1}),
 leaf:new THREE.MeshStandardMaterial({color:0x274b32,roughness:.96}),leaf2:new THREE.MeshStandardMaterial({color:0x456d46,roughness:.9}),
 cloth:new THREE.MeshStandardMaterial({color:0x6e4834,roughness:.92}),skin:new THREE.MeshStandardMaterial({color:0x8b684e,roughness:1}),
 gold:new THREE.MeshStandardMaterial({color:0xc7a354,roughness:.42,metalness:.65}),water:new THREE.MeshPhysicalMaterial({color:0x326c71,roughness:.08,metalness:.05,transparent:true,opacity:.72}),
 shrine:new THREE.MeshStandardMaterial({color:0x74604b,roughness:.78}),glow:new THREE.MeshBasicMaterial({color:0xd9bf71,transparent:true,opacity:.8})
};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));const hash=n=>{const x=Math.sin(n*127.1)*43758.5453;return x-Math.floor(x)};
const noise=(x,z)=>Math.sin(x*.035)+Math.sin(z*.047)*.7+Math.sin((x+z)*.019)*.55+Math.sin((x-z)*.071)*.2;
function height(x,z){const valley=Math.max(0,1-Math.abs(x)/82);const hills=noise(x,z)*2.4+Math.sin(x*.012)*4.5+Math.cos(z*.017)*3.5;const ridge=Math.max(0,(Math.abs(x)-42)*.08)**2;return hills+ridge-2.2*valley}
function matMesh(parent,g,m,p,s=1){const o=new THREE.Mesh(g,m);o.position.copy(p);o.scale.setScalar(s);o.castShadow=!mobile;o.receiveShadow=true;parent.add(o);return o}
function box(parent,p,s,m,ry=0){const o=new THREE.Mesh(G.box,m);o.position.copy(p);o.scale.copy(s);o.rotation.y=ry;o.castShadow=!mobile;o.receiveShadow=true;parent.add(o);return o}

const chunkSize=38,chunks=new Map();let lastChunkX=999,lastChunkZ=999;
function makeChunk(cx,cz){const key=cx+','+cz;if(chunks.has(key))return;const seg=mobile?14:22,geo=new THREE.PlaneGeometry(chunkSize,chunkSize,seg,seg),pos=geo.attributes.position;
for(let i=0;i<pos.count;i++){const x=pos.getX(i)+cx*chunkSize,z=-pos.getY(i)+cz*chunkSize;pos.setZ(i,height(x,z))}geo.computeVertexNormals();
const mesh=new THREE.Mesh(geo,M.ground);mesh.rotation.x=-Math.PI/2;mesh.position.set(cx*chunkSize,0,cz*chunkSize);mesh.receiveShadow=true;world.add(mesh);chunks.set(key,mesh)}
function streamTerrain(force=false){const cx=Math.round(player.pos.x/chunkSize),cz=Math.round(player.pos.z/chunkSize);if(!force&&cx===lastChunkX&&cz===lastChunkZ)return;lastChunkX=cx;lastChunkZ=cz;
for(let x=cx-3;x<=cx+3;x++)for(let z=cz-3;z<=cz+3;z++)makeChunk(x,z);
for(const [key,m] of chunks){const [x,z]=key.split(',').map(Number);if(Math.abs(x-cx)>4||Math.abs(z-cz)>4){world.remove(m);m.geometry.dispose();chunks.delete(key)}}}

function forest(){const count=mobile?120:300,trunks=new THREE.InstancedMesh(G.trunk,M.trunk,count),crowns=new THREE.InstancedMesh(G.leaf,M.leaf,count),o=new THREE.Object3D();
for(let i=0;i<count;i++){const x=(hash(i*2.17)-.5)*190,z=(hash(i*4.71)-.5)*250;if(Math.abs(x)<7&&Math.abs(z)<22){i--;continue}const y=height(x,z),s=.62+hash(i*5.4)*1.22;
o.position.set(x,y+1.9*s,z);o.scale.set(.7*s,3.8*s,.7*s);o.rotation.y=hash(i)*6.28;o.updateMatrix();trunks.setMatrixAt(i,o.matrix);
o.position.set(x,y+5.1*s,z);o.scale.set(2.1*s,2.6*s,2.1*s);o.rotation.y=hash(i+9)*6.28;o.updateMatrix();crowns.setMatrixAt(i,o.matrix)}
trunks.instanceMatrix.needsUpdate=true;crowns.instanceMatrix.needsUpdate=true;world.add(trunks,crowns)}
function rocks(){const n=mobile?70:150,im=new THREE.InstancedMesh(G.rock,M.rock,n),o=new THREE.Object3D();
for(let i=0;i<n;i++){const x=(hash(i*8)-.5)*180,z=(hash(i*12)-.5)*240,y=height(x,z);o.position.set(x,y+.2,z);const s=.3+hash(i*3)*1.8;o.scale.set(s,s*(.55+hash(i)*.8),s);o.rotation.set(hash(i)*3,hash(i+2)*3,hash(i+4)*3);o.updateMatrix();im.setMatrixAt(i,o.matrix)}im.instanceMatrix.needsUpdate=true;world.add(im)}
forest();rocks();

const river=new THREE.Mesh(new THREE.PlaneGeometry(42,240),M.water);river.rotation.x=-Math.PI/2;river.position.set(0,-.1,45);world.add(river);
for(let i=-4;i<=4;i++)box(world,new THREE.Vector3(i*4.1,height(i*4.1,0)+.4,0),new THREE.Vector3(3.5,.7,7),M.rockDark,hash(i)*.2);
const shrine=new THREE.Group(),sy=height(0,-48);box(shrine,new THREE.Vector3(0,sy+1.2,-48),new THREE.Vector3(7,2.4,5),M.shrine);box(shrine,new THREE.Vector3(0,sy+4,-48),new THREE.Vector3(9,.5,6),M.gold);
box(shrine,new THREE.Vector3(-2.8,sy+3,-48),new THREE.Vector3(.4,4,.4),M.gold);box(shrine,new THREE.Vector3(2.8,sy+3,-48),new THREE.Vector3(.4,4,.4),M.gold);
const shrineOrb=matMesh(shrine,G.sphere,M.glow,new THREE.Vector3(0,5.2,-48),.55);world.add(shrine);

const fireflies=new THREE.InstancedMesh(G.sphere,new THREE.MeshBasicMaterial({color:0xd9d47b,transparent:true,opacity:.65}),mobile?45:90),fo=new THREE.Object3D();
for(let i=0;i<fireflies.count;i++){const x=(hash(i*17)-.5)*130,z=(hash(i*31)-.5)*180;fo.position.set(x,height(x,z)+2+hash(i)*4,z);fo.scale.setScalar(.035+hash(i)*.035);fo.updateMatrix();fireflies.setMatrixAt(i,fo.matrix)}fireflies.instanceMatrix.needsUpdate=true;world.add(fireflies);

const player={pos:new THREE.Vector3(0,height(0,22)+.2,22),vel:new THREE.Vector3(),yaw:Math.PI,pitch:-.08,hp:100,stamina:100,orb:0,grounded:true,guard:false,sprint:false,attack:0,attackCD:0,inv:0};
const keys={},mobileInput={x:0,y:0,look:false,lx:0,ly:0};const avatar=new THREE.Group();actors.add(avatar);
function buildPlayer(){matMesh(avatar,G.capsule,M.cloth,new THREE.Vector3(0,.95,0),1);matMesh(avatar,G.sphere,M.skin,new THREE.Vector3(0,1.72,0),.38);const staff=box(avatar,new THREE.Vector3(.45,.95,-.35),new THREE.Vector3(.08,2.4,.08),M.gold,.35);avatar.userData={staff}}
buildPlayer();

const enemies=[];
function enemy(x,z){const g=new THREE.Group();g.position.set(x,height(x,z)+.1,z);matMesh(g,G.capsule,M.rockDark,new THREE.Vector3(0,.8,0),.95);matMesh(g,G.sphere,M.gold,new THREE.Vector3(0,1.55,.28),.16);
g.userData={hp:120,max:120,cd:1+hash(x+z),phase:hash(x)*6.28,home:new THREE.Vector3(x,0,z),alive:true};actors.add(g);enemies.push(g)}
enemy(-11,-23);enemy(15,-36);enemy(-18,-66);enemy(20,-82);
const boss=new THREE.Group();boss.position.set(0,height(0,-108),-108);matMesh(boss,G.capsule,M.rockDark,new THREE.Vector3(0,2,0),2.6);matMesh(boss,G.sphere,M.gold,new THREE.Vector3(-.7,3.5,.9),.22);matMesh(boss,G.sphere,M.gold,new THREE.Vector3(.7,3.5,.9),.22);boss.userData={hp:900,max:900,cd:2,alive:true,phase:0};actors.add(boss);

const effects=[];
function burst(p,scale=.7){const m=matMesh(fx,G.sphere,new THREE.MeshBasicMaterial({color:0xd5b665,transparent:true,opacity:.8}),p,scale);m.userData.t=0;m.userData.d=.38;effects.push(m)}
function damageEnemy(e,d){if(!e.userData.alive)return;e.userData.hp-=d;e.userData.flash=.08;burst(e.position,.35);if(e.userData.hp<=0){e.userData.alive=false;e.visible=false;player.orb+=1;message('Spirit orb recovered.');if(e===boss){document.getElementById('objective').textContent='RETURN TO THE SHRINE';document.getElementById('objectiveHint').textContent='The valley is quiet again.'}}}
function attack(){if(paused||player.attackCD>0||player.stamina<10)return;player.attack=.3;player.attackCD=.42;player.stamina-=10;burst(player.pos.clone().add(new THREE.Vector3(0,1,0)),.25);
for(const e of [...enemies,boss])if(e.userData.alive&&e.position.distanceTo(player.pos)<4.8)damageEnemy(e,e===boss?65:90)}
function playerDamage(d){if(player.inv>0||player.guard)return;player.hp=clamp(player.hp-d,0,100);player.inv=.35;if(player.hp<=0){player.hp=100;player.pos.set(0,height(0,22)+.2,22);message('The shrine restores your spirit.');}}
function enemyAI(dt){for(const e of enemies){const u=e.userData;if(!u.alive)continue;u.cd-=dt;u.phase+=dt;const dx=player.pos.x-e.position.x,dz=player.pos.z-e.position.z,dist=Math.hypot(dx,dz);
if(dist<18){if(dist>2.5){e.position.x+=dx/dist*dt*1.2;e.position.z+=dz/dist*dt*1.2}else if(u.cd<=0){u.cd=1.3;playerDamage(8);burst(player.pos,.35)}}else{e.position.x=u.home.x+Math.sin(u.phase)*1.5;e.position.z=u.home.z+Math.cos(u.phase)*1.5}e.position.y=height(e.position.x,e.position.z)+.1;e.lookAt(player.pos.x,e.position.y,player.pos.z)}
const u=boss.userData;if(u.alive){u.cd-=dt;u.phase+=dt;const dx=player.pos.x-boss.position.x,dz=player.pos.z-boss.position.z,dist=Math.hypot(dx,dz);if(dist>4.5){boss.position.x+=dx/dist*dt*1.5;boss.position.z+=dz/dist*dt*1.5}else if(u.cd<=0){u.cd=1.1;playerDamage(14);burst(player.pos,.6)}boss.position.y=height(boss.position.x,boss.position.z)+.1;boss.lookAt(player.pos.x,boss.position.y,player.pos.z)}}

function updatePlayer(dt){const moving=keys.KeyW||keys.KeyS||keys.KeyA||keys.KeyD||mobileInput.x||mobileInput.y;const sprint=(keys.ShiftLeft||keys.ShiftRight||player.sprint)&&moving&&player.stamina>0&&!player.guard;const speed=sprint?8.2:4.7;
const f=new THREE.Vector3(-Math.sin(player.yaw),0,-Math.cos(player.yaw)),r=new THREE.Vector3(Math.cos(player.yaw),0,-Math.sin(player.yaw)),d=new THREE.Vector3();if(keys.KeyW)d.add(f);if(keys.KeyS)d.sub(f);if(keys.KeyD)d.add(r);if(keys.KeyA)d.sub(r);d.addScaledVector(r,mobileInput.x).addScaledVector(f,-mobileInput.y);if(d.lengthSq())d.normalize();
const accel=1-Math.exp(-dt*12);player.vel.x=THREE.MathUtils.lerp(player.vel.x,d.x*speed,accel);player.vel.z=THREE.MathUtils.lerp(player.vel.z,d.z*speed,accel);player.vel.y-=20*dt;
const nextX=player.pos.x+player.vel.x*dt,nextZ=player.pos.z+player.vel.z*dt,ground=height(nextX,nextZ)+.15;if(player.pos.y<=ground&&player.vel.y<=0){player.pos.y=ground;player.vel.y=0;player.grounded=true}else player.grounded=false;
player.pos.x=nextX;player.pos.z=nextZ;player.pos.y+=player.vel.y*dt;if((keys.Space||mobileInput.jump)&&player.grounded){player.vel.y=8.2;player.grounded=false;mobileInput.jump=false}
player.stamina=clamp(player.stamina+(sprint?-30:18)*dt,0,100);player.attackCD=Math.max(0,player.attackCD-dt);player.attack=Math.max(0,player.attack-dt);player.inv=Math.max(0,player.inv-dt);
avatar.position.copy(player.pos);avatar.rotation.y=player.yaw;avatar.userData.staff.rotation.z=player.attack>0?Math.sin((.3-player.attack)*28)*1.3:.2;
camera.fov=THREE.MathUtils.lerp(camera.fov,player.guard?52:58,dt*8);camera.updateProjectionMatrix();
const camBack=new THREE.Vector3(Math.sin(player.yaw)*5.8,3.0,Math.cos(player.yaw)*5.8),desired=player.pos.clone().add(camBack);desired.y=Math.max(desired.y,height(desired.x,desired.z)+1.0);camera.position.lerp(desired,1-Math.exp(-dt*8));camera.lookAt(player.pos.x,player.pos.y+1.15,player.pos.z)}

let paused=false,started=false;
function message(s){const m=document.getElementById('message');m.textContent=s;m.style.opacity=1;clearTimeout(message.t);message.t=setTimeout(()=>m.style.opacity=0,2200)}
function hud(){document.getElementById('hp').textContent=Math.round(player.hp);document.getElementById('stamina').textContent=Math.round(player.stamina);document.getElementById('orb').textContent=player.orb;document.getElementById('hpBar').style.width=player.hp+'%';document.getElementById('staminaBar').style.width=player.stamina+'%';
const b=document.getElementById('boss');b.classList.toggle('hidden',boss.userData.hp>=boss.userData.max||!boss.userData.alive);if(!b.classList.contains('hidden'))b.querySelector('em').style.width=(boss.userData.hp/boss.userData.max*100)+'%'}
function interact(){const d=player.pos.distanceTo(new THREE.Vector3(0,sy+5.2,-48));message(d<12?'The shrine fills you with calm. The Stone Warden waits beyond the valley.':'Nothing here responds. The mountain remains stubbornly beautiful.')}
function togglePause(){if(!started)return;paused=!paused;document.getElementById('pause').classList.toggle('hidden',!paused)}
addEventListener('keydown',e=>{keys[e.code]=true;if(e.code==='KeyE')interact();if(e.code==='Escape')togglePause()});addEventListener('keyup',e=>keys[e.code]=false);
addEventListener('mousedown',e=>{if(e.button===0)attack();if(e.button===2)player.guard=true});addEventListener('mouseup',e=>{if(e.button===2)player.guard=false});addEventListener('contextmenu',e=>e.preventDefault());

if(mobile){const stick=document.getElementById('stick'),knob=stick.querySelector('i'),look=document.getElementById('look');
const set=e=>{const r=stick.getBoundingClientRect();let x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2,l=Math.hypot(x,y);if(l>43){x=x/l*43;y=y/l*43}mobileInput.x=x/43;mobileInput.y=y/43;knob.style.transform='translate('+x+'px,'+y+'px)'};
stick.addEventListener('pointerdown',e=>{stick.setPointerCapture(e.pointerId);set(e)});stick.addEventListener('pointermove',set);const end=()=>{mobileInput.x=mobileInput.y=0;knob.style.transform='translate(0,0)'};stick.addEventListener('pointerup',end);stick.addEventListener('pointercancel',end);
look.addEventListener('pointerdown',e=>{mobileInput.look=true;mobileInput.lx=e.clientX;mobileInput.ly=e.clientY;look.setPointerCapture(e.pointerId)});
look.addEventListener('pointermove',e=>{if(!mobileInput.look)return;player.yaw-=(e.clientX-mobileInput.lx)*.006;player.pitch=clamp(player.pitch-(e.clientY-mobileInput.ly)*.004,-1,.6);mobileInput.lx=e.clientX;mobileInput.ly=e.clientY});
look.addEventListener('pointerup',()=>mobileInput.look=false);look.addEventListener('pointercancel',()=>mobileInput.look=false);
document.getElementById('attack').onpointerdown=attack;document.getElementById('jump').onpointerdown=()=>mobileInput.jump=true;document.getElementById('guard').onpointerdown=()=>player.guard=true;document.getElementById('guard').onpointerup=()=>player.guard=false;document.getElementById('guard').onpointercancel=()=>player.guard=false;document.getElementById('sprint').onpointerdown=()=>player.sprint=true;document.getElementById('sprint').onpointerup=()=>player.sprint=false;document.getElementById('sprint').onpointercancel=()=>player.sprint=false;document.getElementById('interact').onpointerdown=interact;document.getElementById('pauseBtn').onpointerdown=togglePause;document.getElementById('mobile').classList.remove('hidden')}
document.getElementById('resume').onclick=togglePause;

let last=0,perf=16,quality=renderer.getPixelRatio(),qualityTimer=0,fpsTimer=0,fpsFrames=0,lastTerrain=0;
function animate(t){requestAnimationFrame(animate);const dt=Math.min(.045,(t-last||16)/1000);last=t;if(!started||paused){renderer.render(scene,camera);return}
const begin=performance.now();updatePlayer(dt);streamTerrain();enemyAI(dt);
shrineOrb.position.y=sy+5.2+Math.sin(t*.0018)*.18;fireflies.rotation.y=t*.00004;
for(let i=effects.length-1;i>=0;i--){const e=effects[i];e.userData.t+=dt;const q=e.userData.t/e.userData.d;e.scale.setScalar(1+q*3);e.material.opacity=.8*(1-q);if(q>=1){fx.remove(e);e.material.dispose();effects.splice(i,1)}}
hud();perf=perf*.9+(performance.now()-begin)*.1;qualityTimer-=dt;if(qualityTimer<0){qualityTimer=1.5;const target=mobile?15:13;if(perf>target+4)quality=Math.max(.68,quality-.06);else if(perf<target-3)quality=Math.min(Math.min(devicePixelRatio,mobile?1:1.3),quality+.03);renderer.setPixelRatio(quality)}
fpsFrames++;fpsTimer+=dt;if(fpsTimer>.5){document.getElementById('fps').textContent=Math.round(fpsFrames/fpsTimer);fpsFrames=0;fpsTimer=0}renderer.render(scene,camera)}
streamTerrain(true);camera.position.set(0,5,29);camera.lookAt(player.pos);started=true;document.getElementById('boot').style.opacity=0;setTimeout(()=>document.getElementById('boot').remove(),650);animate(0);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
