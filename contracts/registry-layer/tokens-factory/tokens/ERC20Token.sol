pragma solidity ^ 0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/DetailedERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/StandardToken.sol";

/**
 * @title ERC20 token
 */
contract ERC20Token is StandardToken, DetailedERC20 {
    constructor(
        string _name,
        string _symbol,
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