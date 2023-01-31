var express = require('express');
var httpsAgent = require('https-agent');
var fetchDataSSL = require('../services/requests.service');
var fetchData = require('../services/requests.service');
var fs = require('fs');
var path = require("path");
var convert = require('json-to-plain-text');
var router = express.Router();


var INSTITUITIONS_ENDPOINT = 'https://data.directory.openbankingbrasil.org.br/participants';

var endpoint = '/products-services/v1/business-accounts';
//var endpoint = '/products-services/v1/personal-unarranged-account-overdraft';


async function retriveData(param) {
  const datalist = [];
  const response = await fetchData(INSTITUITIONS_ENDPOINT)

  /*   const agt = httpsAgent({
      rejectUnauthorized: false, // (NOTE: this will disable client verification)
      cert: fs.readFileSync(path.resolve(__dirname, '../public/certs/usercert.pem')),
      key: fs.readFileSync(path.resolve(__dirname, '../public/certs/key.pem')),
      passphrase: "YYY"
  }) */

  return new Promise(async (resolve, reject) => {
    for (const iterator of response.data) {

      if (!!iterator.AuthorisationServers[0]?.ApiResources[0]?.ApiDiscoveryEndpoints[0]?.ApiEndpoint) {
        const url = iterator.AuthorisationServers[0].ApiResources[0].ApiDiscoveryEndpoints[0].ApiEndpoint;
        const { hostname, protocol } = new URL(url);
        const host = `${protocol}//${hostname}/open-banking${param ? param : endpoint}`
        try {

          const bankRes = await fetchData(host)

          datalist.push({ OrganisationName: iterator.OrganisationName, endpoint: host, responseData: bankRes.data })
        } catch (error) {
          console.error(error)
          datalist.push({ OrganisationName: iterator.OrganisationName, endpoint: host, responseData: error.data || error.code })
        }

      }
    }
    resolve(datalist);
  });
}

/* GET home page. */
router.get('/', async function (req, res, next) {
  const result = await retriveData();
  res.render('index', { taskList: result });
});

router.post('/refresh', async function (req, res, next) {
  const result = await retriveData(req.body.target);
  res.render('index', { taskList: result });
});

module.exports = router;
