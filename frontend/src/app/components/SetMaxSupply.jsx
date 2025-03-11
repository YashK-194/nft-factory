import { useState, useEffect } from "react";
// import { ethers } from "ethers";

export default function SetMaxSupply({ contract, signer }) {
  const [currentSupply, setCurrentSupply] = useState("10000");
  const [currentTokenCount, setCurrentTokenCount] = useState("0");
  const [newSupply, setNewSupply] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!contract || !signer) return;

        const [maxSupply, tokenCount, adminAddress, userAddress] =
          await Promise.all([
            contract.maxSupply(),
            contract.getTokenCount(),
            contract.owner(), // Assuming `owner()` returns the admin address
            signer.getAddress(),
          ]);

        setCurrentSupply(maxSupply.toString());
        setCurrentTokenCount(tokenCount.toString());

        if (adminAddress.toLowerCase() === userAddress.toLowerCase()) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [contract, signer, success]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!newSupply || isNaN(newSupply) || parseInt(newSupply) <= 0) {
      alert("Please enter a valid supply amount");
      return;
    }

    if (parseInt(newSupply) < parseInt(currentTokenCount)) {
      alert("New supply cannot be less than current token count");
      return;
    }

    setIsLoading(true);
    setTxHash(null);
    setSuccess(false);

    try {
      const tx = await contract.connect(signer).setMaxSupply(newSupply);
      setTxHash(tx.hash);
      await tx.wait();

      setSuccess(true);
      setNewSupply("");
    } catch (error) {
      console.error("Error setting max supply:", error);
      alert("Error setting max supply: " + (error.message || "Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAdmin) return null; // Hide component if user is not admin

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h3 className="text-lg font-medium mb-3">Set Maximum Supply</h3>
      <p className="mb-1 text-sm text-gray-600">
        Current max supply: <span className="font-medium">{currentSupply}</span>
      </p>
      <p className="mb-3 text-sm text-gray-600">
        Current token count:{" "}
        <span className="font-medium">{currentTokenCount}</span>
      </p>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            New Maximum Supply
          </label>
          <input
            type="number"
            value={newSupply}
            onChange={(e) => setNewSupply(e.target.value)}
            placeholder="Enter new max supply"
            className="w-full p-2 border border-gray-300 rounded-md text-gray-800"
            min={currentTokenCount}
            required
          />
          <p className="mt-1 text-xs text-gray-500">
            Cannot be less than current token count ({currentTokenCount})
          </p>
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
          {isLoading ? "Updating..." : "Update Max Supply"}
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
              Maximum supply updated successfully!
            </p>
          )}
        </div>
      )}
    </div>
  );
}
