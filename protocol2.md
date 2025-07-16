# UI Communication Protocol

This document defines the communication protocol between a ground station User Interface (UI) and a server. It outlines the fundamental principles, connection procedures, and message structures for effective data exchange.

## 1. Core Concepts

### 1.1. Vocabulary

For the purpose of this document, the following terms are defined:

*   **Client**: Refers to the process responsible for rendering data, such as a web application or a desktop window. This represents the visual interface observed by the user.
*   **Server**: Refers to the backend process that transmits data to a client for rendering.

### 1.2. Communication Method

All communication between the client and server is conducted over a single [WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API) connection. Clients are responsible for re-establishing the connection if the WebSocket is disconnected.

### 1.3. Stateless Client Design

Clients are designed to be "stateless." This implies that all data rendered by the client should be derived solely from the most recent message received from the server. Clients **must not** attempt to maintain a historical record of data changes or any state that requires referencing past messages.

The stateless nature of the client is paramount for system robustness. It ensures that the UI can be closed, refreshed, or unexpectedly terminated without losing data integrity, as the displayed information is always a direct reflection of the current server state.

## 2. Connection Procedure

Establishing a connection involves setting up a WebSocket connection with the server.

*   **Connection Path**: `ws://<host>:<port>`
*   **Host**: For web-based clients, the host can generally be assumed to be the same as the originating webpage's host (`window.location.hostname`). However, this is not universally guaranteed and may vary based on deployment configuration.
*   **Port**: Currently, the designated port for WebSocket connections is `42069`.

**Example:** `ws://localhost:42069`

## 3. Message Structure

All messages exchanged between the client and server are transmitted as JSON strings. Each message must contain two primary keys: `type` and `data`.

*   **`type` (string)**: Specifies the category or purpose of the message.
    *   Valid values: `"event"`, `"state"`, `"command"`, `"renameResponse"`, `"rename"`, `"message"`.
*   **`data` (any)**: The content of the message, whose structure and value depend on the `type` field.

**Example Message Format:**

```json
{
  "type": "event",
  "data": "..."
}
```

## 4. Message Types

This section details the various message types and their specific structures.

### 4.1. `event`

**Direction:** Server to UI

This message type conveys the current state of the rocket's state machine.

*   **`data` (string)**: A string representing the current state.
    *   The server sets the `data` to `"offline"` if no data reader is connected.
    *   The server sets the `data` to `"waiting"` if the rocket is undergoing initialization.
*   **Client Behavior**: UIs are permitted to display a default state value if an `event` message has not yet been received.

**Example:**

```json
{
  "type": "event",
  "data": "AirbrakesDeploy"
}
```

### 4.2. `state`

**Direction:** Server to UI

This message is the primary channel for transmitting all data intended for rendering by the UI. The `data` field is a JSON object. Most keys within this object represent data directly sourced from the rocket, while a few are added by the server.

#### 4.2.1. Rocket-Sourced Fields

These fields are transmitted directly from the rocket's onboard systems:

