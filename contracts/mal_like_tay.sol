object "step0_repl" {
    code {
        // codeCopy
        datacopy(0, dataoffset("Runtime"), datasize("Runtime"))
        return(0, datasize("Runtime"))
    }
    object "Runtime" {
    code {

        let _calldata := 0x80
        calldatacopy(_calldata, 0, calldatasize())

        execute(_calldata,  calldatasize())


        function execute(_data, blen) {

            let result := rep(mslice(_data, blen))
            mstore(0, result)
            return (0, 32)
        }

        function read(str) -> _str {
            _str := str
        }

        function eval(ast, env) -> result {
            result := ast
        }

        function print(ast) -> result {
            result := ast
        }

        function rep(line) -> result {
            result := print(eval(read(line), 0))
        }


        function _add(a, b) -> c {
            c := add(a, b)
        }

        function _sub(a, b) -> c {
            c := sub(a, b)
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
    }}
}
