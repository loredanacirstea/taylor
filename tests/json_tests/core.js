const tests = {
    if: [
        {
            test: '(if 1 (add_ 1 3) 6)',
            result: 4,
        },
        {
            test: '(if 0 (add_ 1 3) 6)',
            result: 6,
        },
        {
            test: '(if (eq_ 7 7) (add_ 1 3) 6)',
            result: 4,
        },
        {
            test: '(if (eq_ 7 9) (add_ 1 3) 6)',
            result: 6,
        },
    ],
    t2_ptr_: [
        {
            test: '(t2_ptr_ "0x112233")',
            // result: 1459,
            result: true,
            decode: ['uint'],
            process: resp => resp > 400,
        },
    ],
    t2_len_: [
        {
            test: '(t2_len_ "0x112233")',
            result: 3,
            decode: ['uint'],
        },
    ],
    clone__: [
        {
            test: '(return# (clone__ (t2_ptr_ "0x112233445566778899") 5))',
            result: "0x1122334455",
            decode: null,
        },
    ],
    bytelike: [
        {
            test: '(return# "0x2ed0c03fade6398d546adc5d9250df997c801ed12ed0c03fade6398d546adc5d9250df997c801ed1")',
            result: "0x2ed0c03fade6398d546adc5d9250df997c801ed12ed0c03fade6398d546adc5d9250df997c801ed1".toLowerCase(),
            process: res => res.toString(16).toLowerCase(),
            decode: null,
        },
    ],
    join__: [
        {
            test: '(return# (join__ "0x2ed0c03fade6398d546adc5d9250df997c801ed12ed0c03fade6398d546adc5d9250df997c801ed1" "0x2ed0c03fade6398d546adc5d9250df997c801ed12ed0c03fade6398d546adc5d9250df997c801ed1"))',
            result: "0x2ed0c03fade6398d546adc5d9250df997c801ed12ed0c03fade6398d546adc5d9250df997c801ed12ed0c03fade6398d546adc5d9250df997c801ed12ed0c03fade6398d546adc5d9250df997c801ed1",
        },
        {
            test: '(return# (join__ "0x4455" "0x6677"))',
            result: "0x44556677",
        },
        {
            test: '(return# (join__ "hello" "yello"))',
            result: "helloyello",
            decode: ['string'],
        },
        {
            test: '(return# (join__ "0x2ed0c03fade6398d546ed10000" "0x801ed12ed0c03fade6398d546adc00000000000000"))',
            result: '0x2ed0c03fade6398d546ed10000801ed12ed0c03fade6398d546adc00000000000000',
            decode: null,
        }
    ],
    t3___: [
        {
            test: '(return___# (tuple___ 4 5 9))',
            result: [4, 5, 9],
            decode: 'tuple',
        },
    ],
    t3_arity_: [
        {
            test: '(t3_arity_ (tuple___ 12 3 7))',
            result: 3,
            decode: ['uint'],
        },
        {
            test: '(t3_arity_ (tuple___ ))',
            result: 0,
            decode: ['uint'],
        },
    ],
    nth_: [
        {
            test: '(nth_ (tuple___ 4 5 9) 1)',
            result: 5,
            decode: ['uint'],
        },
        {
            test: '(return# (nth_ (tuple___ "0x1122334455" "0x667788") 0))',
            result: "0x1122334455",
            decode: null,
        },
        {
            test: `(return# (nth_
                (nth_
                    (tuple___ 100 4 (tuple___ "0x112233445566" "hello" 5) 16)
                    2
                ) 1
            ))`,
            result: "hello",
            decode: ['string'],
        },
        {
            test: '(nth_ (tuple___ ) 0)',
            result: null,
            decode: ['uint'],
            skip: true,
        },
    ],
    rest___: [
        {
            test: '(return___# (rest___ (tuple___ 21 3 4 99)))',
            result: [3, 4, 99],
            decode: 'tuple',
        },
        {
            test: '(return___# (rest___ (tuple___ )) )',
            result: [],
            decode: 'tuple',
        },
        {
            test: `(return___# (nth_ (rest___
                (tuple___ (tuple___ 97 122) (tuple___ 33) (tuple___ 63))
            ) 0))`,
            result: [33],
            decode: 'tuple',
        },
    ],
    join___: [
        {
            test: '(return___# (join___  (tuple___ 2 3) (tuple___ 4 5 6)))',
            result: [2, 3, 4, 5, 6],
            decode: 'tuple',
        },
        {
            test: '(return___# (join___  (tuple___ ) (tuple___ 4 5 6)))',
            result: [4, 5, 6],
            decode: 'tuple',
        },
        {
            test: '(return___# (join___  (tuple___ 8) (tuple___ )))',
            result: [8],
            decode: 'tuple',
        },
    ],
    map_: [
        {
            test: '(return___# (map_ (fn* (a) 9) (tuple___ 4 5 9)))',
            result: [9, 9, 9],
            decode: 'tuple',
        },
        {
            test: '(return___# (map_ (fn* (a) (add_ a 4)) (tuple___ 4 5 9 7) ))',
            result: [8, 9, 13, 11],
            decode: 'tuple',
        },
        {
            test: '(return___# (map_ (fn* (a) (mul_ a 4)) (tuple___ 4 5 9) ))',
            result: [16, 20, 36],
            decode: 'tuple',
        },
        {
            test: '(return___# (map_ (fn* (a) 9) (tuple___ 7) ))',
            result: [9],
            decode: 'tuple',
        },
        {
            test: '(return___# (map_ (fn* (a) (add_ a 4)) (tuple___ 7 5) ))',
            result: [11, 9],
            decode: 'tuple',
        },
        {
            test: '(return___# (map_ (fn* (a) (add_ a 4)) (map_ (fn* (a) (mul_ a 4)) (tuple___ 4 5 9) ) ))',
            result: [20, 24, 40],
            decode: 'tuple',
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
            test: '( (fn* (a) (add_ a 1)) 10)',
            result: 11,
        },
        {
            test: '( (fn* (a b) (add_ a b)) 6 7)',
            result: 13,
        },
        {
            test: '( (fn* (a b) (add_ a b)) (add_ (add_ (sub_ 7 2) 1) 41) (add_ 2 3))',
            result: 52,
        },
        {
            test: '( (fn* (a b) (add_ (mul_ a b ) b)) 2 3)',
            result: 9,
        },
        {
            test: `( (fn* (a b) (add_ a b))
                (add_ (add_ (sub_ 7 2) 1) 41)
                (add_ 2 3)
            )`,
            result: 52,
        },
        {
            description: 'fibonacci',
            test: `( (fn* (n)
                (if (lt_ n 3)
                    1
                    (add_ (self (sub_ n 1)) (self (sub_ n 2)) )
                )
            ) 8)`,  // 19
            result: 21,
            wait: 60000,
        },
        {
            description: 'fibonacci memory',
            test: `(memory ( (fn* (n)
                (if (lt_ n 3)
                    1
                    (add_ (self (sub_ n 1)) (self (sub_ n 2)) )
                )
            ) 8))`,  // 18
            result: 21,
            wait: 60000,
        },
        {
            description: 'recursive',
            test: `((fn* (n max) (if (gt_ n max)
                    n
                    (self (add_ n 1) max)
                )
            ) 0 4)`, // 500
            result: 5,
            wait: 60000,
        },
        {
            description: 'recursive memory',
            test: `(memory ((fn* (n max) (if (gt_ n max)
                    n
                    (self (add_ n 1) max)
                )
            ) 0 4))`, // 450
            result: 5,
            wait: 60000,
        },
        {
            test: `((fn* (str pos)
                (if (lt_ (t2_len_ str) pos)
                    (self
                        (join__ str "a")
                        pos
                    )
                    (return# str)
                )
            ) "b" 3)`,
            result: 'baa',
            decode: ['string'],
        },
        {
            description: 'test fn in fn',
            test: `((fn* (a)
                (if (eq_ 0 (mod_ a 2))
                    ((fn* (b) (div_ b 2) ) a)
                    a
                )
            ) 6)`,
            result: 3,
        },
        {
            description: 'test super',
            test: `((fn* (a)
                (if (eq_ 0 (mod_ a 2))
                    ((fn* (b) (super 1 (div_ b 2) ) ) a)
                    a
                )
            ) 6)`,
            result: 3,
            wait: 10000,
        },
        {
            description: 'test super - depth 2',
            test: `((fn* (a)
                (if (eq_ 0 (mod_ a 2))
                    ((fn* (b)
                        ((fn* (c)
                            (super 2 (div_ b c) )
                        ) 2)
                    ) a)
                    a
                )
            ) 6)`,
            result: 3,
            wait: 10000,
        },
    ],
    'let*': [
        {
            test: '(let* (c 2) c)',
            result: 2,
        },
        {
            test: '(let* (c 8 d 5) (add_ c d))',
            result: 13,
        },
        {
            test: `(let* (
                c (fn* (a b) (add_ a b))
            )
            (apply c 5 8)
        )`,
            result: 13,
        },
        {
            test: `(let* (
                c (fn* (a b) (add_ a b))
                d (fn* (a b) (mul_ a b))
            )
            (apply d 2 (apply c 5 8))
        )`,
            result: 26,
        },
        {
            test: '(let* (a 4 b (add_ a 2)) b)',
            result: 6,
            skip: true,
        },
        {
            test: '(let* (a 4 b (add_ a 2) c (mul_ b 3)) (sub_ c b))',
            result: 12,
        },
        {
            test: `(let* (c 2 a (add_ c 4))
                ((fn* (d e) (add_ d e)) a c)
            )`,
            result: 8,
        },
        {
            test: `( (fn* (d e)
                (let* (a 6)
                    (add_ (add_ a d) e)
                )
            ) 2 1)`,
            result: 9,
        },
        {
            test: `( (fn* (d e)
                (let* (
                        a 6
                        b (fn* (f g) (add_ f g))
                        c (fn* (h i) (mul_ h i))
                    )
                    (apply b (apply c a d) e)
                )
            ) 2 1)`,
            result: 13,
        },
        {
            test: `((fn* (str pos)
                (let* (
                        a pos
                    )
                    a
                )
            ) "0x1122" 2)`,
            result: 2,
        },
        {
            test: `((fn* (str pos)
                (let* (
                        a str
                    )
                    (return# a)
                )
            ) "0x1122" 2)`,
            result: '0x1122',
            decode: null,
        },
        {
            test: `( (fn* (str1 str2)
                (let* (
                        a (t2_len_ str1)
                        b (fn* (f g) (add_ f g))
                        c (fn* (h i) (mul_ h i))
                        d (join__ str1 str2)
                    )
                    (apply b (apply c a (t2_len_ d)) 0)
                )
            ) "0x1122" "0x334455")`,
            result: 10,
        },
        {
            test: `((fn* (str pos)
                (let* (
                        len (t2_len_ str)
                    )
                    (if (lt_ len pos)
                        (self
                            (join__ str "a")
                            pos
                        )
                        (return# str)
                    )
                )
            ) "b" 3)`,
            result: 'baa',
            decode: ['string'],
        },
    ],
    apply_tuple: [
        {
            test: `(apply-tuple (fn* (a b) (add_ a b)) (tuple___ 5 8))`,
            result: 13,
        },
        {
            test: `(let* (
                    c (fn* (a b) (add_ a b))
                )
                (apply-tuple c (tuple___ 5 8))
            )`,
            result: 13,
        },
    ]
}

module.exports = tests;
