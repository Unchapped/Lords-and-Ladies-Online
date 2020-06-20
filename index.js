$(document).ready(function() {
    /* get a pointer to the main SVG map and the dynamic layer added for this script*/
    var map_root = $("#map_root");
    var dynamic_layer = $("#dynamic_layer");
    /* download data from the server and populate the map */
    var houses;
    $.getJSON('houses.json', function(data) {
        houses = data;
        houses.forEach(function(house, index){
            if (!house.active) return;
            // TODO: add the house to the house list

            //color the house territories
            house.territories.forEach(function(territory, index){
                var land = $("#" + territory);
                land.addClass(house.name.toLowerCase());
                land.addClass("owned");
                if(land.length == 0) console.log("error: missing DOM element assgning territory" + territory +" to house: " + house.name)
            });

            //draw the house seat
            var seat = $("#" + house.seat);
            if(seat.length > 0) { //no empty queries
                var containerBox = seat[0].getBBox();
                var icon = document.createElementNS('http://www.w3.org/2000/svg', 'image');
                icon.setAttribute("href", "images/houses/" + house.name + ".png");
                icon.setAttribute("class", "heraldry");
                dynamic_layer[0].appendChild(icon);
                var renderedBox = icon.getBBox(); //let CSS set the size for us before positioning
                icon.setAttribute("x", containerBox.x + (containerBox.width / 2) - (renderedBox.width / 2));
                icon.setAttribute("y", containerBox.y + (containerBox.height / 2) - (renderedBox.height / 2));
            }
        });
    });


    /* 
    $('input[type=radio][name=side]').change(function() {
        $('body').removeClass('front_back');
    	$('body').removeClass('front_only');
    	$('body').removeClass('back_only');
    	$('body').addClass(this.value);
    });

    $('input[type=radio][name=border]').change(function() {
        $('body').removeClass('border_black');
        $('body').removeClass('border_white');
        $('body').addClass(this.value);
    });

	$('#size_opt').on('change', function() {
		$("body").removeClass (function (index, css) {
    		return (css.match (/(^|\s)size_\S+/g) || []).join(' ');
		});
		$('body').addClass(this.value);
	})
    $('#cardlist').change(function() {
        $( "#cardlist option:not(:selected)" ).each(function() {
            console.log("hiding " + $( this ).val() + "..."); 
            if ($( this ).val() == "card") {
                $(".card").hide();
                $(".card").removeClass("visible");
                return false;  
            }
            var front = $("#" + $( this ).val());
            var back = $("#" + $( this ).val() + "-back");
            front.hide();
            back.hide();
            //"visible class used for dynamic nth child CSS selectors"
            front.removeClass("visible");
            back.removeClass("visible");
        });
        $( "#cardlist option:selected" ).each(function() {
            console.log("showing " + $( this ).val() + "..."); 
            if ($( this ).val() == "card") {
                $(".card").show();
                $(".card").addClass("visible");
                return false;  
            }
            var front = $("#" + $( this ).val());
            var back = $("#" + $( this ).val() + "-back");
            front.show();
            back.show();
            //"visible class used for dynamic nth child CSS selectors"
            front.addClass("visible");
            back.addClass("visible");
        });
    });

    //flow content from overflowing cards to back side
    $( ".front .card" ).each(function() {
        var this_id = $( this ).attr('id');
        var front_content = $( this ).find(".card-wrapper");
        var back_content = $("#" + this_id + "-back .card-wrapper");
        while (front_content.height() > $( this ).height()) {
            //console.log(this_id);
            back_content.prepend(front_content.find("div:last-child"));
        }
    });
    $("#spinner").hide(); */
});