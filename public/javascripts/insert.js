$(document).ready(function () {
    reset_url();
    if ($('#tbl-url tr.nourl_found').length != 1) {
        $('#tbl-url').tablesorter({
            headers: { 6: {sorter: false} }, // no sorter on column #6
            widgets: ['zebra'] // prettify
        });
    }

    $('#add-button').click(add);
});

// Create new link and add to table
function add() {
    var newUrl = $('#add-url').val();
    if (!newUrl || newUrl == 'http://' || newUrl == 'https://') {
        alert('no URL ?');
        return;
    }
    add_loading('#add-button');
    $.getJSON(
        '/api/add',
        {url: newUrl},
        function (data) {
            if(data.status == 'success') {
                $('#tbl-url tbody').prepend(data.html).trigger('update');
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

// Display the edition interface
function edit(id) {
    add_loading('#edit-button-' + id);
    add_loading('#delete-button-' + id);
    $.getJSON(
        'index_ajax.php',
        { mode: 'edit_display', id: id },
        function(data){
            $('#id-' + id).after( data.html );
            $('#edit-url-'+ id).focus();
            end_loading('#edit-button-' + id);
            end_loading('#delete-button-' + id);
        }
    );
}

// Delete a link
function remove(id) {
    if (!confirm('Really delete?')) {
        return;
    }
    $.getJSON(
        'index_ajax.php',
        { mode: 'delete', id: id },
        function(data){
            if (data.success == 1) {
                $('#id-' + id).fadeOut(function(){$(this).remove();zebra_table();});
            } else {
                alert('something wrong happened while deleting :/');
            }
        }
    );
}

// Cancel edition of a link
function hide_edit(id) {
    $('#edit-' + id).fadeOut(200, function(){
        end_disable('#edit-button-' + id);
        end_disable('#delete-button-' + id);
    });
}

// Save edition of a link
function edit_save(id) {
    add_loading('#edit-close-' + id);
    var newurl = $('#edit-url-' + id).val();
    var newid = $('#edit-id-' + id).val();
    $.getJSON(
        'index_ajax.php',
        {mode:'edit_save', url: newurl, id: id, newid: newid }, function(data){
            if(data.status == 'success') {
                $('#url-' + id).html('<a href="' + data.url.url + '" title="' + data.url.url + '">' + data.url.url + '</a>');
                $('#keyword-' + id).html(data.url.keyword);
                $('#shorturl-' + id).html('<a href="' + data.url.shorturl + '" title="' + data.url.shorturl + '">' + data.url.shorturl + '</a>');
                $('#timestamp-' + id).html(data.url.date);
                $('#edit-' + id).fadeOut(200, function(){
                    $('#tblUrl tbody').trigger('update');
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

// Unused for now since HTTP Auth sucks donkeys.
function logout() {
    $.ajax({
        type: 'POST',
        url: 'index_ajax.php',
        data: {mode:'logout'},
        success: function() {
            window.parent.location.href = window.parent.location.href;
        }
    });
}

// Begin the spinning animation & disable a button
function add_loading(el) {
    $(el).attr('disabled', 'disabled').addClass('disabled').addClass('loading');
}

// End spinning animation
function end_loading(el) {
    $(el).removeClass('loading');
}

// Un-disable an element
function end_disable(el) {
    $(el).removeAttr('disabled').removeClass('disabled');
}

// Prettify table with odd & even rows
function zebra_table() {
    $('#tblUrl tbody tr:even').removeClass('odd').addClass('even');
    $('#tblUrl tbody tr:odd').removeClass('even').addClass('odd');
    $('#tblUrl tbody').trigger('update');
}

// Update feedback message
function feedback(msg, type) {
    var span = (type == 'fail') ? '<span class="fail">' : '<span>' ;
    var delay = (type == 'fail') ? 2500 : 1000 ;
    $('#feedback').html(span + msg + '</span>').fadeIn(200,function(){
        $(this).animate({'opacity':1}, delay, function() {
            $(this).fadeOut(800);
        })
    });
}

// Ready to add another URL
function reset_url() {
    $('#add-url').val('http://').focus();
    $('#add-keyword').val('');
}

// Increment URL counters
function increment() {
    $('.increment').each(function(){
        $(this).html( parseInt($(this).html()) + 1);
    });
}
