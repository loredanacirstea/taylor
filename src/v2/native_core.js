const _native_core = {
    if:          { mutable: false, arity: 3 },
    t2_:         { mutable: false, arity: 2 },
    t12:         { mutable: false, arity: 1 },
    t21:         { mutable: false, arity: 1 },
    mmstore_:    { mutable: false, arity: null },
    join_:       { mutable: false, arity: 2 },
    tuple_:      { mutable: false, arity: null },
    // fn:          { mutable: false, arity: null },
}

const docs = {

}

const native_core = {};
Object.keys(_native_core).forEach(name => {
    native_core[name + '_'] = Object.assign(_native_core[name], docs[name] || {});
})

module.exports = native_core;
