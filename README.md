Compassjs
=========

A javascript framework that allows easy communication with a REST server and provides MVC structure to web applications.

Our goal is to make a framework that is much easier to use compared to Backbone.js, easier to understand and to provide the following additional functionalities:
- Handling image uploads to a REST API.
- Providing customURL in HTTP requests in the case where the URLs are different from the one used to set up a Model.
- Data-binding between views and models.

This is a project for CS3213 Software Systems Design.

Team members:
============
Hendy Chua<br>
Inian<br>
Zaki<br>
Edrick<br>
Ivan<br>

Examples:
===========
Please refer to the examples folder on how to use the framework.

Documentation
===========
Compass.js has the following objects:
- Model
- Collection
- View
- Router
- Event

A Compass Model helps you to define an object in your database. You can use it to call various APIS such as:
- .get() - to make GET requests
- .post() - to make POST requests
- .put() - to make PUT requests
- .delete() - to make DELETE requests
Please refer to the examples for parameters that can be passed in.

A Compass Collection is a list of Models.

A Compass View allows you to create templates, update your view with your model's data easily The dependency is underscorejs.

A Compass Router helps you to define URL routes and map them to different method handlers in your project.

A Compass Event helps you to define Events that your views can be binded to and react accordingly.
