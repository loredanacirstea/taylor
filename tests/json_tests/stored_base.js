require('../../src/extensions.js');

const tests = {
    t2_byte_: [
        { settings: true, prereq: ['t2_byte_'] },
        {
            test: '(t2_byte_ "abc" 0)',
            result: parseInt("a".hexEncode(), 16),
        },
        {
            test: `((fn* (str pos)
                (byte_ pos (mload_ (t2_ptr_ str)))
            ) "abc" 0)`,
            result: parseInt("a".hexEncode(), 16),
        },
        {
            test: '(t2_byte_ "abc" 2)',
            result: parseInt("c".hexEncode(), 16),
        },
    ],
    slice___: [
        { settings: true, prereq: ['slice___'] },
        {
            test: `(return# (nth_ (slice___ "0x112233445566778899" 2) 0))`,
            result: '0x1122',
            decode: null,
        },
        {
            test: `(return# (nth_ (slice___ "0x112233445566778899" 2) 1))`,
            result: '0x33445566778899',
            decode: null,
        },
    ],
    first: [
        { settings: true, prereq: ['first'] },
        {
            test: `(first (tuple___ 21 3 4))`,
            result: 21,
        },
        {
            test: `(first (tuple___ ))`,
            result: 0,
            skip: true,
        },
    ]
}

module.exports = tests;
