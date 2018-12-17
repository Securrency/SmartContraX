pragma solidity ^0.5.0;


/**
* @title IEscrow. Provides main methods for work with escrow.
* @notice CAT escrow provides a mechanism which allows lock tokens
* @notice and send requests to the third parties smart contracts.
* @notice Escrow statuses: 
* @notice                   0x01 - active (just created), 
* @notice                   0x02 - processed, 
* @notice                   0x03 - cancelled by token holder,
* @notice                   0x04 - cancelled by escrow agent
* @notice -------------
* @notice |  IEscrow  |
* @notice -------------
*/
contract IEscrow {
    /**
    * @notice Create new escrow
    * @param tokenHolder Token holder address
    * @param escrowAgent Address (application) on which will be executed call "escrow created"
    * @param value Number of the tokens to lock
    * @param dataForCall Additional data for call
    * @param data Additional data for log
    * @param externalId Transaction initiator can specify external identifier
    * @param canCancel Specifies the type of the lock
    * @param executeCall If equal "true" CAT-20 token send request to the escrow agent
    * @return escrowId Escrow identifier
    * @dev canCancel == true - allows unlock tokens for the token holder
    * @dev canCancel == false - allows unlock tokens only for the transfer agent or for the issuer
    * @dev Must generate escrow id
    * @dev If provided escrowAgent must execute external call "CATEscrowCreated"
    */
    function _createEscrow(
        address tokenHolder,
        address escrowAgent,
        uint value,
        bytes memory dataForCall,
        bytes memory data,
        bytes32 externalId,
        bool canCancel,
        bool executeCall
    )
        internal
        returns (uint);

    /**
    * @notice Cancel escrow
    * @param externalId Escrow identifier
    * @param dataForCall Additional data for call
    * @param data Additional data for log
    * @dev If provided escrowAgent must execute external call "CATEscrowCanceled"
    */
    function cancelEscrow(
        bytes32 externalId, 
        bytes memory dataForCall,
        bytes memory data
    ) 
        public;

    /**
    * @notice Retuns escrow details
    * @param escrowId Escrow identifier
    * @return tokenHolder, escrowAgent, value, escrowStatus, canCancel
    */
    function getEscrowById(uint escrowId) 
        public 
        view 
        returns (
            address,
            address,
            uint,
            bytes1,
            bytes32,
            bool
        );

    /**
    * @notice Returns escrow status
    * @param escrowId Escrow identifier
    * @return escrowStatus (0x01,0x02,0x03,0x04)
    */
    function getEscrowStatus(uint escrowId) public view returns (bytes1);

    /**
    * @notice Returns tokens holder escrow
    * @param tokenHolder Token holder address
    * @return escrowIds[] Array of the all tokens holder escrows
    */
    function getHolderEscrow(address tokenHolder) public view returns (uint[] memory);

    /**
    * @notice Returns number of the tokens on the escrow
    * @param tokenHolder Token holder address
    */
    function getTokensOnEscrow(address tokenHolder) public view returns (uint);

    /**
    * @notice Returns external id 
    * @param internalId Internal escrow identifier
    */
    function getExternalIdByInternalId(uint internalId) public view returns (bytes32);

    /**
    * @notice Returns internal id 
    * @param externalId External escrow identifier
    */
    function getInternalIdByExternalId(bytes32 externalId) public view returns (uint);

    /**
    * @notice Process escrow. Provides possibility for move locked token.
    * @notice Provide ability to transfer tokens to another token holder.
    * @param externalId Escrow identifier
    * @param recipient Tokens recipient
    * @param dataForCall Additional data for call
    * @param data Additional data for log
    * @dev If provided escrowAgent must execute external call "CATEscrowProcessed"
    */
    function _processEscrow(
        bytes32 externalId,
        address recipient,
        bytes memory dataForCall,
        bytes memory data
    )
        internal;
}