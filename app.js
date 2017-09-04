var partnerId = REPLACE_WITH_KALTURA_ACCOUNT_ID; //KMC > Settings > Integration Settings
var adminSecret = "REPLACE_WITH_KALTURA_API_ADMIN_SECRET"; //KMC > Settings > Integration Settings
var userId = "testingUser"; //all uploads and plays will be tracked on this userId - replace or connect to your SSO as needed

var kalturaSession = null;
var Kaltura = require('kaltura');
var config = new Kaltura.kc.KalturaConfiguration(partnerId);
config.serviceUrl = 'https://www.kaltura.com';
var client = new Kaltura.kc.KalturaClient(config);

var compression = require('compression')
var express = require('express')
var app = express()
var path = require("path");
var $ = require('jsrender');

app.use(compression())
app.use(express.static('public'));

// Homepage, show the upload view:
app.get('/', function (req, res) {
  var tmpl = $.templates('./views/uploadTemplate.html');
  var viewParams = {sessionkey: kalturaSession};
  var html = tmpl.render(viewParams);
  res.send(html);
})

//Plat page, render the player with the desired entryId
app.get('/play/:entryId', function (req, res) {
  var tmplate = $.templates('./views/playTemplate.html');
  //pass entryId and KalturaSession for the player embed: 
  var viewParams = {entryid: req.params.entryId, 
                    sessionkey:kalturaSession
                   };
  var html2 = tmplate.render(viewParams);
  res.send(html2);
})

//create the entry object and match the uploaded file to the entry:
app.get('/uploaddone/:uploadTokenId', function (req, res) {
  var uploadTokenId = req.params.uploadTokenId;
  var entry = new Kaltura.kc.objects.KalturaMediaEntry();
  entry.mediaType = Kaltura.kc.enums.KalturaMediaType.VIDEO;
  entry.name = "my first upload test";
  entry.description = "just another upload test";

  client.media.add(function(results) {
    if (results && results.code && results.message) {
      console.log('Kaltura Error', results);
    } else {
      var entryId = results.id;
      var resource = new Kaltura.kc.objects.KalturaUploadedFileTokenResource();
      resource.token = uploadTokenId;

      client.media.addContent(function(results) {
        if (results && results.code && results.message) {
          console.log('Kaltura Error', results);
        } else {
          res.send(results);
        }
      },
      entryId,
      resource);
    }
  },
  entry);
})

// Init the Kaltura client and then start the server:
client.session.start(function(ks) {
  if (ks.code && ks.message) {
    console.log('Error starting session', ks);
  } else {
    kalturaSession = ks;
    client.setKs(ks);
    app.listen(3000, function () {
      console.log('Example app listening on port 3000!')
    });
  }
}, adminSecret,
userId, 
Kaltura.kc.enums.KalturaSessionType.ADMIN, 
partnerId);
