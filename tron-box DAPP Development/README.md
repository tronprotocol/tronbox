
# Tron-Box Dapp Development Instance

This appendix mainly introduces the development of the front-end interactive Dapp based on Tron-Box. The following is a detailed step by step decomposition. 

## Project Creation and Initialization

### 1. Create Project
```
$ mkdir Dapp-demo
```
### 2. Initialize Dapp by invoking the below command (image: successful Dapp initialization record)

```
$ cd Dapp-demo
```
```
$ tronbox init
```

Remarks:

**contracts**: Used to place contracts<br> 
**migrate**: Script for storing the migration contract<br>
**test**: Used to store written test scripts<br>
**tronbox.js**: The information about the network configure is stored, which will be explained in the next section (Configuring Network Information)<br>


### 3. Configure Network Information

Network configuration is generally divided into development environment (development) and online formal production (production), but other test network environments can be added. The following is the default network configuration information of Tron-Box:

```
module.exports = {
  networks: {
    development: {
      from: 'TPL66VK2gCXNCD7EJg9pgJRfqcRazjhUZY',
      privateKey: 'da146374a75310b9666e834ee4ad0866d6f4035967bfc76217c5a495fff9f0d0',
      consume_user_resource_percent: 30,
      fee_limit: 100000000,
      fullNode: "https://api.trongrid.io:8090",
      solidityNode: "https://api.trongrid.io:8091",
      eventServer: "https://api.trongrid.io",
      network_id: "*" // Match any network id
    }
  }
};
```

Below describes the meaning of each parameter in the network configuration:<br>

**from**: Primary account address for contract deployment (base58)<br>
**privateKey**: Private key corresponding to the contract deployment master account<br>
**consume_user_resource_percent**: Parameters for deployment; can use default settings<br>
**fee_limit**: Parameters for deployment; can use default settings<br>
**fullNode**: The URL of a Tron full node. In the example, the url refers to a test environment which is reset daily.<br>
**solidityNode**: The URL of solidity node synced with the full node above.<br>
**eventServer**: The URL of the contract deployment destination event monitoring service (Need to be on same IP as the API server, otherwise the event callback cannot be monitored. For example, the API service address is http://127.0.0.1:8090, then the event listener service address is http://127.0.0.1:****)<br>
**network_id**: Can use default settings<br>

**host**: Contract deployment destination IP address (This IP needs to start FullNode node service)<br>
**port**: The port corresponding to contract deployment destination IP address API (port number corresponding to FullNode node API service)<br>

## Unbox the MetaCoin example

Instead of creating a Dapp from scratch, you can simply modify an existent example.

### 1. Download and install a Tron box

```
mkdir metacoin
cd metacoin
tronbox unbox metacoin
npm install
```

### 2. Test tronbox commands
```
tronbox compile
tronbox migrate
tronbox test
```

### 2. Load the example Dapp

To work, the Dapp need to know the address where the MetaCoin contract has been deployed. You can set it manually in the code, but the easy way is to execute

```
scripts/migrate.sh
```
It will execute the migration, retrieve the contract address and save it in the file `src/js/metacoin-config.js`

### 3. Run the Dapp
```
npm run dev
```
### 4. Enjoy your working Tron Dapp!



