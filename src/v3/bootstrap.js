const basefn = {
    t2_byte_: {
        expr: `(fn* (str pos)
            (byte_ pos (mload_ (t2_ptr_ str)))
        )`,
    },
    first: {
        expr: `(fn* (___list)
            (nth_ ___list 0)
        )`,
    },
    slice___: {
        expr: `(fn* (str pos)
            (tuple___
                (clone__ (t2_ptr_ str) pos)
                (clone__ (add_ (t2_ptr_ str) pos) (sub_ (t2_len_ str) pos))
            )
        )`,
    }
}

const regexfn = {
    // returns the rest of the string that does not conform with the pattern
    'regex.char.any': {
        expr: `(fn* (str char)
            (if (gt_ (t2_len_ str) 0)
                (if (eq_ (t2_byte_ str 0) char)
                    (self
                        (nth_ (slice___ str 1) 1)
                        char
                    )
                    str
                )
                str
            )
        )`,
        prereq: ['t2_byte_', 'slice___'],
    },
    // returns the rest of the string that does not conform with the pattern
    'regex.range.any': {
        expr: `(fn* (str minChar maxChar)
            (if (gt_ (t2_len_ str) 0)
                (if (and_
                        (gt_ (t2_byte_ str 0) (sub_ minChar 1))
                        (lt_ (t2_byte_ str 0) (add_ maxChar 1))
                    )
                    (self
                        (nth_ (slice___ str 1) 1)
                        minChar maxChar
                    )
                    str
                )
                str
            )
        )`,
        prereq: ['t2_byte_', 'slice___'],
    },
    regex: {
        expr: `(fn* (str pos functions fargs)
            (if (gt_ pos 15)
                (return# str)
                (if (eq_ str 0)
                    0
                    (let* (
                            is_empty_str (eq_ (t2_len_ str) 0)
                            is_empty_funcs (eq_ (t3_arity_ functions) 0)
                        )
                        (if (and_ is_empty_str is_empty_funcs)
                            1
                            (if (eq_ (add_ is_empty_str is_empty_funcs) 1)
                                0
                                (self
                                    (apply-list (nth_ functions 0) (join___ (tuple___ str) (nth_ fargs 0)))
                                    (add_ pos 1)
                                    (rest___ functions)
                                    (rest___ fargs)
                                )
                            )
                        )
                    )
                )
            )
        )`,
    },
}

module.exports = {
    basefn,
    regexfn,
    all: Object.assign({}, basefn, regexfn),
};
