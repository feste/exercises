---
layout: hidden
title: Lee & Wagenmakers 2014
---

<script src='https://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML'></script>

* table of contents
{:toc}

# Chapter 1: Basics

## Section 1.1: General Principles

### Figure 1.1

~~~
var abilityERP = MH(function() {
  var ability = uniform(0, 1);
  var test_score = binomial(ability, 10);
  condition( test_score == 9 );
  return ability;
}, 1000, {burn: 100, skip: 0});

print(expectation(abilityERP));
plotHist(abilityERP);
~~~

### Exercise 1.1.4

~~~
var chance = 0.5;
var abilityERP = MH(function() {
  var ability = uniform(0, 1);
  var score = binomial(ability + (1-ability)*chance, 10);
  condition( score == 9 );
  return ability;
}, 1000, {burn: 100, skip: 0});
print(expectation(abilityERP));
plotHist(abilityERP);
~~~

# Section 1.3: Sequential updating

~~~
var test0ERP = MH(function() {
  var ability = uniform(0, 1);
  var score = binomial(ability, 10);
  condition( score == 9 );
  return ability;
}, 1000, {burn: 100, skip: 0});
var test1ERP = MH(function() {
  var ability = sample(test0ERP);
  var score = binomial(ability, 5);
  condition( score == 3 );
  return ability;
}, 1000, {burn: 100, skip: 0});
print(expectation(test1ERP));
plotHist(test1ERP);
~~~

# Chapter 2: WinBUGS

~~~
var model = function(observed_k, n) {
  return function() {
    var theta = beta(1,1);
    var k = binomial(theta, n);
    condition ( k == observed_k );
    return theta;
  }
}

var data = {
  k: 5,
  n: 10
}

var chain_length = 100;
var opts = {
  burn: 10,
  skip: 0
}

var mh1 = MH(model(data.k, data.n), chain_length, opts, true);
var mh2 = MH(model(data.k, data.n), chain_length, opts, true);

print(expectation(mh1.erp));
plotMH(mh1);
print(expectation(mh2.erp));
plotMH(mh2);
~~~

# Chapter 3: Binomials

## Section 3.1: Inferring a rate

### Figure 3.2

~~~
var model = function(observed_k, n) {
  return function() {
    var theta = beta(1,1);
    var k = binomial(theta, n);
    condition ( k == observed_k );
    return theta;
  }
}

var data = {
  k: 5,
  n: 10
}

var chain_length = 1000;
var opts = {
  burn: 100,
  skip: 0
}

var abilityERP = MH(model(data.k, data.n), chain_length, opts);

print(expectation(abilityERP));
plotHist(abilityERP);
~~~

### Exercsises 3.1

* **Exercise 3.1.1**: ~0.5
* **Exercise 3.1.2**: ~3x
* **Exercise 3.1.3**: peakier
* **Exercise 3.1.4**: peaky (lower variance in actual posterior) vs smooth (better approximation of posterior)
* **Exercise 3.1.5**: right-skewed a lot
* **Exercise 3.1.6**: left-skewed a little. strength of evidence matters.

## Section 3.2: Differences between two rates

### Figure 3.4

~~~
///fold:
var cdf = cache(function(erp, value) {
  var support = filter(function(x) {return x <= value;}, erp.support());
  var probs = map(function(x) {return Math.exp(erp.score([], x));}, support);
  return sum(probs);
})
var CI95 = function(erp) {
  return map(function(x) {return get_quantile(erp, x);}, [0.025, 0.975]);
}
var MAP = function(erp) {
  var support = erp.support();
  var scores = map(function(x) {return erp.score([], x);}, support);
  var max_score = Math.max.apply(null, scores);
  return support[scores.indexOf(max_score)];
}
var get_quantile = function(erp, prob) {
  var support = sort(erp.support());
  var below = filter(function(x) {return cdf(erp, x) <= prob}, support);
  var above = filter(function(x) {return cdf(erp, x) >= prob}, support);
  return (above[0] + below[below.length-1])/2;
}
var median = function(erp) {
  return get_quantile(erp, 0.5);
}
///
var model = function(data) {
  return function() {
    var theta1 = beta(1,1);
    var theta2 = beta(1,1);
    var k1 = binomial(theta1, data.n1);
    var k2 = binomial(theta2, data.n2);
    var delta = theta1 - theta2;
    condition( k1==data.k1 & k2==data.k2)
    return delta;
  }
}

var data = {
  k1: 5,
  k2: 7,
  n1: 10,
  n2: 10
}

