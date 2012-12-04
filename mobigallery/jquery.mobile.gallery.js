/*
 * Using concepts from
 *    imageflip 0.1 (2012) - MIT License - Saman W Jayasekara
 *        http://cflove.org/2012/09/imageflip-jquery-mobile-image-gallery-plugin.cfm
 *        https://bitbucket.org/cflove/imageflip-jquery-mobile-image-gallery-plugin
 *
 *    Swipe 1.0 (2011) - GPL & MIT License - Brad Birdsall, Prime
 *        http://swipejs.com/
 *        https://github.com/bradbirdsall/Swipe
 *
 *    SwipeView 1.0 (2012) - MIT License - Matteo Spinelli
 *        http://cubiq.org/swipeview
 *        https://github.com/cubiq/SwipeView
 *
 *    DateBox i18n System (2012) - Creative Commons 3.0 - JT Sage
 *        http://dev.jtsage.com/jQM-Plugin/#the_datebox_i18n_system
 *        https://github.com/jtsage/jquery-mobile-datebox
 */
/**
 * @type jQueryMobile
 * @name mobigallery
 * @cat Plugins/MobiGallery
 * @author Sébastien Gissinger
 */
(function($) {
    $.widget('mobile.gallery', $.mobile.widget, {
        options: {
            initSelector: ":jqmData(role='gallery')",
            theme: 'c',
            uselang: 'en',
            lang: {
                'en': {
                    close: 'Close gallery',
                    previous: 'Previous image',
                    next: 'Next image',
                    on: ' of '
                }
            },
            transition: 'none',
            hashname: 'gallery',
            slideenabled: true,
            slidefunction: 'ease-out',
            slideduration: '.5s'
        },

        /**
         * @desc members
         */
        _domid  : 'ui-gallery-page',
        _linkSelector: ":jqmData(role='gallerylink')",
        _showSelector: ":jqmData(show='1')",
        _gallery: undefined,
        _footer : undefined,
        _view   : undefined,
        _selectedImage  : undefined,
        _imagesContainer: undefined,
        __canTranslate3d: undefined,

        /**
         * @desc $.mobile.widget constructor
         */
        _create: function()
        {
			var self = this;

            this._gallery = $(this.element);
            this._gallery.find(this._linkSelector)
                    .each(function()
                    {
                        $(this).attr(self._data('href'), $(this).attr('href')).removeAttr('href');
                        $(this).addClass('ui-gallery-link ui-corner-all');
                    })
                    .click(function()
                    {
                        self._gallery.children().removeAttr(self._data('show'));

                        link = $(this);
                        link.parent().attr(self._data('show'), '1');

                        var linkImgSrc = link.attr(self._data('href'));

                        if (linkImgSrc != '')
                        {
                            $('body').append(self._createPage());
                            $.mobile.changePage($('#' + self._domid), { transition : self.options.transition });
                            $.mobile.loading('show');

                            $('<img src="' + linkImgSrc + '"/>').load(function() {
                                self._createImages(link);
                                self._setTitle(link);

                                $.mobile.loading('hide');
                            });
                        }
                    });
        },

        /**
         * @desc creates the jQM page containing the fullscreen gallery
         */
        _createPage: function()
        {
            var self = this;

            var closeButton = $('<li>').append(
                    $('<a>', {href: 'javascript:history.back();', title: this.__('close')})
                    .buttonMarkup({
                        icon: 'delete',
                        iconpos: 'notext',
                        theme: this.options.theme
                    }));

            var header = $('<div>')
                    .attr(this._data('role'), 'header')
                    .append($('<div>')                                    
                            .attr(this._data('role'), 'navbar')
                            .append($('<ul>').append(closeButton)))
                    .fixedtoolbar({
                        disablePageZoom: false,
                        fullscreen: true
                    });

            this._footer = $('<div>')
                    .attr(this._data('role'), 'footer')
                    .append($('<div>')
                            .attr(this._data('role'), 'navbar'))
                    .fixedtoolbar({
                        disablePageZoom: false,
                        fullscreen: true
                    });

            var prevButton = $('<a>', {href: 'javascript:;', title: this.__('previous')})
                    .addClass('ui-header-fullscreen ui-gallery-prev')
                    .click(function(e) { self._swipe('prev'); })
                    .buttonMarkup({
                        icon: 'arrow-l',
                        iconpos: 'right',
                        theme: this.options.theme
                    });

            var nextButton = $('<a>', {href: 'javascript:;', title: this.__('next')})
                    .addClass('ui-header-fullscreen ui-gallery-next')
                    .click(function(e) { self._swipe('next'); })
                    .buttonMarkup({
                        icon: 'arrow-r',
                        theme: this.options.theme
                    });

            this._view = $('<div>');

            if(this._canTranslate3d())
            {
                this._view.data('pourc', 0)
                    .css({transitionTimingFunction: this.options.slidefunction});
            }

            var touchView = $('<div>')
                    .append(this._view)
                    .on('vmousedown', function(e)
                    {
                        e.stopPropagation();

                        this.start = {
                            pageX: e.pageX,
                            pageY: e.pageY,
                            time : e.timeStamp
                        };
                    })
                    .on('vmousemove', function(e)
                    {
                        // stop process if movement is pinching
                        if(e.touches && e.touches.length > 1  || e.scale && e.scale !== 1)
                            return;

                        if(this.start != undefined)
                        {
                            e.preventDefault();
                            e.stopPropagation();

                            if(self._canTranslate3d())
                            {
                                var deltaX = ($(document).width() * self._view.data('pourc')) + e.pageX - this.start.pageX;

                                self._transform('0s', deltaX, 'px');
                            }
                        }
                    })
                    .on('vmouseup', function(e)
                    {
                        if(this.start != undefined)
                        {
                            if(self._isLeftSwipe(this.start, e))
                                self._swipe('next');
                            else if(self._isRightSwipe(this.start, e))
                                self._swipe('prev');
                            else
                                if(self._canTranslate3d())
                                    self._transform(self.options.slideduration);

                            this.start = undefined;
                        }
                        else
                            if(self._canTranslate3d())
                                self._transform(self.options.slideduration);
                    });
            

            var content = $('<div>')
                    .attr(this._data('role'), 'content')
                    .append(prevButton)
                    .append(nextButton)
                    .append(touchView);

            return $('<div>', { id: this._domid})
                    .attr(this._data('role'), 'page')
                    .attr(this._data('url'), location.pathname + location.search + '#' + this.options.hashname)
                    .append(header)
                    .append(content)
                    .append(this._footer)
                    .on('pagehide', function(e) { $(this).remove(); });
        },

        /**
         * @desc creates image elements
         */
        _createImages: function(clickedLink)
        {
            var clickedElem = $('<div>')
                    .css({backgroundImage:'url(' + clickedLink.attr(this._data('href')) + ')',
                          transform:'translate3d(0%,0,0)'})
                    .data('pourc', 0);

            this._view.append(clickedElem);

            if(this._canTranslate3d())
            {
                if (this._gallery.children(this._showSelector).prev().length)
                    prevImg = this._gallery.children(this._showSelector).prev().find(this._linkSelector);
                else
                    prevImg = this._gallery.children(':last-child').find(this._linkSelector);

                if (this._gallery.children(this._showSelector).next().length)
                    nextImg = this._gallery.children(this._showSelector).next().find(this._linkSelector);
                else
                    nextImg = this._gallery.children(':first-child').find(this._linkSelector);


                var prevElem = $('<div>')
                        .css({backgroundImage:'url(' + prevImg.attr(this._data('href')) + ')',
                              transform:'translate3d(-100%,0,0)'})
                        .data('pourc', -1);

                var nextElem = $('<div>')
                        .css({backgroundImage:'url(' + nextImg.attr(this._data('href')) + ')',
                              transform:'translate3d(100%,0,0)'})
                        .data('pourc', 1);

                prevElem.insertBefore(clickedElem);
                nextElem.insertAfter(clickedElem);

                this._selectedImage = 1;
                this._imagesContainer = new Array(prevElem, clickedElem, nextElem);
            }
            else
                this._imagesContainer = new Array(clickedElem);
        },

        /**
         *
         */
        _swipe: function(dir)
        {
            if(!this._canTranslate3d())
                $.mobile.loading('show');

            var self = this, trans = 0, imgNew = undefined,
                pourc = this._view.data('pourc'), img = undefined,
                showingElem = willShowElem = this._gallery.children(this._showSelector).removeAttr(this._data('show'));

            switch(dir)
            {
                case 'next':
                    if (showingElem.next().length)
                        willShowElem = showingElem.next();
                    else
                        willShowElem = this._gallery.children(':first-child');

                    if(this._canTranslate3d())
                    {
                        trans = (100 * pourc) - 100;
                        pourc--;

                        if (willShowElem.next().length)
                            imgNew = willShowElem.next().find(this._linkSelector);
                        else
                            imgNew = this._gallery.children(':first-child').find(this._linkSelector);

                        this._selectedImage++;
                    }
                    else
                        imgNew = willShowElem.find(this._linkSelector);
                break;

                case 'prev':
                    if (showingElem.prev().length)
                        willShowElem = showingElem.prev();
                    else
                        willShowElem = this._gallery.children(':last-child');

                    if(this._canTranslate3d())
                    {
                        trans = (100 * pourc) + 100;
                        pourc++;

                        if (willShowElem.prev().length)
                            imgNew = willShowElem.prev().find(this._linkSelector);
                        else
                            imgNew = this._gallery.children(':last-child').find(this._linkSelector);

                        this._selectedImage--;
                    }
                    else
                        imgNew = willShowElem.find(this._linkSelector);
                break;
            }

            willShowElem.attr(this._data('show'), '1');

            if(imgNew != undefined)
            {
                if(this._canTranslate3d())
                {
                    var imgIndex = this._nextImageContainer(dir);
                    img = this._imagesContainer[imgIndex];
                    var imgPourc = img.data('pourc') + (dir == 'next' ? 3 : -3);

                    img.css({transform: 'translate3d(' + (100 * imgPourc) + '%,0,0)'})
                       .data('pourc', imgPourc);
                }
                else
                    img = this._imagesContainer[0];

                var link = imgNew.attr(this._data('href'));

                $('<img src="' + link + '"/>').load(function()
                {
                    img.css({backgroundImage: 'url(' + link + ')'});
                    self._setTitle(willShowElem.find(self._linkSelector));

                    $.mobile.loading('hide');
                });
            }

            if(this._canTranslate3d())
            {
                this._transform(this.options.slideduration, trans);
                this._view.data('pourc', pourc);
            }
        },

        /**
         * @desc replaces elements when document is resized like orientation change
         */
        _transform: function(time, translation, unit)
        {
            if(time == undefined) time = '0s';
            if(unit == undefined) unit = '%';

            if(translation == undefined)
                translation = (100 * this._view.data('pourc'));

            this._view.css({transitionDuration:time,
                            transform:'translate3d(' + translation + unit + ',0,0)'});
        },

        /**
         *
         */
        _nextImageContainer: function(dir)
        {
            if(this._selectedImage < 0)
                this._selectedImage = 2;
            else if(this._selectedImage > 2)
                this._selectedImage = 0;

            if(dir == 'next')
            {
                switch(this._selectedImage)
                {
                    case 0: return 1;
                    case 1: return 2;
                    case 2: return 0;
                }
            }
            else if(dir == 'prev')
            {
                switch(this._selectedImage)
                {
                    case 0: return 2;
                    case 1: return 0;
                    case 2: return 1;
                }
            }
            return 1;
        },

        /**
         *
         */
        _setTitle: function(element)
        {
            var imageCount = (element.parent().index() + 1) + this.__('on') + this._gallery.children().length,
                title = element.attr('title');

            if (title != undefined && title != '')
                this._footer.html(title + '<br/>' + imageCount);
            else
                this._footer.html(imageCount);
        },

        /**
         * @returns the localized string associated to the given key or english
         *          if none exists in the custom localization object
         */
        __: function(key)
        {
            if(this.options.lang[this.options.uselang][key] != undefined)
                return this.options.lang[this.options.uselang][key];
            else
                return this.options.lang['en'][key];
        },

        /**
         * @returns the name of the data- attribute with the jQM namespace
         */
        _data: function(val)
        {
            return 'data-' + $.mobile.ns + val;
        },

        /**
         * @return true if movement is a swipe movement without vertical and timeout checks
         *              of swipeleft and swiperight events of jQM implementation
         */
        _isSwipe: function(start, e)
        {
            return Math.abs(start.pageX - e.pageX) > $.event.special.swipe.horizontalDistanceThreshold;
        },

        /**
         * @return true if swipe movement goes from right to left
         */
        _isLeftSwipe: function(start, e)
        {
            return this._isSwipe(start, e) && (start.pageX - e.pageX) > 0;
        },

        /**
         * @return true if swipe movement goes from left to right
         */
        _isRightSwipe: function(start, e)
        {
            return this._isSwipe(start, e) && (start.pageX - e.pageX) < 0;
        },

        /**
         * @return true if translate3d can be applied. jQM $.support.cssTransform3d
         *              returns false for IE10 but translate3d() is supported by this browser
         */
        _canTranslate3d: function()
        {
            if(this.__canTranslate3d == undefined)
                this.__canTranslate3d = (!$.mobile.browser.ie || $.mobile.browser.ie > 9) && this.options.slideenabled;

            return this.__canTranslate3d;
        }
    });
    $(document).on('pagecreate create', function(e) {
        $.mobile.gallery.prototype.enhanceWithin(e.target, true);
    });
    $.extend($.mobile.gallery.prototype.options.lang, {
        'fr': {
            close: 'Fermer la galerie',
            previous: 'Image précédente',
            next: 'Image suivante',
            on: ' sur '
        }
    });
})(jQuery);