require("@nomiclabs/hardhat-waffle")
require("@nomiclabs/hardhat-etherscan")
require("hardhat-deploy")
require("solidity-coverage")
require("hardhat-gas-reporter")
require("hardhat-contract-sizer")
require("dotenv").config()

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL
const SEPOLIA_PRIVATE_KEY = process.env.SEPOLIA_PRIVATE_KEY
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    defaultNetwork: "hardhat",
    networks: {
        sepolia: {
            url: SEPOLIA_RPC_URL,
            accounts: [SEPOLIA_PRIVATE_KEY],
            chainId: 11155111,
            blockConfirmations: 6,
        },
        localhost: {
            url: "http://127.0.0.1:8545/",
            // hardhat provide accounts
            chainId: 31337,
        },
    },
    solidity: "0.8.19",
    nameAccounts: {
        deployer: {
            default: 0,
        },
        palyer: {
            default: 1,
        },
    },
    gasReporter: {
        enabled: false,
        //outputFile: "gas-report.txt",
        //gasPrice: 21,
        noColors: true,
        currency: "CNY",
        //   coinmarketcap: COINMARKETCAP_API_KEY,
        //token: "ETH",
    },
    etherscan: {
        apiKey: ETHERSCAN_API_KEY,
        timeout: 600000,
    },
}
