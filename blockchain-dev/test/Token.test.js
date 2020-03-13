import { tokens, EVM_REVERT } from "./helpers"

const Token = artifacts.require('./Token')

require("chai")
    .use(require('chai-as-promised'))
    .should()

contract("Token", ([deployer, receiver]) => {
    const name = "DApp Token"
    const symbol = "DAPP"
    const decimals = '18'
    const totalSupply = tokens(1000000).toString()
    let token

    

    beforeEach(async () => {
        token = await Token.new()
    })

    describe('deployment', () => {
        it('tracks the name', async () => {
            const result = await token.name()
            result.should.equal(name)
        })
        
        it('tracks the symbol', async () => {
            const result = await token.symbol()
            result.should.equal(symbol)
        })

        it('tracks the decimals', async () => {
            const result = await token.decimals()
            result.toString().should.equal(decimals)
        })

        it('tracks the total supply', async () => {
            const result = await token.totalSupply()
            result.toString().should.equal(totalSupply.toString())
        })

        it('assigns the total supply to the developer', async () => {
            const result = await token.balanceOf(deployer)
            result.toString().should.equal(totalSupply.toString())
        })
    })

    describe('sending tokens', () => {
        let result;
        let amount;

        describe('success', async () => {
            beforeEach(async () => {
                amount = tokens(100)
                result = await token.transfer(receiver, amount, {from: deployer})
            })
    
            it('transfer tokens balances', async () => {
                let balanceOf
    
                balanceOf = await token.balanceOf(deployer)
                balanceOf.toString().should.equal(tokens(999900).toString())
                balanceOf = await token.balanceOf(receiver)
                balanceOf.toString().should.equal(tokens(100).toString())
                
            })
    
            it('emit a transfer event', async () => {
                // console.log(result.logs)
                const log = result.logs[0]
                log.event.should.eq("Transfer")
                const event = log.args
                event.from.toString().should.equal(deployer, 'from is correct')
                event.to.should.equal(receiver, 'to is correct')
                event["2"].toString().should.equal(amount.toString(), 'value is correct')
            })
        })

        describe('failure', async () => {
            it('rejects insufficient balances', async () => {
                let invalidAmount
                invalidAmount = tokens(100000000)
                await token.transfer(receiver, invalidAmount, {from: deployer}).should.be.rejectedWith(EVM_REVERT)

                // Attempt transfer tokens, when you have one
                invalidAmount = tokens(10)
                await token.transfer(deployer, invalidAmount, {from: receiver}).should.be.rejectedWith(EVM_REVERT)
            })

            it('rejects invalid recipients', async () => {
                await token.transfer(0x0, amount, {from: deployer}).should.be.rejected
            })
        })
        

    })
})