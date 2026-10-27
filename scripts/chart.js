// A small line chart comparing the algorithms step by step: one curve per algorithm,
// the last step on the right, a crosshair and a tooltip under the mouse.
const chartInk = {
  grid: '#E1E0D9', // hairline gridlines
  baseline: '#C3C2B7',
  text: '#898781', // axis labels
  surface: '#FFFFFF'
};
const chartFont = "14px 'Jersey 10'";

class ComparisonChart {
  // series: one entry per curve, with its name and color
  constructor(canvas, tooltip, series) {
    this.canvas = canvas;
    this.tooltip = tooltip;
    this.series = series;
    this.values = series.map(() => []);
    this.capacity = 1;
    this.logScale = false;
    this.hoverIndex = null;

    canvas.addEventListener('mousemove', (event) => {
      this.hoverIndex = this.indexAt(event.offsetX);
      this.draw();
    });
    canvas.addEventListener('mouseleave', () => {
      this.hoverIndex = null;
      this.draw();
    });
  }

  // values: one array per series, all the same length, null where there is no value.
  // capacity: how many steps the chart can show.
  update(values, capacity, logScale) {
    this.values = values;
    this.capacity = capacity;
    this.logScale = logScale;
    if (this.hoverIndex !== null && this.hoverIndex >= this.count()) {
      this.hoverIndex = null;
    }
    this.draw();
  }

  count() {
    return this.values[0].length;
  }

  // Plot area inside the canvas, leaving room on the left for the axis labels
  area() {
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    return { width, height, left: 30, right: width - 4, top: 6, bottom: height - 6 };
  }

  xOf(index, area) {
    const stepWidth = (area.right - area.left) / Math.max(1, this.capacity - 1);
    return area.right - (this.count() - 1 - index) * stepWidth;
  }

  // The step closest to a horizontal position, or null if there is none
  indexAt(x) {
    const area = this.area();
    const stepWidth = (area.right - area.left) / Math.max(1, this.capacity - 1);
    const index = this.count() - 1 - Math.round((area.right - x) / stepWidth);
    return index >= 0 && index < this.count() ? index : null;
  }

  // Vertical scale: from 0 to a round maximum, or by powers of ten from 1 on the log scale
  scale(area) {
    const visible = this.values.flat().filter((value) => value !== null);
    const max = Math.max(1, ...visible);
    if (this.logScale) {
      const decades = Math.max(1, Math.ceil(Math.log10(max)));
      const ticks = [];
      for (let power = 0; power <= decades; power++) {
        ticks.push(10 ** power);
      }
      const yOf = (value) => area.bottom - Math.log10(Math.max(1, value)) / decades * (area.bottom - area.top);
      return { ticks, yOf };
    }
    const top = niceCeiling(max);
    const yOf = (value) => area.bottom - value / top * (area.bottom - area.top);
    return { ticks: [0, top / 2, top], yOf };
  }

  draw() {
    const area = this.area();
    const ratio = window.devicePixelRatio || 1;
    if (this.canvas.width !== Math.round(area.width * ratio) || this.canvas.height !== Math.round(area.height * ratio)) {
      this.canvas.width = Math.round(area.width * ratio);
      this.canvas.height = Math.round(area.height * ratio);
    }
    const ctx = this.canvas.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, area.width, area.height);
    const { ticks, yOf } = this.scale(area);

    // Gridlines and their labels
    ctx.font = chartFont;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 1;
    for (const tick of ticks) {
      const y = Math.round(yOf(tick)) + 0.5;
      ctx.strokeStyle = tick === ticks[0] ? chartInk.baseline : chartInk.grid;
      ctx.beginPath();
      ctx.moveTo(area.left, y);
      ctx.lineTo(area.right, y);
      ctx.stroke();
      ctx.fillStyle = chartInk.text;
      ctx.fillText(compactNumber(tick), area.left - 4, y);
    }

    // One curve per series, interrupted where there is no value
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    this.series.forEach((series, s) => {
      ctx.strokeStyle = series.color;
      ctx.fillStyle = series.color;
      ctx.beginPath();
      let drawing = false;
      this.values[s].forEach((value, i) => {
        if (value === null) {
          drawing = false;
          return;
        }
        const x = this.xOf(i, area);
        const y = yOf(value);
        if (drawing) {
          ctx.lineTo(x, y);
        } else {
          ctx.moveTo(x, y);
          // A value alone between two gaps would be invisible as a line: mark it with a dot
          const previous = this.values[s][i - 1];
          const next = this.values[s][i + 1];
          if ((previous === undefined || previous === null) && (next === undefined || next === null)) {
            ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
          }
        }
        drawing = true;
      });
      ctx.stroke();
    });

    this.drawHover(ctx, area, yOf);
  }

  // Crosshair on the hovered step, a dot on each curve, and the values in the tooltip
  drawHover(ctx, area, yOf) {
    if (this.hoverIndex === null) {
      this.tooltip.style.visibility = 'hidden';
      return;
    }
    const x = this.xOf(this.hoverIndex, area);
    ctx.strokeStyle = chartInk.text;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(Math.round(x) + 0.5, area.top);
    ctx.lineTo(Math.round(x) + 0.5, area.bottom);
    ctx.stroke();

    this.series.forEach((series, s) => {
      const value = this.values[s][this.hoverIndex];
      if (value === null) {
        return;
      }
      ctx.beginPath();
      ctx.arc(x, yOf(value), 4, 0, 2 * Math.PI);
      ctx.fillStyle = series.color;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = chartInk.surface;
      ctx.stroke();
    });

    // The value comes first, then the name of the curve, keyed by a short line of its color
    const stepsAgo = this.count() - 1 - this.hoverIndex;
    this.tooltip.replaceChildren();
    this.tooltip.appendChild(document.createElement('div')).textContent = stepsAgo === 0 ? 'last step' : stepsAgo === 1 ? '1 step ago' : `${stepsAgo} steps ago`;
    this.series.forEach((series, s) => {
      const value = this.values[s][this.hoverIndex];
      const row = this.tooltip.appendChild(document.createElement('div'));
      const key = row.appendChild(document.createElement('span'));
      key.className = 'line_key';
      key.style.background = series.color;
      row.appendChild(document.createElement('strong')).textContent = value === null ? '-' : value;
      row.appendChild(document.createTextNode(' ' + series.name));
    });
    this.tooltip.style.visibility = 'visible';
    // On the side of the crosshair that has room
    const onLeft = x > (area.left + area.right) / 2;
    this.tooltip.style.left = onLeft ? '' : `${x + 8}px`;
    this.tooltip.style.right = onLeft ? `${area.width - x + 8}px` : '';
  }
}

// The smallest of 1, 2 or 5 times a power of ten that is at least value
function niceCeiling(value) {
  const power = 10 ** Math.floor(Math.log10(value));
  for (const factor of [1, 2, 5, 10]) {
    if (factor * power >= value) {
      return factor * power;
    }
  }
  return 10 * power;
}

// 1500 -> 1.5K, 20000 -> 20K
function compactNumber(value) {
  if (value >= 1000) {
    return `${+(value / 1000).toFixed(1)}K`;
  }
  return `${+value.toFixed(1)}`;
}
