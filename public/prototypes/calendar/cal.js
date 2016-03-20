/*
cal.js

fills .cal-container element with interactive time-selection calendar, and controls that calendar
*/

/*
USAGE: 
    auto-initializes on page load
    to initialize asynchronously (if the html was added to page later), call: 
        $('.cal-container').cal(o)
    where o is an object of options.
    
    available options:
        today : (optional) Date object or string in 'mm-dd-yyyy' or 'mm/dd/yyyy' format for day to be highlighted as today's date. Uses actual date if ommitted
        startDay : (optional) Date object or string in 'mm-dd-yyyy' or 'mm/dd/yyyy' format for a day in the first week to show.  Uses 'today' if ommitted
        maxWeeksShown : (optional) Maximum number of weeks visible, determined by screen space available. Default is 4
        widthPerWeek : (optional) Screen space required per week shown. Default is 400px. Changes to this may require changes to the css to prevent strange appearances
        noInteract : (optional) Prevents the user from changing the selection. Default is false (meaining the user CAN interact).
        selection : (optional) String containing a series of time ranges to be converted to a visible selection. Format should match the plugin's output (example below)
        confirmed : (optional) String containing a series of time ranges to be converted to a visible confirmed selection, which cannot be altered by the user. Format should match the plugin's output (example below)
    
    example output (line breaks added for readability, not in string by default):
        1/15/2014 12:00 pm - 3:00 pm, 
        1/15/2014 4:00 pm - 5:00 pm, 
        1/16/2014 1:00 pm - 3:00 pm, 
        1/16/2014 4:00 pm - 5:00 pm
        
*/

