# Ground station

This program consists of the ground station nodejs server and ui (and hopefully the connected board program eventually).

The dataflow currenly looks like this:

```
  ┌────────┐    ┌────────┐    ┌────────┐    ┌────────────┐
  │ rocket │<-->│ teensy │--->│ server │<-->│ browser ui │
  └────────┘    └────────┘    └────────┘    └────────────┘
```

## Rocket

The rocket is responsible for generating all data.

2-way communication _might_ happen between the rocket and the teensy, but that would _**ONLY**_ be when the rocket is on the pad. We will probably use the 2-way communication for the computer to broadcast that it is awake to the rocket, at which point the rocket will start broadcasting radio back (that will probably be the entirety of to-rocket communication).

## Teensy

The teensy is merely a pass through point between the rocket and the server. The teensy may add some minor data, but it will be in line with the communication protocol

## Server

Listen to teensy communication, transform it to json, forward to the browser

The server also needs to manage websocket connections to each individual ui

### Todo

The server should probably be able to send messages to the teensy to possibly configure things on the rocket. The server should also be able to send messages to the teensy board to say when it has turned on to get more data just in case the server crashes

## Browser ui

Connect to the server, then just render the data it sends

The browser also sends some messages back to the server to configure things there

### Todo

We need an actual framework for communication between the server and browser

## How to run

open a terminal and run the commands: `cd server`, `npm i` (NOTE that this only needs to be done once and `node .` (assuming nodejs is installed on your laptop). Then in a browser, navigate to [localhost:3000](http://localhost:3000)

## Protocols

Each communication layer has a different protocol (mostly because of different bandwidth allowances in each layer)

