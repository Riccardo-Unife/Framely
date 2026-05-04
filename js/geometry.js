// =================================================================================================
// geometry.js - Creazione di geometrie Three.js - Condivise tra index.html e analysis.html
// Point, Constraints, Frames, Floors, Load
// =================================================================================================

import * as THREE from "three";
import { COLORS } from "./config.js";

// POINT -------------------------------------------------------------------------------------------
export const SPHERE_GEO = new THREE.SphereGeometry(0.1, 10, 5);
export const SPHERE_MAT = new THREE.MeshBasicMaterial({ color: COLORS.Cpunto });

// CONSTRAINTS -------------------------------------------------------------------------------------
export function addConstraints(size = 0.4, thickness = 0.03) {		// Crea croce vincolo
	const mat = new THREE.MeshBasicMaterial({ color: COLORS.Cvincoli });
	const geo = new THREE.CylinderGeometry(thickness, thickness, size, 6);

	const cx = new THREE.Mesh(geo, mat.clone()); cx.rotation.z = Math.PI / 2; cx.raycast = () => {};
	const cy = new THREE.Mesh(geo, mat.clone()); cy.raycast = () => {};
	const cz = new THREE.Mesh(geo, mat.clone()); cz.rotation.x = Math.PI / 2; cz.raycast = () => {};

	const group = new THREE.Group();
	group.add(cx, cy, cz);
	group.raycast = () => {};

	return group;
}

// FRAMES ------------------------------------------------------------------------------------------
export function addFrame(p1, p2) {									// Crea telai
	const start = p1.clone();
	const end   = p2.clone();
	const dir   = new THREE.Vector3().subVectors(end, start);
	const length = dir.length();

	const geo = new THREE.CylinderGeometry(0.05, 0.05, length, 5);
	const mat = new THREE.MeshBasicMaterial({
		color: COLORS.Clinea.color,
		transparent: true,
		opacity: COLORS.Clinea.opacity,
		depthWrite: false,
	});
	const cylinder = new THREE.Mesh(geo, mat);
	cylinder.userData.defaultColor = mat.color.clone();
	cylinder.userData.carico = { Fx: 0, Fy: 0, Fz: 0, Mx: 0, My: 0, Mz: 0, Mass: 0 };

	cylinder.position.copy(start).add(end).divideScalar(2);
	cylinder.quaternion.setFromUnitVectors(
		new THREE.Vector3(0, 1, 0),
		dir.clone().normalize()
	);
	return cylinder;
}
export function calcLocalAxes(p1, p2) {								// Calcola assi locali l, m, n
	const xI = p1.z, yI = p1.x, zI = p1.y;							// da THREE.js (y,z,x) a (x,y,z)
	const xJ = p2.z, yJ = p2.x, zJ = p2.y;							// da THREE.js (y,z,x) a (x,y,z)

	const dx = xJ - xI, dy = yJ - yI, dz = zJ - zI;
	const L  = Math.sqrt(dx*dx + dy*dy + dz*dz);

	const l1 = dx / L, l2 = dy / L, l3 = dz / L;					// l = direzione frame

	const n_normal = Math.sqrt(dy*dy + (xI - xJ)**2);				// n = normale a l in verticale
	let n1, n2, n3;

	if (n_normal === 0) {	// Asta verticale: caso speciale
		n1 = 0; n2 = l3; n3 = 0;
	} else {
		n1 = dy / n_normal;
		n2 = (xI - xJ) / n_normal;
		n3 = 0;
	}

	const m1 = n2*l3 - n3*l2;										// m = n × l
	const m2 = n3*l1 - n1*l3;
	const m3 = n1*l2 - n2*l1;

	if (m3 < 0) {													// Verifica m3 ≥ 0
		return {
			l: { l1,  l2,  l3 },
			n: { n1: -n1, n2: -n2, n3: -n3 },
			m: { m1: -m1, m2: -m2, m3: -m3 },
		};
	}
	return {
		l: { l1, l2, l3 },
		n: { n1, n2, n3 },
		m: { m1, m2, m3 },
	};
}

