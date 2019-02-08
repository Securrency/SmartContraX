For the interaction with the platform is set to a couple of steps:
* Create token
include:
	* [symbol registration](./symbol-registry.md) (choosing the symbol)
  * [token registration ](./tokens-factory.md)(specifying a token name, symbol, select standard)
* Permission module configuration
	* [add "Compliance role"](./permission-module.md) for the wallet. The role allows configuring token.
* Depending on the created token (CAT-20, CAT-20-V2) you must:
	* CAT-20, CAT-721
		* [configure a whitelist](./whitelist.md)
	* CAT-20-V2 
		* [configure token](./cat20-v2-configuration.md) (select prefered methods implementations)
		* [configure a whitelist](./whitelist.md)
			or
		* [set token policy](./token-policy-registry.md)
		* [add wallets attributes](./identity.md) to the identity