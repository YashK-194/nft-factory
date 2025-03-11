import { useState } from "react";

export default function NFTDetails({ contract, network }) {
  const [isOpen, setIsOpen] = useState(false);
  const [tokenId, setTokenId] = useState("");
  const [owner, setOwner] = useState(null);
  const [uri, setURI] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Function to get Etherscan URL based on the network
  const getEtherscanURL = (tokenId) => {
    const baseUrls = {
      mainnet: "https://etherscan.io/token/",
      sepolia: "https://sepolia.etherscan.io/token/",
      goerli: "https://goerli.etherscan.io/token/",
    };

    const contractAddress = contract.target; // Ethers v6 uses `.target` for contract address
    return `${
      baseUrls[network] || baseUrls.sepolia
    }${contractAddress}?a=${tokenId}`;
  };

  const fetchDetails = async (e) => {
    e.preventDefault();

    if (!tokenId || isNaN(tokenId) || parseInt(tokenId) <= 0) {
      setError("Please enter a valid token ID");
      return;
    }

    setIsLoading(true);
    setError(null);
    setOwner(null);
    setURI(null);
    setMetadata(null);

    try {
      const [nftOwner, tokenURI] = await contract.getNFTDetails(tokenId);

      setOwner(nftOwner);
      setURI(tokenURI);

      if (tokenURI.startsWith("http")) {
        try {
          const response = await fetch(tokenURI);
          const data = await response.json();
          setMetadata(data);
        } catch (metadataError) {
          console.error("Error fetching metadata:", metadataError);
        }
      } else if (tokenURI.startsWith("ipfs://")) {
        const ipfsGateway = "https://ipfs.io/ipfs/";
        const ipfsHash = tokenURI.replace("ipfs://", "");
        const httpURI = ipfsGateway + ipfsHash;

        try {
          const response = await fetch(httpURI);
          const data = await response.json();
          setMetadata(data);
        } catch (metadataError) {
          console.error("Error fetching IPFS metadata:", metadataError);
        }
      }
    } catch (error) {
      console.error("Error fetching NFT details:", error);
      setError(error.message || "Error fetching NFT details");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        className="w-64 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition"
        onClick={() => setIsOpen(true)}
      >
        Get NFT Details
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-lg flex justify-center items-center z-50">
          <div className="bg-gray-800 backdrop-blur-xl border border-white/20 p-6 rounded-2xl shadow-2xl w-[600px] max-h-[80vh] overflow-y-auto text-white custom-scrollbar">
            {/* Close button - add this */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 transition"
              aria-label="Close"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <h2 className="text-2xl font-bold text-center mb-4">NFT Details</h2>
            {/* Rest of your content */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <form onSubmit={fetchDetails}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Token ID
                  </label>
                  <input
                    type="number"
                    value={tokenId}
                    onChange={(e) => setTokenId(e.target.value)}
                    placeholder="Enter token ID"
                    className="w-full p-2 border border-gray-300 rounded-md text-gray-800"
                    min="1"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full p-2 rounded-md ${
                    isLoading
                      ? "bg-gray-400"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  {isLoading ? "Fetching..." : "Get NFT Details"}
                </button>
              </form>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {owner && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <h3 className="text-lg font-medium text-blue-800 mb-2">
                    NFT Details
                  </h3>
                  <div className="space-y-2 text-gray-800">
                    <p className="text-sm">
                      <span className="font-medium">Owner:</span>{" "}
                      <span className="font-mono break-all">{owner}</span>
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Token URI:</span>{" "}
                      <span className="font-mono break-all">{uri}</span>
                    </p>
                  </div>

                  {/* Etherscan View Button */}
                  <div className="mt-3">
                    <a
                      href={getEtherscanURL(tokenId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-center bg-green-600 hover:bg-green-700 text-white p-2 rounded-md"
                    >
                      View on Etherscan
                    </a>
                  </div>

                  {metadata && (
                    <div className="mt-4">
                      <h4 className="text-md font-medium text-blue-800 mb-2">
                        Metadata
                      </h4>
                      <div className="bg-white p-3 rounded-md border border-blue-100 text-black">
                        <pre className="text-xs overflow-auto max-h-60">
                          {JSON.stringify(metadata, null, 2)}
                        </pre>

                        {metadata.image && (
                          <div className="mt-3">
                            <h5 className="text-sm font-medium text-blue-800 mb-1">
                              Image Preview
                            </h5>
                            <img
                              src={
                                metadata.image.startsWith("ipfs://")
                                  ? `https://ipfs.io/ipfs/${metadata.image.replace(
                                      "ipfs://",
                                      ""
                                    )}`
                                  : metadata.image
                              }
                              alt={metadata.name || "NFT Image"}
                              className="max-w-full h-auto max-h-60 rounded-md"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "/placeholder-image.png";
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
