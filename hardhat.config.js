require("@nomiclabs/hardhat-etherscan")
require("@nomiclabs/hardhat-waffle")
require("@nomiclabs/hardhat-ethers")
require("hardhat-deploy")
require("hardhat-gas-reporter")
require("hardhat-contract-sizer")
require("solidity-coverage")
require("dotenv").config()

const RINKEBY_RPC_URL = process.env.RINKEBY_RPC_URL
const PRIVATE_KEY = process.env.PRIVATE_KEY
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY

module.exports = {
    defaultNetwork: "hardhat",
    networks: {
        rinkeby: {
            url: RINKEBY_RPC_URL || "",
            accounts: [PRIVATE_KEY],
            chainId: 4,
            blockConfirmations: 6,
        },
    },
    gasReporter: {
        enabled: true,
        outputFile: "gas-report.txt",
        noColors: true,
        currency: "USD",
        coinmarketcap: COINMARKETCAP_API_KEY,
        coin: "ETH",
    },
    etherscan: {
        apiKey: ETHERSCAN_API_KEY,
    },
    solidity: { compilers: [{ version: "0.8.9" }, { version: "0.6.6" }] },
    namedAccounts: {
        deployer: {
            default: 0,
            deployer: 0,
        },
        user1: {
            default: 1,
            player1: 1,
        },
    },
    mocha: {
        timeout: 200000,
    },
}
