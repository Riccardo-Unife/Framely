import * as THREE from "three"; 
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// COLORI ------------------------------------------------------------------------------------------
const COLORS = {
	// Geometrie
	// https://coolors.co/F685C5-A25480-D994E6-9B65A4-745087-564473
	Camds_f:	0xF685C5,
	Camds_c:	0xA25480,
	Cvincoli:	0xD994E6,
	Cpunto:		0x9B65A4,
	Clinea:		{color: 0x745087, opacity: 0.7},
	Csolaio:	{color: 0x564473, opacity: 0.5},

	// Selezioni
	// https://coolors.co/9AA9DA-8296C1-6A82A7-5B749A
	CSamds:		0x9AA9DA,
	CSpunto:	0x8296C1,
	CSlinea:	0x6A82A7,
	CSsolaio:	0x5B749A,

	// Modalità linea/piano
	// https://coolors.co/ccb2d2-7ca1c3
	CmodL:		0xCCB2D2,
	CmodP:		0XCCB2D2,

	// Carichi
	// https://coolors.co/8A2E2E-A83838-312E8A-3C38A8-4B47C2-DA6C28-EB7831
	CloadF_T:	0x8A2E2E,
	CloadF_C:	0xA83838,
	CloadM_T:	0x312E8A,
	CloadM_C:	0x3C38A8,
	CloadM_c:	0x4B47C2,
	CloadP_T:	0xDA6C28,
	CloadP_C:	0xEB7831,

	// Ambiente
	// https://coolors.co/614266-44364D-272933-A83838-71C140-3C38A8
	Cgrid_1:	0x614266,
	Cgrid_2:	0x44364D,
	Cbg:		0x272933,
	
	Caxis_x:	0xA83838,
	Caxis_y:	0x71C140,
	Caxis_z:	0x3C38A8,
};

// AMBIENTE 3D -------------------------------------------------------------------------------------
// Renderer
const w = window.innerWidth;
const h = window.innerHeight;
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(w, h);
document.body.appendChild(renderer.domElement);

// Camera
const fov = 75;
const aspect = w / h;
const near = 0.001;
const far = 1000;
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.set(-5, 7, -5);

// Scena
const scene = new THREE.Scene();
scene.background = new THREE.Color(COLORS.Cbg);

// Movimento camera
const controls = new OrbitControls(camera, renderer.domElement);

controls.mouseButtons.LEFT = null;						// Disabilita tasto sinistro
controls.mouseButtons.RIGHT = THREE.MOUSE.ROTATE;		// Imposta tasto destro per ruotare
controls.mouseButtons.MIDDLE = THREE.MOUSE.PAN;			// Imposta tasto centrale per pan
controls.enableZoom = true;								// Imposta rotellina zoom (default)

controls.enableDamping = true;							// smorzamento movimento
controls.dampingFactor = 0.25;
controls.target.set(5, 0, 5);

// // SETUP CUBO
// const cubeScene = new THREE.Scene();
// const cubeCamera = new THREE.PerspectiveCamera(50, 1, 0.1, 10);

// // Creazione cubo nella scena
// const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
// const cubeMaterials = [
//     new THREE.MeshBasicMaterial({ color: 0X6f8462, transparent: true, opacity: 0.5 }), // +Y
//     new THREE.MeshBasicMaterial({ color: 0X6f8462, transparent: true, opacity: 0.5 }), // -y
//     new THREE.MeshBasicMaterial({ color: 0X575674, transparent: true, opacity: 0.5 }), // +z
//     new THREE.MeshBasicMaterial({ color: 0X575674, transparent: true, opacity: 0.5 }), // -z
//     new THREE.MeshBasicMaterial({ color: 0x745656, transparent: true, opacity: 0.5 }), // +x
//     new THREE.MeshBasicMaterial({ color: 0X745656, transparent: true, opacity: 0.5 })  // -x
// ];
// const navCube = new THREE.Mesh(cubeGeometry, cubeMaterials);
// cubeScene.add(navCube);

// SETUP GIZMO
const gizmoScene = new THREE.Scene();
const gizmoCamera = new THREE.PerspectiveCamera(50, 1, 0.1, 10);

// Creazione assi nella scena
function addAsseGizmo(colore, orientamento, posizione = 0.5) {
    const geometry = new THREE.CylinderGeometry(0.05, 0.05, 1, 6);
    const material = new THREE.MeshBasicMaterial({ color: colore });
    const cylinder = new THREE.Mesh(geometry, material);
	switch (orientamento) {
		case "x":
			cylinder.rotation.x = Math.PI / 2;
			cylinder.position.z = posizione;
			break;
		case "y":
			cylinder.rotation.z = Math.PI / 2;
			cylinder.position.x = posizione;
			break;
		case "z":
			cylinder.rotation.y = Math.PI / 2;
			cylinder.position.y = posizione;
			break;
	}
    gizmoScene.add(cylinder);
}
addAsseGizmo(COLORS.Caxis_x, "x");
addAsseGizmo(COLORS.Caxis_y, "y");
addAsseGizmo(COLORS.Caxis_z, "z");

// Dimensioni del widget
const gizmoSize = 100;

// Animazione
function animate() {
    requestAnimationFrame(animate);
    controls.update();

    // Scena principale a tutto schermo
    renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.render(scene, camera);

    // Gizmo in basso a sinistra
    renderer.autoClear = false;		// Disabilita clear per non cancellare scena principale
    renderer.clearDepth();			// Pulisce il buffer di profondità

    renderer.setViewport(10, 10, gizmoSize, gizmoSize);		// Area widget (x, y, L, H)
    
    // Sincronizzazione
    gizmoCamera.position.copy(camera.position);
    gizmoCamera.position.sub(controls.target);				// Orbita su (0,0,0)
    gizmoCamera.position.setLength(2.5);					// Distanza camera
    gizmoCamera.lookAt(0, 0, 0);
    renderer.render(gizmoScene, gizmoCamera);

	// // Cubo in alto a destra
	// renderer.setViewport(
	// 	window.innerWidth - gizmoSize - 10,  	// X
	// 	window.innerHeight - gizmoSize - 80, 	// Y
	// 	gizmoSize,                               // Width
	// 	gizmoSize                                // Height
	// );		// Area widget (x, y, L, H)
    
    // // Sincronizzazione
    // cubeCamera.position.copy(camera.position);
    // cubeCamera.position.sub(controls.target);				// Orbita su (0,0,0)
    // cubeCamera.position.setLength(2.5);					// Distanza camera
    // cubeCamera.lookAt(0, 0, 0);
    // renderer.render(cubeScene, cubeCamera);
    
    // renderer.autoClear = true;
}
animate();

// Griglia
const planeSize = 100;
const gridHelper = new THREE.GridHelper( planeSize, planeSize, COLORS.Cgrid_1, COLORS.Cgrid_2 );
scene.add(gridHelper);

// Assi 3D
function creaAsse(colore, orientamento, posizione = 0.5) {
	const geometry = new THREE.CylinderGeometry(0.025, 0.025, 1, 6);
	const material = new THREE.MeshBasicMaterial({ color: colore });
	const cylinder = new THREE.Mesh(geometry, material);
	switch (orientamento) {
		case "x":
			cylinder.rotation.x = Math.PI / 2;
			cylinder.position.z = posizione;
			break;
		case "y":
			cylinder.rotation.z = Math.PI / 2;
			cylinder.position.x = posizione;
			break;
		case "z":
			cylinder.rotation.y = Math.PI / 2;
			cylinder.position.y = posizione;
			break;
	}
	scene.add(cylinder);
	return cylinder;
}
creaAsse(COLORS.Caxis_x, "x");
creaAsse(COLORS.Caxis_y, "y");
creaAsse(COLORS.Caxis_z, "z");

// Gestione resize finestra
window.addEventListener("resize", () => {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
});

// Reset camera button
const cameraInitialPosition = camera.position.clone();
const cameraInitialTarget = controls.target.clone();
document.getElementById("resetCamera").addEventListener("click", () => {
	camera.position.copy(cameraInitialPosition);
	controls.target.copy(cameraInitialTarget);
	controls.update();
});

// Full screen button
const fullscreenBtn = document.getElementById("fullscreenBtn");

fullscreenBtn.addEventListener("click", () => {
	if (!document.fullscreenElement) {
		document.documentElement.requestFullscreen().catch(err => {
			alert(`Errore fullscreen: ${err.message}`);
		});
	} else {
		document.exitFullscreen();
	}
});

// Selezione
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Filtro Clic o Drag
renderer.domElement.addEventListener("mousedown", (event) => {
    if (event.button !== 0) return; // sinistro solo

    isDragging = true;
    dragStart = { x: event.clientX, y: event.clientY };

    // Mostra il rettangolo di selezione
    selectionBoxDiv.style.left = dragStart.x + "px";
    selectionBoxDiv.style.top = dragStart.y + "px";
    selectionBoxDiv.style.width = "0px";
    selectionBoxDiv.style.height = "0px";
    selectionBoxDiv.style.display = "block";
});

renderer.domElement.addEventListener("mousemove", (event) => {
    if (!isDragging) return;

    dragEnd = { x: event.clientX, y: event.clientY };

    const x = Math.min(dragStart.x, dragEnd.x);
    const y = Math.min(dragStart.y, dragEnd.y);
    const w = Math.abs(dragStart.x - dragEnd.x);
    const h = Math.abs(dragStart.y - dragEnd.y);

    selectionBoxDiv.style.left = x + "px";
    selectionBoxDiv.style.top = y + "px";
    selectionBoxDiv.style.width = w + "px";
    selectionBoxDiv.style.height = h + "px";
});

renderer.domElement.addEventListener("mouseup", (event) => {
    if (!isDragging) return;

    isDragging = false;
    selectionBoxDiv.style.display = "none";

    dragEnd = { x: event.clientX, y: event.clientY };

    const dx = dragEnd.x - dragStart.x;
    const dy = dragEnd.y - dragStart.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 5) {
        // Selezione singolo clic
        selezioneSingolo(event);
	} else {
		// Se siamo in lineMode o floorMode, non fare la selezione a finestra
		if (!lineMode && !floorMode) {
			selezioneFinestra(dragStart, dragEnd, event.shiftKey);
		}
	}
});

// INIZIALIZZAZIONI --------------------------------------------------------------------------------
// Inizializzazione storico
let history = [];
let redoStack = [];

// Inizializzazione modalità linea
let lineMode = false;
let firstPoint = null;
let linee = [];

// Inizializzazione def sezione
let secModalContainer = null;
let matModalContainer = null;

// Inizializzazione punti
let puntiAggiunti = [];

// Inizializzazione selezione
let mouseDownPos = null;
let isDragging = false;
let dragStart = null;
let dragEnd = null;

// Div HTML per visualizzare il rettangolo di selezione
const selectionBoxDiv = document.createElement("div");
selectionBoxDiv.style.position = "absolute";
selectionBoxDiv.style.border = "2px dashed #34A0D580";
selectionBoxDiv.style.backgroundColor = "#34a0d526";
selectionBoxDiv.style.pointerEvents = "none";
selectionBoxDiv.style.display = "none";
document.body.appendChild(selectionBoxDiv);

// Inizializzazione modalità piano
let floorMode = false;
let floorPoints = [];
let piani = [];

// Inizializzazione AMDs
let amds = [];

// COOKIE ------------------------------------------------------------------------------------------
const popup = document.getElementById("cookie-popup");
const overlay = document.getElementById("cookie-overlay");

document.getElementById("cookie-info-btn").onclick = () => {
    popup.style.display = "block";
    overlay.style.display = "block";
};

overlay.onclick = () => {
    popup.style.display = "none";
    overlay.style.display = "none";
};

// FUNZIONI ----------------------------------------------------------------------------------------
// MODALITA LINEA
// Funzione reset modalità linea
function resetFirstPoint() {
	if (firstPoint) {
		firstPoint.material.color.copy(firstPoint.userData.defaultColor);
		firstPoint = null;
	}
}

// Funzione reset modalità piano
function resetFloorSelection() {
	floorPoints.forEach(p => {
		if (p.material && p.userData.defaultColor) {
			p.material.color.copy(p.userData.defaultColor);
		}
	});
	floorPoints = [];
}

// Switch modalità linea/solaio
tabs.forEach(t => {
	t.addEventListener("click", () => {

		// cambia tab grafico
		tabs.forEach(x => x.classList.remove("active"));
		panels.forEach(x => x.classList.remove("active"));

		t.classList.add("active");
		document.getElementById(t.dataset.target).classList.add("active");

		// --- ATTIVAZIONE MODALITÀ ---
		if (t.dataset.target === "tab-linee") {

			// MODALITÀ LINEA ON
			lineMode = true;
			floorMode = false;
			deselezioneTotale()
			floorPoints = [];
		}

		if (t.dataset.target === "tab-solai") {

			// MODALITÀ PIANO ON
			floorMode = true;
			lineMode = false;
			deselezioneTotale()
			firstPoint = null;
			floorPoints = [];
		}

		// se entri in Punti o AMD → nessuna modalità attiva
		if (
			t.dataset.target === "tab-punti" ||
			t.dataset.target === "tab-amd" ||
			t.dataset.target === "tab-carichi"
		) {
			lineMode = false;
			floorMode = false;
			resetFirstPoint();
			resetFloorSelection();
		}

	});
});

