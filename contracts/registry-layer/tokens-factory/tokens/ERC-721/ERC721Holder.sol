/**
* Original work Copyright 2016 Smart Contract Solutions, Inc. 
* Modified work Copyright 2018 SECURRENCY INC.
*/
pragma solidity ^0.5.0;

import "./ERC721Receiver.sol";


contract ERC721Holder is ERC721Receiver {
  function onERC721Received(
    address,
    address,
    uint256,
    bytes memory
  )
    public
    returns(bytes4)
  {
    return ERC721_RECEIVED;
  }
}
