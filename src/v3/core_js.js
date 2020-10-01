const core = {
    t2_ptr_: '(fn* (t2_ptr__) (js-eval (str "utils.core.t2_ptr_(" (js-str t2_ptr__) ")")) )',
    t2_len_: '(fn* (t2_ptr__) (js-eval (str "utils.core.t2_len_(" (js-str t2_ptr__) ")")) )',
    t2_init_: 'unimplemented',
    clone__: '(fn* (ptr_ len) (js-eval (str "utils.core.clone__(" (js-str ptr_) "," (js-str len) ")")) )',
    join__: `(fn* (ptr1__ ptr2__) (js-eval (str "utils.core.join__(" (js-str ptr1__) "," (js-str ptr2__) ")") ) )`,
    tuple___: `(fn* (& xs) (js-eval (str "utils.core.tuple___(" (js-str xs) ")") )))`,
    t3_arity_: '(fn* (t3_ptr___) (js-eval (str "utils.core.t3_arity_(" (js-str t3_ptr___) ")")) )',
    t3_ptr_: '(fn* (t3_ptr___) (js-eval (str "utils.core.t3_ptr_(" (js-str t3_ptr___) ")")) )',
    nth_: '(fn* (t3_ptr___ index) (js-eval (str "utils.core.nth_(" (js-str t3_ptr___) "," (js-str index) ")")) )',
    rest___: '(fn* (t3_ptr___) (js-eval (str "utils.core.rest___(" (js-str t3_ptr___) ")")) )',
    join___: `(fn* (ptr1___ ptr2___) (js-eval (str "utils.core.join___(" (js-str ptr1___) "," (js-str ptr2___) ")") ) )`,

    tuple___2list: '(fn* (t3_ptr___) (js-eval (str "utils.core.tuple___2list(" (js-str t3_ptr___) ")")) )',
    list2tuple___: '(fn* (args) (js-eval (str "utils.core.list2tuple___(" (js-str args) ")")) )',
    // TODO: map___
    map_: `(fn* (func t3_ptr___)
        (list2tuple___
            (map func (tuple___2list t3_ptr___))
        )
    )`,
    'apply-tuple': `(fn* (func t3_ptr___) (apply-list func (tuple___2list t3_ptr___)))`,
    memory: '(fn* (a) a )',
    stack: '(fn* (a) a )',
}

module.exports = core;
