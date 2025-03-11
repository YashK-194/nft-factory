// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Factory
 * @dev A contract for minting NFTs with user-uploaded images and descriptions
 */
contract Factory is ERC721URIStorage, Ownable {
    // Simple counter for token IDs
    uint256 private tokenIdCounter;

    // Mint price in wei (0.01 ETH)
    uint256 public mintPrice = 0.01 ether;

    // Maximum supply of NFTs
    uint256 public maxSupply = 10000;

    // Event emitted when an NFT is minted
    event NFTMinted(address owner, uint256 tokenId, string tokenURI);

    /**
     * @dev Constructor initializes the NFT collection name and symbol
     */
    constructor() ERC721("Factory", "FACT") Ownable(msg.sender) {}

    /**
     * @dev Mint a new NFT with the provided token URI
     * @param tokenURI The URI containing the metadata (image URL and description)
     * @return The ID of the newly minted token
     */
    function mintNFT(string memory tokenURI) public payable returns (uint256) {
        require(tokenIdCounter < maxSupply, "Max supply reached");
        require(msg.value >= mintPrice, "Insufficient payment");

        // Increment token ID
        tokenIdCounter++;
        uint256 newTokenId = tokenIdCounter;

        // Mint the NFT to the sender (using safeMint for security)
        _safeMint(msg.sender, newTokenId);

        // Set the token URI (contains the image URL and description)
        _setTokenURI(newTokenId, tokenURI);

        // Emit the minting event
        emit NFTMinted(msg.sender, newTokenId, tokenURI);

        return newTokenId;
    }

    /**
     * @dev Get details of an NFT by its token ID
     * @param tokenId The ID of the token to query
     * @return owner The address of the NFT owner
     * @return tokenURI The URI containing metadata for the NFT
     */
    function getNFTDetails(
        uint256 tokenId
    ) public view returns (address owner, string memory tokenURI) {
        require(_exists(tokenId), "NFT does not exist");

        owner = ownerOf(tokenId);
        tokenURI = super.tokenURI(tokenId);

        return (owner, tokenURI);
    }

    /**
     * @dev Check if a token exists
     * @param tokenId The ID of the token to check
     * @return Whether the token exists
     */
    function _exists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    /**
     * @dev Update the mint price (only owner)
     * @param newPrice The new mint price in wei
     */
    function setMintPrice(uint256 newPrice) public onlyOwner {
        mintPrice = newPrice;
    }

    /**
     * @dev Update the max supply (only owner)
     * @param newMaxSupply The new maximum supply
     */
    function setMaxSupply(uint256 newMaxSupply) public onlyOwner {
        require(
            newMaxSupply >= tokenIdCounter,
            "New max supply cannot be less than current supply"
        );
        maxSupply = newMaxSupply;
    }

    /**
     * @dev Withdraw contract balance to owner
     */
    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");

        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }

    /**
     * @dev Get the current token count
     * @return The current token count
     */
    function getTokenCount() public view returns (uint256) {
        return tokenIdCounter;
    }
}
