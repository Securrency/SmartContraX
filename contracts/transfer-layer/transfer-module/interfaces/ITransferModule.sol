pragma solidity ^0.5.0;

/**
* @title Transfer module interaface
*/
contract ITransferModule {
    /**
    * @notice Receipt tokens from the other chain
    * @param fromTokenAddress Token address in the previous chain
    * @param sentFrom Sender address in the previous chain
    * @param recipient Recipient address
    * @param tokenAddress Token address in the current chain
    * @param fromChain Original chain
    * @param originalTxHash Tx hash which initiate cross chain transfer
    * @param value Amount of tokens
    * @param txId Cross chain transaction id (defined by cross chain service in the chain from which tokens were transferred)
    */
    function acceptTokensFromOtherChain(
        address fromTokenAddress,
        address recipient,
        address tokenAddress,
        bytes32 sentFrom,
        bytes32 fromChain,
        bytes32 originalTxHash,
        uint value,
        uint txId
    ) 
        external;

    /**
    * @notice Move tokens from chain
    * @param sender Tokens owner
    * @param chain Target chain
    * @param targetAddress Recipient wallet in the other chain
    * @param value Amount of tokens || token id for the CAT-721 token
    */
    function sendTokensFromChain(
        address sender,
        bytes32 chain,
        bytes32 targetAddress,
        uint value
    )
        public;

    /**
    * @notice Verify tokens transfer. 
    * @notice Selecting verification logic depending on the token standard.
    * @param from The address transfer from
    * @param to The address transfer to
    * @param sender Transaction initiator
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
    * @notice Verify tokens transfer. 
    * @notice Selecting verification logic depending on the token standard.
    * @param from The address transfer from
    * @param to The address transfer to
    * @param sender Transaction initiator
    * @param id Additional identifier
    * @param tokenAddress Address of the token
    */
    function verifyTransferWithId(
        address from,
        address to,
        address sender,
        address tokenAddress,
        bytes32 id
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

    /**
    * @notice Verify CAT-20 tokens transfer by the rules engine
    * @param from The address transfer from
    * @param to The address transfer to
    * @param sender Transaction initiator
    * @param tokens The amount of tokens to be transferred
    */
    function checkCAT20TransferThroughRE(
        address from,
        address to,
        address sender,
        uint tokens
    )
        public
        returns (bool);

    /**
    * @notice Verify CAT-1400 tokens transfer by the rules engine
    * @param from The address transfer from
    * @param to The address transfer to
    * @param sender Transaction initiator
    * @param partition Partition identifier
    * @param tokens The amount of tokens to be transferred
    */
    function checkCAT1400TransferThroughRE(
        address from,
        address to,
        address sender,
        bytes32 partition,
        uint tokens
    )
        public
        returns (bool);
}