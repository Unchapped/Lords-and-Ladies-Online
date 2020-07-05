

/* global variables */

/* logging level */
var loglevel = 1; //0 = errors only, higher numbers mean more detail

/* get a pointer to the main SVG map*/
var map_root;
var house_list;
/* downloaded house data from the server and populate the map */
var houses;

/* basic rapper around the GET parameters of the window, so we can modify them live. Definition is in document.ready below */
var live_params;

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
        if (!house.active) return;
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

//(re)draw house list
function redrawHouseList() {
    if(loglevel > 0) console.log("redrawing house list... ");

    //find and clear existing list
    house_list.empty();

    //draw new list items
    houses.forEach(function(house, index){
        if (!house.active) return;
        if(loglevel > 1) console.log("info: redrawing " + house.name);

        //Create DOM object
        var content = '<div id="' + house.name.toLowerCase() + '" class="house ' + house.name.toLowerCase() + '">'
        content += '<span class="heraldry"><img src = "images/houses/' + house.name + '.png" /></span>';
        content += '<h3>' + house.name + '</h3>';
        content += '<h4>"' +house.motto +'"</h4>';
        if (house.player != "NPC") {
            content += '<span class="player"><i class="fas fa-user"></i> ' + house.player + '</span>';
        } else {
            content += '<span class="player"><i class="fas fa-robot"></i> NPC</span>';
        }
        content += '<span class="rank"><i class="fas fa-sitemap"></i> ' + house.rank + '</span>'
        content += '<span class="race"><i class="fas fa-flag"></i> ' + house.race + '</span>'
        content += '</div>';

        house_list.append(content); // put it into the DOM    
    });

    //add mouse handlers here.
    house_list.children("div").mouseover(function(e){
        $("." + $(this).attr('id').toLowerCase()).addClass("highlight");
    });

    house_list.children("div").mouseout(function(e){
        $("." + $(this).attr('id').toLowerCase()).removeClass("highlight");
    });

    if(loglevel > 0) console.log("done redrawing house list.");
}


//sort house list
function sortHouseList(attr = "name", header_attr = "null", order = 1) {
    if(loglevel > 0) console.log("sorting house list by " + attr + "... ");
    //sort the list
    houses.sort(function(a, b) {
        //filter dirty data to the bottom of the list
        if(a[attr] == undefined) return order;
        if(b[attr] == undefined) return 0-order;

        //compare valid attributes
        if (b[attr] < a[attr]) {
            return order
        } else if (b[attr] == a[attr]) { //use name as a tiebreaker
            return (b.name) < (a.name) ? 1 : -1;
        } else {
         return 0-order;
        }
    });

    //clear the headers
    house_list.children(".header").remove();

    var last_group = "null";
    houses.forEach(function(house, index){
        if (!house.active || house[attr] == undefined) return;
        if (header_attr != "null" && house[header_attr] != last_group) {
            last_group = house[header_attr];
            var content = '<div class="header ' + house[header_attr].toLowerCase() + '"><h2>' + house[header_attr] + '</h2></div>';
            house_list.append(content);
        }
        if(loglevel > 1) console.log(house.name + ": " + house[attr] + " =>" + house[header_attr]);
        house_list.children("#" + house.name.toLowerCase()).appendTo(house_list);
    });
    if(loglevel > 0) console.log("done sorting house list.");
}

//set highlight mode
function setHighlightMode(attr = "name") {
    if(loglevel > 0) console.log("setting highlight mode to: " + attr + "... ");

    //create a new static variable, so we can clear old highlights
    if( typeof setHighlightMode.prev_attr == 'undefined' )  setHighlightMode.prev_attr = "name";

    houses.forEach(function(house, index){
        if (!house.active || house[attr] == undefined || house[setHighlightMode.prev_attr] == undefined) return;

        //clear existing highlights.
        var lands = $("." + house.name.toLowerCase());
        if(setHighlightMode.prev_attr != "name") lands.removeClass(house[setHighlightMode.prev_attr].toLowerCase());
        lands.addClass(house[attr].toLowerCase());
    });

    setHighlightMode.prev_attr = attr;

    if(loglevel > 0) console.log("done setting highlight mode.");
}

$(document).ready(function() {
    /* populate global variables*/
    map_root = $("#map_root");
    if(map_root.length != 1) {
        console.log("Error:missing house list container, cannot redraw.");
        return;
    }

    house_list = $("#noble_houses>.list");
    if(house_list.length != 1) {
        console.log("Error:missing house list container, cannot redraw.");
        return;
    }

    live_params = {
        params: new URLSearchParams(window.location.search),
        set: function (key, value) {
            this.params.set(key, value);
            history.pushState({}, "", window.location.origin + window.location.pathname + "?" + this.params.toString());
        },

        get: function (key) {return this.params.get(key);},

        autosort: function () {
            var sort_default = $("#sort_" + this.params.get('sort'));
            if (sort_default.length != 0) sort_default[0].click();
        }
    };


    $.getJSON('houses.json', function(data) {
        houses = data;
        
        // TODO: dynamically populate the house list

        //color the house territories
        redrawHouseBorders();

        //redraw the house seats
        redrawHouseSeats();
        
        //(re)draw house list
        redrawHouseList();

        //sort the house list based on input Get requests.
        live_params.autosort();
    });

    //set up sorting functions
    $("#sort_alpha_asc").click(function () {
        live_params.set("sort", "alpha_asc");
        sortHouseList();
        setHighlightMode(undefined);
        $("#sort_alpha_asc").hide()
        $("#sort_alpha_desc").show()
        $(".sort_button").removeClass("selected");
        $("#sort_alpha_desc").addClass("selected");
    });

    $("#sort_alpha_desc").click(function () {
        live_params.set("sort", "alpha_desc");
        sortHouseList(undefined, undefined, -1);
        setHighlightMode(undefined);
        $("#sort_alpha_desc").hide()
        $("#sort_alpha_asc").show()
        $(".sort_button").removeClass("selected");
        $("#sort_alpha_asc").addClass("selected");
    });

    
    $("#sort_rank").click(function () {
        live_params.set("sort", "rank");
        sortHouseList("rank_order", "rank", 1);
        setHighlightMode("rank");
        $(".sort_button").removeClass("selected");
        $("#sort_rank").addClass("selected");
    });

    $("#sort_race").click(function () {
        live_params.set("sort", "race");
        sortHouseList("race", "race", 1);
        setHighlightMode("race");
        $(".sort_button").removeClass("selected");
        $("#sort_race").addClass("selected");
    });

    $("#sort_player").click(function () {
        live_params.set("sort", "player");
        sortHouseList("player", undefined, 1);
        setHighlightMode(undefined);
        $(".sort_button").removeClass("selected");
        $("#sort_player").addClass("selected");
    });

    $("#sort_kingdom").click(function () {
        live_params.set("sort", "kingdom");
        sortHouseList("kingdom", "kingdom", 1);
        setHighlightMode("kingdom");
        $(".sort_button").removeClass("selected");
        $("#sort_kingdom").addClass("selected");
    });
});