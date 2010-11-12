![SLBfb Logo](http://slbrowserfb.appspot.com/static/slb.png)

Smalltalk Labs Browser for blogs
================================

What is it?
-----------
Smalltalk Labs Browser for blogs is a JavaScript widget that you can put on	your
blog (or any other kind of website) to allow your blog's readers to display any
Smalltalk class you mention in a blog post in a web based code browser, so that
they don't need to have a Smalltalk image handy when you mention a class in an
article or tutorial.

The source code for the displayed class is downloaded over the net from a
database, which means that the only requirement to add this to a blog is support
for embedding custom JavaScript which makes this work on most free blog hosting
services, including Tumblr and Blogger.

Visit [http://slbrowserfb.appspot.com](http://slbrowserfb.appspot.com) for more
info and installation instructions.

License
-------
The Smalltalk Labs Browser for blogs client application is licensed under the
"Apache License, Version 2.0", as is the server. Provided in this repository is
additional software licensed under the MIT license. You can find more specific
information about the licenses in the file LICENSE.TXT.

How to work on the code?
------------------------
I will provide a screencast on how to setup a local development environment
including a crash course on working with Git soon ish. Thankfully, all the tools
used are cross platform so you should have no trouble working on the code on
Linux, Windows or Mac OS X.

If you want to make changes to the client for use only on your website/blog,
to change the design for example or to integrate it in some way with your blog,
please wait for the public API which is coming soon. This JavaScript API will
allow you to modify the client without having to deploy a forked client and
server on your website and with a lower risk of automatic updates breaking
your modifications.
