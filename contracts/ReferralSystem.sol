// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface ICustomERC20 {
    function mint(address to, uint256 amount) external;
}

contract ReferralSystem is Ownable, ReentrancyGuard {
    ICustomERC20 public token;

    uint256 public REFEREE_REWARD = 10 ether;
    uint256 public REFERRER_REWARD = 5 ether;

    struct User {
        address referrer;
        uint256 totalReferrals;
    }

    mapping(address => User) public users;
    mapping(address => address[]) private _referrals;

    event ReferralRecorded(address indexed referee, address indexed referrer);
    event RewardsDistributed(address indexed receiver, uint256 amount);
    event RewardsUpdated(uint256 newReferrerReward, uint256 newRefereeReward);

    constructor(address _token) Ownable(msg.sender) {
        require(_token != address(0), "Token address cannot be zero");
        token = ICustomERC20(_token);
    }

    function recordReferral(
        address referee,
        address referrer
    ) external nonReentrant {
        require(referee != address(0), "Invalid referee address");
        require(referrer != address(0), "Invalid referrer address");
        require(referee != referrer, "Self-referral prohibited");
        require(users[referee].referrer == address(0), "Already registered");

        address current = referrer;
        while (current != address(0)) {
            require(current != referee, "Circular referral detected");
            current = users[current].referrer;
        }

        users[referee] = User(referrer, 0);
        users[referrer].totalReferrals += 1;
        _referrals[referrer].push(referee);

        _mintReward(referrer, REFERRER_REWARD);
        _mintReward(referee, REFEREE_REWARD);

        emit ReferralRecorded(referee, referrer);
    }

    function getReferrals(
        address referrer
    ) external view returns (address[] memory) {
        return _referrals[referrer];
    }

    function _mintReward(address recipient, uint256 amount) private {
        require(amount > 0, "Invalid reward amount");
        token.mint(recipient, amount);
        emit RewardsDistributed(recipient, amount);
    }

    function updateRewards(
        uint256 _referrerReward,
        uint256 _refereeReward
    ) external onlyOwner {
        require(_referrerReward > 0, "Referrer reward must be > 0");
        require(_refereeReward > 0, "Referee reward must be > 0");
        REFEREE_REWARD = _refereeReward;
        REFERRER_REWARD = _referrerReward;
        emit RewardsUpdated(_referrerReward, _refereeReward);
    }
}
