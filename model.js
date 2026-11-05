// 3D model of the planned bijkeuken: the painted voorzetwand, the fridge cupboard,
// dryer + washer under the worktop, and the wall strips with shelves and a hanging rail.
// Units: metres. x = along the wall from the exterior wall, y = up, z = out from the wall face.
import * as THREE from "three";
import { OrbitControls } from "three/addons/OrbitControls.js";
import { RoomEnvironment } from "three/addons/RoomEnvironment.js";

const box = document.getElementById("model");
const stage = box.querySelector(".m-stage");
const btnDoors = box.querySelector("[data-act=doors]");
const btnReset = box.querySelector("[data-act=reset]");

// ---- sizes (same numbers as the cupboard sketch) ----
const W = 2.605, H = 2.465, VZW = 0.147;          // wall width, height, voorzetwand depth from old wall
const ROOM_D = 2.6;                                  // room depth shown
const T = 0.018, FILL = 0.05, STORE_IN = 0.61, NICHE_W = 0.56;
const xL = FILL, xM = xL + T + STORE_IN, xR = xM + T + NICHE_W, CUP_R = xR + T;
const PLINTH = 0.1, DEPTH = 0.58, SLOT = 0.06;
const yShelf = PLINTH + T + 1.46, yTop = H - SLOT;
const DRYER_X = 1.31, WASH_X = 1.925, APP = { w: 0.6, h: 0.85, d: 0.6 };
const WT = { y: 0.88, t: 0.038, d: 0.62 };
const BAY = { x: 1.905, h: 1.18 };
const RAILS = [1.38, 1.95, 2.52];

