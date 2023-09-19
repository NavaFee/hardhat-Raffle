const { ethers } = require("hardhat")
async function enterRaffle() {
    const raffle = await ethers.getContract("Raffle")
    const entranceFee = await raffle.getEntranceFee()
    const tx = await raffle.enterRaffle({ value: entranceFee })
    await tx.wait(1)
    console.log(tx.hash)
    console.log("Entered!")
}
