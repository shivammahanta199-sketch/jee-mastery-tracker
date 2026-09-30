import * as THREE from 'three';

const isMobile = matchMedia('(max-width: 900px)').matches;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x555b59);
scene.fog = new THREE.FogExp2(0x4e5553, isMobile ? 0.009 : 0.0062);

const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.05, 520);
camera.rotation.order = 'YXZ';

const renderer = new THREE.WebGLRenderer({
  antialias: !isMobile,
  powerPreference: 'high-performance',
  stencil: false,
  depth: true
});
renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1 : 1.25));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = !isMobile;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.92;
renderer.domElement.setAttribute('aria-label', 'The Line battlefield');
document.body.appendChild(renderer.domElement);

const hemi = new THREE.HemisphereLight(0xb9c5c4, 0x20231f, 1.65);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffd7aa, 2.5);
sun.position.set(-110, 150, 85);
sun.castShadow = !isMobile;
sun.shadow.mapSize.set(isMobile ? 256 : 768, isMobile ? 256 : 768);
sun.shadow.camera.left = -150; sun.shadow.camera.right = 150;
sun.shadow.camera.top = 150; sun.shadow.camera.bottom = -150;
scene.add(sun);

const world = new THREE.Group();
const fx = new THREE.Group();
const actorsGroup = new THREE.Group();
scene.add(world, fx, actorsGroup);

const colliders = [];
const actors = [];
const activeChunks = new Map();
const effects = { tracers: [], flashes: [], blasts: [], dust: [] };
const keys = {};
const mobile = { x: 0, y: 0, look: false, lastX: 0, lastY: 0, run: false };

const shared = {
  box: new THREE.BoxGeometry(1, 1, 1),
  sphere: new THREE.SphereGeometry(1, 8, 5),
  body: new THREE.CapsuleGeometry(.23, .68, 4, 7),
  head: new THREE.SphereGeometry(.19, 8, 6),
  helmet: new THREE.SphereGeometry(.22, 8, 5),
  rock: new THREE.DodecahedronGeometry(.22, 0),
  wheel: new THREE.CylinderGeometry(.54, .54, .32, 10)
};

const M = {
  mud: new THREE.MeshStandardMaterial({ color: 0x373732, roughness: 1 }),
  darkMud: new THREE.MeshStandardMaterial({ color: 0x252622, roughness: 1 }),
  wood: new THREE.MeshStandardMaterial({ color: 0x51382a, roughness: .96 }),
  wetWood: new THREE.MeshStandardMaterial({ color: 0x382a23, roughness: .86 }),
  sand: new THREE.MeshStandardMaterial({ color: 0x77715e, roughness: .98 }),
  metal: new THREE.MeshStandardMaterial({ color: 0x252b29, roughness: .8, metalness: .25 }),
  ally: new THREE.MeshStandardMaterial({ color: 0x4e554d, roughness: .93 }),
  enemy: new THREE.MeshStandardMaterial({ color: 0x343a38, roughness: .93 }),
  skin: new THREE.MeshStandardMaterial({ color: 0x876e5d, roughness: 1 }),
  cloth: new THREE.MeshStandardMaterial({ color: 0x41463f, roughness: 1 })
};

