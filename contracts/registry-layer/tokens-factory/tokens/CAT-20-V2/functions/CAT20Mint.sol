pragma solidity >0.4.99 <0.6.0;

import "../../../../../common/libraries/SafeMath.sol";
import "./verify-transfer/ICAT20VerifyTransfer.sol";
import "./CAT20Protected.sol";


/**
* @title CAT-20 Mint function
*/
contract CAT20Mint is CAT20Protected {
    // Define libraries
    using SafeMath for uint256;
    // Write info to the log about tokens minting
    event Mint(address indexed to, uint256 amount);
    // Write info to the log about tokens transfer
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
    * @notice Function to mint tokens
    * @param to The address that will receive the minted tokens
    * @param tokens The amount of tokens to mint
    */
    function mint(address to, uint tokens)
        public
        verifyPermission(msg.sig, msg.sender)
    {
        ICAT20VerifyTransfer(address(this)).verifyTransfer(
            to,
            to,
            to,
            tokens
        );

        balances[to] = balances[to].add(tokens);
        totalSupply_ = totalSupply_.add(tokens);

        emit Transfer(address(0), to, tokens);
        emit Mint(to, tokens);
    }
}