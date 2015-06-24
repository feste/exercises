---
layout: hidden
title: Circle puzzle from Square
---

<script src='https://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML'></script>

* table of contents
{:toc}

# 

~~~
//window of inference
var focus = {
  width: 100,
  height: 100
}
var buffer_size = 100;
var buffer = {
  left: buffer_size,
  right: buffer_size,
  top: buffer_size,
  bottom: buffer_size
}
var origin = {
  x: focus.width/2 + buffer.left,
  y: focus.height/2 + buffer.right
}
var where = function(point) {
  var pixels = {
    x: point.x + origin.x,
    y: point.y + origin.y
  }
  return pixels;
}

//random point generator (within focus window)
var random_point = function() {
  var point = {
    x: randomInteger(100) - 50,
    y: randomInteger(100) - 50,
  }
  return point;
}
//random circle generator (within whole window)
var random_circle = function(id) {
  var center = random_point();
  var center_pixels = where(center);
  var radius = randomInteger(50) + 1;
  return {
    id: id,
    center: center,
    radius: radius
  };
}

//point geometry functions
var mean = function(lst) {
  return sum(lst)/lst.length;
}
var point_mean = function(lst) {
  var mean_x = mean(map(function(elem) {return elem.x}, lst));
  var mean_y = mean(map(function(elem) {return elem.y}, lst));
  return {
    x: mean_x,
    y: mean_y
  }
}
var point_minus = function(p1, p2) {
  return {
    x: p1.x - p2.x,
    y: p1.y - p2.y
  }
}
var magnitude = function(p) {
  return Math.pow(p.x*p.x + p.y*p.y, 0.5);
}
var point_distance = function(p1, p2) {
  return magnitude(point_minus(p1, p2));
}


//drawing tools
var draw_circle = function(h, r, img, col) {
  var colour = col ? col : "steelblue";
  var h_pixels = where(h);
  img.circle(h_pixels.x, h_pixels.y, r, "white", colour);
  return true;
}

var draw_circles = function(circles, img) {
  map(function(c) {
    draw_circle(c.center, c.radius, img);
  }, circles);
}

//constraint function
var covers = function(encircler, circles) {
  return all(function(c) {
    return (point_distance(encircler.center, c.center) + c.radius) <= encircler.radius;
  }, circles);
}

//specific world generation
var img = Draw(focus.width + buffer.left + buffer.right,
               focus.height + buffer.top + buffer.bottom, true);

var circles = map(random_circle, [1,2,3]);

//starting circle: to guide inference
var starting_center = point_mean(map(function(circle) {
  return circle.center;
}, circles));

var starting_radius = function(circles, starting_center) {
  var radii = map(function(c) {return c.radius}, circles);
  var distances = map(function(c) {
    var distance = point_distance(c.center, starting_center);
    return distance + c.radius;
  }, circles);
  return Math.max.apply(null, radii.concat(distances));
}();
var starting_circle = {
  id: "start",
  center: starting_center,
  radius: starting_radius
}
var point_gaussian = function(mu, sig) {
  return {
    x: Math.max(-100, Math.min(100, gaussian(mu.x, sig))),
    y: Math.max(-100, Math.min(100, gaussian(mu.y, sig)))
  }
}

var model = function(circles, starting_circle) {
  return function() {
    var encircler = {
      id: "encircler",
      //center: random_point(),
      center: point_gaussian(starting_circle.center, 30),
      //radius: randomInteger(150)+1
      radius: gaussian(starting_circle.radius, 30)
    }
    factor( covers(encircler, circles) ? - encircler.radius : -Infinity );
    return encircler;
  }
}

var minr_estimate = function(erp) {
  var radii = map(function(x) {return x.radius}, erp.support());
  var minrad = Math.min.apply(null, radii);
  return erp.support()[radii.indexOf(minrad)];
}

var modelERP = ParticleFilter(model(circles, starting_circle), 1000);
var inferred_circle = minr_estimate(modelERP);
print(inferred_circle);

draw_circle(starting_circle.center, starting_circle.radius, img, "magenta");
draw_circle(inferred_circle.center, inferred_circle.radius, img, "grey");
draw_circles(circles, img);
~~~