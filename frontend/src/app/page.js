"use client";
import { useState, useEffect, useRef } from "react";
import { ethers } from "ethers";
import ConnectButton from "./components/ConnectButton";
import contractAddresses from "./constants/ContractAddresses.json";
import FactoryABI from "./constants/FactoryABI.json";
import MintNFT from "./components/MintNFT";
import NFTDetails from "./components/NFTDetails";
import SetMaxSupply from "./components/SetMaxSupply";
import SetMintPrice from "./components/SetMintPrice";
import TokenCount from "./components/TokenCount";
import WithdrawFunds from "./components/WithdrawFunds";
import AnimatedBackground from "./components/AnimatedBackground";

export default function Home() {
  const [account, setAccount] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [network, setNetwork] = useState("sepolia");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [activePopup, setActivePopup] = useState(null); // Track open popup
  const adminPanelRef = useRef(null);

  const getContractAddress = (networkName) => {
    return contractAddresses[networkName]?.FactoryContract || null;
  };

  const CONTRACT_ADDRESS = getContractAddress(network);

  const connectWallet = async () => {
    setIsLoading(true);
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();

        setProvider(provider);
        setSigner(signer);
        setAccount(accounts[0]);
      } else {
        alert("MetaMask is required to connect");
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (signer && CONTRACT_ADDRESS) {
      const contractInstance = new ethers.Contract(
        CONTRACT_ADDRESS,
        FactoryABI,
        signer
      );
      setContract(contractInstance);

      const checkIfAdmin = async () => {
        try {
          const owner = await contractInstance.owner();
          setIsAdmin(owner.toLowerCase() === account?.toLowerCase());
        } catch (error) {
          console.error("Error checking admin status:", error);
          setIsAdmin(false);
        }
      };

      checkIfAdmin();
    }
  }, [signer, CONTRACT_ADDRESS, account]);

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          console.log("Account changed:", accounts[0]);
        } else {
          setAccount(null);
        }
      });

      window.ethereum.on("chainChanged", () => {
        window.location.reload();
      });
    }
  }, []);

  // Close the admin panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        adminPanelRef.current &&
        !adminPanelRef.current.contains(event.target)
      ) {
        setIsAdminPanelOpen(false);
        setActivePopup(null); // Close any active popup
      }
    };

    if (isAdminPanelOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isAdminPanelOpen]);

  return (
    <div className=" text-white px-4 py-8 min-h-screen">
      <AnimatedBackground /> {/* Add this line */}
      <div className="max-w-6xl mx-auto relative">
        <header className="flex flex-col md:flex-row justify-between items-center mb-12">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600 mb-4 md:mb-0">
            NFT Factory
            <p className="text-gray-500 text-xl">Create NFTs in seconds!</p>
          </h1>
          <ConnectButton
            connect={connectWallet}
            account={account}
            isLoading={isLoading}
            network={network}
          />
        </header>

        <div className="mb-12 bg-gray-800/50 p-6 rounded-xl backdrop-blur-sm border border-gray-700/50">
          <h2 className="text-xl font-semibold mb-3">Collection Progress</h2>
          <TokenCount contract={contract} />
        </div>

        {account ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50">
              <h2 className="text-2xl font-semibold mb-6">Mint Your NFT</h2>
              {contract ? (
                <MintNFT contract={contract} account={account} />
              ) : (
                <p>Loading contract...</p>
              )}
            </div>

            <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50">
              <h2 className="text-2xl font-semibold mb-6">Lookup NFT</h2>
              {contract ? (
                <NFTDetails contract={contract} />
              ) : (
                <p>Connect your wallet to view NFT details</p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center bg-gray-800/50 p-8 rounded-xl">
            <h2 className="text-2xl font-semibold mb-4">
              Welcome to the NFT Factory
            </h2>
            <p className="text-gray-300 mb-8">
              Connect your wallet to mint NFTs and view collection details.
            </p>
            <ConnectButton
              connect={connectWallet}
              account={account}
              isLoading={isLoading}
            />
          </div>
        )}

        {isAdmin && (
          <div className="fixed bottom-10 right-10 z-50" ref={adminPanelRef}>
            <button
              onClick={() => setIsAdminPanelOpen(!isAdminPanelOpen)}
              className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg"
            >
              Admin Panel
            </button>

            {isAdminPanelOpen && (
              <div className="absolute bottom-14 right-0 bg-gray-800 p-6 rounded-lg w-80 border border-purple-500">
                <h2 className="text-xl font-semibold mb-4 text-purple-300">
                  Admin Controls
                </h2>
                <div className="space-y-3">
                  <button
                    onClick={() =>
                      setActivePopup(
                        activePopup === "maxSupply" ? null : "maxSupply"
                      )
                    }
                    className="bg-gray-700 w-full py-2 rounded-lg"
                  >
                    Set Max Supply
                  </button>
                  {activePopup === "maxSupply" && (
                    <SetMaxSupply contract={contract} signer={signer} />
                  )}

                  <button
                    onClick={() =>
                      setActivePopup(
                        activePopup === "mintPrice" ? null : "mintPrice"
                      )
                    }
                    className="bg-gray-700 w-full py-2 rounded-lg"
                  >
                    Set Mint Price
                  </button>
                  {activePopup === "mintPrice" && (
                    <SetMintPrice contract={contract} signer={signer} />
                  )}

                  <button
                    onClick={() =>
                      setActivePopup(
                        activePopup === "withdrawFunds" ? null : "withdrawFunds"
                      )
                    }
                    className="bg-gray-700 w-full py-2 rounded-lg"
                  >
                    Withdraw Funds
                  </button>
                  {activePopup === "withdrawFunds" && (
                    <WithdrawFunds contract={contract} signer={signer} />
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        <br />
        <footer className="text-center py-4 bg-gray-900 text-white rounded-xl">
          Developed and maintained by Yash Kumar
          <br />
          <a
            href="https://www.linkedin.com/in/yashk194"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline ml-1"
          >
            linkedin.com/in/yashk194
          </a>
        </footer>
      </div>
    </div>
  );
}
