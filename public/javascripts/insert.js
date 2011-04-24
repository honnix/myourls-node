$(document).ready(function() {
    reset_url();
    if ($("#tblUrl tr.nourl_found").length != 1) {
        $("#tblUrl").tablesorter({
            headers: { 6: {sorter: false} }, // no sorter on column #6
            widgets: ["zebra"] // prettify
        });
    }
});

function preadd() {
    var newurl = $("#add-url").val();
    if (!newurl || newurl == "http://" || newurl == "https://") {
        alert("no URL ?");
        return false;
    }
    add_loading("#add-button");
    return true;
}

function postadd() {
    reset_url();
    zebra_table();
    increment();
    restore_add_button();
}

function restore_add_button() {
    remove_loading("#add-button");
}

function add_loading(el) {
    $(el).attr("disabled", "disabled").addClass("disabled").addClass("loading");
}

function remove_loading(el) {
    $(el).removeClass("loading").removeAttr("disabled").removeClass("disabled");
}

function zebra_table() {
    $("#tblUrl tbody tr:even").removeClass("odd").addClass("even");
    $("#tblUrl tbody tr:odd").removeClass("even").addClass("odd");
    $("#tblUrl tbody").trigger("update");
}

function reset_url() {
    $("#add-url").val("http://").focus();
}

function increment() {
    $(".increment").each(function() {
        $(this).html(parseInt($(this).html()) + 1);
    });
}

function edit(id, realEdit) {
    add_loading("#edit-button-" + id);
    add_loading("#delete-button-" + id);
    realEdit();
    $("#edit-button-" + id).removeClass("loading");
    $("#delete-button-" + id).removeClass("loading");
}

function remove(realDelete) {
    if (confirm("Really delete?")) {
        realDelete();
    }
}

function hide_edit(id) {
    $("#edit-" + id).fadeOut(200, function() {
        remove_loading("#edit-button-" + id);
        remove_loading("#delete-button-" + id);
        $(this).remove();
    });
}

function presave(id) {
    add_loading("#edit-close-" + id);
    return $("#edit-url-" + id).val();
}

function postsave(id) {
    var url = $("#edit-url-" + id).val();
    $("#url-" + id).html('<a href="' + url + '">' + url + '</a>');
    remove_loading("#edit-close-" + id);
    hide_edit(id);
}
