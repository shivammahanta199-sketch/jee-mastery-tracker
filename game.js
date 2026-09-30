import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js';

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x86a3a6);
scene.fog=new THREE.FogExp2(0x86a3a6,0.00048);

const camera=new THREE.PerspectiveCamera(98,innerWidth/innerHeight,.025,5000);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.45));renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.28;
document.body.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xcce9ed,0x26362e,2.3));
const sun=new THREE.DirectionalLight(0xffe8c6,4.2);sun.position.set(-700,1000,450);sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-800;sun.shadow.camera.right=800;sun.shadow.camera.top=800;sun.shadow.camera.bottom=-800;scene.add(sun);

const terrainSize=2600,seg=170;
function terrainH(x,z){
 const ridge=Math.sin(x*.0027+z*.0011)*42+Math.cos(z*.0021-x*.001)*34;
 const rolling=Math.sin(x*.006)*12+Math.cos(z*.005)*10+Math.sin((x-z)*.009)*6;
 const valley=Math.sin(x*.00155+1.7)*.5+.5;
 return ridge+rolling+valley*valley*75-55;
}
const tg=new THREE.PlaneGeometry(terrainSize,terrainSize,seg,seg);tg.rotateX(-Math.PI/2);
const tp=tg.attributes.position;
for(let i=0;i<tp.count;i++)tp.setY(i,terrainH(tp.getX(i),tp.getZ(i)));
tg.computeVertexNormals();
const terrain=new THREE.Mesh(tg,new THREE.MeshStandardMaterial({color:0x3f6047,roughness:1,metalness:0}));
terrain.receiveShadow=true;scene.add(terrain);

const trunkG=new THREE.CylinderGeometry(.65,1.15,7,7),leafG=new THREE.ConeGeometry(4.7,15,8);
const trunkM=new THREE.MeshStandardMaterial({color:0x3b2b20,roughness:1}),leafM=new THREE.MeshStandardMaterial({color:0x193a27,roughness:1});
const trunks=new THREE.InstancedMesh(trunkG,trunkM,1500),leaves=new THREE.InstancedMesh(leafG,leafM,1500),dummy=new THREE.Object3D();
for(let i=0;i<1500;i++){
 let x=(Math.random()-.5)*2300,z=(Math.random()-.5)*2300;
 if(Math.abs(z-Math.sin(x*.004)*90)<30){i--;continue}
 let y=terrainH(x,z),s=.65+Math.random()*1.65;
 dummy.position.set(x,y+3.5*s,z);dummy.scale.setScalar(s);dummy.rotation.y=Math.random()*6.28;dummy.updateMatrix();trunks.setMatrixAt(i,dummy.matrix);
 dummy.position.y=y+10*s;dummy.updateMatrix();leaves.setMatrixAt(i,dummy.matrix);
}
trunks.castShadow=leaves.castShadow=true;scene.add(trunks,leaves);

const water=new THREE.Mesh(new THREE.PlaneGeometry(2300,125),new THREE.MeshPhysicalMaterial({color:0x1c6476,roughness:.08,metalness:.05,transparent:true,opacity:.86}));
water.rotation.x=-Math.PI/2;water.position.y=4;scene.add(water);
const rockM=new THREE.MeshStandardMaterial({color:0x5e625e,roughness:1});
for(let i=0;i<220;i++){const x=(Math.random()-.5)*2200,z=Math.sin(x*.004)*75+(Math.random()-.5)*50,s=.5+Math.random()*3.5,r=new THREE.Mesh(new THREE.IcosahedronGeometry(s,1),rockM);r.position.set(x,5+s*.15,z);r.scale.y=.45+Math.random()*.6;r.rotation.set(Math.random(),Math.random(),Math.random());r.castShadow=true;scene.add(r)}

for(let k=0;k<16;k++){
 const x=-1150+k*155,z=-820-Math.random()*320,h=190+Math.random()*330;
 const m=new THREE.Mesh(new THREE.ConeGeometry(145+Math.random()*120,h,9),new THREE.MeshStandardMaterial({color:0x40504b,roughness:1,flatShading:true}));
 m.position.set(x,h/2-25,z);m.rotation.y=Math.random();m.scale.z=.65;m.castShadow=true;scene.add(m);
}

