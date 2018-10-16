pragma solidity ^0.4.24;

import "./IPMRolesManagerStorage.sol";
import "./IPMTokenRolesStorage.sol";
import "./IPMNetworkRolesStorage.sol";

/**
* @title Interface of the permission module etrnal storage
*/
contract IPMStorage is IPMRolesManagerStorage, IPMTokenRolesStorage, IPMNetworkRolesStorage {
    
}