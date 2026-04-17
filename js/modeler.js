// =================================================================================================
// modeler.js - Logica principale del modeler - Solo index.html
// Global state, Selection rectangle, List update, Floors creation functions,
// Amds, Constraints, Loads, Selection, Elements, Delete, Line / Floor / Point Mode, 
// Sections / Materials Menu, Undo / Redo, Save / Load / Reset, Analyses
// =================================================================================================

import * as THREE from "three";
import { scene, camera, controls, initCamPos, initTarPos, renderer } from "./scene.js";
import { COLORS, DEFAULT_SECTIONS, DEFAULT_MATERIALS, CALCULATE_SECTION } from "./config.js";
import { SECTIONS_ARCHIVE, MATERIALS_ARCHIVE } from "./data.js";
import {
	addFrame, calcLocalAxes, addFloor, addConstraints,
	addArrowFN, addArrowMN, addArrowPN,
	addArrowFT, addArrowMT, addArrowPT,
	verPointInPoly, verPolyIntersect,
	SPHERE_GEO, SPHERE_MAT,
} from "./geometry.js";

// GLOBAL STATE ------------------------------------------------------------------------------------
let puntiAggiunti     = [];											// Elementi della scena
let linee             = [];
let piani             = [];
let amds              = [];

let sezioni           = { ...DEFAULT_SECTIONS };					// Sezioni e materiali attivi
let materiali         = { ...DEFAULT_MATERIALS };
let selectedSection   = "PIL_30x30";
let selectedMaterial  = "C25/30";

let history           = [];											// Cronologia (undo / redo)
let redoStack         = [];

let lineMode          = false;										// Modalità disegno
let floorMode         = false;
let firstPoint        = null;
let floorPoints       = [];

let isDragging        = false;										// Selezione con rettangolo
let dragStart         = null;
let dragEnd           = null;

let secModalContainer = null;										// Riferimenti sezione/materiale
let matModalContainer = null;

const raycaster       = new THREE.Raycaster();						// Raycaster per la selezione
const mouse           = new THREE.Vector2();
const selectionFilters = { points: true, lines: true, floors: true, amds: true };

// SELECTION RECTANGLE -----------------------------------------------------------------------------
const selectionBoxDiv = document.createElement("div");
selectionBoxDiv.style.cssText = [
	"position:absolute",
	"border:2px dashed #34A0D580",
	"background-color: #34A0D526",
	"pointer-events:none",
	"display:none",
].join(";");
document.body.appendChild(selectionBoxDiv);

// LIST UPDATE -------------------------------------------------------------------------------------
export function aggiornaListaPunti() {
	const ul = document.getElementById("points-list");
	ul.innerHTML = "";
	puntiAggiunti.forEach((p, i) => {
		const vincolo = p.userData.v ? " v" : "";
		const pos = p.position;
		const li = document.createElement("li");
		li.textContent = `P_${i+1}: (${pos.z.toFixed(2)} ${pos.x.toFixed(2)} ${pos.y.toFixed(2)})${vincolo}`;
		ul.appendChild(li);
	});
}
export function aggiornaListaLinee() {
	const ul = document.getElementById("lines-list");
	ul.innerHTML = "";
	linee.forEach((l, i) => {
		const p1i = puntiAggiunti.indexOf(l.userData.p1) + 1;
		const p2i = puntiAggiunti.indexOf(l.userData.p2) + 1;
		const fmtV = (v, k1, k2, k3) => `(${v[k1].toFixed(2)}, ${v[k2].toFixed(2)}, ${v[k3].toFixed(2)})`;
		const li = document.createElement("li");
		li.textContent =
			`L_${i+1}: (P_${p1i} P_${p2i}) | L:${l.userData.lunghezza.toFixed(2)} | ` +
			`l:${fmtV(l.userData.l,"l1","l2","l3")} ` +
			`m:${fmtV(l.userData.m,"m1","m2","m3")} ` +
			`n:${fmtV(l.userData.n,"n1","n2","n3")} | ` +
			`${l.userData.materiale}, ${l.userData.sezione}`;
		ul.appendChild(li);
	});
}
export function aggiornaListaPiani() {
	const ul = document.getElementById("floors-list");
	if (!ul) return;
	ul.innerHTML = "";
	piani.forEach((piano, i) => {
		const puntiDef = piano.userData.points || [];
		const quota    = puntiDef.length > 0 ? puntiDef[0].position.y.toFixed(2) : "N/D";
		const indici   = puntiDef.map(pt => puntiAggiunti.indexOf(pt) + 1).filter(idx => idx > 0);
		const interni  = trovaPuntiInterniAlPiano(piano);
		const li = document.createElement("li");
		li.textContent = `Solaio_${i+1}: z=${quota} | punti: [P_${indici.join(", P_")}]`;
		if (interni.length > 0) li.textContent += ` | interni: [P_${interni.join(", P_")}]`;
		ul.appendChild(li);
	});
}
export function aggiornaListaAMDs() {
	const ul = document.getElementById("amd-list");
	ul.innerHTML = "";
	amds.forEach((amd, i) => {
		const pos    = amd.position;
		const phiDeg = (amd.rotation.y * 180 / Math.PI).toFixed(2);
		const G      = amd.userData.G ?? 0;
		const li = document.createElement("li");
		li.textContent = `AMD_${i+1}: (${pos.z.toFixed(2)} ${pos.x.toFixed(2)} ${pos.y.toFixed(2)}) | φ=${phiDeg}° | G=${G} | Solaio=${amd.userData.floorIndex+1}`;
		ul.appendChild(li);
	});
}

// FLOORS CREATION FUNCTIONS -----------------------------------------------------------------------
function trovaPuntiInterniAlPiano(piano) {
	const interni = puntiAggiunti.filter(p => {
		if (piano.userData.points.includes(p)) return false;
		if (Math.abs(p.position.y - piano.position.y) > 0.0001) return false;
		return verPointInPoly(p, piano.userData.points);
	});
	return interni.map(p => puntiAggiunti.indexOf(p) + 1);
}

function aggiornaPiano(piano, addHistory = true) {
	const oldPoints    = [...piano.userData.points];
	const puntiAttuali = oldPoints.filter(p => puntiAggiunti.includes(p));
	let amdsRimossi    = [];

	if (puntiAttuali.length < 3) {
		scene.remove(piano);
		piano.userData.points = [];
		piani = piani.filter(f => f !== piano);
		if (addHistory) {
			amdsRimossi = aggiornaAMDs();
			history.push({ type: "floor-update-amd", floor: piano, oldPoints, newPoints: [], amdsRimossi });
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
	piano.geometry         = new THREE.ShapeGeometry(shape);
	piano.userData.points  = puntiAttuali;
	piano.position.y       = puntiAttuali[0].position.y;

	if (addHistory) {
		amdsRimossi = aggiornaAMDs();
		history.push({ type: "floor-update-amd", floor: piano, oldPoints, newPoints: [...puntiAttuali], amdsRimossi });
		redoStack = [];
	}
}

// AMD ---------------------------------------------------------------------------------------------
export function creaAMD(x, y, z, G, phi, addHistory = true) {
	const centro = new THREE.Vector3(y, z, x);
	let indicePiano = -1;

	for (let i = 0; i < piani.length; i++) {
		const piano = piani[i];
		if (Math.abs(centro.y - piano.position.y) > 0.0) continue;
		if (verPointInPoly({ position: centro }, piano.userData.points)) {
			indicePiano = i;
			break;
		}
	}

	if (indicePiano === -1) {
		alert("⚠ L'AMD non appartiene a nessun solaio!");
		return;
	}

	// Geometria box con bordi
	const geo  = new THREE.BoxGeometry(0.5, 0.5, 2);
	const mat  = new THREE.MeshBasicMaterial({ color: COLORS.Camds_f });
	const amd  = new THREE.Mesh(geo, mat);
	amd.userData.defaultColor = mat.color.clone();

	const edges     = new THREE.EdgesGeometry(geo);
	const wireframe = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: COLORS.Camds_c }));
	amd.add(wireframe);

	amd.position.copy(centro);
	amd.rotation.y        = phi;
	amd.userData.G        = G;
	amd.userData.floorIndex = indicePiano;
	amds.push(amd);

	if (addHistory) { history.push({ type: "amd-add", amd }); redoStack = []; }

	scene.add(amd);
	aggiornaAMDs();
	aggiornaListaAMDs();
}

