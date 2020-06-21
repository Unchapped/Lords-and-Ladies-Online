$(document).ready(function() {
    /* dev only, draw territory labels * /
    $("#map_root g").each(function(index) {
        var title = $(this).children("title");
        if (title.length == 0) return; //skip non-territory groups
        console.log(title.text());
        var text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.innerHTML = title.text();
        addSvgCenteredObject(this, text); 
    }); */

});