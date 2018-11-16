pragma solidity ^0.5.0;

import "../../../../request-verification-layer/permission-module/Protected.sol";


/**
* @title Pausable. Stored pause state, provides methods for manipulating with it
*/
contract Pausable is Protected {
    // Write info to the log when transactions were stopped
    event Pause();

    // Write info to the log when transactions were allowed
    event Unpause();

    // Store status
    bool public paused = false;

    /**
    * @notice Modifier to make a function callable only when the contract is not paused.
    */
    modifier notPaused() {
        require(!paused, "Transactions are stoped by an issuer.");
        _;
    }

    /**
    * @notice Modifier to make a function callable only when the contract is paused.
    */
    modifier onlyPaused() {
        require(paused, "The contract must be paused.");
        _;
    }

    /**
    * @notice Called by the owner to pause, triggers stopped state
    */
    function pause() 
        external 
        verifyPermissionForCurrentToken(msg.sig)
        notPaused() 
    {
        paused = true;
        emit Pause();
    }

    /**
    * @dev called by the owner to unpause, returns to normal state
    */
    function unpause() 
        external
        verifyPermissionForCurrentToken(msg.sig)
        onlyPaused()
    {
        paused = false;
        emit Unpause();
    }
}