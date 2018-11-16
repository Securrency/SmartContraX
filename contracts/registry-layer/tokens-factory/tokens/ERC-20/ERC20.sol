/**
* Original work Copyright 2016 Smart Contract Solutions, Inc. 
* Modified work Copyright 2018 SECURRENCY INC.
*/
pragma solidity ^0.5.0;

import "./ERC20Basic.sol";


/**
 * @title ERC20 interface
 * @dev see https://github.com/ethereum/EIPs/issues/20
 */
contract ERC20 is ERC20Basic {
  /**
  * @notice Write info the the log about approval
  * @param owner Tokens owner address
  * @param spender Spender address
  * @param value Number of the tokens
  */
  event Approval(
    address indexed owner,
    address indexed spender,
    uint256 value
  );

  /**
  * @notice Returns the amount of tokens approved by the owner
  * @param _owner Owner address
  * @param _spender Spender address
  */
  function allowance(address _owner, address _spender)
    public 
    view 
    returns (uint256);

  /**
  * @notice Send `tokens` amount of tokens from address `from` to address `to
  * @param _from Address where tokens will be transferred from
  * @param _to Recipient address
  * @param _value Number of the tokens to be transferred
  */
  function transferFrom(address _from, address _to, uint256 _value)
    public
    returns (bool);

  /**
  * @notice Allow `spender` to withdraw from your account, multiple times, up to the `tokens` amount.
  * @param _spender Spender address
  * @param _value Number of the tokens
  */
  function approve(address _spender, uint256 _value) public returns (bool);
}
