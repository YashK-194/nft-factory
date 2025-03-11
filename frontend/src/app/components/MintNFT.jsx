import { useState, useEffect, useRef } from "react";
import { ethers } from "ethers";
import axios from "axios";

export default function MintNFT({ contract, account }) {
  const [isOpen, setIsOpen] = useState(false);
  const [price, setPrice] = useState(null);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [nftDescription, setNftDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [tokenId, setTokenId] = useState(null);
  const [tokenName, setTokenName] = useState("");

  const fileInputRef = useRef(null);

  const NEXT_PUBLIC_PINATA_API_KEY = process.env.NEXT_PUBLIC_PINATA_API_KEY;
  const NEXT_PUBLIC_PINATA_API_SECRET =
    process.env.NEXT_PUBLIC_PINATA_API_SECRET;

  // Get current mint price when component mounts
  useEffect(() => {
    const fetchMintPrice = async () => {
      try {
        if (contract) {
          const mintPrice = await contract.mintPrice();
          setPrice(ethers.formatEther(mintPrice));
        }
      } catch (error) {
        console.error("Error fetching mint price:", error);
      }
    };
    // console.log(price)

    fetchMintPrice();
  }, [contract]);

  // Handle image file selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB.");
      return;
    }

    setImage(file);

    // Create a preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Trigger file input click
  const handleImageUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleMint = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!image || !nftDescription) {
      alert("Please select an image and enter a description");
      setIsLoading(false);
      return;
    }

    try {
      // Upload image to IPFS via Pinata
      const fileData = new FormData();
      fileData.append("file", image); // The key should be "file" for Pinata

      // Add metadata about the file
      const metadata = JSON.stringify({
        name: `NFT Image`,
        keyvalues: {
          description: nftDescription,
        },
      });
      fileData.append("pinataMetadata", metadata);

      // Make the upload request to Pinata
      const imageUploadResponse = await axios({
        method: "post",
        url: "https://api.pinata.cloud/pinning/pinFileToIPFS",
        data: fileData,
        headers: {
          pinata_api_key: NEXT_PUBLIC_PINATA_API_KEY,
          pinata_secret_api_key: NEXT_PUBLIC_PINATA_API_SECRET,
          "Content-Type": "multipart/form-data",
        },
      });

      // Get the IPFS hash from the response
      const imageUrl =
        "https://gateway.pinata.cloud/ipfs/" +
        imageUploadResponse.data.IpfsHash;

      // Create NFT metadata
      const nftMetadata = {
        name: tokenName, // Updated to use user input
        description: nftDescription,
        image: imageUrl,
        attributes: [],
      };

      // Upload metadata to IPFS
      const metadataResponse = await axios({
        method: "post",
        url: "https://api.pinata.cloud/pinning/pinJSONToIPFS",
        data: nftMetadata,
        headers: {
          pinata_api_key: NEXT_PUBLIC_PINATA_API_KEY,
          pinata_secret_api_key: NEXT_PUBLIC_PINATA_API_SECRET,
          "Content-Type": "application/json",
        },
      });

      // Get the metadata URI
      const tokenURI =
        "https://gateway.pinata.cloud/ipfs/" + metadataResponse.data.IpfsHash;

      // Convert ETH to wei for transaction
      const value = ethers.parseEther(price.toString());
      console.log(value);

      // Call the mintNFT function with payment
      const tx = await contract.mintNFT(tokenURI, { value });

      // Set transaction hash
      setTxHash(tx.hash);

      // Wait for transaction to be mined
      const receipt = await tx.wait();

      // ✅ Correctly extract event logs in Ethers v6
      let mintedTokenId = null;
      for (const log of receipt.logs) {
        try {
          const parsedLog = contract.interface.parseLog(log);
          if (parsedLog.name === "NFTMinted") {
            mintedTokenId = parsedLog.args.tokenId.toString();
            break;
          }
        } catch (error) {
          continue; // Some logs may not match the contract ABI
        }
      }

      if (mintedTokenId) {
        setTokenId(mintedTokenId);
      }

      // Clear form
      setImage(null);
      setImagePreview(null);
      setNftDescription("");
      setTokenName("");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error minting NFT:", error);
      alert("Error minting NFT: " + (error.message || "Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };

  // console.log(PINATA_API_KEY)

  return (
    <>
      <button
        className="w-64 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition"
        onClick={() => setIsOpen(true)}
      >
        Mint NFT
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-lg flex justify-center items-center z-[9999]">
          <div className="bg-gray-800 backdrop-blur-xl border border-white/20 p-8 rounded-2xl shadow-2xl w-[460px] text-white w-[560px] max-h-[90vh] overflow-y-auto text-white custom-scrollbar">
            <h2 className="text-2xl font-bold text-center mb-6">Mint NFT</h2>

            {!account ? (
              // If wallet is not connected, show this message
              <div className="text-center p-6">
                <p className="text-lg text-red-400">
                  Please connect your wallet to mint an NFT
                </p>
                <button
                  className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition"
                  onClick={() => setIsOpen(false)}
                >
                  Close
                </button>
              </div>
            ) : (
              // If wallet is connected, show the form
              <>
                <form onSubmit={handleMint}>
                  <div className="mb-4">
                    <label className="block text-white text-sm font-bold mb-2">
                      NFT Image:
                    </label>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageChange}
                      className="hidden"
                      accept="image/*"
                    />
                    <div
                      onClick={handleImageUploadClick}
                      className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition ${
                        imagePreview
                          ? "border-blue-400"
                          : "border-gray-400 hover:border-blue-400"
                      }`}
                    >
                      {imagePreview ? (
                        <div className="relative">
                          <img
                            src={imagePreview}
                            alt="NFT Preview"
                            className="mx-auto max-h-48 rounded-lg"
                          />
                          <div className="mt-2 text-sm text-white">
                            Click to change image
                          </div>
                        </div>
                      ) : (
                        <div className="py-8">
                          <svg
                            className="mx-auto h-12 w-12 text-gray-400"
                            stroke="currentColor"
                            fill="none"
                            viewBox="0 0 48 48"
                            aria-hidden="true"
                          >
                            <path
                              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <p className="mt-1">Click to upload an image</p>
                          <p className="text-xs text-gray-400 mt-1">
                            PNG, JPG, GIF up to 5MB
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-white text-sm font-bold mb-2">
                      NFT Description:
                    </label>
                    <textarea
                      value={nftDescription}
                      onChange={(e) => setNftDescription(e.target.value)}
                      className="shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline"
                      placeholder="Describe your NFT..."
                      rows={4}
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-white text-sm font-bold mb-2">
                      NFT Name:
                    </label>
                    <input
                      type="text"
                      value={tokenName}
                      onChange={(e) => setTokenName(e.target.value)}
                      className="shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline"
                      placeholder="Enter NFT name"
                      required
                    />
                  </div>

                  <div className="mb-6">
                    <label className="block text-white text-sm font-bold mb-2">
                      Mint Price: {price} ETH
                    </label>
                  </div>

                  <div className="flex items-center justify-between mt-6">
                    <button
                      type="button"
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-xl transition"
                      onClick={() => setIsOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading || !image}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition disabled:bg-blue-400/50"
                    >
                      {isLoading ? "Minting..." : "Mint NFT"}
                    </button>
                  </div>
                </form>

                {txHash && (
                  <div className="mt-6 p-4 bg-gray-800 rounded">
                    <h3 className="font-bold mb-2">Transaction Submitted</h3>
                    <p className="text-sm overflow-hidden text-ellipsis">
                      Hash: {txHash}
                    </p>
                  </div>
                )}

                {tokenId && (
                  <div className="mt-4 p-4 bg-green-900 rounded">
                    <h3 className="font-bold text-green-400 mb-2">
                      NFT Minted Successfully!
                    </h3>
                    <p className="text-sm">Token ID: {tokenId}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
