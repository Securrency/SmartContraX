pragma solidity ^0.4.24;


/**
* @notice Interface of the fungible tokens holder
*/
contract IFungibleTokensHolder {
    /**
    * @notice Allows for the issuer account move tokens on hold
    * @param tokenHolder Token holder account
    * @param amount Number of tokens that will be moved on hold
    * @param data Additional info
    */
    function moveTokensOnHold(address tokenHolder, uint amount, bytes32 data) external;

    /**
    * @notice Allows for the issuer account move tokens from hold
    * @param tokenHolder Token holder account
    * @param amount Number of tokens that will be moved on hold
    * @param data Additional info
    */
    function moveTokensFromHold(address tokenHolder, uint amount, bytes32 data) external;

    /**
    * @notice Returns number of tokens that are on hold for the specific account
    * @param tokenHolder Token holder address
    */
    function getNumberOfTokensOnHold(address tokenHolder) external view returns (uint);

    /**
    * @notice Returns number of all tokens on hold
    */
    function totalTokensOnHold() external view returns (uint);
}