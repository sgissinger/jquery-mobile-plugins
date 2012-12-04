/*
 * Borrows codes and concepts from
 *   jQuery customfileinput (2010) - MIT License - Scott Jehl
 *      http://filamentgroup.com/lab/jquery_custom_file_input_book_designing_with_progressive_enhancement/
 *      https://github.com/filamentgroup/jQuery-Custom-File-Input
 *
 *    DateBox i18n System (2012) - Creative Commons 3.0 - JT Sage
 *        http://dev.jtsage.com/jQM-Plugin/#the_datebox_i18n_system
 *        https://github.com/jtsage/jquery-mobile-datebox
 *
 *    Debouncer function
 *        http://stackoverflow.com/questions/4298612/jquery-how-to-call-resize-event-only-once-its-finished-resizing
 */
/**
 * @type jQueryMobile
 * @name mobifile
 * @cat Plugins/MobiFile
 * @author Sébastien Gissinger
 */

(function($) {
    $.widget('mobile.file', $.mobile.widget, {
        options: {
            initSelector: ":jqmData(role='file-set')",
            fileSelector: ":jqmData(role='file')",
            theme: 'a',
            uselang: 'en',
            lang: {
                'en': {
                    remove: 'Remove',
                    noFileSelected: 'Click or touch this area to select a file...',
                    cannotUseFile: 'Your device do not support file upload'
                }
            },
            buttontheme: 'b',
            ismultiple: false,
            afterdomupdate: 'undefined'
        },

        _afterDomUpdate: function()
        {
            var fn = window[this.options.afterdomupdate];

            if(fn != undefined)
                fn();
        },

        /**
         * @desc members
         */
        _files: new Array(),
        _resizeCallback: undefined,

        /**
         * @desc $.mobile.widget constructor
         */
        _create: function()
        {
            var self = this;

            this._resizeCallback = this._debounce(function()
            {
                var files = $(self._files);

                if(self.option.ismultiple)
                    files = files.slice(0, -1);

                files.each(function()
                {
                    self._resizeWrapper($(this).parents('.ui-file-wrapper'), $(this).parents('.ui-file'), $(this).parents('.ui-file').find('a'));
                });
            });
            $(window).on('resize', this._resizeCallback);

            this._addControl($(this.element).find(this.options.fileSelector));
        },

        /**
         *
         */
        _removeControl: function(wrapper, file)
        {
            var self = this, newFile = file.clone();

            if(this._files.length > 1 || !this.options.ismultiple)
            {
                wrapper.parent().hide('fast', function()
                {
                    $(this).remove();
                    self._files.splice($.inArray(file, self._files), 1);
                    self._afterDomUpdate();
                });
            }

            if(!this.options.ismultiple)
                this._addControl(newFile);
        },

        /**
         *
         */
        _addControl: function(file)
        {
            var self = this, opt = self.options;

            var removeButton = $('<a>', {href: 'javascript:;'})
                    .hide()
                    .text(this.__('remove'))
                    .click(function() { self._removeControl(wrapper, file); })
                    .buttonMarkup({
                        theme: opt.buttontheme
                    });

            var feedBack = $('<span>')
                    .addClass('ui-file-feedback')
                    .text(this.__('noFileSelected'));

            var wrapper = $('<div>')
                    .addClass('ui-file-wrapper')
                    .mousemove(function(e){
                        file.css({
                            left: e.pageX - $(this).offset().left - file.outerWidth() + 3,
                            top: e.pageY - $(this).offset().top - 3
                        });
                    });

            file.addClass('ui-file-input')
                .on('disable',function(){
                    self._disable(wrapper, file, container, removeButton, feedBack);
                })
                .on('enable',function(){
                    self._enable(wrapper, file, container, removeButton, feedBack);
                })
                .change(function()
                {
                    self._change(wrapper, file, container, removeButton, feedBack);

                    if(opt.ismultiple && $(this).parents(opt.initSelector).find(opt.fileSelector).last().val() != '')
                        self._addControl($(this).clone());
                });

            if(file.is('[disabled]'))
                file.trigger('disable');

            this._files.push(file);

            var container = $('<div>')
                    .hide()
                    .attr(this._data('theme'), opt.theme)
                    .addClass('ui-file ui-btn ui-btn-corner-all ui-shadow ui-btn-up-' + opt.theme)
                    .appendTo($(this.element))
                    .append(removeButton)
                    .append(feedBack)
                    .append(wrapper.append(file))
                    .show('fast', function() {
                        self._resizeWrapper(wrapper, container, removeButton);
                        self._afterDomUpdate();
                    });
        },

        /**
         *
         */
        _disable: function(wrapper, file, container, removeButton, feedBack)
        {
            file.attr('disabled', true);
            container.addClass('ui-disabled');
            this.disabled = true;

            if(feedBack.text() == this.__('noFileSelected'))
                feedBack.text(this.__('cannotUseFile'));
            else
                removeButton.hide();

            this._resizeWrapper(wrapper, container, removeButton);
        },

        /**
         *
         */
        _enable: function(wrapper, file, container, removeButton, feedBack)
        {
            file.removeAttr('disabled');
            container.removeClass('ui-disabled');
            this.disabled = false;

            if(feedBack.text() == this.__('cannotUseFile') || feedBack.text() == this.__('noFileSelected'))
                feedBack.text(this.__('noFileSelected'));
            else
                removeButton.show();

            this._resizeWrapper(wrapper, container, removeButton);
        },

        /**
         *
         */
        _change: function(wrapper, file, container, removeButton, feedBack)
        {
            var filename = file.val().split(/\\/).pop();

            if(filename == '')
            {
                if(this._files.length > 1 || !this.options.ismultiple)
                    this._removeControl(wrapper, file);
                else
                {
                    feedBack.text(this.options.noFileSelected)
                            .removeClass(feedBack.data('fileExt') || '')
                            .removeClass('ui-file-feedback-populated');

                    removeButton.hide();
                    this._resizeWrapper(wrapper, container, removeButton);
                }
            }
            else
            {
                var fileExt = 'ui-file-ext-' + filename.split('.').pop().toLowerCase();

                feedBack.text(filename)
                        .removeClass(feedBack.data('fileExt') || '')
                        .data('fileExt', fileExt)
                        .addClass(fileExt + ' ui-file-feedback-populated');

                removeButton.show();
                this._resizeWrapper(wrapper, container, removeButton);
            }
        },

        /**
         *
         */
        _resizeWrapper: function(wrapper, container, removeButton)
        {
            if(removeButton.is(':visible'))
                w = (container.innerWidth() - removeButton.outerWidth(true)) + 'px';
            else
                w = '100%';

            wrapper.css({width: w});
        },

        /**
         * @returns the localized string associated to the given key or
         *          the english one if none exists in the localization object
         */
        __: function(key)
        {
            var opt = this.options;

            if(opt.lang[opt.uselang][key] != undefined)
                return opt.lang[opt.uselang][key];
            else
                return opt.lang['en'][key];
        },

        /**
         * @returns the name of the data- attribute with the jQM namespace
         */
        _data: function(val)
        {
            return 'data-' + $.mobile.ns + val;
        },
        
        /**
         * @returns a function that can be used as a callback in events
         *          that can be fired multiple times like resize in window
         */
        _debounce: function(func, timeout)
        {
            var timeoutID, timeout = timeout || 200;

            return function()
            {
                var scope = this, args = arguments;
                clearTimeout(timeoutID);
                timeoutID = setTimeout(function() {
                    func.apply(scope, Array.prototype.slice.call(args));
                }, timeout);
            }
        }
    });
    $(document).on('pagecreate create', function(e) {
        $.mobile.file.prototype.enhanceWithin(e.target, true);
    });
    $.extend($.mobile.file.prototype.options.lang, {
        'fr': {
            remove: 'Enlever',
            noFileSelected: 'Cliquez ou touchez cette zone pour sélectionner un fichier...',
            cannotUseFile: 'Votre appareil ne prend pas en charge l\'envoi de fichiers'
        }
    });
})(jQuery);