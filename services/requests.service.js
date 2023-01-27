const axios = require('axios');

function fetchData(url) {

    return axios.get(url)
};

function fetchDataSSL(url, httpsAgent) {

    return axios.get(url, { httpsAgent })
};
module.exports = fetchData,fetchDataSSL;