const fs = require('fs');
const path = require('path');
const https = require('https');
const express = require('express');
const ejs = require('ejs');
const ratelimit = require('express-rate-limit');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const host = "0.0.0.0";
const port = 443;

const privateKey = {
	key: fs.readFileSync(path.join(__dirname, 'cert', 'private.pem')),
	passphrase: "cert"
};
const publicKey = fs.readFileSync(path.join(__dirname, 'cert', 'public.pem'));

const options = {
	key: privateKey.key,
	passphrase: privateKey.passphrase,
	cert : fs.readFileSync(path.join(__dirname, 'cert', 'certificate.pem'))
};

let usersData = JSON.parse(fs.readFileSync(path.join(__dirname, 'users_data.json')));

const limiter = ratelimit({
	keyGenerator: function (req, res) {
		return req.ip;
	},
	windowMs: 15 * 60 * 1000,
	max: 150,
	delayAfter: 25,
	delayMs: 50
});

const app = express();
app.use(limiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/login', express.static(path.join(__dirname, 'login')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'login'));

function createToken(username){
	return jwt.sign({ username: username }, privateKey, { expiresIn: '1h', algorithm: 'RS512' });
}

function isTokenValid(token){
	return new Promise((resolve, reject) => {
		if(token){
			jwt.verify(token, publicKey, (err, decoded) => {
				if(err){
					resolve(null);
				}

				else{
					resolve(decoded);
				}
			});
		}

		else{
			resolve(null);
		}
	});
}

async function cookies2token(cookies){
	if(cookies){
		const tokenCookie = cookies.split('; ').find(cookie => cookie.startsWith('token='));

		if(tokenCookie){
			const token = tokenCookie.split('=')[1];
			const tokenDecoded = await isTokenValid(token);

			if(tokenDecoded){
				return tokenDecoded;
			}

			else{
				return null;
			}
		}

		else{
			return null;
		}
	}

	else{
		return null;
	}
}

app.post('/verify-token', async (req, res) => {
	const tokenDecoded = await cookies2token(req.headers.cookie);

	if(tokenDecoded){
		res.json({ valid: true });
	}

	else{
		res.json({ valid: false });
	}
});

app.post('/login/login.html', (req, res) => {
	const username = req.body.username;
	const password = req.body.password;

	const userData = usersData[username];

	if(userData){
		const tryPassHash = crypto.pbkdf2Sync(password, userData.salt, 1000, 64, 'sha512').toString('hex');

		if(userData.passwordHash === tryPassHash){
			const token = createToken(username);

			res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'strict' });
			res.status(200).json({ ok: 'ok' });
		}

		else{
			res.status(401).json({ error: 'Invalid credentials' });
		}
	}

	else{
		res.status(401).json({ error: 'Invalid credentials' });
	}
});

app.use(async (req, res, next) => {
	try{
		const tokenDecoded = await cookies2token(req.headers.cookie);

		if(tokenDecoded){
			next();
		}

		else{
			res.redirect('/login/login.html');
		}
	}

	catch(e){
		res.status(501).send(e.message);
	}
});

app.use('/', express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'templates'));

app.get('/', async (req, res) => {
	try{
		const head = await ejs.renderFile(path.join(__dirname, 'templates', 'head.ejs'), {}, {});
		const header = await ejs.renderFile(path.join(__dirname, 'templates', 'header.ejs'), {}, {});
		res.status(200).render('index', {head: head, header: header});
	}

	catch(e){
		res.status(501).send(e.message);
	}
});

app.use((req, res, next) => {
	res.status(404).send("Error404");
});

const server = https.createServer(options, app);

server.listen(port, host, () => {
	console.log(`Server running at : https://${host}:${port}/`);
});
