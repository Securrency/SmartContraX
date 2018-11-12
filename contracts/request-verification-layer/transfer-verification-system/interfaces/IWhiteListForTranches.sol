pragma solidity ^0.4.24;

/**
* @title Interface of the Whitelist service
*/
contract IWhiteListForTranches {
    /**
    * @notice Werify address in the whitelist
    * @param who Address to be verified
    * @param tokenAddress Address of the token
    * @param tranche Tranche
    */
    function presentInWhiteList(address who, address tokenAddress, bytes32 tranche) public view returns (bool);

    /**
    * @notice Add address to the whitelist
    * @param who Address which will be added
    * @param tokenAddress Token for address attachment
    * @param tranche Tranche
    */
    function addToWhiteList(address who, address tokenAddress, bytes32 tranche) public;

    /**
    * @notice Add address to the whitelist
    * @param who Address which will be added
    * @param tokenAddress Token address
    * @param tranche Tranche
    */
    function removeFromWhiteList(address who, address tokenAddress, bytes32 tranche) public;
}