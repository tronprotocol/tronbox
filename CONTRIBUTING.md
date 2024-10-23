## Contributing

Please follow these steps to contribute:

1. Fork this repository.

2. Clone your forked repository recursively to include submodules.

For example:

```shell script
git clone --recurse-submodules -j8 git@github.com:sullof/tronbox.git
```

3. If you use nvm for Node, install Node with a version higher than 8.0:

```shell script
nvm install v8.16.0
nvm use v8.16.0
```

4. Install your project's dependencies:

```shell script
npm install
```

5. For better debugging during development, run the unbuilt version of TronBox.

For example:

```shell script
./tronbox.dev migrate --reset
```
