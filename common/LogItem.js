import { AddedData } from "./AddedData.js";

// NOTE: this will need to be changed everytime the main rocket code changes
export class LogItem extends AddedData {
	/** @type {number} */
	i_timestamp = 0;
	/**@type {number} */
	baro = 0;
	/**@type {number} */
	baroTemperature = 0;
	/**@type {number} */
	predictedApogee = 0;
	/**@type {number} */
	mainBat = 0;
	/**@type {number} */
	servoBat = 0;
	/**@type {number} */
	vnAccX = 0;
	/**@type {number} */
	vnAccY = 0;
	/**@type {number} */
	vnAccZ = 0;
	/**@type {number} */
	vnGyroX = 0;
	/**@type {number} */
	vnGyroY = 0;
	/**@type {number} */
	vnGyroZ = 0;
	/**@type {number} */
	vnMagX = 0;
	/**@type {number} */
	vnMagY = 0;
	/**@type {number} */
	vnMagZ = 0;
	/**@type {number} */
	obAccX = 0;
	/**@type {number} */
	obAccY = 0;
	/**@type {number} */
	obAccZ = 0;
	/**@type {number} */
	obGyroX = 0;
	/**@type {number} */
	obGyroY = 0;
	/**@type {number} */
	obGyroZ = 0;
	/**@type {number} */
	kalmanPosX = 0;
	/**@type {number} */
	kalmanPosY = 0;
	/**@type {number} */
	kalmanPosZ = 0;
	/**@type {number} */
	kalmanVelX = 0;
	/**@type {number} */
	kalmanVelY = 0;
	/**@type {number} */
	kalmanVelZ = 0;
	/**@type {number} */
	vnPosX = 0;
	/**@type {number} */
	vnPosY = 0;
	/**@type {number} */
	vnPosZ = 0;
	/**@type {number} */
	vnGpsX = 0;
	/**@type {number} */
	vnGpsY = 0;
	/**@type {number} */
	vnGpsZ = 0;
	/**@type {number} */
	vnVelX = 0;
	/**@type {number} */
	vnVelY = 0;
	/**@type {number} */
	vnVelZ = 0;
	/**@type {number} */
	vnYPRX = 0;
	/**@type {number} */
	vnYPRY = 0;
	/**@type {number} */
	vnYPRZ = 0;
	/**@type {number} */
	orientationX = 0;
	/**@type {number} */
	orientationY = 0;
	/**@type {number} */
	orientationZ = 0;
	/**@type {number}*/
	orientationW = 0;
	/**@type {number} */
	apogee = 0;
	/**@type {number} */
	pidDeployment = 0;
	/**@type {number} */
	actualDeployment = 0;
	/**@type {number} */
	rssi = 0;

	/** @type {LogItem?} */
	startState = null;

	/** @type {number} */
	timeSinceLaunch = 0;
}
