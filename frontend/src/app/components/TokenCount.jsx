import { useState, useEffect } from "react";

export default function TokenCount({ contract }) {
  const [tokenCount, setTokenCount] = useState("0");
  const [maxSupply, setMaxSupply] = useState("10000");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!contract) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const count = await contract.getTokenCount();
        const supply = await contract.maxSupply();

        setTokenCount(String(count));
        setMaxSupply(String(supply));
      } catch (error) {
        console.error("Error fetching token count:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [contract]);

  // Prevent divide-by-zero error
  const percentageMinted =
    maxSupply === "0"
      ? 0
      : (parseFloat(tokenCount) / parseFloat(maxSupply)) * 100;

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      {isLoading ? (
        <p className="text-center text-gray-500">Loading...</p>
      ) : (
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Total NFTs Minted
            </span>
            <span className="text-sm font-medium text-blue-600">
              {tokenCount} / {maxSupply}
            </span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{ width: `${percentageMinted}%` }}
            ></div>
          </div>

          <p className="text-xs text-right mt-1 text-gray-500">
            {percentageMinted.toFixed(2)}% minted
          </p>
        </div>
      )}
    </div>
  );
}
