/*! Copyright (c) 2013 Brandon Aaron (http://brandonaaron.net)
 * Licensed under the MIT License (LICENSE.txt).
 *
 * Thanks to: http://adomas.org/javascript-mouse-wheel/ for some pointers.
 * Thanks to: Mathias Bank(http://www.mathias-bank.de) for a scope bug fix.
 * Thanks to: Seamus Leahy for adding deltaX and deltaY
 *
 * Version: 3.1.3
 *
 * Requires: 1.2.2+
 */

(function (factory) {
    if ( typeof define === 'function' && define.amd ) {
        // AMD. Register as an anonymous module.
        define(['jquery'], factory);
    } else if (typeof exports === 'object') {
        // Node/CommonJS style for Browserify
        module.exports = factory;
    } else {
        // Browser globals
        factory(jQuery);
    }
}(function ($) {

    var toFix = ['wheel', 'mousewheel', 'DOMMouseScroll', 'MozMousePixelScroll'];
    var toBind = 'onwheel' in document || document.documentMode >= 9 ? ['wheel'] : ['mousewheel', 'DomMouseScroll', 'MozMousePixelScroll'];
    var lowestDelta, lowestDeltaXY;

    if ( $.event.fixHooks ) {
        for ( var i = toFix.length; i; ) {
            $.event.fixHooks[ toFix[--i] ] = $.event.mouseHooks;
        }
    }

    $.event.special.mousewheel = {
        setup: function() {
            if ( this.addEventListener ) {
                for ( var i = toBind.length; i; ) {
                    this.addEventListener( toBind[--i], handler, false );
                }
            } else {
                this.onmousewheel = handler;
            }
        },

        teardown: function() {
            if ( this.removeEventListener ) {
                for ( var i = toBind.length; i; ) {
                    this.removeEventListener( toBind[--i], handler, false );
                }
            } else {
                this.onmousewheel = null;
            }
        }
    };

    $.fn.extend({
        mousewheel: function(fn) {
            return fn ? this.bind("mousewheel", fn) : this.trigger("mousewheel");
        },

        unmousewheel: function(fn) {
            return this.unbind("mousewheel", fn);
        }
    });


    function handler(event) {
        var orgEvent = event || window.event,
            args = [].slice.call(arguments, 1),
            delta = 0,
            deltaX = 0,
            deltaY = 0,
            absDelta = 0,
            absDeltaXY = 0,
            fn;
        event = $.event.fix(orgEvent);
        event.type = "mousewheel";

        // Old school scrollwheel delta
        if ( orgEvent.wheelDelta ) { delta = orgEvent.wheelDelta; }
        if ( orgEvent.detail )     { delta = orgEvent.detail * -1; }

        // New school wheel delta (wheel event)
        if ( orgEvent.deltaY ) {
            deltaY = orgEvent.deltaY * -1;
            delta  = deltaY;
        }
        if ( orgEvent.deltaX ) {
            deltaX = orgEvent.deltaX;
            delta  = deltaX * -1;
        }

        // Webkit
        if ( orgEvent.wheelDeltaY !== undefined ) { deltaY = orgEvent.wheelDeltaY; }
        if ( orgEvent.wheelDeltaX !== undefined ) { deltaX = orgEvent.wheelDeltaX * -1; }

        // Look for lowest delta to normalize the delta values
        absDelta = Math.abs(delta);
        if ( !lowestDelta || absDelta < lowestDelta ) { lowestDelta = absDelta; }
        absDeltaXY = Math.max(Math.abs(deltaY), Math.abs(deltaX));
        if ( !lowestDeltaXY || absDeltaXY < lowestDeltaXY ) { lowestDeltaXY = absDeltaXY; }

        // Get a whole value for the deltas
        fn = delta > 0 ? 'floor' : 'ceil';
        delta  = Math[fn](delta / lowestDelta);
        deltaX = Math[fn](deltaX / lowestDeltaXY);
        deltaY = Math[fn](deltaY / lowestDeltaXY);

        // Add event and delta to the front of the arguments
        args.unshift(event, delta, deltaX, deltaY);

        return ($.event.dispatch || $.event.handle).apply(this, args);
    }

}));

