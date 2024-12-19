class Dial {
    angleSweep = 0;
    color = "#ff00ff";
    range = [0, 100];
    width = 0;
    height = 0;
    x = 0;
    y = 0;
    title = "";
    ticks = 2;
    point = 0;
    backArcColor = "#ffff00";
    titleSize = 0.02;
    tickTextSize = 0.01;
    tickSize = 0.01;
    arcStroke = 0.008;
    backArcStroke = 0.012;
    titleOffsetY = 0.3;
    /**
     * @param {number} angleSweep
     * @param {p5.Color} color
     * @param {p5.Color} backArcColor
     * @param {number[]} range
     * @param {number} width
     * @param {number} height
     * @param {number} x
     * @param {number} y
     * @param {string} title
     * @param {number} ticks
     */
    constructor(
        x,
        y,
        width,
        height,
        angleSweep,
        color,
        backArcColor,
        range,
        title,
        ticks,
    ) {
        this.angleSweep = angleSweep;
        this.color = color;
        this.backArcColor = backArcColor;
        this.range = range;
        this.width = width;
        this.height = height;
        this.x = x;
        this.y = y;
        this.title = title;
        this.ticks = ticks;
    }

    /**
     * @param {number} v
     */
    update(v) {
        this.point = v;
    }
    draw() {
        p.noStroke();
        p.textAlign(p.CENTER);
        p.textSize(this.titleSize * height);
        p.text(
            this.title,
            (this.x + this.width / 2) * height,
            (this.y + this.height - this.height * this.titleOffsetY) * height,
        );
        var heightMult = 2 / (1 - Math.cos(this.angleSweep / 2));
        p.noFill();
        p.stroke(this.backArcColor);
        p.strokeWeight(this.backArcStroke * height);
        p.arc(
            (this.x + this.width / 2) * height,
            (this.y + this.height / 2) * height,
            this.width * height,
            this.height * height,
            -p.HALF_PI - this.angleSweep / 2,
            -p.HALF_PI + this.angleSweep / 2,
        );
        p.stroke(this.color);
        p.strokeWeight(this.arcStroke * height);
        var pct =
            (this.point - this.range[0]) / (this.range[1] - this.range[0]);
        p.arc(
            (this.x + this.width / 2) * height,
            (this.y + this.height / 2) * height,
            this.width * height,
            this.height * height,
            -p.HALF_PI - this.angleSweep / 2,
            -p.HALF_PI - this.angleSweep / 2 + this.angleSweep * pct,
        );
    }
}
