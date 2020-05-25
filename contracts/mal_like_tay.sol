object "malLikeTay" {
    code {
        // codeCopy
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
        
        let _calldata := 512
        calldatacopy(_calldata, 0, calldatasize())
        
        let end, res := execute(_calldata)
        return (res, 8)
        
        
        function execute(data_ptr) -> end_ptr, result_ptr {
            let sig := getFuncSig(data_ptr)

            switch isFunction(data_ptr)
            case 0 {
                result_ptr := data_ptr
                end_ptr := add(data_ptr, getTypedLength(data_ptr))
            }
            case 1 {
                let arity := getFuncArity(data_ptr)
                
                switch arity
                case 0 {
                    // TODO sig length
                    end_ptr := add(data_ptr, 8)
                    result_ptr := executeNative(sig, 0, 0, 0, 0, 0, 0, 0, 0)
                }
                case 1 {
                    // TODO sig length
                    let _end_ptr, arg1_ptr := execute(add(data_ptr, 4))
                    end_ptr := _end_ptr
                    
                    result_ptr := executeNative(sig, arg1_ptr, 0, 0, 0, 0, 0, 0, 0)
                }
                case 2 {
                    // TODO sig length
                    let _end1_ptr, arg1_ptr := execute(add(data_ptr, 4))
                    let _end2_ptr, arg2_ptr := execute(_end1_ptr)
 
                    end_ptr := _end2_ptr
                    
                    result_ptr := executeNative(sig, arg1_ptr, arg2_ptr, 0, 0, 0, 0, 0, 0)
                }
            }
        }
        
        function executeNative(fsig, ptr1, ptr2, ptr3, ptr4, ptr5, ptr6, ptr7, ptr8) -> result_ptr {
            switch fsig
            case 2684354564 {
                result_ptr := _add(ptr1, ptr2)
            }
            case 2684354568 {
                result_ptr := _sub(ptr1, ptr2)
            }
        }
        
        function getFuncSig(ptr) -> _sig {
            _sig := mslice(ptr, 4)
        }

        // function 10000000000000000000000000000000
        function isFunction(ptr) -> isf {
            let sig := getFuncSig(ptr)
            let func := and(sig, 2147483648)
            isf := gt(func, 0)
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

        // TODO: for arrays
        function getSignatureLength(ptr) -> _length {
            _length := 4
        }

        function getValueLength(ptr) -> _length {
            let sig := getFuncSig(ptr)
            if isFunction(ptr) {
                _length := 0
            }
            if isNumber(ptr) {
                _length := numberSize(sig)
            }
        }

        function getTypedLength(ptr) -> _length {
            _length := add(getValueLength(ptr), getSignatureLength(ptr))
        }
        
        // arity - first 3 bits 0 -> 7
        function getFuncArity(ptr) -> arity {
            // 01110000000000000000000000000000
            arity := shr(28, and(getFuncSig(ptr), 1879048192))
        }
        
        function read(str) -> _str {
            _str := str
        }

        function eval(ast, env) -> answ {
            answ := ast
        }

        function print(ast) -> answ {
            answ := ast
        }

        function rep(line) -> answ {
            answ := print(eval(read(line), 0))
        }
       
        // 10100000000000000000000000000100
        // 2684354564
        // TODO: auto cast if overflow
        function _add(ptr1, ptr2) -> result_ptr {
            result_ptr := allocate(32)
            let c := add(
                mslice(add(ptr1, getSignatureLength(ptr1)), getValueLength(ptr1)),
                mslice(add(ptr2, getSignatureLength(ptr2)), getValueLength(ptr2))
            )
            mslicestore(result_ptr, uconcat(getFuncSig(ptr1), c, 4), 8)
        }
        
        // 10100000000000000000000000001000
        // 2684354568
        function _sub(ptr1, ptr2) -> result_ptr {
            result_ptr := allocate(32)
            let c := sub(
                mslice(add(ptr1, getSignatureLength(ptr1)), getValueLength(ptr1)),
                mslice(add(ptr2, getSignatureLength(ptr2)), getValueLength(ptr2))
            )
            mslicestore(result_ptr, uconcat(getFuncSig(ptr1), c, 4), 8)
        }
        
        function _mul(a, b) -> c {
            c := mul(a, b)
        }
        
        function _div(a, b) -> c {
            c := div(a, b)
        }
        
        function _sdiv(a, b) -> c {
            c := sdiv(a, b)
        }
        
        function _mod(a, b) -> c {
            c := mod(a, b)
        }
        
        function _smod(a, b) -> c {
            c := smod(a, b)
        }
        
        function _exp(a, b) -> c {
            c := exp(a, b)
        }
        
        function _not(a) -> c {
            c := not(a)
        }
        
        function _lt(a, b) -> c {
            c := lt(a, b)
        }
        
        function _gt(a, b) -> c {
            c := gt(a, b)
        }
        
        function _slt(a, b) -> c {
            c := slt(a, b)
        }
        
        function _sgt(a, b) -> c {
            c := sgt(a, b)
        }
        
        function _eq(a, b) -> c {
            c := eq(a, b)
        }
        
        function _iszero(a) -> c {
            c := iszero(a)
        }
        
        function _and(a, b) -> c {
            c := and(a, b)
        }
        
        function _or(a, b) -> c {
            c := or(a, b)
        }
        
        function _xor(a, b) -> c {
            c := xor(a, b)
        }
        
        function _byte(a, b) -> c {
            c := byte(a, b)
        }
        
        function _shl(a, b) -> c {
            c := shl(a, b)
        }
        
        function _shr(a, b) -> c {
            c := shr(a, b)
        }
        
        function _sar(a, b) -> c {
            c := sar(a, b)
        }
        
        function _addmod(a, b, m) -> c {
            c := addmod(a, b, m)
        }
        
        function _mulmod(a, b, m) -> c {
            c := mulmod(a, b, m)
        }
        
        function _signextend(a, b) -> c {
            c := signextend(a, b)
        }
        
        function _keccak256(a, b) -> c {
            c := keccak256(a, b)
        }
        
        function _call(a, v, inptr, insize, outptr, outsize) -> c {
            c := call(gas(), a, v, inptr, insize, outptr, outsize)
        }
        
        function _callcode(a, v, inptr, insize, outptr, outsize) -> c {
            c := callcode(gas(), a, v, inptr, insize, outptr, outsize)
        }
        
        function _delegatecall(a, inptr, insize, outptr, outsize) -> c {
            c := delegatecall(gas(), a, inptr, insize, outptr, outsize)
        }
        
        function _staticcall(a, inptr, insize, outptr, outsize) -> c {
            c := staticcall(gas(), a, inptr, insize, outptr, outsize)
        }

        // function mslice(position, length) -> result {
        //   if gt(length, 32) { revert(0, 0) } // protect against overflow
        
        //   result := shr(sub(256, mul(length, 8)), mload(position))
        // }
        
        function allocate(size) -> ptr {
            ptr := mload(0x40)
            if iszero(ptr) { ptr := 0x60 }
            mstore(0x40, add(ptr, size))
        }

        function uconcat(a, b, length_b) -> c {
            c := add(shl(mul(length_b, 8), a), b)
        }

        function mslicestore(_ptr, val, length) {
            let slot := 32
            mstore(_ptr, shl(mul(sub(slot, length), 8), val))
        }

        function sslicestore(storageKey, val, length) {
            let slot := 32
            sstore(storageKey, shl(mul(sub(slot, length), 8), val))
        }
    }}
}
