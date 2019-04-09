pragma solidity >0.4.99 <0.6.0;

import "./ICAT1400VerifyTransfer.sol";


/**
* @notice Empty implementation (without transfer verification)
*/
contract CAT1400TransferWithoutVerification is ICAT1400VerifyTransfer {
    function verifyTransfer(address, address, address, bytes32, uint) external {}
}