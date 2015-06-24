"use strict";

var activeCodeBox;

// Utils

function euclideanDistance(v1, v2){
  var i;
  var d = 0;
  for (i = 0; i < v1.length; i++) {
    d += (v1[i] - v2[i])*(v1[i] - v2[i]);
  }
  return Math.sqrt(d);
};

function isErp(x){
  return (x && (x.score != undefined) && (x.sample != undefined));
}

function isErpWithSupport(x){
  return (isErp(x) && (x.support != undefined));
}

function jsPrint(x){
  var resultDiv = $(activeCodeBox.parent().find(".resultDiv"));
  resultDiv.show();
  if (isErpWithSupport(x)){
    var params = Array.prototype.slice.call(arguments, 2);
    var labels = x.support(params);
    var scores = _.map(labels, function(label){return x.score(params, label);});
    if (_.find(scores, isNaN) !== undefined){
      resultDiv.append(document.createTextNode("ERP with NaN scores!\n"));
      return;
    }
    var counts = scores.map(Math.exp);
    var resultDivSelector = "#" + resultDiv.attr('id');
    barChart(resultDivSelector, labels, counts);
  } else {
    resultDiv.append(
      document.createTextNode(
        JSON.stringify(x) + "\n"));
  }
}

function hist(s, k, a, lst) {
  var resultDiv = $(activeCodeBox.parent().find(".resultDiv"));
  var frequencyDict = _(lst).countBy(function(x) { return x + ""});
  var labels = _(frequencyDict).keys();
  var counts = _(frequencyDict).values();

  var resultDivSelector = "#" + resultDiv.attr('id');

  return k(s, barChart(resultDivSelector, labels, counts));
}

function print(store, k, a, x){
  jsPrint(x);
  return k(store);
}

function bar(store, k, a, labels, counts){
  var resultDiv = $(activeCodeBox.parent().find(".resultDiv"));
  resultDiv.show();
  var resultDivSelector = "#" + resultDiv.attr('id');
  barChart(resultDivSelector, labels, counts);
  return k(store);
}

function scatter(store, k, a, labels, counts){
  var resultDiv = $(activeCodeBox.parent().find(".resultDiv"));
  resultDiv.show();
  var resultDivSelector = "#" + resultDiv.attr('id');
  scatterChart(resultDivSelector, labels, counts);
  return k(store);
}

function line(store, k, a, labels, counts){
  var resultDiv = $(activeCodeBox.parent().find(".resultDiv"));
  resultDiv.show();
  var resultDivSelector = "#" + resultDiv.attr('id');
  lineChart(resultDivSelector, labels, counts);
  return k(store);
}

function plotMH(store, k, a, result) {

  var resultDiv = $(activeCodeBox.parent().find(".resultDiv"));
  resultDiv.show();
  var resultDivSelector = "#" + resultDiv.attr('id');

  MHChart(resultDivSelector, result);

  return k(store);
}

function plotHist(store, k, a, erp) {

  var resultDiv = $(activeCodeBox.parent().find(".resultDiv"));
  resultDiv.show();
  var resultDivSelector = "#" + resultDiv.attr('id');
  
  var n_bins = 20;
  var support = erp.support();
  var labels = [];
  var counts = [];
  var lower_bound = Math.min.apply(null, support);
  console.log(lower_bound);
  console.log(upper_bound);
  var upper_bound = Math.max.apply(null, support);
  var bin_width = (upper_bound - lower_bound) / 20;
  for (var i=0; i<20; i++) {
    var bin_lower_bound = lower_bound + (bin_width * i);
    var bin_upper_bound = lower_bound + (bin_width * (i + 1));
    labels.push( (bin_lower_bound + bin_upper_bound) / 2);
    var vals_in_bin = support.filter(function(x) {
      // x is between lower and upper bounds
      return x>=bin_lower_bound & x<bin_upper_bound;
    });
    if (vals_in_bin.length > 0) {
      var scores_in_bin = vals_in_bin.map(function(x) {
        // get probability
        return Math.exp( erp.score([], x) );
      });
      var bin_height = scores_in_bin.reduce(function(a, b) {
        return a + b;
      });
    } else {
      var bin_height = 0;
    }
    counts.push(bin_height);
  }

  $(resultDivSelector).show();
  var svg = d3.select(resultDivSelector)
    .append("svg")
    .attr("class", "barChart");

  numBarChart(svg, labels, counts, lower_bound, upper_bound, 80, 480);

  return k(store);
}

