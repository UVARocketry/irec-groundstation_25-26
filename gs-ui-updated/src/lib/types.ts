export interface LogItem {
    timestamp_ms: number;
    baroTemperature_C: number;
    predictedApogee_m_agl: number;
    apogee_m_agl: number;
    mainBat_pct: number;
    servoBat_pct: number;
    groundstationBat_pct: number;
    pidDeployment_pct: number;
    actualDeployment_pct: number;
    controlAuth_m: number;
    obAcc_mps2_x: number; obAcc_mps2_y: number; obAcc_mps2_z: number;
    kalmanPos_m_x: number; kalmanPos_m_y: number; kalmanPos_m_z: number;
    vnLat_deg: number;
    vnLon_deg: number;
    kalmanVel_mps_x: number; kalmanVel_mps_y: number; kalmanVel_mps_z: number;
    vnYPR_deg_x: number; vnYPR_deg_y: number; vnYPR_deg_z: number;
    representativeAxis_x: number; representativeAxis_y: number; representativeAxis_z: number;
    rssi_dBm: number;
    event: string;
    timeSinceLaunch: number;
    startState?: LogItem | null;
}