pragma solidity >0.4.99 <0.6.0;


/**
* @notice CAT-1400 transfer action interface
*/
contract ICAT1400TransferAction {
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
        returns (bool result, bytes32[10] memory errorCodes);

    /**
    * @notice Verify tokens transfer and cache result
    * @notice Selecting verification logic depending on the token standard.
    * @param from The address transfer from
    * @param to The address transfer to
    * @param tokenAddress Address of the token
    * @param tokens The number of tokens to be transferred 
    * @param partition Partition identifier
    */
    function verifyTransfer(
        address from,
        address to,
        address sender,
        address tokenAddress,
        uint tokens,
        bytes32 partition
    )
        public
        returns (bool);

    /**
    * @notice Verify tokens transfer
    * @notice Selecting verification logic depending on the token standard.
    * @param from The address transfer from
    * @param to The address transfer to
    * @param tokenAddress Address of the token
    * @param tokens The number of tokens to be transferred 
    * @param partition Partition identifier
    */
    function verifyTransferWithoutCaching(
        address from,
        address to,
        address sender,
        address tokenAddress,
        uint tokens,
        bytes32 partition
    )
        public
        view
        returns (bool);

    /**
    * @notice Add an address to the whitelist
    * @param who Address which will be added
    * @param tokenAddress Token for address attachment
    * @param partition Partition identifier
    */
    function addToWhiteList(address who, address tokenAddress, bytes32 partition) public;

    /**
    * @notice Verify address in the whitelist
    * @param who Address to be verified
    * @param token Address of the token
    * @param partition Partition identifier
    */
    function presentInWhiteList(address who, address token, bytes32 partition) public view returns (bool);
}