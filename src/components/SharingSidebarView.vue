<template>
	<div>
		<div  class="groupfolder-entry">
			<div class="avatar icon-group-white"></div>
			<span class="username">{{ t('groupfolders', 'Groupfolder') }}</span>
		</div>
		<table>
			<thead>
				<tr>
					<th></th>
					<th></th>
					<th>{{ t('groupfolders', 'Read') }}</th>
					<th>{{ t('groupfolders', 'Write') }}</th>
					<th v-if="model.type === 'dir'">{{ t('groupfolders', 'Create') }}</th>
					<th>{{ t('groupfolders', 'Delete') }}</th>
					<th>{{ t('groupfolders', 'Share') }}</th>
					<th></th>
				</tr>
			</thead>
			<tbody>
				<tr v-if="!isAdmin">
					<td><avatar user="admin" :size="24"></avatar></td>
					<td class="username">{{ t('groupfolders', 'You') }}</td>
					<td><AclStateButton :state="getState(OC.PERMISSION_READ, model.permissions, 1)" :read-only="true" /></td>
					<td><AclStateButton :state="getState(OC.PERMISSION_UPDATE, model.permissions, 1)" :read-only="true" /></td>
					<td v-if="model.type === 'dir'"><AclStateButton :state="getState(OC.PERMISSION_CREATE, model.permissions, 1)" :read-only="true" /></td>
					<td><AclStateButton :state="getState(OC.PERMISSION_DELETE, model.permissions, 1)" :read-only="true" /></td>
					<td><AclStateButton :state="getState(OC.PERMISSION_SHARE, model.permissions, 1)" :read-only="true" /></td>
				</tr>
				<tr v-if="isAdmin" v-for="item in list">
					<td><avatar :user="item.mappingId" :size="24"></avatar></td>
					<td class="username">
						{{ item.mappingId }}
						<span v-if="item.mappingType === 'group'">{{ t('groupfolders', '(Group)') }}</span>
					</td>
					<td><AclStateButton :state="getState(OC.PERMISSION_READ, item.permissions, item.mask)" /></td>
					<td><AclStateButton :state="getState(OC.PERMISSION_UPDATE, item.permissions, item.mask)" /></td>
					<td v-if="model.type === 'dir'"><AclStateButton :state="getState(OC.PERMISSION_CREATE, item.permissions, item.mask)" /></td>
					<td><AclStateButton :state="getState(OC.PERMISSION_DELETE, item.permissions, item.mask)" /></td>
					<td><AclStateButton :state="getState(OC.PERMISSION_SHARE, item.permissions, item.mask)" /></td>
					<td><a class="icon-close" v-tooltip="t('groupfolders', 'Remove access rule')" @click="removeAcl(item)"></a></td>
				</tr>
			</tbody>
		</table>
		<button v-if="isAdmin && !showAclCreate" @click="toggleAclCreate"><span class="icon-add"></span> {{ t('groupfolders', 'Add advanced permission rule') }}</button>
		<multiselect v-if="isAdmin && showAclCreate" ref="multiselect" v-model="value" :options="options" @select="createAcl" :reset-after="true">
			<template slot="singleLabel" slot-scope="props">
				<avatar :user="props.option.id" :isNoUser="props.option.type !== 'user'"/> {{ props.option.id }}
				<span v-if="props.option.type === 'group'">{{ t('groupfolders', '(Group)') }}</span>
			</template>
			<template slot="option" slot-scope="props">
				<avatar :user="props.option.id" :isNoUser="props.option.type !== 'user'"/> {{ props.option.id }}
				<span v-if="props.option.type === 'group'">{{ t('groupfolders', '(Group)') }}</span>
			</template>
		</multiselect>
		<pre>{{ fileModel }}</pre>
	</div>
</template>

