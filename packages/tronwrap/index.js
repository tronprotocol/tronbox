var _TronWeb = require("./tron-web/dist/TronWeb.node");
var instance;

function TronWrap() {

    this._getNetwork = _getNetwork;
    this._getAccounts = _getAccounts;
    this._toNumber = toNumber;
    this.EventList = [];
    this.filterMatchFunction = filterMatchFunction;
    for (var key in _TronWeb) {
        if (_TronWeb.hasOwnProperty(key) === true) {
            this[key] = _TronWeb[key];
        }
    }
    instance = this;
    return instance;
}

function _getNetwork(callback) {
    callback && callback(null, '*');
}

function _getAccounts(callback) {
    callback && callback(null, ['TPL66VK2gCXNCD7EJg9pgJRfqcRazjhUZY']);
}

function toNumber(value) {
    if (!value) return null;
    if ((typeof value == 'string') && value.indexOf('0x') <= -1) {
        value = '0x' + value;
    } else {
        value = value.toNumber();
    }
    return value;
}

function filterMatchFunction(method, abi) {
    let methodObj = abi.filter((item) => item.name == method);
    if (methodObj == null || methodObj.length == 0) {
        return null;
    }
    methodObj = methodObj[0];
    let parametersObj = methodObj.inputs.map((item) => item.type);
    return {
        function: methodObj.name + '(' + parametersObj.join(',') + ')',
        parameter: parametersObj,
        methodName: methodObj.name,
        methodType: methodObj.type
    }
}

function initTronWrap(options) {

    if (instance) {
        return instance
    }

    // console.log('options', options)
    //
    //
    TronWrap.prototype = new _TronWeb(
        options.fullNode,
        options.solidityNode,
        options.eventServer,
        options.privateKey
    );

    // TronWrap.prototype.setHttpProvider = function (options) {
    //     if (!options) return;
    //     if (options.host && options.port) {
    //         if (options.host.indexOf("http") >= 0 || options.host.indexOf("https") >= 0) {
    //             this.apiUrl = options.host + ":" + options.port;
    //         } else {
    //             this.apiUrl = "http://" + options.host + ":" + options.port;
    //         }
    //     }
    //     if (options.eventServer && options.eventServer != "") {
    //         this.setEventServer(options.eventServer);
    //     } else {
    //         this.setEventServer();
    //     }
    //     //设置默认账户
    //     if (options.from) {
    //         this.defaultAccount = options.from;
    //     }
    //     //设置默认pk
    //     if (options.privateKey) {
    //         this.defaultPk = options.privateKey;
    //     }
    // }

// TronWrap.prototype.setEventServer = function (apiUrl) {
//     if (apiUrl)
//         this.tronInfuraUrl = apiUrl;
// }

    TronWrap.prototype._getContract = function (address, callback) {
        this.getContract(address || "").then(function (contractInstance) {
            if (contractInstance) {
                callback && callback(null, contractInstance);
            } else {
                callback(new Error("no code"))
            }
        });
    }

    TronWrap.prototype._deployContract = function (option, callback) {
        var that = this;
        let myContract = this.contract(option.abi);
        //部署合约
        myContract.new({
            from: option.from,
            data: option.data,
            fee_limit: option.fee_limit || Math.pow(10, 7),
            call_value: option.call_value || option.call_value || 0,
            consume_user_resource_percent: 30
        }, option.privateKey).then(function (contractInstance) {
            if (contractInstance) {
                callback(null, contractInstance);
                option.address = contractInstance.address;
                //部署成功，设置监听
                if (option.address) {
                    that.setEventListener(option);
                }
            } else {
                callback(new Error(reason))
            }
        }).catch(function (reason) {
            console.log('失败：' + reason);
            callback(new Error(reason))
        });

    }

    TronWrap.prototype.triggerContract = function (option, callback) {
        var that = this;
        let myContract = this.contract(option.abi);
        var _instance, _transaction;

        myContract.at(option.address).then(function (instance) {
            _instance = instance;
            var args = option.args;
            if (!args || !args.length || args == '') {
                args = [];
            }
            var call_limit = {};
            if (option.call_limit) {
                call_limit = option.call_limit;
            }
            args.push({
                fee_limit: call_limit.fee_limit || option.fee_limit,
                call_value: call_limit.call_value || option.call_value || 0,
            });
            return instance[option.methodName].apply(null, args);
        }).then(function (res) {
            if (res.constant_result) {
                callback(null, res.constant_result);
            } else {
                _transaction = res.transaction;
                return _instance[option.methodName].sendTransaction(_transaction, option.privateKey);
            }
        }).then(function (resource) {
            if (resource && resource.result) {
                callback && callback(null, resource);
            }
        }).catch(function (reason) {
            callback(new Error(reason))
        });
    }

    TronWrap.prototype.setEventListener = function (option, instance, transaction) {
        var that = this;
        var abi = option.abi, myEvent;
        abi.forEach(element => {
            if (element.type == 'event') {
                var event = that.EventList.filter((item) => (item.name == element.name && item.address == option.address));
                if (event && event.length) {
                    myEvent = event[0].event;
                    console.log("已设置监听:" + element.name);
                    return;
                }
                console.log("新设置监听:" + element.name);
                var myContract = that.contract(option.abi);
                myContract.at(option.address).then(function (instance) {
                    //部署成功，但是获取不到合约内容，需要截获
                    if (!instance.address) return;
                    var myEvent = instance[element.name]();
                    myEvent.watch(function (err, result) {
                        if (err && err != "") return;
                        var eventResult = "";
                        if (result && result.length) {
                            eventResult = result;
                            if (transaction) {
                                result.forEach((item) => {
                                    if (item.transaction_id == transaction.txID) {
                                        eventResult = item.result;
                                        myEvent.stopWatching();
                                    }
                                });
                            }
                            console.log('eventResult:', JSON.stringify(eventResult));
                        }
                    });
                })
                that.EventList.push({name: element.name, event: myEvent, address: option.address});
            }
        });
    }

    return new TronWrap;
}


module.exports = initTronWrap
