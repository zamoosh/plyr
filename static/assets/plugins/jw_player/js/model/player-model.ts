import { STATE_IDLE } from 'events/events';

export const INITIAL_PLAYER_STATE = {
    audioMode: false,
    itemMeta: {},
    playbackRate: 1,
    playRejected: false,
    state: STATE_IDLE,
    itemReady: false,
    controlsEnabled: false
};

export const INITIAL_MEDIA_STATE = {
    position: 0,
    duration: 0,
    buffer: 0,
    currentTime: 0,
};

export const DEFAULT_MIN_DVR_WINDOW = 120;
export const DEFAULT_DVR_SEEK_LIMIT = 25;