var chain_length = 1000;
var opts = {
  burn: 100,
  skip: 0
}

var diffERP = MH(model(data), chain_length, opts);

print("expectation: " + expectation(diffERP));
print("MAP: " + MAP(diffERP));
print("median: " + median(diffERP));
print("CI95: " + CI95(diffERP));
plotHist(diffERP);
~~~

### Exercises 3.2

* **Exercise 3.2.1**: peakier
* **Exercise 3.2.2**: we have more evidence that k2 is low than that k1 is low
* **Exercise 3.2.3**: e.g. bimodal

## Section 3.3: Inferring a common rate

### Figure 3.7

~~~
var model = function(data) {
  return function() {
    var theta = beta(1,1);
    var k1 = binomial(theta, data.n1);
    var k2 = binomial(theta, data.n2);
    condition( k1 == data.k1 & k2 == data.k2 );
    return theta;
  }
}
var data1 = {n1: 20, k1: 14, n2: 20, k2: 16}
var data2 = {n1: 10, k1: 0, n2: 10, k2: 10}
var data3A = {n1: 10, k1: 7, n2: 10, k2: 3}
var data3B = {n1: 10, k1: 5, n2: 10, k2: 5}

var chain_length = 1000;
var opts = {
  burn: 100,
  skip: 0
}

var erp1 = MH(model(data1), chain_length, opts);
print(expectation(erp1));
plotHist(erp1);
~~~

### Exercises 3.3

* **Exercise 3.3.1**: ~ .74
* **Exercise 3.3.2**: ~ .5 and yes. it's effectively 10/20. they're all independent samples.
* **Exercise 3.3.3**: ~ .5 and same: both are 10/20.

## Section 3.4: Prior and posterior prediction

### Figure 3.9

~~~
///fold:
var marginalize = function(erp, variable_name) {
  Enumerate(function() {
    var result = sample(erp);
    return result[variable_name];
  })
}
///
var model = function(data) {
  return function() {
    var theta = beta(1,1);
    var k = binomial(theta, data.n);
    var posterior_predictive_k = binomial(theta, data.n);
    var theta_prior = beta(1,1);
    var prior_predictive_k = binomial(theta_prior, data.n);
    condition( k == data.k );
    return({
      "theta": theta,
      "k": k,
      "posterior_predictive_k": posterior_predictive_k,
      "theta_prior": theta_prior,
      "prior_predictive_k": prior_predictive_k
    });
  }
}

var data = {k: 1, n: 15}

var chain_length = 1000;
var opts = {
  burn: 100,
  skip: 0
}

var modelERP = MH(model(data), chain_length, opts);

var variables = ["theta", "k", "posterior_predictive_k", "theta_prior", "prior_predictive_k"];
map(function(variable_name) {
  var erp = marginalize(modelERP, variable_name);
  plotHist(erp);
  return 1;
}, variables);
~~~

## Section 3.5: Posterior prediction

### Exercises 3.5

* **Exercise 3.5.1**: one value for theta, versus two values for the two different ks
* **Exercise 3.5.2**: not awesome
* **Exercise 3.5.3**: it might not be common? but if it is, it's probably 0.5

## Section 3.6 Joint distributions

### Figure 3.13

~~~
///fold:
var sum_squares = function(lstA, lstB) {
  return sum(map2(function(a,b){return Math.pow(Math.abs(a-b), 2)}, lstA, lstB));
}
var marginalize = function(erp, variable_name) {
  Enumerate(function() {
    var result = sample(erp);
    return result[variable_name];
  })
}
///
var model = function(observed_ks) {
  var m = observed_ks.length;
  return function() {
    //since we know n must be at least 27
    //and apparently there's some error happening when we choose an impossible n...
    var n = randomInteger(400) + 27;
    var theta = beta(1,1);
    var ks = repeat(m, function() {return binomial(theta, n);});
    factor( - sum_squares(ks, observed_ks) );
    return {
      "n": n,
      "theta": theta
    }
  }
}
var data = [16, 18, 22, 25, 27];

var chain_length = 10000;
var opts = {
  burn: 100,
  skip: 100
}

var result = MH(model(data), chain_length, opts, true);
var modelERP = result.erp;
var chain = result.chain;
var thetas = map(function(x) {return x.theta;}, chain);
var ns = map(function(x) {return x.n;}, chain);
scatter(ns, thetas);

var thetaERP = marginalize(modelERP, "theta");
print(expectation(thetaERP));
plotHist(thetaERP);

var nERP = marginalize(modelERP, "n");
print(expectation(nERP));
plotHist(nERP);
~~~