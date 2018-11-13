pragma solidity ^0.4.24;

import "./SecuritiesStandardToken.sol";


/**
* @title Extends CAT-20. Allows burn tokens.
*/
contract CAT20Burnale is SecuritiesStandardToken {
    /**
    * @notice Write info to the log about burned tokens
    * @param from Address from which tokens were burned
    * @param value Number of burned tokens
    */
    event Burn(address indexed from, uint256 value);

    /**
    * @notice Write info to the log when issuer was burned tokens
    * @param from Address from which tokens were burned
    * @param burnedBy Address of the transaction initiator
    * @param value Number of burned tokens
    * @param data Additional data which will be added to the log
    */
    event BurnedByIssuer(address indexed from, address indexed burnedBy, uint256 value, bytes32 data);

    /**
    * @notice Burns a specific amount of tokens for sender
    * @param value The amount of token to be burned
    */
    function burn(uint value) public {
        require(value > 0, "Invalid value.");

        _burn(msg.sender, value);
    }

    /**
    * @notice Burns a specific amount of tokens for selected address
    * @notice Protected by permission module
    * @param from Address from which tokens were burned
    * @param value The amount of token to be burned
    * @param data Additional data which will be added to the log
    */
    function issuerBurn(address from, uint value, bytes32 data)
        external
        verifyPermission(msg.sig, msg.sender)
    {
        require(from != address(0), "Invalid token holder address");
        require(value > 0, "Invalid value.");

        _burn(from, value);

        emit BurnedByIssuer(from, msg.sender, value, data);
    }

    /**
    * @notice Burns a specific amount of tokens.
    * @param from Address from which tokens were burned
    * @param value The amount of token to be burned.
    */
    function _burn(address from, uint value) internal {
        require(value <= balances[from], "Insufficient funds.");

        // Stats updates
        balances[from] = balances[from].sub(value);
        totalSupply_ = totalSupply_.sub(value);

        // Write info to the log
        emit Burn(from, value);
        emit Transfer(from, address(0), value);
    }
}