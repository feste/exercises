---
layout: hidden
title: Different Possible Heuristic Factors
---

<script src='https://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML'></script>

* table of contents
{:toc}

# Goal

There are a few different things that we might think the "best heuristic factor" might be. I'm comparing a bunch of things, with the hypothesis that expected factor or expected factor scaled by the variance will be the best.

* "expected score": expectation over the prior distribution of the overall score in the posterior (including the trace so far)
* "expected future score": expectation over the future of the prior distribution of the future score in the posterior (excluding the trace so far)
* "expected factor": expectation over the future of the prior distribution of the future overall factor (if this is an estimate, possibly weighted by the confidence in that estimate)
* "weighted expected factor": expectation over the future of the prior distribution of the future overall factor, weighted by the variance on that quantity (and if this is an estimate, possibly also weighted by the confidence in that estimate)

We also have manual heuristic factors that we've chosen for some programs that we can compare to these computed values.

I'm using `funnybinomial` from [DIPPL Chapter 4](//dippl.org/chapters/04-factorseq.html) as a first example program. My goal is to fully understand how different numbers of particles and different heuristic factors affect (speed of) convergence.

Here's the program.

~~~
var funnybinomial = function(){
  var a = sample(bernoulliERP, [0.1])
  var b = sample(bernoulliERP, [0.5])
  var c = sample(bernoulliERP, [0.1])
  factor( (a|b|c) ? 0:-10)
  return a + b + c;
}

print(Enumerate(funnybinomial, 20));
~~~

Here's a graph of the random choices in the program, not including the `factor( (a|b|c)?0:-10 )` at the end.

![P(a)=.1, P(b)=.9, P(c)=.1](funnybinomial.png)

# Calculations

We can compute the values of these different possible heuristic factors.

## Expected score

* ...once we know `a`

$$ \begin{align*}
	\mathbb{E}(score \ | \ a=true)
		&= \sum_{b, c} P(b)P(c)(\ln(P(a=true)P(b)P(c)) + factor(a=true,b,c)) \\
		&= (.9)(.1)\ln((.1)(.9)(.1)) + (.9)(.9)\ln((.1)(.9)(.9)) + \\
		& \ \ \ \ \ (.1)(.1)\ln((.1)(.1)(.1)) + (.1)(.9)\ln((.1)(.1)(.9)) \\
	& \approx -2.9528 \\ \\
	\mathbb{E}(score \ | \ a=false)
		&= \sum_{b, c} P(b)P(c)(\ln(P(a=false)P(b)P(c)) + factor(a=false,b,c)) \\
		&= (.9)(.1)\ln((.9)(.9)(.1)) + (.9)(.9)\ln((.9)(.9)(.9)) + \\
		& \ \ \ \ \ (.1)(.1)\ln((.9)(.1)(.1)) + (.1)(.9)[ \ln((.9)(.1)(.9)) - 10 ] \\
	& \approx -1.6555
\end{align*} $$

* ...once we know both `a` and `b`

$$ \begin{align*}
	\mathbb{E}(score \ | \ a=true, b=true)
		&= \sum_{c} P(c)(\ln(P(a=true)P(b=true)P(c)) + factor(a=true,b=true,c)) \\
		&= (.1)\ln((.1)(.9)(.1)) + (.9)\ln((.1)(.9)(.9)) \\
	& \approx -2.7330 \\ \\
	\mathbb{E}(score \ | \ a=true, b=false)
		&= \sum_{c} P(c)(\ln(P(a=true)P(b=false)P(c)) + factor(a=true,b=false,c)) \\
		&= (.1)\ln((.1)(.1)(.1)) + (.9)\ln((.1)(.1)(.9)) \\
	& \approx -4.9303 \\ \\
	\mathbb{E}(score \ | \ a=false, b=true)
		&= \sum_{c} P(c)(\ln(P(a=false)P(b=true)P(c)) + factor(a=false,b=true,c)) \\
		&= (.1)\ln((.9)(.9)(.1)) + (.9)\ln((.9)(.9)(.9)) \\
	& \approx -0.53580 \\ \\
	\mathbb{E}(score \ | \ a=false, b=false)
		&= \sum_{c} P(c)(\ln(P(a=false)P(b=false)P(c)) + factor(a=false,b=false,c)) \\
		&= (.1)\ln((.9)(.1)(.1)) + (.9)\ln((.9)(.1)(.9)) \\
	& \approx -2.7330