function MHChart(containerSelector, result) {
  var chain = result.chain;
  var erp = result.erp;

  // $(containerSelector).append("<div class='trace'>trace</div>");
  // $(containerSelector).append("<div class='dist'>hist and kernel</div>");

  // var traceSelector = containerSelector + " .trace";
  // var distSelector = containerSelector + " .dist";

  var iterations = [];
  for (var i=0; i<chain.length; i++) {
    iterations.push(i);
  }

  // lineChart(traceSelector, iterations, chain);
  var svg = lineChart(containerSelector, iterations, chain, 60, 200);
  
  var n_bins = 20;
  var support = erp.support();
  // if (n_bins >= support.length) {
  //   var labels = support;
  //   var scores = _.map(labels, function(label){return erp.score([], label);});
  //   if (_.find(scores, isNaN) !== undefined){
  //     resultDiv.append(document.createTextNode("ERP with NaN scores!\n"));
  //     return;
  //   }
  //   var counts = scores.map(Math.exp);
  // } else {
    var labels = [];
    var counts = [];
    var lower_bound = Math.min.apply(null, support);
    console.log(lower_bound);
    console.log(upper_bound);
    var upper_bound = Math.max.apply(null, support);
    var bin_width = (upper_bound - lower_bound) / 20;
    for (var i=0; i<20; i++) {
      var bin_lower_bound = lower_bound + (bin_width * i);
      var bin_upper_bound = lower_bound + (bin_width * (i + 1));
      labels.push( (bin_lower_bound + bin_upper_bound) / 2);
      var vals_in_bin = support.filter(function(x) {
        // x is between lower and upper bounds
        return x>=bin_lower_bound & x<bin_upper_bound;
      });
      if (vals_in_bin.length > 0) {
        var scores_in_bin = vals_in_bin.map(function(x) {
          // get probability
          return Math.exp( erp.score([], x) );
        });
        var bin_height = scores_in_bin.reduce(function(a, b) {
          return a + b;
        });
      } else {
        var bin_height = 0;
      }
      counts.push(bin_height);
    }
  // }
  numBarChart(svg, labels, counts, lower_bound, upper_bound, 340, 200);

  //density(svg, chain, labels, counts, lower_bound, upper_bound);
}

function numBarChart(svg, labels, counts, lower_bound, upper_bound, left, width){
  //$(containerSelector).show();
  // var svg = d3.select(containerSelector)
  //   .append("svg")
  //   .attr("class", "barChart");
  var data = [];
  for (var i=0; i<labels.length; i++){
    data.push({
      "Label": labels[i],
      "Count": counts[i]
    });
  };
  var chart = new dimple.chart(svg, data);
  chart.setBounds(left, 30, width, 250);

  var xAxis = chart.addCategoryAxis("x", "Label");
  xAxis.addOrderRule(function(a, b) {
    return a.Label - b.Label;
  });
  xAxis.title = null;
  xAxis.tickFormat = ",.2f";
  var yAxis = chart.addMeasureAxis("y", "Count");
  yAxis.overrideMin = 0;
  yAxis.title = null;
  yAxis.tickFormat = ",.2f";
  chart.addSeries("Label", dimple.plot.bar);
  chart.addSeries("")
  chart.draw();
}

// function density(svg, chain, labels, counts, lower_bound, upper_bound) {
//   var data = [];
//   for (var i=0; i<labels.length; i++){
//     data.push({
//       "Label": labels[i],
//       "Count": 0.1
//     });
//   };
//   var chart = new dimple.chart(svg, data);
//   chart.setBounds(340, 30, 200, 250);

//   var xAxis = chart.addMeasureAxis("x", "Label");
//   xAxis.overrideMin = lower_bound;
//   xAxis.overrideMax = upper_bound;
//   var yAxis = chart.addMeasureAxis("y", "Count");
//   // xAxis.hidden = true;
//   // yAxis.hidden = true;
//   chart.addSeries("Label", dimple.plot.line);
//   chart.draw();
// }


// var make_density_spec = function(samps) {
    
//     // NB: scale argument is no longer used, as we now estimate the bandwidth
//     function kernelDensityEstimator(counter, kernel, scale) {
//         var density_values = [];
//         var keys = Object.keys(counter.counter);

