 


var sounds = { };
var soundsLooper = { };

function getSound(s){
    return s && s.howl ? s : sounds[s];
}

function getSoundHowl(s){
    return s && s.howl ? s.howl : sounds[s] ? sounds[s].howl : s instanceof __window.Howl ? s : 0;
}

function __onSoundEnd(i){ 
    var s = soundsLooper[i]; 
    if (s) { 
        var sound = getSoundHowl(soundsLooper[i]);
        delete soundsLooper[i]; 
        
        playSound(s, 1); 
        if (sound && sound.__volume != undefined) {
            changeSoundVolume(sound, sound.__volume)
        }
    } 
};

function changeSoundVolume(s, volume, fadeTime){
    if (!options.__soundDisabled) {
        s = getSoundHowl(s);
        if (s){
            s.__volume = volume;
            if (fadeTime && s.fade){
                s.fade( s._volume, volume, fadeTime * ONE_SECOND );
            } else 
            if (s.volume) {
                if (s._sounds && s._sounds[0]){
                    s.volume(volume, s._sounds[0]._id);
                } else {
                    s.volume(volume);
                }
            }
        }
    }
}
 
var _canPlayMusic = function(){ return 1; },
    _canPlaySingleSound = function(){ return 1; };

function canPlaySound(s, loop, delay){
    if (s && !options.__soundDisabled){
        return loop ? _canPlayMusic() : _canPlaySingleSound()
    }
}

function playSound(s, loop, delay, smartUniqueTime, fadeInTime){
//     console.log('===================================== playSound', s, loop, delay, smartUniqueTime);
 
    if (!canPlaySound(s, loop, delay)) {
        return;
    }
    
    if (delay) {
        //TODO: stopSound must catch timeout
        _setTimeout(function(){ 
            playSound(s, loop, 0, smartUniqueTime);
        }, delay);
    }
    else {
        var sound = getSound(s);
        if (sound) { 
            
            var soundGroup = sound.__group || sound;

            if (smartUniqueTime){
                if (soundGroup.__lastPlayed > TIME_NOW - smartUniqueTime ){
                    return;
                }
            }
            
            soundGroup.__lastPlayed = TIME_NOW;
            var howl = sound.howl;
            if (!howl) return;

            var i = howl.play( sound.__name );
            
            soundGroup.__lastPlayedId = i;
            
            if (fadeInTime) {
                howl.fade(0, 1, fadeInTime * ONE_SECOND, i);
            }
            
            if (loop) {
                soundsLooper[i] = s;
            }

            if (!howl.soundsEventListenersAdded) {
                BUS.__addEventListener(__ON_VISIBILITY_CHANGED, (t, visible) => {
                    howl.mute(!visible);
                });
                howl.soundsEventListenersAdded = 1;
            }
        }
    }

}

function stopSound(sid, fadeOutTime){ 
//         console.log('===================================== stopSound', s);
    var sound = getSound(sid);
    if (sound) { 
        var soundGroup = sound.__group || sound;
        if (soundGroup.__lastPlayedId >= 0) {
            if (fadeOutTime){
                delete soundsLooper[sid];
                sound.howl.fade(1, 0, fadeOutTime * ONE_SECOND, soundGroup.__lastPlayedId );
            _setTimeout(function(){ stopSound(s); }, fadeOutTime);
            }
            else {
                sound.howl.stop( soundGroup.__lastPlayedId );
            }
        }
    }
}


function checkIfMusicOff() {
    return PlayerState['msc'];
}
