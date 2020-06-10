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
            getFn(0, sig)
            return (4, mslice(0, 4))
        }

        if eq(mslice(_calldata, 4), 0x44444442) {
            let name := mload(add(_calldata, 4))
            getFnByName(0, name)
            return (4, mslice(0, 4))
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
            case 0x880000c0 {
                result_ptr := allocate(32)
                let index := storeRegAddress(mload(add(arg_ptrs_ptr, 32)))
            }
            case 0x880000c2 {
                result_ptr := allocate(32)
                // TODO check type
                let index := mslice(add(mload(add(arg_ptrs_ptr, 32)), 4), 4)
                let addr := getRegAddress(index)
                mstore(result_ptr, addr)
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
            let func_ptr := freeMemPtr()
            getFn(func_ptr, fsig)
            
            let len := mslice(func_ptr, 4)
            func_ptr := allocate(add(len, 4))
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
        function isFunction(ptr) -> isf {
            let sig := getFuncSig(ptr)
            let func := and(sig, 0x80000000)
            isf := eq(iszero(func), 0)
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
        // 01000000000000000000000000000000
        function isArray(ptr) -> isa {
            let sig := getFuncSig(ptr)
            let numb := and(sig, 0x40000000)
            isa := eq(iszero(numb), 0)
        }

        // 00100000000000000000000000000000
        function isStruct(ptr) -> iss {
            let sig := getFuncSig(ptr)
            let numb := and(sig, 0x20000000)
            iss := eq(iszero(numb), 0)
        }

        // 00010000000000000000000000000000
        function isListType(sig) -> isl {
            let numb := and(sig, 0x10000000)
            isl := eq(iszero(numb), 0)
        }

        // 00001000000000000000000000000000
        function isNumber(ptr) -> isn {
            let sig := getFuncSig(ptr)
            let numb := and(sig, 0x8000000)
            isn := eq(iszero(numb), 0)
        }

        function isBool(sig) -> isbool {
            isbool := eq(and(sig, 0xffff0000), 0x0a800000)
        }

        // 00000100000000000000000000000000
        function isBytes(ptr) -> isn {
            let sig := getFuncSig(ptr)
            let numb := and(sig, 0x4000000)
            isn := eq(iszero(numb), 0)
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
        
        // 11111111111111111111111110
        function lambdaLength(sig) -> _blength {
            _blength := shr(1, and(sig, 0x3fffffe))
        }

        // TODO: for arrays
        function getSignatureLength(ptr) -> _length {
            _length := 4
        }

        // TODO: array, struct, more efficient - nested switches?
        function getValueLength(ptr) -> _length {
            let sig := getFuncSig(ptr)
            if isFunction(ptr) {
                _length := 0
            }
            if isArray(ptr) {
                // _length := arraySize(ptr)
            }
            if isStruct(ptr) {
                // _length := structSize(ptr)
            }
            if isListType(sig) {
                let size := listTypeSize(sig)
                let ptr_now := add(ptr, getSignatureLength(ptr))
                for { let i := 0 } lt(i, size) { i := add(i, 1) } {
                    let item_len := getTypedLength(ptr_now)
                    _length := add(_length, item_len)
                    ptr_now := add(ptr_now, item_len)
                } 
            }
            if isNumber(ptr) {
                _length := numberSize(sig)
            }
            if isBytes(ptr) {
                _length := bytesSize(sig)
            }
            if isBool(sig) {
                _length := 0
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

        function getFn(_pointer, signature) {
            getStoredData(_pointer, mappingFnKey(signature))
        }

        function getFnByName(_pointer, name) {
            let signature := getFnSigByName(name)
            getFn(_pointer, signature)
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
            mstore(0, key, storageIndex)
            storageKey := keccak256(0, 64)
        }

        // mapping(bytes => *)
        function mappingStorageKey2(storageIndex, key_ptr, key_len) -> storageKey {
            mmultistore(0, key_ptr, key_len)
            mstore(add(0, key_len), storageIndex)
            storageKey := keccak256(0, add(key_len, 32))
        }

        function storeData(_pointer, storageKey) {
            let sizeBytes := add(mslice(_pointer, 4), 4)
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
            _pointer := add(_pointer, 32)

            if gt(sizeBytes, loadedBytes) {
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
        }

        function dtrequire(cond, error_bytes) {
            if eq(cond, 0) {
                mslicestore(0, error_bytes, 2)
                revert(0, 2)
            }
        }
    }}
}
