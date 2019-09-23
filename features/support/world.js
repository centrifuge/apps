const puppeteer = require('puppeteer');
const dappeteer =  require('dappeteer')

const { setWorldConstructor, setDefaultTimeout } = require('cucumber');
const scope = require('./scope');

const CentrifugeWorld = function(){
  //called before each scenario 
  scope.driver = puppeteer;
  scope.provider = dappeteer;
}

setDefaultTimeout(30000)
setWorldConstructor(CentrifugeWorld)
