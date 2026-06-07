import { isTrue } from '../consts';

export const handleDropDown = (className: string) => {
	if (document.querySelector(`.${className}`)) {
		const faqItems = document.querySelectorAll<HTMLLIElement>(
			`.${className}`
		);

		faqItems.forEach((faq) => {
			const btn = faq.firstElementChild;

			if (btn) {
				btn.addEventListener('click', () => {
					const isActive = isTrue(faq?.dataset?.expanded ?? 'false');

					faqItems.forEach((item) => {
						item.dataset.expanded = 'false';
					});

					faq.dataset.expanded = (!isActive).toString();
				});
			}
		});
	} else {
		throw Error(`${className} does not match any valid dom element`);
	}
};