(function($){
    
    /////////////////////////
    //define namespaced vars
    /////////////////////////
    var c = window.Cal = this;
    
    //copy
    var calCopy = {
        months : [
            'January',
            'February',
            'March',
            'April',
            'May',
            'June',
            'July',
            'August',
            'September',
            'October',
            'November',
            'December'
        ],
        weekdays : [
            'Sun',
            'Mon',
            'Tue',
            'Wed',
            'Thur',
            'Fri',
            'Sat'
        ]
    };
    var calCount = 0;
    var defaults = {
        today : new Date(),
        startDay : '',
        maxWeeksShown : 4,
        widthPerWeek : 400,
        curWeeksShown : 4
    };
    var cleanupOptions = function ( o ) {
        // function cleans up the options to contain expected values
        
        // set a start day
        if( !o.startDay )
            o.startDay = o.today;
        // convert strings on days to Date objects
        var dateVals = ['today','startDay'];
        for( i=0; i<dateVals.length; i++ ){
            if( !( o[dateVals[i]] instanceof Date ) ){
                // assumes string in American formatting: mm-dd-yyyy or mm/dd/yyyy
                var strs = o[dateVals[i]].split('-');
                if ( strs.length < 3 )
                    strs = o[dateVals[i]].split('/');
                var d = new Date(strs[2], strs[0]-1, strs[1]);
                o[dateVals[i]] = d;
            }
        }
    }
    mouseaction = '';
    
    ///////////////////////
    //date control functions
    ///////////////////////
    var oneDayMS = 24*60*60*1000; //ms required to convert a Date object by one day
    var dateFuncs = {
        getNextDay : function( date ){
            // advances date by one day
            return new Date( date.getTime() + oneDayMS );
        },
        getNextWeek : function( date , weeks ){
            // advances date by n weeks (1 if omitted)
            if( !weeks )
                weeks = 1;
            return new Date( date.getTime() + (7*weeks)*oneDayMS );
        },
        getFirstDayOfWeek : function( date ){
            // finds the date of the Sunday before the passed Date object
            return new Date( date.getTime() - date.getDay() * oneDayMS );
        }
    }
    
    ///////////////////////
    //build tables
    ///////////////////////
    var determineNumberWeeks = function ( cal ){
        var cw = cal.find('.cal-wrap');
        return Math.min( cal.data('options').maxWeeksShown , Math.max( 1 , Math.floor( cw.innerWidth() / cal.data('options').widthPerWeek ) ) );
    }
    var tableFuncs = {
        buildHeader : function ( date , numWeeks , today ){
            // builds the .cal-day-labels table
            var curDay = dateFuncs.getFirstDayOfWeek( date );
            var tableStr = '<table class="cal-day-labels"><tr><td></td>';
            var weeks = [];
            for( var i = 0; i < numWeeks; i++ ){
                var wk = '';
                for( var j = 0; j < 7; j++ ){
                    wk += '<th' + 
                        ( ( curDay.getYear() === today.getYear() ) && ( curDay.getMonth() === today.getMonth() ) && ( curDay.getDate() === today.getDate() ) ?
                         ' class="today"' : '' ) +
                        ' data-year="' + curDay.getFullYear() + '" data-month="' + curDay.getMonth() + '" data-date="' + curDay.getDate() + '">' + calCopy.weekdays[ curDay.getDay() ] + '<br/><span>' + (curDay.getMonth()+1) + '/' + curDay.getDate() + '</span></th>';
                    curDay = dateFuncs.getNextDay( curDay );
                }
                weeks.push( wk );
            }
            tableStr += weeks.join('<td class="divider"></td>');
            tableStr += '<td class="cal-scroll-spacer"></td></tr></table>';
            
            return tableStr;
        },
        buildBody : function ( date , numWeeks ){
            // builds the .cal-body table
            var startDay = dateFuncs.getFirstDayOfWeek( date );
            var curDay = startDay;
            var tableStr = '<table class="cal-body">';
            function buildRow ( hour , minute ){
                var weeks = [];
                curDay = startDay;
                for( var i = 0; i < numWeeks; i++ ){
                    var wk = '';
                    for( var j = 0; j < 7; j++ ){
                        wk += '<td ' +
                            'data-year="' + curDay.getFullYear() + '" ' +
                            'data-month="' + curDay.getMonth() + '" ' +
                            'data-date="' + curDay.getDate() + '" ' +
                            'data-hours="' + hour + '" ' +
                            'data-minutes="' + minute + '" ' +
                            'class="' + ( j == 0 || j == 6 ? 'weekend ' : '' ) + 
                            'cell_'+curDay.getFullYear()+'_'+curDay.getMonth()+'_'+curDay.getDate()+'_'+hour+'_'+minute+'"' +
                            '></td>';
                        curDay = dateFuncs.getNextDay( curDay );
                    }
                    weeks.push(wk);
                }
                return weeks.join('<td class="divider"></td>');
            }
            for( var i = 0; i < 24; i++ ){
                var top = '<tr class="top"><th>' + ( i % 12 == 0 ? '12' : i % 12 ) + ' ' + ( i >= 12 ? 'pm' : 'am' ) + '</th>'
                    + buildRow( i , 0 )
                    + '</tr>';
                var bottom = '<tr class="bottom"><th></th>'
                    + buildRow( i , 30 )
                    + '</tr>';
                tableStr += top + bottom;
            }
            tableStr += '</table>';
            
            return tableStr;
        },
        updateVisible : function ( cal ) {
            // builds visible tables
            var o = cal.data('options');
            
            var headerTable = $( tableFuncs.buildHeader( o.curActiveDay , o.curWeeksShown , o.today ) );
            cal.find( '.cal-header-wrap' ).html( headerTable.addClass('active') );
            var bodyTable = $( tableFuncs.buildBody( o.curActiveDay , o.curWeeksShown ) );
            cal.find( '.cal-body-wrap' ).html( bodyTable.addClass('active') );
            
            tableFuncs.updateHeader( cal );
        },
        updateHeader : function ( cal ) {
            var months = [];
            var years = [];
            cal.find( '.cal-day-labels.active th' ).each(function(){
                if( months.indexOf( $(this).data('month') ) === -1 )
                    months.push( $(this).data('month') );
                if( years.indexOf( $(this).data('year') ) === -1 )
                    years.push( $(this).data('year') );
            });
            var monthsStr = '';
            for ( var i = 0; i < months.length; i++ ){
                if( i != 0 ) monthsStr += '/';
                monthsStr += calCopy.months[months[i]];
            }
            var yearsStr = years.join('/');
            cal.find('.cal-m-y').html( monthsStr + ' ' + yearsStr );
        }
    }
    
    ///////////////////////
    //selection functions
    ///////////////////////
    var selFuncs = {
        updateTableClasses : function ( cal , className , skipBorders , sel ) { // skipping the borders drastically increases the speed, then we can apply the borders later
            if( !sel )
                sel = cal.data('selection');
            cal.find('.cal-body td, .cal-body th').removeClass(className + ' ' + className + '-bt ' + className + '-br ' + className + '-bb ' + className + '-bl');
            if( sel && sel.length ){
                for( var i = 0; i < sel.length; i++ ){
                    var obj = sel[i];                    
                    //'cell_'+curDay.getFullYear()+'_'+curDay.getMonth()+'_'+curDay.getDate()+'_'+hour+'_'+minute
                    cal.find('.cell_'+obj.year+'_'+obj.month+'_'+obj.date+'_'+obj.hours+'_'+obj.minutes).addClass(className);
                    //cal.find('[data-year=' + obj.year + '][data-month=' + obj.month + '][data-date=' + obj.date + '][data-hours=' + obj.hours + '][data-minutes=' + obj.minutes + ']').addClass(className);
                }
            }
            // borders
            if( !skipBorders ){
                cal.find('.'+className).each(function(){                    
                    var obj = {
                        year : $(this).data('year'),
                        month : $(this).data('month'),
                        date : $(this).data('date'),
                        hours : $(this).data('hours'),
                        minutes : $(this).data('minutes')
                    }
                    selFuncs.singleUpdateTableBorders( cal , className , obj );
                });
            }
        },
        singleUpdateTableClasses : function ( cal , className , obj , add ) {
            // updates selection class of one cell
            if( add ){
                cal.find('.cell_'+obj.year+'_'+obj.month+'_'+obj.date+'_'+obj.hours+'_'+obj.minutes).addClass(className);
                selFuncs.singleUpdateTableBorders ( cal , className , obj );
            }
            else {
                cal.find('.cell_'+obj.year+'_'+obj.month+'_'+obj.date+'_'+obj.hours+'_'+obj.minutes).removeClass(className);
                selFuncs.singleUpdateTableBorders ( cal , className , obj );
            }
        },
        singleUpdateTableBorders : function ( cal , className , obj ) {
            // updates borders around one cell
            var t = cal.find('.cell_'+obj.year+'_'+obj.month+'_'+obj.date+'_'+obj.hours+'_'+obj.minutes);
            t.removeClass(className + '-bt ' + className + '-br ' + className + '-bb ' + className + '-bl');
            var adding = t.hasClass( className );
            
            // top
            var above = t.parent().prev().find('[data-month='+obj.month+'][data-date='+obj.date+']');
            if( !above.hasClass( className ) && adding ){
                above.addClass( className + '-bb' );
                t.addClass( className + '-bt' );
            }
            else {
                above.removeClass( className + '-bb' );
                t.removeClass( className + '-bt' ); 
            }
            // right
            var right = t.next();
            if( !right.hasClass( className ) && adding ){
                right.addClass( className + '-bl' );
                t.addClass( className + '-br' );
            }
            else {
                right.removeClass( className + '-bl' );
                t.removeClass( className + '-br' ); 
            }
            // bottom
            var below = t.parent().next().find('[data-month='+obj.month+'][data-date='+obj.date+']');
            if( !below.hasClass( className ) && adding ){
                below.addClass( className + '-bt' );
                t.addClass( className + '-bb' );
            }
            else {
                below.removeClass( className + '-bt' );
                t.removeClass( className + '-bb' ); 
            }
            // left
            var left = t.prev();
            if( !left.hasClass( className ) && adding ){
                left.addClass( className + '-br' );
                t.addClass( className + '-bl' );
            }
            else {
                left.removeClass( className + '-br' );
                t.removeClass( className + '-bl' ); 
            }
            
            if( !adding ){
                $.each( [above,right,below,left] , function(){
                    if( $(this).hasClass( className ) ){
                        var obj = {
                            year : $(this).data('year'),
                            month : $(this).data('month'),
                            date : $(this).data('date'),
                            hours : $(this).data('hours'),
                            minutes : $(this).data('minutes')
                        }
                        selFuncs.singleUpdateTableBorders( cal , className , obj );
                    }
                });
            }
        },
        addToSelection : function ( obj , cal ) { // pass object with date values and time
            var sel = cal.data('selection');
            if( !sel || !sel.length ){
                sel = [ obj ];
            }
            else {
                // keep it sorted by day then time
                for( var i = 0; i < sel.length; i++ ){
                    if( sel[i].year < obj.year || ( sel[i].month < obj.month && sel[i].year === obj.year ) || ( sel[i].date < obj.date && sel[i].month === obj.month && sel[i].year === obj.year ) ) {
                        // before obj, do nothing
                    }
                    else if( sel[i].date === obj.date && sel[i].year === obj.year && sel[i].month === obj.month ){
                        // within the same day
                        if( sel[i].hours === obj.hours && sel[i].minutes === obj.minutes ){
                            // what we're trying to add is already there, so die
                            return;
                        }
                        else if( ( sel[i].hours === obj.hours && sel[i].minutes > obj.minutes ) || sel[i].hours > obj.hours ){
                            // put it here!
                            sel.splice( i, 0, obj );
                            break;
                        }
                    }
                    else if ( sel[i].year > obj.year || ( sel[i].month > obj.month && sel[i].year === obj.year ) || ( sel[i].date > obj.date && sel[i].month === obj.month && sel[i].year === obj.year ) ){
                        // found a later day, put it here!
                        sel.splice( i, 0, obj );
                        break;
                    }
                    
                    if ( i === sel.length - 1 ){
                        // reached the end, so just push it
                        sel.push( obj );
                        break;
                    }
                }
            }
            cal.data('selection',sel);
            selFuncs.singleUpdateTableClasses( cal , 'selected' , obj , true );
        },
        removeFromSelection : function ( obj , cal ) {
            var sel = cal.data('selection');
            if( !sel || !sel.length )
                return;
            for( var i = 0; i < sel.length; i++ ){
                if( 
                    sel[i].year == obj.year &&
                    sel[i].month == obj.month &&
                    sel[i].date == obj.date &&
                    sel[i].hours == obj.hours &&
                    sel[i].minutes == obj.minutes
                ){
                    sel.splice(i,1);
                    break;
                }
            }
            cal.data('selection',sel);
            selFuncs.singleUpdateTableClasses( cal , 'selected' , obj , false );
        },
        makeHumanReadable : function ( sel ){
            if( !sel || !sel.length )
                return '';
            var hrStrs = '';
            var activeDay = { year: 0, month: 0, date: 0, hours: -1, minutes: -1 };
            for( var i = 0; i < sel.length; i++ ){
                var cur = sel[i];
                if( 
                    ( cur.year != activeDay.year || cur.month != activeDay.month || cur.date != activeDay.date ) || // new day
                    ( cur.hours > activeDay.hours + 1 ) || // more than an hour difference
                    !( ( cur.hours === activeDay.hours && cur.minutes == 30 && activeDay.minutes == 0 ) || // same hour, + 30 min
                    ( cur.hours === activeDay.hours + 1 && cur.minutes == 0 && activeDay.minutes == 30 ) ) ) // top of next hour, last entry was at bottom of hour
                { // if new day, or gap in time
                    if ( i != 0 ){
                        var prev = sel[i-1];
                        var hours = prev.hours;
                        var minutes = 30;
                        if( prev.minutes == 30 ){
                            hours++;
                            minutes = 0;
                        }
                        hrStrs += ' - ' + ( hours % 12 == 0 ? '12:' : hours % 12 + ':' ) + ( minutes == 0 ? '00' : '30' ) + ( hours >= 12 ? ' pm' : ' am' ) + ', ';
                    }
                    hrStrs += (cur.month+1) + '/' + cur.date + '/' + cur.year + ' ' + ( cur.hours % 12 == 0 ? '12:' : cur.hours % 12 + ':' ) + ( cur.minutes == 0 ? '00' : '30' ) + ( cur.hours >= 12 ? ' pm' : ' am' );
                }
                activeDay = cur;
            }
            // close last
            var last = sel[sel.length-1];
            var hours = last.hours;
            var minutes = 30;
            if( last.minutes == 30 ){
                hours++;
                minutes = 0;
            }
            hrStrs += ' - ' + ( hours % 12 == 0 ? '12:' : hours % 12 + ':' ) + ( minutes == 0 ? '00' : '30' ) + ( hours >= 12 ? ' pm' : ' am' );
            
            return hrStrs;
        },
        makeProgramReadable : function ( selStr ){
            if( !selStr )
                return [];
            var strsToParse = selStr.split(/\,\s?/g);
            if( strsToParse.length == 0 )
                return [];
            var sel = [];
            
            // iterate through each time span            
            for( var i = 0; i < strsToParse.length; i++ ){
                var curStr = strsToParse[i];
                
                // figure out the date info
                var dateStr = curStr.match(/\d{1,2}\/\d{1,2}\/\d{4}/)[0];
                var date = dateStr.split('/');
                date = {
                    year : parseInt(date[2]),
                    month : parseInt(date[0]-1),
                    date : parseInt(date[1])
                }
                
                // figure out start and end times, in 24 hours, as decimal (so 1:30 pm = 13.5)
                var times = curStr.match(/\d{1,2}\:\d{2}/g);
                var startTime = parseFloat(times[0].replace(':','.').replace('30','5'));
                var endTime = parseFloat(times[1].replace(':','.').replace('30','5'));
                delete times;
                var pm = curStr.match(/(am|pm)/g);
                if( pm[0] == 'pm' && startTime < 12 )
                    startTime += 12;
                if( pm[1] == 'pm' && endTime < 12 )
                    endTime += 12;
                
                console.log( startTime, endTime );
                
                // iterate through time span and add to selection
                for( var j = startTime; j < endTime; j += .5 ){
                    var hours = Math.floor( j );
                    var minutes = ( j % 1 === 0 ? 0 : 30 );
                    sel.push({
                        year : date.year,
                        month : date.month,
                        date : date.date,
                        hours : hours,
                        minutes : minutes
                    });
                }
            }
            
            return sel;
        }
    }
    
    ///////////////////////
    //pagination
    ///////////////////////
    var pagFuncs = {
        animToNext : function ( cal ) {
            var o = cal.data('options');
            var nextStartDate = dateFuncs.getNextWeek( o.curActiveDay , o.curWeeksShown );
            
            // mark existing tables as old
            cal.find('table.active').removeClass('active').addClass('prev');
            // make new tables
            var headerTable = $( tableFuncs.buildHeader( nextStartDate , o.curWeeksShown , o.today ) ).addClass('active').appendTo(cal.find('.cal-header-wrap'));
            var bodyTable = $( tableFuncs.buildBody( nextStartDate , o.curWeeksShown ) ).addClass('active').appendTo(cal.find('.cal-body-wrap'));
            // fill in selection
            selFuncs.updateTableClasses( cal , 'selected' , true );
            if( cal.data('confirmed') )
                selFuncs.updateTableClasses( cal , 'confirmed' , true , cal.data('confirmed') );
            // update data and header
            tableFuncs.updateHeader( cal );
            o.curActiveDay = nextStartDate;
            // animate in
            cal.find('table.active').css({
                position : 'absolute',
                top : 0,
                left : '100%',
                right : '-100%'
            }).animate({
                left : 0,
                right : 0
            }, 400, function(){
                cal.find('table.active').css('position','static');
                function onDelay () { 
                    selFuncs.updateTableClasses( cal , 'selected' );
                    if( cal.data('confirmed') )
                        selFuncs.updateTableClasses( cal , 'confirmed' , false , cal.data('confirmed') ); 
                }
                window.setTimeout( onDelay , 20 );
            });
            cal.find('table.prev').animate({
                marginLeft : '-100%'
            }, 400, function(){
                cal.find('table.prev').remove(); 
            });
            
            cal.data('options',o);
        },
        animToPrev : function ( cal ) {
            var o = cal.data('options');
            var nextStartDate = dateFuncs.getNextWeek( o.curActiveDay , -1*o.curWeeksShown );
            
            // mark existing tables as old
            cal.find('table.active').removeClass('active').addClass('next');
            // make new tables
            var headerTable = $( tableFuncs.buildHeader( nextStartDate , o.curWeeksShown , o.today ) ).addClass('active').appendTo(cal.find('.cal-header-wrap'));
            var bodyTable = $( tableFuncs.buildBody( nextStartDate , o.curWeeksShown ) ).addClass('active').appendTo(cal.find('.cal-body-wrap'));
            // fill in selection
            selFuncs.updateTableClasses( cal , 'selected' , true );
            if( cal.data('confirmed') )
                selFuncs.updateTableClasses( cal , 'confirmed' , true , cal.data('confirmed') );
            // update data and header
            tableFuncs.updateHeader( cal );
            o.curActiveDay = nextStartDate;
            // animate in
            cal.find('table.active').css({
                position : 'absolute',
                top : 0,
                left : '-100%',
                right : '100%'
            }).animate({
                left : 0,
                right : 0
            }, 400, function(){
                cal.find('table.active').css('position','static');
                function onDelay () { 
                    selFuncs.updateTableClasses( cal , 'selected' );
                    if( cal.data('confirmed') )
                        selFuncs.updateTableClasses( cal , 'confirmed' , false , cal.data('confirmed') ); 
                }
                window.setTimeout( onDelay , 20 );
            });
            cal.find('table.next').animate({
                marginLeft : '100%'
            }, 400, function(){
                cal.find('table.next').remove(); 
            });  
            
            cal.data('options',o);
        }
    }
    
    ///////////////////////
    //initialization
    ///////////////////////
    this.init = function ( cal , _o ) { // pass the jQuery object for the .cal-container and an object for the options
        // assign unique id
        cal.attr('id','cal_' + calCount).data('cal-id',calCount).addClass('initialized');
        
        // save base opts
        if( !_o ) _o = {};
        cal.data(
            'options',
            $.extend( {} , defaults , _o , {'id':calCount})     
        );
        cal.data('options').curWeeksShown = determineNumberWeeks( cal );
        cal.data('options', cleanupOptions( cal.data('options') ) );
        cal.data('options').curActiveDay = cal.data('options').startDay;
        var o = cal.data('options');
        
        // build initial tables
        tableFuncs.updateVisible(cal);
        // scroll to 8 am
        cal.find('.cal-body-wrap').scrollTop( cal.find('[data-hours=8]:first').position().top + cal.find('.cal-body-wrap').scrollTop() - 10 );
        
        // bind event listeners
        c.bindListeners( cal , o.noInteract );
        if( o.noInteract )
            cal.addClass( 'noInteract' );
        
        // load selections
        if( o.selection != undefined )
            c.generateSelectionFromString( cal , o.selection , 'selected' );
        if( o.confirmed != undefined )
            c.generateSelectionFromString( cal , o.confirmed , 'confirmed' );
        
        // update number of calendars initialized
        calCount++;
    }
    this.updateOptions = function ( cal , o ) {
        // update options data
        cal.data( 'options' , $.extend( {} , cal.data('options') , o ) );
        cal.off();
        c.bindListeners( cal , cal.data('options').noInteract );
        // noInteract class
        if( cal.data('options').noInteract )
            cal.addClass( 'noInteract' );
        else
            cal.removeClass( 'noInteract' );
        // load selections
        if( o.selection != undefined )
            c.generateSelectionFromString( cal , o.selection , 'selected' );
        if( o.confirmed != undefined )
            c.generateSelectionFromString( cal , o.confirmed , 'confirmed' );
    }
    this.bindListeners = function ( cal , noInteract ) { // pass the jQuery object for the .cal-container and a boolean that prevents the selection from being changable if true
        
        if( !noInteract ){
            cal
                // hover effect and selections
                .on({
                    'mouseover' : function(e){
                        $(this).add( $(this).siblings('th') ).addClass('hover');
                        $(this).parent().next().find('th, [data-month=' + $(this).data('month') + '][data-date=' + $(this).data('date') + ']').addClass('hover');
                        if( mouseaction ){
                            var cal = $(this).parents('.cal-container');
                            selFuncs[mouseaction]({
                                year : $(this).data('year'),
                                month : $(this).data('month'),
                                date : $(this).data('date'),
                                hours : $(this).data('hours'),
                                minutes : $(this).data('minutes')
                            },cal);
                            if( $(this).data('hours') < 23 || $(this).data('minutes') < 30 ){
                                var hours = $(this).data('hours');
                                var minutes = 30;
                                if( $(this).data('minutes') == 30 ){
                                    hours++;
                                    minutes = 0;
                                }
                                selFuncs[mouseaction]({
                                    year : $(this).data('year'),
                                    month : $(this).data('month'),
                                    date : $(this).data('date'),
                                    hours : hours,
                                    minutes : minutes
                                },cal);
                            }
                        }
                    },
                    'mouseout' : function(e){
                        $(this).add( $(this).siblings('th') ).removeClass('hover');
                        $(this).parent().next().find('th, [data-month=' + $(this).data('month') + '][data-date=' + $(this).data('date') + ']').removeClass('hover');
                    },
                    'mousedown' : function(e){
                        if( $(this).hasClass('selected') ){
                            mouseaction = 'removeFromSelection';
                            $(this).parents('table').addClass('erasing');
                        }
                        else {
                            mouseaction = 'addToSelection';
                            $(this).parents('table').addClass('adding');
                        }
                        $(this).trigger('mouseover');
                    },
                    'mouseup' : function(e){
                        mouseaction = null; 
                        $(this).parents('table').removeClass('adding erasing');
                    }
                }, '.cal-body td[data-month]');
        }
        
        cal
            // navigation
            .on('click','.cal-main a.next',function(e){
                e.preventDefault();
                pagFuncs.animToNext( $(this).parents('.cal-container') );
            })
            .on('click','.cal-main a.prev',function(e){
                e.preventDefault();
                pagFuncs.animToPrev( $(this).parents('.cal-container') );
            })
            .on('click','a.submit-btn',function(e){
                e.preventDefault();
                console.log( selFuncs.makeHumanReadable( $(this).parents('.cal-container').data('selection') ) );
                alert( selFuncs.makeHumanReadable( $(this).parents('.cal-container').data('selection') ) );
            })
            .on('click','a.clear-btn',function(e){
                e.preventDefault();
                if( confirm( "Are you sure you want to clear all selected times?" ) ){
                    $(this).parents('.cal-container').data('selection',[]);
                    selFuncs.updateTableClasses( $(this).parents('.cal-container') , 'selected' );
                }
            });
    }
    this.generateSelectionFromString = function ( cal , str , className ) {
        var sel = selFuncs.makeProgramReadable(str);
        selFuncs.updateTableClasses( cal , className , false , sel );
        if( className === 'selected' )
            cal.data('selection',sel);
        else if( className === 'confirmed' )
            cal.data('confirmed',sel);
    }
    
    ///////////////////////
    //auto-initialize & listeners
    ///////////////////////
    $(function(){
         $('.cal-container').each(function(){
             c.init( $(this) , $(this).data('options') );
         });
        
        // resize to show different number of weeks
        $(window).on('resize',function(e){
            $('.cal-container').each(function(){
                var cal = $(this);
                var test = determineNumberWeeks( cal )
                if( test != cal.data('options').curWeeksShown ){
                    cal.data('options').curWeeksShown = test;
                    var selClass = cal.find('.selected').length ? 'selected' : 'confirmed';
                    tableFuncs.updateVisible( cal );
                    selFuncs.updateTableClasses( cal , 'selected' );
                }
            });
        });
        
        console.log( selFuncs.makeProgramReadable(
            "1/15/2014 12:00 pm - 3:00 pm, 1/15/2014 4:30 pm - 5:30 pm, 1/16/2014 1:00 pm - 3:00 pm, 1/16/2014 4:00 pm - 5:00 pm, 1/20/2014 12:00 pm - 3:00 pm, 1/21/2014 12:00 pm - 1:00 pm, 1/22/2014 12:00 pm - 1:00 pm"
        ) );
        
    });
    
    ///////////////////////
    // jQuery plugin style initialization
    ///////////////////////
    $.fn.cal = function( o ){ // pass options object
        return this.each( function() {
            if( !o )
                o = {};
            
            var cal = $(this);
            if( !cal.hasClass('cal-container') )
                cal = cal.find('.cal-container');
            if( !cal.length )
                return
            
            o = $.extend({}, cal.data('options'), o);
            
            if( !cal.hasClass('initialized') )
                c.init( cal , o );
            else
                c.updateOptions( cal , o );
        });
    }
    
})(jQuery);