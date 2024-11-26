# Ground station server

This program will be _VERY_ simple. It essentially has one purpose: receive data from the rocket, convert it to a json representation, then forward it to the UI program via websocket to render.

This program must be able to accept input from multiple sources:

- reading the stdout from `pio run` (AKA reading the radio data sent to us)
- reading output from rocketpy in realtime (i think that will just be a file dump)

We also need a way to save a configuration json file so that it is really easy to rerun things
