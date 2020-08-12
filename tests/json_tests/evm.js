const tests = {
    add_: [
        {
            test: '(add_ 9 3)',
            result: 12,
        },
        {
            test: '(add_ 9 0)',
            result: 9,
        },
        {
            test: '(add_ 0 0)',
            result: 0,
        },
    ],
    sub_: [
        {
            test: '(sub_ 9 3)',
            result: 6,
        },
        {
            test: '(sub_ 0 0)',
            result: 0,
        },
    ],
    mul_: [
        {
            test: '(mul_ 9 3)',
            result: 27,
        },
        {
            test: '(mul_ 0 3)',
            result: 0,
        },
        {
            test: '(mul_ 0 0)',
            result: 0,
        },
    ],
    div_: [
        {
            test: '(div_ 9 3)',
            result: 3,
        },
        {
            test: '(div_ 0 3)',
            result: 0,
        },
        {
            test: '(div_ 3 0)',
            result: 0,
            skip: true,
        },
    ],
    sdiv_: [
        {
            test: '(sdiv_ 12 3)',
            result: 4,
        },
    ],
    mod_: [
        {
            test: '(mod_ 12 3)',
            result: 0,
        },
        {
            test: '(mod_ 10 3)',
            result: 1,
        },
        {
            test: '(mod_ 0 3)',
            result: 0,
        },
        {
            test: '(mod_ 12 0)',
            result: 0,
            skip: true,
        },
    ],
    smod_: [
        {
            test: '(smod_ 12 3)',
            result: 0,
        },
    ],
    exp_: [
        {
            test: '(exp_ 2 8)',
            result: 256,
        },
        {
            test: '(exp_ 2 32)',
            result: 4294967296,
            process: resp => resp.toNumber(),
        },
        {
            test: '(exp_ 2 0)',
            result: 1,
        },
        {
            test: '(exp_ 0 8)',
            result: 0,
        },
    ],
    not_: [
        {
            test: '(not_ (not_ 12))',
            result: 12,
        },
    ],
    lt_: [
        {
            test: '(lt_ 3 7)',
            result: 1,
        },
        {
            test: '(lt_ 3 2)',
            result: 0,
        },
    ],
    gt_: [
        {
            test: '(gt_ 3 7)',
            result: 0,
        },
        {
            test: '(gt_ 3 2)',
            result: 1,
        },
    ],
    slt_: [
        {
            test: '(slt_ 3 7)',
            result: 1,
        },
    ],
    sgt_: [
        {
            test: '(sgt_ 7 7)',
            result: 0,
        },
    ],
    eq_: [
        {
            test: '(eq_ 7 7)',
            result: 1,
        },
    ],
    iszero_: [
        {
            test: '(iszero_ 4)',
            result: 0,
        },
        {
            test: '(iszero_ 0)',
            result: 1,
        },
    ],
    and_: [
        {
            test: '(and_ (iszero_ 0) (gt_ 9 7))',
            result: 1,
        },
        {
            test: '(and_ 1 0)',
            result: 0,
        },
    ],
    or_: [
        {
            test: '(or_ (iszero_ 5) (gt_ 9 7))',
            result: 1,
        },
        {
            test: '(or_ 0 0)',
            result: 0,
        },
    ],
    xor_: [
        {
            test: '(xor_ (iszero_ 0) (gt_ 9 7))',
            result: 0,
        },
    ],
    byte_: [
        {
            test: '(byte_ 30 0x11445566)',
            result: 0x55,
        },
    ],
    shl_: [
        {
            test: '(shl_ 2 12)',
            result: 0x30,
        },
    ],
    shr_: [
        {
            test: '(shr_ 2 12)',
            result: 3,
        },
    ],
    sar_: [
        {
            test: '(sar_ 2 12)',
            result: 3,
        },
    ],
    addmod_: [
        {
            test: '(addmod_ 10, 5, 4)',
            result: 3,
        },
    ],
    mulmod_: [
        {
            test: '(mulmod_ 10, 5, 4)',
            result: 2,
        },
    ],
    signextend_: [
        {
            test: '(signextend_ 2 12)',
            result: 0xc,
        },
    ],
    gas_: [
        {
            test: '(gas_)',
            result: true,
            txObj: { gasLimit: 200000 },
            process: resp => resp.toNumber() > 170000,
        },
    ],
    address_: [
        {
            test: '(address_)',
            result: true,
            process: (resp, instance) => resp.toLowerCase() === instance.address.toLowerCase(),
            decode: ['address'],
        },
    ],
    balance_: [
        {
            test: '(balance_ 0x4980dC938ef8C21b20bA9CA73D0400BB63206f2b)',
            result: 0,
        },
    ],
    caller_: [
        {
            test: '(caller_)',
            result: '0x4980dC938ef8C21b20bA9CA73D0400BB63206f2a'.toLowerCase(),
            txObj: { from: '0x4980dC938ef8C21b20bA9CA73D0400BB63206f2a' },
            decode: ['address'],
            process: (resp, instance) => resp.toString(16).toLowerCase(),
        },
    ],
    callvalue_: [
        {
            test: '(callvalue_)',
            result: 1000,
            txObj: { value: 1000 },
        },
    ],
    calldataload_: [
        {
            test: '(calldataload_ 1024)',
            result: 0,
        },
    ],
    calldatasize_: [
        {
            test: '(calldatasize_)',
            result: 8,
        },
    ],
    codesize_: [
        {
            test: '(codesize_)',
            result: true,
            process: (resp, instance) => resp > 2220,
        },
    ],
    extcodesize_: [
        {
            test: '(extcodesize_ 0x4980dC938ef8C21b20bA9CA73D0400BB63206f2a)',
            result: 0,
        },
    ],
    returndatasize_: [
        {
            test: '(returndatasize_)',
            result: 0,
        },
    ],
    extcodehash_: [
        {
            test: '(extcodehash_ 0x4980dC938ef8C21b20bA9CA73D0400BB63206f2a)',
            result: '0x0000000000000000000000000000000000000000000000000000000000000000',
            decode: ['bytes32'],
        },
    ],
    chainid_: [
        {
            test: '(chainid_)',
            result: 1337,
            skip: true,
        },
    ],
    origin_: [
        {
            test: '(origin_)',
            result: '0x4980dC938ef8C21b20bA9CA73D0400BB63206f2a',
            txObj: { from: '0x4980dC938ef8C21b20bA9CA73D0400BB63206f2a' },
            // process: (resp, instance) => resp.toString(16).toLowerCase(),
            decode: ['address'],
        },
    ],
    gasprice_: [
        {
            test: '(gasprice_)',
            result: 10000,
            txObj: { gasPrice: 10000 },
        },
    ],
    blockhash_: [
        {
            test: '(blockhash_ 0)',
            result: true,
            process: resp => resp.length === 66,
            decode: ['bytes32'],
        },
    ],
    coinbase_: [
        {
            test: '(coinbase_)',
            result: '0x0000000000000000000000000000000000000000',
            decode: ['address'],
        },
    ],
    timestamp_: [
        {
            test: '(timestamp_)',
            result: parseInt((new Date().getTime()).toString().slice(0, 7), 10).toString(16),
            process: resp => parseInt(resp.toString(10).slice(0, 7), 10).toString(16),
        },
    ],
    number_: [
        {
            test: '(number_)',
            result: true,
            process: (resp, instance) => resp > 1,
        },
    ],
    difficulty_: [
        {
            test: '(difficulty_)',
            result: true,
            process: (resp, instance) => resp >= 0,
        },
    ],
    gaslimit_: [
        {
            test: '(gaslimit_)',
            result: 1000000,
            txObj: { gasLimit: 1000000 },
            process: (resp) => resp.toNumber(),
        },
    ],
    calldatacopy__: [
        {
            test: '(return# (calldatacopy__ 0 32 ))',
            result: '0x3400080100000042340010020000003d10000000000000000000000000000000',
            decode: ['bytes32'],
        },
    ],
    codecopy__: [
        {
            test: '(return# (codecopy__ 0 10 ))',
            result: '0x60c06040526040513681',
            decode: null,
        },
    ],
    extcodecopy__: [
        {
            test: '(return# (extcodecopy__ (address_ ) 0 10 ))',
            result: '0x60c06040526040513681',
            decode: null,
        },
    ],
    create_: [
        {
            test: '',
            result: 0,
            skip: true,
        },
    ],
    create2_: [
        {
            test: '',
            result: 0,
            skip: true,
        },
    ],
    'callcode_!': [
        {
            test: '',
            result: 0,
            skip: true,
        },
    ],
    'delegatecall_!': [
        {
            test: '',
            result: 0,
            skip: true,
        },
    ],
    returndatacopy__: [
        {
            test: '(return# (returndatacopy__ 0 0 ))',
            result: '0x',
            decode: null,
        },
    ],
    'selfdestruct#': [
        {
            test: '',
            result: 0,
            skip: true,
        },
    ],
    'invalid#': [
        {
            test: '(invalid#)',
            error: true,
            skip: true,
        }
    ],
    keccak256_: [
        {
            test: '(keccak256_ (mstore__ 1000))',
            result: '0xef9d334ee3e15416314a60312ef616e881c3bfffe4b60b11befc2707c79b7d35',
            decode: ['bytes32'],
        },
    ],
    'revert#': [
        {
            test: '(revert# (mstore__ 1000))',
            error: true,
            skip: true,
        }
    ],
    'return#': [
        {
            test: '(return# (mstore__ 5))',
            result: 5,
            decode: ['uint'],
        }
    ],
    'stop#': [
        {
            test: '(stop# )',
            result: '0x',
            decode: null,
        },
    ],
    pop_: [
        {
            test: '(pop_ )',
            result: 0,
            skip: true,
        },
    ],
    mstore__: [
        {
            test: '(return# (mstore__ 1000))',
            result: 1000,
            decode: ['uint'],
        }
    ],
    mstore8__: [
        {
            test: '(return# (mstore8__ 3))',
            result: '0x03',
            decode: null,
        },
    ],
    mload_: [
        {
            test: '(mload_ (tn_ptr_ (mstore__ 1000)))',
            result: 1000,
            decode: ['uint'],
        }
    ],
    sload_: [
        {
            test: '(sload_ (store!_ 5 1000))',
            result: 1000,
            decode: ['uint'],
        }
    ],
    'store!_': [
        {
            test: '(sload_ (store!_ (keccak256_ "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470") 4000))',
            result: 4000,
            decode: ['uint'],
        }
    ],
    msize_: [
        {
            test: '(msize_)',
            result: 256,
        }
    ],
}

const prereq = [];

module.exports = { tests, prereq };
