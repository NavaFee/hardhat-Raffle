const { network, ethers } = require("hardhat")
const { deployments, getNamedAccounts } = require("hardhat")
const {
    developmentChains,
    networkConfig,
} = require("../../helper-hardhat-config")
const { assert, expect } = require("chai")
const { getBytes, isBytesLike } = require("ethers")
developmentChains.includes(network.name)
    ? describe.skip
    : describe("Raffle Unit Tests", async function () {
          let raffle, vrfCoordinatorV2Mock, raffleEntranceFee, deployer

          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              raffle = await ethers.getContract("Raffle", deployer)
              raffleEntranceFee = await raffle.getEntranceFee()
          })

          describe("fulfillRandomWords", function () {
              it("works with live Chainlink Keepers and Chainlink VRF, we get a random winner", async function () {
                  // enter the raffle
                  console.log("Setting up test...")
                  const startingTimeStamp = await raffle.getLastTimeStamp()
                  const accounts = await ethers.getSigners()

                  console.log("Setting up Listener...")
                  await new Promise(async (resolve, reject) => {
                      //set up listener before we enter the raffle
                      // just in case the blockchain moves Really fast
                      raffle.once("WinnerPicked", async () => {
                          console.log("WinnerPicked event fired!")
                          try {
                              // add our assert here
                              const recentWinner =
                                  await raffle.getRecentWinner()
                              const raffleState = await raffle.getRaffleState()
                              const winnerEndingBalance =
                                  await raffle.runner.provider.getBalance(
                                      accounts[0]
                                  )
                              const endingTimeStamp =
                                  await raffle.getLastTimeStamp()
                              await expect(raffle.getPlayer(0)).to.be.reverted
                              assert.equal(
                                  recentWinner.toString(),
                                  accounts[0].address
                              )
                              assert.equal(raffleState, 0)
                              assert.equal(
                                  winnerEndingBalance.toString(),
                                  (
                                      winnerStartingBalance + raffleEntranceFee
                                  ).toString()
                              )
                              assert(endingTimeStamp > startingTimeStamp)
                              resolve()
                          } catch (e) {
                              console.log(e)
                              reject(e)
                          }
                      })
                      // Then entering the raffle
                      console.log("Entering the Raffle")
                      const tx = await raffle.enterRaffle({
                          value: raffleEntranceFee,
                      })
                      await tx.wait(1)
                      console.log("OK, time to wait...")
                      const winnerStartingBalance =
                          await raffle.runner.provider.getBalance(accounts[0])

                      // and this code Won't completes until our listener has finished listening!
                  })
              })
          })
      })
