const std = @import("std");
const clap = @import("clap");

const MsgType = enum(u4) {
    /// list of comma seperated strings of field names
    Schema = 0,
    /// to be used for metadata if needed
    Metadata = 1,
    /// a struct with the update bits
    DataUpdate = 2,
    /// sent by the listener that they are ready for data updates
    Acknowledgement = 5,
    /// for sending an event (eg statemachine state change)
    Event = 3,
    /// for sending the list of event names
    EventSchema = 4,
    /// For sending a message
    Message = 6,
};

const MetadataType = enum(u8) {
    FloatSize = 0,
    GpsTow = 1,
    GpsWeek = 2,
};
const FloatSizeMetadata = packed struct {
    floatSize: u8,
    padding: u24,
};

const MetadataValue = packed union {
    floatSize: FloatSizeMetadata,
    gpsTow: packed struct {
        gpsTow: f64,
        timestamp: i32,
    },
    gpsWeek: u16,
};

const MetadataPacket = packed struct {
    type: MetadataType,
    value: MetadataValue,
    pub fn format(
        self: MetadataPacket,
        comptime fmt: []const u8,
        options: std.fmt.FormatOptions,
        writer: anytype,
    ) !void {
        _ = fmt;
        _ = options;
        try writer.print("Type: {?}\n", .{self.type});
        try writer.print("Value: {?}\n", .{self.value});
        const info: std.builtin.Type = @typeInfo(MetadataValue);
        switch (info) {
            .@"union" => |v| {
                inline for (v.fields) |field| {
                    try writer.print(
                        "  {s}: {?}\n",
                        .{ field.name, @field(self.value, field.name) },
                    );
                }
            },
            else => unreachable,
        }
    }
};

const DataUpdate = packed struct {
    i_timestamp: i32,
    baro: f32,
    baroTemperature: f32,
    predictedApogee: f32,
    mainBat: f32,
    servoBat: f32,
    vnAccX: f32,
    vnAccY: f32,
    vnAccZ: f32,
    vnGyroX: f32,
    vnGyroY: f32,
    vnGyroZ: f32,
    vnMagX: f32,
    vnMagY: f32,
    vnMagZ: f32,
    obAccX: f32,
    obAccY: f32,
    obAccZ: f32,
    obGyroX: f32,
    obGyroY: f32,
    obGyroZ: f32,
    kalmanPosX: f32,
    kalmanPosY: f32,
    kalmanPosZ: f32,
    kalmanVelX: f32,
    kalmanVelY: f32,
    kalmanVelZ: f32,
    vnPosX: f32,
    vnPosY: f32,
    vnPosZ: f32,
    vnGpsX: f32,
    vnGpsY: f32,
    vnGpsZ: f32,
    vnVelX: f32,
    vnVelY: f32,
    vnVelZ: f32,
    vnYPRX: f32,
    vnYPRY: f32,
    vnYPRZ: f32,
    orientationW: f32,
    orientationX: f32,
    orientationY: f32,
    orientationZ: f32,
    apogee: f32,
    pidDeployment: f32,
    actualDeployment: f32,
    rssi: f32,
    pub fn format(
        self: DataUpdate,
        comptime fmt: []const u8,
        options: std.fmt.FormatOptions,
        writer: anytype,
    ) !void {
        _ = fmt;
        _ = options;
        try writer.print("DataUpdate:\n", .{});
        const info: std.builtin.Type = @typeInfo(DataUpdate);
        switch (info) {
            .@"struct" => |v| {
                comptime var maxLen = 0;
                inline for (v.fields) |field| {
                    if (field.name.len > maxLen) {
                        maxLen = field.name.len;
                    }
                }
                // A format string so that all names are the same length
                const str = std.fmt.comptimePrint("  {{s: <{d}}}: {{d:10.7}}\n", .{maxLen});
                inline for (v.fields) |field| {
                    try writer.print(str, .{ field.name, @field(self, field.name) });
                }
            },
            else => unreachable,
        }
    }
};

const LogEventType = enum(u32) {
    Startup = 0,
    Wait = 1,
    Launch = 2,
    MotorBurn = 3,
    AirbrakesDeploy = 4,
    Parachute = 5,
    Landing = 6,
    AwaitRecovery = 7,
};

const Event = packed struct {
    event: LogEventType,
    timestamp: u32,
};

const MsgHeader = packed struct {
    version: u4,
    type: MsgType,
    length: u16,
    checksumLeft: u8,
    checksumRight: u8,
};