const rand = (seed) => {
  let x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

function mesh(parent, geo, mat, x, y, z, sx=1, sy=1, sz=1, ry=0) {
  const o = new THREE.Mesh(geo, mat);
  o.position.set(x, y, z); o.scale.set(sx, sy, sz); o.rotation.y = ry;
  o.castShadow = !isMobile; o.receiveShadow = true; parent.add(o);
  return o;
}

function addBox(parent, x,y,z,sx,sy,sz,mat,ry=0) {
  return mesh(parent, shared.box, mat, x,y,z,sx,sy,sz,ry);
}

/* Prebuilt asset kit. These geometries/materials are allocated once and reused.
   Battlefield chunks only activate near the player, so opening the site does not
   populate the entire 400m battlefield into the render list. */
function makeSandbagBatch(parent, seed, zCenter) {
  const count = isMobile ? 42 : 68;
  const im = new THREE.InstancedMesh(shared.sphere, M.sand, count);
  im.instanceMatrix.setUsage(THREE.StaticDrawUsage);
  const q = new THREE.Object3D();
  for (let i=0;i<count;i++) {
    const side = i % 2 ? 1 : -1;
    const x = (rand(seed+i*2.1)-.5)*150;
    const z = zCenter + side*(3.5 + rand(seed+i*3.7)*2.1);
    q.position.set(x,.08,z); q.scale.set(1.25,.48,.72); q.rotation.y=rand(seed+i)*Math.PI;
    q.updateMatrix(); im.setMatrixAt(i,q.matrix);
  }
  im.instanceMatrix.needsUpdate = true;
  parent.add(im);
}

function makeTrees(parent, seed, zCenter) {
  const count = isMobile ? 14 : 24;
  const trunks = new THREE.InstancedMesh(shared.box, M.wetWood, count);
  const branches = new THREE.InstancedMesh(shared.box, M.wetWood, count*2);
  const q = new THREE.Object3D();
  for (let i=0;i<count;i++) {
    const x=(rand(seed+i*4)-.5)*180, z=zCenter+(rand(seed+i*5)-.5)*58;
    q.position.set(x,1.35,z); q.scale.set(.28,2.7,.28); q.rotation.y=rand(seed+i)*6.28; q.rotation.z=(rand(seed+i+8)-.5)*.18;
    q.updateMatrix(); trunks.setMatrixAt(i,q.matrix);
    for(let b=0;b<2;b++) {
      q.position.set(x+(rand(seed+i*7+b)-.5)*1.7,2.2+rand(seed+i*9+b)*1.7,z+(rand(seed+i*8+b)-.5)*1.7);
      q.scale.set(.12,1.35,.12); q.rotation.y=rand(seed+i+b)*6.28; q.rotation.z=(rand(seed+i+b+11)-.5)*1.2;
      q.updateMatrix(); branches.setMatrixAt(i*2+b,q.matrix);
    }
  }
  trunks.instanceMatrix.needsUpdate; branches.instanceMatrix.needsUpdate;
  parent.add(trunks,branches);
}

function makeDebris(parent, seed, zCenter) {
  const count=isMobile?30:54;
  const im=new THREE.InstancedMesh(shared.rock,M.mud,count),q=new THREE.Object3D();
  for(let i=0;i<count;i++){
    const x=(rand(seed+i*2)-.5)*170,z=zCenter+(rand(seed+i*3)-.5)*54;
    q.position.set(x,-.72,z); const s=.12+rand(seed+i*4)*.55; q.scale.set(s,s*.65,s);
    q.rotation.set(rand(seed+i)*3,rand(seed+i+1)*3,rand(seed+i+2)*3); q.updateMatrix(); im.setMatrixAt(i,q.matrix);
  }
  im.instanceMatrix.needsUpdate; parent.add(im);
}

function makeWire(parent, seed, zCenter) {
  const posts = isMobile ? 13 : 19;
  const g = new THREE.Group();
  for(let i=0;i<posts;i++){
    const x=-78+i*(156/(posts-1));
    addBox(g,x,.35,zCenter,.11,.7,.11,M.metal,(rand(seed+i)-.5)*.2);
  }
  addBox(g,0,.54,zCenter,78,.045,.045,M.metal);
  parent.add(g);
}

function makeTrench(parent, zCenter, seed) {
  for(const side of [-1,1]) {
    const z=zCenter+side*4.2;
    for(let x=-72;x<=72;x+=4.2) {
      if(Math.abs(Math.sin(x*.18+seed))>.35) addBox(parent,x,.08,z,1.05,.22,.72,M.sand,rand(seed+x)*6.28);
    }
    addBox(parent,0,-.64,zCenter,144,.16,.7,M.wetWood);
  }
  addBox(parent,-54,.25,zCenter,10,.65,2.2,M.darkMud);
  addBox(parent,51,.25,zCenter,8,.65,2.2,M.darkMud);
  makeWire(parent,seed,zCenter+7);
}

function buildChunk(index) {
  if(activeChunks.has(index)) return;
  const z=index*42;
  const g=new THREE.Group();
  g.userData.index=index;
  makeTrench(g,z,100+index*37);
  makeSandbagBatch(g,300+index*31,z);
  makeTrees(g,500+index*29,z);
  makeDebris(g,700+index*17,z);
  for(let i=0;i<5;i++){
    const x=(rand(index*90+i)-.5)*140, zz=z+(rand(index*120+i)-.5)*36;
    const r=.7+rand(index*200+i)*2.7;
    const crater=mesh(g,new THREE.CircleGeometry(r,18),M.darkMud,x,-.77,zz,1,1,1,0);
    crater.rotation.x=-Math.PI/2;
  }
  world.add(g); activeChunks.set(index,g);
}

function unloadFarChunks(centerIndex) {
  for(const [i,g] of activeChunks) {
    if(Math.abs(i-centerIndex)>3) { world.remove(g); activeChunks.delete(i); }
  }
}

function streamWorld() {
  const ci=Math.round(-player.pos.z/42);
  for(let i=ci-2;i<=ci+2;i++) buildChunk(i);
  unloadFarChunks(ci);
  colliders.length=0;
  for(const g of activeChunks.values()) {
    // Broad cover volumes only. They keep the player from walking through major trench walls.
    const z=g.userData.index*42;
    colliders.push({minX:-76,maxX:76,minZ:z-5,maxZ:z-3.2});
    colliders.push({minX:-76,maxX:76,minZ:z+3.2,maxZ:z+5});
  }
}

const sky=new THREE.Mesh(
  new THREE.SphereGeometry(290,32,20),
  new THREE.MeshBasicMaterial({color:0x66706f,side:THREE.BackSide,depthWrite:false})
);
scene.add(sky);

function makeRain() {
  const n=isMobile?260:520, a=new Float32Array(n*3);
  for(let i=0;i<n;i++){a[i*3]=(rand(i)*2-1)*190;a[i*3+1]=rand(i+4)*65;a[i*3+2]=(rand(i+8)*2-1)*220;}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(a,3));
  const p=new THREE.Points(g,new THREE.PointsMaterial({color:0xb8c0bf,size:isMobile?.045:.06,transparent:true,opacity:.28}));
  scene.add(p); return p;
}
const rain=makeRain();

