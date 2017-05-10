var express = require('express');
var router = express.Router();

var mongodb = require('mongodb');
var assert = require('assert');
var validate = require('url-validator');

var MongoClient = mongodb.MongoClient;
// for mlab
var mongoUrl = process.env.MONGOLAB_URI;
// for local testing
// var mongoUrl = 'mongodb://localhost:27017/myproject';

var insertDocuments = function(db, documents, callback) {
  // Get the documents collection
  var collection = db.collection('documents');
  // Insert some documents
  collection.insertMany(documents, function(err, result) {
    assert.equal(err, null);
    console.log("Inserted", documents);
    callback(result);
  });
};

var findDocuments = function(db, callback) {
  // Get the documents collection
  var collection = db.collection('documents');
  // Find some documents
  collection.find({}).toArray(function(err, docs) {
    assert.equal(err, null);
    console.log("Found the following records");
    console.log(docs)
    callback(docs);
  });
}

var findDocumentsQuery = function(db, query, callback) {
  // Get the documents collection
  var collection = db.collection('documents');
  // Find some documents
  collection.find(query).toArray(function(err, docs) {
    assert.equal(err, null);
    console.log("Found the following records");
    console.log(docs);
    callback(docs);
  });
}


/* GET home page. */
router.get('/:url*', function(req, res, next) {
  var url = req.params.url + req.params[0];
  var isUrl = validate(url);

  MongoClient.connect(mongoUrl, function (err, db) {
  if (err) {
    console.log('Unable to connect to the mongoDB server. Error:', err);
  } else {
    console.log('Connection established to', mongoUrl);
    findDocuments(db, function(docs) {
      var id = docs.length;
      if (isUrl) {
        // if the parameter is a url, store the data and return the shortened url
        var document = {
          url: url,
          id: id
        };
        var documents = [document];
        insertDocuments(db, documents, function() {
          db.close();
          var fullUrl = req.protocol + '://' + req.get('host') + '/api/' + id;
          res.send({url: fullUrl});
        });
      } else {
        // if parameter is not a url, search db for matching field
        var query = {"id": Number(url)};
        console.log(query);
        findDocumentsQuery(db, query, function(docs) {
          if (docs[0]) {
            res.redirect(docs[0].url);
          } else {
            res.send({error: "Error: url not found."})
          }
          db.close();
        });
      }

    });


  }
});
});

module.exports = router;