pub fn main() !void {
    comptime if (@bitSizeOf(MsgHeader) != 40) {
        @compileError(std.fmt.comptimePrint(
            "Bytes: {}, bits: {}",
            .{ @sizeOf(MsgHeader), @bitSizeOf(MsgHeader) },
        ));
    };
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    const allocator = gpa.allocator();
    defer {
        const deinitStatus = gpa.deinit();
        if (deinitStatus == .leak) {
            @panic("LEAKED MEMORY!");
        }
    }
    // First we specify what parameters our program can take.
    // We can use `parseParamsComptime` to parse a string into an array of `Param(Help)`.
    const params = comptime clap.parseParamsComptime(
        \\-h, --help             Display this help and exit.
        \\-p, --parse            Parses the stdin as a message and outputs the value
        \\-c, --csv <str>        Parses the stdin as a message and outputs the selected fields as a csv
        \\-H, --header <str>     Parses the headers and outputs the valid csv headers
        \\<str>...
        \\
    );

    // Initialize our diagnostics, which can be used for reporting useful errors.
    // This is optional. You can also pass `.{}` to `clap.parse` if you don't
    // care about the extra information `Diagnostics` provides.
    var diag = clap.Diagnostic{};
    var res = clap.parse(clap.Help, &params, clap.parsers.default, .{
        .diagnostic = &diag,
        .allocator = gpa.allocator(),
    }) catch |err| {
        // Report useful error and exit.
        diag.report(std.io.getStdErr().writer(), err) catch {};
        return err;
    };
    defer res.deinit();
    const stdout_file = std.io.getStdOut().writer();
    var bw = std.io.bufferedWriter(stdout_file);
    const stdout = bw.writer();

    if (res.args.header) |header| {
        const isStar = std.mem.eql(u8, header, "all");
        std.debug.print("{s}\n", .{header});
        var headers = std.mem.splitScalar(u8, header, ',');
        const info = @typeInfo(DataUpdate);
        var outputComma = false;
        while (headers.next()) |csvRow| {
            if (csvRow.len == 0) {
                continue;
            }
            switch (info) {
                .@"struct" => |st| {
                    inline for (st.fields) |field| {
                        if (std.mem.eql(u8, csvRow, field.name) or isStar) {
                            if (outputComma) {
                                try stdout.print(",", .{});
                            }
                            try stdout.print("{s}", .{field.name});
                            outputComma = true;
                        }
                    }
                },
                else => unreachable,
            }
        }
        try stdout.print("\n", .{});
        try bw.flush();
        return;
    }
    const isParse = res.args.parse != 0;
    const reader = std.io.getStdIn().reader();
    var buf = std.ArrayList(u8).init(allocator);
    defer buf.deinit();
    try reader.readAllArrayList(&buf, 3000);

    if (isParse)
        try stdout.print("{s}\n", .{buf.items});
    if (buf.items.len == 0) {
        if (isParse)
            try stdout.print("AYYO NOTHING THERE\n", .{});
        return;
    }
    if (buf.items[buf.items.len - 1] == '\n') {
        _ = buf.pop();
    }
    if (buf.items.len % 2 != 0) {
        if (isParse)
            try stdout.print(
                "dawg you gotta gimme an even number of chars, i got {}\n",
                .{buf.items.len},
            );
        return;
    }
    if (isParse)
        try stdout.print("Len: {}\n", .{buf.items.len});
    // for (buf.items) |c| {
    //     try stdout.print("{} ", .{c});
    // }
    if (isParse)
        try stdout.print("\n", .{});

    var actualData = std.ArrayList(u8).init(allocator);
    defer actualData.deinit();

    var i: u32 = 0;
    while (i < buf.items.len) {
        const lb: u8 = ((buf.items[i] - 'a') << 4) & 0xf0;
        const rb: u8 = (buf.items[i + 1] - 'a') & 0x0f;
        const byte = if (i < 5)
            (lb >> 4) + (rb << 4)
        else
            lb + rb;
        try actualData.append(byte);
        i += 2;
    }

    var header: *align(1) MsgHeader = std.mem.bytesAsValue(
        MsgHeader,
        actualData.items[0..5],
    );
    header.length = ((header.length & 0xff00) >> 8) + ((header.length & 0x00ff) << 8);
    if (isParse)
        try stdout.print("{}\n", .{header});
    if (isParse)
        try stdout.print("Lengths: {} {}\n", .{ actualData.items.len, header.length + 5 });
    if (isParse)
        try stdout.print("\nBody data:\n", .{});
    var needsNewline = false;
    switch (header.type) {
        .Schema, .EventSchema => {
            if (isParse)
                try stdout.print("{s}\n", .{actualData.items[5..]});
        },
        .Message => {
            const slice = actualData.items[5..];
            if (isParse)
                try stdout.print("{s}\n", .{slice});
        },
        .DataUpdate => {
            const data: *align(1) DataUpdate = std.mem.bytesAsValue(
                DataUpdate,
                actualData.items[5..],
            );
            if (isParse)
                try stdout.print("{?}\n", .{data});
            const info = @typeInfo(DataUpdate);
            var headers = std.mem.splitScalar(u8, res.args.csv orelse "", ',');
            var outputComma = false;
            while (headers.next()) |csvRow| {
                const isStar = std.mem.eql(u8, res.args.csv orelse "", "all");
                if (csvRow.len == 0) {
                    continue;
                }
                switch (info) {
                    .@"struct" => |st| {
                        inline for (st.fields) |field| {
                            if (std.mem.eql(u8, csvRow, field.name) or isStar) {
                                const value = @field(data, field.name);
                                if (outputComma) {
                                    try stdout.print(",", .{});
                                }
                                try stdout.print("{d:10.7}", .{value});
                                outputComma = true;
                                needsNewline = true;
                            }
                        }
                    },
                    else => unreachable,
                }
            }
        },
        .Metadata => {
            const data: *align(1) MetadataPacket = std.mem.bytesAsValue(
                MetadataPacket,
                actualData.items[5..],
            );
            if (isParse)
                try stdout.print("{any}\n", .{data});
        },
        .Event => {
            const data: *align(1) Event = std.mem.bytesAsValue(
                Event,
                actualData.items[5..],
            );
            if (isParse)
                try stdout.print("{?}\n", .{data});
        },
        .Acknowledgement => {},
    }
    if (res.args.csv != null and needsNewline) {
        try stdout.print("\n", .{});
    }
    try bw.flush(); // don't forget to flush!
}

test "simple test" {
    var list = std.ArrayList(i32).init(std.testing.allocator);
    defer list.deinit(); // try commenting this out and see if zig detects the memory leak!
    try list.append(42);
    try std.testing.expectEqual(@as(i32, 42), list.pop());
}