/*
 * 'PageTransitionGrid'
 * Author: @Eric Casequin
 * Description: 
 * Takes a given element and then finds noted columns first, and then it iterates
 * through each column to find rows in each one of them. 
 * Takes the given information and then applies transition toggles so that
 * user can do a up/down/left/right style navigation. 
 * offcanvas style navigation for full pages mostly. 

  options: {
    
    Options documentation coming

  },



 */

// TODO: Add navigation ability to target based on ID

// TODO: refactor all this and streamline the code so its easier to read

// TODO: Add Callbacks:

// This is based of code found from http://tympanus.net/Development/PageTransitions/

(function(window, $){
  var PageTransitionGrid = function(elem, options){
      this.elem = elem;
      this.$elem = $(elem);
      this.options = options;
      this.metadata = this.$elem.data('plugin-options');
    };



  PageTransitionGrid.prototype = {
    defaults: {
      debugmessages: true, // just does console stuff
      columnClass:'.ptg-column',
      rowsContainerClass:'.ptg-rows',
      rowClass:'.ptg-row',
      rotateLayout: false, // treats the col to rows and rows to col
      // Navigation Classes
      nav: true,
      navContainer:'ptg-nav',
      navRight:'ptg-button--right',
      navLeft:'ptg-button--left',
      navUp:'ptg-button--up',
      navDown:'ptg-button--down',

      // Navigtional inputs
      menuItems: false,
      mouseScroll: true,
      keyboardNav: true,

      // navigation infinite looping 
      loopColumns: false,
      loopRows: false,

      // events
      animEndEventNames: {
        'WebkitAnimation':'webkitAnimationEnd',
        'OAnimation':'oAnimationEnd',
        'msAnimation':'MSAnimationEnd',
        'animation':'animationend'
      },

      // Eventually just make a single variable to change so that you
      // can choose a style of animation. 
      transitionStyle: "simple", // Currently not in use

      // Default transition styles: Different ease based
      transitions: {
        up: {
          outClass: 'ptg-page-moveToBottomEasing pt-page-ontop',
          inClass: 'ptg-page-moveFromTop'
        },
        down: {
          outClass: 'ptg-page-moveToTopEasing pt-page-ontop',
          inClass: 'ptg-page-moveFromBottom'
        },
        left: {
          outClass: 'ptg-page-moveToRightEasing pt-page-ontop',
          inClass: 'ptg-page-moveFromLeft'
        },
        right: {
          outClass: 'ptg-page-moveToLeftEasing pt-page-ontop',
          inClass: 'ptg-page-moveFromRight'
        }
      }


    },





    // Initialise Plugin
    init: function() {
      this.config = $.extend({}, this.defaults, this.options, this.metadata);
      
      // Modernizr to fix animation event names for various browsers
      this.animEndEventName = this.config.animEndEventNames[ Modernizr.prefixed( 'animation' ) ];
      
      // support css animations
      this.support = Modernizr.cssanimations;

      // Default
      this.isAnimating = false;
      this.endCurrPage = false;
      this.endNextPage = false;
      this.hasColumns = false; // Used to define if there are more then 1 column
      this.hasRows = false; // Used to define if there are more then 1 row


      // Current Page
      this.currCol = 0;
      this.nextCol = 0;

      // Current in out classes
      this.outClass = "";
      this.inClass = "";

      // Define the grid array
      this.setupGrid();

      // Make the first one load
      this.ptgColumns[0].c.addClass('pt-page-current');

      // loop through all columns and then add class to first row
      for (var i = 0; i < this.ptgColumns.length; i++) {
        $(this.ptgColumns[i].r[0]).addClass('pt-page-current');
      }

      // Navigation
      this.createNavigation();
      this.menu = false;

      return this;
    },




    // Sets up general columns/rows grid 
    setupGrid: function() {
      this.dbm('grid setup', true);
      this.ptgColumns = [];

      // Get columns
      this.getColumns();
      
      // Get Rows for each column
      this.getRows();

      for (var i = 0; i < this.ptgColumns.length; i++) {
        var rows = this.ptgColumns[i].c.find(this.config.rowsContainerClass).children(this.config.rowClass);

        this.dbm("Column # [" + i + "] has [" + this.ptgColumns[i].r.length + "] rows");
      }



    },





    // Get total columns 
    getColumns: function() {
      this.dbm('Getting Columns: ' + this.config.columnClass, true);

      ptgColumns = this.$elem.children(this.config.columnClass);

      // Define if columns exist beyond 1. Need at least 1
      
      if (ptgColumns.length) {
        this.hasColumns = ptgColumns.length > 1 ? true : false;
      } else {
        // Add in some graceful method of daying "YOU NEED AT LEAST ONE COLUMN TO USE THIS PUPPY"
        this.dbm('PTG ERROR: You need at least 1 column to use this puppy.', true);
      }


      for (var i = ptgColumns.length - 1; i >= 0; i--) {
        $(ptgColumns[i]).data("originalClassList", $(ptgColumns[i]).attr('class'));
        this.ptgColumns[i]  = { "c": $(ptgColumns[i])};

      }
      this.dbm('Found: ' + this.ptgColumns.length + " columns");
    },





    // Get rows from each column available
    getRows: function() {
      // Iterate through each column to define rows for each
      for (var i = this.ptgColumns.length - 1; i >= 0; i--) {
        var rows = this.ptgColumns[i].c.find(this.config.rowsContainerClass).children(this.config.rowClass);
        if (rows.length) {
          this.hasRows = true;
        }
        this.ptgColumns[i].r = rows;
        this.ptgColumns[i].currRow = 0;
      }

      // add the orignal classes
      for (i = 0; i < this.ptgColumns.length; i++) {
        for (var d = 0; d < this.ptgColumns[i].r.length; d++) {
          $(this.ptgColumns[i].r[d]).data("originalClassList", $(this.ptgColumns[i].r[d]).attr('class') );
        }
      }

    },




    // Create navigation
    createNavigation: function() {
      var self = this;

      this.nav = {};
      this.nav.container = $('<span>').addClass(this.config.navContainer).hide();
      

      // Left and Right navigation
      if (this.hasColumns) {
        this.nav.right = $('<span>').addClass('ptg-button ' + this.config.navRight).html('RIGHT').appendTo(this.nav.container);
        this.nav.left  = $('<span>').addClass('ptg-button ' + this.config.navLeft).html('LEFT').appendTo(this.nav.container);

        // Click Right
        this.nav.right.bind('click',function() {
          self.right();
        });

        // Click Left
        this.nav.left.bind('click',function() {
          self.left();
        });
      }

      // Up and Down navigation
      if (this.hasRows) {
        this.nav.up    = $('<span>').addClass('ptg-button ' + this.config.navUp).html('UP').appendTo(this.nav.container);
        this.nav.down  = $('<span>').addClass('ptg-button ' + this.config.navDown).html('DOWN').appendTo(this.nav.container);

        // Click Up
        this.nav.up.bind('click',function() {
          self.up();
        });

        // Click Down
        this.nav.down.bind('click',function() {
          self.down();
        });

      }

      // Append the nav
      this.nav.container.prependTo(this.$elem);
      if (this.config.nav === true) this.nav.container.show();


      // Keyboard Navigation
      if (this.config.keyboardNav === true) {
        $(window).keydown(function(e) {
          var code = e.keyCode ? e.keyCode : e.which;
          switch(code) {
            case 39: 
              self.right();
            break;
            case 37: 
              self.left();
            break;
            case 38: 
              self.up();
            break;
            case 40: 
              self.down();
            break;    
          }
        });
      }

      // Mouse wheel up
      if (this.config.mouseScroll === true) {
        $(window).mousewheel(function(e, delta) {
          e.preventDefault();
          if (delta > 10) {
            if (self.config.rotateLayout === true) {
             self.left();
            } else {
             self.up();  
            }
            
          } else if (delta < -10) {
            if (self.config.rotateLayout === true) {
             self.right();
            } else {
             self.down();  
            }
          }
        });        
      };



    },





    // navigate to specific location
    navigateTo: function(navigateToId) {
      this.transition({
        direction: 'direct',
        navigateToId: navigateToId
      });
    },





    /*
      Transition: this is where most of the real work happens
      unfortunately its messay and needs to be cleaned up.
    */
    // tell the system to do the transition
    transition: function(o) {

      // Handler of options
      switch(typeof o) {
        case "string":
          o = {direction: o};       
        break;

        case "object":
          
          // Prevent clicking same ID
          if (this.currCol == o.navigateToId) {
            return false;
          }
        break;

        return false;
      }

      // Self reference usage
      var self = this;


      // default space we are moving: options are col, row
      this.space = 'col'; 
      
      // Note if we have a we have a row or col to work with
      this.hasCols = this.ptgColumns.length ? true : false;
      this.hasRows = this.ptgColumns[this.currCol].r.length ? true : false;

      // return if is currently animating
      if( this.isAnimating ) {
        return false;
      }

      this.isAnimating = true;

      // Catch direction so we can handle it 
      switch(o.direction) {
        case 'right':
        case 'left':
         this.space = 'col';
        break;

        case 'up':
        case'down':
          
          if (this.hasRows) {
            this.space = 'row';
          } else {
            this.isAnimating = false;
            return false;
          }
        break;
      }
      
      // prep current col/row      
      var $currentCol = this.ptgColumns[this.currCol].c;
      var $currentRow = $(this.ptgColumns[this.currCol].r[this.ptgColumns[this.currCol].currRow]);
      
      // Update Current col/row
      this.updateCurrents(o.direction);


      // Define nextCol
      if (this.space ==  'col' && o.direction != 'direct') {
        this.ptgColumns[this.currCol].nextCol = this.ptgColumns[this.currCol].c.addClass('pt-page-current');
      } else if (this.space ==  'col' && o.direction == 'direct') {
        this.ptgColumns[this.currCol].nextCol = this.ptgColumns[o.navigateToId].c.addClass('pt-page-current');
      }
      
      // // Define nextRow
      if (this.space ==  'row') {
        this.ptgColumns[this.currCol].nextRow = $(this.ptgColumns[this.currCol].r[this.ptgColumns[this.currCol].currRow]).addClass('pt-page-current');
      }
      
      this.outClass = '';
      this.inClass = '';
      
      // update in out classes
      this.updateInOutClasses(o);


      // prep next col/row

      if (o.direction == 'direct') {
        this.currCol = o.navigateToId;
      }
      
      var $nextCol = this.ptgColumns[this.currCol].c;
      var $nextRow = $(this.ptgColumns[this.currCol].r[this.ptgColumns[this.currCol].currRow]).addClass('pt-page-current');



      // Transit a col
      if (this.space == 'col') {
        // Current page
        $currentCol
          .addClass( this.outClass )
          .on( self.animEndEventName, function() {
            $currentCol.off( this.animEndEventName );
            self.endCurrPage = true;

            if( self.endNextPage ) {
              self.onEndAnimation( $currentCol, $nextCol);
            }
        });

        // Next Page
        $nextCol
          .addClass( this.inClass )
          .on( this.animEndEventName, function() {
            $nextCol.off( self.animEndEventName );
            self.endNextPage = true;
            if( self.endCurrPage ) {
              self.onEndAnimation( $currentCol, $nextCol);
            }
        });
      }

      // Transit a row
      if (this.space == 'row') {
        // Current page
        $currentRow
          .addClass( this.outClass )
          .on( self.animEndEventName, function() {
            $currentRow.off( this.animEndEventName );
            self.endCurrPage = true;

            if( self.endNextPage ) {
              self.onEndAnimation( $currentRow, $nextRow);
            }
        });

        // Next Page
        $nextRow
          .addClass( this.inClass )
          .on( this.animEndEventName, function() {
            $nextRow.off( self.animEndEventName );
            self.endNextPage = true;
            if( self.endCurrPage ) {
              self.onEndAnimation( $currentRow, $nextRow);
            }
        });
      }






      if( !this.support ) {
        if (this.space == 'col') {
          this.onEndAnimation( $currentCol, $nextCol );
        }
        if (this.space == 'row') {
          this.onEndAnimation( $currentRow, $nextRow );
        }
        
      }


      /* TEMP DEBUG STUFF */
      var currentStatus = "Direction: " + o.direction + ", CurrentCol: " + this.currCol + " / " + (this.ptgColumns.length - 1);
      
      if (this.ptgColumns[this.currCol].r.length > 0) {
        currentStatus+= ", CurrentRow: " + this.ptgColumns[this.currCol].currRow +" / "+ (this.ptgColumns[this.currCol].r.length -1) + "";
      } else {
        currentStatus+= ", CurrentRow: no rows found in this column";
      }
      // Let me know whats going on
      this.dbm(currentStatus, true);
      /* END DEBUG STUFF */
      
      // Clear selections
      this.clearSelections();



    },





    // Next 
    right: function() {
      this.transition('right');
    },





    // Previous
    left: function() {
      this.transition('left');
    },




    // Previous
    up: function() {
      this.transition('up');
    },




    // Previous
    down: function() {
      this.transition('down');
    },





    // Update in/out classes
    updateInOutClasses: function(o) {
      // Col & right
      if(this.space == 'col' && o.direction == 'right') {
        this.outClass = this.config.transitions.right.outClass;
        this.inClass  = this.config.transitions.right.inClass;
      }

      // Col & left
      if(this.space == 'col' && o.direction == 'left') {
        this.outClass = this.config.transitions.left.outClass;
        this.inClass  = this.config.transitions.left.inClass;
      }

      // Row & up
      if(this.space == 'row' && o.direction == 'up') {
        this.outClass = this.config.transitions.up.outClass;
        this.inClass  = this.config.transitions.up.inClass;
      }

      // Row & down
      if(this.space == 'row' && o.direction == 'down') {
        this.outClass = this.config.transitions.down.outClass;
        this.inClass  = this.config.transitions.down.inClass;
      }

      // Direct
      if (this.space == 'col' && o.direction == 'direct') {
        if (this.currCol < o.navigateToId) {
          this.outClass = this.config.transitions.right.outClass;
          this.inClass  = this.config.transitions.right.inClass;
        } else {
          this.outClass = this.config.transitions.left.outClass;
          this.inClass  = this.config.transitions.left.inClass;
        }

      };
    },





    // When animation ends
    onEndAnimation: function($outpage, $inpage) {
      this.endCurrPage = false;
      this.endNextPage = false;
      this.resetPage( $outpage, $inpage );
      this.isAnimating = false;
     },





    // reset settings 
    resetPage: function( $outpage, $inpage ) {
      $outpage.attr( 'class', $outpage.data("originalClassList") );
      $inpage.attr( 'class', $inpage.data("originalClassList") + ' pt-page-current' );
    },




    // Fixes things when a select all is done by accident on the screen
    clearSelections: function() {
      if(document.selection && document.selection.empty) {
        document.selection.empty();
      } else if(window.getSelection) {
        var sel = window.getSelection();
        sel.removeAllRanges();
      }
    },





    /*
      Update col to define next based on incremements of 1
    */
    updateCurrents: function(direction) {

      switch(direction) {
        case "right":
          this.currCol = this.currCol < this.ptgColumns.length - 1 ? ++this.currCol : 0;
        break;

        case "left":
          this.currCol = (this.currCol > 0) ? --this.currCol : this.ptgColumns.length - 1;
        break;

        case "up":
          if (this.ptgColumns[this.currCol].currRow > 0) {
            --this.ptgColumns[this.currCol].currRow;
          } else {
            this.ptgColumns[this.currCol].currRow = this.ptgColumns[this.currCol].r.length - 1;
          }
        break;

        case "down":
          if (this.ptgColumns[this.currCol].currRow < this.ptgColumns[this.currCol].r.length -1) {
            ++this.ptgColumns[this.currCol].currRow;
          } else {
            this.ptgColumns[this.currCol].currRow = 0;
          }

        case "direct":
        break;

        break;
      }

    },


    



    // Debug Messages, just easier to turn off when done instead of having Console logs everywhere
    dbm: function(msg, spacer) {
      if (this.config.debugmessages === true) {
        if (spacer) {
          msgSpace = '------------------------------------\n';
        } else {
          msgSpace = '';
        }
        console.log(msgSpace + msg);
      }
    }


  };

  PageTransitionGrid.defaults = PageTransitionGrid.prototype.defaults;

  $.fn.PageTransitionGrid = function(options) {
    return this.each(function() {
      new PageTransitionGrid(this, options);
    });
  };

  window.PageTransitionGrid = PageTransitionGrid;
})(window, jQuery);