// Aggiornamento liste
function aggiornaListaPunti() {
	const ul = document.getElementById("points-list");
	ul.innerHTML = "";
	puntiAggiunti.forEach((punto, index) => {
		const li = document.createElement("li");
		const pos = punto.position;
		const vincolo = punto.userData.v ? " v" : "";
		li.textContent = `P_${index+1}: (${pos.z.toFixed(2)} ${pos.x.toFixed(2)} ${pos.y.toFixed(2)}) ${vincolo}`;
		ul.appendChild(li);
	});
}
function aggiornaListaLinee() {
	const ul = document.getElementById("lines-list");
	ul.innerHTML = "";
	linee.forEach((linea, index) => {
		const li = document.createElement("li");
		const p1Index = puntiAggiunti.indexOf(linea.userData.p1) + 1;
		const p2Index = puntiAggiunti.indexOf(linea.userData.p2) + 1;
		const mat = linea.userData.materiale || "N/D";
		const sez = linea.userData.sezione || "N/D";
		const len = linea.userData.lunghezza.toFixed(2);
		const assl = linea.userData.l
		const assn = linea.userData.n
		const assm = linea.userData.m

		const fmtL = v => `(${v.l1.toFixed(2)}, ${v.l2.toFixed(2)}, ${v.l3.toFixed(2)})`;
		const fmtM = v => `(${v.m1.toFixed(2)}, ${v.m2.toFixed(2)}, ${v.m3.toFixed(2)})`;
		const fmtN = v => `(${v.n1.toFixed(2)}, ${v.n2.toFixed(2)}, ${v.n3.toFixed(2)})`;

		li.textContent =
			`L_${index+1}: (P_${p1Index} P_${p2Index}) | L:${len} | ` +
			`l:${fmtL(assl)} m:${fmtM(assm)} n:${fmtN(assn)} | ${mat}, ${sez}`;
		ul.appendChild(li);
	});
}
function aggiornaListaPiani() {
	const ul = document.getElementById("floors-list");
	if (!ul) return;
	ul.innerHTML = "";
	piani.forEach((piano, index) => {
		const li = document.createElement("li");

		// Punti che definiscono il piano
		const punti = piano.userData.points || [];
		const quota = punti.length > 0 ? punti[0].position.y.toFixed(2) : "N/D";
		const indici = punti.map(pt => puntiAggiunti.indexOf(pt)+1).filter(i => i >= 0);

		// Punti interni al piano
		const interni = trovaPuntiInterniAlPiano(piano);

		li.textContent = `Solaio_${index+1}: z = ${quota} | punti def: ${punti.length}: [P_${indici.join(", P_")}]`;
		if (interni.length > 0) {
			li.textContent += ` | interni: [P_${interni.join(", P_")}]`;
		}
		ul.appendChild(li);
	});
}
function aggiornaListaAMDs() {
	const ul = document.getElementById("amd-list");
	ul.innerHTML = "";

	amds.forEach((amd, index) => {
		const li = document.createElement("li");
		const pos = amd.position;
		const phiDeg = (amd.rotation.y * 180 / Math.PI).toFixed(2);
		const gain = amd.userData.G !== undefined ? amd.userData.G : 0;

		li.textContent = `AMD_${index+1}: (${pos.z.toFixed(2)} ${pos.x.toFixed(2)} ${pos.y.toFixed(2)}) | φ = ${phiDeg}° | G = ${gain} | Solaio = ${amd.userData.floorIndex+1}`;
		ul.appendChild(li);
	});
}

// PUNTI
// Verifica esistenza punto (per non duplicare)
function sonoUguali(a, b, tolleranza = 0.01) {
	return Math.abs(a - b) < tolleranza;
}

// LINEE
// Controllo linee duplicate
function lineaEsistente(p1, p2) {
	return linee.some(l => {
		const start = l.userData.p1;
		const end = l.userData.p2;
		// confronto considerando entrambi gli ordini
		return (start === p1 && end === p2) || (start === p2 && end === p1);
	});
}

// Calcolo assi locali linee
function calcolaAssiLocali(p1, p2) {

	const xI = p1.z, yI = p1.x, zI = p1.y;
	const xJ = p2.z, yJ = p2.x, zJ = p2.y;

	const dx = xJ - xI;
	const dy = yJ - yI;
	const dz = zJ - zI;

	const Length = Math.sqrt(dx*dx + dy*dy + dz*dz);

	// --- VETTORE l (asse locale 1)
	const l1 = dx / Length;
	const l2 = dy / Length;
	const l3 = dz / Length;

	// --- VETTORE n (asse locale 3)
	const n_normal = Math.sqrt(dy*dy + (xI - xJ)*(xI - xJ));

	let n1, n2, n3;

	if (n_normal === 0) {
		n1 = 0;
		n2 = l3;
		n3 = 0;
	} else {
		n1 = dy / n_normal;
		n2 = (xI - xJ) / n_normal;
		n3 = 0;
	}

	// --- VETTORE m = n × l
	const m1 = n2*l3 - n3*l2;
	const m2 = n3*l1 - n1*l3;
	const m3 = n1*l2 - n2*l1;

	// --- Correzione orientazione (m3 deve essere ≥ 0)
	if (m3 < 0) {
		return {
			l: { l1, l2, l3 },
			n: { n1: -n1, n2: -n2, n3: -n3 },
			m: { m1: -m1, m2: -m2, m3: -m3 }
		};
	}

	return {
		l: { l1, l2, l3 },
		n: { n1, n2, n3 },
		m: { m1, m2, m3 }
	};
}

// Creazione linee
function creaLineaSpessa(p1, p2) {
	const start = p1.clone();
	const end = p2.clone();
	const dir = new THREE.Vector3().subVectors(end, start);
	const length = dir.length();

	// Geometria cilindro
	const geometry = new THREE.CylinderGeometry(0.05, 0.05, length, 5);
	const material = new THREE.MeshBasicMaterial({
		color: COLORS.Clinea.color,
		transparent: true,
		opacity: COLORS.Clinea.opacity
	});
	const cylinder = new THREE.Mesh(geometry, material);
	cylinder.userData.defaultColor = material.color.clone();
	cylinder.userData.carico = { Fx: 0, Fy: 0, Fz: 0, Mx: 0, My: 0, Mz: 0, Mass: 0 };

	// Posizione e rotazione
	cylinder.position.copy(start).add(end).divideScalar(2);
	cylinder.quaternion.setFromUnitVectors(
		new THREE.Vector3(0, 1, 0),
		dir.clone().normalize()
	);
	return cylinder;
}

// PIANI
// Creazione piano
function creaPianoDaPunti(punti) {
	if (punti.length < 3) {
		console.log("Servono almeno 3 punti per creare un solaio!");
		return null;
	}

	const shape = new THREE.Shape();
	shape.moveTo(punti[0].position.x, punti[0].position.z);
	for (let i = 1; i < punti.length; i++) {
		shape.lineTo(punti[i].position.x, punti[i].position.z);
	}
	shape.lineTo(punti[0].position.x, punti[0].position.z);

	const geometry = new THREE.ShapeGeometry(shape);
	const material = new THREE.MeshBasicMaterial({
		color: COLORS.Csolaio.color,
		side: THREE.DoubleSide,
		transparent: true,
		opacity: COLORS.Csolaio.opacity
	});
	const mesh = new THREE.Mesh(geometry, material);
	mesh.userData.defaultColor = material.color.clone();

	mesh.rotation.x = Math.PI / 2;
	mesh.position.y = punti[0].position.y;

	// Salva i punti all'interno del piano
	mesh.userData.points = [...punti];

	return mesh;
}

// Verifica appartenenza punto P a segmento A-B
function pointOnLineSegment(p, a, b, tolleranza = 0.0) {

	const cross = (b.x - a.x) * (p.z - a.z) - (b.z - a.z) * (p.x - a.x);
	if (Math.abs(cross) > tolleranza) return false;

	const dot = (p.x - a.x) * (b.x - a.x) + (p.z - a.z) * (b.z - a.z);
	if (dot < -tolleranza) return false;

	const len2 = (b.x - a.x)**2 + (b.z - a.z)**2;
	if (dot - len2 > tolleranza) return false;

	return true;
}

// Verifica appartenenza punto P a segmento poligono
function pointInPolygon(point, polygonPoints, tolleranza = 0.00) {
	const x = point.position.x;
	const z = point.position.z;
	let inside = false;

	for (let i = 0, j = polygonPoints.length - 1; i < polygonPoints.length; j = i++) {
		const xi = polygonPoints[i].position.x, zi = polygonPoints[i].position.z;
		const xj = polygonPoints[j].position.x, zj = polygonPoints[j].position.z;

		if (pointOnLineSegment({x, z}, {x: xi, z: zi}, {x: xj, z: zj}, tolleranza)) {
				return true;
		}

		const intersect = ((zi > z) != (zj > z)) && (x < (xj - xi) * (z - zi) / (zj - zi) + xi);
		if (intersect) inside = !inside;
	}

	return inside;
}

// Appartenenza punti al piano
function trovaPuntiInterniAlPiano(piano) {
	const puntiInterni = puntiAggiunti.filter(p => {
		// esclude i punti che definiscono già il piano
		if (piano.userData.points.includes(p)) return false;

		// controlla se stessa quota
		if (Math.abs(p.position.y - piano.position.y) > 0.00) return false;

		// test 2D sul piano XZ
		return pointInPolygon(p, piano.userData.points);
	});

	// restituisce gli indici dei punti interni (1-based)
	const indiciInterni = puntiInterni.map(p => puntiAggiunti.indexOf(p) + 1);

	console.log("Punti interni al solaio:", indiciInterni);
	return indiciInterni;
}

// Aggiornamento piani
function aggiornaPiano(piano, addHistory = true) {
	const oldPoints = [...piano.userData.points];
	const puntiAttuali = oldPoints.filter(p => puntiAggiunti.includes(p));
	let amdsRimossi = [];

	if (puntiAttuali.length < 3) {
		scene.remove(piano);
		piano.userData.points = [];
		piani = piani.filter(f => f !== piano);

		if (addHistory) {
			amdsRimossi = aggiornaAMDs();
			history.push({
				type: "floor-update-amd",
				floor: piano,
				oldPoints: oldPoints,
				newPoints: [],
				amdsRimossi: amdsRimossi
			});
			redoStack = [];
		}
		return;
	}

	const shape = new THREE.Shape();
	shape.moveTo(puntiAttuali[0].position.x, puntiAttuali[0].position.z);
	for (let i = 1; i < puntiAttuali.length; i++) {
		shape.lineTo(puntiAttuali[i].position.x, puntiAttuali[i].position.z);
	}
	shape.lineTo(puntiAttuali[0].position.x, puntiAttuali[0].position.z);

	piano.geometry.dispose();
	piano.geometry = new THREE.ShapeGeometry(shape);
	piano.userData.points = puntiAttuali;
	piano.position.y = puntiAttuali[0].position.y;

	if (addHistory) {
		amdsRimossi = aggiornaAMDs();
		history.push({
			type: "floor-update-amd",
			floor: piano,
			oldPoints: oldPoints,
			newPoints: [...puntiAttuali],
			amdsRimossi: amdsRimossi
		});
		redoStack = [];
	}
}

// Intersezione poligoni (verifica per ordine punti piano)
function segmentsIntersect(a, b, c, d) {
	function ccw(p1, p2, p3) {
		return (p3.z - p1.z) * (p2.x - p1.x) > (p2.z - p1.z) * (p3.x - p1.x);
	}

	return (
		ccw(a, c, d) !== ccw(b, c, d) &&
		ccw(a, b, c) !== ccw(a, b, d)
	);
}

// Intersezione poligoni (verifica per ordine punti piano)
function poligonoHaIntersezioni(punti) {
	const N = punti.length;

	for (let i = 0; i < N; i++) {
		const a1 = punti[i];
		const a2 = punti[(i + 1) % N];

		for (let j = i + 1; j < N; j++) {
			const b1 = punti[j];
			const b2 = punti[(j + 1) % N];

			// Skip lati adiacenti o il lato opposto nello stesso punto
			if (a1 === b1 || a1 === b2 || a2 === b1 || a2 === b2) continue;

			if (segmentsIntersect(
				{ x: a1.position.x, z: a1.position.z },
				{ x: a2.position.x, z: a2.position.z },
				{ x: b1.position.x, z: b1.position.z },
				{ x: b2.position.x, z: b2.position.z }
			)) {
				return true;
			}
		}
	}

	return false;
}

// AMD
// Creazione AMD
function creaAMD(x, y, z, G, phi, addHistory = true) {

	// Dimensioni parallelepipedo
	const L = 2;       // lunghezza
	const W = 0.5;     // larghezza
	const H = 0.5;     // altezza

	// Coordinate baricentro
	const centro = new THREE.Vector3(y, z, x);

	let appartieneAUnPiano = false;
	let indicePiano = -1;

	// Verifica appartenenza ad un piano
	for (let i = 0; i < piani.length; i++) {
		const piano = piani[i];
		const quota = piano.position.y;

		// controllo quota Z
		if (Math.abs(centro.y - quota) > 0.0) continue;

		// controlla posizione XY
		const puntiPiano = piano.userData.points;
		if (pointInPolygon({position: centro}, puntiPiano)) {
			appartieneAUnPiano = true;
			indicePiano = i;
			break;
		}
	}

	if (!appartieneAUnPiano) {
		alert("⚠ L'AMD non appartiene a nessun solaio!");
		return;
	}
	
	// Geometria box
	const geometry = new THREE.BoxGeometry(W, H, L);
	const material = new THREE.MeshBasicMaterial({color: COLORS.Camds_f});

	const amd = new THREE.Mesh(geometry, material);
	amd.userData.defaultColor = material.color.clone();

	// Spigoli
	const edges = new THREE.EdgesGeometry(geometry);
	const lineMaterial = new THREE.LineBasicMaterial({ color: COLORS.Camds_c });
	const wireframe = new THREE.LineSegments(edges, lineMaterial);
	amd.add(wireframe);

	// Posizionamento del baricentro
	amd.position.copy(centro);

	// Indice solaio
	amd.userData.floorIndex = indicePiano;

	// Rotazione
	amd.rotation.y = phi;
	amd.userData.G = G;
	amds.push(amd);

	// Cronologia
	if (addHistory) {
		history.push({ type: "amd-add", amd });
		redoStack = [];
	}

	scene.add(amd);

	aggiornaAMDs();
	aggiornaListaAMDs();
}

