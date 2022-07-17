/* Imports */
const { network, ethers } = require("hardhat")
const { networkConfig, developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    const deployArgs = []
    log(" " + deployArgs)
    /* Deply contract */
    log("Deploy NftMarketplace contract")
    const nftMarketplace = await deploy("NftMarketplace", {
        from: deployer,
        args: deployArgs,
        log: true,
        waitConformations: network.config.blockConfirmations || 1,
    })

    /* Verify contract */
    log("Contract deployed!")

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        await verify(nftMarketplace.address, deployArgs)
    }
    log("----------------------------------------------------------")
}

module.exports.tags = ["all", "nftMarketplace", "main"]
