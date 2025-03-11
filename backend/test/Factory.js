const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Factory", function () {
  let Factory;
  let factory;
  let owner;
  let addr1;
  let addr2;
  let addrs;

  const sampleURI = "ipfs://QmSampleMetadataHash";
  const mintPrice = ethers.parseEther("0.01");

  beforeEach(async function () {
    // Get signers
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    // Deploy the contract
    Factory = await ethers.getContractFactory("Factory");
    factory = await Factory.deploy();
    await factory.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await factory.owner()).to.equal(owner.address);
    });

    it("Should set the correct name and symbol", async function () {
      expect(await factory.name()).to.equal("Factory");
      expect(await factory.symbol()).to.equal("FACT");
    });

    it("Should set the initial mint price", async function () {
      expect(await factory.mintPrice()).to.equal(mintPrice);
    });

    it("Should set the initial max supply", async function () {
      expect(await factory.maxSupply()).to.equal(10000);
    });

    it("Should start with token count at 0", async function () {
      expect(await factory.getTokenCount()).to.equal(0);
    });
  });

  describe("Minting NFTs", function () {
    it("Should mint a new NFT and assign it to the sender", async function () {
      // Mint an NFT
      await factory.connect(addr1).mintNFT(sampleURI, { value: mintPrice });

      // Check ownership
      expect(await factory.ownerOf(1)).to.equal(addr1.address);

      // Check token count increased
      expect(await factory.getTokenCount()).to.equal(1);
    });

    it("Should set the correct tokenURI", async function () {
      // Mint an NFT
      await factory.connect(addr1).mintNFT(sampleURI, { value: mintPrice });

      // Check token URI
      const [_, uri] = await factory.getNFTDetails(1);
      expect(uri).to.equal(sampleURI);
    });

    it("Should emit NFTMinted event", async function () {
      // Check event emission
      await expect(
        factory.connect(addr1).mintNFT(sampleURI, { value: mintPrice })
      )
        .to.emit(factory, "NFTMinted")
        .withArgs(addr1.address, 1, sampleURI);
    });

    it("Should reject minting with insufficient payment", async function () {
      const insufficientPrice = ethers.parseEther("0.005");

      // Attempt to mint with insufficient funds
      await expect(
        factory.connect(addr1).mintNFT(sampleURI, { value: insufficientPrice })
      ).to.be.revertedWith("Insufficient payment");
    });

    it("Should reject minting when max supply is reached", async function () {
      // Set max supply to 1
      await factory.setMaxSupply(1);

      // Mint first NFT
      await factory.connect(addr1).mintNFT(sampleURI, { value: mintPrice });

      // Try to mint second NFT and expect failure
      await expect(
        factory.connect(addr2).mintNFT(sampleURI, { value: mintPrice })
      ).to.be.revertedWith("Max supply reached");
    });
  });

  describe("NFT Details Retrieval", function () {
    beforeEach(async function () {
      // Mint an NFT for testing
      await factory.connect(addr1).mintNFT(sampleURI, { value: mintPrice });
    });

    it("Should correctly return NFT details", async function () {
      const [owner, uri] = await factory.getNFTDetails(1);

      expect(owner).to.equal(addr1.address);
      expect(uri).to.equal(sampleURI);
    });

    it("Should reject retrieval for non-existent token", async function () {
      await expect(factory.getNFTDetails(999)).to.be.revertedWith(
        "NFT does not exist"
      );
    });
  });

  describe("Owner Functions", function () {
    it("Should allow owner to update mint price", async function () {
      const newPrice = ethers.parseEther("0.02");

      await factory.setMintPrice(newPrice);
      expect(await factory.mintPrice()).to.equal(newPrice);
    });

    it("Should reject mint price update from non-owner", async function () {
      const newPrice = ethers.parseEther("0.02");

      await expect(factory.connect(addr1).setMintPrice(newPrice))
        .to.be.revertedWithCustomError(factory, "OwnableUnauthorizedAccount")
        .withArgs(addr1.address);
    });

    it("Should allow owner to update max supply", async function () {
      const newMaxSupply = 5000;

      await factory.setMaxSupply(newMaxSupply);
      expect(await factory.maxSupply()).to.equal(newMaxSupply);
    });

    it("Should reject max supply update to less than current token count", async function () {
      // Mint an NFT
      await factory.connect(addr1).mintNFT(sampleURI, { value: mintPrice });

      // Try to set max supply to 0
      await expect(factory.setMaxSupply(0)).to.be.revertedWith(
        "New max supply cannot be less than current supply"
      );
    });

    it("Should reject max supply update from non-owner", async function () {
      await expect(factory.connect(addr1).setMaxSupply(5000))
        .to.be.revertedWithCustomError(factory, "OwnableUnauthorizedAccount")
        .withArgs(addr1.address);
    });

    it("Should allow owner to withdraw funds", async function () {
      // Mint an NFT to add funds to contract
      await factory.connect(addr1).mintNFT(sampleURI, { value: mintPrice });

      // Check balance before withdrawal
      let initialBalance = await ethers.provider.getBalance(owner.address);

      // Withdraw funds
      const tx = await factory.withdraw();
      const receipt = await tx.wait();
      // console.log(receipt);
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      // Check balance after withdrawal
      const finalBalance = await ethers.provider.getBalance(owner.address);

      initialBalance += mintPrice;
      initialBalance -= gasUsed;

      // Owner should receive the mint price minus gas fees
      expect(finalBalance).to.equal(initialBalance);
    });

    it("Should reject withdrawal when contract has no balance", async function () {
      await expect(factory.withdraw()).to.be.revertedWith(
        "No balance to withdraw"
      );
    });

    it("Should reject withdrawal from non-owner", async function () {
      // Mint an NFT to add funds to contract
      await factory.connect(addr1).mintNFT(sampleURI, { value: mintPrice });

      await expect(factory.connect(addr1).withdraw())
        .to.be.revertedWithCustomError(factory, "OwnableUnauthorizedAccount")
        .withArgs(addr1.address);
    });
  });

  describe("Transfers and Approvals", function () {
    beforeEach(async function () {
      // Mint an NFT for testing
      await factory.connect(addr1).mintNFT(sampleURI, { value: mintPrice });
    });

    it("Should allow owner to transfer NFT", async function () {
      await factory
        .connect(addr1)
        .transferFrom(addr1.address, addr2.address, 1);

      expect(await factory.ownerOf(1)).to.equal(addr2.address);
    });

    it("Should allow approved address to transfer NFT", async function () {
      // Approve addr2 to manage addr1's NFT
      await factory.connect(addr1).approve(addr2.address, 1);

      // Transfer from addr1 to owner using addr2
      await factory
        .connect(addr2)
        .transferFrom(addr1.address, owner.address, 1);

      expect(await factory.ownerOf(1)).to.equal(owner.address);
    });

    it("Should clear approval after transfer", async function () {
      // Approve addr2 to manage addr1's NFT
      await factory.connect(addr1).approve(addr2.address, 1);

      // Transfer from addr1 to owner
      await factory
        .connect(addr1)
        .transferFrom(addr1.address, owner.address, 1);

      // Check approval was cleared
      expect(await factory.getApproved(1)).to.equal(ethers.ZeroAddress);
    });
  });

  describe("Token Count", function () {
    it("Should correctly track token count when minting", async function () {
      expect(await factory.getTokenCount()).to.equal(0);

      // Mint first NFT
      await factory.connect(addr1).mintNFT(sampleURI, { value: mintPrice });
      expect(await factory.getTokenCount()).to.equal(1);

      // Mint second NFT
      await factory.connect(addr2).mintNFT(sampleURI, { value: mintPrice });
      expect(await factory.getTokenCount()).to.equal(2);
    });
  });
});
