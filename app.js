const svg = document.getElementById("chart");
const data = window.EXHIBIT3_DATA;

const width = 763;
const height = 487;
const margin = { top: 30, right: 48, bottom: 90, left: 84 };
const plotWidth = width - margin.left - margin.right;
const plotHeight = height - margin.top - margin.bottom;
const plotLeft = margin.left;
const plotTop = margin.top;
const plotRight = plotLeft + plotWidth;
const plotBottom = plotTop + plotHeight;

const xMin = data.series[0].assetReturn;
const xMax = data.series[data.series.length - 1].assetReturn;
const yMin = 0;
const yMax = 1.8;
const redBandTopValue = 0.92;
const frequencyMax = Math.max(...data.series.map((d) => d.frequency));

const xScale = (value) => plotLeft + ((value - xMin) / (xMax - xMin)) * plotWidth;
const yScale = (value) => plotBottom - ((value - yMin) / (yMax - yMin)) * plotHeight;
const frequencyScale = (value) => plotBottom - (value / frequencyMax) * (plotHeight * 0.95);
const formatPercent = (value) => `${(value * 100).toFixed(1)}%`;
const formatCurrency = (value) => `$${value.toFixed(3)}`;

const make = (name, attrs = {}, parent = svg) => {
  const node = document.createElementNS("http://www.w3.org/2000/svg", name);
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
  parent.appendChild(node);
  return node;
};

const pathFromBands = (topPoints, bottomPoints) => {
  const top = topPoints.map(([x, y]) => `${x},${y}`).join(" L ");
  const bottom = [...bottomPoints].reverse().map(([x, y]) => `${x},${y}`).join(" L ");
  return `M ${top} L ${bottom} Z`;
};

const linePath = (points) => `M ${points.map(([x, y]) => `${x},${y}`).join(" L ")}`;

const series = data.series.map((d) => {
  const mezzTop = d.firstMortgage + d.mezzanineDebt;
  const investorsTop = mezzTop + d.investors;
  const totalTop = investorsTop + d.operator;

  return {
    ...d,
    x: xScale(d.assetReturn),
    mortgageTopY: yScale(d.firstMortgage),
    mezzTopY: yScale(mezzTop),
    investorsTopY: yScale(investorsTop),
    totalTopY: yScale(totalTop),
    frequencyY: frequencyScale(d.frequency),
    baselineY: yScale(0),
    mezzTopValue: mezzTop,
    totalTopValue: totalTop,
  };
});

const defs = make("defs");
const hatch = make("pattern", {
  id: "loss-hatch",
  width: "5",
  height: "5",
  patternUnits: "userSpaceOnUse",
}, defs);
make("rect", { width: "5", height: "5", fill: "#ffffff" }, hatch);
make("path", {
  d: "M 2.5 0 L 2.5 5",
  stroke: "#ff3b30",
  "stroke-width": "1.1",
}, hatch);

const clip = make("clipPath", { id: "plot-clip" }, defs);
make("rect", {
  x: plotLeft,
  y: plotTop,
  width: plotWidth,
  height: plotHeight,
}, clip);

make("rect", {
  x: plotLeft,
  y: plotTop,
  width: plotWidth,
  height: plotHeight,
  fill: "#fbfaf7",
});

const gridValues = Array.from({ length: 10 }, (_, index) => index * 0.2);
gridValues.forEach((value) => {
  const y = yScale(value);
  make("line", {
    x1: plotLeft,
    y1: y,
    x2: plotRight,
    y2: y,
    stroke: value === 0 ? "#777777" : "#a8a8a8",
    "stroke-width": value === 0 ? 1.2 : 1,
  });
});

const areaGroup = make("g", { "clip-path": "url(#plot-clip)" });

make("path", {
  d: pathFromBands(
    series.map((d) => [d.x, d.mortgageTopY]),
    series.map((d) => [d.x, d.baselineY]),
  ),
  fill: "#d7ecc8",
}, areaGroup);

make("path", {
  d: pathFromBands(
    series.map((d) => [d.x, d.mezzTopY]),
    series.map((d) => [d.x, d.mortgageTopY]),
  ),
  fill: "#6cbf43",
}, areaGroup);

make("path", {
  d: pathFromBands(
    series.map((d) => [d.x, d.investorsTopY]),
    series.map((d) => [d.x, d.mezzTopY]),
  ),
  fill: "#52bcc4",
}, areaGroup);

make("path", {
  d: pathFromBands(
    series.map((d) => [d.x, d.totalTopY]),
    series.map((d) => [d.x, d.investorsTopY]),
  ),
  fill: "#1e954c",
}, areaGroup);

