pragma solidity ^0.5.0;

import "./DetailedERC20.sol";
import "./StandardToken.sol";


/**
 * @title ERC20 token
 */
contract ERC20Token is StandardToken, DetailedERC20 {
    constructor(
        string memory _name,
        string memory _symbol,
        uint8 _decimals,
        uint256 _totalSupply,
        address _issuer
    ) 
        public
        DetailedERC20(_name, _symbol, _decimals)
    {
        totalSupply_ = _totalSupply;
        balances[_issuer] = totalSupply_;

        emit Transfer(address(0), _issuer, totalSupply_);
    }
} 