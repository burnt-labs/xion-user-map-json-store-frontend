"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  useAbstraxionAccount,
  useAbstraxionSigningClient,
  useAbstraxionClient,
} from "@burnt-labs/abstraxion";
import { Button } from "@burnt-labs/ui";
import "@burnt-labs/ui/dist/index.css";
import LoadingModal from "@/components/LoadingModal";
import type { ExecuteResult } from "@cosmjs/cosmwasm-stargate";

const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";

if (!contractAddress) {
  throw new Error("CONTRACT_ADDRESS environment variable is not set");
}

type ExecuteResultOrUndefined = ExecuteResult | undefined;
type QueryResult = {
  users?: string[];
  value?: string;
  map?: Array<[string, string]>;
};

export default function Page(): JSX.Element {
  // Abstraxion hooks
  const { data: account, login } = useAbstraxionAccount();
  const { client, signArb, logout } = useAbstraxionSigningClient();
  const { client: queryClient } = useAbstraxionClient();

  // State variables
  const [loading, setLoading] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [executeResult, setExecuteResult] = useState<ExecuteResultOrUndefined>(undefined);
  const [queryResult, setQueryResult] = useState<QueryResult>({});
  const [jsonInput, setJsonInput] = useState<string>("");
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [jsonError, setJsonError] = useState<string>("");
  const [showValueByUserForm, setShowValueByUserForm] = useState<boolean>(false);
  const [showUpdateJsonForm, setShowUpdateJsonForm] = useState<boolean>(true);
  const [addressInput, setAddressInput] = useState<string>("");
  const [activeView, setActiveView] = useState<string>("updateJson");

  // Add effect to fetch user's JSON data when they log in
  useEffect(() => {
    const fetchUserData = async () => {
      if (account?.bech32Address && queryClient) {
        try {
          const response = await queryClient.queryContractSmart(contractAddress, {
            get_value_by_user: { address: account.bech32Address }
          });
          if (response) {
            setJsonInput(response);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    };

    fetchUserData();
  }, [account?.bech32Address, queryClient]);

  const blockExplorerUrl = `https://www.mintscan.io/xion-testnet/tx/${executeResult?.transactionHash}`;

  const clearResults = () => {
    setQueryResult({});
    setExecuteResult(undefined);
  };

  // Effect to handle account changes
  useEffect(() => {
    if (account?.bech32Address) {
      setShowUpdateJsonForm(true);
      setActiveView("updateJson");
      clearResults();
    }
  }, [account?.bech32Address]);

  // Query functions
  const getUsers = async () => {
    setLoading(true);
    clearResults();
    setActiveView("users");
    setShowUpdateJsonForm(false);
    setShowValueByUserForm(false);
    try {
      if (!queryClient) throw new Error("Query client is not defined");
      const response = await queryClient.queryContractSmart(contractAddress, { get_users: {} });
      setQueryResult({ users: response });
    } catch (error) {
      console.error("Error querying users:", error);
    } finally {
      setLoading(false);
    }
  };

  const getMap = async () => {
    setLoading(true);
    clearResults();
    setActiveView("map");
    setShowUpdateJsonForm(false);
    setShowValueByUserForm(false);
    try {
      if (!queryClient) throw new Error("Query client is not defined");
      const response = await queryClient.queryContractSmart(contractAddress, { get_map: {} });
      setQueryResult({ map: response });
    } catch (error) {
      console.error("Error querying map:", error);
    } finally {
      setLoading(false);
    }
  };

  const getValueByUser = async (address: string) => {
    setLoading(true);
    clearResults();
    setActiveView("value");
    setShowUpdateJsonForm(false);
    setShowValueByUserForm(false);
    try {
      if (!queryClient) throw new Error("Query client is not defined");
      const response = await queryClient.queryContractSmart(contractAddress, { 
        get_value_by_user: { address } 
      });
      setQueryResult({ value: response });
      setSelectedAddress(address);
    } catch (error) {
      console.error("Error querying value:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatJson = (jsonString: string): string => {
    try {
      const parsed = JSON.parse(jsonString);
      return JSON.stringify(parsed, null, 2);
    } catch (error) {
      return jsonString;
    }
  };

  const validateJson = (jsonString: string): boolean => {
    try {
      JSON.parse(jsonString);
      setJsonError("");
      return true;
    } catch (error) {
      setJsonError("Invalid JSON format");
      return false;
    }
  };

  const handleFormatJson = () => {
    if (validateJson(jsonInput)) {
      setJsonInput(formatJson(jsonInput));
    }
  };

  // Update JSON value
  const updateValue = async () => {
    if (!validateJson(jsonInput)) {
      return;
    }
    setLoading(true);
    try {
      if (!client || !account) throw new Error("Client or account not defined");
      const msg = { update: { value: jsonInput } };
      const res = await client.execute(account.bech32Address, contractAddress, msg, "auto");
      setExecuteResult(res);
      console.log("Transaction successful:", res);
    } catch (error) {
      console.error("Error executing transaction:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="m-auto flex min-h-screen max-w-6xl flex-col items-center justify-center gap-4 p-4">
      <h1 className="text-2xl font-bold tracking-tighter text-white">User Map JSON Storage</h1><br /><br />

      <div className="flex w-full gap-8">
        {/* Left Column - Buttons */}
        <div className="flex w-1/3 flex-col gap-4">
          <Button 
            fullWidth 
            onClick={async () => {
              if (!account?.bech32Address) {
                setIsLoggingIn(true);
                try {
                  await login();
                } catch (error) {
                  console.error('Login failed:', error);
                } finally {
                  setIsLoggingIn(false);
                }
              }
            }} 
            structure="base"
          >
            {account?.bech32Address ? account.bech32Address.slice(0, 10) + "..." + account.bech32Address.slice(-6) : "CONNECT"}
          </Button>

          {client && (
            <>
              <Button disabled={loading} fullWidth onClick={getUsers} structure="base">
                {loading ? "LOADING..." : "Get Users"}
              </Button>
              <Button disabled={loading} fullWidth onClick={getMap} structure="base">
                {loading ? "LOADING..." : "Get Map"}
              </Button>
              <Button 
                disabled={loading} 
                fullWidth 
                onClick={() => {
                  setShowValueByUserForm(true);
                  setShowUpdateJsonForm(false);
                  clearResults();
                  setActiveView("valueForm");
                }} 
                structure="base"
              >
                Get Value by User
              </Button>
              <Button
                disabled={loading}
                fullWidth
                onClick={() => {
                  setShowUpdateJsonForm(true);
                  setShowValueByUserForm(false);
                  clearResults();
                  setActiveView("updateJson");
                }}
                structure="base"
              >
                Update JSON
              </Button>
              {logout && (
                <Button disabled={loading} fullWidth onClick={logout} structure="base">
                  LOGOUT
                </Button>
              )}
            </>
          )}
        </div>

        {/* Right Column - Form/Results */}
        <div className="flex w-2/3 flex-col gap-4">
          {showValueByUserForm && (
            <div className="flex flex-col gap-4">
              <div className="text-white">Enter User Address:</div>
              <input
                type="text"
                className="w-full rounded border p-2 text-black"
                value={addressInput}
                onChange={(e) => setAddressInput(e.target.value)}
                placeholder="xion1..."
              />
              <div className="flex gap-2">
                <Button
                  fullWidth
                  onClick={() => {
                    getValueByUser(addressInput);
                  }}
                  structure="base"
                >
                  Get Value
                </Button>
              </div>
            </div>
          )}

          {showUpdateJsonForm && account?.bech32Address && (
            <div className="flex flex-col gap-4">
              <textarea
                className={`min-h-[200px] w-full rounded border p-2 text-black font-mono ${
                  jsonError ? "border-red-500" : ""
                }`}
                value={jsonInput}
                onChange={(e) => {
                  setJsonInput(e.target.value);
                  validateJson(e.target.value);
                }}
                onBlur={(e) => {
                  if (validateJson(e.target.value)) {
                    setJsonInput(formatJson(e.target.value));
                  }
                }}
                placeholder="Enter JSON data..."
              />
              {jsonError && (
                <div className="text-red-500">{jsonError}</div>
              )}
              <div className="flex gap-2">
                <Button 
                  disabled={loading || !!jsonError} 
                  fullWidth 
                  onClick={updateValue} 
                  structure="base"
                >
                  {loading ? "LOADING..." : "Submit JSON"}
                </Button>
                <Button
                  onClick={handleFormatJson}
                  structure="base"
                >
                  Format JSON
                </Button>
              </div>
            </div>
          )}

          {!account?.bech32Address && (
            <div className="text-center text-white">Please connect your wallet to interact with the contract</div>
          )}

          {/* Query Results */}
          {activeView === "users" && queryResult.users && (
            <div className="rounded border-2 border-primary p-4">
              <h3 className="mb-2 font-bold">Users:</h3>
              <div className="flex flex-col gap-2">
                {queryResult.users.map((user, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span>{user}</span>
                    <Button
                      onClick={() => {
                        getValueByUser(user);
                        setActiveView("value");
                      }}
                    >
                      View Value
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeView === "value" && queryResult.value && (
            <div className="rounded border-2 border-primary p-4">
              <h3 className="mb-2 font-bold">Value for {selectedAddress}:</h3>
              <pre className="whitespace-pre-wrap">{queryResult.value}</pre>
            </div>
          )}

          {activeView === "map" && queryResult.map && (
            <div className="rounded border-2 border-primary p-4">
              <h3 className="mb-2 font-bold">Map Contents:</h3>
              <div className="flex flex-col gap-2">
                {queryResult.map.map(([address, value], index) => (
                  <div key={index} className="rounded border p-2">
                    <div className="font-bold">Address: {address}</div>
                    <pre className="whitespace-pre-wrap">Value: {value}</pre>
                  </div>
                ))}
              </div>
            </div>
          )}

          {executeResult && (
            <div className="flex flex-col rounded border-2 border-black p-2 dark:border-white">
              <div className="mt-2">
                <p className="text-zinc-500"><span className="font-bold">Transaction Hash</span></p>
                <p className="text-sm">{executeResult.transactionHash}</p>
              </div>
              <div className="mt-2">
                <p className="text-zinc-500"><span className="font-bold">Block Height:</span></p>
                <p className="text-sm">{executeResult.height}</p>
              </div>
              <div className="mt-2">
                <Link className="text-black underline visited:text-purple-600 dark:text-white" href={blockExplorerUrl} target="_blank">
                  View in Block Explorer
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      <LoadingModal isOpen={isLoggingIn} message="Connecting to your wallet..." />
      <LoadingModal isOpen={loading} message="Processing transaction..." />
    </main>
  );
}