// Controlla la validità di ogni AMD e rimuove quelli non più associati a un solaio.
export function aggiornaAMDs() {
	const daRimuovere = [];

	amds.forEach(amd => {
		let nuovoIndice = -1;
		for (let i = 0; i < piani.length; i++) {
			if (Math.abs(amd.position.y - piani[i].position.y) > 0.01) continue;
			if (verPointInPoly({ position: amd.position }, piani[i].userData.points)) {
				nuovoIndice = i;
				break;
			}
		}
		if (nuovoIndice === -1) {
			daRimuovere.push(amd);
		} else {
			amd.userData.floorIndex = nuovoIndice;
		}
	});

	daRimuovere.forEach(amd => { scene.remove(amd); amds = amds.filter(a => a !== amd); });
	return daRimuovere;
}

// CONSTRAINTS -------------------------------------------------------------------------------------
function vincolaSelezionati() {
	const sel = puntiAggiunti.filter(p => p.userData.selezionato);
	if (sel.length === 0) return;
	sel.forEach(p => {
		if (!p.userData.v) {
			p.userData.v = true;
			if (!p.userData.constraintMarker) {
				const croce = addConstraints();
				p.add(croce);
				p.userData.constraintMarker = croce;
			}
		}
	});
	history.push({ type: "vincola", points: sel });
	redoStack = [];
	aggiornaListaPunti();
	deselezioneTotale();
}

function svincolaSelezionati() {
	const sel = puntiAggiunti.filter(p => p.userData.selezionato);
	if (sel.length === 0) return;
	sel.forEach(p => {
		if (p.userData.v) {
			p.userData.v = false;
			if (p.userData.constraintMarker) {
				p.remove(p.userData.constraintMarker);
				p.userData.constraintMarker = null;
			}
		}
	});
	history.push({ type: "svincola", points: sel });
	redoStack = [];
	aggiornaListaPunti();
	deselezioneTotale();
}

document.getElementById("setFixedBtn").addEventListener("click", vincolaSelezionati);
document.getElementById("unsetFixedBtn").addEventListener("click", svincolaSelezionati);

// LOADS -------------------------------------------------------------------------------------------
function disegnaCaricoPunto(p, carico) {
	const { Fx, Fy, Fz, Mx, My, Mz, Mass } = carico;

	if (p.userData.frecciaForza)   p.remove(p.userData.frecciaForza);
	if (p.userData.frecciaMomento) p.remove(p.userData.frecciaMomento);
	if (p.userData.frecciaMassa)   p.remove(p.userData.frecciaMassa);

	const frecciaForza = addArrowFN(new THREE.Vector3(Fy, Fz, Fx));
	if (frecciaForza) { p.add(frecciaForza); p.userData.frecciaForza = frecciaForza; }

	const frecciaMomento = addArrowMN(new THREE.Vector3(My, Mz, Mx));
	if (frecciaMomento) { p.add(frecciaMomento); p.userData.frecciaMomento = frecciaMomento; }

	const frecciaMassa = addArrowPN(new THREE.Vector3(0, Mass, 0));
	if (frecciaMassa) { p.add(frecciaMassa); p.userData.frecciaMassa = frecciaMassa; }
}

function disegnaCaricoLinea(l, carico) {
	l.updateMatrixWorld(true);
	const { Fx, Fy, Fz, Mx, My, Mz, Mass } = carico;
	const L      = l.userData.lunghezza;
	const n      = Math.round(L * 2) - 1;
	const offset = L / (n + 1);
	const step   = (L - offset) / n;

	if (l.userData.frecciaForza)   l.remove(l.userData.frecciaForza);
	if (l.userData.frecciaMomento) l.remove(l.userData.frecciaMomento);
	if (l.userData.frecciaMassa)   l.remove(l.userData.frecciaMassa);

	const invMatrix = new THREE.Matrix4().copy(l.matrixWorld).invert();
	const invRot    = new THREE.Matrix3().setFromMatrix4(invMatrix);

	const F = new THREE.Vector3(Fy, Fz, Fx);						// Forza distribuita
	F.applyMatrix3(invRot);
	const gruppoForze = new THREE.Group();
	for (let i = 0; i < n; i++) {
		const freccia = addArrowFT(F);
		if (!freccia) continue;
		freccia.position.y = -(L / 2) + offset + i * step;
		gruppoForze.add(freccia);
	}
	if (F.length() !== 0) { l.add(gruppoForze); l.userData.frecciaForza = gruppoForze; }

	const M = new THREE.Vector3(My, Mz, Mx);						// Momento distribuito
	M.applyMatrix3(invRot);
	const gruppoMomenti = new THREE.Group();
	for (let i = 0; i < n; i++) {
		const freccia = addArrowMT(M);
		if (!freccia) continue;
		freccia.position.y = -(L / 2) + offset + i * step;
		gruppoMomenti.add(freccia);
	}
	if (M.length() !== 0) { l.add(gruppoMomenti); l.userData.frecciaMomento = gruppoMomenti; }

	const Mv = new THREE.Vector3(0, Mass, 0);						// Massa distribuita
	Mv.applyMatrix3(invRot);
	const gruppoMasse = new THREE.Group();
	for (let i = 0; i < n; i++) {
		const freccia = addArrowPT(Mv);
		if (!freccia) continue;
		freccia.position.y = -(L / 2) + offset + i * step;
		gruppoMasse.add(freccia);
	}
	if (Mv.length() !== 0) { l.add(gruppoMasse); l.userData.frecciaMassa = gruppoMasse; }
}

// Ridisegna tutti i carichi (usato al caricamento del modello).
function ripristinaCarichi() {
	puntiAggiunti.forEach(p => { if (p.userData.carico) disegnaCaricoPunto(p, p.userData.carico); });
	linee.forEach(l => { if (l.userData.carico) disegnaCaricoLinea(l, l.userData.carico); });
}

