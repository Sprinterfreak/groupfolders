import ACL_PROPERTIES from './model/Properties';
import Rule from './model/Rule'

_.extend(OC.Files.Client, ACL_PROPERTIES);

// Allow nested properties in PROPPATCH
// WIP branch at https://github.com/juliushaertl/davclient.js/tree/enhancement/nested-proppatch
var patchClientForNestedPropPatch = function (client) {
	client._client.getPropertyBody = function(key, propValue) {
		var property = this.parseClarkNotation(key);
		var propName;

		if (this.xmlNamespaces[property.namespace]) {
			propName = this.xmlNamespaces[property.namespace] + ':' + property.name;
		} else {
			propName = 'x:' + property.name + ' xmlns:x="' + property.namespace + '"';
		}

		if (Array.isArray(propValue)) {
			var body = '';
			for(var ii in propValue) {
				if ( propValue[ii].hasOwnProperty('type') && propValue[ii].hasOwnProperty('data') ) {
					body += this.getPropertyBody(propValue[ii].type, propValue[ii].data);
				} else {
					body += this.getPropertyBody(ii, propValue[ii]);
				}
			}
			return '      <' + propName + '>' + body + '</' + propName + '>';
		} else if (typeof propValue === 'object') {
			var body = '';
			if ( propValue.hasOwnProperty('type') && propValue.hasOwnProperty('data') ) {
				return this.getPropertyBody(propValue.type, propValue.data)
			}
			for(var ii in propValue) {
				body += this.getPropertyBody(ii, propValue[ii]);
			}
			return '      <' + propName + '>' + body + '</' + propName + '>';
		} else {
			// FIXME: hard-coded for now until we allow properties to
			// specify whether to be escaped or not
			if (propName !== 'd:resourcetype') {
				propValue = dav._escapeXml('' + propValue);
			}

			return '      <' + propName + '>' + propValue + '</' + propName + '>';
		}
	}
	client._client._renderPropSet = function(properties) {
		var body = '  <d:set>\n' +
			'   <d:prop>\n';

		for(var ii in properties) {
			if (!properties.hasOwnProperty(ii)) {
				continue;
			}

			body += this.getPropertyBody(ii, properties[ii])
		}
		body +='    </d:prop>\n';
		body +='  </d:set>\n';
		return body;
	}
};

var client = OCA.Files.App.fileList.filesClient;
client.addFileInfoParser(function(response) {
	var data = {};
	var props = response.propStat[0].properties;
	var acls = props[ACL_PROPERTIES.PROPERTY_ACL_LIST];
	if (!_.isUndefined(acls)) {
		data.acl = [];
		for (var i = 0; i < acls.length; i++) {
			var acl = {};
			for (var ii in acls[i].children) {
				var prop = acls[i].children[ii];
				if (!prop.nodeName) {
					continue;
				}

				var propertyName = prop.nodeName.split(':')[1] || '';
				switch (propertyName) {
					case 'acl-mapping-id':
						acl.mappingId = prop.textContent || prop.text;
						break;
					case 'acl-mapping-type':
						acl.mappingType = prop.textContent || prop.text;
						break;
					case 'acl-mask':
						acl.mask = parseInt(prop.textContent || prop.text, 10);
						break;
					case 'acl-permissions':
						acl.permissions = parseInt(prop.textContent || prop.text, 10);
						break;
					default:
						break;
				}
			}
			data.acl.push(acl);
		}
	}
	return data;
});
patchClientForNestedPropPatch(client);

class AclDavService {

	propFind(model) {
		return client.getFileInfo(model.path + '/' + model.name, {
			properties: [OC.Files.Client.PROPERTY_ACL_LIST]
			} ).then((status, fileInfo) => {
				if (fileInfo) {
					let acls = []
					for ( let i in fileInfo.acl ) {
						let acl = new Rule()
						acl.fromValues(
							fileInfo.acl[i].mappingType,
							fileInfo.acl[i].mappingId,
							fileInfo.acl[i].mask,
							fileInfo.acl[i].permissions,
						)
						acls.push(acl);
					}
					return acls;
				}
				return null;
			});
	}
	// TODO list
	propPatch(model, acls) {
		var aclList = [];
		for (let i in acls) {
			aclList.push({type: ACL_PROPERTIES.PROPERTY_ACL_ENTRY, data: acls[i].getProperties()})
		}
		var props = {};
		props[OC.Files.Client.PROPERTY_ACL_LIST] = aclList;
		client._client.propPatch(client._client.baseUrl + model.path + '/' + model.name, props).then((response) => console.log(response))
	}
}

export default new AclDavService();
