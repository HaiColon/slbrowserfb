// Copyright (C) 2010 Christoph Budzinski
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
// limitations under the License.

var SLB = function() {
	// private vars
	var browsedLink = null;
	var classes = new Array();
	var classesmeta = new Array();
	var itemClickEvents = new Array();
	var databaseurl = "http://localhost:8080/code/";
	var isSlbLinkRegex = new RegExp(databaseurl + "([a-zA-Z]+)/([0-9\.]+)/([a-zA-Z0-9]+)");
	var slLinkEnabled = true;
	var isDragging = false;
	var mouseX = 0;
	var mouseY = 0;
	var dragposx = 0;
	var dragposy = 0;
	var isDownloading = false;
	var downloadTimeout = null;
	var downloadRequest = null;
	
	// global event handlers, at the moment only used for dragging
	var mousePosEventHandler = function(e) {
		mouseX = e.pageX;
		mouseY = e.pageY;
		
		if(isDragging) {
			jQuery("#slb_wrapper").css("left", mouseX - dragposx);
			jQuery("#slb_wrapper").css("top", mouseY - dragposy);
		}
	}
	var mouseUpEventHandler = function(e) {
		if(isDragging) {
			isDragging = false;
			jQuery("#slb_draglayer").remove();
			jQuery(document).unbind("mousemove", mousePosEventHandler);
		}
		jQuery(document).unbind("mouseup", mouseUpEventHandler);
	}
	
	// private methods
	function slbIframeFind(element) {
		return jQuery("#slb_frame").contents().find(element);
	}

	function eachItem(items, block) {
		for(var key in items) {
			if(typeof(items[key]) == "string") {block.call(this, key, atob(items[key]))}
		}
	}
	
	function slbPositionForBrowserY() {
		var y = browsedLink.offset().top - 365;
		if(y < 5) {y = 5;}
		return y;
	}

	function slbPositionBrowserX() {
		var x = browsedLink.offset().left - (250 - browsedLink.width()/2);
		if(x < 5) {x = 5;}
		if(x > jQuery(window).width() - 505) {x = jQuery(window).width() - 505;}
		jQuery("#slb_wrapper").css("left", x);
	}
	
	function slbPositionBrowserOnResize() {
		jQuery("#slb_wrapper").css("top", slbPositionForBrowserY());
		
		slbPositionBrowserX();
	}
	
	function slbClearDownloadTimeout() {
		// clear download timeout (if available)
		if(downloadTimeout != null) {clearTimeout(downloadTimeout); downloadTimeout = null;}
	}
	
	function slbCloseBrowser(onclose) {
		slbClearDownloadTimeout();
		
		jQuery("#slb_wrapper").animate({
			height: 0,
			top: jQuery("#slb_wrapper").offset().top + 370
		}, 400, function() {
			// on animation complete
			jQuery("#slb_wrapper").css("display", "none");
			browsedLink = null;
			
			slbIframeFind("body").empty();
			
			// remove any global event handlers that might have been
			//   left over due to a glitch
			jQuery(document).unbind("mousemove", mousePosEventHandler);
			jQuery(document).unbind("mouseup", mouseUpEventHandler);
			
			if(onclose) {
				onclose.call(this);
			}
		});
	}
	
	function slbShowList() {
		slbIframeFind("#slb_code_wrapper").animate({
			marginLeft: 151
		}, 300);
		
		slbIframeFind("#slb_footer a#slb_togglelist").unbind();
		slbIframeFind("#slb_footer a#slb_togglelist").text("Hide List");
		slbIframeFind("#slb_footer a#slb_togglelist").click(function() {
			slbHideList();
			return false;
		});
	}
	
	function slbHideList() {
		slbIframeFind("#slb_code_wrapper").animate({
			marginLeft: 0
		}, 300);
		
		slbIframeFind("#slb_footer a#slb_togglelist").unbind();
		slbIframeFind("#slb_footer a#slb_togglelist").text("Show List");
		slbIframeFind("#slb_footer a#slb_togglelist").click(function() {
			slbShowList();
			return false;
		});
	}
	
	function slbShowLicense() {
		slbIframeFind("#slb_license_wrapper").animate({
			height: 300
		}, 400);
		slbIframeFind("#slb_footer a#slb_togglelist").hide();
		slbIframeFind("#slb_footer a#slb_togglelicense").unbind();
		slbIframeFind("#slb_footer a#slb_togglelicense").text("Hide License ");
		slbIframeFind("#slb_footer a#slb_togglelicense").click(function() {
			slbHideLicense();
			return false;
		});
	}
	
	function slbHideLicense() {
		slbIframeFind("#slb_license_wrapper").animate({
			height: 0
		}, 400);
		
		slbIframeFind("#slb_footer a#slb_togglelist").show();
		slbIframeFind("#slb_footer a#slb_togglelicense").unbind();
		slbIframeFind("#slb_footer a#slb_togglelicense").text("Show License ");
		slbIframeFind("#slb_footer a#slb_togglelicense").click(function() {
			slbShowLicense();
			return false;
		});
	}
	
	function slbCreateBrowser(x, y, sender) {
		browsedLink = sender;
		
		slbClearDownloadTimeout();
		
		// cancel previous download request (if available)
		downloadRequest = null;
		
		slbIframeFind("body").append('<div id="slb_header">Loading class data, please wait...<div id="slb_close">X</div></div><div id="slb_content"><div id="slb_license_wrapper"><div id="slb_license"></div></div><div id="slb_box"></div></div><div id="slb_footer"><div id="slb_togglelist_wrapper"><a href="#" id="slb_togglelist">Hide List</a></div><div id="slb_togglelicense_wrapper"><a href="#" id="slb_togglelicense">Show License </a></div></div>');
		
		slbIframeFind("#slb_close").click(function() {
			// cancel previous download request (if available)
			downloadRequest = null;
			
			slbCloseBrowser();
			
			return false;
		});
		
		jQuery("#slb_wrapper").css("top", y);
		slbPositionBrowserX();
		
		jQuery("#slb_wrapper").height(0);
		jQuery("#slb_wrapper").css("display", "inline");
		
		jQuery("#slb_wrapper").animate({
			height: 35,
			top: y - 35
		}, 200, function() {
			slbRenderBrowserContent();
		});
	}

	function slbRenderBrowserContent() {
		slbClearDownloadTimeout();
		
		if(typeof(classes[browsedLink.text()]) == "undefined") {
			var classname = browsedLink.text();
			var sttype = classesmeta[classname]["sttype"];
			var stversion = classesmeta[classname]["stversion"];
			isDownloading = true;
			var requestTime = new Date().getTime();
			downloadRequest = requestTime;
			jQuery.getJSON(databaseurl + sttype + "/" + stversion + "/" + classname + "?type=json&callback=?", function(data, textStatus, xhr) {
				if(downloadRequest == requestTime) {
					SLB.addData(data);
					slbRenderBrowserContent();
					isDownloading = false;
				} else {
				}
			});
			
			// timeout based error handling since cross domain requests with JSONP
			//   don't support any kind of error handling at the moment
			downloadTimeout = (setTimeout(function() {
				if(isDownloading) {
					// Show an error message for 2 seconds, then close the window
					slbIframeFind("#slb_header").text("Error: Couldn't download class data");
					setTimeout(function() {
						isDownloading = false;
						slbCloseBrowser();
					}, 2000);
				}
			}, 15000));
		} else {
			slbIframeFind("#slb_box").html('<div id="slb_list_wrapper"><div id="slb_list"></div></div><div id="slb_code_wrapper"><div id="slb_code"></div></div>');
			
			// activate the toggle list button
			slbIframeFind("#slb_footer a#slb_togglelist").click(function() {
				slbHideList();
				return false;
			});
			
			// set the license
			var mitlicense = '<p>Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:</p><p>The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.</p><p>THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.</p>';
			var license = '<hr><h2>Smalltalk Labs Browser for blogs</h2>' +	'<p>Copyright 2010 Christoph Budzinski</p><p>Licensed under the Apache License, Version 2.0 (the "License"); you may not use this software except in compliance with the License. You may obtain a copy of the License at</p><p>   <a href="http://www.apache.org/licenses/LICENSE-2.0">http://www.apache.org/licenses/LICENSE-2.0</a></p><p>Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.</p>';
			var shoutpierlicense = '<hr><h2>ShoutPier Stylesheet</h2><p>Smalltalk Labs Browser for blogs uses the stylesheet of ShoutPier (shoutpier.min.css), minified and slightly modified, to syntax highlight displayed code. ShoutPier is part of the <a href="http://www.piercms.com">Pier</a> CMS which is licensed under the MIT license.</p><p><b>Pier License</b></p>Copyright (C) 2003-2009 Lukas Renggli, renggli at gmail.com<br><br>Copyright (C) 2003-2009 Pier Contributors<br>' + mitlicense;
			var codelicense = classes[browsedLink.text()]["license"];
			if(codelicense == "pharo") {
				codelicense = '<p><b>This code is part of <a href="http://www.pharo-project.org">Pharo</a></b></p><p>Pharo is licensed under the MIT License with parts under the Apache License.</p><p>Copyright (c) Pharo Project, and Contributors Copyright (c) 1996-2008 Viewpoints Research Institute, and Contributors Copyright (c) 1996 Apple Computer, Inc.</p>' + mitlicense + '<p>You may obtain a copy of the Apache License at:</p><p><a href="http://www.apache.org/licenses/LICENSE-2.0">http://www.apache.org/licenses/LICENSE-2.0</a></p>';
			}
			codelicense = '<h2>Displayed source code</h2>' + codelicense;
			slbIframeFind("#slb_license").html(codelicense + license + shoutpierlicense);
			slbIframeFind("#slb_footer a#slb_togglelicense").click(function() {
				slbShowLicense();
				return false;
			});
			
			// set the class documentation
			slbIframeFind("#slb_list").append('<a href="#" class="slb_doc">Class comment</a>');
			
			// class definition
			slbIframeFind("#slb_list").append('<a href="#" class="slb_definition">Class definition</a>');
			
			// instance methods
			var imethods = new Array();
			eachItem(classes[browsedLink.text()]["imethods"], function(key, value) {imethods.push(key)});
			if(imethods.length > 0) {
				slbIframeFind("#slb_list").append('<span>Instace Methods</span>');
				imethods.sort(function(a, b) {
						var valA = a.toLowerCase();
						var valB = b.toLowerCase();
						return (valA < valB) ? -1 : (valA > valB) ? 1 : 0;
				});
				jQuery.each(imethods, function(index, value) {
					slbIframeFind("#slb_list").append('<a href="#" class="slb_imethod">' + value + '</a>');
				});
			}
			
			// class methods
			var cmethods = new Array();
			eachItem(classes[browsedLink.text()]["cmethods"], function(key, value) {cmethods.push(key)});
			if(cmethods.length > 0) {
				slbIframeFind("#slb_list").append('<span>Class Methods</span>');
				cmethods.sort(function(a, b) {
						var valA = a.toLowerCase();
						var valB = b.toLowerCase();
						return (valA < valB) ? -1 : (valA > valB) ? 1 : 0;
				});
				jQuery.each(cmethods, function(index, value) {
					slbIframeFind("#slb_list").append('<a href="#" class="slb_cmethod">' + value + '</a>');
				});
			}
			
			slbIframeFind("#slb_list a").click(function() {
				slbIframeFind("#slb_list a").removeClass("selected");
				jQuery(this).addClass("selected");
				if(jQuery(this).hasClass('slb_imethod')) {
					slbIframeFind("#slb_code").html(atob(classes[browsedLink.text()]["imethods"][jQuery(this).text()]).replace(/	/g, "    "));
					slbIframeFind("#slb_code").css("white-space", "pre");
				} else if(jQuery(this).hasClass('slb_cmethod')) {
					slbIframeFind("#slb_code").html(atob(classes[browsedLink.text()]["cmethods"][jQuery(this).text()]).replace("	", "    "));
					slbIframeFind("#slb_code").css("white-space", "pre");
				} else if(jQuery(this).hasClass('slb_definition')) {
					slbIframeFind("#slb_code").html((classes[browsedLink.text()]["definition"]).replace("	", "    "));
					slbIframeFind("#slb_code").css("white-space", "pre");
				} else if(jQuery(this).hasClass('slb_doc')) {
					slbIframeFind("#slb_code").html(classes[browsedLink.text()]["doc"]);
					slbIframeFind("#slb_code").css("white-space", "pre-wrap");
				}
				
				// public click events
				var type = jQuery(this).attr("class").replace("selected", "").replace(" ", "").substr(4);
				for(var index in itemClickEvents) {
					itemClickEvents[index].call(jQuery(this), type);
				}
				
				return false;
			});
			
			// open up the whole browser now
			jQuery("#slb_wrapper").animate({
				height: 362,
				top: slbPositionForBrowserY()
			}, 200);
			
			if(slLinkEnabled) {
				slbIframeFind("#slb_header").html('<a href="http://smalltalklabs.tumblr.com" target="_blank">Smalltalk Labs</a> Browser > ' + browsedLink.text() + '<div id="slb_close">X</div>');
			} else {
				slbIframeFind("#slb_header").html(browsedLink.text() + '<div id="slb_close">X</div>');
			}
			slbIframeFind("#slb_close").click(function() {
				slbCloseBrowser();
				
				return false;
			});
			
			slbIframeFind("#slb_list a:eq(0)").addClass("selected");
			slbIframeFind("#slb_code").html(classes[browsedLink.text()]["doc"]);
			
			// dragging
			
			slbIframeFind("#slb_header").mousedown(function(e) {
				jQuery(document).mouseup(mouseUpEventHandler);
				var iframe = document.getElementById("slb_frame");
				if(iframe.contentDocument.elementFromPoint(e.pageX, e.pageY).id == "slb_header") {
					jQuery(document).mousemove(mousePosEventHandler);
					jQuery("#slb_wrapper").prepend('<div id="slb_draglayer"></div>');
					jQuery("#slb_draglayer").css({
						position: "absolute",
						left: 0,
						top: 0,
						width: 500,
						height: 362
					});
					isDragging = true;
					dragposx = e.pageX;
					dragposy = e.pageY;
					return false;
				}
			});
		}
	}
	
	function slbAddItemClickEvent(func) {
		itemClickEvents.push(func);
	}
	
	function slbLinkClicked(e) {
		if(browsedLink == null) {
			slbCreateBrowser(jQuery(e.target).offset().left, jQuery(e.target).offset().top, jQuery(e.target));
		} else {
			slbCloseBrowser(function() {
				slbCreateBrowser(jQuery(e.target).offset().left, jQuery(e.target).offset().top, jQuery(e.target));
			});
		}
	}
	
	// public methods
	return {
		linkClicked: slbLinkClicked,
		windowResized: function() {
			if(browsedLink != null) {slbPositionBrowserOnResize();}
		},
		addData: function(data) {
			if(typeof(data) == "string") {data = jQuery.parseJSON(data);}
			var item = new Array();
			item["imethods"] = data["imethods"];
			item["cmethods"] = data["cmethods"];
			item["license"] = atob(data["license"]);
			item["doc"] = atob(data["doc"]);
			item["definition"] = atob(data["definition"]);
			classes[data["class"]] = item;
		},
		convertSlbLinks: function() {
			jQuery("a").filter(function() {return isSlbLinkRegex.test(jQuery(this).attr("href"))}).each(function(index, value) {
				var result = isSlbLinkRegex.exec(jQuery(value).attr("href"));
				var sttype = result[1];
				var stversion = result[2];
				var classname = result[3];
				if(typeof(classesmeta[classname]) == "undefined") {
					classesmeta[classname] = new Array();
				}
				classesmeta[classname]["sttype"] = sttype;
				classesmeta[classname]["stversion"] = stversion;
				
				jQuery(value).click(function(e) {
					SLB.linkClicked(e);
					return false;
				});
			});
		},
		onItemClick: function(func) {
			slbAddItemClickEvent(func);
		},
		disableSLLink: function(func) {
			slLinkEnabled = false;
		}
	};
}();

jQuery(document).ready(function() {
	if(jQuery.browser.webkit || jQuery.browser.mozilla) {
		jQuery("head").append('<link rel="stylesheet" type="text/css" href="slbfb.css" />');
		
		// create slb_wrapper and slb_iframe
		jQuery("body").append('<div id="slb_wrapper"></div>');
		jQuery("#slb_wrapper").append('<iframe name="slb_frame" id="slb_frame" width="500" height="362" frameborder="0" marginheight="0" marginwidth="0" scrolling="no"></iframe>');
		
		// this is an ugly hack for Firefox since it doesn't seem to support
		//   document ready in an iframe
		setTimeout(function() {
			jQuery("#slb_frame").contents().find("head").append('<link rel="stylesheet" type="text/css" href="slbfb_iframe.css" />');
			jQuery("#slb_frame").contents().find("head").append('<link rel="stylesheet" type="text/css" href="shoutpier.css" />');
		}, 500);
		
		SLB.convertSlbLinks();
		
		jQuery(window).resize(function() {
			SLB.windowResized();
		});
    }
});
