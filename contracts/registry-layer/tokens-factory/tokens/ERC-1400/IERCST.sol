pragma solidity ^0.4.24;

/// @title IERCST Security Token Standard (EIP 1400)
/// @dev See https://github.com/SecurityTokenStandard/EIP-Spec

contract IERCST {

    // Document Management
    function getDocument(bytes32 _name) external view returns (string, bytes32);
    function setDocument(bytes32 _name, string _uri, bytes32 _documentHash) external;

    // Controller Operation
    function isControllable() external view returns (bool);

    // Token Issuance
    function isIssuable() external view returns (bool);
    function issueByTranche(bytes32 _tranche, address _tokenHolder, uint256 _amount, bytes _data) external;
    event IssuedByTranche(bytes32 indexed tranche, address indexed operator, address indexed to, uint256 amount, bytes data, bytes operatorData);

    // Token Redemption
    function redeemByTranche(bytes32 _tranche, uint256 _amount, bytes _data) external;
    function operatorRedeemByTranche(bytes32 _tranche, address _tokenHolder, uint256 _amount, bytes _operatorData) external;
    event RedeemedByTranche(bytes32 indexed tranche, address indexed operator, address indexed from, uint256 amount, bytes operatorData);

    // Transfer Validity
    function canSend(address _from, address _to, bytes32 _tranche, uint256 _amount, bytes _data) external view returns (byte, bytes32, bytes32);

}