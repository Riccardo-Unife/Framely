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

// controls.mouseButtons.LEFT = null;						// Disabilita tasto sinistro
controls.mouseButtons.RIGHT = THREE.MOUSE.ROTATE;		// Imposta tasto destro per ruotare
controls.mouseButtons.MIDDLE = THREE.MOUSE.PAN;			// Imposta tasto centrale per pan
controls.enableZoom = true;								// Imposta rotellina zoom (default)

controls.enableDamping = true;							// smorzamento movimento
controls.dampingFactor = 0.25;
controls.target.set(5, 0, 5);

// SETUP GIZMO
const gizmoScene = new THREE.Scene();
const gizmoCamera = new THREE.PerspectiveCamera(50, 1, 0.1, 10);

function addAsseGizmo(colore, orientamento) {			// Assi gizmo
	const geometry = new THREE.CylinderGeometry(0.05, 0.05, 1, 6);
	const material = new THREE.MeshBasicMaterial({ color: colore });
	const cylinder = new THREE.Mesh(geometry, material);
	switch (orientamento) {
		case "x":
			cylinder.rotation.x = Math.PI / 2;
			cylinder.position.z = 0.5;
			break;
		case "y":
			cylinder.rotation.z = Math.PI / 2;
			cylinder.position.x = 0.5;
			break;
		case "z":
			cylinder.rotation.y = Math.PI / 2;
			cylinder.position.y = 0.5;
			break;
	}
	gizmoScene.add(cylinder);
}
addAsseGizmo(COLORS.Caxis_x, "x");
addAsseGizmo(COLORS.Caxis_y, "y");
addAsseGizmo(COLORS.Caxis_z, "z");

const gizmoSize = 100;									// Dimensioni gizmmo