const concrete=new THREE.MeshStandardMaterial({color:0x696c68,roughness:.94}),dark=new THREE.MeshStandardMaterial({color:0x292f30,roughness:.9});
function building(x,z,w,d,h){
 const y=terrainH(x,z),b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),concrete);b.position.set(x,y+h/2,z);b.castShadow=b.receiveShadow=true;scene.add(b);
 const roof=new THREE.Mesh(new THREE.BoxGeometry(w*.72,1.3,d*.5),dark);roof.position.set(x+.7,y+h+.7,z+.4);roof.castShadow=true;scene.add(roof);
}
for(let i=0;i<60;i++){let x=570+(Math.random()-.5)*760,z=260+(Math.random()-.5)*600;building(x,z,12+Math.random()*40,12+Math.random()*40,10+Math.random()*85)}
for(let i=0;i<11;i++){let x=570+(Math.random()-.5)*760,z=260+(Math.random()-.5)*600;building(x,z,30+Math.random()*18,30+Math.random()*18,110+Math.random()*180)}

const drone=new THREE.Group();
const motorVisuals=[];
const body=new THREE.Mesh(new THREE.BoxGeometry(.32,.15,.7),new THREE.MeshStandardMaterial({color:0x101416,metalness:.7,roughness:.22}));drone.add(body);
for(const sx of[-1,1])for(const sz of[-1,1]){
 const arm=new THREE.Mesh(new THREE.BoxGeometry(.075,.055,.62),new THREE.MeshStandardMaterial({color:0x202628,metalness:.55,roughness:.25}));
 arm.position.set(sx*.29,0,sz*.25);arm.rotation.y=sx*sz*.45;drone.add(arm);
 const motor=new THREE.Mesh(new THREE.CylinderGeometry(.073,.073,.085,12),new THREE.MeshStandardMaterial({color:0x090c0d,metalness:.8}));
 motor.rotation.x=Math.PI/2;motor.position.set(sx*.43,.02,sz*.43);drone.add(motor);
 const prop=new THREE.Mesh(new THREE.TorusGeometry(.13,.012,5,18),new THREE.MeshStandardMaterial({color:0x8b9292,metalness:.35,roughness:.35,transparent:true,opacity:.72}));
 prop.rotation.x=Math.PI/2;prop.position.set(sx*.43,.075,sz*.43);drone.add(prop);motorVisuals.push(prop);
}
const cameraRig=new THREE.Group();cameraRig.position.set(0,.08,-.12);drone.add(cameraRig);cameraRig.add(camera);scene.add(drone);

const keys={};addEventListener('keydown',e=>{keys[e.code]=true;if(e.code==='KeyR')reset()});addEventListener('keyup',e=>keys[e.code]=false);
let locked=false;renderer.domElement.addEventListener('click',()=>renderer.domElement.requestPointerLock?.());
document.addEventListener('pointerlockchange',()=>locked=document.pointerLockElement===renderer.domElement);
const mouse={x:0,y:0};addEventListener('mousemove',e=>{if(locked){mouse.x+=e.movementX*.0028;mouse.y+=e.movementY*.0028}});
const mobile={lx:0,ly:0,rx:0,ry:0};
document.querySelectorAll('.stick').forEach((el,i)=>{
 let active=false;
 const knob=el.querySelector('.knob');
 const resetStick=()=>{
   active=false;
   if(i===0){mobile.lx=0;mobile.ly=0}else{mobile.rx=0;mobile.ry=0}
   knob.style.transform='translate(0px,0px)';
 };
 const set=e=>{
   if(!active)return;
   const r=el.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
   const x=THREE.MathUtils.clamp((e.clientX-cx)/(r.width*.45),-1,1);
   const y=THREE.MathUtils.clamp((e.clientY-cy)/(r.height*.45),-1,1);
   if(i===0){mobile.lx=x;mobile.ly=y}else{mobile.rx=x;mobile.ry=y}
   knob.style.transform='translate('+x*42+'px,'+y*42+'px)';
 };
 el.addEventListener('pointerdown',e=>{active=true;try{el.setPointerCapture(e.pointerId)}catch(_){};set(e)});
 el.addEventListener('pointermove',set);
 el.addEventListener('pointerup',resetStick);
 el.addEventListener('pointercancel',resetStick);
 el.addEventListener('lostpointercapture',resetStick);
 window.addEventListener('pointerup',resetStick,{passive:true});
 window.addEventListener('pointercancel',resetStick,{passive:true});
});
let boost=false;const boostBtn=document.getElementById('boost');
boostBtn.onpointerdown=()=>boost=true;boostBtn.onpointerup=()=>boost=false;boostBtn.onpointercancel=()=>boost=false;