// FLOORS ------------------------------------------------------------------------------------------
export function addFloor(punti) {									// Crea solai di almeno 3 punti
	if (punti.length < 3) return null;

	const shape = new THREE.Shape();
	shape.moveTo(punti[0].position.x, punti[0].position.z);
	for (let i = 1; i < punti.length; i++) {
		shape.lineTo(punti[i].position.x, punti[i].position.z);
	}
	shape.lineTo(punti[0].position.x, punti[0].position.z);

	const geo = new THREE.ShapeGeometry(shape);
	const mat = new THREE.MeshBasicMaterial({
		color: COLORS.Csolaio.color,
		side: THREE.DoubleSide,
		transparent: true,
		opacity: COLORS.Csolaio.opacity,
		depthWrite: false,
	});
	const mesh = new THREE.Mesh(geo, mat);
	mesh.userData.defaultColor = mat.color.clone();
	mesh.userData.points       = [...punti];
	mesh.rotation.x = Math.PI / 2;
	mesh.position.y = punti[0].position.y;

	return mesh;
}
// Verifica se il punto P giace sul segmento A-B nel piano
function _verPointOnSegment(p, a, b, tol = 0.0) {
	const cross = (b.x - a.x) * (p.z - a.z) - (b.z - a.z) * (p.x - a.x);
	if (Math.abs(cross) > tol) return false;

	const dot  = (p.x - a.x) * (b.x - a.x) + (p.z - a.z) * (b.z - a.z);
	if (dot < -tol) return false;

	const len2 = (b.x - a.x)**2 + (b.z - a.z)**2;
	if (dot - len2 > tol) return false;

	return true;
}
// Verifica se il punto è interno al poligono nel piano.
export function verPointInPoly(point, polygonPoints, tol = 0.0) {
	const x = point.position.x;
	const z = point.position.z;
	let inside = false;

	for (let i = 0, j = polygonPoints.length - 1; i < polygonPoints.length; j = i++) {
		const xi = polygonPoints[i].position.x, zi = polygonPoints[i].position.z;
		const xj = polygonPoints[j].position.x, zj = polygonPoints[j].position.z;

		if (_verPointOnSegment({ x, z }, { x: xi, z: zi }, { x: xj, z: zj }, tol)) return true;

		const intersect = ((zi > z) !== (zj > z)) && (x < (xj - xi) * (z - zi) / (zj - zi) + xi);
		if (intersect) inside = !inside;
	}

	return inside;
}
// Verifica se due segmenti AB e CD si intersecano nel piano.
function _verSegmentIntersect(a, b, c, d) {
	function ccw(p1, p2, p3) {
		return (p3.z - p1.z) * (p2.x - p1.x) > (p2.z - p1.z) * (p3.x - p1.x);
	}
	return ccw(a, c, d) !== ccw(b, c, d) && ccw(a, b, c) !== ccw(a, b, d);
}
// Verifica se il poligono ha lati che si incrociano.
export function verPolyIntersect(punti) {
	const N = punti.length;
	for (let i = 0; i < N; i++) {
		const a1 = punti[i];
		const a2 = punti[(i + 1) % N];
		for (let j = i + 1; j < N; j++) {
			const b1 = punti[j];
			const b2 = punti[(j + 1) % N];
			if (a1 === b1 || a1 === b2 || a2 === b1 || a2 === b2) continue;
			if (_verSegmentIntersect(
				{ x: a1.position.x, z: a1.position.z },
				{ x: a2.position.x, z: a2.position.z },
				{ x: b1.position.x, z: b1.position.z },
				{ x: b2.position.x, z: b2.position.z }
			)) return true;
		}
	}
	return false;
}

