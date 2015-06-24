---
layout: hidden
---

# Exercise 1: Exploring Expected Score

* table of contents
{:toc}

## Exercise 1.1: What do ERPs look like?

### 1.1.1 Finite-support ERPs

View the support and scores directly for some ERPs with finite supports.

~~~
///fold:
var view = function(ERP, params) {
  var support = ERP.support(params);
  var score = map(function(x) {return ERP.score(params, x);}, support);
  return [
    support,
    score
  ];
};

///
var binomial = function(){
  var a = sample(bernoulliERP, [0.5])
  var b = sample(bernoulliERP, [0.5])
  var c = sample(bernoulliERP, [0.5])
  return a + b + c};

var binomialERP = Enumerate(binomial);

var funnybinomial = function(){
  var a = sample(bernoulliERP, [0.5])
  var b = sample(bernoulliERP, [0.5])
  var c = sample(bernoulliERP, [0.5])
  factor( (a|b) ? 0 : -2)
  return a + b + c};

var funnybinomialERP = Enumerate(funnybinomial);

print(view(bernoulliERP, [0.5]));
print(view(randomIntegerERP, [2]));
print(view(binomialERP, []));
print(view(funnybinomialERP, []));
~~~

### 1.1.2 Infinite-support ERPs

a) View the scores of some ERPs with infinite supports for some values in the support.

~~~
///fold:
var view = function(ERP, params, xs) {
  if (ERP.support) {
    var support = ERP.support(params);
    var score = map(function(x) {return ERP.score(params, x);}, support);
    return [
      support,
      score
    ];
  } else {
    return [
      xs,
      map(function(x) {return ERP.score(params, x);}, xs)
    ]
  }
};

///
print(view(gaussianERP, [0, 1], [-1, -.5, 0, .5, 1, 0]));
print(view(uniformERP, [-1, 1], [-1, -.5, 0, .5, 1, 0]));
print(view(gammaERP, [10, 1], [ 0.2, 0.4, 0.6, 0.8 ]));
print(view(betaERP, [10, 1], [ 0.2, 0.4, 0.6, 0.8 ]));
~~~

b) When you run a particle filter on a function with calls to an ERP with infinite support, you'll still only have a finite support in the output (with as many elements in the support as the number of particles). Show an example of this.

~~~
///fold:
var view = function(ERP, params, xs) {
  if (ERP.support) {
    var support = ERP.support(params);
    var score = map(function(x) {return ERP.score(params, x);}, support);
    return [
      support,
      score
    ];
  } else {
    return [
      xs,
      map(function(x) {return ERP.score(params, x);}, xs)
    ]
  }
};

///
var twogaussians = function() {
  var a = sample(gaussianERP, [0, 1]);
  var b = sample(gaussianERP, [0, 1]);
  return a * b;
}

var twogaussiansERP = ParticleFilter(twogaussians, 10);

print(view(twogaussiansERP));
~~~

### Exercise 1.2: Programs without factors

Let $$T$$ be the random variable representing the past of the program (the random choices made so far). Let $$t$$ be the particular values assigned to the random variable $$T$$ in the program execution so far. Similarly, let $$C$$ be a random variable representing future choices in the continuation and $$c$$ be a particular set of values for those future choices. Let $$\mathscr{C}$$ be the set of possible values of $$C$$.

$$ \begin{align*}
  \mathbb{E}_{C}( score )
    &= \lambda \ t \ . \sum_{c \in \mathscr{C}} P(C = c \ | \ T = t) \ \log ( P ( T = t, \ C = c ) )
\end{align*} $$

When there is no past (at the beginning of the program), this is the same as the negative of the joint entropy of all the random choices in the progam.

$$ \begin{align*}
  \mathbb{E}_{C}( score )
    &= \sum_{c \in \mathscr{C}} P(C = c) \ \log ( P ( C = c ) ) = -H(C)
\end{align*} $$

When there *is* a past, we can still rewrite in terms of entropy. (I'm not sure whether that's a useful idea, though...)

$$ \begin{align*}
  \mathbb{E}_{C}( score )
    &= \lambda \ t \ . \sum_{c \in \mathscr{C}}
      P(C = c \ | \ T = t) \ \log ( P ( T = t, \ C = c ) ) \\
    &= \lambda \ t \ . \sum_{c \in \mathscr{C}}
      P(C = c \ | \ T = t) \ \log ( P(C = c \ | \ T = t) P ( T = t ) ) \\
    &= \lambda \ t \ .
      \sum_{c \in \mathscr{C}}
      P(C = c \ | \ T = t) \ \log ( P(C = c \ | \ T = t) ) +
      \sum_{c \in \mathscr{C}}
      P(C = c \ | \ T = t) \ \log ( P ( T = t ) ) \\
    &= \lambda \ t \ .
      H(C \ | \ T = t) +
      \log ( P ( T = t ) ) \sum_{c \in \mathscr{C}}
      P(C = c \ | \ T = t) \\
    &= \lambda \ t \ . H(C \ | \ T = t) + \log ( P ( T = t ) ) \\
    &= \lambda \ t \ . H(C \ | \ T = t) + score(t)
