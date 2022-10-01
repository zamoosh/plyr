/** Note: the purpose of this library is that the plyr have extra options
 like adding comments in progressbar and a list of comments, so you can
 jump to that point. Please include the below dependencies in your main html
 file.
 
 You can edit main options of original plyr in line: 55
 */

// HLS player is required. https://github.com/video-dev/hls.js/
// bootstrap latest version is required. https://getbootstrap.com/
// bootstrap icons is required. https://icons.getbootstrap.com/

class PlyrPlayer {
    constructor(selector, videoSource) {
        this.defaultOptions = {};
        
        // note that we use player as this in this class 👇
        let player = this;
        
        // We consider Hls is supported
        const video = document.querySelector('video');
        const hls = new Hls();
        hls.loadSource(videoSource);
        
        hls.on(Hls.Events.MANIFEST_PARSED, function (event, data) {
            
            // Transform available levels into an array of integers (height values).
            const availableQualities = hls.levels.map((l) => l.height);
            availableQualities.unshift(0); //prepend 0 to quality array
            
            // Add new qualities to option
            player.defaultOptions.quality = {
                default: 0, //Default - AUTO
                options: availableQualities,
                forced: true,
                onChange: (e) => PlyrPlayer.updateQuality(e)
            };
            // Add Auto Label
            player.defaultOptions.i18n = {
                qualityLabel: {
                    0: 'Auto'
                }
            };
            
            hls.on(Hls.Events.LEVEL_SWITCHED, function (event, data) {
                let span = document.querySelector(".plyr__menu__container [data-plyr='quality'][value='0'] span");
                if (hls.autoLevelEnabled) {
                    span.innerHTML = `AUTO (${hls.levels[data.level].height}p)`;
                } else {
                    span.innerHTML = `AUTO`;
                }
            });
            
            // Initialize new Plyr player with quality options
            player.player = new Plyr(selector, {
                settings: ['captions', 'quality', 'speed'],
                controls: [
                    'play-large',
                    'play',
                    'rewind',
                    'fast-forward',
                    'restart',
                    'progress',
                    'current-time',
                    'mute', 'volume',
                    'captions',
                    'settings', 'pip',
                    'airplay',
                    'fullscreen'
                ],
                hideControls: true,
                keyboard: {
                    global: true
                },
                i18n: player.defaultOptions.i18n,
                quality: player.defaultOptions.quality,
                previewThumbnails: {
                    enabled: false,
                    src: ''
                },
                speed: {
                    selected: 1,
                    options: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 4]
                },
                markers: {
                    enabled: true,
                    points: []
                },
                captions: {
                    active: false,
                    language: 'auto',
                    update: false
                },
                tooltips: {
                    controls: true,
                    seek: true
                },
                clickToPlay: false
            });
            
            player.preventForm();
            player.addComment();
            player.addCommentList();
            
        });
        hls.attachMedia(video);
        window.hls = hls;
    }
    
    // updates the points on hover
    updateTooltip() {
        let points = document.getElementsByClassName('plyr__marker__points');
        for (let i = 0; i < points.length; i++) {
            points[i].addEventListener('mouseover', function () {
                let progress_bar = document.getElementsByClassName('plyr__progress')[0];
                let tooltip = progress_bar.querySelector('span.plyr__tooltip');
                tooltip.classList.remove('plyr__tooltip--visible');
            });
            points[i].addEventListener('mouseout', function () {
                let progress_bar = document.getElementsByClassName('plyr__progress')[0];
                let tooltip = progress_bar.querySelector('span.plyr__tooltip');
                tooltip.classList.add('plyr__tooltip--visible');
            });
            
        }
    }
    
    addComment() {
        let player = this;
        let control_bars = document.getElementsByClassName('plyr__controls')[0];
        let comment = document.createElement('button');
        comment.classList.add('plyr__controls__item', 'plyr__control');
        comment.dataset.modal = '#add_comment';
        comment.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chat-text" viewBox="0 0 16 16">
              <path d="M2.678 11.894a1 1 0 0 1 .287.801 10.97 10.97 0 0 1-.398 2c1.395-.323 2.247-.697 2.634-.893a1 1 0 0 1 .71-.074A8.06 8.06 0 0 0 8 14c3.996 0 7-2.807 7-6 0-3.192-3.004-6-7-6S1 4.808 1 8c0 1.468.617 2.83 1.678 3.894zm-.493 3.905a21.682 21.682 0 0 1-.713.129c-.2.032-.352-.176-.273-.362a9.68 9.68 0 0 0 .244-.637l.003-.01c.248-.72.45-1.548.524-2.319C.743 11.37 0 9.76 0 8c0-3.866 3.582-7 8-7s8 3.134 8 7-3.582 7-8 7a9.06 9.06 0 0 1-2.347-.306c-.52.263-1.639.742-3.468 1.105z"/>
              <path d="M4 5.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zM4 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8zm0 2.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 1-.5-.5z"/>
            </svg>
            <span class="label--not-pressed plyr__tooltip">Add comment</span>
        `;
        
        let video_wrapper = document.querySelector('div.plyr__video-wrapper');
        let modal = document.createElement(`div`);
        modal.classList.add('modal', 'fade');
        modal.setAttribute('id', 'add_comment');
        modal.setAttribute('tabindex', '-1');
        modal.setAttribute('aria-labelledby', 'add_comment_modal');
        modal.setAttribute('aria-hidden', 'true');
        // modal.setAttribute('data-bs-keyboard', 'false');
        // modal.setAttribute('data-bs-backdrop', 'static');
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="add_comment_modal">comment</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form name="set_tip">
                            <div class="mb-3">
                                <label for="tip" class="form-label">point tip</label>
                                <input required autofocus type="text" class="form-control" name="tip" id="tip">
                            </div>
                            <div class="mb-3">
                                <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">close</button>
                                <button type="submit" class="btn btn-primary btn-sm">save</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        video_wrapper.appendChild(modal);
        let commentModal = document.querySelector(comment.dataset.modal);
        this.add_comment = new bootstrap.Modal(commentModal);
        
        comment.addEventListener('click', function () {
            let progress_bar = comment.parentNode.querySelector('div.plyr__progress');
            let progress_input = progress_bar.childNodes[0];
            let current_time = progress_input.getAttribute('aria-valuenow');
            current_time = Math.floor(current_time * 10000) / 10000;
            
            
            let last_point = progress_bar.children[progress_bar.childElementCount - 2];
            if (last_point.classList.contains('plyr__marker__points')) {
                let last_point_time = (Number(last_point.style.left.replace('%', '')) / 100) * player.player.duration;
                let diff_time = Math.abs(current_time - last_point_time);
                if (diff_time < 1) {
                    player.showAlert();
                } else {
                    player.showModal(this);
                }
            } else {
                player.showModal(this);
            }
        });
        control_bars.appendChild(comment);
    }
    
    addCommentList() {
        let player = this;
        let control_bars = document.getElementsByClassName('plyr__controls')[0];
        let comment_list = document.createElement('button');
        comment_list.classList.add('plyr__controls__item', 'plyr__control');
        comment_list.dataset.modal = '#comment_list';
        comment_list.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-list" viewBox="0 0 16 16">
              <path fill-rule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z"/>
            </svg>
            <span class="label--not-pressed plyr__tooltip">comment list</span>
        `;
        
        let video_wrapper = document.querySelector('div.plyr__video-wrapper');
        let modal = document.createElement(`div`);
        modal.classList.add('modal', 'fade');
        modal.setAttribute('id', 'comment_list');
        modal.setAttribute('tabindex', '-1');
        modal.setAttribute('aria-labelledby', 'comment_list_modal');
        modal.setAttribute('aria-hidden', 'true');
        // modal.setAttribute('data-bs-keyboard', 'false');
        // modal.setAttribute('data-bs-backdrop', 'static');
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="comment_list_modal">points</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body d-flex flex-column">
                        ${this.player.markers.points}
                    </div>
                </div>
            </div>
        `;
        video_wrapper.appendChild(modal);
        let commentListModal = document.querySelector(comment_list.dataset.modal);
        this.comment_list = new bootstrap.Modal(commentListModal);
        
        
        comment_list.addEventListener('click', function () {
            player.showModal(this);
        });
        control_bars.appendChild(comment_list);
    }
    
    preventForm() {
        let player = this;
        this.player.on('loadeddata', function () {
            let forms = document.querySelectorAll('form[name="set_tip"]');
            forms.forEach(function (form) {
                form.addEventListener('submit', function (e) {
                    e.preventDefault();
                    let inputs = form.querySelectorAll('input');
                    for (const input of inputs) {
                        player.setMarker(input.value);
                        form.reset();
                        player.add_comment.hide();
                    }
                });
            });
        });
    }
    
    showModal(button) {
        let modal_name = button.dataset.modal.replace('#', '');
        if (this.hasOwnProperty(modal_name)) {
            if (this.player.fullscreen.active) {
                this[modal_name].show();
            } else {
                this[modal_name].show();
                document.querySelector('div.modal-backdrop').remove();
            }
        }
    }
    
    showAlert() {
        let root_element = document.querySelector('div.plyr__video-wrapper');
        const toast = Toastify({
            text: "Already exists",
            duration: 3000,
            destination: "",
            newWindow: true,
            selector: root_element,
            close: true,
            gravity: "top", // `top` or `bottom`
            position: "center", // `left`, `center` or `right`
            stopOnFocus: true, // Prevents dismissing of toast on hover
            style: {
                'z-index': '999',
                background: "#1f82bc"
            },
            onClick: function () {
            } // Callback after click
        });
        toast.showToast();
    }
    
    static createMarker(time, tip) {
        return {time: time, tip: tip};
    }
    
    // add a jump point to the comment list modal
    addPoint() {
        let comment_list_modal = this.comment_list._element;
        let comment_list_body = comment_list_modal.querySelector('div.modal-body');
        let a = this.player.markers.points[this.player.markers.points.length - 1];
        let point = document.createElement('a');
        point.classList.add('jump');
        point.role = 'button';
        point.href = 'javascript:void(0)';
        point.dataset.time = String(this.player.currentTime);
        point.innerHTML = `${Math.floor(a.time * 100) / 100} -> ${a.tip}`;
        comment_list_body.appendChild(point);
        let player = this;
        point.addEventListener('click', function () {
            player.player.currentTime = Number(point.dataset.time);
        });
    }
    
    setMarker(tip) {
        let marker = PlyrPlayer.createMarker(this.player.currentTime, tip);
        this.player.markers = {
            points: [
                ...this.player.markers.points, marker
            ]
        };
        this.updateTooltip();
        this.addPoint();
    }
    
    // this method updates the quality for the PlyrPlayer object
    static updateQuality(newQuality) {
        if (newQuality === 0) {
            window.hls.currentLevel = -1; //Enable AUTO quality if option.value = 0
        } else {
            window.hls.levels.forEach((level, levelIndex) => {
                if (level.height === newQuality) {
                    console.log("Found quality match with " + newQuality);
                    window.hls.currentLevel = levelIndex;
                }
            });
        }
    }
}