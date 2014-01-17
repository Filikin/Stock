function successNFCRegisterListener(response)
{
	logToConsole('NFC: Success Registered');
}

function errorNFCRegisterListener(response)
{
	logToConsole('NFC: Error Registered');
}
    
function onNfcRead(nfcEvent) 
{
	logToConsole(JSON.stringify(nfcEvent.tag)); // Debug Output in Console
   	navigator.notification.vibrate(100);
   	displayTagContent (nfcEvent.tag);
}

function displayTagContent(NFCtag) 
{
	logToConsole ('In displayTagContent');
    var $j = jQuery.noConflict();
    var payload = nfc.bytesToString(NFCtag.ndefMessage[0].payload);
    logToConsole ('NFC: ' + payload);
    $j("#tagContent h1").html(payload);
    $j.mobile.changePage ("#tagContent");
}

function getListOfItems (eqType, eqsubType)
{
    forcetkClient.query("SELECT ID, Tag_status__c, Name, Stock_Item_Identifier__c FROM Stock_Item__c where Equipment_Type__r.Equipment_Type__c = '" + eqType + "' and Equipment_Sub_Category__c = '" + eqsubType + "' and Tag_status__c = 'Not programmed'", onSuccessStockItemInstances, onErrorStockItems); 
}

function getListOfItemTypes ()
{
    forcetkClient.query("SELECT Equipment_Type__r.Equipment_Type__c, Equipment_Sub_Category__c FROM Stock_Item__c where Tag_status__c = 'Not programmed'", onSuccessStockItemTypes, onErrorStockItems); 
}

function preparePageChangeItemType ()
{
    var $j = jQuery.noConflict();
 	$j( document ).bind("#itemInstances pagebeforechange", function(e, data) {
 		// this code taken from http://jquerymobile.com/demos/1.2.0/docs/pages/page-dynamic.html
 		// We only want to handle changePage() calls where the caller is
 		// asking us to load a page by URL.
 		if ( typeof data.toPage === "string" ) {

 			// We are being asked to load a page by URL, but we only
 			// want to handle URLs that request the data for a specific
 			// page.
 			var u = $j.mobile.path.parseUrl( data.toPage ),
 				re = /^#itemInstances/;
 			if ( u.hash.search(re) !== -1 ) {

 				// We're being asked to display the items for a specific area.
 				// Call our internal method that builds the content for the area
 				// on the fly based on our in-memory area data structure.
 				showItemInstances( u, data.options);

 				// Make sure to tell changePage() we've handled this call so it doesn't
 				// have to do anything.
 				//e.preventDefault();
 			}
 		}
		});
}

function preparePageChangeItemInstance ()
{
    var $j = jQuery.noConflict();
 	$j( document ).bind("#itemDetails pagebeforechange", function(e, data) {
 		// this code taken from http://jquerymobile.com/demos/1.2.0/docs/pages/page-dynamic.html
 		// We only want to handle changePage() calls where the caller is
 		// asking us to load a page by URL.
 		if ( typeof data.toPage === "string" ) {

 			// We are being asked to load a page by URL, but we only
 			// want to handle URLs that request the data for a specific
 			// page.
 			var u = $j.mobile.path.parseUrl( data.toPage ),
 				re = /^#itemDetails/;

 			if ( u.hash.search(re) !== -1 ) {

 				// We're being asked to display the items for a specific area.
 				// Call our internal method that builds the content for the area
 				// on the fly based on our in-memory area data structure.
 				showItemDetails( u, data.options);

 				// Make sure to tell changePage() we've handled this call so it doesn't
 				// have to do anything.
 				e.preventDefault();
 			}
 		}
		});
}

function showItemInstances (urlObj, options)
{
	var $j = jQuery.noConflict();
	var typeName = urlObj.hash.replace( /.*type=/, "" );
	logToConsole ("showItemInstances NFC: Type: " + typeName);
	typeName = typeName.replace (/&sub=.*$/, "");
	var subTypeName = urlObj.hash.replace( /.*sub=/, "" );
	logToConsole ("showItemInstances NFC: Type: " + typeName + " subType: " + subTypeName);

	getListOfItems (typeName, subTypeName);
//	var	pageSelector = urlObj.hash.replace( /\?.*$/, "" );
//	
//	// Get the page we are going to dump our content into.
//	var $page = $j( pageSelector );
//
//	// Get the header for the page.
//	var	$header = $page.children( ":jqmData(role=header)" );
//
//	// Get the content area element for the page.
//	var	$content = $page.children( ":jqmData(role=content)" );
//
//	var i=0;
//	var markup = '<h1>' + categoryName + '</h1>';
//		
//	$content.html( markup );
//		
//	// Pages are lazily enhanced. We call page() on the page
//	// element to make sure it is always enhanced before we
//	// attempt to enhance the listview markup we just injected.
//	// Subsequent calls to page() are ignored since a page/widget
//	// can only be enhanced once.
//	$page.page();
//
//   	// We don't want the data-url of the page we just modified
//	// to be the url that shows up in the browser's location field,
//	// so set the dataUrl option to the URL for the category
//	// we just loaded.
//	options.dataUrl = urlObj.href;
//
//	$j("#itemInstances h1").html (categoryName);
//	
//	// Now call changePage() and tell it to switch to
//	// the page we just modified.
//	$j.mobile.changePage( $page, options );
	

//	$j.mobile.changePage("#stockItem");
}