// Controlla se un AMD appartiene ancora a qualche piano
function aggiornaAMDs() {
	const amdsDaRimuovere = [];

	amds.forEach(amd => {
		let nuovoIndice = -1;

		for (let i = 0; i < piani.length; i++) {
			const piano = piani[i];

			if (Math.abs(amd.position.y - piano.position.y) > 0.01) continue;

			if (pointInPolygon({ position: amd.position }, piano.userData.points)) {
				nuovoIndice = i;
				break;
			}
		}

		if (nuovoIndice === -1) {
			amdsDaRimuovere.push(amd);
		} else {
			amd.userData.floorIndex = nuovoIndice;
		}
	});

	// Rimozione AMD non più validi
	amdsDaRimuovere.forEach(amd => {
		scene.remove(amd);
		amds = amds.filter(a => a !== amd);
	});

	if (amdsDaRimuovere.length > 0) {
		console.log("Rimossi AMD:", amdsDaRimuovere.length);
	}

	return amdsDaRimuovere;
}

// VINCOLI
// Vincola
function vincolaSelezionati() {
	const selezionati = puntiAggiunti.filter(p => p.userData.selezionato);
	if (selezionati.length === 0) return;

	selezionati.forEach(p => {
		if (!p.userData.v) {
			p.userData.v = true;

			// Aggiunge marker
			if (!p.userData.constraintMarker) {
				const croce = creaCroceVincolo();
				p.add(croce);
				p.userData.constraintMarker = croce;
			}
		}
	});

	// Cronologia
	history.push({type: "vincola", points: selezionati});
	redoStack = [];

	// Aggiorna liste
	aggiornaListaPunti();
	deselezioneTotale();
}

// Sincola
function svincolaSelezionati() {
	const selezionati = puntiAggiunti.filter(p => p.userData.selezionato);
	if (selezionati.length === 0) return;

	selezionati.forEach(p => {
		if (p.userData.v) {
			p.userData.v = false;

			// Rimozione maker
			if (p.userData.constraintMarker) {
				p.remove(p.userData.constraintMarker);
				p.userData.constraintMarker = null;
			}
		}
	});

	// Cronologia
	history.push({type: "svincola", points: selezionati});
	redoStack = [];

	// Aggiorna liste
	aggiornaListaPunti();
	deselezioneTotale();
}

// grafica vincoli
function creaCroceVincolo(size = 0.4, thickness = 0.03) {
	const material = new THREE.MeshBasicMaterial({ color: COLORS.Cvincoli });
	const geometria = new THREE.CylinderGeometry(thickness, thickness, size, 6);

	// X
	const cx = new THREE.Mesh(geometria, material.clone());
	cx.rotation.z = Math.PI / 2;
	cx.raycast = () => {};

	// Y
	const cy = new THREE.Mesh(geometria, material.clone());
	cy.raycast = () => {};

	// Z
	const cz = new THREE.Mesh(geometria, material.clone());
	cz.rotation.x = Math.PI / 2;
	cz.raycast = () => {};

	// Gruppo croce
	const group = new THREE.Group();
	group.add(cx, cy, cz);
	group.raycast = () => {};

	return group;
}

// grafica carichi nodali
function creaFrecciaForzaNodo(dir, l = 1, dim = 0.03) {
	if (dir.length() === 0) return null;

	const group = new THREE.Group();
	const headLength = l * 0.3;
	const shaftLength = l - headLength;
	// tronco
	const shaftGeo = new THREE.CylinderGeometry(dim, dim, shaftLength, 6);
	const shaftMat = new THREE.MeshBasicMaterial({color: COLORS.CloadF_T}); 
	const shaft = new THREE.Mesh(shaftGeo, shaftMat);
	shaft.position.y = shaftLength / 2;
	group.add(shaft);

	// Cono
	const coneGeo = new THREE.ConeGeometry(dim * 3, headLength, 12);
	const coneMat = new THREE.MeshBasicMaterial({color: COLORS.CloadF_C});
	const cone = new THREE.Mesh(coneGeo, coneMat);
	cone.position.y = shaftLength + (headLength / 2);
	group.add(cone);

	// Orientamento
	const axis = new THREE.Vector3(0, 1, 0);
	group.quaternion.setFromUnitVectors(axis, dir.clone().normalize());
	
	// Disattivazione selezione
	group.children.forEach(child => {
		child.raycast = () => {};
	});

	return group;
}
function creaFrecciaMomentoNodo(dir, l = 1, dim = 0.035) {
	if (dir.length() === 0) return null;

	const group = new THREE.Group();
	const headLength = l * 0.3;
	const shaftLength = l - headLength;
	// tronco
	const shaftGeo = new THREE.CylinderGeometry(dim, dim, shaftLength, 6);
	const shaftMat = new THREE.MeshBasicMaterial({color: COLORS.CloadM_T}); 
	const shaft = new THREE.Mesh(shaftGeo, shaftMat);
	shaft.position.y = shaftLength / 2;
	group.add(shaft);

	// Cono
	const coneGeo = new THREE.ConeGeometry(dim * 3, headLength, 12);
	const coneMat1 = new THREE.MeshBasicMaterial({color: COLORS.CloadM_c});
	const coneMat2 = new THREE.MeshBasicMaterial({color: COLORS.CloadM_C});
	const cone1 = new THREE.Mesh(coneGeo, coneMat1);
	cone1.position.y = shaftLength + (headLength / 2)-0.06;
	const cone2 = new THREE.Mesh(coneGeo, coneMat2);
	cone2.position.y = shaftLength + (headLength / 2)-0.26;
	group.add(cone1, cone2);

	// Toro
	const toroGeo = new THREE.TorusGeometry( headLength, dim, 6, 12, 3 );
	const shpesreGeo = new THREE.SphereGeometry(0.04, 6, 6);
	const toro = new THREE.Mesh(toroGeo, shaftMat);
	toro.position.y = 0;
	toro.rotation.x = Math.PI / 2;
	toro.rotation.z = -1.5
	const cone3 = new THREE.Mesh(coneGeo, coneMat2);
	cone3.position.z = -headLength
	cone3.rotation.z = Math.PI / 2;
	cone3.rotation.y = -0.3
	const sphere = new THREE.Mesh(shpesreGeo, shaftMat);
	sphere.position.z = headLength
	group.add(toro, cone3, sphere);

	// Orientamento
	const axis = new THREE.Vector3(0, 1, 0);
	group.quaternion.setFromUnitVectors(axis, dir.clone().normalize());

	
	// Disattivazione selezione
	group.children.forEach(child => {
		child.raycast = () => {};
	});

	return group;
}
function creaFrecciaMassaNodo(dir, l = 0.7, dim = 0.04) {
	if (dir.length() === 0) return null;

	const group = new THREE.Group();
	const headLength = 0.3;
	const shaftLength = l - headLength;
	// tronco
	const shaftGeo = new THREE.CylinderGeometry(dim, dim, shaftLength, 6);
	const shaftMat = new THREE.MeshBasicMaterial({color: COLORS.CloadP_T}); 
	const shaft = new THREE.Mesh(shaftGeo, shaftMat);
	shaft.position.y = shaftLength / 2;
	group.add(shaft);

	// Cono
	const coneGeo = new THREE.ConeGeometry(dim * 3, headLength, 12);
	const coneMat = new THREE.MeshBasicMaterial({color: COLORS.CloadP_C});
	const cone = new THREE.Mesh(coneGeo, coneMat);
	cone.position.y = shaftLength + (headLength / 2);
	group.add(cone);

	// Orientamento
	const axis = new THREE.Vector3(0, 1, 0);
	group.quaternion.setFromUnitVectors(axis, dir.clone().normalize());
	
	// Disattivazione selezione
	group.children.forEach(child => {
		child.raycast = () => {};
	});

	return group;
}

// grafica carichi distribuiti
function creaFrecciaForzaTrave(dir, l = 0.8, dim = 0.03) {
	if (dir.length() === 0) return null;

	const group = new THREE.Group();
	const headLength = 0.25;
	const shaftLength = l - headLength;
	// tronco
	const shaftGeo = new THREE.CylinderGeometry(dim, dim, shaftLength, 6);
	const shaftMat = new THREE.MeshBasicMaterial({color: COLORS.CloadF_T}); 
	const shaft = new THREE.Mesh(shaftGeo, shaftMat);
	shaft.position.y = shaftLength / 2;
	group.add(shaft);

	// Cono
	const coneGeo = new THREE.ConeGeometry(dim * 3, headLength, 12);
	const coneMat = new THREE.MeshBasicMaterial({color: COLORS.CloadF_C});
	const cone = new THREE.Mesh(coneGeo, coneMat);
	cone.position.y = shaftLength + (headLength / 2);
	group.add(cone);

	// Orientamento
	const axis = new THREE.Vector3(0, 1, 0);
	group.quaternion.setFromUnitVectors(axis, dir.clone().normalize());
	
	// Disattivazione selezione
	group.children.forEach(child => {
		child.raycast = () => {};
	});

	return group;
}
function creaFrecciaMomentoTrave(dir, l = 0.8, dim = 0.035) {
	if (dir.length() === 0) return null;

	const group = new THREE.Group();
	const headLength = 0.25;
	const shaftLength = l - headLength;
	// tronco
	const shaftGeo = new THREE.CylinderGeometry(dim, dim, shaftLength, 6);
	const shaftMat = new THREE.MeshBasicMaterial({color: COLORS.CloadM_T}); 
	const shaft = new THREE.Mesh(shaftGeo, shaftMat);
	shaft.position.y = shaftLength / 2;
	group.add(shaft);

	// Cono
	const coneGeo = new THREE.ConeGeometry(dim * 3, headLength, 12);
	const coneMat1 = new THREE.MeshBasicMaterial({color: COLORS.CloadM_c});
	const coneMat2 = new THREE.MeshBasicMaterial({color: COLORS.CloadM_C});
	const cone1 = new THREE.Mesh(coneGeo, coneMat1);
	cone1.position.y = shaftLength + (headLength / 2)-0.06;
	const cone2 = new THREE.Mesh(coneGeo, coneMat2);
	cone2.position.y = shaftLength + (headLength / 2)-0.26;
	group.add(cone1, cone2);

	// Toro
	const toroGeo = new THREE.TorusGeometry( headLength, dim, 6, 12, 3 );
	const shpesreGeo = new THREE.SphereGeometry(0.04, 6, 6);
	const toro = new THREE.Mesh(toroGeo, shaftMat);
	toro.position.y = 0;
	toro.rotation.x = Math.PI / 2;
	toro.rotation.z = -1.5
	const cone3 = new THREE.Mesh(coneGeo, coneMat2);
	cone3.position.z = -headLength
	cone3.rotation.z = Math.PI / 2;
	cone3.rotation.y = -0.3
	const sphere = new THREE.Mesh(shpesreGeo, shaftMat);
	sphere.position.z = headLength
	group.add(toro, cone3, sphere);

	// Orientamento
	const axis = new THREE.Vector3(0, 1, 0);
	group.quaternion.setFromUnitVectors(axis, dir.clone().normalize());

	
	// Disattivazione selezione
	group.children.forEach(child => {
		child.raycast = () => {};
	});

	return group;
}
function creaFrecciaMassaTrave(dir, l = 0.6, dim = 0.04) {
	if (dir.length() === 0) return null;

	const group = new THREE.Group();
	const headLength = 0.25;
	const shaftLength = l - headLength;
	// tronco
	const shaftGeo = new THREE.CylinderGeometry(dim, dim, shaftLength, 6);
	const shaftMat = new THREE.MeshBasicMaterial({color: COLORS.CloadP_T}); 
	const shaft = new THREE.Mesh(shaftGeo, shaftMat);
	shaft.position.y = shaftLength / 2;
	group.add(shaft);

	// Cono
	const coneGeo = new THREE.ConeGeometry(dim * 3, headLength, 12);
	const coneMat = new THREE.MeshBasicMaterial({color: COLORS.CloadP_C});
	const cone = new THREE.Mesh(coneGeo, coneMat);
	cone.position.y = shaftLength + (headLength / 2);
	group.add(cone);

	// Orientamento
	const axis = new THREE.Vector3(0, 1, 0);
	group.quaternion.setFromUnitVectors(axis, dir.clone().normalize());
	
	// Disattivazione selezione
	group.children.forEach(child => {
		child.raycast = () => {};
	});

	return group;
}

// SELEZIONE E DESEKEZIONE -------------------------------------------------------------------------
// Aggiornamento colori selezione
function aggiornaSelezionePunti() {
	puntiAggiunti.forEach(p => {
		if (p.userData.selezionato) {
			p.material.color.set(COLORS.CSpunto); // colore selezionato
		} else {
			p.material.color.copy(p.userData.defaultColor); // colore non selezionato (default)
		}
	});
}
function aggiornaSelezioneLinee() {
	linee.forEach(l => {
		if (l.userData.selezionato) {
			l.material.color.set(COLORS.CSlinea);
		} else {
			l.material.color.copy(l.userData.defaultColor);
		}
	});
}
function aggiornaSelezionePiani() {
	piani.forEach(f => {
		if (f.userData.selezionato) {
			f.material.color.set(COLORS.CSsolaio);
		} else {
			f.material.color.copy(f.userData.defaultColor);
		}
	});
}
function aggiornaSelezioneAmd() {
	amds.forEach(a => {
		if (a.userData.selezionato) {
			a.material.color.set(COLORS.CSamds);
		} else {
			a.material.color.copy(a.userData.defaultColor);
		}
	});
}

// Funzione di deselezione totale
function deselezionaTuttiIPunti() {
	puntiAggiunti.forEach(p => p.userData.selezionato = false);
	aggiornaSelezionePunti();
}
function deselezionaTutteLeLinee() {
	linee.forEach(l => l.userData.selezionato = false);
	aggiornaSelezioneLinee();
}
function deselezionaTuttiIPiani() {
	piani.forEach(f => f.userData.selezionato = false);
	aggiornaSelezionePiani();
}
function deselezionaTuttiGliAmd() {
	amds.forEach(a => a.userData.selezionato = false);
	aggiornaSelezioneAmd();
}

