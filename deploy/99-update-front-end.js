const { ethers, network } = require("hardhat")
const fs = require("fs")
const { json } = require("hardhat/internal/core/params/argumentTypes")

const FRONT_END_ADDRESS_FILE =
    "../nextjs-smartcontract-lottery/constants/contractAddress.json"
const FRONT_END_ABI_FILE = "../nextjs-smartcontract-lottery/constants/abi.json"
module.exports = async function () {
    if (process.env.UPDATE_FRONT_END) {
        console.log("Updating front end...")
        updateContractAddress()
        updateAbi()
    }
}

async function updateAbi() {
    const raffle = ethers.getContract("Raffle")
    fs.writeFileSync(FRONT_END_ABI_FILE, (await raffle).interface.formatJson())
}

async function updateContractAddress() {
    const raffle = ethers.getContract("Raffle")
    console.log("raffle.address==========", (await raffle).address) // undefined
    console.log("raffle.target==========", (await raffle).target)

    const chainId = network.config.chainId.toString()
    const currentAddress = JSON.parse(
        fs.readFileSync(FRONT_END_ADDRESS_FILE, "utf8")
    )
    if (chainId in currentAddress) {
        if (!currentAddress[chainId].includes((await raffle).target)) {
            currentAddress[chainId].push((await raffle).target)
        }
    }
    {
        currentAddress[chainId] = [(await raffle).target]
    }
    fs.writeFileSync(FRONT_END_ADDRESS_FILE, JSON.stringify(currentAddress))
}

module.exports.tags = ["all", "frontend"]
