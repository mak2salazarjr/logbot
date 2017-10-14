$(function() {
    'use strict';
    var initialising = true;
    var current_channel = $('#channel').data('name');

    // collapse sidebar

    function set_sidebar_cookie(value) {
        document.cookie = "menu-c=" + (value ? '1' : '0') + '; expires=Thu, 31 Dec 2037 23:59:58 GMT; path=/';
    }

    function set_sidebar_collapse_title() {
        $('#collapse-sidebar').attr('title',
            $('body').hasClass('menu-c')
            ? 'Show Channels' : 'Hide Channels'
        );
    }

    $('#collapse-sidebar')
        .click(function() {
            $('body').toggleClass('menu-c');
            set_sidebar_collapse_title();
            set_sidebar_cookie($('body').hasClass('menu-c'));
        });

    set_sidebar_collapse_title();

    // about

    $('#about')
        .click(function() {
            set_sidebar_cookie(false);
        });

    // nav - date

    function nav_to_date(ymd) {
        document.location = '/' + encodeURIComponent(current_channel.substring(1)) + '/' + ymd;
    }

    if (document.getElementById('date-icon')) {
        var pika_config = {
            field: document.getElementById('date-icon'),
            maxDate: new Date(),
            onSelect: function(date) {
                var mm = (date.getMonth() + 1).toString();
                var dd = date.getDate().toString();
                var ymd = [date.getFullYear(), mm.length === 2 ? '' : '0', mm, dd.length === 2 ? '' : '0', dd].join('');
                nav_to_date(ymd);
            }
        };
        var ymd = $('#date').data('ymd') + '';
        if (ymd) {
            pika_config.defaultDate = new Date(ymd.substr(0, 4), ymd.substr(4, 2) - 1, ymd.substr(6, 2));
            pika_config.setDefaultDate = true;
        }
        new Pikaday(pika_config);
    }

    // nav - last message
    $('#channel-end')
        .click(function(e) {
            e.preventDefault();
            $('html, body').animate({ scrollTop: document.body.scrollHeight || document.documentElement.scrollHeight }, 50);
        });
    if ($('.no-events').length) {
        $('#channel-end')
            .attr('disabled', true)
            .attr('href', '');
    }

    // nav - network
    $('#current-network')
        .click(function(e) {
            e.preventDefault();
            if ($('#networks').hasClass('collapsed')) {
                $('#networks').removeClass('collapsed');
            } else {
                $('#networks').addClass('collapsed');
            }
        });

    // search

    $('#search-submit')
        .click(function() {
            document.forms[0].submit();
        });

    if ($('body').hasClass('search')) {
        $('#search-nav')
            .prop('disabled', true);

        $('#search-query')
            .focus()
            .select();

        var pika_config = {
            maxDate: new Date(),
            keyboardInput: false,
            toString: function(d) {
                return [
                    d.getFullYear(),
                    ('0' + (d.getMonth() + 1)).slice(-2),
                    ('0' + d.getDate()).slice(-2)
                ].join('-');
            }
        };
        pika_config.field = document.getElementById('search-when-from');
        new Pikaday(pika_config);
        pika_config.field = document.getElementById('search-when-to');
        new Pikaday(pika_config);

        $(window).on('pageshow', function(e) {
            // replace name attributes that are cleared on submit
            $('#search-form input').each(function() {
                var $this = $(this);
                if ($this.data('name')) {
                    $this.attr('name', $this.data('name'));
                }
            });
        });
    }

    $('#search-channels')
        .chosen({
            no_results_text: 'No channels matching',
            placeholder_text_multiple: 'All channels',
            search_contains: true,
            display_selected_options: false
        });

    $('#search-channel-all, #search-channel-single, #search-channel-custom')
        .change(function() {
            if (!$(this).prop('checked')) {
                return;
            }
            if ($(this).attr('id') === 'search-channel-custom') {
                $('#search-channels').attr('disabled', false)
                $('#search-channel-multi').show();
                if (!initialising) {
                    $('#search-channels').trigger('chosen:open');
                }
            } else {
                $('#search-channel-multi').hide();
                $('#search-channels').attr('disabled', true)
            }
        })
        .change();

    $('#search-when-all, #search-when-recently, #search-when-custom')
        .change(function() {
            if (!$(this).prop('checked')) {
                return;
            }
            if ($(this).attr('id') === 'search-when-custom') {
                $('#search-when-from').attr('disabled', false)
                $('#search-when-to').attr('disabled', false)
                $('#search-when-range').show();
            } else {
                $('#search-when-range').hide();
                $('#search-when-from').attr('disabled', true)
                $('#search-when-to').attr('disabled', true)
            }
        })
        .change();

    $('#search-form-submit')
        .click(function() {
            $('#search-channel-all, #search-channel-custom, #search-when-recently, #search-using-ft')
                .each(function() {
                    var $this = $(this);
                    if ($this.prop('checked')) {
                        $this.data('name', $this.attr('name'));
                        $this.attr('name', '');
                    }
                });
            var $who = $('#search-who');
            if ($who.val() === '') {
                $who.data('name', $who.attr('name'));
                $who.attr('name', '');
            }
        });

    // highlight

    function highlight($start, $end) {
        // clear highlights
        $('li.hl').removeClass('hl');

        var start_id = $start.attr('id');
        var end_id = $end.attr('id');

        // single row
        if (!end_id || start_id === end_id) {
            $start.addClass('hl');
            return [start_id];
        }

        // swap positions if end is before start
        if ($start.prevAll().filter('#' + end_id).length) {
            var tmp = end_id;
            end_id = start_id;
            start_id = tmp;
            tmp = $end;
            $start = $end;
            $end = tmp;
        }

        // iterate from start to end
        var id = start_id;
        var $el = $start;
        while (id !== end_id) {
            $el.addClass('hl');
            $el = $el.next();
            id = $el.attr('id');
            if (!id) {
                return [start_id];
            }
        }
        $el.addClass('hl');

        return [start_id, end_id];
    }

    var $hl_anchor = false;
    $('#logs .time')
        .click(function(e) {
            e.preventDefault();

            var $li = $(this).parent('li');
            var $current = $('li.hl');

            // if shift key is down highlight range
            if (e.shiftKey && $hl_anchor) {
                var range = highlight($hl_anchor, $li);
                var anchor = '#' + range[0] + (range[1] ? '-' + range[1] : '');
                history.pushState('', document.title, document.location.pathname + document.location.search + anchor);
                return;
            }

            if ($li.hasClass('hl')) {
                // deselect
                $current.removeClass('hl');
                $hl_anchor = false;
                history.pushState('', document.title, document.location.pathname + document.location.search);

            } else {
                // highlight just this row
                $current.removeClass('hl');
                $li.addClass('hl');
                $hl_anchor = $li;
                history.pushState('', document.title, document.location.pathname + document.location.search + '#' + $li.attr('id'))
            }
        });

    var hl_hash = document.location.hash.match('^#(c[0-9]+)(-(c[0-9]+))?$');
    if (hl_hash) {
        var $li = $('#' + hl_hash[1]);
        if ($li.length) {
            var range = highlight($li, $('#' + hl_hash[3]));
            var offset = $li.offset();
            $hl_anchor = $('#' + range[0]);
            $('html, body').animate({ scrollTop: $li.offset().top - 40 }, 50);
        }
    }

    // settings dialog

    function toggle_setting($setting, name) {
        var enabled = $('body')
            .toggleClass(name)
            .hasClass(name);
        document.cookie = name + '=' + (enabled ? '1' : '0') + '; expires=Thu, 31 Dec 2037 23:59:58 GMT; path=/';
        $setting
            .find('input')
            .prop('checked', enabled);
    }

    $('#settings')
        .click(function() {
            $('#settings-dialog').addClass('is-active');
        });

    $('#settings-dialog .modal-background, #settings-dialog .modal-close, #settings-close')
        .click(function() {
            $('#settings-dialog').removeClass('is-active');
        });

    $('#settings-font-size')
        .click(function() {
            toggle_setting($(this), 'font-s');
        });

    $('#settings-nick-uncoloured')
        .click(function() {
            toggle_setting($(this), 'nick-u');
        });

    $('#settings-nick-wide')
        .click(function() {
            toggle_setting($(this), 'nick-w');
        });

    $('#settings-hide-bots')
        .click(function() {
            toggle_setting($(this), 'hide-b');
        });

    $('#settings-normal-bots')
        .click(function() {
            toggle_setting($(this), 'norm-b');
        });

    $('#settings-container .setting')
        .hover(
            function() {
                var $this = $(this);
                if (!$this.hasClass('not-implemented')) {
                    $(this).find('input').addClass('hover');
                }
            },
            function() {
                $(this).find('input').removeClass('hover');
            }
        );

    // coloured nicks

    function colourise_nicks() {
        var $nick_style = $(document.createElement('style'));
        $('body').append($nick_style[0]);
        var style_added = {};

        $('.nc').each(function () {
            var hash = $(this).data('hash');
            if (hash === 0) {
                return;
            }
            if (style_added['h' + hash]) {
                return;
            }

            var deg = hash % 360;
            var h = deg < 0 ? 360 + deg : deg;
            var l = 50;
            if (h >= 30 && h <= 210) {
                l = 30;
            }
            var s = 20 + Math.abs(hash) % 80;

            $nick_style.text(
                $nick_style.text() +
                'body:not(.nick-u) .nc[data-hash="' + hash + '"]' +
                '{color:hsl(' + h + ',' + s + '%,' + l + '%)!important}'
            );
            style_added['h' + hash] = true;
        });
    }

    colourise_nicks();

    // channel stats

    if ($('body').hasClass('stats')) {

        $.getJSON('stats/meta', function(data) {
            $.each(data, function(name, value) {
                $('#' + name)
                    .text(value)
                    .removeClass('loading');
            });
        });

        $.ajax({
            url: 'stats/hours',
            method: 'GET',
            dataType: 'json',
            success: function(series) {
				var $container = $('#hours-plot');

				$container
				    .text('')
				    .removeClass('loading');

                var plot = $.plot(
                    $container,
                    [ series ],
                    {
                        xaxis: {
                            ticks: 24,
                            tickFormatter: function(h) {
                                if (h == 0) return '12am';
                                if (h < 12) return h + 'am';
                                h -= 12;
                                if (h == 0) return '12pm';
                                return h + 'pm';
                            }
                        },
                        yaxis: {
                            show: false
                        },
                        grid: {
                            borderWidth: 0
                        },
                        colors: [ '#444' ]
                    }
                );

                var current_hh = $container.data('hh') * 1;
                var current_mm = $container.data('mm') * 1;

                var offset = plot.pointOffset({ x: current_hh + (current_mm / 60), y: plot.getAxes().yaxis.datamax });
                var style = 'position:absolute;height:' + plot.height() + 'px;top:8px;left:' + offset.left + 'px';
                $container.append('<div id="hours-now" style="' + style + '">Now</div>');
            }
        });

        $.ajax({
            url: 'stats/nicks',
            method: 'GET',
            dataType: 'json',
            success: function(data) {
                var $table = $('<table id="top-nicks"/>');
                if (data.length) {
                    var top_count = data[0].count * 1;
                    $.each(data, function(i, entry) {
                        var count = entry.count * 1;
                        var $row = $('<tr/>');
                        if (entry.bot) {
                            $row.addClass('bot');
                        }
                        $row.append($('<td class="nick nc"/>').text(entry.nick).attr('data-hash', entry.hash));
                        $row.append($('<td class="count"/>').text(count.toLocaleString()));
                        $row.append($('<td class="bar"/>').append($('<div>&nbsp;</div>').css('width', (count / top_count * 100) + '%')));
                        $table.append($row);
                    });
                } else {
                    $table.append('<tr><td>no data</td></tr>');
                }
                $('#nicks-plot')
                    .text('')
                    .removeClass('loading')
                    .append($table);
                colourise_nicks();
            }
        });
    }

    initialising = false;
});