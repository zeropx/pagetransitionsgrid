/*
 * 'PageTransitionGrid'
 * Author: @Eric Casequin
 * Description: 
 * Takes a given element and then finds noted boxs first, and then it iterates
 * through each box to find items in each one of them. 
 * Takes the given information and then applies transition toggles so that
 * user can do a up/down/left/right style navigation. 
 * offcanvas style navigation for full pages mostly. 

  options: {
    
    documentation coming eventually

  },

  
  // Boxes have items


 */

// TODO: Add navigation ability to target based on ID

// TODO: refactor all this and streamline the code so its easier to read

// This is based of code found from http://tympanus.net/Development/PageTransitions/

(function(window, $){
  var PageTransitionGrid = function(elem, options, callbacks){
      this.elem = elem;
      this.$elem = $(elem);
      this.options = options;
      this.metadata = this.$elem.data('plugin-options');
    };

  PageTransitionGrid.prototype = {
    defaults: {
      debugmessages: false, // just does console stuff
      boxClass:'.ptg-box',
      itemsContainerClass:'.ptg-items',
      itemClass:'.ptg-item',
      rotateLayout: false, // default treats Boxes like columns and items like 
                           // rows. Rotating switches animation behaviors
      
      // Navigation Classes & text
      nav: true,
      navContainer:'ptg-nav',
      navRight:'ptg-button ptg-button--right',
      navLeft:'ptg-button ptg-button--left',
      navUp:'ptg-button ptg-button--up',
      navDown:'ptg-button ptg-button--down',
      navRightText:'',
      navLeftText:'',
      navUpText:'',
      navDownText:'',

      // Navigtional inputs
      menuItems: false,
      mouseScroll: true,
      keyboardNav: true,

      // navigation infinite looping 
      // loopboxs: false,
      // loopitems: false,

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
          outClass: 'ptg-page-moveToBottomEasing ptg-box-ontop',
          inClass: 'ptg-page-moveFromTop'
        },
        down: {
          outClass: 'ptg-page-moveToTopEasing ptg-box-ontop',
          inClass: 'ptg-page-moveFromBottom'
        },
        left: {
          outClass: 'ptg-page-moveToRightEasing ptg-box-ontop',
          inClass: 'ptg-page-moveFromLeft'
        },
        right: {
          outClass: 'ptg-page-moveToLeftEasing ptg-box-ontop',
          inClass: 'ptg-page-moveFromRight'
        }
      }


    },



    // Callbacks
    callbacks: {
      init: function(obj) {},
      before: function(obj) {},
      after: function(obj) {},
      onAnimationEnd: function(obj) {}
    },



    // Initialise Plugin
    init: function(callbacks) {
      this.config = $.extend({}, this.defaults, this.options, this.metadata);
      this.callbacks = $.extend({}, callbacks);

      // Modernizr to fix animation event names for various bitemsers
      this.animEndEventName = this.config.animEndEventNames[ Modernizr.prefixed( 'animation' ) ];
      
      // support css animations
      this.support = Modernizr.cssanimations;

      // Default
      this.isAnimating = false;
      this.endCurrPage = false;
      this.endNextPage = false;
      this.hasboxs = false; // Used to define if there are more then 1 box
      this.hasitems = false; // Used to define if there are more then 1 item


      // Current Page
      this.currBox = 0;
      this.nextBox = 0;

      // Current in out classes
      this.outClass = "";
      this.inClass = "";

      // Define the grid array
      this.setupGrid();

      // Make the first one load
      this.box[0].b.addClass('ptg-current');

      // loop through all boxs and then add class to first item
      for (var i = 0; i < this.box.length; i++) {
        $(this.box[i].item[0]).addClass('ptg-current');
      }

      // Navigation
      this.createNavigation();
      this.hideShowNav();
      this.menu = false;

      // perform init callback
      if (typeof this.callbacks.init === 'function')
          this.callbacks.init(this);
      return this;
    },




    // Sets up general boxs/items grid 
    setupGrid: function() {
      this.dbm('grid setup', true);
      this.box = [];

      // Get boxs
      this.getboxs();
      
      // Get items for each box
      this.getitems();

      for (var i = 0; i < this.box.length; i++) {
        var items = this.box[i].b.find(this.config.itemsContainerClass).children(this.config.itemClass);

        this.dbm("box # [" + i + "] has [" + this.box[i].item.length + "] items");
      }



    },





    // Get total boxs 
    getboxs: function() {
      this.dbm('Getting boxs: ' + this.config.boxClass, true);

      box = this.$elem.children(this.config.boxClass);

      // Define if boxs exist beyond 1. Need at least 1
      
      if (box.length) {
        this.hasboxs = box.length > 1 ? true : false;
      } else {
        // Add in some graceful method of daying "YOU NEED AT LEAST ONE box TO USE THIS PUPPY"
        this.dbm('PTG ERROR: You need at least 1 box to use this puppy.', true);
      }


      for (var i = box.length - 1; i >= 0; i--) {
        $(box[i]).data("originalClassList", $(box[i]).attr('class'));
        this.box[i]  = { b: $(box[i])};

      }
      this.dbm('Found: ' + this.box.length + " boxs");
    },





    // Get items from each box available
    getitems: function() {
      // Iterate through each box to define items for each
      for (var i = this.box.length - 1; i >= 0; i--) {
        var items = this.box[i].b.find(this.config.itemsContainerClass).children(this.config.itemClass);
        if (items.length) {
          this.hasitems = true;
        }
        this.box[i].item = items;
        this.box[i].curritem = 0;
      }

      // add the orignal classes
      for (i = 0; i < this.box.length; i++) {
        for (var d = 0; d < this.box[i].item.length; d++) {
          $(this.box[i].item[d]).data("originalClassList", $(this.box[i].item[d]).attr('class') );
        }
      }

    },




    // Create navigation
    createNavigation: function() {
      var self = this;

      this.nav = {};
      this.nav.container = $('<span>').addClass(this.config.navContainer).hide();
      

      // Left and Right navigation
      if (this.hasboxs) {
        this.nav.right = $('<span>').addClass(this.config.navRight).html(this.config.navRightText).appendTo(this.nav.container);
        this.nav.left  = $('<span>').addClass(this.config.navLeft).html(this.config.navLeftText).appendTo(this.nav.container);

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
      if (this.hasitems) {
        this.nav.up    = $('<span>').addClass(this.config.navUp).html(this.config.navUpText).appendTo(this.nav.container);
        this.nav.down  = $('<span>').addClass(this.config.navDown).html(this.config.navDownText).appendTo(this.nav.container);

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





    // navigate to specific box
    // $item / $box
    navigateTo: function(box, item) {
      this.transition({
        direction: 'direct',
        navigateToBox: box
      });
    },





    /*
      HideShow Navigation
    */
    // tell the system to do the transition
    hideShowNav: function() {
      // hide or show item navigation 
      if (this.config.nav === true) {
        if (this.box[this.currBox].item.length && this.box[this.currBox].item.length > 1) {
          this.nav.up.fadeIn(200)
          this.nav.down.fadeIn(200);
        } else {
          this.nav.up.fadeOut(200);
          this.nav.down.fadeOut(200);
        }
      }

    },





    /*
      Transition: this is where most of the real work happens
      unfortunately its messay and needs to be cleaned up.
    */
    // tell the system to do the transition
    transition: function(o,callbacks) {
      // Self reference usage
      var self = this;

      // Get type
      switch(typeof o) {
        case "string":
          o = {direction: o};       
        break;

        case "object":
          
          // Prevent clicking same ID
          if (this.currBox == o.navigateToBox) {
            return false;
          }
        break;

        return false;
      }


      // default space we are moving: options are box, item
      this.space = 'box'; 
      
      // Note if we have a we have a item or box to work with
      this.hasBoxes = this.box.length ? true : false;
      this.hasitems = this.box[this.currBox].item.length ? true : false;

      // return if is currently animating
      if( this.isAnimating ) {
        return false;
      }

      this.isAnimating = true;

      // Catch direction so we can handle it 
      switch(o.direction) {
        case 'right':
        case 'left':
         this.space = 'box';
        break;

        case 'up':
        case'down':
          
          if (this.hasitems) {
            this.space = 'item';
          } else {
            this.isAnimating = false;
            return false;
          }
        break;
      }

      // perform callback, call here because of the other variables that may be needed
      if (this.callbacks.before)
          this.callbacks.before(this);
      
      // prep current box/item      
      var $currentBox = this.box[this.currBox].b;
      var $currentitem = $(this.box[this.currBox].item[this.box[this.currBox].curritem]);
      

      // Update Current box/item
      this.updateCurrents(o.direction);


      // Define nextBox
      if (this.space ==  'box' && o.direction != 'direct') {
        this.box[this.currBox].nextBox = this.box[this.currBox].b.addClass('ptg-current');
      } else if (this.space ==  'box' && o.direction == 'direct') {
        this.box[this.currBox].nextBox = this.box[o.navigateToBox].b.addClass('ptg-current');
      }
      
      // // Define nextitem
      if (this.space ==  'item') {
        this.box[this.currBox].nextitem = $(this.box[this.currBox].item[this.box[this.currBox].curritem]).addClass('ptg-current');
      }
      
      this.outClass = '';
      this.inClass = '';
      
      // update in out classes
      this.updateInOutClasses(o);

      // prep next box/item

      if (o.direction == 'direct') {
        this.currBox = o.navigateToBox;
      }
      
      var $nextBox = this.box[this.currBox].b;
      var $nextitem = $(this.box[this.currBox].item[this.box[this.currBox].curritem]).addClass('ptg-current');



      // Transit a box
      if (this.space == 'box') {
        // Current page
        $currentBox
          .addClass( this.outClass )
          .on( self.animEndEventName, function() {
            $currentBox.off( this.animEndEventName );
            self.endCurrPage = true;

            if( self.endNextPage ) {
              self.onEndAnimation( $currentBox, $nextBox);
            }
        });

        // Next Page
        $nextBox
          .addClass( this.inClass )
          .on( this.animEndEventName, function() {
            $nextBox.off( self.animEndEventName );
            self.endNextPage = true;
            if( self.endCurrPage ) {
              self.onEndAnimation( $currentBox, $nextBox);
            }
        });
      }

      // Transit a item
      if (this.space == 'item') {
        // Current page
        $currentitem
          .addClass( this.outClass )
          .on( self.animEndEventName, function() {
            $currentitem.off( this.animEndEventName );
            self.endCurrPage = true;

            if( self.endNextPage ) {
              self.onEndAnimation( $currentitem, $nextitem);
            }
        });

        // Next Page
        $nextitem
          .addClass( this.inClass )
          .on( this.animEndEventName, function() {
            $nextitem.off( self.animEndEventName );
            self.endNextPage = true;
            if( self.endCurrPage ) {
              self.onEndAnimation( $currentitem, $nextitem);
            }
        });
      }






      if( !this.support ) {
        if (this.space == 'box') {
          this.onEndAnimation( $currentBox, $nextBox);
        }
        if (this.space == 'item') {
          this.onEndAnimation( $currentitem, $nextitem);
        }
        
      }
      
      // Clear selections
      this.clearSelections();

      // Update display of nav by hiding and showing when needing to
      this.hideShowNav();

      // perform callback
      if (this.callbacks.after)
          this.callbacks.after(this);

      /* TEMP DEBUG STUFF */
      var currentStatus = "Direction: " + o.direction + ", currentBox: " + this.currBox + " / " + (this.box.length - 1);
      
      if (this.box[this.currBox].item.length > 0) {
        currentStatus+= ", Currentitem: " + this.box[this.currBox].curritem +" / "+ (this.box[this.currBox].item.length -1) + "";
      } else {
        currentStatus+= ", Currentitem: no items found in this box";
      }
      // Let me know whats going on
      this.dbm(currentStatus, true);
      /* END DEBUG STUFF */

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
      // Box & right
      if(this.space == 'box' && o.direction == 'right') {
        this.outClass = this.config.transitions.right.outClass;
        this.inClass  = this.config.transitions.right.inClass;
      }

      // Box & left
      if(this.space == 'box' && o.direction == 'left') {
        this.outClass = this.config.transitions.left.outClass;
        this.inClass  = this.config.transitions.left.inClass;
      }

      // item & up
      if(this.space == 'item' && o.direction == 'up') {
        this.outClass = this.config.transitions.up.outClass;
        this.inClass  = this.config.transitions.up.inClass;
      }

      // item & down
      if(this.space == 'item' && o.direction == 'down') {
        this.outClass = this.config.transitions.down.outClass;
        this.inClass  = this.config.transitions.down.inClass;
      }

      // Direct
      if (this.space == 'box' && o.direction == 'direct') {
        if (this.currBox < o.navigateToBox) {
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

 
      // perform global callback
      if (this.callbacks.onAnimationEnd)
          this.callbacks.onAnimationEnd(this);
    },





    // reset settings 
    resetPage: function( $outpage, $inpage ) {
      $outpage.attr( 'class', $outpage.data("originalClassList") );
      $inpage.attr( 'class', $inpage.data("originalClassList") + ' ptg-current' );
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
      Update to define next based on incremements of 1
    */
    updateCurrents: function(direction) {

      switch(direction) {
        case "right":
          this.currBox = this.currBox < this.box.length - 1 ? ++this.currBox : 0;
        break;

        case "left":
          this.currBox = (this.currBox > 0) ? --this.currBox : this.box.length - 1;
        break;

        case "up":
          if (this.box[this.currBox].curritem > 0) {
            --this.box[this.currBox].curritem;
          } else {
            this.box[this.currBox].curritem = this.box[this.currBox].item.length - 1;
          }
        break;

        case "down":
          if (this.box[this.currBox].curritem < this.box[this.currBox].item.length -1) {
            ++this.box[this.currBox].curritem;
          } else {
            this.box[this.currBox].curritem = 0;
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

