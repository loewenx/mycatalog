var fs = require('fs');
var path = require('path');
var express = require('express');
var router = express.Router();
var moment = require('moment');
var officegen = require('officegen');

// Added to loop through the region
var vm = require('vm');
var script = vm.createScript(fs.readFileSync('./public/js/bluemix-configuration.js'));
var sandbox = {};
script.runInNewContext(sandbox);
var regions = sandbox.regions;
var categories = sandbox.categories;

router.post('/:format', function (req, res) {
  var services = JSON.parse(fs.readFileSync('public/generated/services.json', 'utf8'));

  var servicesToExport;
  var userSelectedServices = req.body["services[]"];

  if (userSelectedServices) {
    servicesToExport = services.filter(function (service) {
      return userSelectedServices.indexOf(service.metadata.guid) >= 0;
    });
  } else {
    servicesToExport = services;
  }

  console.log("Exporting", servicesToExport.length, "services in", req.params.format);

  var officeDocument;
  // Get the date of the office export
  var date = new Date();
  var dateYMD = moment(date).format('YYYY-MM-DD');
  var dateMDY = moment(date).format('MMMM DD, YYYY');

  switch (req.params.format) {
    case "xlsx":
      officeDocument = exportToExcel(servicesToExport, dateMDY, res);
      break;
    case "docx":
      officeDocument = exportToWord(servicesToExport, dateMDY, res);
      break;
    case "pptx":
      officeDocument = exportToPowerpoint(servicesToExport, dateMDY, res);
      break;
    default:
      res.status(500).send({
        error: "unknown format " + req.params.format
      })
  }

  if (officeDocument) {
    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Content-Disposition", "inline; filename=catalog-" + dateYMD + "." + req.params.format);
    officeDocument.generate(res);
  }
});

// ---------------------------------------------------------------------
// API Export to XLSX
// ---------------------------------------------------------------------
function exportToExcel(services, dateMDY, res) {
  var xlsx = officegen('xlsx');

  sheet = xlsx.makeNewSheet();
  sheet.name = 'My Bluemix Catalog';

  var row = 3;

  services.forEach(function (service) {
    if (!service.entity.active) {
      return;
    }

    // Disclaimer
    sheet.data[0] = [];
    sheet.data[0][0] = "Disclaimer: The list of services in this document was extracted from the Bluemix catalog using the public Cloud Foundry API. This content attempts to be as accurate as possible. Use with care and refer to the official Bluemix catalog www.bluemix.net/catalog.";
    sheet.data[1] = [];
    sheet.data[1][0] = ""; //space

    // Header
    sheet.data[2] = [];
    sheet.data[2][0] = "Service";
    sheet.data[2][1] = "Category";
    sheet.data[2][2] = "Description";
    sheet.data[2][3] = "Author";
    sheet.data[2][4] = "Status";
    sheet.data[2][5] = "Free Plan";
    sheet.data[2][6] = "Plans";
    sheet.data[2][7] = "Regions";
    sheet.data[2][8] = "Creation Date";
    sheet.data[2][9] = "Last Modification";
    sheet.data[2][10] = "Long Description";
    sheet.data[2][11] = "URL";

    // Cell Content
    sheet.data[row] = [];

    var extra = service.entity.extra;
    if (extra && extra.displayName) {
      sheet.data[row][0] = extra.displayName;
      //sheet.data[row][1] = service.entity.tags[0];
      for (var cat in categories) {
        if (service.entity.tags[0] == categories[cat].id)
          sheet.data[row][1] = categories[cat].label;
      }
      sheet.data[row][2] = service.entity.description;
      sheet.data[row][3] = extra.providerDisplayName;
      sheet.data[row][10] = extra.longDescription;
      sheet.data[row][11] = extra.documentationUrl;
    } else {
      sheet.data[row][0] = service.entity.label;
      sheet.data[row][1] = service.entity.tags[0];
      sheet.data[row][2] = service.entity.description;
      sheet.data[row][3] = service.entity.provider;
    }

    var status = "";
    if (service.entity.tags.indexOf('ibm_beta') >= 0)
      status = "Beta";
    else if (service.entity.tags.indexOf('ibm_experimental') >= 0)
      status = "Experimental";
    else
      status = "Production Ready";
    sheet.data[row][4] = status;
    sheet.data[row][5] = (service.entity.tags.indexOf("custom_has_free_plan") >= 0) ? "Yes" : "No";

    var planList = "";
    var plans = service.plans;
    for (var plan in plans) {
      planList += plans[plan].entity.name + "\n";
    }
    sheet.data[row][6] = planList;

    var datacenter = "";
    for (var region in regions) {
      if (service.entity.tags.indexOf(regions[region].tag) >= 0) {
        datacenter += regions[region].label + " ";
      }
    }
    sheet.data[row][7] = datacenter;

    sheet.data[row][8] = moment(service.metadata.created_at).format('YYYY-MM-DD');
    sheet.data[row][9] = moment(service.metadata.updated_at).format('YYYY-MM-DD');

    row++;
  });

  return xlsx;
}

