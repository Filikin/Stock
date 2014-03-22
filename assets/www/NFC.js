var currentItems;
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
	if (NFCMode === NFCModeEnum.programMode) writeTag(nfcEvent);
	else onNfcRead(nfcEvent);
}

function onNfcRead(nfcEvent) 
{
	logToConsole(JSON.stringify(nfcEvent.tag)); // Debug Output in Console
   	navigator.notification.vibrate(100);
   	displayTagContent (nfcEvent.tag);
}

function resetItemDetailsPage ()
{
    var $j = jQuery.noConflict();
	$j("#itemDetails h1").html ("Scan Tag");
	$j("#itemDetails #sfid").html ("");
	$j("#itemDetails #stkidentifier").html ("");
	$j("#itemDetails #description").html ("");
	$j("#itemDetails #serialnumber").html ("");
	$j("#itemDetails #currentpatient").html ("");
	$j("#itemDetails #stockstatus").html ("");

	$j("#itemDetails #status").html (NFCMode.Hint);
}

// tag content will look like: SFId:a0ob0000000USHiStkRef:StockITEM--06000StkId:Some identifier with loads of text 
function displayTagContent(NFCtag) 
{
	toast.showShort("Reading Tag");
	logToConsole ('NFC: In displayTagContent');
    var $j = jQuery.noConflict();
    var payload = nfc.bytesToString(NFCtag.ndefMessage[0].payload);
    logToConsole ('NFC: Payload: ' + payload);
    $j.mobile.changePage ("#itemDetails");
    
    var sfid = payload.replace( /.*SFId:/, "" );
	sfid = sfid.replace (/StkRef:.*$/, "");
	
	var stockRef = payload.replace (/.*StkRef:/, "");
	stockRef = stockRef.replace (/StkId:.*$/, "");

	var stockID = payload.replace (/.*StkId:/, "");
	
	resetItemDetailsPage ();
	
	$j("#itemDetails h1").html (stockRef);
	$j("#itemDetails #sfid").html (sfid);
	$j("#itemDetails #stkidentifier").html (stockID);
	
    getOneStockItem (sfid); // get the rest of the details from Salesforce
}

function writeTag(nfcEvent) 
{
	toast.showShort("Writing Tag");
  // ignore what's on the tag, just overwrite
	    
	var $j = jQuery.noConflict();
	var mimeType = "text/pg";
	var payload = "SFId:" + $j("#itemDetails #sfid").html() + "StkRef:" + $j("#itemDetails h1").html() + "StkId:" + $j("#itemDetails #stkidentifier").html();
	logToConsole ("NFC: in writeTag payload: " + payload);
	var record = ndef.mimeMediaRecord(mimeType, nfc.stringToBytes(payload));

	logToConsole ("NFC: record: " + JSON.stringify (record));
	nfc.write(
	        [record], 
	        function () {
	        	$j("#itemDetails #status").html("Tag written");
	            navigator.notification.vibrate(100);
	            NFCMode = NFCModeEnum.readMode;
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
   			updateStockItem['Activity_Type__c'] = NFCMode.Activity;
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
    forcetkClient.query("SELECT Id, Current_Patient__c, Status__c, Current_description__c, Tag_status__c, Name, Stock_Item_Identifier__c, Equipment_Sub_Category__c, Equipment_Type__r.Equipment_Type__c, Product_Serial_Number__c FROM Stock_Item__c where Equipment_Type__r.Equipment_Type__c = '" + eqType + "' and Equipment_Sub_Category__c = '" + eqsubType + "' and Tag_status__c = 'Not programmed' order by Name", onSuccessStockItemInstances, onErrorStockItems); 
}

function getListOfItemTypes ()
{
    forcetkClient.query("SELECT Equipment_Type__r.Equipment_Type__c, Equipment_Sub_Category__c FROM Stock_Item__c where Tag_status__c = 'Not programmed' order by Type_of_Equipment__c, Equipment_Sub_Category__c", onSuccessStockItemTypes, onErrorStockItems); 
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

 			if (NFCMode === NFCModeEnum.programMode) NFCMode = NFCModeEnum.readMode;
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
			$j("#itemDetails h1").html (currentItems[i].Name);
			$j("#itemDetails #stkidentifier").html (currentItems[i].Stock_Item_Identifier__c);
			$j("#itemDetails #sfid").html (currentItems[i].Id);
			$j("#itemDetails #serialnumber").html (currentItems[i].Product_Serial_Number__c);
			$j("#itemDetails #description").html (currentItems[i].Current_description__c);
			$j("#itemDetails #currentpatient").html (currentItems[i].Current_Patient__c);
			$j("#itemDetails #stockstatus").html (currentItems[i].Status__c);
			
			NFCMode = NFCModeEnum.programMode;
			$j("#itemDetails #status").html(NFCMode.Hint);
			break;
		}
	}
}

function onSuccessOneStockItem (response)
{
    var $j = jQuery.noConflict();
    logToConsole("onSuccessStockItemTypes: received " + response.totalSize + " items");

    if (response.totalSize > 0)
    {
    	var stockItem = response.records[0];
    	$j("#itemDetails #description").html (stockItem.Current_description__c);
    	$j("#itemDetails #serialnumber").html (stockItem.Product_Serial_Number__c);
		$j("#itemDetails #currentpatient").html (stockItem.Current_Patient__c);
		$j("#itemDetails #stockstatus").html (stockItem.Status__c);
    	
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
