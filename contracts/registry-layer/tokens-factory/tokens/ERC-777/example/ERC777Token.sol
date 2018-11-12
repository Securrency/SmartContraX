pragma solidity ^0.4.24;

import "../ERC777.sol";


/**
* @title Simple Token
*/
contract ERC777Token is ERC777 {
    // initialize contract
    constructor(
        string name,
        string symbol,
        uint256 granularity, 
        address[] defaultOperators
    ) 
        public
        ERC777(
            name,
            symbol,
            granularity,
            defaultOperators
        )
    {}

    function mint(address tokenHolder, uint256 amount, bytes data) 
        public
        isValidAmout(amount) 
    {
        _totalSupply = _totalSupply.add(amount);
        balances[tokenHolder] = balances[tokenHolder].add(amount);

        sendRequestToRecipient(
            msg.sender,
            0x0,
            tokenHolder,
            amount,
            data,
            "",
            true
        );

        // event Minted(address indexed operator, address indexed to, uint256 amount, bytes data, bytes operatorData);
        emit Minted(msg.sender, tokenHolder, amount, data, "");

        if (ERC20Compatible) {
            emit Transfer(0x0, tokenHolder, amount); 
        }
    }
}