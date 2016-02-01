
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
    var concreteClass = this.interfaceToConcrete[interface._iid];
    if (!concreteClass) {
      throw "Could not load a concrete class for interface["+interface._iid+"]: " + interface;
    }
    return concreteClass;
  },
  
  bind: function (interface, classRef) {
    var concrete = classRef;

    if (typeof classRef === 'function') {
      concrete = this.make(classRef);
    }
    
    if (concrete._implements.indexOf(interface._iid) === -1) {
      throw "Binding error: Bound class does not implement the interface";
    }
    
    this.interfaceToConcrete[interface._iid] = concrete;
  },
  
  enableInterfaceChecking: function() {
    this.isInterfaceCheckingOn = true;
  },
  
  disableInterfaceChecking: function() {
    this.isInterfaceCheckingOn = false;
  },
  
  try: function(callback) {
    try{
      callback();
    } catch (error) {
      return {
        catch: function(interfaceOrClass, catchCallback) {
          if ((interfaceOrClass.prototype && interfaceOrClass.prototype._cid && error._extends.indexOf(interfaceOrClass.prototype._cid) !== -1)  
            || (interfaceOrClass._iid && error._implements.indexOf(interfaceOrClass._iid) !== -1)) {
            catchCallback(error);
            return {catch: function(){return this;}, throwUncaught: function(){}};
          }
          return this;
        },
        throwUncaught: function() {
          throw error;
        }
      };
    } 
  }

};

ioc.interfaceFactory = {
  _iid: 1,
  make: function (schema) {
    schema._iid = this._iid;
    ++this._iid;
    if (!ioc.isInterfaceCheckingOn) {
      return schema;
    }
    var interfaces = schema._extends;
    schema._extends = [schema._iid];
    for (var key in interfaces) {
      schema = this.extend(schema, interfaces[key]);
      schema._extends = schema._extends.concat(interfaces[key]._extends);
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
  _cid: 1,
  make: function (schema) {
    var baseClass = schema._extends || Stapes;
    delete(schema._extends);
    var constructor = baseClass.subclass(schema, true);
    
    constructor.prototype._cid = this._cid;
    ++this._cid;
    constructor.prototype._extends = [constructor.prototype._cid].concat(constructor.prototype._extends || []);
    
    var interfaces = schema._implements;
    constructor.prototype._implements = [];
    for (var key in interfaces) {
      this.assertObjectImplementsInterface(schema, interfaces[key]);
      constructor.prototype._implements = constructor.prototype._implements.concat(interfaces[key]._extends);
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