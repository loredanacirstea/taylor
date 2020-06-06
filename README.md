# taylor

In-work.

Try it out: https://loredanacirstea.github.io/taylor/

Demos: https://www.youtube.com/playlist?list=PL323JufuD9JAgnda2E8mGn_GDcD5ef4mH

Examples to try out: (!only one line at a time)

```
(add (add (sub 7 2) 1) 41)
(list 5 4 (add 6 2) 3 (sub 6 1))
(if (gt 4 9) ((fn* (a b) (add a b)) 2 3) (add (sub 7 2) 1))

# define and use lambdas in-memory
( (fn* (a b) (add (mul a b ) b)) 2 3)

# define and store functions on-chain
(def! myfunction (fn* (a b) (add (add (sub a b) a) b)))

# use a stored function; notice the _
(_myfunction 5 3)

(concat 0x"11aaaabb" 0x"221111ccdd")
(contig 2 0x"221111ccdd")

(def! fib (fn* (n) (if (or (eq n 1) (eq n 2)) 1 (add(_fib (sub n 1)) (_fib (sub n 2)) ) )))

# higher order functions
(map _fib (list 5 8 2))
```

