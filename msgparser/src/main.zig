const std = @import("std");

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

const DataUpdate = packed struct {
    i_timestamp: i32,
    baro: f32,
    predictedApogee: f32,
    mainBat: f32,
    servoBat: f32,
    vnAccX: f32,
    vnAccY: f32,
    vnAccZ: f32,
    vnGyroX: f32,
    vnGyroY: f32,
    vnGyroZ: f32,
    vnUnAccX: f32,
    vnUnAccY: f32,
    vnUnAccZ: f32,
    vnUnGyroX: f32,
    vnUnGyroY: f32,
    vnUnGyroZ: f32,
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
    vnOrientationW: f32,
    vnOrientationX: f32,
    vnOrientationY: f32,
    vnOrientationZ: f32,
    orientationW: f32,
    orientationX: f32,
    orientationY: f32,
    orientationZ: f32,
    vnTemp: f32,
    vnPressure: f32,
    apogee: f32,
    pidDeployment: f32,
    actualDeployment: f32,
};

const LogEventType = enum(u32) { Startup = 0, Wait = 1, Launch = 2, MotorBurn = 3, AirbrakesDeploy = 4, Parachute = 5, Landing = 6, AwaitRecovery = 7 };

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
        @compileError(std.fmt.comptimePrint("Bytes: {}, bits: {}", .{ @sizeOf(MsgHeader), @bitSizeOf(MsgHeader) }));
    };
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    const allocator = gpa.allocator();
    defer {
        const deinitStatus = gpa.deinit();
        if (deinitStatus == .leak) {
            @panic("LEAKED MEMORY!");
        }
    }
    const reader = std.io.getStdIn().reader();
    var buf = std.ArrayList(u8).init(allocator);
    defer buf.deinit();
    try reader.readAllArrayList(&buf, 3000);
    const stdout_file = std.io.getStdOut().writer();
    var bw = std.io.bufferedWriter(stdout_file);
    const stdout = bw.writer();

    try stdout.print("{s}\n", .{buf.items});
    if (buf.items.len == 0) {
        try stdout.print("AYYO NOTHING THERE\n", .{});
        return;
    }
    if (buf.items[buf.items.len - 1] == '\n') {
        _ = buf.pop();
    }
    if (buf.items.len % 2 != 0) {
        try stdout.print("dawg you gotta gimme an even number of chars, i got {}\n", .{buf.items.len});
        return;
    }
    try stdout.print("Len: {}\n", .{buf.items.len});
    // for (buf.items) |c| {
    //     try stdout.print("{} ", .{c});
    // }
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

    var header: *align(1) MsgHeader = std.mem.bytesAsValue(MsgHeader, actualData.items[0..5]);
    header.length = ((header.length & 0xff00) >> 8) + ((header.length & 0x00ff) << 8);
    try stdout.print("{}\n", .{header});
    try stdout.print("Lengths: {} {}\n", .{ actualData.items.len, header.length + 5 });
    switch (header.type) {
        .Schema, .EventSchema => {
            try stdout.print("{s}\n", .{actualData.items[5..]});
        },
        .Message => {
            const slice = actualData.items[5..];
            try stdout.print("{s}\n", .{slice});
        },
        .DataUpdate => {
            const data: *align(1) DataUpdate = std.mem.bytesAsValue(DataUpdate, actualData.items[5..]);
            try stdout.print("{?}\n", .{data});
        },
        .Metadata => {
            try stdout.print("Metadata\n", .{});
        },
        .Event => {
            const data: *align(1) Event = std.mem.bytesAsValue(Event, actualData.items[5..]);
            try stdout.print("{?}\n", .{data});
        },
        .Acknowledgement => {},
    }
    try bw.flush(); // don't forget to flush!
}

test "simple test" {
    var list = std.ArrayList(i32).init(std.testing.allocator);
    defer list.deinit(); // try commenting this out and see if zig detects the memory leak!
    try list.append(42);
    try std.testing.expectEqual(@as(i32, 42), list.pop());
}