\end{align*} $$

This is by far the hardest value to compute. With this as a heuristic factor, we would also double-count the prior probability of every random choice in the program. We would weight one random choice based on the prior probabilities of all the future random choices, and then when we get to those random choices, sample according to those probabilities. This is almost certainly not what we want to be doing.

## Expected future score

* ...once we know `a`

$$ \begin{align*}
	\mathbb{E}(score \ | \ a=true)
		&= \sum_{b, c} P(b)P(c)[\ln(P(b)P(c)) + factor(a=true,b,c)] \\
		&= (.9)(.1)\ln((.9)(.1)) + (.9)(.9)\ln((.9)(.9)) + \\
		& \ \ \ \ \ (.1)(.1)\ln((.1)(.1)) + (.1)(.9)\ln((.1)(.9)) \\
	& \approx -0.65017 \\ \\
	\mathbb{E}(score \ | \ a=false)
		&= \sum_{b, c} P(b)P(c)[\ln(P(b)P(c)) + factor(a=false,b,c)] \\
		&= (.9)(.1)\ln((.9)(.1)) + (.9)(.9)\ln((.9)(.9)) + \\
		& \ \ \ \ \ (.1)(.1)\ln((.1)(.1)) + (.1)(.9)[ \ln((.1)(.9)) - 10 ] \\
	& \approx -1.5502
\end{align*} $$

* ...once we know both `a` and `b`

$$ \begin{align*}
	\mathbb{E}(score \ | \ a=true \ \mbox{OR} \ b=true)
		&= \sum_{c} P(c)[\ln(P(c)) + factor(\ (a=true \ \mbox{OR} \ b=true) \ \mbox{AND} \ c)] \\
		&= (.1)\ln(.1) + (.9)\ln(.9) \\
	& \approx -0.32508 \\ \\
	\mathbb{E}(score \ | \ a=false, b=false)
		&= \sum_{c} P(c)[\ln(P(c)) + factor(a=false,b=false,c)] \\
		&= (.1)\ln(.1) + (.9)[ \ln(.9) - 10 ] \\
	& \approx -9.3251
\end{align*} $$

This is somewhat easier to compute, but it still double-counts all of the prior probabilities of all of the future random choices.

## Expected factor

* ...once we know `a`

$$ \begin{align*}
	\mathbb{E}(factor \ | \ a=true)
		&= \sum_{b, c} P(b)P(c)factor(a=true,b,c) \\
		&= 0 \\ \\
	\mathbb{E}(factor \ | \ a=false)
		&= \sum_{b, c} P(b)P(c)factor(a=false,b,c) \\
		&= (.1)(.9)(- 10) \\
	& -.9
\end{align*} $$

* ...once we know both `a` and `b`

$$ \begin{align*}
	\mathbb{E}(factor \ | \ a=true \ \mbox{OR} \ b=true)
		&= 0 \\ \\
	\mathbb{E}(factor \ | \ a=false \ \mbox{AND} \ b=false)
		&= \sum_{c} P(c)factor(a=false,b=false,c) \\
		&= 0 + .9(-10) \\
	&= -9
\end{align*} $$

This is way easier to compute and doesn't double-count anything.

## Variance of expected factor

* ...once we know `a`

