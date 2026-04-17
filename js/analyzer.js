// =============================================================================
// analyzer.js - Logica principale di analisi - Solo analysis.html
// Global state, Loading overlay, Modal analysis, Results, Modes table,
// Deformed shape, Elastic line, Loading, Reset / Save / Load
// =============================================================================

import * as THREE from "three";
import { scene, camera, controls, initCamPos, initTarPos } from "./scene.js";
import { COLORS } from "./config.js";
import {
	addFrame, addFloor, addConstraints,
	addArrowFN, addArrowMN, addArrowPN,
	addArrowFT, addArrowMT, addArrowPT,
	verPointInPoly, SPHERE_GEO, SPHERE_MAT,
} from "./geometry.js";

// GLOBAL STATE ------------------------------------------------------------------------------------
let puntiAggiunti    = [];											// Elementi della scena
let linee            = [];
let piani            = [];
let amds             = [];

let phiModes         = null;										// Forma modale corrente
let currentModeIndex = null;
let modalAnalysisController = null;

// Parametri modali (popolati da usaRisultati)
let parametri = { T: [], f: [], ω: [], ζ: [], ω_NC: [], ζ_NC: [], Δζ: [], M_part: [] };

const UNITA_PARAMETRI = {
	T: " s", f: " Hz", ω: " rad/s", ζ: " %",
	ω_NC: " rad/s", ζ_NC: " %", Δζ: " %", M_part: " %",
};

let currentlyExpandedRows = [];										// Righe espanse tabella modi

// LOADING OVERLAY ---------------------------------------------------------------------------------
const loadingOverlay = document.getElementById("loadingOverlay");
const loadingMsg     = document.getElementById("loadingMsg");
const spinner        = document.querySelector(".spinner");

// Mostra un errore nell'overlay di caricamento.
function mostraErrore(messaggio) {
	loadingMsg.innerHTML = `<b style="color:#ffb3b3">${messaggio}</b>`;
	spinner.classList.add("error");
	loadingOverlay.onclick = () => {
		loadingOverlay.style.display = "none";
		spinner.classList.remove("error");
		loadingOverlay.onclick = null;
	};
}

// MODAL ANALYSIS - form e invio al server ---------------------------------------------------------
// Gestione input smorzamento dinamici (+ / -)
const addBtn  = document.getElementById("addDamping");
const remBtn  = document.getElementById("removeDamping");
const rightCol = document.querySelector("#damping-form .column-right");

addBtn.addEventListener("click", () => {
	const existing = rightCol.querySelectorAll("label");
	if (existing.length >= 2) { alert("Non puoi aggiungere più di 4 valori ζ!"); return; }
	const number = 2 + existing.length + 1;
	const label  = document.createElement("label");
	label.innerHTML = `ζ${number}: <input type="number" placeholder="5.00 %">`;
	rightCol.insertBefore(label, remBtn);
	remBtn.style.display = "block";
});

remBtn.addEventListener("click", () => {
	const all = rightCol.querySelectorAll("label");
	if (all.length > 0) all[all.length - 1].remove();
	if (rightCol.querySelectorAll("label").length === 0) remBtn.style.display = "none";
});

// Legge e valida i parametri dell'analisi dal form.
function leggiParametriAnalisi() {
	// Smorzamento
	const dampingInputs = document.querySelectorAll("#damping-form input");
	const zetaValues = [];
	dampingInputs.forEach(input => {
		let val = parseFloat(input.value);
		if (isNaN(val)) val = 5;
		if (val < 0)    val = 0;
		input.value = val;
		zetaValues.push(val / 100);
	});

	// Rayleigh
	const rayleigh = document.getElementById("rayleighToggle").checked;

	// Numero modi
	let N_modi = parseInt(document.querySelector("#NMode-form input").value);
	if (isNaN(N_modi) || N_modi <= 0) N_modi = 12;
	document.querySelector("#NMode-form input").value = N_modi;

	// Direzione sisma
	let dirX = parseFloat(document.getElementById("dir-x").value);
	let dirY = parseFloat(document.getElementById("dir-y").value);
	if (isNaN(dirX) || dirX < 0) dirX = 100;
	if (isNaN(dirY) || dirY < 0) dirY = 100;
	document.getElementById("dir-x").value = dirX;
	document.getElementById("dir-y").value = dirY;

	return { zeta: zetaValues, rayleigh, N_modi, dir_x: dirX / 100, dir_y: dirY / 100 };
}

async function parseResponseSafe(response) {
	const text = await response.text();
	const sanitized = text
		.replace(/\bNaN\b/g, "null")
		.replace(/\bInfinity\b/g, "null")
		.replace(/-Infinity\b/g, "null");
	return JSON.parse(sanitized);
}