// Deselezione totale
function deselezioneTotale() {
	deselezionaTuttiIPunti();
	deselezionaTutteLeLinee();
	deselezionaTuttiIPiani();
	resetFirstPoint();
	resetFloorSelection();
	deselezionaTuttiGliAmd();
}
window.addEventListener("keydown", (event) => {			// Deselezione con ESC
	if (event.key === "Escape") {
		deselezioneTotale();
	}
});
deselectBtn.addEventListener("click", deselezioneTotale);	// Deselezione con bottone

// Selezione totale
function selezioneTotale() {
	if (lineMode || floorMode) {
		console.log("Selezione totale disabilitata in modalità linea/piano");
		return;
	}
	puntiAggiunti.forEach(p => p.userData.selezionato = true);
	linee.forEach(l => l.userData.selezionato = true);
	piani.forEach(f => f.userData.selezionato = true);
	amds.forEach(a => a.userData.selezionato = true);

	aggiornaSelezionePunti();
	aggiornaSelezioneLinee();
	aggiornaSelezionePiani();
	aggiornaSelezioneAmd();
}
const selectBtn = document.getElementById("selectBtn");
selectBtn.addEventListener("click", selezioneTotale);

// Filtro selezioni
const selectionFilters = {
	points: true,
	lines: true,
	floors: true,
	amds: true
};

function setupToggle(buttonId, key, deselectFn) {

	const btn = document.getElementById(buttonId);

	btn.addEventListener("click", () => {

		selectionFilters[key] = !selectionFilters[key];

		btn.classList.toggle("active", selectionFilters[key]);
		btn.classList.toggle("disabled", !selectionFilters[key]);

		if (!selectionFilters[key]) {
			deselectFn();
		}

	});
}

setupToggle("togglePoints", "points", deselezionaTuttiIPunti);
setupToggle("toggleLines", "lines", deselezionaTutteLeLinee);
setupToggle("toggleFloors", "floors", deselezionaTuttiIPiani);
setupToggle("toggleAmds", "amds", deselezionaTuttiGliAmd);

// GESTIONE SELEZIONE ------------------------------------------------------------------------------
renderer.domElement.addEventListener("mousedown", (event) => {
	if (event.button !== 0) return; // solo sinistro

	isDragging = true;
	dragStart = { x: event.clientX, y: event.clientY };

	// mostra il rettangolo di selezione
	selectionBoxDiv.style.left = dragStart.x + "px";
	selectionBoxDiv.style.top = dragStart.y + "px";
	selectionBoxDiv.style.width = "0px";
	selectionBoxDiv.style.height = "0px";
	selectionBoxDiv.style.display = "block";
});

renderer.domElement.addEventListener("mousemove", (event) => {
	if (isDragging) {
		dragEnd = { x: event.clientX, y: event.clientY };

		const x = Math.min(dragStart.x, dragEnd.x);
		const y = Math.min(dragStart.y, dragEnd.y);
		const w = Math.abs(dragStart.x - dragEnd.x);
		const h = Math.abs(dragStart.y - dragEnd.y);

		selectionBoxDiv.style.left = x + "px";
		selectionBoxDiv.style.top = y + "px";
		selectionBoxDiv.style.width = w + "px";
		selectionBoxDiv.style.height = h + "px";
	}

	// Aggiorna posizione mouse per altre funzioni (facoltativo)
	mouseDownPos = { x: event.clientX, y: event.clientY };
});

renderer.domElement.addEventListener("mouseup", (event) => {
	if (!isDragging) return;

	isDragging = false;
	selectionBoxDiv.style.display = "none";

	dragEnd = { x: event.clientX, y: event.clientY };

	const dx = dragEnd.x - dragStart.x;
	const dy = dragEnd.y - dragStart.y;
	const distance = Math.sqrt(dx * dx + dy * dy);

	if (distance < 5) {
		// selezione singolo clic
		selezioneSingolo(event);
	} else {
		// Se siamo in lineMode o floorMode, non fare la selezione a finestra
		if (!lineMode && !floorMode) {
			selezioneFinestra(dragStart, dragEnd, event.shiftKey);
		}
	}
});

// Selezione singola
function selezioneSingolo(event) {
	mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
	mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

	raycaster.setFromCamera(mouse, camera);
	const intersectsPoints = selectionFilters.points
		? raycaster.intersectObjects(puntiAggiunti)
		: [];

	const intersectsLines = selectionFilters.lines
		? raycaster.intersectObjects(linee)
		: [];

	const intersectsFloors = selectionFilters.floors
		? raycaster.intersectObjects(piani)
		: [];

	const intersectsAmds = selectionFilters.amds
		? raycaster.intersectObjects(amds)
		: [];

	let selected = null;

	// --- Se clic su punto ---
	if (intersectsPoints.length > 0) {
		selected = intersectsPoints[0].object;

		if (lineMode) {
			if (!firstPoint) {
				firstPoint = selected;
				selected.material.color.set(COLORS.CmodL);
				console.log("Primo punto selezionato per la linea:", firstPoint.position);
			} else {
				if (selected === firstPoint) return;
				if (lineaEsistente(firstPoint, selected)) return;

				const line = creaLineaSpessa(firstPoint.position, selected.position);
				line.userData.selezionato = false;
				line.userData.p1 = firstPoint;
				line.userData.p2 = selected;
				line.userData.materiale = selectedMaterial;
				line.userData.sezione = selectedSection;
				line.userData.lunghezza = firstPoint.position.distanceTo(selected.position);
				const assi = calcolaAssiLocali(firstPoint.position, selected.position);
				line.userData.l = assi.l;
				line.userData.n = assi.n;
				line.userData.m = assi.m;

				scene.add(line);
				linee.push(line);
				aggiornaListaLinee();

				firstPoint.material.color.copy(firstPoint.userData.defaultColor);
				firstPoint = selected;
				firstPoint.material.color.set(COLORS.CmodL);

				console.log("Linea creata:", firstPoint.position, "→", selected.position);

				history.push({ type: "line-add", line: line });
				redoStack = [];
			}

		} else if (floorMode) {
			if (floorPoints.includes(selected)) {
				floorPoints = floorPoints.filter(p => p !== selected);
				selected.material.color.copy(selected.userData.defaultColor);
			} else {
				if (floorPoints.length === 0) {
					floorPoints.push(selected);
					selected.material.color.set(COLORS.CmodP);
				} else {
					const yRef = floorPoints[0].position.y;
					if (Math.abs(selected.position.y - yRef) < 0.01) {
						floorPoints.push(selected);
						selected.material.color.set(COLORS.CmodP);
					}
				}
			}
		} else {
			selected.userData.selezionato = !selected.userData.selezionato;
			aggiornaSelezionePunti();
		}

	// --- Selezione linee ---
	} else if (intersectsLines.length > 0 && !lineMode && !floorMode) {
		selected = intersectsLines[0].object;
		selected.userData.selezionato = !selected.userData.selezionato;
		aggiornaSelezioneLinee();

	// --- Selezione piani ---
	} else if (intersectsFloors.length > 0 && !lineMode && !floorMode) {
		selected = intersectsFloors[0].object;
		selected.userData.selezionato = !selected.userData.selezionato;
		aggiornaSelezionePiani();

	// --- Selezione AMDs ---
	} else if (intersectsAmds.length > 0 && !lineMode && !floorMode) {
		selected = intersectsAmds[0].object;
		selected.userData.selezionato = !selected.userData.selezionato;
		aggiornaSelezioneAmd();
	}
}

// Selezione a finestra
function selezioneFinestra(start, end, isShift) {
	const xMin = Math.min(start.x, end.x);
	const xMax = Math.max(start.x, end.x);
	const yMin = Math.min(start.y, end.y);
	const yMax = Math.max(start.y, end.y);

	function dentroFinestra(obj) {
		const vector = obj.position.clone();
		vector.project(camera);

		const sx = (vector.x + 1) / 2 * window.innerWidth;
		const sy = (-vector.y + 1) / 2 * window.innerHeight;

		return sx >= xMin && sx <= xMax && sy >= yMin && sy <= yMax;
	}

	// Punti
	if (selectionFilters.points) {
		puntiAggiunti.forEach(p => {
			if (dentroFinestra(p)) {
				p.userData.selezionato = !isShift;
			}
		});
		aggiornaSelezionePunti();
	}

	// Linee
	if (selectionFilters.lines) {
		linee.forEach(l => {
			if (dentroFinestra(l)) {
				l.userData.selezionato = !isShift;
			}
		});
		aggiornaSelezioneLinee();
	}

	// // Piani
	// piani.forEach(f => {
	// 	if (dentroFinestra(f)) {
	// 		f.userData.selezionato = !isShift;
	// 	}
	// });
	// aggiornaSelezionePiani();
	
	// Piani (selezione parziale reale)
	if (selectionFilters.floors) {
		piani.forEach(f => {

			const box = new THREE.Box3().setFromObject(f);

			// Se il box è vuoto salta
			if (box.isEmpty()) return;

			// Creiamo i vertici del bounding box
			const points = [
				new THREE.Vector3(box.min.x, box.min.y, box.min.z),
				new THREE.Vector3(box.min.x, box.min.y, box.max.z),
				new THREE.Vector3(box.min.x, box.max.y, box.min.z),
				new THREE.Vector3(box.min.x, box.max.y, box.max.z),
				new THREE.Vector3(box.max.x, box.min.y, box.min.z),
				new THREE.Vector3(box.max.x, box.min.y, box.max.z),
				new THREE.Vector3(box.max.x, box.max.y, box.min.z),
				new THREE.Vector3(box.max.x, box.max.y, box.max.z),
			];

			let intersectsSelection = false;

			for (let p of points) {

				// porta il punto in NDC
				p.project(camera);

				// converti in coordinate schermo
				const sx = (p.x + 1) / 2 * window.innerWidth;
				const sy = (-p.y + 1) / 2 * window.innerHeight;

				if (sx >= xMin && sx <= xMax && sy >= yMin && sy <= yMax) {
					intersectsSelection = true;
					break;
				}
			}

			if (intersectsSelection) {
				f.userData.selezionato = !isShift;
			}
		});

		aggiornaSelezionePiani();
	}

	// AMDs
	if (selectionFilters.amds) {
		amds.forEach(a => {
			if (dentroFinestra(a)) {
				a.userData.selezionato = !isShift;
			}
		});
		aggiornaSelezioneAmd();
	}
}

// CREAZIONE ELEMENTI ------------------------------------------------------------------------------
// Geometria punto
const sphereGeometry = new THREE.SphereGeometry(0.1, 10, 5);
const sphereMaterial = new THREE.MeshBasicMaterial({ color: COLORS.Cpunto });

// Creazione punto
document.getElementById("add-point").addEventListener("click", () => {
	const x = parseFloat(document.getElementById("x-input").value) || 0;
	const y = parseFloat(document.getElementById("y-input").value) || 0;
	const z = parseFloat(document.getElementById("z-input").value) || 0;
	const esiste = puntiAggiunti.some(p => 
		sonoUguali(p.position.x, y) && 
		sonoUguali(p.position.y, z) && 
		sonoUguali(p.position.z, x)
	);
	if (esiste) {
		//alert("⚠ Esiste già un punto con queste coordinate!");//
		return;
	}
	const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial.clone());
	sphere.userData.defaultColor = sphereMaterial.color.clone();
	sphere.position.set(y, z, x);
	sphere.userData.carico = {Fx: 0, Fy: 0, Fz: 0, Mx: 0, My: 0, Mz: 0, Mass: 0};

	// Aggiunta punti
	scene.add(sphere);
	puntiAggiunti.push(sphere);
	aggiornaListaPunti();
	aggiornaListaPiani();

	// Cronologia punti
	history.push({ type: "add", point: sphere });
	redoStack = [];
});

