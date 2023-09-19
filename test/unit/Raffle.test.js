const { network, ethers } = require("hardhat")
const { deployments, getNamedAccounts } = require("hardhat")
const {
    developmentChains,
    networkConfig,
} = require("../../helper-hardhat-config")
const { assert, expect } = require("chai")
!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Raffle Unit Tests", async function () {
          let raffle,
              vrfCoordinatorV2Mock,
              raffleEntranceFee,
              deployer,
              interval
          const chainId = network.config.chainId
          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["all"])
              raffle = await ethers.getContract("Raffle", deployer)
              vrfCoordinatorV2Mock = await ethers.getContract(
                  "VRFCoordinatorV2Mock",
                  deployer
              )
              raffleEntranceFee = await raffle.getEntranceFee()
              interval = await raffle.getInterval()
          })

          describe("constructor", async function () {
              it("initializes the raffle correctly!", async function () {
                  // Ideally we make our tests have just 1 assert per "it"
                  const raffleState = await raffle.getRaffleState()

                  console.log(raffleState, "raffleState")
                  assert.equal(raffleState.toString(), "0")
                  assert.equal(
                      interval.toString(),
                      networkConfig[chainId]["interval"]
                  )
              })
          })
          describe("enterRaffle", async function () {
              it("reverts when you don't pay enough", async function () {
                  await expect(
                      raffle.enterRaffle()
                  ).to.be.revertedWithCustomError(
                      raffle,
                      "Raffle__NotEnoughETHEntered"
                  )
              })
              it("records players when they enter", async function () {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  const playerFromContract = await raffle.getPlayer(0)
                  assert.equal(playerFromContract, deployer)
              })
              it("emits event on enter", async function () {
                  await expect(
                      raffle.enterRaffle({ value: raffleEntranceFee })
                  ).to.emit(raffle, "RaffleEnter")
              })
              it("doesn't allow entrance when raffle is calculation", async function () {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [
                      Number(interval) + 1,
                  ])
                  await network.provider.send("evm_mine", [])
                  // We pretend to be a Chainlink Keeper

                  await raffle.performUpkeep("0x")
                  await expect(
                      raffle.enterRaffle({ value: raffleEntranceFee })
                  ).to.be.revertedWithCustomError(raffle, "Raffle__NotOPEN")
              })
          })
          describe("checkUpkeep", async function () {
              it("returns false if people haven't send any ETH", async function () {
                  await network.provider.send("evm_increaseTime", [
                      Number(interval) + 1,
                  ])
                  await network.provider.send("evm_mine", [])
                  const { upkeepNeeded } = await raffle.checkUpkeep("0x")
                  assert(!upkeepNeeded)
              })
              it("returns false if raffle isn't open", async function () {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [
                      Number(interval) + 1,
                  ])
                  await network.provider.send("evm_mine", [])
                  await raffle.performUpkeep("0x")
                  const raffleState = await raffle.getRaffleState()
                  const { upkeepNeeded } = await raffle.checkUpkeep.staticCall(
                      "0x"
                  )
                  assert.equal(upkeepNeeded, false)
                  assert.equal(raffleState.toString(), "1")
              })
              it("returns false if enough time has't passed", async () => {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [
                      Number(interval) - 5,
                  ]) // use a higher number here if this test fails
                  await network.provider.request({
                      method: "evm_mine",
                      params: [],
                  })
                  const { upkeepNeeded } = await raffle.checkUpkeep.staticCall(
                      "0x"
                  ) // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
                  assert(!upkeepNeeded)
              })
              it("returns true if enough time has passed, has players, eth, and is open", async () => {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [
                      Number(interval) + 1,
                  ])
                  await network.provider.request({
                      method: "evm_mine",
                      params: [],
                  })
                  const { upkeepNeeded } = await raffle.checkUpkeep.staticCall(
                      "0x"
                  ) // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
                  assert(upkeepNeeded)
              })
          })
          describe("performUpkeep", function () {
              it("it can only run if checkupkeep is true", async function () {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [
                      Number(interval) + 1,
                  ])
                  await network.provider.request({
                      method: "evm_mine",
                      params: [],
                  })
                  const tx = await raffle.performUpkeep("0x")
                  assert(tx)
              })
              it("reverts when checkupkeep is false", async () => {
                  await expect(
                      raffle.performUpkeep("0x")
                  ).to.be.revertedWithCustomError(
                      raffle,
                      "Raffle__UPKeepNotNeeded"
                  )
              })
              it("updates the raffle state and emits a event, and calls the vrf coordinator", async () => {
                  // Too many asserts in this test!
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [
                      Number(interval) + 1,
                  ])
                  await network.provider.request({
                      method: "evm_mine",
                      params: [],
                  })
                  const txResponse = await raffle.performUpkeep("0x") // emits requestId
                  const txReceipt = await txResponse.wait(1) // waits 1 block
                  const raffleState = await raffle.getRaffleState() // updates state
                  const requestId = txReceipt.logs[1].args[0]
                  assert(Number(requestId) > 0)
                  assert(raffleState == 1) // 0 = open, 1 = calculating
              })
          })
          describe("fulfillRandonWords", function () {
              beforeEach(async () => {
                  await raffle.enterRaffle({ value: raffleEntranceFee })
                  await network.provider.send("evm_increaseTime", [
                      Number(interval) + 1,
                  ])
                  await network.provider.request({
                      method: "evm_mine",
                      params: [],
                  })
              })
              it("can only be called after performupkeep", async () => {
                  await expect(
                      vrfCoordinatorV2Mock.fulfillRandomWords(0, raffle.target) // reverts if not fulfilled
                  ).to.be.revertedWith("nonexistent request")
                  await expect(
                      vrfCoordinatorV2Mock.fulfillRandomWords(1, raffle.target) // reverts if not fulfilled
                  ).to.be.revertedWith("nonexistent request")
              })
              // Way to big
              it("picks a winner, resets the lottery, and sends money", async function () {
                  const additionalEntrances = 3 // to test
                  const startingAccountIndex = 1 // deployer = 0
                  let startingBalance
                  const accounts = await ethers.getSigners()
                  for (
                      let i = startingAccountIndex;
                      i < startingAccountIndex + additionalEntrances;
                      i++
                  ) {
                      const accountConnectedRaffle = raffle.connect(accounts[i]) // Returns a new instance of the Raffle contract connected to player
                      await accountConnectedRaffle.enterRaffle({
                          value: raffleEntranceFee,
                      })
                  }
                  const satrtingTimeStamp = await raffle.getLastTimeStamp() // stores starting timestamp (before we fire our event)

                  // performUpkeep (mock being Chainlink Keepers)
                  // fulfillRandomWords (mock being the Chainlink VRF)
                  // We will have to wait for the fulfillRandomWords to be called
                  // This will be more important for our staging tests ...
                  await new Promise(async (resolve, reject) => {
                      raffle.once("WinnerPicked", async () => {
                          console.log("WinnerPicked event fired!")
                          // assert throws an error if it fails , so we need to wrap
                          // it in a try/catch so that the promise returns event
                          // if it fails.
                          console.log("Found the event!")
                          try {
                              // Now lets get the ending values ...
                              const recentWinner =
                                  await raffle.getRecentWinner()
                              console.log(recentWinner)
                              const raffleState = await raffle.getRaffleState()
                              const endingTimeStamp =
                                  await raffle.getLastTimeStamp()
                              const numPlayers =
                                  await raffle.getNumberOfPlayers()
                              const endingBalance =
                                  await raffle.runner.provider.getBalance(
                                      accounts[1]
                                  )
                              assert.equal(numPlayers.toString(), "0")
                              assert.equal(raffleState.toString(), "0")
                              assert(endingTimeStamp > satrtingTimeStamp)
                              assert.equal(
                                  endingBalance.toString(),
                                  (
                                      startingBalance +
                                      raffleEntranceFee *
                                          BigInt(additionalEntrances) +
                                      raffleEntranceFee
                                  ).toString()
                              )
                              resolve()
                          } catch (e) {
                              reject(e) // if try fails , rejects the promise
                          }
                      })
                      // Kicking off the event by mocking the chainlink keepers and vrf coordinator
                      try {
                          const tx = await raffle.performUpkeep("0x")
                          const txReceipt = await tx.wait(1)

                          startingBalance =
                              await raffle.runner.provider.getBalance(
                                  accounts[1]
                              )
                          await vrfCoordinatorV2Mock.fulfillRandomWords(
                              txReceipt.logs[1].args[0],
                              raffle.target
                          )
                      } catch (e) {
                          reject(e)
                      }
                  })
              })
          })
      })