function smokeCloud(x,z,scale=.7) {
  const g=new THREE.Group(); g.position.set(x,.1,z);
  const n=isMobile?4:7;
  for(let i=0;i<n;i++){
    const m=mesh(g,shared.sphere,new THREE.MeshBasicMaterial({color:0x3d4543,transparent:true,opacity:.085,depthWrite:false}),
      (rand(i+x)-.5)*3,i*1.05,(rand(i+z)-.5)*3,1.2+rand(i+x+z)*2,1.3,1.2+rand(i+4)*2);
    m.rotation.y=rand(i+z)*6.28;
  }
  g.scale.setScalar(scale); fx.add(g);
  return {g,t:0,d:8+Math.random()*6};
}
const smokes=[];
for(let i=0;i<(isMobile?5:9);i++) smokes.push(smokeCloud((rand(i*7)-.5)*150,(rand(i*11)-.5)*230,.5+rand(i)*.55));

function tank(x,z,team,dir) {
  const g=new THREE.Group();g.position.set(x,-.58,z);g.rotation.y=dir;
  addBox(g,0,.65,0,4.2,1.05,2.35,team==='ally'?M.ally:M.enemy);
  addBox(g,0,1.25,0,2.0,.6,1.55,M.metal);
  addBox(g,1.5,1.3,0,2.2,.12,.12,M.metal);
  for(const side of [-1,1]) for(let i=-1;i<=1;i++){
    const w=new THREE.Mesh(shared.wheel,M.metal);w.rotation.z=Math.PI/2;w.position.set(i*1.3,0,side*1.18);g.add(w);
  }
  world.add(g);
}
tank(-38,44,'ally',0); tank(46,-46,'enemy',Math.PI); tank(58,6,'ally',Math.PI/2);

/* Character assets are also pooled: one small geometry kit, many lightweight actors. */
function soldier(team,x,z,role='rifleman') {
  const g=new THREE.Group();
  g.position.set(x,-.75,z);
  const u=g.userData={team,homeX:x,homeZ:z,role,hp:100,alive:true,fireCD:.8+Math.random()*1.8,think:.2+Math.random(),morale:75+Math.random()*25,state:'defend',phase:Math.random()*6.28,target:null,coverZ:z};
  const body=mesh(g,shared.body,team==='ally'?M.ally:M.enemy,0,.72,0);
  const head=mesh(g,shared.head,M.skin,0,1.26,0);
  const helmet=mesh(g,shared.helmet,team==='ally'?M.ally:M.enemy,0,1.38,0,1,.5,1);
  addBox(g,0,.73,.22,.28,.4,.16,M.darkMud);
  const rifle=addBox(g,0,.72,-.37,.07,.07,.9,M.metal);rifle.rotation.x=-.2;
  u.hitMeshes=[body,head,helmet];
  actorsGroup.add(g);actors.push(g);return g;
}
for(let i=0;i<22;i++) soldier('ally',(rand(i*3)-.5)*105,53+rand(i*9)*34,i%6===0?'runner':'rifleman');
for(let i=0;i<26;i++) soldier('enemy',(rand(i*5+2)-.5)*115,-8-rand(i*7)*72,i%7===0?'machinegun':'rifleman');