//         // get optimal bandwidth
//         // HT http://en.wikipedia.org/wiki/Kernel_density_estimation#Practical_estimation_of_the_bandwidth
//         var sum = samps.reduce(function(x,y) { return x + y });
//         var n = samps.length;
//         var mean = sum / n;
//         var sd = Math.sqrt(samps.reduce(function(acc, x) {
//             return acc + Math.pow(x - mean, 2)
//         }) / (n-1));

//         var bandwidth = 1.06 * sd * Math.pow(n, -0.2);
//         var min = counter.min;
//         var max = counter.max;

//         var numBins = (max - min) / bandwidth;
        
//         for (var i = 0; i <= numBins; i++) {
//             var x = min + bandwidth * i;
//             var kernel_sum = 0;
//             for (var j = 0; j < keys.length; j++) {
//                 kernel_sum += kernel((x - keys[j]) / bandwidth) * counter.count(keys[j]);
//             }
//             density_values.push({item: x, value: kernel_sum / (n * bandwidth)});
//         }
//         return density_values; 
//     }

//     function epanechnikovKernel(u) {
//             return Math.abs(u) <= 1 ? .75 * (1 - u * u) : 0;
//     }

//     var counter = new Counter(listToArray(samps));

//     var padding = {top: 30 + (title ? titleOffset : 0), left: 45, bottom: 50, right: 30};
//     var data = [{name: "density", values: kernelDensityEstimator(counter, epanechnikovKernel, 3)}];
// };





// Bar plots

function barChart(containerSelector, labels, counts){
  $(containerSelector).show();
  var svg = d3.select(containerSelector)
    .append("svg")
    .attr("class", "barChart");
  var data = [];
  for (var i=0; i<labels.length; i++){
    if (counts[i] > 0) {
      data.push({
        "Label": JSON.stringify(labels[i]),
        "Count": counts[i]
      });
    }
  };
  var chart = new dimple.chart(svg, data);
  chart.setBounds(80, 30, 480, 250);
  var xAxis = chart.addMeasureAxis("x", "Count");
  xAxis.title = null;
  xAxis.tickFormat = ",.2f";
  var yAxis = chart.addCategoryAxis("y", "Label");
  yAxis.title = null;
  chart.addSeries("Count", dimple.plot.bar);
  chart.draw();
}

function lineChart(containerSelector, labels, counts, left, chart_width){
  $(containerSelector).show();
  var svg = d3.select(containerSelector)
    .append("svg")
    .attr("class", "barChart");
  var data = [];
  for (var i=0; i<labels.length; i++){
    if (counts[i] > 0) {
      data.push({
        "Label": JSON.stringify(labels[i]),
        "Count": counts[i]
      });
    }
  };
  var chart = new dimple.chart(svg, data);
  chart.setBounds( (left ? left : 80) , 30, (chart_width ? chart_width : 480), 250);
  var xAxis = chart.addMeasureAxis("x", "Label");
  xAxis.title = null;
  xAxis.tickFormat = ",.2f";
  xAxis.ticks = 5;
  var yAxis = chart.addMeasureAxis("y", "Count");
  yAxis.title = null;
  yAxis.tickFormat = ",.2f";
  chart.addSeries("Label", dimple.plot.line);
  chart.draw();
  return svg;
}

function scatterChart(containerSelector, labels, counts){
  $(containerSelector).show();
  var svg = d3.select(containerSelector)
    .append("svg")
    .attr("class", "barChart");
  var data = [];
  for (var i=0; i<labels.length; i++){
      data.push({
        "x": labels[i],
        "y": counts[i],
        "index": i
      });
  };
  var chart = new dimple.chart(svg, data);
  chart.setBounds( 80 , 30, 480, 250);
  var xAxis = chart.addMeasureAxis("x", "x");
  xAxis.title = null;
  xAxis.tickFormat = ",.2f";
  xAxis.ticks = 5;
  var yAxis = chart.addMeasureAxis("y", "y");
  yAxis.title = null;
  yAxis.tickFormat = ",.2f";
  chart.addSeries("index", dimple.plot.bubble);
  chart.draw();
  return svg;

}


// Drawing

function DrawObject(width, height, visible){
  this.canvas = $('<canvas/>', {
    "class": "drawCanvas",
    "Width": width + "px",
    "Height": height + "px"
  })[0];
  if (visible==true){
    $(this.canvas).css({"display": "inline"});
    $(activeCodeBox).parent().append(this.canvas);
  };
  this.paper = new paper.PaperScope();
  this.paper.setup(this.canvas);
  this.paper.view.viewSize = new this.paper.Size(width, height);
  this.redraw();
}

