const express = require("express");
const IndexDatabase = require('./src/IndexDatabase');

var db = new IndexDatabase(process.env.INDEX_DATA_PATH);
var app = express();

app.use(express.json());

app.listen(process.env.EXPRESS_PORT, () => {
  console.log("API server running");
});

app.get("/GetHash/:datcat", (req, res, next) => {
  var version = req.query.version;
  if (!version)
    version = db.currentVersion;

  db.GetCat(req.params.datcat, version, function (error, category) {
    if (error) return next(error);

    res.setHeader('Content-Type', 'application/json');
    return res.send(JSON.stringify({ dataVersion: version, result: { index1: category.index1.hash, index2: category.index2.hash } }));
  });
});

app.get("/GetOffset/:datcat", (req, res, next) => {
  var version = req.query.version;
  if (!version)
    version = db.currentVersion;

  db.GetCat(req.params.datcat, version, function (error, category) {
    if (error) return next(error);

    res.setHeader('Content-Type', 'application/json');
    category.index1.GetOffsetPath(req.query.path, function (error, fileOffset) {
      if (error) return next(error);

      return res.send(JSON.stringify({ dataVersion: version, result: { path: req.query.path, offset: fileOffset } }));
    });
  });
});

app.post("/GetOffset/:datcat", (req, res, next) => {
  var version = req.query.version;
  if (!version)
    version = db.currentVersion;

  var offsets = {};

  req.body.forEach(element => {
    db.GetCat(req.params.datcat, version, function (error, category) {
      if (error) return next(error);

      category.index1.GetOffsetPath(element, function (error, fileOffset) {
        if (error) return next(error);
  
        offsets[element] = fileOffset;
      });
    });
  });

  res.setHeader('Content-Type', 'application/json');
  return res.send(JSON.stringify({ dataVersion: version, result: offsets }));
});