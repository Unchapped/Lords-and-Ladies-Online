

/* global variables */

/* logging level */
var loglevel = 1; //0 = errors only, higher numbers mean more detail

/* get a pointer to the main SVG map*/
var map_root;
var house_list;
/* downloaded house data from the server and populate the map */
//var houses; //now defined in houses.json and included in the HTML head 

/* basic rapper around the GET parameters of the window, so we can modify them live. Definition is in document.ready below */
var live_params;

/* ==== Helper Functions ==== */
/* useful for adding centered content to an SVG group */
function addSvgCenteredObject(container, element) {
        var containerBox = container.getBBox();
        container.appendChild(element);
        var renderedBox = element.getBBox(); //let CSS set the size for us before positioning
        element.setAttribute("x", containerBox.x + (containerBox.width / 2) - (renderedBox.width / 2));
        element.setAttribute("y", containerBox.y + (containerBox.height / 2) - (renderedBox.height / 2));
}

//Sanitize any arbitrary string to use it as a class/id name for a DOM object
function sanitizeClassName(val) {return val.toLowerCase().replace(/the |[.*'&+\-?^${}()|[\]\\]/g, '').replace(/ /g,"_");}

//Create a list of class names for all fancy attributes
function generateAttrClassList(house) {
    return sanitizeClassName(house.name) + ' ' + sanitizeClassName(house.race) + ' ' + sanitizeClassName(house.rank) + ' ' + sanitizeClassName(house.kingdom) + ((house.kingdom_order == 0) ? ' royal_house' : '');
}

/* ==== Map initialization Functions ==== */ 

//dynamically applies rendering classes to all the owned house territories
function redrawHouseBorders() {
    if(loglevel > 0) console.log("redrawing house borders");

    houses.forEach(function(house, index){
        if (!house.active) return;
        if(loglevel > 1) console.log("redrawing " + house.name);

        house.territories.forEach(function(territory, index){
            var land = $("#" + territory);
            land.removeClass(); //remove all existing decorations
            // land.addClass(sanitizeClassName(house.name) + ' ' + sanitizeClassName(house.race) + ' ' + sanitizeClassName(house.rank) + ' ' + sanitizeClassName(house.kingdom) + ' owned');
            land.addClass(generateAttrClassList(house) + ' owned');
            if(land.length == 0) console.log("error: missing DOM element assgning territory" + territory +" to house: " + house.name)
        });
    });
    if(loglevel > 0) console.log("done redrawing house borders.");
}

//Draws house seats/heraldry on the map
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
        var content = '<div id="' + sanitizeClassName(house.name) + '" class="house ' + generateAttrClassList(house) + '">'
        content += '<h3>' + house.name + '</h3>';
        content += '<span class="heraldry"><img src = "images/houses/' + house.name + '.png" /></span>';
        content += '<h4>"' +house.motto +'"</h4>';

        /* content += '<span class="heraldry"><img src = "images/houses/' + house.name + '.png" /></span>';
        content += '<h3>' + house.name + '</h3>';
        content += '<h4>"' +house.motto +'"</h4>';
        if (house.player != "NPC") {
            content += '<span class="player"><i class="fas fa-user"></i> ' + house.player + '</span>';
        } else {
            content += '<span class="player"><i class="fas fa-robot"></i> NPC</span>';
        }
        content += '<span class="rank"><i class="fas fa-sitemap"></i> ' + house.rank + '</span>'
        content += '<span class="race"><i class="fas fa-flag"></i> ' + house.race + '</span>' */
        content += '</div>';

        house_list.append(content); // put it into the DOM    
    });

    //add mouse handlers here.
    house_list.children("div").mouseover(function(e){
        $("." + $(this).attr('id')).addClass("highlight");
    });

    house_list.children("div").mouseout(function(e){
        $("." + $(this).attr('id')).removeClass("highlight");
    });

    if(loglevel > 0) console.log("done redrawing house list.");
}

