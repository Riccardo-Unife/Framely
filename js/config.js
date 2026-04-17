// =================================================================================================
// config.js - Costanti globali - Condivise tra index.html e analysis.html
// Colors, Default material, Default sections.
// =================================================================================================

// COLORS ------------------------------------------------------------------------------------------
export const COLORS = {
	// Geometrie
	// https://coolors.co/F685C5-A25480-D994E6-9B65A4-745087-564473
	Camds_f:	0xF685C5,
	Camds_c:	0xA25480,
	Cvincoli:	0xD994E6,
	Cpunto:		0x9B65A4,
	Clinea:		{ color: 0x745087, opacity: 0.7 },
	Csolaio:	{ color: 0x564473, opacity: 0.5 },

	// Selezioni
	// https://coolors.co/9AA9DA-8296C1-6A82A7-5B749A
	CSamds:		0x9AA9DA,
	CSpunto:	0x8296C1,
	CSlinea:	0x6A82A7,
	CSsolaio:	0x5B749A,

	// Modalità disegno linea/piano
	// https://coolors.co/ccb2d2-7ca1c3
	CmodL:		0xCCB2D2,
	CmodP:		0xCCB2D2,

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

// DEFAULT MATERIALS -------------------------------------------------------------------------------
export const DEFAULT_MATERIALS = {
	"C25/30": { Rho: 2.50, E: 31447161,  G: 13102984 },
	"S355":   { Rho: 7.85, E: 210000000, G: 81000000 },
	"B450C":  { Rho: 7.85, E: 210000000, G: 81000000 },
};

// DEFAULT SECTIONS --------------------------------------------------------------------------------
export function CALCULATE_SECTION(H, B) {							// Calcolo prop. sez. rettang.
	const A = H * B;

	let beta, Il;
	if (H > B) {
		beta = (1 / 3) * (1 - 0.63 * (B / H) + 0.052 * Math.pow(B / H, 5));
		Il = beta * Math.pow(B, 3) * H;
	} else {
		beta = (1 / 3) * (1 - 0.63 * (H / B) + 0.052 * Math.pow(H / B, 5));
		Il = beta * Math.pow(H, 3) * B;
	}

	const In  = (B * Math.pow(H, 3)) / 12;							// inerzia flessionale piano XZ
	const Im  = (H * Math.pow(B, 3)) / 12;							// inerzia flessionale piano XY
	const ASm = (B * H) / 1.2;										// area tagliante direzione m
	const ASn = (H * B) / 1.2;										// area tagliante direzione n

	return { H, B, A, Il, In, Im, ASm, ASn };
}

export const DEFAULT_SECTIONS = {
	"PIL_30x30":  CALCULATE_SECTION(0.30, 0.30),
	"TRAV_50x30": CALCULATE_SECTION(0.50, 0.30),
};