// Animazione
function animate() {									// Animazione scena
	requestAnimationFrame(animate);
	controls.update();

	// Scena principale a tutto schermo
	renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
	renderer.render(scene, camera);

	// Gizmo in basso a sinistra
	renderer.autoClear = false;		// Disabilita clear per non cancellare scena principale
	renderer.clearDepth();			// Pulisce il buffer di profondità

	renderer.setViewport(10, 10, gizmoSize, gizmoSize);	// Area widget (x, y, L, H)
	
	// Sincronizzazione
	gizmoCamera.position.copy(camera.position);
	gizmoCamera.position.sub(controls.target);			// Orbita su (0,0,0)
	gizmoCamera.position.setLength(2.5);				// Distanza camera
	gizmoCamera.lookAt(0, 0, 0);						// Targhet camera
	renderer.render(gizmoScene, gizmoCamera);
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

// // Filtro Clic o Drag
// renderer.domElement.addEventListener("mousedown", (event) => {
// 	mouseDownPos = { x: event.clientX, y: event.clientY };
// });

// Lista elementi
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

// IMPOSTAZIONI ANALISI ----------------------------------------------------------------------------
// Elementi
const addBtn = document.getElementById("addDamping");
const remBtn = document.getElementById("removeDamping");
const rightCol = document.querySelector("#damping-form .column-right");

addBtn.addEventListener("click", () => {
	const existingInputs = rightCol.querySelectorAll("label");
	if (existingInputs.length >= 2) {
		alert("Non puoi aggiungere più di 4 valori ζ in totale!");
		return;
	}

	const number = 2 + existingInputs.length + 1; // ζ1 e ζ2 già contano

	const label = document.createElement("label");
	label.innerHTML = `ζ${number}: <input type="number" placeholder="5.00 %">`;

	// Inserisci prima del pulsante "-"
	rightCol.insertBefore(label, remBtn);

	// Mostra il pulsante "-"
	remBtn.style.display = "block";
});

remBtn.addEventListener("click", () => {
	const allInputs = rightCol.querySelectorAll("label");
	if (allInputs.length > 0) {
		allInputs[allInputs.length - 1].remove();
	}

	// Nascondi "-" se non ci sono più input aggiuntivi
	if (rightCol.querySelectorAll("label").length === 0) {
		remBtn.style.display = "none";
	}
});

// ANALISI MODALE ----------------------------------------------------------------------------------
let modalAnalysisController = null;
const ModalAnalisiBtn = document.getElementById("ModalAnalisiBtn");
// const cancelAnalysisBtn = document.getElementById("cancelAnalysisBtn");
const loadingOverlay = document.getElementById("loadingOverlay");
const loadingMsg = document.getElementById("loadingMsg");
const spinner = document.querySelector(".spinner");

// Errore analisi
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

// // Abort analisi
// cancelAnalysisBtn.addEventListener("click", () => {
// 	if (modalAnalysisController) {
// 		modalAnalysisController.abort();
// 	}
// });

// Run analisi
ModalAnalisiBtn.addEventListener("click", async () => {
	const modelloSalvato = JSON.parse(sessionStorage.getItem("modelloStruttura"));

	// lettura valori smorzamento
	const dampingInputs = document.querySelectorAll("#damping-form input");
	let zetaValues = [];
	dampingInputs.forEach(input => {
		let val = parseFloat(input.value);
		if (isNaN(val)) val = 5;
		if (val < 0) val = 0;

		input.value = val;

		zetaValues.push(val / 100);
	});
	// lettura rayleigh True/False
	const rayleigh = document.getElementById("rayleighToggle").checked;

	// lettura numero modi
	let N_modi = parseInt(document.querySelector("#NMode-form input").value);
	if (isNaN(N_modi) || N_modi <= 0) N_modi = 12;

	document.querySelector("#NMode-form input").value = N_modi;

	// Direzione sisma
	let dirX = parseFloat(document.getElementById("dir-x").value);
	let dirY = parseFloat(document.getElementById("dir-y").value);
	if (isNaN(dirX)) dirX = 100;
	if (isNaN(dirY)) dirY = 100;
	if (dirX < 0) dirX = 0;
	if (dirY < 0) dirY = 0;

	document.getElementById("dir-x").value = dirX;
	document.getElementById("dir-y").value = dirY;

	const dirX_frac = dirX / 100;
	const dirY_frac = dirY / 100;

	// Controllo analisi già eseguita
	const analisiSalvata = JSON.parse(sessionStorage.getItem("analisiModaleCompleta"));
	if (analisiSalvata) {
		const stessiInput = JSON.stringify(analisiSalvata.input) === JSON.stringify({
			zeta: zetaValues,
			rayleigh: rayleigh,
			N_modi: N_modi,
			dir_x: dirX_frac,
			dir_y: dirY_frac
		});

		if (stessiInput) {
			console.log("Uso risultati salvati, nessuna nuova analisi");
			usaRisultati(analisiSalvata.output);
			return;
		}
	}

	// Stampa nel log del browser
	console.log("Valori zeta inviati:", zetaValues);
	console.log("Rayleigh:", rayleigh);
	console.log("Direzione x", dirX_frac);
	console.log("Direzione y", dirY_frac);

	// Mostra overlay
	loadingOverlay.style.display = "flex";
	loadingMsg.innerText = "Analisi modale in corso...";
	modalAnalysisController = new AbortController();

	// Chiamata analisi
	try {
		const response = await fetch("http://127.0.0.1:5000/analysis/modal", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				modello: modelloSalvato.modello,
				zeta: zetaValues,
				rayleigh: rayleigh,
				N_modi: N_modi,
				dir_x: dirX_frac,
				dir_y: dirY_frac
			}),
			signal: modalAnalysisController.signal
		});

		if (!response.ok) {
			const err = await response.json();
			mostraErrore(err.errore || "Errore durante l'analisi modale");
			return;
		}

		const res = await response.json();
		console.log("Risultati analisi modale:", res);
		sessionStorage.setItem("analisiModaleCompleta", JSON.stringify({
			input: {
				zeta: zetaValues,
				rayleigh: rayleigh,
				N_modi: N_modi,
				dir_x: dirX_frac,
				dir_y: dirY_frac
			},
			output: res.modale
		}));
		usaRisultati(res.modale);

	} catch (err) {
		console.error(err);
		mostraErrore("Errore di comunicazione con il server");
		return;
	}

	loadingOverlay.style.display = "none";
	modalAnalysisController = null;
});
function mostraRisultatiPreliminari(initial) {

	if (!initial) return;

	let html = "";
	html += `<b>GRADI DI LIBERTÀ:</b><br>`;
	html += `<b>NDoFs liberi:</b> &nbsp; &nbsp; ${initial.Ni}<br>`;
	html += `<b>NDoFs condensati:</b> ${initial.N}<br>`;
	html += `<b>Modi rilevanti:</b> &nbsp; ${initial.modi}<br>`;
	html += `<b>Massa totale:</b> &nbsp; &nbsp; ${initial.M_tot} t<br>`;
	html += `<b>Durata analisi:</b> &nbsp; ${initial.tempo.toFixed(3)} s`;

	document.getElementById("plotRisultati").innerHTML = html;
}
function usaRisultati(modale) {
	// Plot testo generale
	let html = "";
	html += `<b>RISULTATI ANALISI MODALE</b><br>`;
	html += `<b>Massa parziale:</b> &nbsp; ${modale.M_parz} %<br>`;
	html += `<b>Modi influenti:</b> &nbsp; ${modale.influent_mode.join(", ")}<br>`;
	html += `<b>Coefficienti α:</b> &nbsp; ${modale.coef_alpha.join(", ")}<br>`;
	html += `<b>Durata analisi:</b> &nbsp; ${modale.tempo.toFixed(3)} s<br>`;

	document.getElementById("plotRisultatiModali").innerHTML = html;

	// Plot parametri modali
	parametri = {
		T: modale.T,
		f: modale.f,
		ω: modale.omega_stc,
		ζ: modale.zita_stc,
		M_part: modale.M_part
	};
	if ("NC_omega_stc" in modale) {
		parametri.ω_NC = modale.NC_omega_stc;
		parametri.ζ_NC = modale.NC_zita_stc;
		parametri.Δζ = modale.delta_zita;
	}

	phiModes = modale.phi;
	if (parametri.T.length > 0) {
		document.getElementById("analisiOutput").style.display = "flex";
		document.getElementById("analisiDropdown").style.display = "flex";
	}
	aggiornaTabella(btn.dataset.value);
	aggiornaDropdown();
}

