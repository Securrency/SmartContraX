## Token policy (country == US)

| Storage pointers range | Description |
| --- | --- |
| 0x00 - 0x3E7 | space for CAT-20 properties |
| 0x3E8 - F423F | space for CAT-20 mappings, arrays, structs |
| 0xF4240 - 1E847F | open space for custom code |

Comparation operators

| Operator | Value |
| --- | --- |
| == | 01 |
| != | 02 |
| < | 03 |
| > | 04 |
| <= | 05 |
| >= | 06 |

Logic operators

| Operator | Value |
| --- | --- |
| && | 01 |
| || | 02 |

Attribute tags

| Tag | Value |
| --- | --- |
| source wallet | 00 |
| destination wallet | 01 |
| sender wallet | 02 |
| tx details | 03 |


Error flags

| flag | Value |
| --- | --- |
| with error | 01 |
| without error | 00 |

Condition
country == US

Structure

| Field | Number of the bytes |
| --- | --- |
| Number of the rules sets | 1 |
| Number of the compare operations in the rules set | 1 |
| Comparison operation type | 1 |
| Attribute tag | 1 |
| Attribute | 32 |
| Value to compare | 32 |
| Error flag (Present or not present) | 1 |
| Error message | 32 |

Policy structure

| Byte Index | Field | Value |
| --- | --- | --- |
| 0 | Number of the rules sets | 01 |
| 1 | Number of the rules sets | 00 |
| 2 | Number of the compare operations in the rules set | 01 |
| 3 | Comparison operation type | 01 |
| 4 | Attribute tag | 00 |
| 5 | Attribute (country) | 636f756e74727900000000000000000000000000000000000000000000000000 |
| 37 | Value to compare (US) | 5553000000000000000000000000000000000000000000000000000000000000 |
| 69 | Error flag (Present or not present | 01 |
| 70 | Error message | 4341542d32300000000000000000000000000000000000000000000000000000 |

Converted policy
0x0100010100636f756e747279000000000000000000000000000000000000000000000000005553000000000000000000000000000000000000000000000000000000000000014341542d32300000000000000000000000000000000000000000000000000000
