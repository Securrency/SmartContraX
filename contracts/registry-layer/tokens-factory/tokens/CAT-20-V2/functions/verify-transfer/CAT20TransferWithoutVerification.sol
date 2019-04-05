pragma solidity >0.4.99 <0.6.0;

import "./ICAT20VerifyTransfer.sol";


/**
* @notice Empty implementation (without transfer verification)
*/
contract CAT20TransferWithoutVerification is ICAT20VerifyTransfer {
    function verifyTransfer(address, address, address, uint) external {}
}