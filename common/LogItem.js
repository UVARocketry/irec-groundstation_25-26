import { AddedData } from "./AddedData.js";

// NOTE: this will need to be changed everytime the main rocket code changes
export class LogItem extends AddedData {
	/* @type {number} */
	timestamp_ms = 0;
	/* @type {number} */
	baroTemperature_C = 0;
	/* @type {number} */
	predictedApogee_m_agl = 0;
	/* @type {number} */
	apogee_m_agl = 0;
	/* @type {number} */
	mainBat_pct = 0;
	/* @type {number} */
	servoBat_pct = 0;
	/* @type {number} */
	groundstationBat_pct = 0;
	/* @type {number} */
	pidDeployment_pct = 0;
	/* @type {number} */
	actualDeployment_pct = 0;
	/* @type {number} */
	controlAuth_m = 0;
	/* @type {number} */
	obAcc_mps2_x = 0;
	/* @type {number} */
	obAcc_mps2_y = 0;
	/* @type {number} */
	obAcc_mps2_z = 0;
	/* @type {number} */
	kalmanPos_m_x = 0;
	/* @type {number} */
	kalmanPos_m_y = 0;
	/* @type {number} */
	kalmanPos_m_z = 0;
	/* @type {number} */
	vnLat_deg = 0;
	/* @type {number} */
	vnLon_deg = 0;
	/* @type {number} */
	kalmanVel_mps_x = 0;
	/* @type {number} */
	kalmanVel_mps_y = 0;
	/* @type {number} */
	kalmanVel_mps_z = 0;
	/* @type {number} */
	vnYPR_deg_x = 0;
	/* @type {number} */
	vnYPR_deg_y = 0;
	/* @type {number} */
	vnYPR_deg_z = 0;
	/* @type {number} */
	representativeAxis_x = 0;
	/* @type {number} */
	representativeAxis_y = 0;
	/* @type {number} */
	representativeAxis_z = 0;
	/* @type {number} */
	rssi_dBm = 0;

	/** @type {LogItem?} */
	startState = null;

	startZ = 0;

	/** @type {number} */
	timeSinceLaunch = 0;

	/**@type {string} */
	readerName = "";

	/** @type {string} */
	event = "";
}