document.getElementById("ModalAnalisiBtn").addEventListener("click", async () => {
	const modelloSalvato = JSON.parse(sessionStorage.getItem("modelloStruttura"));
	const params         = leggiParametriAnalisi();

	// Controlla se i risultati sono già in cache con gli stessi input
	const analisiSalvata = JSON.parse(sessionStorage.getItem("analisiModaleCompleta"));
	if (analisiSalvata && JSON.stringify(analisiSalvata.input) === JSON.stringify(params)) {
		usaRisultati(analisiSalvata.output);
		return;
	}

	loadingOverlay.style.display = "flex";
	loadingMsg.innerText = "Analisi modale in corso...";
	modalAnalysisController = new AbortController();

	try {
		const response = await fetch("http://127.0.0.1:5000/analysis/modal", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ modello: modelloSalvato.modello, ...params }),
			signal: modalAnalysisController.signal,
		});

		if (!response.ok) {
			const err = await parseResponseSafe(response);
			mostraErrore(err.errore || "Errore durante l'analisi modale");
			return;
		}

		const res = await parseResponseSafe(response);
		sessionStorage.setItem("analisiModaleCompleta", JSON.stringify({ input: params, output: res.modale }));
		usaRisultati(res.modale);

	} catch (err) {
		console.error(err);
		mostraErrore("Errore di comunicazione con il server");
		return;
	}

	loadingOverlay.style.display = "none";
	modalAnalysisController = null;
});

// RESULTS -----------------------------------------------------------------------------------------
// Aggiorna il riquadro dei risultati preliminari (DoF, massa, tempo).
function mostraRisultatiPreliminari(initial) {
	if (!initial) return;
	document.getElementById("plotRisultati").innerHTML =
		`<b>GRADI DI LIBERTÀ:</b><br>` +
		`<b>NDoFs liberi:</b> &nbsp; &nbsp; ${initial.Ni}<br>` +
		`<b>NDoFs condensati:</b> ${initial.N}<br>` +
		`<b>Modi rilevanti:</b> &nbsp; ${initial.modi}<br>` +
		`<b>Massa totale:</b> &nbsp; &nbsp; ${initial.M_tot} t<br>` +
		`<b>Durata analisi:</b> &nbsp; ${initial.tempo.toFixed(3)} s`;
}

// Popola lo stato con i risultati modali e aggiorna la tabella.
function usaRisultati(modale) {
	document.getElementById("plotRisultatiModali").innerHTML =
		`<b>RISULTATI ANALISI MODALE</b><br>` +
		`<b>Massa parziale:</b> &nbsp; ${modale.M_parz} %<br>` +
		`<b>Modi influenti:</b> &nbsp; ${modale.influent_mode.join(", ")}<br>` +
		`<b>Coefficienti α:</b> &nbsp; ${modale.coef_alpha.join(", ")}<br>` +
		`<b>Durata analisi:</b> &nbsp; ${modale.tempo.toFixed(3)} s`;

	parametri = {
		T: modale.T, f: modale.f, ω: modale.omega_stc,
		ζ: modale.zita_stc, M_part: modale.M_part,
	};
	if ("NC_omega_stc" in modale) {
		parametri.ω_NC = modale.NC_omega_stc;
		parametri.ζ_NC = modale.NC_zita_stc;
		parametri.Δζ   = modale.delta_zita;
	}

	phiModes = modale.phi;

	if (parametri.T.length > 0) {
		document.getElementById("analisiOutput").style.display   = "flex";
		document.getElementById("analisiDropdown").style.display = "flex";
	}

	const dropdownBtn = document.getElementById("dropdownBtn");
	aggiornaTabella(dropdownBtn.dataset.value || "T");
	aggiornaDropdown();
}

// MODES TABLE -------------------------------------------------------------------------------------
// Nasconde le opzioni dropdown non disponibili.
function aggiornaDropdown() {
	document.querySelectorAll("#dropdownList div").forEach(item => {
		const key = item.dataset.value;
		item.style.display = (!parametri[key] || parametri[key].length === 0) ? "none" : "block";
	});
}

// Genera le etichette di modo (es. T₁, T₂, …).
function getModi(tipo) {
	return Array.from({ length: parametri[tipo].length }, (_, i) => `${tipo}<sub>${i+1}</sub>`);
}

