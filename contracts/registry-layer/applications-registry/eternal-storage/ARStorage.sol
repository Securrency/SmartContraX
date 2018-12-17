pragma solidity ^0.5.0;

import "./ACATRStorage.sol";
import "./ATokenRStorage.sol";


/**
* @title ARStorage
*/
contract ARStorage is ACATRStorage, ATokenRStorage {
    // Initialize contract
    constructor(address componentsRegistry) 
        public
        BaseARStorage(componentsRegistry) 
    {}
}