\end{align*} $$

#### 1.2.1 binomial

~~~
var binomial_traces = function(){
  var a = sample(bernoulliERP, [0.5])
  var b = sample(bernoulliERP, [0.5])
  var c = sample(bernoulliERP, [0.5])
  return [a, b, c]};
var binomial_tracesERP = Enumerate(binomial_traces);

var support = binomial_tracesERP.support();
var score = map(function(x) {return binomial_tracesERP.score([], x);}, support);
var probabilities = map(function(x) {return Math.exp(x)}, score);

//probability of a particular trace multiplied by the log of the probability of that trace.
var expected_score = sum(map2(function(a, b) {return a*b}, probabilities, score));
expected_score;
~~~

#### medical generative model

~~~
var lungcancer = flip(0.01);
var cold = flip(0.2);
var cough = or(cold, lungcancer);
~~~

<!-- (define lung-cancer (flip 0.01))
(define cold (flip 0.2))

(define cough (or cold lung-cancer))

cough -->

#### another

<!-- (define A (flip))
(define B (flip (if A 0.3 0.7)))
(list A B) -->

#### with recursion

<!-- (define (geometric p)
  (if (flip p)
      0
      (+ 1 (geometric p))))

(hist (repeat 1000 (lambda () (geometric 0.6))) "Geometric of 0.6") -->

#### tug-o-war

<!-- (define strength (mem (lambda (person) (gaussian 0 1))))

(define lazy (lambda (person) (flip 0.25)))

(define (pulling person)
  (if (lazy person) (/ (strength person) 2) (strength person)))

(define (total-pulling team)
  (sum (map pulling team)))

(define (winner team1 team2) (if (< (total-pulling team1) (total-pulling team2)) team2 team1))

(list "Tournament results:"
      (winner '(alice bob) '(sue tom))
      (winner '(alice bob) '(sue tom))
      (winner '(alice sue) '(bob tom))
      (winner '(alice sue) '(bob tom))
      (winner '(alice tom) '(bob sue))
      (winner '(alice tom) '(bob sue))) -->

#### physics?

<!-- $$ \begin{align*}
  \mathbb{E}_{Futures}( score )
    %&= \lambda \ past \ . \sum_{future \in Futures} P(Future = future \ | \ Past = past) \ score \left( Past = past \ and \ Future = future \right) \\
    &= \lambda \ past \ . \sum_{future \in Futures} P(Future = future \ | \ Past = past) \ \log ( P ( Past = past, \ Future = future ) )
\end{align*} $$

When there is no past (at the beginning of the program), this is the same as the negative of the joint entropy of all the random choices in the progam.

$$ \begin{align*}
  \mathbb{E}_{futures}( score )
    %&= \lambda \ past \ . \sum_{futures} P(future \ | \ past) \ score \left( past \ and \ future \right) \\
    &= \sum_{futures} P(future) \ \log ( P (future ) ) 
    = - H(future)
\end{align*} $$

When there *is* a past, we can still rewrite in terms of entropy. (I'm not sure whether that's a useful idea, though...)

$$ \begin{align*}
  \mathbb{E}_{Futures}( score )
    %&= \lambda \ past \ . \sum_{future \in Futures} P(Future = future \ | \ Past = past) \ score \left( Past = past \ and \ Future = future \right) \\
    &= \lambda \ past \ . \sum_{future \in Futures} P(Future = future \ | \ Past = past) \ \log ( P ( Past = past, \ Future = future ) )
\end{align*} $$ -->



<!-- #### 1.2.1 Expected score

Show that the expected score *a priori* is the negative entropy.

$$ \begin{align*}
  \mathbb{E}_{all \ choices}( score )
    &= \sum_{choices \ X_1, ..., X_n} P(X_1, ..., X_n) \ score \left( X_1, ..., X_n \right) \\
    &= \sum_{choices \ X_1, ..., X_n} P(X_1, ..., X_n) \log \left( P(X_1, ..., X_n) \right) \\
    &= -H(X_1, ..., X_n)
\end{align*} $$

#### 1.2.2 Expected score at a particular timestep

$$ \begin{align*}
  \mathbb{E}_{future \ choices}( score )
    &= \sum_{choices \ X_{k+1}, ..., X_n}
       P(X_{k+1}, ..., X_n \ | \ X_1, ..., X_k )
       \log \left( P(X_1, ..., X_n) \right) \\
    &= 
\end{align*} $$ -->

<script src='https://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML'></script>