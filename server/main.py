#!/usr/bin/env python
#
# Copyright 2010 Christoph Budzinski
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import os
from google.appengine.ext import webapp
from google.appengine.ext.webapp import template
from google.appengine.ext.webapp import util
from google.appengine.ext import db
from google.appengine.api import users
from google.appengine.ext import blobstore
from google.appengine.ext.webapp import blobstore_handlers
import zippedcodeserve

class IndexHandler(webapp.RequestHandler):
	def get(self):
		path = os.path.join(os.path.dirname(__file__), 'index.html')
		self.response.out.write(template.render(path, None))
		
class ConfigHandler(webapp.RequestHandler):
	def get(self):
		path = os.path.join(os.path.dirname(__file__), 'config.html')
		self.response.out.write(template.render(path, None))
		
class LinkgenHandler(webapp.RequestHandler):
	def get(self):
		path = os.path.join(os.path.dirname(__file__), 'linkgen.html')
		self.response.out.write(template.render(path, None))
		
class PrivacyHandler(webapp.RequestHandler):
	def get(self):
		path = os.path.join(os.path.dirname(__file__), 'privacy.html')
		self.response.out.write(template.render(path, None))
		
class LicenseHandler(webapp.RequestHandler):
	def get(self):
		path = os.path.join(os.path.dirname(__file__), 'license.html')
		self.response.out.write(template.render(path, None))

class CodeUploadFormHandler(webapp.RequestHandler):
	def get(self):
		if users.is_current_user_admin():
			upload_url = blobstore.create_upload_url('/process_upload_code')
			
			zipfiles = db.GqlQuery("SELECT * FROM CodeZipfile")
			for zipfile in zipfiles:
				self.response.out.write(
					'sttype => ' + zipfile.sttype + ', stversion => ' + zipfile.stversion + ', zipfile => ' + str(zipfile.zipfile.key()) + '<br>')
			
			self.response.out.write(
				'<form method="POST" action="%s" enctype="multipart/form-data">' % upload_url)
			self.response.out.write(
				"""
				<p>Smalltalk Type <input type="text" name="sttype"></p>
				<p>Smalltalk Version <input type="text" name="stversion"></p>
				<p>File <input type="file" name="file"></p>
				<p><input type="submit" name="submit" value="Upload"></p>
				</form>""")
		else:
			self.redirect(users.create_login_url("/upload_code"))

class CodeUploadHandler(blobstore_handlers.BlobstoreUploadHandler):
	def post(self):
		if users.is_current_user_admin():
			upload_files = self.get_uploads('file')
			blob_info = upload_files[0]
			
			blobkey = blob_info.key()
			sttype = self.request.get('sttype')
			stversion = self.request.get('stversion')
			
			zipfile = CodeZipfile(sttype=sttype, stversion=stversion, zipfile=blobkey)
			zipfile.put()
			self.redirect('/upload_code')
		else:
			self.redirect('/upload_code')

def main():
	application = webapp.WSGIApplication(
		[('/', IndexHandler),
		('/config', ConfigHandler),
		('/linkgen', LinkgenHandler),
		('/privacy', PrivacyHandler),
		('/license', LicenseHandler),
		('/upload_code', CodeUploadFormHandler),
		('/process_upload_code', CodeUploadHandler),
		('/code/([^/]+)/([^/]+)/([^/]+)', zippedcodeserve.ZippedCodeServe)],
		debug=False)
	util.run_wsgi_app(application)


if __name__ == '__main__':
	main()
