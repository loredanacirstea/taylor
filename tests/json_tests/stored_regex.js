require('../../src/extensions.js');

const tests = {
    'regex.char.any': [
        { settings: true, prereq: ['regex.char.any'] },
        {
            test: `(return# (regex.char.any "" 97))`,
            result: "",
            decode: ['string'],
        },
        {
            test: `(return# (regex.char.any "a" 97))`,
            result: "",
            decode: ['string'],
        },
        {
            test: `(return# (regex.char.any "b" 97))`,
            result: "b",
            decode: ['string'],
        },
        {
            test: `(return# (regex.char.any "aa" 97))`,
            result: "",
            decode: ['string'],
        },
        {
            test: `(return# (regex.char.any "ab" 97))`,
            result: "b",
            decode: ['string'],
        },
    ],
    'regex.range.any': [
        { settings: true, prereq: ['regex.range.any'] },
        {
            test: `(return# (regex.range.any "" 97 122))`,
            result: "",
            decode: ['string'],
        },
        {
            test: `(return# (regex.range.any "a" 97 122))`,
            result: "",
            decode: ['string'],
        },
        {
            test: `(return# (regex.range.any "z" 97 122))`,
            result: "",
            decode: ['string'],
        },
        {
            test: `(return# (regex.range.any "[" 97 122))`,
            result: "[",
            decode: ['string'],
        },
        {
            test: `(return# (regex.range.any "lorez." 97 122))`,
            result: ".",
            decode: ['string'],
        },
        {
            test: `(return# (regex.range.any "lorez" 97 122))`,
            result: "",
            decode: ['string'],
        },
    ],
    // TODO email [a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-_]+\.[a-zA-Z]{2,}
    regex: [
        { settings: true, prereq: ['regex.char.any', 'regex.range.any', 'regex'] },
        {
            description: 'regex  /[a-z]*!*?*/ - "lor!!?"',
            test: `(regex "lor!!?" (tuple___ regex.range.any regex.char.any regex.char.any) (tuple___ (tuple___ 97 122) (tuple___ 33) (tuple___ 63)) )`,
            result: 1,
            wait: 60000,
        },
        {
            description: 'regex  /[a-z]*!*?*/ - "lor!!?."',
            test: `(regex "lor!!?." (tuple___ regex.range.any regex.char.any regex.char.any) (tuple___ (tuple___ 97 122) (tuple___ 33) (tuple___ 63)) )`,
            result: 0,
            wait: 60000,
        },
    ],
    regex2: [
        { settings: true, prereq: ['regex.char.any', 'regex.range.any', 'regex2'] },
        {
            description: 'regex2',
            test: `(regex "lor!!?."  (tuple___ regex.range.any regex.char.any regex.char.any) (tuple___ (tuple___ 97 122) (tuple___ 33) (tuple___ 63)) )`,
            result: 0,
            wait: 60000,
        },
    ]
}

module.exports = tests;
