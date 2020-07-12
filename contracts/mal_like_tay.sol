object "Taylor" {
    code {
        // updateFnCounter
        sstore(0, 100)
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

        // get func
        if eq(mslice(_calldata, 4), 0x44444443) {
            let sig := mslice(add(_calldata, 4), 4)
            let ptr := getFn(sig)
            return (add(ptr, 4), mslice(ptr, 4))
        }

        if eq(mslice(_calldata, 4), 0x44444442) {
            let name := mload(add(_calldata, 4))
            let ptr := getFnByName(name)
            return (add(ptr, 4), mslice(ptr, 4))
        }

        // get function count
        if eq(mslice(_calldata, 4), 0x44444441) {
            let count := getFnCounter()
            mstore(0, count)
            return (0, 32)
        }

        // get registered count
        if eq(mslice(_calldata, 4), 0x44444440) {
            let count := getRegCounter()
            mstore(0, count)
            return (0, 32)
        }
        
        setTxGas()
        let end, response := eval(_calldata, 0)
        // pay if not owner
        payForSave()
        return (response, getTypedLength(response))
        
        function eval(data_ptr, env_ptr) -> end_ptr, result_ptr {
            let sig := get4b(data_ptr)

            switch isFunction(data_ptr)
            case 0 {
                switch isLambdaUnknown(mslice(data_ptr, 4))
                case 1 {
                    // replace variables from lambdas
                    let index := mslice(add(data_ptr, 4), 4)
                    let value_ptr := add(add(env_ptr, 32), mul(index, 32))
                    result_ptr := mload(value_ptr)
                    end_ptr := add(data_ptr, 8)
                }
                case 0 {
                    let size := getTypedLength(data_ptr)
                    result_ptr := data_ptr
                    end_ptr := add(data_ptr, size)
                }
            }
            case 1 {
                let arity := getFuncArity(data_ptr)
                
                // allocate arity number of slots for argument pointers
                let args_ptrs := allocate(mul(add(arity, 1), 32))
                
                // first argument is the number of arguments
                // for variadic functions
                mstore(args_ptrs, arity)
                let args_ptrs_now := add(args_ptrs, 32)

                // TODO: assumes signature length is 4
                end_ptr := add(data_ptr, 4)

                let isl := isLambda(sig)
                switch isl
                case 1 {
                    // don't to anything
                    // lambdas can be returned from functions as they are
                    result_ptr := data_ptr
                    end_ptr := add(end_ptr, lambdaLength(sig))
                }
                case 0 {
                    let isIf := eq(sig, 0x9800004a)
                    switch isIf
                    case 0 {
                        let isLet := eq(sig, 0x90000060)
                        switch isLet
                        case 1 {
                            let _end_ptr, _result_ptr := _let_asterix(end_ptr, env_ptr)
                            end_ptr := _end_ptr
                            result_ptr := _result_ptr
                        }
                        default {
                            for { let i := 0 } lt(i, arity) { i := add(i, 1) } {
                                let _end_ptr, arg_ptr := eval(end_ptr, env_ptr)
                                // store pointer to argument value
                                mstore(args_ptrs_now, arg_ptr)
                                end_ptr := _end_ptr
                                args_ptrs_now := add(args_ptrs_now, 32)
                            }

                            // apply function on arguments
                            result_ptr := evalWithEnv(sig, args_ptrs, env_ptr)
                        }
                    }
                    case 1 {
                        let _end_ptr, _result_ptr := _if(end_ptr, env_ptr)
                        end_ptr := _end_ptr
                        result_ptr := _result_ptr
                    }
                }
            }
        }
        
        function evalWithEnv(fsig, arg_ptrs_ptr, env_ptr) -> result_ptr {
            switch fsig

            // 10010000000000000000000000000010
            case 0x90000002 {
                let ptr1 := mload(add(arg_ptrs_ptr, 32))
                let ptr2 := mload(add(arg_ptrs_ptr, 64))
                result_ptr := _add(ptr1, ptr2)
            }
            // 10010000000000000000000000000100
            case 0x90000004 {
                let ptr1 := mload(add(arg_ptrs_ptr, 32))
                let ptr2 := mload(add(arg_ptrs_ptr, 64))
                result_ptr := _sub(ptr1, ptr2)
            }
            case 0x90000006 {
                let ptr1 := mload(add(arg_ptrs_ptr, 32))
                let ptr2 := mload(add(arg_ptrs_ptr, 64))
                result_ptr := _mul(ptr1, ptr2)
            }
            case 0x90000008 {
                let ptr1 := mload(add(arg_ptrs_ptr, 32))
                let ptr2 := mload(add(arg_ptrs_ptr, 64))
                result_ptr := _div(ptr1, ptr2)
            }
            case 0x9000000a {
                let ptr1 := mload(add(arg_ptrs_ptr, 32))
                let ptr2 := mload(add(arg_ptrs_ptr, 64))
                result_ptr := _sdiv(ptr1, ptr2)
            }
            case 0x9000000c {
                let ptr1 := mload(add(arg_ptrs_ptr, 32))
                let ptr2 := mload(add(arg_ptrs_ptr, 64))
                result_ptr := _mod(ptr1, ptr2)
            }
            case 0x9000000e {
                let ptr1 := mload(add(arg_ptrs_ptr, 32))
                let ptr2 := mload(add(arg_ptrs_ptr, 64))
                result_ptr := _smod(ptr1, ptr2)
            }
            case 0x90000010 {
                let ptr1 := mload(add(arg_ptrs_ptr, 32))
                let ptr2 := mload(add(arg_ptrs_ptr, 64))
                result_ptr := _exp(ptr1, ptr2)
            }
            case 0x88000012 {
                let ptr1 := mload(add(arg_ptrs_ptr, 32))
                result_ptr := _not(ptr1)
            }
            case 0x90000014 {
                let ptr1 := mload(add(arg_ptrs_ptr, 32))
                let ptr2 := mload(add(arg_ptrs_ptr, 64))
                result_ptr := _lt(ptr1, ptr2)
            }
            case 0x90000016 {
                let ptr1 := mload(add(arg_ptrs_ptr, 32))
                let ptr2 := mload(add(arg_ptrs_ptr, 64))
                result_ptr := _gt(ptr1, ptr2)
            }
            case 0x90000018 {
                let ptr1 := mload(add(arg_ptrs_ptr, 32))
                let ptr2 := mload(add(arg_ptrs_ptr, 64))
                result_ptr := _slt(ptr1, ptr2)
            }
            case 0x9000001a {
                let ptr1 := mload(add(arg_ptrs_ptr, 32))
                let ptr2 := mload(add(arg_ptrs_ptr, 64))
                result_ptr := _sgt(ptr1, ptr2)
            }
            case 0x9000001c {
                let ptr1 := mload(add(arg_ptrs_ptr, 32))
                let ptr2 := mload(add(arg_ptrs_ptr, 64))
                result_ptr := _eq(ptr1, ptr2)
            }
            case 0x8800001e {
                let ptr1 := mload(add(arg_ptrs_ptr, 32))
                result_ptr := _iszero(ptr1)
            }
            case 0x90000020 {
                let ptr1 := mload(add(arg_ptrs_ptr, 32))
                let ptr2 := mload(add(arg_ptrs_ptr, 64))
                result_ptr := _and(ptr1, ptr2)
            }
            case 0x90000022 {
                let ptr1 := mload(add(arg_ptrs_ptr, 32))
                let ptr2 := mload(add(arg_ptrs_ptr, 64))
                result_ptr := _or(ptr1, ptr2)
            }
            case 0x90000024 {
                let ptr1 := mload(add(arg_ptrs_ptr, 32))
                let ptr2 := mload(add(arg_ptrs_ptr, 64))
                result_ptr := _xor(ptr1, ptr2)
            }
            case 0x90000026 {
                let ptr1 := mload(add(arg_ptrs_ptr, 32))
                let ptr2 := mload(add(arg_ptrs_ptr, 64))
                result_ptr := _byte(ptr1, ptr2)
            }
            case 0x90000028 {
                let ptr1 := mload(add(arg_ptrs_ptr, 32))
                let ptr2 := mload(add(arg_ptrs_ptr, 64))
                result_ptr := _shl(ptr1, ptr2)
            }
            case 0x9000002a {
                let ptr1 := mload(add(arg_ptrs_ptr, 32))
                let ptr2 := mload(add(arg_ptrs_ptr, 64))
                result_ptr := _shr(ptr1, ptr2)
            }
            case 0x9000002c {
                let ptr1 := mload(add(arg_ptrs_ptr, 32))
                let ptr2 := mload(add(arg_ptrs_ptr, 64))
                result_ptr := _sar(ptr1, ptr2)
            }
            case 0x9800002e {
                let ptr1 := mload(add(arg_ptrs_ptr, 32))
                let ptr2 := mload(add(arg_ptrs_ptr, 64))
                let ptr3 := mload(add(arg_ptrs_ptr, 96))
                result_ptr := _addmod(ptr1, ptr2, ptr3)
            }
            case 0x98000030 {
                let ptr1 := mload(add(arg_ptrs_ptr, 32))
                let ptr2 := mload(add(arg_ptrs_ptr, 64))
                let ptr3 := mload(add(arg_ptrs_ptr, 96))
                result_ptr := _mulmod(ptr1, ptr2, ptr3)
            }
            case 0x90000032 {
                let ptr1 := mload(add(arg_ptrs_ptr, 32))
                let ptr2 := mload(add(arg_ptrs_ptr, 64))
                result_ptr := _signextend(ptr1, ptr2)
            }
            case 0x90000036 {
                result_ptr := _call(add(arg_ptrs_ptr, 32))
            }
            case 0x90000038 {
                result_ptr := _callcode(add(arg_ptrs_ptr, 32))
            }
            case 0x9000003a {
                result_ptr := _delegatecall(add(arg_ptrs_ptr, 32))
            }
            case 0x9000003c {
                result_ptr := _staticcall(add(arg_ptrs_ptr, 32))
            }
            case 0x800000c6 {
                result_ptr := allocate(36)
                mslicestore(result_ptr, buildUintSig(32), 4)
                mstore(add(result_ptr, 4), gas())
            }
            // address
            case 0x800000c8 {
                result_ptr := allocate(32)
                mslicestore(result_ptr, uconcat(buildBytesSig(20), address(), 20), 24)
            }
            // balance ; TODO address
            case 0x880000ca {
                result_ptr := allocate(36)
                let addr_ptr := mload(add(arg_ptrs_ptr, 32))
                let addr := mslice(add(addr_ptr, 4), getValueLength(addr_ptr))

                mslicestore(result_ptr, buildUintSig(32), 4)
                mstore(add(result_ptr, 4), balance(addr))
            }
            // caller ; TODO address
            case 0x800000cc {
                result_ptr := allocate(32)
                mslicestore(result_ptr, uconcat(buildBytesSig(20), caller(), 20), 24)
            }
            case 0x800000ce {
                result_ptr := allocate(36)
                mslicestore(result_ptr, buildUintSig(32), 4)
                mstore(add(result_ptr, 4), callvalue())
            }
            case 0x800000d0 {
                // calldataload
            }
            case 0x800000d2 {
                result_ptr := allocate(36)
                mslicestore(result_ptr, buildUintSig(32), 4)
                mstore(add(result_ptr, 4), calldatasize())
            }
            case 0x980000d4 {
                // calldatacopy
            }
            case 0x800000d6 {
                result_ptr := allocate(36)
                mslicestore(result_ptr, buildUintSig(32), 4)
                mstore(add(result_ptr, 4), codesize())
            }
            case 0x980000d8 {
                // codecopy
            }
            case 0x880000da {
                result_ptr := allocate(36)
                let addr_ptr := mload(add(arg_ptrs_ptr, 32))
                let addr := mslice(add(addr_ptr, 4), getValueLength(addr_ptr))
                
                mslicestore(result_ptr, buildUintSig(32), 4)
                mstore(add(result_ptr, 4), extcodesize(addr))
            }
            case 0xa00000dc {
                // extcodecopy
            }
            case 0x800000de {
                result_ptr := allocate(36)
                mslicestore(result_ptr, buildUintSig(32), 4)
                mstore(add(result_ptr, 4), returndatasize())
            }
            case 0x980000e4 {
                // create
            }
            case 0xa00000e6 {
                // create2
            }
            // TODO: logs should be under 1 function: log(data, list(..topics))
            case 0x900000e8 {
                // log0
            }
            case 0x980000ea {
                // log1
            }
            case 0xa00000ec {
                // log2
            }
            case 0xa80000ee {
                // log3
            }
            case 0xb00000f0 {
                // log4
            }
            // case 0x800000f2 {
            //     result_ptr := allocate(32)
            //     mslicestore(result_ptr, uconcat(buildUintSig(4), chainid(), 4), 8)
            // }
            // origin ; TODO address
            case 0x800000f4 {
                result_ptr := allocate(32)
                mslicestore(result_ptr, uconcat(buildBytesSig(20), origin(), 20), 24)
            }
            case 0x800000f6 {
                result_ptr := allocate(36)
                let number_ptr := mload(add(arg_ptrs_ptr, 32))
                let block_number := mslice(add(number_ptr, 4), getValueLength(number_ptr))
                mslicestore(result_ptr, buildBytesSig(32), 4)
                mstore(add(result_ptr, 4), blockhash(block_number))
            }
            case 0x800000f8 {
                result_ptr := allocate(32)
                mslicestore(result_ptr, uconcat(buildBytesSig(20), coinbase(), 20), 24)
            }
            case 0x800000fa {
                result_ptr := allocate(36)
                mslicestore(result_ptr, buildUintSig(32), 4)
                mstore(add(result_ptr, 4), timestamp())
            }
            case 0x800000fc {
                result_ptr := allocate(36)
                mslicestore(result_ptr, buildUintSig(32), 4)
                mstore(add(result_ptr, 4), number())
            }
            case 0x800000fe {
                result_ptr := allocate(36)
                mslicestore(result_ptr, buildUintSig(32), 4)
                mstore(add(result_ptr, 4), difficulty())
            }
            case 0x80000100 {
                result_ptr := allocate(36)
                mslicestore(result_ptr, buildUintSig(32), 4)
                mstore(add(result_ptr, 4), gaslimit())
            }
            // def!
            case 0x90000046 {
                // TODO: encode mutability! 
                let arity := mload(arg_ptrs_ptr)
                let name := mload(mload(add(arg_ptrs_ptr, 32)))
                let expr_ptr := add(mload(add(arg_ptrs_ptr, 32)), 32)

                let signature := buildFnSig(arity, 0)
                storeFn(name, signature, expr_ptr)

                result_ptr := allocate(32)
                mslicestore(result_ptr, uconcat(0x0a910004, signature, 4), 8)
            }
            // 0x9800004a is _if
            case 0x9000004c {
                let ptr1 := mload(add(arg_ptrs_ptr, 32))
                let ptr2 := mload(add(arg_ptrs_ptr, 64))
                result_ptr := _contig(ptr1, ptr2)
            }
            case 0x9000004e {
                let ptr1 := mload(add(arg_ptrs_ptr, 32))
                let ptr2 := mload(add(arg_ptrs_ptr, 64))
                result_ptr := _concat(ptr1, ptr2)
            }
            case 0x98000052 {
                let fptr := mload(add(arg_ptrs_ptr, 32))
                let iter_ptr := mload(add(arg_ptrs_ptr, 64))
                let accum_ptr := mload(add(arg_ptrs_ptr, 96))
                result_ptr := _reduce(fptr, iter_ptr, accum_ptr, env_ptr)
            }
            case 0x90000054 {
                let list_ptr := mload(add(arg_ptrs_ptr, 32))
                let index_ptr := mload(add(arg_ptrs_ptr, 64))
                let index := mslice(add(index_ptr, 4), 4)
                result_ptr := _nth(list_ptr, index)
            }
            case 0x88000056 {
                let iter_ptr := mload(add(arg_ptrs_ptr, 32))
                result_ptr := _first(iter_ptr)
            }
            case 0x88000058 {
                let iter_ptr := mload(add(arg_ptrs_ptr, 32))
                result_ptr := _rest(iter_ptr)
            }
            case 0x8800005a {
                result_ptr := _empty(mload(add(arg_ptrs_ptr, 32)))
            }
            case 0x8800005c {
                result_ptr := _true(mload(add(arg_ptrs_ptr, 32)))
            }
            case 0x8800005e {
                result_ptr := _false(mload(add(arg_ptrs_ptr, 32)))
            }
            case 0x88000066 {
                let answ := _nil_q(mload(add(arg_ptrs_ptr, 32)))
                result_ptr := allocate(4)
                mslicestore(result_ptr, buildBoolSig(answ), 4)
            }
            case 0x88000068 {
                let answ := _list_q(mload(add(arg_ptrs_ptr, 32)))
                result_ptr := allocate(4)
                mslicestore(result_ptr, buildBoolSig(answ), 4)
            }
            case 0x8800006c {
                let answ := _array_q(mload(add(arg_ptrs_ptr, 32)))
                result_ptr := allocate(4)
                mslicestore(result_ptr, buildBoolSig(answ), 4)
            }
            case 0x8800006e {
                let answ := _sequential_q(mload(add(arg_ptrs_ptr, 32)))
                result_ptr := allocate(4)
                mslicestore(result_ptr, buildBoolSig(answ), 4)
            }
            // register!
            case 0x880000c0 {
                result_ptr := allocate(32)
                let index := storeRegAddress(mload(add(arg_ptrs_ptr, 32)))
            }
            // getregistered
            case 0x880000c2 {
                result_ptr := allocate(32)
                // TODO check type
                let index := mslice(add(mload(add(arg_ptrs_ptr, 32)), 4), 4)
                let addr := getRegAddress(index)
                mstore(result_ptr, addr)
            }
            case 0x90000102 {
                result_ptr := _save(add(arg_ptrs_ptr, 32))
            }
            case 0x90000104 {
                let typename_ptr := mload(add(arg_ptrs_ptr, 32))
                let index_ptr := mload(add(arg_ptrs_ptr, 64))
                result_ptr := _getfrom(typename_ptr, index_ptr)
            }
            // defstruct!
            case 0x900000c4 {
                let ssig := _defstruct_bang(add(arg_ptrs_ptr, 32))
                result_ptr := allocate(8)
                mslicestore(result_ptr, uconcat(buildBytesSig(4), ssig, 4), 8)
            }
            // struct
            case 0x90000106 {
                result_ptr := _struct(add(arg_ptrs_ptr, 32))
            }
            // struct!
            case 0x90000108 {
                let name_ptr := mload(add(arg_ptrs_ptr, 32))
                let valueslist_ptr := mload(add(arg_ptrs_ptr, 64))
                result_ptr := _struct_bang(name_ptr, valueslist_ptr)
            }
            case 0x9800010b {
                let structsig_ptr := mload(add(arg_ptrs_ptr, 32))
                let index_ptr := mload(add(arg_ptrs_ptr, 64))
                let data_ptr := mload(add(arg_ptrs_ptr, 96))
                result_ptr := _rcall(structsig_ptr, index_ptr, data_ptr)
            }
            case 0x9000010e {
                result_ptr := _savedyn(add(arg_ptrs_ptr, 32))
            }
            case 0x98000110 {
                result_ptr := _push_bang(add(arg_ptrs_ptr, 32))
            }
            case 0x90000112 {
                result_ptr := _getdyn(add(arg_ptrs_ptr, 32))
            }
            case 0x90000114 {
                result_ptr := _store(add(arg_ptrs_ptr, 32))
            }
            case 0x90000116 {
                result_ptr := _sload(add(arg_ptrs_ptr, 32))
            }
            case 0x88000118 {
                _revert(add(arg_ptrs_ptr, 32))
            }
            case 0x8800011a {
                _return(add(arg_ptrs_ptr, 32))
            }
            case 0x8800011c {
                let struct_ptr := mload(add(arg_ptrs_ptr, 32))
                result_ptr := _list_from_struct(struct_ptr)
            }
            case 0x9800011e {
                let ssig := _defmap(add(arg_ptrs_ptr, 32))
                result_ptr := allocate(8)
                mslicestore(result_ptr, uconcat(buildBytesSig(4), ssig, 4), 8)
            }
            case 0x98000120 {
                result_ptr := _mapset(add(arg_ptrs_ptr, 32))
            }
            case 0x90000122 {
                let name_ptr := mload(add(arg_ptrs_ptr, 32))
                let key_ptr := mload(add(arg_ptrs_ptr, 64))
                result_ptr := _mapget(name_ptr, key_ptr)
            }
            case 0x98000124 {
                let name_ptr := mload(add(arg_ptrs_ptr, 32))
                let index_ptr := mload(add(arg_ptrs_ptr, 64))
                let value_ptr := mload(add(arg_ptrs_ptr, 96))
                result_ptr := _update_bang(name_ptr, index_ptr, value_ptr)
            }
            case 0x88000126 {
                let name_ptr := mload(add(arg_ptrs_ptr, 32))
                result_ptr := _defstruct(name_ptr)
            }
            case 0x88000128 {
                let struct_ptr := mload(add(arg_ptrs_ptr, 32))
                result_ptr := _list_refs_from_struct(struct_ptr)
            }
            case 0x9000012a {
                let array_ptr := mload(add(arg_ptrs_ptr, 32))
                let value_ptr := mload(add(arg_ptrs_ptr, 64))
                result_ptr := _push(array_ptr, value_ptr)
            }
            case 0x9000012c {
                let bytelike_ptr := mload(add(arg_ptrs_ptr, 32))
                let pos_ptr := mload(add(arg_ptrs_ptr, 64))
                result_ptr := _slice(bytelike_ptr, pos_ptr)
            }
            case 0x8800012e {
                let item_ptr := mload(add(arg_ptrs_ptr, 32))
                let vallen := _length(item_ptr)
                result_ptr := allocate(8)
                mslicestore(result_ptr, buildUintSig(4), 4)
                mslicestore(add(result_ptr, 4), vallen, 4)
            }
            case 0x90000130 {
                let ptr1 := mload(add(arg_ptrs_ptr, 32))
                let ptr2 := mload(add(arg_ptrs_ptr, 64))
                result_ptr := _join(ptr1, ptr2)
            }
            case 0x98000132 {
                let start_ptr := mload(add(arg_ptrs_ptr, 32))
                let stop_ptr := mload(add(arg_ptrs_ptr, 64))
                let step_ptr := mload(add(arg_ptrs_ptr, 96))
                result_ptr := _range(start_ptr, stop_ptr, step_ptr)
            }
            case 0x90000134 {
                let iter_ptr := mload(add(arg_ptrs_ptr, 32))
                let value_ptr := mload(add(arg_ptrs_ptr, 64))
                result_ptr := _shift(iter_ptr, value_ptr)
            }

            default {
                let isthis := 0

                isthis := isList(fsig)
                if eq(isthis, 1) {
                    result_ptr := _list(mload(arg_ptrs_ptr), add(arg_ptrs_ptr, 32))
                }

                if eq(isthis, 0) {
                    isthis := isApply(fsig)
                    if eq(isthis, 1) {
                        result_ptr := _apply(arg_ptrs_ptr, env_ptr)
                    }
                }

                if eq(isthis, 0) {
                    isthis := isArray(fsig)
                    if eq(isthis, 1) {
                        result_ptr := _array(mload(arg_ptrs_ptr), add(arg_ptrs_ptr, 32))
                    }
                }

                if eq(isthis, 0) {
                    isthis := isKeccak256(fsig)
                    if eq(isthis, 1) {
                        result_ptr := _keccak256(arg_ptrs_ptr)
                    }
                }

                if eq(isthis, 0) {
                    isthis := isMapFunction(fsig)
                    if eq(isthis, 1) {
                        let arity := sub(mload(arg_ptrs_ptr), 1)
                        let fptr := mload(add(arg_ptrs_ptr, 32))
                        let _iter_ptrs := add(arg_ptrs_ptr, 64)

                        // fixme: if we give the arity as an argument
                        // we get a stack too deep error
                        let iter_len := mul(arity, 32)
                        let hack_iters := allocate(add(iter_len, 32))
                        mstore(hack_iters, arity)
                        mmultistore(add(hack_iters, 32), _iter_ptrs, iter_len)

                        result_ptr := _map(fptr, hack_iters, env_ptr)
                    }
                }
                
                if eq(isthis, 0) {
                    isthis := isGetByName(fsig)
                    if eq(isthis, 1) {
                        isthis := 0
                        let name := mload(
                            // add 4 to omit type
                            add(mload(add(arg_ptrs_ptr, 32)), 4)
                        )
                        let arity := mload(arg_ptrs_ptr)
                        let signature := getFnSigByName(name)

                        switch arity
                        case 0 {
                            dtrequire(false, 0xe0000011)
                        }
                        case 1 {
                            // The function is used in a HOF
                            result_ptr := lambdaStorage(signature)
                            if isFunction(result_ptr) {
                                isthis := 1
                            }
                        }
                        default {
                            // apply lambda on args
                            let lambda_body_ptr := lambdaStorage(signature)

                            if isFunction(lambda_body_ptr) {
                                result_ptr := _applyInner(
                                    sub(arity, 1),
                                    add(lambda_body_ptr, 4),
                                    add(arg_ptrs_ptr, 64),
                                    env_ptr
                                )
                                isthis := 1
                            }
                        }
                    }
                }

                if eq(isthis, 0) {
                    // try storage
                    // TODO storage cache
                    let arity := mload(arg_ptrs_ptr)

                    let lambda_body_ptr := lambdaStorage(fsig)
                    
                    if isFunction(lambda_body_ptr) {
                        result_ptr := _applyInner(
                            arity,
                            add(lambda_body_ptr, 4),
                            add(arg_ptrs_ptr, 32),
                            env_ptr
                        )
                        isthis := 1
                    }
                }

                if eq(isthis, 0) {
                    // try other registered Taylor contracts
                    result_ptr, isthis := tryRegistered(fsig, arg_ptrs_ptr)
                }

                dtrequire(eq(isthis, 1), 0xe013)
            }
            // TODO: search in registered contracts
            // TODO: revert if function not found
        }

        function lambdaStorage(fsig) -> result_ptr {
            let func_ptr := getFn(fsig)
            
            // without length; lambda signature already has length
            result_ptr := add(func_ptr, 4)
        }

        function tryRegistered(fsig, arg_ptrs_ptr) -> result_ptr, success {
            let arity := mload(arg_ptrs_ptr)
            
            let joined_args_ptr := freeMemPtr()
            mslicestore(joined_args_ptr, fsig, 4)
            
            let args_len := _join_ptrs2(
                arity,
                add(arg_ptrs_ptr, 32),
                add(joined_args_ptr, 4)
            )
            args_len := add(args_len, 4)
            joined_args_ptr := allocate(args_len)

            let count := getRegCounter()
            let loop_again := true

            if gt(count, 0) {
                for { let i := 1 } loop_again { i := add(i, 1) } {
                    let typeless_addr := shr(96, shl(32, getRegAddress(i)))

                    if gt(typeless_addr, 0) {
                        let callSuccess := staticcall(gas(), typeless_addr, joined_args_ptr, args_len, 0, 0)

                        if eq(callSuccess, 1) {
                            result_ptr := allocate(returndatasize())
                            returndatacopy(result_ptr, 0, returndatasize())
                            loop_again := false
                            success := true
                        }
                    }

                    if eq(lt(i, count), false) {
                        loop_again := false
                    }
                }
            }
        }
        
        function get4b(ptr) -> _sig {
            _sig := mslice(ptr, 4)
        }

        function getSignature(ptr) -> _sig {
            _sig := mslice(ptr, getSignatureLength(ptr))
        }

        // function 10000000000000000000000000000000
        function isFunction(ptr) -> isi {
            let sig := get4b(ptr)
            isi := eq(and(shr(31, sig), 0x01), 1)
        }
        // 10001100000000000000000000000000
        // 100000000000000000000000000
        function isLambda(sig) -> isl {
            let func := and(sig, 0x4000000)
            isl := eq(iszero(func), 0)
        }
        // 00000001000000000000000000000000
        function isLambdaUnknown(vartype) -> islu {
            islu := eq(vartype, 0x1000000)
        }
        function getFunctionId(sig) -> _id {
            _id := and(sig, 0x7fffffe)
        }
        // 10000000000000000000000001000000
        function isApply(sig) -> isapp {
            // 00000111111111111111111111111110
            let id := getFunctionId(sig)
            // 1000000
            isapp := eq(id, 0x40)
        }
        function isMapFunction(sig) -> ismapf {
            let id := getFunctionId(sig)
            ismapf := eq(id, 0x50)
        }
        // 10000000000000000000000000111110
        function isList(sig) -> isl {
            // 00000111111111111111111111111110
            let id := getFunctionId(sig)
            isl := eq(id, 0x3e)
        }
        // 10011000000000000000000001001000
        function isGetByName(sig) -> isget {
            // 00000111111111111111111111111110
            let id := getFunctionId(sig)
            // 1001000
            isget := eq(id, 0x48)
        }
        function isKeccak256(sig) -> isa {
            let id := getFunctionId(sig)
            isa := eq(id, 0x34)
        }
        function isArray(sig) -> isa {
            let id := getFunctionId(sig)
            isa := eq(id, 0x10c)
        }
        // 01000000000000000000000000000000
        function isArrayType(ptr) -> isi {
            let sig := get4b(ptr)
            isi := eq(and(shr(30, sig), 0x03), 1)
        }

        // 00100000000000000000000000000000
        // 111 - 0x07
        function isStruct(ptr) -> isi {
            let sig := get4b(ptr)
            isi := eq(and(shr(29, sig), 0x07), 1)
        }
        function _isStruct(sig) -> isi {
            isi := eq(and(shr(29, sig), 0x07), 1)
        }

        // 00010000000000000000000000000000
        function isListType(sig) -> isi {
            isi := eq(and(shr(28, sig), 0x0f), 1)
        }

        // 00001000000000000000000000000000
        // 11111 - 1f
        function _isNumber(sig) -> isi {
            isi := eq(and(shr(27, sig), 0x1f), 1)
        }

        function isNumber(ptr) -> isi {
            isi := _isNumber(get4b(ptr))
        }

        // 00000111111111110000000000000000
        // 00000010100100010000000000000000
        function _isUint(sig) -> isuint {
            isuint := and(
                _isNumber(sig),
                // eq(shr(21, shl(5, get4b(ptr))), 657)
                eq(and(sig, 0x7ff0000), 0x2910000)
            )
        }
        // 00000111111111110000000000000000
        // 00000010100010010000000000000000
        function _isInt(sig) -> isint {
            isint := and(
                _isNumber(sig),
                // eq(shr(21, shl(5, get4b(ptr))), 649)
                eq(and(sig, 0x7ff0000), 0x2890000)
            )
        }

        function isBool(sig) -> isi {
            isi := eq(and(sig, 0xffff0000), 0x0a800000)
        }

        // 00000100000000000000000000000000
        // 111111 - 0x3f
        function isBytes(ptr) -> isi {
            let sig := get4b(ptr)
            isi := _isBytes(sig)
        }

        function _isBytes(sig) -> isi {
            isi := eq(and(shr(26, sig), 0x3f), 1)
        }

        function bytesEncoding(sig) -> encoding {
            encoding := and(shr(16, sig), 0x3ff)
        }

        function isString(ptr) -> iss {
            let sig := get4b(ptr)
            iss := _isString(sig)
        }

        function _isString(sig) -> iss {
            iss := and(_isBytes(sig), gt(bytesEncoding(sig), 0))
        }

        // function _isMapping(sig) -> isi {
        //     isi := eq(and(shr(29, sig), 0x07), 1)
        // }

        // last 16 bits
        function numberSize(sig) -> _size {
            _size := and(sig, 0xffff)
        }

        // last 24 bits
        function listTypeSize(sig) -> _size {
            _size := and(sig, 0xffffff)
        }

        function bytesSize(sig) -> _size {
            _size := and(sig, 0xffff)
        }

        function structSize(sig) -> _size {
            _size := shr(25, and(sig, 0x1e000000))
        }

        function arrayTypeSize(sig) -> _size {
            _size := and(sig, 0x3fffffff)
        }

        function iterTypeSize(ptr) -> _size {
            if isArrayType(ptr) {
                _size := arrayTypeSize(get4b(ptr))
            }
            if isListType(get4b(ptr)) {
                _size := listTypeSize(get4b(ptr))
            }
        }

        function splitArraySig(ptr) -> sig1, sig2 {
            let siglen := getSignatureLength(ptr)
            let firstlen := sub(siglen, 4)
            sig1 := mslice(ptr, firstlen)
            sig2 := mslice(add(ptr, firstlen), 4)
        }
        
        // 11111111111111111111111110
        function lambdaLength(sig) -> _blength {
            _blength := shr(1, and(sig, 0x3fffffe))
        }

        function getSignatureLength(ptr) -> _siglen {
            _siglen := 4

            if isArrayType(ptr) {
                let sig := get4b(ptr)
                let arity := arrayTypeSize(sig)
                if gt(arity, 0) {
                    _siglen := add(4, getSignatureLength(add(ptr, 4)))
                }
            }
        }

        // TODO: array, struct, more efficient - nested switches?
        function getValueLength(ptr) -> _vallen {
            let sig := get4b(ptr)
            let done := 0
            if and(eq(done, 0), isFunction(ptr)) {
                _vallen := 0
                if isLambda(sig) {
                    _vallen := lambdaLength(sig)
                }
                done := 1
            }
            if and(eq(done, 0), isArrayType(ptr)) {
                let arity := arrayTypeSize(sig)
                switch arity
                case 0 {
                    _vallen := 0
                }
                default {
                    let item_size := getValueLength(add(ptr, 4))
                    _vallen := mul(arity, item_size)
                }
                done := 1
            }
            if and(eq(done, 0), isStruct(ptr)) {
                let storage_ref := structStoredFromSig(sig)
                switch storage_ref
                case 1 {
                    // if storage reference, it only contains a u4 storage id/index
                    _vallen := 4
                }
                default {
                    // it contains u32 pointers to data; 
                    _vallen := mul(structSize(sig), 4)
                }
                done := 1
            }
            if and(eq(done, 0), isListType(sig)) {
                let size := listTypeSize(sig)
                let ptr_now := add(ptr, getSignatureLength(ptr))
                for { let i := 0 } lt(i, size) { i := add(i, 1) } {
                    let item_len := getTypedLength(ptr_now)
                    _vallen := add(_vallen, item_len)
                    ptr_now := add(ptr_now, item_len)
                }
                done := 1
            }
            if and(eq(done, 0), isBool(sig)) {
                _vallen := 0
                done := 1
            }
            if and(eq(done, 0), isNumber(ptr)) {
                _vallen := numberSize(sig)
                done := 1
            }
            if and(eq(done, 0), isBytes(ptr)) {
                _vallen := bytesSize(sig)
                done := 1
            }
            if and(eq(done, 0), isLambdaUnknown(sig)) {
                _vallen := 4
                done := 1
            }
        }

        function getTypedLength(ptr) -> _alllen {
            _alllen := add(getValueLength(ptr), getSignatureLength(ptr))
        }

        function extractValue(ptr) -> _value {
            let siglen := getSignatureLength(ptr)
            let vallen := getValueLength(ptr)
            _value := mslice(add(ptr, siglen), vallen)
        }

        function writeTyped(ptr, value, sig, siglen) -> _len {
            mslicestore(ptr, sig, siglen)
            let vallen := getValueLength(ptr)
            mslicestore(add(ptr, siglen), value, vallen)
            _len := add(siglen, vallen)
        }

        function allocateTyped(value, sig, siglen) -> result_ptr {
            result_ptr := freeMemPtr()
            let len := writeTyped(result_ptr, value, sig, siglen)
            result_ptr := allocate(len)
        }

        function allocateNil(sig_ptr, sig_len) -> result_ptr {
            result_ptr := allocate(sig_len)
            mslicestore(result_ptr, getNilSignature(sig_ptr, sig_len), sig_len)
        }

        function getNilSignature(ptr, sig_len) -> _nil_sig {
            let sig := get4b(ptr)
            let done := 0
            if and(eq(done, 0), isFunction(ptr)) {
                _nil_sig := buildFnSig(0, 0)
                let rest_len := sub(sig_len, 4)
                let rest := mslice(add(ptr, 4), rest_len)
                _nil_sig := add(shl(mul(rest_len, 8), _nil_sig), rest)
                done := 1
            }
            if and(eq(done, 0), isArrayType(ptr)) {
                _nil_sig := buildArraySig(0)

                done := 1
            }
            if and(eq(done, 0), isStruct(ptr)) {
                _nil_sig := structSigFromId(0, 0, 0)
                done := 1
            }
            if and(eq(done, 0), isListType(sig)) {
                _nil_sig := buildListTypeSig(0)
                done := 1
            }
            if and(eq(done, 0), isBool(sig)) {
                _nil_sig := buildBoolSig(0)
                done := 1
            }
            if and(eq(done, 0), isNumber(ptr)) {
                _nil_sig := buildUintSig(0)
                done := 1
            }
            if and(eq(done, 0), isBytes(ptr)) {
                _nil_sig := buildBytesSig(0)
                done := 1
            }
        }
        
        // arity - 4 bits -> 16 args
        // 01111000000000000000000000000000
        function getFuncArity(ptr) -> arity {
            arity := shr(27, and(get4b(ptr), 0x78000000))
        }

        // 1010100000000000000000000001
        function buildBoolSig(value) -> signature {
            switch value
            case 1 {
                signature := 0x0a800001
            }
            case 0 {
                signature := 0x0a800000
            }
        }

        function buildBytesSig(length) -> signature {
            // signature :=  '000001' * bit26 length
            signature := add(exp(2, 26), length)
        }

        function buildBytelikeSig(length, encoding) -> signature {
            signature := add(add(exp(2, 26), shl(16, encoding)), length)
        }

        function buildLambdaSig(bodylen) -> signature {
            // signature :=  '100011' * bit25 bodylen * 0
            signature := add(
                add(add(exp(2, 31), exp(2, 27)), exp(2, 26)),
                shl(1, bodylen)
            )
        }
        // arity: 1 + number of args
        function buildApplySig(arity) -> signature {
            arity := add(arity, 1)
            // signature :=  '1' * bit4 arity * bit26 id * 0
            signature := add(
                add(exp(2, 31), shl(27, arity)),
                shl(1, 32)
            )
        }

        // Type list (not function)
        // TODO type
        function buildListTypeSig(length) -> signature {
            // signature :=  '0001' * bit4 type * bit24 length
            signature := add(add(exp(2, 28), exp(2, 24)), length)
        }

        function buildUintSig(size) -> signature {
            // typeid.number + numberid.uint + bit16 size
            // 00001 * 01010010001 * 0000000000000000
            signature := add(0x0a910000, size)
        }

        function buildIntSig(size) -> signature {
            // typeid.number + numberid.uint + bit16 size
            // 00001 * 01010001001 * 0000000000000000
            signature := add(0x0a890000, size)
        }

        function changeNumberSize(sig, size) -> signature {
            signature := add(shl(16, shr(16, sig)), size)
        }

        function buildArraySig(arity) -> signature {
            // signature :=  '01' * bit30 arity
            signature := add(exp(2, 30), arity)
        }

        function structSigFromId(id, arity, stored) -> signature {
            // signature :=  '001' * bit4 arity * bit24 id * bit1 stored?
            dtrequire(or(eq(stored, 1), eq(stored, 0)), 0xeeaa)
            signature := add(add(add(exp(2, 29), shl(25, arity)), shl(1, id)), stored)
        }

        function structSigStoredChange(sig, stored) -> newsig {
            newsig := add(shr(1, shl(1, sig)), stored)
        }

        function structStoredFromSig(sig) -> stored {
            stored := shr(31, shl(31, sig))
        }

        // 3,4,24,1
        function structIdFromSig(signature) -> index {
            index := shr(1, and(signature, 0x1fffffe))
        }

        function mapSigFromId(id) -> signature {
            // signature :=  '000000001' * bit23 id
            signature := add(0x800000, id)
        }

        function mapIdFromSig(signature) -> index {
            index := and(signature, 0x7fffff)
        }
        
        // function read(str) -> _str {
        //     _str := str
        // }

        // function print(ast) -> answ {
        //     answ := ast
        // }

        // function rep(line) -> answ {
        //     answ := print(eval(read(line)))
        // }

        function _list(arity, ptrs) -> _data_ptr {
            // start with the list type id
            _data_ptr := allocate(4)
            mslicestore(_data_ptr, uconcat(0x11, arity, 3), 4)
            
            for { let i := 0 } lt(i, arity) { i := add(i, 1) } {
                let arg_ptr := mload(ptrs)
                let size := getTypedLength(arg_ptr)
                let ptr := allocate(size)
                mmultistore(ptr, arg_ptr, size)
                ptrs := add(ptrs, 32)
            }
        }

        function _apply(arg_ptrs, env_ptr) -> _data_ptr {
            let arity := mload(arg_ptrs)
            
            // lambda_ptr can be a signature or a lambda pointer
            let lambda_body_ptr := mload(add(arg_ptrs, 32))

            // TODO: if signature -> call eval

            _data_ptr := _applyInner(arity, lambda_body_ptr, add(arg_ptrs, 64), env_ptr)
        }

        function _applyInner(arity, lambda_ptr, arg_ptrs, env_ptr) -> _data_ptr {

            let lambda_body_ptr := lambda_ptr
            let is_lambda := isLambda(get4b(lambda_ptr))
            let orig_env := 0

            if is_lambda {
                lambda_body_ptr := add(lambda_ptr, 4)
                if eq(isListType(get4b(lambda_body_ptr)), 0) {
                    orig_env := mload(lambda_body_ptr)
                    lambda_body_ptr := add(lambda_body_ptr, 32)
                }
            }

            // lambda_body_ptr: args list + body
            // args_arity should be the same as received arity
            let args_arity := listTypeSize(get4b(lambda_body_ptr))
            
            // TODO: why are they different
            // dtrequire(eq(args_arity, arity), 0xeebb)

            let argdef_ptr := add(lambda_body_ptr, 4) // after list sig
            let new_env_ptr := 0

            switch orig_env
            case 0 {
                new_env_ptr := copy_env(env_ptr)
            }
            default {
                new_env_ptr := copy_env(env_ptr)
                meld_env(new_env_ptr, orig_env)
            }
            
            for { let i := 0 } lt(i, args_arity) { i := add(i, 1) } {
                // index of unknown variable
                let index := mslice(add(argdef_ptr, 4), 4)
                let arg_ptr := mload(add(arg_ptrs, mul(32, i)))
                addto_env(new_env_ptr, index, arg_ptr)
                argdef_ptr := add(argdef_ptr, 8)
            }

            lambda_body_ptr := argdef_ptr

            // if lambda_body_ptr begins with lambda -> the execution
            // returned a function & we do not evaluate it now
            // but we keep track of its original environment
            switch isLambda(get4b(lambda_body_ptr))
            case 1 {
                // copy lambda to a free ptr & add the orig env ptr after sig
                let sig := get4b(lambda_body_ptr)
                let body_length := lambdaLength(sig)

                _data_ptr := allocate(add(36, body_length))
                mslicestore(_data_ptr, buildLambdaSig(add(body_length, 32)), 4)
                mstore(add(_data_ptr, 4), new_env_ptr)
                mmultistore(add(_data_ptr, 36), add(lambda_body_ptr, 4),body_length)
            }
            default {
                let endd, res := eval(lambda_body_ptr, new_env_ptr)
                _data_ptr := res
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

        function _join_ptrs2(arity, arg_ptrs, output_ptr) -> data_length {
            data_length := 0
            let ptr_offset := 0
            
            for { let i := 0 } lt(i, arity) { i := add(i, 1) } {
                let item_ptr := mload(add(arg_ptrs, ptr_offset))
                let item_length := getTypedLength(item_ptr)
                mmultistore(
                    add(output_ptr, data_length), 
                    item_ptr,
                    item_length
                )
                ptr_offset := add(ptr_offset, 32)
                data_length := add(data_length, item_length)
            }
        }

        function _if(_ptr, env_ptr) -> end_ptr, result_ptr {
            let branch1len := mslice(_ptr, 4)
            let branch2len := mslice(add(_ptr, 4), 4)
            let cond_end, cond_answ := eval(add(_ptr, 8), env_ptr)
            let cond_value := eq(_nil_q(cond_answ), 0)

            switch cond_value
            case 1 {
                let act_end, act_ptr := eval(cond_end, env_ptr)
                result_ptr := act_ptr
            }
            case 0 {
                let act_end, act_ptr := eval(add(cond_end, branch1len), env_ptr)
                result_ptr := act_ptr
            }
            end_ptr := add(add(cond_end, branch1len), branch2len)
        }

        function _map(fptr, _iter_ptrs, env_ptr) -> result_ptr {
            let sigsig := mslice(fptr, 4)
            let iter_sig := get4b(mload(add(_iter_ptrs, 32)))
            let results_ptrs := 0
            
            switch sigsig
            case 0x04000004 {
                results_ptrs := _mapInnerNative(mslice(add(fptr, 4), 4), _iter_ptrs, env_ptr)
            }
            default {
                results_ptrs := _mapInnerLambda(
                    resolveLambdaPtr(fptr),
                    _iter_ptrs,
                    env_ptr
                )
            }

            result_ptr := _iter(iter_sig, results_ptrs)
        }

        function _iter(iter_sig, results_ptrs) -> result_ptr {
            // Recreate list from result pointers
            switch isListType(iter_sig)
            case 1 {
                result_ptr := _list(listTypeSize(iter_sig), results_ptrs)
            }
            default {
                result_ptr := _array(arrayTypeSize(iter_sig), results_ptrs)
            }
        }

        function _getFromIters(arity, iter_ptrs, index) -> item_ptrs {
            item_ptrs := allocate(mul(arity, 32))
            for { let i := 0 } lt(i, arity) { i := add(i, 1) } {
                let offset := mul(i, 32)
                let result_ptr := _nth(mload(add(iter_ptrs, offset)), index)
                mstore(add(item_ptrs, offset), result_ptr)
            }
        }

        function _minLengthFromIters(arity, iter_ptrs) -> _minlen {
            _minlen := _length(mload(iter_ptrs))

            for { let i := 1 } lt(i, arity) { i := add(i, 1) } {
                let len := _length(mload(add(iter_ptrs, mul(i, 32))))
                if lt(len, _minlen) {
                    _minlen := len
                }
            }
        }

        function _mapInnerNative(sig, iter_ptrs, env_ptr) -> results_ptrs {
            let arity := mload(iter_ptrs)
            iter_ptrs := add(iter_ptrs, 32)
            let result_arity := _minLengthFromIters(arity, iter_ptrs)
            results_ptrs := allocate(mul(arity, 32))

            // iterate over list & apply function on each arg
            for { let i := 0 } lt(i, result_arity) { i := add(i, 1) } {
                let item_ptrs := _getFromIters(arity, iter_ptrs, i)
                
                let dataptr := freeMemPtr()
                mslicestore(dataptr, sig, 4)
                
                let args_len := _join_ptrs2(
                    arity,
                    item_ptrs,
                    add(dataptr, 4)
                )
                dataptr := allocate(add(args_len, 4))

                let endd, res := eval(dataptr, env_ptr)
                mstore(add(results_ptrs, mul(i, 32)), res)
            }
        }

        function _mapInnerLambda(lambda_body_ptr, iter_ptrs, env_ptr) -> results_ptrs {
            let arity := mload(iter_ptrs)
            iter_ptrs := add(iter_ptrs, 32)
            let result_arity := _minLengthFromIters(arity, iter_ptrs)
            results_ptrs := allocate(mul(arity, 32))
            let args_arity := listTypeSize(get4b(lambda_body_ptr))

            // <list_sig><var_sig><index>
            let arg_list :=lambda_body_ptr
            lambda_body_ptr := add(add(lambda_body_ptr, 4), mul(args_arity, 8))

            // iterate over list & apply function on each arg
            for { let i := 0 } lt(i, result_arity) { i := add(i, 1) } {
                let item_ptrs := _getFromIters(arity, iter_ptrs, i)
                
                let new_env_ptr := copy_env(env_ptr)
                for { let ind := 0 } lt(ind, arity) { ind := add(ind, 1) } {
                    let arg_index := mslice(add(_nth_list(arg_list, ind), 4), 4)
                    addto_env(new_env_ptr, arg_index, mload(add(item_ptrs, mul(ind, 32))))
                }
                let endd, res := eval(lambda_body_ptr, new_env_ptr)
                mstore(add(results_ptrs, mul(i, 32)), res)
            }
        }

        function _reduce(fptr, iter_ptr, accum_ptr, env_ptr) -> result_ptr {
            let sigsig := mslice(fptr, 4)
            switch sigsig
            case 0x04000004 {
                result_ptr := _reduceInnerNative(mslice(add(fptr, 4), 4), iter_ptr, accum_ptr, env_ptr)
            }
            default {
                result_ptr := _reduceInnerLambda(
                    resolveLambdaPtr(fptr),
                    iter_ptr,
                    accum_ptr,
                    env_ptr
                )
            }
        }

        function _reduceInnerNative(sig, iter_ptr, accum_ptr, env_ptr) -> result_ptr {
            let arity := iterTypeSize(iter_ptr)
            let accum_length := getTypedLength(accum_ptr)
            let new_accum := accum_ptr

            // iterate & apply function on each arg
            for { let i := 0 } lt(i, arity) { i := add(i, 1) } {
                let arg_ptr := _first(iter_ptr)
                iter_ptr := _rest(iter_ptr)

                let arg_length := getTypedLength(arg_ptr)
                let dataptr := allocate(add(add(4, arg_length), accum_length))
                mslicestore(dataptr, sig, 4)
                mmultistore(add(dataptr, 4), new_accum, accum_length)
                mmultistore(add(add(dataptr, 4), accum_length), arg_ptr, arg_length)

                let endd, res := eval(dataptr, env_ptr)
                accum_length := getTypedLength(res)
                new_accum := res
            }

            result_ptr := new_accum
        }

        function _reduceInnerLambda(lambda_body_ptr, iter_ptr, accum_ptr, env_ptr) -> result_ptr {
            let arity := iterTypeSize(iter_ptr)
            let accum_length := getTypedLength(accum_ptr)
            let new_accum := accum_ptr

            // should always have 2 arg
            let args_arity := listTypeSize(get4b(lambda_body_ptr))
            dtrequire(eq(args_arity, 2), 0xeebb)
            
            // <list_sig><var_sig><index>
            let arg1_index := mslice(add(lambda_body_ptr, 8), 4)
            let arg2_index := mslice(add(lambda_body_ptr, 16), 4)

            // lambda_body_ptr := add(add(lambda_body_ptr, 4), mul(args_arity, 8)))
            lambda_body_ptr := add(lambda_body_ptr, 20)

            // iterate over list & apply function on each arg
            for { let i := 0 } lt(i, arity) { i := add(i, 1) } {

                let arg_ptr := _first(iter_ptr)
                iter_ptr := _rest(iter_ptr)
                let arg_length := getTypedLength(arg_ptr)
                let new_env_ptr := copy_env(env_ptr)

                addto_env(new_env_ptr, arg1_index, new_accum)
                addto_env(new_env_ptr, arg2_index, arg_ptr)

                let endd, res := eval(lambda_body_ptr, new_env_ptr)
                accum_length := getTypedLength(res)
                new_accum := res
            }

            result_ptr := new_accum
        }

        function resolveLambdaPtr(fptr) -> _lambda_body_ptr {
            // Local lambda - fptr is a pointer to the lambda body pointer
            // Stored lambda - fptr is a pointer to the lambda body
            switch isListType(mslice(add(fptr, 4), 4))
            // stored lambda: <sig><lambda_body> ; lambda_body starts with a list of arguments
            case 1 {
                _lambda_body_ptr := add(fptr, 4)
            }
            default {
                _lambda_body_ptr := fptr
            }
        }

        function _cast_negative(value, size) -> _value {
            _value := sub(exp(2, mul(size, 8)), value)
        }

        function _isnegative(ptr1) -> isn {
            let sig := get4b(ptr1)
            let _absolute := extractValue(ptr1)
            if _isInt(sig) {
                let size := numberSize(get4b(ptr1))
                let uintlimit := exp(2, mul(sub(size, 1), 8))
                if gt(_absolute, sub(uintlimit, 1)) {
                    isn := 1
                }
            }
        }

        function _abs(ptr1) -> _absolute {
            _absolute := extractValue(ptr1)
            if _isnegative(ptr1) {
                let size := numberSize(get4b(ptr1))
                _absolute := sub(exp(2, mul(size, 8)), _absolute)
            }
        }

        function _cast_sig(neg_sign, value, sig1, sig2) -> sig, _value {
            let minsize := _minsize(value)
            let size := max(max(numberSize(sig1), numberSize(sig2)), minsize)
            switch neg_sign
            case 1 {
                _value := _cast_negative(value, size)
                sig := buildIntSig(size)
            }
            default {
                // we take the least restrictive type and the maximum size
                sig := changeNumberSize(min(sig1, sig2), size)
                _value := value
            }
        }

        function _minsize(value) -> _size {
            let value_ptr := allocate(32)
            mstore(value_ptr, value)
            let index := firstSignificantByte(32, value_ptr)
            _size := sub(32, index)
        }

        function firstSignificantByte(maxindex, value_ptr) -> offset {
            let current_byte := mslice(value_ptr, 1)
            for { } eq(current_byte, 0x00) { } {
                offset := add(offset, 1)
                current_byte := mslice(add(value_ptr, offset), 1)
                if gt(offset, maxindex) {
                    current_byte := 0x11
                    offset := sub(offset, 1)
                }
            }
        }
        
        function equalDowncastOrRevert(sig, referenceSig) -> _newsig {
            let same := eq(sig, referenceSig)
            switch same
            case 1 {
                _newsig := sig
            }
            default {
                let isnumber := and(_isNumber(sig), _isNumber(referenceSig))
                switch isnumber
                case 1 {
                    _newsig := min(sig, referenceSig)
                }
                default {
                    dtrequire(false, 0xeecc)
                }
            }
        }
       
        // TODO: auto cast if overflow
        function _add(ptr1, ptr2) -> result_ptr {
            let c := add(extractValue(ptr1), extractValue(ptr2))
            result_ptr := allocateTyped(c, min(get4b(ptr1), get4b(ptr2)), 4)
        }

        function _sub(ptr1, ptr2) -> result_ptr {
            let a := extractValue(ptr1)
            let b := extractValue(ptr2)
            let c := sub(a, b)
            let sig := min(get4b(ptr1), get4b(ptr2))
            if gt(b, a) {
                sig := buildIntSig(numberSize(sig))
            }
            result_ptr := allocateTyped(c, sig, 4)
        }
        
        function _mul(ptr1, ptr2) -> result_ptr {
            let c := mul(extractValue(ptr1), extractValue(ptr2))
            result_ptr := allocateTyped(c, min(get4b(ptr1), get4b(ptr2)), 4)
        }
        
        function _div(ptr1, ptr2) -> result_ptr {
            let neg_sign := add(_isnegative(ptr1), _isnegative(ptr2))
            let sig, value := _cast_sig(
                neg_sign,
                div(_abs(ptr1), _abs(ptr2)),
                get4b(ptr1),
                get4b(ptr2)
            )
            result_ptr := allocateTyped(value, sig, 4)
        }
        
        function _sdiv(ptr1, ptr2) -> result_ptr {
            let neg_sign := add(_isnegative(ptr1), _isnegative(ptr2))
            let sig, value := _cast_sig(
                neg_sign,
                sdiv(_abs(ptr1), _abs(ptr2)),
                get4b(ptr1),
                get4b(ptr2)
            )
            result_ptr := allocateTyped(value, sig, 4)
        }
        
        function _mod(ptr1, ptr2) -> result_ptr {
            let neg_sign := _isnegative(ptr1)
            let sig, value := _cast_sig(
                neg_sign,
                mod(_abs(ptr1), _abs(ptr2)),
                get4b(ptr1),
                get4b(ptr2)
            )
            result_ptr := allocateTyped(value, sig, 4)
        }
        
        function _smod(ptr1, ptr2) -> result_ptr {
            let neg_sign := _isnegative(ptr1)
            let sig, value := _cast_sig(
                neg_sign,
                smod(_abs(ptr1), _abs(ptr2)),
                get4b(ptr1),
                get4b(ptr2)
            )
            result_ptr := allocateTyped(value, sig, 4)
        }
        
        function _exp(ptr1, ptr2) -> result_ptr {
            // no float, just return 0 now
            switch _isnegative(ptr2)
            case 1 {
                result_ptr := allocateTyped(0, get4b(ptr1), 4)
            }
            default {
                let neg_sign := and(
                    _isnegative(ptr1),
                    eq(mod(extractValue(ptr2), 2), 1)
                )
                let sig, value := _cast_sig(
                    neg_sign,
                    exp(_abs(ptr1), _abs(ptr2)),
                    get4b(ptr1),
                    get4b(ptr2)
                )
                result_ptr := allocateTyped(value, sig, 4)
            }
        }
        
        function _not(ptr1) -> result_ptr {
            let c := not(extractValue(ptr1))
            result_ptr := allocateTyped(c, buildUintSig(4), 4)
        }
        
        function _lt(ptr1, ptr2) -> result_ptr {
            let c := lt(_abs(ptr1), _abs(ptr2))
            if or(_isnegative(ptr1), _isnegative(ptr2)) {
                c := sub(1, c)
            }
            result_ptr := allocateTyped(c, buildUintSig(1), 4)
        }
        
        function _gt(ptr1, ptr2) -> result_ptr {
            let c := gt(_abs(ptr1), _abs(ptr2))
            if or(_isnegative(ptr1), _isnegative(ptr2)) {
                c := sub(1, c)
            }
            result_ptr := allocateTyped(c, buildUintSig(1), 4)
        }
        
        function _slt(ptr1, ptr2) -> result_ptr {
            let c := slt(extractValue(ptr1), extractValue(ptr2))
            result_ptr := allocateTyped(c, buildUintSig(1), 4)
        }
        
        function _sgt(ptr1, ptr2) -> result_ptr {
            let c := sgt(extractValue(ptr1), extractValue(ptr2))
            result_ptr := allocateTyped(c, buildUintSig(1), 4)
        }
        
        function _eq(ptr1, ptr2) -> result_ptr {
            let c := eq(extractValue(ptr1), extractValue(ptr2))
            mstore(0, buildUintSig(1))
            result_ptr := allocateTyped(c, buildUintSig(1), 4)
        }
        
        function _iszero(ptr1) -> result_ptr {
            let c := iszero(extractValue(ptr1))
            result_ptr := allocateTyped(c, buildUintSig(1), 4)
        }
        
        function _and(ptr1, ptr2) -> result_ptr {
            let c := and(extractValue(ptr1), extractValue(ptr2))
            result_ptr := allocateTyped(c, buildUintSig(1), 4)
        }
        
        function _or(ptr1, ptr2) -> result_ptr {
            let c := or(extractValue(ptr1), extractValue(ptr2))
            result_ptr := allocateTyped(c, buildUintSig(1), 4)
        }
        
        function _xor(ptr1, ptr2) -> result_ptr {
            let c := xor(extractValue(ptr1), extractValue(ptr2))
            result_ptr := allocateTyped(c, buildUintSig(4), 4)
        }
        
        function _byte(ptr1, ptr2) -> result_ptr {
            let c := byte(extractValue(ptr1), extractValue(ptr2))
            result_ptr := allocateTyped(c, get4b(ptr1), 4)
        }
        
        function _shl(ptr1, ptr2) -> result_ptr {
            let c := shl(extractValue(ptr1), extractValue(ptr2))
            result_ptr := allocateTyped(c, get4b(ptr1), 4)
        }
        
        function _shr(ptr1, ptr2) -> result_ptr {
            let c := shr(extractValue(ptr1), extractValue(ptr2))
            result_ptr := allocateTyped(c, get4b(ptr1), 4)
        }
        
        function _sar(ptr1, ptr2) -> result_ptr {
            let c := sar(extractValue(ptr1), extractValue(ptr2))
            result_ptr := allocateTyped(c, get4b(ptr1), 4)
        }
        
        function _addmod(ptr1, ptr2, ptr3) -> result_ptr {
            let c := addmod(extractValue(ptr1), extractValue(ptr2), extractValue(ptr3))
            result_ptr := allocateTyped(c, get4b(ptr1), 4)
        }
        
        function _mulmod(ptr1, ptr2, ptr3) -> result_ptr {
            let c := mulmod(extractValue(ptr1), extractValue(ptr2), extractValue(ptr3))
            result_ptr := allocateTyped(c, get4b(ptr1), 4)
        }
        
        function _signextend(ptr1, ptr2) -> result_ptr {
            let c := signextend(extractValue(ptr1), extractValue(ptr2))
            result_ptr := allocateTyped(c, get4b(ptr1), 4)
        }
        
        function _keccak256(ptrs) -> result_ptr {
            let arity := mload(ptrs)

            let arg_ptr := add(ptrs, 32)
            let data_ptr := freeMemPtr()
            let length := 0

            for { let i := 0 } lt(i, arity) { i := add(i, 1) } {
                let val_ptr := mload(arg_ptr)
                let sig_len := getSignatureLength(val_ptr)
                let val_len := getValueLength(val_ptr)
                
                mmultistore(add(data_ptr, length), add(val_ptr, sig_len), val_len)
                arg_ptr := add(arg_ptr, 32)
                length := add(length, val_len)
            }

            data_ptr := allocate(length)
            let _hash := keccak256(data_ptr, length)

            result_ptr := allocate(36)
            mslicestore(result_ptr, buildBytesSig(32), 4)
            mstore(add(result_ptr, 4), _hash)
        }
        
        function _call(ptrs) -> result_ptr {
            // TODO
            // c := call(gas(), a, v, inptr, insize, outptr, outsize)
        }
        
        function _callcode(ptrs) -> result_ptr {
            // TODO
            // c := callcode(gas(), a, v, inptr, insize, outptr, outsize)
        }
        
        function _delegatecall(ptrs) -> result_ptr {
            // TODO
            // c := delegatecall(gas(), a, inptr, insize, outptr, outsize)
        }
        
        function _staticcall(ptrs) -> result_ptr {
            // TODO
            // c := staticcall(gas(), a, inptr, insize, outptr, outsize)
        }

        function _contig(ptr1, ptr2) -> result_ptr {
            dtrequire(isNumber(ptr1), 0xe010)
            dtrequire(isBytes(ptr2), 0xe010)

            let len1 := numberSize(mslice(ptr1, 4))
            let len2 := bytesSize(mslice(ptr2, 4))
            let times := mslice(add(ptr1, 4), len1)
            let len := mul(times, len2)
            let newsig := buildBytesSig(len)
            let content := add(ptr2, 4)
            
            result_ptr := allocate(add(4, len))
            mslicestore(result_ptr, newsig, 4)
            
            let current_ptr := add(result_ptr, 4)
            for { let i := 0 } lt(i, times) { i := add(i, 1) } {
                mmultistore(current_ptr, content, len2)
                current_ptr := add(current_ptr, len2)
            }
        }

        function _concat(ptr1, ptr2) -> result_ptr {
            let len1 := bytesSize(mslice(ptr1, 4))
            let len2 := bytesSize(mslice(ptr2, 4))
            let newsig := buildBytesSig(add(len1, len2))
            
            result_ptr := allocate(add(4, add(len1, len2)))
            mslicestore(result_ptr, newsig, 4)
            mmultistore(add(result_ptr, 4), add(ptr1, 4), len1)
            mmultistore(add(add(result_ptr, 4), len1), add(ptr2, 4), len2)
        }

        function _empty(list_ptr) -> result_ptr {
            let sig := mslice(list_ptr, 4)
            let list_arity := listTypeSize(sig)
            result_ptr := allocate(4)

            mslicestore(result_ptr, buildBoolSig(
                or(eq(sig, 0x00), eq(list_arity, 0))
            ), 4)
        }

        function _let_asterix(let_variables_ptr, env_ptr) -> _end_ptr, result_ptr {
            let arity := listTypeSize(mslice(let_variables_ptr, 4))
            arity := div(arity, 2)

            let new_env_ptr := copy_env(env_ptr)
            let var_ptr := add(let_variables_ptr, 4) // list sig

            for { let i := 0 } lt(i, arity) { i := add(i, 1) } {
                // first 8bytes from var_ptr is <8b unknown>
                let pos_index := mslice(add(var_ptr, 4), 4)
                let val_end := 0

                var_ptr := add(var_ptr, 8)
                val_end, var_ptr := eval(var_ptr, new_env_ptr)

                new_env_ptr := copy_env(new_env_ptr)
                addto_env(new_env_ptr, pos_index, var_ptr)

                var_ptr := val_end
            }

            let let_body_ptr := var_ptr
            let endd, res := eval(let_body_ptr, new_env_ptr)
            result_ptr := res
        }

        function _true(ptr1) -> result_ptr {
            // TODO: temporary until we figure out bool vs u1
            let num := isNumber(ptr1)
            let sig := mslice(ptr1, 4)
            let istrue := 0
            switch num
            case 1 {
                istrue := gt(extractValue(ptr1), 0)
            }
            case 0 {
                istrue := and(isBool(sig), eq(and(sig, 0xffff), 1))
            }
            result_ptr := allocate(4)
            mslicestore(result_ptr, buildBoolSig(istrue), 4)
        }

        function _false(ptr1) -> result_ptr {
            let num := isNumber(ptr1)
            let sig := mslice(ptr1, 4)
            let isfalse := 0
            switch num
            case 1 {
                isfalse := eq(extractValue(ptr1), 0)
            }
            case 0 {
                isfalse := and(isBool(sig), eq(and(sig, 0xffff), 0))
            }
            result_ptr := allocate(4)
            mslicestore(result_ptr, buildBoolSig(isfalse), 4)
        }

        function _nil_q(ptr1) -> answ {
            let sig := getSignature(ptr1)
            let nil_sig := getNilSignature(ptr1, getSignatureLength(ptr1))
            answ := eq(sig, nil_sig)
            
            // TODO: remove this?
            // u1 acts as a bool now
            if and(eq(isBool(sig), 0), and(isNumber(ptr1), eq(numberSize(sig), 1))) {
                answ := eq(mslice(add(ptr1, 4), 1), 0)
            }
        }
        
        function _list_q(ptr1) -> answ {
            answ := isListType(get4b(ptr1))
        }

        function _array_q(ptr1) -> answ {
            answ := isArrayType(ptr1)
        }

        function _sequential_q(ptr1) -> answ {
            answ := or(
                isListType(get4b(ptr1)),
                isArrayType(ptr1)
            )
        }

        function _nth(iter_ptr, index) -> result_ptr {
            let sig := get4b(iter_ptr)
            let done := 0

            if isListType(sig) {
                result_ptr := _nth_list(iter_ptr, index)
                done := 1
            }
            if and(eq(done, 0), isArrayType(iter_ptr)) {
                result_ptr := _nth_array(iter_ptr, index)
                done := 1
            }
            dtrequire(eq(done, 1), 0xee09)
        }

        function _nth_list(list_ptr, index) -> result_ptr {
            let list_arity := listTypeSize(mslice(list_ptr, 4))
            dtrequire(lt(index, list_arity), 0xe011)
            let nth_ptr := add(list_ptr, 4)

            for { let i := 0 } lt(i, index) { i := add(i, 1) } {
                nth_ptr := add(nth_ptr, getTypedLength(nth_ptr))
            }
            result_ptr := nth_ptr
        }

        function _nth_array(array_ptr, index) -> result_ptr {
            let siglen := getSignatureLength(array_ptr)
            let values_ptr := add(array_ptr, siglen)
            let itemsig_ptr := add(array_ptr, 4)
            let itemsig_len := getSignatureLength(itemsig_ptr)
            let itemsize := getValueLength(itemsig_ptr)
            let offset := mul(index, itemsize)

            result_ptr := allocate(add(itemsig_len, itemsize))
            mslicestore(result_ptr, mslice(itemsig_ptr, itemsig_len), itemsig_len)
            mmultistore(
                add(result_ptr, itemsig_len),
                add(values_ptr, offset),
                itemsize
            )
        }

        function _first(iter_ptr) -> result_ptr {
            // first item is after the list signature
            result_ptr := _nth(iter_ptr, 0)
        }

        function _rest(iter_ptr) -> result_ptr {
            let sig := get4b(iter_ptr)
            let done := 0

            if isListType(sig) {
                result_ptr := _rest_list(iter_ptr)
                done := 1
            }
            if and(eq(done, 0), isArrayType(iter_ptr)) {
                result_ptr := _rest_array(iter_ptr)
                done := 1
            }
            dtrequire(eq(done, 1), 0xee09)
        }

        function _rest_list(list_ptr) -> result_ptr {
            let list_arity := listTypeSize(mslice(list_ptr, 4))
            let newarity := sub(list_arity, 1)
            let newlistid := buildListTypeSig(newarity)
            let elem_length := getTypedLength(add(list_ptr, 4))
            let newlist := allocate(add(4, mul(newarity, elem_length)))
            result_ptr := newlist

            mslicestore(newlist, newlistid, 4)
            newlist := add(newlist, 4)

            // skip signature &  first item
            list_ptr := add(list_ptr, 4)
            
            list_ptr := add(list_ptr, elem_length)

            for { let i := 0 } lt(i, newarity) { i := add(i, 1) } {
                elem_length := getTypedLength(list_ptr)
                mmultistore(newlist, list_ptr, elem_length)
                list_ptr := add(list_ptr, elem_length)
                newlist := add(newlist, elem_length)
            }
        }

        function _rest_array(array_ptr) -> result_ptr {
            let siglen := getSignatureLength(array_ptr)
            let vallen := getValueLength(array_ptr)
            let arity := arrayTypeSize(get4b(array_ptr))
            let values_ptr := add(array_ptr, siglen)
            let itemsig_ptr := add(array_ptr, 4)
            let itemsize := getValueLength(itemsig_ptr)
            let restofsig := sub(siglen, 4)

            result_ptr := allocate(sub(add(siglen, vallen), itemsize))
            mslicestore(result_ptr, buildArraySig(sub(arity, 1)), 4)
            mslicestore(add(result_ptr, 4), mslice(itemsig_ptr, restofsig), restofsig)
            mmultistore(
                add(result_ptr, siglen),
                add(values_ptr, itemsize),
                sub(vallen, itemsize)
            )
        }

        function _slice(bytelike_ptr, pos_ptr) -> result_ptr {
            let siglen := getSignatureLength(bytelike_ptr)
            let vallen := getValueLength(bytelike_ptr)
            let heads_ptr := add(bytelike_ptr, siglen)
            let heads_len := min(extractValue(pos_ptr), vallen)
            let tails_ptr := add(heads_ptr, heads_len)
            let tails_len := sub(vallen, heads_len)

            // list of 2 bytelike items
            result_ptr := allocate(add(12, vallen))
            let current_ptr := result_ptr
            mslicestore(current_ptr, buildListTypeSig(2), 4)
            current_ptr := add(current_ptr, 4)
            
            let sigheads := 0
            let sigtails := 0
            let isbytelike := isBytes(bytelike_ptr)
            switch isbytelike
            case 0 {
                sigheads := buildBytesSig(heads_len)
                sigtails := buildBytesSig(tails_len)
            }
            case 1 {
                let encoding := bytesEncoding(get4b(bytelike_ptr))
                sigheads := buildBytelikeSig(heads_len, encoding)
                sigtails := buildBytelikeSig(tails_len, encoding)
            }
            mslicestore(current_ptr, sigheads, 4)
            current_ptr := add(current_ptr, 4)
            mmultistore(current_ptr, heads_ptr, heads_len)
            current_ptr := add(current_ptr, heads_len)

            mslicestore(current_ptr, sigtails, 4)
            current_ptr := add(current_ptr, 4)
            mmultistore(current_ptr, tails_ptr, tails_len)
            current_ptr := add(current_ptr, tails_len)
        }

        function _length(item_ptr) -> vallen {
            vallen := getValueLength(item_ptr)
            if _sequential_q(item_ptr) {
                vallen := iterTypeSize(item_ptr)
            }
        }

        function _join(ptr1, ptr2) -> result_ptr {
            let siglen1 := getSignatureLength(ptr1)
            let siglen2 := getSignatureLength(ptr2)
            let vallen1 := getValueLength(ptr1)
            let vallen2 := getValueLength(ptr2)
            let alllen := add(4, add(vallen1, vallen2))
            let sig := 0

            result_ptr := allocate(alllen)
            switch and(isString(ptr1), isString(ptr2))
            case 1 {
                let encoding1 := bytesEncoding(get4b(ptr1))
                let encoding2 := bytesEncoding(get4b(ptr2))
                sig := buildBytelikeSig(add(vallen1, vallen2), min(encoding1, encoding2))
            }
            default {
                sig := buildBytesSig(add(vallen1, vallen2))
            }
            mslicestore(result_ptr, sig, 4)
            let current_ptr := add(result_ptr, 4)
            mmultistore(current_ptr, add(ptr1, siglen1), vallen1)
            current_ptr := add(current_ptr, vallen1)
            mmultistore(current_ptr, add(ptr2, siglen2), vallen2)
        }

        function _range(start_ptr, stop_ptr, step_ptr) -> result_ptr {
            let start := extractValue(start_ptr)
            let stopp := extractValue(stop_ptr)
            let step := extractValue(step_ptr)
            // let arity := div(add(sub(stopp, start), 1), step)
            let arity := add(div(sub(stopp, start), step), 1)

            result_ptr := allocate(add(8, mul(4, arity)))
            mslicestore(result_ptr, buildArraySig(arity), 4)
            mslicestore(add(result_ptr, 4), buildUintSig(4), 4)
            let current_ptr := add(result_ptr, 8)
            for { let i := start } lt(i, add(stopp, 1)) { i := add(i, step) } {
                mslicestore(current_ptr, i, 4)
                current_ptr := add(current_ptr, 4)
            }
        }

        function _save(ptrs) -> result_ptr {
            // pointer to data that has to be inserted
            let data_ptr := mload(ptrs)

            // save at specific type (optional)
            let typename_ptr := add(mload(add(ptrs, 32)), 4)

            // type signature - data is of this type
            let siglen := getSignatureLength(typename_ptr)
            let typesig := mslice(typename_ptr, siglen)
            let vallen := getValueLength(typename_ptr)
            
            // (save! "0x..." "0x04000000" )
            let abstract_type := and(gt(typesig, 0), eq(vallen, 0))
            
            let index := 0

            switch abstract_type
            // dynamic size
            case 1 {
                siglen := getSignatureLength(data_ptr)
                vallen := getValueLength(data_ptr)
                index := _saveInner(typesig, vallen, add(data_ptr, siglen), 0)
            }
            // static size
            case 0 {
                if eq(typesig, 0) {
                    siglen := getSignatureLength(data_ptr)
                    typesig := mslice(data_ptr, siglen)
                    vallen := getValueLength(data_ptr)
                }
                index := _saveInner(typesig, vallen, add(data_ptr, siglen), 1)
            }

            result_ptr := allocateTyped(index, buildUintSig(4), 4)
        }

        function _saveInner(typesig, value_len, value_ptr, hasStaticSize) -> _index {
            switch hasStaticSize
            case 1 {
                _index := _saveInnerStaticSize(typesig, value_len, value_ptr)
            }
            case 0 {
                _index := _saveInnerDynamicSize(typesig, value_len, value_ptr)
            }

            // Internal index starts at 1
            _index := sub(_index, 1)
        }

        // value_ptr does not contain the signature
        function _saveInnerStaticSize(typesig, value_len, value_ptr) -> _index {
            _index := getStorageCount(typesig)
            _index := add(_index, 1)
            let storage_pos := mul(_index, value_len)

            storeAtPos(storage_pos, typesig, value_len, value_ptr)
            incStorageCount(typesig)
        }

        function _updateInnerStaticSize(typesig, index, value_len, value_ptr) {
            index := add(index, 1)
            let storage_pos := mul(index, value_len)
            updateAtPos(storage_pos, typesig, value_len, value_ptr)
        }

        // data_ptr does not contain the signature
        function _saveInnerDynamicSize(typesig, data_len, data_ptr) -> _index {
            let last_index := add(getStorageCount(typesig), 1)

            let start_delta := 32
        
            let j := div(last_index, start_delta)
            let start_ind_lengths := mul(j, start_delta)

            let start_i := getStartAtIndex(j, typesig)

            let offset_len := 0
            if gt(mod(last_index, start_delta), 0) {
                offset_len := getLengthOffset(start_ind_lengths, last_index, typesig, start_delta)
            }
            
            // store start only for mod(i, 32) === 0
            if eq(0, mod(last_index, start_delta)) {
                if gt(last_index, 0) {
                    start_i := storeStart(j, last_index, typesig, start_delta, data_len)
                }
            }

            let storage_pos := add(start_i, offset_len)

            // store length
            storeLength(j, last_index, typesig, start_delta, data_len)

            // store value
            storeAtPos(storage_pos, typesig, data_len, data_ptr)

            // store new count
            incStorageCount(typesig)

            _index := last_index
        }

        function _getfrom(typename_ptr, index_ptr) -> result_ptr {
            let sig_ptr := sigPtrFromNameOrSig(typename_ptr)
            let sig_len := getSignatureLength(sig_ptr)
            let typesig := mslice(sig_ptr, sig_len)
            let typesize := getValueLength(sig_ptr)
            let index := mslice(add(index_ptr, 4), 4)

            result_ptr := _getfromInner(typesig, sig_len, typesize, index)
        }


        function _getfromInner(typesig, sig_len, typesize, index) -> result_ptr {
            let storage_offset := 0
            let data_len := typesize

            // Internal index starts at 1
            index := add(index, 1)
            
            switch typesize
            case 0 {

                let start_delta := 32

                let j := div(index, start_delta)
                let start_ind_lengths := mul(j, start_delta)

                let start := getStartAtIndex(j, typesig)
                let offset_len := 0
                
                if gt(mod(index, start_delta), 0) {
                    offset_len := getLengthOffset(start_ind_lengths, index, typesig, start_delta)
                }

                data_len := getLengthOffset(index, add(index, 1), typesig, start_delta)
                storage_offset := add(start, offset_len)

                result_ptr := allocate(add(data_len, 4))

                // TODO sig after typesig
                sig_len := 4
                mslicestore(result_ptr, buildBytesSig(data_len), sig_len)
            }
            default {
                storage_offset := mul(index, typesize)
                result_ptr := allocate(add(data_len, sig_len))

                // TODO sig after typesig
                mslicestore(result_ptr, typesig, sig_len)
            }

            readAtPos(storage_offset, typesig, add(result_ptr, sig_len), data_len)
        }

        function getStorageCount(typesig) -> count {
            count := sload(mappingArrayStorageKey_count(typesig))
        }

        function incStorageCount(typesig) {
            let count := getStorageCount(typesig)
            count := add(count, 1)
            sstore(mappingArrayStorageKey_count(typesig), count)
        }

        // each start value - 4bytes -> 8 values/32byte slot
        function getStartAtIndex(j, typesig) -> _start {
            let read_slot := div(j, 8)
            let key := mappingArrayStorageKey_starts(read_slot, typesig)
            let starts := sload(key)
            let read_index := mod(j, 8)
            _start := readmiddle(starts, mul(read_index, 4), 4)
            _start := mul(_start, 32)
        }

        function getLengthOffset(start_index, end_index, typesig, start_delta) -> offset {
            let len_slot := div(start_index, 32)
            let key := mappingArrayStorageKey_lengths(len_slot, typesig)
            let lengths := sload(key)

            let base := mul(len_slot, 32)
            let start_index_relative := sub(start_index, base)
            let end_index_relative := sub(end_index, base)

            for { let i := start_index_relative } lt(i, end_index_relative) { i := add(i, 1) } {
                offset := add(
                    offset, 
                    readmiddle(lengths, i, 1)
                )
            }
        }

        function storeLength(j, last_index, typesig, start_delta, data_len) {
            
            let ind := mul(j, start_delta)
            let len_slot := div(ind, 32)
            let key := mappingArrayStorageKey_lengths(len_slot, typesig)
            let lengths := sload(key)

            let offset := mod(last_index, start_delta)
            lengths := add(
                lengths,
                shl(mul(8, sub(31, offset)), data_len)
            )
            sstore(key, lengths)
        }

        function storeStart(j, last_index, typesig, start_delta, data_len) -> newstart {
            // get last 32 lengths
            let last_lengths := getLengthOffset(
                sub(last_index, 32),
                last_index,
                typesig,
                start_delta
            )

            switch gt(mod(last_lengths, 32), 0)
            case 0 {
                last_lengths := div(last_lengths, start_delta)
            }
            case 1 {
                last_lengths := add(div(last_lengths, start_delta), 1)
            }
            newstart := add(
                getStartAtIndex(sub(j, 1), typesig),  // get last start
                last_lengths
            )

            let key := mappingArrayStorageKey_starts(div(j, 8), typesig)
            let values := sload(key)
            let offset := mul(4, mod(j, 8))
            values := add(
                values,
                shl(mul(8, sub(28, offset)), newstart)
            )

            sstore(key, values)
            newstart := mul(newstart, 32)
        }
        
        // data_len := getValueLength(ptr); data_ptr := add(ptr, getSignatureLength(ptr))
        function storeAtPos(storage_pos, typesig, data_len, data_ptr) {
            let storage_slot := div(storage_pos, 32)
            let storage_offset := mod(storage_pos, 32)
            let key := mappingArrayStorageKey_values(storage_slot, typesig)
            let values := sload(key)

            let head_len := min(sub(32, storage_offset), data_len)
            let head := mslice(data_ptr, head_len)

            values := add(values, 
                shl(mul(8, sub(sub(32, head_len), storage_offset)), head)
            )
            
            sstore(key, values)
            setTxPayable()

            if gt(data_len, head_len) {
                storeDataInner(
                    add(data_ptr, head_len),
                    add(key, 1),
                    sub(data_len, head_len)
                )
            }
        }

        function updateAtPos(storage_pos, typesig, data_len, data_ptr) {
            let storage_slot := div(storage_pos, 32)
            let storage_offset := mod(storage_pos, 32)
            let key := mappingArrayStorageKey_values(storage_slot, typesig)

            let value_ptr := allocate(32)
            mstore(value_ptr, sload(key))

            let head_len := min(sub(32, storage_offset), data_len)
            let head := mslice(data_ptr, head_len)
            mstorehead(add(value_ptr, storage_offset), head, head_len)
            sstore(key, mload(value_ptr))
            // setTxPayable()

            if gt(data_len, head_len) {
                let rest := sub(data_len, head_len)
                let slots := div(rest, 32)
                let fully_replaced_len := mul(slots, 32)
                let currentkey := add(key, 1)
                rest := sub(rest, fully_replaced_len)

                data_ptr := add(data_ptr, head_len)
                
                if gt(fully_replaced_len, 0) {
                    storeDataInner(
                        data_ptr,
                        currentkey,
                        fully_replaced_len
                    )
                }
                if gt(rest, 0) {
                    currentkey := add(currentkey, slots)
                    data_ptr := add(data_ptr, fully_replaced_len)
                    
                    mstore(value_ptr, sload(currentkey))
                    mstorehead(value_ptr, mslice(data_ptr, rest), rest)
                    sstore(currentkey, mload(value_ptr))
                }
            }
        }

        function readAtPos(storage_pos, typesig, result_ptr, data_len) {
            let storage_slot := div(storage_pos, 32)
            let storage_offset := mod(storage_pos, 32)
            let key := mappingArrayStorageKey_values(storage_slot, typesig)
            let values := sload(key)
            let head_len := min(sub(32, storage_offset), data_len)
            let head := readmiddle(values, storage_offset, head_len)
            
            mslicestore(result_ptr, head, head_len)

            if gt(data_len, head_len) {
                getStoredDataInner(
                    add(result_ptr, head_len),
                    add(key, 1),
                    sub(data_len, head_len),
                    0
                )
            }
        }

        function payForSave() {
            let sender := caller()
            let owner := sload(mappingStorageKey_owner())
            
            if eq(eq(sender, owner), 0) {
                let gascost, pay := getTxCostData()
                if gt(pay, 0) {
                    let value := callvalue()
                    // let minsum := mul(2, gascost)
                    let minsum := mul(pay, 5000)
                    
                    dtrequire(gt(value, minsum), 0xeebb)
                    let success := call(gas(), owner, value, 0, 0, 0, 0)
                    dtrequire(eq(success, 1), 0xeebb)
                }
            }
        }

        function _defstruct_bang(ptrs) -> sig {
            let name_ptr := mload(ptrs)
            let typelist_ptr := mload(add(ptrs, 32))
            let arity := listTypeSize(mslice(typelist_ptr, 4))

            let struct_abstract_id := 0x20000000

            let data_len := getTypedLength(typelist_ptr)
            let newdata_ptr := allocate(data_len)
            mmultistore(newdata_ptr, typelist_ptr, data_len)

            // struct abstract id
            let id := _saveInner(struct_abstract_id, data_len, newdata_ptr, 0)
            sig := structSigFromId(id, arity, 0)

            _name_bang(name_ptr, struct_abstract_id, sig, 4)
        }

        function _defstruct(name_ptr) -> result_ptr {
            let sig := getSignature(sigPtrFromNameOrSig(name_ptr))
            let struct_id := structIdFromSig(sig)

            // Get struct component types
            result_ptr := _getfromInner(0x20000000, 4, 0, struct_id)
            // Return the list without the bytes signature
            result_ptr := add(result_ptr, 4)
        }

        function _struct(ptrs) -> result_ptr {
            let name_ptr := mload(ptrs)
            let valueslist_ptr := mload(add(ptrs, 32))
            let struct_abstract_id := 0x20000000
            let sig := getSignature(sigPtrFromNameOrSig(name_ptr))

            // TODO: get struct from storage by signature
            // typecheck values & cast if neccessary/possible

            result_ptr := freeMemPtr()
            mslicestore(result_ptr, sig, 4)

            let list_arity := listTypeSize(mslice(valueslist_ptr, 4))
            let res_ptr := add(result_ptr, 4)
            let val_ptr := add(valueslist_ptr, 4)
            let length := 4

            for { let i := 0 } lt(i, list_arity) { i := add(i, 1) } {
                let val_len := getValueLength(val_ptr)
                let sig_len := getSignatureLength(val_ptr)
                mmultistore(res_ptr, add(val_ptr, sig_len), val_len)
                res_ptr := add(res_ptr, val_len)
                val_ptr := add(val_ptr, add(val_len, sig_len))
                length := add(length, val_len)
            }

            result_ptr := allocate(length)
        }

        function _struct_bang(name_ptr, valueslist_ptr) -> result_ptr {
            let sig := getSignature(sigPtrFromNameOrSig(name_ptr))
            result_ptr := _saveStruct(sig, valueslist_ptr)
        }

        function _saveStruct(sig, valueslist_ptr) -> result_ptr {
            let list_arity := listTypeSize(mslice(valueslist_ptr, 4))
            let struct_ptr := _saveStructComponents(sig, valueslist_ptr)

            let index := _saveInner(sig, mul(list_arity, 4), struct_ptr, 1)
            result_ptr := allocate(8)
            mslicestore(result_ptr, structSigStoredChange(sig, 1), 4)
            mslicestore(add(result_ptr, 4), index, 4)
        }

        function _saveStructComponents(sig, valueslist_ptr) -> struct_ptr {
            // TODO: typecheck values & cast if neccessary/possible

            let list_arity := listTypeSize(mslice(valueslist_ptr, 4))
            struct_ptr := allocate(mul(list_arity, 4))

            let res_ptr := struct_ptr
            let val_ptr := add(valueslist_ptr, 4)

            for { let i := 0 } lt(i, list_arity) { i := add(i, 1) } {
                // typecheck with struct's type & cast if possible
                let typesig := getSignature(val_ptr)
                let value_len := getValueLength(val_ptr)
                let index := _saveInner(typesig, value_len, add(val_ptr, getSignatureLength(val_ptr)), 1)
                
                mslicestore(res_ptr, index, 4)
                res_ptr := add(res_ptr, 4)
                val_ptr := add(val_ptr, getTypedLength(val_ptr))
            }
        }

        function _list_from_struct(struct_ptr) -> result_ptr {
            let sig := mslice(struct_ptr, 4)
            let struct_id := structIdFromSig(sig)
            let arity := structSize(sig)

            // Get struct component types
            let struct_types := _getfromInner(0x20000000, 4, 0, struct_id)
            let type_ptr := add(struct_types, 8)
            let index_ptr := add(struct_ptr, 4)

            let list_ptrs := allocate(mul(arity, 32))

            for { let i := 0 } lt(i, arity) { i := add(i, 1) } {
                // type_ptr: <bytes_sig><typesig>
                // length of bytes_sig
                let typesig_len := getSignatureLength(type_ptr)
                // length of typesig
                let typesig_val_len := getValueLength(type_ptr)

                type_ptr := add(type_ptr, typesig_len)
                
                let typesig := mslice(type_ptr, typesig_val_len)
                let value_len := getValueLength(type_ptr)
                let index := mslice(index_ptr, 4)
                let arg_ptr := _getfromInner(typesig, typesig_val_len, value_len, index)

                mstore(add(list_ptrs, mul(i, 32)), arg_ptr)

                type_ptr := add(type_ptr, typesig_val_len)
                index_ptr := add(index_ptr, 4)
            }

            result_ptr := _list(arity, list_ptrs)
        }

        function _list_refs_from_struct(struct_ptr) -> result_ptr {
            let sig := mslice(struct_ptr, 4)
            let arity := structSize(sig)
            let index_ptr := add(struct_ptr, 4)
            
            // list sig + arity * (u4sig + index)
            result_ptr := allocate(add(4, mul(arity, 8)))
            mslicestore(result_ptr, buildListTypeSig(arity), 4)
            
            let now_ptr := add(result_ptr, 4)
            let indexsig := buildUintSig(4)
            for { let i := 0 } lt(i, arity) { i := add(i, 1) } {
                mslicestore(now_ptr, indexsig, 4)
                mslicestore(add(now_ptr, 4), mslice(index_ptr, 4), 4)
                index_ptr := add(index_ptr, 4)
                now_ptr := add(now_ptr, 8)
            }
        }

        function _rcall(structsig_ptr, index_ptr, data_ptr) -> result_ptr {
            let instance_ptr := _getfrom(structsig_ptr, index_ptr)
            let addr_index := mslice(add(instance_ptr, 4), 4)
            let sig_index := mslice(add(instance_ptr, 8), 4)

            // // take types from struct
            // let struct_index := structIdFromSig(mslice(add(structsig_ptr, 4), 4))
            // let struct_ptr := _getfromInner(0x20000000, 0, struct_index)
            // // first is address, second is sig
            
            let addr_ptr := _getfromInner(0x04000014, 4, 0x14, addr_index)
            let sig_ptr := _getfromInner(0x04000004, 4, 0x04, sig_index)
            let addr := mslice(add(addr_ptr, 4), 0x14)
            let sig := mslice(add(sig_ptr, 4), 0x04)

            let data_len := getValueLength(data_ptr)
            let fulldata_ptr := allocate(add(4, data_len))
            
            mslicestore(fulldata_ptr, sig, 4)
            mmultistore(add(fulldata_ptr, 4), add(data_ptr, 4), data_len)

            let result := staticcall(gas(), addr, fulldata_ptr, add(4, data_len), 0, 0)
            dtrequire(eq(result, 1), 0xeedd)
            
            let size := returndatasize()

            result_ptr := allocate(add(size, 4))
            mslicestore(result_ptr, buildBytesSig(size), 4)
            returndatacopy(add(result_ptr, 4), 0, size)
        }

        function _array(arity, ptrs) -> result_ptr {
            let emptyarr := eq(arity, 0)

            switch emptyarr
            case 0 {
                let typesig_ptr := mload(ptrs)
                let typesig_len := getSignatureLength(typesig_ptr)
                let val_len := getValueLength(typesig_ptr)
                result_ptr := allocate(add(
                    add(4, typesig_len),
                    mul(arity, val_len)
                ))
            
                mslicestore(result_ptr, buildArraySig(arity), 4)
                mmultistore(add(result_ptr, 4), typesig_ptr, typesig_len)

                let ptr := add(add(result_ptr, 4), typesig_len)
                let iniptrs := ptrs
                let arraysigs, itemsig := splitArraySig(typesig_ptr)

                for { let i := 0 } lt(i, arity) { i := add(i, 1) } {
                    let item_ptr := mload(iniptrs)
                    let item_arraysigs, item_itemsig := splitArraySig(item_ptr)
                    
                    dtrequire(eq(arraysigs, item_arraysigs), 0xee12)
                    itemsig := equalDowncastOrRevert(item_itemsig, itemsig)

                    mmultistore(ptr, add(item_ptr, typesig_len), val_len)
                    ptr := add(ptr, val_len)
                    iniptrs := add(iniptrs, 32)
                }

                // overwrite item sig
                mstorehead(add(result_ptr, 4), uconcat(arraysigs, itemsig, 4), typesig_len)
            }
            case 1 {
                result_ptr := allocate(4)
                mslicestore(result_ptr, buildArraySig(arity), 4)
            }
        }

        function _savedyn(ptrs) -> result_ptr {
            // pointer to data that has to be inserted
            let data_ptr := mload(ptrs)

            let itemsig := mslice(add(data_ptr, 4), 4)
            let arity := arrayTypeSize(mslice(data_ptr, 4))

            let index := _savedynInner(itemsig, arity, data_ptr)
            result_ptr := allocateTyped(index, buildUintSig(4), 4)
        }

        function _savedynInner(itemsig, arity, data_ptr) -> _index {
            // let typesig := 0x40000000
            // get last inserted index
            let last_index := add(getStorageCountDyn(itemsig), 1)

            let key := mappingArrayDynStorageKey_values(last_index, itemsig)

            let data_len := getValueLength(data_ptr)

            sstore(key, arity)

            storeDataInner(add(data_ptr, 8), add(key, 1), data_len)

            // store new count
            incStorageCountDyn(itemsig)

            // Internal index starts at 1
            _index := sub(last_index, 1)
        }

        function _shift(iter_ptr, value_ptr) -> result_ptr {
            let item_sig := getSignature(add(iter_ptr, 4))
            let value_sig := getSignature(value_ptr)
            let arity := iterTypeSize(iter_ptr)
            let new_arity := add(arity, 1)
            
            switch arity
            case 0 {
                let value_sig_len := getSignatureLength(value_ptr)
                let value_len := getValueLength(value_ptr)
                result_ptr := allocate(add(add(value_sig_len, 4), value_len))
                let current_ptr := result_ptr
                mslicestore(current_ptr, buildArraySig(new_arity), 4)
                current_ptr := add(current_ptr, 4)
                mmultistore(current_ptr, value_ptr, value_sig_len)
                current_ptr := add(current_ptr, value_sig_len)
                mmultistore(current_ptr, add(value_ptr, getSignatureLength(value_ptr)), value_len)
            }
            default {
                dtrequire(eq(item_sig, value_sig), 0xee12)
                let item_len := getValueLength(add(iter_ptr, 4))
                let sig_len := getSignatureLength(iter_ptr)
                result_ptr := allocate(add(mul(new_arity, item_len), sig_len))

                let current_ptr := result_ptr
                
                // change arity
                mslicestore(current_ptr, buildArraySig(new_arity), 4)
                // rest of signature
                mmultistore(add(current_ptr, 4), add(iter_ptr, 4), sub(sig_len, 4))
                current_ptr := add(result_ptr, sig_len)
                // store value
                mmultistore(current_ptr, add(value_ptr, getSignatureLength(value_ptr)), item_len)
                // store the rest
                current_ptr := add(current_ptr, item_len)
                mmultistore(current_ptr, add(iter_ptr, sig_len), mul(item_len, arity))
            }
        }

        function _push(array_ptr, value_ptr) -> result_ptr {
            // copy array at another memory location
            let array_mem_size := getTypedLength(array_ptr)
            let array_sig_size := getSignatureLength(array_ptr)
            let addition_mem_size := getValueLength(value_ptr)
            let additional_dim_size := 0
            let alloc_len := add(add(array_mem_size, addition_mem_size), additional_dim_size)
            
            result_ptr := allocate(alloc_len)
            let current_ptr := result_ptr

            let firstSig := get4b(array_ptr)
            let arity := arrayTypeSize(firstSig)
            let newsig := buildArraySig(add(arity, 1))
            let helpervar := 0

            // array signature
            mslicestore(current_ptr, newsig, 4)
            current_ptr := add(current_ptr, 4)
            helpervar := sub(array_sig_size, 4)
            // rest of the signature
            switch arity
            case 0 {
                helpervar := getSignatureLength(value_ptr)
                mslicestore(current_ptr, getSignature(value_ptr), helpervar)
                current_ptr := add(current_ptr, helpervar)
                // allocate another 4b for the item sig
                let temp := allocate(4)
            }
            default {
                mslicestore(
                    current_ptr,
                    mslice(add(array_ptr, 4), helpervar),
                    helpervar
                )
                current_ptr := add(current_ptr, helpervar)
                helpervar := sub(array_mem_size, array_sig_size)
                // copy original array
                mmultistore(current_ptr, add(array_ptr, array_sig_size), helpervar)
                current_ptr := add(current_ptr, helpervar)
            }
            
            // add the new value
            mmultistore(current_ptr, add(value_ptr, getSignatureLength(value_ptr)), addition_mem_size)
        }

        function _push_bang(ptrs) -> result_ptr {
            let typename_ptr := add(mload(ptrs), 4)
            let itemsig := mslice(add(typename_ptr, 4), 4)
            let itemsize := getValueLength(add(typename_ptr, 4))
            let siglen := getSignatureLength(add(typename_ptr, 4))

            let index := mslice(add(
                mload(add(ptrs, 32)),
                4
            ), 4)

            // Internal index starts at 1
            index := add(index, 1)

            let data_ptr := mload(add(ptrs, 64))
            let data_len := getValueLength(data_ptr)
            
            data_ptr := add(data_ptr, getSignatureLength(data_ptr))
            
            let key := mappingArrayDynStorageKey_values(index, itemsig)
            let arity := sload(key)
            
            let storage_offset := mod(mul(arity, itemsize), 32)
            let key_offset := add(div(mul(arity, itemsize), 32), 1)
            let values_key := add(key, key_offset)

            let values := sload(values_key)

            let head_len := min(sub(32, storage_offset), data_len)
            let head := mslice(data_ptr, head_len)

            values := add(values, 
                shl(mul(8, sub(sub(32, head_len), storage_offset)), head)
            )
            
            sstore(values_key, values)

            if gt(data_len, head_len) {
                storeDataInner(
                    add(data_ptr, head_len),
                    add(values_key, 1),
                    sub(data_len, head_len)
                )
            }

            arity := add(arity, 1)
            sstore(key, arity)
            // TODO what to return? entire array?
            result_ptr := allocateTyped(index, buildUintSig(4), 4)
        }

        function _getdyn(ptrs) -> result_ptr {
            let typename_ptr := add(mload(ptrs), 4)
            let itemsig := mslice(add(typename_ptr, 4), 4)
            let itemsize := getValueLength(add(typename_ptr, 4))
            let siglen := getSignatureLength(add(typename_ptr, 4))
            let index := mslice(add(
                mload(add(ptrs, 32)),
                4
            ), 4)
            result_ptr := _getdynInner(itemsig, itemsize, siglen, index)
        }

        function _getdynInner(itemsig, itemsize, siglen, index) -> result_ptr {
            // Internal index starts at 1
            index := add(index, 1)

            let key := mappingArrayDynStorageKey_values(index, itemsig)
            let arity := sload(key)
            let length := mul(arity, itemsize)
            let slen := add(4, siglen)
            result_ptr := allocate(add(length, slen))
            mslicestore(result_ptr, buildArraySig(arity), 4)
            mslicestore(add(result_ptr, 4), itemsig, siglen)
            getStoredDataInner(add(result_ptr, slen), add(key, 1), length, 0)
        }

        function getStorageCountDyn(typesig) -> count {
            count := sload(mappingArrayDynStorageKey_count(typesig))
        }

        function incStorageCountDyn(typesig) {
            let count := getStorageCountDyn(typesig)
            count := add(count, 1)
            sstore(mappingArrayDynStorageKey_count(typesig), count)
        }

        function _store(ptrs) -> result_ptr {
            let position_ptr := mload(ptrs)
            let data_ptr := mload(add(ptrs, 32))

            let position := mslice(add(position_ptr, 4), getValueLength(position_ptr))
            let sig_len := getSignatureLength(data_ptr)
            let data_len := getValueLength(data_ptr)

            storeDataInner(add(data_ptr, sig_len), position, data_len)
        }

        function _sload(ptrs) -> result_ptr {
            let position_ptr := mload(ptrs)
            let type_ptr := mload(add(ptrs, 32))
            
            let position := mslice(add(position_ptr, 4), getValueLength(position_ptr))
            let sig_len := getSignatureLength(type_ptr)
            
            // bytes4 signature, set ptr to actual data type sig
            type_ptr := add(type_ptr, 4)

            let data_len := getValueLength(type_ptr)

            result_ptr := allocate(add(data_len, sig_len))

            mmultistore(result_ptr, type_ptr, sig_len)

            getStoredDataInner(add(result_ptr, sig_len), position, data_len, 0)
        }

        function _revert(ptrs) {
            let data_ptr := mload(ptrs)
            let data_len := getTypedLength(data_ptr)
            revert(data_ptr, data_len)
        }

        function _return(ptrs) {
            let data_ptr := mload(ptrs)
            let data_len := getTypedLength(data_ptr)
            return(data_ptr, data_len)
        }

        function _defmap(ptrs) -> sig {
            let name_ptr := mload(ptrs)
            let keytype_ptr := mload(add(ptrs, 32))
            let valtype_ptr := mload(add(ptrs, 64))

            if eq(getValueLength(valtype_ptr), 32) {
                let valtype_sig_key := mappingArrayStorageKey_names(mload(add(valtype_ptr, 4)))
                mslicestore(valtype_ptr, buildBytesSig(4), 4)
                mstore(add(valtype_ptr, 4), sload(valtype_sig_key))
            }

            let keytype_len := getTypedLength(keytype_ptr)
            let valtype_len := getTypedLength(valtype_ptr)
            
            let data_len := add(keytype_len, valtype_len)
            let data_ptr := allocate(data_len)
            mmultistore(data_ptr, keytype_ptr, keytype_len)
            mmultistore(add(data_ptr, keytype_len), valtype_ptr, valtype_len)

            let id := _saveInner(sub(0x800000, 1), data_len, data_ptr, 0)
            sig := mapSigFromId(id)

            _name_bang(name_ptr, 0x800000, sig, 4)
        }

        function _mapset(ptrs) -> result_ptr {
            let name_ptr := mload(ptrs)
            let key_ptr := mload(add(ptrs, 32))
            let val_ptr := mload(add(ptrs, 64))

            let sig := getSignature(sigPtrFromNameOrSig(name_ptr))

            // TODO: typecheck key value
            
            let val_id := 0
            let valsig := getSignature(val_ptr)
            let isStructReference := and(isStruct(val_ptr), eq(structStoredFromSig(valsig), 1))
            // Hash mapping key with mapping's signature
            let key := mappingKey(sig, key_ptr)

            switch isStructReference
            case 1 {
                val_id := mslice(add(val_ptr, 4), 4)
                // Store value id at mapping key
                sstore(key, val_id)
            }
            case 0 {
                // Save value under its apropriate type
                val_id := _saveInner(valsig, getValueLength(val_ptr), add(val_ptr, getSignatureLength(val_ptr)), 1)
                // Store value id at mapping key
                // internal index starts at 1
                sstore(key, add(val_id, 1))
            }

            result_ptr := allocateTyped(val_id, buildUintSig(4), 4)
        }

        function _mapget(name_ptr, key_ptr) -> result_ptr {
            // Mapping's signature (so we can retrieve its definition)
            let sig := getSignature(sigPtrFromNameOrSig(name_ptr))
            // The id where the mapping is defined
            // let map_def_id := mapIdFromSig(sig)

            // Now we need the value's type sig from the mapping's def
            let mapdef := _getfromInner(sub(0x800000, 1), 4, 0, mapIdFromSig(sig))

            // Hash mapping key with mapping's signature
            // The mapping value's id/index
            let value_id := sload(mappingKey(sig, key_ptr))
            
            let key_type := add(mapdef, 4)    
            let value_type := add(key_type, getTypedLength(key_type))
            let typesig_ptr := add(value_type, getSignatureLength(value_type))
            let typesig_len := getValueLength(value_type)
            let typesig := mslice(typesig_ptr, typesig_len)

            // value_id === 0 -> nothing is stored there
            switch eq(value_id, 0)
            case 1 {
                result_ptr := allocateNil(typesig_ptr, typesig_len)
            }
            default {
                result_ptr := _getfromInner(
                    typesig,
                    getSignatureLength(typesig_ptr),
                    getValueLength(typesig_ptr),
                    sub(value_id, 1)  // user index starts at 0
                )
            }
        }

        function mappingKey(mapsig, key_ptr) -> _key {
            // Hash mapping key with mapping's signature
            let keysiglen := getSignatureLength(key_ptr)
            let keyvallen := getValueLength(key_ptr)
            let keyhashlen := add(4, keyvallen)
            let hash_ptr := allocate(keyhashlen)
            mslicestore(hash_ptr, mapsig, 4)
            mmultistore(add(hash_ptr, 4), add(key_ptr, keysiglen), keyvallen)
            _key := keccak256(hash_ptr, keyhashlen)
        }

        function _update_bang(name_ptr, index_ptr, value_ptr) -> result_ptr {
            let typesig := getSignature(sigPtrFromNameOrSig(name_ptr))
            let index := extractValue(index_ptr)
            let value_len := getValueLength(value_ptr)
            value_ptr := add(value_ptr, getSignatureLength(value_ptr))

            _updateInnerStaticSize(typesig, index, value_len, value_ptr)
        }

        function _name_bang(name_ptr, abstract_type_sig, sig, sig_len) {
            let name := mload(add(name_ptr, 4))
            let storageKey := mappingArrayStorageKey_names(name)
            // right padded
            sstore(storageKey, shl(sub(256, mul(sig_len, 8)), sig))
            log4(0, 0, 0xfffffffd, abstract_type_sig, name, sig)
        }

        function sigPtrFromNameOrSig(typename_ptr) -> sig_ptr {
            let is_name := isString(typename_ptr)
            typename_ptr := add(typename_ptr, 4)
            sig_ptr := typename_ptr

            if is_name {
                let name := mload(typename_ptr)
                let storageKey := mappingArrayStorageKey_names(name)
                // right padded
                sig_ptr := allocate(32)
                mstore(sig_ptr, sload(storageKey))
            }
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
        
          result := shr(sub(256, mul(length, 8)), mload(position))
        }

        function freeMemPtr() -> ptr {
            ptr := mload(0x40)
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
                        mstore(add(_ptr_target, storedBytes), mload(add(_ptr_source, storedBytes)))
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

        function buildFnSig(arity, mutability) -> signature{
            // signature :=  '1' * bit4 arity * bit27 id * mutability
            let id := getFnCounter()
            signature := add(add(exp(2, 31), shl(27, 2)), shl(1, id))
        }

        function getFn(signature) -> _pointer {
            // The following does memory allocations, so we do it first
            let key := mappingFnKey(signature)
            _pointer := freeMemPtr()
            getStoredData(_pointer, key)

            let len := mslice(_pointer, 4)
            _pointer := allocate(add(len, 4))
        }

        function getFnByName(name) -> _pointer {
            let signature := getFnSigByName(name)
            _pointer := getFn(signature)
        }

        function getFnSigByName(name) -> signature {
            signature := sload(mappingFnNameKey(name))
        }

        function storeFn(name, signature, _expr_ptr) {
            storeData(_expr_ptr, mappingFnKey(signature))
            sstore(mappingFnNameKey(name), signature)
            updateFnCounter()
            log3(0, 0, 0xffffffff, name, signature)
        }

        function updateFnCounter() {
            let count := getFnCounter()
            sstore(mappingFnCountKey(), add(count, 1))
        }

        function getFnCounter() -> _count {
            _count := sload(mappingFnCountKey())
        }

        function updateRegCounter() {
            let count := getRegCounter()
            sstore(mappingRegCountKey(), add(count, 1))
        }

        function getRegCounter() -> _count {
            _count := sload(mappingRegCountKey())
        }

        // expects a length before the type
        function storeRegAddress(_pointer) -> index {
            // TODO: check if type is valid
            index := add(getRegCounter(), 1)
            let addr :=  mslice(_pointer, 24)
            sstore(mappingRegKey(index), addr)
            updateRegCounter()
            log2(0, 0, 0xfffffffe, addr)
        }

        function getRegAddress(index) -> addr {
            addr := shl(64, sload(mappingRegKey(index)))
            // TODO check if type_ids are the same & content is valid
        }

        function mappingFnCountKey() -> storageKey {
            storageKey := 0
        }

        function mappingFnKey(signature) -> storageKey {
            storageKey := mappingStorageKey(1, signature)
        }

        function mappingFnNameKey(name) -> storageKey {
            storageKey := mappingStorageKey(2, name)
        }

        function mappingRegCountKey() -> storageKey {
            storageKey := 6
        }

        function mappingRegKey(index) -> storageKey {
            storageKey := mappingStorageKey(7, index)
        }

        // mapping(bytes32(max) => *)
        function mappingStorageKey(storageIndex, key) -> storageKey {
            let ptr := allocate(64)
            mstore(ptr, key)
            mstore(add(ptr, 32), storageIndex)
            storageKey := keccak256(ptr, 64)
        }

        function mappingArrayStorageKey_starts(index, typesig) -> storageKey {
            let ptr := allocate(96)
            mstore(ptr, typesig)
            mstore(add(ptr, 32), 0)
            mstore(add(ptr, 64), index)
            storageKey := keccak256(ptr, 96)
        }

        function mappingArrayStorageKey_lengths(index, typesig) -> storageKey {
            let ptr := allocate(96)
            mstore(ptr, typesig)
            mstore(add(ptr, 32), 1)
            mstore(add(ptr, 64), index)
            storageKey := keccak256(ptr, 96)
        }

        function mappingArrayStorageKey_values(index, typesig) -> storageKey {
            let ptr := allocate(96)
            mstore(ptr, typesig)
            mstore(add(ptr, 32), 3)
            mstore(add(ptr, 64), index)
            storageKey := keccak256(ptr, 96)
        }

        function mappingArrayStorageKey_count(typesig) -> storageKey {
            let ptr := allocate(64)
            mstore(ptr, typesig)
            mstore(add(ptr, 32), 4)
            storageKey := keccak256(ptr, 64)
        }

        function mappingArrayStorageKey_names(name) -> storageKey {
            let ptr := allocate(64)
            mstore(ptr, 5)
            mstore(add(ptr, 32), name)
            storageKey := keccak256(ptr, 64)
        }

        function mappingStorageKey_owner() -> storageKey {
            storageKey := 7
        }

        function mappingArrayDynStorageKey_values(index, typesig) -> storageKey {
            let ptr := allocate(96)
            mstore(ptr, typesig)
            mstore(add(ptr, 32), 8)
            mstore(add(ptr, 64), index)
            storageKey := keccak256(ptr, 96)
        }

        function mappingArrayDynStorageKey_count(typesig) -> storageKey {
            let ptr := allocate(64)
            mstore(ptr, typesig)
            mstore(add(ptr, 32), 9)
            storageKey := keccak256(ptr, 64)
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

        function dtrequire(cond, error_bytes) {
            if eq(cond, 0) {
                mslicestore(0, error_bytes, 2)
                revert(0, 2)
            }
        }
    }}
}
