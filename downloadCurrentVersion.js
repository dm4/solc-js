#!/usr/bin/env node

// This is used to download the correct binary version
// as part of the prepublish step.

var pkg = require('./package.json');
var fs = require('fs');
var https = require('follow-redirects').https;
var MemoryStream = require('memorystream');
var ethJSUtil = require('ethereumjs-util');

function getVersionList (cb) {
  console.log('Retrieving available version list...');

  var mem = new MemoryStream(null, { readable: false });
  https.get('https://ethereum.github.io/solc-bin/bin/list.json', function (response) {
    if (response.statusCode !== 200) {
      console.log('Error downloading file: ' + response.statusCode);
      process.exit(1);
    }
    response.pipe(mem);
    response.on('end', function () {
      cb(mem.toString());
    });
  });
}

function downloadBinary (outputName, url, expectedHash) {
  console.log('Downloading URL', url);

  // Remove if existing
  if (fs.existsSync(outputName)) {
    fs.unlinkSync(outputName);
  }

  process.on('SIGINT', function () {
    console.log('Interrupted, removing file.');
    fs.unlinkSync(outputName);
    process.exit(1);
  });

  var file = fs.createWriteStream(outputName, { encoding: 'binary' });
  https.get(url, function (response) {
    if (response.statusCode !== 200) {
      console.log('Error downloading file: ' + response.statusCode);
      process.exit(1);
    }
    response.pipe(file);
    file.on('finish', function () {
      file.close(function () {
        var hash = '0x' + ethJSUtil.sha3(fs.readFileSync(outputName, { encoding: 'binary' })).toString('hex');
        if (expectedHash !== hash) {
          console.log('Hash mismatch: ' + expectedHash + ' vs ' + hash);
          process.exit(1);
        }
        console.log('Done.');
      });
    });
  });
}

console.log('Downloading correct solidity binary...');

var expectedHash = '0xd057f49a3f3b522e25913048742528a186ca38011d50c8c3ecbc451159a1420a';
downloadBinary('soljson.js', 'https://github.com/CyberMiles/lity/releases/download/v1.2.4/lity-v1.2.4-js', expectedHash);
