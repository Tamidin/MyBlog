 var mongoskin = require('mongoskin');
 var db = mongoskin.db('mongodb://localhost:27017/blog?auto_reconnect', {safe:true});

module.exports = function(collection) {
	this.collection = db.collection(collection);

	this.getlist = function(query, sort, callback) {
		this.collection.find(query || {}).sort(sort || {}).toArray(callback);
	};

	this.find = function(query, callback) {
		if (query._id) query._id = db.ObjectID.createFromHexString(query._id);
		this.collection.findOne(query, callback);
	};

	this.insert = function(query, callback) {
		this.collection.insert(query, callback);
	}

	this.remove = function(query, callback) {
		if (query._id) query._id = db.ObjectID.createFromHexString(query._id);
		this.collection.remove(query, callback);
	}

	this.update = function(query, data, callback) {
		if (query._id) query._id = db.ObjectID.createFromHexString(query._id);
		this.collection.update(query, data, callback);	
	}
}

