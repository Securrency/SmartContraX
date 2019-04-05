pragma solidity ^0.5.0;

import "../CAT20TokenStorage.sol";


/**
* @title Pausable. Stored pause state, provides methods for manipulating with it
*/
contract CAT20Paused is CAT20TokenStorage {
    /**
    * @notice Modifier to make a function callable only when the contract is not paused.
    */
    modifier notPaused() {
        require(!paused, "Transactions are stoped");
        _;
    }

    /**
    * @notice Modifier to make a function callable only when the contract is paused.
    */
    modifier onlyPaused() {
        require(paused, "The contract must be paused");
        _;
    }
}