window.addEventListener("load", () => {
	const analisiSalvata = JSON.parse(sessionStorage.getItem("analisiModaleCompleta"));
	if (analisiSalvata) {

		// Ripristino valori zeta
		const dampingInputs = document.querySelectorAll("#damping-form input");
		analisiSalvata.input.zeta.forEach((val, i) => {
			// val è in frazione, quindi moltiplichiamo per 100
			if (dampingInputs[i]) dampingInputs[i].value = val * 100;
		});

		// Ripristino switch Rayleigh
		const rayleighToggle = document.getElementById("rayleighToggle");
		if (rayleighToggle) rayleighToggle.checked = analisiSalvata.input.rayleigh;

		// Ripristino numero di modi
		const N_modi_input = document.querySelector("#NMode-form input");
		if (N_modi_input) N_modi_input.value = analisiSalvata.input.N_modi;

		// Ripristino direzioni sisma
		const dirX_input = document.getElementById("dir-x");
		const dirY_input = document.getElementById("dir-y");
		if (dirX_input) dirX_input.value = analisiSalvata.input.dir_x * 100;
		if (dirY_input) dirY_input.value = analisiSalvata.input.dir_y * 100;

		// Ripristino risultati modali
		usaRisultati(analisiSalvata.output);
	}
});

// DEFORMAZIONE MODALE -----------------------------------------------------------------------------
// Scala colorata
const colorSwitch = document.getElementById("colorSwitch");

colorSwitch.addEventListener("change", () => {
	if (currentModeIndex === null) return;
	applicaModo(currentModeIndex);
});

function arcobaleno(t) {
	const hue = (1 - t) * 270;
	return new THREE.Color().setHSL(hue / 360, 0.8, 0.4);
}

function calcolaMaxSpostamento(modeIndex, scale) {
	let max = 0;
	let dofIndex = 0;
	puntiAggiunti.forEach(p => {
		if (!p.userData.v) {
			const ux = phiModes[dofIndex + 0][modeIndex];
			const uy = phiModes[dofIndex + 1][modeIndex];
			const uz = phiModes[dofIndex + 2][modeIndex];
			const d = scale * Math.sqrt(ux*ux + uy*uy + uz*uz);
			if (d > max) max = d;
			dofIndex += 6;
		}
	});
	return max || 1;
}

// Scala normata
function calcolaScalaModo(modeIndex) {
	if (!phiModes) return 1;

	let maxVal = 0;

	for (let i = 0; i < phiModes.length; i++) {
		const val = Math.abs(phiModes[i][modeIndex]);
		if (val > maxVal) maxVal = val;
	}

	// Evita divisione per zero
	if (maxVal === 0) return 1;

	return 1 / maxVal;
}

let currentModeIndex = null;

// Elementi UI scala
const autoScaleSwitch = document.getElementById("autoScaleSwitch");
const scaleInput = document.getElementById("scaleInput");

function getScaleAttuale(modeIndex) {
	if (autoScaleSwitch.checked) {
		const s = calcolaScalaModo(modeIndex);
		scaleInput.value = s.toFixed(4);
		return s;
	} else {
		const val = parseFloat(scaleInput.value);
		return isNaN(val) || val <= 0 ? 1 : val;
	}
}

// Switch auto-scala: ricalcola e ridisegna il modo corrente
autoScaleSwitch.addEventListener("change", () => {
	if (currentModeIndex === null) return;
	applicaModo(currentModeIndex);
});

// Campo scala manuale: ridisegna se c'è un modo attivo e lo switch è spento
scaleInput.addEventListener("change", () => {
	if (currentModeIndex === null) return;
	if (autoScaleSwitch.checked) return;  // in auto, il campo è read-only
	applicaModo(currentModeIndex);
});

let phiModes = null;

function applicaModo(modeIndex, scale = null) {
	if (!phiModes) return;
	currentModeIndex = modeIndex;
	piani.forEach(f => f.visible = false);
	amds.forEach(a => a.visible = false);
	puntiAggiunti.forEach(p => {
		if (p.userData.frecciaForza)   p.userData.frecciaForza.visible   = false;
		if (p.userData.frecciaMomento) p.userData.frecciaMomento.visible = false;
		if (p.userData.frecciaMassa)   p.userData.frecciaMassa.visible   = false;
	});
	linee.forEach(l => {
		if (l.userData.frecciaForza)   l.userData.frecciaForza.visible   = false;
		if (l.userData.frecciaMomento) l.userData.frecciaMomento.visible = false;
		if (l.userData.frecciaMassa)   l.userData.frecciaMassa.visible   = false;
	});
	if (scale === null) {
		scale = getScaleAttuale(modeIndex);
	}
	const maxD = calcolaMaxSpostamento(modeIndex, scale);
	let dofIndex = 0;
	puntiAggiunti.forEach(p => {
		const vincolato = p.userData.v;
		let ux = 0, uy = 0, uz = 0;

		if (!vincolato) {
			ux = phiModes[dofIndex + 0][modeIndex];
			uy = phiModes[dofIndex + 1][modeIndex];
			uz = phiModes[dofIndex + 2][modeIndex];
			dofIndex += 6;
		}

		const orig = p.userData.originalPosition;
		p.position.set(
			orig.x + scale * uy,
			orig.y + scale * uz,
			orig.z + scale * ux
		);
	});
	// const colorSwitch = document.getElementById("colorSwitch");

	if (colorSwitch.checked) {
		// const maxD = calcolaMaxSpostamento(modeIndex, scale);
		let dofIdx = 0;
		puntiAggiunti.forEach(p => {
			if (!p.userData.v) {
				const ux = phiModes[dofIdx + 0][modeIndex];
				const uy = phiModes[dofIdx + 1][modeIndex];
				const uz = phiModes[dofIdx + 2][modeIndex];
				const d = scale * Math.sqrt(ux*ux + uy*uy + uz*uz);
				p.material.color.copy(arcobaleno(d / maxD));
				dofIdx += 6;
			} else {
				p.material.color.copy(arcobaleno(0));
			}
		});
	} else {
		puntiAggiunti.forEach(p => p.material.color.copy(p.userData.defaultColor));
	}

	// Telaio fantasma: sfere originali invisibili, linee ghost
	// puntiAggiunti.forEach(p => { p.visible = false; });
	linee.forEach(line => {
		// Crea la linea ghost se non esiste ancora
		if (!line.userData.ghostLine) {
			const p1orig = line.userData.originalP1;
			const p2orig = line.userData.originalP2;
			const dir = new THREE.Vector3().subVectors(p2orig, p1orig);
			const length = dir.length();
			const ghostGeo = new THREE.CylinderGeometry(0.02, 0.02, length, 5);
			const ghostMat = new THREE.MeshBasicMaterial({
				color: 0x888888,
				transparent: true,
				opacity: 0.25
			});
			const ghost = new THREE.Mesh(ghostGeo, ghostMat);
			ghost.position.copy(p1orig).add(p2orig).divideScalar(2);
			ghost.quaternion.setFromUnitVectors(
				new THREE.Vector3(0, 1, 0),
				dir.clone().normalize()
			);
			ghost.raycast = () => {};
			scene.add(ghost);
			line.userData.ghostLine = ghost;
		}
		line.userData.ghostLine.visible = true;
	});

	piani.forEach(f => f.visible = false);
	amds.forEach(a => a.visible = false);
	puntiAggiunti.forEach(p => {
		if (p.userData.frecciaForza)   p.userData.frecciaForza.visible   = false;
		if (p.userData.frecciaMomento) p.userData.frecciaMomento.visible = false;
		if (p.userData.frecciaMassa)   p.userData.frecciaMassa.visible   = false;
	});
	linee.forEach(l => {
		if (l.userData.frecciaForza)   l.userData.frecciaForza.visible   = false;
		if (l.userData.frecciaMomento) l.userData.frecciaMomento.visible = false;
		if (l.userData.frecciaMassa)   l.userData.frecciaMassa.visible   = false;
	});

	aggiornaGeometriaLinee(modeIndex, scale, maxD);
	// aggiornaGeometriaLinee(modeIndex, scale);
}

function aggiornaGeometriaLinee(modeIndex, scale, maxD) {
	// Caso reset
	if (modeIndex === undefined) {
		linee.forEach(line => {
			const p1 = line.userData.p1.position;
			const p2 = line.userData.p2.position;
			const dir = new THREE.Vector3().subVectors(p2, p1);
			const length = dir.length();
			line.geometry.dispose();
			line.geometry = new THREE.CylinderGeometry(0.05, 0.05, length, 5);
			line.position.copy(p1).add(p2).divideScalar(2);
			line.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
			line.material.vertexColors = false;
			line.material.transparent = true;
			line.material.opacity = COLORS.Clinea.opacity;
			line.material.color.set(COLORS.Clinea.color);
			line.material.needsUpdate = true;
		});
		return;
	}

	const doColor = colorSwitch.checked;

	linee.forEach(line => {
		const p1 = line.userData.p1;
		const p2 = line.userData.p2;
		const i1 = puntiAggiunti.indexOf(p1);
		const i2 = puntiAggiunti.indexOf(p2);

		function getDoFs(nodeIndex, isVincolato) {
			if (isVincolato) return [0, 0, 0, 0, 0, 0];
			let dofIdx = 0;
			for (let k = 0; k < nodeIndex; k++) {
				if (!puntiAggiunti[k].userData.v) dofIdx += 6;
			}
			return [0,1,2,3,4,5].map(d => phiModes[dofIdx + d][modeIndex]);
		}

		const u_i = getDoFs(i1, p1.userData.v);
		const u_j = getDoFs(i2, p2.userData.v);

		const orig = p1.userData.originalPosition;
		const P0 = { x: orig.z, y: orig.x, z: orig.y };
		const lineData = line.userData;

		if (!lineData.E || !lineData.Im) {
			const pa = p1.position, pb = p2.position;
			const dir = new THREE.Vector3().subVectors(pb, pa);
			const length = dir.length();
			line.geometry.dispose();
			line.geometry = new THREE.CylinderGeometry(0.05, 0.05, length, 5);
			line.position.copy(pa).add(pb).divideScalar(2);
			line.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), dir.clone().normalize());
			return;
		}

		const { points: pts, displacements } = calcolaDeformataElemento(
			u_i, u_j,
			{ l: lineData.l, m: lineData.m, n: lineData.n },
			P0, lineData.lunghezza, lineData, scale
		);

		line.geometry.dispose();
		const curve = new THREE.CatmullRomCurve3(pts);
		const nSeg = pts.length - 1;
		const nTubeSeg = 5;
		const geometry = new THREE.TubeGeometry(curve, nSeg, 0.05, nTubeSeg, false);

		if (doColor) {
			const vertexCount = geometry.attributes.position.count;
			const colors = new Float32Array(vertexCount * 3);
			const totalRings = nSeg + 1;

			for (let ring = 0; ring < totalRings; ring++) {
				const col = arcobaleno(Math.min(displacements[ring] / maxD, 1));
				for (let v = 0; v <= nTubeSeg; v++) {
					const idx = ring * (nTubeSeg + 1) + v;
					colors[idx * 3 + 0] = col.r;
					colors[idx * 3 + 1] = col.g;
					colors[idx * 3 + 2] = col.b;
				}
			}

			geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
			line.material.vertexColors = true;
			line.material.color.set(0xffffff);
			line.material.transparent = false;
			line.material.opacity = 1;
		} else {
			line.material.vertexColors = false;
			line.material.transparent = true;
			line.material.opacity = COLORS.Clinea.opacity;
			line.material.color.set(COLORS.Clinea.color);
		}

		line.material.needsUpdate = true;
		line.geometry = geometry;
		line.position.set(0, 0, 0);
		line.quaternion.identity();
	});
}

