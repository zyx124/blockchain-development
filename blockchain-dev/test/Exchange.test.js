import { tokens, ether, EVM_REVERT, ETHER_ADDRESS} from "./helpers"

const Token = artifacts.require('./Token')
const Exchange = artifacts.require('./Exchange')

require("chai")
    .use(require('chai-as-promised'))
    .should()

contract("Exchange", ([deployer, feeAccount, user1]) => {
    let token
    let exchange
    const feePercent = 10

    beforeEach(async () => {
        // Deploy token
        token = await Token.new()

        // Transfer token to user1
        token.transfer(user1, tokens(100), {from: deployer})

        //Deploy exchange 
        exchange = await Exchange.new(feeAccount, feePercent)
        
    })

    describe('deployment', () => {
        it('tracks the fee account', async () => {
            const result = await exchange.feeAccount()
            result.should.equal(feeAccount)
        })
        
        it('tracks the fee percent', async () => {
            const result = await exchange.feePercent()
            result.toString().should.equal(feePercent.toString())
        })
    })

    describe('fallback', () => {
        it('reverts when Ether is sent', async () => {
            await exchange.sendTransaction({value: 1, from: user1}).should.be.rejectedWith(EVM_REVERT)
        })
    })

    describe('deposit Ethers', async () => {
        let result
        let amount 

        beforeEach(async () => {
            amount = ether(1)
            result = await exchange.depositEther({from: user1, value: amount})
        })

        it('tracks the balance', async () => {
            const balance = await exchange.tokens(ETHER_ADDRESS, user1)
            balance.toString().should.equal(amount.toString())
        })

        it('emit a Deposit event', async () => {
            // console.log(result.logs)
            const log = result.logs[0]
            log.event.should.eq("Deposit")
            const event = log.args
            event.token.toString().should.equal(ETHER_ADDRESS, 'token address is correct')
            event.user.should.equal(user1, 'user is correct')
            event.amount.toString().should.equal(amount.toString(), 'amount is correct')
            event.balance.toString().should.equal(amount.toString(), 'balance is correct')
        })
    })

    describe('withdraw ether', async () => {
        let result
        let amount 

        beforeEach(async () => {
            // Deposit ether first
            amount = ether(1)
            await exchange.depositEther({from: user1, value: amount})
        })

        describe('success', async () => {
            beforeEach(async () => {
                // Withdraw ether
                result = await exchange.withdrawEther(amount, {from: user1})
            })

            it('withdraw Ether funds', async () => {
                const balance = await exchange.tokens(ETHER_ADDRESS, user1)
                balance.toString().should.equal("0")
            })

            it('emit a Withdraw event', async () => {
                // console.log(result.logs)
                const log = result.logs[0]
                log.event.should.eq("Withdraw")
                const event = log.args
                event.token.toString().should.equal(ETHER_ADDRESS, 'ether address is correct')
                event.user.should.equal(user1, 'user is correct')
                event.amount.toString().should.equal(amount.toString(), 'amount is correct')
                event.balance.toString().should.equal('0', 'balance is correct')
            })
        })

        describe('failure', async () => {
            it('rejects withdraws for insufficient balances', async () => {
                await exchange.withdrawEther(ether(100), {from: user1}).should.be.rejectedWith(EVM_REVERT)
            })
        })
    })

    describe('deposting tokens', () => {
        let result
        let amount 

        describe('success', () => {
            beforeEach(async () => {
                amount = tokens(10)
                await token.approve(exchange.address, amount, {from: user1})
                result = await exchange.depositToken(token.address, amount, {from: user1})
            })

            it('tracks the token deposit', async () => {
                // check exchange token balance
                let balance
                balance = await token.balanceOf(exchange.address)
                balance.toString().should.equal(amount.toString())

                // check tokens on exchange 
                balance = await exchange.tokens(token.address, user1)
                balance.toString().should.equal(amount.toString())
            })

            it('emit a Deposit event', async () => {
                // console.log(result.logs)
                const log = result.logs[0]
                log.event.should.eq("Deposit")
                const event = log.args
                event.token.toString().should.equal(token.address, 'token address is correct')
                event.user.should.equal(user1, 'user is correct')
                event.amount.toString().should.equal(amount.toString(), 'amount is correct')
                event.balance.toString().should.equal(amount.toString(), 'balance is correct')
            })
        })

        describe('failure', () => {
            it('rejects Ehter deposits', async() => {
                await exchange.depositToken(ETHER_ADDRESS, tokens(10), {from: user1}).should.be.rejectedWith(EVM_REVERT)
            })
            it('tracks the fee account', async () => {
                await exchange.depositToken(token.address, tokens(10), {from: user1}).should.be.rejectedWith(EVM_REVERT)
            })
        })
    })

    describe('withdrawing tokens', async () => {
        let result 
        let amount 

        describe('success', async () => {
            beforeEach(async () => {
                // Deposit tokens first
                amount = tokens(10)
                await token.approve(exchange.address, amount, { from: user1 })
                await exchange.depositToken(token.address, amount, { from: user1 })
        
                // Withdraw tokens
                result = await exchange.withdrawToken(token.address, amount, { from: user1 })
              })
        
            it('withdraws token funds', async () => {
            const balance = await exchange.tokens(token.address, user1)
            balance.toString().should.equal('0')
            })

            it('emit a Withdraw event', async () => {
                // console.log(result.logs)
                const log = result.logs[0]
                log.event.should.eq("Withdraw")
                const event = log.args
                event.token.toString().should.equal(token.address, 'ether address is correct')
                event.user.should.equal(user1, 'user is correct')
                event.amount.toString().should.equal(amount.toString(), 'amount is correct')
                event.balance.toString().should.equal('0', 'balance is correct')
            })
        })

        describe('failure', async () => {
            it('rejects Ether withdraws', async () => {
                await exchange.withdrawToken(ETHER_ADDRESS, tokens(10), { from: user1 }).should.be.rejectedWith(EVM_REVERT)
              })
        })
    })
})

