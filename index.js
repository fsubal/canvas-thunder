import domready from 'domready';

const noopEasing = () => 0;

class Renderer {
  constructor(selector) {
    const canvas = document.querySelector(selector);
    canvas.width = 500;
    canvas.height = 500;

    this.context = canvas.getContext('2d');
    this.currentTime = 0;

    this.thunders = Array(1).fill().map(thunder => new Thunder(
      new Point(0, 250, [noopEasing, 0]),
      new Point(500, 250, [noopEasing, 0]),
      this.context
    ));

    this.loop();
  }

  // https://jsfiddle.net/jkx3v6ee/
  render() {
    this.context.clearRect(0, 0, 500, 500);
    this.thunders.map(thunder => thunder.render(this.currentTime++));
  }

  loop() {
    this.render();
    requestAnimationFrame(() => this.loop());
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
    const children = polyline.children;

    this.context.beginPath();
    this.context.moveTo(this.start.x, this.start.y);

    for (const child of children) {
      this._renderChild(child);
    }

    this.context.lineTo(this.end.x, this.end.y);

    this.context.stroke();
  }

  _renderChild(child) {
    child.points.forEach((point, i) => {
      if (child.children && child.children[i]) {
        this._renderChild(child.children[i]);
      }

      this.context.lineTo(point.x, point.y);
    });
  }
}

class RecursivePolyline {
  static get MAX_DEPTH() { return 10 }
  static get PARTS_COUNT() { return 3 }

  constructor(start, end, depth) {
    this.start = start;
    this.end = end;
    this.depth = depth;

    // 3等分された位置にうねうね動く点を作成
    this.points = this._generatePoints(RecursivePolyline.PARTS_COUNT);

    // TODO: 3等分された線を再帰的に作成
    if (depth !== RecursivePolyline.MAX_DEPTH) {
      this.children = this.points.map((_, index, points) => {
        const previous = index ? points[index] : this.start;
        const next = points[index];

        return new RecursivePolyline(previous, next, this.depth + 1);
      });

      this.children.push(
        new RecursivePolyline(points.pop(), this.end, this.depth + 1)
      );
    }
  }

  _generatePoints(count) {
    // 長さ ${count} の空配列
    const points = Array(count).fill();

    return points.map((_, index) => {
      const {x: x1, y: y1} = this.start;
      const {x: x2, y: y2} = this.end;

      /** 50%の確率でサイン関数かコサイン関数のどちらかを選ぶ ＋ それにランダムな係数を与える */
      const easing = (Math.random() > 0.5) ? (
        [(t) => Math.sin(t), /** 係数 = */ Math.random()]
      ) : (
        [(t) => Math.cos(t), /** 係数 = */ Math.random()]
      );

      return new Point(
        (x1 + x2) * (index + 1) / (RecursivePolyline.PARTS_COUNT + 1),
        250,
        easing
      );
    });
  }

  updatePoints(currentTime) {
    const points = this.points.map(point => point.update(currentTime));
    if (this.children) {
      this.children = this.children.map(child => child.updatePoints());
    }

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

  /**
   * TODO: めんどいから法線計算せずに0度方向に動くことだけ考える
   */
  update(currentTime) {
    const { C, easingFnc, initialX, initialY } = this;

    // this.x = C * easingFnc(currentTime) + initialX;
    this.y = 100 * C * easingFnc(currentTime) + initialY;

    return this;
  }
}

domready(() => new Renderer('#canvas'));
