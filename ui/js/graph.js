/**
 * @param {number} num
 */
function limDecimal(num, to = 2) {
    var str = `${num}`;
    var ret = "";
    var count = 0;
    var willCount = false;
    for (var i of str) {
        ret += i;
        if (willCount) {
            count++;
            if (count >= to) {
                break;
            }
        }
        if (i == ".") {
            willCount = true;
        }
    }
    return ret;
}
class Graph {
    /**
     * @type {number[]}
     */
    data = [];
    highlight = 0;
    /**
     * @type {number[][]}
     */
    altData = [];
    /**
     * @type {p5.Color[]}
     */
    altColors = [];
    title = "";
    maxDatapoints = 0;
    /**
     * @param {number} x
     * @param {number} y
     * @param {number} width
     * @param {number} height
     * @param {p5.Color} dataCol
     * @param {string} title
     */
    constructor(
        x,
        y,
        width,
        height,
        dataCol,
        title,
        dataRange = [10, 0],
        vertSub = 10,
    ) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.range = dataRange;
        this.col = dataCol;
        this.vertSub = vertSub;
        this.title = title;
    }
    moveHighlightEnd() {
        this.highlight = this.data.length - 1;
    }
    /**
     * @param {number} n
     * @param {p5.Color[]} hls
     */
    withAlternateSeries(n, hls) {
        for (var i = 0; i < n; i++) {
            this.altData.push([]);
        }
        this.altColors = hls;
    }
    /**
     * @param {number} i
     */
    setHighlight(i) {
        if (i < this.data.length && 0 <= i) {
            this.highlight = i;
        }
    }
    incHighlight() {
        if (this.highlight < this.data.length - 1) {
            this.highlight++;
        }
    }
    /**
     * @param {number[]} d
     * @param {number[][]} altData
     */
    inputData(d, altData) {
        this.data = d;
        this.altData = altData;
    }

    /**
     * @param {number} d
     *@param {number[]?} alts
     */
    addDatapoint(d, alts) {
        if (!Number.isFinite(d)) {
            return;
        }
        this.data.push(d);
        alts = alts ?? [];
        for (var i = 0; i < alts.length; i++) {
            this.altData[i].push(alts[i]);
        }
        if (this.maxDatapoints !== 0) {
            while (this.data.length > this.maxDatapoints) {
                this.data.shift();
            }
            for (var dat of this.altData) {
                while (dat.length > this.maxDatapoints) {
                    dat.shift();
                }
            }
        }
    }
    customizeRange() {
        if (this.data.length === 0) return;
        this.range = [this.data[0], this.data[0]];
        for (var i of this.data) {
            this.range[0] = Math.max(i, this.range[0]);
            this.range[1] = Math.min(i, this.range[1]);
        }
        var rangeSize = this.range[0] - this.range[1];
        this.range[0] += 0.05 * rangeSize;
        this.range[1] -= 0.05 * rangeSize;
    }
    /**
     * @param {number} n
     */
    withMaxDatapoints(n) {
        this.maxDatapoints = n;
    }
    draw() {
        var dWidth = this.data.length;
        var xInc = this.width / dWidth;
        var rangeSize = this.range[0] - this.range[1];
        var rangeMult = this.height / rangeSize;
        p.fill(255);
        p.noStroke();
        p.rect(
            this.x * height,
            this.y * height,
            this.width * height,
            this.height * height,
        );
        p.textSize(Math.min(20, (this.width * height) / 10));
        p.textAlign(p.CENTER);
        p.fill(0);
        p.text(
            this.title,
            (this.x + this.width / 2) * height,
            (this.y - 1) * height,
        );
        // Line Highlight
        {
            var pt = this.data[this.highlight];
            var newX = xInc * this.highlight;
            p.strokeWeight(1);
            p.stroke(0);
            newX += this.x;
            p.line(
                newX * height,
                this.y * height,
                newX * height,
                (this.y + this.height) * height,
            );
        }

        // Axis drawing
        {
            p.stroke(0);
            p.strokeWeight(1);
            for (var i = 0; i <= 10; i++) {
                var bottom = this.y + this.height;
                var x = (i / 10) * this.width + this.x;
                p.line(
                    x * height,
                    bottom * height,
                    x * height,
                    bottom * height + 5,
                );
            }
            p.fill(0);
            // p.noStroke();
            p.textSize(10);
            p.textAlign(p.RIGHT);
            for (var i = 0; i <= this.vertSub; i++) {
                var bottom = this.x + this.width;
                var y = (i / this.vertSub) * this.height + this.y;
                p.strokeWeight(1);
                p.stroke(0, 0, 0);
                p.line(
                    bottom * height,
                    y * height,
                    this.x * height - 5,
                    y * height,
                );
                p.noStroke();
                p.text(
                    limDecimal(
                        (-i / this.vertSub) * rangeSize + this.range[0],
                        1,
                    ),
                    this.x * height - 7,
                    y * height + 3,
                );
            }
        }
        p.strokeWeight(1);

        var startDataX = 0;
        var dataWidth = dWidth;
        if (this.maxDatapoints !== 0) {
            startDataX = this.maxDatapoints - dWidth;
            dataWidth = this.maxDatapoints;
            xInc = this.width / this.maxDatapoints;
        }
        for (var i = 0; i < this.altData.length; i++) {
            for (var x = startDataX; x < dataWidth; x++) {
                var pt = this.altData[i][x - startDataX];
                var newX = xInc * x;
                var newY = rangeMult * pt * -1 + this.range[1] * rangeMult;
                p.strokeWeight(4);
                p.stroke(this.altColors[i]);
                newX += this.x;
                newY += this.y + this.height;
                p.point(newX * height, newY * height);
            }
        }
        // Data display
        for (var x = startDataX; x < dataWidth; x++) {
            var pt = this.data[x - startDataX];
            var newX = xInc * x;
            var newY = rangeMult * pt * -1 + this.range[1] * rangeMult;
            p.strokeWeight(4);
            p.stroke(this.col);
            newX += this.x;
            newY += this.y + this.height;
            p.point(newX * height, newY * height);
        }

        // Highlight
        {
            var pt = this.data[this.highlight];
            var newX = xInc * this.highlight;
            var newY = rangeMult * pt * -1 + this.range[1] * rangeMult;
            p.strokeWeight(4);
            p.stroke(
                255 - p.red(this.col),
                255 - p.green(this.col),
                255 - p.blue(this.col),
            );
            newX += this.x;
            newY += this.y + this.height;
            p.point(newX * height, newY * height);
        }
    }
}
