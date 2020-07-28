const tests = {
    'list?': [
        {
            test: '(list? (array 1 5))',
            result: false,
        },
    ],
    'array?': [
        {
            test: '(array? (array))',
            result: true,
        },
        {
            test: '(array? (array 1 5))',
            result: true,
        },
        {
            test: '(array? 4)',
            result: false,
        },
        {
            test: '(array? (list 1 5))',
            result: false,
        },
    ],
    map_multi_iter: [
        {
            test: '(map add (list 5 0 2) (list 15 10 12))',
            result: [20, 10, 14],
        },
        {
            test: '(map add (array 5 0 2) (array 15 10 12))',
            result: [20, 10, 14],
        },
        {
            test: `(let* (
                    somelambda (fn* (a b c) (sub (add a b) c))
                )
                (map somelambda (list 5 8 2) (list 15 10 12) (list 2 4 9))
            )`,
            result: [18, 14, 5],
        },
        {
            test: `(let* (
                    somelambda (fn* (a b c) (sub (add a b) c))
                )
                (map somelambda (array 5 8 2) (array 15 10 12) (list 2 4 9))
            )`,
            result: [18, 14, 5],
        },
    ],
    slice: [
        {
            test: `(slice "0x11223344556677" 3)`,
            result: ['0x112233', '0x44556677'],
        },
        {
            test: `(slice "0x1122334455" 5)`,
            result: ['0x1122334455', '0x'],
        },
        {
            test: `(slice "0x" 5)`,
            result: ['0x', '0x'],
        }
    ],
    join: [
        {
            test: `(join "0x112233" "0x445566"))`,
            result: '0x112233445566',
        },
        {
            test: `(join "0x112233" 8))`,
            result: '0x11223300000008',
        },
        {
            test: `(join "hello" "yello"))`,
            result: 'helloyello',
        },
        {
            test: `(join "0x112233" "hello"))`,
            result: '0x1122330000000000000000000000000000000000000000000000680065006c006c006f',
        },
        {
            test: `(join "0x" "0x445566"))`,
            result: '0x445566',
        },
    ],
    'to-uint': [
        {
            test: `(to-uint "0x0000000000000000000000000000000000000000000000000000000000000004")`,
            result: 4,
        },
        {
            test: `(to-uint "0x00000000000000000000000000000000000000000000000000000000000000c0")`,
            result: 0xc0,
        },
        {
            test: `(to-uint "0x0000000000000000000000000000000000000000000000000000000000000080")`,
            result: 0x80,
        }
    ],
}

const prereq = [];

module.exports = { tests, prereq };
