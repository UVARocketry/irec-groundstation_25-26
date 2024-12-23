export class Quaternion {
    /** @type {number}*/
    w = 0;
    /** @type {number}*/
    x = 0;
    /** @type {number}*/
    y = 0;
    /** @type {number}*/
    z = 0;
    /**
     * @param {number} w
     * @param {number} x
     * @param {number} y
     * @param {number} z
     */
    constructor(w, x, y, z) {
        this.w = w;
        this.x = x;
        this.y = y;
        this.z = z;
    }
}

//Multiply 2 quaternions
/**
 * @param q1 {Quaternion}
 * @param q2 {Quaternion}
 */
export function quatmult(q1, q2) {
    var a = q1.w;
    var b = q1.x;
    var c = q1.y;
    var d = q1.z;
    var e = q2.w;
    var f = q2.x;
    var g = q2.y;
    var h = q2.z;

    return {
        w: a * e - b * f - c * g - d * h,
        x: a * f + b * e + c * h - d * g,
        y: a * g - b * h + c * e + d * f,
        z: a * h + b * g - c * f + d * e,
    };
}
//Convert a quaternion to a string
/**
 * @param q {Quaternion}
 */
export function quattoString(q) {
    return "w: " + q.w + ", \nx: " + q.x + ",\ny: " + q.y + ",\nz: " + q.z;
}
//Get the conjugate of a quaternion
/**
 * @param q {Quaternion}
 */
export function quatconj(q) {
    return { w: q.w, x: -q.x, y: -q.y, z: -q.z };
}
//Get the norm of a quaternion
/**
 * @param q {Quaternion}
 */
export function quatnorm(q) {
    return Math.sqrt(q.w * q.w + q.x * q.x + q.y * q.y + q.z * q.z);
}
//Normalize a quaternion
/**
 * @param q {Quaternion}
 */
export function quatnormalize(q) {
    var n = quatnorm(q);
    q.w /= n;
    q.y /= n;
    q.x /= n;
    q.z /= n;
}
//Get the inverse of a quaternion
/**
 * @param q {Quaternion}
 */
export function quatinverse(q) {
    var c = quatconj(q);
    var qn = Math.pow(quatnorm(q), 2);
    c.w /= qn;
    c.x /= qn;
    c.y /= qn;
    c.z /= qn;
    return c;
}
