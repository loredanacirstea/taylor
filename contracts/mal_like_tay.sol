object "Taylor" {
    code {
        // updateFnCounter
        sstore(0, 100)
        
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
        
        let end, res := eval(_calldata, 0)
        return (res, getTypedLength(res))
        
        function eval(data_ptr, env_ptr) -> end_ptr, result_ptr {
            let sig := getFuncSig(data_ptr)

            switch isFunction(data_ptr)
            case 0 {
                switch and(gt(env_ptr, 0), isLambdaUnknown(mslice(data_ptr, 4)))
                case 1 {
                    // replace variables from lambdas
                    let index := mslice(add(data_ptr, 4), 4)
                    let value_ptr := add(env_ptr, mul(index, 32))
                    let size := getTypedLength(value_ptr)
                    result_ptr := value_ptr
                    end_ptr := add(data_ptr, size)
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
                result_ptr := _add(add(arg_ptrs_ptr, 32))
            }
            // 10010000000000000000000000000100
            case 0x90000004 {
                result_ptr := _sub(add(arg_ptrs_ptr, 32))
            }
            case 0x90000006 {
                result_ptr := _mul(add(arg_ptrs_ptr, 32))
            }
            case 0x90000008 {
                result_ptr := _div(add(arg_ptrs_ptr, 32))
            }
            case 0x9000000a {
                result_ptr := _sdiv(add(arg_ptrs_ptr, 32))
            }
            case 0x9000000c {
                result_ptr := _mod(add(arg_ptrs_ptr, 32))
            }
            case 0x9000000e {
                result_ptr := _smod(add(arg_ptrs_ptr, 32))
            }
            case 0x90000010 {
                result_ptr := _exp(add(arg_ptrs_ptr, 32))
            }
            case 0x88000012 {
                result_ptr := _not(add(arg_ptrs_ptr, 32))
            }
            case 0x90000014 {
                result_ptr := _lt(add(arg_ptrs_ptr, 32))
            }
            case 0x90000016 {
                result_ptr := _gt(add(arg_ptrs_ptr, 32))
            }
            case 0x90000018 {
                result_ptr := _slt(add(arg_ptrs_ptr, 32))
            }
            case 0x9000001a {
                result_ptr := _sgt(add(arg_ptrs_ptr, 32))
            }
            case 0x9000001c {
                result_ptr := _eq(add(arg_ptrs_ptr, 32))
            }
            case 0x8800001e {
                result_ptr := _iszero(add(arg_ptrs_ptr, 32))
            }
            case 0x90000020 {
                result_ptr := _and(add(arg_ptrs_ptr, 32))
            }
            case 0x90000022 {
                result_ptr := _or(add(arg_ptrs_ptr, 32))
            }
            case 0x90000024 {
                result_ptr := _xor(add(arg_ptrs_ptr, 32))
            }
            case 0x90000026 {
                result_ptr := _byte(add(arg_ptrs_ptr, 32))
            }
            case 0x90000028 {
                result_ptr := _shl(add(arg_ptrs_ptr, 32))
            }
            case 0x9000002a {
                result_ptr := _shr(add(arg_ptrs_ptr, 32))
            }
            case 0x9000002c {
                result_ptr := _sar(add(arg_ptrs_ptr, 32))
            }
            case 0x9800002e {
                result_ptr := _addmod(add(arg_ptrs_ptr, 32))
            }
            case 0x98000030 {
                result_ptr := _mulmod(add(arg_ptrs_ptr, 32))
            }
            case 0x90000032 {
                result_ptr := _signextend(add(arg_ptrs_ptr, 32))
            }
            case 0x90000034 {
                result_ptr := _keccak256(add(arg_ptrs_ptr, 32))
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
                result_ptr := _contig(add(arg_ptrs_ptr, 32))
            }
            case 0x9000004e {
                result_ptr := _concat(add(arg_ptrs_ptr, 32))
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
                result_ptr := _empty(add(arg_ptrs_ptr, 32))
            }
            case 0x8800005c {
                result_ptr := _true(add(arg_ptrs_ptr, 32))
            }
            case 0x8800005e {
                result_ptr := _false(add(arg_ptrs_ptr, 32))
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
            case 0x9800010b {
                result_ptr := _rcall(add(arg_ptrs_ptr, 32))
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
        
        function getFuncSig(ptr) -> _sig {
            _sig := mslice(ptr, 4)
        }

        // function 10000000000000000000000000000000
        function isFunction(ptr) -> isi {
            let sig := getFuncSig(ptr)
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
        function isArray(sig) -> isa {
            let id := and(sig, 0x7fffffe)
            isa := eq(id, 0x10c)
        }
        // 01000000000000000000000000000000
        function isArrayType(ptr) -> isi {
            let sig := getFuncSig(ptr)
            isi := eq(and(shr(30, sig), 0x03), 1)
        }

        // 00100000000000000000000000000000
        // 111 - 0x07
        function isStruct(ptr) -> isi {
            let sig := getFuncSig(ptr)
            isi := eq(and(shr(29, sig), 0x07), 1)
        }

        // 00010000000000000000000000000000
        function isListType(sig) -> isi {
            isi := eq(and(shr(28, sig), 0x0f), 1)
        }

        // 00001000000000000000000000000000
        // 11111 - 1f
        function isNumber(ptr) -> isi {
            let sig := getFuncSig(ptr)
            isi := eq(and(shr(27, sig), 0x1f), 1)
        }

        function isBool(sig) -> isi {
            isi := eq(and(sig, 0xffff0000), 0x0a800000)
        }

        // 00000100000000000000000000000000
        // 111111 - 0x3f
        function isBytes(ptr) -> isi {
            let sig := getFuncSig(ptr)
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
                _length := 8
            }
        }

        // TODO: array, struct, more efficient - nested switches?
        function getValueLength(ptr) -> _length {
            let sig := getFuncSig(ptr)
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
                // it contains u32 pointers to data; 
                _length := mul(structSize(sig), 4)
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
        
        // arity - 4 bits -> 16 args
        // 01111000000000000000000000000000
        function getFuncArity(ptr) -> arity {
            arity := shr(27, and(getFuncSig(ptr), 0x78000000))
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

        function structSigFromId(id, arity) -> signature {
            // signature :=  '001' * bit4 arity * bit24 id * bit1 stored?
            signature := add(add(add(exp(2, 29), shl(25, arity)), shl(1, id)), 1)
        }

        function structIdFromSig(signature) -> index {
            index := shl(8, and(signature, 0x1fffffe))
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
            let end, res := eval(lambda_body_ptr, args_ptr)
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
            switch mslice(add(cond_answ, 4), 4)
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

                let end, res := eval(dataptr, 0)
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
                let end, res := eval(lambda_body_ptr, arg_ptr)
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

                let end, res := eval(dataptr, 0)

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
                
                let end, res := eval(lambda_body_ptr, newargs)
  
                mmultistore(accum_ptr, res, getTypedLength(res))
                arg_ptr := add(arg_ptr, arg_length)
            }

            result_ptr := accum_ptr
        }
       
        // TODO: auto cast if overflow
        function _add(ptrs) -> result_ptr {
            result_ptr := allocate(32)
            let ptr1 := mload(ptrs)
            let ptr2 := mload(add(ptrs, 32))
            let c := add(
                mslice(add(ptr1, getSignatureLength(ptr1)), getValueLength(ptr1)),
                mslice(add(ptr2, getSignatureLength(ptr2)), getValueLength(ptr2))
            )
            mslicestore(result_ptr, uconcat(getFuncSig(ptr1), c, 4), 8)
        }

        function _sub(ptrs) -> result_ptr {
            result_ptr := allocate(32)
            let ptr1 := mload(ptrs)
            let ptr2 := mload(add(ptrs, 32))
            let c := sub(
                mslice(add(ptr1, getSignatureLength(ptr1)), getValueLength(ptr1)),
                mslice(add(ptr2, getSignatureLength(ptr2)), getValueLength(ptr2))
            )
            mslicestore(result_ptr, uconcat(getFuncSig(ptr1), c, 4), 8)
        }
        
        function _mul(ptrs) -> result_ptr {
            result_ptr := allocate(32)
            let ptr1 := mload(ptrs)
            let ptr2 := mload(add(ptrs, 32))
            let c := mul(
                mslice(add(ptr1, getSignatureLength(ptr1)), getValueLength(ptr1)),
                mslice(add(ptr2, getSignatureLength(ptr2)), getValueLength(ptr2))
            )
            mslicestore(result_ptr, uconcat(getFuncSig(ptr1), c, 4), 8)
        }
        
        function _div(ptrs) -> result_ptr {
            result_ptr := allocate(32)
            let ptr1 := mload(ptrs)
            let ptr2 := mload(add(ptrs, 32))
            let c := div(
                mslice(add(ptr1, getSignatureLength(ptr1)), getValueLength(ptr1)),
                mslice(add(ptr2, getSignatureLength(ptr2)), getValueLength(ptr2))
            )
            mslicestore(result_ptr, uconcat(getFuncSig(ptr1), c, 4), 8)
        }
        
        function _sdiv(ptrs) -> result_ptr {
            result_ptr := allocate(32)
            let ptr1 := mload(ptrs)
            let ptr2 := mload(add(ptrs, 32))
            let c := sdiv(
                mslice(add(ptr1, getSignatureLength(ptr1)), getValueLength(ptr1)),
                mslice(add(ptr2, getSignatureLength(ptr2)), getValueLength(ptr2))
            )
            mslicestore(result_ptr, uconcat(getFuncSig(ptr1), c, 4), 8)
        }
        
        function _mod(ptrs) -> result_ptr {
            result_ptr := allocate(32)
            let ptr1 := mload(ptrs)
            let ptr2 := mload(add(ptrs, 32))
            let c := mod(
                mslice(add(ptr1, getSignatureLength(ptr1)), getValueLength(ptr1)),
                mslice(add(ptr2, getSignatureLength(ptr2)), getValueLength(ptr2))
            )
            mslicestore(result_ptr, uconcat(getFuncSig(ptr1), c, 4), 8)
        }
        
        function _smod(ptrs) -> result_ptr {
            result_ptr := allocate(32)
            let ptr1 := mload(ptrs)
            let ptr2 := mload(add(ptrs, 32))
            let c := smod(
                mslice(add(ptr1, getSignatureLength(ptr1)), getValueLength(ptr1)),
                mslice(add(ptr2, getSignatureLength(ptr2)), getValueLength(ptr2))
            )
            mslicestore(result_ptr, uconcat(getFuncSig(ptr1), c, 4), 8)
        }
        
        function _exp(ptrs) -> result_ptr {
            result_ptr := allocate(32)
            let ptr1 := mload(ptrs)
            let ptr2 := mload(add(ptrs, 32))
            let c := exp(
                mslice(add(ptr1, getSignatureLength(ptr1)), getValueLength(ptr1)),
                mslice(add(ptr2, getSignatureLength(ptr2)), getValueLength(ptr2))
            )
            // get max sig size
            // exp - size: 
            mslicestore(result_ptr, uconcat(getFuncSig(ptr1), c, 4), 8)
        }
        
        function _not(ptrs) -> result_ptr {
            result_ptr := allocate(32)
            let ptr1 := mload(ptrs)
            let c := not(
                mslice(add(ptr1, getSignatureLength(ptr1)), getValueLength(ptr1))
            )
            mslicestore(result_ptr, uconcat(getFuncSig(ptr1), c, 4), 8)
        }
        
        function _lt(ptrs) -> result_ptr {
            result_ptr := allocate(32)
            let ptr1 := mload(ptrs)
            let ptr2 := mload(add(ptrs, 32))
            let c := lt(
                mslice(add(ptr1, getSignatureLength(ptr1)), getValueLength(ptr1)),
                mslice(add(ptr2, getSignatureLength(ptr2)), getValueLength(ptr2))
            )
            mslicestore(result_ptr, uconcat(getFuncSig(ptr1), c, 4), 8)
        }
        
        function _gt(ptrs) -> result_ptr {
            result_ptr := allocate(32)
            let ptr1 := mload(ptrs)
            let ptr2 := mload(add(ptrs, 32))
            let c := gt(
                mslice(add(ptr1, getSignatureLength(ptr1)), getValueLength(ptr1)),
                mslice(add(ptr2, getSignatureLength(ptr2)), getValueLength(ptr2))
            )
            mslicestore(result_ptr, uconcat(getFuncSig(ptr1), c, 4), 8)
        }
        
        function _slt(ptrs) -> result_ptr {
            result_ptr := allocate(32)
            let ptr1 := mload(ptrs)
            let ptr2 := mload(add(ptrs, 32))
            let c := slt(
                mslice(add(ptr1, getSignatureLength(ptr1)), getValueLength(ptr1)),
                mslice(add(ptr2, getSignatureLength(ptr2)), getValueLength(ptr2))
            )
            mslicestore(result_ptr, uconcat(getFuncSig(ptr1), c, 4), 8)
        }
        
        function _sgt(ptrs) -> result_ptr {
            result_ptr := allocate(32)
            let ptr1 := mload(ptrs)
            let ptr2 := mload(add(ptrs, 32))
            let c := sgt(
                mslice(add(ptr1, getSignatureLength(ptr1)), getValueLength(ptr1)),
                mslice(add(ptr2, getSignatureLength(ptr2)), getValueLength(ptr2))
            )
            mslicestore(result_ptr, uconcat(getFuncSig(ptr1), c, 4), 8)
        }
        
        function _eq(ptrs) -> result_ptr {
            result_ptr := allocate(32)
            let ptr1 := mload(ptrs)
            let ptr2 := mload(add(ptrs, 32))
            let c := eq(
                mslice(add(ptr1, getSignatureLength(ptr1)), getValueLength(ptr1)),
                mslice(add(ptr2, getSignatureLength(ptr2)), getValueLength(ptr2))
            )
            mslicestore(result_ptr, uconcat(getFuncSig(ptr1), c, 4), 8)
        }
        
        function _iszero(ptrs) -> result_ptr {
            result_ptr := allocate(32)
            let ptr1 := mload(ptrs)
            let c := iszero(
                mslice(add(ptr1, getSignatureLength(ptr1)), getValueLength(ptr1))
            )
            mslicestore(result_ptr, uconcat(getFuncSig(ptr1), c, 4), 8)
        }
        
        function _and(ptrs) -> result_ptr {
            result_ptr := allocate(32)
            let ptr1 := mload(ptrs)
            let ptr2 := mload(add(ptrs, 32))
            let c := and(
                mslice(add(ptr1, getSignatureLength(ptr1)), getValueLength(ptr1)),
                mslice(add(ptr2, getSignatureLength(ptr2)), getValueLength(ptr2))
            )
            mslicestore(result_ptr, uconcat(getFuncSig(ptr1), c, 4), 8)
        }
        
        function _or(ptrs) -> result_ptr {
            result_ptr := allocate(32)
            let ptr1 := mload(ptrs)
            let ptr2 := mload(add(ptrs, 32))
            let c := or(
                mslice(add(ptr1, getSignatureLength(ptr1)), getValueLength(ptr1)),
                mslice(add(ptr2, getSignatureLength(ptr2)), getValueLength(ptr2))
            )
            mslicestore(result_ptr, uconcat(getFuncSig(ptr1), c, 4), 8)
        }
        
        function _xor(ptrs) -> result_ptr {
            result_ptr := allocate(32)
            let ptr1 := mload(ptrs)
            let ptr2 := mload(add(ptrs, 32))
            let c := xor(
                mslice(add(ptr1, getSignatureLength(ptr1)), getValueLength(ptr1)),
                mslice(add(ptr2, getSignatureLength(ptr2)), getValueLength(ptr2))
            )
            mslicestore(result_ptr, uconcat(getFuncSig(ptr1), c, 4), 8)
        }
        
        function _byte(ptrs) -> result_ptr {
            result_ptr := allocate(32)
            let ptr1 := mload(ptrs)
            let ptr2 := mload(add(ptrs, 32))
            let c := byte(
                mslice(add(ptr1, getSignatureLength(ptr1)), getValueLength(ptr1)),
                mslice(add(ptr2, getSignatureLength(ptr2)), getValueLength(ptr2))
            )
            mslicestore(result_ptr, uconcat(getFuncSig(ptr1), c, 4), 8)
        }
        
        function _shl(ptrs) -> result_ptr {
            result_ptr := allocate(32)
            let ptr1 := mload(ptrs)
            let ptr2 := mload(add(ptrs, 32))
            let c := shl(
                mslice(add(ptr1, getSignatureLength(ptr1)), getValueLength(ptr1)),
                mslice(add(ptr2, getSignatureLength(ptr2)), getValueLength(ptr2))
            )
            mslicestore(result_ptr, uconcat(getFuncSig(ptr1), c, 4), 8)
        }
        
        function _shr(ptrs) -> result_ptr {
            result_ptr := allocate(32)
            let ptr1 := mload(ptrs)
            let ptr2 := mload(add(ptrs, 32))
            let c := shr(
                mslice(add(ptr1, getSignatureLength(ptr1)), getValueLength(ptr1)),
                mslice(add(ptr2, getSignatureLength(ptr2)), getValueLength(ptr2))
            )
            mslicestore(result_ptr, uconcat(getFuncSig(ptr1), c, 4), 8)
        }
        
        function _sar(ptrs) -> result_ptr {
            result_ptr := allocate(32)
            let ptr1 := mload(ptrs)
            let ptr2 := mload(add(ptrs, 32))
            let c := sar(
                mslice(add(ptr1, getSignatureLength(ptr1)), getValueLength(ptr1)),
                mslice(add(ptr2, getSignatureLength(ptr2)), getValueLength(ptr2))
            )
            mslicestore(result_ptr, uconcat(getFuncSig(ptr1), c, 4), 8)
        }
        
        function _addmod(ptrs) -> result_ptr {
            result_ptr := allocate(32)
            let ptr1 := mload(ptrs)
            let ptr2 := mload(add(ptrs, 32))
            let ptr3 := mload(add(ptrs, 64))
            let c := addmod(
                mslice(add(ptr1, getSignatureLength(ptr1)), getValueLength(ptr1)),
                mslice(add(ptr2, getSignatureLength(ptr2)), getValueLength(ptr2)),
                mslice(add(ptr3, getSignatureLength(ptr3)), getValueLength(ptr3))
            )
            mslicestore(result_ptr, uconcat(getFuncSig(ptr1), c, 4), 8)
        }
        
        function _mulmod(ptrs) -> result_ptr {
            result_ptr := allocate(32)
            let ptr1 := mload(ptrs)
            let ptr2 := mload(add(ptrs, 32))
            let ptr3 := mload(add(ptrs, 64))
            let c := mulmod(
                mslice(add(ptr1, getSignatureLength(ptr1)), getValueLength(ptr1)),
                mslice(add(ptr2, getSignatureLength(ptr2)), getValueLength(ptr2)),
                mslice(add(ptr3, getSignatureLength(ptr3)), getValueLength(ptr3))
            )
            mslicestore(result_ptr, uconcat(getFuncSig(ptr1), c, 4), 8)
        }
        
        function _signextend(ptrs) -> result_ptr {
            result_ptr := allocate(32)
            let ptr1 := mload(ptrs)
            let ptr2 := mload(add(ptrs, 32))
            let c := signextend(
                mslice(add(ptr1, getSignatureLength(ptr1)), getValueLength(ptr1)),
                mslice(add(ptr2, getSignatureLength(ptr2)), getValueLength(ptr2))
            )
            mslicestore(result_ptr, uconcat(getFuncSig(ptr1), c, 4), 8)
        }
        
        function _keccak256(ptrs) -> result_ptr {
            result_ptr := allocate(32)
            let ptr1 := mload(ptrs)
            let ptr2 := mload(add(ptrs, 32))
            let c := keccak256(
                mslice(add(ptr1, getSignatureLength(ptr1)), getValueLength(ptr1)),
                mslice(add(ptr2, getSignatureLength(ptr2)), getValueLength(ptr2))
            )
            mslicestore(result_ptr, uconcat(getFuncSig(ptr1), c, 4), 8)
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

        function _contig(ptrs) -> result_ptr {
            let ptr1 := mload(ptrs)
            let ptr2 := mload(add(ptrs, 32))
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

        function _concat(ptrs) -> result_ptr {
            let ptr1 := mload(ptrs)
            let ptr2 := mload(add(ptrs, 32))
            let len1 := bytesSize(mslice(ptr1, 4))
            let len2 := bytesSize(mslice(ptr2, 4))
            let newsig := buildBytesSig(add(len1, len2))
            
            result_ptr := allocate(add(4, add(len1, len2)))
            mslicestore(result_ptr, newsig, 4)
            mmultistore(add(result_ptr, 4), add(ptr1, 4), len1)
            mmultistore(add(add(result_ptr, 4), len1), add(ptr2, 4), len2)
        }

        function _empty(ptrs) -> result_ptr {
            let list_ptr := mload(ptrs)
            let sig := mslice(list_ptr, 4)
            let list_arity := listTypeSize(sig)
            result_ptr := allocate(4)

            mslicestore(result_ptr, buildBoolSig(
                or(eq(sig, 0x00), eq(list_arity, 0))
            ), 4)
        }

        function _true(ptrs) -> result_ptr {
            let sig := mslice(mload(ptrs), 4)
            mslicestore(result_ptr, buildBoolSig(
                and(isBool(sig), eq(and(sig, 0xffff), 1))
            ), 4)
        }

        function _false(ptrs) -> result_ptr {
            let sig := mslice(mload(ptrs), 4)
            mslicestore(result_ptr, buildBoolSig(
                and(isBool(sig), eq(and(sig, 0xffff), 0))
            ), 4)
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

            let typename_ptr := add(mload(add(ptrs, 32)), 4)

            // type signature - data is of this type
            let typesig := mslice(typename_ptr, getSignatureLength(typename_ptr))
            let typesize := getValueLength(typename_ptr)
            if eq(typesig, 0) {
                typesig := mslice(data_ptr, getSignatureLength(data_ptr))
                typesize := getValueLength(data_ptr)
            }

            let index := _saveInner(typesig, typesize, data_ptr)
            result_ptr := allocate(8)
            mslicestore(result_ptr, buildUintSig(4), 4)
            mslicestore(add(result_ptr, 4), index, 4)
        }

        function _saveInner(typesig, typesize, data_ptr) -> _index {
            // get last inserted index - i
            let last_index := getStorageCount(typesig)
            let storage_pos := 0
            
            switch typesize
            // dynamic size
            case 0 {
                let start_delta := 32
                // length of data to be inserted
                let data_len := getValueLength(data_ptr)
            
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

                storage_pos := add(start_i, offset_len)

                // store length
                storeLength(j, last_index, typesig, start_delta, data_len)
            }
            // static size
            default {
                storage_pos := mul(last_index, typesize)
            }

            // store value
            storeAtPos(storage_pos, typesig, data_ptr)

            // store new count
            incStorageCount(typesig)

            _index := last_index
        }

        function _getfrom(ptrs) -> result_ptr {
            let typename_ptr := add(mload(ptrs), 4)
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

        function storeAtPos(storage_pos, typesig, data_ptr) {
            let storage_slot := div(storage_pos, 32)
            let storage_offset := mod(storage_pos, 32)
            let key := mappingArrayStorageKey_values(storage_slot, typesig)
            let values := sload(key)
            let data_len := getValueLength(data_ptr)

            data_ptr := add(data_ptr, getSignatureLength(data_ptr))

            let head_len := min(sub(32, storage_offset), data_len)
            let head := mslice(data_ptr, head_len)

            values := add(values, 
                shl(mul(8, sub(sub(32, head_len), storage_offset)), head)
            )
            
            sstore(key, values)

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
                    key,
                    sub(data_len, head_len),
                    0
                )
            }
        }

        function _defstruct(ptrs) -> sig {
            let name_ptr := mload(ptrs)
            let typelist_ptr := mload(add(ptrs, 32))
            let arity := listTypeSize(mslice(typelist_ptr, 4))

            let struct_abstract_id := 0x20000000

            let data_len := getTypedLength(typelist_ptr)
            let newdata_ptr := allocate(add(data_len, 4))
            mslicestore(newdata_ptr, buildBytesSig(data_len), 4)
            mmultistore(add(newdata_ptr, 4), typelist_ptr, data_len)

            // struct abstract id
            let id := _saveInner(struct_abstract_id, 0, newdata_ptr)
            sig := structSigFromId(id, arity)

            // TODO: this should be in save & saved under a signature type
            // and functions should be stored in the same way
            let name := mload(name_ptr)
            let storageKey := mappingArrayStorageKey_names(struct_abstract_id, name)
            sstore(storageKey, sig)
            log3(0, 0, struct_abstract_id, name, sig)
        }

        function _struct(ptrs) -> result_ptr {
            let name_ptr := mload(ptrs)
            let valueslist_ptr := mload(add(ptrs, 32))
            let struct_abstract_id := 0x20000000
            let name := mload(name_ptr)
            let storageKey := mappingArrayStorageKey_names(struct_abstract_id, name)
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

            let ptr := add(result_ptr, 8)
            let iniptrs := add(ptrs, 32)

            let typesig := getFuncSig(typesig_ptr)

            for { let i := 0 } lt(i, arity) { i := add(i, 1) } {
                let item_ptr := mload(iniptrs)
                
                // TODO fix sig comparison
                dtrequire(eq(getFuncSig(item_ptr), typesig), 0xeecc)
                mmultistore(ptr, add(item_ptr, typesig_len), val_len)
                ptr := add(ptr, val_len)
                iniptrs := add(iniptrs, 32)
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

        // function mslice(position, length) -> result {
        //   if gt(length, 32) { revert(0, 0) } // protect against overflow
        
        //   result := shr(sub(256, mul(length, 8)), mload(position))
        // }

        function freeMemPtr() -> ptr {
            ptr := mload(0x40)
            if iszero(ptr) { ptr := 0x60 }
        }
        
        function allocate(size) -> ptr {
            ptr := freeMemPtr()
            mstore(0x40, add(ptr, size))
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
                        mstore(safeAdd(_ptr_target, storedBytes), mload(safeAdd(_ptr_source, storedBytes)))
                        storedBytes := add(storedBytes, 32)
                    }
                    case 0 {
                        mslicestore(
                            safeAdd(_ptr_target, storedBytes),
                            mslice(safeAdd(_ptr_source, storedBytes), remaining),
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
            mstore(ptr, key, storageIndex)
            storageKey := keccak256(ptr, 64)
        }

        function mappingArrayStorageKey_starts(index, typesig) -> storageKey {
            let ptr := allocate(96)
            mstore(ptr, typesig, 0, index)
            storageKey := keccak256(ptr, 96)
        }

        function mappingArrayStorageKey_lengths(index, typesig) -> storageKey {
            let ptr := allocate(96)
            mstore(ptr, typesig, 1, index)
            storageKey := keccak256(ptr, 96)
        }

        function mappingArrayStorageKey_values(index, typesig) -> storageKey {
            let ptr := allocate(96)
            mstore(ptr, typesig, 3, index)
            storageKey := keccak256(ptr, 96)
        }

        function mappingArrayStorageKey_count(typesig) -> storageKey {
            let ptr := allocate(64)
            mstore(ptr, typesig, 4)
            storageKey := keccak256(ptr, 64)
        }

        function mappingArrayStorageKey_names(typesig, name) -> storageKey {
            let ptr := allocate(96)
            mstore(ptr, typesig, 5, name)
            storageKey := keccak256(ptr, 96)
        }

        // mapping(bytes => *)
        function mappingStorageKey2(storageIndex, key_ptr, key_len) -> storageKey {
            mmultistore(0, key_ptr, key_len)
            mstore(add(0, key_len), storageIndex)
            storageKey := keccak256(0, add(key_len, 32))
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
            }
        }

        function getStoredData(_pointer, storageKey) {
            let slot := 32
            // read first storage slot, for the length
            mstore(_pointer, sload(storageKey))

            let sizeBytes := mslice(_pointer, 4)
            let loadedBytes := sub(slot, 4)

            if gt(sizeBytes, loadedBytes) {
                getStoredDataInner(add(_pointer, 32), storageKey, sizeBytes, loadedBytes)
            }
        }

        function getStoredDataInner(_pointer, storageKey, sizeBytes, loadedBytes) {
            let slot := 32
            let index := 1

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
