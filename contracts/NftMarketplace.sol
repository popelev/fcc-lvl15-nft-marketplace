// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

error NftMarketplace__PriceMustBeAboveZero();
error NftMarketplace__NotApprovedForMarketPlace();

contract NftMarketplace {
    /* Varibles */

    /* Events */

    /* CONSTRUCTOR */
    constructor() {}

    /* FUNCTIONS */
    function listItem(
        address nftAddress,
        uint56 tokenId,
        uint256 price
    ) external PriceAboveZero(price) {
        IERC721 nft = IERC721(nftAddress);
        if (nft.getApproved(tokenId) != address(this)) {
            revert NftMarketplace__NotApprovedForMarketPlace();
        }
    }

    /* MODIFIERS */
    modifier PriceAboveZero(uint256 price) {
        if (price <= 0) {
            revert NftMarketplace__PriceMustBeAboveZero();
        }
        _;
    }
}