// Creazione carichi
function disegnaCaricoPunto(p, carico) {
	const { Fx, Fy, Fz, Mx, My, Mz, Mass } = carico;

	// rimuovi grafica precedente
	if (p.userData.frecciaForza) p.remove(p.userData.frecciaForza);
	if (p.userData.frecciaMomento) p.remove(p.userData.frecciaMomento);
	if (p.userData.frecciaMassa) p.remove(p.userData.frecciaMassa);

	// Forza
	const F = new THREE.Vector3(Fy, Fz, Fx);
	const frecciaForza = creaFrecciaForzaNodo(F);

	if (frecciaForza) {
		frecciaForza.position.set(0, 0, 0);
		p.add(frecciaForza);
		p.userData.frecciaForza = frecciaForza;
	}

	// Momento
	const M = new THREE.Vector3(My, Mz, Mx);
	const frecciaMomento = creaFrecciaMomentoNodo(M);

	if (frecciaMomento) {
		frecciaMomento.position.set(0, 0, 0);
		p.add(frecciaMomento);
		p.userData.frecciaMomento = frecciaMomento;
	}

	// Massa
	const Massa = new THREE.Vector3(0, Mass, 0);
	const frecciaMassa = creaFrecciaMassaNodo(Massa);

	if (frecciaMassa) {
		frecciaMassa.position.set(0, 0, 0);
		p.add(frecciaMassa);
		p.userData.frecciaMassa = frecciaMassa;
	}
}
function disegnaCaricoLinea(l, carico) {
	l.updateMatrixWorld(true); // aggiorna posizione e rotazione globale della trave
	const { Fx, Fy, Fz, Mx, My, Mz, Mass } = carico;

	const L = l.userData.lunghezza;
	const n = Math.round(L * 2) - 1;
	const offset = L / (n + 1);
	const step = (L - offset) / n;

	// rimuovi grafica precedente
	if (l.userData.frecciaForza) l.remove(l.userData.frecciaForza);
	if (l.userData.frecciaMomento) l.remove(l.userData.frecciaMomento);
	if (l.userData.frecciaMassa) l.remove(l.userData.frecciaMassa);

	// conversione assi globali → locali
	const invMatrix = new THREE.Matrix4().copy(l.matrixWorld).invert();
	const invRot = new THREE.Matrix3().setFromMatrix4(invMatrix);

	// Forza
	const F = new THREE.Vector3(Fy, Fz, Fx);
	F.applyMatrix3(invRot);

	const gruppoForze = new THREE.Group();
	for (let i = 0; i < n; i++) {
		const freccia = creaFrecciaForzaTrave(F);
		if (!freccia) continue;

		freccia.position.set(0, -L / 2 + offset + i * step, 0);
		gruppoForze.add(freccia);
	}
	l.add(gruppoForze);
	l.userData.frecciaForza = gruppoForze;

	// Momento
	const M = new THREE.Vector3(My, Mz, Mx);
	M.applyMatrix3(invRot);

	const gruppoMomento = new THREE.Group();
	for (let i = 0; i < n; i++) {
		const freccia = creaFrecciaMomentoTrave(M);
		if (!freccia) continue;

		freccia.position.set(0, -L / 2 + offset + i * step, 0);
		gruppoMomento.add(freccia);
	}
	l.add(gruppoMomento);
	l.userData.frecciaMomento = gruppoMomento;

	// Massa
	const Massa = new THREE.Vector3(0, Mass, 0);
	Massa.applyMatrix3(invRot);

	const gruppoMassa = new THREE.Group();
	for (let i = 0; i < n; i++) {
		const freccia = creaFrecciaMassaTrave(Massa);
		if (!freccia) continue;

		freccia.position.set(0, -L / 2 + offset + i * step, 0);
		gruppoMassa.add(freccia);
	}
	l.add(gruppoMassa);
	l.userData.frecciaMassa = gruppoMassa;
}
// Input carico add
document.getElementById("apply-load").addEventListener("click", () => {
	const Fx = parseFloat(document.getElementById("Fx-input").value) || 0;
	const Fy = parseFloat(document.getElementById("Fy-input").value) || 0;
	const Fz = parseFloat(document.getElementById("Fz-input").value) || 0;
	const Mx = parseFloat(document.getElementById("Mx-input").value) || 0;
	const My = parseFloat(document.getElementById("My-input").value) || 0;
	const Mz = parseFloat(document.getElementById("Mz-input").value) || 0;
	const Mass = -Math.abs(parseFloat(document.getElementById("Mass-input").value) || 0);

	const puntiSelezionati = puntiAggiunti.filter(p => p.userData.selezionato);
	const lineeSelezionate = linee.filter(l => l.userData.selezionato);

	if (puntiSelezionati.length === 0 && lineeSelezionate.length === 0) {
		alert("⚠ Nessun punto o linea selezionata");
		return;
	}

	// Forze nodali
	puntiSelezionati.forEach(p => {
		p.userData.carico = { Fx, Fy, Fz, Mx, My, Mz, Mass };
		disegnaCaricoPunto(p, p.userData.carico);
	});

	// Forze distribuite
	lineeSelezionate.forEach(l => {
		l.userData.carico = { Fx, Fy, Fz, Mx, My, Mz, Mass };
		disegnaCaricoLinea(l, l.userData.carico);
	});

	deselezioneTotale()
});
// Input carico delete
document.getElementById("delete-load").addEventListener("click", () => {
	const puntiSelezionati = puntiAggiunti.filter(p => p.userData.selezionato);
	const lineeSelezionate = linee.filter(l => l.userData.selezionato);

	if (puntiSelezionati.length === 0 && lineeSelezionate.length === 0) {
		alert("⚠ Nessun punto o linea selezionata");
		return;
	}

	// Forze nodali
	puntiSelezionati.forEach(p => {
		p.userData.carico = { Fx: 0, Fy: 0, Fz: 0, Mx: 0, My: 0, Mz: 0, Mass: 0 };
		disegnaCaricoPunto(p, p.userData.carico);
	});

	// Forze distribuite
	lineeSelezionate.forEach(l => {
		l.userData.carico = { Fx: 0, Fy: 0, Fz: 0, Mx: 0, My: 0, Mz: 0, Mass: 0 };
		disegnaCaricoLinea(l, l.userData.carico);
	});

	deselezioneTotale()
});
// Ripristino carichi all'apertura
function ripristinaCarichi() {
	puntiAggiunti.forEach(p => {
		if (p.userData.carico) {
			disegnaCaricoPunto(p, p.userData.carico);
		}
	});

	linee.forEach(l => {
		if (l.userData.carico) {
			disegnaCaricoLinea(l, l.userData.carico);
		}
	});
}

// Creazione piano
document.getElementById("createFloorBtn").addEventListener("click", () => {
	if (floorPoints.length >= 3) {

		if (poligonoHaIntersezioni(floorPoints)) {		// Controllo intersezione linee piano
			alert("⚠ Ordine dei punti non valido: i lati del solaio si incrociano!");
			deselezioneTotale()
			return;
		}

		const piano = creaPianoDaPunti(floorPoints);
		if (piano) {
			scene.add(piano);
			piani.push(piano);

			// Reset punti evidenziati
			floorPoints.forEach(p => p.material.color.copy(p.userData.defaultColor));
			floorPoints = [];

			// Cronologia aggiunta piani 
			history.push({ type: "floor-add", floor: piano });
			redoStack = [];

			aggiornaListaPiani();
		}
	} else {
		console.log("Seleziona almeno 3 punti alla stessa quota!");
	}
});
const H = parseFloat(secH.value) || 0;

// Creazione AMD
document.getElementById("add-amd").addEventListener("click", () => {
	const x = parseFloat(document.getElementById("x-input_amd").value) || 0;
	const y = parseFloat(document.getElementById("y-input_amd").value) || 0;
	const z = parseFloat(document.getElementById("z-input_amd").value) || 0;
	let G = parseFloat(document.getElementById("G-input_amd").value) || 10;
	if (G < 10) {
		G = 10;
		document.getElementById("G-input_amd").value = 10; // valore minimo 10
		console.log("⚠ Valore di G inferiore a 10, impostato automaticamente a 10");
	}

	const phi = parseFloat(document.getElementById("φ-input_amd").value) * Math.PI / 180 || 0;

	creaAMD(x, y, z, G, phi);
});

// Crea vincoli e svincola
document.getElementById("setFixedBtn").addEventListener("click", vincolaSelezionati);
document.getElementById("unsetFixedBtn").addEventListener("click", svincolaSelezionati);

// ELIMINAZIONE PUNTI ------------------------------------------------------------------------------
// Funzione cancellazione punti e linee e piani
function eliminaSelezionati() {
	const puntiDaRimuovere = puntiAggiunti.filter(p => p.userData.selezionato);
	const lineeDaRimuovereDirette = linee.filter(l => l.userData.selezionato);
	const pianiDaRimuovere = piani.filter(f => f.userData.selezionato);
	const amdsDaRimuovere = amds.filter(a => a.userData.selezionato);

	// Rimuove linee collegate ai punti
	const lineeDaRimuovereCollegate = linee.filter(l =>
		puntiDaRimuovere.includes(l.userData.p1) ||
		puntiDaRimuovere.includes(l.userData.p2)
	);
	const lineeDaRimuovere = [...new Set([...lineeDaRimuovereDirette, ...lineeDaRimuovereCollegate])];

	// Piani che perderanno punti (escludo quelli già selezionati per rimozione diretta)
	const pianiDaAggiornare = piani.filter(piano =>
		!pianiDaRimuovere.includes(piano) &&
		piano.userData.points.some(pt => puntiDaRimuovere.includes(pt))
	);

	// Salva stati (oldPoints) PRIMA di modificare / rimuovere
	const pianiDaAggiornareState = pianiDaAggiornare.map(piano => ({
		floor: piano,
		oldPoints: [...piano.userData.points]
	}));
	const pianiDaRimuovereState = pianiDaRimuovere.map(piano => ({
		floor: piano,
		oldPoints: [...piano.userData.points]
	}));

	// Rimozione dalla scena
	lineeDaRimuovere.forEach(l => scene.remove(l));
	puntiDaRimuovere.forEach(p => scene.remove(p));
	pianiDaRimuovere.forEach(f => scene.remove(f));
	amdsDaRimuovere.forEach(a => scene.remove(a));

	// Aggiorna array
	linee = linee.filter(l => !lineeDaRimuovere.includes(l));
	puntiAggiunti = puntiAggiunti.filter(p => !puntiDaRimuovere.includes(p));
	piani = piani.filter(f => !pianiDaRimuovere.includes(f));
	amds = amds.filter(a => !amdsDaRimuovere.includes(a));

	// Aggiorna i piani in base ai punti rimasti
	pianiDaAggiornare.forEach(piano => {
		aggiornaPiano(piano, false);
	});
	const amdsRimossiDaAggiornamento = aggiornaAMDs();

	// Registra nella cronologia come unica azione
	if (puntiDaRimuovere.length > 0 || lineeDaRimuovere.length > 0 || pianiDaAggiornareState.length > 0 || pianiDaRimuovereState.length > 0 || amdsRimossiDaAggiornamento.length > 0 || amdsDaRimuovere.length > 0) {
		history.push({
			type: "delete-group",
			points: puntiDaRimuovere,
			lines: lineeDaRimuovere,
			amds: [...amdsDaRimuovere, ...amdsRimossiDaAggiornamento],
			floors: [
				...pianiDaAggiornareState.map(ps => ({
					floor: ps.floor,
					oldPoints: ps.oldPoints,
					newPoints: [...ps.floor.userData.points]
				})),
				...pianiDaRimuovereState.map(pr => ({
					floor: pr.floor,
					oldPoints: pr.oldPoints,
					newPoints: []
				}))
			]
		});
		redoStack = [];
	}

	// Aggiorna le liste
	aggiornaListaPunti();
	aggiornaListaLinee();
	aggiornaListaPiani();
	aggiornaAMDs();
	aggiornaListaAMDs();
}

// Eliminazione da tastiera
window.addEventListener("keydown", (event) => {
	if (event.key === "Delete") {
		eliminaSelezionati();
	}
});

// eliminazione da bottone
document.getElementById("deleteBtn").addEventListener("click", () => {
	eliminaSelezionati();
});

// UNDO e REDO -------------------------------------------------------------------------------------
// undo (ctrl z)
function undo() {
	if (history.length === 0) return;
	const action = history.pop();
	redoStack.push(action);

	// aggiunta punti
	if (action.type === "add") {
		scene.remove(action.point);
		puntiAggiunti = puntiAggiunti.filter(p => p !== action.point);

	// aggiunta linee
	} else if (action.type === "line-add") {
		scene.remove(action.line);
		linee = linee.filter(l => l !== action.line);
	
	// aggiunta amd
	} else if (action.type === "amd-add") {
		scene.remove(action.amd);
		amds = amds.filter(a => a !== action.amd);

	// canc linee
	} else if (action.type === "delete-group") {
		// Ripristina punti
		action.points.forEach(p => {
			scene.add(p);
			puntiAggiunti.push(p);
		});

		// Ripristina linee
		action.lines.forEach(l => {
			scene.add(l);
			linee.push(l);
		});

		// Ripristina amd
		action.amds.forEach(a => {
			scene.add(a);
			amds.push(a);
		});

		// Ripristina piani
		action.floors.forEach(f => {
			const piano = f.floor;
			if (!piani.includes(piano)) scene.add(piano);
			if (!piani.includes(piano)) piani.push(piano);

			// Ricostruisci geometria con oldPoints
			const shape = new THREE.Shape();
			shape.moveTo(f.oldPoints[0].position.x, f.oldPoints[0].position.z);
			for (let i = 1; i < f.oldPoints.length; i++) {
				shape.lineTo(f.oldPoints[i].position.x, f.oldPoints[i].position.z);
			}
			shape.lineTo(f.oldPoints[0].position.x, f.oldPoints[0].position.z);

			piano.geometry.dispose();
			piano.geometry = new THREE.ShapeGeometry(shape);
			piano.userData.points = [...f.oldPoints];
			piano.position.y = f.oldPoints[0].position.y;
		});
	
	// vincola
	} else if (action.type === "vincola") {
		action.points.forEach(p => {
			p.userData.v = false;
			if (p.userData.constraintMarker) {
				p.remove(p.userData.constraintMarker);
				p.userData.constraintMarker = null;
			}
		});

	// Svincola
	} else if (action.type === "svincola") {
		action.points.forEach(p => {
			p.userData.v = true;
			if (!p.userData.constraintMarker) {
				const croce = creaCroceVincolo();
				p.add(croce);
				p.userData.constraintMarker = croce;
			}
		});
	
	// Creazione piano
	} else if (action.type === "floor-add") {
		scene.remove(action.floor);
		piani = piani.filter(f => f !== action.floor);

	} else if (action.type === "floor-delete") {
		action.floors.forEach(f => {
			scene.add(f);
			piani.push(f);
		});

	// Undo di floor-update-amd
	} else if (action.type === "floor-update-amd") {
		const piano = action.floor;

		// Ripristina piano
		if (!piani.includes(piano)) scene.add(piano);
		if (!piani.includes(piano)) piani.push(piano);

		// Ricostruisci la geometria con oldPoints
		const shape = new THREE.Shape();
		shape.moveTo(action.oldPoints[0].position.x, action.oldPoints[0].position.z);
		for (let i = 1; i < action.oldPoints.length; i++) {
			shape.lineTo(action.oldPoints[i].position.x, action.oldPoints[i].position.z);
		}
		shape.lineTo(action.oldPoints[0].position.x, action.oldPoints[0].position.z);

		piano.geometry.dispose();
		piano.geometry = new THREE.ShapeGeometry(shape);
		piano.userData.points = [...action.oldPoints];
		piano.position.y = action.oldPoints[0].position.y;

		// Ripristina AMD eliminati
		action.amdsRimossi.forEach(a => {
			scene.add(a);
			amds.push(a);
		});
	}

	aggiornaListaPunti();
	aggiornaListaLinee();
	aggiornaListaPiani();
	aggiornaAMDs();
	aggiornaListaAMDs();
}

