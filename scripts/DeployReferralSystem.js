const { ethers } = require("hardhat");

async function main() {
    // Fetch signers
    const [owner] = await ethers.getSigners();
    console.log("Deploying RefferralTokens contract...");

    // Deploy RefferralTokens (ERC20 token)
    const RefferralTokens = await ethers.getContractFactory("RefferralTokens");
    const token = await RefferralTokens.deploy();
    await token.waitForDeployment();
    console.log("RefferralTokens deployed at:", token.target);

    // Deploy ReferralSystem contract
    console.log("Deploying ReferralSystem contract...");
    const ReferralSystem = await ethers.getContractFactory("ReferralSystem");
    const referralSystem = await ReferralSystem.deploy(token.target);
    await referralSystem.waitForDeployment();
    console.log("ReferralSystem deployed at:", referralSystem.target);
}

// Run the script
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Error in deployment script:", error);
        process.exit(1);
    });
