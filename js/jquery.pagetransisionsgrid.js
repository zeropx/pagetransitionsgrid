
/*
 * 'PageTransitionGrid'
 * Author: @Eric Casequin
 * Description: 
 * Takes a given element and then finds noted columns first, and then it iterates
 * through each column to find rows in each one of them. 
 * Takes the given information and then applies transition toggles so that
 * user can do a up/down/left/right style navigation. 
 * offcanvas style navigation for full pages mostly. 
 */

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
      debugmessages: false, // just does console stuff
      columnClass:'.ptg-column',
      rowsContainerClass:'.ptg-rows',
      rowClass:'.ptg-row',

      // Navigation Classes
      navContainer:'ptg-nav',
      navRight:'ptg-button--right',
      navLeft:'ptg-button--left',
      navUp:'ptg-button--up',
      navDown:'ptg-button--down',

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
          outClass: 'pt-page-moveToBottomEasing pt-page-ontop',
          inClass: 'pt-page-moveFromTop'
        },
        down: {
          outClass: 'pt-page-moveToTopEasing pt-page-ontop',
          inClass: 'pt-page-moveFromBottom'
        },
        left: {
          outClass: 'pt-page-moveToRightEasing pt-page-ontop',
          inClass: 'pt-page-moveFromLeft'
        },
        right: {
          outClass: 'pt-page-moveToLeftEasing pt-page-ontop',
          inClass: 'pt-page-moveFromRight'
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

      // Current in out classes
      this.outClass = "";
      this.inClass = "";

      // Define the grid array
      this.setupGrid();

      // Make the first one load
      this.ptgColumns[0].c.addClass('pt-page-current');

      for (var i = 0; i < this.ptgColumns.length; i++) {
        $(this.ptgColumns[i].r[0]).addClass('pt-page-current');
      }

      // Navigation
      this.createNavigation();

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
      var _this = this;
      this.nav = {};
      this.nav.container = $('<span>').addClass(this.config.navContainer);
      

      // Left and Right navigation
      if (this.hasColumns) {
        this.nav.right = $('<span>').addClass('ptg-button ' + this.config.navRight).html('RIGHT').appendTo(this.nav.container);
        this.nav.left  = $('<span>').addClass('ptg-button ' + this.config.navLeft).html('LEFT').appendTo(this.nav.container);

        // Click Right
        this.nav.right.bind('click',function() {
          _this.right();
        });

        // Click Left
        this.nav.left.bind('click',function() {
          _this.left();
        });
      }

      // Up and Down navigation
      if (this.hasRows) {
        this.nav.up    = $('<span>').addClass('ptg-button ' + this.config.navUp).html('UP').appendTo(this.nav.container);
        this.nav.down  = $('<span>').addClass('ptg-button ' + this.config.navDown).html('DOWN').appendTo(this.nav.container);

        // Click Up
        this.nav.up.bind('click',function() {
          _this.up();
        });

        // Click Down
        this.nav.down.bind('click',function() {
          _this.down();
        });

      }


      // Append the nav
      this.nav.container.prependTo(this.$elem);
      
      





      // _this = '';
    },



    /*
      Transition: this is where most of the real work happens
      unfortunately its messay and needs to be cleaned up.
    */
    // tell the system to do the transition
    transition: function(direction) {
      var transition = 'col'; // default state
      var $hasCols = this.ptgColumns.length ? true : false;
      var $hasRows = this.ptgColumns[this.currCol].r.length ? true : false;

      if( this.isAnimating ) {
        return false;
      }

      this.isAnimating = true;

      // Catch direction so we can handle it 
      switch(direction) {
        case 'right':
        case 'left':
         transition = 'col';
        break;

        case 'up':
        case'down':
          
          if ($hasRows) {
            transition = 'row';
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
      this.updateCurrents(direction);


      // Define nextCol
      if (transition ==  'col') {
        this.ptgColumns[this.currCol].nextCol = this.ptgColumns[this.currCol].c.addClass('pt-page-current');
      }
      
      // Define nextRow
      if (transition ==  'col') {
        this.ptgColumns[this.currCol].nextRow = $(this.ptgColumns[this.currCol].r[this.ptgColumns[this.currCol].currRow]).addClass('pt-page-current');
      }
      
      this.outClass = '';
      this.inClass = '';
      
      // update in out classes
      this.updateInOutClasses(transition, direction);


      // prep next col/row
      var $nextCol = this.ptgColumns[this.currCol].c;
      var $nextRow = $(this.ptgColumns[this.currCol].r[this.ptgColumns[this.currCol].currRow]).addClass('pt-page-current');



      // Self reference usage
      var _this = this;

      // Transit a col
      if (transition == 'col') {
        // Current page
        $currentCol
          .addClass( this.outClass )
          .on( _this.animEndEventName, function() {
            $currentCol.off( this.animEndEventName );
            _this.endCurrPage = true;

            if( _this.endNextPage ) {
              _this.onEndAnimation( $currentCol, $nextCol );
            }
        });

        // Next Page
        $nextCol
          .addClass( this.inClass )
          .on( this.animEndEventName, function() {
            $nextCol.off( _this.animEndEventName );
            _this.endNextPage = true;
            if( _this.endCurrPage ) {
              _this.onEndAnimation( $currentCol, $nextCol );
            }
        });
      }

      // Transit a row
      if (transition == 'row') {
        // Current page
        $currentRow
          .addClass( this.outClass )
          .on( _this.animEndEventName, function() {
            $currentRow.off( this.animEndEventName );
            _this.endCurrPage = true;

            if( _this.endNextPage ) {
              _this.onEndAnimation( $currentRow, $nextRow );
            }
        });

        // Next Page
        $nextRow
          .addClass( this.inClass )
          .on( this.animEndEventName, function() {
            $nextRow.off( _this.animEndEventName );
            _this.endNextPage = true;
            if( _this.endCurrPage ) {
              _this.onEndAnimation( $currentRow, $nextRow );
            }
        });
      }






      if( !this.support ) {
        if (transition == 'col') {
          this.onEndAnimation( $currentCol, $nextCol );
        }
        if (transition == 'row') {
          this.onEndAnimation( $currentRow, $nextRow );
        }
        
      }


      /* TEMP DEBUG STUFF */
      var currentStatus = "Direction: " + direction + ", CurrentCol: " + this.currCol + " / " + (this.ptgColumns.length - 1);
      
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
    updateInOutClasses: function(transition, direction) {
      // Col & right
      if(transition == 'col' && direction == 'right') {
        this.outClass = this.config.transitions.right.outClass;
        this.inClass  = this.config.transitions.right.inClass;
      }

      // Col & left
      if(transition == 'col' && direction == 'left') {
        this.outClass = this.config.transitions.left.outClass;
        this.inClass  = this.config.transitions.left.inClass;
      }

      // Row & up
      if(transition == 'row' && direction == 'up') {
        this.outClass = this.config.transitions.up.outClass;
        this.inClass  = this.config.transitions.up.inClass;
      }

      // Row & down
      if(transition == 'row' && direction == 'down') {
        this.outClass = this.config.transitions.down.outClass;
        this.inClass  = this.config.transitions.down.inClass;
      }
    },





    // When animation ends
    onEndAnimation: function( $outpage, $inpage ) {
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





    // Update Current col/row #
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
      new PageTransitionGrid(this, options).init();
    });
  };

  window.PageTransitionGrid = PageTransitionGrid;
})(window, jQuery);