// Aggiunta carico
document.getElementById("apply-load").addEventListener("click", () => {
	const leggi = id => parseFloat(document.getElementById(id).value) || 0;
	const carico = {
		Fx: leggi("Fx-input"), Fy: leggi("Fy-input"), Fz: leggi("Fz-input"),
		Mx: leggi("Mx-input"), My: leggi("My-input"), Mz: leggi("Mz-input"),
		Mass: -Math.abs(leggi("Mass-input")),
	};

	const puntiSel = puntiAggiunti.filter(p => p.userData.selezionato);
	const lineeSel = linee.filter(l => l.userData.selezionato);

	if (puntiSel.length === 0 && lineeSel.length === 0) {
		alert("⚠ Nessun punto o linea selezionata");
		return;
	}

	puntiSel.forEach(p => { p.userData.carico = { ...carico }; disegnaCaricoPunto(p, carico); });
	lineeSel.forEach(l => { l.userData.carico = { ...carico }; disegnaCaricoLinea(l, carico); });
	deselezioneTotale();
});

// Eliminazione carico
document.getElementById("delete-load").addEventListener("click", () => {
	const vuoto = { Fx: 0, Fy: 0, Fz: 0, Mx: 0, My: 0, Mz: 0, Mass: 0 };
	const puntiSel = puntiAggiunti.filter(p => p.userData.selezionato);
	const lineeSel = linee.filter(l => l.userData.selezionato);

	if (puntiSel.length === 0 && lineeSel.length === 0) {
		alert("⚠ Nessun punto o linea selezionata");
		return;
	}

	puntiSel.forEach(p => { p.userData.carico = { ...vuoto }; disegnaCaricoPunto(p, vuoto); });
	lineeSel.forEach(l => { l.userData.carico = { ...vuoto }; disegnaCaricoLinea(l, vuoto); });
	deselezioneTotale();
});

// SELECTION
function aggiornaSelezionePunti() {
	puntiAggiunti.forEach(p => {
		p.material.color.set(p.userData.selezionato ? COLORS.CSpunto : p.userData.defaultColor);
	});
}
function aggiornaSelezioneLinee() {
	linee.forEach(l => {
		l.material.color.set(l.userData.selezionato ? COLORS.CSlinea : l.userData.defaultColor);
	});
}
function aggiornaSelezionePiani() {
	piani.forEach(f => {
		f.material.color.set(f.userData.selezionato ? COLORS.CSsolaio : f.userData.defaultColor);
	});
}
function aggiornaSelezioneAmd() {
	amds.forEach(a => {
		a.material.color.set(a.userData.selezionato ? COLORS.CSamds : a.userData.defaultColor);
	});
}

function resetFirstPoint() {
	if (firstPoint) { firstPoint.material.color.copy(firstPoint.userData.defaultColor); firstPoint = null; }
}
function resetFloorSelection() {
	floorPoints.forEach(p => { if (p.userData.defaultColor) p.material.color.copy(p.userData.defaultColor); });
	floorPoints = [];
}

export function deselezioneTotale() {
	puntiAggiunti.forEach(p => p.userData.selezionato = false); aggiornaSelezionePunti();
	linee.forEach(l => l.userData.selezionato = false);         aggiornaSelezioneLinee();
	piani.forEach(f => f.userData.selezionato = false);         aggiornaSelezionePiani();
	amds.forEach(a => a.userData.selezionato = false);          aggiornaSelezioneAmd();
	resetFirstPoint();
	resetFloorSelection();
}
function selezioneTotale() {
	if (lineMode || floorMode) return;
	puntiAggiunti.forEach(p => p.userData.selezionato = true); aggiornaSelezionePunti();
	linee.forEach(l => l.userData.selezionato = true);         aggiornaSelezioneLinee();
	piani.forEach(f => f.userData.selezionato = true);         aggiornaSelezionePiani();
	amds.forEach(a => a.userData.selezionato = true);          aggiornaSelezioneAmd();
}

// Pulsanti selezione / deselezione
document.getElementById("selectBtn").addEventListener("click", selezioneTotale);
document.getElementById("deselectBtn").addEventListener("click", deselezioneTotale);
window.addEventListener("keydown", e => { if (e.key === "Escape") deselezioneTotale(); });

// Filtri selezione
function setupToggle(buttonId, key, deselectFn) {
	document.getElementById(buttonId).addEventListener("click", function() {
		selectionFilters[key] = !selectionFilters[key];
		this.classList.toggle("active",   selectionFilters[key]);
		this.classList.toggle("disabled", !selectionFilters[key]);
		if (!selectionFilters[key]) deselectFn();
	});
}
setupToggle("togglePoints", "points", () => { puntiAggiunti.forEach(p => p.userData.selezionato = false); aggiornaSelezionePunti(); });
setupToggle("toggleLines",  "lines",  () => { linee.forEach(l => l.userData.selezionato = false); aggiornaSelezioneLinee(); });
setupToggle("toggleFloors", "floors", () => { piani.forEach(f => f.userData.selezionato = false); aggiornaSelezionePiani(); });
setupToggle("toggleAmds",   "amds",   () => { amds.forEach(a => a.userData.selezionato = false); aggiornaSelezioneAmd(); });

// Selezione singola (clic)
function selezioneSingolo(event) {
	mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
	mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
	raycaster.setFromCamera(mouse, camera);

	const hitPunti  = selectionFilters.points ? raycaster.intersectObjects(puntiAggiunti) : [];
	const hitLinee  = selectionFilters.lines  ? raycaster.intersectObjects(linee)         : [];
	const hitPiani  = selectionFilters.floors ? raycaster.intersectObjects(piani)         : [];
	const hitAmds   = selectionFilters.amds   ? raycaster.intersectObjects(amds)          : [];

	if (hitPunti.length > 0) {
		const sel = hitPunti[0].object;

		if (lineMode) {
			if (!firstPoint) {
				// Primo nodo: lo evidenziamo
				firstPoint = sel;
				sel.material.color.set(COLORS.CmodL);
			} else {
				// Secondo nodo: crea la linea
				if (sel === firstPoint) return;
				const lineaEsiste = linee.some(l =>
					(l.userData.p1 === firstPoint && l.userData.p2 === sel) ||
					(l.userData.p1 === sel && l.userData.p2 === firstPoint)
				);
				if (lineaEsiste) return;

				const line = addFrame(firstPoint.position, sel.position);
				line.userData.p1        = firstPoint;
				line.userData.p2        = sel;
				line.userData.materiale = selectedMaterial;
				line.userData.sezione   = selectedSection;
				line.userData.lunghezza = firstPoint.position.distanceTo(sel.position);
				const assi = calcLocalAxes(firstPoint.position, sel.position);
				line.userData.l = assi.l; line.userData.n = assi.n; line.userData.m = assi.m;

				// Copia proprietà fisiche dalla sezione e dal materiale attivi
				const sez = sezioni[selectedSection]  || {};
				const mat = materiali[selectedMaterial] || {};
				Object.assign(line.userData, { E: mat.E, G: mat.G, Im: sez.Im, In: sez.In, ASm: sez.ASm, ASn: sez.ASn });

				scene.add(line);
				linee.push(line);
				aggiornaListaLinee();
				history.push({ type: "line-add", line });
				redoStack = [];

				// Il primo nodo diventa il nodo appena cliccato (disegno continuo)
				firstPoint.material.color.copy(firstPoint.userData.defaultColor);
				firstPoint = sel;
				firstPoint.material.color.set(COLORS.CmodL);
			}

		} else if (floorMode) {
			if (floorPoints.includes(sel)) {
				floorPoints = floorPoints.filter(p => p !== sel);
				sel.material.color.copy(sel.userData.defaultColor);
			} else {
				const yRef = floorPoints[0]?.position.y;
				if (floorPoints.length === 0 || Math.abs(sel.position.y - yRef) < 0.01) {
					floorPoints.push(sel);
					sel.material.color.set(COLORS.CmodP);
				}
			}

		} else {
			sel.userData.selezionato = !sel.userData.selezionato;
			aggiornaSelezionePunti();
		}

	} else if (hitLinee.length > 0 && !lineMode && !floorMode) {
		const sel = hitLinee[0].object;
		sel.userData.selezionato = !sel.userData.selezionato;
		aggiornaSelezioneLinee();

	} else if (hitPiani.length > 0 && !lineMode && !floorMode) {
		const sel = hitPiani[0].object;
		sel.userData.selezionato = !sel.userData.selezionato;
		aggiornaSelezionePiani();

	} else if (hitAmds.length > 0 && !lineMode && !floorMode) {
		const sel = hitAmds[0].object;
		sel.userData.selezionato = !sel.userData.selezionato;
		aggiornaSelezioneAmd();
	}
}

