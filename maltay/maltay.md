# MalTay

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