// Popola la tabella dei modi con il parametro selezionato.
function aggiornaTabella(tipoSelezionato) {
	const tbody = document.querySelector("#modiTable tbody");
	tbody.innerHTML = "";

	const n       = parametri[tipoSelezionato].length;
	const simboli = getModi(tipoSelezionato);
	const ordine  = ["T", "f", "ω", "ω_NC", "ζ", "ζ_NC", "Δζ", "M_part"];

	for (let i = 0; i < n; i++) {
		// Riga principale
		const row = document.createElement("tr");
		row.classList.add("modoRow");
		const cellLabel = document.createElement("td"); cellLabel.innerHTML = simboli[i];
		const cellVal   = document.createElement("td");
		cellVal.textContent = parametri[tipoSelezionato][i].toFixed(2) + (UNITA_PARAMETRI[tipoSelezionato] || "");
		row.append(cellLabel, cellVal);
		tbody.appendChild(row);

		// Righe figlie (espandibili)
		const expandedRows = [];
		ordine.forEach(p => {
			if (p === tipoSelezionato) return;
			if (!parametri[p] || parametri[p].length === 0) return;
			const er = document.createElement("tr");
			er.classList.add("expandedRow");
			er.style.display = "none";
			const lc = document.createElement("td"); lc.innerHTML = `${p}<sub>${i+1}</sub>`;
			const vc = document.createElement("td"); vc.textContent = parametri[p][i].toFixed(2) + (UNITA_PARAMETRI[p] || "");
			er.append(lc, vc);
			expandedRows.push(er);
		});

		// Clic sulla riga: espande/chiude
		row.addEventListener("click", () => {
			const isOpen = expandedRows[0]?.style.display === "table-row";

			// Chiude righe già aperte
			currentlyExpandedRows.forEach(gruppo => {
				gruppo.forEach(er => {
					er.style.display = "none";
					er.classList.remove("lastExpanded");
					if (er.parentRow) er.parentRow.classList.remove("expanded");
				});
			});
			currentlyExpandedRows = [];

			if (isOpen) {
				resetModo();
			} else {
				applicaModo(i);
				let lastRow = row;
				expandedRows.forEach((er, idx) => {
					if (!er.parentNode) lastRow.insertAdjacentElement("afterend", er);
					er.style.display = "table-row";
					er.classList.toggle("lastExpanded", idx === expandedRows.length - 1);
					er.parentRow = row;
					lastRow = er;
				});
				row.classList.add("expanded");
				currentlyExpandedRows = [expandedRows];
			}
		});
	}
}

// Dropdown selezione parametro
const dropdownBtn  = document.getElementById("dropdownBtn");
const dropdownList = document.getElementById("dropdownList");

dropdownBtn.addEventListener("click", () => {
	dropdownList.style.display = dropdownList.style.display === "block" ? "none" : "block";
});
dropdownList.querySelectorAll("div").forEach(item => {
	item.addEventListener("click", () => {
		dropdownBtn.textContent      = item.textContent;
		dropdownBtn.dataset.value    = item.dataset.value;
		dropdownList.style.display   = "none";
		aggiornaTabella(item.dataset.value);
		resetModo();
	});
});
document.addEventListener("click", e => {
	if (!dropdownBtn.contains(e.target) && !dropdownList.contains(e.target)) {
		dropdownList.style.display = "none";
	}
});
dropdownBtn.dataset.value = "T";
aggiornaTabella("T");

// DEFORMED SHAPE ----------------------------------------------------------------------------------
const colorSwitch     = document.getElementById("colorSwitch");
const autoScaleSwitch = document.getElementById("autoScaleSwitch");
const scaleInput      = document.getElementById("scaleInput");

colorSwitch.addEventListener("change", () => {
	if (currentModeIndex !== null) applicaModo(currentModeIndex);
});
autoScaleSwitch.addEventListener("change", () => {
	if (currentModeIndex !== null) applicaModo(currentModeIndex);
});
scaleInput.addEventListener("change", () => {
	if (currentModeIndex === null || autoScaleSwitch.checked) return;
	applicaModo(currentModeIndex);
});

// Scala normalizzata: 1 / max(|phi|).
function calcolaScalaModo(modeIndex) {
	if (!phiModes) return 1;
	const maxVal = phiModes.reduce((m, row) => Math.max(m, Math.abs(row[modeIndex])), 0);
	return maxVal === 0 ? 1 : 1 / maxVal;
}

// Spostamento massimo dei nodi liberi per la scala colore.
function calcolaMaxSpostamento(modeIndex, scale) {
	let max = 0;
	let dofIdx = 0;
	puntiAggiunti.forEach(p => {
		if (!p.userData.v) {
			const ux = phiModes[dofIdx + 0][modeIndex];
			const uy = phiModes[dofIdx + 1][modeIndex];
			const uz = phiModes[dofIdx + 2][modeIndex];
			max = Math.max(max, scale * Math.sqrt(ux*ux + uy*uy + uz*uz));
			dofIdx += 6;
		}
	});
	return max || 1;
}

// Determina la scala attiva (automatica o manuale).
function getScaleAttuale(modeIndex) {
	if (autoScaleSwitch.checked) {
		const s = calcolaScalaModo(modeIndex);
		scaleInput.value = s.toFixed(4);
		return s;
	}
	const val = parseFloat(scaleInput.value);
	return isNaN(val) || val <= 0 ? 1 : val;
}

