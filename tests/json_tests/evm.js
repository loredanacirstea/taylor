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
            test: '(div_ 9 -3)',
            result: 0,
        },
        {
            test: '(div_ -9 3)',
            result: '0x5555555555555555555555555555555555555555555555555555555555555552',
            decode: 'hex',
        },
        {
            test: '(div_ -9 -3)',
            result: 0,
        },
        {
            test: '(div_ 0 3)',
            result: 0,
        },
        {
            test: '(div_ 0 -3)',
            result: 0,
        },
        {
            test: '(div_ 3 0)',
            result: 0,
        },
        {
            test: '(div_ 0 0)',
            result: 0,
        },
    ],
    sdiv_: [
        {
            test: '(sdiv_ 9 3)',
            result: 3,
        },
        {
            test: '(sdiv_ 9 -3)',
            // result: -3,
            decode: 'hex',
            result: '0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffd',
        },
        {
            test: '(sdiv_ -9 3)',
            // result: -3,
            decode: 'hex',
            result: '0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffd',
        },
        {
            test: '(sdiv_ -9 -3)',
            result: 3,
        },
        {
            test: '(sdiv_ 0 3)',
            result: 0,
        },
        {
            test: '(sdiv_ 0 -3)',
            result: 0,
        },
        {
            test: '(sdiv_ 3 0)',
            result: 0,
        },
        {
            test: '(sdiv_ 0 0)',
            result: 0,
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
            test: '(mod_ 10 -4)',
            result: 10,
        },
        {
            test: '(mod_ -10 4)',
            result: 2,
        },
        {
            test: '(mod_ -10 -4)',
            // result: -10,
            decode: 'hex',
            result: '0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff6',
        },
        {
            test: '(mod_ 0 3)',
            result: 0,
        },
        {
            test: '(mod_ 12 0)',
            result: 0,
        },
        {
            test: '(mod_ 0 0)',
            result: 0,
        },
    ],
    smod_: [
        {
            test: '(smod_ 12 3)',
            result: 0,
        },
        {
            test: '(smod_ 10 3)',
            result: 1,
        },
        {
            test: '(smod_ 10 -4)',
            result: 2,
        },
        {
            test: '(smod_ -10 4)',
            // result: -2,
            decode: 'hex',
            result: '0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe',
        },
        {
            test: '(smod_ -10 -4)',
            // result: -2,
            decode: 'hex',
            result: '0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe',
        },
        {
            test: '(smod_ 0 3)',
            result: 0,
        },
        {
            test: '(smod_ 12 0)',
            result: 0,
        },
        {
            test: '(smod_ 0 0)',
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
        {
            test: '(lt_ -3 2)',
            result: 0,
        },
        {
            test: '(lt_ 3 -7)',
            result: 1,
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
        {
            test: '(gt_ -3 2)',
            result: 1,
        },
        {
            test: '(gt_ 3 -7)',
            result: 0,
        },
    ],
    slt_: [
        {
            test: '(slt_ 3 7)',
            result: 1,
        },
        {
            test: '(slt_ 3 2)',
            result: 0,
        },
        {
            test: '(slt_ -3 2)',
            result: 1,
        },
        {
            test: '(slt_ 3 -7)',
            result: 0,
        },
    ],
    sgt_: [
        {
            test: '(sgt_ 3 7)',
            result: 0,
        },
        {
            test: '(sgt_ 3 2)',
            result: 1,
        },
        {
            test: '(sgt_ -3 2)',
            result: 0,
        },
        {
            test: '(sgt_ 3 -7)',
            result: 1,
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
        {
            test: '(byte_ 3 "0x11445566")',
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
        {
            test: '(sar_ 1 -5)',
            // result: -3,
            decode: 'hex',
            result: '0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffd',
        },
        {
            test: '(sar_ 3 -5)',
            // result: -1,
            decode: 'hex',
            result: '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
        },
    ],
    addmod_: [
        {
            test: '(addmod_ 10 5 4)',
            result: 3,
        },
    ],
    mulmod_: [
        {
            test: '(mulmod_ 10 5 4)',
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
            test: '(calldataload_ 0)',
            result: '0x3000900100000035100000000000000000000000000000000000000000000000',
            decode: null,
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
            result: 8,
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
            result: '0x4980dc938ef8c21b20ba9ca73d0400bb63206f2a',
            txObj: { from: '0x4980dc938ef8c21b20ba9ca73d0400bb63206f2a' },
            process: (resp, instance) => resp.toString(16).toLowerCase(),
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
            result: true,
            process: resp => resp.toNumber() >= 30000000,
        },
    ],
    calldatacopy__: [
        {
            test: '(return# (calldatacopy__ 0 32 ))',
            result: '0x3001400100000101300120820000012010000000000000000000000000000000',
            decode: ['bytes32'],
        },
    ],
    codecopy__: [
        {
            // only for evm interpreter, reads from calldata
            test: '(return# (codecopy__ 0 10 ))',
            result: '0x6103d160a052605460c0',
            decode: null,
        },
    ],
    extcodecopy__: [
        {
            test: '(return# (extcodecopy__ (address_ ) 0 10 ))',
            result: '0x6103d160a052605460c0',
            decode: null,
        },
    ],
    create_: [
        {
            test: '(create_ )',
            result: 0,
            skip: true,
        },
    ],
    create2_: [
        {
            test: '(create2_ )',
            result: 0,
            skip: true,
        },
    ],
    'callcode!__': [
        {
            test: '(callcode!__ )',
            result: 0,
            skip: true,
        },
    ],
    'delegatecall!__': [
        {
            test: '(delegatecall!__ )',
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
            test: '(selfdestruct# )',
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
            test: '(keccak256_ "0x112233445566778899")',
            result: '0x6d0303985e0805f1f9ff102005aff821d34ef3e95521cecc9d4d6d74ea309f04',
            decode: ['bytes32'],
        },
        {
            test: '(keccak256_ (mmstore__ 1000))',
            result: '0xef9d334ee3e15416314a60312ef616e881c3bfffe4b60b11befc2707c79b7d35',
            decode: ['bytes32'],
            skip: true,
        },
    ],
    'revert#': [
        {
            test: '(revert# (mmstore__ 1000))',
            error: true,
            skip: true,
        }
    ],
    'return#': [
        {
            test: '(return# (mmstore__ 5))',
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
    mmstore__: [
        {
            test: '(return# (mmstore__ 1000))',
            result: 1000,
            decode: ['uint'],
        },
        {
            test: '(return# (mmstore__ 1000 5))',
            result: [1000, 5],
            decode: ['uint', 'uint'],
        }
    ],
    mmstore8__: [
        {
            test: '(return# (mmstore8__ 3))',
            result: '0x03',
            decode: null,
        },
    ],
    mload_: [
        {
            test: '(mload_ (t2_ptr_ (mmstore__ 1000)))',
            result: 1000,
            decode: ['uint'],
        },
        {
            test: '(mload_ (mstore_ 100 4))',
            result: 4,
            decode: ['uint'],
        }
    ],
    sload_: [
        {
            test: '(sload_ (store!_ 5 1000))',
            result: 1000,
            decode: ['uint'],
        },
    ],
    'store!_': [
        {
            test: '(sload_ (store!_ (keccak256_ "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470") 4000))',
            result: 4000,
            decode: ['uint'],
        },
        {
            test: '(sload_ (keccak256_ "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470"))',
            result: 4000,
            decode: ['uint'],
            skip: true,
        }
    ],
    msize_: [
        {
            test: '(msize_)',
            result: true,
            process: resp => resp > 256,
        }
    ],
}

module.exports = tests;
