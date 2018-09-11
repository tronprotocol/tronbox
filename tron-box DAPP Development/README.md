
# Tron-Box Dapp Development Instance

This appendix mainly introduces the development of the front-end interactive Dapp based on Tron-Box. The following is a detailed step by step decomposition. 

## Project Creation and Initialization

1. Create Project
```
$ mkdir Dapp-demo
```
2. Initialize Dapp by invoking the below command (image: successful Dapp initialization record)

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


3. Configure Network Information

Network configuration is generally divided into development environment (development) and online formal production (production), but other test network environments can be added. The following is the default network configuration information of Tron-Box:

Below describes the meaning of each parameter in the network configuration:<br>

**from**: Primary account address for contract deployment (base58)<br>
**privateKey**: Private key corresponding to the contract deployment master account<br>
**consume_user_resource_percent**: Parameters for deployment; can use default settings<br>
**fee_limit**: Parameters for deployment; can use default settings<br>
**host**: Contract deployment destination IP address (This IP needs to start FullNode node service)<br>
**port**: The port corresponding to contract deployment destination IP address API (port number corresponding to FullNode node API service)<br>
**eventServer**: The URL of the contract deployment destination event monitoring service (Need to be on same IP as the API server, otherwise the event callback cannot be monitored. For example, the API service address is http://127.0.0.1:8090, then the event listener service address is http://127.0.0.1:****)<br>
**network_id**: Can use default settings<br>

4. Manually create in the current directory of the project, package.json. For example, execute later npm install:

```
{
 "name": "test-dapp",
  "version": "1.0.0",
  "description": "this is a test dapp",
  "main": "tronbox.js",
  "directories": {
    "test": "test"
  },
  "scripts": {
    "dev": "lite-server",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "author": "alinger",
  "license": "ISC",
  "devDependencies": {
    "lite-server": "^2.3.0"
  }
}

```
5. Create a front-end resource file directory (src), and a list of resource file directories. Example below:

6. Manually create a resource dependency file in the root directory to configure bs-config.json

7. Write front-end code

8. Operation

Execute the command <npm run dev> to start the service. The following is an appendix to the code:






