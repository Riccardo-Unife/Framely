// =================================================================================================
// ui.js - Utilità UI - Condivise tra index.html e analysis.html
// Reset camera, Full screen, Element list, Cookie.
// =================================================================================================

import { camera, controls, initCamPos, initTarPos } from "./scene.js";

// RESET CAMERA BUTTON -----------------------------------------------------------------------------
document.getElementById("resetCamBtn").addEventListener("click", () => {
	camera.position.copy(initCamPos);
	controls.target.copy(initTarPos);
	controls.update();
});

// FULL SCREEN BUTTON ------------------------------------------------------------------------------
document.getElementById("fullScreenBtn").addEventListener("click", () => {
	if (!document.fullscreenElement) {
		document.documentElement.requestFullscreen().catch(err => {
			alert(`Errore fullscreen: ${err.message}`);
		});
	} else {
		document.exitFullscreen();
	}
});

// ELEMENT LIST PANEL ------------------------------------------------------------------------------
const listBtn   = document.getElementById("listBtn");
const listPanel = document.getElementById("list-panel");

listBtn.addEventListener("click", () => {
	listPanel.classList.toggle("open");
});

document.addEventListener("click", (e) => {							// Chiude cliccando fuori
	if (!listPanel.contains(e.target) && e.target !== listBtn) {
		listPanel.classList.remove("open");
	}
});

// COOKIE BANNER -----------------------------------------------------------------------------------
const cookiePopup   = document.getElementById("cookie-popup");
const cookieOverlay = document.getElementById("cookie-overlay");

document.getElementById("cookie-info-btn").onclick = () => {
	cookiePopup.style.display   = "block";
	cookieOverlay.style.display = "block";
};

cookieOverlay.onclick = () => {
	cookiePopup.style.display   = "none";
	cookieOverlay.style.display = "none";
};
