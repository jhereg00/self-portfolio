/**
 *  Gets and sorts interactive data
 */
// requirements
const marked = require('marked');
const yamlFront = require('yaml-front-matter');
const fs = require('fs');

// settings
const DATA_PATH = 'data/illustration/';
const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MD_PROPS = ['__content','excerpt']; // any properties that should get parsed by markdown

// storage
var allIllustrations = [];
var lists = {};

/**
 *  Work object
 */
var Illustration = function (fileName) {
  this.fileName = fileName;
  this.data = {};
  this.load();
}
Illustration.prototype = {
  loaded: false,
  /**
   *  Loads the data from the initially passed fileName
   *  Can be used to reload if needed
   *  @param {function (this Illustration object)} Callback function, if needed
   */
  load: function (cb) {
    var _this = this;
    // read the file
    fs.readFile(DATA_PATH + this.fileName, function (err, data) {
      if (err) {
        console.error('Error Loading Illustration. FileName: ' + _this.fileName);
        console.error(err);
        console.log('\n');
        // take self out of lists
        allIllustrations.splice(allIllustrations.indexOf(_this),1);
        sortLists();
      }
      else {
        // successfully loaded
        // parse the data into a new object which we'll save to the model
        var workData = {};
        var parsed = yamlFront.loadFront(data);
        for (var prop in parsed) {
          if (MD_PROPS.indexOf(prop) === -1) {
            workData[prop] = parsed[prop];
          }
          else {
            workData[prop.replace(/^_+/,'')] = marked(parsed[prop]);
          }
        }

        // make sure a few things are defined
        if (!workData.slug) {
          if (workData.title) {
            workData.slug = workData.title.toLowerCase().replace(/\s/g,'-');
          }
          else {
            workData.slug = _this.fileName.replace(/\.\w+$/,'');
          }
        }

        // save our data
        _this.data = workData;

        if (typeof cb === 'function') {
          cb(_this);
        }
        sortLists();
      }
    });
  }
}

// load all work
function loadAllFromData () {
  fs.readdir(DATA_PATH, function (err, data) {
    if (err) {
      console.error('Error Loading Illustration. Could Not Read Directory: ' + DATA_PATH);
      console.error(err);
      console.log('\n');
    }
    else {
      for (var file in data) {
        if (/^[^_].*\.md$/.test(data[file])) {
          // "valid" markdown file
          allIllustrations.push(new Illustration(data[file]));
        }
      }
    }
  });
}
loadAllFromData();

// watch for changes
fs.watch(DATA_PATH, function (event, fileName) {

  if (/^[^_].*\.md$/.test(fileName)) {
    if (event === 'rename') {
      for (var i = 0, len = allIllustrations.length; i < len; i++) {
        if (allIllustrations[i].fileName === fileName) {
          allIllustrations.splice(i,1);
          break;
        }
      }
    }
    var existingIllustration;
    for (var i = 0, len = allIllustrations.length; i < len; i++) {
      if (allIllustrations[i].fileName === fileName) {
        allIllustrations[i].load();
        existingIllustration = true;
        break;
      }
    }
    if (!existingIllustration) {
      allIllustrations.push(new Illustration(fileName));
    }
  }
});

// sort our lists
function sortLists () {
  // sort by title
  lists.title = allIllustrations.slice(0);
  lists.title.sort(function (a,b) {
    if (a.data.title > b.data.title)
      return 1;
    else if (a.data.title < b.data.title)
      return -1;
    else
      return 0;
  });

  // sort by date
  lists.date = allIllustrations.slice(0);
  lists.date.sort(function (a,b) {
    if (a.data.date < b.data.date)
      return 1;
    else if (a.data.date > b.data.date)
      return -1;
    else
      return 0;
  });

  // sort by sexiness, an arbritrary value of how much I like it
  lists.sexiness = allIllustrations.slice(0);
  lists.sexiness.sort(function (a,b) {
    // high numbers first
    if (a.data.sexiness < b.data.sexiness)
      return 1;
    else if (a.data.sexiness > b.data.sexiness)
      return -1;
    else {
      // fall back to date
      if (a.data.date < b.data.date)
        return 1;
      else if (a.data.date > b.data.date)
        return -1;
      else
        return 0;
    }
  });
}

/**
 *  Returns a specific piece (or array of pieces) based on if a specific property matches a specific value
 *  Can pass a third argument as 'true' to match if value is 'in' the property, instead of equal to
 *  @param {string} data property to search for
 *  @param {anything to test against} value the data property should match
 *  [@param {boolean}] pass true to search 'in' instead of 'equals'
 *  [@param {string}] name of a pre-sorted list to match against instead of 'all'
 */
function getBy (prop, val, within, listName) {
  var ret = [];
  var list = listName && lists[listName] ? lists[listName] : allIllustrations;
  if (!within) {
    var test = function (interactive) {
      return (interactive.data && interactive.data[prop] == val);
    }
  }
  else {
    var test = function (interactive) {
      return (interactive.data && interactive.data[prop].indexOf(val) !== -1);
    }
  }

  for (var i = 0, len = list.length; i < len; i++) {
    if (test(list[i]))
      ret.push(list[i]);
  }

  return ret.length === 1 ? ret[0] : ret;
}

module.exports = {
  getBy: getBy,
  getList: function (listName) {
    if (listName !== 'random')
      return lists[listName];
    else {
      // randomize
      var ret = [];
      var interactive = allIllustrations.slice(0);
      while (interactive.length) {
        var i = interactive.splice(Math.floor(Math.random() * interactive.length),1);
        ret.push(i[0]);
      }
      return ret;
    }
  }
}
