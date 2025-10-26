import { AddedData } from "./AddedData.js";

// NOTE: this will need to be changed everytime the main rocket code changes
export class LogItem extends AddedData {
	/** @type {number} */
	i_timestamp = 0;
	/** @type {number} */
	baro_Pa = 0;
	/** @type {number} */
	baroTemperature_C = 0;
	/** @type {number} */
	predictedApogee_m_agl = 0;
	/** @type {number} */
	mainBat_pct = 0;
	/** @type {number} */

	servoBat_pct = 0;
	/** @type {number} */
	vnAcc_mps2_nedZ = 0;
	/** @type {number} */
	vnAcc_mps2_nedY = 0;
	/** @type {number} */
	vnAcc_mps2_nedX = 0;
	/** @type {number} */
	vnGyro_radps_;
	nedZ = 0;
	/** @type {number} */
	vnGyro_radps_nedY = 0;
	/** @type {number} */
	vnGyro_radps_nedX = 0;
	/** @type {number} */
	vnMag_gaussZ = 0;
	/** @type {number} */
	vnMag_gaussY = 0;
	/** @type {number} */
	vnMag_;
	gaussX = 0;
	/** @type {number} */
	obAcc_mps2_enuZ = 0;
	/** @type {number} */
	obAcc_mps2_enuY = 0;
	/** @type {number} */
	obAcc_mps2_enuX = 0;
	/** @type {number} */
	obGyro_deg_enuZ = 0;
	/** @type {number} */

	obGyro_deg_enuY = 0;
	/** @type {number} */
	obGyro_deg_enuX = 0;
	/** @type {number} */
	kalmanPos_m_enuZ = 0;
	/** @type {number} */
	kalmanPos_m_enuY = 0;
	/** @type {number} */

	kalmanPos_m_enuX = 0;
	/** @type {number} */
	kalmanVel_mps_enuZ = 0;
	/** @type {number} */
	kalmanVel_mps_enuY = 0;
	/** @type {number} */
	kalmanVel_mps_enuX = 0;
	/** @type {number} */

	vnPos_m_nedZ = 0;
	/** @type {number} */
	vnPos_m_nedY = 0;
	/** @type {number} */
	vnPos_m_nedX = 0;
	/** @type {number} */
	vnGps_deg_deg_mZ = 0;
	/** @type {number} */
	vnGps_deg_deg_mY = 0;
	/** @type {number} */

	vnGps_deg_deg_mX = 0;
	/** @type {number} */
	vnVel_mps_nedZ = 0;
	/** @type {number} */
	vnVel_mps_nedY = 0;
	/** @type {number} */
	vnVel_mps_nedX = 0;
	/** @type {number} */
	vnYPR_degZ = 0;
	/** @type {number} */

	vnYPR_degY = 0;
	/** @type {number} */
	vnYPR_degX = 0;
	/** @type {number} */
	orientationZ = 0;
	/** @type {number} */
	orientationY = 0;
	/** @type {number} */
	orientationX = 0;
	/** @type {number} */
	orientationW = 0;
	/** @type {number} */

	apogee_m_agl = 0;
	/** @type {number} */
	pidDeployment_pct = 0;
	/** @type {number} */
	actualDeployment_pct = 0;
	/** @type {number} */
	rssi_dBm = 0;

	/** @type {number} */
	controlAuth_m_agl = 0;

	/** @type {LogItem?} */
	startState = null;

	startZ = 0;

	/** @type {number} */
	timeSinceLaunch = 0;

	/**@type {string} */
	readerName = "";
}
