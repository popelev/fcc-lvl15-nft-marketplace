// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

error NftMarketplace__PriceMustBeAboveZero();
error NftMarketplace__NotApprovedForMarketPlace();
error NftMarketplace__AlreadyListed(address nftAddress, uint256 tokenId);
error NftMarketplace__NotListed(address nftAddress, uint256 tokenId);
error NftMarketplace__NoProceeds();
error NftMarketplace__NotOwner();
error NftMarketplace__PriceNotMet(
    address nftAddress,
    uint256 tokenId,
    uint256 price
);
error NftMarketplace__TransferFailed();

contract NftMarketplace is ReentrancyGuard {
    /* STRUCTS */
    struct Listing {
        uint256 price;
        address seller;
    }

    /* VARIBLES */

    // NFT Contract address -> NFT TokenId -> Listing
    mapping(address => mapping(uint256 => Listing)) private s_listings;

    // Seller address -> Amount earned
    mapping(address => uint256) private s_proceeds;

    /* EVENTS */
    event ItemListed(
        address indexed seller,
        address indexed nftAddress,
        uint256 indexed tokenId,
        uint256 price
    );
    event ItemBought(
        address indexed buyer,
        address indexed nftAddress,
        uint256 indexed tokenId,
        uint256 price
    );
    event ItemUpdated(
        address indexed seller,
        address indexed nftAddress,
        uint256 indexed tokenId,
        uint256 newPrice
    );
    event ItemCanceled(address owner, address nftAddress, uint256 tokenId);

    /* CONSTRUCTOR */
    constructor() {}

    /* FUNCTIONS */
    function listItem(
        address nftAddress,
        uint256 tokenId,
        uint256 price
    )
        external
        PriceAboveZero(price)
        NotListed(nftAddress, tokenId)
        IsOwner(nftAddress, tokenId, msg.sender)
    {
        IERC721 nft = IERC721(nftAddress);
        if (nft.getApproved(tokenId) != address(this)) {
            revert NftMarketplace__NotApprovedForMarketPlace();
        }
        s_listings[nftAddress][tokenId] = Listing(price, msg.sender);
        emit ItemListed(msg.sender, nftAddress, tokenId, price);
    }

    function buyItem(address nftAddress, uint256 tokenId)
        external
        payable
        IsListed(nftAddress, tokenId)
    {
        Listing memory listedItem = s_listings[nftAddress][tokenId];
        if (msg.value < listedItem.price) {
            revert NftMarketplace__PriceNotMet(
                nftAddress,
                tokenId,
                listedItem.price
            );
        }
        s_proceeds[listedItem.seller] =
            s_proceeds[listedItem.seller] +
            msg.value;

        delete (s_listings[nftAddress][tokenId]);

        IERC721(nftAddress).safeTransferFrom(
            listedItem.seller,
            msg.sender,
            tokenId
        );

        emit ItemBought(listedItem.seller, msg.sender, tokenId, msg.value);
    }

    function cancelListing(address nftAddress, uint256 tokenId)
        external
        IsOwner(nftAddress, tokenId, msg.sender)
        IsListed(nftAddress, tokenId)
    {
        delete (s_listings[nftAddress][tokenId]);
        emit ItemCanceled(msg.sender, nftAddress, tokenId);
    }

    function updateItem(
        address nftAddress,
        uint256 tokenId,
        uint256 newPrice
    )
        external
        PriceAboveZero(newPrice)
        IsListed(nftAddress, tokenId)
        IsOwner(nftAddress, tokenId, msg.sender)
    {
        s_listings[nftAddress][tokenId].price = newPrice;
        emit ItemUpdated(msg.sender, nftAddress, tokenId, newPrice);
    }

    function withdrawProceeds() external ProceedsAboveZero(msg.sender) {
        uint256 proceeds = s_proceeds[msg.sender];
        s_proceeds[msg.sender] = 0;
        (bool success, ) = payable(msg.sender).call{value: proceeds}("");
        if (!success) {
            revert NftMarketplace__TransferFailed();
        }
    }

    /* MODIFIERS */

    modifier PriceAboveZero(uint256 price) {
        if (price == 0) {
            revert NftMarketplace__PriceMustBeAboveZero();
        }
        _;
    }
    modifier ProceedsAboveZero(address owner) {
        uint256 proceeds = s_proceeds[msg.sender];
        if (proceeds == 0) {
            revert NftMarketplace__NoProceeds();
        }
        _;
    }
    modifier IsListed(address nftAddress, uint256 tokenId) {
        Listing memory listing = s_listings[nftAddress][tokenId];
        if (listing.price == 0) {
            revert NftMarketplace__NotListed(nftAddress, tokenId);
        }
        _;
    }

    modifier NotListed(address nftAddress, uint256 tokenId) {
        Listing memory listing = s_listings[nftAddress][tokenId];
        if (listing.price > 0) {
            revert NftMarketplace__AlreadyListed(nftAddress, tokenId);
        }
        _;
    }

    modifier IsOwner(
        address nftAddress,
        uint256 tokenId,
        address spender
    ) {
        IERC721 nft = IERC721(nftAddress);
        address owner = nft.ownerOf(tokenId);
        if (spender != owner) {
            revert NftMarketplace__NotOwner();
        }
        _;
    }

    /* GETTERS */

    function listItem(address nftAddress, uint256 tokenId)
        external
        view
        returns (Listing memory)
    {
        return s_listings[nftAddress][tokenId];
    }

    function getProceeds(address seller) external view returns (uint256) {
        return s_proceeds[seller];
    }
}