// redo (ctrl shift z)
function redo() {
	if (redoStack.length === 0) return;
	const action = redoStack.pop();
	history.push(action);

	// aggiunta punti
	if (action.type === "add") {
		scene.add(action.point);
		puntiAggiunti.push(action.point);

	// aggiunta linee
	} else if (action.type === "line-add") {
		scene.add(action.line);
		linee.push(action.line);

	// aggiunta amd
	} else if (action.type === "amd-add") {
		scene.add(action.amd);
		amds.push(action.amd);

	} else if (action.type === "delete-group") {
		// Rimuovi punti
		action.points.forEach(p => {
			scene.remove(p);
			puntiAggiunti = puntiAggiunti.filter(pt => pt !== p);
		});

		// Rimuovi linee
		action.lines.forEach(l => {
			scene.remove(l);
			linee = linee.filter(li => li !== l);
		});

		// Rimuovi amd
		action.amds.forEach(a => {
			scene.remove(a);
			amds = amds.filter(amd => amd !== a);
		});
		
		// Gestione piani
		action.floors.forEach(f => {
			const piano = f.floor;
			if (!f.newPoints || f.newPoints.length < 3) {
				// piano rimosso
				scene.remove(piano);
				piani = piani.filter(pi => pi !== piano);
			} else {
				// piano aggiornato: ricostruisco la geometria con newPoints
				const np = f.newPoints;
				const shape = new THREE.Shape();
				shape.moveTo(np[0].position.x, np[0].position.z);
				for (let i = 1; i < np.length; i++) {
					shape.lineTo(np[i].position.x, np[i].position.z);
				}
				shape.lineTo(np[0].position.x, np[0].position.z);

				// sostituisco la geometria
				if (piano.geometry) piano.geometry.dispose();
				piano.geometry = new THREE.ShapeGeometry(shape);
				piano.userData.points = [...np];
				piano.position.y = np[0].position.y;

				if (!piani.includes(piano)) {
					scene.add(piano);
					piani.push(piano);
				}
			}
		});

	// Vincola
	} else if (action.type === "vincola") {
		action.points.forEach(p => {
			p.userData.v = true;
			if (!p.userData.constraintMarker) {
				const croce = creaCroceVincolo();
				p.add(croce);
				p.userData.constraintMarker = croce;
			}
		});

	// Svincola
	} else if (action.type === "svincola") {
		action.points.forEach(p => {
			p.userData.v = false;
			if (p.userData.constraintMarker) {
				p.remove(p.userData.constraintMarker);
				p.userData.constraintMarker = null;
			}
		});
	
	// Creazione pinao
	} else if (action.type === "floor-add") {
		scene.add(action.floor);
		piani.push(action.floor);
	
	} else if (action.type === "floor-delete") {
		action.floors.forEach(f => {
			scene.remove(f);
			piani = piani.filter(p => p !== f);
		});
		
	} else if (action.type === "floor-update-amd") {
		const piano = action.floor;

		// Aggiorna piano con newPoints
		const np = action.newPoints;
		if (np.length >= 3) {
			const shape = new THREE.Shape();
			shape.moveTo(np[0].position.x, np[0].position.z);
			for (let i = 1; i < np.length; i++) {
				shape.lineTo(np[i].position.x, np[i].position.z);
			}
			shape.lineTo(np[0].position.x, np[0].position.z);

			piano.geometry.dispose();
			piano.geometry = new THREE.ShapeGeometry(shape);
			piano.userData.points = [...np];
			piano.position.y = np[0].position.y;

			if (!piani.includes(piano)) {
				scene.add(piano);
				piani.push(piano);
			}
		} else {
			// Piano eliminato perché meno di 3 punti
			scene.remove(piano);
			piani = piani.filter(f => f !== piano);
		}

		// Rimuovi AMD eliminati
		action.amdsRimossi.forEach(a => {
			scene.remove(a);
			amds = amds.filter(amd => amd !== a);
		});
	}

	aggiornaListaPunti();
	aggiornaListaLinee();
	aggiornaListaPiani();
	aggiornaAMDs();
	aggiornaListaAMDs();
}

// Azione al comando
window.addEventListener("keydown", (event) => {
	if (event.ctrlKey && event.key === "z" && !event.shiftKey) {
		// Ctrl+Z → undo
		undo();
		event.preventDefault();
		resetFirstPoint();
		resetFloorSelection();
	}
	if (event.ctrlKey && event.shiftKey && event.key === "Z") {
		// Ctrl+Shift+Z → redo
		redo();
		event.preventDefault();
		resetFirstPoint();
		resetFloorSelection();
	}
});

// Comando da bottoni
document.addEventListener("DOMContentLoaded", () => {
	const undoBtn = document.getElementById("undoBtn");
	const redoBtn = document.getElementById("redoBtn");
	if (undoBtn) undoBtn.addEventListener("click", undo);
	if (redoBtn) redoBtn.addEventListener("click", redo);
});

// EXPORT ------------------------------------------------------------------------------------------
// Export CSV punti
function exportPointsToCSV() {
	let csvContent = "n,x,y,z,ux,uy,uz,rx,ry,rz\n";
	puntiAggiunti.forEach((p, index) => {
		const vincolo = p.userData.v ? 1 : 0;
		csvContent += `${index + 1},${p.position.z},${p.position.x},${p.position.y},${vincolo},${vincolo},${vincolo},${vincolo},${vincolo},${vincolo}\n`;
	});

	// Creazione blob e download
	const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.setAttribute("href", url);
	link.setAttribute("download", "punti.csv");
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
}

document.getElementById("exportCSV-point").addEventListener("click", exportPointsToCSV);

// Export CSV delle linee
function exportLinesToCSV() {
	let csvContent = "index,p1_index,p2_index,lunghezza,l1,l2,l3,m1,m2,m3,n1,n2,n3,materiale,sezione\n";
	linee.forEach((linea, index) => {
		const p1Index = puntiAggiunti.indexOf(linea.userData.p1) + 1;
		const p2Index = puntiAggiunti.indexOf(linea.userData.p2) + 1;
		const mat = linea.userData.materiale || "";
		const sez = linea.userData.sezione || "";
		const len = linea.userData.lunghezza;
		const L = linea.userData.l;
		const M = linea.userData.m;
		const N = linea.userData.n;

		csvContent += `${index + 1},${p1Index},${p2Index},${len},${L.l1},${L.l2},${L.l3},${M.m1},${M.m2},${M.m3},${N.n1},${N.n2},${N.n3},${mat},${sez}\n`;
	});

	// Creazione blob e download
	const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.setAttribute("href", url);
	link.setAttribute("download", "linee.csv");
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
}

document.getElementById("exportCSV-line").addEventListener("click", exportLinesToCSV);

// Esport CSV dei solai
function exportFloorsToCSV() {
	let csvContent = "n,quota,def_points,internal_points\n";

	piani.forEach((piano, index) => {
		const quota = piano.position.y.toFixed(2);
		const defPoints = piano.userData.points.map(p => puntiAggiunti.indexOf(p) + 1).filter(i => i > 0);
		const internalPoints = trovaPuntiInterniAlPiano(piano);

		csvContent += `${index + 1},${quota},[${defPoints.join(", ")}],[${internalPoints.join(", ")}]\n`;
	});

	// Creazione blob e download
	const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.setAttribute("href", url);
	link.setAttribute("download", "floors.csv");
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
}

document.getElementById("exportCSV-floor").addEventListener("click", exportFloorsToCSV);

// Export CSV delgli AMD
function exportAMDsToCSV() {
	let csvContent = "n,x,y,z,G,phi,solaio\n";

	amds.forEach((amd, index) => {
		const pos = amd.position;
		const phiDeg = (amd.rotation.y * 180 / Math.PI).toFixed(2);
		const G = amd.userData.G || 10;
		const floorIndex = amd.userData.floorIndex !== undefined ? amd.userData.floorIndex : "";

		csvContent += `${index+1},${pos.z},${pos.x},${pos.y},${G},${phiDeg},${floorIndex}\n`;
	});

	// Creazione blob e download
	const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.setAttribute("href", url);
	link.setAttribute("download", "amds.csv");
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
}

document.getElementById("exportCSV-amd").addEventListener("click", exportAMDsToCSV);

// MENU MATERIALE E SEZIONE ------------------------------------------------------------------------
// Calcolo proprietà sezione
function calcolaSezione(H, B) {
	const A = H * B;

	let beta, Il;

	if (H > B) {
		beta = (1 / 3) * (1 - 0.63 * (B / H) + 0.052 * Math.pow(B / H, 5));
		Il = beta * Math.pow(B, 3) * H;
	} else {
		beta = (1 / 3) * (1 - 0.63 * (H / B) + 0.052 * Math.pow(H / B, 5));
		Il = beta * Math.pow(H, 3) * B;
	}

	const In = (B * Math.pow(H, 3)) / 12;
	const Im = (H * Math.pow(B, 3)) / 12;
	const ASm = (B * H) / 1.2;
	const ASn = (H * B) / 1.2;

	return {H, B, A, Il, In, Im, ASm, ASn};
}

// Apre popup
function openSectionModal(container) {
	secModalContainer = container;

	document.getElementById("secNome").value = "";
	document.getElementById("secH").value = "";
	document.getElementById("secB").value = "";
	document.getElementById("secPreview").innerHTML = "";

	document.getElementById("sectionModal").classList.remove("hidden");

	updatePreview();
}
function openMaterialModal(container) {
	matModalContainer = container;

	document.getElementById("matNome").value = "";
	document.getElementById("matRho").value = "";
	document.getElementById("matE").value = "";
	document.getElementById("matG").value = "";

	document.getElementById("materialModal").classList.remove("hidden");
}

// Aggiornamento anteprima
function updatePreview() {
	const H = parseFloat(secH.value) || 0;
	const B = parseFloat(secB.value) || 0;

	// if (isNaN(H) || isNaN(B)) {
	//   secPreview.innerHTML = "";
	//   return;
	// }

	const s = calcolaSezione(H, B);

	secPreview.innerHTML = `
		A   [m2] = ${s.A.toFixed(4)}<br>
		Il  [m4] = ${s.Il.toExponential(3)}<br>
		In  [m4] = ${s.In.toExponential(3)}<br>
		Im  [m4] = ${s.Im.toExponential(3)}<br>
		ASm [m2] = ${s.ASm.toFixed(4)}<br>
		ASn [m2] = ${s.ASn.toFixed(4)}
	`;
}
secH.addEventListener("input", updatePreview);
secB.addEventListener("input", updatePreview);

// Annulla con esc
document.addEventListener("keydown", (e) => {
	const modal = document.getElementById("sectionModal");

	// ESC = 27 (legacy) / "Escape" (moderno)
	if (e.key === "Escape" && !modal.classList.contains("hidden")) {
		closeSectionModal();
	}
});
document.addEventListener("keydown", (e) => {
	const matModal = document.getElementById("materialModal");

	if (e.key === "Escape" && !matModal.classList.contains("hidden")) {
		closeMaterialModal();
	}
});

// Salva sezione
secSave.addEventListener("click", () => {
	const nome = secNome.value.trim();
	const H = parseFloat(secH.value);
	const B = parseFloat(secB.value);

	if (!nome || isNaN(H) || isNaN(B)) {
		alert("⚠ Compila tutti i campi");
		return;
	}
	if (H <= 0 || B <= 0) {
		alert("⚠ H e B devono essere maggiori di zero");
		return;
	}
	if (sezioni[nome]) {
		alert("⚠ Esiste già una sezione con questo nome");
		return;
	}

	sezioni[nome] = calcolaSezione(H, B);

	const item = document.createElement("div");
	item.innerText = nome;
	item.addEventListener("click", () => selectItem(secModalContainer, nome));

	secModalContainer
		.querySelector(".dropdown-list")
		.insertBefore(item, secModalContainer.querySelector(".new-btn"));

	selectedSection = nome;
	secModalContainer.querySelector(".dropdown-btn").innerText = nome;

	closeSectionModal();
});
matSave.addEventListener("click", () => {
	const nome = matNome.value.trim();
	const Rho = parseFloat(matRho.value);
	const E = parseFloat(matE.value);
	const G = parseFloat(matG.value);

	if (!nome || isNaN(Rho) || isNaN(E) || isNaN(G)) {
		alert("⚠ Compila tutti i campi");
		return;
	}
	if (Rho <= 0 || E <= 0 || G <= 0) {
		alert("⚠ ρ, E e G devono essere maggiori di zero");
		return;
	}
	if (materiali[nome]) {
		alert("⚠ Esiste già un materiale con questo nome");
		return;
	}

	materiali[nome] = { Rho, E, G };

	rebuildMaterialMenu();

	selectedMaterial = nome;
	matModalContainer.querySelector(".dropdown-btn").innerText = nome;

	closeMaterialModal();
});

// Chiusura
function closeSectionModal() {
	document.getElementById("sectionModal").classList.add("hidden");
}
secCancel.addEventListener("click", closeSectionModal);
function closeMaterialModal() {
	document.getElementById("materialModal").classList.add("hidden");
}

matCancel.addEventListener("click", closeMaterialModal);

// Apertura menù
function toggleDropdown(container) {
	const dropdown = container.querySelector(".dropdown-list");

	// Chiude tutti gli altri menu
	document.querySelectorAll(".menu-container").forEach((other) => {
		if (other !== container) {
			other.querySelector(".dropdown-list").style.display = "none";
		}
	});

	// Apre/chiude il menu cliccato
	dropdown.style.display =
		dropdown.style.display === "block" ? "none" : "block";
}

// Selezione elemento
function selectItem(container, name) {
	container.querySelector(".dropdown-btn").innerText = name;
	container.querySelector(".dropdown-list").style.display = "none";

	// Se è il menu Materiale
	if (container.querySelector("span").innerText.includes("Mat")) {
		selectedMaterial = name;
	}

	// Se è il menu Sezione
	if (container.querySelector("span").innerText.includes("Sez")) {
		selectedSection = name;
	}
}

