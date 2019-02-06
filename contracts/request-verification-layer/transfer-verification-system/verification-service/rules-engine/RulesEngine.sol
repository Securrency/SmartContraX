pragma solidity ^0.5.0;

import "../../../../common/libraries/BytesHelper.sol";
import "../../../permission-module/Protected.sol";
import "../../interfaces/IRulesEngine.sol";


/**
* @title Rules Engine
* @notice Verify any operation depending on the token policy
*/
contract RulesEngine is Protected {
    // Define libraries
    using BytesHelper for bytes;
    
    // Declare storage for the actions executors
    mapping(bytes32 => address) actions;

    // Write info to the log when action executor was changed
    event ExecutorChanged(bytes32 action, address executor);

    // initialize contract
    constructor(address componentsRegistry) 
        public
        WithComponentsRegistry(componentsRegistry) 
    {}

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
        returns (bool, bytes32[10] memory)
    {
        bytes32 action = data.cutFirst4Bytes();
        address executor = actions[action];

        require(executor != address(0), "Invalid action.");

        return IRulesEngine(executor).canExecute(token, msgSender, data);
    }

    /**
    * @notice Set address of the action executor
    * @param action Action
    * @param executor Action executor address
    */
    function setActionExecutor(bytes32 action, address executor) 
        external
        verifyPermission(msg.sig, msg.sender)
    {
        actions[action] = executor;
        
        emit ExecutorChanged(action, executor);
    }
}