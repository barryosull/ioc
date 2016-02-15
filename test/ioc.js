/** File will be converted into a proper test script **/

require('./ioc-bindings');

var ioc = require('ioc');

var InterfaceError = ioc.interfaceFactory.make({});

var Interface2Error = ioc.interfaceFactory.make({
  _extends: [InterfaceError]
});

var InterfaceClassError = ioc.classFactory.make({
  _implements: [Interface2Error]
});

var ExtendedClassError = ioc.classFactory.make({
  _extends: InterfaceClassError,
  _implements: [Interface2Error]
});

ioc.try(function(){
  throw new InterfaceClassError("Testing");
}).catch(ExtendedClassError, function(error){
  console.log("Catch ExtendedClassError");
}).catch(InterfaceClassError, function(error){
  console.log("Catch InterfaceClassError");
}).catch(Interface2Error, function(error){
  console.log("Catch Interface2Error");
}).catch(InterfaceError, function(error){
  console.log("Catch InterfaceError");
}).throwUncaught();

