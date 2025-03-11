import { useState, useEffect } from "react";
import { ethers } from "ethers";

export default function SetMintPrice({ contract, signer }) {
  const [currentPrice, setCurrentPrice] = useState("0.01");
  const [newPrice, setNewPrice] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!contract || !signer) return;

        // Get current mint price
        const price = await contract.mintPrice();
        setCurrentPrice(ethers.formatEther(price));

        // Check if the connected wallet is the contract owner
        const ownerAddress = await contract.owner();
        const signerAddress = await signer.getAddress();

        if (signerAddress.toLowerCase() === ownerAddress.toLowerCase()) {
          setIsAdmin(true);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [contract, signer, success]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!newPrice || isNaN(newPrice) || parseFloat(newPrice) < 0) {
      alert("Please enter a valid price");
      return;
    }

    setIsLoading(true);
    setTxHash(null);
    setSuccess(false);

    try {
      // Convert ETH to wei
      const priceInWei = ethers.parseEther(newPrice);

      // Send transaction using signer
      const tx = await contract.connect(signer).setMintPrice(priceInWei);

      // Set transaction hash
      setTxHash(tx.hash);

      // Wait for transaction to be mined
      await tx.wait();

      setSuccess(true);
      setNewPrice("");
    } catch (error) {
      console.error("Error setting mint price:", error);
      alert("Error setting mint price: " + (error.message || "Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <p className="text-red-500">
        You do not have permission to access this feature.
      </p>
    );
  }

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h3 className="text-lg font-medium mb-3">Set Mint Price</h3>
      <p className="mb-3 text-sm text-gray-600">
        Current price: <span className="font-medium">{currentPrice} ETH</span>
      </p>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            New Price (ETH)
          </label>
          <input
            type="number"
            value={newPrice}
            onChange={(e) => setNewPrice(e.target.value)}
            placeholder="0.01"
            className="w-full p-2 border border-gray-300 rounded-md text-gray-800"
            min="0"
            step="0.000000000000000001"
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
          {isLoading ? "Updating..." : "Update Price"}
        </button>
      </form>

      {txHash && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm font-medium text-green-800">
            Transaction submitted!
          </p>
          <p className="text-xs text-green-600 break-all">
            Transaction Hash: {txHash}
          </p>
          {success && (
            <p className="text-sm font-medium text-green-800 mt-2">
              Price updated successfully!
            </p>
          )}
        </div>
      )}
    </div>
  );
}