const flight={
 vel:new THREE.Vector3(0,0,-4),
 angVel:new THREE.Vector3(),
 throttle:.5,
 motor:[.5,.5,.5,.5],
 time:0,energy:100,crashed:false,shake:0,
 wind:new THREE.Vector3(),
 lastSpeed:0
};
const up=new THREE.Vector3(),fwd=new THREE.Vector3(),right=new THREE.Vector3(),localVel=new THREE.Vector3(),airVel=new THREE.Vector3();
const quatTmp=new THREE.Quaternion();
const motorDirs=[1,-1,1,-1];
const motorPos=[
 new THREE.Vector3(-.43,.0,-.43),
 new THREE.Vector3(.43,.0,-.43),
 new THREE.Vector3(.43,.0,.43),
 new THREE.Vector3(-.43,.0,.43)
];

function expo(v,a=.2){return v*(1-a)+v*v*v*a}
function dz(v,d=.035){return Math.abs(v)<d?0:(v-Math.sign(v)*d)/(1-d)}

function reset(){
 drone.position.set(-180,terrainH(-180,0)+65,0);
 drone.quaternion.identity();
 flight.vel.set(0,0,-4);
 flight.angVel.set(0,0,0);
 flight.throttle=.5;
 flight.motor.fill(.5);
 flight.energy=100;flight.time=0;flight.crashed=false;flight.shake=0;
 flight.wind.set(0,0,0);
 document.getElementById('crash').classList.remove('show');
}

reset();

