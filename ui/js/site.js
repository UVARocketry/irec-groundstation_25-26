var width, height;
var light = true;

//Just dont look in here
const s = (pi) => {
  p = pi;
  pi.setup = function () {
    pi.createCanvas(p.windowWidth, p.windowHeight);
    width = p.windowWidth;
    height = p.windowHeight;
    $("canvas").contextmenu((e) => {
      e.preventDefault();
    });
    p.angleMode(p.DEGREES);
  };

  pi.draw = function () {
    if (light) {
      p.background(255);
      p.strokeWeight(0);
    } else {
      p.fill(255);
      p.background(4 * 16);
    }
  };
  pi.mouseDragged = function () {};
  pi.mouseClicked = function () {};
  pi.mouseReleased = function () {};
};
