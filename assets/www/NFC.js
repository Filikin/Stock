var currentItems;
var bWaitingToWriteNFCTag = false;
var toast = cordova.require('toast');

function successNFCRegisterListener(response)
{
	logToConsole('NFC: Success Registered');
}

function errorNFCRegisterListener(response)
{
	logToConsole('NFC: Error Registered');
}
   
function onNfcTagDetected (nfcEvent)
{
	if (bWaitingToWriteNFCTag) writeTag(nfcEvent);
	else onNfcRead(nfcEvent);
}

function onNfcRead(nfcEvent) 
{
	logToConsole(JSON.stringify(nfcEvent.tag)); // Debug Output in Console
   	navigator.notification.vibrate(100);
   	displayTagContent (nfcEvent.tag);
}

function displayTagContent(NFCtag) 
{
	logToConsole ('NFC: In displayTagContent');
    var $j = jQuery.noConflict();
    var payload = nfc.bytesToString(NFCtag.ndefMessage[0].payload);
    logToConsole ('NFC: Payload: ' + payload);
    $j.mobile.changePage ("#tagContent");
    
    var sfid = payload.replace( /.*SFId: /, "" );
	sfid = sfid.replace (/ StockID:.*$/, "");

	var stockID = payload.replace (/.*StockID: /, "");
	$j("#tagContent h1").html (stockID);
	$j("#tagContent #sfid").html (sfid);
	$j("#tagContent #description").html ("");
	$j("#tagContent #serialnumber").html ("");
	$j("#tagContent #currentpatient").html ("");
	$j("#tagContent #stockstatus").html ("");
    getOneStockItem (sfid);
}

function writeTag(nfcEvent) 
{
	toast.showShort("Writing");
  // ignore what's on the tag, just overwrite
	    
	var $j = jQuery.noConflict();
	var mimeType = "text/pg";
	var payload = "SFId: " + $j("#itemDetails #sfid").html() + " StockID: " + $j("#itemDetails h1").html();
	logToConsole ("NFC: in writeTag payload: " + payload);
	var record = ndef.mimeMediaRecord(mimeType, nfc.stringToBytes(payload));

	logToConsole ("NFC: record: " + JSON.stringify (record));
	nfc.write(
	        [record], 
	        function () {
	        	$j("#itemDetails #status").html("Tag written");
	            navigator.notification.vibrate(100);
				bWaitingToWriteNFCTag = false;
				updateSalesforceStatus ($j("#itemDetails #sfid").html(), true);
	        }, 
	        function (reason) {
	            navigator.notification.alert(reason, function() {}, "There was a problem, touch tag to try again");
	        }
	  );
}

function updateSalesforceStatus (sfid, tagStatus)
{
	// tagStatus - true = written, false = read
    var updateStockItem = {}; 
   	if(Util.checkConnection()) 
   	{
   		if (tagStatus)
   		{
   			updateStockItem['Tag_status__c'] = 'Programmed';
		   	forcetkClient.update("Stock_Item__c", sfid, updateStockItem, function(){toast.showShort("Status saved")},onSaveError);
    	}
   		else
   		{
   			updateStockItem['Activity_Type__c'] = 'Tag Scanned';
   			updateStockItem['Stock_Item__c'] = sfid;
		   	forcetkClient.create("Stock_Item_Log__c", updateStockItem, function(){toast.showShort("Status saved")},onSaveError);
   		}
   	}
   	else
   	{
   		toast.showShort("No connection to Salesforce, cannot update status");
   	}
}

function getListOfItems (eqType, eqsubType)
{
    forcetkClient.query("SELECT Id, Current_Patient__c, Status__c, Current_description__c, Tag_status__c, Name, Stock_Item_Identifier__c, Equipment_Sub_Category__c, Equipment_Type__r.Equipment_Type__c, Product_Serial_Number__c FROM Stock_Item__c where Equipment_Type__r.Equipment_Type__c = '" + eqType + "' and Equipment_Sub_Category__c = '" + eqsubType + "' and Tag_status__c = 'Not programmed'", onSuccessStockItemInstances, onErrorStockItems); 
}

function getListOfItemTypes ()
{
    forcetkClient.query("SELECT Equipment_Type__r.Equipment_Type__c, Equipment_Sub_Category__c FROM Stock_Item__c where Tag_status__c = 'Not programmed'", onSuccessStockItemTypes, onErrorStockItems); 
}

function getOneStockItem (sfid)
{
	if(Util.checkConnection())
	{
		forcetkClient.query("SELECT Id, Current_Patient__c, Status__c, Current_description__c, Name, Stock_Item_Identifier__c, Equipment_Sub_Category__c, Equipment_Type__r.Equipment_Type__c, Product_Serial_Number__c FROM Stock_Item__c where Id = '" + sfid + "'", onSuccessOneStockItem, onErrorStockItems); 
	}
	else
	{
		toast.showShort("No connection to Salesforce, cannot retrieve details");
	}
}