function resetModo() {
	currentModeIndex = null;
	puntiAggiunti.forEach(p => {
		if (p.userData.originalPosition) {
			p.position.copy(p.userData.originalPosition);
		}
		// Reset colore nodi — sempre, indipendentemente dallo switch
		p.material.color.copy(p.userData.defaultColor);
	});
	piani.forEach(f => f.visible = true);
	amds.forEach(a => a.visible = true);
	puntiAggiunti.forEach(p => {
		if (p.userData.frecciaForza)   p.userData.frecciaForza.visible   = true;
		if (p.userData.frecciaMomento) p.userData.frecciaMomento.visible = true;
		if (p.userData.frecciaMassa)   p.userData.frecciaMassa.visible   = true;
	});
	linee.forEach(l => {
		if (l.userData.ghostLine) l.userData.ghostLine.visible = false;
		if (l.userData.frecciaForza)   l.userData.frecciaForza.visible   = true;
		if (l.userData.frecciaMomento) l.userData.frecciaMomento.visible = true;
		if (l.userData.frecciaMassa)   l.userData.frecciaMassa.visible   = true;
	});
	aggiornaGeometriaLinee();
}

// Rimuove dalla scena tutti i ghost delle linee correnti
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

// DEFORMAZIONE MODALE CON LINEA ELASTICA ----------------------------------------------------------
function calcolaDeformataElemento(u_i, u_j, lmn, P0, L, lineData, scale) {
	// Matrice di rotazione R (3×3): righe = [l, m, n]
	const { l, m, n } = lmn;
	const R = [
		[l.l1, l.l2, l.l3],
		[m.m1, m.m2, m.m3],
		[n.n1, n.n2, n.n3]
	];

	// Parametri trave
	const EI_m  = lineData.E * lineData.Im;
	const EI_n  = lineData.E * lineData.In;
	const GAs_m = lineData.G * lineData.ASm;
	const GAs_n = lineData.G * lineData.ASn;

	// Spostamenti nodali globali
	function rot3(mat, v) {
		return [
			mat[0][0]*v[0] + mat[0][1]*v[1] + mat[0][2]*v[2],
			mat[1][0]*v[0] + mat[1][1]*v[1] + mat[1][2]*v[2],
			mat[2][0]*v[0] + mat[2][1]*v[1] + mat[2][2]*v[2]
		];
	}
	// Spostamenti nodali globali
	const ui_loc = [
		...rot3(R, [u_i[0], u_i[1], u_i[2]]),
		...rot3(R, [u_i[3], u_i[4], u_i[5]])
	];
	const uj_loc = [
		...rot3(R, [u_j[0], u_j[1], u_j[2]]),
		...rot3(R, [u_j[3], u_j[4], u_j[5]])
	];

	// Condizioni al contorno
	const ul_0 = ui_loc[0], ul_L = uj_loc[0];   // spost. assiale
	const wm_0 = ui_loc[1], wm_L = uj_loc[1];   // traslaz. in m
	const vn_0 = ui_loc[2], vn_L = uj_loc[2];   // traslaz. in n
	const φm_0 = ui_loc[4], φm_L = uj_loc[4];   // rotaz. in m (flessione piano l-n)
	const φn_0 = ui_loc[5], φn_L = uj_loc[5];   // rotaz. in n (flessione piano l-m)

	// N divisioni, una ogni 25cm
	const points = [];
	const displacements = [];
	const nPunti = Math.ceil(L / 0.25) + 1;
	for (let i = 0; i < nPunti; i++) {
		const z = i * (L / (nPunti - 1));

		// Spostamento
		const u_l = (L*ul_0 - z*(ul_0 - ul_L))/L

		const w_m = (L*wm_0*(12*EI_n + GAs_n*L**2) + z**2*(-6*EI_n*φn_0 + 6*EI_n*φn_L - 2*GAs_n*L**2*φn_0 - GAs_n*L**2*φn_L - 3*GAs_n*L*wm_0 + 3*GAs_n*L*wm_L + GAs_n*z*(L*φn_0 + L*φn_L + 2*wm_0 - 2*wm_L)) - z*(6*EI_n*(L*φn_0 + L*φn_L + 2*wm_0 - 2*wm_L) - L*φn_0*(12*EI_n + GAs_n*L**2)))/(L*(12*EI_n + GAs_n*L**2))

		const v_n = (L*vn_0*(12*EI_m + GAs_m*L**2) + z**2*(6*EI_m*φm_0 - 6*EI_m*φm_L + 2*GAs_m*L**2*φm_0 + GAs_m*L**2*φm_L - 3*GAs_m*L*vn_0 + 3*GAs_m*L*vn_L - GAs_m*z*(L*φm_0 + L*φm_L - 2*vn_0 + 2*vn_L)) + z*(6*EI_m*(L*φm_0 + L*φm_L - 2*vn_0 + 2*vn_L) - L*φm_0*(12*EI_m + GAs_m*L**2)))/(L*(12*EI_m + GAs_m*L**2))

		displacements.push(scale * Math.sqrt(u_l*u_l + w_m*w_m + v_n*v_n));

		// Posizione deformata in coord. locali: [z + u_l, w_m, v_n]
		const pos_loc = [z + scale * u_l, scale * w_m, scale * v_n];

		// Rotazione in coord. strutturali globali: pos_glob = R^T * pos_loc + P0
		const RT = [[R[0][0], R[1][0], R[2][0]],
					[R[0][1], R[1][1], R[2][1]],
					[R[0][2], R[1][2], R[2][2]]];
		const pg = rot3(RT, pos_loc);

		// Aggiunta P0 (posizione nodo i, coord. strutturali)
		const x_str = pg[0] + P0.x;
		const y_str = pg[1] + P0.y;
		const z_str = pg[2] + P0.z;

		// Permutazione → Three.js: (x_str, y_str, z_str) → THREE(y_str, z_str, x_str)
		points.push(new THREE.Vector3(y_str, z_str, x_str));
	}

	return { points, displacements };
}

