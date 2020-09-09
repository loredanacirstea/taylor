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
            test: '(t2_ptr_ (mmstore__ 12))',
            result: 1972,
            decode: ['uint'],
        },
    ],
    t2_len_: [
        {
            test: '(t2_len_ (mmstore__ 12))',
            result: 32,
            decode: ['uint'],
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
    join_: [
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
            test: '(return# (join__ "b0x2ed0c03fade6398d546ed10000" "0x801ed12ed0c03fade6398d546adc00000000000000"))',
            result: '0x6230783265643063303366616465363339386435343665643130303030801ed12ed0c03fade6398d546adc00000000000000',
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
            test: `( (fn* (n)
                (if (lt_ n 3)
                    1
                    (add_ (self (sub_ n 1)) (self (sub_ n 2)) )
                )
            ) 8)`,
            result: 21,
            wait: 60000,
        },
        {
            test: `((fn* (n max) (if (gt_ n max)
                    n
                    (self (add_ n 1) max)
                )
            ) 0 4)`,
            result: 5,
        }
    ],
}

const prereq = [];

module.exports = { tests, prereq };
