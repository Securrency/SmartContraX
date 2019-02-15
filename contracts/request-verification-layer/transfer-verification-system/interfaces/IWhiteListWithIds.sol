pragma solidity ^0.5.0;

/**
* @title An interface of the Whitelist service with additional identifiers
*/
contract IWhiteListWithIds {
    /**
    * @notice Verify address in the whitelist
    * @param who Address to be verified
    * @param tokenAddress Address of the token
    * @param id Additional identifier
    */
    function presentInWhiteList(address who, address tokenAddress, bytes32 id) public view returns (bool);

    /**
    * @notice Add an address to the whitelist
    * @param who Address which will be added
    * @param tokenAddress Token for address attachment
    * @param id Additional identifier
    */
    function addToWhiteList(address who, address tokenAddress, bytes32 id) public;

    /**
    * @notice Add an address to the whitelist
    * @param who Address which will be added
    * @param tokenAddress Token address
    */
    function removeFromWhiteList(address who, address tokenAddress, bytes32 id) public;
}