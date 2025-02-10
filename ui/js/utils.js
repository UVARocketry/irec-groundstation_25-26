/**
 * @param {number} num
 */
export function limDecimal(num, to = 2) {
    var str = `${num}`;
    var ret = "";
    var count = 0;
    var willCount = false;
    for (var i of str) {
        if (i == "." && to == 0) {
            break;
        }
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
