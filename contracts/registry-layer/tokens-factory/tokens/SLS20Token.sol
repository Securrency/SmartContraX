pragma solidity ^ 0.4.24;

import "openzeppelin-solidity/contracts/token/ERC20/DetailedERC20.sol";
import "./SecuritiesStandardToken.sol";

/**
 * @title Secure Liquid Securities, an extension of an ERC20 token standard
 */
contract SLS20Token is SecuritiesStandardToken, DetailedERC20 {
    constructor(
        string _name,
        string _symbol,
        uint8 _decimals,
        uint256 _totalSupply,
        address _issuer,
        address _transferModule,
        address _permissionModule
    ) 
        public
        DetailedERC20(_name, _symbol, _decimals)
        SecuritiesToken(_issuer)
        SecuritiesStandardToken(_transferModule)
        Protected(_permissionModule)
    {
        totalSupply_ = _totalSupply;
        balances[_issuer] = totalSupply_;

        issuer = _issuer;

        emit Transfer(address(0), _issuer, totalSupply_);
    }

    function getName() public view returns (string) {
        return name;
    }
} 