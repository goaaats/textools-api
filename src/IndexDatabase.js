var readdir = require('readdir-absolute');
const SqIndexFile = require('./SqIndexFile');
var path = require('path');
var fs = require('fs');

const cats = ["00", "01", "02", "03", "04", "05", "06", "07", "08", "12", "13", "0a", "0b", "0c"];

class IndexDatabase {

  constructor(dataDirectory) {
    this._currentVersion = fs.readFileSync(path.join(dataDirectory, 'ffxivgame.ver'), 'utf8');

    this._versions = {};

    readdir(dataDirectory, (err, directories) => {
      directories.forEach(dir => {

        var parts = dir.split('\\');
        var version = parts.pop() || parts.pop();

        if (version == 'ffxivgame.ver')
          return;

        this._versions[version] = {};
        cats.forEach(cat => {
          var catPath = path.join(dir, cat + "0000.win32.index");

          if (!fs.existsSync(catPath)) {
            console.error('Could not find index for cat ' + cat + ' in version ' + version);
            return;
          }

          if (!fs.existsSync(catPath + '2')) {
            console.error('Could not find index2 for cat ' + cat + ' in version ' + version);
            return;
          }

          this._versions[version][cat] = {
            index1: new SqIndexFile(catPath),
            index2: new SqIndexFile(catPath + '2')
          };
        });
      });
    });
  }

  get currentVersion() {
    return this._currentVersion;
  }

  GetCat(cat, version, callback) {
    if (!this._versions[version])
      return callback(new Error(
        'No version matching '
        + version
      )
      );

    if (!this._versions[version][cat])
      return callback(new Error(
        'No category matching '
        + cat
      )
      );

    return callback(null, this._versions[version][cat]);
  }

};

module.exports = IndexDatabase;