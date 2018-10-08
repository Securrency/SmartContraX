pragma solidity ^0.4.24;

/**
* @title Interface of the Whitelist service
*/
contract IWhiteList {
    /**
    * @notice Werify address in the whitelist
    * @param who Address to be verified
    * @param tokenAddress Address of the token
    */
    function presentInWhiteList(address who, address tokenAddress) public view returns (bool);

    /**
    * @notice Add address to the whitelist
    * @param who Address which will be added
    * @param tokenAddress Token for address attachment
    */
    function addToWhiteList(address who, address tokenAddress) public;

    /**
    * @notice Add address to the whitelist
    * @param who Address which will be added
    * @param tokenAddress Token address
    */
    function removeFromWhiteList(address who, address tokenAddress) public;
}