const player={
  pos:new THREE.Vector3(0,.83,82),yaw:0,pitch:-.035,crouch:false,aim:false,
  health:100,ammo:5,reserve:30,reload:0,fireCD:0,recoil:0,stamina:100,morale:100,alive:true,order:'HOLD'
};

const state={started:false,paused:false,time:0,sector:0,capture:0,front:78,nextBlast:1.1,nextReport:4,quality:0,avg:16,pr:Math.min(devicePixelRatio,isMobile?1:1.25),stream:99};
const objectives=[55,18,-19,-56,-93];

function living(team){return actors.filter(a=>a.userData.alive&&a.userData.team===team)}

function nearestEnemy(team,pos,max=72) {
  let best=null,bd=max*max;
  for(const a of actors){
    if(!a.userData.alive||a.userData.team===team)continue;
    const dx=a.position.x-pos.x,dz=a.position.z-pos.z,d=dx*dx+dz*dz;
    if(d<bd){bd=d;best=a;}
  }
  if(team==='enemy'&&player.alive){
    const dx=player.pos.x-pos.x,dz=player.pos.z-pos.z,d=dx*dx+dz*dz;
    if(d<bd)best=player;
  }
  return best;
}

function audio() {
  const AC=window.AudioContext||window.webkitAudioContext;
  if(!AC) return null;
  const ctx=new AC();
  const master=ctx.createGain();master.gain.value=.12;master.connect(ctx.destination);
  const noise=(duration,filterFreq,volume=.2)=>{
    const b=ctx.createBuffer(1,ctx.sampleRate*duration,ctx.sampleRate),d=b.getChannelData(0);
    for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,2);
    const s=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();
    s.buffer=b;f.type='lowpass';f.frequency.value=filterFreq;g.gain.value=volume;s.connect(f).connect(g).connect(master);s.start();
  };
  return {
    gun(){noise(.09,2600,.5)},
    hit(){noise(.055,1800,.18)},
    blast(){noise(.5,500,.75)},
    step(){noise(.035,900,.06)}
  };
}
let sound=null;
function ensureAudio(){try{if(!sound)sound=audio();}catch{}}

function tracer(from,to,color=0xd0c2a6) {
  const g=new THREE.BufferGeometry().setFromPoints([from,to]);
  const line=new THREE.Line(g,new THREE.LineBasicMaterial({color,transparent:true,opacity:.85}));
  fx.add(line);effects.tracers.push({line,t:0,d:.075});
}
function muzzle(pos) {
  const s=mesh(fx,new THREE.SphereGeometry(.12,7,5),new THREE.MeshBasicMaterial({color:0xffd39a,transparent:true,opacity:.95}),pos.x,pos.y,pos.z);
  const l=isMobile?null:new THREE.PointLight(0xffb86f,12,9);if(l){l.position.copy(pos);fx.add(l);}
  effects.flashes.push({s,l,t:0,d:.1});
}
function blast(x,z,scale=.7) {
  const m=mesh(fx,new THREE.SphereGeometry(.8,12,8),new THREE.MeshBasicMaterial({color:0xb39a7b,transparent:true,opacity:.62}),x,-.2,z);
  const l=isMobile?null:new THREE.PointLight(0xffb66d,18,20);if(l){l.position.set(x,2,z);fx.add(l);}
  effects.blasts.push({m,l,t:0,d:.62});
  sound?.blast();
  if(!isMobile)smokes.push(smokeCloud(x,z,.35+scale*.35));
}
function hitMarker() {document.body.classList.add('hit');setTimeout(()=>document.body.classList.remove('hit'),55)}
function playerHit(d) {
  if(!player.alive)return;
  player.health=Math.max(0,player.health-d);
  document.body.classList.add('damaged');setTimeout(()=>document.body.classList.remove('damaged'),90);
  if(player.health<=0){player.alive=false;document.getElementById('downed').classList.remove('hidden');}
}