<script>
	import { Avatar, Multiselect } from 'nextcloud-vue';
	import AclStateButton from './AclStateButton'
	import Rule from './../model/Rule'

	import client from './../client'

	export default {
		name: 'SharingSidebarView',
		props: ['fileModel'],
		components: {
			Avatar, Multiselect, AclStateButton
		},
		beforeMount() {
			this.model = JSON.parse(JSON.stringify(this.fileModel))
			client.propFind(this.model).then((acls) => {
				this.list = acls;
			})

			/*let rule = new Rule();
			rule.fromValues('user', 'example1', 0, 0);
			this.list.push(rule);
			rule = new Rule();
			rule.fromValues('group', 'group1', 0b00100, 0b00001);
			this.list.push(rule);
			rule = new Rule();
			rule.fromValues('group', 'group2', 0b00000, 0b11111);
			this.list.push(rule);
			rule = new Rule();
			rule.fromValues('user', 'user_of_group2', 0b11100, 0b11100);
			this.list.push(rule);*/
		},
		data() {
			return {
				showAclCreate: false,
				options: [
					{type: 'user', 'id': 'admin'},
					{type: 'group', 'id': 'admin'},
					{type: 'user', 'id': 'foo'},
					{type: 'user', 'id': 'bar'},
					{type: 'group', 'id': 'admin'}
				],
				value: null,
				model: null,
				list: [],
			}
		},
		computed: {
			isAdmin() {
				return OC.isUserAdmin()
			},
			isInherited() {
				return (permission, permissions, mask) => {
					return (permission & ~mask) === 0
				}
			},
			isAllowed() {
				return (permission, permissions) => {
					return (permission & permissions) > 0
				}
			},
			getState() {
				return (permission, permissions, mask) => {
					const inheritance = this.isInherited(permission, permissions, mask) << 1
					const permitted = this.isAllowed(permission, permissions)
					function dec2bin(dec){
						return (dec >>> 0).toString(2);
					}
					//console.log(dec2bin(permission), dec2bin(permissions), dec2bin(mask), dec2bin(inheritance), dec2bin(permitted))
					return inheritance | permitted;
				}
			}
		},
		methods: {
			toggleAclCreate() {
				this.showAclCreate = !this.showAclCreate;
			},
			createAcl(option) {
				console.log(option);
				let rule = new Rule();
				rule.fromValues(option.type, option.id, 0b00000, 0b11111);
				console.log(rule);
				this.list.push(rule);
				client.propPatch(this.model, this.list);

				this.showAclCreate = false;
			},
			removeAcl(rule) {
				var index = this.list.indexOf(rule);
				if (index > -1) {
					this.list.splice(index, 1);
				}
				client.propPatch(this.model, this.list);

				this.showAclCreate = false;
			}
		}
	}
</script>

<style scoped>
	.groupfolder-entry {
		height: 44px;
		white-space: normal;
		display: inline-flex;
		align-items: center;
		position: relative;
	}
	.avatar.icon-group-white {
		display: inline-block;
		background-color: var(--color-primary, #0082c9);
		padding: 16px;
	}
	.groupfolder-entry .username {
		padding: 0 8px;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}
	table {
		width: 100%;
		margin-top: -44px;
		margin-bottom: 5px;
	}
	thead th {
		text-align: center;
		height: 44px;
	}
	tbody tr td:first-child {
		width: 24px;
		padding: 0;
		padding-left: 4px;
	}
	table .avatardiv {
		margin-top: 6px;
	}
	table .username {
		width: 50%;
	}
	table button {
		height: 26px;
		width: 24px !important;
		display: block;
		border-radius: 50%;
		margin: auto;
	}
	a.icon-close {
		display: inline-block;
		height: 24px;
		vertical-align: middle;
		background-size: 12px;
		opacity: .7;
		float: right;
	}
	a.icon-close:hover {
		opacity: 1;
	}

	.multiselect {
		margin-left: 44px;
		width: calc(100% - 44px);
	}
</style>
