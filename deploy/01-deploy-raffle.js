const { network, ethers } = require("hardhat")
const { networkConfig } = require("../helper-hardhat-config")

module.exports = async function ({ getNameAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNameAccounts()
    const chainId = network.config.chainId
    let vrfCoodinatorV2Address

    if (developmentChains.includes(network.name)) {
        const vrfCoordinatorV2Mock = await ethers.getContract(
            "VRFCoordinatorV2Mock",
        )
        vrfCoodinatorV2Address = vrfCoordinatorV2Mock.address
    } else {
        vrfCoodinatorV2Address = networkConfig[chainId]["vrfCoordinatorV2"]
    }
    const entranceFee = networkConfig[chainId]["entranceFee"]
    const gasLane = networkConfig[chainId]["gasLane"]

    const args = [vrfCoodinatorV2Address, entranceFee]
    const reffle = await deploy("Raffle", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })
}