// Selezione a finestra (drag)
function selezioneFinestra(start, end, isShift) {
	const xMin = Math.min(start.x, end.x);
	const xMax = Math.max(start.x, end.x);
	const yMin = Math.min(start.y, end.y);
	const yMax = Math.max(start.y, end.y);

	function inFinestra(obj) {
		const v = obj.position.clone().project(camera);
		const sx = (v.x + 1) / 2 * window.innerWidth;
		const sy = (-v.y + 1) / 2 * window.innerHeight;
		return sx >= xMin && sx <= xMax && sy >= yMin && sy <= yMax;
	}

	if (selectionFilters.points) {
		puntiAggiunti.forEach(p => { if (inFinestra(p)) p.userData.selezionato = !isShift; });
		aggiornaSelezionePunti();
	}
	if (selectionFilters.lines) {
		linee.forEach(l => { if (inFinestra(l)) l.userData.selezionato = !isShift; });
		aggiornaSelezioneLinee();
	}
	if (selectionFilters.floors) {
		piani.forEach(f => {
			const box = new THREE.Box3().setFromObject(f);
			if (box.isEmpty()) return;
			const corners = [
				new THREE.Vector3(box.min.x, box.min.y, box.min.z),
				new THREE.Vector3(box.min.x, box.min.y, box.max.z),
				new THREE.Vector3(box.max.x, box.max.y, box.min.z),
				new THREE.Vector3(box.max.x, box.max.y, box.max.z),
			];
			const colpito = corners.some(c => {
				c.project(camera);
				const sx = (c.x + 1) / 2 * window.innerWidth;
				const sy = (-c.y + 1) / 2 * window.innerHeight;
				return sx >= xMin && sx <= xMax && sy >= yMin && sy <= yMax;
			});
			if (colpito) f.userData.selezionato = !isShift;
		});
		aggiornaSelezionePiani();
	}
	if (selectionFilters.amds) {
		amds.forEach(a => { if (inFinestra(a)) a.userData.selezionato = !isShift; });
		aggiornaSelezioneAmd();
	}
}

// Mouse events per selezione
renderer.domElement.addEventListener("mousedown", e => {
	if (e.button !== 0) return;
	isDragging = true;
	dragStart  = { x: e.clientX, y: e.clientY };
	selectionBoxDiv.style.cssText += `;left:${dragStart.x}px;top:${dragStart.y}px;width:0px;height:0px;display:block`;
});

renderer.domElement.addEventListener("mousemove", e => {
	if (!isDragging) return;
	dragEnd = { x: e.clientX, y: e.clientY };
	const x = Math.min(dragStart.x, dragEnd.x);
	const y = Math.min(dragStart.y, dragEnd.y);
	const w = Math.abs(dragStart.x - dragEnd.x);
	const h = Math.abs(dragStart.y - dragEnd.y);
	selectionBoxDiv.style.left   = x + "px";
	selectionBoxDiv.style.top    = y + "px";
	selectionBoxDiv.style.width  = w + "px";
	selectionBoxDiv.style.height = h + "px";
});

renderer.domElement.addEventListener("mouseup", e => {
	if (!isDragging) return;
	isDragging = false;
	selectionBoxDiv.style.display = "none";
	dragEnd = { x: e.clientX, y: e.clientY };
	const dist = Math.hypot(dragEnd.x - dragStart.x, dragEnd.y - dragStart.y);
	if (dist < 5) {
		selezioneSingolo(e);
	} else if (!lineMode && !floorMode) {
		selezioneFinestra(dragStart, dragEnd, e.shiftKey);
	}
});


// ELEMENTS ----------------------------------------------------------------------------------------
// Aggiunta punto
document.getElementById("add-point").addEventListener("click", () => {
	const x = parseFloat(document.getElementById("x-input").value) || 0;
	const y = parseFloat(document.getElementById("y-input").value) || 0;
	const z = parseFloat(document.getElementById("z-input").value) || 0;

	const esiste = puntiAggiunti.some(p =>
		Math.abs(p.position.x - y) < 0.01 &&
		Math.abs(p.position.y - z) < 0.01 &&
		Math.abs(p.position.z - x) < 0.01
	);
	if (esiste) return;

	const sphere = new THREE.Mesh(SPHERE_GEO, SPHERE_MAT.clone());
	sphere.userData.defaultColor = SPHERE_MAT.color.clone();
	sphere.userData.carico       = { Fx: 0, Fy: 0, Fz: 0, Mx: 0, My: 0, Mz: 0, Mass: 0 };
	sphere.position.set(y, z, x);

	scene.add(sphere);
	puntiAggiunti.push(sphere);
	aggiornaListaPunti();
	aggiornaListaPiani();
	history.push({ type: "add", point: sphere });
	redoStack = [];
});

// Aggiunta piano
document.getElementById("createFloorBtn").addEventListener("click", () => {
	if (floorPoints.length < 3) return;
	if (verPolyIntersect(floorPoints)) {
		alert("⚠ Ordine dei punti non valido: i lati del solaio si incrociano!");
		deselezioneTotale();
		return;
	}
	const piano = addFloor(floorPoints);
	if (!piano) return;
	scene.add(piano);
	piani.push(piano);
	floorPoints.forEach(p => p.material.color.copy(p.userData.defaultColor));
	floorPoints = [];
	history.push({ type: "floor-add", floor: piano });
	redoStack = [];
	aggiornaListaPiani();
});

// Aggiunta AMD
document.getElementById("add-amd").addEventListener("click", () => {
	const x   = parseFloat(document.getElementById("x-input_amd").value) || 0;
	const y   = parseFloat(document.getElementById("y-input_amd").value) || 0;
	const z   = parseFloat(document.getElementById("z-input_amd").value) || 0;
	let G     = parseFloat(document.getElementById("G-input_amd").value) || 10;
	if (G < 10) { G = 10; document.getElementById("G-input_amd").value = 10; }
	const phi = (parseFloat(document.getElementById("φ-input_amd").value) || 0) * Math.PI / 180;
	creaAMD(x, y, z, G, phi);
});

