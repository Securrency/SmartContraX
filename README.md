## Tokens Issuing Platform
Platform supports the most popular tokens standards and its modifications on Ethereum blockchain. Modified tokens standards provide the symbol uniqueness in the network, additional security and protection for tokens owners by means of symbol registry, permission and transfer modules.

## Project architecture and relations beetwen components
<img src="docs/images/architecture-and-relations.jpg" width="895">

                      Picture 1 - Project architecture and relations beetwen components

System components:

* **Symbol registry** is a repository for symbol instances. It also provides an opportunity to register token symbols in our network. 
* **Token Factory** is a component which accepts a request to create a new token, checks the parameters and deploys a token through Token Deployment Strategy. Tokens factory also perform the other functions: create, delete, update deployment strategies.
* **Permissions verification system** serves as a core for verification of the requests which are processed in our Smart Contracts. It includes:
  - **Permission Module** is a flexible mechanism which allows to create and set rules for accessing the network components.     Permission Module grants the ability to take control over the token issuance, symbol registration, registration of new       verification services, adding/removal strategies, etc.
  - **Network Roles Manager**  - verifies request which belongs to our system (Register a symbol, Token Creation, Adding new     Strategies, Adding new transfer verification services).
  - **Token Roles Manager** - verifies requests which belong to the token. (Example add/remove to/from the WhiteList, create     RollBack).
* **Transfer verification system** validates transactions through Transfer module by the logic which was related to the token standard. Each standard can implement own transfer verification logic and can contain one or few verification services. (WhiteList, Rules Engine).
  - **Transfer Module** accepts requests on the tokens transfer verification. Then Transfer Module request a token standard       from the tokens factory. Basing on the token standard received Transfer module select transfer verification logic.
  - **Transfer Verification** contains “transfer verification logic” created for each standard.  “Transfer verification           logic” can be implemented by means of different “transfer verification services”. There could be different “transfer         verification services” for each standard.
  - **Transfer Verification Service**
      - **Whitelist** stores the list of accounts with a proven identity over KYC. Hence  WhiteList checks the accounts which         send or receive requests in our Smart contracts. If an account is not found in the WhiteList request would be                 rejected. (Applied for Securrency standards CAT-20, CAT-721)

## Package version requirements for your machine:

- node v8.10.0
- npm v3.5.2
- Truffle v4.1.13 (core: 4.1.13)
- Solidity v0.4.24 (solc-js)
- Ganache CLI v6.1.6 (ganache-core: 2.1.5)

## Setup

The smart contracts are written in [Solidity](https://github.com/ethereum/solidity) and tested/deployed using [Truffle](https://github.com/trufflesuite/truffle) version 4.1.13.

```bash
# Install nodejs
$ sudo apt install nodejs

# Install npm
$ sudo apt install npm

# Install Truffle package globally:
$ npm install -g truffle

# Install ganache-cli
$ npm install -g ganache-cli

# Install local node dependencies:
$ npm install
```

## Testing

To test the code simply run:

```bash
$ truffle test
```

## Deploying

To deploy the code simply run:

```bash
$ truffle migrate
```