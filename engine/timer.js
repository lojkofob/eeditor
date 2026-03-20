

var normalizeTimeWithZero = (d) => ((d < 10 ? '0' : '') + d)
    , getTimeD= (t) => mmax(0, floor(t / 86400))
    , getTimeH= (t) => mmax(0, floor(t / 3600) % 24)
    , getTimeM= (t) => mmax(0, floor(t / 60) % 60)
    , getTimeS= (t) => mmax(0, floor(t) % 60 )
    , getTimeTextD = (t) => normalizeTimeWithZero(getTimeD(t))
    , getTimeTextH = (t) => normalizeTimeWithZero(getTimeH(t))
    , getTimeTextM = (t) => normalizeTimeWithZero(getTimeM(t))
    , getTimeTextS = (t) => normalizeTimeWithZero(getTimeS(t))
    , getTimeTexth = (t) => getTimeH(t)
    , getTimeTextm = (t) => getTimeM(t)
    , getTimeTexts = (t) => getTimeS(t)
    , getTimeTextHH = (t) => normalizeTimeWithZero(mmax(0, floor(t / 3600)))
    , getTimeText1 = (t) => getTimeTextM(t) + ':' + getTimeTextS(t)
    , getTimeText2 = (t) => getTimeTextH(t) + ':' + getTimeTextM(t) + ':' + getTimeTextS(t)
    , getTimeText3 = (t) => getTimeTextHH(t) + ':' + getTimeTextM(t) + ':' + getTimeTextS(t)
    , getTimeTextHHMM = (t) => getTimeTextH(t) + ':' + getTimeTextM(t) 
    , getTimeText4 = (t, maxParamsCount, ignoreSeconds) => { //2d 15h 25min
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
        
    }
    , getTimeText4_1 = (t) => getTimeText4(t, 1)
    , getTimeText4_2 = (t) => getTimeText4(t, 2)
    , getTimeText4_3 = (t) => getTimeText4(t, 3)
    , getTimeText5 = (t) => { //01:15:25
        var txt = '',
            h = getTimeTextH(t),
            m = getTimeTextM(t),
            s = getTimeTextS(t);
        
        if (h != '00') txt = h + ':';
        txt += m + ':' + s;    
        return txt;
    } 
    , __timer_formats = {
        '1': getTimeText1,
        '2': getTimeText2,
        '3': getTimeText3,
        '4': getTimeText4,
        '4_1': getTimeText4_1,
        '4_2': getTimeText4_2,
        '4_3': getTimeText4_3,
        '5': getTimeText5,
        'H': getTimeTextH,
        'M': getTimeTextM,
        'S': getTimeTextS,
        'h': getTimeTexth,
        'm': getTimeTextm,
        's': getTimeTexts
    }
    , getTimeText = (time, format) => {
        format = __timer_formats[format] || format || "M:S";
        if (isString(format)) {
            var h = floor(time/60/60)
                , m = floor(time/60)
                , s = time - m * 60;
            format = format.replace('h', h);
            format = format.replace('m', m);
            format = format.replace('s', s);
            if (h<10) h = '0' + h;
            if (m<10) m = '0' + m;
            if (s<10) s = '0' + s;
            format = format.replace('H', h);
            format = format.replace('M', m);
            format = format.replace('S', s);
            return format;
        } else if (isFunction(format)){
            return format(time);
        }
    };

var Timer = makeClass(function(parameters) {
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
    if (!parameters.__disableAutostart) {
        t.__start();
    }
    t.__format = parameters.__format;
}, {
    __stop(){
        var t = this;
        if (t.__timer) {
            clearInterval(t.__timer);
            t.__timer = 0;
        }
        t.__started = false;
    },

    __start(){
        this.__stop();
        this.__continue(1);
        this.__started = true;
    },
    
    __update(){
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
    
    __continue(disableFirstTick){
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
    
    __leftTime() {
        var t = this;
        return mmax(0, t.__step>0 ? t.__limit - t.__time : t.__time);
    },
    
    __reset(time) {
        var t = this;
        t.__stop();
        t.__time = mmax(0, time == undefined ? ( t.__step > 0 ? 0 : t.__limit ) : time);
    },
    
    __getText(format, time) {
        time = ifdef(time, this.__time);
        format = ifdef(format, this.__format);
        return getTimeText(time, format);
    },

    __getH() { return getTimeH(this.__time); },
    __getM() { return getTimeM(this.__time); },
    __getS() { return getTimeS(this.__time); },
});
 

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


