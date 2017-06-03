import domready from 'domready';

class Renderer {
  constructor(selector) {
    const canvas = document.querySelector(selector);
    canvas.width = 500;
    canvas.height = 500;

    this.context = canvas.getContext('2d');
    this.currentTime = 0;

    this.thunders = Array(1).fill().map(thunder => (
      new Thunder([0, 250], [500, 250], this.context)
    ));

    requestAnimationFrame(this.render);
  }

  render() {
    return this.thunders.map(thunder => thunder.render(this.currentTime++));
  }
}

class Thunder {
  constructor(start, end, context) {
    this.polyline = new RecursivePolyline(start, end, 0);

    this.start = start;
    this.end = end;
    this.context = context;
  }

  render(currentTime) {
    const polyline = this.polyline.updatePoints(currentTime);
    const points = polyline.points();

    this.context.beginPath();
    this.context.moveTo(...points.pop());

    for (const point of points) {
      this.context.lineTo(...point);
    }

    this.context.closePath();
    this.context.stroke();
  }
}

/**
 * TODO: めんどいから法線計算せずに0度方向に動くことだけ考える
 */
class RecursivePolyline {
  static get DEPTH() { return 10 }
  static get PARTS_COUNT() { return 3 }

  constructor(start, end, depth) {
    this.start = start;
    this.end = end;
    this.depth = depth;

    // 3等分された位置にうねうね動く点を作成
    this.points = this._generatePoints(RecursivePolyline.PARTS_COUNT);

    // 3等分された線を再帰的に作成
    this.children = (depth === RecursivePolyline.DEPTH) ? [] : (
      this.points.map((_, index, points) => {
        const previous = index ? points[index] : this.start;
        const next = points[index];

        return new RecursivePolyline(previous, next, this.depth + 1);
      })
    );
  }

  _generatePoints(count) {
    // 長さ ${count} の空配列
    const points = Array(count).fill();

    return points.map((_, index) => {
      const [x1, y1] = this.start;
      const [x2, y2] = this.end;

      /** 50%の確率でサイン関数かコサイン関数のどちらかを選ぶ ＋ それにランダムな係数を与える */
      const easing = (Math.random() > 0.5) ? (
        [Math.sin, /** 係数 = */ Math.random()]
      ) : (
        [Math.cos, /** 係数 = */ Math.random()]
      );

      return new Point(
        (x1 + x2) * (index + 1) / WigglingLine.PARTS_COUNT,
        (y1 + y2) * (index + 1) / WigglingLine.PARTS_COUNT,
        easing
      );
    });
  }

  updatePoints(currentTime) {
    const points = this.points.map(point => point.update(currentTime));
    return this;
  }
}

class Point {
  constructor(x, y, [easingFnc, coefficient]) {
    this.initialX = x;
    this.initialY = y;

    this.x = x;
    this.y = y;

    this.easingFnc = easingFnc;
    this.C = coefficient;
  }

  update(currentTime) {
    const { C, easingFnc, initialX, initialY } = this;

    this.x = C * easingFnc(currentTime) + initialX;
    this.y = C * easingFnc(currentTime) + initialY;

    return this;
  }
}

domready(() => new Renderer('#canvas'));