const redSeries = series.filter((d) => d.totalTopValue < redBandTopValue);
if (redSeries.length > 1) {
  make("path", {
    d: pathFromBands(
      redSeries.map((d) => [d.x, yScale(redBandTopValue)]),
      redSeries.map((d) => [d.x, d.totalTopY]),
    ),
    fill: "url(#loss-hatch)",
  }, areaGroup);
}

make("path", {
  d: linePath(series.map((d) => [d.x, d.totalTopY])),
  fill: "none",
  stroke: "#111111",
  "stroke-width": "2.1",
  "stroke-linejoin": "round",
  "stroke-linecap": "round",
}, areaGroup);

make("path", {
  d: linePath(series.map((d) => [d.x, d.mortgageTopY])),
  fill: "none",
  stroke: "#111111",
  "stroke-width": "1.5",
}, areaGroup);

make("path", {
  d: linePath(series.map((d) => [d.x, d.mezzTopY])),
  fill: "none",
  stroke: "#111111",
  "stroke-width": "1.5",
}, areaGroup);

make("path", {
  d: linePath(series.map((d) => [d.x, d.frequencyY])),
  fill: "none",
  stroke: "#c247ac",
  "stroke-width": "3.7",
  "stroke-linejoin": "round",
  "stroke-linecap": "round",
}, areaGroup);

const meanX = xScale(data.meta.meanReturn);
make("line", {
  x1: meanX,
  y1: yScale(0.02),
  x2: meanX,
  y2: frequencyScale(frequencyMax),
  stroke: "#c247ac",
  "stroke-width": "1.2",
  "stroke-dasharray": "5 4",
}, areaGroup);

make("rect", {
  x: plotLeft,
  y: plotTop,
  width: plotWidth,
  height: plotHeight,
  fill: "none",
  stroke: "#666666",
  "stroke-width": "1.5",
});

gridValues.forEach((value) => {
  const y = yScale(value);
  make("line", {
    x1: plotLeft - 6,
    y1: y,
    x2: plotLeft,
    y2: y,
    stroke: "#666666",
    "stroke-width": "1.5",
  });

  make("text", {
    x: plotLeft - 12,
    y: y + 4,
    "text-anchor": "end",
    "font-size": "14",
    "font-weight": "700",
    class: "label-text",
  }).textContent = `$${value.toFixed(2)}`;
});

const xTicks = [];
for (let value = xMin; value <= xMax + 1e-9; value += 0.056) {
  xTicks.push(Number(value.toFixed(3)));
}

xTicks.forEach((tick) => {
  const x = xScale(tick);
  make("line", {
    x1: x,
    y1: plotBottom,
    x2: x,
    y2: plotBottom + 5,
    stroke: "#666666",
    "stroke-width": "1.2",
  });

  make("text", {
    x,
    y: plotBottom + 9,
    transform: `rotate(-90 ${x} ${plotBottom + 9})`,
    "text-anchor": "end",
    "font-size": "12",
    "font-weight": "700",
    class: "label-text",
  }).textContent = formatPercent(tick);
});

for (let y = plotTop + 74; y < plotBottom; y += 106) {
  make("line", {
    x1: plotRight,
    y1: y,
    x2: plotRight + 5,
    y2: y,
    stroke: "#666666",
    "stroke-width": "1.1",
  });
}

const text = (content, x, y, options = {}) => {
  const node = make("text", {
    x,
    y,
    "font-size": options.fontSize ?? 15,
    "font-weight": options.weight ?? 700,
    "text-anchor": options.anchor ?? "middle",
    fill: options.fill ?? "#111111",
    class: "label-text",
    transform: options.transform ?? "",
  });
  node.textContent = content;
  return node;
};

make("text", {
  x: width / 2,
  y: height - 16,
  "text-anchor": "middle",
  "font-size": "16",
  class: "title-text",
}).textContent = "Asset-Level Returns";

make("text", {
  x: 16,
  y: height / 2,
  transform: `rotate(-90 16 ${height / 2})`,
  "text-anchor": "middle",
  "font-size": "16",
  class: "title-text",
}).textContent = "Total Payoff for Every $1 Invested";

make("text", {
  x: width - 14,
  y: height / 2,
  transform: `rotate(90 ${width - 14} ${height / 2})`,
  "text-anchor": "middle",
  "font-size": "16",
  class: "title-text",
}).textContent = "Frequency";

text("First Mortgage", xScale(-0.29), yScale(0.45), { fontSize: 13 });
text("Mezzanine Debt", xScale(0.015), yScale(0.78), { fontSize: 13 });
text("Investors", xScale(0.43), yScale(1.12), { fontSize: 13 });
text("Operator", xScale(0.56), yScale(1.495), {
  fontSize: 12,
  fill: "#ffffff",
  transform: `rotate(-18 ${xScale(0.56)} ${yScale(1.46)})`,
});

