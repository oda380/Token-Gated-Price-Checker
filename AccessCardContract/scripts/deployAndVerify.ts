// scripts/deployAndVerify.ts
import { artifacts, ethers, network } from "hardhat";

const ETHERSCAN_V2 = "https://api.etherscan.io/v2/api";

async function main() {
  const chainId = Number(network.config.chainId);
  const [deployer] = await ethers.getSigners();
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Network: ${network.name} (chainId=${chainId})`);

  // --- constructor args (from .env or inline) ---
  const DEFAULT_URI =
    process.env.DEFAULT_TOKEN_URI ??
    "ipfs://bafy.../metadata.json"; // <- replace if not using .env
  const COLLECTION_URI =
    process.env.COLLECTION_URI ??
    "ipfs://bafy.../collection.json"; // <- optional, can be ""

  // --- 1) Deploy ---
  const Factory = await ethers.getContractFactory("AccessCard");
  const contract = await Factory.deploy(DEFAULT_URI, COLLECTION_URI);
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  const txHash = contract.deploymentTransaction()?.hash;
  console.log(`AccessCard deployed at: ${address}`);
  if (txHash) console.log(`Deploy tx: ${txHash}`);

  // Optional: give the explorer a moment + a few blocks before verify
  await sleep(5000);

  // --- 2) Prepare verification payload (V2, standard-json-input) ---
  // Build Fully-Qualified Name (FQN) and get build info for this contract.
  const artifact = await artifacts.readArtifact("AccessCard");
  const fqName = `${artifact.sourceName}:${artifact.contractName}`;

  const build = await artifacts.getBuildInfo(fqName);
  if (!build) {
    throw new Error(
      `Build info not found for ${fqName}. Run "npx hardhat compile" first.`
    );
  }
  const compilerVersion = "v" + build.solcLongVersion; // e.g. v0.8.20+commit.a1b79de6

  // If you had constructor args to encode manually, you'd ABI-encode them.
  // For standard-json-input verification, passing them as "constructorArguments"
  // (ABI-encoded hex string) is sufficient. Here the args are strings,
  // but we don't need to encode because we’re not using the flattened flow.

  // --- 3) Submit verification (POST verifysourcecode) ---
  const guid = await submitVerification({
    chainId,
    apikey: mustEnv("ETHERSCAN_API_KEY"),
    sourceCode: JSON.stringify(build.input), // standard-json-input string
    contractaddress: address,
    contractname: fqName, // "contracts/AccessCard.sol:AccessCard"
    compilerversion: compilerVersion,
    optimizationUsed: build.input.settings?.optimizer?.enabled ? "1" : "0",
    runs: String(build.input.settings?.optimizer?.runs ?? 200),
    licenseType: "3", // 3 = MIT; adjust if you used a different SPDX
  });

  console.log(`Verification submitted. GUID: ${guid}`);

  // --- 4) Poll verification status ---
  const result = await pollVerifyStatus({
    chainId,
    apikey: mustEnv("ETHERSCAN_API_KEY"),
    guid,
    attempts: 40,
    intervalMs: 4000,
  });

  console.log(`Verification status: ${result}`);
}

// ----------------- helpers -----------------

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

async function submitVerification(params: {
  chainId: number;
  apikey: string;
  sourceCode: string; // standard-json-input
  contractaddress: string;
  contractname: string; // FQN
  compilerversion: string; // "v0.8.20+commit...."
  optimizationUsed: "0" | "1";
  runs: string;
  licenseType?: string; // "3" for MIT
}) {
  const qs = new URLSearchParams({
    chainid: String(params.chainId),
    module: "contract",
    action: "verifysourcecode",
    apikey: params.apikey,
  });

  const body = new URLSearchParams({
    codeformat: "solidity-standard-json-input",
    sourceCode: params.sourceCode,
    contractaddress: params.contractaddress,
    contractname: params.contractname,
    compilerversion: params.compilerversion,
    optimizationUsed: params.optimizationUsed,
    runs: params.runs,
  });
  if (params.licenseType) body.append("licenseType", params.licenseType);

  const res = await fetch(`${ETHERSCAN_V2}?${qs.toString()}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const json = await res.json();
  if (json.status !== "1") {
    // Explorer sometimes returns status 0 with a human-readable message
    throw new Error(`Verify submit failed: ${json.message} - ${json.result}`);
  }
  return json.result as string; // GUID
}

async function pollVerifyStatus(params: {
  chainId: number;
  apikey: string;
  guid: string;
  attempts: number;
  intervalMs: number;
}): Promise<string> {
  const qs = new URLSearchParams({
    chainid: String(params.chainId),
    module: "contract",
    action: "checkverifystatus",
    guid: params.guid,
    apikey: params.apikey,
  });

  for (let i = 0; i < params.attempts; i++) {
    const res = await fetch(`${ETHERSCAN_V2}?${qs.toString()}`);
    const json = await res.json();
    // status "1" => verified, "0" with "Pending in queue" => keep polling
    if (json.status === "1") return json.result as string; // e.g., "Pass - Verified"
    const msg = String(json.result || json.message || "");
    if (json.status === "0" && /pending/i.test(msg)) {
      await sleep(params.intervalMs);
      continue;
    }
    // Hard fail
    throw new Error(`Verify failed: ${json.result || json.message}`);
  }
  throw new Error("Verification timed out");
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
