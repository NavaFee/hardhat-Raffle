# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a script that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat run scripts/deploy.js
```

1. Get our SubId for Chainlink VRF
2. Deploy our contract using the SubId
3. Register the contract with Chainlink VRF & it's SubId
4. Register the contract with chainlink Keepers
5. Run staging tests
