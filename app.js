// Licensed under the Apache License. See footer for details.
/*jslint node: true*/
"use strict";

var express = require('express');
var cfenv = require('cfenv');
var favicon = require('serve-favicon');
var app = express();
var bodyParser = require('body-parser')
var compress = require('compression');

var appEnv = cfenv.getAppEnv();

app.use(compress());
app.use(bodyParser.urlencoded({ extended: false }))

app.use("/api/export", require('./export2office.js'));


// serve the files out of ./public as our main files
app.use(express.static('./public'));
app.use(favicon(__dirname + '/public/icons/favicon.ico'));

// start server on the specified port and binding host
app.listen(appEnv.port, "0.0.0.0", function () {
  // print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
});
//------------------------------------------------------------------------------
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//------------------------------------------------------------------------------
