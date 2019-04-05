pragma solidity >0.4.99 <0.6.0;

import "./CAT20Transfer.sol";
import "./CAT20Protected.sol";
import "./verify-transfer/ICAT20VerifyTransfer.sol";


/**
* @notice CAT-20 Clawback function
*/
contract CAT20Clawback is CAT20Protected, CAT20Transfer {
    // Write info to the log about clawback
    event Clawback(address indexed from, address indexed to, uint tokens);

    /**
    * @notice Clawback method which provides an allowance for the issuer 
    * @notice to move tokens between any accounts
    * @param from Address from which tokens will be removed
    * @param to The recipient address
    * @param tokens Value which will be transferred
    */
    function clawback(address from, address to, uint tokens) 
        public
        verifyPermission(msg.sig, msg.sender) 
    {
        ICAT20VerifyTransfer(address(this)).verifyTransfer(to, to, to, tokens);

        _transfer(from, to, tokens);
        emit Clawback(from, to, tokens);
    }
}