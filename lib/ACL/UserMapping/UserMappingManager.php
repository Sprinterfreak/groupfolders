<?php declare(strict_types=1);
/**
 * @copyright Copyright (c) 2019 Robin Appelman <robin@icewind.nl>
 *
 * @license GNU AGPL version 3 or any later version
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 */

namespace OCA\GroupFolders\ACL\UserMapping;

use OCP\IGroupManager;
use OCP\IUser;

class UserMappingManager implements IUserMappingManager {
	private $groupManager;

	public function __construct(IGroupManager $groupManager) {
		$this->groupManager = $groupManager;
	}

	public function getMappingsForUser(IUser $user, bool $userAssignable = true): array {
		$groupMappings = array_map(function (string $groupId) {
			return new UserMapping('group', $groupId);
		}, $this->groupManager->getUserGroupIds($user));

		return array_merge([
			new UserMapping('user', $user->getUID())
		], $groupMappings);
	}

	public function mappingFromId(string $type, string $id): IUserMapping {
		return new UserMapping($type, $id);
	}
}
