/* scripts/verifyV2.js
 * Node 18+ required (uses global fetch).
 * Usage:
 *   npx hardhat run scripts/verifyV2.js --network base        0xDeployedAddress
 *   npx hardhat run scripts/verifyV2.js --network baseSepolia 0xDeployedAddress
 */
const { artifacts, network, ethers } = require("hardhat");

const ETHERSCAN_V2 = "https://api.etherscan.io/v2/api";

async function main() {
  const chainId = Number(network.config.chainId);
  const apikey = mustEnv("ETHERSCAN_API_KEY");

  const address = process.env.VERIFY_ADDRESS;
  if (!address) {
    throw new Error("Set VERIFY_ADDRESS in .env or edit the script directly");
  }
  console.log(`Verifying ${address} on ${network.name} (chainId=${chainId})`);

  // Ensure code exists at address (and give indexers a moment)
  await waitForOnchainCode(address, 3);

  // Build FQN and get build info for AccessCard
  const artifact = await artifacts.readArtifact("AccessCard");
  const fqName = `${artifact.sourceName}:${artifact.contractName}`;

  const build = await artifacts.getBuildInfo(fqName);
  if (!build) throw new Error(`Build info not found for ${fqName}. Run: npx hardhat compile`);

  const compilerVersion = "v" + build.solcLongVersion; // e.g., v0.8.20+commit.a1b79de6
  const optimizationUsed = build.input.settings?.optimizer?.enabled ? "1" : "0";
  const runs = String(build.input.settings?.optimizer?.runs ?? 200);

  // Submit verification (standard-json-input)
  const guid = await submitVerification({
    chainId,
    apikey,
    sourceCode: JSON.stringify(build.input),
    contractaddress: address,
    contractname: fqName,          // "contracts/AccessCard.sol:AccessCard"
    compilerversion: compilerVersion,
    optimizationUsed,
    runs,
    licenseType: "3",              // 3 = MIT
  });
  console.log("Verification submitted. GUID:", guid);

  // Poll status
  const result = await pollVerifyStatus({ chainId, apikey, guid, attempts: 40, intervalMs: 4000 });
  console.log("Verification status:", result);
}

function mustEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var ${name}`);
  return v;
}

async function submitVerification(params) {
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
    throw new Error(`Verify submit failed: ${json.message} - ${json.result}`);
  }
  return json.result; // GUID
}

async function pollVerifyStatus({ chainId, apikey, guid, attempts, intervalMs }) {
  const qs = new URLSearchParams({
    chainid: String(chainId),
    module: "contract",
    action: "checkverifystatus",
    guid,
    apikey,
  });

  for (let i = 0; i < attempts; i++) {
    const res = await fetch(`${ETHERSCAN_V2}?${qs.toString()}`);
    const json = await res.json();
    if (json.status === "1") return json.result; // e.g., "Pass - Verified"
    const msg = String(json.result || json.message || "");
    if (/pending/i.test(msg)) {
      await sleep(intervalMs);
      continue;
    }
    throw new Error(`Verify failed: ${json.result || json.message}`);
  }
  throw new Error("Verification timed out");
}

async function waitForOnchainCode(address, confirmations = 2) {
  // Wait until bytecode is present
  for (let i = 0; i < 60; i++) {
    const code = await ethers.provider.getCode(address);
    if (code && code !== "0x") break;
    await sleep(3000);
  }
  // Wait a couple of confirmations to help the explorer index
  const current = await ethers.provider.getBlockNumber();
  const target = current + confirmations;
  while ((await ethers.provider.getBlockNumber()) < target) {
    await sleep(3000);
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
