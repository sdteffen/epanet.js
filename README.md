epanet.js
=========

JavaScript version of EPANET.
No installation required. Data is not send to the server.

Demo: [epanet.de/js](http://epanet.de/js/)

Detailed information: [epanet.de/developer/epanetjs.html](http://epanet.de/developer/epanetjs.html)

Requirements
============

[Emscripten](http://emscripten.org)'s emcc c-to-js compiler.

Compilation
===========

Autotools can be used to build epanet.js. Starting from the tarball, use the
following commands to build js.html:

    ./configure
    make

TODO
====

* Graphical interface

Libraries
=========

epanet.js uses several libraries:

* [Emscripten](http://emscripten.org)
* [D3.js](http://d3js.org)
* [jQuery](http://jquery.com)
* [Bootstrap](http://getbootstrap.com)
* [FileSaver.js](https://github.com/eligrey/FileSaver.js/)