function showItemDetails (urlObj, options)
{
	var $j = jQuery.noConflict();
	var categoryName = urlObj.hash.replace( /.*ID=/, "" );
	logToConsole ("showItemDetails NFC: " + categoryName);

	var	pageSelector = urlObj.hash.replace( /\?.*$/, "" );
	
	// Get the page we are going to dump our content into.
	var $page = $j( pageSelector );

	// Get the header for the page.
	var	$header = $page.children( ":jqmData(role=header)" );

	// Get the content area element for the page.
	var	$content = $page.children( ":jqmData(role=content)" );

	var i=0;
	var markup = '<h1>' + categoryName + '</h1>';
		
	$content.html( markup );
		
	// Pages are lazily enhanced. We call page() on the page
	// element to make sure it is always enhanced before we
	// attempt to enhance the listview markup we just injected.
	// Subsequent calls to page() are ignored since a page/widget
	// can only be enhanced once.
	$page.page();

   	// We don't want the data-url of the page we just modified
	// to be the url that shows up in the browser's location field,
	// so set the dataUrl option to the URL for the category
	// we just loaded.
	options.dataUrl = urlObj.href;

	$j("#itemDetails h1").html (categoryName);
	
	// Now call changePage() and tell it to switch to
	// the page we just modified.
	$j.mobile.changePage( $page, options );
	

//	$j.mobile.changePage("#stockItem");
}

function onSuccessStockItemTypes(response) 
{
    var $j = jQuery.noConflict();
    logToConsole("onSuccessStockItemTypes: received " + response.totalSize + " items");
 
    preparePageChangeItemType();
    
    $j("#div_stock_item_types").html("")
    var ul = $j('<ul data-role="listview" data-theme="a"></ul>');
    $j("#div_stock_item_types").append(ul);
    
    var equipmentTypeMap = {};
    var subcategoryMap = {};
    $j.each(response.records, function(i, stockItem) {
    	equipmentTypeMap [stockItem.Equipment_Type__r.Equipment_Type__c] = stockItem.Equipment_Type__r.Equipment_Type__c;
    	subcategoryMap [stockItem.Equipment_Sub_Category__c] = stockItem.Equipment_Type__r.Equipment_Type__c;
    	});
    
    var count=1;
    for (var e in equipmentTypeMap)
    {
    	var newLi = "<li>" + e;
   		newLi += "<ul data-role='listview'>"
   		for (var sube in subcategoryMap)
    	{
    		if (subcategoryMap[sube] == e) newLi += "<li><a href='#itemInstances?type="+e+"&sub="+sube+"'>" + sube + "</a></li>";
    	}
   		newLi += "</ul>";
    	ul.append(newLi);
    };
    logToConsole ($j("#div_stock_item_types").html());
    
    $j("#div_stock_item_types").trigger( "create" );
}

function onSuccessStockItemInstances(response) 
{
    var $j = jQuery.noConflict();
    logToConsole("onSuccessStockItemInstances: received " + response.totalSize + " items");
 
    preparePageChangeItemInstance();
    
    $j("#div_stock_items_instances").html("")
    var ul = $j('<ul data-role="listview" data-theme="a"></ul>');
    $j("#div_stock_items_instances").append(ul);
    
    $j.each(response.records, function(i, stockitem) {
           var newLi = "<li><a href='#itemDetails?ID=" + stockitem.ID + "'>" + stockitem.Name + "</a></li>";
           ul.append(newLi);
           });
    
    $j("#div_stock_items_instances").trigger( "create" );
}

function onErrorStockItems(error) {
    logToConsole("onErrorSfdc: " + JSON.stringify(error));
    alert('Error getting stock items from Salesforce!');
}