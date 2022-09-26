import { normalizeAspectRatio, normalizeSize } from 'api/config-normalization';
import { loadFrom, getScriptPath } from 'utils/playerutils';
import { serialize } from 'utils/parser';
import { isValidNumber, isNumber, pick, isBoolean } from 'utils/underscore';
import { Features } from 'environment/environment';
import en from 'assets/translations/en.js';
import { getLanguage, getCustomLocalization, applyTranslation, normalizeIntl } from 'utils/language';

/* eslint camelcase: 0 */
// Defaults
// Alphabetical order
export const Defaults = {
    autoPause: {
        viewability: false,
        pauseAds: false
    },
    autostart: false,
    allowFullscreen: true,
    bandwidthEstimate: null,
    bitrateSelection: null,
    castAvailable: false,
    controls: true,
    cues: [],
    defaultPlaybackRate: 1,
    displaydescription: true,
    displaytitle: true,
    displayPlaybackLabel: false,
    enableShortcuts: true,
    height: 360,
    intl: {},
    item: 0,
    language: 'en',
    liveTimeout: null,
    localization: en,
    mute: false,
    nextUpDisplay: true,
    playbackRateControls: false,
    playbackRates: [0.5, 1, 1.25, 1.5, 2],
    renderCaptionsNatively: false,
    repeat: false,
    stretching: 'uniform',
    volume: 90,
    width: 640
};

export function getLiveSyncDuration(liveSyncDuration) {
    if (liveSyncDuration < 5) {
        return 5;
    }
    if (liveSyncDuration > 30) {
        return 30;
    }
    return liveSyncDuration;
}

function _deserialize(options) {
    Object.keys(options).forEach((key) => {
        if (key === 'id') {
            return;
        }
        options[key] = serialize(options[key]);
    });
}


function _adjustDefaultBwEstimate(estimate) {
    const parsedEstimate = parseFloat(estimate);
    if (isValidNumber(parsedEstimate)) {
        return Math.max(parsedEstimate, 1);
    }

    return Defaults.bandwidthEstimate;
}

const Config = function(options, persisted) {
    let allOptions = Object.assign({}, (window.jwplayer || {}).defaults, persisted, options);
    _deserialize(allOptions);

    const language = allOptions.forceLocalizationDefaults ? Defaults.language : getLanguage();
    const intl = normalizeIntl(allOptions.intl);

    allOptions.localization = applyTranslation(en, getCustomLocalization(allOptions, intl, language));

    let config = Object.assign({}, Defaults, allOptions);
    if (config.base === '.') {
        config.base = getScriptPath('jwplayer.js');
    }
    config.base = (config.base || loadFrom()).replace(/\/?$/, '/');
    // eslint-disable-next-line
    __webpack_public_path__ = config.base;
    config.width = normalizeSize(config.width);
    config.height = normalizeSize(config.height);
    config.aspectratio = normalizeAspectRatio(config.aspectratio, config.width);
    config.volume = isValidNumber(config.volume) ? Math.min(Math.max(0, config.volume), 100) : Defaults.volume;
    config.mute = !!config.mute;
    config.language = language;
    config.intl = intl;

    const playlistIndex = config.playlistIndex;
    if (playlistIndex) {
        config.item = playlistIndex;
    }

    if (!isNumber(config.item)) {
        config.item = 0;
    }

    // If autoPause is configured with an empty block,
    // default autoPause.viewability to true.
    let autoPause = allOptions.autoPause;
    if (autoPause) {
        config.autoPause.viewability = ('viewability' in autoPause) ? !!autoPause.viewability : true;
    }

    let rateControls = config.playbackRateControls;

    if (rateControls) {
        let rates = config.playbackRates;

        if (Array.isArray(rateControls)) {
            rates = rateControls;
        }
        rates = rates.filter(rate => isNumber(rate) && rate >= 0.25 && rate <= 4)
            .map(rate => Math.round(rate * 100) / 100);

        if (rates.indexOf(1) < 0) {
            rates.push(1);
        }
        rates.sort();

        config.playbackRateControls = true;
        config.playbackRates = rates;
    }

    // Set defaultPlaybackRate to 1 if the value from storage isn't in the playbackRateControls menu
    if (!config.playbackRateControls || config.playbackRates.indexOf(config.defaultPlaybackRate) < 0) {
        config.defaultPlaybackRate = 1;
    }

    config.playbackRate = config.defaultPlaybackRate;

    if (!config.aspectratio) {
        delete config.aspectratio;
    }

    const configPlaylist = config.playlist;
    if (!configPlaylist) {
        // This is a legacy fallback, assuming a playlist item has been flattened into the config
        const obj = pick(config, [
            'title',
            'description',
            'type',
            'mediaid',
            'image',
            'images',
            'file',
            'sources',
            'tracks',
            'preload',
            'duration'
        ]);

        config.playlist = [ obj ];
    } else if (Array.isArray(configPlaylist.playlist)) {
        // The "playlist" in the config is actually a feed that contains a playlist
        config.feedData = configPlaylist;
        config.playlist = configPlaylist.playlist;
    }

    config.qualityLabels = config.qualityLabels || config.hlslabels;
    delete config.duration;

    let liveTimeout = config.liveTimeout;
    if (liveTimeout !== null) {
        if (!isValidNumber(liveTimeout)) {
            liveTimeout = null;
        } else if (liveTimeout !== 0) {
            liveTimeout = Math.max(30, liveTimeout);
        }
        config.liveTimeout = liveTimeout;
    }

    const parsedBwEstimate = parseFloat(config.bandwidthEstimate);
    const parsedBitrateSelection = parseFloat(config.bitrateSelection);
    config.bandwidthEstimate = isValidNumber(parsedBwEstimate) ? parsedBwEstimate : _adjustDefaultBwEstimate(config.defaultBandwidthEstimate);
    config.bitrateSelection = isValidNumber(parsedBitrateSelection) ? parsedBitrateSelection : Defaults.bitrateSelection;

    config.liveSyncDuration = getLiveSyncDuration(config.liveSyncDuration);

    config.backgroundLoading = isBoolean(config.backgroundLoading) ? config.backgroundLoading : Features.backgroundLoading;
    return config;
};

export default Config;
