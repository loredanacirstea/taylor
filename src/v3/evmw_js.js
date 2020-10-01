const evm_wrapped = {
    calldatacopy__: '(fn* (pos, size) (js-eval (str "utils.wevm.calldatacopy__(" (js-str pos) "," (js-str size) ")")) )',
    codecopy__: '(fn* (pos, size) (js-eval (str "utils.wevm.codecopy__(" (js-str pos) "," (js-str size) ")")) )',
    extcodecopy__: '(fn* (addr, pos, size) (js-eval (str "utils.wevm.codecopy__(" (js-str addr) "," (js-str pos) "," (js-str size) ")")) )',
    returndatacopy__: '(fn* (pos, size) (js-eval (str "utils.wevm.returndatacopy__(" (js-str pos) "," (js-str size) ")")) )',
    mkeccak256_: 'unimplemented',
    mmstore__: '(fn* (& xs) (js-eval (str "utils.mmstore__(" (js-str xs) ")" )) )',
    mmstore8__: '(fn* (& xs) (js-eval (str "utils.mmstore8__(" (js-str xs) ")" )) )',
    mmload__: 'unimplemented',
    msload__: 'unimplemented',
    msstore_: 'unimplemented',
    call__: 'unimplemented',
    'call!__': 'unimplemented',
    callcode__: 'unimplemented',
    delegatecall__: 'unimplemented',
    log_: 'unimplemented',

    'create!_': 'unimplemented',
    'store!_': 'sstore_',

    'return#': '(fn* (a) (js-eval (str "utils.return_d(" (js-str a) ")" )) )',
    'revert#': 'unimplemented',
    'stop#': 'stop_',
    'selfdestruct#': 'selfdestruct_',
    'invalid#': 'invalid_',

    'return___#': '(fn* (a) (js-eval (str "utils.return_3(" (js-str a) ")" )) )',
}

module.exports = evm_wrapped;
