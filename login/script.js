document.addEventListener('DOMContentLoaded', () => {
	fetch('/verify-token', {
		method: 'POST',
		headers: {
			'Content-type': 'application/json'
		}
	}).then(response => response.json()).then(data => {
		if(data.valid){
			const auth = '<div id = "logged">Already logged</div>';

			const cardBody = document.getElementById('loginBorder');
			cardBody.innerHTML = auth;
		}
	}).catch(e => console.error('Error:', e));
});

document.getElementById('loginForm').addEventListener('submit', (event) => {
	event.preventDefault();

	const username = document.getElementById('username').value;
	const password = document.getElementById('password').value;

	fetch('/login/login.html', {
		method: 'POST',
		headers: {
			'Content-type': 'application/json'
		},
		body: JSON.stringify({
			username: username,
			password: password
		})
	}).then(response => {
		if(response.ok){
			window.location.href = '/';
		}

		else{
			response.json().then(data => {
				const serverErrorMessage = data.error;

				const errorMessage = document.createElement('div');
				errorMessage.id = 'loginError';
				errorMessage.style.transition = 'opacity 1.5s linear'
				errorMessage.textContent = serverErrorMessage;

				const cardBody = document.getElementById('loginBorder');
				cardBody.insertBefore(errorMessage, cardBody.firstChild);
				setTimeout(() => {
					errorMessage.style.opacity = '0';

					setTimeout(() => {
						cardBody.removeChild(errorMessage);
					}, 1500);
				}, 3500);
			});
		}
	}).catch(e => console.error('Error:', e));
});

document.addEventListener('DOMContentLoaded', () => {
	const bar = document.getElementById('bar-vertical');
	const letters = document.querySelectorAll('span.titre');
	let index = 0;

	const revealLetter = () => {
		if (index < letters.length) {
			letters[index].style.display = 'inline';
			index++;
			setTimeout(revealLetter, 300);
		} else {
			setTimeout(() => {
				bar.classList.remove('blink');
			}, 500);
		}
	};

	bar.classList.add('blink');
	setTimeout(revealLetter, 1000);
});