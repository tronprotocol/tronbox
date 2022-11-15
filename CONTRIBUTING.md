
##Contributing

1. Fork this repository.

2. Clone your forked repo recursively, to include submodules, for example:
```shell script
git clone --recurse-submodules -j8 git@github.com:sullof/tronbox.git
```
3. If you use nvm for Node, please install Node >=8:
```shell script
nvm install v8.16.0
nvm use v8.16.0
```
4. Install the project's dependencies:
```shell script
npm install
```
5. During the development, for better debugging, you can run the unbuilt version of TronBox, for example
```shell script
./tronbox.dev migrate --reset
```
