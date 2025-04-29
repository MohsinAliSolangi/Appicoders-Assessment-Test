const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ReferralSystem Contract", function () {

  let referralSystem;
  let referralTokensContract;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async () => {
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy the ReferralTokens contract
    let ReferralTokens = await ethers.getContractFactory("RefferralTokens");
    referralTokensContract = await ReferralTokens.deploy();
    await referralTokensContract.waitForDeployment();
    // console.log("RefferralTokens deployed at:", referralTokensContract.target);

    // Deploy the ReferralSystem contract
    let ReferralSystem = await ethers.getContractFactory("ReferralSystem");
    referralSystem = await ReferralSystem.deploy(referralTokensContract.target);
    await referralSystem.waitForDeployment();
    // console.log("Referral System deployed at:", referralSystem.target);

    // Set the referralSystem contract in the token contract
    await referralTokensContract.setReferralSystem(referralSystem.target);
  });

  it("should allow the referral system to record referrals", async function () {
    await referralSystem.recordReferral(addr2.address, addr1.address);
    expect(await referralSystem.getReferrals(addr1.address)).to.include(addr2.address);
  });

  it("should not allow self-referral", async function () {
    await expect(referralSystem.recordReferral(addr1.address, addr1.address))
      .to.be.revertedWith("Self-referral prohibited");
  });

  it("should not allow circular referrals", async function () {
    await referralSystem.recordReferral(addr2.address, addr1.address);
    await expect(referralSystem.recordReferral(addr1.address, addr2.address))
      .to.be.revertedWith("Circular referral detected");
  });

  it("should mint rewards for referrer and referee", async function () {
    const refereeReward = ethers.parseUnits("10", 18);
    const referrerReward = ethers.parseUnits("5", 18);

    await referralSystem.recordReferral(addr2.address, addr1.address);
    expect(await referralTokensContract.balanceOf(addr1.address)).to.equal(referrerReward);
    expect(await referralTokensContract.balanceOf(addr2.address)).to.equal(refereeReward);
  });

  it("should allow the owner to update reward amounts", async function () {
    const newReferrerReward = ethers.parseUnits("20", 18);
    const newRefereeReward = ethers.parseUnits("15", 18);

    await referralSystem.updateRewards(newReferrerReward, newRefereeReward);
    expect(await referralSystem.REFERRER_REWARD()).to.equal(newReferrerReward);
    expect(await referralSystem.REFEREE_REWARD()).to.equal(newRefereeReward);
  });

  it("should only allow referral system to mint tokens", async function () {
    await expect(referralTokensContract.connect(addr2).mint(addr1.address, ethers.parseUnits("100", 18)))
      .to.be.revertedWith("You are not allowed");
  });
});
