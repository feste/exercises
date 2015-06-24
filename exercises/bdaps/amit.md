---
layout: hidden
title: 2015.06.18 Amit's conformity experiment
---

Amit's research: what is conformity?

* negative pictures of people doing things
	1. rated by "intensity"
	2. see "group rating" (higher, lower, or same)
	3. re-rate
* results:
	- overall, people want to feel less negative emotions than the group.
		- people conform more when ratings are lower.
		- when we show them an identical rating, they adjust down.
	- the *average* is conformity, but
		- some people conform,
		- other people keep their same opinions,
		- others anti-conform.
		- how can you tell whether someone is screwing up or anti-conforming?
* questions:
	- test-retest reliability? (no control condition)
	- neutral pictures have no difference

~~~
var randomRating = function() {
  return randomInteger(8) + 1;
}

data = {
  "subject0": {
    "item0": {
      "r1": 6,
      "g": 6
    },
    "item1": {
      "r1": 6,
      "g": 9
    }
  },
  "subject1": {
    "item0": {
      "r1": 6,
      "g": 3
    },
    "item1": {
      "r1": 6,
      "g": 3
    }
  }
}

var model = function(subject, item) {
  var r1 = data[subject][item].r1;
  var g = data[subject][item].g;

  //subject-wise degree of conformity
  var w = uniform(0,1);

  //subject-wise direction of conformity
  var c = flip(0.5) ? 1 : -1;

  //subject's response for this item
  var phi = uniform(0,1); //subject's probability of guessing for this item

  //linear combination of subject's previous response and "group response"
  var underlying_r2 = w*r1 + (1-w)*g*c;

  //subject's second response for this item
  var r2 = flip(phi) ? randomRating() : binomial(underlying_r2/7, 7);

  return [w, c, phi, r2];
}

var subjects = ["subject0", "subject1"];
var items = ["item0", "item1"];

[].concat.apply([], map(function(subj) {
  map(function(item) {
    return model(subj, item);
  }, items);
}, subjects));
~~~

Discussion

* maybe: binomial is gaussian in the limit: e.g. for rating of 6, you would have p=6/8.
* how do we introduce uncertainty on a likert scale? - surely someone has done this!
* should there be an error parameter in the model?