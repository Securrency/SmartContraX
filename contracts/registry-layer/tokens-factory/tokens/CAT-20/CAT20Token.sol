pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/DetailedERC20.sol";
import "./SecuritiesStandardToken.sol";
import "./CAT20Mintable.sol";
import "./CAT20Burnable.sol";


/**
 * @title Compliance Aware Token (CAT-20), an extension of an ERC20 token standard
 */
contract CAT20Token is SecuritiesStandardToken, CAT20Mintable, CAT20Burnale, DetailedERC20 {
    constructor(
        string _name,
        string _symbol,
        uint8 _decimals,
        uint256 _totalSupply,
        address _issuer,
        address _componentsRegistry
    ) 
        public
        DetailedERC20(_name, _symbol, _decimals)
        SecuritiesToken(_issuer)
        WithComponentsRegistry(_componentsRegistry)
    {
        totalSupply_ = _totalSupply;
        balances[_issuer] = totalSupply_;

        issuer = _issuer;

        emit Transfer(address(0), _issuer, totalSupply_);
    }
} 