function actorHit(a,d) {
  a.userData.hp-=d;
  hitMarker();
  if(a.userData.hp<=0){a.userData.alive=false;a.visible=false;return true}
  a.userData.morale=Math.max(0,a.userData.morale-18);
  a.userData.state='cover';
  return false;
}

function fireAt(from,target,isPlayer=false) {
  const to=(target===player?player.pos:target.position).clone();to.y+=.65;
  tracer(from,to,isPlayer?0xe3caa8:(target?.userData?.team==='ally'?0xb9c8b7:0xb8b4aa));
  muzzle(from);
  if(isPlayer){sound?.gun(); if(target&&target!==player&&target.userData.alive)actorHit(target,48)}
  else { if(target===player)playerHit(4.5+Math.random()*8); else if(Math.random()<.48)actorHit(target,20); }
}

function playerFire() {
  if(!state.started||state.paused||!player.alive||player.reload>0||player.fireCD>0)return;
  ensureAudio();
  if(player.ammo<=0){reload();return}
  player.ammo--;player.fireCD=.42;player.recoil=1;
  const dir=new THREE.Vector3(0,0,-1).applyEuler(new THREE.Euler(player.pitch,player.yaw,0,'YXZ'));
  const from=camera.position.clone().add(dir.clone().multiplyScalar(.55));
  const ray=new THREE.Raycaster(from,dir,0,110);
  const meshes=actors.filter(a=>a.userData.alive).flatMap(a=>a.userData.hitMeshes);
  const hit=ray.intersectObjects(meshes,false)[0];
  muzzle(from);
  if(hit){const a=hit.object.parent;tracer(from,hit.point);if(a?.userData?.alive)actorHit(a,48);}
  else tracer(from,from.clone().add(dir.multiplyScalar(105)));
  sound?.gun();
}

function reload() {
  if(player.reload<=0&&player.ammo<5&&player.reserve>0){player.reload=1.25;log('RIFLE','Reloading under fire.');}
}

function coverTarget(a,target) {
  const dx=target===player?player.pos.x-a.position.x:target.position.x-a.position.x;
  const dz=target===player?player.pos.z-a.position.z:target.position.z-a.position.z;
  const len=Math.hypot(dx,dz)||1;
  a.userData.coverZ=a.position.z+(dz/len)*-4.5;
}

function updateAI(dt) {
  for(const a of actors) {
    const u=a.userData;if(!u.alive)continue;
    u.fireCD-=dt;u.think-=dt;u.phase+=dt;
    if(u.think<=0){
      u.think=.38+Math.random()*.85;
      u.target=nearestEnemy(u.team,a.position,78);
      if(u.morale<35)u.state='cover';
      else if(u.target)u.state=Math.random()<.2?'cover':'attack';
      else u.state=u.team==='ally'?(player.order==='ADVANCE'?'advance':player.order==='FALL BACK'?'fallback':'defend'):'defend';
      if(u.target)coverTarget(a,u.target);
    }
    let tx=u.homeX,tz=u.homeZ;
    if(u.state==='attack'&&u.target&&u.target.userData?.alive!==false){
      tx=u.target===player?player.pos.x:u.target.position.x;
      tz=(u.target===player?player.pos.z:u.target.position.z)+(u.team==='ally'?-3:3);
    } else if(u.state==='cover') {
      tx=u.position.x;tz=u.coverZ;
    } else if(u.team==='ally'&&u.state==='advance') {
      tz=objectives[Math.min(state.sector,objectives.length-1)]+7;
    } else if(u.team==='ally'&&u.state==='fallback') {
      tz=objectives[Math.min(state.sector+1,objectives.length-1)]+20;
    } else {
      tx=u.homeX+Math.sin(state.time*.16+u.phase)*2.1;
      tz=u.homeZ+Math.cos(state.time*.14+u.phase)*1.4;
    }
    const dx=tx-a.position.x,dz=tz-a.position.z,d2=dx*dx+dz*dz;
    if(d2>2.5){
      const inv=1/Math.sqrt(d2),speed=(u.state==='attack'?1.75:u.state==='advance'?1.35:1.05)*dt;
      a.position.x+=dx*inv*speed;a.position.z+=dz*inv*speed;a.rotation.y=Math.atan2(dx,dz);
    }
    if(u.target&&u.fireCD<=0&&Math.random()<dt*(u.state==='attack'?1.5:.75)){
      u.fireCD=1.0+Math.random()*1.9;
      const from=a.position.clone();from.y+=.78;
      fireAt(from,u.target,false);
    }
  }
}

