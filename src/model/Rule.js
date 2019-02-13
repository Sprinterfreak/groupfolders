
import PROPERTIES from './Properties'

export default class Rule {

	constructor () {

	}

	fromProperties(props) {
		this.mappingType = props[PROPERTIES.PROPERTY_ACL_MAPPING_TYPE];
		this.mappingId = props[PROPERTIES.PROPERTY_ACL_MAPPING_ID];
		this.mask = props[PROPERTIES.PROPERTY_ACL_MASK];
		this.permissions = props[PROPERTIES.PROPERTY_ACL_PERMISSIONS];
	}

	fromValues(mappingType, mappingId, mask = 0, permissions = 31) {
		this.mappingType = mappingType;
		this.mappingId = mappingId;
		this.mask = mask;
		this.permissions = permissions;
	}

	getProperties() {
		var acl = {};
		acl[PROPERTIES.PROPERTY_ACL_MAPPING_TYPE] = this.mappingType
		acl[PROPERTIES.PROPERTY_ACL_MAPPING_ID] = this.mappingId
		acl[PROPERTIES.PROPERTY_ACL_MASK] = this.mask
		acl[PROPERTIES.PROPERTY_ACL_PERMISSIONS] = this.permissions
		return acl;
	}

}
