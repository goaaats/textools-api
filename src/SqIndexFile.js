const crypto = require('crypto');
const fs = require('fs');
var binutils = require('binutils');
var CRC = require('./crc');

Object.defineProperty(binutils.BinaryReader.prototype, "FastForward", {
  value: function FastForward(numBytes) {
    for (var i = 0; i < numBytes; i++) {
      this.ReadInt8();
    }
  },
  writable: true,
  configurable: true
});

// Reimplementation of Liinko's Index reader
class SqIndexFile {
  constructor(path) {
    this._path = path;
    const hash = crypto.createHash('md5');
    const file = fs.readFileSync(path);

    if (!file) {
      throw 'Could not find file: ' + path
    }

    hash.update(file);
    this._hash = hash.digest('hex');

    // Check if the file is a SqPack file
    if (!file.toString('utf-8').startsWith('SqPack')) {
      throw 'Not a SqPack file: ' + path;
    }

    var reader = new binutils.BinaryReader(file, 'little');

    const fileCountOffset = 1036;
    const dataStartOffset = 2048;

    reader.FastForward(fileCountOffset);
    var totalFiles = reader.ReadInt32();
    reader.FastForward(dataStartOffset - reader.Position);

    this._folders = {};

    for (var i = 0; i < totalFiles; reader.ReadBytes(4), i += 16) {
      var fileNameHash = reader.ReadInt32();
      var folderPathHash = reader.ReadInt32();
      var fileOffset = reader.ReadInt32() * 8;

      if (!this._folders[folderPathHash])
        this._folders[folderPathHash] = {};

      this._folders[folderPathHash][fileNameHash] = fileOffset;
    }

    console.log(`Loaded ${path}`);
  }

  get hash() {
    return this._hash;
  }

  GetOffsetHash(folder, file, callback) {
    if (!this._folders[folder])
      return callback(new Error(
        'No folder matching '
        + folder
      )
      );

    if (!this._folders[folder][file])
      return callback(new Error(
        'No file matching '
        + file
      )
      );

    return callback(null, this._folders[folder][file]);
  }

  GetOffsetPath(path, callback) {
    path = path + "";
    var pathToHash = path.substr(0, path.lastIndexOf("/"));
    var fileToHash = path.substr(path.lastIndexOf("/") + 1);

    var pathBuffer = Buffer.from(pathToHash, 'utf8');
    var fileBuffer = Buffer.from(fileToHash, 'utf8');

    var folderHash = CRC.GetHash(pathBuffer, 0, pathBuffer.length);
    var fileHash = CRC.GetHash(fileBuffer, 0, fileBuffer.length);

    this.GetOffsetHash(folderHash, fileHash, callback);
  }

};

module.exports = SqIndexFile;