// ---------------------------------------------------------------------
// API Export to PPTX
// ---------------------------------------------------------------------
function exportToPowerpoint(services, dateMDY, res) {
  var pptx = officegen('pptx');

  pptx.setWidescreen(true);

  // Intro slide --------------------
  slide = pptx.makeNewSlide();
  //slide.back = '1E3648';
  slide.addText("My Bluemix Catalog", {
    x: 150,
    y: 100,
    cx: '100%',
    font_size: 40,
    bold: true,
    color: '2a6d9e'
  });
  slide.addText("Exported on " + dateMDY, {
    x: 150,
    y: 180,
    cx: '100%',
    font_size: 40,
    bold: true,
    color: '2a6d9e'
  });
  slide.addText("The list of services in this document was extracted from the Bluemix catalog using the public Cloud Foundry API. This content attempts to be as accurate as possible. Use with care and refer to the official Bluemix catalog www.bluemix.net/catalog.", {
    x: 150,
    y: 500,
    cx: '900',
    font_size: 20,
    bold: false,
    color: 'ff0000'
  });
  slide.addImage(path.resolve(__dirname, 'public/icons/bluemix_logo.png'), {
    x: 1000,
    y: 30,
    cx: 110,
    cy: 120
  });
  // Intro slide END

  // One slide per service
  services.forEach(function (service) {
    if (!service.entity.active) {
      return;
    }

    // New slide
    slide = pptx.makeNewSlide();

    try {
      slide.addImage(path.resolve(__dirname, 'public/generated/icons/' + service.metadata.guid + '.png'), {
        x: 50,
        y: 30,
        cx: 70,
        cy: 70
      });
      slide.addImage(path.resolve(__dirname, 'public/icons/bluemix_logo.png'), {
        x: 1100,
        y: 30,
        cx: 90,
        cy: 100
      });
    } catch (err) {}

    var extra = service.entity.extra;
    if (extra && extra.displayName) {
      slide.addText(extra.displayName, {
        x: 150,
        y: 30,
        cx: '100%',
        font_size: 30,
        bold: true
      });

      slide.addText(service.entity.description, {
        x: 100,
        y: 150,
        cx: '1000',
        font_size: 20,
        color: '808080'
      });

      slide.addText(extra.longDescription, {
        x: 100,
        y: 250,
        cx: '700',
        font_size: 18
      });

      // Metada rectangle panel on the right hand side
      slide.addShape("rect", {
        x: 830,
        y: 230,
        cx: 390,
        cy: 300,
        fill: '47A9C0'
      });
      slide.addText("Author: ", {
        x: 850,
        y: 250,
        cx: '150',
        font_size: 18,
        bold: false,
        color: 'ffffff'
      });
      slide.addText(extra.providerDisplayName, {
        x: 1000,
        y: 250,
        cx: '220',
        font_size: 18,
        color: 'ffffff',
        bold: false
      });
      slide.addText("Category: ", {
        x: 850,
        y: 300,
        cx: '150',
        font_size: 18,
        bold: false,
        color: 'ffffff'
      });
      for (var category in categories) {
        if (service.entity.tags[0] == categories[category].id) {
          cat = categories[category].label;
          slide.addText(cat, {
            x: 1000,
            y: 300,
            cx: '300',
            font_size: 18,
            color: 'ffffff',
            bold: false
          });
        }
      }
      slide.addText("Status: ", {
        x: 850,
        y: 350,
        cx: '150',
        font_size: 18,
        color: 'ffffff'
      });

      var status = "";
      if (service.entity.tags.indexOf('ibm_beta') >= 0)
        status = "Beta";
      else if (service.entity.tags.indexOf('ibm_experimental') >= 0)
        status = "Experimental";
      else
        status = "Production Ready";
      slide.addText(status, {
        x: 1000,
        y: 350,
        cx: '200',
        font_size: 18,
        color: 'ffffff',
        bold: false
      });
      slide.addText("Free Plan: ", {
        x: 850,
        y: 400,
        cx: '150',
        font_size: 18,
        color: 'ffffff'
      });
      var isFreePlan = (service.entity.tags.indexOf("custom_has_free_plan") >= 0) ? "Yes" : "No";
      slide.addText(isFreePlan, {
        x: 1000,
        y: 400,
        cx: '200',
        font_size: 18,
        color: 'ffffff',
        bold: false
      });
      slide.addText("Regions: ", {
        x: 850,
        y: 450,
        cx: '150',
        font_size: 18,
        color: 'ffffff'
      });
      var datacenter = "";
      for (var region in regions) {
        if (service.entity.tags.indexOf(regions[region].tag) >= 0) {
          datacenter += regions[region].label + " ";
        }
      }
      slide.addText(datacenter, {
        x: 1000,
        y: 450,
        cx: '200',
        font_size: 18,
        color: 'ffffff',
        bold: false
      });
      // Metada rectangle panel on the right hand side END

      // Footer -------------------------------
      slide.addText(extra.documentationUrl, {
        x: 100,
        y: 600,
        cx: '100%',
        cy: 40,
        color: '0000ff'
      });

      slide.addText(slide.getPageNumber() + 1, {
        x: 1150,
        y: 630,
        cx: '100',
        cy: 20,
        color: '808080'
      });
    } else {
      slide.addText(service.entity.label, {
        x: 150,
        y: 30,
        cx: '100%',
        font_size: 30,
        bold: true
      });

      slide.addText(service.entity.description, {
        x: 100,
        y: 150,
        cx: '100%',
        font_size: 20
      });
    }
  });

  return pptx;
}

