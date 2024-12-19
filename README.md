# Ground station

This program consists of the ground station nodejs server and ui (and hopefully the connected board program eventually).

The dataflow looks like this:

```
  ┌────────┐    ┌────────┐    ┌────────┐    ┌────────────┐
  │ rocket │--->│ teensy │--->│ server │--->│ browser ui │
  └────────┘    └────────┘    └────────┘    └────────────┘
```

## Rocket

The rocket is responsible for generating all data.

2-way communication _might_ happen between the rocket and the teensy, but that would _**ONLY**_ be when the rocket is on the pad. We will probably use the 2-way communication for the computer to broadcast that it is awake to the rocket, at which point the rocket will start broadcasting radio back (that will probably be the entirety of to-rocket communication).

## Teensy

The teensy also has a few tasks:

1. Maybe have a button that allows us to tell the teensy when to allow communication to start. Tho this button can be removed if we just have the Schema rebroadcasted every 1s while rocket is on the pad
2. Filter the messages to guarantee the message order invariants of the server (as loosely described in server/ideas.md)
3. Forward any allowed messages to the server via stdin

## Server

Listen to teensy communication, transform it to json, forward to the browser

The server also needs to manage websocket connections

## Browser ui

Connect to the server, then just render the data it sends

## How to run

open a terminal and run the commands: `cd server` and `node .` (assuming nodejs is installed on your laptop). Then in a browser, navigate to [localhost:3000](http://localhost:3000)

## Protocols

Each communication layer has a different protocol (mostly because of different bandwidth allowances in each layer). The following sections outline each protocol

## Rocket-Receiver Communication protocol

Following is outlined the message layout for the packets sent from the rocket.

The packets are intended to use as few bytes as possible in order to be sendable over the low bandwidth radio. As such, the packet payloads are sent as binaries, not strings

The packet is split into two main parts: a 5 byte (for version 0) header, and a variable length payload

Note for the teensy receiver: depending on how the RFM95 chip works, there might have to be a prelude signal (something like `0xa5a5`) before the message data

### Version 0 header

The first four bits of the header is reserved for a version number. Receivers should assert that the version number from every packet matches the expected version number, with the version numbers starting at 0. This version half-byte must exist in every other version's spec

The next four bits are a number representing message type, the message types as of 12/17 are:

- Schema (value 0). This is sent for receivers to get a string representation of each struct field of LogItem
- Metadata (value 1). This is for communicating any metadata about anything
- DataUpdate (value 2). This is to send a LogItem to receivers
- Event (3). For the rocket to notify receivers of a change in the onboard state machine

Bytes two and three hold an unsigned 16 bit integer that encodes the length of the payload in bytes

Bytes four and five hold an xor'd checksum of the message

The algorithm for obtaining the checksum for the message is as follows:

```cpp
char* payload;
size_t len;
uint8_t checksums = {0, 0};

for(int i = 0; i < len; i++){
  checksums[i % 2] ^= payload[i];
}
```

For the above algorithm, byte four of the header would contain `checksum[0]` and byte five of the header would contain `checksum[1]`

### Version 0 payload

The payload is just a binary blob of `n` bytes where `n` is the length of the payload as set out by the header

The contents of the binary vary depending on message type:

If the message is Schema, the payload is a comma seperated list of the field names of `LogItem`

If the message is Metadata, the first byte is a `LogMetadataType` (as defined in `lib/log/log.h` in the main rocket code). The next four bytes are a 32 bit integer containing the metadata value. Note that the actual payload size might change as more metadata message types are defined

if the message is DataUpdate, a binary representation of a `LogItem` (as defined in `lib/log/log.h`) is sent over for receivers to update their current rocket state

If the message is Event, an enum value of the new state of the rocket is sent over. Currently, the rocket program does not implement this message, but it will in the future

The following chart shows how the data is layed out:

```
+- bits 1-4 --+---- 5-8 -----+---- 9-24 ------+-- 25-40 --+-- ... --+
|   version   | message type | length (bytes) |  checksum | message |
+-------------+--------------+----------------+-----------+---------+
```

## Receiver-Server Communication protocol

Following is the protocol for communication between the teensy receiver board and the nodejs server

The protocol is _nearly_ exactly the same as the rocket-receiver protocol except that the messages are not binary packed. They are instead encoded as a string where each byte of a rocket message is split amongst two characters via the following algorithm:

```cpp
std::string rocketMessage;
std::string newMessage = "";

for(unsigned char c : rocketMessage){
  newMessage += ((c >> 4) & 0x0f) + 'a';
  newMessage += (c & 0x0f) + 'a';
}
```

This is to allow the messages to be sent over stdin/out without having to worry about null characters or control characters or anything like that.

Essentially, the teensy receiver should just forward all messages received from the rocket to the nodejs server.

If necessary, we might add the ability for the nodejs server to communicate back and forth with the teensy but I would rather avoid the added complexity from that.

## Server-UI communication protocol

This protocol is vastly simpler than the other ones:

Each message is a json string containing two keys: `type` and `data`

`type` can contain two values: 'event' and 'state'

If `type` is 'event', then 'data' will be a string of the current event

If `type` is 'state', then 'data' will be an object equivalent to the `LogItem` sent to the server from a `DataUpdate` from the rocket
