'use strict';
var request = require('request');
 
module.exports = {
  metadata: () => ({
    name: 'complete.training.CurrencyConverter',
    properties: {
      variable: {required: true,type: 'string'},
      baseCurrency: {required: true,type: 'string'},
      targetCurrencies: {required: true,type: 'string'},
      amount: {required: true,type: 'int'}
    },
    supportedActions: ['success', 'failure']
  }),
  invoke: (conversation, done) => {

    const { variable } = conversation.properties();
    const { baseCurrency } = conversation.properties();
    const { targetCurrencies } = conversation.properties();
    const { amount } = conversation.properties();
    conversation.logger().info("Input parameter values: variable: "+variable+", baseCurrency: "+baseCurrency+", targetCurrencies: "+targetCurrencies+", amount: "+amount);

    var tmpTargetCurrencies = targetCurrencies + "," + baseCurrency.toUpperCase();
    var baseCurrencies = baseCurrency.toUpperCase();
    var reqUrl ="https://api.ratesapi.io/api/latest?base="+ baseCurrencies +"&symbols=" + tmpTargetCurrencies;
    conversation.logger().info("Request URL passed : "+ reqUrl);

    request(reqUrl, {json: true }, (err, res, body) => {

      if (res.statusCode == 200) {                
        if(body.base){                           
          conversation.logger().info("Successful conversion");                    
          var _conversionArray = [];

          for(let property in body.rates){                 
            if(property.toUpperCase() != baseCurrency.toUpperCase()){              
              let _conversionRate = body.rates[property]/body.rates[baseCurrency.toUpperCase()];              
              let obj = {};
              obj.symbol = property;
              obj.conversionRate = _conversionRate;
              obj.amount = _conversionRate*amount;
              conversation.logger().info(baseCurrency.toUpperCase()+" to "+property+"");
              _conversionArray.push(obj);
            }
         }
         conversation.logger().info("converted currencies: "+_conversionArray.toString());         
         let result = {};
         result.date = body.date;
         result.base= {};
         result.base.symbol = baseCurrency.toUpperCase();
         result.base.amount = amount;
         result.conversion = _conversionArray;

         conversation.variable(variable,result);
         conversation.transition('success');
         conversation.keepTurn(true);
         done();
        }
        else{
          conversation.transition('failure');
          conversation.logger().warn("Error code: "+res.statusCode);
          done();
        }
      }
      else{
        conversation.transition('failure');
        done();
      }
    });
  }
};
