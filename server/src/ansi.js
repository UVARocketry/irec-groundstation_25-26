// Terminals by default can only print plain text.
// However, you can make that text do some cooler things using ANSI Codes.
// The basic format is that they all start with the ESC character (0x1b) and the '[' character. 
// Some basic ansi codes are defined here
export const AnsiCodes = {
    // clears any effect by the following codes
    Reset: "\x1b[0m",

    Bright: "\x1b[1m",
    Dim: "\x1b[2m",
    Underscore: "\x1b[4m",
    Blink: "\x1b[5m",
    Reverse: "\x1b[7m",
    Hidden: "\x1b[8m",

    // Set text foreground color to specified color
    FgBlack: "\x1b[30m",
    FgRed: "\x1b[31m",
    FgGreen: "\x1b[32m",
    FgYellow: "\x1b[33m",
    FgBlue: "\x1b[34m",
    FgMagenta: "\x1b[35m",
    FgCyan: "\x1b[36m",
    FgWhite: "\x1b[37m",
    FgGray: "\x1b[90m",

    // set text background color
    BgBlack: "\x1b[40m",
    BgRed: "\x1b[41m",
    BgGreen: "\x1b[42m",
    BgYellow: "\x1b[43m",
    BgBlue: "\x1b[44m",
    BgMagenta: "\x1b[45m",
    BgCyan: "\x1b[46m",
    BgWhite: "\x1b[47m",
    BgGray: "\x1b[100m",
};

export const Strings = {
    Error: `${AnsiCodes.FgRed}ERROR${AnsiCodes.FgWhite}`,
    Ok: `${AnsiCodes.FgGreen}OK${AnsiCodes.FgWhite}`,
    Warn: `${AnsiCodes.FgYellow}WARN${AnsiCodes.FgWhite}`,
    Info: `${AnsiCodes.FgBlue}INFO${AnsiCodes.FgWhite}`,
};
