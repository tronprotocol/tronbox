# Table of Contents
- [Verifying the PGP signature](https://github.com/jz2120100058/tronbox/blob/master/FURTHER_INFO.md#verifying-the-pgp-signature)
- [Tron Solidity versions supported by TronBox](https://github.com/jz2120100058/tronbox/blob/master/FURTHER_INFO.md#tron-solidity-versions-supported-by-tronbox)

---

## Verifying the PGP signature

Follow these steps to verify the PGP signature:
1. Install the npm [pkgsign](https://www.npmjs.com/package/pkgsign#installation).

2. Get the version of tronbox dist.tarball

```shell
$ npm view tronbox dist.tarball
https://registry.npmjs.org/tronbox/-/tronbox-2.7.25.tgz
```
3. Get the tarball

```shell
wget https://registry.npmjs.org/tronbox/-/tronbox-2.7.25.tgz
```

4. Verify the tarball

```shell
$ pkgsign verify tronbox-2.7.25.tgz --package-name tronbox
extracting unsigned tarball...
building file list...
verifying package...
package is trusted
```
You can find the signature public key [here](https://keybase.io/tronbox/pgp_keys.asc).

## Tron Solidity Versions supported by TronBox

```
0.4.24
0.4.25
0.5.4
0.5.8
0.5.9
0.5.10
0.5.12
0.5.13
0.5.14
0.5.15
0.5.16
0.5.17
0.5.18
0.6.0
0.6.2
0.6.8
0.6.12
0.6.13
0.7.0
0.7.6
0.7.7
0.8.0
0.8.6
0.8.7
0.8.11
```

For more versions details: https://github.com/tronprotocol/solidity/releases
