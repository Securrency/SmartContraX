pragma solidity 0.4.24;

import "../../interfaces/ITransferModule.sol";
import "../../interfaces/ITokensFactory.sol";
import "../../interfaces/ITransferVerification.sol";

/**
* @title Transfer Module
*/
contract TransferModule is ITransferModule {
    // Address of the tokens factory
    address public tokenFactory;

    // Declare storage for a verification logics
    mapping(bytes32 => address) logics;

    /**
    * @notice Emit when new verification logic was added
    * @param standard Token standard
    * @param logicAddress Address of the verification logic
    */
    event Logic(bytes32 standard, address logicAddress);

    /**
    * @notice Setting address of the tokens factory
    * @param _tokensFactory Address of the tokens factory
    */
    constructor(address _tokensFactory) public {
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

        address verification = logics[standard];

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
    * @param logicAddress Transfer verification logic address
    * @param standard Token standard related to this logic
    */
    function addVerificationLogic(address logicAddress, bytes32 standard) public {
        require(logicAddress != address(0), "Invalid address of the verification logic.");
        require(logics[standard] == address(0), "Verification logic for this standard already present.");
        require(ITokensFactory(tokenFactory).isSupported(standard), "Standard didn't supports by tokens factory.");

        logics[standard] = logicAddress;

        emit Logic(standard, logicAddress);
    }
}