function colliding(x,z) {
  for(const c of colliders) if(x>c.minX-.45&&x<c.maxX+.45&&z>c.minZ-.45&&z<c.maxZ+.45)return true;
  return false;
}

function updatePlayer(dt) {
  const moving=mobile.x!==0||mobile.y!==0||keys.KeyW||keys.KeyS||keys.KeyA||keys.KeyD;
  const running=(keys.ShiftLeft||keys.ShiftRight||mobile.run)&&moving&&!player.crouch&&player.stamina>0;
  const speed=(running?7.2:4.25)*(player.crouch?.48:1);
  const f=new THREE.Vector3(-Math.sin(player.yaw),0,-Math.cos(player.yaw));
  const r=new THREE.Vector3(Math.cos(player.yaw),0,-Math.sin(player.yaw));
  const dir=new THREE.Vector3();
  if(keys.KeyW)dir.add(f);if(keys.KeyS)dir.sub(f);if(keys.KeyD)dir.add(r);if(keys.KeyA)dir.sub(r);
  dir.addScaledVector(r,mobile.x).addScaledVector(f,-mobile.y);
  if(dir.lengthSq())dir.normalize();
  const ox=player.pos.x,oz=player.pos.z;
  player.pos.addScaledVector(dir,speed*dt);
  if(colliding(player.pos.x,oz))player.pos.x=ox;
  if(colliding(player.pos.x,player.pos.z))player.pos.z=oz;
  player.pos.x=THREE.MathUtils.clamp(player.pos.x,-80,80);
  player.pos.z=THREE.MathUtils.clamp(player.pos.z,-126,126);
  player.stamina=THREE.MathUtils.clamp(player.stamina+(running?-28:22)*dt,0,100);
  if(player.fireCD>0)player.fireCD-=dt;
  if(player.reload>0){player.reload-=dt;if(player.reload<=0){const n=Math.min(5-player.ammo,player.reserve);player.ammo+=n;player.reserve-=n;player.reload=0;log('RIFLE','Reload complete.');}}
  player.recoil=THREE.MathUtils.lerp(player.recoil,0,dt*14);
  const targetFov=player.aim?47:70;
  camera.fov=THREE.MathUtils.lerp(camera.fov,targetFov,dt*10);camera.updateProjectionMatrix();
  const bob=moving?Math.sin(state.time*(running?12:8))*(player.crouch?.012:.022):0;
  camera.position.set(player.pos.x,player.pos.y-(player.crouch?.4:0)+bob,player.pos.z);
  camera.rotation.set(player.pitch-player.recoil*.03,player.yaw,0);
}

function battle(dt) {
  const aa=living('ally'),ee=living('enemy');
  const za=aa.reduce((s,a)=>s+a.position.z,0)/(aa.length||1);
  const ze=ee.reduce((s,a)=>s+a.position.z,0)/(ee.length||1);
  const mid=(za+ze)/2;
  state.front=THREE.MathUtils.lerp(state.front,THREE.MathUtils.clamp(100-(mid+105)/2,8,96),dt*.18);
  const obj=objectives[Math.min(state.sector,objectives.length-1)];
  const na=aa.filter(a=>Math.abs(a.position.z-obj)<13).length+(Math.abs(player.pos.z-obj)<9?1:0);
  const ne=ee.filter(a=>Math.abs(a.position.z-obj)<13).length;
  state.capture=THREE.MathUtils.clamp(state.capture+(na-ne)*dt*.015,0,100);
  if(state.capture>=100&&state.sector<objectives.length-1){
    state.sector++;state.capture=0;setOrder('ADVANCE');log('OBJECTIVE','The line moves forward. New wire ahead.');
  }
  state.nextBlast-=dt;
  if(state.nextBlast<=0){
    state.nextBlast=1.4+Math.random()*3.4;
    blast((Math.random()-.5)*135,mid+(Math.random()-.5)*32,.45+Math.random()*.7);
  }
  state.nextReport-=dt;
  if(state.nextReport<=0){
    state.nextReport=7+Math.random()*12;
    const reports=['A runner brings word from the left flank.','Machine fire is cutting across the open ground.','Reserve troops are moving toward the line.','The men are holding despite the pressure.','A flare rises beyond the wire.'];
    log('FIELD REPORT',reports[Math.floor(Math.random()*reports.length)]);
  }
  const danger=Math.max(0,1-Math.abs(player.pos.z-mid)/38);
  player.morale=THREE.MathUtils.clamp(100-danger*32,52,100);
}