function init() {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch (e) {
    box.classList.add("m-fail");
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.78;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  stage.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(40, 1, 0.05, 50);
  const HOME = { pos: new THREE.Vector3(1.05, 1.75, 4.9), target: new THREE.Vector3(1.4, 1.15, 0.5) };
  camera.position.copy(HOME.pos);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(HOME.target);
  controls.enableDamping = true;
  controls.minDistance = 1.2;
  controls.maxDistance = 7;
  controls.maxPolarAngle = Math.PI * 0.53;
  controls.minAzimuthAngle = -Math.PI * 0.45;
  controls.maxAzimuthAngle = Math.PI * 0.45;
  controls.update();

  // Let the page scroll with the mouse wheel; zoom only with ctrl/⌘ or a trackpad pinch.
  stage.addEventListener("wheel", e => { if (!e.ctrlKey && !e.metaKey) e.stopPropagation(); }, { capture: true });

  // ---- lights ----
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8a7f72, 0.3));
  const sun = new THREE.DirectionalLight(0xfff4e6, 1.7);
  sun.position.set(2.2, 4.2, 3.4);
  sun.target.position.set(1.3, 0.8, 0.3);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -2.2, right: 2.2, top: 2.6, bottom: -1.6, near: 0.5, far: 10 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  scene.add(sun, sun.target);

  // ---- materials ----
  const tex = (w, h, draw, rx = 1, ry = 1) => {
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    draw(c.getContext("2d"), w, h);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(rx, ry);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  };
  // painted OSB: white with the faint chip pattern showing through
  const osbTex = tex(512, 512, (g, w, h) => {
    g.fillStyle = "#f2f0eb"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) {
      const l = 228 + Math.random() * 22;
      g.fillStyle = `rgb(${l},${l - 2},${l - 6})`;
      g.save();
      g.translate(Math.random() * w, Math.random() * h);
      g.rotate(Math.random() * Math.PI);
      g.fillRect(-14 - Math.random() * 20, -3 - Math.random() * 4, 28 + Math.random() * 40, 6 + Math.random() * 8);
      g.restore();
    }
  }, 2.6, 2.4);
  // PVC floor in long planks
  const floorTex = tex(512, 512, (g, w, h) => {
    const rows = 4;
    for (let r = 0; r < rows; r++) {
      const off = (r % 2) * w / 2;
      for (let k = -1; k < 2; k++) {
        const l = 112 + Math.random() * 22;
        g.fillStyle = `rgb(${l},${l - 8},${l - 16})`;
        g.fillRect(off + k * w, r * h / rows, w, h / rows);
        for (let i = 0; i < 40; i++) {
          g.strokeStyle = `rgba(60,45,30,${0.05 + Math.random() * 0.06})`;
          g.beginPath();
          const y = r * h / rows + Math.random() * h / rows;
          g.moveTo(off + k * w, y); g.bezierCurveTo(off + k * w + w / 3, y + 3, off + k * w + 2 * w / 3, y - 3, off + (k + 1) * w, y);
          g.stroke();
        }
        g.fillStyle = "rgba(40,30,20,.35)";
        g.fillRect(off + k * w, r * h / rows, 2, h / rows);
      }
      g.fillStyle = "rgba(40,30,20,.35)";
      g.fillRect(0, r * h / rows, w, 2);
    }
  }, 1.4, 4);
  const oakTex = tex(512, 64, (g, w, h) => {
    g.fillStyle = "#c79f68"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) {
      g.strokeStyle = `rgba(110,72,35,${0.08 + Math.random() * 0.12})`;
      g.lineWidth = 0.5 + Math.random() * 1.5;
      const y = Math.random() * h;
      g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(w / 3, y + 4, 2 * w / 3, y - 4, w, y + 1); g.stroke();
    }
  }, 2, 1);

  const M = {
    wall: new THREE.MeshStandardMaterial({ map: osbTex, roughness: 0.9 }),
    side: new THREE.MeshStandardMaterial({ color: 0xe9e8e4, roughness: 0.95 }),
    oldWall: new THREE.MeshStandardMaterial({ color: 0xdedcd6, roughness: 0.95 }),
    floor: new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.75 }),
    white: new THREE.MeshStandardMaterial({ color: 0xf6f6f4, roughness: 0.42 }),
    carcass: new THREE.MeshStandardMaterial({ color: 0xeeeeec, roughness: 0.6 }),
    inside: new THREE.MeshStandardMaterial({ color: 0xdcdcda, roughness: 0.7 }),
    handle: new THREE.MeshStandardMaterial({ color: 0x2b2d31, roughness: 0.35, metalness: 0.7 }),
    steel: new THREE.MeshStandardMaterial({ color: 0xa9b0b8, roughness: 0.35, metalness: 0.8 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x2a2e33, roughness: 0.6 }),
    oak: new THREE.MeshStandardMaterial({ map: oakTex, roughness: 0.55 }),
    black: new THREE.MeshStandardMaterial({ color: 0x1d1f22, roughness: 0.45, metalness: 0.4 }),
    pane: new THREE.MeshStandardMaterial({ color: 0xcfe3ef, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false }),
    paving: new THREE.MeshStandardMaterial({ color: 0xb9b4aa, roughness: 0.9 }),
    hedge: new THREE.MeshStandardMaterial({ color: 0x5b7a3e, roughness: 1 }),
    appliance: new THREE.MeshStandardMaterial({ color: 0xf8f8f8, roughness: 0.3 }),
    panel: new THREE.MeshStandardMaterial({ color: 0xe4e6ea, roughness: 0.35 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x1f2a36, roughness: 0.08, metalness: 0.2, transparent: true, opacity: 0.85 }),
    ring: new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.25 }),
    basketG: new THREE.MeshStandardMaterial({ color: 0x5f6670, roughness: 0.6, side: THREE.DoubleSide }),
    basketW: new THREE.MeshStandardMaterial({ color: 0xe8e4dc, roughness: 0.7, side: THREE.DoubleSide }),
  };
  const fabric = [0x5d7896, 0xe9e5dc, 0x7a8358, 0xc9b28c, 0x8e939a].map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.95 }));

  // box from its min corner
  const room = new THREE.Group();
  scene.add(room);
  function cube(x0, y0, z0, w, h, d, mat, parent = room, shadows = true) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x0 + w / 2, y0 + h / 2, z0 + d / 2);
    m.castShadow = shadows; m.receiveShadow = true;
    parent.add(m);
    return m;
  }

  // ---- room shell ----
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W + 1.6, ROOM_D + VZW), M.floor);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(W / 2 + 0.8, 0, (ROOM_D - VZW) / 2);
  floor.receiveShadow = true;
  room.add(floor);
  // side walls with their openings (z ranges from the wall face, y ranges from the floor)
  function sideWall(x0, th, openings) {
    const cuts = [-VZW, ROOM_D, ...openings.flatMap(o => [o.z0, o.z1])].sort((a, b) => a - b);
    for (let i = 0; i < cuts.length - 1; i++) {
      const a = cuts[i], b = cuts[i + 1];
      if (b - a < 1e-6) continue;
      const o = openings.find(o => a >= o.z0 - 1e-6 && b <= o.z1 + 1e-6);
      if (!o) { cube(x0, 0, a, th, H, b - a, M.side, room, false); continue; }
      if (o.y0 > 0) cube(x0, 0, a, th, o.y0, b - a, M.side, room, false);
      cube(x0, o.y1, a, th, H - o.y1, b - a, M.side, room, false);
    }
  }
  // a framed glass opening in a side wall; inner = room-side x of the wall, s = +1 if the room is at +x
  function glazing(inner, s, o, frameMat, opts = {}) {
    const fw = opts.fw || 0.06, fd = 0.08, xf = s > 0 ? inner - fd : inner;
    cube(xf, o.y0, o.z0, fd, o.y1 - o.y0, fw, frameMat);
    cube(xf, o.y0, o.z1 - fw, fd, o.y1 - o.y0, fw, frameMat);
    cube(xf, o.y1 - fw, o.z0, fd, fw, o.z1 - o.z0, frameMat);
    if (o.y0 > 0 || opts.sill) cube(xf, o.y0, o.z0, fd, fw, o.z1 - o.z0, frameMat);
    const gy0 = (opts.panel || o.y0) + (o.y0 > 0 || opts.panel ? fw : 0);
    if (opts.panel) cube(xf + 0.02, o.y0, o.z0 + fw, 0.04, opts.panel - o.y0 + fw, o.z1 - o.z0 - 2 * fw, frameMat);
    const g = new THREE.Mesh(new THREE.PlaneGeometry(o.z1 - o.z0 - 2 * fw, o.y1 - fw - gy0), M.pane);
    g.rotation.y = Math.PI / 2;
    g.position.set(xf + fd / 2, (gy0 + o.y1 - fw) / 2, (o.z0 + o.z1) / 2);
    room.add(g);
  }
  // exterior wall (left): a tall side light, then the garden door
  const SIDE = { z0: 0.98, z1: 1.52, y0: 0.08, y1: 2.12 }, GDOOR = { z0: 1.52, z1: 2.42, y0: 0, y1: 2.12 };
  sideWall(-0.14, 0.14, [SIDE, GDOOR]);
  glazing(0, 1, SIDE, M.white);
  glazing(0, 1, GDOOR, M.white, { panel: 0.72 });
  cube(0.002, 1.0, SIDE.z0 + 0.06, 0.03, 0.05, SIDE.z1 - SIDE.z0 - 0.12, M.steel);                 // hook rail
  for (let i = 0; i < 4; i++) cube(0.03, 1.0, SIDE.z0 + 0.12 + i * 0.1, 0.05, 0.012, 0.012, M.steel);
  cube(0.0, 1.02, GDOOR.z1 - 0.14, 0.06, 0.02, 0.12, M.steel);                                   // door handle
  cube(0.0, 0.98, GDOOR.z1 - 0.1, 0.012, 0.11, 0.035, M.steel);
  // garden outside
  const pav = new THREE.Mesh(new THREE.PlaneGeometry(2.2, ROOM_D + 1.2), M.paving);
  pav.rotation.x = -Math.PI / 2; pav.position.set(-1.25, -0.005, ROOM_D / 2); room.add(pav);
  cube(-2.3, 0, -0.4, 0.5, 1.8, ROOM_D + 0.8, M.hedge, room, false);
  // voorzetwand (painted OSB face at z = 0), with the open washer bay cut out
  cube(0, 0, -VZW, BAY.x, H, VZW, M.wall);
  cube(BAY.x, BAY.h, -VZW, W - BAY.x, H - BAY.h, VZW, M.wall);
  cube(BAY.x, 0, -VZW - 0.02, W - BAY.x, BAY.h, 0.02, M.oldWall);           // old back wall inside the bay
  // tap + socket in the bay
  const tap = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.08, 16), M.steel);
  tap.rotation.x = Math.PI / 2; tap.position.set(2.3, 1.0, -VZW + 0.04); room.add(tap);
  cube(2.42, 0.95, -VZW, 0.08, 0.08, 0.02, M.white);
  // kitchen wall (right): window above the washer, then the steel-framed kitchen door
  const KWIN = { z0: 0.1, z1: 1.18, y0: 1.0, y1: 2.2 }, KDOOR = { z0: 1.45, z1: 2.35, y0: 0, y1: 2.15 };
  sideWall(W, 0.14, [KWIN, KDOOR]);
  glazing(W, -1, KWIN, M.white, { fw: 0.07 });
  glazing(W + 0.01, -1, { z0: KWIN.z0 + 0.07, z1: KWIN.z1 - 0.07, y0: KWIN.y0 + 0.07, y1: KWIN.y1 - 0.07 }, M.black, { fw: 0.025 });
  cube(W - 0.03, KWIN.y0 - 0.02, KWIN.z0 - 0.03, 0.17, 0.025, KWIN.z1 - KWIN.z0 + 0.06, M.white);  // sill
  glazing(W, -1, KDOOR, M.black, { fw: 0.04 });
  cube(W - 0.1, 1.0, KDOOR.z0 + 0.06, 0.03, 0.2, 0.02, M.black);                                  // handle
  // a hint of the kitchen beyond
  cube(W + 1.4, 0, -VZW, 0.05, H, ROOM_D + VZW, M.side, room, false);
  // ceiling trim
  cube(0, H - 0.04, 0, W, 0.04, 0.02, M.white, room, false);

  // ---- fridge cupboard ----
  const cup = new THREE.Group();
  room.add(cup);
  cube(0, 0, 0, FILL, H, DEPTH + T, M.white, cup);                            // scribe strip
  [xL, xM, xR].forEach(x => cube(x, PLINTH, 0, T, yTop - PLINTH, DEPTH, M.carcass, cup));
  cube(xL, PLINTH, 0, CUP_R - xL, T, DEPTH, M.carcass, cup);                  // bottom
  cube(xL + T, yShelf - T, 0, STORE_IN, T, DEPTH, M.carcass, cup);           // fixed shelves
  cube(xM + T, yShelf - T, 0.05, NICHE_W, T, DEPTH - 0.05, M.carcass, cup);  // stops 5 cm short: air path
  cube(xL, yTop - T, 0, CUP_R - xL, T, DEPTH, M.carcass, cup);               // top
  cube(xL + T, PLINTH, 0, STORE_IN, yTop - PLINTH, 0.006, M.inside, cup);    // back, storage side only
  cube(xL + T, (yShelf + yTop) / 2, 0.02, CUP_R - xL - 2 * T, T, DEPTH - 0.04, M.carcass, cup); // top-cupboard shelf
  cube(xL + T, 1.2, 0.02, STORE_IN, T, DEPTH - 0.04, M.carcass, cup);        // shelf in the storage column
  // plinth (set back 5 cm) with a grille under the fridge
  cube(xL, 0, DEPTH - 0.05, CUP_R - xL, PLINTH, T, M.white, cup);
  for (let i = 0; i < 14; i++) cube(xM + 0.08 + i * 0.03, 0.03, DEPTH - 0.032, 0.012, 0.04, 0.002, M.dark, cup, false);
  // vent strip at the ceiling
  cube(xL, yTop, DEPTH, CUP_R - xL, SLOT, T, M.white, cup);
  for (let i = 0; i < 14; i++) cube(xM + 0.08 + i * 0.03, yTop + 0.015, DEPTH + T, 0.012, 0.03, 0.002, M.dark, cup, false);

  // contents
  const fridge = new THREE.Group(); cup.add(fridge);
  cube(xM + T + 0.01, PLINTH + T, 0.03, 0.54, 1.45, 0.55, M.appliance, fridge);
  cube(xM + T + 0.01, PLINTH + T + 0.52, 0.581, 0.54, 0.006, 0.002, M.dark, fridge, false);
  // storage: vacuum, broom, mop, bottles
  cube(xL + 0.08, PLINTH + T, 0.2, 0.3, 0.32, 0.26, new THREE.MeshStandardMaterial({ color: 0x9c2b2b, roughness: 0.45 }), cup);
  const stick = (x, z, len, tilt, mat) => {
    const s = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, len, 12), mat);
    s.position.set(x, PLINTH + T + len / 2, z); s.rotation.z = tilt; s.castShadow = true; cup.add(s); return s;
  };
  stick(xM - 0.12, 0.15, 1.05, 0.08, M.steel);
  cube(xM - 0.2, PLINTH + T, 0.08, 0.16, 0.06, 0.12, M.dark, cup);
  stick(xM - 0.28, 0.42, 1.0, -0.06, new THREE.MeshStandardMaterial({ color: 0xc23b3b, roughness: 0.5 }));
  [[0x3c7dbf, 0.18], [0xf2f2f2, 0.24], [0x6fae5a, 0.16], [0xe7c33b, 0.2]].forEach(([c, h], i) =>
    cube(xL + 0.06 + i * 0.13, 1.2 + T, 0.15, 0.09, h, 0.09, new THREE.MeshStandardMaterial({ color: c, roughness: 0.4 }), cup));
  // top cupboards: food boxes
  [[0xd9a35b, 0.22], [0xb5543f, 0.18], [0xe8e1d0, 0.25], [0x5c7a5a, 0.2], [0xd9a35b, 0.22]].forEach(([c, h], i) =>
    cube(xL + 0.08 + i * 0.24, yShelf + 0.01, 0.12, 0.17, h, 0.24, new THREE.MeshStandardMaterial({ color: c, roughness: 0.8 }), cup));

  // doors on hinges (outer edges), handles near the middle
  const doors = [];
  function door(x0, x1, y0, y1, hingeLeft, handleY) {
    const piv = new THREE.Group();
    const w = x1 - x0;
    piv.position.set(hingeLeft ? x0 : x1, 0, DEPTH);
    const local = hingeLeft ? 0 : -w;
    cube(local, y0, 0, w, y1 - y0, T, M.white, piv);
    const hx = hingeLeft ? w - 0.045 : -w + 0.045;
    cube(hx - 0.006, handleY[0], T + 0.018, 0.012, handleY[1] - handleY[0], 0.012, M.handle, piv);
    [handleY[0] + 0.02, handleY[1] - 0.02].forEach(y => cube(hx - 0.005, y - 0.005, T, 0.01, 0.01, 0.018, M.handle, piv));
    cup.add(piv);
    doors.push({ piv, dir: hingeLeft ? -1 : 1, max: hingeLeft ? 90 : 105 });  // left doors stop at 90°: the exterior wall
  }
  const g = 0.002, mid = xM + T / 2;
  door(xL + g, mid - g, PLINTH + g, yShelf - g, true, [0.8, 1.2]);
  door(mid + g, CUP_R - g, PLINTH + g, yShelf - g, false, [0.8, 1.2]);
  door(xL + g, mid - g, yShelf + g, yTop - g, true, [yShelf + 0.06, yShelf + 0.26]);
  door(mid + g, CUP_R - g, yShelf + g, yTop - g, false, [yShelf + 0.06, yShelf + 0.26]);

  // ---- dryer + washer ----
  function machine(x0, label) {
    const grp = new THREE.Group(); room.add(grp);
    cube(x0, 0.01, 0.03, APP.w, APP.h - 0.01, APP.d - 0.03, M.appliance, grp);
    cube(x0 + 0.01, APP.h - 0.13, APP.d, APP.w - 0.02, 0.11, 0.004, M.panel, grp, false);
    const dial = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.02, 32), M.steel);
    dial.rotation.x = Math.PI / 2; dial.position.set(x0 + APP.w * 0.62, APP.h - 0.075, APP.d + 0.01); grp.add(dial);
    cube(x0 + APP.w * 0.7, APP.h - 0.095, APP.d + 0.004, 0.14, 0.04, 0.002, M.dark, grp, false);
    const cy = 0.42;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.035, 20, 64), M.ring);
    ring.position.set(x0 + APP.w / 2, cy, APP.d + 0.02); ring.castShadow = true; grp.add(ring);
    const gl = new THREE.Mesh(new THREE.CircleGeometry(0.17, 48), M.glass);
    gl.position.set(x0 + APP.w / 2, cy, APP.d + 0.012); grp.add(gl);
    if (label === "dryer") cube(x0 + 0.05, 0.03, APP.d, APP.w - 0.1, 0.08, 0.003, M.panel, grp, false);
  }
  machine(DRYER_X, "dryer");
  machine(WASH_X, "washer");

  // ---- worktop + supports ----
  cube(CUP_R, WT.y, 0, W - CUP_R, WT.t, WT.d, M.oak);
  cube(W - T, 0, 0, T, WT.y, WT.d, M.white);                                  // end panel, kitchen side

  // baskets on the worktop
  [[1.5, M.basketG], [1.83, M.basketW]].forEach(([x, mat]) => {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.13, 0.27, 40, 1, true), mat);
    b.position.set(x, WT.y + WT.t + 0.135, 0.33); b.castShadow = true; room.add(b);
    const bot = new THREE.Mesh(new THREE.CircleGeometry(0.13, 40), mat);
    bot.rotation.x = -Math.PI / 2; bot.position.set(x, WT.y + WT.t + 0.002, 0.33); room.add(bot);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.008, 8, 48), mat);
    rim.rotation.x = Math.PI / 2; rim.position.set(x, WT.y + WT.t + 0.27, 0.33); room.add(rim);
  });

  // ---- wall strips, shelves, hanging rail ----
  RAILS.forEach(x => cube(x - 0.013, 1.25, 0, 0.026, 1.1, 0.014, M.steel));
  function shelf(x0, x1, y) {
    cube(x0, y, 0.015, x1 - x0, 0.022, 0.3, M.white);
    RAILS.filter(x => x > x0 && x < x1).forEach(x => cube(x - 0.006, y - 0.16, 0.014, 0.012, 0.16, 0.24, M.steel));
  }
  shelf(1.32, 2.58, 2.15);
  shelf(1.32, 2.01, 1.5);
  // things on the shelves
  [[0x3c7dbf, 0.24, 1.36], [0xf2f2f2, 0.3, 1.47], [0xe7c33b, 0.22, 1.58], [0x7aa7d6, 0.26, 1.7]].forEach(([c, h, x]) =>
    cube(x, 1.522, 0.08, 0.09, h, 0.12, new THREE.MeshStandardMaterial({ color: c, roughness: 0.4 })));
  [[1.4, 0xe9e5dc], [1.62, 0xc9b28c], [2.1, 0xe9e5dc], [2.32, 0x8e939a]].forEach(([x, c]) =>
    [0, 1, 2].forEach(k => cube(x, 2.172 + k * 0.045, 0.06, 0.18, 0.042, 0.22, new THREE.MeshStandardMaterial({ color: c, roughness: 0.95 }))));
  // hanging rail with clothes
  [RAILS[1], RAILS[2]].forEach(x => cube(x - 0.006, 1.83, 0.014, 0.012, 0.04, 0.26, M.steel));
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, RAILS[2] - RAILS[1], 16), M.steel);
  rod.rotation.z = Math.PI / 2; rod.position.set((RAILS[1] + RAILS[2]) / 2, 1.85, 0.27); rod.castShadow = true; room.add(rod);
  for (let i = 0; i < 5; i++) {
    const x = RAILS[1] + 0.09 + i * 0.095;
    const hook = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.003, 6, 16, Math.PI), M.steel);
    hook.position.set(x, 1.85, 0.27); hook.rotation.y = Math.PI / 2; room.add(hook);
    const shirt = cube(x - 0.022, 1.22, 0.07, 0.044, 0.6, 0.4, fabric[i]);
    shirt.rotation.x = 0.0;
  }

  // ---- sizing + render loop ----
  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w / h < 1 ? 50 : 44;
    camera.updateProjectionMatrix();
    dirty = true;
  }
  let dirty = true, visible = true, anim = null, open = false;
  new ResizeObserver(resize).observe(stage);
  controls.addEventListener("change", () => { dirty = true; });
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; dirty = true; }).observe(stage);

  function setDoors(t) { doors.forEach(d => { d.piv.rotation.y = d.dir * t * THREE.MathUtils.degToRad(d.max); }); dirty = true; }
  btnDoors.addEventListener("click", () => {
    open = !open;
    btnDoors.textContent = open ? "Close doors" : "Open doors";
    btnDoors.setAttribute("aria-pressed", open);
    const from = anim ? anim.cur : (open ? 0 : 1), to = open ? 1 : 0, t0 = performance.now();
    anim = { from, to, t0, cur: from };
  });
  btnReset.addEventListener("click", () => {
    camera.position.copy(HOME.pos); controls.target.copy(HOME.target); controls.update(); dirty = true;
  });

  function loop(now) {
    requestAnimationFrame(loop);
    if (!visible) return;
    if (anim) {
      const k = Math.min(1, (now - anim.t0) / 700), e = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
      anim.cur = anim.from + (anim.to - anim.from) * e;
      setDoors(anim.cur);
      if (k >= 1) anim = null;
    }
    controls.update();
    if (dirty) { renderer.render(scene, camera); dirty = false; }
  }
  resize();
  requestAnimationFrame(loop);
  box.classList.add("m-ready");
}

// Only start the 3D scene once it scrolls near the screen.
let started = false;
function start() { if (!started) { started = true; init(); } }
function near() { const r = box.getBoundingClientRect(); return r.top < innerHeight + 300 && r.bottom > -300; }
if (near()) start();
else {
  const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); start(); } }, { rootMargin: "300px" });
  io.observe(box);
  addEventListener("scroll", function onScroll() { if (near()) { removeEventListener("scroll", onScroll); start(); } }, { passive: true });
}
