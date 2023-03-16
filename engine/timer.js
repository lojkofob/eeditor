
function getTimeText(t, format) {
    format = format || "M:S";
    var h = floor(this.time/60/60);
    var m = floor(this.time/60);
    var s = this.time - m*60;
    format = format.replace('h', h);
    format = format.replace('m', m);
    format = format.replace('s', s);
    if (h<10) h = '0'+h;
    if (m<10) m = '0'+m;
    if (s<10) s = '0'+s;
    format = format.replace('H', h);
    format = format.replace('M', m);
    format = format.replace('S', s);
    return format;
};

function normalizeTimeWithZero(d){ return (d < 10 ? '0' : '') + d; }

function getTimeTextD(t){ return normalizeTimeWithZero(getTimeD(t)); }; //days
function getTimeTextH(t){ return normalizeTimeWithZero(getTimeH(t)); };
function getTimeTextM(t){ return normalizeTimeWithZero(getTimeM(t)); };
function getTimeTextS(t){ return normalizeTimeWithZero(getTimeS(t)); };

function getTimeTextHH(t){ return normalizeTimeWithZero(mmax(0, floor(t / 3600))); }; //hours include days

function getTimeText1(t) { return getTimeTextM(t) + ':' + getTimeTextS(t); };
function getTimeText2(t) { return getTimeTextH(t) + ':' + getTimeTextM(t) + ':' + getTimeTextS(t); };
function getTimeText3(t) { return getTimeTextHH(t) + ':' + getTimeTextM(t) + ':' + getTimeTextS(t); };

function getTimeTextHHMM(t) { return getTimeTextH(t) + ':' + getTimeTextM(t) };

function getTimeD(t){ return mmax(0, floor(t / 86400)); };
function getTimeH(t){ return mmax(0, floor(t / 3600) % 24); };
function getTimeM(t){ return mmax(0, floor(t / 60) % 60); };
function getTimeS(t){ return mmax(0, floor(t) % 60 ); };


function getTimeText4(t, maxParamsCount, ignoreSeconds) { //2d 15h 25min
    var txt = '',
        d = getTimeD(t),
        h = getTimeH(t),
        m = getTimeM(t),
        s = getTimeS(t);
    
    maxParamsCount = maxParamsCount || 4;
    var paramsCount = 0;
        
    if (d && (paramsCount < maxParamsCount)) {
        txt += d + TR('d') + ' ';
        paramsCount++;
    }
    
    if (h && (paramsCount < maxParamsCount)) {
        txt += h + TR('h') + ' ';
        paramsCount++;
    }
    
    if (m && (paramsCount < maxParamsCount)) {
        txt += m + TR('m');
        paramsCount++;
    }
    
    if (!ignoreSeconds && h == 0 && d == 0 && (paramsCount < maxParamsCount)) {
        txt += ' ' + s + TR('s') + ' ';
        paramsCount++;
    }
    
    return txt;
    
};

function getTimeText5(t) { //01:15:25
    
    var txt = '',
        h = getTimeTextH(t),
        m = getTimeTextM(t),
        s = getTimeTextS(t);
    
    if (h != '00') txt = h + ':';
    txt += m + ':' + s;
    
    return txt;
}


function Timer(parameters) {
  
  parameters = parameters || {};
  var t = this;
  t.__step = parameters.__step || -1;
  t.__limit = parameters.__endTime ? 
    floor( parameters.__endTime - TIME_NOW + 1 ) : 
    floor( parameters.__limit || 60 );
  
  t.__endTime = parameters.__endTime ? parameters.__endTime : ( TIME_NOW + parameters.__limit );
  t.__time = t.__step > 0 ? 0 : t.__limit;
  t.__interval = parameters.__interval || 1;
  t.__onEnd = parameters.__onEnd;
  t.__onTick = parameters.__onTick;
  if (!parameters.__disableAutostart)
      t.__start();
}

