pragma solidity 0.4.24;

import "./interfaces/ITransferModule.sol";
import "../../request-verification-layer/transfer-verification-system/interfaces/ITransferVerification.sol";
import "../../request-verification-layer/permission-module/Protected.sol";
import "../../registry-layer/tokens-factory/interfaces/ITokensFactory.sol";

/**
* @title Transfer Module
*/
contract TransferModule is ITransferModule, Protected {
    // Address of the tokens factory
    address public tokenFactory;

    // Declare storage for a transfer verification logics
    mapping(bytes32 => address) transferVerifications;

    /**
    * @notice Emit when new transfer verification logic was added
    * @param standard Token standard
    * @param tvAddress Address of the transfer verification logic
    */
    event TransferVerification(bytes32 standard, address tvAddress);

    /**
    * @notice Setting address of the tokens factory
    * @param _tokensFactory Address of the tokens factory
    */
    constructor(address _tokensFactory, address _permissiomModule) 
        public
        Protected(_permissiomModule)
    {
        tokenFactory = _tokensFactory;
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
        view
        returns (bool)
    {
        bytes32 standard = ITokensFactory(tokenFactory).getTokenStandard(msg.sender);
        require(standard != 0x00, "Token is not registered in the tokens factory.");

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
        require(ITokensFactory(tokenFactory).isSupported(standard), "Standard didn't supports by tokens factory.");

        transferVerifications[standard] = tvAddress;

        emit TransferVerification(standard, tvAddress);
    }
}