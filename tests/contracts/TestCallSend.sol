pragma solidity >=0.4.22 <0.7.0;
pragma experimental ABIEncoderV2;

contract TestCallSend {
    uint public somevar = 5;
    string public name = "SomeName";

    struct TT1 {
        bytes a;
        string b;
        uint c;
    }

    struct TT2 {
        uint a;
        uint b;
        TT1 c;
        uint d;
    }

    function add(uint a, uint b) public pure returns(uint c) {
        c = a + b;
    }

    function increase(uint a) public {
        somevar = somevar + a;
    }

    function setname(string memory newname) public {
        name = newname;
    }

    function pay(uint a) public payable {
        somevar = somevar + a;
    }

    function testTuple(TT2 memory tt2) public pure returns(uint) {
        return tt2.a + tt2.b + tt2.d + tt2.c.c;
    }

    function getaTuple(bytes memory a, string memory b, uint c) public pure returns(TT2 memory) {
        TT1 memory tup = TT1(a, b, c);
        return TT2(5, 5, tup, 10);
    }
}
