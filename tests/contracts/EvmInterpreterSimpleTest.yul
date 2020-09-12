object "Token" {
    code {
        // Store the creator in slot zero.
        sstore(0, caller())

        // Deploy the contract
        datacopy(0, dataoffset("runtime"), datasize("runtime"))
        return(0, datasize("runtime"))
    }
    object "runtime" {
        code {

            // Dispatcher
            switch selector()
            case 0x70a08231 /* "balanceOf(address)" */ {
                returnUint(0x666)
            }
            case 0x18160ddd /* "totalSupply()" */ {
                returnUint(0x777)
            }

            function selector() -> s {
                s := div(calldataload(0), 0x100000000000000000000000000000000000000000000000000000000)
            }

            function returnUint(v) {
                mstore(0, v)
                return(0, 0x20)
            }
        }
    }
}
