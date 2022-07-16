const pinataSDK = require("@pinata/sdk")
const path = require("path")
const fs = require("fs")
require("dotenv").config()

const PINATA_API_KEY = process.env.PINATA_API_KEY
const PINATA_API_SECRET = process.env.PINATA_API_SECRET

const pinata = pinataSDK(PINATA_API_KEY, PINATA_API_SECRET)

async function storeImages(imagesFilePath) {
    try {
        const fullImagesPath = path.resolve(imagesFilePath)
        const files = fs.readdirSync(fullImagesPath)
        let responses = []
        console.log("Uploading to IPFS")
        for (fileIndex in files) {
            console.log("Uploading " + fileIndex)
            let str = fullImagesPath + "/" + files[fileIndex]
            const readableStreamForFile = fs.createReadStream(str)
            const response = await pinata.pinFileToIPFS(readableStreamForFile)
            responses.push(response)
        }
        return { responses, files }
    } catch (e) {
        console.log(e)
    }
}

async function storeTokenUriMetadata(metadata) {
    try {
        const response = await pinata.pinJSONToIPFS(metadata)
        return response
    } catch (e) {
        console.log(e)
    }
    return null
}

module.exports = { storeImages, storeTokenUriMetadata }
