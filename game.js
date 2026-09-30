import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js';

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x91a9ad);
scene.fog=new THREE.FogExp2(0x91a9ad,.00062);
const camera=new THREE.PerspectiveCamera(94,innerWidth/innerHeight,.03,5000);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;
document.body.appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xd7edf0,0x314037,2.2));
const sun=new THREE.DirectionalLight(0xffefd2,3.8);sun.position.set(-500,800,250);sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-700;sun.shadow.camera.right=700;sun.shadow.camera.top=700;sun.shadow.camera.bottom=-700;scene.add(sun);

const terrainSize=2400,seg=180;
function terrainH(x,z){const a=Math.sin(x*.0031)*38+Math.cos(z*.0024)*32+Math.sin((x+z)*.006)*18;const hills=Math.pow(Math.max(0,Math.sin(x*.0017+1.2)*.5+.5),2)*45+Math.pow(Math.max(0,Math.cos(z*.0015)*.5+.5),2)*35;const m=Math.max(0,Math.sin(x*.0021+z*.0014)*.5+.5);return a+hills+m*m*150-55}
const geo=new THREE.PlaneGeometry(terrainSize,terrainSize,seg,seg);geo.rotateX(-Math.PI/2);const pos=geo.attributes.position;
for(let i=0;i<pos.count;i++){const x=pos.getX(i),z=pos.getZ(i);pos.setY(i,terrainH(x,z))}geo.computeVertexNormals();
const ground=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:0x49664e,roughness:1}));ground.receiveShadow=true;scene.add(ground);

const trunkG=new THREE.CylinderGeometry(.8,1.3,7,7),leafG=new THREE.ConeGeometry(4.8,15,8),trunkM=new THREE.MeshStandardMaterial({color:0x4a3826,roughness:1}),leafM=new THREE.MeshStandardMaterial({color:0x203d2b,roughness:1});
const trunks=new THREE.InstancedMesh(trunkG,trunkM,1300),leaves=new THREE.InstancedMesh(leafG,leafM,1300),dummy=new THREE.Object3D();
for(let i=0;i<1300;i++){let x=(Math.random()-.5)*2150,z=(Math.random()-.5)*2150;if(Math.abs(x*.75+z*.55)<70){i--;continue}let y=terrainH(x,z),s=.7+Math.random()*1.7;dummy.position.set(x,y+3.5*s,z);dummy.scale.setScalar(s);dummy.rotation.y=Math.random()*6.28;dummy.updateMatrix();trunks.setMatrixAt(i,dummy.matrix);dummy.position.y=y+10*s;dummy.updateMatrix();leaves.setMatrixAt(i,dummy.matrix)}
trunks.castShadow=leaves.castShadow=true;scene.add(trunks,leaves);

const waterMat=new THREE.MeshPhysicalMaterial({color:0x286879,roughness:.16,metalness:.05,transparent:true,opacity:.82}),river=new THREE.Mesh(new THREE.PlaneGeometry(1800,105),waterMat);
river.rotation.x=-Math.PI/2;river.position.set(0,7,0);scene.add(river);
function riverY(x){return 5+Math.sin(x*.004)*5}
function rock(x,z,y){const s=.7+Math.random()*3,m=new THREE.Mesh(new THREE.IcosahedronGeometry(s,1),new THREE.MeshStandardMaterial({color:0x6a6f65,roughness:1}));m.position.set(x,y,z);m.scale.y=.5+Math.random();m.rotation.set(Math.random(),Math.random(),Math.random());m.castShadow=true;scene.add(m)}
for(let i=0;i<170;i++){const x=(Math.random()-.5)*2100,z=Math.sin(x*.004)*80+(Math.random()-.5)*45;rock(x,z,riverY(x)+.4)}
const mountainM=new THREE.MeshStandardMaterial({color:0x42504c,roughness:1,flatShading:true});
for(let k=0;k<14;k++){const x=-1050+k*165,z=-780-Math.random()*300,h=180+Math.random()*260,mm=new THREE.Mesh(new THREE.ConeGeometry(150+Math.random()*100,h,8,1),mountainM);mm.position.set(x,h/2-20,z);mm.rotation.y=Math.random();mm.scale.z=.65;mm.castShadow=true;scene.add(mm)}