// APERTURA MODELLO --------------------------------------------------------------------------------
// Inizializzazione punti
let puntiAggiunti = [];
let linee = [];
let piani = [];
let amds = [];
let mouseDownPos = null;

// Geometria punto
const sphereGeometry = new THREE.SphereGeometry(0.1, 10, 5);
const sphereMaterial = new THREE.MeshBasicMaterial({ color: COLORS.Cpunto });

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

// Creazione AMD
function creaAMD(x, y, z, G, phi, addHistory = true) {

	// Dimensioni parallelepipedo
	const L = 2;	   // lunghezza
	const W = 0.5;	 // larghezza
	const H = 0.5;	 // altezza

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
function disegnaCaricoPunto(p, carico) {
	const { Fx, Fy, Fz, Mx, My, Mz, Mass } = carico;

	// rimuovi grafica precedente
	if (p.userData.frecciaForza) p.remove(p.userData.frecciaForza);
	if (p.userData.frecciaMomento) p.remove(p.userData.frecciaMomento);
	if (p.userData.frecciaMassa) p.remove(p.userData.frecciaMassa);

	// FORZA
	const F = new THREE.Vector3(Fy, Fz, Fx);
	const frecciaForza = creaFrecciaForzaNodo(F);

	if (frecciaForza) {
		frecciaForza.position.set(0, 0, 0);
		p.add(frecciaForza);
		p.userData.frecciaForza = frecciaForza;
	}

	// MOMENTO
	const M = new THREE.Vector3(My, Mz, Mx);
	const frecciaMomento = creaFrecciaMomentoNodo(M);

	if (frecciaMomento) {
		frecciaMomento.position.set(0, 0, 0);
		p.add(frecciaMomento);
		p.userData.frecciaMomento = frecciaMomento;
	}

	// MASSA
	const Massa = new THREE.Vector3(0, Mass, 0);
	const frecciaMassa = creaFrecciaMassaNodo(Massa);

	if (frecciaMassa) {
		frecciaMassa.position.set(0, 0, 0);
		p.add(frecciaMassa);
		p.userData.frecciaMassa = frecciaMassa;
	}
}
function disegnaCaricoLinea(l, carico) {
	l.updateMatrixWorld(true);
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

	// FORZA
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

	// MOMENTO
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

	// MASSA
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

// Reset
function resetAnalisi() {
	sessionStorage.clear();
	rimuoviGhost();

	puntiAggiunti.forEach(p => scene.remove(p));
	linee.forEach(l => scene.remove(l));
	piani.forEach(f => scene.remove(f));
	amds.forEach(a => scene.remove(a));

	puntiAggiunti = [];
	linee = [];
	piani = [];
	amds = [];

	document.getElementById("plotRisultati").innerHTML = "";
	document.getElementById("plotRisultatiModali").innerHTML = "";

	console.log("Reset completo eseguito");
}

// apertura
function apriModello(jsonData, fileName) {
	// RESET UNDO / REDO
	if (fileName) {
		const nomePulito = fileName.replace(/\.[^/.]+$/, ""); // rimuove estensione
		document.getElementById("nomeFile").value = nomePulito;
	}

	puntiAggiunti.forEach(p => scene.remove(p));
	linee.forEach(l => scene.remove(l));
	piani.forEach(f => scene.remove(f));
	amds.forEach(a => scene.remove(a));
	rimuoviGhost(); 

	puntiAggiunti = [];
	linee = [];
	piani = [];
	amds = [];

	// --- RICOSTRUZIONE PUNTI ---
	jsonData.points.forEach(p => {
		const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial.clone());
		sphere.userData.defaultColor = sphereMaterial.color.clone();
		sphere.position.set(p.y, p.z, p.x);
		sphere.userData.originalPosition = sphere.position.clone();

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
		line.userData.originalP1 = p1.position.clone();
		line.userData.originalP2 = p2.position.clone();

		line.userData.E   = l.E;
		line.userData.G   = l.G;
		line.userData.Im  = l.Im;
		line.userData.In  = l.In;
		line.userData.ASm = l.ASm;
		line.userData.ASn = l.ASn;

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

	aggiornaListaPunti();
	aggiornaListaLinee();
	aggiornaListaPiani();
	aggiornaListaAMDs();
	ripristinaCarichi();
}

// Apertura file
document.getElementById("loadModelBtn").addEventListener("click", () => {
	document.getElementById("loadModel").click();
});

document.getElementById("loadModel").addEventListener("change", function(e) {
	resetAnalisi();
	const file = e.target.files[0];
	const reader = new FileReader();
	reader.onload = function() {
		const jsonData = JSON.parse(reader.result);
		sessionStorage.setItem("modelloStruttura", JSON.stringify({
			nomeFile: jsonData.nomeFile,
			modello: jsonData.modello
		}));
		if (!jsonData.analisiPreliminare) {
			window.location.href = "index.html";
			return;
		}
		sessionStorage.setItem(
			"risultatoAnalisi",
			JSON.stringify(jsonData.analisiPreliminare)
		);
		if (jsonData.analisiModale) {sessionStorage.setItem(
				"analisiModaleCompleta",
				JSON.stringify(jsonData.analisiModale)
			);
		} else {
			sessionStorage.removeItem("analisiModaleCompleta");
		}
		apriModello(jsonData.modello, jsonData.nomeFile);
		mostraRisultatiPreliminari(jsonData.analisiPreliminare);
		if (jsonData.analisiModale) {
			usaRisultati(jsonData.analisiModale.output);
		}
	};
	reader.readAsText(file);
	this.value = "";
});

// caricamento
document.addEventListener("DOMContentLoaded", () => {
	const stored = sessionStorage.getItem("modelloStruttura");
	if (!stored) return;

	const { modello, nomeFile } = JSON.parse(stored);
	apriModello(modello, nomeFile);
	console.log("Modello e nome file ripristinati");
});

// PLOT RISULTATI ----------------------------------------------------------------------------------
function getModi(tipo) {
	const simbolo = tipo;
	const n = parametri[tipo].length;
	const arr = [];
	for (let i = 1; i <= n; i++) {arr.push(`${simbolo}<sub>${i}</sub>`);}
	return arr;
}
let parametri = {
	T: [],
	f: [],
	ω: [],
	ζ: [],
	ω_NC: [],
	ζ_NC: [],
	Δζ: [],
	M_part: []
};
const unita = {
	T: " s",
	f: " Hz",
	ω: " rad/s",
	ζ: " %",
	ω_NC: " rad/s",
	ζ_NC: " %",
	Δζ: " %",
	M_part: " %"
};

// Aggiornamento dropdown
function aggiornaDropdown() {
	const items = document.querySelectorAll("#dropdownList div");

	items.forEach(item => {
		const key = item.dataset.value;

		if (!parametri[key] || parametri[key].length === 0) {
			item.style.display = "none";
		} else {
			item.style.display = "block";
		}
	});
}

// Dropdown
const btn = document.getElementById('dropdownBtn');
const list = document.getElementById('dropdownList');

btn.addEventListener('click', () => {
	list.style.display = list.style.display === 'block' ? 'none' : 'block';
});

// Gestione selezione
list.querySelectorAll('div').forEach(item => {
	item.addEventListener('click', () => {
		const valoreSelezionato = item.dataset.value;

		btn.textContent = item.textContent;
		btn.dataset.value = valoreSelezionato;
		list.style.display = 'none';

		aggiornaTabella(valoreSelezionato);
		resetModo();
	});
});
btn.dataset.value = 'T';
aggiornaTabella('T');

// Chiudi dropdown cliccando fuori
document.addEventListener('click', (e) => {
	if (!btn.contains(e.target) && !list.contains(e.target)) {
		list.style.display = 'none';
	}
});

let currentlyExpandedRows = [];

function aggiornaTabella(tipoSelezionato) {
	const tbody = document.querySelector('#modiTable tbody');
	tbody.innerHTML = '';

	const n = parametri[tipoSelezionato].length;
	const simboli = getModi(tipoSelezionato);
	const ordineParametri = [		
		"T",
		"f",
		"ω",
		"ω_NC",
		"ζ",
		"ζ_NC",
		"Δζ",
		"M_part",
	];

	for (let i = 0; i < n; i++) {
		// Riga principale
		const row = document.createElement('tr');
		row.classList.add('modoRow');

		const cellModo = document.createElement('td');
		cellModo.innerHTML = simboli[i]; // pedice incluso
		const cellValore = document.createElement('td');
		cellValore.textContent = parametri[tipoSelezionato][i].toFixed(2) + (unita[tipoSelezionato] || "");

		row.appendChild(cellModo);
		row.appendChild(cellValore);
		tbody.appendChild(row);

		// Prepara le righe figlie
		const expandedRows = [];
		ordineParametri.forEach(p => {
			if (p === tipoSelezionato) return;
			if (!parametri[p] || parametri[p].length === 0) return;
			const expRow = document.createElement('tr');
			expRow.classList.add('expandedRow');
			expRow.style.display = 'none';

			const labelCell = document.createElement('td');
			labelCell.innerHTML = `${p}<sub>${i+1}</sub>`; // pedice
			const valueCell = document.createElement('td');
			valueCell.textContent = parametri[p][i].toFixed(2) + (unita[p] || "");

			expRow.appendChild(labelCell);
			expRow.appendChild(valueCell);

			expandedRows.push(expRow);
		});

		// Evento clic: mostra righe figlie, chiude altre se aperte
		row.addEventListener('click', () => {
			const isAlreadyOpen = expandedRows[0].style.display === 'table-row';
			if (isAlreadyOpen) {
				resetModo();
			} else {
				applicaModo(i);
			}
			// Chiude eventuali righe già aperte
			currentlyExpandedRows.forEach(r => {
				r.forEach(er => {
					er.style.display = 'none';
					er.classList.remove('lastExpanded'); // <-- QUI
				});

				// Rimuove anche classe "expanded" dalle righe madri precedenti
				if (r[0].parentRow) {
					r[0].parentRow.classList.remove('expanded');
				}
			});

			currentlyExpandedRows = [];

			if (!isAlreadyOpen) {
				let lastRow = row;

				expandedRows.forEach((er, index) => {
					if (!er.parentNode) lastRow.insertAdjacentElement('afterend', er);
					er.style.display = 'table-row';
					er.classList.remove('lastExpanded');
					if (index === expandedRows.length - 1) {
						er.classList.add('lastExpanded');
					}

					er.parentRow = row;
					lastRow = er;
				});

				row.classList.add('expanded');
				currentlyExpandedRows = [expandedRows];
			}
		});
	}
}

// RISULTATI ---------------------------------------------------------------------------------------
const initial = JSON.parse(
	sessionStorage.getItem("risultatoAnalisi")
);
let html = "";
html += `<b>GRADI DI LIBERTÀ:</b><br>`;
html += `<b>NDoFs liberi:</b> &nbsp; &nbsp; ${initial.Ni}<br>`;
html += `<b>NDoFs condensati:</b> ${initial.N}<br>`;
html += `<b>Modi rilevanti:</b> &nbsp; ${initial.modi}<br>`;
html += `<b>Massa totale:</b> &nbsp; &nbsp; ${initial.M_tot} t<br>`;
html += `<b>Durata analisi:</b> &nbsp; ${initial.tempo.toFixed(3)} s`;

document.getElementById("plotRisultati").innerHTML = html;

// RESET PAGINA ------------------------------------------------------------------------------------
// Reset
const resetBtn = document.getElementById("resetALL");

resetBtn.addEventListener("click", () => {

	// Cancella SOLO i dati dell’analisi
	sessionStorage.removeItem("analisiModaleCompleta");

	// reset totale, anche del modello
	// sessionStorage.clear();

	// Reset variabili globali
	parametri = {
		T: [], f: [], ω: [], ζ: [],
		ω_NC: [], ζ_NC: [], Δζ: [],
		M_part: []
	};

	phiModes = [];

	// Nasconde area risultati
	document.getElementById("analisiOutput").style.display = "none";
	document.getElementById("analisiDropdown").style.display = "none";
	document.getElementById("plotRisultatiModali").innerHTML = "";

	const dampingInputs = document.querySelectorAll("#damping-form input");
	dampingInputs.forEach(input => input.value = null);
	const rayleighToggle = document.getElementById("rayleighToggle");
	if(rayleighToggle) rayleighToggle.checked = false;
	const N_modi_input = document.querySelector("#NMode-form input");
	if(N_modi_input) N_modi_input.value = null;
	const dirX_input = document.getElementById("dir-x");
	const dirY_input = document.getElementById("dir-y");
	if(dirX_input) dirX_input.value = null;
	if(dirY_input) dirY_input.value = null;

	console.log("Session storage resettato");
});

//Ritorno index.html
const escBtn = document.getElementById("escBtn");

escBtn.addEventListener("click", () => {

	// Cancella sessione analisi
	sessionStorage.removeItem("analisiModaleCompleta");

	// Se vuoi cancellare tutto:
	// sessionStorage.clear();

	console.log("Session storage cancellato - ritorno a index");

	// Reindirizzamento
	window.location.href = "index.html";
});

// SALVA MODELLO -----------------------------------------------------------------------------------
function salvaModelloConAnalisi() {
	// Nome modello
	const nomeFile = document.getElementById("nomeFile").value || modelloSalvato.nomeFile || "Modello senza nome";

	// Modello
	const modelloSalvato = JSON.parse(sessionStorage.getItem("modelloStruttura")) || {};
	const modello = modelloSalvato.modello || {};

	// Analisi preliminare
	const analisiPreliminare = JSON.parse(sessionStorage.getItem("risultatoAnalisi")) || null;

	// Analisi modale
	const analisiSalvata = JSON.parse(sessionStorage.getItem("analisiModaleCompleta")) || null;

	// ostruisci oggetto completo
	const fileDaSalvare = {
		nomeFile: nomeFile,
		modello: modello,
		analisiPreliminare: analisiPreliminare ? analisiPreliminare : null,
		analisiModale: analisiSalvata ? analisiSalvata : null
	};

	// Trasforma in Blob e scarica
	const blob = new Blob([JSON.stringify(fileDaSalvare, null, 2)], { type: "application/json" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = `${nomeFile}.stc`;
	a.click();
	URL.revokeObjectURL(url);

	console.log("Modello e analisi salvati correttamente");
}

// Event listener sul bottone
document.getElementById("saveModel").addEventListener("click", salvaModelloConAnalisi);