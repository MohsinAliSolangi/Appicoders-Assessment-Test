require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  settings: {
    evmVersion: "shanghai",
  },
  networks: {
    hardhat: {
      // forking: {
      //   url: "https://bsc-dataseed.binance.org/"
      // }
    }
  }
};