function log(a,b){
  const e=document.createElement('div');e.className='log';e.innerHTML='<b>'+a+'</b> · '+b;
  const box=document.getElementById('eventLog');box.appendChild(e);setTimeout(()=>e.remove(),6200);
}
function setOrder(o){
  player.order=o;
  document.getElementById('orderText').textContent=o==='ADVANCE'?'ADVANCE':o==='FALL BACK'?'FALL BACK':'HOLD POSITION';
  for(const a of living('ally'))a.userData.state=o==='ADVANCE'?'advance':o==='FALL BACK'?'fallback':'defend';
  log('COMMAND',o==='ADVANCE'?'Move on the next trench.':'HOLD POSITION'===document.getElementById('orderText').textContent?'Hold this sector.':'Fall back to the reserve line.');
}

function hud(){
  document.getElementById('healthText').textContent=Math.round(player.health);
  document.getElementById('ammoText').textContent=player.reload>0?'RELOADING':player.ammo+' / '+player.reserve;
  document.getElementById('moraleText').textContent=player.morale<70?'SHAKEN':player.morale>88?'STEADY':'UNEASY';
  document.getElementById('squadText').textContent=Math.min(8,living('ally').filter(a=>a.position.z>objectives[Math.min(state.sector+1,objectives.length-1)]-24).length)+'/ 8';
  document.getElementById('frontFill').style.width=state.front+'%';
  document.getElementById('frontText').textContent=state.front>68?'ADVANCING':state.front<35?'FALLING BACK':'HOLDING';
  document.getElementById('captureFill').style.width=state.capture+'%';
  document.getElementById('captureText').textContent=Math.round(state.capture)+'%';
  document.getElementById('objectiveName').textContent=state.sector<objectives.length-1?'TAKE COMMUNICATION TRENCH':'HOLD THE FINAL LINE';
}

function mobileInput(){
  const stick=document.getElementById('stick'),knob=document.getElementById('knob'),look=document.getElementById('lookZone');
  const setStick=e=>{const r=stick.getBoundingClientRect();let x=e.clientX-(r.left+r.width/2),y=e.clientY-(r.top+r.height/2),l=Math.hypot(x,y);if(l>44){x=x/l*44;y=y/l*44}mobile.x=x/44;mobile.y=y/44;knob.style.transform='translate('+x+'px,'+y+'px)'};
  stick.addEventListener('pointerdown',e=>{mobile.move=true;stick.setPointerCapture(e.pointerId);setStick(e)});
  stick.addEventListener('pointermove',e=>mobile.move&&setStick(e));
  const end=()=>{mobile.move=false;mobile.x=mobile.y=0;knob.style.transform='translate(0,0)'};
  stick.addEventListener('pointerup',end);stick.addEventListener('pointercancel',end);
  look.addEventListener('pointerdown',e=>{mobile.look=true;mobile.lastX=e.clientX;mobile.lastY=e.clientY;look.setPointerCapture?.(e.pointerId)});
  look.addEventListener('pointermove',e=>{if(!mobile.look)return;player.yaw-=(e.clientX-mobile.lastX)*.006;player.pitch-=(e.clientY-mobile.lastY)*.0045;player.pitch=THREE.MathUtils.clamp(player.pitch,-1.22,1.22);mobile.lastX=e.clientX;mobile.lastY=e.clientY});
  look.addEventListener('pointerup',()=>mobile.look=false);look.addEventListener('pointercancel',()=>mobile.look=false);
  document.getElementById('fireBtn').addEventListener('pointerdown',e=>{e.stopPropagation();playerFire()});
  document.getElementById('reloadBtn').addEventListener('pointerdown',e=>{e.stopPropagation();reload()});
  document.getElementById('crouchBtn').addEventListener('pointerdown',e=>{e.stopPropagation();player.crouch=!player.crouch});
  document.getElementById('runBtn').addEventListener('pointerdown',e=>{e.stopPropagation();mobile.run=!mobile.run});
  document.getElementById('aimBtn').addEventListener('pointerdown',e=>{e.stopPropagation();player.aim=true});
  document.getElementById('aimBtn').addEventListener('pointerup',()=>player.aim=false);
  document.getElementById('aimBtn').addEventListener('pointercancel',()=>player.aim=false);
  document.getElementById('pauseBtn').addEventListener('pointerdown',togglePause);
  document.querySelectorAll('#orderBtns button').forEach(b=>b.addEventListener('pointerdown',e=>{e.stopPropagation();setOrder(b.dataset.order)}));
}
mobileInput();

