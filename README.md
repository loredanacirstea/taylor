# taylor

In-work.

Try it out: https://loredanacirstea.github.io/taylor/

Demos: https://www.youtube.com/playlist?list=PL323JufuD9JAgnda2E8mGn_GDcD5ef4mH

Examples to try out: (!only one line at a time)

```lisp
(add (add (sub 7 2) 1) 41)
(list 5 4 (add 6 2) 3 (sub 6 1))
(if (gt 4 9) ((fn* (a b) (add a b)) 2 3) (add (sub 7 2) 1))

# define and use lambdas in-memory
( (fn* (a b) (add (mul a b ) b)) 2 3)

# define and store functions on-chain
(def! myfunction (fn* (a b) (add (add (sub a b) a) b)))

# use a stored function; notice the _
(_myfunction 5 3)

(concat "0x11aaaabb" "0x221111ccdd")
(contig 2 "0x221111ccdd")

(def! fib (fn* (n) (if (or (eq n 1) (eq n 2)) 1 (add(_fib (sub n 1)) (_fib (sub n 2)) ) )))

# higher order functions
(map _fib (list 5 8 2))
```

## Ballot 

Implementing Solidity's Ballot contract from https://solidity.readthedocs.io/en/v0.6.10/solidity-by-example.html#voting. See https://github.com/loredanacirstea/taylor/blob/ff253038d8b83f48b4d897f3b6b455924ef848a2/tests/maltay.test.js#L1159 for ver. 0.0.2.


