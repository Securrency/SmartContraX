pragma solidity >0.4.99 <0.6.0;

import "./CAT20Protected.sol";
import "./CAT20Paused.sol";


/**
* @title Pausable. Stored pause state, provides methods for manipulating with it
*/
contract CAT20Pause is CAT20Protected, CAT20Paused {
    // Write info to the log when transactions were stopped
    event Pause();

    // Write info to the log when transactions were allowed
    event Unpause();

    /**
    * @notice Called by the owner to pause, triggers stopped state
    */
    function pause() 
        external
        verifyPermission(msg.sig, msg.sender)
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
        verifyPermission(msg.sig, msg.sender)
        onlyPaused()
    {
        paused = false;
        emit Unpause();
    }
}