// DELETE ------------------------------------------------------------------------------------------
function eliminaSelezionati() {
	const puntiDaRimuovere   = puntiAggiunti.filter(p => p.userData.selezionato);
	const lineeDirette        = linee.filter(l => l.userData.selezionato);
	const pianiDaRimuovere   = piani.filter(f => f.userData.selezionato);
	const amdsDaRimuovere    = amds.filter(a => a.userData.selezionato);

	// Linee collegate ai punti da rimuovere
	const lineeColl = linee.filter(l =>
		puntiDaRimuovere.includes(l.userData.p1) || puntiDaRimuovere.includes(l.userData.p2)
	);
	const lineeDaRimuovere = [...new Set([...lineeDirette, ...lineeColl])];

	// Piani da aggiornare (perdono punti ma non vengono eliminati direttamente)
	const pianiDaAggiornare = piani.filter(piano =>
		!pianiDaRimuovere.includes(piano) &&
		piano.userData.points.some(pt => puntiDaRimuovere.includes(pt))
	);

	// Salva oldPoints prima delle modifiche
	const statiAggiornamento = pianiDaAggiornare.map(f => ({ floor: f, oldPoints: [...f.userData.points] }));
	const statiRimozione     = pianiDaRimuovere.map(f => ({ floor: f, oldPoints: [...f.userData.points] }));

	// Rimozione dalla scena
	lineeDaRimuovere.forEach(l => scene.remove(l));
	puntiDaRimuovere.forEach(p => scene.remove(p));
	pianiDaRimuovere.forEach(f => scene.remove(f));
	amdsDaRimuovere.forEach(a => scene.remove(a));

	linee         = linee.filter(l => !lineeDaRimuovere.includes(l));
	puntiAggiunti = puntiAggiunti.filter(p => !puntiDaRimuovere.includes(p));
	piani         = piani.filter(f => !pianiDaRimuovere.includes(f));
	amds          = amds.filter(a => !amdsDaRimuovere.includes(a));

	pianiDaAggiornare.forEach(piano => aggiornaPiano(piano, false));
	const amdsRimossiAggiornamento = aggiornaAMDs();

	history.push({
		type:   "delete-group",
		points: puntiDaRimuovere,
		lines:  lineeDaRimuovere,
		amds:   [...amdsDaRimuovere, ...amdsRimossiAggiornamento],
		floors: [
			...statiAggiornamento.map(s => ({ floor: s.floor, oldPoints: s.oldPoints, newPoints: [...s.floor.userData.points] })),
			...statiRimozione.map(s => ({ floor: s.floor, oldPoints: s.oldPoints, newPoints: [] })),
		],
	});
	redoStack = [];

	aggiornaListaPunti(); aggiornaListaLinee(); aggiornaListaPiani(); aggiornaAMDs(); aggiornaListaAMDs();
}

document.getElementById("deleteBtn").addEventListener("click", eliminaSelezionati);
window.addEventListener("keydown", e => { if (e.key === "Delete") eliminaSelezionati(); });

// LINE / FLOOR / POINT MODE -----------------------------------------------------------------------
document.querySelectorAll(".tab").forEach(tab => {
	tab.addEventListener("click", () => {
		switch (tab.dataset.target) {
			case "tab-linee":
				lineMode = true; floorMode = false;
				deselezioneTotale(); floorPoints = [];
				break;
			case "tab-solai":
				floorMode = true; lineMode = false;
				deselezioneTotale(); firstPoint = null; floorPoints = [];
				break;
			default:
				lineMode = false; floorMode = false;
				resetFirstPoint(); resetFloorSelection();
		}
	});
});

// SECTIONS / MATERIALS MENU -----------------------------------------------------------------------
function toggleDropdown(container) {
	document.querySelectorAll(".menu-container").forEach(other => {
		if (other !== container) other.querySelector(".dropdown-list").style.display = "none";
	});
	const list = container.querySelector(".dropdown-list");
	list.style.display = list.style.display === "block" ? "none" : "block";
}

function selectItem(container, name) {
	container.querySelector(".dropdown-btn").innerText = name;
	container.querySelector(".dropdown-list").style.display = "none";
	if (container.querySelector("span").innerText.includes("Mat")) selectedMaterial = name;
	if (container.querySelector("span").innerText.includes("Sez")) selectedSection = name;
}

function rebuildSectionMenu() {
	const container = [...document.querySelectorAll(".menu-container")]
		.find(c => c.querySelector("span").innerText.includes("Sez"));
	if (!container) return;
	const list = container.querySelector(".dropdown-list");
	[...list.children].forEach(c => { if (!c.classList.contains("new-btn")) c.remove(); });
	Object.keys(sezioni).forEach(nome => {
		const item = document.createElement("div");
		item.innerText = nome;
		item.addEventListener("click", () => selectItem(container, nome));
		list.insertBefore(item, list.querySelector(".new-btn"));
	});
	const names = Object.keys(sezioni);
	if (names.length > 0) { selectedSection = names[0]; container.querySelector(".dropdown-btn").innerText = selectedSection; }
}

function rebuildMaterialMenu() {
	const container = [...document.querySelectorAll(".menu-container")]
		.find(c => c.querySelector("span").innerText.includes("Mat"));
	if (!container) return;
	const list = container.querySelector(".dropdown-list");
	[...list.children].forEach(c => { if (!c.classList.contains("new-btn")) c.remove(); });
	Object.keys(materiali).forEach(nome => {
		const item = document.createElement("div");
		item.innerText = nome;
		item.addEventListener("click", () => selectItem(container, nome));
		list.insertBefore(item, list.querySelector(".new-btn"));
	});
	const names = Object.keys(materiali);
	if (names.length > 0) { selectedMaterial = names[0]; container.querySelector(".dropdown-btn").innerText = selectedMaterial; }
}

// Modal sezione
const secNome = document.getElementById("secNome");
const secH    = document.getElementById("secH");
const secB    = document.getElementById("secB");
const secPreview = document.getElementById("secPreview");

function updatePreview() {
	const H = parseFloat(secH.value) || 0;
	const B = parseFloat(secB.value) || 0;
	const s = CALCULATE_SECTION(H, B);
	secPreview.innerHTML = `
		A   [m²] = ${s.A.toFixed(4)}<br>
		Il  [m⁴] = ${s.Il.toExponential(3)}<br>
		In  [m⁴] = ${s.In.toExponential(3)}<br>
		Im  [m⁴] = ${s.Im.toExponential(3)}<br>
		ASm [m²] = ${s.ASm.toFixed(4)}<br>
		ASn [m²] = ${s.ASn.toFixed(4)}
	`;
}
secH.addEventListener("input", updatePreview);
secB.addEventListener("input", updatePreview);

function openSectionPopup(container) {
	document.querySelectorAll(".dropdown-list").forEach(d => d.style.display = "none");
	secModalContainer = container;
	secNome.value = ""; secH.value = ""; secB.value = ""; secPreview.innerHTML = "";
	document.getElementById("SectionPopup").classList.remove("hidden");
	updatePreview();
}
function closeSectionPopup() { document.getElementById("SectionPopup").classList.add("hidden"); }

