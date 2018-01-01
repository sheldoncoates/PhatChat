
module.exports = {
	getCollection: function(collectionName) {
		return require('./' + collectionName + '.js');
	}
}