// Mappa un valore normalizzato [0,1] in un colore arcobaleno (rosso→blu).
function arcobaleno(t) {
	return new THREE.Color().setHSL((1 - t) * 270 / 360, 0.8, 0.4);
}

// Applica il modo i-esimo: sposta i nodi e ridisegna le travi deformate.
function applicaModo(modeIndex) {
	if (!phiModes) return;
	currentModeIndex = modeIndex;

	// Nasconde solai, AMD e frecce carichi durante la visualizzazione modale
	piani.forEach(f => f.visible = false);
	amds.forEach(a => a.visible = false);
	[...puntiAggiunti, ...linee].forEach(obj => {
		["frecciaForza", "frecciaMomento", "frecciaMassa"].forEach(k => {
			if (obj.userData[k]) obj.userData[k].visible = false;
		});
	});

	const scale = getScaleAttuale(modeIndex);
	const maxD  = calcolaMaxSpostamento(modeIndex, scale);

	// Sposta i nodi
	let dofIdx = 0;
	puntiAggiunti.forEach(p => {
		const vincolato = p.userData.v;
		let ux = 0, uy = 0, uz = 0;
		if (!vincolato) {
			ux = phiModes[dofIdx + 0][modeIndex];
			uy = phiModes[dofIdx + 1][modeIndex];
			uz = phiModes[dofIdx + 2][modeIndex];
			dofIdx += 6;
		}
		const orig = p.userData.originalPosition;
		p.position.set(orig.x + scale * uy, orig.y + scale * uz, orig.z + scale * ux);

		// Colorazione nodi
		if (colorSwitch.checked) {
			const d = scale * Math.sqrt(ux*ux + uy*uy + uz*uz);
			p.material.color.copy(arcobaleno(d / maxD));
		} else {
			p.material.color.copy(p.userData.defaultColor);
		}
	});

	// Aggiorna geometria linee e crea ghost
	aggiornaGeometriaLinee(modeIndex, scale, maxD);
}

// Reimposta la scena alla geometria indeformata.
function resetModo() {
	currentModeIndex = null;
	puntiAggiunti.forEach(p => {
		if (p.userData.originalPosition) p.position.copy(p.userData.originalPosition);
		p.material.color.copy(p.userData.defaultColor);
	});
	piani.forEach(f => f.visible = true);
	amds.forEach(a => a.visible = true);
	[...puntiAggiunti, ...linee].forEach(obj => {
		["frecciaForza", "frecciaMomento", "frecciaMassa"].forEach(k => {
			if (obj.userData[k]) obj.userData[k].visible = true;
		});
	});
	linee.forEach(l => { if (l.userData.ghostLine) l.userData.ghostLine.visible = false; });
	aggiornaGeometriaLinee();
}

// Rimuove tutte le linee ghost dalla scena.
function rimuoviGhost() {
	linee.forEach(line => {
		if (line.userData.ghostLine) {
			scene.remove(line.userData.ghostLine);
			line.userData.ghostLine.geometry.dispose();
			line.userData.ghostLine.material.dispose();
			line.userData.ghostLine = null;
		}
	});
}

// ELASTIC LINE - deformata dell'asta con beam theory (Timoshenko) ---------------------------------
/**
 * Calcola i punti della deformata di un elemento trave.
 * Usa la soluzione analitica Timoshenko (con taglio).
 */
