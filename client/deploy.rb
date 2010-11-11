# Copyright (C) 2010 Christoph Budzinski
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#
#
# Deploy script for Smalltalk Labs Browser for blogs (SLBfb)
#   This minifies the CSS and JavaScript files and puts them in the deploy
#     directory with copyright info added and local urls changed to remote urls
#
#   You only need this if you want to use SLBfb with your own server
#
#	It uses Yahoo's YUI compressor for CSS and Google's Closure tools for
#     JavaScript files, these are downloaded automatically, but you need the
#     minitar gem that you can install with: gem install archive-tar-minitar
#     You will also need to have Java installed to run these tools
#
#   Tested on Windows 7 with jRuby, but should work on OS X and Linux and with
#     normal Ruby too

require "uri"
require "zlib"
require "net/http"
require "rubygems"
require "archive/tar/minitar"

include Archive::Tar

def download(url, filename)
	uri = URI::parse(url)
	Net::HTTP.start(uri.host) { |http|
		resp = http.get(uri.path)
		open(filename, "wb+") { |file|
			file.write(resp.body)
		}
	}
end

def decompressTGZ(filename, where)
	tgz = Zlib::GzipReader.new(File.open(filename, "rb+"))
	Minitar.unpack(tgz, where)
end

# download tools if necessary
if !File.exists?("tools/")
	Dir.mkdir("tools/")
end
if !File.exists?("tools/yuicompressor-2.4.2.jar")
	puts "Downloading YUI compressor..."
	download("http://slbrowserfb.appspot.com/static/yuicompressor-2.4.2.tar.gz", "tools/yuicompressor-2.4.2.tgz")
	puts "Extracting YUI compressor..."
	decompressTGZ("tools/yuicompressor-2.4.2.tgz", "tools/")
	File.delete("tools/README")
	File.delete("tools/LICENSE.TXT")
	File.delete("tools/yuicompressor-2.4.2.tgz")
end
if !File.exists?("tools/compiler.jar")
	puts "Downloading Google Closure compiler..."
	download("http://closure-compiler.googlecode.com/files/compiler-latest.tar.gz", "tools/closure.tgz")
	puts "Extracting Google Closure compiler..."
	decompressTGZ("tools/closure.tgz", "tools/")
	File.delete("tools/COPYING")
	File.delete("tools/README")
	File.delete("tools/closure.tgz")
end

if !File.exists?("deploy/")
	Dir.mkdir("deploy")
end

puts "Replacing local with remote URLs..."
js = File.read("slbfb.js")
js.gsub!("slbfb.css", "http://slbrowserfb.appspot.com/static/slbfb/v1/slbfb.min.css")
js.gsub!("slbfb_iframe.css", "http://slbrowserfb.appspot.com/static/slbfb/v1/slbfb_iframe.min.css")
js.gsub!("shoutpier.css", "http://slbrowserfb.appspot.com/static/slbfb/v1/shoutpier.min.css")
js.gsub!("http://localhost:8080/code/", "http://slbrowserfb.appspot.com/code/")
open("deploy/slbfb.js", "w") do |f|
	f.puts js
end

puts "Minifying CSS with YUI Compressor..."
system("java -jar tools/yuicompressor-2.4.2.jar slbfb.css -o deploy/slbfb.min.css")
system("java -jar tools/yuicompressor-2.4.2.jar slbfb_iframe.css -o deploy/slbfb_iframe.min.css")
system("java -jar tools/yuicompressor-2.4.2.jar shoutpier.css -o deploy/shoutpier.min.css")

puts "Minifying JavaScript with Google Closure Compiler..."
system("java -jar tools/compiler.jar --js deploy/slbfb.js --js_output_file deploy/slbfb.min.js")

puts "Deleting temporary files..."
File.delete("deploy/slbfb.js")

puts "Adding copyright to minified JS file..."
js = File.read("deploy/slbfb.min.js")
js = '// Smalltalk Labs Browser for blogs
//
// Copyright 2010 Christoph Budzinski
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.' + "\n\n" + js
open("deploy/slbfb.min.js", "w") do |f|
	f.puts js
end

puts
puts "All done!"
puts

puts "Press Enter to close"
gets
