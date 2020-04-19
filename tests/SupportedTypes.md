# dTypes

## Base

### uint

Store def:
```
0xfffffffe00000009444444440000000003000000000000001b333333380000000033333335000000020001333333340000000102

00000009 - length
44444444 - sig
00000000 - size empty
03       - steps count

00000000 - inputs length

0000001b - steps length
33333338 - byte1 sig
00000000 - input indexes length
33333335 - contig
00000002 - input indexes length
00       - count/size
01       - byte1() result
33333334 - identity
00000001
02       - contig result
```

Instantiate:

- `u32`:
```
0xffffffff4444444400000001000000040000000400000004

44444444 - u sig
00000001 - starts length
00000004
00000004 - inputs length
00000004 - size
```
- `u256`: `0xffffffff4444444400000001000000040000000400000020`

## Composed

### Array

Store def:
```
0xfffffffe00000009111111110000000003000000000000001e333333370000000200013333333500000002020333333334000000020204

00000009 - length
11111111 - sig
00000000 - size empty
03       - steps count

00000000 - inputs

0000001e
33333337 - dtnew (sig)
00000002 - input indexes length
00       - component type_id
01       - component size (optional - can be 0, if type is stored)
33333335 - contig
00000002 - input indexes length
02       - array length
03       - new() result
33333334 - identity
00000002
02       - array length
04       - contig result
```

Instantiate: (e.g. `u32array4`)
```
0xffffffff111111110000000300000004000000080000000c0000000c444444440000000400000004

11111111 - array sig
00000003 - starts length
00000004
00000008
0000000c
0000000c - inputs length
44444444 - sig u
00000004 - u32 size
00000004 - array length
```

If component type is already stored with a size, e.g. `11111118` is `u32`
Store def:
```
0xfffffffe0000000911111118000000000300000000000000213333333700000001003333333500000002010233333334000000020103

00000009 - length
11111118 - sig
00000000 - size empty
03       - steps count

00000000 - inputs

00000021
33333337 - dtnew (sig)
00000001 - input indexes length
00       - component type_id
33333335 - contig
00000002 - input indexes length
01       - count/size
02       - new() result
33333334 - identity
00000002
01
03
```

Instantiate: (e.g. `u32array4`)
```
0xffffffff11111118000000020000000400000008000000084444444400000004

11111118 - array sig
00000002 - starts length
00000004
00000008
00000008 - inputs length
44444444 - sig u32
00000004 - size
```

### Static Array[]

E.g. `[[1, 2, 3], [4, 5, 6]]` - `uint32[3]2]`

component_type_id: u32, component_size: u32, lengths: u32[]

[[[1,1],[2,2]],[[4,4],[3,2]]]

- array uint32 [3]
- contig(lengths.count, array uint32 [3])  `uint32[2][2][2]`  uint32[8]

- map, reduce
- testing

TODO: mapping sigT => (sigTa, size) - or any other combination
32array4 - sig -> can be used in maps
1) the above approach
2) array length, item size

Store def:
```
0xfffffffe00000009222222220000000004000000100000000200000004000000080000000833333333000000010000002533333337000000020001333333310302043333333500000002060533333334000000020207

00000009 - length
22222222 - sig
00000000 - size empty
04       - steps count

00000010 - inputs
00000002 - starts
00000004
00000008
00000008 - inputs
33333333 - prod function
00000001 - initial reduce value

00000025
33333337 - dtnew (sig)
00000002 - input indexes length
00       - component type_id
01       - component size (optional - can be 0, if type is stored)
33333331 - reduce
03       - prod signature
02       - array lengths
04       - initial reduce value
33333335 - contig
00000002 - input indexes length
06       - reduced size
05       - new() result
33333334 - identity
00000002
02       - array lengths
07       - contig result
```

Instantiate: (e.g. `u32array4`)
```
0xffffffff22222222

444444440000000400000002000000020000000300000001


0xffffffff111111110000000300000004000000080000000c0000000c444444440000000400000004

22222222 - array sig
00000004 - starts length
00000004
00000008
0000000c
0000000c - inputs length
44444444 - sig u
00000004 - u32 size
00000002 - array lengths
00000002
00000003
00000001 - initial reduce value
```

## Union Type

Store def: `0xfffffffe0000000966666666000000000100000000000000093333333400000001ff`

```
00000009 - length
66666666 - sig
00000000 - size empty
01       - steps count

00000000 - inputs

00000009
33333334 - identity
00000001
ff       - selector value - e.g. 00000002
```

Instantiate call:  `0xffffffff666666660000000500000004000000080000000c0000001000000014000000140000000255555555888888887777777744444444`

```
66666666
00000005  - starts length
00000004  - length for selector
00000008  - tuple elem 1
0000000c
00000010
00000014

00000014 - inputs length
00000002 - selector value
55555555 - tuple:
88888888
77777777
44444444
```