Timer.prototype = {
    constructor : Timer,
    __stop: function(){
        var t = this;
        if (t.__timer) {
            clearInterval(t.__timer);
            t.__timer = 0;
        }
        t.__started = false;
    },

    __start: function(){
        this.__stop();
        this.__continue(1);
        this.__started = true;
    },
    
    __update: function(){
        var t = this;
        
        //cheats
        if (t.__startedTimeMult != options.__timeMultiplier){
            t.__start();
            return;
        }
        if (t.__cheatsAdjustedTimeAdd != cheatsAdjustedTimeAdd){
            t.__stop();
            t.__time += t.__cheatsAdjustedTimeAdd - cheatsAdjustedTimeAdd;
            t.__start();
        }
        //endcheats
        
        updateTimeNow();
        
        var time = t.__time + t.__step;
        t.__time = mmax(time, 0);
        if (t.__step > 0)
            t.__time = mmin(t.__limit, t.__time);
        
        if (t.__onTick) t.__onTick();
        if (time != t.__time) {
            if (t.__onEnd) t.__onEnd();
            t.__stop();
        }
    },
    
    __continue : function(disableFirstTick){
        var t = this;
        if (!t.__timer) {
            //cheats
            t.__startedTimeMult = options.__timeMultiplier;
            t.__cheatsAdjustedTimeAdd = cheatsAdjustedTimeAdd;
            //endcheats
            t.__timer = setInterval( wrapFunctionInTryCatch( t.__update.bind(t) ), t.__interval * ONE_SECOND / options.__timeMultiplier );
            if (!disableFirstTick)
                t.__update();
        }
    },
    
    __leftTime : function() {
        var t = this;
        return mmax(0, t.__step>0 ? t.__limit - t.__time : t.__time);
    },
    
    __reset : function(time) {
        var t = this;
        t.__stop();
        t.__time = mmax(0, time == undefined ? ( t.__step > 0 ? 0 : t.__limit ) : time);
    },
    
    __getText : function(format) {
        format = format || "M:S";
        var h = floor(this.__time/60/60);
        var m = floor(this.__time/60);
        var s = this.__time - m*60;
        format = format.replace('h', h);
        format = format.replace('m', m);
        format = format.replace('s', s);
        if (h<10) h = '0'+h;
        if (m<10) m = '0'+m;
        if (s<10) s = '0'+s;
        format = format.replace('H', h);
        format = format.replace('M', m);
        format = format.replace('S', s);
        return format;
    },
    __getText1 : function() { return getTimeText1(this.__time); },
    __getText2 : function() { return getTimeText2(this.__time); },
    __getText3 : function() { return getTimeText3(this.__time); },
    __getText4 : function(maxParamsCount) { return getTimeText4(this.__time, maxParamsCount); },
    __getText4_1 : function() { return getTimeText4(this.__time, 1); },
    __getText4_2 : function() { return getTimeText4(this.__time, 2); },
    __getText4_3 : function() { return getTimeText4(this.__time, 3); },
    __getText5 : function() { return getTimeText5(this.__time); },
    __getTextH : function() { return getTimeTextH(this.__time); },
    __getTextM : function() { return getTimeTextM(this.__time); },
    __getTextS : function() { return getTimeTextS(this.__time); },
    __getH : function() { return getTimeH(this.__time); },
    __getM : function() { return getTimeM(this.__time); },
    __getS : function() { return getTimeS(this.__time); },
};
 

// TIME_NOW - метка времени UTC

var _Time = makeClass( function (tzOffset){
        this.__tzOffset = tzOffset || 0;
    },
    {
        __getLocalTimeOfDayTimestamp: function(dayNumber, hours, minutes){
            return  (dayNumber || 0 ) * ONE_DAY_IN_SECONDS + 
                    (hours || 0) * ONE_HOUR_IN_SECONDS + 
                    (minutes || 0) * ONE_MINUTE_IN_SECONDS +
                    this.__offsetInSeconds;
        },
        
        __getUnixTimeOfDayTimestamp: function(dayNumber, hours, minutes){
            return  (dayNumber || 0 ) * ONE_DAY_IN_SECONDS + 
                    (hours || 0) * ONE_HOUR_IN_SECONDS + 
                    (minutes || 0) * ONE_MINUTE_IN_SECONDS;
        },
        
        __getCurrentDayIndex : function(){ return floor(this.__unixTimestamp/ONE_DAY_IN_SECONDS); },
             
        __getCurrentDayLeftTime: function(){ return this.__getEndOfDayTime() - TIME_NOW; },
        __getEndOfDayTime: function(){ return this.__getLocalTimeOfDayTimestamp(this.__getCurrentDayIndex() + 1); },
        __getBeginOfDayTime: function(){ return this.__getLocalTimeOfDayTimestamp(this.__getCurrentDayIndex()); },
        
    },
    {
        __unixTimestamp: createSomePropertyWithGetterAndSetter(function(){ return TIME_NOW - this.__offsetInSeconds; }),
        __localTime: createSomePropertyWithGetterAndSetter(function(){ return TIME_NOW - this.__offsetInSeconds; }),
        __offsetInSeconds: createSomePropertyWithGetterAndSetter(function(){ return this.__tzOffset ? (new Date()).getTimezoneOffset() * 60 : 0 ; }),
    }
);

var TIME = {
    __UTC: new _Time(),
    __userLocalTime: new _Time(1)
};


