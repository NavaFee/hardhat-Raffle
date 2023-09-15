const { network } = require("hardhat")

module.exports = async function ({ getNameAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNameAccounts

    const reffle = await deploy("Raffle", {
        from: deployer,
        args: [],
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })
}