function calcolaDeformataElemento(u_i, u_j, lmn, P0, L, lineData, scale) {
	const { l, m, n } = lmn;
	const R = [
		[l.l1, l.l2, l.l3],
		[m.m1, m.m2, m.m3],
		[n.n1, n.n2, n.n3],
	];

	const EI_m  = lineData.E * lineData.Im;
	const EI_n  = lineData.E * lineData.In;
	const GAs_m = lineData.G * lineData.ASm;
	const GAs_n = lineData.G * lineData.ASn;

	function rot3(mat, v) {
		return [
			mat[0][0]*v[0] + mat[0][1]*v[1] + mat[0][2]*v[2],
			mat[1][0]*v[0] + mat[1][1]*v[1] + mat[1][2]*v[2],
			mat[2][0]*v[0] + mat[2][1]*v[1] + mat[2][2]*v[2],
		];
	}

	const ui_loc = [...rot3(R, u_i.slice(0,3)), ...rot3(R, u_i.slice(3,6))];
	const uj_loc = [...rot3(R, u_j.slice(0,3)), ...rot3(R, u_j.slice(3,6))];

	const ul_0 = ui_loc[0], ul_L = uj_loc[0];
	const wm_0 = ui_loc[1], wm_L = uj_loc[1];
	const vn_0 = ui_loc[2], vn_L = uj_loc[2];
	const φm_0 = ui_loc[4], φm_L = uj_loc[4];
	const φn_0 = ui_loc[5], φn_L = uj_loc[5];

	const nPunti = Math.ceil(L / 0.25) + 1;
	const points       = [];
	const displacements = [];

	for (let i = 0; i < nPunti; i++) {
		const z = i * (L / (nPunti - 1));

		// Spostamento assiale
		const u_l = (L*ul_0 - z*(ul_0 - ul_L)) / L;

		// Spostamento in direzione m (piano l-n, flessione attorno a n)
		const w_m = (
			L*wm_0*(12*EI_n + GAs_n*L**2) +
			z**2*(-6*EI_n*φn_0 + 6*EI_n*φn_L - 2*GAs_n*L**2*φn_0 - GAs_n*L**2*φn_L
				- 3*GAs_n*L*wm_0 + 3*GAs_n*L*wm_L + GAs_n*z*(L*φn_0 + L*φn_L + 2*wm_0 - 2*wm_L)) -
			z*(6*EI_n*(L*φn_0 + L*φn_L + 2*wm_0 - 2*wm_L) - L*φn_0*(12*EI_n + GAs_n*L**2))
		) / (L*(12*EI_n + GAs_n*L**2));

		// Spostamento in direzione n (piano l-m, flessione attorno a m)
		const v_n = (
			L*vn_0*(12*EI_m + GAs_m*L**2) +
			z**2*(6*EI_m*φm_0 - 6*EI_m*φm_L + 2*GAs_m*L**2*φm_0 + GAs_m*L**2*φm_L
				- 3*GAs_m*L*vn_0 + 3*GAs_m*L*vn_L - GAs_m*z*(L*φm_0 + L*φm_L - 2*vn_0 + 2*vn_L)) +
			z*(6*EI_m*(L*φm_0 + L*φm_L - 2*vn_0 + 2*vn_L) - L*φm_0*(12*EI_m + GAs_m*L**2))
		) / (L*(12*EI_m + GAs_m*L**2));

		displacements.push(scale * Math.sqrt(u_l**2 + w_m**2 + v_n**2));

		// Posizione deformata in coord. locali → globali (R^T * pos_loc + P0)
		const pos_loc = [z + scale * u_l, scale * w_m, scale * v_n];
		const RT = [[R[0][0], R[1][0], R[2][0]], [R[0][1], R[1][1], R[2][1]], [R[0][2], R[1][2], R[2][2]]];
		const pg  = rot3(RT, pos_loc);

		// Conversione sistema strutturale → Three.js: (x,y,z)→(y,z,x)
		points.push(new THREE.Vector3(pg[1] + P0.y, pg[2] + P0.z, pg[0] + P0.x));
	}

	return { points, displacements };
}

