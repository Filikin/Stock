//Sample code for Hybrid REST Explorer

function regLinkClickHandlers() {
    var $j = jQuery.noConflict();
    var logToConsole = cordova.require("salesforce/util/logger").logToConsole;
    
    $j('#link_programtag').click(function() {
                                           logToConsole("link_programtag clicked");
                                           getListOfItemTypes ();
                                             });
    
    $j('#link_stockcheck').click(function() {
                                         logToConsole("link_stockcheck clicked");
                                         NFCMode = NFCModeEnum.stockCheckMode; 
                                         });
    
    $j('#link_delivery').click(function() {
                                         logToConsole("link_delivery clicked");
                                         NFCMode = NFCModeEnum.deliveryMode; 
                                         });
    
    $j('#link_reset').click(function() {
                           logToConsole("link_reset clicked");
                           $j("#console").html("")
                           });
                           
    $j('#link_logout').click(function() {
             logToConsole("link_logout clicked");
             var sfOAuthPlugin = cordova.require("salesforce/plugin/oauth");
             sfOAuthPlugin.logout();
             });
}

/*
function onSuccessDevice(contacts) {
    var $j = jQuery.noConflict();
    cordova.require("salesforce/util/logger").logToConsole("onSuccessDevice: received " + contacts.length + " contacts");
    $j("#div_device_contact_list").html("")
    var ul = $j('<ul data-role="listview" data-inset="true" data-theme="a" data-dividertheme="a"></ul>');
    $j("#div_device_contact_list").append(ul);
    
    ul.append($j('<li data-role="list-divider">Device Contacts: ' + contacts.length + '</li>'));
    $j.each(contacts, function(i, contact) {
           var formattedName = contact.name.formatted;
           if (formattedName) {
           var newLi = $j("<li><a href='#'>" + (i+1) + " - " + formattedName + "</a></li>");
           ul.append(newLi);
           }
           });
    
    $j("#div_device_contact_list").trigger( "create" )
}

function onErrorDevice(error) {
    cordova.require("salesforce/util/logger").logToConsole("onErrorDevice: " + JSON.stringify(error) );
    alert('Error getting device contacts!');
}
*/