*   `i_timestamp` (number): Milliseconds since the board was powered on.
*   `baro` (number): Barometric pressure reading in Pascals (Pa).
*   `baroTemperature` (number): Barometer temperature in degrees Celsius (C).
*   `predictedApogee` (number): The predicted apogee (highest point) of the rocket. Unit is in meters (m).
*   `mainBat` (number): Main PCB battery level as a percentage (%).
*   `servoBat` (number): Servo battery level as a percentage (%).
*   `vnAccX` (number): VectorNav acceleration along the X-axis in meters per second squared (\( \text{m/s}^2 \)).
*   `vnAccY` (number): VectorNav acceleration along the Y-axis in meters per second squared (\( \text{m/s}^2 \)).
*   `vnAccZ` (number): VectorNav acceleration along the Z-axis in meters per second squared (\( \text{m/s}^2 \)).
*   `vnGyroX` (number): VectorNav gyroscope reading along the X-axis in radians per second (\( \text{rad/s} \)).
*   `vnGyroY` (number): VectorNav gyroscope reading along the Y-axis in radians per second (\( \text{rad/s} \)).
*   `vnGyroZ` (number): VectorNav gyroscope reading along the Z-axis in radians per second (\( \text{rad/s} \)).
*   `vnMagX` (number): VectorNav magnetometer reading along the X-axis. **Unit Undefined.**
*   `vnMagY` (number): VectorNav magnetometer reading along the Y-axis. **Unit Undefined.**
*   `vnMagZ` (number): VectorNav magnetometer reading along the Z-axis. **Unit Undefined.**
*   `obAccX` (number): Onboard IMU acceleration along the X-axis in meters per second squared (\( \text{m/s}^2 \)).
*   `obAccY` (number): Onboard IMU acceleration along the Y-axis in meters per second squared (\( \text{m/s}^2 \)).
*   `obAccZ` (number): Onboard IMU acceleration along the Z-axis in meters per second squared (\( \text{m/s}^2 \)).
*   `obGyroX` (number): Onboard IMU gyroscope reading along the X-axis in radians per second (\( \text{rad/s} \)).
*   `obGyroY` (number): Onboard IMU gyroscope reading along the Y-axis in radians per second (\( \text{rad/s} \)).
*   `obGyroZ` (number): Onboard IMU gyroscope reading along the Z-axis in radians per second (\( \text{rad/s} \)).
*   `kalmanPosX` (number): Kalman filter estimated position along the X-axis in meters (m).
*   `kalmanPosY` (number): Kalman filter estimated position along the Y-axis in meters (m).
*   `kalmanPosZ` (number): Kalman filter estimated position along the Z-axis in meters (m).
*   `kalmanVelX` (number): Kalman filter estimated velocity along the X-axis in meters per second (\( \text{m/s} \)).
*   `kalmanVelY` (number): Kalman filter estimated velocity along the Y-axis in meters per second (\( \text{m/s} \)).
*   `kalmanVelZ` (number): Kalman filter estimated velocity along the Z-axis in meters per second (\( \text{m/s} \)).
*   `vnPosX` (number): VectorNav reported position along the X-axis in meters (m).
*   `vnPosY` (number): VectorNav reported position along the Y-axis in meters (m).
*   `vnPosZ` (number): VectorNav reported position along the Z-axis in meters (m).
*   `vnGpsX` (number): VectorNav GPS latitude in degrees (deg).
*   `vnGpsY` (number): VectorNav GPS longitude in degrees (deg).
*   `vnGpsZ` (number): VectorNav GPS altitude in meters (m).
*   `vnVelX` (number): VectorNav velocity along the X-axis in meters per second (\( \text{m/s} \)).
*   `vnVelY` (number): VectorNav velocity along the Y-axis in meters per second (\( \text{m/s} \)).
*   `vnVelZ` (number): VectorNav velocity along the Z-axis in meters per second (\( \text{m/s} \)).
*   `vnYPRX` (number): VectorNav Yaw angle in degrees (deg).
*   `vnYPRY` (number): VectorNav Pitch angle in degrees (deg).
*   `vnYPRZ` (number): VectorNav Roll angle in degrees (deg).
*   `orientationX` (number): Quaternion X component for rocket orientation.
*   `orientationY` (number): Quaternion Y component for rocket orientation.
*   `orientationZ` (number): Quaternion Z component for rocket orientation.
*   `orientationW` (number): Quaternion W component for rocket orientation.
*   `apogee` (number): The highest altitude reached by the rocket during its flight, in meters (m).
*   `pidDeployment` (number): The expected deployment percentage of the airbrakes (%).
*   `actualDeployment` (number): The actual deployment percentage of the airbrakes (%).
*   `rssi` (number): Received Signal Strength Indicator (RSSI) of the ground station PCB radio.

**Note on Future Changes:** The number of fields directly sent by the rocket is expected to significantly decrease in the future due to radio communication bandwidth constraints.

#### 4.2.2. Server-Added Fields

These fields are augmented by the server before being sent to the client:

*   `rocketConnected` (boolean): `true` if the rocket is actively communicating with the server; otherwise, `false`.
*   `readerConnected` (boolean): `true` if a data reader (e.g., serial port, log file) is connected to the server; otherwise, `false`.
*   `readerType` (string): Indicates the type of data reader currently in use.
    *   Currently: `"DEBUG"` (for debug runs) or `"LIVE"` (for live rocket data). These specific values are subject to change in future revisions.
