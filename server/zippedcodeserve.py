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

# This file includes code from zipserve
#   zipserve is available at the URL:(http://code.google.com/p/googleappengine/source/browse/trunk/python/google/appengine/ext/zipserve/__init__.py)
#
# zipserve is licensed as follows:
#
# Copyright 2007 Google Inc.
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

import email.Utils
import logging
import mimetypes
import time
import zipfile
import os
from google.appengine.ext import zipserve
from google.appengine.ext import blobstore
from google.appengine.ext.webapp import blobstore_handlers
from google.appengine.ext import db
from google.appengine.ext.webapp import template

class CodeZipfile(db.Model):
	sttype = db.StringProperty(required=True)
	stversion = db.StringProperty(required=True)
	zipfile = blobstore.BlobReferenceProperty(required=True)

class ZippedCodeServe(zipserve.ZipHandler):
	def get(self, sttype, stversion, name):
		zipfiles = db.GqlQuery(
			"SELECT * FROM CodeZipfile WHERE sttype = :1 "
			"AND stversion = :2", sttype, stversion).fetch(1)
		
		if(len(zipfiles) > 0):
			blobinfo = zipfiles[0].zipfile
			self.ServeFromZipFile(name, self.request.get('callback'), blobinfo.key(), self.request.get('type'), sttype, stversion)
		else:
			self.error(404)
			self.response.out.write('Not found')
			return

	def ServeFromZipFile(self, name, callback, blobkey, type, sttype, stversion):
		try:
			zipfile_object = zipfile.ZipFile(blobstore.BlobReader(blobkey, buffer_size=1048576))
		except (IOError, RuntimeError), err:
			zipfile_object = ''
		if zipfile_object == '':
			self.error(404)
			self.response.out.write('Not found')
			return
		try:
			data = zipfile_object.read(name)
		except (KeyError, RuntimeError), err:
			self.error(404)
			self.response.out.write('Not found')
			return
		content_type, encoding = mimetypes.guess_type(name)
		if type == "json":
			self.response.headers['Content-Type'] = 'text/javascript'
			self.SetCachingHeaders()
			self.response.out.write(callback + '(' + data + ')')
		else:
			self.response.headers['Content-Type'] = 'text/html'
			self.SetCachingHeaders()
			path = os.path.join(os.path.dirname(__file__), 'class.html')
			template_values = {
				'classdata': data,
				'classname': name,
				'sttype': sttype,
				'stversion' :stversion
			}
			self.response.out.write(template.render(path, template_values))
