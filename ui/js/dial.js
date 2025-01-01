import { getHeight, getP5, TEXT_COL } from "./site.js";
import { limDecimal } from "./utils.js";

/** @import p5 from p5 */
export class Dial {
    /// the angle sweep of the dial arc
    angleSweep = 0;
    /// the colors of the main arc
    color = "#ff00ff";
    /// the color of the back arc
    backArcColor = "#ffff00";
    /// the data range
    range = [0, 100];
    /// the width of the arc (NOT the entire system)
    width = 0;
    /// the height of the arc
    height = 0;
    /// the x coord of the top left of the bounding rect of the arc
    x = 0;
    /// the y coord of the top left of the bounding rect of the arc
    y = 0;
    /// The title of the dial
    title = "";
    /// The number of ticks to have
    ticks = 2;
    /// the current data value
    point = 0;
    /// the text size of the title
    titleSize = 0.015;
    /// the text size of the tick numbers
    tickTextSize = 0.01;
    /// the length of the tick line
    tickSize = 0.01;
    /// the strokeweight of the data arc
    arcStroke = 0.008;
    /// the strokeweight of the backing arc
    backArcStroke = 0.012;
    /// the vertical offset (from the bottom) of the title text
    titleOffsetY = 0.2;
    /// the text size of the central display of the point
    pointTextSize = 0.04;
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
        const p = getP5();
        const height = getHeight();
        p.noStroke();
        p.textAlign(p.CENTER);
        p.textSize(this.titleSize * height);
        p.fill(TEXT_COL);
        var centerX = (this.x + this.width / 2) * height;
        var centerY = (this.y + this.height / 2) * height;
        p.text(
            this.title,
            (this.x + this.width / 2) * height,
            (this.y + this.height - this.height * this.titleOffsetY) * height,
        );
        p.textSize(this.pointTextSize * height);
        p.text(limDecimal(this.point), centerX, centerY);
        // the ticks
        p.textSize(0.01 * height);
        for (var i = 0; i < this.ticks; i++) {
            p.strokeWeight(1);
            p.stroke(TEXT_COL);
            var angle =
                -p.HALF_PI -
                this.angleSweep / 2 +
                (i * this.angleSweep) / (this.ticks - 1);
            var outerX =
                (this.width + this.backArcStroke / 2 + 0.02) *
                    0.5 *
                    Math.cos(angle) *
                    height +
                centerX;

            var outerY =
                (this.height + this.backArcStroke / 2 + 0.02) *
                    0.5 *
                    Math.sin(angle) *
                    height +
                centerY;
            p.line(
                outerX,
                outerY,
                centerX + this.width * Math.cos(angle) * height * 0.5,
                centerY + this.height * Math.sin(angle) * height * 0.5,
            );
            p.noStroke();
            // undoing the equation for finding the arc angle
            var text = limDecimal(
                ((angle + p.HALF_PI + this.angleSweep / 2) / this.angleSweep) *
                    (this.range[1] - this.range[0]) +
                    this.range[0],
            );
            if (Math.abs(Math.cos(angle)) < 0.2) {
                p.textAlign(p.CENTER);
                p.text(text, outerX, outerY - 3);
            } else if (Math.cos(angle) > 0) {
                p.textAlign(p.LEFT);
                p.text(text, outerX + 3, outerY);
            } else if (Math.cos(angle) < 0) {
                p.textAlign(p.RIGHT);
                p.text(text, outerX - 3, outerY);
            }
        }
        p.noFill();
        p.stroke(this.backArcColor);
        p.strokeWeight(this.backArcStroke * height);
        p.arc(
            centerX,
            centerY,
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
            centerX,
            centerY,
            this.width * height,
            this.height * height,
            -p.HALF_PI - this.angleSweep / 2,
            -p.HALF_PI - this.angleSweep / 2 + this.angleSweep * pct,
        );
    }
}
