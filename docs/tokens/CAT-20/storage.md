## Layout in Storage
| Storage pointers range | Description |
| --- | --- |
| 0x00 - 0x3E7 | space for CAT-20 properties |
| 0x3E8 - F423F | space for CAT-20 mappings, arrays, structs |
| 0xF4240 - 1E847F | open space for custom code |

## CAT-20 token storage
| Storage pointer | Type | Description |
| --- | --- | --- |
| 0x00 | string | Token name |
| 0x01 | string | Token symbol |
| 0x02 | uint8 | Decimals |
| 0x03 | uint256 | Total supply |
| 0x09 | address | Components registry address |
| 0x0A | address | Permission module address |
| 0x0B | address | Transfer module address |
| 0x0C | address | Updates registry |
| 0x0D | bytes32 | Token version |
| 0x3E8 | mapping(address=>uint) | Balances |
| 0x3E9 | mapping(bytes4 => address) | Methods implementations |
| 0x3EA | mapping(address=>mapping(address=>value) | ERC-20 approvals |
