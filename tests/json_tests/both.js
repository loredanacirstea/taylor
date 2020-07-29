const ethers = require('ethers');

const tests = {
    if: [
        {
            test: '(if true 7 8)',
            result: 7,
        },
        {
            test: '(if false 7 8)',
            result: 8,
        },
        {
            test: '(if (gt 4 1) 7 8)',
            result: 7,
        },
        {
            test: '(if (lt 9 4) 7 8)',
            result: 8,
        },
        {
            test: '(if (gt 4 9) 7 8)',
            result: 8,
        },
        {
            test: '(if (gt 4 1) (add (sub 33 2) 1) (add (sub 7 2) 1))',
            result: 32,
        },
        {
            test: '(if (gt 4 9) (add (sub 33 2) 1) (add (sub 7 2) 1))',
            result: 6,
        },
    ],
    if_lambda: [
        {
            test: `(if (gt 4 1) 
                ( (fn* (a b) (add a b)) 2 3 )
                (add (sub 7 2) 1)
            )`,
            result: 5,
        },
        {
            test: `(if (gt 4 9)
                ( (fn* (a b) (add a b)) 2 3 )
                (add (sub 7 2) 1)
            )`,
            result: 6,
        },
    ],
    'empty?': [
        {
            test: '(empty? (list))',
            result: true,
        },
        {
            test: '(empty? (list 1))',
            result: false,
        },
        {
            test: '(empty? (list 0))',
            result: false,
        },
        {
            test: '(empty? (array))',
            result: true,
        },
        {
            test: '(empty? (array 1))',
            result: false,
        },
        {
            test: '(empty? (array 0))',
            result: false,
        },
    ],
    'true?': [
        {
            test: '(true? true)',
            result: true,
        },
        {
            test: '(true? false)',
            result: false,
        },
    ],
    'false?': [
        {
            test: '(false? false)',
            result: true,
        },
        {
            test: '(false? true)',
            result: false,
        },
    ],
    'nil?': [
        {
            test: '(nil? Nil)',
            result: true,
        },
        {
            test: '(nil? (list))',
            result: true,
        },
        {
            test: '(nil? (list 1))',
            result: false,
        },
        {
            test: '(nil? false)',
            result: true,
        },
        {
            test: '(nil? true)',
            result: false,
        },
        {
            test: '(nil? "0x")',
            result: true,
        },
        {
            test: '(nil? "0x22")',
            result: false,
        },
    ],
    'list?': [
        {
            test: '(list? (list))',
            result: true,
        },
        {
            test: '(list? (list 1 5))',
            result: true,
        },
        {
            test: '(list? 4)',
            result: false,
        },
    ],
    'sequential?': [
        {
            test: '(sequential? (list))',
            result: true,
        },
        {
            test: '(sequential? (array))',
            result: true,
        },
        {
            test: '(sequential? (list 1 5))',
            result: true,
        },
        {
            test: '(sequential? (array 1 5))',
            result: true,
        },
        {
            test: '(sequential? 4)',
            result: false,
        },
    ],
    list: [
        {
            test: '(list 5 4 8 3 5)',
            result: [5, 4, 8, 3, 5],
        },
        {
            test: '(list 5 4 (add 6 5) 3 (sub 6 1))',
            result: [5, 4, 11, 3, 5],
        }
    ],
    first: [
        {
            test: '(first (list 5 3 7))',
            result: 5,
        },
        {
            test: '(first (array 5 3 7))',
            result: 5,
        },
        {
            test: '(first (array (array 0 1)) )',
            result: [0, 1],
        },
    ],
    nth: [
        {
            test: '(nth (list 5 3 7) 2)',
            result: 7,
        },
        {
            test: '(nth (array 5 3 7) 2)',
            result: 7,
        },
        {
            test: '(nth (array (array 5 3 7) (array 8 4 2) (array 9 11 12)) 1)',
            result: [8, 4, 2],
        },
    ],
    rest: [
        {
            test: '(rest (list 5 3 7))',
            result: [3, 7],
        },
        {
            test: '(rest (array 5 3 7))',
            result: [3, 7],
        },
    ],
    'fn*': [
        {
            test: '(fn* (a) a)',
            result: '(fn* (a) a)',
            skip: true,
        },
        {
            test: '( (fn* (a) a) 7)',
            result: 7,
        },
        {
            test: '( (fn* (a) (add a 1)) 10)',
            result: 11,
        },
        {
            test: '( (fn* (a b) (add a b)) 2 3)',
            result: 5,
        },
        {
            test: '( (fn* (a b) (add a b)) (add (add (sub 7 2) 1) 41) (add 2 3))',
            result: 52,
        },
        {
            test: '( (fn* (a b) (add (mul a b ) b)) 2 3)',
            result: 9,
        },
        {
            test: `( (fn* (a b) (add a b))
                (add (add (sub 7 2) 1) 41)
                (add 2 3)
            )`,
            result: 52,
        },
    ],
    'let*': [
        {
            test: '(let* (c 2) c)',
            result: 2,
        },
        {
            test: '(let* (a 4 b (add a 2) c (mul b 3)) (sub c b))',
            result: 12,
        },
        {
            test: `(let* (c 2 a (add c 4))
                ((fn* (d e) (add d e)) a c)
            )`,
            result: 8,
        },
        {
            test: `( (fn* (d e)
                (let* (a 6) (add (add a d) e) )
            ) 2 1
            )`,
            result: 9,
        },
    ],
    let_fn: [
        {
            test: `(let* (
                    somelambda (fn* (a) (add a 1))
                )
                (somelambda 3)
            )`,
            result: 4,
        },
        {
            test: `(let* (
                somelambda (fn* (a) (add a 1))
                )
                (map somelambda (array 3 4))
            )`,
            result: [4, 5],
        },
    ],
    partial_application: [
        {
            test: `( let* (
                    somef (fn* (a) 
                        (fn* (b) (add a b))
                    )
                    somef2 (somef 4)
                )
                (somef2 9)
            )`,
            result: 13,
        },
    ],
    bytelike: [
        {
            test: '(list "0x2233" "hello" "0x44556677" "someword")',
            result: ['0x2233', 'hello', '0x44556677', 'someword'],
        },
    ],
    range: [
        {
            test: '(range 1 5 1)',
            result: [1, 2, 3, 4, 5],
        },
        {
            test: '(range 3 19 3)',
            result: [3, 6, 9, 12, 15, 18],
        },
        {
            test: '(range 89 168 20)',
            result: [89, 109, 129, 149],
        },
        {
            test: '(range 1 1 1)',
            result: [1],
        },
        {
            test: '(range 0 0 1)',
            result: [0],
        },
        {
            test: '(range 0 1 1)',
            result: [0, 1],
        },
        {
            test: '(range 5 1 -1)',
            result: [5, 4, 3, 2, 1],
            skip: true,
        },
        {
            test: `( (fn* (somearr start stop)
                (map (fn* (pos) (nth somearr pos)) (range start stop 1))
            ) (array 1 2 6 7 8 6) 2 4)`,
            result: [6, 7, 8],
        },
    ],
    add: [
        {
            test: '(add 9 3)',
            result: 12,
        },
        {
            test: '(add -9 -3)',
            result: -12,
        },
        {
            test: '(add -9 3)',
            result: -6,
        },
        {
            test: '(add 3 -9)',
            result: -6,
        },
        {
            test: '(add 9 0)',
            result: 9,
        },
        {
            test: '(add 0 0)',
            result: 0,
        },
    ],
    sub: [
        {
            test: '(sub 9 3)',
            result: 6,
        },
        {
            test: '(sub -9 -3)',
            result: -6,
        },
        {
            test: '(sub -9 3)',
            result: -12,
        },
        {
            test: '(sub 3 -9)',
            result: 12,
        },
        {
            test: '(sub 3 19)',
            result: -16,
        },
        {
            test: '(sub 0 0)',
            result: 0,
        },
    ],
    mul: [
        {
            test: '(mul 9 3)',
            result: 27,
        },
        {
            test: '(mul 9 -3)',
            result: -27,
        },
        {
            test: '(mul -9 3)',
            result: -27,
        },
        {
            test: '(mul -9 -3)',
            result: 27,
        },
        {
            test: '(mul 0 3)',
            result: 0,
        },
        {
            test: '(mul -9 0)',
            result: 0,
        },
        {
            test: '(mul 0 0)',
            result: 0,
        },
    ],
    div: [
        {
            test: '(div 9 3)',
            result: 3,
        },
        {
            test: '(div 9 -3)',
            result: -3,
        },
        {
            test: '(div -9 3)',
            result: -3,
        },
        {
            test: '(div -9 -3)',
            result: 3,
        },
        {
            test: '(div 0 3)',
            result: 0,
        },
        {
            test: '(div 0 -3)',
            result: 0,
        },
        {
            test: '(div 3 0)',
            result: 0,
            skip: true,
        },
    ],
    sdiv: [
        {
            test: '(sdiv 12 3)',
            result: 4,
            skip: true,
        },
    ],
    mod: [
        {
            test: '(mod 12 3)',
            result: 0,
        },
        {
            test: '(mod 10 3)',
            result: 1,
        },
        {
            test: '(mod 10 -4)',
            result: 2,
        },
        {
            test: '(mod -10 4)',
            result: -2,
        },
        {
            test: '(mod -10 -4)',
            result: -2,
        },
        {
            test: '(mod 0 3)',
            result: 0,
        },
        {
            test: '(mod 12 0)',
            result: 0,
            skip: true,
        },
    ],
    smod: [
        {
            test: '(smod 12 3)',
            result: 0,
            skip: true,
        },
    ],
    exp: [
        {
            test: '(exp 2 8)',
            result: 256,
        },
        {
            test: '(exp -2 8)',
            result: 256,
        },
        {
            test: '(exp -2 7)',
            result: -128,
        },
        {
            test: '(exp 2 -8)',
            result: 0,
        },
        {
            test: '(exp 2 32)',
            result: 4294967296,
            process: resp => resp.toNumber(),
        },
        {
            test: '(exp -2 33)',
            result: -8589934592,
            process: resp => resp.toNumber(),
        },
        {
            test: '(exp 2 0)',
            result: 1,
        },
        {
            test: '(exp 0 8)',
            result: 0,
        },
    ],
    not: [
        {
            test: '(not (not 12))',
            result: 12,
            skip: true,
        },
    ],
    lt: [
        {
            test: '(lt 3 7)',
            result: 1,
        },
        {
            test: '(lt 3 2)',
            result: 0,
        },
        {
            test: '(lt -3 2)',
            result: 1,
        },
        {
            test: '(lt 3 -7)',
            result: 0,
        },
    ],
    gt: [
        {
            test: '(gt 3 7)',
            result: 0,
        },
        {
            test: '(gt 3 2)',
            result: 1,
        },
        {
            test: '(gt -3 2)',
            result: 0,
        },
        {
            test: '(gt 3 -7)',
            result: 1,
        },
    ],
    slt: [
        {
            test: '(slt 3 7)',
            result: 1,
            skip: true,
        },
    ],
    sgt: [
        {
            test: '(sgt 7 7)',
            result: 0,
            skip: true,
        },
    ],
    eq: [
        {
            test: '(eq 7 7)',
            result: 1,
        },
        {
            test: '(eq -7 -7)',
            result: 1,
        },
        {
            test: '(eq -7 7)',
            result: 0,
        },
        {
            test: '(eq -4294967295 4294967295)',
            result: 0,
            skip: true,
        },
    ],
    iszero: [
        {
            test: '(iszero 4)',
            result: 0,
        },
        {
            test: '(iszero 0)',
            result: 1,
        },
        {
            test: '(iszero -4)',
            result: 0,
        },
    ],
    and: [
        {
            test: '(and (iszero 0) (gt 9 7))',
            result: 1,
        },
    ],
    or: [
        {
            test: '(or (iszero 5) (gt 9 7))',
            result: 1,
        },
    ],
    xor: [
        {
            test: '(xor (iszero 0) (gt 9 7))',
            result: 0,
        },
    ],
    byte: [
        {
            test: '(byte 2 "0x11445566")',
            result: '0x44',
            skip: true,
        },
    ],
    shl: [
        {
            test: '(shl 2 12)',
            result: 0x30,
        },
    ],
    shr: [
        {
            test: '(shr 2 12)',
            result: 3,
        },
    ],
    sar: [
        {
            test: '(sar 2 12)',
            result: 3,
            skip: true,
        },
    ],
    addmod: [
        {
            test: '(addmod 10, 5, 4)',
            result: 3,
            skip: true,
        },
    ],
    mulmod: [
        {
            test: '(mulmod 10, 5, 4)',
            result: 2,
            skip: true,
        },
    ],
    signextend: [
        {
            test: '(signextend 2 12)',
            result: 0xc,
            skip: true,
        },
    ],
    math: [
        {
            test: '(add (add 4 7) 10)',
            result: 21,
        },
        {
            test: '(div (sub (mul (add 4 7) 10) 44) 5)',
            result: Math.floor(((4 + 7) * 10 - 44) / 5 ),
        },
    ],
    keccak256: [
        {
            test: '(keccak256 2 12)',
            result: ethers.utils.keccak256(ethers.utils.arrayify('0x000000020000000c')),
        },
        {
            test: '(keccak256 "0x223344")',
            result: ethers.utils.keccak256(ethers.utils.arrayify('0x223344')),
        },
        {
            test: '(keccak256 "0x0a910004" "0x0a910004" 7)',
            result: ethers.utils.keccak256(ethers.utils.arrayify('0x0a9100040a91000400000007')),
        },
    ],
    return: [
        {
            test: '(return 44)',
            result: 44,
        },
        {
            test: '(return "0x2233")',
            result: '0x2233',
        },
        {
            test: '(return "hello")',
            result: 'hello',
        },
    ],
    map: [
        {
            test: '(map iszero (list 5 0 2))',
            result: [0, 1, 0],
        },
        {
            test: '(map iszero (array 5 0 2))',
            result: [0, 1, 0],
        },
        {
            test: '(map myfunc (list 5 8 2))',
            result: [18, 27, 9],
            prereq: ['myfunc'],
        },
        {
            test: '(map myfunc (list 5 8 2))',
            result: [18, 27, 9],
            prereq: ['myfunc'],
        },
        {
            test: `(map
                (fn* (a) (mul (add a 1) 3))
                (list 5 8 2)
            )`,
            result: [18, 27, 9],
        },
        {
            test: `(map
                (fn* (a) (mul (add a 1) 3))
                (array 5 8 2)
            )`,
            result: [18, 27, 9],
        },
        {
            test: `(let* (
                    somelambda (fn* (a) (add a 1))
                )
                (map somelambda (list 5 8 2) )
            )`,
            result: [6, 9, 3],
        },
        {
            test: `(let* (
                    somelambda (fn* (a) (mul (add a 1) 3))
                )
                (map somelambda (list 5 8 2) )
            )`,
            result: [18, 27, 9],
        },
        {
            test: `(let* (
                    somelambda (fn* (a) (mul (add a 1) 3))
                )
                (map somelambda (array 5 8 2) )
            )`,
            result: [18, 27, 9],
        },
    ],
    map_partial_application: [
        {
            test: `(let* (
                    pappliedf (fn* (a b)
                        (fn* (c) (add c (add a b)) )
                    )
                )
                (map
                    (pappliedf 4 6)
                    (list 1 2 3 4)
                )
            )`,
            result: [11, 12, 13, 14],
        },
    ],
    reduce: [
        {
            test: '(reduce add (list) 2)',
            result: 2,
        },
        {
            test: '(reduce add (list 5 8 2) 0)',
            result: 15,
        },
        {
            test: '(reduce sub (list 45 8 2) 100)',
            result: 45,
        },
        {
            test: '(reduce sub (array 45 8 2) 100)',
            result: 45,
        },
        {
            test: `(list
                (reduce add (list 5 8 2) 0)
                (reduce sub (list 45 8 2) 100)
            )`,
            result: [15, 45],
        },
        {
            test: '(myfunc2 4 5)',
            result: 9,
            prereq: ['myfunc2'],
        },
        {
            test: '(myfunc2 0 5)',
            result: 5,
            prereq: ['myfunc2'],
        },
        {
            test: '(reduce myfunc2 (list 5 8 2) 0)',
            result: 15,
            prereq: ['myfunc2'],
        },
        {
            test: '(reduce myfunc2 (array 5 8 2) 0)',
            result: 15,
            prereq: ['myfunc2'],
        },
        {
            test: `(list
                (reduce myfunc2 (list 5 8 2) 0)
                (reduce sub (list 45 8 2) 100)
            )`,
            result: [15, 45],
            prereq: ['myfunc2'],
        },
        {
            test: `(add
                (reduce sub (list 45 8 2) 100)
                (reduce myfunc2 (list 5 8 2) 0)
            )`,
            result: 60,
            prereq: ['myfunc2'],
        },
        {
            test: `(reduce
                (fn* (a b) (add a b))
                (list 5 8 2)
                0
            )`,
            result: 15,
        },
        {
            test: `(let* (
                    somelambda (fn* (a b) (add a b))
                )
                (reduce somelambda (list 5 8 2) 0)
            )`,
            result: 15,
        },
        {
            test: `(let* (
                    reduce (fn* (f xs init) (if (empty? xs) init (reduce f (rest xs) (f init (first xs)) )))
                    somelambda (fn* (a b) (add a b))
                )
                (reduce somelambda (list 5 8 2) 0)
            )`,
            result: 15,
        },
        {
            test: `(let* (
                    somelambda (fn* (a b) (add a b))
                )
                (reduce2 somelambda (list 5 8 2) 0)
            )`,
            result: 15,
            skip: true,
        },
    ],
    recursive: [
        {
            test: '(recursivefn 2)',
            result: 6,
            prereq: ['recursivefn'],
        },
        {
            test: '(fibonacci 1)',
            result: 1,
            prereq: ['fibonacci'],
        },
        {
            test: '(fibonacci 2)',
            result: 1,
            prereq: ['fibonacci'],
        },
        {
            test: '(fibonacci 8)',
            result: 21,
            prereq: ['fibonacci'],
        },
        {
            test: `(let* 
                (recursivefn 
                    (fn* (n) (if (gt n 5) n (recursivefn (add n 1)) ) )
                )
                (recursivefn 2)
            )`,
            result: 6,
        },
        {
            test: `(let* 
                (localfibo 
                    (fn* (n) (if (or (eq n 1) (eq n 2)) 1 (add(localfibo (sub n 1)) (localfibo (sub n 2)) ) ))
                )
                (localfibo 8)
            )`,
            result: 21,
        },
    ],
    apply: [
        {
            test: '(apply add 4 5)',
            result: 9,
        },
        {
            test: '(apply myfunc3 4 5 9)',
            result: 18,
            prereq: ['myfunc3'],
        },
        {
            test: '(apply (fn* (a b) (add a b)) 4 5)',
            result: 9,
        },
        {
            test: '(apply same? (array 1 1 1))',
            result: 1,
        },
        {
            test: '(apply same? (list 3 1 1))',
            result: 0,
        },
    ],
    'array?': [
        {
            test: '(array? (array 2 4))',
            result: true,
        },
        {
            test: '(array? (list 2 4))',
            result: false,
        },
    ],
    length: [
        {
            test: '(length "0x11223344556677")',
            result: 7,
        },
        {
            test: '(length (array 2 4))',
            result: 2,
        },
        {
            test: '(length (list 2 4))',
            result: 2,
        },
    ],
    'same?': [
        {
            test: '(same? (list 1 1 1))',
            result: 1,
        },
        {
            test: '(same? (list 1 0 1))',
            result: 0,
        },
    ],
    push: [
        {
            test: '(push (array 4 5 6) 20)',
            result: [4, 5, 6, 20],
        },
        {
            test: '(push (push (array 4 5 6) 20) 15)',
            result: [4, 5, 6, 20, 15],
        },
        {
            test: '(push (array (array 4 5 6) (array 7 8 9) ) (array 10 11 12))',
            result: [[4, 5, 6], [7, 8, 9], [10, 11, 12]],
        },
        {
            test: '(push (array "0x1122" "0x3344" "0x5566") "0x7788")',
            result: ['0x1122', '0x3344', '0x5566', '0x7788'],
        },
        {
            test: '(push (array) "0x7788")',
            result: ['0x7788'],
        },
        {
            test: '(push (array) 20)',
            result: [20],
        },
        {
            test: '(push (push (array) 20) 15)',
            result: [20, 15],
        },
    ],
    shift: [
        {
            test: '(shift (array 4 5 6) 20)',
            result: [20, 4, 5, 6],
        },
        {
            test: '(shift (shift (array 4 5 6) 20) 15)',
            result: [15, 20, 4, 5, 6],
        },
        {
            test: '(shift (array (array 4 5 6) (array 7 8 9) ) (array 10 11 12))',
            result: [[10, 11, 12], [4, 5, 6], [7, 8, 9]],
        },
        {
            test: '(shift (array "0x1122" "0x3344" "0x5566") "0x7788")',
            result: ['0x7788', '0x1122', '0x3344', '0x5566'],
        },
        {
            test: '(shift (array) "0x7788")',
            result: ['0x7788'],
        },
        {
            test: '(shift (array) 20)',
            result: [20],
        },
        {
            test: '(shift (shift (array) 20) 15)',
            result: [15, 20],
        },
    ],
    concat: [
        {
            test: '(concat (list 3 5) (list 9))',
            result: [3, 5, 9],
        },
        {
            test: '(concat (list "0x11aaaabb" "0x221111ccdd") (list "0xbb" "0x44"))',
            result: ['0x11aaaabb', '0x221111ccdd', '0xbb', '0x44'],
        },
    ],
    lengths: [
        {
            test: '(lengths (array 1 2 3))',
            result: [3],
        },
        {
            test: '(lengths (array (array 1 2 3) (array 1 2 3)))',
            result: [2, 3],
        },
    ],
    inverse: [
        {
            test: '(inverse (array 11 12 13) )',
            result: [13, 12, 11],
        },
    ],
    pick: [
        {
            test: '(pick (array (array 11 12 13) (array 14 15 16)) (list 1 1))',
            result: 15,
        },
    ],
    'pow-m': [
        {
            test: '(pow-m 0)',
            result: 1,
        },
        {
            test: '(pow-m 4)',
            result: 1,
        },
        {
            test: '(pow-m 3)',
            result: -1,
        },
    ],
    slicea: [
        {
            test: '(slicea (array 1 2 6 7 8 6) 2 4)',
            result: [6, 7, 8],
        },
        {
            test: '(slicea (list 1 2 6 7 8 6) 2 4)',
            result: [6, 7, 8],
        },
    ],
    nslice: [
        {
            test: `(nslice
                (list 1 2 6 7 8 6) (list 2 4)
            )`,
            result: [6, 7, 8],
        },
        {
            test: `(nslice
                (array 
                    (array 7 8 9 10 11 12)
                    (array 1 2 6 7 8 6)
                    (array 13 14 15 16 17 18)
                    (array 11 12 16 17 18 16)
                )
                (list (list 0 1) (list 2 4) )
            )`,
            result: [[9, 10, 11], [6, 7, 8]],
        },
        {
            test: `(nslice
                (array 
                    (array 
                        (array 7 8 9 10 11 12)
                        (array 1 2 6 7 8 6)
                        (array 13 14 15 16 17 18)
                        (array 11 12 16 17 18 16)
                    )
                    (array 
                        (array 27 28 29 210 211 212)
                        (array 21 22 26 27 28 26)
                        (array 213 214 215 216 217 218)
                        (array 221 222 226 227 228 226)
                    )
                    (array 
                        (array 47 48 49 410 411 412)
                        (array 41 42 46 47 48 46)
                        (array 413 414 415 416 417 418)
                        (array 441 442 446 447 448 446)
                    )
                )
                (list (list 1 2) (list 2 3) (list 2 4))
            )`,
            result: [
                [
                    [215, 216, 217],
                    [226, 227, 228],
                ],
                [
                    [415, 416, 417],
                    [446, 447, 448],
                ]
            ],
        },
    ],
    'new-array': [
        {
            test: '(new-array same? (list 2 2) )',
            result: [[1, 0], [0, 1]],
        },
        {
            test: '(new-array same? (list 3 3) )',
            result: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
        },
    ],
    transpose: [
        {
            test: '(transpose (array (array 6 1 2) (array 3 4 5)) )',
            result: [[6, 3], [1, 4], [2, 5]],
        },
    ],
    excludeMatrix: [
        {
            test: '(excludeMatrix (array (array 6 1) (array 3 4) )  1 1 )',
            result: [[6]],
        },
        {
            test: '(excludeMatrix (array (array 6 1 2) (array 3 4 5) (array 7 6 9))  1 1 )',
            result: [[6, 2], [7, 9]],
            skip: true,
        },
        {
            test: '(excludeMatrix (array (array 6 1 2) (array 3 4 5) (array 7 6 9))  2 1 )',
            result: [[6, 2], [3, 5]],
            skip: true,
        },
    ],
    prod: [
        {
            test: `(prod 
                (array (array 3 5) (array 3 4))
                (array (array 2 3) (array 3 4))
            )`,
            result: [[21, 29], [18, 25]],
            skip: true,
        },
        {
            test: `(prod 
                (array (array -3 -5) (array -3 4))
                (array (array -2 3) (array 3 4))
            )`,
            result: [[-9, -29], [18, 7]],
            skip: true,
        },
        {
            test: `(prod
                (array (array 3 5 3 5) (array 4 6 3 5) (array 3 4 3 5))
                (array (array 2 3) (array 3 4) (array 2 3) (array 3 4))
            )`,
            result: [[42, 58], [47, 65], [39, 54]],
            skip: true,
        },
        {
            test: `(prod 
                (array (array 3 5 9 2) (array 1 15 19 12) (array 2 3 4 2) ) 
                (array (array 1 1 1) (array 3 3 3) (array 2 2 2) (array 1 1 1) )
            )`,
            result: [[38, 38, 38], [96, 96, 96], [21, 21, 21]],
            skip: true,
        },
    ],
    smap: [
        {
            test: '(smap add 10 (array 1 2 3 4))',
            result: [11, 12, 13, 14],
        },
    ],
}

const prereq = [
    {
        name: 'myfunc',
        expr: '(def! myfunc (fn* (a) (mul (add a 1) 3)))'
    },
    {
        name: 'myfunc2',
        expr: '(def! myfunc2 (fn* (a b) (add a b)) )'
    },
    {
        name: 'myfunc3',
        expr: '(def! myfunc3 (fn* (a b c) (add (add a b) c) ) )'
    },
    {
        name: 'recursivefn',
        expr: '(def! recursivefn (fn* (n) (if (gt n 5) n (recursivefn (add n 1)) ) ) )'
    },
    {
        name: 'fibonacci',
        expr: '(def! fibonacci (fn* (n) (if (or (eq n 1) (eq n 2)) 1 (add(fibonacci (sub n 1)) (fibonacci (sub n 2)) ) )))',
    },
]

module.exports = { tests, prereq };