$$ \begin{align*}
	var(factor \ | \ a=true)
		&= \sum_{b, c} P(b)P(c)factor(a=true,b,c) \\
		&= 0 \\ \\
	var(factor \ | \ a=false)
		&= \sum_{b, c} P(b)P(c) [ factor(a=false,b,c) - \mathbb{E}(factor \ | \ a=false) ]^2 \\
		&= (1- (.1)(.9))[0 - (-.9)]^2 + (.1)(.9)[-10 - (-.9)]^2 \\
	& 8.19
\end{align*} $$

* ...once we know both `a` and `b`

$$ \begin{align*}
	\mathbb{E}(factor \ | \ a=true \ \mbox{OR} \ b=true)
		&= 0 \\ \\
	\mathbb{E}(factor \ | \ a=false \ \mbox{AND} \ b=false)
		&= \sum_{c} P(c) [ factor(a=false,b=false,c) - \mathbb{E}(factor \ | \ a=false \ \mbox{AND} \ b=false) ]^2 \\
		&= (.1)[0 - (-9)]^2 + .9[-10 - (-9)]^2 \\
	&= 9
\end{align*} $$

We can then multiply the expected factor by the inverse of this variance to get a heuristic factor that is weaker for futures with higher variance in the value of the factor.

# Simulations

First, we make a heuristic factor calculator for every type of heuristic factor. Each calculator function takes in the current state and returns the corresponding factor.

~~~
var expected_score = function(a, b) {
  if (b==null) {
    return a?-2.9528:-1.6555;
  } else {
    return a ? (b?-2.7330:-4.9303) : (b?-0.53580:-2.7330);
  }
}

var expected_future_score = function(a, b) {
  if (b==null) {
    return a?-0.6502:-1.5502;
  } else {
    return (a|b) ? -0.3251 : -9.3251 ;
  }
}

var expected_factor = function(a, b) {
  return (b == null) ? (a?0:-.9) : ((a|b)?0:-9);
}

var scale = function(mu, variance) {
  return mu / variance;
}

var weighted_expected_factor = function(a, b) {
  var mu = (b == null) ? (a?0:-.9) : ((a|b)?0:-9);
  var variance = (b == null) ? 8.19 : 9;
  return scale(mu, variance);
}


var manual_heuristic_factor = function(a, b) {
  return (b==null)? (a?0:-1) : ((a|b)?0:-1);
}
///fold:
print( "expected score" );
print( "T_: " + expected_score(true) );
print( "F_: " + expected_score(false) );
print( "TT: " + expected_score(true, true) );
print( "TF: " + expected_score(true, false) );
print( "FT: " + expected_score(false, true) );
print( "FF: " + expected_score(false, false) );

print( "expected future score" );
print( "T_: " + expected_future_score(true) );
print( "F_: " + expected_future_score(false) );
print( "TT: " + expected_future_score(true, true) );
print( "TF: " + expected_future_score(true, false) );
print( "FT: " + expected_future_score(false, true) );
print( "FF: " + expected_future_score(false, false) );

print( "expected factor" );
print( "T_: " + expected_factor(true) );
print( "F_: " + expected_factor(false) );
print( "TT: " + expected_factor(true, true) );
print( "TF: " + expected_factor(true, false) );
print( "FT: " + expected_factor(false, true) );
print( "FF: " + expected_factor(false, false) );

print( "weighted expected factor" );
print( "T_: " + weighted_expected_factor(true) );
print( "F_: " + weighted_expected_factor(false) );
print( "TT: " + weighted_expected_factor(true, true) );
print( "TF: " + weighted_expected_factor(true, false) );
print( "FT: " + weighted_expected_factor(false, true) );
print( "FF: " + weighted_expected_factor(false, false) );

print( "manual heuristic factor" );
print( "T_: " + manual_heuristic_factor(true) );
print( "F_: " + manual_heuristic_factor(false) );
print( "TT: " + manual_heuristic_factor(true, true) );
print( "TF: " + manual_heuristic_factor(true, false) );
print( "FT: " + manual_heuristic_factor(false, true) );
print( "FF: " + manual_heuristic_factor(false, false) );
///
~~~