addEventListener('keydown',e=>{keys[e.code]=true;if(e.code==='KeyC')player.crouch=!player.crouch;if(e.code==='KeyR')reload();if(e.code==='Digit1')setOrder('ADVANCE');if(e.code==='Digit2')setOrder('HOLD');if(e.code==='Digit3')setOrder('FALL BACK');if(e.code==='Escape')togglePause()});
addEventListener('keyup',e=>keys[e.code]=false);
addEventListener('mousedown',e=>{if(state.started&&e.button===0)playerFire()});

function togglePause(){if(!state.started||!player.alive)return;state.paused=!state.paused;document.getElementById('pause').classList.toggle('hidden',!state.paused)}

document.getElementById('start').onclick=()=>{
  ensureAudio();
  state.started=true;document.getElementById('menu').classList.add('hidden');
  document.getElementById('hud').classList.remove('hidden');document.getElementById('mobileControls').classList.remove('hidden');
  log('COMPANY COMMANDER','Stay with your section. Advance only when ordered.');
};
document.getElementById('resumeBtn').onclick=togglePause;
document.getElementById('respawnBtn').onclick=()=>{player.alive=true;player.health=100;player.pos.set(0,.83,82);player.yaw=0;player.pitch=-.035;document.getElementById('downed').classList.add('hidden');log('MEDIC','Back with the reserve section.')};

function updateEffects(dt){
  for(const key of ['tracers','flashes','blasts']){
    const arr=effects[key];
    for(let i=arr.length-1;i>=0;i--){
      const e=arr[i];e.t+=dt;const q=e.t/e.d;
      if(key==='tracers')e.line.material.opacity=1-q;
      else if(key==='flashes'){e.s.scale.setScalar(1+q*2.5);e.s.material.opacity=1-q;if(e.l)e.l.intensity=(1-q)*12;}
      else {e.m.scale.setScalar(1+q*2.8);e.m.material.opacity=(1-q)*.62;if(e.l)e.l.intensity=(1-q)*18;}
      if(q>=1){fx.remove(e.line||e.s||e.m);if(e.line){e.line.geometry.dispose();e.line.material.dispose()}if(e.l)fx.remove(e.l);arr.splice(i,1);}
    }
  }
  for(let i=smokes.length-1;i>=0;i--){const s=smokes[i];s.t+=dt;s.g.position.y+=dt*.11;if(s.t>=s.d){fx.remove(s.g);smokes.splice(i,1)}}
}

function animate(t){
  requestAnimationFrame(animate);
  const dt=Math.min(.05,(t-(animate.last||t))/1000);animate.last=t;
  if(!state.started||state.paused){renderer.render(scene,camera);return}
  state.time+=dt;
  updatePlayer(dt);
  if(state.stream++%12===0)streamWorld();
  updateAI(dt);battle(dt);updateEffects(dt);
  rain.rotation.y+=dt*.018;
  if(Math.floor(state.time*2)%2===0)document.getElementById('clock').textContent='06:'+String(14+Math.floor(state.time/4)).padStart(2,'0');
  if(Math.floor(state.time*10)%2===0)hud();
  state.avg=state.avg*.92+dt*1000*.08;state.quality-=dt;
  if(state.quality<=0){state.quality=1.5;const target=isMobile?22:18;if(state.avg>target+4)state.pr=Math.max(.7,state.pr-.08);else if(state.avg<target-4)state.pr=Math.min(Math.min(devicePixelRatio,isMobile?1:1.25),state.pr+.04);renderer.setPixelRatio(state.pr);}
  renderer.render(scene,camera);
}
streamWorld();
animate(0);

addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
setTimeout(()=>{const l=document.getElementById('loading');l.style.opacity='0';setTimeout(()=>l.remove(),700)},700);
