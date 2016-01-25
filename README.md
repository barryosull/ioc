# ioc

Javascript, especially NPM modules, lack one aspect of OOP systems that most have come to rely on, interfaces and dependency injection.

That's why we created an IOC for node, modelled after the Laravel 5.1's IOC container.

It allows you to

- Create interfaces
- Create classes that implement those interfaces
- Bind those interfaces to those classes
- Inject implementations of interfaces where ever you need them.

## Usage

###Interfaces:
Creating an interface is pretty easy, here's an example of a PaymentService that is used in our domain.

```js
var InterfaceFactory = require('ioc').interfaceFactory;

var PaymentService = InterfaceFactory.make({
  chargeAccount: function(paymentDetails) {}
});

This creates an interface that you can use when creating a class, like the following.

var ClassFactory = require('ioc').classFactory;

var StripeService = ClassFactory.make({
 
  _interfaces: [PaymentService],
  
  chargeAccount: function(paymentDetails) {
    
  }
});
```

If you've ever used BoackboneJS or StapesJs, the class constructor will look familiar. 
When it's created, the ClassFactory makes sure that the objects schema matches the interface defined. Simply pass in the interfaces as an array in the param _interfaces, and the factory will take care of the rest.

You can pass multiple interfaces, the factory will make sure that they're all implemented.

###Using the IOC

To bind a class to an interface, add the following in your bootstrap code.

```js
var PaymentService = require('./payment-service');
var StripeService = require('./stripe-service');
ioc.bind(PaymentService, StripeService);

//Or, the shorter version.

ioc.bind(require('./payment-service'), require('./stripe-service'));
```

This binds that interface to that concrete class. It also checks the interface, to make sure the concrete class implements that interface.
It handles single instances as well, so you can bind an instance like this.

```js
ioc.bind(PaymentService, new StripeService());

//To create a concrete instance, call the foloowing.
var paymentService = ioc.make(PaymentService);
```
That's it, you now have a concrete instance of that interface.

###Dependency injection

Now, in the above, you'll notice that the "chargeAccount" method is missing it's implementation details, it's infrasturcture if you will.
So let's make a class that solves that problem and inject it in.

```js
var StripeApi = Class.make({
  charge: function(amount, currency, token){
    // make the payment
  }
});

//Here's now we tell our class about the dependencies it needs.

var StripeService = Class.subClass({
 
  _interfaces: [PaymentService],
  
  _dependencies: {
    stripeApi: StripeApi
  },
  
  chargeAccount: function(paymentDetails) {
    this.stripeApi.charge(paymentDetails.amount, paymentDetails.currency, paymentDetails.token);  
  }
});
```

"_dependencies" is a key value store for the dependencies. 
These dependencies are automatically created and associated when the class is made by the IOC, so we don't have to worry about it, it will just be there when we inject the class.

###Dependency trees

Dependency injection also works with interfaces, it will automatically create a concrete instance of that interface. This allows you to instantiate complex dependency trees, with minimal code and messiness.