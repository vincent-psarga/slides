var circleArrow = {
  svgns: "http://www.w3.org/2000/svg",
  defaultOptions: {
    arrows: ['red', 'green', 'blue'],
    startAngle: 180,
    cx: 150,
    cy: 150,
    radius: 100,
    labelRadius: 150,
    arrowWidth: 30,
    background: 'black',
    separatorWidth: 5
  },

  makeOptions: function (opts) {
    // Waiting for Object.assign to be available.

    var options = {};

    Object.keys(this.defaultOptions).forEach(function (k) {
      options[k] = this.defaultOptions[k];
    }, this);

    Object.keys(opts).forEach(function (k) {
      options[k] = opts[k];
    });
    return options;
  },

  toRadian: function (degree) {
    return degree * Math.PI / 180;
  },

  positionInCircle: function (cx, cy, radius, angle) {
    return {
      x: Math.cos(angle) * radius + cx,
      y: Math.sin(angle) * radius + cy
    }
  },

  centerElement: function (element) {
    var bbox = element.getBBox();

    element.setAttribute('x', element.getAttribute('x') - bbox.width  / 2);
    element.setAttribute('y', element.getAttribute('y') + bbox.height  / 2);
  },

  createElement: function (type, attributes, html) {
    var element = document.createElementNS(this.svgns, type);

    Object.keys(attributes).forEach(function (key) {
      element.setAttribute(key, attributes[key]);
    });
    element.innerHTML = html;
    return element;
  },

  regularArcData: function (cx, cy, radius, startDegrees, endDegrees, isCounterClockwise) {
    // From: http://stackoverflow.com/questions/16498673/svg-how-can-i-draw-stroked-circle-with-cuted-element
    // Thanks to MarkE for the answer and the regularArcData method.
    var offsetRadians=0;  // -Math.PI/2 for 12 o'clock
    var sweepFlag=(isCounterClockwise)?0:1;
    var startRadians=offsetRadians+startDegrees*Math.PI/180;
    var endRadians=offsetRadians+endDegrees*Math.PI/180;
    var largeArc=( (endRadians-startRadians) % (2*Math.PI) ) > Math.PI ? 1 : 0;
    var startX=parseInt(cx+radius*Math.cos(startRadians));
    var startY=parseInt(cy+radius*Math.sin(startRadians));
    var endX=  parseInt(cx+radius*Math.cos(endRadians));
    var endY=  parseInt(cy+radius*Math.sin(endRadians));
    var space=" ";
    var arcData="";

    arcData+="M"+space+startX         +space
                      +startY         +space;
    arcData+="A"+space+radius         +space
                      +radius         +space
                      +offsetRadians  +space
                      +largeArc       +space
                      +sweepFlag      +space
                      +endX           +space
                      +endY;
    return(arcData);
  },

  findHeadCenter: function (endDegrees, options) {
    return this.positionInCircle(options.cx, options.cy, options.radius, this.toRadian(endDegrees));
  },

  makePolygonPoints: function (points) {
    return points.map(function (point) {return point.x + "," + point.y}).join(" ");
  },

  createShaft: function (index, startDegrees, endDegrees, arrow, options) {
    var color = arrow.color || arrow;

    return this.createElement('path', {
      id: options.containerId + '-shaft-' + index,
      class: 'circle-arrow-shaft arrow-' + index,
      fill: 'none',
      stroke: color,
      'stroke-width': options.arrowWidth,
      d: this.regularArcData(options.cx, options.cy, options.radius, startDegrees, endDegrees)
    })
  },

  createHead: function (index, endDegrees, arrow, options) {
    var color = arrow.color || arrow,
      hc = this.findHeadCenter(endDegrees, options),
      points = [
        this.positionInCircle(hc.x, hc.y, options.arrowWidth, this.toRadian(endDegrees + 330)),
        this.positionInCircle(hc.x, hc.y, options.arrowWidth, this.toRadian(endDegrees + 210)),
        this.positionInCircle(hc.x, hc.y, options.arrowWidth, this.toRadian(endDegrees + 90))
      ];

    return this.createElement('polygon', {
      id: options.containerId + '-head-' + index,
      class: 'circle-arrow-separator arrow-' + index,
      fill: color,
      stroke: 'none',
      points: this.makePolygonPoints(points)
    });
  },

  createSeparator: function (index, endDegrees, options) {
    if (options.separatorWidth == 0) {
      return;
    }

    var hc = this.findHeadCenter(endDegrees, options),
      points = [
        this.positionInCircle(hc.x, hc.y, options.arrowWidth, this.toRadian(endDegrees + 330)),
        this.positionInCircle(hc.x, hc.y, options.arrowWidth + options.separatorWidth, this.toRadian(endDegrees + 330)),
        this.positionInCircle(hc.x, hc.y, options.arrowWidth + options.separatorWidth, this.toRadian(endDegrees + 90)),
        this.positionInCircle(hc.x, hc.y, options.arrowWidth + options.separatorWidth, this.toRadian(endDegrees + 210)),
        this.positionInCircle(hc.x, hc.y, options.arrowWidth, this.toRadian(endDegrees + 210)),
        this.positionInCircle(hc.x, hc.y, options.arrowWidth - options.separatorWidth, this.toRadian(endDegrees + 90))
      ];

    return this.createElement('polygon', {
      id: options.containerId + '-separator-' + index,
      class: 'circle-arrow-separator',
      fill: options.background,
      stroke: 'none',
      points: this.makePolygonPoints(points)
    });
  },

  createLabel: function (index, middleDegrees, arrow, options) {
    var position = this.positionInCircle(options.cx, options.cy, options.labelRadius, this.toRadian(middleDegrees)),
      label = arrow.label,
      labelElement;

    if (typeof(label) == 'undefined' || label  == null) {
      return;
    }

    return  this.createElement('text', {
      class: 'circle-arrow-label  arrow-' + index,
      x: position.x + (arrow.labelx || 0),
      y: position.y + (arrow.labely || 0)
    }, label);
  },

  addCircleArrow: function (opts) {
    var options = this.makeOptions(opts),
      svgContainer = document.getElementById(options.containerId),      
      angle = 360 / options.arrows.map(function (arr) {return arr.weight || 1; }).reduce(function(pv, cv) { return pv + cv; }, 0),
      separators = [],
      heads = [],
      shafts = [],
      labels = [],
      startDegrees = options.startAngle;

    options.arrows.forEach(function (arrow, index) {
      var arrowAngle = angle * (arrow.weight || 1),
        endDegrees = startDegrees + arrowAngle,
        middleDegrees = startDegrees + arrowAngle / 2;

      shafts.push(this.createShaft(index, startDegrees, endDegrees, arrow, options));
      heads.push(this.createHead(index, endDegrees, arrow, options));
      separators.push(this.createSeparator(index, startDegrees, options));
      labels.push(this.createLabel(index, middleDegrees, arrow, options));

      startDegrees = endDegrees;
    }, this);

    [shafts, separators, heads, labels].forEach(function (elements) {
      elements.forEach(function (element) {
        if (typeof(element) == 'undefined') {
          return;
        }
        svgContainer.appendChild(element);
      }, this);
    }, this);

    labels.forEach(function (label) {
      if (typeof(element) == 'undefined') {
        return;
      }

      this.centerElement(label);
    }, this);
  }
}