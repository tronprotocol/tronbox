
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
      privateKey: 'da146374a75310b9666e834ee4ad0866d6f4035967bfc76217c5a495fff9f0d0',
      fullHost: "https://api.trongrid.io",
      network_id: "1"
    }
  }
};
```

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
bash scripts/migrate.sh
```
It will execute the migration, retrieve the contract address and save it in the file `src/js/metacoin-config.js`

### 3. Run the Dapp
```
npm run dev
```
### 4. Enjoy your working Tron Dapp!



