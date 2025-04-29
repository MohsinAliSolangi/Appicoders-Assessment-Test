const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("StakingWithNFT", function () {
    let stakingToken, stakingContract;
    let owner, user1, user2;
    const baseURI = "https://yourdomain.com/metadata/";

    const BADGE_BASIC = 1001;
    const BADGE_PLUS = 1002;
    const BADGE_PREMIUM = 1003;

    beforeEach(async function () {
        [owner, user1, user2] = await ethers.getSigners();

        // Deploy mock ERC20 token
        const Token = await ethers.getContractFactory("RefferralTokens");
        stakingToken = await Token.deploy();
        await stakingToken.waitForDeployment();

        let tx = await stakingToken.setReferralSystem(owner.address);
        await tx.wait();

        // Mint tokens
        await stakingToken.connect(owner).mint(user1.address, ethers.parseEther("10000"));
        await stakingToken.connect(owner).mint(user2.address, ethers.parseEther("10000"));

        // Deploy staking contract
        const Staking = await ethers.getContractFactory("StakingWithNFT");
        stakingContract = await Staking.deploy(stakingToken.target, baseURI);
        await stakingContract.waitForDeployment();
    });

    it("should stake and mint LP NFT", async function () {
        const stakeAmount = ethers.parseEther("100");
        await stakingToken.connect(user1).approve(stakingContract.target, stakeAmount);
        await stakingContract.connect(user1).stake(stakeAmount);
        const stakeIds = await stakingContract.getUserStakeIds(user1.address);
        expect(stakeIds.length).to.equal(1);
        const nftBalance = await stakingContract.balanceOf(user1.address, stakeIds[0]);
        expect(nftBalance).to.equal(1);
    });

    it("should calculate points correctly over time", async function () {
        const stakeAmount = ethers.parseEther("50");
        await stakingToken.connect(user1).approve(stakingContract.target, stakeAmount);
        await stakingContract.connect(user1).stake(stakeAmount);
        const stakeId = await stakingContract.getUserStakeIds(user1.address)
        expect(stakeId.length).to.equal(1);
        // Travel 5 days into the future
        await ethers.provider.send("evm_increaseTime", [5 * 86400]);
        await ethers.provider.send("evm_mine");
        const points = await stakingContract.calculatePoints(user1.address, stakeId[0]);
        const expected = ethers.parseEther("250"); // 50 * 5
        expect(points).to.be.closeTo(expected, ethers.parseEther("1"));
    });

    it("should allow redeeming Basic badge", async function () {
        const stakeAmount = ethers.parseEther("100");
        await stakingToken.connect(user1).approve(stakingContract.target, stakeAmount);
        await stakingContract.connect(user1).stake(stakeAmount);
        const stakeId = await stakingContract.getUserStakeIds(user1.address)
        expect(stakeId.length).to.equal(1);
        await ethers.provider.send("evm_increaseTime", [10 * 86400]);
        await ethers.provider.send("evm_mine");
        await stakingContract.connect(user1).redeemBadge(stakeId[0]);
        const badgeBal = await stakingContract.balanceOf(user1.address, BADGE_BASIC);
        expect(badgeBal).to.equal(1);
    });

    it("should allow redeeming Plus badge after 5000 points", async function () {
        const stakeAmount = ethers.parseEther("100");

        await stakingToken.connect(user1).approve(stakingContract.target, stakeAmount);
        await stakingContract.connect(user1).stake(stakeAmount);
        const stakeId = (await stakingContract.getUserStakeIds(user1.address))[0];

        await ethers.provider.send("evm_increaseTime", [50 * 86400]); // 50 days = 5000 pts
        await ethers.provider.send("evm_mine");

        await stakingContract.connect(user1).redeemBadge(stakeId);
        const plusBal = await stakingContract.balanceOf(user1.address, BADGE_PLUS);
        expect(plusBal).to.equal(1);
    });

    it("should allow redeeming Premium badge after 10000 points", async function () {
        const stakeAmount = ethers.parseEther("100");

        await stakingToken.connect(user1).approve(stakingContract.target, stakeAmount);
        await stakingContract.connect(user1).stake(stakeAmount);
        const stakeId = (await stakingContract.getUserStakeIds(user1.address))[0];

        await ethers.provider.send("evm_increaseTime", [100 * 86400]); // 100 days
        await ethers.provider.send("evm_mine");

        await stakingContract.connect(user1).redeemBadge(stakeId);
        const premiumBal = await stakingContract.balanceOf(user1.address, BADGE_PREMIUM);
        expect(premiumBal).to.equal(1);
    });

    it("should revert badge redemption if not enough points", async function () {
        const stakeAmount = ethers.parseEther("10");

        await stakingToken.connect(user1).approve(stakingContract.target, stakeAmount);
        await stakingContract.connect(user1).stake(stakeAmount);
        const stakeId = (await stakingContract.getUserStakeIds(user1.address))[0];

        await ethers.provider.send("evm_increaseTime", [1 * 86400]); // only 10 pts
        await ethers.provider.send("evm_mine");

        await expect(
            stakingContract.connect(user1).redeemBadge(stakeId)
        ).to.be.revertedWith("Tier not reached or already redeemed");
    });

    it("should allow withdrawal and burn LP NFT", async function () {
        const stakeAmount = ethers.parseEther("100");

        await stakingToken.connect(user1).approve(stakingContract.target, stakeAmount);
        await stakingContract.connect(user1).stake(stakeAmount);
        const stakeId = (await stakingContract.getUserStakeIds(user1.address))[0];

        const initialBalance = await stakingToken.balanceOf(user1.address);
        await stakingContract.connect(user1).withdraw(stakeId);
        const afterBalance = await stakingToken.balanceOf(user1.address);

        expect(afterBalance - initialBalance).to.equal(stakeAmount);

        const stakeInfo = await stakingContract.getStakeInfo(user1.address, stakeId);
        expect(stakeInfo.amount).to.equal(0);

        const lpBal = await stakingContract.balanceOf(user1.address, stakeId);
        expect(lpBal).to.equal(0);
    });
});