document.getElementById("secCancel").addEventListener("click", closeSectionPopup);
document.getElementById("secSave").addEventListener("click", () => {
	const nome = secNome.value.trim();
	const H    = parseFloat(secH.value);
	const B    = parseFloat(secB.value);
	if (!nome || isNaN(H) || isNaN(B)) { alert("⚠ Compila tutti i campi"); return; }
	if (H <= 0 || B <= 0)              { alert("⚠ H e B devono essere maggiori di zero"); return; }
	if (sezioni[nome])                 { alert("⚠ Esiste già una sezione con questo nome"); return; }

	sezioni[nome] = CALCULATE_SECTION(H, B);
	const item = document.createElement("div");
	item.innerText = nome;
	item.addEventListener("click", () => selectItem(secModalContainer, nome));
	secModalContainer.querySelector(".dropdown-list")
		.insertBefore(item, secModalContainer.querySelector(".new-btn"));

	selectedSection = nome;
	secModalContainer.querySelector(".dropdown-btn").innerText = nome;
	closeSectionPopup();
});

// Modal materiale
const matNome = document.getElementById("matNome");
const matRho  = document.getElementById("matRho");
const matE    = document.getElementById("matE");
const matG    = document.getElementById("matG");

function openMaterialPopup(container) {
	document.querySelectorAll(".dropdown-list").forEach(d => d.style.display = "none");
	matModalContainer = container;
	matNome.value = ""; matRho.value = ""; matE.value = ""; matG.value = "";
	document.getElementById("MaterialPopup").classList.remove("hidden");
}
function closeMaterialPopup() { document.getElementById("MaterialPopup").classList.add("hidden"); }

document.getElementById("matCancel").addEventListener("click", closeMaterialPopup);
document.getElementById("matSave").addEventListener("click", () => {
	const nome = matNome.value.trim();
	const Rho  = parseFloat(matRho.value);
	const E    = parseFloat(matE.value);
	const G    = parseFloat(matG.value);
	if (!nome || isNaN(Rho) || isNaN(E) || isNaN(G)) { alert("⚠ Compila tutti i campi"); return; }
	if (Rho <= 0 || E <= 0 || G <= 0)                { alert("⚠ ρ, E e G devono essere > 0"); return; }
	if (materiali[nome])                              { alert("⚠ Materiale già esistente"); return; }

	materiali[nome] = { Rho, E, G };
	rebuildMaterialMenu();
	selectedMaterial = nome;
	matModalContainer.querySelector(".dropdown-btn").innerText = nome;
	closeMaterialPopup();
});

// Chiusura modal con ESC
document.addEventListener("keydown", e => {
	if (e.key !== "Escape") return;
	if (!document.getElementById("SectionPopup").classList.contains("hidden"))  closeSectionPopup();
	if (!document.getElementById("MaterialPopup").classList.contains("hidden")) closeMaterialPopup();
});

// Archivio sezioni
const secLibraryModal  = document.getElementById("sectionLibraryPopup");
const secTabsContainer = document.getElementById("sectionTabs");
const secListContainer = document.getElementById("sectionLibraryList");

function openSectionLibrary() {
	secTabsContainer.innerHTML = ""; secListContainer.innerHTML = "";
	Object.keys(SECTIONS_ARCHIVE).forEach((cat, i) => {
		const btn = document.createElement("button");
		btn.innerText = cat;
		btn.addEventListener("click", () => {
			secTabsContainer.querySelectorAll("button").forEach(b => b.classList.remove("active"));
			btn.classList.add("active");
			mostraSezioniCategoria(cat);
		});
		if (i === 0) { btn.classList.add("active"); mostraSezioniCategoria(cat); }
		secTabsContainer.appendChild(btn);
	});
	secLibraryModal.classList.remove("hidden");
}
function mostraSezioniCategoria(cat) {
	secListContainer.innerHTML = "";
	Object.entries(SECTIONS_ARCHIVE[cat]).forEach(([nome, props]) => {
		const div = document.createElement("div");
		div.innerText = nome;
		div.addEventListener("click", () => {
			sezioni[nome] = props;
			rebuildSectionMenu();
			selectedSection = nome;
			secModalContainer.querySelector(".dropdown-btn").innerText = nome;
			secLibraryModal.classList.add("hidden");
			closeSectionPopup();
		});
		secListContainer.appendChild(div);
	});
}
document.getElementById("secLibraryBtn").addEventListener("click", openSectionLibrary);
document.getElementById("secLibraryClose").addEventListener("click", () => secLibraryModal.classList.add("hidden"));

// Archivio materiali
const matLibraryModal  = document.getElementById("materialLibraryPopup");
const matTabsContainer = document.getElementById("materialTabs");
const matListContainer = document.getElementById("materialLibraryList");

function openMaterialLibrary() {
	matTabsContainer.innerHTML = ""; matListContainer.innerHTML = "";
	Object.keys(MATERIALS_ARCHIVE).forEach((cat, i) => {
		const btn = document.createElement("button");
		btn.innerText = cat;
		btn.addEventListener("click", () => {
			matTabsContainer.querySelectorAll("button").forEach(b => b.classList.remove("active"));
			btn.classList.add("active");
			mostraMaterialiCategoria(cat);
		});
		if (i === 0) { btn.classList.add("active"); mostraMaterialiCategoria(cat); }
		matTabsContainer.appendChild(btn);
	});
	matLibraryModal.classList.remove("hidden");
}
function mostraMaterialiCategoria(cat) {
	matListContainer.innerHTML = "";
	Object.entries(MATERIALS_ARCHIVE[cat]).forEach(([nome, props]) => {
		const div = document.createElement("div");
		div.innerText = nome;
		div.addEventListener("click", () => {
			materiali[nome] = props;
			rebuildMaterialMenu();
			selectedMaterial = nome;
			matModalContainer.querySelector(".dropdown-btn").innerText = nome;
			matLibraryModal.classList.add("hidden");
			closeMaterialPopup();
		});
		matListContainer.appendChild(div);
	});
}
document.getElementById("matLibraryBtn").addEventListener("click", openMaterialLibrary);
document.getElementById("matLibraryClose").addEventListener("click", () => matLibraryModal.classList.add("hidden"));

// Setup dropdown al caricamento
document.addEventListener("DOMContentLoaded", () => {
	document.querySelectorAll(".menu-container").forEach(container => {
		container.querySelector(".dropdown-btn").addEventListener("click", () => toggleDropdown(container));
		container.querySelectorAll(".dropdown-list div:not(.new-btn)").forEach(item => {
			item.addEventListener("click", () => selectItem(container, item.innerText));
		});
		container.querySelector(".new-btn").addEventListener("click", () => {
			if (container.querySelector("span").innerText.includes("Sez")) openSectionPopup(container);
			else openMaterialPopup(container);
		});
	});
});
window.addEventListener("click", e => {
	if (!e.target.closest(".menu-container")) {
		document.querySelectorAll(".dropdown-list").forEach(d => d.style.display = "none");
	}
});

