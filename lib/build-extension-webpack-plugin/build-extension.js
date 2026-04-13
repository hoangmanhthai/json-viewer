var fs = require('fs-extra');
var path = require('path');
var archiver = require('archiver');
var BuildPaths = require('../build-paths');

function copyTheme(darkness, list) {
  var paths = [];
  list.forEach(function(theme) {
    var themeCSS = theme.replace(/\.js$/, '.css');
    var themeCSSPath = 'themes/' + darkness + '/' + theme + '.css';
    var themePath = path.join(BuildPaths.EXTENSION, 'assets/' + theme);

    if (fs.existsSync(themePath + '.js') && fs.existsSync(themePath + '.css')) {
      fs.removeSync(themePath + '.js');
      fs.copySync(themePath + '.css', path.join(BuildPaths.EXTENSION, themeCSSPath));
      console.log('  copied: ' + themeCSSPath);
      paths.push(themeCSSPath);

    } else {
      console.error('  fail to copy: ' + (themePath + '.css'));
    }
  });

  return paths;
}

function findThemes(darkness) {
  return fs.readdirSync(path.join(BuildPaths.SRC_ROOT, 'themes', darkness)).
    filter(function(filename) {
      return /\.js$/.test(filename);
    }).
    map(function(theme) {
      return theme.replace(/\.js$/, '');
    });
}

function BuildExtension() {}
BuildExtension.prototype.apply = function(compiler) {
  compiler.hooks.done.tap('BuildExtension', () => {
    console.log('\n');
    console.log('-> copying files');
    fs.copySync(path.join(BuildPaths.SRC_ROOT, 'icons'), path.join(BuildPaths.EXTENSION, 'icons'));
    fs.copySync(path.join(BuildPaths.SRC_ROOT, 'pages'), path.join(BuildPaths.EXTENSION, 'pages'));
    // 拷贝 background.js
    fs.copySync(path.join(BuildPaths.SRC_ROOT, 'assets/background.js'), path.join(BuildPaths.EXTENSION, 'assets/background.js'));

    console.log('-> copying themes');

    var themesCSSPaths = copyTheme('light', findThemes('light')).
                         concat(copyTheme('dark', findThemes('dark')));

    var manifest = fs.readJSONSync(path.join(BuildPaths.SRC_ROOT, 'manifest.json'));
    // Manifest V3 format
    if (manifest.web_accessible_resources && manifest.web_accessible_resources.length > 0) {
      manifest.web_accessible_resources[0].resources = manifest.web_accessible_resources[0].resources.concat(themesCSSPaths);
    } else {
      manifest.web_accessible_resources = [{
        resources: themesCSSPaths,
        matches: ["<all_urls>"]
      }];
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('-> dev version');
      manifest.name += ' - dev';
    }

    console.log('-> copying manifest.json');
    fs.outputJSONSync(path.join(BuildPaths.EXTENSION, 'manifest.json'), manifest);
  });
}

module.exports = BuildExtension;
