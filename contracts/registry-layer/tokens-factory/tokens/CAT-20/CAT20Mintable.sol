pragma solidity ^0.5.0;

import "./SecuritiesStandardToken.sol";


/**
* @title Extends CAT-20. Allows tokens minting.
*/
contract CAT20Mintable is SecuritiesStandardToken {
    /**
    * @notice Write info to the log about tokens minting
    * @param to Recipient address
    * @param amount Number of minted tokens
    */
    event Mint(address indexed to, uint256 amount);

    /**
    * @notice Function to mint tokens
    * @param to The address that will receive the minted tokens
    * @param amount The amount of tokens to mint
    */
    function mint(
        address to,
        uint256 amount
    )
        public
        verifyPermissionForCurrentToken(msg.sig)
        returns (bool)
    {
        require(to != address(0), "Invalid recipient address.");
        require(amount > 0, "Invalid amount.");
        
        // Stats updates
        totalSupply_ = totalSupply_.add(amount);
        balances[to] = balances[to].add(amount);

        // Write info to the log
        emit Mint(to, amount);
        emit Transfer(address(0), to, amount);

        return true;
    }
}