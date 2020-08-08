# Taylor Encoding

## Version 2.0 (next)


```
xxxxxxxxxxxxxxxxxxxxxxxxxx xxxxxx      xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx    typeid(26), arity(6), id/length(32)

xxxx xxxxxxxxxxxxxxxxxxxxxx xxxxxx     xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx    root_kid_id(4), 

0000 xxx xxxxxxxxxxxxxxxxxxx xxxxxx    xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx    special(4), type(3) ..
0000 000 0000000000000000000 000000    00000000000000000000000000000000                nil/nothing(3)
0000 001 0000000000000000000 000000    00000000000000000000000000000000                any(3)
0000 010 xxxxxxxxxxxxxxxxxxx xxxxxx    xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx                variable/unknown(3), (19), index(6) + (?)

0001 xx xxxxxxxx  xxxxxxxxxxxxxxxx     xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx    number(4), reality(2), rationality(3), sign(3), (2) + size(16) + 0 (?)
0001 01 xxxxxxxx  xxxxxxxxxxxxxxxx     xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx               complex/composite(2)
       1 xxxxxxxxxxxx xxxxxxxxxxxx     xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx                complex
         xxxxxxxxxxxx
         xx float/bigfloat/int/bigint  xxxxxxxxxx length (2047)
0001 10 xxxxxxxx  xxxxxxxxxxxxxxxx     xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx               real(2)
0001 10 001 xxxxx xxxxxxxxxxxxxxxx     xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx               real(2), rational(3)
           x xxxxxxxxxx x xxxxxxxxxx                                                                      1,10 1,10    numerator // denumerator
             1,10 big/int length (2047)                                                                   1,10 1,10    num // den
0001 01 010 xxxxx xxxxxxxxxxxxxxxx     xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx               real(2), abstract-irrational(3)
0001 01 010 001 xx xxxxxxxxxxxxxxxx    xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx               real(2), abstract-irrational(3), irrational(3)

0001 01 011 xxxxx xxxxxxxxxxxxxxxx     xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx               real(2), abstract-float(3)
0001 01 011 001 xx xxxxxxxxxxxxxxxx    xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx               real(2), abstract-float(3), float(3)
                                        significand::UInt64
                                        exponent::Int32
                                        denormal::Int32
0001 01 011 010 xx xxxxxxxxxxxxxxxx     xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx               real(2), abstract-float(3), bigfloat(3)
                                        precision::Clong
                                        sign::Cint
                                        exp::Clong
                                        d::Ptr{Limb}
                                        _d::String # Julia gc handle for memory @ d (optimized)
0001 10 100 xxxxx xxxxxxxxxxxxxxxx     xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx                real(2), integer(3)
0001 10 100 001 xx xxxxxxxxxxxxxxxx    xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx                real(2), integer(3), bool(3)
0001 10 100 001 xx 0000000000000000    xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx                real(2), integer(3), bool(3) - false
0001 10 100 001 xx 0000000000000001    xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx                real(2), integer(3), bool(3) - true

0001 10 100 010 xx xxxxxxxxxxxxxxxx    xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx                real(2), integer(3), signed(3)
0001 10 100 010 01 xxxxxxxxxxxxxxxx    xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx                real(2), integer(3), signed(3), bigint(2)
                                       - followed by Int32 value of exponent that contains the sign
                                       - followed by "length" number of UInt32 values
0001 10 100 010 10 xxxxxxxxxxxxxxxx    xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx                real(2), integer(3), signed(3), int(2)

0001 10 100 011 xx xxxxxxxxxxxxxxxx    xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx                real(2), integer(3), unsigned(3)
0001 10 100 011 01 xxxxxxxxxxxxxxxx    xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx                real(2), integer(3), unsigned(3), biguint(2)
0001 10 100 011 10 xxxxxxxxxxxxxxxx    xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx                real(2), integer(3), unsigned(3), uint(2)

0010 x xxxx xxxxxxxxxxxxxxxxx xxxxxx   xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx    list-like(4), homogeneous / heterogeneous(1), type(4) ; set, tree
0010 0 0010 xxxxxxxxxxxxxxxxx xxxxxx   xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx                  homog(1), array id(4), (23), length(32) 
0010 1 0001 xxxxxxxxxxxxxxxxx xxxxxx   xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx                  heterog(1), list id(4), (17), arity(6), id(32)
0010 1 0011 xxxxxxxxxxxxxxxxx xxxxxx   xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx                  heterog(1), struct id(4) (17), arity(6), id(32)

0011 1 xxx xxxxxxxxxxxxxxxxxx xxxxxx   xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx   function(4), mutability(1), type(3), (4), body_length(14), arity(6), id(32)
0011 0 001 xxxx xxxxxxxxxxxxxx xxxxxx  xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx                pure(1), taylor(3), (4), body_length(14), arity(6), id(32)
0011 0 010 xxxx xxxxxxxxxxxxxx xxxxxx  xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx                pure(1), taylor_lambda(3), (4), body_length(14), arity(6), id(32)
0011 0 011 xxxx xxxxxxxxxxxxxx xxxxxx  xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx                pure(1), untyped(3), (4), body_length(14), arity(6), id(32)
0011 0 100 xxxx xxxxxxxxxxxxxx xxxxxx  xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx                pure(1), evm_untyped(3), (4), body_length(14), arity(6), 4b signature
0011 0 101 xxxx xxxxxxxxxxxxxx xxxxxx  xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx                pure(1), solidity(3), (4), body_length(14), arity(6), 4b signature

0011 1 xxx xxxx xxxxxxxxxxxxxx xxxxxx  xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx                mutable(1) ... etc.

0100 xx xxxxxxxxxxxxxxxxxxxxxxxxxx     xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx   byte-like(4), type(2), encoding(26), length(32)
0100 01 xxxxxxxxxxxxxxxxxxxxxxxxxx     xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx                 bytes(2),              length(32)
0100 10 xxxxxxxxxxxxxxxxxxxxxxxxxx     xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx                 string(2), encoding(26), length(32)

0101 xx xxxxxxxxxxxxxxxxxxxx xxxxxx    xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx   choice-like(4), type(2), (20), arity(6) + id(32)
0101 01 xxxxxxxxxxxxxxxxxxxx xxxxxx    xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx                   enum(2), (20), arity(6) + id(32)
0101 10 xxxxxxxxxxxxxxxxxxxx xxxxxx    xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx                   union(2), (20), arity(6) + id(32)

0111 xxxxxxxxxxxxxxxxxxxxxxxxxxxx      xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx   mapping(4), (28), id(32)
1000 xxxxxxxxxxxxxxxxxxxxxxxxxxxx      xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx   other type systems

```