DrawObject.prototype.newPath = function(strokeWidth, opacity, color){
  var path = new this.paper.Path();
  path.strokeColor = color || 'black';
  path.strokeWidth = strokeWidth || 8;
  path.opacity = opacity || 0.6;
  return path;
};

DrawObject.prototype.newPoint = function(x, y){
  return new this.paper.Point(x, y);
};

DrawObject.prototype.circle = function(x, y, radius, stroke, fill){
  var point = this.newPoint(x, y);
  var circle = new this.paper.Path.Circle(point, radius || 50);
  circle.fillColor = fill || 'black';
  circle.strokeColor = stroke || 'black';
  this.redraw();
};

DrawObject.prototype.polygon = function(x, y, n, radius, stroke, fill){
  var point = this.newPoint(x, y);
  var polygon = new this.paper.Path.RegularPolygon(point, n, radius || 20);
  polygon.fillColor = fill || 'white';
  polygon.strokeColor = stroke || 'black';
  polygon.strokeWidth = 4;
  this.redraw();
};

DrawObject.prototype.line = function(x1, y1, x2, y2, strokeWidth, opacity, color){
  var path = this.newPath(strokeWidth, opacity, color);
  path.moveTo(x1, y1);
  path.lineTo(this.newPoint(x2, y2));
  this.redraw();
};

DrawObject.prototype.redraw = function(){
  this.paper.view.draw();
};

DrawObject.prototype.toArray = function(){
  var context = this.canvas.getContext('2d');
  var imgData = context.getImageData(0, 0, this.canvas.width, this.canvas.height);
  return imgData.data;
};

DrawObject.prototype.distanceF = function(f, cmpDrawObject){
  if (!((this.canvas.width == cmpDrawObject.canvas.width) &&
        (this.canvas.height == cmpDrawObject.canvas.height))){
    console.log(this.canvas.width, cmpDrawObject.canvas.width,
                this.canvas.height, cmpDrawObject.canvas.height);
    throw new Error("Dimensions must match for distance computation!");
  }
  var thisImgData = this.toArray();
  var cmpImgData = cmpDrawObject.toArray();
  return f(thisImgData, cmpImgData);
};

DrawObject.prototype.distance = function(cmpDrawObject){
  var df = function(thisImgData, cmpImgData) {
    var distance = 0;
    for (var i=0; i<thisImgData.length; i+=4) {
      var col1 = [thisImgData[i], thisImgData[i+1], thisImgData[i+2], thisImgData[i+3]];
      var col2 = [cmpImgData[i], cmpImgData[i+1], cmpImgData[i+2], cmpImgData[i+3]];
      distance += euclideanDistance(col1, col2);
    };
    return distance;
  };
  return this.distanceF(df, cmpDrawObject)
};

DrawObject.prototype.destroy = function(){
  this.paper = undefined;
  $(this.canvas).remove();
}

function Draw(s, k, a, width, height, visible){
  return k(s, new DrawObject(width, height, visible));
}

function loadImage(s, k, a, drawObject, url){
  // Synchronous loading - only continue with computation once image is loaded
  var context = drawObject.canvas.getContext('2d');
  var imageObj = new Image();
  imageObj.onload = function() {
    var raster = new drawObject.paper.Raster(imageObj);
    raster.position = drawObject.paper.view.center;
    drawObject.redraw();
    var trampoline = k(s);
    while (trampoline){
      trampoline = trampoline();
    }
  };
  imageObj.src = url;
  return false;
}


// Code boxes

function webpplObjectToText(x){
  if (isErp(x)){
    return "<erp>";
  } else {
    return JSON.stringify(x);
  }
}

var codeBoxCount = 0;

CodeMirror.keyMap.default["Cmd-/"] = "toggleComment";
CodeMirror.keyMap.default["Cmd-."] = function(cm){cm.foldCode(cm.getCursor(), myRangeFinder); };

//fold "///fold: ... ///" parts:
function foldCode(cm){
  var lastLine = cm.lastLine();
  for(var i=0;i<=lastLine;i++) {
    var txt = cm.getLine(i),
    pos = txt.indexOf("///fold:");
    if (pos==0) {cm.foldCode(CodeMirror.Pos(i,pos), tripleCommentRangeFinder);}
  }
}