function update(dt){
 if(flight.crashed){if(keys.KeyR)reset();return}

 let roll=(keys.KeyD?1:0)-(keys.KeyA?1:0)+mobile.rx;
 let pitch=(keys.KeyS?1:0)-(keys.KeyW?1:0)+mobile.ry;
 let yaw=(keys.KeyE?1:0)-(keys.KeyQ?1:0)+mobile.lx;
 let thr=(keys.Space?1:0)-(keys.ShiftLeft||keys.ShiftRight?1:0)-mobile.ly;

 if(locked){
   roll+=mouse.x*1.2;
   pitch+=mouse.y*1.2;
   mouse.x*=Math.pow(.0001,dt);
   mouse.y*=Math.pow(.0001,dt);
 }

 roll=expo(dz(THREE.MathUtils.clamp(roll,-1,1)));
 pitch=expo(dz(THREE.MathUtils.clamp(pitch,-1,1)));
 yaw=expo(dz(THREE.MathUtils.clamp(yaw,-1,1),.045),.18);
 thr=THREE.MathUtils.clamp(thr,-1,1);

 // A real FPV-style rate controller: sticks request angular velocity, not an artificial tilt.
 const maxRate=boost?13.5:10.5;
 const desired=new THREE.Vector3(pitch*maxRate,yaw*7.2,roll*maxRate);
 const rateError=desired.clone().sub(flight.angVel);

 // Motor mixer. Four motors generate both lift and rotational torque.
 const base=THREE.MathUtils.clamp(.50+thr*.46,0,1);
 const mixRoll=roll*.20, mixPitch=pitch*.20, mixYaw=yaw*.11;
 const targets=[
   base-mixRoll-mixPitch+mixYaw,
   base+mixRoll-mixPitch-mixYaw,
   base+mixRoll+mixPitch+mixYaw,
   base-mixRoll+mixPitch-mixYaw
 ];
 const motorResponse=1-Math.exp(-dt*18);
 for(let i=0;i<4;i++)flight.motor[i]+= (THREE.MathUtils.clamp(targets[i],0,1)-flight.motor[i])*motorResponse;

 // Battery voltage sag: hard throttle reduces available thrust.
 const avg=(flight.motor[0]+flight.motor[1]+flight.motor[2]+flight.motor[3])*.25;
 const sag=THREE.MathUtils.clamp(1-(1-flight.energy/100)*.28, .72,1);

 // Rigid-body angular dynamics: inertia + damping + control torque.
 const torqueGain=boost?30:24;
 const angularAccel=rateError.multiplyScalar(torqueGain);
 angularAccel.x-=flight.angVel.x*3.2;
 angularAccel.y-=flight.angVel.y*1.7;
 angularAccel.z-=flight.angVel.z*3.2;
 flight.angVel.addScaledVector(angularAccel,dt);

 // Integrate local angular velocity into orientation.
 quatTmp.setFromEuler(new THREE.Euler(flight.angVel.x*dt,flight.angVel.y*dt,flight.angVel.z*dt,'XYZ'));
 drone.quaternion.multiply(quatTmp).normalize();

 up.set(0,1,0).applyQuaternion(drone.quaternion);
 fwd.set(0,0,-1).applyQuaternion(drone.quaternion);
 right.set(1,0,0).applyQuaternion(drone.quaternion);

 // Air-relative velocity. Wind changes slowly instead of acting like a scripted boost.
 const t=flight.time;
 const targetWind=new THREE.Vector3(
   Math.sin(t*.17)*4+Math.sin(t*.043)*7,
   Math.sin(t*.31)*.8,
   Math.cos(t*.13)*4+Math.sin(t*.071)*5
 );
 flight.wind.lerp(targetWind,1-Math.exp(-dt*.35));
 airVel.copy(flight.vel).sub(flight.wind);
 const speed=airVel.length();

 // Total motor thrust. A 5-inch-class FPV craft has strong thrust-to-weight.
 let thrustN=avg*avg*30*sag;
 // Ground effect close to the surface increases lift slightly.
 const floor=terrainH(drone.position.x,drone.position.z)+1.7;
 const height=drone.position.y-floor;
 const groundEffect=height<3 ? 1+(3-height)*.10 : 1;
 thrustN*=groundEffect;

 flight.vel.addScaledVector(up,(thrustN/.72)*dt);
 flight.vel.y-=9.81*dt;

 // Aerodynamic drag: forward drag is mild; sideways and vertical slip are stronger.
 localVel.copy(airVel).applyQuaternion(drone.quaternion.clone().invert());
 const drag=new THREE.Vector3(
   -localVel.x*Math.abs(localVel.x)*.010,
   -localVel.y*Math.abs(localVel.y)*.016,
   -localVel.z*Math.abs(localVel.z)*.0035
 );
 drag.applyQuaternion(drone.quaternion);
 flight.vel.addScaledVector(drag,dt);

 // Prop wash / airframe drag grows with speed.
 flight.vel.multiplyScalar(Math.max(0,1-.012*dt*speed/10));

 // Small stability effect: aggressive forward pitch naturally creates speed.
 const forwardAssist=Math.max(0,-fwd.y);
 flight.vel.addScaledVector(fwd,forwardAssist*2.2*dt);

 const max=boost?110:92;
 if(flight.vel.length()>max)flight.vel.setLength(max);

 drone.position.addScaledVector(flight.vel,dt);

 // Props visually spin faster as motor command rises.
 for(let i=0;i<4;i++)motorVisuals[i].rotation.z+=dt*(18+flight.motor[i]*95)*motorDirs[i];

 // Battery consumption is load-based, not just a timer.
 flight.energy=Math.max(0,flight.energy-dt*(.8+avg*2.7+speed*.006));

 const impactSpeed=Math.max(0,-flight.vel.y);
 if(drone.position.y<floor){
   if(impactSpeed>12||speed>58||Math.abs(flight.angVel.x)+Math.abs(flight.angVel.z)>18){crash();return}
   drone.position.y=floor;
   flight.vel.y=Math.abs(flight.vel.y)*.12;
   flight.vel.x*=.72;flight.vel.z*=.72;
   flight.angVel.multiplyScalar(.55);
 }

 // Basic environmental collision with buildings/rocks at close range.
 if(Math.abs(drone.position.x)>1290||Math.abs(drone.position.z)>1290){crash();return}

 const k=THREE.MathUtils.clamp(speed/100,0,1);
 camera.fov+=(98+18*k-camera.fov)*(1-Math.exp(-dt*8));
 camera.updateProjectionMatrix();
 cameraRig.position.y=.08+Math.sin(flight.time*65)*k*.006;
 cameraRig.rotation.z=THREE.MathUtils.lerp(cameraRig.rotation.z,-flight.angVel.z*.018,1-Math.exp(-dt*10));

 document.getElementById('speed').textContent=Math.round(speed*3.6);
 document.getElementById('alt').textContent=Math.max(0,Math.round(drone.position.y-floor));
 document.getElementById('bat').textContent=Math.round(flight.energy);
 document.getElementById('speedbar').style.width=(k*100)+'%';

 flight.time+=dt;
}

function crash(){
 flight.crashed=true;
 flight.vel.multiplyScalar(.15);
 flight.angVel.multiplyScalar(.2);
 flight.shake=1;
 document.getElementById('crash').classList.add('show');
}

let last=performance.now();function loop(t){const dt=Math.min(.033,(t-last)/1000);last=t;update(dt);renderer.render(scene,camera);requestAnimationFrame(loop)}requestAnimationFrame(loop);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});

if(screen.orientation?.lock){document.getElementById('rotate').addEventListener('click',()=>screen.orientation.lock('landscape').catch(()=>{}))}
setTimeout(()=>document.getElementById('loading').classList.add('hidden'),900);
