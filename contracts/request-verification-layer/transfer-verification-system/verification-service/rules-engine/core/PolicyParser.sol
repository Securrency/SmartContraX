pragma solidity ^0.5.0;

import "../../../interfaces/IPolicyParser.sol";
import "../../../../../registry-layer/identity/interfaces/IIdentity.sol";


/**
* @title Policy parser
* @notice Parse token policy and returns result whether a call is allowed or not
*/
contract PolicyParser is IPolicyParser {
    // Identity instace
    IIdentity public identity;

    // Comparison operators
    bytes1 constant CO_1 = 0x01;// ==
    bytes1 constant CO_2 = 0x02;// != 
    bytes1 constant CO_3 = 0x03;// <
    bytes1 constant CO_4 = 0x04;// >
    bytes1 constant CO_5 = 0x05;// <=
    bytes1 constant CO_6 = 0x06;// >=
    
    // Logic operators
    bytes1 constant LO_1 = 0x01;// &&
    bytes1 constant LO_2 = 0x02;// ||
    
    // Attribute tags
    bytes1 constant AT_1 = 0x00;// source wallet
    bytes1 constant AT_2 = 0x01;// destination wallet
    bytes1 constant AT_3 = 0x02;// sender wallet
    bytes1 constant AT_4 = 0x03;// tx details
    
    // Error flags
    bytes1 constant ER_1 = 0x01;// with Error
    bytes1 constant ER_2 = 0x00;// without Error

    /**
    * @notice Initialize Policy Parset with identity service
    * @param _identity Identity service (stores wallets attributes and values)
    */
    constructor(address _identity) public {
        identity = IIdentity(_identity);
    }

    /**
     * @notice Verify policy and returns a result if allowed or not
     * @notice for the provided account
     * @param policy Token policy
     */
    function verifyPolicy(
        bytes memory policy,
        address[3] memory wallets,
        bytes32[10] memory txDetailsAttributes,
        bytes32[10] memory txDetailsValues
    )
        public
        view
        returns (bool)
    {
        bool result;
        uint offset = 0;
        bytes32[10] memory errorCodes;
        (result, offset, errorCodes) = processRulesSet(
            policy,
            offset,
            wallets,
            txDetailsAttributes,
            txDetailsValues
        );
        
        return result;
    }

    /**
     * @notice Verify policy and returns a result if allowed or not
     * @notice for the provided account
     * @param policy Token policy
     * @return result, error codes if presents
     */
    function canExecute(
        bytes memory policy,
        address[3] memory wallets,
        bytes32[10] memory txDetailsAttributes,
        bytes32[10] memory txDetailsValues
    )
        public 
        view 
        returns (bool result, bytes32[10] memory errorCodes)
    {
        uint offset = 0;
        (result, offset, errorCodes) = processRulesSet(
            policy,
            offset,
            wallets,
            txDetailsAttributes,
            txDetailsValues
        );
        
        return (result, errorCodes);
    }
    
    /**
    * @notice Recursively process rules sets
    * @notice wallet Wallet for which policy will be verified
    * @param policy Token policy
    * @param offset Offset in the policy, byte number from which start processing
    */
    function processRulesSet(
        bytes memory policy,
        uint offset,
        address[3] memory wallets,
        bytes32[10] memory txDetailsAttributes,
        bytes32[10] memory txDetailsValues
    ) 
        internal
        view
        returns (bool, uint, bytes32[10] memory)
    {
        uint8 numberOfTheRuleSets = uint8(policy[offset]);
        offset++;

        // collect rules set stats
        if (numberOfTheRuleSets != 0) {
            return processSubRulesSet(
                policy,
                offset,
                numberOfTheRuleSets,
                wallets,
                txDetailsAttributes,
                txDetailsValues
            );
        }
        
        return processCompareOperations(
            policy,
            offset,
            wallets,
            txDetailsAttributes,
            txDetailsValues
        );
    }
    
    /**
    * @notice Process Rule set subsets
    * @param policy Token policy
    * @param offset Offset in the policy, byte number from which start processing
    * @param numberOfTheRuleSets Number of the sub-rules sets in the policy
    */
    function processSubRulesSet(
        bytes memory policy,
        uint offset,
        uint numberOfTheRuleSets,
        address[3] memory wallets,
        bytes32[10] memory txDetailsAttributes,
        bytes32[10] memory txDetailsValues
    )
        internal
        view
        returns (bool result, uint, bytes32[10] memory errorCodes)
    {
        bytes memory rulesSetsRes = new bytes(numberOfTheRuleSets * 2 - 1);
        uint rulesSetsResIndex = 0;
        uint8 errorCodesIndex = 0;
        
        for (uint i = 0; i < numberOfTheRuleSets; i++) {
            (result, offset, errorCodesIndex, errorCodes) = processRulesSetAndMergeErrors(
                policy,
                offset,
                wallets,
                txDetailsAttributes,
                txDetailsValues,
                errorCodes,
                errorCodesIndex
            );

            rulesSetsRes[rulesSetsResIndex] = result ? bytes1(0x01) : bytes1(0x00);
            rulesSetsResIndex++;
            
            if (i < numberOfTheRuleSets - 1) {
                rulesSetsRes[rulesSetsResIndex] = policy[offset];
                rulesSetsResIndex++;
                offset++;
            }
        }
        
        return (processRulesSetResult(rulesSetsRes, numberOfTheRuleSets * 2 - 1), offset, errorCodes);
    }

    /**
    * @notice Process Rules Set and merge errors
    * @param policy Token policy
    * @param offset Offset in the policy, byte number from which start processing
    * @param wallets Wallets for verification
    * @param txDetailsAttributes Attributes of the transaction details
    * @param txDetailsValues Transaction values
    * @param errorCodes Array of the error codes
    * @param errorCodesIndex Error codes index
    */
    function processRulesSetAndMergeErrors(
        bytes memory policy,
        uint offset,
        address[3] memory wallets,
        bytes32[10] memory txDetailsAttributes,
        bytes32[10] memory txDetailsValues,
        bytes32[10] memory errorCodes,
        uint8 errorCodesIndex
    )
        internal
        view
        returns (bool result, uint, uint8, bytes32[10] memory)
    {
        bytes32[10] memory errorCodesFromResult;

        (result, offset, errorCodesFromResult) = processRulesSet(
            policy,
            offset,
            wallets,
            txDetailsAttributes,
            txDetailsValues
        );
        
        if (!result && errorCodesFromResult[0] != bytes32(0x00) && errorCodesIndex != 10) {
            for (uint8 j = 0; j < 10; j++) {
                if (errorCodesFromResult[j] == bytes32(0x00)) {
                    break;
                }
                errorCodes[errorCodesIndex] = errorCodesFromResult[j];
                errorCodesIndex++;
            }
        }

        return (result, offset, errorCodesIndex, errorCodes);
    }

    /**
    * @notice Process comparison operations in the rules set
    * @param policy Token policy
    * @param offset Offset in the policy, byte number from which start processing
    */
    function processCompareOperations(
        bytes memory policy,
        uint offset,
        address[3] memory wallets,
        bytes32[10] memory txDetailsAttributes,
        bytes32[10] memory txDetailsValues
    ) 
        internal
        view
        returns (bool result, uint, bytes32[10] memory errorCodes)
    {
        uint8 errorCodesIndex = 0;

        // last stage process comparison operators in the rules set
        uint8 compareOperations = uint8(policy[offset]);
        offset++;
        
        // calculate length
        uint resLen = compareOperations * 2 - 1;
        
        // bytes memory
        uint conditionsResultsIndex = 0;
        bytes memory conditionsResults = new bytes(resLen);
        
        for (uint8 i = 0; i < compareOperations; i++) {
          (result, offset) = processCompareOperation(
              policy,
              offset,
              wallets,
              txDetailsAttributes,
              txDetailsValues
            );
          
          // Check error
          bytes1 hasError = policy[offset];
          offset++;
          if (hasError == ER_1) {
              if (!result) {
                  errorCodes[errorCodesIndex] = executeBytes32(policy, offset);
                  errorCodesIndex++;    
              }
              offset+=32;
          }
          
          // update rule set results
          conditionsResults[conditionsResultsIndex] = result ? bytes1(0x01) : bytes1(0x00);
          conditionsResultsIndex++;
          if (compareOperations > 1 && i < compareOperations - 1) {
                conditionsResults[conditionsResultsIndex] = policy[offset];
                conditionsResultsIndex++;
                offset++;
          }
        }
        
        return (processRulesSetResult(conditionsResults, resLen), offset, errorCodes);
    }

    /**
    * @notice Process rules set result
    * @param conditionsResults Calculated rule set result ( true || false && true || true)
    * @param length Conditions result length (7)
    */
    function processRulesSetResult(bytes memory conditionsResults, uint length) public pure returns (bool) {
        if (length == 1) {
            return conditionsResults[0] == bytes1(0x01) ? true : false;
        }
        bool result;
        uint offset = 0;
        if (length == 3) {
            (result, offset) = verifyLogicCondition(conditionsResults, offset);
            return result;
        }
        
        bool hasAnd;
        bool hasTrue;
        uint convertedIndex;
        bytes memory converted = new bytes(length);
        for (uint i = 1; i < length; i+=2) {
            if (conditionsResults[i] == LO_1) {
                (result, offset) = verifyLogicCondition(conditionsResults, i-1);
                if (result) {
                    hasTrue = true;
                }
                
                converted[convertedIndex] = result ? bytes1(0x01) : bytes1(0x00);
                convertedIndex++;
                
                if (i+2 < length && conditionsResults[i+2] == LO_1) {
                    i+=2;
                    hasAnd = true;
                    converted[convertedIndex] = conditionsResults[i];
                    convertedIndex++;
                    converted[convertedIndex] = conditionsResults[i+1];
                    convertedIndex++;
                    if (conditionsResults[i+1] == bytes1(0x01)) {
                        hasTrue = true;
                    }
                }
            } else {
                if (conditionsResults[i-1] == bytes1(0x01)) {
                    hasTrue = true;
                }
                
                converted[convertedIndex] = conditionsResults[i-1];
                convertedIndex++;
                converted[convertedIndex] = conditionsResults[i];
                convertedIndex++;
            }
        }
        
        bytes memory convertedResult = new bytes(convertedIndex);
        for(uint i = 0; i < convertedIndex; i++) {
            convertedResult[i] = converted[i];
        }
        
        return (!hasTrue) ? false : (!hasAnd && hasTrue) ? true : processRulesSetResult(convertedResult, convertedIndex);
    }
    
    /**
    * @notice Compare two wallet attributes with attributes value in the policy
    * @param policy Token policy
    * @param offset Offset in the policy
    */
    function processCompareOperation(
        bytes memory policy,
        uint offset,
        address[3] memory wallets,
        bytes32[10] memory txDetailsAttributes,
        bytes32[10] memory txDetailsValues
    ) 
        internal
        view
        returns (bool, uint)
    {
        bytes1 compareOperation = policy[offset];
        offset++;
        bytes1 attributeTag = policy[offset];
        offset++;
        bytes32 attribute = executeBytes32(policy, offset);
        offset+=32;
        bytes32 valueOne = executeBytes32(policy, offset);
        offset+=32;
        
        bytes32 valueTwo = getAttributeValue(
            attributeTag,
            attribute,
            wallets,
            txDetailsAttributes,
            txDetailsValues
        );

        return (comparison(compareOperation, valueOne, valueTwo), offset);
    }

    /**
    * @notice Provides comparison beetwen two values
    * @param compareOperation Compare operation
    * @param valueOne Value to compare
    * @param valueTwo Value to compare
    */
    function comparison(
        bytes1 compareOperation,
        bytes32 valueOne,
        bytes32 valueTwo
    )
        internal
        pure
        returns (bool)
    {
        if (compareOperation == CO_1) {
            return equals(valueOne, valueTwo);
        }
        if (compareOperation == CO_2) {
            return notEquals(valueOne, valueTwo);
        }

        uint valueOneNum = uint(valueOne);
        uint valueTwoNum = uint(valueTwo);

        if (compareOperation == CO_3) {
            return valueOneNum < valueTwoNum;
        }
        if (compareOperation == CO_4) {
            return valueOneNum > valueTwoNum;
        }
        if (compareOperation == CO_5) {
            return valueOneNum <= valueTwoNum;
        }
        if (compareOperation == CO_6) {
            return valueOneNum >= valueTwoNum;
        }

        revert("Invalid compare operation type.");
    }
    
    /**
    * @notice Select wallet attribute
    * @param attribute Attribute to be compared
    * @param wallets Wallets array that contains (from, to & sender accounts)
    */
    function getAttributeValue(
        bytes1 attributeTag,
        bytes32 attribute,
        address[3] memory wallets,
        bytes32[10] memory txDetailsAttributes,
        bytes32[10] memory txDetailsValues
    )
        internal
        view
        returns (bytes32)
    {
        uint8 attributeType = uint8(attributeTag);
        if (attributeType > 3) {
            revert("Invalid wallet type.");
        }

        if (attributeType == 3) {
            uint8 attributeIndex = 0;
            for (uint8 i = 0; i < 10; i++) {
                if (txDetailsAttributes[i] == bytes1(0x00)) {
                    break;
                }
                if (equals(txDetailsAttributes[i], attribute)) {
                    return txDetailsValues[attributeIndex];
                }
            }
            revert("Attribute not found.");
        }

        return identity.getWalletAttribute(wallets[attributeType], attribute);
    }

    /**
     * @notice Verify logic condition
     * @param policy Policy converted
     * @param offset Offset in the policy
     * @return result Condition verification result
     */
    function verifyLogicCondition(
        bytes memory policy,
        uint offset
    )
        public
        pure
        returns (bool result, uint)
    {
        // calculate offset && conditions
        bool value1 = policy[offset] == bytes1(0x01) ? true : false;
        offset++;
        bytes1 operator = policy[offset];
        offset++;
        bool value2 = policy[offset] == bytes1(0x01) ? true : false;
        offset++;
        
        if (LO_1[0] == operator[0]) {
            return (value1 && value2, offset);
        }
        if (LO_2[0] == operator[0]) {
            return (value1 || value2, offset);
        }

        revert("Invalid logic operator.");
    }
    
    /**
    * @notice Verify if parameters are equeal
    * @param self Value to be compare
    * @param other Value to be compare
    */
    function equals(bytes32 self, bytes32 other) public pure returns (bool equal) {
       for (uint8 i = 0; i < 32; i++) {
            if (self[i] != other[i]) {
                return false;
            }
       }
       return true;
    }
    
    /**
    * @notice Vierify if parameters are not equal
    * @param self Value to be compare
    * @param other Value to be compare
    */
    function notEquals(bytes32 self, bytes32 other) public pure returns (bool equal) {
        if (other == bytes32(0x00)) {
            return false;
        }
        
        for (uint8 i = 0; i < 32; i++) {
            if (self[i] != other[i]) {
                return true;
            }
        }
       return false;
    }
    
    /**
    * @notice Execute 32 bytes
    * @param input Input bytes
    * @param offset Offset from which will be cut 32 bytes 
    */
    function executeBytes32(bytes memory input, uint offset) public pure returns (bytes32 outBytes) {
        bytes memory result = new bytes(32);
        uint num = 0;
        for (uint i = offset; i < offset + 32; i++) {
            result[num] = input[i];
            num++;
        }
        assembly {
            outBytes := mload(add(result, 32))
        }
    }
}