// Aggiornamento menù sezioni
function rebuildSectionMenu() {
	const container = [...document.querySelectorAll(".menu-container")]
		.find(c => c.querySelector("span").innerText.includes("Sez"));

	if (!container) return;

	const list = container.querySelector(".dropdown-list");

	// Rimuove tutto tranne "Nuovo"
	[...list.children].forEach(child => {
		if (!child.classList.contains("new-btn")) {
			child.remove();
		}
	});
	const sectionNames = Object.keys(sezioni);

	// Ricrea voci dall'import di "sezioni"
	Object.keys(sezioni).forEach(nome => {
		const item = document.createElement("div");
		item.innerText = nome;
		item.addEventListener("click", () => selectItem(container, nome));
		list.insertBefore(item, list.querySelector(".new-btn"));
	});

	// Aggiorna selezione di Default
	if (sectionNames.length > 0) {
		selectedSection = sectionNames[0];
		container.querySelector(".dropdown-btn").innerText = selectedSection;
	}
}
function rebuildMaterialMenu() {
	const container = [...document.querySelectorAll(".menu-container")]
		.find(c => c.querySelector("span").innerText.includes("Mat"));

	if (!container) return;

	const list = container.querySelector(".dropdown-list");

	// pulizia
	[...list.children].forEach(child => {
		if (!child.classList.contains("new-btn")) child.remove();
	});

	const names = Object.keys(materiali);

	names.forEach(nome => {
		const item = document.createElement("div");
		item.innerText = nome;
		item.addEventListener("click", () => selectItem(container, nome));
		list.insertBefore(item, list.querySelector(".new-btn"));
	});

	// selezione default
	if (names.length > 0) {
		selectedMaterial = names[0];
		container.querySelector(".dropdown-btn").innerText = selectedMaterial;
	}
}

// setup eventi al caricamento
document.addEventListener("DOMContentLoaded", () => {
	document.querySelectorAll(".menu-container").forEach((container) => {
		const btn = container.querySelector(".dropdown-btn");
		const dropdown = container.querySelector(".dropdown-list");

		// Apre/Chiude menu
		btn.addEventListener("click", () => toggleDropdown(container));

		// Click sugli elementi esistenti
		dropdown.querySelectorAll("div").forEach((item) => {
			if (!item.classList.contains("new-btn")) {
				item.addEventListener("click", () =>
					selectItem(container, item.innerText)
				);
			}
		});

		// Click su "Nuovo"
		dropdown.querySelector(".new-btn").addEventListener("click", () => {
			if (container.querySelector("span").innerText.includes("Sez")) {
				openSectionModal(container);
			} else if (container.querySelector("span").innerText.includes("Mat")) {
				openMaterialModal(container);
			}
		});
	});
});

// Chiude cliccando fuori dal menu
window.addEventListener("click", (event) => {
	document.querySelectorAll(".menu-container").forEach((container) => {
		if (!event.target.closest(".menu-container")) {
			container.querySelector(".dropdown-list").style.display = "none";
		}
	});
});

// Memorizzazione caratteristiche sezione
let sezioni = {
	"PIL_30x30": calcolaSezione(0.30, 0.30),
	"TRAV_50x30": calcolaSezione(0.50, 0.30)
};
// Memorizzazione materiale e sezione
let materiali = {
	"C25/30" : { Rho: 2.5, E: 31447161, G: 13102984 },
	"S355": { Rho: 7.85, E: 210000000, G: 81000000 },
	"B450C": { Rho: 7.85, E: 210000000, G: 81000000 },
};
// Memorizzazione materiale e sezione
let selectedMaterial = "C25/30";
let selectedSection = "PIL_30x30";

// lista elementi
const listBtn = document.getElementById("listBtn");
const listPanel = document.getElementById("list-panel");

listBtn.addEventListener("click", () => {
	listPanel.classList.toggle("open");
});

document.addEventListener("click", (e) => {
	if (!listPanel.contains(e.target) && e.target !== listBtn) {
		listPanel.classList.remove("open");
	}
});

// Archivio
const secLibraryModal = document.getElementById("sectionLibraryModal");
const secTabsContainer = document.getElementById("sectionTabs");
const secListContainer = document.getElementById("sectionLibraryList");

document.getElementById("secLibraryBtn").addEventListener("click", () => {
	openSectionLibrary();
});

// Apertura archivio sezioni
function openSectionLibrary() {
	secTabsContainer.innerHTML = "";
	secListContainer.innerHTML = "";

	const categorie = Object.keys(sezioniArchivio); // HEB, IPE, UPE

	categorie.forEach((cat, index) => {
		const btn = document.createElement("button");
		btn.innerText = cat;

		btn.addEventListener("click", () => {
			document.
				querySelectorAll(".tabs button")
				.forEach(b => b.classList.remove("active"));
			btn.classList.add("active");
			mostraSezioniCategoria(cat);
		});

		if (index === 0) {
			btn.classList.add("active");
			mostraSezioniCategoria(cat);
		}

		secTabsContainer.appendChild(btn);
	});

	secLibraryModal.classList.remove("hidden");
}

// Categorie
function mostraSezioniCategoria(categoria) {
	secListContainer.innerHTML = "";

	const sezioniCat = sezioniArchivio[categoria];

	Object.keys(sezioniCat).forEach(nome => {
		const div = document.createElement("div");
		div.innerText = nome;

		div.addEventListener("click", () => {
			sezioni[nome] = sezioniCat[nome];
			rebuildSectionMenu();

			selectedSection = nome;
			secModalContainer.querySelector(".dropdown-btn").innerText = nome;

			closeSectionLibraryModal();
			closeSectionModal();
		});

		secListContainer.appendChild(div);
	});
}

// Chiusura modal
function closeSectionLibraryModal() {
	secLibraryModal.classList.add("hidden");
}
document.getElementById("secLibraryClose")
	.addEventListener("click", closeSectionLibraryModal);
document.addEventListener("keydown", e => {
	if (e.key === "Escape" && !secLibraryModal.classList.contains("hidden")) {
		closeSectionLibraryModal();
	}
});

// ARCHIVIO MATERIALI
const matLibraryModal = document.getElementById("materialLibraryModal");
const matTabsContainer = document.getElementById("materialTabs");
const matListContainer = document.getElementById("materialLibraryList");

document.getElementById("matLibraryBtn").addEventListener("click", () => {
	openMaterialLibrary();
});

// Apertura archivio materiali
function openMaterialLibrary() {
	matTabsContainer.innerHTML = "";
	matListContainer.innerHTML = "";

	const categorie = Object.keys(materialiArchivio);

	categorie.forEach((cat, index) => {
		const btn = document.createElement("button");
		btn.innerText = cat;

		btn.addEventListener("click", () => {
			document
				.querySelectorAll(".tabs button")
				.forEach(b => b.classList.remove("active"));

			btn.classList.add("active");
			mostraMaterialiCategoria(cat);
		});

		if (index === 0) {
			btn.classList.add("active");
			mostraMaterialiCategoria(cat);
		}

		matTabsContainer.appendChild(btn);
	});

	matLibraryModal.classList.remove("hidden");
}

// Categorie
function mostraMaterialiCategoria(categoria) {
	matListContainer.innerHTML = "";

	const materialiCat = materialiArchivio[categoria];

	Object.keys(materialiCat).forEach(nome => {
		const div = document.createElement("div");
		div.innerText = nome;

		div.addEventListener("click", () => {
			materiali[nome] = materialiCat[nome];
			rebuildMaterialMenu();

			selectedMaterial = nome;
			matModalContainer.querySelector(".dropdown-btn").innerText = nome;

			closeMaterialLibraryModal();
			closeMaterialModal();
		});

		matListContainer.appendChild(div);
	});
}

// Chiusura modal
function closeMaterialLibraryModal() {
	matLibraryModal.classList.add("hidden");
}
document.getElementById("matLibraryClose").addEventListener("click", closeMaterialLibraryModal);
document.addEventListener("keydown", e => {
	if (e.key === "Escape" && !matLibraryModal.classList.contains("hidden")) {
		closeMaterialLibraryModal();
	}
});

// ANALISI -----------------------------------------------------------------------------------------
const analisiBtn = document.getElementById("analisiBtn");
const loadingOverlay = document.getElementById("loadingOverlay");
const loadingMsg = document.getElementById("loadingMsg");
const spinner = document.querySelector(".spinner");

// Errore popup in analisi iniziale
function mostraErrore(messaggio) {
	loadingMsg.innerHTML = `<b style="color:#ffb3b3">${messaggio}</b>`;
	spinner.classList.add("error");

	// chiusura al click
	loadingOverlay.onclick = () => {
		loadingOverlay.style.display = "none";
		spinner.classList.remove("error");
		loadingOverlay.onclick = null;
	};
}
analisiBtn.addEventListener("click", async () => {
	const modello = costruisciModelloJSON();
	const nomeFile = document.getElementById("nomeFile").value || "Modello senza nome";
	sessionStorage.setItem(
		"modelloStruttura",
		JSON.stringify({ modello: modello, nomeFile: nomeFile })
	);

	// Mostra overlay
	loadingOverlay.style.display = "flex";
	loadingMsg.innerText = "Invio dati al server...";

	// Chiamata analisi
	try {
		const response = await fetch("http://127.0.0.1:5000/analysis/init", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(modello)
		});

		if (!response.ok) {
			const err = await response.json();
			mostraErrore(err.errore || "Errore durante il calcolo");
			return;
		}

		// Se tutto ok, salva il risultato e passa ad analysis.html
		const res = await response.json();
		sessionStorage.setItem("risultatoAnalisi", JSON.stringify(res.initial));
		window.location.href = "analysis.html";

	} catch (err) {
		console.error(err);
		mostraErrore("Errore di comunicazione con il server");
		return;
	}
});

// SALVATAGGIO -------------------------------------------------------------------------------------
function costruisciModelloJSON() {
	return {
		// --- SALVATAGGIO PUNTI ---
		points: puntiAggiunti.map(p => ({
			x: p.position.z,
			y: p.position.x,
			z: p.position.y,
			ux: !!p.userData.v,
			uy: !!p.userData.v,
			uz: !!p.userData.v,
			rx: !!p.userData.v,
			ry: !!p.userData.v,
			rz: !!p.userData.v,
			load: p.userData.carico ?? null
		})),
		// --- SALVATAGGIO LINEE ---
		lines: linee.map(l => {
			const sez = sezioni[l.userData.sezione];
			const mat = materiali[l.userData.materiale];
			return {
				p1: puntiAggiunti.indexOf(l.userData.p1),
				p2: puntiAggiunti.indexOf(l.userData.p2),
				lunghezza: l.userData.lunghezza,
				l: l.userData.l,
				m: l.userData.m,
				n: l.userData.n,
				materiale: l.userData.materiale,
				Rho: mat.Rho,
				E: mat.E,
				G: mat.G,
				sezione: l.userData.sezione,
				H: sez.H,
				B: sez.B,
				A: sez.A,
				Il: sez.Il,
				In: sez.In,
				Im: sez.Im,
				ASm: sez.ASm,
				ASn: sez.ASn,
				load: l.userData.carico ?? null
			};
		}),
		// --- SALVATAGGIO PIANI ---
		floors: piani.map(f => ({
			points: f.userData.points.map(pt => puntiAggiunti.indexOf(pt)),
			intern: trovaPuntiInterniAlPiano(f).map(i => i - 1)
		})),
		// --- SALVATAGGIO AMD ---
		amds: amds.map(a => ({
			x: a.position.z,
			y: a.position.x,
			z: a.position.y,
			phi: a.rotation.y,
			G: a.userData.G,
			floorIndex: a.userData.floorIndex
		})),
		// --- SALVATAGGIO SEZIONI ---
		sezioni: Object.entries(sezioni).map(([nome, s]) => ({
			nome: nome,
			H: s.H,
			B: s.B,
			A: s.A,
			Il: s.Il,
			In: s.In,
			Im: s.Im,
			ASm: s.ASm,
			ASn: s.ASn
		})),
		// --- SALVATAGGIO MATERIALI ---
		materiali: Object.entries(materiali).map(([nome, m]) => ({
			nome: nome,
			Rho: m.Rho,
			E: m.E,
			G: m.G
		}))
	};
}

