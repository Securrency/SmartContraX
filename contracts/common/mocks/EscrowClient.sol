pragma solidity 0.5.0;

import "../introspection/SupportsInterfaceWithLookup.sol";
import "../../registry-layer/tokens-factory/interfaces/ICAT20EscrowCanceled.sol";
import "../../registry-layer/tokens-factory/interfaces/ICAT20EscrowCreated.sol";
import "../../registry-layer/tokens-factory/interfaces/ICAT20EscrowProcessed.sol";

/**
* @title ICAT20Escrow
*/
contract ICAT20Escrow {
    /**
    * @notice Process escrow. Provides possibility for move locked token.
    * @notice Provide ability to transfer tokens to another token holder.
    * @param escrowId Escrow identifier
    * @param recipient Tokens recipient
    * @param dataForCall Additional data for call
    * @param data Additional data for log
    * @dev If provided escrowAgent must execute external call "CATEscrowProcessed"
    */
    function processEscrow(
        bytes32 escrowId,
        address recipient,
        bytes memory dataForCall,
        bytes memory data
    )
        public;

    /**
    * @notice Cancel escrow
    * @param escrowId Escrow identifier
    * @param dataForCall Additional data for call
    * @param data Additional data for log
    * @dev If provided escrowAgent must execute external call "CATEscrowCanceled"
    */
    function cancelEscrow(
        bytes32 escrowId, 
        bytes memory dataForCall,
        bytes memory data
    ) 
        public;
}


/**
* @title EscrowClient
*/
contract EscrowClient is ICAT20EscrowCanceled, ICAT20EscrowCreated, ICAT20EscrowProcessed, SupportsInterfaceWithLookup {
    // store requests stats
    uint public created = 0;
    uint public canceled = 0;
    uint public processed = 0;

    event CreatedAccepted(uint num);
    event CanceledAccepted(uint num);
    event ProcessedAccepted(uint num);

    // Declare storage for created escrow
    // id -> CAT-20 token
    mapping(bytes32 => address) tokensById;

    /**
    * @notice Register methods
    */
    constructor() public {
        _registerInterface(ICAT20EscrowCreated(0).cat20EscrowCreated.selector);
        _registerInterface(ICAT20EscrowProcessed(0).cat20EscrowProcessed.selector);
        _registerInterface(ICAT20EscrowCanceled(0).cat20EscrowCanceled.selector);
    }

    /**
    * @notice Receipt calls from the CAT-20 token
    */
    function cat20EscrowCreated(
        address,// tokenHolder,
        uint, // tokensOnEscrow,
        bytes32 escrowId,
        bytes memory // callData
    ) 
        public
        returns (bool)
    {
        tokensById[escrowId] = msg.sender;

        emit CreatedAccepted(created);
        
        created++;

        return true;
    }

    /**
    * @notice Receipt calls from the CAT-20 token
    */
    function cat20EscrowProcessed(
        address, // tokenHolder,
        address, // recipient,
        uint, // tokensOnEscrow,
        bytes32, // escrowId,
        bytes memory // callData
    ) 
        public
        returns (bool)
    {
        emit ProcessedAccepted(processed);
        processed++;
        return true;
    }

    /**
    * @notice Receipt calls from the CAT-20 token
    */
    function cat20EscrowCanceled(
        address, // tokenHolder,
        uint, // tokensOnEscrow,
        bytes32, // escrowId,
        bytes memory // callData
    ) 
        public
        returns (bool)
    {
        emit CanceledAccepted(canceled);
        canceled++;
        return true;
    }

    /**
    * @notice Send request to the CAT-20 escrow
    * @param escrowId Escrow identifier
    * @param recipient Address of the tokens recipient
    */
    function triggerProcessed(bytes32 escrowId, address recipient) external {
        bytes memory dataForCall = new bytes(32);
        bytes memory data = new bytes(32);

        ICAT20Escrow(tokensById[escrowId]).processEscrow(
            escrowId,
            recipient,
            dataForCall,
            data
        );
    }

    /**
    * @notice Send request to the CAT-20 escrow
    * @param escrowId Escrow identifier
    */
    function triggerCanceled(bytes32 escrowId) external {
        bytes memory dataForCall = new bytes(32);
        bytes memory data = new bytes(32);

        ICAT20Escrow(tokensById[escrowId]).cancelEscrow(
            escrowId,
            dataForCall,
            data
        );
    }
}