const concrete=new THREE.MeshStandardMaterial({color:0x777872,roughness:.93}),darkConcrete=new THREE.MeshStandardMaterial({color:0x3d4140,roughness:.9});
function building(x,z,w,d,h){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),concrete);m.position.set(x,terrainH(x,z)+h/2,z);m.castShadow=m.receiveShadow=true;scene.add(m);if(Math.random()<.35){const s=new THREE.Mesh(new THREE.BoxGeometry(w*.6,1.2,d*.35),darkConcrete);s.position.set(x-w*.1,m.position.y+h*.45,z+d*.1);s.rotation.y=.05;s.castShadow=true;scene.add(s)}}
for(let i=0;i<46;i++){let x=500+(Math.random()-.5)*650,z=220+(Math.random()-.5)*520;building(x,z,12+Math.random()*38,12+Math.random()*38,10+Math.random()*75)}
for(let i=0;i<9;i++){let x=500+(Math.random()-.5)*650,z=220+(Math.random()-.5)*520;building(x,z,30,30,90+Math.random()*80)}

const drone=new THREE.Group(),body=new THREE.Mesh(new THREE.BoxGeometry(.32,.16,.7),new THREE.MeshStandardMaterial({color:0x15191b,metalness:.55,roughness:.28}));drone.add(body);
for(const sx of[-1,1])for(const sz of[-1,1]){const arm=new THREE.Mesh(new THREE.BoxGeometry(.08,.06,.55),new THREE.MeshStandardMaterial({color:0x202628,metalness:.5}));arm.position.set(sx*.28,0,sz*.24);arm.rotation.y=sx*sz*.45;drone.add(arm);const motor=new THREE.Mesh(new THREE.CylinderGeometry(.075,.075,.08,12),new THREE.MeshStandardMaterial({color:0x0d1011,metalness:.7}));motor.rotation.x=Math.PI/2;motor.position.set(sx*.42,.02,sz*.42);drone.add(motor)}
camera.position.set(0,.02,-.02);drone.add(camera);scene.add(drone);

const keys={};addEventListener('keydown',e=>{keys[e.code]=true;if(e.code==='KeyR')resetDrone()});addEventListener('keyup',e=>keys[e.code]=false);
let pointerLocked=false;renderer.domElement.addEventListener('click',()=>renderer.domElement.requestPointerLock?.());document.addEventListener('pointerlockchange',()=>pointerLocked=document.pointerLockElement===renderer.domElement);
const mouse={x:0,y:0};addEventListener('mousemove',e=>{if(pointerLocked){mouse.x=THREE.MathUtils.clamp(mouse.x+e.movementX*.004,-1,1);mouse.y=THREE.MathUtils.clamp(mouse.y+e.movementY*.004,-1,1)}});
const mobile={lx:0,ly:0,rx:0,ry:0};
document.querySelectorAll('.stick').forEach((el,i)=>{let active=false;const update=e=>{if(!active)return;const r=el.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let x=(e.clientX-cx)/(r.width*.45),y=(e.clientY-cy)/(r.height*.45);x=THREE.MathUtils.clamp(x,-1,1);y=THREE.MathUtils.clamp(y,-1,1);if(i===0){mobile.lx=x;mobile.ly=y}else{mobile.rx=x;mobile.ry=y}};el.addEventListener('pointerdown',e=>{active=true;el.setPointerCapture(e.pointerId);update(e)});el.addEventListener('pointermove',update);el.addEventListener('pointerup',()=>{active=false;if(i===0)mobile.lx=mobile.ly=0;else mobile.rx=mobile.ry=0});el.addEventListener('pointercancel',()=>{active=false;if(i===0)mobile.lx=mobile.ly=0;else mobile.rx=mobile.ry=0})});
let boost=false;const boostBtn=document.getElementById('boost');boostBtn.addEventListener('pointerdown',()=>boost=true);boostBtn.addEventListener('pointerup',()=>boost=false);boostBtn.addEventListener('pointercancel',()=>boost=false);