// UNDO / REDO -------------------------------------------------------------------------------------
function ricostruisciGeometriaPiano(piano, puntiList) {
	const shape = new THREE.Shape();
	shape.moveTo(puntiList[0].position.x, puntiList[0].position.z);
	for (let i = 1; i < puntiList.length; i++) {
		shape.lineTo(puntiList[i].position.x, puntiList[i].position.z);
	}
	shape.lineTo(puntiList[0].position.x, puntiList[0].position.z);
	piano.geometry.dispose();
	piano.geometry        = new THREE.ShapeGeometry(shape);
	piano.userData.points = [...puntiList];
	piano.position.y      = puntiList[0].position.y;
}

function undo() {
	if (history.length === 0) return;
	const action = history.pop();
	redoStack.push(action);

	switch (action.type) {
		case "add":
			scene.remove(action.point);
			puntiAggiunti = puntiAggiunti.filter(p => p !== action.point);
			break;

		case "line-add":
			scene.remove(action.line);
			linee = linee.filter(l => l !== action.line);
			break;

		case "amd-add":
			scene.remove(action.amd);
			amds = amds.filter(a => a !== action.amd);
			break;

		case "delete-group":
			action.points.forEach(p => { scene.add(p); puntiAggiunti.push(p); });
			action.lines.forEach(l => { scene.add(l); linee.push(l); });
			action.amds.forEach(a => { scene.add(a); amds.push(a); });
			action.floors.forEach(f => {
				if (!piani.includes(f.floor)) { scene.add(f.floor); piani.push(f.floor); }
				ricostruisciGeometriaPiano(f.floor, f.oldPoints);
			});
			break;

		case "vincola":
			action.points.forEach(p => {
				p.userData.v = false;
				if (p.userData.constraintMarker) { p.remove(p.userData.constraintMarker); p.userData.constraintMarker = null; }
			});
			break;

		case "svincola":
			action.points.forEach(p => {
				p.userData.v = true;
				if (!p.userData.constraintMarker) {
					const croce = addConstraints(); p.add(croce); p.userData.constraintMarker = croce;
				}
			});
			break;

		case "floor-add":
			scene.remove(action.floor);
			piani = piani.filter(f => f !== action.floor);
			break;

		case "floor-delete":
			action.floors.forEach(f => { scene.add(f); piani.push(f); });
			break;

		case "floor-update-amd":
			if (!piani.includes(action.floor)) { scene.add(action.floor); piani.push(action.floor); }
			ricostruisciGeometriaPiano(action.floor, action.oldPoints);
			action.amdsRimossi.forEach(a => { scene.add(a); amds.push(a); });
			break;
	}

	aggiornaListaPunti(); aggiornaListaLinee(); aggiornaListaPiani(); aggiornaAMDs(); aggiornaListaAMDs();
}

function redo() {
	if (redoStack.length === 0) return;
	const action = redoStack.pop();
	history.push(action);

	switch (action.type) {
		case "add":
			scene.add(action.point); puntiAggiunti.push(action.point); break;

		case "line-add":
			scene.add(action.line); linee.push(action.line); break;

		case "amd-add":
			scene.add(action.amd); amds.push(action.amd); break;

		case "delete-group":
			action.points.forEach(p => { scene.remove(p); puntiAggiunti = puntiAggiunti.filter(pt => pt !== p); });
			action.lines.forEach(l => { scene.remove(l); linee = linee.filter(li => li !== l); });
			action.amds.forEach(a => { scene.remove(a); amds = amds.filter(am => am !== a); });
			action.floors.forEach(f => {
				if (!f.newPoints || f.newPoints.length < 3) {
					scene.remove(f.floor); piani = piani.filter(pi => pi !== f.floor);
				} else {
					ricostruisciGeometriaPiano(f.floor, f.newPoints);
					if (!piani.includes(f.floor)) { scene.add(f.floor); piani.push(f.floor); }
				}
			});
			break;

		case "vincola":
			action.points.forEach(p => {
				p.userData.v = true;
				if (!p.userData.constraintMarker) {
					const croce = addConstraints(); p.add(croce); p.userData.constraintMarker = croce;
				}
			});
			break;

		case "svincola":
			action.points.forEach(p => {
				p.userData.v = false;
				if (p.userData.constraintMarker) { p.remove(p.userData.constraintMarker); p.userData.constraintMarker = null; }
			});
			break;

		case "floor-add":
			scene.add(action.floor); piani.push(action.floor); break;

		case "floor-delete":
			action.floors.forEach(f => { scene.remove(f); piani = piani.filter(p => p !== f); });
			break;

		case "floor-update-amd": {
			const np = action.newPoints;
			if (np.length >= 3) {
				ricostruisciGeometriaPiano(action.floor, np);
				if (!piani.includes(action.floor)) { scene.add(action.floor); piani.push(action.floor); }
			} else {
				scene.remove(action.floor); piani = piani.filter(f => f !== action.floor);
			}
			action.amdsRimossi.forEach(a => { scene.remove(a); amds = amds.filter(am => am !== a); });
			break;
		}
	}

	aggiornaListaPunti(); aggiornaListaLinee(); aggiornaListaPiani(); aggiornaAMDs(); aggiornaListaAMDs();
}

document.addEventListener("DOMContentLoaded", () => {
	document.getElementById("undoBtn")?.addEventListener("click", undo);
	document.getElementById("redoBtn")?.addEventListener("click", redo);
});
window.addEventListener("keydown", e => {
	if (e.ctrlKey && e.key === "z" && !e.shiftKey) { undo(); e.preventDefault(); resetFirstPoint(); resetFloorSelection(); }
	if (e.ctrlKey && e.shiftKey && e.key === "Z")  { redo(); e.preventDefault(); resetFirstPoint(); resetFloorSelection(); }
});

// SAVE / LOAD / RESET -----------------------------------------------------------------------------
// Costruisce il JSON completo del modello.
function costruisciModelloJSON() {
	return {
		points: puntiAggiunti.map(p => ({
			x: p.position.z, y: p.position.x, z: p.position.y,
			ux: !!p.userData.v, uy: !!p.userData.v, uz: !!p.userData.v,
			rx: !!p.userData.v, ry: !!p.userData.v, rz: !!p.userData.v,
			load: p.userData.carico ?? null,
		})),
		lines: linee.map(l => {
			const sez = sezioni[l.userData.sezione]   || {};
			const mat = materiali[l.userData.materiale] || {};
			return {
				p1: puntiAggiunti.indexOf(l.userData.p1), p2: puntiAggiunti.indexOf(l.userData.p2),
				lunghezza: l.userData.lunghezza, l: l.userData.l, m: l.userData.m, n: l.userData.n,
				materiale: l.userData.materiale, sezione: l.userData.sezione,
				Rho: mat.Rho, E: mat.E, G: mat.G,
				H: sez.H, B: sez.B, A: sez.A, Il: sez.Il, In: sez.In, Im: sez.Im, ASm: sez.ASm, ASn: sez.ASn,
				load: l.userData.carico ?? null,
			};
		}),
		floors: piani.map(f => ({
			points: f.userData.points.map(pt => puntiAggiunti.indexOf(pt)),
			intern: trovaPuntiInterniAlPiano(f).map(i => i - 1),
		})),
		amds: amds.map(a => ({
			x: a.position.z, y: a.position.x, z: a.position.y,
			phi: a.rotation.y, G: a.userData.G, floorIndex: a.userData.floorIndex,
		})),
		sezioni: Object.entries(sezioni).map(([nome, s]) => ({ nome, ...s })),
		materiali: Object.entries(materiali).map(([nome, m]) => ({ nome, ...m })),
	};
}

