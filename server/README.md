# Logging Server

## Current version

The following diagram kinda illustrates the current architecture. 

```
┌────────────────┐             command                        ┌───────┐
│websocket server│◄───────────────────────────────────────────│browser│
└────────────────┘───────────────────────────────────────────►└───────┘
 ▲           │                  data
 │           ▼
 │        ┌───────────────┐                    
 │        │handleUiRequest│───────────────────────────┐
 │        └───────────────┘                           │
 │            ┌───────────┐                           │
 │            │InputReader│                           │
 │via         └───────────┘                           │
 │broadcast()    ▲                                    │
 │               │                                    │
┌────────┐       │                                    │
│onUpdate│       │inherits from                       │
└────────┘       │                                    │
 │  ▲            │                                    │
 │  │ calls     ┌─────────┐ writes  ┌─────────┐       │
 │  └───────────│ *Reader │────────►│save dir │       │
 │        ┌─────└─────────┘         └─────────┘       │
 │        │       ▲                                   │
 │        │       │triggers                           │
 │changes │       │                                   │
 │        │     ┌─────────────┐                       │
 │        │     │outside input│                       │
 │        │     └─────────────┘                       │
 ▼        ▼                                           │
 ┌──────────────┐      changes                        │
 │internal state│ ◄───────────────────────────────────┘
 └──────────────┘
```

To say the least, the above diagram is gross. To be fair, 
the server was never intended to actually be a sizable program. 
It was intended just as a passthrough between the data producers
(eg the rocket, or save files), and the data consumers (the uis).
Unfortunately, that is actually a more difficult problem than I 
had originally envisioned, which led to this current server

However, I think we can improve the server a lot by reworking the
architecture so that it actually fits our goal

## New plan

Proposed new architecture:

```
┌────────────────┐             command                        ┌───────┐
│websocket server│◄───────────────────────────────────────────│browser│
└────────────────┘───────────────────────────────────────────►└───────┘
    │  ▲                        data
    │  │
    │  │via broadcast()
    ▼  │
┌───────────────┐  writes  ┌──────────┐
│ ReaderManager │────────► │ save dir │
└───────────────┘          └──────────┘
    │  ▲
    │  │
    ▼  │
┌───────────┐
│  *Reader  │
└───────────┘
    │  ▲
    │  │
    ▼  │
┌───────────────┐
│ outside input │
└───────────────┘
```

The plan is that the new architecture is implemented with callbacks through the stack 
(eg ReaderManager sets a callback in the Reader that Reader can call when it has data).

Another goal is to be very strict about separations of concerns: `Reader`s should 
***ONLY*** read data from an input, normalize it to a common format (binary, 4-bit 
encoded), then forward it to `ReaderManager`. `ReaderManager` should handle most of the 
work:

- saving the data to an output folder
- parsing data from `Reader`s to a useful representation for the ui (json-encoded)
- swapping out the current `Reader` at the ui's request
- managing internal server state (calling the `set*` functions in `state.js`)
- broadcasting messages to uis
- handling command messages from uis
- forwarding commands (if necessary) to the current `Reader`

Right now, that functionality is kinda spread across a lot of different places, and 
I think it would be a really good idea to centralize everything

One thing we should do, is split the `rename` protocol element (see `UI_PROTOCOL.md`)
to two protocol elements: `changeSaveFolder`, `changeInput`.
Right now, `rename` is almost exclusively for `changeInput` with no method for 
`changeSaveFolder`. However, `rename` on `StdinReader` is equivalent to 
`changeSaveFolder`, not `changeInput`

It would also be nice to provide a `configure` protocol element (UI->server) that...
configures... stuff. (Eg what command and cwd to run with `StdinReader`).

What we could probably do, is merge everything into 
`getCurrentConfiguration` (UI->server)
/ `currentConfig`(Server->UI) / `configure`(UI->server) protocol elements. 
Eg, if the current reader is a `StdinReader`, then the `currentConfig` would return:

```json
{
    "manager": {
        "saveFolder": "out_idrk",
        "readerType": "stdin",
        "reader": {
            "cwd": "../../irec_25-26/lib",
            "cmd": "./run",
            "args": [],
            "stream": "stderr",
        },
    },
}
```

Then, UIs should provide some way to edit that json and send it back through `configure`
protocol element.

Lowkey, there could be a UI just for configuration/managing current reader. Then the
telemetry visualization and live video UIs could just chill and not have to worry about
configuration

Also, a new unified configuration API would make crash recovery ***REALLY*** easy: we 
just save that json file to disk along with other helpful info (like is this reader
actually recoverable or not (`StdinReader` is not, `SeralReader` might be)) and
if we restart after a crash, we just read that file then just internally call the 
`configure` protocol method and *hopefully* chill

### ok ok ok what does this all mean

Basically: nuke `command/getRenameData`, `renameResponse`, and `rename` 
from `UI_PROTOCOL.md`, and replace with `command/getConfiguration`, 
`currentConfiguration`, and `configure`.

Also, upgrade `command/switch` implementation to allow more than two readers 
(this will be easy once we get `ReaderManager` finished)
