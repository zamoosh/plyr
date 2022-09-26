import type { HTMLTemplateString } from 'types/generic.type';

export default (id: string, ariaLabel: string): HTMLTemplateString => {
    return (
        `<div id="${id}" class="jwplayer jw-reset jw-state-setup" tabindex="0" aria-label="${(ariaLabel || '')}" role="application">` +
            `<div class="jw-aspect jw-reset"></div>` +
            `<div class="jw-wrapper jw-reset">` +
                `<div class="jw-top jw-reset"></div>` +
                `<div class="jw-aspect jw-reset"></div>` +
                `<div class="jw-media jw-reset"></div>` +
                `<div class="jw-preview jw-reset"></div>` +
                `<div class="jw-title jw-reset-text" dir="auto">` +
                    `<div class="jw-title-primary jw-reset-text"></div>` +
                    `<div class="jw-title-secondary jw-reset-text"></div>` +
                `</div>` +
                `<div class="jw-overlays jw-reset"></div>` +
                `<div class="jw-hidden-accessibility">` +
                    `<span class="jw-time-update" aria-live="assertive"></span>` +
                    `<span class="jw-volume-update" aria-live="assertive"></span>` +
                `</div>` +
            `</div>` +
        `</div>`
    );
};