Notice that for all but the "expected score" function, the lowest heuristic factors are for when `a` is false and when `(a|b)` is false.

~~~
///fold:
var expected_score = function(a, b) {
  if (b==null) {
    return a?-2.9528:-1.6555;
  } else {
    return a ? (b?-2.7330:-4.9303) : (b?-0.53580:-2.7330);
  }
}

var expected_future_score = function(a, b) {
  if (b==null) {
    return a?-0.6502:-1.5502;
  } else {
    return (a|b) ? -0.3251 : -9.3251 ;
  }
}

var expected_factor = function(a, b) {
  return (b == null) ? (a?0:-.9) : ((a|b)?0:-9);
}

var scale = function(mu, variance) {
  return mu / variance;
}

var weighted_expected_factor = function(a, b) {
  var mu = (b == null) ? (a?0:-.9) : ((a|b)?0:-9);
  var variance = (b == null) ? 8.19 : 9;
  return scale(mu, variance);
}


var manual_heuristic_factor = function(a, b) {
  return (b==null)? (a?0:-1) : ((a|b)?0:-1);
}
///
~~~

~~~
///fold:
var expected_score = function(a, b) {
  if (b==null) {
    return a?-2.9528:-1.6555;
  } else {
    return a ? (b?-2.7330:-4.9303) : (b?-0.53580:-2.7330);
  }
}

var expected_future_score = function(a, b) {
  if (b==null) {
    return a?-0.6502:-1.5502;
  } else {
    return (a|b) ? -0.3251 : -9.3251 ;
  }
}

var expected_factor = function(a, b) {
  return (b == null) ? (a?0:-.9) : ((a|b)?0:-9);
}

var scale = function(mu, variance) {
  return mu / variance;
}

var weighted_expected_factor = function(a, b) {
  var mu = (b == null) ? (a?0:-.9) : ((a|b)?0:-9);
  var variance = (b == null) ? 8.19 : 9;
  return scale(mu, variance);
}
var none = function(a,b) {
  return 0;
}


var manual_heuristic_factor = function(a, b) {
  return (b==null)? (a?0:-1) : ((a|b)?0:-1);
}
///

var funnybinomial = function(hf) {
  return function(){
    var a = sample(bernoulliERP, [0.1])
    factor(hf(a));
    var b = sample(bernoulliERP, [0.9])
    factor( hf(a,b) - hf(a) );
    var c = sample(bernoulliERP, [0.1])
    factor( ((a|b|c) ? 0:-10) - hf(a,b));
    return a + b + c;
  }
}

var trueERP = Enumerate(funnybinomial(none), 20);
var true_mean = expectation(trueERP);
var true_var = expectation(trueERP, function(x) {return Math.pow(x-true_mean, 2);});

var mean = function(ERP) {
  return expectation(ERP) - true_mean;
}
var variance = function(ERP) {
  var mu = expectation(ERP);
  var variance = expectation(ERP, function(x) {return Math.pow(x-mu, 2);});
  return variance - true_var;
}
var particles = function(hf, target_fn) {
  return function() {
    var sampleERP = ParticleFilter(funnybinomial(hf), 5);
    return target_fn(sampleERP);
  }
}
var n_samples = 100000;
var run = function(hf, target_fn) {
  return Math.abs(expectation(ParticleFilter(particles(hf, target_fn), n_samples)));
}
print("none, mean: " + run(none, mean));
print("expected_score, mean: " + run(expected_score, mean));
print("expected_future_score, mean: " + run(expected_future_score, mean));
print("manual_heuristic_factor, mean: " + run(manual_heuristic_factor, mean));
print("expected_factor, mean: " + run(expected_factor, mean));
print("weighted_expected_factor, mean: " + run(weighted_expected_factor, mean));
~~~