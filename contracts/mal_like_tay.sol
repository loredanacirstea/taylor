object "malLikeTay" {
    code {
        datacopy(0, dataoffset("Runtime"), datasize("Runtime"))
        return(0, datasize("Runtime"))
    }
    object "Runtime" {
    code {
        
        // function: 1 000 00000000000000000000000000 0 0
        // - typeid, arity, id, payable, mutability

        // array   : 01 000000000000000000000000000000
        // - typeid, length
        
        // struct  : 001 0000 000000000000000000000000 0
        // - typeid, arity, id, exists in storage or not -> if yes, signature follows
        
        // list    : 0001 0000 000000000000000000000000
        // - typeid, list type (vector..?), size
        
        // number  : 00001 00000000000 0000000000000000
        // - typeid, bit11 subtypeid, size
        
        let _calldata := allocate(calldatasize())
        calldatacopy(_calldata, 0, calldatasize())

        // store func
        if eq(mslice(_calldata, 4), 0x44444444) {
            let sig := mslice(add(_calldata, 4), 4)
            storeFn(add(_calldata, 8), sig)
            return (0, 0)
        }

        // get func
        if eq(mslice(_calldata, 4), 0x44444443) {
            let sig := mslice(add(_calldata, 4), 4)
            getFn(0, sig)
            return (4, mslice(0, 4))
        }
        
        let end, res := eval(_calldata, 0)
        return (res, getTypedLength(res))
        
        function eval(data_ptr, env_ptr) -> end_ptr, result_ptr {
            let sig := getFuncSig(data_ptr)

            // if !list -> eval_ast(ast)
            // if [] -> ast
            // if list -> eval_ast(ast) ; Take the first item of the evaluated list and call it as function using the rest of the evaluated list as its arguments

            // eval_ast:
            // list: -> list(eval(item)..)
            // vector: -> vector(eval(item)..)
            // hash-map: -> hash-map(key => eval(value))
            // default: return ast

            switch isFunction(data_ptr)
            case 0 {
                switch gt(env_ptr, 0)
                case 1 {
                    // replace args from lambdas
                    let index := and(mslice(data_ptr, 4), 0x3f)
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
                }
                case 0 {
                    for { let i := 0 } lt(i, arity) { i := add(i, 1) } {
                        let _end_ptr, arg_ptr := eval(end_ptr, env_ptr)

                        // store pointer to argument value
                        mstore(args_ptrs_now, arg_ptr)
                        end_ptr := _end_ptr
                        args_ptrs_now := add(args_ptrs_now, 32)
                    }
                }
                
                // apply function on arguments
                result_ptr := evalWithEnv(sig, args_ptrs)
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
            case 0x90000012 {
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
            case 0x9000001e {
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
            case 0x9000002e {
                result_ptr := _addmod(add(arg_ptrs_ptr, 32))
            }
            case 0x90000030 {
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
            // list
            case 0xa800003e {
                result_ptr := list(arg_ptrs_ptr)
            }

            case 0x98000040 {
                result_ptr := _apply(arg_ptrs_ptr)
            }

            // TODO: better lambda
            default {
                switch isLambda(fsig)
                case 1 {
                    result_ptr := lambda(arg_ptrs_ptr)
                }
                case 0 {
                    // try storage
                    // TODO storage cache
                    let func_ptr := freeMemPtr()
                    getFn(func_ptr, fsig)
                    let len := mslice(func_ptr, 4)
                    func_ptr := allocate(len)

                    let arity := mload(arg_ptrs_ptr)
                    let nextptr := add(func_ptr, add(len, 4))
                    let nextarg := add(arg_ptrs_ptr, 32)
                    
                    for { let i := 0 } lt(i, arity) { i := add(i, 1) } {
                        let arg_ptr := mload(nextarg)
                        let arglen := getTypedLength(arg_ptr)
                        mmultistore(nextptr, arg_ptr, arglen)
                        nextptr := add(nextptr, arglen)
                        nextarg := add(nextarg, 32)
                        let _ := allocate(arglen)
                    }
                    
                    // for some reason the above allocations are not enough,
                    // resulting in some bytes being rewritten
                    let _ := allocate(32)

                    let _end_ptr, arg_ptr := eval(add(func_ptr, 4), 0)
                    result_ptr := arg_ptr
                }
            }
            // TODO: search in registered contracts
            // TODO: revert if function not found
        }
        
        function getFuncSig(ptr) -> _sig {
            _sig := mslice(ptr, 4)
        }

        // function 10000000000000000000000000000000
        function isFunction(ptr) -> isf {
            let sig := getFuncSig(ptr)
            let func := and(sig, 2147483648) // 0x80000000)
            isf := gt(func, 0)
        }

        // 10001100000000000000000000000000
        // 100000000000000000000000000
        function isLambda(sig) -> isl {
            let func := and(sig, 0x4000000)  // 0x8c000000)
            isl := gt(func, 0)
        }

        // 01000000000000000000000000000000
        function isArray(ptr) -> isa {
            let sig := getFuncSig(ptr)
            let numb := and(sig, 0x40000000)
            isa := gt(numb, 0)
        }

        // 00100000000000000000000000000000
        function isStruct(ptr) -> iss {
            let sig := getFuncSig(ptr)
            let numb := and(sig, 0x20000000)
            iss := gt(numb, 0)
        }

        // 00010000000000000000000000000000
        function isList(ptr) -> isl {
            let sig := getFuncSig(ptr)
            let numb := and(sig, 0x10000000)
            isl := gt(numb, 0)
        }

        // 00001000000000000000000000000000
        function isNumber(ptr) -> isn {
            let sig := getFuncSig(ptr)
            let numb := and(sig, 0x8000000)
            isn := gt(numb, 0)
        }

        // last 16 bits
        function numberSize(sig) -> _size {
            _size := and(sig, 0xffff)
        }

        // last 24 bits
        function listSize(sig) -> _size {
            _size := and(sig, 0xffffff)
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
            if isList(ptr) {
                let size := listSize(sig)
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
        }

        function getTypedLength(ptr) -> _length {
            _length := add(getValueLength(ptr), getSignatureLength(ptr))
        }
        
        // arity - 4 bits -> 16 args
        // 01111000000000000000000000000000
        function getFuncArity(ptr) -> arity {
            arity := shr(27, and(getFuncSig(ptr), 0x78000000))
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

        function list(arg_ptrs) -> _data_ptr {
            let arity := mload(arg_ptrs)
            let ptrs := add(arg_ptrs, 32)
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
            let lambda_ptr := mload(mload(add(arg_ptrs, 32)))
            
            // TODO: if signature -> call eval
            
            let args_ptr := allocate(mul(arity, 32))
            let source := add(arg_ptrs, 64)
            let addit := 0
            for { let i := 0 } lt(i, arity) { i := add(i, 1) } {
                mstore(
                    add(args_ptr, addit), 
                    mload(mload(add(source, addit)))
                )
                addit := add(addit, 32)
            }

            let end, res := eval(lambda_ptr, args_ptr)
            // TODO: end?
            _data_ptr := res
        }

        function lambda(arg_ptrs) -> _data_ptr {
            // skip arity, just point to the lambda body
            _data_ptr := add(arg_ptrs, 32)
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

        function getFn(_pointer, signature) {
            getStoredData(_pointer, mappingFnKey(signature))
        }

        function storeFn(_pointer, signature) {
            storeData(_pointer, mappingFnKey(signature))
        }

        function mappingFnKey(signature) -> storageKey {
            storageKey := mappingStorageKey(1, signature)
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
            let slot := 32
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
            let loadedData := sub(slot, 4)

            if gt(sizeBytes, loadedData) {
                sizeBytes := sub(sizeBytes, loadedData)
                let storedBytes := 0
                let index := 0

                for {} lt(storedBytes, sizeBytes) {} {
                    let remaining := sub(sizeBytes, storedBytes)
                    switch gt(remaining, 31)
                    case 1 {
                        mstore(add(_pointer, storedBytes), sload(add(storageKey, add(index, 1))))
                        storedBytes := add(storedBytes, 32)
                        index := add(index, 1)
                    }
                    case 0 {
                        if gt(remaining, 0) {
                            mstore(add(_pointer, storedBytes), sload(add(storageKey, add(index, 1))))
                            storedBytes := add(storedBytes, remaining)
                        }
                    }
                }
            }
        }
    }}
}