function salvaModello() {
	const nomeFile = document.getElementById("nomeFile").value || "Modello senza nome";
	const modello = costruisciModelloJSON();
	sessionStorage.setItem("modelloStruttura", JSON.stringify({
		nomeFile: nomeFile,
		modello: modello,
		analisiPreliminare: null,
		analisiModale: null
	}));

	const fileDaSalvare = {
		nomeFile: nomeFile,
		modello: modello,
		analisiPreliminare: null,
		analisiModale: null
	};

	const blob = new Blob([JSON.stringify(fileDaSalvare, null, 2)], { type: "application/json" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = `${nomeFile}.stc`;
	a.click();
	URL.revokeObjectURL(url);
}
document.getElementById("saveModel").addEventListener("click", salvaModello);

// APERTURA ----------------------------------------------------------------------------------------
function resetAnalisi() {
	sessionStorage.clear();

	puntiAggiunti.forEach(p => scene.remove(p));
	linee.forEach(l => scene.remove(l));
	piani.forEach(f => scene.remove(f));
	amds.forEach(a => scene.remove(a));

	puntiAggiunti = [];
	linee = [];
	piani = [];
	amds = [];

	console.log("Reset completo eseguito");
}

function apriModello(jsonData, fileName) {
	// RESET UNDO / REDO
	history = [];
	redoStack = [];
	if (fileName) {
		const nomePulito = fileName.replace(/\.[^/.]+$/, ""); // rimuove estensione
		document.getElementById("nomeFile").value = nomePulito;
	}

	// Reset scena
	camera.position.copy(cameraInitialPosition);
	controls.target.copy(cameraInitialTarget);
	controls.update();

	puntiAggiunti.forEach(p => scene.remove(p));
	linee.forEach(l => scene.remove(l));
	piani.forEach(f => scene.remove(f));
	amds.forEach(a => scene.remove(a));

	puntiAggiunti = [];
	linee = [];
	piani = [];
	amds = [];
	sezioni = [];
	materiali = [];

	// --- RICOSTRUZIONE PUNTI ---
	jsonData.points.forEach(p => {
		const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial.clone());
		sphere.userData.defaultColor = sphereMaterial.color.clone();
		sphere.position.set(p.y, p.z, p.x);

		if (p.ux) {
			sphere.userData.v = true;
			const croce = creaCroceVincolo();
			sphere.add(croce);
			sphere.userData.constraintMarker = croce;
		}
		// carichi
		if (p.load !== null) {
			sphere.userData.carico = p.load;
		}

		scene.add(sphere);
		puntiAggiunti.push(sphere);
	});

	// --- RICOSTRUZIONE LINEE ---
	jsonData.lines.forEach(l => {
		const p1 = puntiAggiunti[l.p1];
		const p2 = puntiAggiunti[l.p2];

		const line = creaLineaSpessa(p1.position, p2.position);
		line.userData.p1 = p1;
		line.userData.p2 = p2;
		line.userData.lunghezza = l.lunghezza;
		line.userData.l = l.l;
		line.userData.m = l.m;
		line.userData.n = l.n;
		line.userData.materiale = l.materiale;
		line.userData.sezione = l.sezione
		// carichi
		if (l.load !== null) {
			line.userData.carico = l.load;
		}

		scene.add(line);
		linee.push(line);
	});

	// --- RICOSTRUZIONE PIANI ---
	jsonData.floors.forEach(f => {
		const pts = f.points.map(i => puntiAggiunti[i]);
		const piano = creaPianoDaPunti(pts);
		if (piano) {
			scene.add(piano);
			piani.push(piano);
		}
	});

	// --- RICOSTRUZIONE AMD ---
	jsonData.amds.forEach(a => {
		creaAMD(a.x, a.y, a.z, a.G, a.phi, false);
	});

	// --- RICOSTRUZIONE SEZIONI ---
	sezioni = {};
	jsonData.sezioni.forEach(s => {
		sezioni[s.nome] = {
			H: s.H,
			B: s.B,
			A: s.A,
			Il: s.Il,
			In: s.In,
			Im: s.Im,
			ASm: s.ASm,
			ASn: s.ASn
		};
	});

	// --- RICOSTRUZIONE NATERIALI ---
	materiali = {};
	jsonData.materiali.forEach(m => {
		materiali[m.nome] = {
			Rho: m.Rho,
			E: m.E,
			G: m.G
		};
	});

	aggiornaListaPunti();
	aggiornaListaLinee();
	aggiornaListaPiani();
	aggiornaAMDs();
	aggiornaListaAMDs();
	rebuildSectionMenu();
	rebuildMaterialMenu();
	ripristinaCarichi();
}

document.getElementById("loadModelBtn").addEventListener("click", () => {
	document.getElementById("loadModel").click();
});

document.getElementById("loadModel").addEventListener("change", function(e) {
	resetAnalisi()
	const file = e.target.files[0];
	const reader = new FileReader();
	reader.onload = function() {
		const jsonData = JSON.parse(reader.result);
		sessionStorage.setItem("modelloStruttura", JSON.stringify({
			nomeFile: jsonData.nomeFile,
			modello: jsonData.modello
		}));
		if (jsonData.analisiPreliminare) {
			sessionStorage.setItem("risultatoAnalisi", JSON.stringify(jsonData.analisiPreliminare));
			if (jsonData.analisiModale) {
				sessionStorage.setItem("analisiModaleCompleta", JSON.stringify(jsonData.analisiModale));
			} else {
				sessionStorage.removeItem("analisiModaleCompleta");
			}
			window.location.href = "analysis.html";
			return;
		}
		apriModello(jsonData.modello, jsonData.nomeFile);
	};
	reader.readAsText(file);
	this.value = "";
});

document.addEventListener("DOMContentLoaded", () => {
	const stored = sessionStorage.getItem("modelloStruttura");
	if (stored) {
		const { modello, nomeFile } = JSON.parse(stored);

		if (modello && modello.points) {
			apriModello(modello);
			document.getElementById("nomeFile").value = nomeFile;
			console.log("Modello ripristinato automaticamente");
		}
		// Dopo aver caricato il modello lo resetta dalla memoria
		// in questo modo si può resettare la pagina con il refresh.
		// sessionStorage.removeItem("modelloStruttura");
	}
});

function resetPagina() {
	camera.position.copy(cameraInitialPosition);
	controls.target.copy(cameraInitialTarget);
	controls.update();
	history = [];
	redoStack = [];
	document.getElementById("nomeFile").value = "";
	puntiAggiunti.forEach(p => scene.remove(p));
	linee.forEach(l => scene.remove(l));
	piani.forEach(f => scene.remove(f));
	amds.forEach(a => scene.remove(a));

	puntiAggiunti = [];
	linee = [];
	piani = [];
	amds = [];
	sezioni = {
		"PIL_30x30": calcolaSezione(0.30, 0.30),
		"TRAV_50x30": calcolaSezione(0.50, 0.30)
	};
	materiali = {
		"C25/30" : { Rho: 2.5, E: 31447161, G: 13102984 },
		"S355": { Rho: 7.85, E: 210000000, G: 81000000 },
		"B450C": { Rho: 7.85, E: 210000000, G: 81000000 },
	};
	selectedMaterial = "C25/30";
	selectedSection = "PIL_30x30";

	aggiornaListaPunti();
	aggiornaListaLinee();
	aggiornaListaPiani();
	aggiornaAMDs();
	aggiornaListaAMDs();
	rebuildSectionMenu();
	rebuildMaterialMenu();
	ripristinaCarichi();

	sessionStorage.removeItem("modelloStruttura");
	history = [];
	redoStack = [];
}
document.getElementById("resetALL").addEventListener("click", resetPagina);

// ARCHIVI -----------------------------------------------------------------------------------------
// sezioni:
// https://www.dlubal.com/it/proprieta-della-sezione-trasversale/

// materiali:
// https://www.ecoarchitettare.it/apps/cls/cls.php

const sezioniArchivio = {
	HEB: {
		"HEB_100"  : { H: 0.10, B: 0.10, A: 26.04e-4, Il:  9.25e-8, In:   449.57e-8, Im:  167.21e-8, ASm:  4.96e-4, ASn: 16.78e-4 },
		"HEB_120"  : { H: 0.12, B: 0.12, A: 34.01e-4, Il: 13.84e-8, In:   864.39e-8, Im:  317.46e-8, ASm:  6.52e-4, ASn: 22.11e-4 },
		"HEB_140"  : { H: 0.14, B: 0.14, A: 42.96e-4, Il: 20.06e-8, In:  1509.24e-8, Im:  549.59e-8, ASm:  8.25e-4, ASn: 28.14e-4 },
		"HEB_160"  : { H: 0.16, B: 0.16, A: 54.25e-4, Il: 31.24e-8, In:  2492.04e-8, Im:  889.08e-8, ASm: 10.79e-4, ASn: 34.84e-4 },
		"HEB_180"  : { H: 0.18, B: 0.18, A: 65.25e-4, Il: 42.16e-8, In:  3831.16e-8, Im: 1362.67e-8, ASm: 12.96e-4, ASn: 42.21e-4 },
		"HEB_200"  : { H: 0.20, B: 0.20, A: 78.08e-4, Il: 59.28e-8, In:  5696.25e-8, Im: 2003.08e-8, ASm: 15.31e-4, ASn: 50.21e-4 },
		"HEB_220"  : { H: 0.22, B: 0.22, A: 91.04e-4, Il: 76.57e-8, In:  8091.00e-8, Im: 2842.95e-8, ASm: 17.84e-4, ASn: 58.93e-4 },
		"HEB_240"  : { H: 0.24, B: 0.24, A:105.99e-4, Il:102.70e-8, In: 11259.41e-8, Im: 3922.16e-8, ASm: 20.55e-4, ASn: 68.31e-4 },
		"HEB_260"  : { H: 0.26, B: 0.26, A:118.44e-4, Il:123.80e-8, In: 14919.66e-8, Im: 5133.84e-8, ASm: 22.39e-4, ASn: 76.17e-4 },
		"HEB_280"  : { H: 0.28, B: 0.28, A:131.36e-4, Il:143.70e-8, In: 19270.42e-8, Im: 6593.79e-8, ASm: 25.37e-4, ASn: 84.37e-4 },
		"HEB_300"  : { H: 0.30, B: 0.30, A:149.08e-4, Il:185.00e-8, In: 25166.00e-8, Im: 8561.79e-8, ASm: 28.53e-4, ASn: 95.40e-4 },
		"HEB_320"  : { H: 0.32, B: 0.30, A:161.34e-4, Il:225.10e-8, In: 30823.74e-8, Im: 9237.71e-8, ASm: 32.01e-4, ASn:102.94e-4 },
		"HEB_340"  : { H: 0.34, B: 0.30, A:170.90e-4, Il:257.20e-8, In: 36656.45e-8, Im: 9688.73e-8, ASm: 35.72e-4, ASn:107.98e-4 },
		"HEB_360"  : { H: 0.36, B: 0.30, A:180.63e-4, Il:292.50e-8, In: 43193.35e-8, Im:10139.88e-8, ASm: 39.59e-4, ASn:113.00e-4 },
		"HEB_400"  : { H: 0.40, B: 0.30, A:197.78e-4, Il:355.70e-8, In: 57680.02e-8, Im:10817.57e-8, ASm: 47.96e-4, ASn:120.63e-4 },
		"HEB_450"  : { H: 0.45, B: 0.30, A:217.98e-4, Il:440.50e-8, In: 79886.45e-8, Im:11719.76e-8, ASm: 56.58e-4, ASn:130.67e-4 },
		"HEB_500"  : { H: 0.50, B: 0.30, A:238.64e-4, Il:538.40e-8, In:107173.93e-8, Im:12622.25e-8, ASm: 65.72e-4, ASn:140.72e-4 },
		"HEB_550"  : { H: 0.55, B: 0.30, A:254.06e-4, Il:600.30e-8, In:136688.11e-8, Im:13075.13e-8, ASm: 75.33e-4, ASn:145.96e-4 },
		"HEB_600"  : { H: 0.60, B: 0.30, A:269.96e-4, Il:667.20e-8, In:171037.30e-8, Im:13528.37e-8, ASm: 85.41e-4, ASn:150.98e-4 },
		"HEB_650"  : { H: 0.65, B: 0.30, A:286.34e-4, Il:739.20e-8, In:210611.10e-8, Im:13982.01e-8, ASm: 96.04e-4, ASn:156.00e-4 },
		"HEB_700"  : { H: 0.70, B: 0.30, A:306.38e-4, Il:830.90e-8, In:256882.10e-8, Im:14438.64e-8, ASm:110.31e-4, ASn:161.24e-4 },
		"HEB_800"  : { H: 0.80, B: 0.30, A:334.18e-4, Il:946.00e-8, In:359072.85e-8, Im:14900.73e-8, ASm:130.81e-4, ASn:166.36e-4 },
		"HEB_900"  : { H: 0.90, B: 0.30, A:371.28e-4, Il:1137.0e-8, In:494049.60e-8, Im:15812.65e-8, ASm:156.35e-4, ASn:176.86e-4 },
		"HEB_1000" : { H: 1.00, B: 0.30, A:400.05e-4, Il:1254.0e-8, In:644727.96e-8, Im:16272.36e-8, ASm:179.05e-4, ASn:182.11e-4 },
	},
	IPE: {
		"IPE_100"  : { H: 0, B: 0, A: 0, Il: 0, In: 0, Im: 0, ASm: 0, ASn: 0 },
	},
	UPE: {
		"UPE_100"  : { H: 0, B: 0, A: 0, Il: 0, In: 0, Im: 0, ASm: 0, ASn: 0 },
	},
};
const materialiArchivio = {
	Calcestruzzo: {
		"C8/10"  : { Rho: 2.5, E: 25472934, G: 10613722 },
		"C12/15" : { Rho: 2.5, E: 27266580, G: 11361075 },
		"C16/20" : { Rho: 2.5, E: 28820613, G: 12008589 },
		"C20/25" : { Rho: 2.5, E: 30200493, G: 12583539 },
		"C25/30" : { Rho: 2.5, E: 31447161, G: 13102984 },
		"C30/37" : { Rho: 2.5, E: 33019435, G: 13758098 },
		"C35/45" : { Rho: 2.5, E: 34625485, G: 14427286 },
		"C40/50" : { Rho: 2.5, E: 35547105, G: 14811294 },
		"C45/55" : { Rho: 2.5, E: 36416114, G: 15173381 },
		"C50/60" : { Rho: 2.5, E: 37239259, G: 15516358 },
		"C55/67" : { Rho: 2.5, E: 38324836, G: 15968681 },
		"C60/75" : { Rho: 2.5, E: 39483585, G: 16451494 },
		"C70/85" : { Rho: 2.5, E: 40828793, G: 17011997 },
		"C80/95" : { Rho: 2.5, E: 42077858, G: 17532441 },
		"C90/105": { Rho: 2.5, E: 43245938, G: 18019141 },
	},
	Legno: {
		"GL24h": { Rho: 0.38, E: 11600000, G: 720000 },
		"GL28h": { Rho: 0.41, E: 12600000, G: 780000 },
		"GL32h": { Rho: 0.43, E: 13700000, G: 850000 },
		"GL36h": { Rho: 0.45, E: 14700000, G: 910000 },
		"GL24c": { Rho: 0.35, E: 11600000, G: 590000 },
		"GL28c": { Rho: 0.38, E: 12600000, G: 720000 },
		"GL32c": { Rho: 0.41, E: 13700000, G: 780000 },
		"GL36c": { Rho: 0.43, E: 14700000, G: 850000 },
	},
	Acciaio: {
		"S235": { Rho: 7.85, E: 210000000, G: 81000000 },
		"S275": { Rho: 7.85, E: 210000000, G: 81000000 },
		"S355": { Rho: 7.85, E: 210000000, G: 81000000 },
		"S420": { Rho: 7.85, E: 210000000, G: 81000000 },
		"S450": { Rho: 7.85, E: 210000000, G: 81000000 },
		"S460": { Rho: 7.85, E: 210000000, G: 81000000 },
	},
	Armatura: {
		"B450C": { Rho: 7.85, E: 210000000, G: 81000000 },
		"B450A": { Rho: 7.85, E: 210000000, G: 81000000 }
	},
};