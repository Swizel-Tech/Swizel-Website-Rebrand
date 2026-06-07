const toaster = () => {
	type Toast = 'success' | 'danger' | 'warning';

	const allToast = document.querySelectorAll<HTMLDivElement>('.toast-notification');

	const resetToast = () => {
		allToast.forEach((node) => {
			node.dataset.mode = 'hidden';
		});
	};

	const allToastButtons = document.querySelectorAll<HTMLButtonElement>('.toast-button');

	allToastButtons.forEach((btn) => {
		btn.addEventListener('click', () => {
			resetToast();
		});
	});

	const toast = (type: Toast, message: string) => {
		const id = `toast-${type}`;

		const target = document.getElementById(id);
		const messageWrapper = document.querySelector(`#${id} .toast-message`);

		if (target && messageWrapper) {
			target.dataset.mode = 'visible';
			messageWrapper.textContent = message;
		}

		setTimeout(() => {
			resetToast();
		}, 3500);
	};

	return toast;
};

export default toaster;
