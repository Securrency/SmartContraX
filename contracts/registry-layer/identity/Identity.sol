pragma solidity ^0.5.0;

import "./interfaces/IIdentity.sol";
import "../../request-verification-layer/permission-module/Protected.sol";


/**
* @title Identity
* @notice Stores different wallet attributes which allow identifying it.
* @notice In the system will present managers of the attributes which will 
* @notice be able to manage these attributes.
*/
contract Identity is IIdentity, Protected {
    // Declare storage for wallet attributes and their values
    // wallet => attribute => value
    mapping(address => mapping(bytes32 => bytes32)) attributes;

    // Write info to the log when the new attribute was added
    event AttributeAdded(address indexed wallet, bytes32 attribute, bytes32 value);

    // Write info to the log when the attribute was deleted
    event AttributeDeleted(address indexed wallet, bytes32 attribute, bytes32 value);

    // Initialize contract
    constructor(address componentsRegistry) 
        public
        WithComponentsRegistry(componentsRegistry)
    {}

    /**
    * @notice Set wallet attributes
    * @param wallet Wallet address
    * @param attribute Attribute to be set (country, is verified investor, etc...)
    * @param value Value
    */
    function setWalletAttribute(address wallet, bytes32 attribute, bytes32 value) 
        public
        verifyPermission(msg.sig, msg.sender)
    {
        require(wallet != address(0), "Invalid wallet address");
        require(attribute != bytes32(0x00), "Invalid attribute");
        require(value != bytes32(0x00), "Invalid value");

        attributes[wallet][attribute] = value;

        emit AttributeAdded(wallet, attribute, value);
    }

    /**
    * @notice Delete wallet attributes
    * @param wallet Wallet address
    * @param attribute Attributes to be deleted
    */
    function deleteWalletAttribute(address wallet, bytes32 attribute)
        public
        verifyPermission(msg.sig, msg.sender)
    {
        require(wallet != address(0), "Invalid wallet address");
        require(attribute != bytes32(0x00), "Invalid attribute");

        bytes32 value = attributes[wallet][attribute]; 
        require(value != bytes32(0x00), "Attribute value not found");

        delete attributes[wallet][attribute];

        emit AttributeDeleted(wallet, attribute, value);
    }

    /**
    * @notice Returns attribute value
    * @param wallet Wallet address
    * @param attribute Attribute which value to be selected
    */
    function getWalletAttribute(address wallet, bytes32 attribute) public view returns (bytes32) {
        return attributes[wallet][attribute];
    }
}