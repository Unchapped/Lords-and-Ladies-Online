

/* global variables */

/* logging level */
var loglevel = 1; //0 = errors only, higher numbers mean more detail

/* get a pointer to the main SVG map*/
var map_root
/* downloaded house data from the server and populate the map */
var houses;

/* useful for adding centered content to an SVG group */

function addSvgCenteredObject(container, element) {
        var containerBox = container.getBBox();
        container.appendChild(element);
        var renderedBox = element.getBBox(); //let CSS set the size for us before positioning
        element.setAttribute("x", containerBox.x + (containerBox.width / 2) - (renderedBox.width / 2));
        element.setAttribute("y", containerBox.y + (containerBox.height / 2) - (renderedBox.height / 2));
}

//recolors all the house territories
function redrawHouseBorders() {
    if(loglevel > 0) console.log("redrawing house borders");

    houses.forEach(function(house, index){
        if (!house.active) return;
        if(loglevel > 1) console.log("redrawing " + house.name);

        house.territories.forEach(function(territory, index){
            var land = $("#" + territory);
            land.removeClass(); //remove all existing decorations
            land.addClass(house.name.toLowerCase());
            land.addClass("owned");
            if(land.length == 0) console.log("error: missing DOM element assgning territory" + territory +" to house: " + house.name)
        });
    });
    if(loglevel > 0) console.log("done redrawing house borders.");
}

function redrawHouseSeats() {
    if(loglevel > 0) console.log("redrawing house seats... ");
    
    //clear existing icons
    var oldimages = $("image.heraldry");
    if(loglevel > 1) console.log("info: deleting " + oldimages.length + " prior icons");
    oldimages.remove();

    //draw new icons
    houses.forEach(function(house, index){
        if(loglevel > 1) console.log("info: redrawing " + house.name);

        var seat = $("#" + house.seat);
        if(seat.length > 0) { //no empty queries
            var icon = document.createElementNS('http://www.w3.org/2000/svg', 'image');
            icon.setAttribute("href", "images/houses/" + house.name + ".png");
            icon.setAttribute("class", "heraldry");   

            if ("seat_location" in house) { //look for overidden icon location
                if(loglevel > 1) console.log("info: manually placing house " + house.name + " icon at: (" + house.seat_location.x + ", " + house.seat_location.y + ")");
                icon.setAttribute("x", house.seat_location.x);
                icon.setAttribute("y", house.seat_location.y);
                seat[0].appendChild(icon);
            } else {
                addSvgCenteredObject(seat[0], icon);
            }
        } else if(loglevel > 1) console.log("warning: house: " + house.name + " has an invalid seat specified");
    });
    if(loglevel > 0) console.log("done redrawing house seats.");
}

$(document).ready(function() {
    /* populate global variables*/
    map_root = $("#map_root");
    $.getJSON('houses.json', function(data) {
        houses = data;
        
        // TODO: dynamically populate the house list

        //color the house territories
        redrawHouseBorders();

        //redraw the house seats
        redrawHouseSeats();
    });
});