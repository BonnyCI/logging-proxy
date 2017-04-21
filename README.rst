=====================
BonnyCI Logging Proxy
=====================

Expose logs available on the private network to the world.

* Free software: Apache license
* Source: https://github.com/BonnyCI/datadog-logging

About
=====

The core job runner at BonnyCI is Zuul_.
One of the assumptions that Zuul_ traditionally makes is that the nodes that it runs jobs on are publicly available and it provides a telnet port so that users can monitor jobs directly from the host.
In our setup this isn't true and the workers are behind the firewall.

This means to provide access to those running jobs logs we need a way to proxy the information through a publicly accessible point.

The logging-proxy is simply a nodejs_ server that creates a telnet connection to a specified host and sends that information back via a websocket.
A listening webpage can then render that data into something that a user can watch.
This is actually really simple because telnet is simply a TCP connection and sockjs_ makes the websocket appear like a connection so it's just a matter of connecting the data received callbacks.

.. _sockjs: https://github.com/sockjs
.. _nodejs: https://nodejs.org/
.. _zuul: https://docs.openstack.org/infra/zuul/

Configuration
=============

Configuration is currently done via the command line and environment variables.
Currently calling `node index.js --help` returns:

::

  $ node index.js --help
  Usage: index.js <command> [options]

  Options:
    -l, --log-config  Load winston config logging from file               [string]
    -p, --port        The port to listen on               [number] [default: 3000]
    -b, --bind        The interface IP to bind to    [string] [default: "0.0.0.0"]
    -h, --help        Show help                                          [boolean]

These values are also available to be set via environment variable with the prefix `BLP_`.
So for example you can set the port via `BLP_PORT` instead of via command line argument.

Things to Know
==============

* Currently the IP to connect to is passed as a query string to the page.
  This makes it nice and easy because everything is served off a single page, however it means that the IP of hosts is exposed to users.
  This is possibly bad because nodepool typically assigns IPs sequentially so you could look at other jobs around you.
  But this information is all public at the moment and you could always make your job print the IP so maybe it doesn't matter?
  Either way in future we probably want to change this parameter to a `BUILD_UUID` and get the executor IP from zuul and possibly authenticate that connection.

* Currently the application serves its own html file.
  This is fairly unnecessary and we could move that to a static host somewhere.
  Eventually though the front end will want to become part of the BonnyCI.org website and this repository will simply be the websocket server so there's not much point optimizing this use case yet.
