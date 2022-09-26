import { loadFile } from 'controller/tracks-loader';
import { createId, createLabel } from 'controller/tracks-helper';
import Events from 'utils/backbone.events';
import { WARNING } from 'events/events';

/* Displays closed captions or subtitles on top of the video */
const Captions = function(_model) {

    let _tracks = [];
    let _tracksById = {};
    let _unknownCount = 0;
    let _defaultIndex = 0;

    // Reset and load external captions on playlist item
    _model.on('change:playlistItem', (model) => {
        _tracks = [];
        _tracksById = {};
        _unknownCount = 0;

        // Update model without dispatching events
        const attributes = model.attributes;
        attributes.captionsIndex = 0;
        attributes.captionsList = _captionsMenu();
        model.set('captionsTrack', null);
    }, this);

    // Update tracks once we know "renderCaptionsNatively" based on provider
    _model.on('change:itemReady', () => {
        // Sideload tracks when not rendering natively
        const item = _model.get('playlistItem');
        const tracks = item.tracks;
        const len = tracks && tracks.length;
        if (len && !_model.get('renderCaptionsNatively')) {
            for (let i = 0; i < len; i++) {
                /* eslint-disable no-loop-func */
                const track = tracks[i];
                if (!track.includedInManifest && _kindSupported(track.kind) && !_tracksById[track._id]) {
                    track.sideloaded = true;
                    _addTrack(track);
                    loadFile(track, (vttCues) => {
                        _addVTTCuesToTrack(track, vttCues);
                    }, error => {
                        this.trigger(WARNING, error);
                    });
                }
            }
        }
        _setCaptionsList();
    }, this);

    // Listen for captions menu index changes from the view
    _model.on('change:captionsIndex', (model, captionsMenuIndex) => {
        let track = null;
        if (captionsMenuIndex !== 0) {
            track = _tracks[captionsMenuIndex - 1];
        }
        model.set('captionsTrack', track);
    }, this);

    function _setSubtitlesTracks(tracks) {
        if (!Array.isArray(tracks)) {
            return;
        }
        if (!tracks.length) {
            _tracks = [];
            _tracksById = {};
            _unknownCount = 0;
        } else {
            tracks.forEach(track => _addTrack(track));
            // Make _tracks order match (video) tracks
            _tracks.sort((trackA, trackB) => {
                const videoTracksIndexOfA = tracks.indexOf(trackA);
                if (videoTracksIndexOfA === -1) {
                    return 1;
                }
                const videoTracksIndexOfB = tracks.indexOf(trackB);
                if (videoTracksIndexOfB === -1) {
                    return -1;
                }
                return videoTracksIndexOfA - videoTracksIndexOfB;
            });
        }

        _setCaptionsList();
    }

    function _kindSupported(kind) {
        return kind === 'subtitles' || kind === 'captions';
    }

    function _addVTTCuesToTrack(track, vttCues) {
        track.data = vttCues;
    }

    function _addTrack(track) {
        track.data = track.data || [];
        track.name = track.label || track.name || track.language;
        const id = createId(track, _tracks.length);

        if (!track.name) {
            const labelInfo = createLabel(track, _unknownCount);
            track.name = labelInfo.label;
            _unknownCount = labelInfo.unknownCount;
        }

        // During the same playlist we may re-add tracks with the same _id; allow the new track to replace the old
        track._id = id;
        _tracksById[id] = track;
        _tracks = _tracks.filter(tr => tr._id !== id);
        _tracks.push(track);
    }

    function _captionsMenu() {
        const list = [{
            id: 'off',
            label: 'Off'
        }];
        if (!!_model.get('castActive')) {
            _tracks = _tracks.filter(tr => tr._id.indexOf('nativesubtitles') !== -1);
        }
        for (let i = 0; i < _tracks.length; i++) {
            list.push({
                id: _tracks[i]._id,
                label: _tracks[i].name || 'Unknown CC',
                language: _tracks[i].language,
            });
        }
        return list;
    }

    function _selectDefaultIndex(defaultIndex) {
        let captionsMenuIndex = _defaultIndex = defaultIndex;
        const label = _model.get('captionLabel');

        // Because there is no explicit track for "Off"
        //  it is the implied zeroth track
        if (label === 'Off') {
            _model.set('captionsIndex', 0);
            return;
        }

        for (let i = 0; i < _tracks.length; i++) {
            const track = _tracks[i];
            if (label && label === track.name) {
                captionsMenuIndex = i + 1;
                break;
            } else if (track.default || track.defaulttrack || track._id === 'default') {
                captionsMenuIndex = i + 1;
            } else if (track.autoselect) {
                // TODO: auto select track by comparing track.language to system lang
            }
        }
        // set the index without the side effect of storing the Off label in _selectCaptions
        _setCurrentIndex(captionsMenuIndex);
    }

    function _setCurrentIndex(index) {
        if (_tracks.length) {
            _model.setVideoSubtitleTrack(index, _tracks);
        } else {
            _model.set('captionsIndex', index);
        }
    }

    function _setCaptionsList() {
        const captionsList = _captionsMenu();
        if (listIdentity(captionsList) !== listIdentity(_model.get('captionsList'))) {
            _model.set('captionsList', captionsList);
            _selectDefaultIndex(_defaultIndex);
        }
    }

    function listIdentity(list) {
        return list.map(item => `${item.id}-${item.label}`).join(',');
    }

    this.setSubtitlesTracks = _setSubtitlesTracks;

    this.selectDefaultIndex = _selectDefaultIndex;

    this.getCurrentIndex = function() {
        return _model.get('captionsIndex');
    };

    this.getCaptionsList = function() {
        return _model.get('captionsList');
    };

    this.destroy = function() {
        this.off(null, null, this);
    };
};

Object.assign(Captions.prototype, Events);

export default Captions;