const sort_modes = {
    'alpha_asc': {key: "name"},
    'alpha_desc': {
        key: "name",
        direction: -1
    },
    'rank':  {
        key: "rank_order",
        label: "rank"
    },
    'race': {
        key: "race",
        label: "race"
    },
    'player': {key: "player"},
    'kingdom': {
        key: "kingdom",
        label: "kingdom",
        tiebreaker: "kingdom_order"
    }
}

function sortHouses(mode_name = "alpha_asc") {
    var mode = sort_modes[mode_name];
    if (mode == undefined) {
        console.log("Error: invalid sort key: " + mode_name);
        return;
    }

    //set the GET request for page refreshes as needed
    live_params.set("sort", mode_name);

    //highlight the correct button
    $(".sort_button").removeClass("selected");
    $("#sort_" + mode_name).addClass("selected");

    //sort house list
    //function sortHouseList(attr = "name", header_attr = "null", order = 1) {
    if(loglevel > 0) console.log("sorting house list by " + mode.key + "... ");
    
    //sort the list
    var direction = mode.direction || 1;
    var tiebreaker = mode.tiebreaker || 'name';
    houses.sort(function(a, b) {
        //filter dirty data to the bottom of the list
        if(a[mode.key] == undefined) return direction;
        if(b[mode.key] == undefined) return 0-direction;

        //compare valid attributes
        if (b[mode.key] < a[mode.key]) {
            return direction
        } else if (b[mode.key] == a[mode.key]) {
            return (b[tiebreaker]) < (a[tiebreaker]) ? 1 : -1;
        } else {
         return 0-direction;
        }
    });

    //clear the headers
    house_list.children(".header").remove();

    //sort and redraw headers
    var last_group = "null";
    houses.forEach(function(house, index){
        if (!house.active || house[mode.key] == undefined) return;
        if (mode.label && sanitizeClassName(house[mode.label]) != last_group) {
            last_group = sanitizeClassName(house[mode.label]);
            var content = '<div class="header ' + sanitizeClassName(house[mode.label]) + '"><h2>' + house[mode.label] + '</h2></div>';
            house_list.append(content);
        }
        if(loglevel > 1) console.log(house.name + ": " + house[mode.key] + " =>" + house[mode.label]);
        house_list.children("#" + sanitizeClassName(house.name)).appendTo(house_list);
    });
    if(loglevel > 0) console.log("done sorting house list.");

    //set highlight mode
    //function setHighlightMode(attr = "name") {
    if(loglevel > 0) console.log("setting highlight mode to: " + mode.key + "... ");
    map_root.removeClass(Object.keys(sort_modes).join(" "));
    map_root.addClass(mode_name);
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

    //initialize our "live params" helper, which auto-adds new get items to the browser history for searches and such.
    live_params = {
        params: new URLSearchParams(window.location.search),
        set: function (key, value) {
            this.params.set(key, value);
            history.pushState({}, "", window.location.origin + window.location.pathname + "?" + this.params.toString());
        },

        get: function (key) {return this.params.get(key);},
    };

    //color the house territories
    redrawHouseBorders();

    //redraw the house seats
    redrawHouseSeats();
    
    //(re)draw house list
    redrawHouseList();

    //sort the house list based on input Get requests.
    sortHouses(live_params.get('sort'));




    //set up sorting functions
    $("#sort_alpha_asc").click(function () {
        sortHouses("alpha_asc");
        $("#sort_alpha_asc").hide()
        $("#sort_alpha_desc").show()
    });

    $("#sort_alpha_desc").click(function () {
        sortHouses("alpha_desc");
        $("#sort_alpha_desc").hide()
        $("#sort_alpha_asc").show()
    });

    $("#sort_rank").click(function () {sortHouses("rank");});
    $("#sort_race").click(function () {sortHouses("race");});
    $("#sort_player").click(function () {sortHouses("player");});
    $("#sort_kingdom").click(function () {sortHouses("kingdom");});
});