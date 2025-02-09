import { AddedData } from "./AddedData.js";

// NOTE: this will need to be changed everytime the main rocket code changes
export class LogItem extends AddedData {
    /** @type {number} */
    gpsX = 0;
    /** @type {number} */
    gpsY = 0;
    /** @type {number} */
    gpsZ = 0;

    /** @type {number} */
    i_timestamp = 0;

    /** @type {number} */
    baro = 0;
    /** @type {number} */
    predictedApogee = 0;

    /** @type {number} */
    vnAccX = 0;
    /** @type {number} */
    vnAccY = 0;
    /** @type {number} */
    vnAccZ = 0;

    /** @type {number} */
    gyroX = 0;
    /** @type {number} */
    gyroY = 0;
    /** @type {number} */
    gyroZ = 0;

    /** @type {number} */
    magX = 0;
    /** @type {number} */
    magY = 0;
    /** @type {number} */
    magZ = 0;

    /** @type {number} */
    kalmanPosX = 0;
    /** @type {number} */
    kalmanPosY = 0;
    /** @type {number} */
    kalmanPosZ = 0;

    /** @type {number} */
    kalmanVelX = 0;
    /** @type {number} */
    kalmanVelY = 0;
    /** @type {number} */
    kalmanVelZ = 0;

    /** @type {number} */
    orientationW = 0;
    /** @type {number} */
    orientationX = 0;
    /** @type {number} */
    orientationY = 0;
    /** @type {number} */
    orientationZ = 0;

    /** @type {number} */
    apogee = 0;

    /** @type {number} */
    pidDeployment = 0;
    /** @type {number} */
    actualDeployment = 0;

    /** @type {LogItem?} */
    startState = null;

    /** @type {number} */
    timeSinceLaunch = 0;
}
