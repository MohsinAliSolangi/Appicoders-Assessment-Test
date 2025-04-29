// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract StakingWithNFT is Ownable, ReentrancyGuard, ERC1155 {
    IERC20 public stakingToken;
    uint256 public nextStakeId;

    enum Tier {
        None,
        Basic,
        Plus,
        Premium
    }

    struct Stake {
        uint256 amount;
        uint256 timestamp;
        bool basicMinted;
        bool plusMinted;
        bool premiumMinted;
    }

    mapping(address => mapping(uint256 => Stake)) public stakes;
    mapping(address => uint256[]) public userStakeIds;

    uint256 public constant BADGE_BASIC = 1001;
    uint256 public constant BADGE_PLUS = 1002;
    uint256 public constant BADGE_PREMIUM = 1003;

    event Staked(address indexed user, uint256 amount, uint256 stakeId);
    event BadgeMinted(address indexed user, uint256 badgeId);
    event Withdrawn(address indexed user, uint256 amount, uint256 stakeId);

    constructor(
        address _stakingToken,
        string memory uri
    ) ERC1155(uri) Ownable(msg.sender) {
        stakingToken = IERC20(_stakingToken);
    }

    function stake(uint256 amount) external nonReentrant {
        require(amount > 0, "Cannot stake 0");

        stakingToken.transferFrom(msg.sender, address(this), amount);

        uint256 stakeId = nextStakeId++;

        stakes[msg.sender][stakeId] = Stake({
            amount: amount,
            timestamp: block.timestamp,
            basicMinted: false,
            plusMinted: false,
            premiumMinted: false
        });

        userStakeIds[msg.sender].push(stakeId);

        // Mint LP NFT using stakeId as unique identifier
        _mint(msg.sender, stakeId, 1, "");

        emit Staked(msg.sender, amount, stakeId);
    }

    function calculatePoints(
        address user,
        uint256 stakeId
    ) public view returns (uint256) {
        Stake storage s = stakes[user][stakeId];
        uint256 duration = block.timestamp - s.timestamp;
        return (s.amount * duration) / 1 days; // 1 point per token per day
    }

    function redeemBadge(uint256 stakeId) external nonReentrant {
        Stake storage s = stakes[msg.sender][stakeId];
        uint256 points = calculatePoints(msg.sender, stakeId);

        // Prevent claiming any lower tier after a higher one is minted
        require(!s.premiumMinted, "Already claimed Premium");
        require(
            !(s.plusMinted && points < 10000 ether),
            "Already claimed Plus"
        );
        require(
            !(s.basicMinted && points < 5000 ether),
            "Already claimed Basic"
        );

        if (points >= 10000 ether && !s.premiumMinted) {
            s.premiumMinted = true;
            _mint(msg.sender, BADGE_PREMIUM, 1, "");
            emit BadgeMinted(msg.sender, BADGE_PREMIUM);
        } else if (points >= 5000 ether && !s.plusMinted) {
            s.plusMinted = true;
            _mint(msg.sender, BADGE_PLUS, 1, "");
            emit BadgeMinted(msg.sender, BADGE_PLUS);
        } else if (points >= 1000 ether && !s.basicMinted) {
            s.basicMinted = true;
            _mint(msg.sender, BADGE_BASIC, 1, "");
            emit BadgeMinted(msg.sender, BADGE_BASIC);
        } else {
            revert("Tier not reached or already redeemed");
        }
    }

    function withdraw(uint256 stakeId) external nonReentrant {
        Stake storage s = stakes[msg.sender][stakeId];
        require(s.amount > 0, "No stake found");

        uint256 amount = s.amount;
        s.amount = 0;

        stakingToken.transfer(msg.sender, amount);

        // Burn the LP NFT for this stake
        _burn(msg.sender, stakeId, 1);

        emit Withdrawn(msg.sender, amount, stakeId);
    }

    function getUserStakeIds(
        address user
    ) external view returns (uint256[] memory) {
        return userStakeIds[user];
    }

    function getStakeInfo(
        address user,
        uint256 stakeId
    ) external view returns (Stake memory) {
        return stakes[user][stakeId];
    }

    function uri(uint256 id) public view override returns (string memory) {
        return
            string(
                abi.encodePacked(super.uri(id), Strings.toString(id), ".json")
            );
    }
}
