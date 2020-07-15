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
}

const prereq = [];

module.exports = { tests, prereq };
