# UI Communication Protocol

This document outlines the protocol for communications between a ground station ui and server

## Basics

### Vocabulary

In this document:

- "client" refers to a process that renders the data (eg a webpage or a window). This is the actual thing that people see for a groundstation
- "server" refers to the process that sends data to a client to be rendered

### Communcation Method

All communications happen over a single websocket connection. If the websocket is disconnected, clients must reconnect

### Stateless

Clients should be "stateless". This means that all data rendered should be data received from the server in the last server message. Clients should not try to keep track of how a datapoint changes over time or some other thing that requires to keep a history of past messages.

Statelessness is extremely important for robustness because it means that the ui page can be closed, refreshed, etc and the data presented is the same

## Connecting

Connecting requires setting up a websocket connection with the server. The actual path to connect to is `ws://<host>:<port>`. If the client is a webpage, the host can be generally (but not always) assumed to be the same host from which the page is from (`window.location.hostname`). 

The port, as of now, is 42069.

An example of this is: `ws://locahost:42069`

## Message layout

Messages are sent as a JSON string with two keys: `type` and `data`

The `type` field is one of:

- "event"
- "state"
- "command"
- "renameResponse"
- "rename"
- "message"

The value of the `data` field changes depending on what the value of the `type` field

An example message would look like:

```json
{ 
  "type": "event",
  "data": ...,
}
```

## Message Types

### `event`

These messages are sent from the server to the ui

If `type` is "event", then the data field will contain a string that contains the current state of the rocket state machine. The server sets the event to be "offline" if no reader is connected and "waiting" if the rocket is initializing. UIs are allowed to provide their default state value if they have not received an `event` message yet

Example:

```json
{ 
  "type": "event",
  "data": "AirbrakesDeploy"
}
```

### `state`

These messages are sent from the server to the ui

This is the message that contains all of the data to be rendered by the ui. The data field is an object. Most keys of the object are data sent directly from the rocket, a few keys are added by the server.

The fields from the rocket are:

- `i_timestamp` (number): The number of milliseconds since the board was turned on
- `baro` (number): The barometer reading pressure in Pa
- `baroTemperature` (number): The barometer temperature (i think in C)
- `predictedApogee` (number): The predicted apogee of the rocket
- `mainBat` (number): The main pcb battery level (pct)
- `servoBat` (number): The servo battery level (pct)
- `vnAccX` (number): The acceleration of the vectornav (in m/s)
- `vnAccY` (number): The acceleration of the vectornav (in m/s)
- `vnAccZ` (number): The acceleration of the vectornav (in m/s)
- `vnGyroX` (number): The gyro reading of the vectornav (in rad/s prolly)
- `vnGyroY` (number): The gyro reading of the vectornav (in rad/s prolly)
- `vnGyroZ` (number): The gyro reading of the vectornav (in rad/s prolly)
- `vnMagX` (number): The vectornav magnetometer reading (in something)
- `vnMagY` (number): The vectornav magnetometer reading (in something)
- `vnMagZ` (number): The vectornav magnetometer reading (in something)
- `obAccX` (number): The acceleration of the onboard imu (in m/s)
- `obAccY` (number): The acceleration of the onboard imu (in m/s)
- `obAccZ` (number): The acceleration of the onboard imu (in m/s)
- `obGyroX` (number): The gyro reading of the onboard imu (in rad/s prolly)
- `obGyroY` (number): The gyro reading of the onboard imu (in rad/s prolly)
- `obGyroZ` (number): The gyro reading of the onboard imu (in rad/s prolly)
- `kalmanPosX` (number): The position from the kalman filter (in m)
- `kalmanPosY` (number): The position from the kalman filter (in m)
- `kalmanPosZ` (number): The position from the kalman filter (in m)
- `kalmanVelX` (number): The velocity from the kalman filter (in m/s)
- `kalmanVelY` (number): The velocity from the kalman filter (in m/s)
- `kalmanVelZ` (number): The velocity from the kalman filter (in m/s)
- `vnPosX` (number): The position from the vectornav (in m)
- `vnPosY` (number): The position from the vectornav (in m)
- `vnPosZ` (number): The position from the vectornav (in m)
- `vnGpsX` (number): The gps from the vectornav (in deg)
- `vnGpsY` (number): The gps from the vectornav (in deg)
- `vnGpsZ` (number): The gps from the vectornav (in m)
- `vnVelX` (number): The velocity from the vectornav (in m/s)
- `vnVelY` (number): The velocity from the vectornav (in m/s)
- `vnVelZ` (number): The velocity from the vectornav (in m/s)
- `vnYPRX` (number): The yaw from the vectornav (in deg)
- `vnYPRY` (number): The pitch from the vectornav (in deg)
- `vnYPRZ` (number): The roll from the vectornav (in deg)
- `orientationX` (number): The orientation quaternion
- `orientationY` (number): The orientation quaternion
- `orientationZ` (number): The orientation quaternion
- `orientationW` (number): The orientation quaternion
- `apogee` (number): The highest point the rocket has reached (in m)
- `pidDeployment` (number): The expected deployment of the airbrakes (pct)
- `actualDeployment` (number): The actual deployment of the airbrakes (pct)
- `rssi` (number): The groundstation pcb radio's rssi