// ---------------------------------------------------------------------
// API Export to DOCX
// ---------------------------------------------------------------------
function exportToWord(services, dateMDY, res) {
  var docx = officegen('docx');

  var introPage = docx.createP();
  introPage.addText("Disclaimer: The list of services in this document was extracted from the Bluemix catalog using the public Cloud Foundry API. This content attempts to be as accurate as possible. Use with care and refer to the official Bluemix catalog www.bluemix.net/catalog.",
    { color: '#ff0000', font_size: 16
    });
  introPage.addLineBreak();

  services.forEach(function (service) {
    if (!service.entity.active) {
      return;
    }

    var p = docx.createP();

    try {
      p.addImage(path.resolve(__dirname, 'public/generated/icons/' + service.metadata.guid + '.png'), {
        cx: 70,
        cy: 70
      });
    } catch (err) {}

    var extra = service.entity.extra;

    var svcName = (extra && extra.displayName) ? extra.displayName : service.entity.label;
    var author = (extra && extra.providerDisplayName) ? extra.providerDisplayName : service.entity.provider;
    var doc = (extra && extra.documentationUrl) ? extra.documentationUrl : "";

    p.addText('     ' + svcName, {
      bold: true,
      verticalAlign: true,
      font_size: 18
    });
    p.addLineBreak();
    p.addText('________________________________________________________________________', {
      color: '808080'
    });
    p.addLineBreak();
    p.addText(service.entity.description, {
      font_size: 16
    });
    p.addLineBreak();
    p.addText('Author:  ' + author, {
      font_size: 14,
      color: '808080'
    });
    p.addLineBreak();
    p.addText('Documentation:  ', {
      font_size: 14,
      color: '808080'
    });
    p.addLineBreak();
    p.addText(doc, {
      font_size: 14,
      color: '808080'
    });
    p.addLineBreak();
  });

  return docx;
}

module.exports = router;
