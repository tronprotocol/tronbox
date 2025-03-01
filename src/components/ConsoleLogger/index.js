const { TronWeb, utils } = require('tronweb');

const CONSOLE_ADDRESS = '41000000000000000000636f6e736f6c652e6c6f67'; // toHex("console.log")

const ConsoleLogs = {
  '0x51973ec9': 'log()',
  '0x2c2ecbc2': 'log(address)',
  '0xdaf0d4aa': 'log(address,address)',
  '0x018c84c2': 'log(address,address,address)',
  '0x665bf134': 'log(address,address,address,address)',
  '0x0e378994': 'log(address,address,address,bool)',
  '0xf808da20': 'log(address,address,address,string)',
  '0x94250d77': 'log(address,address,address,uint256)',
  '0xf2a66286': 'log(address,address,bool)',
  '0x9f1bc36e': 'log(address,address,bool,address)',
  '0x2cd4134a': 'log(address,address,bool,bool)',
  '0xaa6540c8': 'log(address,address,bool,string)',
  '0x3971e78c': 'log(address,address,bool,uint256)',
  '0x007150be': 'log(address,address,string)',
  '0x8f736d16': 'log(address,address,string,address)',
  '0x6f1a594e': 'log(address,address,string,bool)',
  '0x21bdaf25': 'log(address,address,string,string)',
  '0xef1cefe7': 'log(address,address,string,uint256)',
  '0x17fe6185': 'log(address,address,uint256)',
  '0x8da6def5': 'log(address,address,uint256,address)',
  '0x9b4254e2': 'log(address,address,uint256,bool)',
  '0xfdb4f990': 'log(address,address,uint256,string)',
  '0xbe553481': 'log(address,address,uint256,uint256)',
  '0x75b605d3': 'log(address,bool)',
  '0xf11699ed': 'log(address,bool,address)',
  '0x660375dd': 'log(address,bool,address,address)',
  '0xa6f50b0f': 'log(address,bool,address,bool)',
  '0x2dd778e6': 'log(address,bool,address,string)',
  '0xa75c59de': 'log(address,bool,address,uint256)',
  '0xeb830c92': 'log(address,bool,bool)',
  '0xcf394485': 'log(address,bool,bool,address)',
  '0xcac43479': 'log(address,bool,bool,bool)',
  '0xdfc4a2e8': 'log(address,bool,bool,string)',
  '0x8c4e5de6': 'log(address,bool,bool,uint256)',
  '0x212255cc': 'log(address,bool,string)',
  '0x19fd4956': 'log(address,bool,string,address)',
  '0x50ad461d': 'log(address,bool,string,bool)',
  '0x475c5c33': 'log(address,bool,string,string)',
  '0x80e6a20b': 'log(address,bool,string,uint256)',
  '0x9c4f99fb': 'log(address,bool,uint256)',
  '0xccf790a1': 'log(address,bool,uint256,address)',
  '0xc4643e20': 'log(address,bool,uint256,bool)',
  '0x0aa6cfad': 'log(address,bool,uint256,string)',
  '0x386ff5f4': 'log(address,bool,uint256,uint256)',
  '0x759f86bb': 'log(address,string)',
  '0xf08744e8': 'log(address,string,address)',
  '0x0d36fa20': 'log(address,string,address,address)',
  '0x0df12b76': 'log(address,string,address,bool)',
  '0xf7e36245': 'log(address,string,address,string)',
  '0x457fe3cf': 'log(address,string,address,uint256)',
  '0xcf020fb1': 'log(address,string,bool)',
  '0x205871c2': 'log(address,string,bool,address)',
  '0x5f1d5c9f': 'log(address,string,bool,bool)',
  '0xbc0b61fe': 'log(address,string,bool,string)',
  '0x515e38b6': 'log(address,string,bool,uint256)',
  '0xfb772265': 'log(address,string,string)',
  '0xa04e2f87': 'log(address,string,string,address)',
  '0x35a5071f': 'log(address,string,string,bool)',
  '0x5d02c50b': 'log(address,string,string,string)',
  '0x159f8927': 'log(address,string,string,uint256)',
  '0x67dd6ff1': 'log(address,string,uint256)',
  '0x63183678': 'log(address,string,uint256,address)',
  '0x0ef7e050': 'log(address,string,uint256,bool)',
  '0x448830a8': 'log(address,string,uint256,string)',
  '0x1dc8e1b8': 'log(address,string,uint256,uint256)',
  '0x8309e8a8': 'log(address,uint256)',
  '0x7bc0d848': 'log(address,uint256,address)',
  '0x478d1c62': 'log(address,uint256,address,address)',
  '0xa1bcc9b3': 'log(address,uint256,address,bool)',
  '0x1da986ea': 'log(address,uint256,address,string)',
  '0x100f650e': 'log(address,uint256,address,uint256)',
  '0x678209a8': 'log(address,uint256,bool)',
  '0xa31bfdcc': 'log(address,uint256,bool,address)',
  '0x3bf5e537': 'log(address,uint256,bool,bool)',
  '0xc5ad85f9': 'log(address,uint256,bool,string)',
  '0x22f6b999': 'log(address,uint256,bool,uint256)',
  '0xa1f2e8aa': 'log(address,uint256,string)',
  '0x5c430d47': 'log(address,uint256,string,address)',
  '0xcf18105c': 'log(address,uint256,string,bool)',
  '0x88a8c406': 'log(address,uint256,string,string)',
  '0xbf01f891': 'log(address,uint256,string,uint256)',
  '0xb69bcaf6': 'log(address,uint256,uint256)',
  '0x20e3984d': 'log(address,uint256,uint256,address)',
  '0x66f1bc67': 'log(address,uint256,uint256,bool)',
  '0x4a28c017': 'log(address,uint256,uint256,string)',
  '0x34f0e636': 'log(address,uint256,uint256,uint256)',
  '0x32458eed': 'log(bool)',
  '0x853c4849': 'log(bool,address)',
  '0xd2763667': 'log(bool,address,address)',
  '0x1d14d001': 'log(bool,address,address,address)',
  '0x46600be0': 'log(bool,address,address,bool)',
  '0xd812a167': 'log(bool,address,address,string)',
  '0x0c66d1be': 'log(bool,address,address,uint256)',
  '0x18c9c746': 'log(bool,address,bool)',
  '0x1c41a336': 'log(bool,address,bool,address)',
  '0x6a9c478b': 'log(bool,address,bool,bool)',
  '0x4a66cb34': 'log(bool,address,bool,string)',
  '0x07831502': 'log(bool,address,bool,uint256)',
  '0xde9a9270': 'log(bool,address,string)',
  '0x6f7c603e': 'log(bool,address,string,address)',
  '0xe2bfd60b': 'log(bool,address,string,bool)',
  '0xa73c1db6': 'log(bool,address,string,string)',
  '0xc21f64c7': 'log(bool,address,string,uint256)',
  '0x5f7b9afb': 'log(bool,address,uint256)',
  '0x136b05dd': 'log(bool,address,uint256,address)',
  '0xd6019f1c': 'log(bool,address,uint256,bool)',
  '0x51f09ff8': 'log(bool,address,uint256,string)',
  '0x7bf181a1': 'log(bool,address,uint256,uint256)',
  '0x2a110e83': 'log(bool,bool)',
  '0x1078f68d': 'log(bool,bool,address)',
  '0xf4880ea4': 'log(bool,bool,address,address)',
  '0xc0a302d8': 'log(bool,bool,address,bool)',
  '0xa0a47963': 'log(bool,bool,address,string)',
  '0x4c123d57': 'log(bool,bool,address,uint256)',
  '0x50709698': 'log(bool,bool,bool)',
  '0x8c329b1a': 'log(bool,bool,bool,address)',
  '0x3b2a5ce0': 'log(bool,bool,bool,bool)',
  '0x2ae408d4': 'log(bool,bool,bool,string)',
  '0x6d7045c1': 'log(bool,bool,bool,uint256)',
  '0x2555fa46': 'log(bool,bool,string)',
  '0xf9ad2b89': 'log(bool,bool,string,address)',
  '0xb857163a': 'log(bool,bool,string,bool)',
  '0x6d1e8751': 'log(bool,bool,string,string)',
  '0xe3a9ca2f': 'log(bool,bool,string,uint256)',
  '0x12f21602': 'log(bool,bool,uint256)',
  '0x54a7a9a0': 'log(bool,bool,uint256,address)',
  '0x619e4d0e': 'log(bool,bool,uint256,bool)',
  '0x7dd4d0e0': 'log(bool,bool,uint256,string)',
  '0x0bb00eab': 'log(bool,bool,uint256,uint256)',
  '0x8feac525': 'log(bool,string)',
  '0x9591b953': 'log(bool,string,address)',
  '0x2b2b18dc': 'log(bool,string,address,address)',
  '0x6dd434ca': 'log(bool,string,address,bool)',
  '0x12d6c788': 'log(bool,string,address,string)',
  '0xa5cada94': 'log(bool,string,address,uint256)',
  '0xdbb4c247': 'log(bool,string,bool)',
  '0x538e06ab': 'log(bool,string,bool,address)',
  '0xdc5e935b': 'log(bool,string,bool,bool)',
  '0x483d0416': 'log(bool,string,bool,string)',
  '0x1606a393': 'log(bool,string,bool,uint256)',
  '0xb076847f': 'log(bool,string,string)',
  '0x97d394d8': 'log(bool,string,string,address)',
  '0x1e4b87e5': 'log(bool,string,string,bool)',
  '0x1762e32a': 'log(bool,string,string,string)',
  '0x7be0c3eb': 'log(bool,string,string,uint256)',
  '0x1093ee11': 'log(bool,string,uint256)',
  '0x1596a1ce': 'log(bool,string,uint256,address)',
  '0x6b0e5d53': 'log(bool,string,uint256,bool)',
  '0x1ad96de6': 'log(bool,string,uint256,string)',
  '0x28863fcb': 'log(bool,string,uint256,uint256)',
  '0x399174d3': 'log(bool,uint256)',
  '0x088ef9d2': 'log(bool,uint256,address)',
  '0x26f560a8': 'log(bool,uint256,address,address)',
  '0xb4c314ff': 'log(bool,uint256,address,bool)',
  '0x1bb3b09a': 'log(bool,uint256,address,string)',
  '0x1537dc87': 'log(bool,uint256,address,uint256)',
  '0xe8defba9': 'log(bool,uint256,bool)',
  '0x9acd3616': 'log(bool,uint256,bool,address)',
  '0xceb5f4d7': 'log(bool,uint256,bool,bool)',
  '0x9143dbb1': 'log(bool,uint256,bool,string)',
  '0x7f9bbca2': 'log(bool,uint256,bool,uint256)',
  '0xc3fc3970': 'log(bool,uint256,string)',
  '0xfedd1fff': 'log(bool,uint256,string,address)',
  '0xe5e70b2b': 'log(bool,uint256,string,bool)',
  '0xf5bc2249': 'log(bool,uint256,string,string)',
  '0x6a1199e2': 'log(bool,uint256,string,uint256)',
  '0x37103367': 'log(bool,uint256,uint256)',
  '0x00dd87b9': 'log(bool,uint256,uint256,address)',
  '0xbe984353': 'log(bool,uint256,uint256,bool)',
  '0x8e69fb5d': 'log(bool,uint256,uint256,string)',
  '0x374bb4b2': 'log(bool,uint256,uint256,uint256)',
  '0x0be77f56': 'log(bytes)',
  '0x6e18a128': 'log(bytes1)',
  '0x013d178b': 'log(bytes10)',
  '0x04004a2e': 'log(bytes11)',
  '0x86a06abd': 'log(bytes12)',
  '0x94529e34': 'log(bytes13)',
  '0x9266f07f': 'log(bytes14)',
  '0xda9574e0': 'log(bytes15)',
  '0x665c6104': 'log(bytes16)',
  '0x339f673a': 'log(bytes17)',
  '0xc4d23d9a': 'log(bytes18)',
  '0x5e6b5a33': 'log(bytes19)',
  '0xe9b62296': 'log(bytes2)',
  '0x5188e3e9': 'log(bytes20)',
  '0xe9da3560': 'log(bytes21)',
  '0xd5fae89c': 'log(bytes22)',
  '0xaba1cf0d': 'log(bytes23)',
  '0xf1b35b34': 'log(bytes24)',
  '0x0b84bc58': 'log(bytes25)',
  '0xf8b149f1': 'log(bytes26)',
  '0x3a3757dd': 'log(bytes27)',
  '0xc82aeaee': 'log(bytes28)',
  '0x4b69c3d5': 'log(bytes29)',
  '0x2d834926': 'log(bytes3)',
  '0xee12c4ed': 'log(bytes30)',
  '0xc2854d92': 'log(bytes31)',
  '0x27b7cf85': 'log(bytes32)',
  '0xe05f48d1': 'log(bytes4)',
  '0xa684808d': 'log(bytes5)',
  '0xae84a591': 'log(bytes6)',
  '0x4ed57e28': 'log(bytes7)',
  '0x4f84252e': 'log(bytes8)',
  '0x90bd8cd0': 'log(bytes9)',
  '0x2d5b6cb9': 'log(int256)',
  '0x41304fac': 'log(string)',
  '0x319af333': 'log(string,address)',
  '0xfcec75e0': 'log(string,address,address)',
  '0xed8f28f6': 'log(string,address,address,address)',
  '0xb59dbd60': 'log(string,address,address,bool)',
  '0x800a1c67': 'log(string,address,address,string)',
  '0x8ef3f399': 'log(string,address,address,uint256)',
  '0xc91d5ed4': 'log(string,address,bool)',
  '0x223603bd': 'log(string,address,bool,address)',
  '0x79884c2b': 'log(string,address,bool,bool)',
  '0x0454c079': 'log(string,address,bool,string)',
  '0x3e9f866a': 'log(string,address,bool,uint256)',
  '0xe0e9ad4f': 'log(string,address,string)',
  '0xaabc9a31': 'log(string,address,string,address)',
  '0x5f15d28c': 'log(string,address,string,bool)',
  '0x245986f2': 'log(string,address,string,string)',
  '0x91d1112e': 'log(string,address,string,uint256)',
  '0x0d26b925': 'log(string,address,uint256)',
  '0x63fb8bc5': 'log(string,address,uint256,address)',
  '0xfc4845f0': 'log(string,address,uint256,bool)',
  '0x5a477632': 'log(string,address,uint256,string)',
  '0xf8f51b1e': 'log(string,address,uint256,uint256)',
  '0xc3b55635': 'log(string,bool)',
  '0x932bbb38': 'log(string,bool,address)',
  '0x33e9dd1d': 'log(string,bool,address,address)',
  '0x958c28c6': 'log(string,bool,address,bool)',
  '0x2d8e33a4': 'log(string,bool,address,string)',
  '0x5d08bb05': 'log(string,bool,address,uint256)',
  '0x850b7ad6': 'log(string,bool,bool)',
  '0x7190a529': 'log(string,bool,bool,address)',
  '0x895af8c5': 'log(string,bool,bool,bool)',
  '0x9d22d5dd': 'log(string,bool,bool,string)',
  '0x8e3f78a9': 'log(string,bool,bool,uint256)',
  '0xe298f47d': 'log(string,bool,string)',
  '0xe0625b29': 'log(string,bool,string,address)',
  '0x3f8a701d': 'log(string,bool,string,bool)',
  '0xa826caeb': 'log(string,bool,string,string)',
  '0x24f91465': 'log(string,bool,string,uint256)',
  '0xc95958d6': 'log(string,bool,uint256)',
  '0x935e09bf': 'log(string,bool,uint256,address)',
  '0x8af7cf8a': 'log(string,bool,uint256,bool)',
  '0x742d6ee7': 'log(string,bool,uint256,string)',
  '0x64b5bb67': 'log(string,bool,uint256,uint256)',
  '0x4b5c4277': 'log(string,string)',
  '0x95ed0195': 'log(string,string,address)',
  '0x439c7bef': 'log(string,string,address,address)',
  '0x5ccd4e37': 'log(string,string,address,bool)',
  '0xeb1bff80': 'log(string,string,address,string)',
  '0x7cc3c607': 'log(string,string,address,uint256)',
  '0xb0e0f9b5': 'log(string,string,bool)',
  '0xc371c7db': 'log(string,string,bool,address)',
  '0x40785869': 'log(string,string,bool,bool)',
  '0x5e84b0ea': 'log(string,string,bool,string)',
  '0xd6aefad2': 'log(string,string,bool,uint256)',
  '0x2ced7cef': 'log(string,string,string)',
  '0x6d572f44': 'log(string,string,string,address)',
  '0x2c1754ed': 'log(string,string,string,bool)',
  '0xde68f20a': 'log(string,string,string,string)',
  '0x8eafb02b': 'log(string,string,string,uint256)',
  '0x5821efa1': 'log(string,string,uint256)',
  '0x1023f7b2': 'log(string,string,uint256,address)',
  '0xc3a8a654': 'log(string,string,uint256,bool)',
  '0x5d1a971a': 'log(string,string,uint256,string)',
  '0xf45d7d2c': 'log(string,string,uint256,uint256)',
  '0xb60e72cc': 'log(string,uint256)',
  '0x1c7ec448': 'log(string,uint256,address)',
  '0x5ea2b7ae': 'log(string,uint256,address,address)',
  '0x82112a42': 'log(string,uint256,address,bool)',
  '0x9ffb2f93': 'log(string,uint256,address,string)',
  '0x4f04fdc6': 'log(string,uint256,address,uint256)',
  '0xca7733b1': 'log(string,uint256,bool)',
  '0xe0e95b98': 'log(string,uint256,bool,address)',
  '0x354c36d6': 'log(string,uint256,bool,bool)',
  '0xabf73a98': 'log(string,uint256,bool,string)',
  '0xe41b6f6f': 'log(string,uint256,bool,uint256)',
  '0x5970e089': 'log(string,uint256,string)',
  '0x7c4632a4': 'log(string,uint256,string,address)',
  '0x7d24491d': 'log(string,uint256,string,bool)',
  '0x5ab84e1f': 'log(string,uint256,string,string)',
  '0xc67ea9d1': 'log(string,uint256,string,uint256)',
  '0xca47c4eb': 'log(string,uint256,uint256)',
  '0xe21de278': 'log(string,uint256,uint256,address)',
  '0x7626db92': 'log(string,uint256,uint256,bool)',
  '0x854b3496': 'log(string,uint256,uint256,string)',
  '0xa7a87853': 'log(string,uint256,uint256,uint256)',
  '0xf82c50f1': 'log(uint256)',
  '0x69276c86': 'log(uint256,address)',
  '0xbcfd9be0': 'log(uint256,address,address)',
  '0x2488b414': 'log(uint256,address,address,address)',
  '0x091ffaf5': 'log(uint256,address,address,bool)',
  '0x031c6f73': 'log(uint256,address,address,string)',
  '0x736efbb6': 'log(uint256,address,address,uint256)',
  '0x9b6ec042': 'log(uint256,address,bool)',
  '0xef72c513': 'log(uint256,address,bool,address)',
  '0xe351140f': 'log(uint256,address,bool,bool)',
  '0x90fb06aa': 'log(uint256,address,bool,string)',
  '0x5abd992a': 'log(uint256,address,bool,uint256)',
  '0x63cb41f9': 'log(uint256,address,string)',
  '0x9cba8fff': 'log(uint256,address,string,address)',
  '0xcc32ab07': 'log(uint256,address,string,bool)',
  '0x3e128ca3': 'log(uint256,address,string,string)',
  '0x46826b5d': 'log(uint256,address,string,uint256)',
  '0x5a9b5ed5': 'log(uint256,address,uint256)',
  '0x15c127b5': 'log(uint256,address,uint256,address)',
  '0x5f743a7c': 'log(uint256,address,uint256,bool)',
  '0xddb06521': 'log(uint256,address,uint256,string)',
  '0x0c9cd9c1': 'log(uint256,address,uint256,uint256)',
  '0x1c9d7eb3': 'log(uint256,bool)',
  '0x35085f7b': 'log(uint256,bool,address)',
  '0xa1ef4cbb': 'log(uint256,bool,address,address)',
  '0x454d54a5': 'log(uint256,bool,address,bool)',
  '0xade052c7': 'log(uint256,bool,address,string)',
  '0x078287f5': 'log(uint256,bool,address,uint256)',
  '0x20718650': 'log(uint256,bool,bool)',
  '0x69640b59': 'log(uint256,bool,bool,address)',
  '0xb6f577a1': 'log(uint256,bool,bool,bool)',
  '0xdddb9561': 'log(uint256,bool,bool,string)',
  '0x7464ce23': 'log(uint256,bool,bool,uint256)',
  '0x85775021': 'log(uint256,bool,string)',
  '0xef529018': 'log(uint256,bool,string,address)',
  '0xeb928d7f': 'log(uint256,bool,string,bool)',
  '0x68c8b8bd': 'log(uint256,bool,string,string)',
  '0x2c1d0746': 'log(uint256,bool,string,uint256)',
  '0x20098014': 'log(uint256,bool,uint256)',
  '0x88cb6041': 'log(uint256,bool,uint256,address)',
  '0x91a02e2a': 'log(uint256,bool,uint256,bool)',
  '0xde03e774': 'log(uint256,bool,uint256,string)',
  '0xc6acc7a8': 'log(uint256,bool,uint256,uint256)',
  '0x643fd0df': 'log(uint256,string)',
  '0x7afac959': 'log(uint256,string,address)',
  '0x6168ed61': 'log(uint256,string,address,address)',
  '0x90c30a56': 'log(uint256,string,address,bool)',
  '0x9c3adfa1': 'log(uint256,string,address,string)',
  '0xe8d3018d': 'log(uint256,string,address,uint256)',
  '0x4ceda75a': 'log(uint256,string,bool)',
  '0xae2ec581': 'log(uint256,string,bool,address)',
  '0xba535d9c': 'log(uint256,string,bool,bool)',
  '0xd2d423cd': 'log(uint256,string,bool,string)',
  '0xcf009880': 'log(uint256,string,bool,uint256)',
  '0xb115611f': 'log(uint256,string,string)',
  '0xd583c602': 'log(uint256,string,string,address)',
  '0xb3a6b6bd': 'log(uint256,string,string,bool)',
  '0x21ad0683': 'log(uint256,string,string,string)',
  '0xb028c9bd': 'log(uint256,string,string,uint256)',
  '0x37aa7d4c': 'log(uint256,string,uint256)',
  '0x3b2279b4': 'log(uint256,string,uint256,address)',
  '0x691a8f74': 'log(uint256,string,uint256,bool)',
  '0xb7b914ca': 'log(uint256,string,uint256,string)',
  '0x82c25b74': 'log(uint256,string,uint256,uint256)',
  '0xf666715a': 'log(uint256,uint256)',
  '0x5c96b331': 'log(uint256,uint256,address)',
  '0x56a5d1b1': 'log(uint256,uint256,address,address)',
  '0x15cac476': 'log(uint256,uint256,address,bool)',
  '0x6cde40b8': 'log(uint256,uint256,address,string)',
  '0x88f6e4b2': 'log(uint256,uint256,address,uint256)',
  '0x4766da72': 'log(uint256,uint256,bool)',
  '0x9a816a83': 'log(uint256,uint256,bool,address)',
  '0xab085ae6': 'log(uint256,uint256,bool,bool)',
  '0xa5b4fc99': 'log(uint256,uint256,bool,string)',
  '0xeb7f6fd2': 'log(uint256,uint256,bool,uint256)',
  '0x71d04af2': 'log(uint256,uint256,string)',
  '0x42d21db7': 'log(uint256,uint256,string,address)',
  '0x7af6ab25': 'log(uint256,uint256,string,bool)',
  '0x27d8afd2': 'log(uint256,uint256,string,string)',
  '0x5da297eb': 'log(uint256,uint256,string,uint256)',
  '0xd1ed7a3c': 'log(uint256,uint256,uint256)',
  '0xfa8185af': 'log(uint256,uint256,uint256,address)',
  '0xc598d185': 'log(uint256,uint256,uint256,bool)',
  '0x59cfcbe3': 'log(uint256,uint256,uint256,string)',
  '0x193fb800': 'log(uint256,uint256,uint256,uint256)'
};

const ConsoleLogger = {
  getLogTypes: function (funcHash) {
    const func = ConsoleLogs[funcHash];
    if (func) {
      const match = func.match(/\((.*?)\)/);
      if (match) {
        return match[1].split(',');
      }
    }
    return false;
  },
  getLogMessages: function (transaction) {
    if (!transaction) return;
    const { internal_transactions } = transaction;
    if (!internal_transactions) return;

    internal_transactions.forEach(t => {
      const { transferTo_address, data } = t;
      if (!data) return;
      if (transferTo_address === CONSOLE_ADDRESS) {
        const output = `0x${data}`;
        const types = this.getLogTypes(output.slice(0, 10));
        if (!types) return;
        if (!types[0]) return console.info();

        const decode = utils.abi.decodeParams([], types, output, true);
        types.forEach((_, i) => {
          switch (_) {
            case 'uint256':
            case 'int256':
              decode[i] = decode[i].toString();
              break;
            case 'address':
              decode[i] = TronWeb.address.fromHex(decode[i]);
              break;
          }
        });
        console.info(...decode);
      }
    });
  }
};

module.exports = ConsoleLogger;