const hoverLayer = make("g", {
  opacity: "0",
  "pointer-events": "none",
});

const hoverGuide = make("line", {
  y1: plotTop,
  y2: plotBottom,
  stroke: "#1f1f1f",
  "stroke-width": "1",
  "stroke-dasharray": "4 4",
}, hoverLayer);

const totalDot = make("circle", {
  r: "4.5",
  fill: "#111111",
  stroke: "#fbfaf7",
  "stroke-width": "2",
}, hoverLayer);

const curveDot = make("circle", {
  r: "4.5",
  fill: "#c247ac",
  stroke: "#fbfaf7",
  "stroke-width": "2",
}, hoverLayer);

const tooltip = make("g", {
  "pointer-events": "none",
}, hoverLayer);

const tooltipShadow = make("rect", {
  width: "205",
  height: "152",
  rx: "8",
  ry: "8",
  fill: "rgba(0,0,0,0.08)",
}, tooltip);

const tooltipBox = make("rect", {
  width: "205",
  height: "152",
  rx: "8",
  ry: "8",
  fill: "rgba(255,255,255,0.96)",
  stroke: "#1e1e1e",
  "stroke-width": "1",
}, tooltip);

const tooltipTitle = make("text", {
  x: "14",
  y: "22",
  "font-size": "15",
  "font-weight": "700",
  class: "label-text",
}, tooltip);

const tooltipLines = [];
for (let index = 0; index < 6; index += 1) {
  const label = make("text", {
    x: "14",
    y: `${44 + index * 16}`,
    "font-size": "12",
    class: "label-text",
  }, tooltip);

  const value = make("text", {
    x: "190",
    y: `${44 + index * 16}`,
    "font-size": "12",
    "text-anchor": "end",
    class: "label-text",
  }, tooltip);

  tooltipLines.push({ label, value });
}

const tooltipLineDefs = [
  ["Total payoff", (d) => formatCurrency(d.totalPayoff)],
  ["First mortgage", (d) => formatCurrency(d.firstMortgage)],
  ["Mezzanine debt", (d) => formatCurrency(d.mezzanineDebt)],
  ["Investors", (d) => formatCurrency(d.investors)],
  ["Operator", (d) => formatCurrency(d.operator)],
  ["Frequency", (d) => d.frequency.toFixed(3)],
];

tooltipLineDefs.forEach(([label], index) => {
  tooltipLines[index].label.textContent = label;
});

const overlay = make("rect", {
  x: plotLeft,
  y: plotTop,
  width: plotWidth,
  height: plotHeight,
  fill: "transparent",
  style: "cursor: crosshair;",
});

const toSvgPoint = (event) => {
  const point = svg.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  return point.matrixTransform(svg.getScreenCTM().inverse());
};

const getClosestDatum = (x) => {
  let closest = series[0];
  let minDistance = Math.abs(series[0].x - x);

  for (let index = 1; index < series.length; index += 1) {
    const distance = Math.abs(series[index].x - x);
    if (distance < minDistance) {
      closest = series[index];
      minDistance = distance;
    }
  }

  return closest;
};

const updateTooltip = (datum) => {
  hoverGuide.setAttribute("x1", datum.x);
  hoverGuide.setAttribute("x2", datum.x);
  totalDot.setAttribute("cx", datum.x);
  totalDot.setAttribute("cy", datum.totalTopY);
  curveDot.setAttribute("cx", datum.x);
  curveDot.setAttribute("cy", datum.frequencyY);

  tooltipTitle.textContent = `Asset return: ${formatPercent(datum.assetReturn)}`;
  tooltipLineDefs.forEach(([, formatter], index) => {
    tooltipLines[index].value.textContent = formatter(datum);
  });

  const tooltipWidth = 205;
  const tooltipHeight = 152;
  const preferredX = datum.x + 14;
  const tooltipX = preferredX + tooltipWidth > plotRight - 4
    ? datum.x - tooltipWidth - 14
    : preferredX;
  const tooltipY = Math.max(plotTop + 8, Math.min(datum.frequencyY - 76, plotBottom - tooltipHeight - 8));

  tooltip.setAttribute("transform", `translate(${tooltipX}, ${tooltipY})`);
  tooltipShadow.setAttribute("transform", "translate(4, 5)");
};

const showHover = (event) => {
  const point = toSvgPoint(event);
  const clampedX = Math.max(plotLeft, Math.min(plotRight, point.x));
  const datum = getClosestDatum(clampedX);
  updateTooltip(datum);
  hoverLayer.setAttribute("opacity", "1");
};

overlay.addEventListener("mousemove", showHover);
overlay.addEventListener("mouseenter", showHover);
overlay.addEventListener("mouseleave", () => {
  hoverLayer.setAttribute("opacity", "0");
});
