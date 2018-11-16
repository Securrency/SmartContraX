pragma solidity ^0.5.0;

import "../../interfaces/IFungibleTokensHolder.sol";
import "../../../../request-verification-layer/permission-module/Protected.sol";
import "../../../../common/libraries/SafeMath.sol";


/**
* @notice Fungible tokens holder. Provides a possibility for the issuer move tokens on the hold
*/
contract FungibleTokensHolder is IFungibleTokensHolder, Protected {
    // Define libraries
    using SafeMath for uint;

    // Stores number of the tokens that are on hold
    uint public totalOnHold;

    // holder -> number of tokens on hold
    mapping(address => uint) tokensOnHold;

    /**
    * @notice Write info to the log when new tokens were moved on hold
    * @param tokenHolder Token holder address
    * @param value Number of the tokens that are moved on hold
    * @param data Additional info about tokens hold
    */
    event MovedOnHold(address indexed tokenHolder, uint value, bytes32 data);

    /**
    * @notice Write info to the log when new tokens were moved from hold
    * @param tokenHolder Token holder address
    * @param value Number of the tokens that are moved from hold
    * @param data Additional info
    */
    event MovedFromHold(address indexed tokenHolder, uint value, bytes32 data);

    /**
    * @notice Validate input parameters
    * @param tokenHolder Address which can't be empty
    * @param amount Number that must be greeter that 0
    */
    modifier valid(address tokenHolder, uint amount) {
        require(tokenHolder != address(0), "Invalid token holder address.");
        require(amount > 0, "Invalid number of tokens.");
        
        _;
    }

    /**
    * @notice Allows for the issuer account move tokens from hold
    * @param tokenHolder Token holder account
    * @param amount Number of tokens that will be moved on hold
    * @param data Additional info
    */
    function moveTokensFromHold(address tokenHolder, uint amount, bytes32 data)
        external
        verifyPermissionForCurrentToken(msg.sig)
        valid(tokenHolder, amount)
    {
        require(tokensOnHold[tokenHolder] >= amount, "The amount is greater than the number of tokens on hold.");

        // Stats update
        totalOnHold = totalOnHold.sub(amount);
        tokensOnHold[tokenHolder] = tokensOnHold[tokenHolder].sub(amount);

        // Write info to the log
        emit MovedFromHold(tokenHolder, amount, data);
    }

    /**
    * @notice Returns number of tokens that are on hold for the specific account
    * @param tokenHolder Token holder address
    */
    function getNumberOfTokensOnHold(address tokenHolder) external view returns (uint) {
        return tokensOnHold[tokenHolder];
    }

    /**
    * @notice Returns number of all tokens on hold
    */
    function totalTokensOnHold() external view returns (uint) {
        totalOnHold;
    }

    /**
    * @notice Allows for the issuer account move tokens on hold
    * @param tokenHolder Token holder account
    * @param amount Number of tokens that will be moved on hold
    * @param data Additional info
    */
    function _moveTokensOnHold(address tokenHolder, uint amount, bytes32 data) 
        internal
        valid(tokenHolder, amount)
    {
        // Stats update
        totalOnHold = totalOnHold.add(amount);
        tokensOnHold[tokenHolder] = tokensOnHold[tokenHolder].add(amount);

        // Write info to the log
        emit MovedOnHold(tokenHolder, amount, data);
    }
}