pragma solidity 0.5.11;

contract Demo {
    address payable owner;
    address payable[] receivers;
    mapping (address => uint256) balance;

    constructor() public {
        owner = msg.sender;
    }

    function setReceivers(address payable[] memory _receivers) public {
        receivers = _receivers;
    }

    function deposit() public payable {
        balance[msg.sender] += msg.value;
        receivers.push(msg.sender);
    }

    function payReceivers() public {
        for(uint256 i = 0; i < receivers.length; i++) {
            (bool success,) = receivers[i].call.value(balance[receivers[i]])("");
            require(success);
        }
    }

    function die(address caller) public {
        require(caller == msg.sender);
        selfdestruct(msg.sender);
    }
}