export default (menu, localization) => {
    const { items = [] } = menu;
    const menuItems = items.map(item => rightClickItem(item, localization));

    return (
        `<div class="jw-rightclick jw-reset">` +
            `<ul class="jw-rightclick-list jw-reset">${menuItems.join('')}</ul>` +
        `</div>`
    );
};

const rightClickItem = (item, localization) => {
    const { featured, showLogo, type } = item;
    item.logo = showLogo ? `<span class="jw-rightclick-logo jw-reset"></span>` : '';
    return `<li class="jw-reset jw-rightclick-item ${featured ? 'jw-featured' : ''}">${itemContentTypes[type](item, localization)}</li>`;
};

const itemContentTypes = {
    link: ({ link, title, logo }) => `<a href="${link || ''}" class="jw-rightclick-link jw-reset-text" target="_blank" rel="noreferrer" dir="auto">${logo}${title || ''}</a>`,
    share: (item, localization) => `<button type="button" class="jw-reset-text jw-rightclick-link jw-share-item" dir="auto">${localization.sharing.heading}</button>`,
    pip: (item, localization) => `<button type="button" class="jw-reset-text jw-rightclick-link jw-pip-item" dir="auto">${localization.pipIcon}</button>`,
    keyboardShortcuts: (item, localization) => `<button type="button" class="jw-reset-text jw-rightclick-link jw-shortcuts-item" dir="auto">${localization.shortcuts.keyboardShortcuts}</button>`,
    button: ({ title, button }) => `<button type="button" class="jw-reset-text jw-rightclick-link jw-${button.name}-item" dir="auto">${title}</button>`
};


