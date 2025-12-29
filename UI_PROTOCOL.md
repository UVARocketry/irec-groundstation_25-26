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

Clients *can* hold some state as long as it is unnecesary for the look of the UI. The current ground station draws an altitude graph which must use some state history to be drawn

## 2. Connection Procedure

Establishing a connection involves setting up a WebSocket connection with the server.

*   **Connection Path**: `ws://<host>:<port>`
*   **Host**: For web-based clients, the host can generally be assumed to be the same as the originating webpage's host (`window.location.hostname`). However, this is not universally guaranteed and may vary based on deployment configuration.
*   **Port**: Currently, the designated port for WebSocket connections is `42069`.

**Example:** `ws://localhost:42069`

```js
const ws = new Websocket("ws://localhost:42069");
ws.onmessage = function(event){
  // just print the value
  console.log(event.data);
  const msg = JSON.parse(event.data);
  // now can do things with msg.
  // msg format follows the structure documented below
  console.log(msg.type);
  console.log(msg.data);
};
ws.onopen = function(){
  // a demo of sending a command to the server
  ws.send(JSON.stringify({
    type: "command",
    data: "restart",
  }));
};
```

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

*   `timestamp_ms` (number): Milliseconds since the board was powered on.
*   `baroTemperature_C` (number): Barometer temperature in degrees Celsius (C).
*   `predictedApogee_m_agl` (number): The predicted apogee (highest point) of the rocket above ground level. Unit is in meters (m).
*   `apogee_m_agl` (number): The highest altitude reached by the rocket during its flight above ground level, in meters (m).
*   `mainBat_pct` (number): Main PCB battery level as a percentage (%).
*   `servoBat_pct` (number): Servo battery level as a percentage (%).
*   `groundstationBat_pct` (number): Ground station battery level as a percentage (%).
*   `pidDeployment_pct` (number): The expected deployment percentage of the airbrakes (%).
*   `actualDeployment_pct` (number): The actual deployment percentage of the airbrakes (%).
*   `controlAuth_m` (number): Control authority in meters (m).
*   `obAcc_mps2_x` (number): Onboard IMU acceleration along the X-axis in meters per second squared ($m/s^2$).
*   `obAcc_mps2_y` (number): Onboard IMU acceleration along the Y-axis in meters per second squared ($m/s^2$).
*   `obAcc_mps2_z` (number): Onboard IMU acceleration along the Z-axis in meters per second squared ($m/s^2$).
*   `kalmanPos_m_x` (number): Kalman filter estimated position along the X-axis in meters (m).
*   `kalmanPos_m_y` (number): Kalman filter estimated position along the Y-axis in meters (m).
*   `kalmanPos_m_z` (number): Kalman filter estimated position along the Z-axis in meters (m).
*   `vnLat_deg` (number): VectorNav GPS latitude in degrees (deg).
*   `vnLon_deg` (number): VectorNav GPS longitude in degrees (deg).
*   `kalmanVel_mps_x` (number): Kalman filter estimated velocity along the X-axis in meters per second ($m/s$).
*   `kalmanVel_mps_y` (number): Kalman filter estimated velocity along the Y-axis in meters per second ($m/s$).
*   `kalmanVel_mps_z` (number): Kalman filter estimated velocity along the Z-axis in meters per second ($m/s$).
*   `vnYPR_deg_x` (number): VectorNav Yaw angle in degrees (deg).
*   `vnYPR_deg_y` (number): VectorNav Pitch angle in degrees (deg).
*   `vnYPR_deg_z` (number): VectorNav Roll angle in degrees (deg).
*   `representativeAxis_x` (number): Representative axis X component for rocket orientation.
*   `representativeAxis_y` (number): Representative axis Y component for rocket orientation.
*   `representativeAxis_z` (number): Representative axis Z component for rocket orientation.
*   `rssi_dBm` (number): Received Signal Strength Indicator (RSSI) of the ground station PCB radio in decibel-milliwatts (dBm).

**Note on Future Changes:** The number of fields directly sent by the rocket is expected to significantly decrease in the future due to radio communication bandwidth constraints.

#### 4.2.2. Server-Added Fields

These fields are augmented by the server before being sent to the client:

*   `rocketConnected` (boolean): `true` if the rocket is actively communicating with the server; otherwise, `false`.
*   `readerConnected` (boolean): `true` if a data reader (e.g., serial port, log file) is connected to the server; otherwise, `false`. A reader is the part of the server that actively listens to the rocket for data. `readerConnected` *does not* imply that the rocket is connected, just that the server is able to receive data from the rocket
*   `readerType` (string): Indicates the type of data reader currently in use.
    *   Currently: `"DEBUG"` (for debug runs) or `"LIVE"` (for live rocket data). These specific values are subject to change in future revisions.
