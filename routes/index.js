var express = require("express");
var fetchData = require("../services/requests.service");
var router = express.Router();

var INSTITUITIONS_ENDPOINT =
  "https://data.directory.openbankingbrasil.org.br/participants";
var bodyData = "";

async function retriveData(param) {
  if (!param) return Promise.resolve([]);
  const datalist = [];
  const response = await fetchData(INSTITUITIONS_ENDPOINT);

  const endpoints = param.split(",");
  console.log("Endpoints ---> ", endpoints);

  return new Promise(async (resolve, reject) => {
    endpoints.forEach(async (ep, index) => {
      const endpointData = [];
      ep = ep.replace(/(\r\n|\n|\r)/gm, "");
      for (const iterator of response.data) {
        if (
          !!iterator.AuthorisationServers[0]?.ApiResources[0]
            ?.ApiDiscoveryEndpoints[0]?.ApiEndpoint
        ) {
          const url =
            iterator.AuthorisationServers[0].ApiResources[0]
              .ApiDiscoveryEndpoints[0].ApiEndpoint;
          const { hostname, protocol } = new URL(url);
          const target = `${protocol}//${hostname}/open-banking${ep}`;
          try {
            const bankRes = await fetchData(target);
            endpointData.push({
              OrganisationName: iterator.OrganisationName,
              endpoint: target,
              responseData: bankRes.data,
            });
          } catch (error) {
            console.error(error);
            endpointData.push({
              OrganisationName: iterator.OrganisationName,
              endpoint: target,
              responseData: error.data || error.code,
            });
          }
        }
      }
      datalist.push({ endpoint: ep, data: endpointData });
    });
    resolve(datalist);
  });
}

/* GET home page. */
router.get("/", async function (req, res, next) {
  const result = await retriveData(bodyData);
  res.render("index", { taskList: result });
});

router.post("/", async function (req, res, next) {
  bodyData = req.body.target;
  const result = await retriveData(bodyData);
  res.send({ taskList: result });
});

module.exports = router;
