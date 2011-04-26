$(document).ready(function () {
    reset_url();
    if ($('#tbl-url tr.nourl_found').length != 1) {
        $('#tbl-url').tablesorter({
            headers: { 6: {sorter: false} }, // no sorter on column #6
            widgets: ['zebra'] // prettify
        });
    }

    $('#add-button').click(add);

    $('input[id^="edit-button-"]').click(function () {
        edit($(this).attr('id').substring('edit-button-'.length));
    });
    $('input[id^="delete-button-"]').click(function () {
        remove($(this).attr('id').substring('delete-button-'.length));
    });
});

function add() {
    var url = $('#add-url').val();
    if (!url || url === 'http://' || url === 'https://') {
        alert('no URL ?');
    } else {
        add_loading('#add-button');
        $.getJSON(
            '/api/add',
            {url: url},
            function (data) {
                if (data.status === 'success') {
                    $('<tr />', {
                        id: 'id-' + data.url.linkId
                    }).append($('<td />', {
                        text: data.url.linkId
                    })).append($('<td />', {
                        id: 'url-' + data.url.linkId
                    }).append($('<a />', {
                        title: data.url.originUrl,
                        href: data.url.originUrl,
                        text: data.url.originUrl
                    }))).append($('<td />').append($('<a />', {
                        title: data.url.shortUrl,
                        href: data.url.shortUrl,
                        text: data.url.shortUrl
                    }))).append($('<td />', {
                        id: 'timestamp-' + data.url.linkId,
                        text: data.url.date
                    })).append($('<td />', {
                        text: data.url.ip
                    })).append($('<td />', {
                        text: data.url.clickCount
                    })).append($('<td />', {
                        'class': 'actions'
                    }).append($('<input />', {
                        id: 'edit-button-' + data.url.linkId,
                        'class': 'button',
                        type: 'button',
                        value: 'Edit',
                        click: function () {
                            edit(data.url.linkId);
                        }
                    })).append('\n').append($('<input />', {
                        id: 'delete-button-' + data.url.linkId,
                        'class': 'button',
                        type: 'button',
                        value: 'Del',
                        click: function () {
                            remove(data.url.linkId);
                        }
                    }))).css('display', 'none').prependTo($('#tbl-url tbody')).fadeIn(200).trigger('update');

                    $('.nourl_found').remove();
                    zebra_table();
                    reset_url();
                    increment();
                }
                feedback(data.message, data.status);
                end_loading('#add-button');
                end_disable('#add-button');
            }
        );
    }
}

function edit(id) {
    var editRow = $('<tr />', {
        id: 'edit-' + id,
        'class': 'edit-row'
    }).append($('<td />', {
        colspan: '6'
    }).append('Edit: \n').append('<strong>original URL</strong>').append(':\n').
              append($('<input />', {
                  id: 'edit-url-' + id,
                  type: 'text',
                  value: $('#url-' + id + ' a').attr('href'),
                  size: '100',
                  'class': 'text'
              }))).append($('<td />', {
                  colspan: '1'
              }).append($('<input />', {
                  id: 'edit-submit-' + id,
                  type: 'button',
                  value: 'Save',
                  title: 'Save new value',
                  'class': 'button',
                  click: function () {
                      save_edit(id);
                  }
              })).append('\n').append($('<input />', {
                  id: 'edit-close-' + id,
                  type: 'button',
                  value: 'X',
                  title: 'Cancel editing',
                  'class': 'button',
                  click: function () {
                      cancel_edit(id);
                  }
              })));
    $('#id-' + id).after(editRow);
    $('#edit-url-'+ id).focus();
    add_disable('#edit-button-' + id);
    add_disable('#delete-button-' + id);
}

function remove(id) {
    if (confirm('Really delete?')) {
        $.getJSON(
            '/api/remove',
            {linkId: id},
            function (data) {
                if (data.status === 'success') {
                    $('#id-' + id).fadeOut(function () {
                        $(this).remove();
                        zebra_table();
                    });
                } else {
                    alert('something wrong happened while deleting :/');
                }
            }
        );
    }
}

function cancel_edit(id) {
    $('#edit-' + id).fadeOut(200, function () {
        end_disable('#edit-button-' + id);
        end_disable('#delete-button-' + id);
        $(this).remove();
    });
}

function save_edit(id) {
    add_loading('#edit-close-' + id);
    var newUrl = $('#edit-url-' + id).val();
    $.getJSON(
        '/api/update',
        {newUrl: newUrl, linkId: id}, function (data) {
            if(data.status === 'success') {
                $('#url-' + id).html('<a href="' + data.url.originUrl + '" title="' + data.url.originUrl + '">' + data.url.originUrl + '</a>');
                $('#timestamp-' + id).html(data.url.date);
                $('#edit-' + id).fadeOut(200, function(){
                    $('#tbl-url tbody').trigger('update');
                    $(this).remove();
                });
            }
            feedback(data.message, data.status);
            end_disable('#edit-close-' + id);
            end_loading('#edit-close-' + id);
            end_disable('#edit-button-' + id);
            end_disable('#delete-button-' + id);
        }
    );
}

function add_loading(el) {
    $(el).attr('disabled', 'disabled').addClass('disabled').addClass('loading');
}

function add_disable(el) {
    $(el).attr('disabled', 'disabled').addClass('disabled');
}

function end_loading(el) {
    $(el).removeClass('loading');
}

function end_disable(el) {
    $(el).removeAttr('disabled').removeClass('disabled');
}

function zebra_table() {
    $('#tbl-url tbody tr:even').removeClass('odd').addClass('even');
    $('#tbl-url tbody tr:odd').removeClass('even').addClass('odd');
    $('#tbl-url tbody').trigger('update');
}

function feedback(msg, type) {
    var span = (type === 'fail') ? '<span class="fail">' : '<span>';
    var delay = (type === 'fail') ? 2500 : 1000 ;
    $('#feedback').html(span + msg + '</span>').fadeIn(200, function() {
        $(this).animate({opacity: 1}, delay, function () {
            $(this).fadeOut(800);
        });
    });
}

function reset_url() {
    $('#add-url').val('http://').focus();
    $('#add-keyword').val('');
}

function increment() {
    $('.increment').each(function () {
        $(this).html( parseInt($(this).html()) + 1);
    });
}
