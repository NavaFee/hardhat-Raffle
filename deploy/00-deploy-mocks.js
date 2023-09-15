const { network, ethers } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")

const BASE_FEE = ethers.parseEther("0.25") // 0.25 Link is the premium. It costs 0.25 link per request
const GAS_PRICE_LINK = 1e9 // link per gas // calculated value based on the gas price of the chain.

// ETH price ascent
// Chainlink Nodes pay the gas fees to give us randomness & do external execution
// So the  Price of requests change based on the price of gas

module.exports = async function ({ deployments, getNamedAccounts }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId
    const args = [BASE_FEE, GAS_PRICE_LINK]

    if (developmentChains.includes(network.name)) {
        log("Local network detected! Deploying mocks...")
        // deploy a mock vrfcoordinator...
        await deploy("VRFCoordinatorV2Mock", {
            from: deployer,
            log: true,
            args: args,
        })
        log("Mocks Deployed!")
        log("---------------------------------------")
    }
}
module.exports.tags = ["all", "mocks"]
