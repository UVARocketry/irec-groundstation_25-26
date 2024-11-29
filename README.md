# Ground station

This program consists of the ground station nodejs server and ui (and hopefully the connected board program eventually).

The dataflow looks like this:

```
  ┌────────┐    ┌────────┐    ┌────────┐    ┌────────────┐
  │ rocket │<==>│ teensy │--->│ server │--->│ browser ui │
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
