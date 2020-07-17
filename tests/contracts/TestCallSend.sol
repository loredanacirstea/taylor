pragma solidity >=0.4.22 <0.7.0;

contract TestCallSend {
    uint public somevar = 5;
    string public name = "Some Name";

    function add(uint a, uint b) public pure returns(uint c) {
        c = a + b;
    }

    function increase(uint a) public {
        somevar = somevar + a;
    }

    function setname(string memory newname) public {
        name = newname;
    }
}
