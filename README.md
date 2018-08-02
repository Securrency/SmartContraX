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

## Testing

To deploy the code simply run:

```bash
$ truffle migrate
```