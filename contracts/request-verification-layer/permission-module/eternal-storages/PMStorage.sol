pragma solidity ^0.5.0;

import "./PMRolesManagerStorage.sol";
import "./PMTokenRolesStorage.sol";
import "./PMNetworkRolesStorage.sol";


/**
* @title Permission module eternal storage
*/
contract PMStorage is PMRolesManagerStorage, PMTokenRolesStorage, PMNetworkRolesStorage {
    // Initialize storage
    constructor(address componentsRegistry) 
        public
        PMRolesManagerStorage()
        WithComponentsRegistry(componentsRegistry) 
    {}
}