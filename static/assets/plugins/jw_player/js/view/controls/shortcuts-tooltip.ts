import shortcutTooltipTemplate from 'view/controls/templates/shortcuts-tooltip';
import { createElement, removeClass, addClass, prependChild } from 'utils/dom';
import UI from 'utils/ui';
import button from 'view/controls/components/button';
import { cloneIcon } from 'view/controls/icons';
import type { PlayerAPI, StringObject } from 'types/generic.type';
import type ViewModel from 'view/view-model';

type Shortcut = {
    key: string;
    description: string;
}

type ShortcutsTooltip = {
    el: HTMLElement;
    open: () => void;
    close: () => void;
    destroy: () => void;
    toggleVisibility: () => void;
}

function getShortcuts(shortcuts: StringObject): Shortcut[] {
    const {
        playPause,
        volumeToggle,
        fullscreenToggle,
        seekPercent,
        increaseVolume,
        decreaseVolume,
        seekForward,
        seekBackward,
        spacebar,
        captionsToggle
    } = shortcuts;

    return [
        {
            key: spacebar,
            description: playPause
        },
        {
            key: '↑',
            description: increaseVolume
        },
        {
            key: '↓',
            description: decreaseVolume
        },
        {
            key: '→',
            description: seekForward
        },
        {
            key: '←',
            description: seekBackward
        },
        {
            key: 'c',
            description: captionsToggle
        },
        {
            key: 'f',
            description: fullscreenToggle
        },
        {
            key: 'm',
            description: volumeToggle
        }, {
            key: '0-9',
            description: seekPercent
        }
    ];
}

export default function (
    container: HTMLElement,
    api: PlayerAPI,
    model: ViewModel,
    onVisibility: (visible: boolean) => void
): ShortcutsTooltip {
    let isOpen = false;
    const shortcuts = model.get('localization').shortcuts;
    const template = createElement(
        shortcutTooltipTemplate(getShortcuts(shortcuts), shortcuts.keyboardShortcuts)
    );
    const shortcutToggleUi = new UI(template.querySelector('.jw-switch'));

    const open = () => {
        shortcutToggleUi.el.setAttribute('aria-checked', model.get('enableShortcuts'));

        addClass(template, 'jw-open');
        template.querySelector('.jw-shortcuts-close').focus();
        document.addEventListener('click', documentClickHandler);
        isOpen = true;
        onVisibility(true);
    };

    const close = () => {
        removeClass(template, 'jw-open');
        document.removeEventListener('click', documentClickHandler);
        isOpen = false;
        onVisibility(false);
    };

    const destroy = () => {
        close();
        shortcutToggleUi.destroy();
    };

    const documentClickHandler = (e: Event) => {
        const target = e.target as HTMLElement;
        if (!/jw-shortcuts|jw-switch/.test(target.className)) {
            close();
        }
    };

    const toggleClickHandler = (e: Event) => {
        const toggle = e.currentTarget as HTMLElement;
        const isChecked = toggle.getAttribute('aria-checked') !== 'true';
        toggle.setAttribute('aria-checked', isChecked.toString());
        model.set('enableShortcuts', isChecked);
    };

    const toggleVisibility = () => {
        if (isOpen) {
            close();
        } else {
            open();
        }
    };

    const render = () => {
        const closeButton = button('jw-shortcuts-close', close, model.get('localization').close, [cloneIcon('close')]);

        //  Append close button to modal.
        prependChild(template, closeButton.element());
        closeButton.show();

        //  Append modal to container
        container.appendChild(template);

        shortcutToggleUi.on('click', toggleClickHandler);
    };

    render();

    return {
        el: template,
        open,
        close,
        destroy,
        toggleVisibility
    };
}
