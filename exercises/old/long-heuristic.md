---
layout: hidden
title: Different Possible Heuristic Factors
---

<script src='https://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML'></script>

* table of contents
{:toc}

# Program

~~~
var heuristic_factor = function(model_parameters, heuristic_factor_type) {
	if (heuristic_factor_type == "none") {
		return 0;
	} else {
		print("oops. try a different factor type");
	}
}

var model_parameters = {
	actual_factor: -5
}

var model = function(model_parameters, heuristic_factor_type) {
  return function() {
    var a = flip(0.5);
    var h = a ? 0 : heuristic_factor(model_parameters, heuristic_factor_type);
    factor(h);
    var b = flip(0.05);
    var g = (a || b) ? 0 : model_parameters["actual_factor"];
    factor(g - h);
    return [a, b];
  }
};

print(Enumerate(model(model_parameters, "none"), 20))
~~~

# Math

$$ \begin{align*}
	\mathbb{E}(future \ score \ | \ a) &= 0 \\
	\mathbb{E}(future \ score \ | \ ~a) &= p(~b) \cdot actual\_factor = 0.95 actual\_factor \\
	variance(future \ score \ | \ a) &= 0 \\
	variance(future \ score \ | \ ~a) &= p(b) (0 - 0.95 actual\_factor)^2 + p(~b) (actual\_factor - 0.95 actual\_factor)^2 \\
		&= 0.05 (0 - 0.95 actual\_factor)^2 + 0.95 (0.05 actual\_factor)^2
\end{align*} $$

# Heuristic Factors

~~~
var model = function(of, hf) {
  return function() {
    var a = flip(0.5);
    var h = a ? 0 : hf;
    factor(h);
    var b = flip(0.05);
    var g = a || b ? 0 : of;
    factor(g - h);
    return [a, b];
  }
};

var trueERP = Enumerate(model(-5, 0), 20);
var truePosterior = map(function(x) {
  return [x, Math.exp(trueERP.score([], x))]
}, trueERP.support());

var dKL = function(erp) {
  if (erp.support([]).length !== 4) {
    console.error("Incomplete support!")
    return -Infinity
  }
  return mapReduce1(plus,
                    function(s) {
                      var p = s[1];
                      if (p === 0) return 0;
                      var q = erp.score([], s[0]);
                      return p * (Math.log(p) - q)
                    },
                    truePosterior)
}
var dTV = function(erp) {
  return 0.5 * mapReduce1(plus,
                          function(s) {
                            var p = s[1];
                            var q = erp.score([], s[0]);
                            return Math.abs(p - Math.exp(q));
                          },
                          truePosterior)
}

var numParticles = 20;
var numTrials = 1000;

print(numParticles + ' particles ' + numTrials + ' times:')

var infer = function(model, of, hf) {
  return function() {
    var fixedModel = model(of, hf);
    var dist = ParticleFilter(fixedModel, numParticles)
    return dTV(dist);
  }
};

var result = function(model, of, hf) {
  var runs = repeat(numTrials, infer(model, of, hf));
  var mean = listMean(runs);
  var stdev = listStdev(runs, mean);
  return {mu: mean, sigma: stdev};
}

var originalFactor = -5;
var heuristicFactors = [-4.75,
                        -4.75 * 1.1,
                        -4.75 * 2,
                        -4.75 / 1.1,
                        -4.75 / 2,
                        0];

map(
  function(hf) {
    var res = result(model, originalFactor, hf);
    print('hf: ' + (hf < 0 ? '' : ' ') + hf.toFixed(4) + ' ==> ' +
                res.mu.toFixed(4) + ' [' + res.sigma.toFixed(4) + ']');
  },
  heuristicFactors
);


~~~