const flight={vel:new THREE.Vector3(),angVel:new THREE.Vector3(),thrust:.62,battery:100,elapsed:0};
function expo(v,a=.2){return v*(1-a)+v*v*v*a}function dead(v,d=.045){return Math.abs(v)<d?0:(v-Math.sign(v)*d)/(1-d)}
const up=new THREE.Vector3(),forward=new THREE.Vector3();
function resetDrone(){drone.position.set(-120,terrainH(-120,0)+55,0);drone.quaternion.identity();flight.vel.set(0,0,-24);flight.angVel.set(0,0,0);flight.thrust=.62;mouse.x=mouse.y=0}
resetDrone();

function update(dt){
  // Mode 2: left stick throttle/yaw, right stick pitch/roll.
  let rollIn=(keys.KeyD?1:0)-(keys.KeyA?1:0)+mobile.rx;
  let pitchIn=(keys.KeyS?1:0)-(keys.KeyW?1:0)-mobile.ry;
  let yawIn=(keys.KeyE?1:0)-(keys.KeyQ?1:0)+mobile.lx;
  let throttleIn=(keys.Space?1:0)-(keys.ShiftLeft||keys.ShiftRight?1:0)-mobile.ly;
  if(pointerLocked){rollIn+=mouse.x*.65;pitchIn+=mouse.y*.65;mouse.x*=Math.pow(.001,dt);mouse.y*=Math.pow(.001,dt)}
  rollIn=expo(dead(THREE.MathUtils.clamp(rollIn,-1,1)),.18);pitchIn=expo(dead(THREE.MathUtils.clamp(pitchIn,-1,1)),.18);yawIn=expo(dead(THREE.MathUtils.clamp(yawIn,-1,1)),.12);throttleIn=THREE.MathUtils.clamp(throttleIn,-1,1);

  // High-rate Acro response: centered sticks do NOT self-level.
  const maxRP=boost?15.7:13.8,maxYaw=boost?11.5:9.8;
  const target=new THREE.Vector3(pitchIn*maxRP,yawIn*maxYaw,rollIn*maxRP);
  flight.angVel.lerp(target,1-Math.exp(-dt*25));
  const dq=new THREE.Quaternion().setFromEuler(new THREE.Euler(flight.angVel.x*dt,flight.angVel.y*dt,flight.angVel.z*dt,'XYZ'));drone.quaternion.multiply(dq).normalize();

  const throttleTarget=.58+throttleIn*.40;flight.thrust+=(throttleTarget-flight.thrust)*(1-Math.exp(-dt*8));
  const thrustForce=(boost?2.95:2.45)*9.81*Math.max(0,flight.thrust);
  up.set(0,1,0).applyQuaternion(drone.quaternion);forward.set(0,0,-1).applyQuaternion(drone.quaternion);
  flight.vel.addScaledVector(up,thrustForce*dt);flight.vel.y-=9.81*dt;
  const speed=flight.vel.length(),drag=.055+speed*.00125;flight.vel.multiplyScalar(Math.max(0,1-drag*dt));
  const forwardAssist=Math.max(0,-forward.y)*(boost?16:10)+(boost?5:0);flight.vel.addScaledVector(forward,forwardAssist*dt);
  const maxSpeed=boost?82:65;if(flight.vel.length()>maxSpeed)flight.vel.setLength(maxSpeed);
  drone.position.addScaledVector(flight.vel,dt);
  const floor=terrainH(drone.position.x,drone.position.z)+2;if(drone.position.y<floor){drone.position.y=floor;if(flight.vel.y<0)flight.vel.y*= -.16;flight.angVel.multiplyScalar(.75)}
  const speedK=THREE.MathUtils.clamp(speed/65,0,1);camera.fov+=(94+speedK*14-camera.fov)*(1-Math.exp(-dt*7));camera.updateProjectionMatrix();camera.position.y=.02+Math.sin(flight.elapsed*42)*speedK*.003;
  flight.elapsed+=dt;flight.battery=Math.max(0,100-flight.elapsed/95);
  document.getElementById('speed').textContent=Math.round(speed*3.6);document.getElementById('alt').textContent=Math.max(0,Math.round(drone.position.y));document.getElementById('bat').textContent=Math.round(flight.battery);
}
let last=performance.now();function animate(t){const dt=Math.min(.033,(t-last)/1000);last=t;update(dt);renderer.render(scene,camera);requestAnimationFrame(animate)}requestAnimationFrame(animate);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
setTimeout(()=>document.getElementById('loading').style.display='none',700);