// Pulisce la scena e le liste.
function svuotaScena() {
	[...puntiAggiunti, ...linee, ...piani, ...amds].forEach(o => scene.remove(o));
	puntiAggiunti = []; linee = []; piani = []; amds = [];
}

// Ricostruisce il modello da un oggetto JSON.
export function apriModello(jsonData, fileName) {
	history = []; redoStack = [];
	if (fileName) document.getElementById("nomeFile").value = fileName.replace(/\.[^/.]+$/, "");

	camera.position.copy(initCamPos);
	controls.target.copy(initTarPos);
	controls.update();

	svuotaScena();
	sezioni   = {};
	materiali = {};

	// Punti
	jsonData.points.forEach(p => {
		const sphere = new THREE.Mesh(SPHERE_GEO, SPHERE_MAT.clone());
		sphere.userData.defaultColor = SPHERE_MAT.color.clone();
		sphere.position.set(p.y, p.z, p.x);
		if (p.ux) {
			sphere.userData.v = true;
			const croce = addConstraints(); sphere.add(croce); sphere.userData.constraintMarker = croce;
		}
		if (p.load) sphere.userData.carico = p.load;
		scene.add(sphere); puntiAggiunti.push(sphere);
	});

	// Linee
	jsonData.lines.forEach(l => {
		const p1   = puntiAggiunti[l.p1];
		const p2   = puntiAggiunti[l.p2];
		const line = addFrame(p1.position, p2.position);
		Object.assign(line.userData, {
			p1, p2, lunghezza: l.lunghezza, l: l.l, m: l.m, n: l.n,
			materiale: l.materiale, sezione: l.sezione,
			E: l.E, G: l.G, Im: l.Im, In: l.In, ASm: l.ASm, ASn: l.ASn,
		});
		if (l.load) line.userData.carico = l.load;
		scene.add(line); linee.push(line);
	});

	// Piani
	jsonData.floors.forEach(f => {
		const pts   = f.points.map(i => puntiAggiunti[i]);
		const piano = addFloor(pts);
		if (piano) { scene.add(piano); piani.push(piano); }
	});

	// AMD
	jsonData.amds.forEach(a => creaAMD(a.x, a.y, a.z, a.G, a.phi, false));

	// Sezioni
	jsonData.sezioni.forEach(s => { sezioni[s.nome] = { H: s.H, B: s.B, A: s.A, Il: s.Il, In: s.In, Im: s.Im, ASm: s.ASm, ASn: s.ASn }; });

	// Materiali
	jsonData.materiali.forEach(m => { materiali[m.nome] = { Rho: m.Rho, E: m.E, G: m.G }; });

	aggiornaListaPunti(); aggiornaListaLinee(); aggiornaListaPiani(); aggiornaAMDs(); aggiornaListaAMDs();
	rebuildSectionMenu(); rebuildMaterialMenu();
	ripristinaCarichi();
}

function resetPagina() {
	camera.position.copy(initCamPos);
	controls.target.copy(initTarPos);
	controls.update();
	svuotaScena();
	document.getElementById("nomeFile").value = "";
	history = []; redoStack = [];
	sezioni   = { ...DEFAULT_SECTIONS };
	materiali = { ...DEFAULT_MATERIALS };
	selectedSection  = "PIL_30x30";
	selectedMaterial = "C25/30";
	aggiornaListaPunti(); aggiornaListaLinee(); aggiornaListaPiani(); aggiornaAMDs(); aggiornaListaAMDs();
	rebuildSectionMenu(); rebuildMaterialMenu();
	ripristinaCarichi();
	sessionStorage.removeItem("modelloStruttura");
}

document.getElementById("resetALL").addEventListener("click", resetPagina);

// Salvataggio su file
document.getElementById("saveModel").addEventListener("click", () => {
	const nomeFile = document.getElementById("nomeFile").value || "Senza nome";
	const modello  = costruisciModelloJSON();
	sessionStorage.setItem("modelloStruttura", JSON.stringify({ nomeFile, modello }));
	const blob = new Blob([JSON.stringify({ nomeFile, modello, analisiPreliminare: null, analisiModale: null }, null, 2)], { type: "application/json" });
	const url  = URL.createObjectURL(blob);
	const a    = Object.assign(document.createElement("a"), { href: url, download: `${nomeFile}.stc` });
	a.click(); URL.revokeObjectURL(url);
});

// Caricamento da file
document.getElementById("loadModelBtn").addEventListener("click", () => document.getElementById("loadModel").click());
document.getElementById("loadModel").addEventListener("change", function(e) {
	const file   = e.target.files[0];
	const reader = new FileReader();
	reader.onload = function() {
		const json = JSON.parse(reader.result);
		sessionStorage.setItem("modelloStruttura", JSON.stringify({ nomeFile: json.nomeFile, modello: json.modello }));
		if (json.analisiPreliminare) {
			sessionStorage.setItem("risultatoAnalisi", JSON.stringify(json.analisiPreliminare));
			if (json.analisiModale) sessionStorage.setItem("analisiModaleCompleta", JSON.stringify(json.analisiModale));
			else sessionStorage.removeItem("analisiModaleCompleta");
			window.location.href = "analysis";						// analysis.html
			return;
		}
		apriModello(json.modello, json.nomeFile);
	};
	reader.readAsText(file);
	this.value = "";
});

// Ripristino modello dalla sessione al caricamento
document.addEventListener("DOMContentLoaded", () => {
	const stored = sessionStorage.getItem("modelloStruttura");
	if (stored) {
		const { modello, nomeFile } = JSON.parse(stored);
		if (modello?.points) {
			apriModello(modello);
			document.getElementById("nomeFile").value = nomeFile;
		}
	}
});

// ANALYSES ----------------------------------------------------------------------------------------
const loadingOverlay = document.getElementById("loadingOverlay");
const loadingMsg     = document.getElementById("loadingMsg");
const spinner        = document.querySelector(".spinner");

function mostraErrore(messaggio) {
	loadingMsg.innerHTML = `<b style="color:#ffb3b3">${messaggio}</b>`;
	spinner.classList.add("error");
	loadingOverlay.onclick = () => {
		loadingOverlay.style.display = "none";
		spinner.classList.remove("error");
		loadingOverlay.onclick = null;
	};
}

document.getElementById("analisiBtn").addEventListener("click", async () => {
	const modello  = costruisciModelloJSON();
	const nomeFile = document.getElementById("nomeFile").value || "Senza nome";
	sessionStorage.setItem("modelloStruttura", JSON.stringify({ modello, nomeFile }));
	loadingOverlay.style.display = "flex";
	loadingMsg.innerText = "Invio dati al server...";

	try {
		const res = await fetch("http://127.0.0.1:5000/analysis/init", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(modello),
		});
		if (!res.ok) { const err = await res.json(); mostraErrore(err.errore || "Errore durante il calcolo"); return; }
		const data = await res.json();
		sessionStorage.setItem("risultatoAnalisi", JSON.stringify(data.initial));
		window.location.href = "analysis";							// analysis.html
	} catch (err) {
		console.error(err);
		mostraErrore("Errore: nessuna licenza disponibile.<br>Contattare l'assistenza");
	}
});
