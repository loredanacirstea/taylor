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
                switch and(gt(env_ptr, 0), isLambdaUnknown(mslice(data_ptr, 4)))
                case 1 {
                    // replace variables from lambdas
                    let index := mslice(add(data_ptr, 4), 4)
                    let value_ptr := add(env_ptr, mul(index, 32))
                    result_ptr := value_ptr
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
                    // store lambda body ptr
                    mstore(args_ptrs_now, end_ptr)
                    end_ptr := add(end_ptr, lambdaLength(sig))
                    // apply function on arguments
                    result_ptr := evalWithEnv(sig, args_ptrs)
                }
                case 0 {
                    let isIf := eq(sig, 0x9800004a)
                    switch isIf
                    case 0 {
                        for { let i := 0 } lt(i, arity) { i := add(i, 1) } {
                            let _end_ptr, arg_ptr := eval(end_ptr, env_ptr)
                            
                            // store pointer to argument value
                            mstore(args_ptrs_now, arg_ptr)
                            end_ptr := _end_ptr
                            args_ptrs_now := add(args_ptrs_now, 32)
                        }

                        // apply function on arguments
                        result_ptr := evalWithEnv(sig, args_ptrs)
                    }
                    case 1 {
                        let _end_ptr, _result_ptr := _if(end_ptr, env_ptr)
                        end_ptr := _end_ptr
                        result_ptr := _result_ptr
                    }
                }
            }
        }
        
        function evalWithEnv(fsig, arg_ptrs_ptr) -> result_ptr {
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
            case 0x90000050 {
                result_ptr := _map(arg_ptrs_ptr)
            }
            case 0x98000052 {
                result_ptr := _reduce(arg_ptrs_ptr)
            }
            case 0x90000054 {
                result_ptr := _nth(add(arg_ptrs_ptr, 32))
            }
            case 0x88000056 {
                result_ptr := _first(add(arg_ptrs_ptr, 32))
            }
            case 0x88000058 {
                result_ptr := _rest(add(arg_ptrs_ptr, 32))
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
                result_ptr := _getfrom(add(arg_ptrs_ptr, 32))
            }
            // defstruct!
            case 0x900000c4 {
                let ssig := _defstruct(add(arg_ptrs_ptr, 32))
                result_ptr := allocate(8)
                mslicestore(result_ptr, uconcat(buildBytesSig(4), ssig, 4), 8)
            }
            // struct
            case 0x90000106 {
                result_ptr := _struct(add(arg_ptrs_ptr, 32))
            }
            // struct!
            case 0x90000108 {
                result_ptr := _struct_bang(add(arg_ptrs_ptr, 32))
            }
            case 0x9800010b {
                result_ptr := _rcall(add(arg_ptrs_ptr, 32))
            }
            case 0x9000010e {
                result_ptr := _savedyn(add(arg_ptrs_ptr, 32))
            }
            case 0x98000110 {
                result_ptr := _push(add(arg_ptrs_ptr, 32))
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
                result_ptr := _list_from_struct(add(arg_ptrs_ptr, 32))
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

            default {
                let isthis := 0

                isthis := isList(fsig)
                if eq(isthis, 1) {
                    result_ptr := _list(mload(arg_ptrs_ptr), add(arg_ptrs_ptr, 32))
                }

                if eq(isthis, 0) {
                    isthis := isLambda(fsig)
                    if eq(isthis, 1) {
                        result_ptr := _lambda(arg_ptrs_ptr)
                    }
                }

                if eq(isthis, 0) {
                    isthis := isApply(fsig)
                    if eq(isthis, 1) {
                        result_ptr := _apply(arg_ptrs_ptr)
                    }
                }

                if eq(isthis, 0) {
                    isthis := isArray(fsig)
                    if eq(isthis, 1) {
                        result_ptr := _array(arg_ptrs_ptr)
                    }
                }

                if eq(isthis, 0) {
                    isthis := isKeccak256(fsig)
                    if eq(isthis, 1) {
                        result_ptr := _keccak256(arg_ptrs_ptr)
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
                                    add(arg_ptrs_ptr, 64)
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
                            add(arg_ptrs_ptr, 32)
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
            let test := and(vartype, 0x1000000)
            islu := eq(iszero(test), 0)
        }
        // 10000000000000000000000001000000
        function isApply(sig) -> isapp {
            // 00000111111111111111111111111110
            let id := and(sig, 0x7fffffe)
            // 1000000
            isapp := eq(id, 0x40)
        }
        // 10000000000000000000000000111110
        function isList(sig) -> isl {
            // 00000111111111111111111111111110
            let id := and(sig, 0x7fffffe)
            isl := eq(id, 0x3e)
        }
        // 10011000000000000000000001001000
        function isGetByName(sig) -> isget {
            // 00000111111111111111111111111110
            let id := and(sig, 0x7fffffe)
            // 1001000
            isget := eq(id, 0x48)
        }
        function isKeccak256(sig) -> isa {
            let id := and(sig, 0x7fffffe)
            isa := eq(id, 0x34)
        }
        function isArray(sig) -> isa {
            let id := and(sig, 0x7fffffe)
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

        // 00010000000000000000000000000000
        function isListType(sig) -> isi {
            isi := eq(and(shr(28, sig), 0x0f), 1)
        }

        // 00001000000000000000000000000000
        // 11111 - 1f
        function isNumber(ptr) -> isi {
            let sig := get4b(ptr)
            isi := eq(and(shr(27, sig), 0x1f), 1)
        }

        function isBool(sig) -> isi {
            isi := eq(and(sig, 0xffff0000), 0x0a800000)
        }

        // 00000100000000000000000000000000
        // 111111 - 0x3f
        function isBytes(ptr) -> isi {
            let sig := get4b(ptr)
            isi := eq(and(shr(26, sig), 0x3f), 1)
        }

        // last 16 bits
        function numberSize(sig) -> _size {
            _size := and(sig, 0xffff)
        }

        // last 24 bits
        function listTypeSize(sig) -> _size {
            _size := and(sig, 0xffffff)
        }

        function bytesSize(sig) -> _size {
            _size := and(sig, 0x3ffffff)
        }

        function structSize(sig) -> _size {
            _size := shr(25, and(sig, 0x1e000000))
        }

        function arrayTypeSize(sig) -> _size {
            _size := and(sig, 0x3fffffff)
        }
        
        // 11111111111111111111111110
        function lambdaLength(sig) -> _blength {
            _blength := shr(1, and(sig, 0x3fffffe))
        }

        // TODO: for arrays
        function getSignatureLength(ptr) -> _length {
            _length := 4

            if isArrayType(ptr) {
                _length := add(4, getSignatureLength(add(ptr, 4)))
            }
        }

        // TODO: array, struct, more efficient - nested switches?
        function getValueLength(ptr) -> _length {
            let sig := get4b(ptr)
            let done := 0
            if and(eq(done, 0), isFunction(ptr)) {
                _length := 0
                done := 1
            }
            if and(eq(done, 0), isArrayType(ptr)) {
                let arity := arrayTypeSize(sig)
                let item_size := getValueLength(add(ptr, 4))
                _length := mul(arity, item_size)
                done := 1
            }
            if and(eq(done, 0), isStruct(ptr)) {
                let storage_ref := structStoredFromSig(sig)
                switch storage_ref
                case 1 {
                    // if storage reference, it only contains a u4 storage id/index
                    _length := 4
                }
                default {
                    // it contains u32 pointers to data; 
                    _length := mul(structSize(sig), 4)
                }
                done := 1
            }
            if and(eq(done, 0), isListType(sig)) {
                let size := listTypeSize(sig)
                let ptr_now := add(ptr, getSignatureLength(ptr))
                for { let i := 0 } lt(i, size) { i := add(i, 1) } {
                    let item_len := getTypedLength(ptr_now)
                    _length := add(_length, item_len)
                    ptr_now := add(ptr_now, item_len)
                }
                done := 1
            }
            if and(eq(done, 0), isBool(sig)) {
                _length := 0
                done := 1
            }
            if and(eq(done, 0), isNumber(ptr)) {
                _length := numberSize(sig)
                done := 1
            }
            if and(eq(done, 0), isBytes(ptr)) {
                _length := bytesSize(sig)
                done := 1
            }
        }

        function getTypedLength(ptr) -> _length {
            _length := add(getValueLength(ptr), getSignatureLength(ptr))
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

        function buildLambdaSig(bodylen) -> signature {
            // signature :=  '100011' * bit25 bodylen * 0
            signature := add(
                add(add(exp(2, 31), exp(2, 27)), exp(2, 26)),
                shl(1, bodylen)
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
            signature := add(0xa910000, size)
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

        function _apply(arg_ptrs) -> _data_ptr {
            let arity := mload(arg_ptrs)
            
            // lambda_ptr can be a signature or a lambda pointer
            let lambda_body_ptr := mload(mload(add(arg_ptrs, 32)))
            
            // TODO: if signature -> call eval

            _data_ptr :=  _applyInner(arity, lambda_body_ptr, add(arg_ptrs, 64))
        }

        function _applyInner(arity, lambda_body_ptr, arg_ptrs) -> _data_ptr {
            let args_ptr := _join_ptrs(arity, arg_ptrs)
            let endd, res := eval(lambda_body_ptr, args_ptr)
            _data_ptr := res
        }

        function _lambda(arg_ptrs) -> _data_ptr {
            // skip arity, just point to the lambda body
            _data_ptr := add(arg_ptrs, 32)
        }

        // TODO: mmultistore
        function _join_ptrs(arity, arg_ptrs) -> _data_ptr {
            _data_ptr := allocate(mul(arity, 32))
            let addit := 0
            for { let i := 0 } lt(i, arity) { i := add(i, 1) } {
                mstore(
                    add(_data_ptr, addit), 
                    mload(mload(add(arg_ptrs, addit)))
                )
                addit := add(addit, 32)
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

        function _map(ptrs) -> result_ptr {
            // first arg is arity = 2
            let fptr := mload(add(ptrs, 32))
            let list_ptr := mload(add(ptrs, 64))

            let sigsig := mslice(fptr, 4)
            switch sigsig
            case 0x04000004 {
                result_ptr := _mapInnerNative(mslice(add(fptr, 4), 4), list_ptr)
            }
            default {
                result_ptr := _mapInnerLambda(add(fptr, 4), list_ptr)
            }
        }

        function _mapInnerNative(sig, list_ptr) -> result_ptr {
            let list_arity := listTypeSize(mslice(list_ptr, 4))
            let arg_ptr := add(list_ptr, 4)
            let results_ptrs := allocate(mul(list_arity, 32))

            // iterate over list & apply function on each arg
            for { let i := 0 } lt(i, list_arity) { i := add(i, 1) } {
                let arglen := getTypedLength(arg_ptr)
                let dataptr := allocate(add(4, arglen))
                mslicestore(dataptr, sig, 4)
                mmultistore(add(dataptr, 4), arg_ptr, arglen)

                let endd, res := eval(dataptr, 0)
                mstore(add(results_ptrs, mul(i, 32)), res)

                let arg_len := getTypedLength(arg_ptr)
                arg_ptr := add(arg_ptr, arg_len)
            }

            // Recreate list from result pointers
            result_ptr := _list(list_arity, results_ptrs)
        }

        function _mapInnerLambda(lambda_body_ptr, list_ptr) -> result_ptr {
            // TODO: fixme: we only get the arity here, not the id
            // it is ok here, but might be problematic later
            let list_arity := listTypeSize(mslice(list_ptr, 4))
            let arg_ptr := add(list_ptr, 4)
            let results_ptrs := allocate(mul(list_arity, 32))

            // iterate over list & apply function on each arg
            for { let i := 0 } lt(i, list_arity) { i := add(i, 1) } {
                let endd, res := eval(lambda_body_ptr, arg_ptr)
                mstore(add(results_ptrs, mul(i, 32)), res)

                let arg_len := getTypedLength(arg_ptr)
                arg_ptr := add(arg_ptr, arg_len)
            }

            // Recreate list from result pointers
            result_ptr := _list(list_arity, results_ptrs)
        }

        function _reduce(ptrs) -> result_ptr {
            // first arg is arity = 2
            let fptr := mload(add(ptrs, 32))
            let list_ptr := mload(add(ptrs, 64))
            let accum_ptr := mload(add(ptrs, 96))

            let sigsig := mslice(fptr, 4)
            switch sigsig
            case 0x04000004 {
                result_ptr := _reduceInnerNative(mslice(add(fptr, 4), 4), list_ptr, accum_ptr)
            }
            default {
                result_ptr := _reduceInnerLambda(add(fptr, 4), list_ptr, accum_ptr)
            }
        }

        function _reduceInnerNative(sig, list_ptr, accum_ptr) -> result_ptr {
            let list_arity := listTypeSize(mslice(list_ptr, 4))
            let arg_ptr := add(list_ptr, 4)
            let accum_length := getTypedLength(accum_ptr)

            // iterate over list & apply function on each arg
            for { let i := 0 } lt(i, list_arity) { i := add(i, 1) } {
                let arg_length := getTypedLength(arg_ptr)
                let dataptr := allocate(add(add(4, arg_length), accum_length))
                mslicestore(dataptr, sig, 4)
                mmultistore(add(dataptr, 4), accum_ptr, accum_length)
                mmultistore(add(add(dataptr, 4), accum_length), arg_ptr, arg_length)

                let endd, res := eval(dataptr, 0)

                mmultistore(accum_ptr, res, getTypedLength(res))
                arg_ptr := add(arg_ptr, arg_length)
            }

            result_ptr := accum_ptr
        }

        function _reduceInnerLambda(lambda_body_ptr, list_ptr, accum_ptr) -> result_ptr {
            let list_arity := listTypeSize(mslice(list_ptr, 4))
            let arg_ptr := add(list_ptr, 4)
            let accum_length := getTypedLength(accum_ptr)

            // iterate over list & apply function on each arg
            for { let i := 0 } lt(i, list_arity) { i := add(i, 1) } {
                let arg_length := getTypedLength(arg_ptr)

                // TODO: fixme - use the actual lengths
                // the bytes32 slots come from 
                
                // let newargs := allocate(accum_length)
                let newargs := allocate(32)
                mmultistore(newargs, accum_ptr, accum_length)
                
                // let currentarg := allocate(arg_length)
                let currentarg := allocate(32)
                mmultistore(currentarg, arg_ptr, arg_length)
                
                let endd, res := eval(lambda_body_ptr, newargs)
  
                mmultistore(accum_ptr, res, getTypedLength(res))
                arg_ptr := add(arg_ptr, arg_length)
            }

            result_ptr := accum_ptr
        }
       
        // TODO: auto cast if overflow
        function _add(ptr1, ptr2) -> result_ptr {
            let c := add(extractValue(ptr1), extractValue(ptr2))
            result_ptr := allocateTyped(c, get4b(ptr1), 4)
        }

        function _sub(ptr1, ptr2) -> result_ptr {
            let c := sub(extractValue(ptr1), extractValue(ptr2))
            result_ptr := allocateTyped(c, get4b(ptr1), 4)
        }
        
        function _mul(ptr1, ptr2) -> result_ptr {
            let c := mul(extractValue(ptr1), extractValue(ptr2))
            result_ptr := allocateTyped(c, get4b(ptr1), 4)
        }
        
        function _div(ptr1, ptr2) -> result_ptr {
            let c := div(extractValue(ptr1), extractValue(ptr2))
            result_ptr := allocateTyped(c, get4b(ptr1), 4)
        }
        
        function _sdiv(ptr1, ptr2) -> result_ptr {
            let c := sdiv(extractValue(ptr1), extractValue(ptr2))
            result_ptr := allocateTyped(c, get4b(ptr1), 4)
        }
        
        function _mod(ptr1, ptr2) -> result_ptr {
            let c := mod(extractValue(ptr1), extractValue(ptr2))
            result_ptr := allocateTyped(c, get4b(ptr1), 4)
        }
        
        function _smod(ptr1, ptr2) -> result_ptr {
            let c := smod(extractValue(ptr1), extractValue(ptr2))
            result_ptr := allocateTyped(c, get4b(ptr1), 4)
        }
        
        function _exp(ptr1, ptr2) -> result_ptr {
            let c := exp(extractValue(ptr1), extractValue(ptr2))
            // get max sig size ; exp - size: 
            result_ptr := allocateTyped(c, get4b(ptr1), 4)
        }
        
        function _not(ptr1) -> result_ptr {
            let c := not(extractValue(ptr1))
            result_ptr := allocateTyped(c, buildUintSig(4), 4)
        }
        
        function _lt(ptr1, ptr2) -> result_ptr {
            let c := lt(extractValue(ptr1), extractValue(ptr2))
            result_ptr := allocateTyped(c, buildUintSig(1), 4)
        }
        
        function _gt(ptr1, ptr2) -> result_ptr {
            let c := gt(extractValue(ptr1), extractValue(ptr2))
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

        function _nth(ptrs) -> result_ptr {
            let list_ptr := mload(ptrs)
            let index := mslice(add(mload(add(ptrs, 32)), 4), 4)
            let list_arity := listTypeSize(mslice(list_ptr, 4))

            dtrequire(lt(index, list_arity), 0xe011)
            let nth_ptr := add(list_ptr, 4)

            for { let i := 0 } lt(i, index) { i := add(i, 1) } {
                nth_ptr := add(nth_ptr, getTypedLength(nth_ptr))
            }
            result_ptr := nth_ptr
        }

        function _first(ptrs) -> result_ptr {
            let list_ptr := mload(ptrs)
            // first item is after the list signature
            result_ptr := add(list_ptr, 4)
        }

        function _rest(ptrs) -> result_ptr {
            let list_ptr := mload(ptrs)
            let list_arity := listTypeSize(mslice(list_ptr, 4))
            let newlistid := buildListTypeSig(sub(list_arity, 1))
            let newlist := allocate(4)
            result_ptr := newlist

            mslicestore(newlist, newlistid, 4)
            newlist := add(newlist, 4)

            // skip signature &  first item
            list_ptr := add(list_ptr, 4)
            let elem_length := getTypedLength(list_ptr)
            list_ptr := add(list_ptr, elem_length)

            for { let i := 0 } lt(i, sub(list_arity, 1)) { i := add(i, 1) } {
                elem_length := getTypedLength(list_ptr)
                mmultistore(newlist, list_ptr, elem_length)
                list_ptr := add(list_ptr, elem_length)
                newlist := add(newlist, elem_length)
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
            _index := add(getStorageCount(typesig), 1)
            let storage_pos := mul(_index, value_len)

            storeAtPos(storage_pos, typesig, value_len, value_ptr)
            incStorageCount(typesig)
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

        function _getfrom(ptrs) -> result_ptr {
            let typename_ptr := mload(ptrs)
            let typename_len := getValueLength(typename_ptr)
            typename_ptr := add(typename_ptr, 4)

            // if name;
            if eq(typename_len, 32) {
                let name := mload(typename_ptr)
                let storageKey := mappingArrayStorageKey_names(name)
                mstore(typename_ptr, sload(storageKey))
            }

            let sig_len := getSignatureLength(typename_ptr)
            let typesig := mslice(typename_ptr, sig_len)

            let index := mslice(add(
                mload(add(ptrs, 32)),
                4
            ), 4)

            let typesize := getValueLength(typename_ptr)
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

        function _defstruct(ptrs) -> sig {
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

            // TODO: this should be in save & saved under a signature type
            // and functions should be stored in the same way
            let name := mload(add(name_ptr, 4))
            let storageKey := mappingArrayStorageKey_names(name)
            sstore(storageKey, shl(224, sig))
            log3(0, 0, struct_abstract_id, name, sig)
        }

        function _struct(ptrs) -> result_ptr {
            let name_ptr := mload(ptrs)
            let valueslist_ptr := mload(add(ptrs, 32))
            let struct_abstract_id := 0x20000000
            let name := mload(add(name_ptr, 4))
            let storageKey := mappingArrayStorageKey_names(name)
            let sig := sload(storageKey)

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

        function _struct_bang(ptrs) -> result_ptr {
            let name_ptr := mload(ptrs)
            let valueslist_ptr := mload(add(ptrs, 32))

            // Get struct's signature from name
            let name := mload(add(name_ptr, 4))
            let storageKey := mappingArrayStorageKey_names(name)
            let sig := shr(224, sload(storageKey))

            // TODO: typecheck values & cast if neccessary/possible

            let list_arity := listTypeSize(mslice(valueslist_ptr, 4))
            let struct_ptr := allocate(mul(list_arity, 4))

            let res_ptr := struct_ptr
            let val_ptr := add(valueslist_ptr, 4)

            for { let i := 0 } lt(i, list_arity) { i := add(i, 1) } {
                let typesig := getSignature(val_ptr)
                let value_len := getValueLength(val_ptr)
                let index := _saveInner(typesig, value_len, add(val_ptr, getSignatureLength(val_ptr)), 1)
                
                mslicestore(res_ptr, index, 4)
                res_ptr := add(res_ptr, 4)
                val_ptr := add(val_ptr, getTypedLength(val_ptr))
            }

            let index := _saveInner(sig, mul(list_arity, 4), struct_ptr, 1)
            result_ptr := allocate(8)
            mslicestore(result_ptr, structSigStoredChange(sig, 1), 4)
            mslicestore(add(result_ptr, 4), index, 4)
        }

        function _list_from_struct(ptrs) -> result_ptr {
            let struct_ptr := mload(ptrs)
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

        function _rcall(ptrs) -> result_ptr {
            let structsig_ptr := mload(ptrs)
            let data_ptr := mload(add(ptrs, 64))
            let instance_ptr := _getfrom(ptrs)
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

        function _array(ptrs) -> result_ptr {
            let arity := mload(ptrs)
            let typesig_ptr := mload(add(ptrs, 32))
            let typesig_len := getSignatureLength(typesig_ptr)
            let val_len := getValueLength(typesig_ptr)
            result_ptr := allocate(add(
                add(4, typesig_len),
                mul(arity, val_len)
            ))
            
            mslicestore(result_ptr, buildArraySig(arity), 4)
            mmultistore(add(result_ptr, 4), typesig_ptr, typesig_len)

            let ptr := add(add(result_ptr, 4), typesig_len)
            let iniptrs := add(ptrs, 32)

            let typesig := get4b(typesig_ptr)

            for { let i := 0 } lt(i, arity) { i := add(i, 1) } {
                let item_ptr := mload(iniptrs)
                
                // TODO fix sig comparison
                dtrequire(eq(get4b(item_ptr), typesig), 0xeecc)
                mmultistore(ptr, add(item_ptr, typesig_len), val_len)
                ptr := add(ptr, val_len)
                iniptrs := add(iniptrs, 32)
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

        function _push(ptrs) -> result_ptr {
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

            let name := mload(add(name_ptr, 4))
            let storageKey := mappingArrayStorageKey_names(name)
            sstore(storageKey, sig)
            log3(0, 0, 0x800000, name, sig)
        }

        function _mapset(ptrs) -> result_ptr {
            let name_ptr := mload(ptrs)
            let key_ptr := mload(add(ptrs, 32))
            let val_ptr := mload(add(ptrs, 64))

            // Get mapping signature from name
            let name := mload(add(name_ptr, 4))
            let storageKey := mappingArrayStorageKey_names(name)
            let sig := sload(storageKey)

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
            let name := mload(add(name_ptr, 4))
            let storageKey := mappingArrayStorageKey_names(name)
            // Mapping's signature (so we can retrieve its definition)
            let sig := sload(storageKey)
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
                mslice(add(_ptr, 4), sub(slot, 4)),
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
