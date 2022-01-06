const {expect} = require("chai");
const {ethers} = require("hardhat");
const {utils, BigNumber} = ethers;

describe("Swap testing", function () {

    let SwapContract;
    let MockContractFactory;
    let swap;
    let owner;
    let addr1;
    let addr2;
    let addrs;

    let tokenA;
    let tokenB;
    let tokenC;
    let provider = ethers.provider;
    let zeroAddress = '0x0000000000000000000000000000000000000000';

    beforeEach(async function () {
        SwapContract = await ethers.getContractFactory("Swap");
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
        swap = await SwapContract.deploy();

        MockContractFactory = await ethers.getContractFactory("MockToken");

        tokenA = await MockContractFactory.deploy('PolkaFoundry', 'PKF', 200000000, 18);
        tokenB = await MockContractFactory.deploy('DogeCoin', 'DOGE', 10000000000, 18);
        tokenC = await MockContractFactory.deploy('Shiba Coin', "SHIBA", 500000000, 16);


        await tokenA.transfer(swap.address, 1000000);
        await tokenB.transfer(swap.address, 1000000);

        await tokenA.transfer(addr1.address, 1000);
        await tokenB.transfer(addr2.address, 200000);

        // await provider.sendTransaction(swap.address, {value: utils.parseEther("1")});

        // Whitelist token A
        await swap.whitelist(tokenA.address, 18, 50);
    });

    it("Test contract deployment & Owner", async function () {
        expect(await swap.owner()).to.equal(owner.address);
    });

    it("Test token A deploy success", async function () {
        // console.log(tokenA.address);
        //  expect(tokenA.totalSupply()).to.equal(200000000);

    });

    it("Test token B deploy success", async function () {
        // console.log(tokenB.address);

    });

    it("Test whitelist", async function () {
        await swap.whitelist(tokenB.address, 18, 20);
        let result = await swap.checkTokenWhitelist(tokenB.address);
        expect(result).to.equal(true);
    });

    it("Test whitelist & delist", async function () {
        await swap.delist(tokenA.address);
        let tokenWhitelist = await swap.checkTokenWhitelist(tokenA.address);
        expect(tokenWhitelist).to.equal(false);
    });

    it("Test initial balance", async function () {
        expect(await tokenA.balanceOf(addr1.address)).to.equal(1000)
    });

    it("Test swap token A to B", async function () {
        await swap.whitelist(tokenB.address, 18, 10);

        await tokenA.connect(addr1).approve(swap.address, utils.parseEther('1000'));
        await swap.connect(addr1).swapToken(tokenA.address, tokenB.address, 100);
        expect(await tokenA.balanceOf(addr1.address)).to.equal(1000 - 100);
        expect(await tokenA.balanceOf(swap.address)).to.equal(1000000 + 100);
        expect(await tokenB.balanceOf(addr1.address)).to.equal(100 * 50 / 10);
        expect(await tokenB.balanceOf(swap.address)).to.equal(1000000 - 100 * 50 / 10);

    });

    it("Test swap native token to token A", async function () {
        //Decimal = 0 because of utils.parseEther already multiply with 10^18
        await swap.whitelist(zeroAddress, 0, 4000);


        await swap.connect(addr1).swapToken(zeroAddress, tokenA.address, utils.parseEther('0.1'), {value: utils.parseEther('0.1')});
        expect(await tokenA.balanceOf(addr1.address)).to.equal(1000 + (0.1 * 4000 / 50));
        // expect(await tokenA.balanceOf(swap.address)).to.equal(1000000 - (0.1 * 4000 / 50));

        let swapBalance = await provider.getBalance(swap.address);
        expect(swapBalance.toString()).to.equal(utils.parseEther('0.1').toString());
    });

    it("Test swap token B to native token", async function() {
        await owner.sendTransaction({to: swap.address, value: utils.parseEther("5")});
        console.log('market value', await provider.getBalance(swap.address))
        await swap.whitelist(zeroAddress, 0, 5000);
        await swap.whitelist(tokenB.address, 18, 20);

        console.log(await addr2.getBalance());

        await tokenB.connect(addr2).approve(swap.address, utils.parseEther('1000'));
        await swap.connect(addr2).swapToken(tokenB.address, zeroAddress, 500);


        expect(await tokenB.balanceOf(addr2.address)).to.equal(200000 - 500);
        expect(await tokenB.balanceOf(swap.address)).to.equal(1000000 + 500);
        let swapBalance = await provider.getBalance(swap.address);
        expect(swapBalance.toString()).to.equal((utils.parseEther("5.0") - 500 * 20 * 10 ** 18/ 5000).toString());
    });
});