## Version 1.0

```

xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
1 xxxx xxxxxxxxxxxxxxxxxxxxxxxxxx x      1,4,26,1     function, arity (31), id (134,217,727), mutability
01 xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx        2,30         array, length (2,147,483,647)
001 xxxx xxxxxxxxxxxxxxxxxxxxxxxxx       3,4,24,1     struct, arity (31), id (33,554,431)
0001 xxxx xxxxxxxxxxxxxxxxxxxxxxxx       4,4,24       list-like, type, length (33,554,431)
00001 xx xxx xxx xxxx xxxxxxxxxxxxxxx    5,2,3,3,3,16 number,reality,rationality,sign,length (131,071)
00001 00 xxxxxxxxxxxxxxxxxxxxxxxxx       5,2,25       complex/composite
         1 xxxxxxxxxxxx xxxxxxxxxxxx     complex
           xxxxxxxxxxxx
           xx float/bigfloat/int/bigint xxxxxxxxxx length (2047)
00001 00 xxx xxxxxxxxxxxxxxxxxxxxxx      5,2,25       complex/composite
00001 01 xxx xxxxxxxxxxxxxxxxxxxxxx      5,2,3,22     real
00001 01 001 xxxxxxxxxxxxxxxxxxxxxx      5,2,3,22     real.rational
             x xxxxxxxxxx x xxxxxxxxxx   1,10 1,10    numerator // denumerator
             1,10 big/int length (2047)  1,10 1,10    num // den
00001 01 010 xxxxxxxxxxxxxxxxxxxxxx      5,2,3,22     real.A-irrational
00001 01 010 001 xxxxxxxxxxxxxxxxxxx     5,2,3,3,19   real.A-irrational.irrational
00001 01 011 xxxxxxxxxxxxxxxxxxxxxx      5,2,3,22     real.A-float
00001 01 011 001 xxxxxxxxxxxxxxxxxxx     5,2,3,3,19   real.A-float.float
                                            significand::UInt64
                                            exponent::Int32
                                            denormal::Int32
00001 01 011 010 xxxxxxxxxxxxxxxxxxx     5,2,3,3,19   real.A-float.bigfloat
precision::Clong
    sign::Cint
    exp::Clong
    d::Ptr{Limb}
    _d::String # Julia gc handle for memory @ d (optimized)
    
00001 01 100 xxxxxxxxxxxxxxxxxxxxxx      5,2,3,22     real.integer
00001 01 100 001 xxxxxxxxxxxxxxxxxxx     5,2,3,3,19   real.integer.bool
00001 01 100 001 00000000000 00000000    5,2,3,3,11,8 real.integer.bool.false
00001 01 100 001 00000000000 00000001    5,2,3,3,11,8 real.integer.bool.true
00001 01 100 010 xxxxxxxxxxxxxxxxxxx     5,2,3,22     real.integer.signed
00001 01 100 010 001 xxxxxxxxxxxxxxxx    5,2,3,3,3,16 real.integer.signed.bigint, length (131,071)
                                          - followed by Int32 value of exponent that contains the sign
                                          - followed by "length" number of UInt32 values
00001 01 100 010 011 xxxxxxxxxxxxxxxx    5,2,3,3,3,16 real.integer.signed.int, length (131,071)
00001 01 100 011 xxxxxxxxxxxxxxxxxxx     5,2,3,22     real.integer.unsigned
00001 01 100 011 001 xxxxxxxxxxxxxxxx    5,2,3,3,3,16 real.integer.unsigned.biguint, length (131,071)
00001 01 100 011 011 xxxxxxxxxxxxxxxx    5,2,3,3,3,16 real.integer.unsigned.uint, length (131,071)


000001 xxxxxxxxxx xxxxxxxxxxxxxxxx       6,10,16      byte-like, encoding (2,047), length (131,071)
0000001 x xxxxxxxxxxxxxxxxxxxxxxxx       7,1,24       enum/union, id (33,554,431)
0000001 0 xxxxxxxxxxxxxxxxxxxxxxxx       7,1,24       enum, id (33,554,431)
0000001 1 xxxxxxxxxxxxxxxxxxxxxxxx       7,1,24       union, id (33,554,431)
00000001 xxxxxxxxxxxxxxxxxxxxxxxx        8,24         variable, id (33,554,431)

00000000000000000000000000000001         32           any
00000000000000000000000000000000         32           nothing/nil/null


precision(::Type{Float16}) = 11
precision(::Type{Float32}) = 24
precision(::Type{Float64}) = 53


Number                           x  
    Complex                      x  
    Real                         x  
        AbstractFloat            s
            BigFloat             s
            Float                s
        AbstractIrrational       s
            Irrational           s
        Integer                  x
            Bool                 u
            Signed               s
                BigInt           s
                Int              s
            Unsigned             u
                BigUint          u
                UInt             u
        Rational                 s  

```


## Outdated

Type encoding (base 2).

function: `1 000 00000000000000000000000000 0 0`
- typeid: bit1
- arity: bit3
- id: bit25
- payable: bit1
- mutability: bit1

array   : `01 000000000000000000000000000000`
- typeid: bit2
- length: bit30

struct  : `001 0000 000000000000000000000000 0`
- typeid: bit3
- arity: bit4
- id: bit24
- exists in storage or not: bit1 -> if yes, signature follows

list    : `0001 0000 000000000000000000000000`
- typeid: bit4
- list type: bit4 (vector..?)
- size: bit24

number  : `00001 00000000000 0000000000000000`
- typeid: bit5
- subtypeid: bit11
  - bit2 - complex/real
  - bit3
  - bit3
  - bit3
- size: bit16

```
Number
    Complex
    Real
        AbstractFloat
            BigFloat
            Float
        AbstractIrrational
            Irrational
        Integer
            Bool
            Signed
                BigInt
                Int
            Unsigned
                BigUint
                UInt
        Rational
```

