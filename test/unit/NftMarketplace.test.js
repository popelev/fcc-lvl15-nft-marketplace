const { expect, assert } = require("chai")
const { network, deployments, ethers, getNamedAccounts, getChainId } = require("hardhat")
const { developmentChains, networkConfig } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip //("features", function () {})
    : describe("NftMarketplace. Unit", async function () {
          let nftMarketplace, nftMarketplaceUser1, basicNft
          let accounts
          let deployerAddress, user1Address
          const chainId = network.config.chainId
          const PRICE = ethers.utils.parseEther("0.1")
          const TOKEN_ID = 1

          beforeEach(async function () {
              /* deployer */
              accounts = await ethers.getSigners() // could also do with getNamedAccounts
              deployerAddress = (await getNamedAccounts()).deployer
              user1Address = (await getNamedAccounts()).user1
              await deployments.fixture(["all"])
              nftMarketplace = await ethers.getContract("NftMarketplace", deployerAddress)
              nftMarketplaceUser1 = await ethers.getContract("NftMarketplace", user1Address)
              basicNft = await ethers.getContract("BasicNft", deployerAddress)
              await basicNft.mintNft()
              basicNft.approve(nftMarketplace.address, TOKEN_ID)
          })

          xdescribe("constructor", async function () {
              it("Initialize correctly", async function () {})
          })

          describe("list item", async function () {
              it("list and emit ItemListed", async function () {
                  await expect(nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)).to.emit(
                      nftMarketplace,
                      "ItemListed"
                  )
              })

              it("can not list with zero price", async function () {
                  await expect(
                      nftMarketplace.listItem(basicNft.address, TOKEN_ID, 0)
                  ).to.be.revertedWith("NftMarketplace__PriceMustBeAboveZero")
              })

              it("can not list second time same nft", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  await expect(
                      nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  ).to.be.revertedWith("NftMarketplace__AlreadyListed")
              })

              it("not owner nft can not list it", async function () {
                  await expect(
                      nftMarketplaceUser1.listItem(basicNft.address, TOKEN_ID, PRICE)
                  ).to.be.revertedWith("NftMarketplace__NotOwner")
              })

              it("can not list nft without approve giving", async function () {
                  const basicNftWithBug = await ethers.getContract(
                      "BasicNftWithBug",
                      deployerAddress
                  )
                  await basicNftWithBug.mintNft()
                  await expect(
                      nftMarketplace.listItem(basicNftWithBug.address, TOKEN_ID, PRICE)
                  ).to.be.revertedWith("NftMarketplace__NotApprovedForMarketPlace")
              })
          })

          describe("buy item", async function () {
              it("listed and can be bought", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  await nftMarketplaceUser1.buyItem(basicNft.address, TOKEN_ID, {
                      value: PRICE,
                  })
                  const newOwner = await basicNft.ownerOf(TOKEN_ID)
                  const deployerProceeds = await nftMarketplace.getProceeds(deployerAddress)
                  assert.equal(newOwner.toString(), user1Address)
                  assert.equal(deployerProceeds.toString(), PRICE.toString())
              })

              it("buy and emit ItemBought", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  await expect(
                      nftMarketplaceUser1.buyItem(basicNft.address, TOKEN_ID, {
                          value: PRICE,
                      })
                  ).to.emit(nftMarketplace, "ItemBought")
              })

              it("nft deleted from marketplace after sell", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  let item = await nftMarketplace.getListedItem(basicNft.address, TOKEN_ID)
                  assert(item.price > 0)
                  await nftMarketplaceUser1.buyItem(basicNft.address, TOKEN_ID, {
                      value: PRICE,
                  })
                  await expect(
                      nftMarketplace.getListedItem(basicNft.address, TOKEN_ID)
                  ).to.be.revertedWith("NftMarketplace__NotListed")
              })

              it("can not be bought if not enough ETH", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  await expect(
                      nftMarketplaceUser1.buyItem(basicNft.address, TOKEN_ID, {
                          value: PRICE.add(-1),
                      })
                  ).to.be.revertedWith("NftMarketplace__PriceNotMet")
              })

              it("not listed nft can not be bought", async function () {
                  await expect(
                      nftMarketplaceUser1.buyItem(basicNft.address, TOKEN_ID, {
                          value: PRICE,
                      })
                  ).to.be.revertedWith("NftMarketplace__NotListed")
              })
          })

          describe("update item", async function () {
              it("can be updated", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  const oldItem = await nftMarketplace.getListedItem(basicNft.address, TOKEN_ID)
                  await nftMarketplace.updateItem(basicNft.address, TOKEN_ID, PRICE.add(1))
                  const newItem = await nftMarketplace.getListedItem(basicNft.address, TOKEN_ID)
                  assert.equal(oldItem.price.add(1).toString(), newItem.price.toString())
              })

              it("update and emit ItemUpdated", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  const oldItem = await nftMarketplace.getListedItem(basicNft.address, TOKEN_ID)
                  await expect(
                      nftMarketplace.updateItem(basicNft.address, TOKEN_ID, PRICE.add(1))
                  ).to.emit(nftMarketplace, "ItemUpdated")
              })

              it("can not be updated with zero price", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  await expect(
                      nftMarketplace.updateItem(basicNft.address, TOKEN_ID, 0)
                  ).to.be.revertedWith("NftMarketplace__PriceMustBeAboveZero")
              })
          })
          describe("cancel list", async function () {
              it("owner can cancel listing", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  await expect(nftMarketplace.cancelListing(basicNft.address, TOKEN_ID)).to.emit(
                      nftMarketplace,
                      "ItemCanceled"
                  )
              })

              it("not owner nft can not cancel list", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  await expect(
                      nftMarketplaceUser1.cancelListing(basicNft.address, TOKEN_ID)
                  ).to.be.revertedWith("NftMarketplace__NotOwner")
              })

              it("can not cancel list of not listed nft", async function () {
                  await expect(
                      nftMarketplace.cancelListing(basicNft.address, TOKEN_ID)
                  ).to.be.revertedWith("NftMarketplace__NotListed")
              })

              it("nft deleted from marketplace after cancel", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  let item = await nftMarketplace.getListedItem(basicNft.address, TOKEN_ID)
                  assert(item.price > 0)
                  await nftMarketplace.cancelListing(basicNft.address, TOKEN_ID)
                  await expect(
                      nftMarketplace.getListedItem(basicNft.address, TOKEN_ID)
                  ).to.be.revertedWith("NftMarketplace__NotListed")
              })
          })

          describe("withdrawProceeds", async function () {
              it("withdraw emit ProceedsWithdrawed", async function () {
                  it("withdraw and emit ProceedsWithdrawed", async function () {
                      await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                      await expect(
                          nftMarketplaceUser1.buyItem(basicNft.address, TOKEN_ID, {
                              value: PRICE,
                          })
                      ).to.emit(nftMarketplace, "ProceedsWithdrawed")
                  })
              })
              it("withdraw function transfer ethers to correct address", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  await nftMarketplaceUser1.buyItem(basicNft.address, TOKEN_ID, {
                      value: PRICE,
                  })
                  const balanceBeforeWithdraw = await accounts[0].getBalance()
                  let proceeds = await nftMarketplace.getProceeds(deployerAddress)
                  assert(proceeds > 0)
                  const tx = await nftMarketplace.withdrawProceeds(deployerAddress)
                  await tx.wait(1)
                  const balanceAfterWithdraw = await accounts[0].getBalance()
                  assert(balanceAfterWithdraw.gt(balanceBeforeWithdraw))
                  proceeds = await nftMarketplace.getProceeds(deployerAddress)
                  assert(proceeds.isZero())
              })
              it("reverted if withdraw failed", async function () {
                  const emptyContract = await ethers.getContract("EmptyContract", deployerAddress)
                  await expect(
                      nftMarketplace.withdrawProceeds(emptyContract.address)
                  ).to.be.revertedWith("NftMarketplace__TransferFailed")
              })
          })

          describe("getListedItem", async function () {
              it("getListedItem get listed item", async function () {
                  await nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  const item = await nftMarketplace.getListedItem(basicNft.address, TOKEN_ID)
                  assert(item.price > 0)
              })
              it("getListedItem can not get not listed item", async function () {
                  await expect(
                      nftMarketplace.getListedItem(basicNft.address, TOKEN_ID)
                  ).to.be.revertedWith("NftMarketplace__NotListed")
              })
          })
      })
