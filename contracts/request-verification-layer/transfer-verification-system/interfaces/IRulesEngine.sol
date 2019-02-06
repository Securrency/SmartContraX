pragma solidity ^0.5.0;


/**
* @title Interface of the Rules Engine
*/
contract IRulesEngine {
    /**
    * @notice Verify whether is it possible to execute a method or not
    * @param token Token address
    * @param msgSender Sender of the message (for a call that must be verified)
    * @param data Complete calldata
    * @return status, an array of the errors if present
    */
    function canExecute(
        address token,
        address msgSender,
        bytes memory data
    )
        public
        view
        returns (bool, bytes32[10] memory);
}