In the future, the number of fields sent by the rocket will drastically decrease due to radio requirements

The server adds the fields:

- `rocketConnected` (boolean): Set to true when the rocket is actively communicating with the server
- `readerConnected` (boolean): Set to true when a reader is connected to the server.
- `readerType` (string): This returns the type of the reader that the rocket is using. Currently it is either "DEBUG" (for a debug run) and "LIVE" (for when getting data from the actual rocket). These specific values will definitely change in the future
- `connected` (`[string, boolean][]`): This contains a list of all the rocket subsystems that are running and whether they are running or not. This is useful for debugging if a sensor failed to connect or something
- `startState` (`LogItem?`): This contains the original state of the rocket and can be used to determine things like travel distance and stuff. Currently this field is broken because it contains the value of the state *before* the gps comes alive
- `timeSinceLaunch` (number): This field contains the number of ms since the rocket launched. Before launch it is equal to the `i_timestamp` field

### `command`

These messages are sent from the ui to the server

A command is a message that the ui sends to the server to get it to change some internal state.

The valid commands are:

- `restart`: Restarts the reader that the server is connected to
- `switch`: Switches the reader being used (from LIVE to DEBUG or vice versa)
- `getRenameData`: Asks the server to reply with a `renameResponse` to determine valid name changes for the reader. Name changes can be used to switch the serial port that the groundstation pcb is connected to or switch the folder path of the file log reader

Example:

```json
{
  "type": "command",
  "data": "restart",
}
```

### `renameResponse`

These messages are sent from the server to the ui

This is the message that is sent in response to a `getRenameData` command message. It has two fields:

- `type`: This is either `"name"` or `"choice"`. 
- `data`: This is a string array

If `type` is `name`, then the user can choose any name they want

If `type` is `choice`, then the user must choose one of the allowed names. The allowed names are listed in the `data` field

Examples:

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
    "data": ["name1", "name2", "name3"]
  }
}
```

### `rename`

These messages are sent from the ui to the server

This message requests a reader to be renamed. The `data` field is a name string. 

Example:

```json
{
  "type": "rename",
  "data": "name1",
}
```

### `message`

These messages are sent from the server to the ui.

They are messages from the rocket. They contain six fields: 

- `type` (string): The type of the message being sent (eg `Error` or `Success`)
- `device` (string): The device that the message is being sent about (eg `VectorNav`)
- `subject` (string): What the message is about (eg `Initialization`)
- `verb` (string): What happened (eg `Failed` or `Succeeded`)
- `time` (number): The rocket program time that the message was sent at
- `left` (number): This field is expected to be set by the ui to track how long until the message should be removed

Example:

```json
{ 
  "type": "message",
  "data": {
    "type": "Error",
    "device": "Barometer",
    "subject": "Initialization",
    "verb": "Failed",
    "time": 11400,
    "left": 0,
  }
}
```
