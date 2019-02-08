## List of the all supported methods
| Method id | Description | Smart Contract | Description |
| --- | --- | --- | --- |
| 0x18160ddd | totalSupply() | ERC20Functions | - |
| 0x70a08231 | balanceOf(address) | ERC20Functions | - |
| 0xdd62ed3e | allowance(address,address) | ERC20Functions | - |
| 0xa9059cbb | transfer(address,uint256) | ERC20Functions | - |
|  | transfer(address,uint256) | CAT20WLVTransferFunction | Transfer verification through a whitelist |
|  | transfer(address,uint256) | CAT20REVTransferFunction | Transfer verification through a rules engine |
| 0x095ea7b3 | approve(address,uint256) | ERC20Functions | - |
| 0x23b872dd | transferFrom(address,address,uint256) | ERC20Functions | - |
| 0x40c10f19 | mint(address,uint256) | CAT20MintFunction | - |
| 0x0cfbfcde | clawback(address,address,uint256) | CAT20WLVClawbackFunction | verification through a whitelist |