// LOAD --------------------------------------------------------------------------------------------
// Nodal load
export function addArrowFN(dir, l = 1, dim = 0.03) {				// Freccia forza nodale
	if (dir.length() === 0) return null;
	return _addArrow(dir, l, dim, COLORS.CloadF_T, COLORS.CloadF_C, false);
}
export function addArrowMN(dir, l = 1, dim = 0.035) {				// Freccia momento nodale
	if (dir.length() === 0) return null;
	return _addMoment(dir, l, dim, COLORS.CloadM_T, COLORS.CloadM_C, COLORS.CloadM_c);
}
export function addArrowPN(dir, l = 0.7, dim = 0.04) {				// Freccia massa nodale
	if (dir.length() === 0) return null;
	return _addArrow(dir, l, dim, COLORS.CloadP_T, COLORS.CloadP_C, false, 0.3);
}

// Frame load
export function addArrowFT(dir, l = 0.8, dim = 0.03) {				// Freccia forza frame
	if (dir.length() === 0) return null;
	return _addArrow(dir, l, dim, COLORS.CloadF_T, COLORS.CloadF_C, true);
}
export function addArrowMT(dir, l = 0.8, dim = 0.035) {				// Freccia momento frame
	if (dir.length() === 0) return null;
	return _addMoment(dir, l, dim, COLORS.CloadM_T, COLORS.CloadM_C, COLORS.CloadM_c);
}
export function addArrowPT(dir, l = 0.6, dim = 0.04) {				// Freccia massa frame
	if (dir.length() === 0) return null;
	return _addArrow(dir, l, dim, COLORS.CloadP_T, COLORS.CloadP_C, true, 0.25);
}

// Freccia semplice - usata per forze e masse
function _addArrow(dir, l, dim, coloreTronco, coloreCono, disabilitaRaycast, headLength = l * 0.3) {
	const group       = new THREE.Group();
	const shaftLength = l - headLength;

	const shaft = new THREE.Mesh(
		new THREE.CylinderGeometry(dim, dim, shaftLength, 6),
		new THREE.MeshBasicMaterial({ color: coloreTronco })
	);
	shaft.position.y = shaftLength / 2;
	group.add(shaft);

	const cone = new THREE.Mesh(
		new THREE.ConeGeometry(dim * 3, headLength, 12),
		new THREE.MeshBasicMaterial({ color: coloreCono })
	);
	cone.position.y = shaftLength + headLength / 2;
	group.add(cone);

	group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());

	if (disabilitaRaycast) {
		group.children.forEach(c => { c.raycast = () => {}; });
	}

	return group;
}
// Freccia con toro - usata per momenti
function _addMoment(dir, l, dim, coloreTronco, coloreCono1, coloreCono2) {
	const group       = new THREE.Group();
	const headLength  = l * 0.3;
	const shaftLength = l - headLength;

	const shaftMat = new THREE.MeshBasicMaterial({ color: coloreTronco });

	const shaft = new THREE.Mesh(new THREE.CylinderGeometry(dim, dim, shaftLength, 6), shaftMat);
	shaft.position.y = shaftLength / 2;

	const cone1 = new THREE.Mesh(
		new THREE.ConeGeometry(dim * 3, headLength, 12),
		new THREE.MeshBasicMaterial({ color: coloreCono2 })
	);
	cone1.position.y = shaftLength + headLength / 2 - 0.06;

	const cone2 = new THREE.Mesh(
		new THREE.ConeGeometry(dim * 3, headLength, 12),
		new THREE.MeshBasicMaterial({ color: coloreCono1 })
	);
	cone2.position.y = shaftLength + headLength / 2 - 0.26;

	const toro = new THREE.Mesh(new THREE.TorusGeometry(headLength, dim, 6, 12, 3), shaftMat);
	toro.rotation.x = Math.PI / 2;
	toro.rotation.z = -1.5;

	const cone3 = new THREE.Mesh(
		new THREE.ConeGeometry(dim * 3, headLength, 12),
		new THREE.MeshBasicMaterial({ color: coloreCono1 })
	);
	cone3.position.z = -headLength;
	cone3.rotation.z = Math.PI / 2;
	cone3.rotation.y = -0.3;

	const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), shaftMat);
	sphere.position.z = headLength;

	group.add(shaft, cone1, cone2, toro, cone3, sphere);
	group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
	group.children.forEach(c => { c.raycast = () => {}; });

	return group;
}