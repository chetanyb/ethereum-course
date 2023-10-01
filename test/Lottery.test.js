const assert = require('assert');
const ganache = require('ganache');
const  Web3  = require('web3');
const web3 = new Web3(ganache.provider());

const { abi, evm } = require('../compile');

let lottery;
let accounts;

beforeEach(async () => {
    accounts = await web3.eth.getAccounts();

    lottery = await new web3.eth.Contract(abi)
        .deploy({
            data: evm.bytecode.object,
        })
        .send({
            from: accounts[1],
            gas: '1000000',
        });
});

describe('Lottery contract', () => {
    it('Deploys a contract', () => {
        assert.ok(lottery.options.address);
    });

    it('Allows an account to enter', async() => {
        await lottery.methods.enter().send({
            from: accounts[1],
            value: web3.utils.toWei('0.02', 'ether'),
        });

        const players = await lottery.methods.getPlayers().call({
            from: accounts[1],
        });

        assert.equal(accounts[1], players[0]);
        assert.equal(1, players.length);
    });

    it('Allows multiple account to enter', async() => {
        await lottery.methods.enter().send({
            from: accounts[1],
            value: web3.utils.toWei('0.02', 'ether'),
        });
        await lottery.methods.enter().send({
            from: accounts[2],
            value: web3.utils.toWei('0.02', 'ether'),
        });
        await lottery.methods.enter().send({
            from: accounts[3],
            value: web3.utils.toWei('0.02', 'ether'),
        });

        const players = await lottery.methods.getPlayers().call({
            from: accounts[1],
        });

        assert.equal(accounts[1], players[0]);
        assert.equal(accounts[2], players[1]);
        assert.equal(accounts[3], players[2]);
        assert.equal(3, players.length);
    });

    it('Requires a minimum amount of ether to enter', async() => {
        try {
      await lottery.methods.enter().send({
        from: accounts[0],
        value: 0,
      });
      assert(false);
    } catch (err) {
      assert(err);
    }
    });

    it('Managerial access only', async() => {
        try {
            await lottery.methods.pickWinner().send({
            from: accounts[2],
        });
        } catch (err) {
            assert(err);
        }
    });

    it('Awards the winner', async() => {
        await lottery.methods.enter().send({
            from: accounts[1],
            value: web3.utils.toWei('0.01', 'ether')
        });
        const initialBalance = await web3.eth.getBalance(accounts[1]);
        await lottery.methods.pickWinner().send({
            from: accounts[1],
        });

        const players = await lottery.methods.getPlayers();
        const finalBalance = await web3.eth.getBalance(accounts[1]);
        const difference = finalBalance - initialBalance;
        assert(difference > web3.utils.toWei('0.008', 'ether'));
    });
    
});