*   `connected` (`[string, boolean][]`): An array of tuples, where each tuple represents a rocket subsystem (as a string) and its connection status. This is useful for debugging sensor failures or connection issues. The string type can be any arbitrary identifier for a subsystem.
*   `startState` (`LogItem?`): Represents the initial state of the rocket. This can be used for calculations like total travel distance.
    *   **Note:** A `LogItem` refers to the collection of rocket-sourced fields found within a `state` message (`timestamp_ms` through `rssi_dBm`).
    *   **Known Issue:** Currently, this field contains the state *before* the GPS becomes active, which may lead to inaccuracies in initial position determination.
*   `timeSinceLaunch` (number): The number of milliseconds elapsed since the rocket launched (used to determine the amount of time the rocket spent in the air). Before launch, this field is equal to `i_timestamp`, and not 0.

### 4.3. `command`

**Direction:** UI to Server

A `command` message is sent by the UI to request a change in the server's internal state or to trigger a specific action.

*   **`data` (string)**: The specific command to be executed.
    *   **Valid Commands:**
        *   `"restart"`: Restarts the data reader connected to the server.
        *   `"switch"`: Toggles the active data reader between "LIVE" and "DEBUG" modes (or equivalent types).
        *   `"getRenameData"`: (***DEPRECATED*** in favor of `getConfigurationOptions`) Requests the server to respond with a `renameResponse` message, providing information about valid name changes for the active reader. Name changes typically relate to switching the serial port connected to the ground station PCB or changing the folder path for a file log reader.
        * `"getConfigurationOptions"`: Requests the server to respond with a `configurationOptions` message providing information about valid configuration states for the entire server (can include the current reader or other things).

**Example:**

```json
{
  "type": "command",
  "data": "restart"
}
```

### 4.4. `renameResponse`

> [!CAUTION]
> 
> ***DEPRECATED***: `renameResponse` has been deprecated in favor of `configurationOptions`

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

**Note**: Naming the subfields `type` and `data` is confusing. For next year, please consider a new name

### 4.5. `rename`

> [!CAUTION]
>
> ***DEPRECATED*** in favor of `setConfiguration`

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
    *   `left` (number): This field is intended to be managed by the UI to track the remaining display time for the message before it should be removed. The server will typically send this field with a default value of `0`. Its interpretation (e.g., as milliseconds, animation frames) is left to the individual UI implementation. This field does violate the stateless principle, however, it does not really matter a huge amount because messages are intended to be displayed for a short period of time.

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

### 4.7. `configurationOptions`

**Direction:** Server to UI

This message is sent to the UI from the server in response to a `getConfigurationOptions` `command`. 

It returns an object of the valid configurations of the server. In the future, this might also be updated to include configurations of the rocket or the groundstation PCB. It returns a generic JSON object, however, the root values are not actual values, but instead an array with one `ConfigOptions` object. There are two kinds of `ConfigOptions`: `InputConfigOptions` and `SelectConfigOptions`. Both of them have a field called `element` which clients can use to check if an object is either part of the object tree or a `ConfigOptions` object.

`SelectConfigOptions` refers to when a configuration field has a limited number of options and users must choose one of the valid ones (eg serial ports). It always has the following fields:

- `element` (string): This value will *always* be set to `"select"` for this type of object. 
- `options` (any[]): This is an array of the possible values that the user must choose one of which to set as the new option. The default option that clients should send back in their `setConfiguration` request is the first element in the array

`InputConfigOptions` refers to when a configuration has any number of possible inputs and the user is expected to come up with one (eg directories to save packets to). It always has the following fields:

- `element` (string): This value will *always* be set to `"input"`
- `default` (string): The json string representation of the default value
- `type` (string): This is not expected to be parsed by clients, but should instead be showed to users so that they can type in their responses in the expected json format

**Example:**

```json
{
    "type": "configurationOptions",
    "data": {
        "manager": {
            "saveFolder": [
                { "element": "input", "default": "", "type": "string" }
            ],
            "readerConfig": {
                "dir": [
                    {
                        "element": "select",
                        "options": [
                            "../out",
                            "../out_launch",
                        ]
                    }
                ]
            }
        }
    }
}
```

### 4.8. `setConfiguration`

**Direction:** UI to Server

This is the expected response message when a user has completely filled out a configuration on the UI. It has the same structure as the `configurationOptions` message, except the arrays of `ConfigOptions` are expected to be replaced with the user selected value.

**Example:**

This is a possible response to the above `configurationOptions` message

```json
{
    "type": "setConfiguration",
    "data": {
        "manager": {
            "saveFolder": "",
            "readerConfig": {
                "dir": "../out"
            }
        }
    }
}
```