function setupCodeBox(element){
  var $element = $(element);
  var $code = $element.html();
  var $unescaped = $('<div/>').html($code).text();

  $element.empty();

  var cm = CodeMirror(
    element, {
      value: $unescaped,
      mode: 'javascript',
      lineNumbers: false,
      readOnly: false,
      extraKeys: {"Tab": "indentAuto"}
    });

  foldCode(cm);

  var getLanguage = function(){
    var firstLine = cm.getValue().split("\n")[0];
    if (firstLine == "// language: javascript") {
      return "javascript";
    } else if (firstLine == "// static") {
      return "static";
    } else {
      return "webppl";
    }
  };

  var resultDiv = $('<div/>',
    { "id": "result_" + codeBoxCount,
      "class": "resultDiv" });

  var showResult = function(store, x){
    if (x !== undefined) {
      resultDiv.show();
      resultDiv.append(document.createTextNode(webpplObjectToText(x)));
    }
  };

  var runWebPPL = function(){
    var oldActiveCodeBox = activeCodeBox;
    activeCodeBox = $element;
    activeCodeBox.parent().find("canvas").remove();
    activeCodeBox.parent().find(".resultDiv").text("");
    var compiled = webppl.compile(cm.getValue(), true);
    eval.call(window, compiled)({}, showResult, '');
  };

  var runJS = function(){
    activeCodeBox = $element;
    activeCodeBox.parent().find("canvas").remove();
    activeCodeBox.parent().find(".resultDiv").text("");
    try {
      var result = eval.call(window, cm.getValue());
      showResult({}, result);
    } catch (err) {
      resultDiv.show();
      resultDiv.append(document.createTextNode((err.stack)));
      throw err;
    }
  };

  var runButton = $(
    '<button/>', {
      "text": "run",
      "id": 'run_' + codeBoxCount,
      "class": 'runButton',
      "click": function(){
        return (getLanguage() == "javascript") ? runJS() : runWebPPL();
      }
    });

  var runButtonDiv = $("<div/>");
  runButtonDiv.append(runButton);

  if (getLanguage() == "static"){
    cm.setValue(cm.getValue().split("\n").slice(1).join("\n").trim());
  } else {
    $element.parent().append(runButtonDiv);
  }

  $element.parent().append(resultDiv);

  codeBoxCount += 1;

  return cm;
}

function setupCodeBoxes(){
  $('pre > code').each(function() {
    setupCodeBox(this);
  });
}

$(setupCodeBoxes);


// CPS and addressing forms

function updateTransformForm(inputId, outputId, transformer){
  try {
    var cpsCode = transformer($(inputId).val());
    $(outputId).val(cpsCode);
  } catch (err) {
  }
  $(outputId).trigger('autosize.resize');
}

function setupTransformForm(inputId, outputId, eventListener){
  $(inputId).autosize();
  $(outputId).autosize();
  $(inputId).bind('input propertychange', eventListener);
  $(inputId).change();
  eventListener();
}

// CPS

var updateCpsForm = function(){
  updateTransformForm("#cpsInput", "#cpsOutput", webppl.cps);
};
var setupCpsForm = function(){
  setupTransformForm("#cpsInput", "#cpsOutput", updateCpsForm);
};

$(function(){
  if ($("#cpsInput").length){
    $(setupCpsForm);
  }
});


// Naming

var updateNamingForm = function(){
  updateTransformForm("#namingInput", "#namingOutput", webppl.naming);
};
var setupNamingForm = function(){
  setupTransformForm("#namingInput", "#namingOutput", updateNamingForm);
};

$(function(){
  if ($("#namingInput").length){
    $(setupNamingForm);
  }
});


// Google analytics

(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','//www.google-analytics.com/analytics.js','ga');

ga('create', 'UA-54996-12', 'auto');
ga('send', 'pageview');


// Date

function setDate(){
  var today = new Date();
  var dd = today.getDate();
  var mm = today.getMonth() + 1; //January is 0!
  var yyyy = today.getFullYear();
  $(".date").text(yyyy+'-'+mm+'-'+dd);
}

$(setDate);


// Bibtex

function setBibtex(){
  $('#toggle-bibtex').click(function(){$('#bibtex').toggle(); return false;});
}

$(setBibtex)

// Special functions for webppl code boxes

var invertMap = function (store, k, a, obj) {

  var newObj = {};

  for (var prop in obj) {
    if (obj.hasOwnProperty(prop)) {
      var value = obj[prop];
      if (newObj.hasOwnProperty(value)) {
        newObj[value].push(prop);
      } else {
        newObj[value] = [prop];
      }
    }
  }

  return k(store, newObj);
};
