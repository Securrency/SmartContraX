pragma solidity ^0.5.0;


/**
* @title IIdentity interface 
*/
contract IIdentity {
    /**
    * @notice Set wallet attributes
    * @param wallet Wallet address
    * @param attribute Attribute to be set (country, is verified investor, etc...)
    * @param value Value
    */
    function setWalletAttribute(address wallet, bytes32 attribute, bytes32 value) public;

    /**
    * @notice Delete wallet attributes
    * @param wallet Wallet address
    * @param attribute Attributes to be deleted
    */
    function deleteWalletAttribute(address wallet, bytes32 attribute) public;

    /**
    * @notice Returns attribute value
    * @param wallet Wallet address
    * @param attribute Attribute which value to be selected
    */
    function getWalletAttribute(address wallet, bytes32 attribute) public view returns (bytes32);
}