
var providers = {};

var HttpProvider = function(nodeURI){

    if(!nodeURI) throw new Error('No http connection info provided');

    this.connection = nodeURI;

    return { connected : true };  // Return argument has no relation to what would be returned in reality

};

providers.HttpProvider = HttpProvider;

module.exports = providers;