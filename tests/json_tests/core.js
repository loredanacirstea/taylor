const tests = {
    if_: [
        {
            test: '(if_ 1 (add_ 1 3) 6)',
            result: 4,
        },
        {
            test: '(if_ 0 (add_ 1 3) 6)',
            result: 6,
        },
        {
            test: '(if_ (eq_ 7 7) (add_ 1 3) 6)',
            result: 4,
        },
        {
            test: '(if_ (eq_ 7 9) (add_ 1 3) 6)',
            result: 6,
        },
    ],
    tn_ptr_: [
        {
            test: '(tn_ptr_ (mstore__ 12))',
            result: 404,
            decode: ['uint'],
        },
    ],
    tn_len_: [
        {
            test: '(tn_len_ (mstore__ 12))',
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
    'fn_': [
        {
            test: '(fn_ (a) a)',
            result: '(fn_ (a) a)',
            skip: true,
        },
        {
            test: '( (fn_ (a) a) 7)',
            result: 7,
        },
        {
            test: '( (fn_ (a) (add_ a 1)) 10)',
            result: 11,
        },
        {
            test: '( (fn_ (a b) (add_ a b)) 6 7)',
            result: 13,
        },
        {
            test: '( (fn_ (a b) (add_ a b)) (add_ (add_ (sub_ 7 2) 1) 41) (add_ 2 3))',
            result: 52,
        },
        {
            test: '( (fn_ (a b) (add_ (mul_ a b ) b)) 2 3)',
            result: 9,
        },
        {
            test: `( (fn_ (a b) (add_ a b))
                (add_ (add_ (sub_ 7 2) 1) 41)
                (add_ 2 3)
            )`,
            result: 52,
        },
        {
            test: `( (fn_ (n)
                (if_ (lt_ n 3)
                    1
                    (add_ (self (sub_ n 1)) (self (sub_ n 2)) )
                )
            ) 8)`,
            result: 21,
            wait: 60000,
        },
        {
            test: `((fn_ (n max) (if_ (gt_ n max)
                    n
                    (self (add_ n 1) max)
                )
            ) 0 4)`,
            result: 5,
        }
    ],
    // apply_: [

    // ],
    // for_: [
    //     {
    //         test: '(for_ init exit_test opstep  func input_ptr, input_size)',
    //         result: 4,
    //         skip: true,
    //     },
    //     {
    //         test: `(for_
    //             0
    //             (fn_ (step input_ptr input_size) (gt_ step 5))
    //             (fn_ (step) (add_ step 1))
    //             (fn_ (step input_ptr input_size) ())
    //             input_ptr,
    //             input_size
    //         )`,
    //         result: 4,
    //         skip: true,
    //     },
    // ]
}

const prereq = [];

module.exports = { tests, prereq };
