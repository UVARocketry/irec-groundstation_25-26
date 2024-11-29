# protocol for communication

## rocket connection

There are two possibilities for rocket connection time:

1. We connect when it's on the pad. Normal communication between us and the rocket can occur. However, all communication to the rocket should be managed on connected teensy, not this server.

THIS SERVER HOLDS AS AN INVARIANT SOME SPECIFIC ORDER OF MESSAGES (Schema -> DataUpdate (idrk rn, but something like this)). IF this invariant is broken, undefined behavior may occur (ie all messages are ignored or something). IT is up to the connected teensy to ensure that this invariant holds

2. We connect when it's actively in-flight, pre-apogee. At this point, we can kinda just throw up our hands and ignore all communication as we dont have a verified schema. HOWEVER, that is kinda annoying, so we SHOULD try to keep a good schema lying around and use that just in case.

NB: I kinda realized after writing this that the above section is more about how the laptop-connected teensy program should work, but it is helpful to have this somewhere

## client connection

what needs to happen at client connection is one of two things:

1. Send over the current rocket state (NOTE: the client does not need the schema, as that is encoded in the json payload sent to the client during each data update)
2. Send over an IOU essentially saying the rocket hasnt come online yet, so we can just chill

## data update

whenever a data update happens, just forward to client. Client is expected to remember the current flight state. Server must also remember client state in case a new client logs on

## data structure

the json packet sent over should be pretty simple:

```json
{
    "messageType": "{string}",
    "payload": "{object}"
}
```

where payload contains the json data prepared by the server
