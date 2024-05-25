| **Title**                                                        | SWC ID |  Severity | Contract |   Function Name  | PC Address |   Gas Usage  |      In File      |
| :--------------------------------------------------------------- | :----: | :-------: | :------: | :--------------: | :--------: | :----------: | :---------------: |
| [Dependence on predictable environment variable](#description-0) |   120  |   🟢 Low  |   Numen  | execute(address) |     404    | 2074 - 37669 | ./NumenCTF.sol:46 |
| [State access after external call](#description-1)               |   107  | 🟡 Medium |   Numen  | execute(address) |     730    | 9804 - 66718 | ./NumenCTF.sol:57 |

## Description for [Dependence on predictable environment variable](#description-0)
A control flow decision is made based on The block.number environment variable. The block.number environment variable is used to determine a control flow decision.

❗ Note that the values of variables like coinbase, gaslimit, block number and timestamp are predictable and can be manipulated by a malicious miner.

❗ Also keep in mind that attackers know hashes of earlier blocks. Don't use any of those environment variables as sources of randomness and be aware that use of these variables introduces a certain level of trust into miners.

#### 📝 Code Snippet
```solidity
require(b == block.number)
```

#### 🗂 Initial State
```
Account: [CREATOR],
balance: 0x0,
nonce:0,
storage:{}
Account: [ATTACKER],
balance: 0x0,
nonce:0,
storage:{}
```

#### 🔄 Transaction Sequence
```
- Caller: [CREATOR],
- calldata: ,
- decoded_data: ,
- value: 0x0
- Caller: [CREATOR],
- function: execute(address),
txdata: 0x4b64e4920000000000000000000000000000000000000000000000000000000000000000,
decoded_data: ('0x0000000000000000000000000000000000000000',),
value: 0x0
```


## Description for [State access after external call](#description-1)
The contract account state is accessed after an external call to a user defined address.

💡 To prevent reentrancy issues, consider accessing the state only before the call, especially if the callee is untrusted. Alternatively, a reentrancy lock can be used to prevent untrusted callees from re-entering the contract in an intermediate state.

#### 📝 Code Snippet
```solidity
owner
```

#### 🗂 Initial State
```
Account: [CREATOR],
balance: 0x0,
nonce:0,
storage:{}
Account: [ATTACKER],
balance: 0x0,
nonce:0,
storage:{}
```

#### 🔄 Transaction Sequence
```
- Caller: [CREATOR],
- calldata: ,
- decoded_data: ,
- value: 0x0
- Caller: [ATTACKER],
- function: execute(address),
txdata: 0x4b64e492000000000000000000000000deadbeefdeadbeefdeadbeefdeadbeefdeadbeef,
decoded_data: ('0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',),
value: 0x0
```

