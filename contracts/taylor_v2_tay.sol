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
        
        let _calldata := allocate(calldatasize())
        calldatacopy(_calldata, 0, calldatasize())

        // setTxGas()
        let end, response := eval(_calldata, 0, 0)
        // pay if not owner
        // payForSave()

        mstore(0, response)
        return (0, 32)

        
        return (response, getTypedLength(response))
        
        function eval(data_ptr, env_ptr, value_to_ptr) -> end_ptr, result_ptr {
            let isprocessed := 0
            let sig4b := get4b(data_ptr)
            let rootid := getRootId(sig4b)
            
            switch rootid
            // function
            case 3 {
                let sig := get8b(data_ptr)
                end_ptr := add(data_ptr, 8)
                let arity := getFuncArity(sig4b)
                
                // If function is tuple__
                value_to_ptr := eq(and(sig, 0xffffffff), 0x4c)
                
                // allocate arity number of slots for argument pointers
                let args_ptrs := allocate(mul(add(arity, 1), 32))
                
                // first argument is the number of arguments
                // for variadic functions
                mstore(args_ptrs, arity)
                let args_ptrs_now := add(args_ptrs, 32)

                for { let i := 0 } lt(i, arity) { i := add(i, 1) } {
                    let _end_ptr, arg_ptr := eval(end_ptr, env_ptr, value_to_ptr)
                    
                    // store pointer to argument value
                    mstore(args_ptrs_now, arg_ptr)
                    end_ptr := _end_ptr
                    args_ptrs_now := add(args_ptrs_now, 32)
                }

                let isnative := isFunctionNative(sig4b)
                if isnative {
                    isprocessed := 1
                    result_ptr := evalNativeFunc(sig, args_ptrs)
                }
            }
            // bytelike
            case 4 {
                let value_length := get4b(add(data_ptr, 4))
                let _ptr := allocate(value_length)
                mmultistore(_ptr, add(data_ptr, 8), value_length)
                result_ptr := t2__(_ptr, value_length)
                end_ptr := add(add(data_ptr, 8), value_length)
            }
            default {
                // untyped evm uint
                result_ptr := _mload(data_ptr)
                end_ptr := add(data_ptr, 32)

                // If we need to transform values into pointers (t2)
                if value_to_ptr {
                    let _ptr := allocate(32)
                    mstore(_ptr, result_ptr)
                    result_ptr := t2__(_ptr, 32)
                }
            }
        }
        
        function untypedEval(fsig, arg_ptrs_ptr, env_ptr) -> result_ptr {
            switch fsig

            // store!
            case 0x0000000000000001 {
            }

            // sload
            case 0x0000000000000002 {
            }

            // def-untyped!
            case 0x0000000000000003 {
                let name_len := mslice(arg_ptrs_ptr, 4)
                let name_ptr := add(arg_ptrs_ptr, 4)
                let to_be_saved := add(name_ptr, name_len)
                
                // insert alias
                let super_type := add(to_be_saved, 8) // len + list
                let st := mslice(super_type, 8)
                let signature := 0x0000000000000000
                let index := 1
                
                // if eq(_nil_q(super_type), 0) {
                    index := sload(mappingStorageKey(2, st))
                    index := add(index, 1)
                    signature := buildSig(st, index)

                    // mstore(0, signature)
                    // return (0, 32)

                    let datalen := mslice(to_be_saved, 4)
                    mslicestore(
                        add(to_be_saved, datalen),
                        index,
                        4
                    )
                    mstorehead(to_be_saved, add(datalen, 4), 4)
                // }
                
                let key := mappingStorageKey(1, signature)
                storeData(to_be_saved, key)

                sstore(mappingStorageKey(2, st), index)
            }

            // def-untyped
            case 0x0000000000000004 {
                let signature := get8b(arg_ptrs_ptr)
                result_ptr := _dtype(signature)
            }

            default {
                dtrequire(1, 0xe013)
            }
        }

        function buildSig(signature, index) -> _id {
            // mstore(0, signature)
            // return (0, 32)
            let super_data := _dtype(signature)
            let data_len := mslice(super_data, 4)
            if gt(data_len, 0) {
                super_data := add(super_data, 4) // length

                // return (add(super_data, sub(data_len, 16)), 96)
                let parent_sig := mslice(add(super_data, 4), 8)
                // let index2 := mslice(add(super_data, sub(data_len, 4)), 4)
                let index2 := mslice(add(super_data, sub(data_len, 16)), 16)

                // mstore(0, parent_sig)
                // return (0, 32)

                
                let root_id := buildSig(parent_sig, index2)

                // mstore(0, root_id)
                // return (0, 32)
                let shfts := mslice(add(super_data, 24), 4)

                // mstore(0, shfts)
                // return (0, 32)

                _id := add(root_id, shl(shfts, index))
            }
        }

        function _dtype(signature) -> result_ptr {
            let key := mappingStorageKey(1, signature)
            result_ptr := freeMemPtr()
            getStoredData(result_ptr, key)

            let len := mslice(result_ptr, 4)
            result_ptr := allocate(add(len, 4))
        }

        function _nil_q(data_ptr) -> isnil {
            isnil := eq(mslice(data_ptr, 8), 0x0000000000000000)
        }

        function _store(key, data_ptr) -> result_ptr {
            let data_len := mslice(data_ptr, 4)

            // storeDataInner(add(data_ptr, sig_len), key, data_len)
        }

        function getRootId(sig4b) -> _rootid {
            _rootid := shr(28, sig4b)
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

        function getTypedLength(data_ptr) -> len {
            len := 96
        }

        function get4b(ptr) -> _sig {
            _sig := mslice(ptr, 4)
        }

        function get8b(ptr) -> _sig {
            _sig := mslice(ptr, 8)
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
          if gt(length, 32) { revert(0, 0) } // protect against overflow
        
          result := shr(sub(256, mul(length, 8)), _mload(position))
        }

        function freeMemPtr() -> ptr {
            ptr := _mload(0x40)
            if iszero(ptr) { ptr := 0xc0 } // 192
        }
        
        function allocate(size) -> ptr {
            ptr := freeMemPtr()
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

        function mslicestore(_ptr, val, length) {
            let slot := 32
            mstore(_ptr, shl(mul(sub(slot, length), 8), val))
        }

        // Use carefully - replaces head bytes in a byte32 chunk
        function mstorehead(_ptr, value, length) {
            let slot := 32
            let temp := add(
                mslice(add(_ptr, length), sub(slot, length)),
                shl(mul(sub(slot, length), 8), value)
            )
            mstore(_ptr, temp)
        }

        function mmultistore(_ptr_target, _ptr_source, sizeBytes) {
            if gt(sizeBytes, 0) {
                let slot := 32
                let storedBytes := 0

                for {} lt(storedBytes, sizeBytes) {} {
                    let remaining := sub(sizeBytes, storedBytes)
                    switch gt(remaining, 31)
                    case 1 {
                        mstore(add(_ptr_target, storedBytes), _mload(add(_ptr_source, storedBytes)))
                        storedBytes := add(storedBytes, 32)
                    }
                    case 0 {
                        mslicestore(
                            add(_ptr_target, storedBytes),
                            mslice(add(_ptr_source, storedBytes), remaining),
                            remaining
                        )
                        storedBytes := add(storedBytes, remaining)
                    }
                }
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
                    sstore(add(storageKey, index), _mload(add(_pointer, storedBytes)))
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

        function dtrequire(cond, error_bytes) {
            if eq(cond, 0) {
                mslicestore(0, error_bytes, 2)
                revert(0, 2)
            }
        }

        function evalNativeFunc(fsig, arg_ptrs_ptr) -> _result {
            switch fsig

            case 0x3400100200000001 {
                let a := _mload(add(arg_ptrs_ptr, 32))
                let b := _mload(add(arg_ptrs_ptr, 64))
                _result := add(a, b)
            }
            case 0x3400100200000002 {
                let a := _mload(add(arg_ptrs_ptr, 32))
                let b := _mload(add(arg_ptrs_ptr, 64))
                _result := sub(a, b)
            }
            case 0x3400100200000003 {
                let a := _mload(add(arg_ptrs_ptr, 32))
                let b := _mload(add(arg_ptrs_ptr, 64))
                _result := mul(a, b)
            }
            case 0x3400100200000004 {
                let a := _mload(add(arg_ptrs_ptr, 32))
                let b := _mload(add(arg_ptrs_ptr, 64))
                _result := div(a, b)
            }
            case 0x3400100200000005 {
                let a := _mload(add(arg_ptrs_ptr, 32))
                let b := _mload(add(arg_ptrs_ptr, 64))
                _result := sdiv(a, b)
            }
            case 0x3400100200000006 {
                let a := _mload(add(arg_ptrs_ptr, 32))
                let b := _mload(add(arg_ptrs_ptr, 64))
                _result := mod(a, b)
            }
            case 0x3400100200000007 {
                let a := _mload(add(arg_ptrs_ptr, 32))
                let b := _mload(add(arg_ptrs_ptr, 64))
                _result := smod(a, b)
            }
            case 0x3400100200000008 {
                let a := _mload(add(arg_ptrs_ptr, 32))
                let b := _mload(add(arg_ptrs_ptr, 64))
                _result := exp(a, b)
            }
            case 0x3400080100000009 {
                let a := _mload(add(arg_ptrs_ptr, 32))
                _result := not(a)
            }
            case 0x340010020000000a {
                let a := _mload(add(arg_ptrs_ptr, 32))
                let b := _mload(add(arg_ptrs_ptr, 64))
                _result := lt(a, b)
            }
            case 0x340010020000000b {
                let a := _mload(add(arg_ptrs_ptr, 32))
                let b := _mload(add(arg_ptrs_ptr, 64))
                _result := gt(a, b)
            }
            case 0x340010020000000c {
                let a := _mload(add(arg_ptrs_ptr, 32))
                let b := _mload(add(arg_ptrs_ptr, 64))
                _result := slt(a, b)
            }
            case 0x340010020000000d {
                let a := _mload(add(arg_ptrs_ptr, 32))
                let b := _mload(add(arg_ptrs_ptr, 64))
                _result := sgt(a, b)
            }
            case 0x340010020000000e {
                let a := _mload(add(arg_ptrs_ptr, 32))
                let b := _mload(add(arg_ptrs_ptr, 64))
                _result := eq(a, b)
            }
            case 0x340008010000000f {
                let a := _mload(add(arg_ptrs_ptr, 32))
                _result := iszero(a)
            }
            case 0x3400100200000010 {
                let a := _mload(add(arg_ptrs_ptr, 32))
                let b := _mload(add(arg_ptrs_ptr, 64))
                _result := and(a, b)
            }
            case 0x3400100200000011 {
                let a := _mload(add(arg_ptrs_ptr, 32))
                let b := _mload(add(arg_ptrs_ptr, 64))
                _result := or(a, b)
            }
            case 0x3400100200000012 {
                let a := _mload(add(arg_ptrs_ptr, 32))
                let b := _mload(add(arg_ptrs_ptr, 64))
                _result := xor(a, b)
            }
            case 0x3400100200000013 {
                let a := _mload(add(arg_ptrs_ptr, 32))
                let b := _mload(add(arg_ptrs_ptr, 64))
                _result := byte(a, b)
            }
            case 0x3400100200000014 {
                let a := _mload(add(arg_ptrs_ptr, 32))
                let b := _mload(add(arg_ptrs_ptr, 64))
                _result := shl(a, b)
            }
            case 0x3400100200000015 {
                let a := _mload(add(arg_ptrs_ptr, 32))
                let b := _mload(add(arg_ptrs_ptr, 64))
                _result := shr(a, b)
            }
            case 0x3400100200000016 {
                let a := _mload(add(arg_ptrs_ptr, 32))
                let b := _mload(add(arg_ptrs_ptr, 64))
                _result := sar(a, b)
            }
            case 0x3400180300000017 {
                let a := _mload(add(arg_ptrs_ptr, 32))
                let b := _mload(add(arg_ptrs_ptr, 64))
                let c := _mload(add(arg_ptrs_ptr, 96))
                _result := addmod(a, b, c)
            }
            case 0x3400180300000018 {
                let a := _mload(add(arg_ptrs_ptr, 32))
                let b := _mload(add(arg_ptrs_ptr, 64))
                let c := _mload(add(arg_ptrs_ptr, 96))
                _result := mulmod(a, b, c)
            }
            case 0x3400100200000019 {
                let a := _mload(add(arg_ptrs_ptr, 32))
                let b := _mload(add(arg_ptrs_ptr, 64))
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
                let addr := _mload(add(arg_ptrs_ptr, 32))
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
                let pos := _mload(add(arg_ptrs_ptr, 32))
                _result := calldataload(pos)
            }
            case 0x3400000000000020 {
                _result := calldatasize()
            }
            case 0x3400000000000021 {
                _result := codesize()
            }
            case 0x3400080100000022 {
                let addr := _mload(add(arg_ptrs_ptr, 32))
                _result := extcodesize(addr)
            }
            case 0x3400000000000023 {
                _result := returndatasize()
            }
            case 0x3400080100000024 {
                let addr := _mload(add(arg_ptrs_ptr, 32))
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
                let block_number := _mload(add(arg_ptrs_ptr, 32))
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
                let x := _mload(add(arg_ptrs_ptr, 32))
                pop(x)
            }
            case 0x340000000000002f {
                _result := msize()
            }
            case 0x3400080100000030 {
                // mload_
                let _ptr := _mload(add(arg_ptrs_ptr, 32))
                _result := _mload(_ptr)
            }
            case 0x3400080100000031 {
                // _sload
                let key := _mload(add(arg_ptrs_ptr, 32))
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
                _result := create(value, t12_(code_ptr), t21_(code_ptr))
            }
            case 0x3400180300000037 {
                // create2_
                let value := mload(add(arg_ptrs_ptr, 32))
                let code_ptr := mload(add(arg_ptrs_ptr, 64))
                let s := mload(add(arg_ptrs_ptr, 96))
                _result := create2(value, t12_(code_ptr), t21_(code_ptr), s)
            }
            case 0x3400000000000038 {
                // log
            }
            case 0x3400080100000039 {
                let t2_ptr := _mload(add(arg_ptrs_ptr, 32))
                _result := keccak256(t12_(t2_ptr), t21_(t2_ptr))
            }
            case 0x340010020000003a {
                // sstore_
                let key := _mload(add(arg_ptrs_ptr, 32))
                let value := _mload(add(arg_ptrs_ptr, 64))
                sstore(key, value)
                _result := key
            }
            case 0x340008010000003b {
                // mstore__
                let value := _mload(add(arg_ptrs_ptr, 32))
                let _ptr := allocate(32)
                mstore(_ptr, value)
                _result := t2__(_ptr, 32)
            }
            case 0x340008010000003c {
                let value := _mload(add(arg_ptrs_ptr, 32))
                let _ptr := allocate(1)
                mstore8(_ptr, and(value, 0xff))
                _result := t2__(_ptr, 1)
            }
            case 0x340008010000003d {
                // calldatacopy__
                let calld__ := _mload(add(arg_ptrs_ptr, 32))
                let calld_ptr := t12_(calld__)
                let calld_len := t21_(calld__)
                let mem_ptr := allocate(calld_len)
                calldatacopy(mem_ptr, calld_ptr, calld_len)
                _result := t2__(mem_ptr, calld_len)
            }
            case 0x340008010000003e {
                // codecopy__
                let calld__ := _mload(add(arg_ptrs_ptr, 32))
                let calld_ptr := t12_(calld__)
                let calld_len := t21_(calld__)
                let mem_ptr := allocate(calld_len)
                codecopy(mem_ptr, calld_ptr, calld_len)
                _result := t2__(mem_ptr, calld_len)
            }
            case 0x340010020000003f {
                // extcodecopy__
                let addr := _mload(add(arg_ptrs_ptr, 32))
                let calld__ := _mload(add(arg_ptrs_ptr, 64))
                let calld_ptr := t12_(calld__)
                let calld_len := t21_(calld__)
                let mem_ptr := allocate(calld_len)
                extcodecopy(addr, mem_ptr, calld_ptr, calld_len)
                _result := t2__(mem_ptr, calld_len)
            }
            case 0x3400080100000040 {
                // returndatacopy__
                let data__ := _mload(add(arg_ptrs_ptr, 32))
                let data_ptr := t12_(data__)
                let data_len := t21_(data__)
                let mem_ptr := allocate(data_len)
                returndatacopy(mem_ptr, data_ptr, data_len)
                _result := t2__(mem_ptr, data_len)
            }
            case 0x3400080100000041 {
                let t2_1 := _mload(add(arg_ptrs_ptr, 32))
                revert_(t2_1)
            }
            case 0x3400080100000042 {
                let t2_1 := _mload(add(arg_ptrs_ptr, 32))
                return_(t2_1)
            }
            case 0x3400080100000043 {
                let addr := _mload(add(arg_ptrs_ptr, 32))
                selfdestruct(addr)
            }
            case 0x3400000000000044 {
                invalid()
            }
            case 0x3400000000000045 {
                stop()
            }
            case 0x3400180300000046 {
                let cond := _mload(add(arg_ptrs_ptr, 32))
                let branch1 := _mload(add(arg_ptrs_ptr, 64))
                let branch2 := _mload(add(arg_ptrs_ptr, 96))
                _result := branch1
                if eq(cond, 0) {
                    _result := branch2
                }
            }
            case 0x3400100200000047 {
                let t1_1 := _mload(add(arg_ptrs_ptr, 32))
                let t1_2 := _mload(add(arg_ptrs_ptr, 64))
                _result := t2__(t1_1, t1_2)
            }
            case 0x3400080100000048 {
                let t2_1 := _mload(add(arg_ptrs_ptr, 32))
                _result := t12_(t2_1)
            }
            case 0x3400080100000049 {
                let t2_1 := _mload(add(arg_ptrs_ptr, 32))
                _result := t21_(t2_1)
            }
            case 0x340010020000004b {
                let __ptr1 := _mload(add(arg_ptrs_ptr, 32))
                let __ptr2 := _mload(add(arg_ptrs_ptr, 64))
                _result := join__(__ptr1, __ptr2)
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
                
                // tuple__
                case 0x4c {
                    let arity := mload(arg_ptrs_ptr)
                    _result := tuple__(arity, add(arg_ptrs_ptr, 32))
                }
                default {
                    dtrequire(0, 0xeeff)
                }
            }
        }

        function t2__(ptr, len) -> _result {
            _result := allocate(64)
            mstore(_result, ptr)
            mstore(add(_result, 32), len)
        }

        function t12_(t2_1) -> _result {
            _result := _mload(t2_1)
        }

        function t21_(t2_1) -> _result {
            _result := _mload(add(t2_1, 32))
        }

        function return_(t2_1) {
            return(t12_(t2_1), t21_(t2_1))
        }

        function revert_(t2_1) {
            revert(t12_(t2_1), t21_(t2_1))
        }

        function _mload(_ptr) -> _result {
            // let maxsize := msize()
            // if gt(maxsize, 0) {
            //     dtrequire(lt(_ptr, msize()), 0xeeee)
            // }
            _result := mload(_ptr)

            // mstore(0, msize())
            // mstore(32, _ptr)
            // return (0, 64)
        }

        function join__(__ptr1, __ptr2) -> __ptr3 {
            let len1 := t21_(__ptr1)
            let len2 := t21_(__ptr2)
            let len := add(len1, len2)
            let ptr3 := allocate(len)
            mmultistore(ptr3, t12_(__ptr1), len1)
            mmultistore(add(ptr3, len1), t12_(__ptr2), len2)
            __ptr3 := t2__(ptr3, len)
        }

        function call_bang__(addr, value, data_ptr) -> __ptr {
            let success := call(gas(), addr, value, t12_(data_ptr), t21_(data_ptr), 0, 0)
            
            if eq(success, 0) {
                fail_call(addr, data_ptr)
            }
            __ptr := success_call()
        }

        function callcode_bang__(addr, value, data_ptr) -> __ptr {
            let success := callcode(gas(), addr, value, t12_(data_ptr), t21_(data_ptr), 0, 0)
            
            if eq(success, 0) {
                fail_call(addr, data_ptr)
            }
            __ptr := success_call()
        }

        function delegatecall_bang__(addr, data_ptr) -> __ptr {
            let success := delegatecall(gas(), addr, t12_(data_ptr), t21_(data_ptr), 0, 0)
            
            if eq(success, 0) {
                fail_call(addr, data_ptr)
            }
            __ptr := success_call()
        }

        function call__(addr, data_ptr) -> __ptr {
            let success := staticcall(gas(), addr, t12_(data_ptr), t21_(data_ptr), 0, 0)

            if eq(success, 0) {
                fail_call(addr, data_ptr)
            }
            __ptr := success_call()
        }

        function success_call() -> __ptr {
            let outsize := returndatasize()
            let result_ptr := allocate(outsize)
            returndatacopy(result_ptr, 0, outsize)
            __ptr := t2__(result_ptr, outsize)
        }

        function fail_call(addr, data_ptr) {
            let error_msg := allocate(26)
            mslicestore(error_msg, uconcat(0xeedd, addr, 20), 22)
            mslicestore(add(error_msg, 22), mslice(t12_(data_ptr), 4), 4)
            revert(error_msg, 26)
        }

        function log_(arity, __data_ptr, topic_ptrs) {
            let data_ptr := t12_(__data_ptr)
            let data_len := t21_(__data_ptr)
            
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

        function tuple__(arity, arg_ptrs) -> result_ptr__{
            let _ptr := freeMemPtr()
            let last_offset := mul(arity, 32)

            for { let i := 0 } lt(i, arity) { i := add(i, 1) } {
                let arg_ptr__ := mload(add(arg_ptrs, mul(i, 32)))
                let arg_len := t21_(arg_ptr__)
                let head_ptr := add(_ptr, mul(i, 32))

                switch arg_len
                case 32 {
                    mstore(head_ptr, mload(t12_(arg_ptr__)))
                }
                default {
                    mstore(head_ptr, last_offset)
                    mstore(add(_ptr, last_offset), arg_len)
                    last_offset := add(last_offset, 32)

                    mmultistore(add(_ptr, last_offset), t12_(arg_ptr__), arg_len)
                    last_offset := add(last_offset, arg_len)

                    // Padd with zeros up to 32 bytes
                    let padd := sub(32, mod(arg_len, 32))
                    mstore(add(_ptr, last_offset), 0)
                    last_offset := add(last_offset, padd)
                }
            }
            _ptr := allocate(last_offset)
            result_ptr__ := t2__(_ptr, last_offset)
        }
    }}
}
