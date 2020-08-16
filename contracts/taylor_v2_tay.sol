object "Taylor" {
    code {
        // store owner
        // mappingStorageKey_owner
        sstore(7, caller())

        datacopy(0, dataoffset("Runtime"), datasize("Runtime"))
        return(0, datasize("Runtime"))
    }
    object "Runtime" {
    code {

        // set freeMemPtr at 0x40
        mstore(0x40, 0xc0) // 192

        let _calldata := allocate(calldatasize())
        calldatacopy(_calldata, 0, calldatasize())

        // setTxGas()
        let end, response := eval(_calldata, 0, 0)
        // pay if not owner
        // payForSave()

        mstore(0, response)
        return (0, 32)

        function eval(data_ptr, env_ptr, value_to_ptr) -> end_ptr, result_ptr {
            let sig4b := get4b(data_ptr)
            let rootid := shr(28, sig4b)

            switch rootid

            // number
            case 1 {
                // eliminate 4byte sig
                result_ptr := mload(add(data_ptr, 4))
                end_ptr := add(data_ptr, 36)

                // If we need to transform values into pointers (t2)
                if value_to_ptr {
                    let _ptr := allocate(64)
                    mstore(_ptr, 32)
                    mstore(add(_ptr, 32), result_ptr)
                    result_ptr := _ptr
                }
            }

            // function
            case 3 {
                end_ptr := add(data_ptr, 8)

                let arity := getFuncArity(sig4b)
                let funcid := mslice(add(data_ptr, 4), 4)

                // If function is tuple___
                let new_value_to_ptr := eq(funcid, 0x4c)

                // allocate arity number of slots for argument pointers
                let args_ptrs := allocate(mul(add(arity, 1), 32))

                // first argument is the number of arguments
                // for variadic functions
                mstore(args_ptrs, arity)
                let args_ptrs_now := add(args_ptrs, 32)

                for { let i := 0 } lt(i, arity) { i := add(i, 1) } {
                    let _end_ptr, arg_ptr := eval(end_ptr, env_ptr, new_value_to_ptr)

                    // store pointer to argument value
                    mstore(args_ptrs_now, arg_ptr)
                    end_ptr := _end_ptr
                    args_ptrs_now := add(args_ptrs_now, 32)
                }

                let isnative := isFunctionNative(sig4b)
                if isnative {
                    result_ptr := evalNativeFunc(get8b(data_ptr), args_ptrs, env_ptr)
                }
            }

            // bytelike -> t2 (pointer to content with length)
            case 4 {
                let value_length := get4b(add(data_ptr, 4))
                result_ptr := allocate(add(value_length, 32))
                mstore(result_ptr, value_length)
                mmultistore(add(result_ptr, 32), add(data_ptr, 8), value_length)
                end_ptr := add(add(data_ptr, 8), value_length)
            }

            // unknown
            case 0 {
                let subtype := shr(25, sig4b)

                // unknown
                if eq(subtype, 2) {
                    // replace variables from lambdas
                    let index := getFuncArity(sig4b)
                    let value_ptr := add(add(env_ptr, 32), mul(index, 32))
                    result_ptr := mload(value_ptr)
                    end_ptr := add(data_ptr, 4)
                }
            }

            default {
                dtrequire(0, 0xee00, rootid)
            }
        }

        function isFunction(sig4b) -> _isf {
            _isf := eq(shr(28, sig4b), 3)
        }

        // 0011 x 100 xxxx xxxxxxxxxxxxxx xxxxxx
        function isFunctionNative(sig4b) -> _isfn {
            _isfn := eq(and(shr(24, sig4b), 0x07), 4)
        }

        function getFuncArity(sig4b) -> _arity {
            _arity := and(sig4b, 0x3f)
        }

        function getFuncBodyLength(sig4b) -> _blen {
            _blen := and(shr(6, sig4b), 0x3fff)
        }

        function mappingStorageKey(storageIndex, key) -> storageKey {
            let ptr := allocate(64)
            mstore(ptr, key)
            mstore(add(ptr, 32), storageIndex)
            storageKey := keccak256(ptr, 64)
        }

        function readmiddle(value, _start, _len) -> newval {
            newval := shl(mul(8, _start), value)
            newval := shr(mul(8, sub(32, _len)), newval)
        }

        function min(a, b) -> c {
            switch lt(a, b)
            case 1 {
                c := a
            }
            case 0 {
                c := b
            }
        }

        function max(a, b) -> c {
            switch gt(a, b)
            case 1 {
                c := a
            }
            case 0 {
                c := b
            }
        }

        function mslice(position, length) -> result {
          result := shr(sub(256, mul(length, 8)), mload(position))
        }

        function get4b(ptr) -> _sig {
            _sig := shr(224, mload(ptr))
        }

        function get8b(ptr) -> _sig {
            _sig := shr(192, mload(ptr))
        }

        function freeMemPtr() -> ptr {
            ptr := mload(0x40)
        }

        function allocate(size) -> ptr {
            ptr := mload(0x40)
            mstore(0x40, add(ptr, size))
        }

        function setTxGas() {
            mstore(0x60, gas())
            mstore(0x80, 0)
        }

        function setTxPayable() {
            let pay := mload(0x80)
            mstore(0x80, add(pay, 1))
        }

        function getTxCostData() -> gascost, pay {
            gascost := mload(0x60)
            pay := mload(0x80)
        }

        function uconcat(a, b, length_b) -> c {
            c := add(shl(mul(length_b, 8), a), b)
        }

        function mmultistore(_ptr_target, _ptr_source, sizeBytes) {
            let slots := add(div(sizeBytes, 32), gt(mod(sizeBytes, 32), 0))
            let t_now := _ptr_target
            let s_now := _ptr_source
            for { let i := 0 } lt(i, slots) { i := add(i, 1) } {
                mstore(t_now, mload(s_now))
                t_now := add(t_now, 32)
                s_now := add(s_now, 32)
            }
        }

        function sslicestore(storageKey, val, length) {
            let slot := 32
            sstore(storageKey, shl(mul(sub(slot, length), 8), val))
        }

        function storeData(_pointer, storageKey) {
            let sizeBytes := add(mslice(_pointer, 4), 4)
            storeDataInner(_pointer, storageKey, sizeBytes)
        }

        function storeDataInner(_pointer, storageKey, sizeBytes) {
            let storedBytes := 0
            let index := 0

            for {} lt(storedBytes, sizeBytes) {} {
                let remaining := sub(sizeBytes, storedBytes)
                switch gt(remaining, 31)
                case 1 {
                    sstore(add(storageKey, index), mload(add(_pointer, storedBytes)))
                    storedBytes := add(storedBytes, 32)
                    index := add(index, 1)
                }
                case 0 {
                    if gt(remaining, 0) {
                        sslicestore(add(storageKey, index), mslice(add(_pointer, storedBytes), remaining), remaining)
                        storedBytes := add(storedBytes, remaining)
                    }
                }
                setTxPayable()
            }
        }

        function getStoredData(_pointer, storageKey) {
            let slot := 32
            // read first storage slot, for the length
            mstore(_pointer, sload(storageKey))

            let sizeBytes := mslice(_pointer, 4)
            let loadedBytes := sub(slot, 4)

            if gt(sizeBytes, loadedBytes) {
                getStoredDataInner(add(_pointer, 32), add(storageKey, 1), sizeBytes, loadedBytes)
            }
        }

        function getStoredDataInner(_pointer, storageKey, sizeBytes, loadedBytes) {
            let slot := 32
            let index := 0

            for {} lt(loadedBytes, sizeBytes) {} {
                let remaining := sub(sizeBytes, loadedBytes)
                switch gt(remaining, 31)
                case 1 {
                    mstore(_pointer, sload(add(storageKey, index)))
                    loadedBytes := add(loadedBytes, 32)
                    index := add(index, 1)
                    _pointer := add(_pointer, slot)
                }
                case 0 {
                    if gt(remaining, 0) {
                        mstore(_pointer, sload(add(storageKey, index)))
                        loadedBytes := add(loadedBytes, remaining)
                    }
                }
            }
        }

        function dtrequire(cond, error_bytes, error_msg) {
            if eq(cond, 0) {
                mstore(0, error_bytes)
                mstore(32, error_msg)
                revert(0, 64)
            }
        }

        function evalNativeFunc(fsig, arg_ptrs_ptr, env_ptr) -> _result {
            switch fsig

            case 0x3400100200000001 {
                let a := mload(add(arg_ptrs_ptr, 32))
                let b := mload(add(arg_ptrs_ptr, 64))
                _result := add(a, b)
            }
            case 0x3400100200000002 {
                let a := mload(add(arg_ptrs_ptr, 32))
                let b := mload(add(arg_ptrs_ptr, 64))
                _result := sub(a, b)
            }
            case 0x3400100200000003 {
                let a := mload(add(arg_ptrs_ptr, 32))
                let b := mload(add(arg_ptrs_ptr, 64))
                _result := mul(a, b)
            }
            case 0x3400100200000004 {
                let a := mload(add(arg_ptrs_ptr, 32))
                let b := mload(add(arg_ptrs_ptr, 64))
                _result := div(a, b)
            }
            case 0x3400100200000005 {
                let a := mload(add(arg_ptrs_ptr, 32))
                let b := mload(add(arg_ptrs_ptr, 64))
                _result := sdiv(a, b)
            }
            case 0x3400100200000006 {
                let a := mload(add(arg_ptrs_ptr, 32))
                let b := mload(add(arg_ptrs_ptr, 64))
                _result := mod(a, b)
            }
            case 0x3400100200000007 {
                let a := mload(add(arg_ptrs_ptr, 32))
                let b := mload(add(arg_ptrs_ptr, 64))
                _result := smod(a, b)
            }
            case 0x3400100200000008 {
                let a := mload(add(arg_ptrs_ptr, 32))
                let b := mload(add(arg_ptrs_ptr, 64))
                _result := exp(a, b)
            }
            case 0x3400080100000009 {
                let a := mload(add(arg_ptrs_ptr, 32))
                _result := not(a)
            }
            case 0x340010020000000a {
                let a := mload(add(arg_ptrs_ptr, 32))
                let b := mload(add(arg_ptrs_ptr, 64))
                _result := lt(a, b)
            }
            case 0x340010020000000b {
                let a := mload(add(arg_ptrs_ptr, 32))
                let b := mload(add(arg_ptrs_ptr, 64))
                _result := gt(a, b)
            }
            case 0x340010020000000c {
                let a := mload(add(arg_ptrs_ptr, 32))
                let b := mload(add(arg_ptrs_ptr, 64))
                _result := slt(a, b)
            }
            case 0x340010020000000d {
                let a := mload(add(arg_ptrs_ptr, 32))
                let b := mload(add(arg_ptrs_ptr, 64))
                _result := sgt(a, b)
            }
            case 0x340010020000000e {
                let a := mload(add(arg_ptrs_ptr, 32))
                let b := mload(add(arg_ptrs_ptr, 64))
                _result := eq(a, b)
            }
            case 0x340008010000000f {
                let a := mload(add(arg_ptrs_ptr, 32))
                _result := iszero(a)
            }
            case 0x3400100200000010 {
                let a := mload(add(arg_ptrs_ptr, 32))
                let b := mload(add(arg_ptrs_ptr, 64))
                _result := and(a, b)
            }
            case 0x3400100200000011 {
                let a := mload(add(arg_ptrs_ptr, 32))
                let b := mload(add(arg_ptrs_ptr, 64))
                _result := or(a, b)
            }
            case 0x3400100200000012 {
                let a := mload(add(arg_ptrs_ptr, 32))
                let b := mload(add(arg_ptrs_ptr, 64))
                _result := xor(a, b)
            }
            case 0x3400100200000013 {
                let a := mload(add(arg_ptrs_ptr, 32))
                let b := mload(add(arg_ptrs_ptr, 64))
                _result := byte(a, b)
            }
            case 0x3400100200000014 {
                let a := mload(add(arg_ptrs_ptr, 32))
                let b := mload(add(arg_ptrs_ptr, 64))
                _result := shl(a, b)
            }
            case 0x3400100200000015 {
                let a := mload(add(arg_ptrs_ptr, 32))
                let b := mload(add(arg_ptrs_ptr, 64))
                _result := shr(a, b)
            }
            case 0x3400100200000016 {
                let a := mload(add(arg_ptrs_ptr, 32))
                let b := mload(add(arg_ptrs_ptr, 64))
                _result := sar(a, b)
            }
            case 0x3400180300000017 {
                let a := mload(add(arg_ptrs_ptr, 32))
                let b := mload(add(arg_ptrs_ptr, 64))
                let c := mload(add(arg_ptrs_ptr, 96))
                _result := addmod(a, b, c)
            }
            case 0x3400180300000018 {
                let a := mload(add(arg_ptrs_ptr, 32))
                let b := mload(add(arg_ptrs_ptr, 64))
                let c := mload(add(arg_ptrs_ptr, 96))
                _result := mulmod(a, b, c)
            }
            case 0x3400100200000019 {
                let a := mload(add(arg_ptrs_ptr, 32))
                let b := mload(add(arg_ptrs_ptr, 64))
                _result := signextend(a, b)
            }
            case 0x340000000000001a {
                _result := gas()
            }
            // address
            case 0x340000000000001b {
                _result := address()
            }
            // balance ; TODO address
            case 0x340008010000001c {
                let addr := mload(add(arg_ptrs_ptr, 32))
                _result := balance(addr)
            }
            // caller ; TODO address
            case 0x340000000000001d {
                _result := caller()
            }
            case 0x340000000000001e {
                _result := callvalue()
            }
            case 0x340008010000001f {
                let pos := mload(add(arg_ptrs_ptr, 32))
                _result := calldataload(pos)
            }
            case 0x3400000000000020 {
                _result := calldatasize()
            }
            case 0x3400000000000021 {
                _result := codesize()
            }
            case 0x3400080100000022 {
                let addr := mload(add(arg_ptrs_ptr, 32))
                _result := extcodesize(addr)
            }
            case 0x3400000000000023 {
                _result := returndatasize()
            }
            case 0x3400080100000024 {
                let addr := mload(add(arg_ptrs_ptr, 32))
                _result := extcodehash(addr)
            }
            case 0x3400000000000025 {
                _result := chainid()
            }
            // origin ; TODO address
            case 0x3400000000000026 {
                _result := origin()
            }
            case 0x3400000000000027 {
                _result := gasprice()
            }
            case 0x3400080100000028 {
                let block_number := mload(add(arg_ptrs_ptr, 32))
                _result := blockhash(block_number)
            }
            case 0x3400000000000029 {
                _result := coinbase()
            }
            case 0x340000000000002a {
                _result := timestamp()
            }
            case 0x340000000000002b {
                _result := number()
            }
            case 0x340000000000002c {
                _result := difficulty()
            }
            case 0x340000000000002d {
                _result := gaslimit()
            }
            case 0x340008010000002e {
                let x := mload(add(arg_ptrs_ptr, 32))
                pop(x)
            }
            case 0x340000000000002f {
                _result := msize()
            }
            case 0x3400080100000030 {
                // mload_
                let _ptr := mload(add(arg_ptrs_ptr, 32))
                _result := mload(_ptr)
            }
            case 0x3400080100000031 {
                // _sload
                let key := mload(add(arg_ptrs_ptr, 32))
                _result := sload(key)
            }
            case 0x3400180300000032 {
                let addr := mload(add(arg_ptrs_ptr, 32))
                let value := mload(add(arg_ptrs_ptr, 64))
                let data_ptr := mload(add(arg_ptrs_ptr, 96))
                _result := call_bang__(addr, value, data_ptr)
            }
            case 0x3400180300000033 {
                let addr := mload(add(arg_ptrs_ptr, 32))
                let value := mload(add(arg_ptrs_ptr, 64))
                let data_ptr := mload(add(arg_ptrs_ptr, 96))
                _result := callcode_bang__(addr, value, data_ptr)
            }
            case 0x3400100200000034 {
                let addr := mload(add(arg_ptrs_ptr, 32))
                let data_ptr := mload(add(arg_ptrs_ptr, 64))
                _result := delegatecall_bang__(addr, data_ptr)
            }
            case 0x3400100200000035 {
                let addr := mload(add(arg_ptrs_ptr, 32))
                let data_ptr := mload(add(arg_ptrs_ptr, 64))
                _result := call__(addr, data_ptr)
            }
            case 0x3400100200000036 {
                // create_
                let value := mload(add(arg_ptrs_ptr, 32))
                let code_ptr := mload(add(arg_ptrs_ptr, 64))
                _result := create(value, tn_ptr_(code_ptr), tn_len_(code_ptr))
            }
            case 0x3400180300000037 {
                // create2_
                let value := mload(add(arg_ptrs_ptr, 32))
                let code_ptr := mload(add(arg_ptrs_ptr, 64))
                let s := mload(add(arg_ptrs_ptr, 96))
                _result := create2(value, tn_ptr_(code_ptr), tn_len_(code_ptr), s)
            }
            case 0x3400000000000038 {
                // log
            }
            case 0x3400080100000039 {
                let t2_ptr := mload(add(arg_ptrs_ptr, 32))
                _result := keccak256(tn_ptr_(t2_ptr), tn_len_(t2_ptr))
            }
            case 0x340010020000003a {
                // sstore_
                let key := mload(add(arg_ptrs_ptr, 32))
                let value := mload(add(arg_ptrs_ptr, 64))
                sstore(key, value)
                _result := key
            }
            case 0x340008010000003b {
                // mstore__
                let value := mload(add(arg_ptrs_ptr, 32))
                _result := allocate(64)
                mstore(_result, 32)
                mstore(add(_result, 32), value)
            }
            case 0x340008010000003c {
                let value := mload(add(arg_ptrs_ptr, 32))
                _result := allocate(33)
                mstore(_result, 1)
                mstore8(add(_result, 32), and(value, 0xff))
            }
            case 0x340010020000003d {
                // calldatacopy__
                let calld_ptr := mload(add(arg_ptrs_ptr, 32))
                let calld_len := mload(add(arg_ptrs_ptr, 64))
                _result := allocate(add(32, calld_len))
                mstore(_result, calld_len)
                calldatacopy(add(_result, 32), calld_ptr, calld_len)
            }
            case 0x340010020000003e {
                // codecopy__
                let calld_ptr := mload(add(arg_ptrs_ptr, 32))
                let calld_len := mload(add(arg_ptrs_ptr, 64))
                _result := allocate(add(32, calld_len))
                mstore(_result, calld_len)
                codecopy(add(_result, 32), calld_ptr, calld_len)
            }
            case 0x340018030000003f {
                // extcodecopy__
                let addr := mload(add(arg_ptrs_ptr, 32))
                let calld_ptr := mload(add(arg_ptrs_ptr, 64))
                let calld_len := mload(add(arg_ptrs_ptr, 96))
                _result := allocate(add(32, calld_len))
                mstore(_result, calld_len)
                extcodecopy(addr, add(_result, 32), calld_ptr, calld_len)
            }
            case 0x3400100200000040 {
                // returndatacopy__
                let data_ptr := mload(add(arg_ptrs_ptr, 32))
                let data_len := mload(add(arg_ptrs_ptr, 64))
                _result := allocate(add(32, data_len))
                mstore(_result, data_len)
                returndatacopy(add(_result, 32), data_ptr, data_len)
            }
            case 0x3400080100000041 {
                let t2_ptr := mload(add(arg_ptrs_ptr, 32))
                revert_(t2_ptr)
            }
            case 0x3400080100000042 {
                let t2_ptr := mload(add(arg_ptrs_ptr, 32))
                return_d(t2_ptr)
            }
            case 0x3400080100000043 {
                let addr := mload(add(arg_ptrs_ptr, 32))
                selfdestruct(addr)
            }
            case 0x3400000000000044 {
                invalid()
            }
            case 0x3400000000000045 {
                stop()
            }
            case 0x3400180300000046 {
                let condition := mload(add(arg_ptrs_ptr, 32))
                let __branch1 := mload(add(arg_ptrs_ptr, 64))
                let __branch2 := mload(add(arg_ptrs_ptr, 96))
                _result := if_(condition, __branch1, __branch2, env_ptr)
            }
            case 0x3400100200000047 {
                // t2__ - removed
            }
            case 0x3400080100000048 {
                // tn_ptr_
                let t2_1 := mload(add(arg_ptrs_ptr, 32))
                _result := add(t2_1, 32)
            }
            case 0x3400080100000049 {
                // tn_len_
                let t2_1 := mload(add(arg_ptrs_ptr, 32))
                _result := mload(t2_1)
            }
            case 0x340010020000004b {
                let __ptr1 := mload(add(arg_ptrs_ptr, 32))
                let __ptr2 := mload(add(arg_ptrs_ptr, 64))
                _result := join__(__ptr1, __ptr2)
            }
            case 0x340010020000004d {
                let __t3 := mload(add(arg_ptrs_ptr, 32))
                let __indexes := mload(add(arg_ptrs_ptr, 64))
                _result := nth__(__t3, __indexes)
            }
            case 0x340008010000004e {
                let ___t3 := mload(add(arg_ptrs_ptr, 32))
                _result := tuple_sol__(___t3)
            }
            case 0x340010020000004f {
                let __t2 := mload(add(arg_ptrs_ptr, 32))
                let ___ttypes := mload(add(arg_ptrs_ptr, 64))
                _result := sol_tuple___(tn_ptr_(__t2), tn_len_(__t2), ___ttypes)
            }
            case 0x3400100200000050 {
                let __args := mload(add(arg_ptrs_ptr, 32))
                let ___body := mload(add(arg_ptrs_ptr, 64))
                _result := fn_(__args, ___body)
            }

            default {
                let id := and(fsig, 0xffffffff)

                switch id

                // log_
                case 0x38 {
                    let arity := mload(arg_ptrs_ptr)
                    let __data_ptr := mload(add(arg_ptrs_ptr, 32))
                    log_(sub(arity, 1), __data_ptr, add(arg_ptrs_ptr, 64))
                }

                // tuple___
                case 0x4c {
                    mstore(arg_ptrs_ptr, build_t3_arity(mload(arg_ptrs_ptr)))
                    _result := arg_ptrs_ptr
                }

                // apply
                case 0x51 {
                    let ___lambda_ptr := mload(add(arg_ptrs_ptr, 32))
                    _result := apply_(___lambda_ptr, add(arg_ptrs_ptr, 64), env_ptr)
                }
                default {
                    dtrequire(0, 0xeeff, fsig)
                }
            }
        }

        function ttype(___t3) -> _ttype {
            _ttype := shr(248, mload(___t3))
        }

        function is_t3(___t3) -> _ist3 {
            _ist3 := eq(ttype(___t3), 3)
        }

        function tn_ptr_(__tn) -> _result {
            _result := add(__tn, 32)
        }

        function tn_len_(__tn) -> _result {
            _result := and(mload(__tn), 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff)
        }

        function build_t3_arity(numb) -> _arity {
            // t3 marker
            _arity := add(numb, shl(248, 3))
        }

        function t3_arity_(___t3) -> _result {
            _result := and(mload(___t3), 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff)
        }

        function return_d(t2_ptr) {
            return(add(t2_ptr, 32), mload(t2_ptr))
        }

        function revert_(t2_ptr) {
            revert(add(t2_ptr, 32), mload(t2_ptr))
        }

        function fn_(__args, ___body) -> _result {
            _result := allocate(96)
            mstore(_result, build_t3_arity(2))
            mstore(add(_result, 32), __args)
            mstore(add(_result, 64), ___body)
        }

        function apply_(___lambda_ptr, user_input, env_ptr) -> _result {
            let lambda_ptr := tn_ptr_(___lambda_ptr)
            let __lambda_args := mload(lambda_ptr)
            let __lambda_body := mload(add(lambda_ptr, 32))
            let lambda_args := tn_ptr_(__lambda_args)
            let lambda_body := tn_ptr_(__lambda_body)
            let arity := div(tn_len_(__lambda_args), 4)

            let env_arity := mload(env_ptr)
            let new_env_ptr := copy_env(env_ptr)

            // handle reference to self
            addto_env(new_env_ptr, getFuncArity(get4b(lambda_args)), ___lambda_ptr)
            lambda_args := add(lambda_args, 4)

            // environment with lambda args mapped to input values
            for { let i := 1 } lt(i, arity) { i := add(i, 1) } {
                // arity same pos as index
                addto_env(new_env_ptr, getFuncArity(get4b(lambda_args)),  mload(user_input))
                user_input := add(user_input, 32)
                lambda_args := add(lambda_args, 4)
            }

            let end_ptr, result_ptr := eval(lambda_body, new_env_ptr, 0)
            _result := result_ptr
        }

        function join__(__ptr1, __ptr2) -> __ptr3 {
            let len1 := tn_len_(__ptr1)
            let len2 := tn_len_(__ptr2)
            let len := add(len1, len2)
            let ptr3 := allocate(add(32, len))
            __ptr3 := ptr3
            mstore(ptr3, len)
            ptr3 := add(ptr3, 32)
            mmultistore(ptr3, tn_ptr_(__ptr1), len1)
            ptr3 := add(ptr3, len1)
            mmultistore(ptr3, tn_ptr_(__ptr2), len2)
        }

        function call_bang__(addr, value, data_ptr) -> __ptr {
            let success := call(gas(), addr, value, tn_ptr_(data_ptr), tn_len_(data_ptr), 0, 0)

            if eq(success, 0) {
                fail_call(addr, data_ptr)
            }
            __ptr := success_call()
        }

        function callcode_bang__(addr, value, data_ptr) -> __ptr {
            let success := callcode(gas(), addr, value, tn_ptr_(data_ptr), tn_len_(data_ptr), 0, 0)

            if eq(success, 0) {
                fail_call(addr, data_ptr)
            }
            __ptr := success_call()
        }

        function delegatecall_bang__(addr, data_ptr) -> __ptr {
            let success := delegatecall(gas(), addr, tn_ptr_(data_ptr), tn_len_(data_ptr), 0, 0)

            if eq(success, 0) {
                fail_call(addr, data_ptr)
            }
            __ptr := success_call()
        }

        function call__(addr, data_ptr) -> __ptr {
            let success := staticcall(gas(), addr, tn_ptr_(data_ptr), tn_len_(data_ptr), 0, 0)

            if eq(success, 0) {
                fail_call(addr, data_ptr)
            }
            __ptr := success_call()
        }

        function success_call() -> __ptr {
            let outsize := returndatasize()
            __ptr := allocate(add(32, outsize))
            mstore(__ptr, outsize)
            returndatacopy(add(32, __ptr), 0, outsize)
        }

        function fail_call(addr, data_ptr) {
            mstore(0, 0xeedd)
            mstore(32, addr)
            mstore(64, mload(tn_ptr_(data_ptr)))
            revert(0, 96)
        }

        function log_(arity, __data_ptr, topic_ptrs) {
            let data_ptr := tn_ptr_(__data_ptr)
            let data_len := tn_len_(__data_ptr)

            switch arity
            case 0 {
                log0(data_ptr, data_len)
            }
            case 1 {
                log1(data_ptr, data_len, mload(topic_ptrs))
            }
            case 2 {
                log2(data_ptr, data_len, mload(topic_ptrs), mload(add(topic_ptrs, 32)))
            }
            case 3 {
                log3(data_ptr, data_len, mload(topic_ptrs), mload(add(topic_ptrs, 32)), mload(add(topic_ptrs, 64)))
            }
            case 4 {
                log4(data_ptr, data_len, mload(topic_ptrs), mload(add(topic_ptrs, 32)), mload(add(topic_ptrs, 64)), mload(add(topic_ptrs, 96)))
            }
        }

        function tuple_sol__(___t3) -> result_ptr__ {
            result_ptr__ := allocate(32)
            let internal_ptr := freeMemPtr()
            let length := tuple_sol_internal__(___t3, internal_ptr)
            internal_ptr := allocate(length)
            mstore(result_ptr__, length)
        }

        function tuple_sol_internal__(___t3, _ptr) -> last_offset {
            let arity := t3_arity_(___t3)
            let arg_ptrs := tn_ptr_(___t3)

            last_offset := mul(arity, 32)

            for { let i := 0 } lt(i, arity) { i := add(i, 1) } {
                let arg_ptr__ := mload(add(arg_ptrs, mul(i, 32)))
                let arg_len := tn_len_(arg_ptr__)
                let head_ptr := add(_ptr, mul(i, 32))

                // if and(eq(arity, 4), eq(i, 3)) { return(_ptr, last_offset) }

                switch arg_len
                case 32 {
                    mstore(head_ptr, mload(tn_ptr_(arg_ptr__)))
                }
                default {
                    mstore(head_ptr, last_offset)

                    // if eq(arity, 4) { return(_ptr, last_offset) }

                    let ttype_index := ttype(arg_ptr__)
                    let content_ptr := 0

                    // if eq(arity, 4) { return(_ptr, last_offset) }

                    switch ttype_index
                    case 3 {
                        // t3
                        arg_len := tuple_sol_internal__(arg_ptr__, add(_ptr, last_offset))
                    }
                    default {
                        // t2 - add length & just copy the contents
                        mstore(add(_ptr, last_offset), arg_len)
                        last_offset := add(last_offset, 32)
                        content_ptr := tn_ptr_(arg_ptr__)

                        mmultistore(add(_ptr, last_offset), content_ptr, arg_len)
                    }

                    last_offset := add(last_offset, arg_len)

                    // Padd with zeros up to 32 bytes
                    let rest := mod(arg_len, 32)
                    if gt(rest, 0) {
                        let padd := sub(32, mod(arg_len, 32))
                        // Fill with zeros
                        mstore(add(_ptr, last_offset), 0)
                        last_offset := add(last_offset, padd)
                    }
                }
            }
        }

        // passes by reference
        function nth__(__t3, index) -> result_ptr__{
            dtrequire(lt(index, t3_arity_(__t3)), 0xeecc, 0)
            let content_ptr := tn_ptr_(__t3)
            let item_ptr := add(content_ptr, mul(index, 32))
            result_ptr__ := mload(item_ptr)
        }

        // solidity tuple (t2) -> tuple (t3)
        function sol_tuple___(content_ptr, content_len, ___ttypes) -> ___result {
            let arity := t3_arity_(___ttypes)
            let tuple_content := allocate(add(32, mul(arity, 32)))
            ___result := tuple_content
            mstore(tuple_content, build_t3_arity(arity))
            tuple_content := add(tuple_content, 32)

            for { let i := 0 } lt(i, arity) { i := add(i, 1) } {
                let ttype_index_ptr := nth__(___ttypes, i)
                let ttype_index := sol_tuple_ttype_index(ttype_index_ptr)
                let valueOrOffset_ptr := add(content_ptr, mul(32, i))

                switch ttype_index
                case 3 {
                    // tuple t3
                    let offset := mload(valueOrOffset_ptr)
                    let next_offset := sol_tuple_nextOffset(content_ptr, content_len, ___ttypes, add(i, 1))
                    let _ptr := add(content_ptr, offset)
                    let data_len := sub(next_offset, offset)
                    let data_ptr := sol_tuple___(_ptr, data_len, ttype_index_ptr)
                    mstore(add(tuple_content, mul(i, 32)), data_ptr)
                }
                case 2 {
                    // bytes t2
                    let offset := mload(valueOrOffset_ptr)
                    let data_ptr := add(content_ptr, offset)
                    let data_len := mload(data_ptr)
                    mstore(add(tuple_content, mul(i, 32)), data_ptr)
                }
                default {
                    // value t1
                    let data_len := 32
                    let data_ptr := allocate(64)
                    mstore(data_ptr, data_len)
                    mstore(add(data_ptr, 32), mload(valueOrOffset_ptr))
                    mstore(add(tuple_content, mul(i, 32)), data_ptr)
                }
            }
        }

        function sol_tuple_ttype_index(ttype_index_ptr) -> _ttype_index {
            _ttype_index := ttype(ttype_index_ptr)
            if eq(_ttype_index, 0) {
                _ttype_index := mload(tn_ptr_(ttype_index_ptr))
            }
        }

        function sol_tuple_nextOffset(content_ptr, content_len, ___ttypes, i) -> _offset {
            let arity := t3_arity_(___ttypes)
            switch lt(i, arity)
            case 0 {
                _offset := content_len
            }
            default {
                let ttype_index_ptr := nth__(___ttypes, i)
                let ttype_index := sol_tuple_ttype_index(ttype_index_ptr)
                switch ttype_index
                case 1 {
                    _offset := sol_tuple_nextOffset(content_ptr, content_len, ___ttypes, add(i, 1))
                }
                default {
                    _offset := add(content_ptr, mul(arity, i))
                }
            }
        }

        function copy_env(env_ptr) -> new_ptr {
            let arity := mload(env_ptr)
            new_ptr := allocate(add(32, mul(32, arity)))
            mstore(new_ptr, arity)

            let pos_ptr := add(new_ptr, 32)
            let _orig_ptr := add(env_ptr, 32)
            for { let i := 0 } lt(i, arity) { i := add(i, 1) } {
                mstore(pos_ptr, mload(_orig_ptr))
                pos_ptr := add(pos_ptr, 32)
                _orig_ptr := add(_orig_ptr, 32)
            }
        }

        function meld_env(target_ptr, source_ptr) {
            let arity := mload(source_ptr)
            let offset := 32
            for { let i := 0 } lt(i, arity) { i := add(i, 1) } {
                let val_ptr := mload(add(source_ptr, offset))
                if gt(val_ptr, 0) {
                    mstore(add(target_ptr, offset), val_ptr)
                }
                offset := add(offset, 32)
            }
            let old_arity := mload(target_ptr)
            mstore(target_ptr, max(arity, old_arity))
            if gt(arity, old_arity) {
                let temp := allocate(mul(32, sub(arity, old_arity)))
            }
        }

        function addto_env(env_ptr, index, var_ptr) {
            let arity := mload(env_ptr)
            let index_ptrs := add(env_ptr, 32)
            mstore(
                add(index_ptrs, mul(index, 32)),
                var_ptr
            )

            // we assume addto_env always comes after a copy_env or meld_env
            if or(eq(index, arity), gt(index, arity)) {
                let new_arity := add(index, 1)
                mstore(env_ptr, new_arity)
                let temp_ptr := allocate(mul(32, sub(new_arity, arity)))
            }
        }

        function if_(condition, __branch1, __branch2, env_ptr) -> _result {
            switch condition
            case 0 {
                let act_end, act_ptr := eval(tn_ptr_(__branch2), env_ptr, 0)
                _result := act_ptr
            }
            default {
                let act_end, act_ptr := eval(tn_ptr_(__branch1), env_ptr, 0)
                _result := act_ptr
            }
        }
    }}
}
