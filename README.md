Here's a complete `README.md` file tailored for your project: **Appicoders-Assessment-Test**, based on the smart contract and Hardhat test structure you've shared.

---

```markdown
# Appicoders Assessment Test

This repository contains a complete staking platform & OnChain Referral System built on Ethereum using Solidity and Hardhat. The platform allows users to stake ERC20 tokens and earn loyalty badges in the form of ERC1155 NFTs (Basic, Plus, Premium) based on their staking duration and amount.

## 🧱 Tech Stack

- [Hardhat](https://hardhat.org/)
- [Solidity](https://soliditylang.org/)
- [Ethers.js](https://docs.ethers.org/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- Mocha + Chai (Testing)

## 📁 Contracts

- `ReferralSystem.sol` –Referral mechanism that rewards both referrer and referee with tokens.
- `RefferralTokens.sol` –ERC20 token with onlyReferralSystem functionality.
- `StakingLPNFT.sol` – Staking logic with NFT reward mechanism (ERC1155).

## 📂 Project Structure

```
Appicoders-Assessment-Test/
├── contracts/
│   ├── ReferralSystem.sol
│   └── ReferralToken.sol
│   └── StakingLPNFT.sol
├── scripts/
│   └── DeployReferralSystem.js
│   └── DeployStakingNFT.js
├── test/
│   └── referralSystem.js (optional for Testing)
│   └── stakingWithNFT.js (optional for Testing)
├── hardhat.config.js
└── README.md
```

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/MohsinAliSolangi/Appicoders-Assessment-Test.git
cd Appicoders-Assessment-Test
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Compile Contracts

```bash
npx hardhat compile
```

### 4. Run Tests

```bash
npx hardhat test
```

If you'd like to view gas reports:

```bash
REPORT_GAS=true npx hardhat test
```

---

## 🔁 Referral System Overview

The `ReferralSystem.sol` contract enables a token-based referral mechanism using a custom mintable ERC20 token.

### 🎯 Key Features

- One-time registration for each user
- Circular referrals are prevented
- Referrer and referee both receive token rewards
- Admin (owner) can update reward values

### 📜 Functions

- `recordReferral(referee, referrer)` – Registers a new referral and distributes rewards.
- `getReferrals(referrer)` – Returns all addresses referred by a given user.
- `updateRewards(referrerReward, refereeReward)` – Admin can modify reward amounts.

### 🎁 Reward Amounts

| Role      | Default Reward |
|-----------|----------------|
| Referrer  | 5 Tokens       |
| Referee   | 10 Tokens      |

---

## 🪙 Staking & NFT Badge System

The `StakingLPNFT.sol` contract allows users to stake tokens and receive NFTs as proof of staking and performance.

### 🛠 Mechanics

- Points accumulate as `amount * duration (in days)`
- LP NFTs are minted upon staking
- Badges are earned based on point thresholds:

| Badge   | Points Required |
|---------|-----------------|
| Basic   | 1000+           |
| Plus    | 5000+           |
| Premium | 10000+          |

---

## 🧪 Example Commands

```bash
npx hardhat test
npx hardhat run scripts/deploy.js --network hardhat
```

> You can use Hardhat's local blockchain to simulate time passage using `evm_increaseTime` and `evm_mine` in tests.

---

## 📜 License

This project is licensed under the MIT License.

---

## 🙌 Author

**Mohsin Ali Solangi**  
[GitHub Profile](https://github.com/MohsinAliSolangi)

---
```