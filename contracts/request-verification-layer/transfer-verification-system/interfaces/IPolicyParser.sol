pragma solidity ^0.5.0;


/**
* @title Interface of the policy parser
*/
contract IPolicyParser {
    /**
     * @notice Verify policy and returns a result if allowed or not
     * @notice for a provided account
     * @param policy Token policy
     * @return result
     */
    function verifyPolicy(
        bytes memory policy,
        address[3] memory wallets,
        bytes32[10] memory txDetailsAttributes,
        bytes32[10] memory txDetailsValues
    ) 
        public 
        view
        returns (bool);

    /**
     * @notice Verify policy and returns a result if allowed or not
     * @notice for a provided account
     * @param policy Token policy
     * @return result, error codes if presents
     */
    function canExecute(
        bytes memory policy,
        address[3] memory wallets,
        bytes32[10] memory txDetailsAttributes,
        bytes32[10] memory txDetailsValues
    ) 
        public 
        view
        returns (bool result, bytes32[10] memory errorCodes);
}