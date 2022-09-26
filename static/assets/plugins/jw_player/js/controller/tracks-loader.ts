import VTTCue from 'parsers/captions/vttcue';
import { chunkLoadWarningHandler } from '../api/core-loader';
import { ajax } from 'utils/ajax';
import { localName } from 'parsers/parsers';
import srt from 'parsers/captions/srt';
import dfxp from 'parsers/captions/dfxp';
import { composePlayerError, convertToPlayerError, ERROR_LOADING_CAPTIONS } from 'api/errors';
import type { PlayerError } from 'api/errors';
import type { PlaylistItemTrack } from 'playlist/track';
import type { CaptionEntryData } from 'parsers/captions/captions.types';
import type VTTParser from 'parsers/captions/vttparser';

export function loadFile(
    track: PlaylistItemTrack, 
    successHandler: (cues: VTTCue[]) => void, 
    errorHandler: (err: PlayerError) => void
): void {
    track.xhr = ajax(track.file, function(xhr: XMLHttpRequest): void {
        xhrSuccess(xhr, track, successHandler, errorHandler);
    }, (key: string, url: string, xhr: XMLHttpRequest, error: Error): void => {
        errorHandler(composePlayerError(error, ERROR_LOADING_CAPTIONS));
    });
}

export function cancelXhr(tracks: PlaylistItemTrack[] | null): void {
    if (tracks) {
        tracks.forEach(track => {
            const xhr = track.xhr;
            if (xhr) {
                xhr.onload = null;
                xhr.onreadystatechange = null;
                xhr.onerror = null;
                if ('abort' in xhr) {
                    xhr.abort();
                }
            }
            delete track.xhr;
        });
    }
}

function convertToVTTCues(cues: CaptionEntryData[]): VTTCue[] {
    // VTTCue is available natively or polyfilled where necessary
    return cues.map(cue => new VTTCue(cue.begin, cue.end, cue.text));
}

function xhrSuccess(
    xhr: XMLHttpRequest, 
    track: PlaylistItemTrack, 
    successHandler: (cues: VTTCue[]) => void, 
    errorHandler: (err: PlayerError) => void
): void {
    let xmlRoot = xhr.responseXML ? xhr.responseXML.firstChild : null;
    let cues;
    let vttCues;

    // IE9 sets the firstChild element to the root <xml> tag
    if (xmlRoot) {
        if (localName(xmlRoot) === 'xml') {
            xmlRoot = xmlRoot.nextSibling;
        }
        // Ignore all comments
        while (xmlRoot && xmlRoot.nodeType === xmlRoot.COMMENT_NODE) {
            xmlRoot = xmlRoot.nextSibling;
        }
    }

    try {
        if (xmlRoot && localName(xmlRoot) === 'tt') {
            // parse dfxp track
            if (!xhr.responseXML) {
                throw new Error('Empty XML response');
            }
            cues = dfxp(xhr.responseXML);
            vttCues = convertToVTTCues(cues);
            delete track.xhr;
            successHandler(vttCues);
        } else {
            // parse VTT/SRT track
            const responseText = xhr.responseText;
            if (responseText.indexOf('WEBVTT') >= 0) {
                // make VTTCues from VTT track
                loadVttParser().then((VttParser: typeof VTTParser): void => {
                
                    const parser = new VttParser(window);
                    vttCues = [];
                    parser.oncue = function(cue: VTTCue): void {
                        vttCues.push(cue);
                    };

                    parser.onflush = function(): void {
                        delete track.xhr;
                        successHandler(vttCues);
                    };

                    // Parse calls onflush internally
                    parser.parse(responseText);
                }).catch(error => {
                    delete track.xhr;
                    errorHandler(convertToPlayerError(null, ERROR_LOADING_CAPTIONS, error));
                });
            } else {
                // make VTTCues from SRT track
                cues = srt(responseText);
                vttCues = convertToVTTCues(cues);
                delete track.xhr;
                successHandler(vttCues);
            }
        }
    } catch (error) {
        delete track.xhr;
        errorHandler(convertToPlayerError(null, ERROR_LOADING_CAPTIONS, error));
    }
}

function loadVttParser(): Promise<typeof VTTParser> {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return require.ensure(['parsers/captions/vttparser'], 
        function (require: any): typeof VTTParser {
	    // eslint-disable-next-line @typescript-eslint/no-var-requires
            return require('parsers/captions/vttparser').default;
        }, 
        chunkLoadWarningHandler(301131), 'vttparser'
    ) as unknown as Promise<typeof VTTParser>;
}
