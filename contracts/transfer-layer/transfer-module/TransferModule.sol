pragma solidity ^0.5.0;

import "../cross-chain/CrossChainService.sol";
import "./interfaces/ITransferModule.sol";
import "./TransferModuleMetadata.sol";
import "../../request-verification-layer/transfer-verification-system/interfaces/ITransferVerification.sol";
import "../../request-verification-layer/transfer-verification-system/interfaces/ITransferVerificationWithId.sol";
import "../../request-verification-layer/transfer-verification-system/interfaces/ICAT20TransferAction.sol";
import "../../request-verification-layer/transfer-verification-system/interfaces/ICAT1400TransferAction.sol";
import "../../registry-layer/tokens-factory/interfaces/ITokensFactory.sol";
import "../../registry-layer/tokens-factory/interfaces/IMultiChainToken.sol";
import "../../common/component/SystemComponent.sol";
import "../../registry-layer/components-registry/instances/TokensFactoryInstance.sol";


/**
* @title Transfer Module
*/
contract TransferModule is ITransferModule, CrossChainService, SystemComponent, TokensFactoryInstance, TransferModuleMetadata {
    // Declare storage for a transfer verification logics
    mapping(bytes32 => address) transferVerifications;

    /**
    * @notice Emit when new transfer verification logic was added
    * @param standard Token standard
    * @param tvAddress Address of the transfer verification logic
    */
    event TransferVerification(bytes32 standard, address tvAddress);

    /**
    * @notice Verify token address
    */
    modifier onlyRegisteredToken(address tokenAddress) {
        require(
            tfInstance().getTokenStandard(tokenAddress) != 0x00, 
            "Token is not registered in the tokens factory."
        );
        _;
    } 

    /**
    * @notice Initialize contract
    * @param _componentsRegistry Address of the components registry
    */
    constructor(
            address _componentsRegistry, 
            address _toChainStorage, 
            address _fromChainStorage
    ) 
        public
        WithComponentsRegistry(_componentsRegistry)
        ToChain(_toChainStorage)
        FromChain(_fromChainStorage)
    {
        componentName = TRANSFER_MODULE_NAME;
        componentId = TRANSFER_MODULE_ID;
    }

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
        public
        onlyRegisteredToken(msg.sender)
    {
        require(isSupported(chain), "Chain is not supported.");
        require(sender != address(0), "Invalid sender.");
        require(targetAddress.length > 0, "Invalid target address.");
        require(value > 0, "Invalid value.");

        sendToOtherChain(
            msg.sender,
            sender,
            chain,
            targetAddress,
            value
        ); 
    }
    
    /**
    * @notice Receipt tokens from the other chain
    * @param fromTokenAddress Token address in the previous chain
    * @param sentFrom Sender address in the previous chain
    * @param recipient Recipient address
    * @param tokenAddress Token address in the current chain
    * @param fromChain Original chain
    * @param originalTxHash Tx hash which initiate cross chain transfer
    * @param value Amount of tokens
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
        external
        verifyPermission(msg.sig, msg.sender)
    {
        require(
            tfInstance().getTokenStandard(tokenAddress) != 0x00, 
            "Token is not registered in the tokens factory."
        );
        require(fromTokenAddress != address(0), "Invalid address.");
        require(recipient != address(0), "Invalid address.");
        require(sentFrom.length > 0, "Invalid sender address.");
        require(isSupported(fromChain), "Chain is not supported.");
        require(originalTxHash.length > 0, "Invalid original tx hash.");
        require(value > 0, "Invalid value.");

        IMultiChainToken(tokenAddress).acceptFromOtherChain(
            value,
            fromChain,
            recipient,
            sentFrom
        );

        receivedFromOtherChain(
            fromTokenAddress,
            recipient,
            tokenAddress,
            sentFrom,
            fromChain,
            originalTxHash,
            value,
            txId
        );
    }

    /**
    * @notice Verify tokens transfer. 
    * @notice Selecting verification logic depending on the token standard.
    * @param from The address transfer from
    * @param to The address transfer to
    * @param sender Sender address
    * @param tokens The amount of tokens to be transferred 
    */
    function verifyTransfer(
        address from,
        address to,
        address sender,
        uint tokens
    )
        public
        onlyRegisteredToken(msg.sender)
        view
        returns (bool)
    {
        bytes32 standard = tfInstance().getTokenStandard(msg.sender);
        address verification = transferVerifications[standard];

        if(verification == address(0)) {
            return true;
        }

        return ITransferVerification(verification).verifyTransfer(
            from,
            to,
            sender,
            msg.sender,
            tokens
        );
    }

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
        returns (bool)
    {
        bytes32 standard = tfInstance().getTokenStandard(msg.sender);
        address verification = transferVerifications[standard];

        if(verification == address(0)) {
            return true;
        }

        return ITransferVerificationWithId(verification).verifyTransfer(
            from,
            to,
            sender,
            tokenAddress,
            id
        );
    }

    /**
    * @notice Verify tokens transfer and cache result
    * @param from The address transfer from
    * @param to The address transfer to
    * @param sender Sender address
    * @param tokens The number of tokens to be transferred 
    */
    function checkCAT20TransferThroughRE(
        address from,
        address to,
        address sender,
        uint tokens
    )
        public
        returns (bool)
    {
        // CAT-20-V2-RE
        bytes4 standard = 0x6a770c78;
        address verification = transferVerifications[standard];

        if(verification == address(0)) {
            return true;
        }

        return ICAT20TransferAction(verification).verifyTransfer(
            from,
            to,
            sender,
            msg.sender,
            tokens
        );
    }

    /**
    * @notice Verify tokens transfer and cache result
    * @param from The address transfer from
    * @param to The address transfer to
    * @param sender Sender address
    * @param partition Partition identifier
    * @param tokens The number of tokens to be transferred 
    */
    function checkCAT1400TransferThroughRE(
        address from,
        address to,
        address sender,
        bytes32 partition,
        uint tokens
    )
        public
        returns (bool)
    {
        // CAT-1400-RE
        bytes4 standard = 0x4341542d;
        address verification = transferVerifications[standard];

        if(verification == address(0)) {
            return true;
        }

        return ICAT1400TransferAction(verification).verifyTransfer(
            from,
            to,
            sender,
            msg.sender,
            tokens,
            partition
        );
    }

    /**
    * @notice Add verification logic to the Transfer module
    * @param tvAddress Transfer verification logic address
    * @param standard Token standard related to this logic
    */
    function addVerificationLogic(address tvAddress, bytes32 standard) 
        public
        verifyPermission(msg.sig, msg.sender)
    {
        require(tvAddress != address(0), "Invalid address of the transfer verification logic.");

        transferVerifications[standard] = tvAddress;

        emit TransferVerification(standard, tvAddress);
    }
}