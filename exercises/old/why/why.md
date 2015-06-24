---
layout: hidden
title: why?
---

<script src='https://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML'></script>

* table of contents
{:toc}

# simple programs with boolean variables

~~~
var programs = {
  "x->y": function() {
    var x = flip(0.5);
    var y = x;
    return [x, y];
  },
  "x<-y": function() {
    var y = flip(0.5);
    var x = y;
    return [x, y];
  },
  "x y": function() {
    var x = flip(0.5);
    var y = flip(0.5);
    return [x, y];
  },
  "x<->y": function() {
    var x = flip(0.5);
    var y = flip(0.5);
    factor( x == y ? 0 : -Infinity );
    return [x, y];
  }
}

map(
  function(prog_name) {
    print(prog_name);
    var prog = programs[prog_name];
    print(Enumerate(prog));
  },
  ["x->y", "x<-y", "x<->y", "x y"]
)
"finished"
~~~

~~~
~~~