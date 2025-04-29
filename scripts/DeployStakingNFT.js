const { ethers } = require("hardhat");

async function main() {

    const baseURI = "https://yourdomain.com/metadata/"; // replace with your actual metadata base URI

    // Deploy (ERC20 token)
    const StakingToken = await ethers.getContractFactory("RefferralTokens");
    const token = await StakingToken.deploy();
    await token.waitForDeployment();
    console.log("StakingToken deployed at:", token.target);

    const StakingWithNFT = await ethers.getContractFactory("StakingWithNFT");
    const staking = await StakingWithNFT.deploy(token.target, baseURI);
    await staking.waitForDeployment();

    console.log(`StakingWithNFT deployed to: ${staking.target}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
