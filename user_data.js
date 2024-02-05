const fs = require('fs');
const crypto = require('crypto');

const users_data = {
	'damax': {
		'salt': crypto.randomBytes(16).toString('hex'),
		'passwordHash': ''
	}
};

for(const user of Object.keys(users_data)){
	users_data[user].passwordHash = crypto.pbkdf2Sync('Oµ1Ou1CestBien', users_data[user].salt, 1000, 64, 'sha512').toString('hex');
}

fs.writeFileSync('users_data.json', JSON.stringify(users_data));

console.log('fini');
