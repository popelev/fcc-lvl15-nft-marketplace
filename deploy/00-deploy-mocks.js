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
    log("Deploy BasicNft contract")
    const basicNft = await deploy("BasicNft", {
        from: deployer,
        args: deployArgs,
        log: true,
        waitConformations: network.config.blockConfirmations || 1,
    })
    log("Contract deployed!")
    log("----------------------------------------------------------")
    log("Deploy BasicNftWithBug contract")
    const basicNftWithBug = await deploy("BasicNftWithBug", {
        from: deployer,
        args: deployArgs,
        log: true,
        waitConformations: network.config.blockConfirmations || 1,
    })

    /* Verify contract */
    log("Contract deployed!")
    log("----------------------------------------------------------")
    log("Deploy EmptyContract contract")
    await deploy("EmptyContract", {
        contract: "EmptyContract",
        from: deployer,
        log: true,
        args: "",
    })
    log("Contract deployed!")
    log("----------------------------------------------------------")
}

module.exports.tags = ["all", "basicNft", "BasicNftWithBug"]