*   `connected` (`[string, boolean][]`): An array of tuples, where each tuple represents a rocket subsystem (as a string) and its connection status. This is useful for debugging sensor failures or connection issues. The string type can be any arbitrary identifier for a subsystem.
*   `startState` (`LogItem?`): Represents the initial state of the rocket. This can be used for calculations like total travel distance.
    *   **Note:** A `LogItem` refers to the collection of rocket-sourced fields found within a `state` message (`i_timestamp` through `rssi`).
    *   **Known Issue:** Currently, this field contains the state *before* the GPS becomes active, which may lead to inaccuracies in initial position determination.
*   `timeSinceLaunch` (number): The number of milliseconds elapsed since the rocket launched. Before launch, this field is equal to `i_timestamp`.

### 4.3. `command`

**Direction:** UI to Server

A `command` message is sent by the UI to request a change in the server's internal state or to trigger a specific action.

*   **`data` (string)**: The specific command to be executed.
    *   **Valid Commands:**
        *   `"restart"`: Restarts the data reader connected to the server.
        *   `"switch"`: Toggles the active data reader between "LIVE" and "DEBUG" modes (or equivalent types).
        *   `"getRenameData"`: Requests the server to respond with a `renameResponse` message, providing information about valid name changes for the active reader. Name changes typically relate to switching the serial port connected to the ground station PCB or changing the folder path for a file log reader.

**Example:**

```json
{
  "type": "command",
  "data": "restart"
}
```

### 4.4. `renameResponse`

**Direction:** Server to UI

This message is sent by the server in response to a `getRenameData` command. It provides options for renaming or reconfiguring the data reader.

*   **`data` (object)**: Contains details about the renaming options.
    *   **`type` (string)**: Specifies the nature of the renaming option.
        *   `"name"`: Indicates that the user can provide any arbitrary name for the reader.
        *   `"choice"`: Indicates that the user must select one of the predefined names provided in the `data` array.
    *   **`data` (string[])**: An array of strings.
        *   If `type` is `"name"`, this array will be empty.
        *   If `type` is `"choice"`, this array will list the allowed names for the reader.

**Examples:**

```json
{
  "type": "renameResponse",
  "data": {
    "type": "name",
    "data": []
  }
}
```

```json
{
  "type": "renameResponse",
  "data": {
    "type": "choice",
    "data": ["/dev/ttyUSB0", "/dev/ttyUSB1", "LogFolder_Run1"]
  }
}
```

### 4.5. `rename`

**Direction:** UI to Server

This message is sent by the UI to request that the active data reader be renamed or reconfigured.

*   **`data` (string)**: The new name or identifier for the reader. This value must correspond to the options provided by a preceding `renameResponse` message.

**Example:**

```json
{
  "type": "rename",
  "data": "/dev/ttyUSB0"
}
```

### 4.6. `message`

**Direction:** Server to UI

These messages originate from the rocket and are forwarded by the server to the UI. They typically convey status, errors, or significant events from onboard systems.

*   **`data` (object)**: Contains details about the rocket message.
    *   `type` (string): The category of the message (e.g., `"Error"`, `"Warning"`, `"Success"`, `"Info"`).
    *   `device` (string): The onboard device or subsystem associated with the message (e.g., `"Barometer"`, `"VectorNav"`, `"FlightComputer"`).
    *   `subject` (string): The specific operation or component the message pertains to (e.g., `"Initialization"`, `"Telemetry"`, `"Deployment"`).
    *   `verb` (string): Describes the outcome or action (e.g., `"Failed"`, `"Succeeded"`, `"Started"`, `"Stopped"`).
    *   `time` (number): The rocket program time (in milliseconds) when the message was generated.
    *   `left` (number): This field is intended to be managed by the UI to track the remaining display time for the message before it should be removed. The server will typically send this field with a default value of `0`. Its interpretation (e.g., as milliseconds, animation frames) is left to the individual UI implementation.

**Example:**

```json
{
  "type": "message",
  "data": {
    "type": "Error",
    "device": "Barometer",
    "subject": "Initialization",
    "verb": "Failed",
    "time": 11400,
    "left": 0
  }
}
```