// Aggiorna la geometria delle travi per mostrare la deformata (o la ripristina).
function aggiornaGeometriaLinee(modeIndex, scale, maxD) {
	// Reset: geometria indeformata
	if (modeIndex === undefined) {
		linee.forEach(line => {
			const p1 = line.userData.p1.position;
			const p2 = line.userData.p2.position;
			const dir = new THREE.Vector3().subVectors(p2, p1);
			line.geometry.dispose();
			line.geometry = new THREE.CylinderGeometry(0.05, 0.05, dir.length(), 5);
			line.position.copy(p1).add(p2).divideScalar(2);
			line.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), dir.clone().normalize());
			line.material.vertexColors = false;
			line.material.transparent  = true;
			line.material.opacity      = COLORS.Clinea.opacity;
			line.material.color.set(COLORS.Clinea.color);
			line.material.needsUpdate  = true;
		});
		return;
	}

	const doColor = colorSwitch.checked;

	linee.forEach(line => {
		const p1 = line.userData.p1;
		const p2 = line.userData.p2;
		const i1 = puntiAggiunti.indexOf(p1);
		const i2 = puntiAggiunti.indexOf(p2);

		// Recupera i DoF del nodo (6 per nodo libero, 0 per vincolato)
		function getDoFs(nodeIndex, isVincolato) {
			if (isVincolato) return [0,0,0,0,0,0];
			let dofIdx = 0;
			for (let k = 0; k < nodeIndex; k++) {
				if (!puntiAggiunti[k].userData.v) dofIdx += 6;
			}
			return [0,1,2,3,4,5].map(d => phiModes[dofIdx + d][modeIndex]);
		}

		const u_i = getDoFs(i1, p1.userData.v);
		const u_j = getDoFs(i2, p2.userData.v);
		const orig = p1.userData.originalPosition;
		const P0   = { x: orig.z, y: orig.x, z: orig.y };

		// Senza proprietà fisiche: fallback al cilindro semplice
		if (!line.userData.E || !line.userData.Im) {
			const pa = p1.position, pb = p2.position;
			const dir = new THREE.Vector3().subVectors(pb, pa);
			line.geometry.dispose();
			line.geometry = new THREE.CylinderGeometry(0.05, 0.05, dir.length(), 5);
			line.position.copy(pa).add(pb).divideScalar(2);
			line.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), dir.clone().normalize());
			return;
		}

		const { points: pts, displacements } = calcolaDeformataElemento(
			u_i, u_j,
			{ l: line.userData.l, m: line.userData.m, n: line.userData.n },
			P0, line.userData.lunghezza, line.userData, scale
		);

		// Crea linea ghost (struttura indeformata in grigio trasparente)
		if (!line.userData.ghostLine) {
			const p1orig = line.userData.originalP1;
			const p2orig = line.userData.originalP2;
			const dir    = new THREE.Vector3().subVectors(p2orig, p1orig);
			const ghost  = new THREE.Mesh(
				new THREE.CylinderGeometry(0.02, 0.02, dir.length(), 5),
				new THREE.MeshBasicMaterial({ color: 0x888888, transparent: true, opacity: 0.25 })
			);
			ghost.position.copy(p1orig).add(p2orig).divideScalar(2);
			ghost.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), dir.clone().normalize());
			ghost.raycast = () => {};
			scene.add(ghost);
			line.userData.ghostLine = ghost;
		}
		line.userData.ghostLine.visible = true;

		// Geometria deformata come tubo lungo la spline
		line.geometry.dispose();
		const curve    = new THREE.CatmullRomCurve3(pts);
		const nSeg     = pts.length - 1;
		const nTubeSeg = 5;
		const geometry = new THREE.TubeGeometry(curve, nSeg, 0.05, nTubeSeg, false);

		if (doColor) {
			// Colorazione per spostamento
			const vertexCount = geometry.attributes.position.count;
			const colors      = new Float32Array(vertexCount * 3);
			const totalRings  = nSeg + 1;
			for (let ring = 0; ring < totalRings; ring++) {
				const col = arcobaleno(Math.min(displacements[ring] / maxD, 1));
				for (let v = 0; v <= nTubeSeg; v++) {
					const idx = ring * (nTubeSeg + 1) + v;
					colors[idx*3+0] = col.r; colors[idx*3+1] = col.g; colors[idx*3+2] = col.b;
				}
			}
			geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
			line.material.vertexColors = true;
			line.material.color.set(0xffffff);
			line.material.transparent  = false;
			line.material.opacity      = 1;
		} else {
			line.material.vertexColors = false;
			line.material.transparent  = true;
			line.material.opacity      = COLORS.Clinea.opacity;
			line.material.color.set(COLORS.Clinea.color);
		}

		line.material.needsUpdate = true;
		line.geometry = geometry;
		line.position.set(0, 0, 0);
		line.quaternion.identity();
	});
}

// LOADING -----------------------------------------------------------------------------------------
function disegnaCaricoPunto(p, carico) {
	const { Fx, Fy, Fz, Mx, My, Mz, Mass } = carico;
	if (p.userData.frecciaForza)   p.remove(p.userData.frecciaForza);
	if (p.userData.frecciaMomento) p.remove(p.userData.frecciaMomento);
	if (p.userData.frecciaMassa)   p.remove(p.userData.frecciaMassa);

	const ff = addArrowFN(new THREE.Vector3(Fy, Fz, Fx));
	if (ff) { p.add(ff); p.userData.frecciaForza = ff; }
	const fm = addArrowMN(new THREE.Vector3(My, Mz, Mx));
	if (fm) { p.add(fm); p.userData.frecciaMomento = fm; }
	const fma = addArrowPN(new THREE.Vector3(0, Mass, 0));
	if (fma) { p.add(fma); p.userData.frecciaMassa = fma; }
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
	const invRot = new THREE.Matrix3().setFromMatrix4(new THREE.Matrix4().copy(l.matrixWorld).invert());

	function gruppoFrecce(dir, creaFn) {
		const gruppo = new THREE.Group();
		for (let i = 0; i < n; i++) {
			const f = creaFn(dir);
			if (!f) continue;
			f.position.y = -(L/2) + offset + i * step;
			gruppo.add(f);
		}
		return gruppo;
	}

	const F = new THREE.Vector3(Fy, Fz, Fx).applyMatrix3(invRot);
	const M = new THREE.Vector3(My, Mz, Mx).applyMatrix3(invRot);
	const Mv = new THREE.Vector3(0, Mass, 0).applyMatrix3(invRot);

	const gF  = gruppoFrecce(F,  addArrowFT);
	const gM  = gruppoFrecce(M,  addArrowMT);
	const gMv = gruppoFrecce(Mv, addArrowPT);

	if (F.length()  !== 0) { l.add(gF);  l.userData.frecciaForza   = gF; }
	if (M.length()  !== 0) { l.add(gM);  l.userData.frecciaMomento = gM; }
	if (Mv.length() !== 0) { l.add(gMv); l.userData.frecciaMassa   = gMv; }
}

