pragma solidity 0.4.24;

import "../ERC-1400/IERCST.sol";
import "../ERC-1400/ERC1400BackwardCompatible.sol";
import "../../../../request-verification-layer/permission-module/Protected.sol";


/**
* @title CAT-1400. Part fungible token.
* @notice Extends ERC-1400. Backward compatible with ERC-777 & ERC-20
* @dev https://github.com/ethereum/EIPs/issues/1410
* @dev https://github.com/ethereum/EIPs/issues/1411
*/
contract CAT1400 is ERC1400BackwardCompatible, IERCST, Protected {
    // Describe document
    struct Document {
        bytes32 documentHash;
        string uri;
    }

    // Stores state of the issuing possibilities
    bool issuable = true;

    // Store state
    bool controllable = true;

    // Declate storage for the documents
    // name -> Document
    mapping(bytes32 => Document) documents;

    /**
    * @notice Write info to the log about new document or document updated
    * @param updatedBy Address which add || update document
    * @param name Document name
    * @param uri Document uri
    * @param documentHash Hash of the document
    */
    event DocumentUpdate(address indexed updatedBy, bytes32 name, string uri, bytes32 documentHash);

    /**
    * @notice Write info to the log about new issuance
    * @param tranche Identifier of the tranche
    * @param operator Address of the issuing iniatiator
    * @param to Issued tokens recipient
    * @param amount Number of the tokens that are issued
    * @param data Data
    * @param operatorData Operator data
    */
    event IssuedByTranche(
        bytes32 indexed tranche,
        address indexed operator,
        address indexed to,
        uint256 amount,
        bytes data,
        bytes operatorData
    );

    /**
    * @notice Write info to the log about tokens redemption
    * @param tranche Identifier of the tranche
    * @param operator Address of the issuing iniatiator
    * @param from Issued tokens recipient
    * @param amount Number of the tokens that are burned
    * @param operatorData Operator data
    */
    event RedeemedByTranche(
        bytes32 indexed tranche,
        address indexed operator,
        address indexed from,
        uint256 amount,
        bytes operatorData
    );

    // initialize token
    constructor(string name, string symbol, address componentsRegistry) 
        public
        WithComponentsRegistry(componentsRegistry) 
    {
        _name = name;
        _symbol = symbol;
    }

    // Document Management
    /**
    * @notice Returns document details
    * @param _name Name of the document
    */
    function getDocument(bytes32 _name) external view returns (string, bytes32) {
        return (documents[_name].uri, documents[_name].documentHash);
    }

    /**
    * @notice Set document details
    * @param _name Document name
    * @param _uri Custom uri that must be related to the document
    * @param _documentHash Hash of the document
    */
    function setDocument(bytes32 _name, string _uri, bytes32 _documentHash) 
        external
        verifyPermission(msg.sig, msg.sender)
    {
        // Save document details
        documents[_name] = Document(_documentHash, _uri);

        // Write info to the log
        emit DocumentUpdate(
            msg.sender,
            _name,
            _uri,
            _documentHash
        );
    }

    /**
    * @notice Swith controllable
    */ 
    function swithControllable() external verifyPermission(msg.sig, msg.sender) {
        controllable = !controllable;
    }

    /**
    * @notice Switch issuable
    */
    function switchIssuable() external verifyPermission(msg.sig, msg.sender) {
        issuable = !issuable;
    }

    /**
    * @notice In order to provide transparency over whether defaultOperators or defaultOperatorsByTranche 
    * @notice can be defined by the issuer, the function isControllable can be used.
    */
    function isControllable() external view returns (bool) {
        return controllable;
    }

    /**
    * @notice Show if the issuing is allowed
    * @notice A security token issuer can specify that issuance has finished for the token 
    * @notice (i.e. no new tokens can be minted or issued).
    */
    function isIssuable() external view returns (bool) {
        return issuable;
    }

    /**
    * @notice Issue new tokens. This function must be called to increase the total supply.
    * @param _tranche Identifier of the tranche
    * @param _tokenHolder Issued tokens recipient
    * @param _amount Number of the tokens that are issued
    * @param _data Data
    */
    function issueByTranche(
        bytes32 _tranche,
        address _tokenHolder,
        uint _amount,
        bytes _data
    ) 
        external
        verifyPermission(msg.sig, msg.sender)
    {
        require(issuable, "Issuance not allowed.");

        _mint(
            _tokenHolder, 
            _tranche, 
            _amount,
            _data
        );

        // Write info to the log
        emit IssuedByTranche(_tranche, msg.sender, _tokenHolder, _amount, _data, "");
    }
    
    /**
    * @notice Set default tranches for all token holders
    * @param _tranches New tranches
    */
    function setDefaultTranche(bytes32[] _tranches) 
        external
        verifyPermission(msg.sig, msg.sender) 
    {
        super._setDefaultTranches(_tranches);
    }

    /**
    * @notice Set default trache
    * @param _tranche New tranche 
    */
    function addDefaultTranche(bytes32 _tranche) 
        external
        verifyPermission(msg.sig, msg.sender)
    {
        super._addDefaultTranche(_tranche);
    }

    /**
    * @notice Remove default tranche
    * @param _tranche Tranche to be removed 
    */
    function removeDefaultTranche(bytes32 _tranche) 
        external
        verifyPermission(msg.sig, msg.sender)
    {
        super._removeDefaultTranche(_tranche);
    }

    // Token Redemption. Allows a token holder to burn or redeem tokens.
    /**
    * @notice Redeem or burn tokens
    * @param _tranche Tranche from which tokens will be removed
    * @param _amount Number of the tokens that are burned
    * @param _data Data
    */
    function redeemByTranche(bytes32 _tranche, uint _amount, bytes _data) external {
        // Burn tokens
        _burn(
            _tranche,
            address(0),
            msg.sender,
            _amount,
            _data,
            ""
        );

        // Write info to the log
        emit RedeemedByTranche(
            _tranche,
            address(0),
            msg.sender,
            _amount,
            _data
        );
    }

    /**
    * @notice Provide a possibility for the operator redeem or burn tokens
    * @param _tranche Tranche from which tokens will be removed
    * @param _tokenHolder Token holder address
    * @param _amount Number of the tokens that are burned
    * @param _operatorData Operator data
    */
    function operatorRedeemByTranche(
        bytes32 _tranche, 
        address _tokenHolder, 
        uint _amount, 
        bytes _operatorData
    ) 
        external 
    {
        require(isOperatorForTranche(_tranche, msg.sender, _tokenHolder), "Operation not allowed.");

        // Burn tokens
        _burn(
            _tranche,
            msg.sender,
            _tokenHolder,
            _amount,
            "",
            _operatorData
        );

        // Write info to the log
        emit RedeemedByTranche(
            _tranche,
            msg.sender,
            _tokenHolder,
            _amount,
            _operatorData
        );
    }

    /**
    * @notice Add default operator for specific tranche
    * @param _tranche Tranche
    * @param _operator Operator which will be added
    */
    function setDefaultOperatorForTranche(bytes32 _tranche, address _operator) 
        external
        verifyPermission(msg.sig, msg.sender) 
    {
        require(controllable, "Operation not allowed. Disabled by issuer.");

        super._setDefaultOperatorForTranche(_tranche, _operator);
    }

    /**
    * @notice Add default operators for specific tranche
    * @param _tranche Tranche
    * @param _operators Operators array
    */
    function setDefaultOperatorsForTranche(bytes32 _tranche, address[] _operators) 
        external
        verifyPermission(msg.sig, msg.sender) 
    {
        require(controllable, "Operation not allowed. Disabled by issuer.");

        super._setDefaultOperatorsForTranche(_tranche, _operators);
    }

    /**
    * @notice Set default operators
    * @notice all tranches -> all holders
    * @param _operators Operators array 
    */
    function setDefaultOperators(address[] _operators) 
        external
        verifyPermission(msg.sig, msg.sender) 
    {
        require(controllable, "Operation not allowed. Disabled by issuer.");

        super._setDefaultOperators(_operators);
    }

    /**
    * @notice Add default operator for specific tranche
    * @param _operator Operator which will be added
    */
    function setDefaultOperator(address _operator) 
        external
        verifyPermission(msg.sig, msg.sender) 
    {
        require(controllable, "Operation not allowed. Disabled by issuer.");

        super._setDefaultOperator(_operator);
    }

    /**
    * @notice Revoke system operator
    * @param _operator Operator address which will be revoked
    */
    function revokeSystemOperator(address _operator) 
        external
        verifyPermission(msg.sig, msg.sender)
    {
        super._revokeSystemOperator(_operator);
    }

    /**
    * @notice Revoke default operator from the tranche
    * @param tranche Tranche
    * @param operator Operator address which will be revoked
    */
    function revokeDefaultOperator(bytes32 tranche, address operator) 
        external
        verifyPermission(msg.sig, msg.sender)
    {
        super._revokeDefaultOperator(tranche, operator);
    }

    // Transfer Validity
    // Will be implemented
    function canSend(
        address /**_from**/, 
        address /**_to**/, 
        bytes32 /**_tranche**/, 
        uint    /**_amount**/, 
        bytes   /**_data**/
    ) 
        external 
        view 
        returns (
            byte, 
            bytes32, 
            bytes32
        ) 
    {
        return (byte(""), bytes32(""), bytes32(""));
    }
}