function preparePageChangeItemType ()
{
    var $j = jQuery.noConflict();
 	$j( document ).bind("#itemInstances pagebeforechange", function(e, data) {
 		// this code taken from http://jquerymobile.com/demos/1.2.0/docs/pages/page-dynamic.html
 		// We only want to handle changePage() calls where the caller is
 		// asking us to load a page by URL.
    	
 		if ( typeof data.toPage === "string" ) {

	 		bWaitingToWriteNFCTag = false;
	    	logToConsole ("NFC: in pagebeforechange resetting write tag");
 			// We are being asked to load a page by URL, but we only
 			// want to handle URLs that request the data for a specific
 			// page.
 			var u = $j.mobile.path.parseUrl( data.toPage ),
 				re = /^#itemInstances\?type=/;
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
 				re = /^#itemDetails\?Id=/;

 			if ( u.hash.search(re) !== -1 ) {

 				// We're being asked to display the items for a specific area.
 				// Call our internal method that builds the content for the area
 				// on the fly based on our in-memory area data structure.
 				showItemDetails( u, data.options);

 				// Make sure to tell changePage() we've handled this call so it doesn't
 				// have to do anything.
 				//e.preventDefault();
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
	var itemID = urlObj.hash.replace( /.*Id=/, "" );
	
	// find the item in the list of current items
	logToConsole ("Item ID NFC: " + itemID);
	logToConsole ("NFC: " + JSON.stringify(currentItems));
	logToConsole ("Length NFC:" + currentItems.length);
	for (var i=0; i<currentItems.length; i++)
	{
		if (currentItems[i].Id == itemID)
		{
			$j("#itemDetails h1").html (currentItems[i].Stock_Item_Identifier__c);
			$j("#itemDetails #sfid").html (currentItems[i].Id);
			$j("#itemDetails #serialnumber").html (currentItems[i].Product_Serial_Number__c);
			$j("#itemDetails #description").html (currentItems[i].Current_description__c);
			$j("#itemDetails #currentpatient").html (currentItems[i].Current_Patient__c);
			$j("#itemDetails #stockstatus").html (currentItems[i].Status__c);
			
			$j("#itemDetails #status").html("Tap an NFC tag to write data.");
			bWaitingToWriteNFCTag = true;
			break;
		}
	}
	

	//var	pageSelector = urlObj.hash.replace( /\?.*$/, "" );
	
	// Get the page we are going to dump our content into.
	//var $page = $j( pageSelector );

		
	// Pages are lazily enhanced. We call page() on the page
	// element to make sure it is always enhanced before we
	// attempt to enhance the listview markup we just injected.
	// Subsequent calls to page() are ignored since a page/widget
	// can only be enhanced once.
	//$page.page();

   	// We don't want the data-url of the page we just modified
	// to be the url that shows up in the browser's location field,
	// so set the dataUrl option to the URL for the category
	// we just loaded.
	//options.dataUrl = urlObj.href;

	
	// Now call changePage() and tell it to switch to
	// the page we just modified.
//	$j.mobile.changePage( $page, options );
	

//	$j.mobile.changePage("#stockItem");
}

function onSuccessOneStockItem (response)
{
    var $j = jQuery.noConflict();
    logToConsole("onSuccessStockItemTypes: received " + response.totalSize + " items");

    if (response.totalSize > 0)
    {
    	var stockItem = response.records[0];
    	$j("#tagContent #description").html (stockItem.Current_description__c);
    	$j("#tagContent #serialnumber").html (stockItem.Product_Serial_Number__c);
		$j("#tagContent #currentpatient").html (stockItem.Current_Patient__c);
		$j("#tagContent #stockstatus").html (stockItem.Status__c);
    	
    	updateSalesforceStatus (stockItem.Id, false);
    }
}

function onSuccessStockItemTypes(response) 
{
    var $j = jQuery.noConflict();
    logToConsole("onSuccessStockItemTypes: received " + response.totalSize + " items");
 
    if (response.totalSize > 0)
    {
	    preparePageChangeItemType();
	    
	    $j("#div_stock_item_types").html("");
	    var ul = $j('<ul data-role="listview"></ul>');
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
    }
    else
    {
    	$j("#div_stock_item_types").html("<p>No unprogrammed stock items</p>");
    }
    
    $j("#div_stock_item_types").trigger( "create" );
}

function onSuccessStockItemInstances(response) 
{
    var $j = jQuery.noConflict();
    logToConsole("onSuccessStockItemInstances: received " + response.totalSize + " items");
 
    if (response.totalSize > 0)
    {
    	currentItems = response.records;
	    preparePageChangeItemInstance();
	    
	    $j("#itemInstances h1").html(response.records[0].Equipment_Sub_Category__c);
	    
	    $j("#div_stock_item_instances").html("")
	    var ul = $j('<ul data-role="listview" data-theme="a"></ul>');
	    $j("#div_stock_item_instances").append(ul);
	    
	    $j.each(response.records, function(i, stockitem) {
	    	
	           var newLi = "<li><a href='#itemDetails?Id=" + stockitem.Id + "'>" + stockitem.Name + "</a></li>";
	           ul.append(newLi);
	           });
	    
	    $j("#div_stock_item_instances").trigger( "create" );
    }
    else
    {
	    $j("#div_stock_item_instances").html("No items of this type found");
    }
}

function onErrorStockItems(error) {
    logToConsole("onErrorSfdc: " + JSON.stringify(error));
    alert('Error getting stock items from Salesforce!');
}

function onSaveError(error) {
    logToConsole("onSaveError: " + JSON.stringify(error));
    alert('Error getting writing stock item status to Salesforce!');
}