// Ricostruisce la scena 3D dal JSON del modello.
function apriModello(jsonData, fileName) {
	if (fileName) document.getElementById("nomeFile").value = fileName.replace(/\.[^/.]+$/, "");

	[...puntiAggiunti, ...linee, ...piani, ...amds].forEach(o => scene.remove(o));
	rimuoviGhost();
	puntiAggiunti = []; linee = []; piani = []; amds = [];

	// Punti
	jsonData.points.forEach(p => {
		const sphere = new THREE.Mesh(SPHERE_GEO, SPHERE_MAT.clone());
		sphere.userData.defaultColor      = SPHERE_MAT.color.clone();
		sphere.userData.originalPosition  = new THREE.Vector3(p.y, p.z, p.x);
		sphere.position.copy(sphere.userData.originalPosition);
		if (p.ux) {
			sphere.userData.v = true;
			const croce = addConstraints(); sphere.add(croce); sphere.userData.constraintMarker = croce;
		}
		if (p.load) sphere.userData.carico = p.load;
		scene.add(sphere); puntiAggiunti.push(sphere);
	});

	// Linee
	jsonData.lines.forEach(l => {
		const p1 = puntiAggiunti[l.p1];
		const p2 = puntiAggiunti[l.p2];
		const line = addFrame(p1.position, p2.position);
		Object.assign(line.userData, {
			p1, p2,
			lunghezza: l.lunghezza, l: l.l, m: l.m, n: l.n,
			materiale: l.materiale, sezione: l.sezione,
			E: l.E, G: l.G, Im: l.Im, In: l.In, ASm: l.ASm, ASn: l.ASn,
			originalP1: p1.position.clone(),
			originalP2: p2.position.clone(),
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
	jsonData.amds.forEach(a => _creaAMDAnalisi(a.x, a.y, a.z, a.G, a.phi));

	aggiornaListaPuntiAnalisi(); aggiornaListaLineeAnalisi();
	aggiornaListaPianiAnalisi(); aggiornaListaAMDsAnalisi();

	// Ridisegna carichi
	puntiAggiunti.forEach(p => { if (p.userData.carico) disegnaCaricoPunto(p, p.userData.carico); });
	linee.forEach(l => { if (l.userData.carico) disegnaCaricoLinea(l, l.userData.carico); });
}

// Versione ridotta di creaAMD senza history (solo per il ripristino visivo).
function _creaAMDAnalisi(x, y, z, G, phi) {
	const centro = new THREE.Vector3(y, z, x);
	let indicePiano = -1;
	for (let i = 0; i < piani.length; i++) {
		if (Math.abs(centro.y - piani[i].position.y) > 0.0) continue;
		if (verPointInPoly({ position: centro }, piani[i].userData.points)) { indicePiano = i; break; }
	}
	if (indicePiano === -1) return;

	const geo = new THREE.BoxGeometry(0.5, 0.5, 2);
	const mat = new THREE.MeshBasicMaterial({ color: COLORS.Camds_f });
	const amd = new THREE.Mesh(geo, mat);
	amd.userData.defaultColor  = mat.color.clone();
	amd.userData.floorIndex    = indicePiano;
	amd.userData.G             = G;
	amd.rotation.y             = phi;
	amd.position.copy(centro);

	const wireframe = new THREE.LineSegments(
		new THREE.EdgesGeometry(geo),
		new THREE.LineBasicMaterial({ color: COLORS.Camds_c })
	);
	amd.add(wireframe);
	scene.add(amd); amds.push(amd);
}

// Liste elementi (pannello laterale) — versione read-only per l'analyzer
function aggiornaListaPuntiAnalisi() {
	const ul = document.getElementById("points-list");
	if (!ul) return;
	ul.innerHTML = "";
	puntiAggiunti.forEach((p, i) => {
		const li = document.createElement("li");
		li.textContent = `P_${i+1}: (${p.position.z.toFixed(2)} ${p.position.x.toFixed(2)} ${p.position.y.toFixed(2)})${p.userData.v ? " v" : ""}`;
		ul.appendChild(li);
	});
}
function aggiornaListaLineeAnalisi() {
	const ul = document.getElementById("lines-list");
	if (!ul) return;
	ul.innerHTML = "";
	linee.forEach((l, i) => {
		const li = document.createElement("li");
		li.textContent = `L_${i+1}: (P_${puntiAggiunti.indexOf(l.userData.p1)+1} P_${puntiAggiunti.indexOf(l.userData.p2)+1}) | L:${l.userData.lunghezza.toFixed(2)} | ${l.userData.materiale}, ${l.userData.sezione}`;
		ul.appendChild(li);
	});
}
function aggiornaListaPianiAnalisi() {
	const ul = document.getElementById("floors-list");
	if (!ul) return;
	ul.innerHTML = "";
	piani.forEach((f, i) => {
		const li = document.createElement("li");
		li.textContent = `Solaio_${i+1}: z=${f.position.y.toFixed(2)}`;
		ul.appendChild(li);
	});
}
function aggiornaListaAMDsAnalisi() {
	const ul = document.getElementById("amd-list");
	if (!ul) return;
	ul.innerHTML = "";
	amds.forEach((a, i) => {
		const li = document.createElement("li");
		li.textContent = `AMD_${i+1}: G=${a.userData.G}`;
		ul.appendChild(li);
	});
}

// RESET / SAVE / LOAD -----------------------------------------------------------------------------
document.getElementById("resetALL").addEventListener("click", () => {
	resetModo()
	sessionStorage.removeItem("analisiModaleCompleta");

	parametri    = { T: [], f: [], ω: [], ζ: [], ω_NC: [], ζ_NC: [], Δζ: [], M_part: [] };
	phiModes     = null;

	document.getElementById("analisiOutput").style.display    = "none";
	document.getElementById("analisiDropdown").style.display  = "none";
	document.getElementById("plotRisultatiModali").innerHTML   = "";

	document.querySelectorAll("#damping-form input").forEach(i => { i.value = null; });
	document.getElementById("rayleighToggle").checked = false;
	document.querySelector("#NMode-form input").value  = null;
	document.getElementById("dir-x").value = null;
	document.getElementById("dir-y").value = null;
});

document.getElementById("escBtn").addEventListener("click", () => {
	sessionStorage.removeItem("analisiModaleCompleta");
	window.location.href = "index.html";
});

document.getElementById("saveModel").addEventListener("click", () => {
	const nomeFile           = document.getElementById("nomeFile").value || "Senza nome";
	const modelloSalvato     = JSON.parse(sessionStorage.getItem("modelloStruttura")) || {};
	const analisiPreliminare = JSON.parse(sessionStorage.getItem("risultatoAnalisi")) || null;
	const analisiModale      = JSON.parse(sessionStorage.getItem("analisiModaleCompleta")) || null;

	const fileDaSalvare = { nomeFile, modello: modelloSalvato.modello || {}, analisiPreliminare, analisiModale };
	const blob = new Blob([JSON.stringify(fileDaSalvare, null, 2)], { type: "application/json" });
	const url  = URL.createObjectURL(blob);
	const a    = Object.assign(document.createElement("a"), { href: url, download: `${nomeFile}.stc` });
	a.click(); URL.revokeObjectURL(url);
});

document.getElementById("loadModelBtn").addEventListener("click", () => document.getElementById("loadModel").click());
document.getElementById("loadModel").addEventListener("change", function(e) {
	const reader = new FileReader();
	reader.onload = function() {
		const json = JSON.parse(reader.result);
		sessionStorage.setItem("modelloStruttura", JSON.stringify({ nomeFile: json.nomeFile, modello: json.modello }));
		if (!json.analisiPreliminare) { window.location.href = "index.html"; return; }
		sessionStorage.setItem("risultatoAnalisi", JSON.stringify(json.analisiPreliminare));
		if (json.analisiModale) sessionStorage.setItem("analisiModaleCompleta", JSON.stringify(json.analisiModale));
		else sessionStorage.removeItem("analisiModaleCompleta");
		apriModello(json.modello, json.nomeFile);
		mostraRisultatiPreliminari(json.analisiPreliminare);
		if (json.analisiModale) usaRisultati(json.analisiModale.output);
	};
	reader.readAsText(e.target.files[0]);
	this.value = "";
});


// INITIALIZATION ----------------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
	// Carica modello dalla sessione
	const stored = sessionStorage.getItem("modelloStruttura");
	if (stored) {
		const { modello, nomeFile } = JSON.parse(stored);
		apriModello(modello, nomeFile);
	}

	// Mostra risultati preliminari
	const initial = JSON.parse(sessionStorage.getItem("risultatoAnalisi"));
	mostraRisultatiPreliminari(initial);

	// Ripristina analisi modale salvata
	const analisiSalvata = JSON.parse(sessionStorage.getItem("analisiModaleCompleta"));
	if (analisiSalvata) {
		const inputs = analisiSalvata.input;
		const dampingInputs = document.querySelectorAll("#damping-form input");
		inputs.zeta.forEach((val, i) => { if (dampingInputs[i]) dampingInputs[i].value = val * 100; });
		document.getElementById("rayleighToggle").checked = inputs.rayleigh;
		document.querySelector("#NMode-form input").value  = inputs.N_modi;
		document.getElementById("dir-x").value = inputs.dir_x * 100;
		document.getElementById("dir-y").value = inputs.dir_y * 100;
		usaRisultati(analisiSalvata.output);
	}

	// Pulsante cancella analisi
	document.getElementById("cancelAnalysisBtn")?.addEventListener("click", () => {
		if (modalAnalysisController) modalAnalysisController.abort();
	});
});
