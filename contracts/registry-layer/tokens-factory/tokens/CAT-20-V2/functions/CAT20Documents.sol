pragma solidity >=0.5.0 <0.6.0;

import "./CAT20Protected.sol";
import "../../../interfaces/IERC1643.sol";
import "../../../../../common/libraries/SafeMath.sol";


/**
* @title CAT-20 functions related to documents management.
* @dev https://github.com/ethereum/EIPs/issues/1643
*/
contract CAT20Documents is CAT20Protected, IERC1643 {
    // Define libraries
    using SafeMath for uint;

    /**
    * @notice Used to attach a new document to the contract,
    * @notice or update the URI or hash of an existing document
    * @param _name Document name
    * @param _uri Document uri
    * @param _documentHash Document Hash
    */
    function setDocument(bytes32 _name, string calldata _uri, bytes32 _documentHash)
        external
        verifyPermission(msg.sig, msg.sender)
    {
        require(_name != bytes32(0x00), "Invalid document name");
        require(bytes(_uri).length > 0, "Invalid uri");
        require(_documentHash != bytes32(0x00), "Invalid document hash");

        if (documentDetails[_name].lastModified == 0) {
            documentDetails[_name].index = documents.length;
            documents.push(_name);
        }

        if (keccak256(bytes(documentDetails[_name].uri)) != keccak256(bytes(_uri))) {
            documentDetails[_name].uri = _uri;
        }
        if (documentDetails[_name].documentHash != _documentHash) {
            documentDetails[_name].documentHash = _documentHash;
        }
        if (documentNameByIndex[documentDetails[_name].index] != _name) {
            documentNameByIndex[documentDetails[_name].index] = _name;
        }

        documentDetails[_name].lastModified = now;

        emit DocumentUpdated(_name, _uri, _documentHash);
    }

    /**
    * @notice Remove an existing document from the contract
    * @param _name Document name which will be removed
    */
    function removeDocument(bytes32 _name)
        external
        verifyPermission(msg.sig, msg.sender)
    {
        require(documentDetails[_name].lastModified !=0, "Invalid document to delete");
        
        uint index = documentDetails[_name].index;

        emit DocumentRemoved(
            _name,
            documentDetails[_name].uri,
            documentDetails[_name].documentHash
        );

        uint lastDocument = documents.length.sub(1);
        if (documents.length > 1 && index != lastDocument) {
            bytes32 toUpdate = documentNameByIndex[lastDocument];
            documentDetails[toUpdate].index = index;
            documents[index] = toUpdate;
        }

        documents.length = documents.length.sub(1);
        delete documentDetails[_name];
    }

    /**
    * @notice Returns document details
    */
    function getDocument(bytes32 _name) external view returns (string memory, bytes32, uint256) {
        return (
            documentDetails[_name].uri,
            documentDetails[_name].documentHash,
            documentDetails[_name].lastModified
        );
    }

    /**
    * @notice Returns list of the all documents
    */
    function getAllDocuments() external view returns (bytes32[] memory) {
        return documents;
    }
}