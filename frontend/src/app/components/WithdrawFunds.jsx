import { useState, useEffect } from "react";
import { ethers } from "ethers";

export default function WithdrawFunds({ contract, signer }) {
  const [contractBalance, setContractBalance] = useState("0");
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [success, setSuccess] = useState(false);
  const [userAddress, setUserAddress] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!contract || !signer) return;

    const fetchBalance = async () => {
      try {
        const provider = signer.provider;
        const balance = await provider.getBalance(contract.target);
        setContractBalance(ethers.formatEther(balance));
      } catch (error) {
        console.error("Error fetching contract balance:", error);
      }
    };

    const checkAdmin = async () => {
      try {
        const userAddr = await signer.getAddress(); // Get user's wallet address
        setUserAddress(userAddr);

        const adminAddr = await contract.owner(); // Get admin from the contract
        setIsAdmin(userAddr.toLowerCase() === adminAddr.toLowerCase());
      } catch (error) {
        console.error("Error checking admin:", error);
      }
    };

    fetchBalance();
    checkAdmin();

    const interval = setInterval(fetchBalance, 10000);
    return () => clearInterval(interval);
  }, [contract, signer]);

  const handleWithdraw = async () => {
    setIsLoading(true);
    setTxHash(null);
    setSuccess(false);

    try {
      if (parseFloat(contractBalance) <= 0) {
        alert("No balance to withdraw");
        setIsLoading(false);
        return;
      }

      const tx = await contract.withdraw.send();
      setTxHash(tx.hash);
      await tx.wait();

      setSuccess(true);
    } catch (error) {
      console.error("Error withdrawing funds:", error);
      alert("Error withdrawing funds: " + (error.message || "Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };

  // 🔹 Hide component if user is not admin
  if (!isAdmin) return null;

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h3 className="text-lg font-medium mb-3">Withdraw Funds</h3>
      <p className="mb-4 text-sm text-gray-600">
        Contract Balance:{" "}
        <span className="font-medium">{contractBalance} ETH</span>
      </p>

      <button
        onClick={handleWithdraw}
        disabled={isLoading || parseFloat(contractBalance) <= 0}
        className={`w-full p-2 rounded-md ${
          isLoading || parseFloat(contractBalance) <= 0
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700 text-white"
        }`}
      >
        {isLoading ? "Processing..." : "Withdraw All Funds"}
      </button>

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
              Funds withdrawn successfully!
            </p>
          )}
        </div>
      )}
    </div>
  );
}
