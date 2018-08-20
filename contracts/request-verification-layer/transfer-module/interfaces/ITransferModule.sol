pragma solidity 0.4.24;

/**
* @title Transfer module interaface
*/
contract ITransferModule {
    /**
    * @notice Verify tokens transfer. 
    * @notice Selecting verification logic depending on the token standard.
    * @param from The address transfer from
    * @param to The address transfer to
    * @param tokens The amount of tokens to be transferred 
    */
    function verifyTransfer(
        address from,
        address to,
        address sender,
        uint tokens
    )
        public
        view
        returns (bool);

    /**
    * @notice Add verification logic to the Transfer module
    * @param logic Transfer verification logic address
    * @param standard Token standard related to this logic
    */
    function addVerificationLogic(address logic, bytes32 standard) public;
}