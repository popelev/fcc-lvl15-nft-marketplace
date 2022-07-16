/* Imports */
const { ethers } = require("hardhat")

const VRF_COORDINATOR_RINKEBY = process.env.VRF_COORDINATOR_RINKEBY
const VRF_COORDINATOR_TOKEN_RINKEBY = process.env.VRF_COORDINATOR_TOKEN_RINKEBY
const VRF_GAS_LANE_RINKEBY = process.env.VRF_GAS_LANE_RINKEBY

const networkConfig = {
    4: {
        name: "rinkeby",
        vrfCoordinatorV2: VRF_COORDINATOR_RINKEBY,
        entranceFee: ethers.utils.parseEther("0.01"),
        gasLane: VRF_GAS_LANE_RINKEBY,
        subscriptionId: "7410",
        callbackGasLimit: "500000",
        mintFee: "10000000000000000",
        ethUsdPriceFeed: "0x8A753747A1Fa494EC906cE90E9f37563A8AF630e",
    },
    31337: {
        name: "hardhat",
        subscriptionId: "7410",
        entranceFee: ethers.utils.parseEther("0.01"),
        gasLane: VRF_GAS_LANE_RINKEBY,
        callbackGasLimit: "500000",
        mintFee: "10000000000000000",
    },
}

const developmentChains = ["hardhat", "localhost"]

module.exports = {
    networkConfig,
    developmentChains,
}
