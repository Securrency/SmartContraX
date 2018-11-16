pragma solidity ^0.5.0;

import "../cross-chain/CrossChainService.sol";
import "./interfaces/ITransferModule.sol";
import "./TransferModuleMetadata.sol";
import "../../request-verification-layer/transfer-verification-system/interfaces/ITransferVerification.sol";
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
    modifier onlyRegistredToken(address tokenAddress) {
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
        onlyRegistredToken(msg.sender)
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
    * @param tokens The amount of tokens to be transferred 
    */
    function verifyTransfer(
        address from,
        address to,
        address sender,
        uint tokens
    )
        public
        onlyRegistredToken(msg.sender)
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
    * @notice Add verification logic to the Transfer module
    * @param tvAddress Transfer verification logic address
    * @param standard Token standard related to this logic
    */
    function addVerificationLogic(address tvAddress, bytes32 standard) 
        public
        verifyPermission(msg.sig, msg.sender)
    {
        require(tvAddress != address(0), "Invalid address of the transfer verification logic.");
        require(transferVerifications[standard] == address(0), "Transfer verification logic for this standard already present.");
        require(tfInstance().isSupported(standard), "Standard didn't supports by tokens factory.");

        transferVerifications[standard] = tvAddress;

        emit TransferVerification(standard, tvAddress);
    }
}