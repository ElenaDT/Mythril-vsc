import { markdownTable } from 'markdown-table';

// Vulnerabilities data
let vulnerabilities = [
  {
    title: 'Dependence on predictable environment variable',
    swcId: 120,
    severity: 'Low',
    contract: 'Numen',
    functionName: 'execute(address)',
    pcAddress: 404,
    gasUsage: '2074 - 37669',
    description: `A control flow decision is made based on The block.number environment variable. The block.number environment variable is used to determine a control flow decision.

❗ Note that the values of variables like coinbase, gaslimit, block number and timestamp are predictable and can be manipulated by a malicious miner.

❗ Also keep in mind that attackers know hashes of earlier blocks. Don't use any of those environment variables as sources of randomness and be aware that use of these variables introduces a certain level of trust into miners.`,
    inFile: './NumenCTF.sol:46',
    codeSnippet: 'require(b == block.number)',
    initialState: `Account: [CREATOR],\nbalance: 0x0,\nnonce:0,\nstorage:{}\nAccount: [ATTACKER],\nbalance: 0x0,\nnonce:0,\nstorage:{}`,
    transactionSequence: `- Caller: [CREATOR],\n- calldata: ,\n- decoded_data: ,\n- value: 0x0\n- Caller: [CREATOR],\n- function: execute(address),\ntxdata: 0x4b64e4920000000000000000000000000000000000000000000000000000000000000000,\ndecoded_data: ('0x0000000000000000000000000000000000000000',),\nvalue: 0x0`
  },
  {
    title: 'State access after external call',
    swcId: 107,
    severity: 'Medium',
    contract: 'Numen',
    functionName: 'execute(address)',
    pcAddress: 730,
    gasUsage: '9804 - 66718',
    description: `The contract account state is accessed after an external call to a user defined address.

💡 To prevent reentrancy issues, consider accessing the state only before the call, especially if the callee is untrusted. Alternatively, a reentrancy lock can be used to prevent untrusted callees from re-entering the contract in an intermediate state.`,
    inFile: './NumenCTF.sol:57',
    codeSnippet: 'owner',
    initialState: `Account: [CREATOR],\nbalance: 0x0,\nnonce:0,\nstorage:{}\nAccount: [ATTACKER],\nbalance: 0x0,\nnonce:0,\nstorage:{}`,
    transactionSequence: `- Caller: [CREATOR],\n- calldata: ,\n- decoded_data: ,\n- value: 0x0\n- Caller: [ATTACKER],\n- function: execute(address),\ntxdata: 0x4b64e492000000000000000000000000deadbeefdeadbeefdeadbeefdeadbeefdeadbeef,\ndecoded_data: ('0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',),\nvalue: 0x0`
  }
];

// Severity icons
const severityIcons = {
  'Low': '🟢',
  'Medium': '🟡',
  'High': '🔴',
  'Critical': '🚨'
};

// Markdown table headers
const markdownHeaders = ['**Title**', 'SWC ID', 'Severity', 'Contract', 'Function Name', 'PC Address', 'Gas Usage', 'In File'];

// Data for the markdown table
const markdownData = vulnerabilities.map((vulnerability, index) => [
  `[${vulnerability.title}](#description-${index})`,
  vulnerability.swcId.toString(),
  `${severityIcons[vulnerability.severity]} ${vulnerability.severity}`,
  vulnerability.contract,
  vulnerability.functionName,
  vulnerability.pcAddress.toString(),
  vulnerability.gasUsage,
  vulnerability.inFile
]);

// Generate the markdown table
const markdownTableContent = markdownTable([markdownHeaders, ...markdownData], {
  align: ['l', 'c', 'c', 'c', 'c', 'c', 'c', 'c']
});

// Generate descriptions
const markdownDescriptions = vulnerabilities.map((vulnerability, index) => `
## Description for [${vulnerability.title}](#description-${index})
${vulnerability.description}

#### 📝 Code Snippet
\`\`\`solidity
${vulnerability.codeSnippet}
\`\`\`

#### 🗂 Initial State
\`\`\`
${vulnerability.initialState}
\`\`\`

#### 🔄 Transaction Sequence
\`\`\`
${vulnerability.transactionSequence}
\`\`\`
`).join('\n');

// Combine table and descriptions
const markdownContent = markdownTableContent + '\n' + markdownDescriptions;

// Output the final markdown content
console.log(markdownContent);