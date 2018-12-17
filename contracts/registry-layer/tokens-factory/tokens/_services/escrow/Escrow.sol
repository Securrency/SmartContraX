pragma solidity ^0.5.0;

import "../../../interfaces/IEscrow.sol";
import "../../../interfaces/ICAT20EscrowCreated.sol";
import "../../../interfaces/ICAT20EscrowCanceled.sol";
import "../../../interfaces/ICAT20EscrowProcessed.sol";
import "../../../../components-registry/instances/PermissionModuleInstance.sol";
import "../../../../components-registry/instances/ApplicationRegistryInstance.sol";
import "../../../../../common/libraries/SafeMath.sol";
import "../../../../../common/libraries/BytesHelper.sol";
import "../../../../../common/introspection/ERC165Query.sol";


/**
* @title IEscrow. Provides main methods for work with escrow.
* @notice CAT escrow provides a mechanism which allows lock tokens
* @notice and send requests to the third parties smart contracts.
* @notice Escrow statuses: 
* @notice                   0x01 - active (just created), 
* @notice                   0x02 - processed, 
* @notice                   0x03 - canceled by token holder,
* @notice                   0x04 - canceled by escrow agent
*/
contract Escrow is IEscrow, ERC165Query, PermissionModuleInstance, ApplicationRegistryInstance {
    // Define libraries
    using SafeMath for uint;
    using BytesHelper for uint; 

    //0x01 - active (just created)
    bytes1 constant STATUS_ACTIVE = 0x01;
    //0x02 - processed
    bytes1 constant STATUS_PROCESSED = 0x02;
    //0x03 - canceled by token holder
    bytes1 constant STATUS_CANCELED_TH = 0x03;
    //0x04 - canceled by escrow agent
    bytes1 constant STATUS_CANCELED_EA = 0x04;
    // "CAT-20-Escrow-"
    bytes32 constant ID_PREFIX = "CAT-20-Escrow-";

    // Describe escrow
    struct EscrowObj {
        uint escrowId; // Escrow identifier
        address tokenHolder; // Token holder address
        address escrowAgent; // Escrow agent address
        uint value; // The number of the tokens on the escrow
        bool canCancel; // Allowed or not allowed escrow cancellation for the token holder
        bool executeCall; // If equal "true" CAT-20 token send request to the escrow agent
                          // on the each status update
        bytes1 status; // Escrow status
        bytes32 externalId; // External identifier
    }

    // Declare storage for the escrow list
    EscrowObj[] escrowList;

    // Declare storage for escrow ids of the token holder
    // token holder -> ids[]
    mapping(address => uint[]) tokenHolderIds;

    // Stores number of the tokens that are on escrow
    uint public totalOnEscrow;

    // holder -> number of tokens on escrow
    mapping(address => uint) tokensOnEscrow;

    // external id -> status (true - registered)
    mapping(bytes32 => bool) registeredIds;

    // Internal id => external id
    mapping(uint => bytes32) idsIntExtRelations;

    // Internal id => external id
    mapping(bytes32 => uint) idsExtIntRelations;

    // Write info to the log about created escrow
    event EscrowCreated(
        uint indexed escrowId,
        address indexed tokenHolder,
        address indexed escrowAgent,
        uint value,
        bytes data,
        bool canCancel,
        bool executeCall
    );

    // Write info to the log when escrow was canceled
    event EscrowCanceled(uint indexed escrowId, address indexed canceledBy, bytes data);

    // Write info to the log when escrow was processed
    event EscrowProcessed(uint indexed escrowId, address indexed processedBy, address indexed transferredTo, bytes data);

    // Write info about external call
    event CallExecuted(address indexed escrowAgent, bytes1 indexed escrowStatus, bytes dataForCall, bool result);

    /**
    * @notice Verify inputs on escrow creation
    * @param tokenHolder Address of the token holder
    * @param externalId External escrow id
    */
    modifier beforeCreate(address tokenHolder, bytes32 externalId) {
        if (msg.sender != tokenHolder) {
            require(pmInstance().allowed(msg.sig, msg.sender, address(this)), "Declined by Permission Module.");
        }

        // verify external id
        if (externalId.length > 0) {
            require(!registeredIds[externalId], "External id already registered.");
        }

        _;
    }

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
    * @dev If provided escrowAgent must execute external call "cat20EscrowCreated"
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
        beforeCreate(tokenHolder, externalId)
        returns (uint)
    {
        uint escrowId = escrowList.length;

        // Execute call
        if (executeCall
            && escrowAgent != address(0) 
            && implementInterface(escrowAgent, ICAT20EscrowCreated(0).cat20EscrowCreated.selector)
        ) {
            bool result = ICAT20EscrowCreated(escrowAgent).cat20EscrowCreated(
                tokenHolder,
                value,
                externalId,
                dataForCall
            );
            require(result, "Escrow agent fails to execute the call.");
        }

        registeredIds[externalId] = true;
        idsIntExtRelations[escrowId] = externalId;
        idsExtIntRelations[externalId] = escrowId;

        // save escrow
        escrowList.push(EscrowObj({
            escrowId: escrowId,
            tokenHolder: tokenHolder,
            escrowAgent: escrowAgent,
            value: value,
            canCancel: canCancel,
            executeCall: executeCall,
            status: STATUS_ACTIVE,
            externalId: externalId
        }));
        tokenHolderIds[tokenHolder].push(escrowId);

        // update stats
        totalOnEscrow = totalOnEscrow.add(value);
        tokensOnEscrow[tokenHolder] = tokensOnEscrow[tokenHolder].add(value); 

        // Write info to the log
        emit EscrowCreated(
            escrowId,
            tokenHolder,
            escrowAgent,
            value,
            data,
            canCancel,
            executeCall
        );

        return escrowId;
    }

    /**
    * @notice Cancel escrow
    * @param externalId Escrow identifier
    * @param dataForCall Additional data for call
    * @param data Additional data for log
    * @dev If provided escrowAgent must execute external call "cat20EscrowCanceled"
    */
    function cancelEscrow(
        bytes32 externalId,
        bytes memory dataForCall,
        bytes memory data
    ) 
        public
    {
        // require(registeredIds[externalId], "invalid escrow id.");

        uint escrowId = idsExtIntRelations[externalId];
        if (msg.sender == escrowList[escrowId].tokenHolder) {
            require(escrowList[escrowId].canCancel, "Cancelation is not allowed for the token holder.");
        }
        if (msg.sender != escrowList[escrowId].tokenHolder && msg.sender != escrowList[escrowId].escrowAgent) {
            require(pmInstance().allowed(msg.sig, msg.sender, address(this)), "Declined by Permission Module.");
        }

        // Change escrow status
        bytes1 status = escrowList[escrowId].tokenHolder == msg.sender ? STATUS_CANCELED_TH : STATUS_CANCELED_EA;
        escrowList[escrowId].status = status;

        // Update stats
        removeFromEscrow(escrowId);

        // Write info to the log
        emit EscrowCanceled(escrowId, msg.sender, data);

        // Execute call
        if (escrowList[escrowId].executeCall
            && escrowList[escrowId].escrowAgent != address(0)
            && msg.sender != escrowList[escrowId].escrowAgent
            && implementInterface(escrowList[escrowId].escrowAgent, ICAT20EscrowCanceled(0).cat20EscrowCanceled.selector)
        ) {
            bool result = ICAT20EscrowCanceled(escrowList[escrowId].escrowAgent).cat20EscrowCanceled(
                escrowList[escrowId].tokenHolder,
                escrowList[escrowId].value,
                escrowList[escrowId].externalId,
                dataForCall
            );
            require(result, "Escrow agent fails to execute the call.");
        }
    }

    /**
    * @notice Process escrow. Provides possibility for move locked token
    * @param externalId Escrow identifier
    * @param recipient Tokens recipient
    * @param dataForCall Additional data for call
    * @param data Additional data for log
    * @dev If provided escrowAgent must execute external call "cat20EscrowProcessed"
    */
    function _processEscrow(
        bytes32 externalId,
        address recipient,
        bytes memory dataForCall,
        bytes memory data
    )
        internal
    {   
        // require(registeredIds[externalId], "invalid escrow id.");

        uint escrowId = idsExtIntRelations[externalId];
        require(escrowList[escrowId].status == STATUS_ACTIVE, "Can't process escrow. Already processed or canceled.");
        if (msg.sender == escrowList[escrowId].tokenHolder) {
            require(escrowList[escrowId].canCancel, "Processing is not allowed for the token holder.");
        }
        if (msg.sender != escrowList[escrowId].escrowAgent) {
            require(pmInstance().allowed(msg.sig, msg.sender, address(this)), "Declined by Permission Module.");
        }

        // Update stats
        escrowList[escrowId].status = STATUS_PROCESSED;
        removeFromEscrow(escrowId);

        // Write info to the log
        emit EscrowProcessed(escrowId, msg.sender, recipient, data);

        // Execute call
        if (escrowList[escrowId].executeCall
            && escrowList[escrowId].escrowAgent != address(0)
            && msg.sender != escrowList[escrowId].escrowAgent
            && implementInterface(escrowList[escrowId].escrowAgent, ICAT20EscrowProcessed(0).cat20EscrowProcessed.selector)
        ) {
            bool result = ICAT20EscrowProcessed(escrowList[escrowId].escrowAgent).cat20EscrowProcessed(
                escrowList[escrowId].tokenHolder,
                recipient,
                escrowList[escrowId].value,
                escrowList[escrowId].externalId,
                dataForCall
            );
            require(result, "Escrow agent fails to execute the call.");
        }
    }

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
        )
    {
        return (
            escrowList[escrowId].tokenHolder,
            escrowList[escrowId].escrowAgent,
            escrowList[escrowId].value,
            escrowList[escrowId].status,
            escrowList[escrowId].externalId,
            escrowList[escrowId].canCancel
        );
    }

    /**
    * @notice Returns escrow status
    * @param escrowId Escrow identifier
    * @return escrowStatus (0x01,0x02,0x03,0x04)
    */
    function getEscrowStatus(uint escrowId) public view returns (bytes1) {
        return escrowList[escrowId].status;
    }

    /**
    * @notice Returns tokens holder escrow
    * @param tokenHolder Token holder address
    * @return escrowIds[] Array of the all tokens holder escrows
    */
    function getHolderEscrow(address tokenHolder) public view returns (uint[] memory) {
        return tokenHolderIds[tokenHolder];
    }

    /**
    * @notice Returns number of the tokens on the escrow
    * @param tokenHolder Token holder address
    */
    function getTokensOnEscrow(address tokenHolder) public view returns (uint) {
        return tokensOnEscrow[tokenHolder];
    }

    /**
    * @notice Returns external id 
    * @param internalId Internal escrow identifier
    */
    function getExternalIdByInternalId(uint internalId) public view returns (bytes32) {
        return idsIntExtRelations[internalId];
    }

    /**
    * @notice Returns internal id 
    * @param externalId External escrow identifier
    */
    function getInternalIdByExternalId(bytes32 externalId) public view returns (uint) {
        return escrowList[idsExtIntRelations[externalId]].escrowId;
    }

    /**
    * @notice Remove tokens form escrow
    * @param escrowId Escrow identifier
    */
    function removeFromEscrow(uint escrowId) internal {
        uint value = escrowList[escrowId].value;
        address tokenHolder = escrowList[escrowId].tokenHolder;
        // Update stats
        totalOnEscrow = totalOnEscrow.sub(value);
        tokensOnEscrow[tokenHolder] = tokensOnEscrow[tokenHolder].sub(value);
    }
}