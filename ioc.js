
var Stapes = require('stapes');

var ioc = {
  interfaceToConcrete: {},
  isInterfaceCheckingOn: true,
 
  make: function (interface) {

    //Is it a constructor
    if (typeof interface === 'function') {
      var constructed = new interface();
      for (var key in constructed._dependencies) {
        constructed[key] = this.make(constructed._dependencies[key]);
      }
      return constructed;
    }

    //It's an interface
    var concreteClass = this.interfaceToConcrete[interface._guid];
    if (!concreteClass) {
      throw "Could not load a concrete class for interface["+interface._guid+"]: " + interface;
    }
    return concreteClass;
  },
  
  bind: function (interface, object) {
    var concrete = object;
    //If it's a constructor, make it
    if (typeof object === 'function') {
      concrete = this.make(object);
    }

    this.classFactory.assertObjectImplementsInterface(concrete, interface);
    this.interfaceToConcrete[interface._guid] = concrete;
  },
  
  enableInterfaceChecking: function() {
    this.isInterfaceCheckingOn = true;
  },
  
  disableInterfaceChecking: function() {
    this.isInterfaceCheckingOn = false;
  }

};

ioc.interfaceFactory = {
  _guid: 1,
  make: function (schema) {
    schema._guid = this._guid;
    ++this._guid;
    if (!ioc.isInterfaceCheckingOn) {
      return schema;
    }
    var interfaces = schema._extends;
    for (var key in interfaces) {
      schema = this.extend(schema, interfaces[key]);
    }
    return schema;
  },
  extend: function(interfaceA, interfaceB) {
    for (var methodName in interfaceB) {
      if (interfaceA[methodName] && interfaceA[methodName].length !== interfaceB[methodName].length) {
        throw "Error: Interface Method '" + methodName + "' has a different signature than the one defined in an extended interface. Expected " + interfaceA[methodName].length + " arguments, found " + interfaceB[methodName].length + " arguments";
      }
      interfaceA[methodName] = interfaceB[methodName];
    }
    return interfaceA;
  }
};

//Factory for making classes that implement interfaces
ioc.classFactory = {
  make: function (schema) {
    var baseClass = schema._extends || Stapes;
    var constructor = baseClass.subclass(schema, true);
    var interfaces = schema._implements;
    constructor.prototype._implements = interfaces;
    for (var key in interfaces) {
      this.assertObjectImplementsInterface(schema, interfaces[key]);
    }
    return constructor;
  },
  assertObjectImplementsInterface: function (object, interface) {
    if (!ioc.isInterfaceCheckingOn) {
      return;
    }
    for (var methodName in interface) {
      if (interface[methodName] !== 'function') {
        break;
      }
      if (typeof object[methodName] !== 'function') {
        throw "Error: Object method '" + methodName + "' not implemented, as defined in the interface";
      }
      if (object[methodName].length !== interface[methodName].length) {
        throw "Error: Object method '" + methodName + "' has a different signature than the one defined in the interface. Expected " + interface[method].length + " arguments, found " + object[method].length + " arguments";
      }
    }
  }
};

module.exports = ioc;