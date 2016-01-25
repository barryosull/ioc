
var Stapes = require('stapes');

var ioc = {
  interfaceToConcrete: {},
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
      throw "Could not load a concrete class for the interface: " + interface;
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
  }

};

ioc.interfaceFactory = {
  _guid: 1,
  make: function (schema) {
    schema._guid = this._guid;
    ++this._guid;
    return schema;
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
    for (var method in interface) {
      if (interface[method] !== 'function') {
        break;
      }
      if (typeof object[method] !== 'function') {
        throw "Error: Method '" + method + "' not implemented, as defined in the interface";
      }
      if (object[method].length !== interface[method].length) {
        throw "Error: Method '" + method + "' has a different signature than the one defined in the interface. Expected " + interface[method].length + " arguments, found " + object[method].length + " arguments";
      }
    }
  }
};

module.exports = ioc;