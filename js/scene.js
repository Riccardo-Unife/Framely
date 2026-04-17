// =================================================================================================
// scene.js - Setup ambiente 3D - Condivise tra index.html e analysis.html
// Renderer, Camera, Scene, Orbit controls, Camera initial position,
// Gizmo axes, Scene axis, Grill, Animation, Resize
// =================================================================================================

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { COLORS } from "./config.js";

// RENDERER ----------------------------------------------------------------------------------------
export const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// CAMERA ------------------------------------------------------------------------------------------
export const camera = new THREE.PerspectiveCamera(
	75,																// field of view
	window.innerWidth / window.innerHeight,							// aspect ratio
	0.001,															// near clip
	1000															// far clip
);
camera.position.set(-5, 7, -5);

// SCENE -------------------------------------------------------------------------------------------
export const scene = new THREE.Scene();
scene.background = new THREE.Color(COLORS.Cbg);

// ORBIT CONTROLS ----------------------------------------------------------------------------------
export const controls = new OrbitControls(camera, renderer.domElement);
controls.mouseButtons.LEFT   = null;								// click sx: selezione
controls.mouseButtons.RIGHT  = THREE.MOUSE.ROTATE;					// click dx: rotazione camera
controls.mouseButtons.MIDDLE = THREE.MOUSE.PAN;						// click cx: pan
controls.enableZoom          = true;
controls.enableDamping       = true;
controls.dampingFactor       = 0.25;
controls.target.set(5, 0, 5);

// CAMERA INITIAL POSITION -------------------------------------------------------------------------
export const initCamPos = camera.position.clone();		// Clone posizione camera
export const initTarPos = controls.target.clone();		// Clone posizione targhet

// GIZMO AXES --------------------------------------------------------------------------------------
const gizmoScene  = new THREE.Scene();
const gizmoCamera = new THREE.PerspectiveCamera(50, 1, 0.1, 10);
const GIZMO_SIZE  = 100;

function addGizmo(colore, orientamento) {
	const geo = new THREE.CylinderGeometry(0.05, 0.05, 1, 6);
	const mat = new THREE.MeshBasicMaterial({ color: colore });
	const cylinder = new THREE.Mesh(geo, mat);

	switch (orientamento) {
		case "x": cylinder.rotation.x = Math.PI / 2; cylinder.position.z = 0.5; break;
		case "y": cylinder.rotation.z = Math.PI / 2; cylinder.position.x = 0.5; break;
		case "z": cylinder.rotation.y = Math.PI / 2; cylinder.position.y = 0.5; break;
	}

	gizmoScene.add(cylinder);
}
addGizmo(COLORS.Caxis_x, "x");
addGizmo(COLORS.Caxis_y, "y");
addGizmo(COLORS.Caxis_z, "z");

// SCENE AXIS --------------------------------------------------------------------------------------
function addAsse(colore, orientamento, posizione = 0.5) {
	const geo = new THREE.CylinderGeometry(0.025, 0.025, 1, 6);
	const mat = new THREE.MeshBasicMaterial({ color: colore });
	const cylinder = new THREE.Mesh(geo, mat);

	switch (orientamento) {
		case "x": cylinder.rotation.x = Math.PI / 2; cylinder.position.z = posizione; break;
		case "y": cylinder.rotation.z = Math.PI / 2; cylinder.position.x = posizione; break;
		case "z": cylinder.rotation.y = Math.PI / 2; cylinder.position.y = posizione; break;
	}

	scene.add(cylinder);
}
addAsse(COLORS.Caxis_x, "x");
addAsse(COLORS.Caxis_y, "y");
addAsse(COLORS.Caxis_z, "z");

// GRILL -------------------------------------------------------------------------------------------
const gridHelper = new THREE.GridHelper(100, 100, COLORS.Cgrid_1, COLORS.Cgrid_2);
scene.add(gridHelper);

// ANIMATION ---------------------------------------------------------------------------------------
function animate() {
	requestAnimationFrame(animate);
	controls.update();

	// Animazione scena principale
	renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
	renderer.render(scene, camera);

	// Animazione gizmo
	renderer.autoClear = false;
	renderer.clearDepth();
	renderer.setViewport(10, 10, GIZMO_SIZE, GIZMO_SIZE);

	// Sincronizza gizmo con camera
	gizmoCamera.position.copy(camera.position);
	gizmoCamera.position.sub(controls.target);
	gizmoCamera.position.setLength(2.5);
	gizmoCamera.lookAt(0, 0, 0);

	renderer.render(gizmoScene, gizmoCamera);
	renderer.autoClear = true;
}
animate();

// RESIZE ------------------------------------------------------------------------------------------
window.addEventListener("resize", () => {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
});
