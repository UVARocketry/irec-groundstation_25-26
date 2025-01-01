import { getHeight, getP5 } from "./site.js";
/** @import p5 from p5 */
export class Button {
    /**
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     * @param {p5.Color} border
     * @param {p5.Color} inner
     * @param {p5.Color} hover
     * @param {p5.Color} press
     * @param {string} msg
     * @param {number} tOffX
     * @param {number} tOffY
     * @param {number} textSize
     */
    constructor(
        x,
        y,
        w,
        h,
        border,
        inner,
        hover,
        press,
        msg,
        tOffX,
        tOffY,
        textSize,
    ) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.border = border;
        this.inner = inner;
        this.press = press;
        this.pressing = false;
        this.msg = msg;
        this.pressed = false;
        this.hover = hover;
        this.offX = tOffX;
        this.offY = tOffY;
        this.hovering = true;
        this.textSize = textSize;
    }

    draw() {
        const p = getP5();
        const height = getHeight();
        p.stroke(this.border);
        p.strokeWeight(3);
        p.fill(this.inner);
        if (this.hovering) {
            p.fill(this.hover);
        }
        if (this.pressing) {
            p.fill(this.press);
        }
        p.rect(
            this.x * height - 2,
            this.y * height,
            this.w * height + 4,
            this.h * height,
            10,
        );
        p.noStroke();
        p.fill(255, 255, 255);
        p.textSize(this.textSize);
        p.text(
            this.msg,
            (this.x + this.offX) * height,
            (this.y + this.offY) * height,
        );
    }
    handlePress() {
        const p = getP5();
        const height = getHeight();
        if (
            p.mouseX > this.x * height &&
            p.mouseY > this.y * height &&
            p.mouseX < (this.x + this.w) * height &&
            p.mouseY < (this.y + this.h) * height
        ) {
            this.hovering = true;
        } else {
            this.hovering = false;
        }
        if (
            p.mouseIsPressed &&
            p.mouseX > this.x * height &&
            p.mouseY > this.y * height &&
            p.mouseX < (this.x + this.w) * height &&
            p.mouseY < (this.y + this.h) * height
        ) {
            this.pressing = true;
            this.hovering = false;
        } else if (p.mouseIsPressed) {
            this.pressing = false;
        } else if (!p.mouseIsPressed && this.pressing) {
            this.pressed = true;
        }
    }
    isDone() {
        if (this.pressed) {
            this.pressing = false;
            this.pressed = false;
            return true;
        }
        return false;
    }
}
