const wrapped_t2 = {
    calldatacopy__: '120',
    codecopy__: '121',
    extcodecopy__: '122',
    returndatacopy__: '123',
    mmstore__: '126',
    mmstore8__: '127',
    mmload__: '128',
    msload__: '129',

    keccak256_: '125',
    msstore_: '12a',

    call__: '12b',
    'call!__': '12c',
    callcode__: '12d',
    delegatecall__: '12e',
    log_: '12f',
    t2_ptr_: '130',
    t2_len_: '131',

    'return#': '101',
    'revert#': '124',
    'stop#': '00',
    'selfdestruct#': 'ff',
    'invalid#': '',
}

module.exports = wrapped_t2;
