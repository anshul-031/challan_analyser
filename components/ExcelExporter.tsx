"use client";

import { useState } from 'react';
import { useProcessor } from '@/contexts/ProcessorContext';
import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function ExcelExporter() {
  const { challanData, processing, processedCount, registrationNumbers, isRetrying, errors } = useProcessor();
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!challanData || Object.keys(challanData).length === 0) return;
    
    try {
      setExporting(true);
      
      // Flatten the data structure to create rows for the Excel file
      const rows: any[] = [];
      
      Object.entries(challanData).forEach(([regNum, data]) => {
        // For pending challans
        if (data.Pending_data && data.Pending_data.length > 0) {
          data.Pending_data.forEach((challan: any) => {
            const rowData: any = {
              "Registration Number": regNum,
              "Status": "Pending",
              "Challan No": challan.challan_no,
              "Challan Date Time": challan.challan_date_time,
              "Challan Place": challan.challan_place,
              "Challan Status": challan.challan_status,
              "Sent To Reg Court": challan.sent_to_reg_court,
              "Fine Imposed": challan.fine_imposed,
              "Owner Name": challan.owner_name,
              "Name Of Violator": challan.name_of_violator,
              "Department": challan.department,
              "State Code": challan.state_code,
              "Amount Of Fine Imposed": challan.amount_of_fine_imposed,
              "Court Address": challan.court_address,
              "Court Name": challan.court_name,
              "Date Of Proceeding": challan.date_of_proceeding,
              "Sent To Court On": challan.sent_to_court_on,
              "Sent To Virtual Court": challan.sent_to_virtual_court,
              "RTO District Name": challan.rto_distric_name
            };

            // Add offense details if available
            if (challan.offence_details && challan.offence_details.length > 0) {
              // Combine multiple offenses into a single field
              rowData["Offense Acts"] = challan.offence_details.map((offense: any) => offense.act).filter(Boolean).join(", ") || "N/A";
              rowData["Offense Names"] = challan.offence_details.map((offense: any) => offense.name).filter(Boolean).join(", ") || "N/A";
            } else {
              rowData["Offense Acts"] = "N/A";
              rowData["Offense Names"] = "N/A";
            }
            
            rows.push(rowData);
          });
        }
        
        // For disposed challans
        if (data.Disposed_data && data.Disposed_data.length > 0) {
          data.Disposed_data.forEach((challan: any) => {
            const rowData: any = {
              "Registration Number": regNum,
              "Status": "Disposed",
              "Challan No": challan.challan_no,
              "Challan Date Time": challan.challan_date_time,
              "Challan Place": challan.challan_place,
              "Challan Status": challan.challan_status,
              "Sent To Reg Court": challan.sent_to_reg_court,
              "Fine Imposed": challan.fine_imposed,
              "Owner Name": challan.owner_name,
              "Name Of Violator": challan.name_of_violator,
              "Department": challan.department,
              "State Code": challan.state_code,
              "Amount Of Fine Imposed": challan.amount_of_fine_imposed,
              "Court Address": challan.court_address,
              "Court Name": challan.court_name,
              "Date Of Proceeding": challan.date_of_proceeding,
              "Sent To Court On": challan.sent_to_court_on,
              "Sent To Virtual Court": challan.sent_to_virtual_court,
              "RTO District Name": challan.rto_distric_name,
              "Receipt No": challan.receipt_no,
              "Received Amount": challan.received_amount
            };

            // Add offense details if available
            if (challan.offence_details && challan.offence_details.length > 0) {
              // Combine multiple offenses into a single field
              rowData["Offense Acts"] = challan.offence_details.map((offense: any) => offense.act).filter(Boolean).join(", ") || "N/A";
              rowData["Offense Names"] = challan.offence_details.map((offense: any) => offense.name).filter(Boolean).join(", ") || "N/A";
            } else {
              rowData["Offense Acts"] = "N/A";
              rowData["Offense Names"] = "N/A";
            }
            
            rows.push(rowData);
          });
        }
      });
      
      // Create a worksheet
      const worksheet = XLSX.utils.json_to_sheet(rows);
      
      // Create summary data
      const summaryData = [
        { Field: 'Export Date', Value: format(new Date(), 'yyyy-MM-dd HH:mm:ss') },
        { Field: 'Export Status', Value: processing ? 'Partial (Processing ongoing)' : 'Complete' },
        { Field: 'Total Vehicles Requested', Value: registrationNumbers.length },
        { Field: 'Total Vehicles Processed Successfully', Value: Object.keys(challanData).length },
        { Field: 'Total Vehicles Failed', Value: errors.length },
        { Field: 'Total Challans Found', Value: rows.length },
        { Field: 'Pending Challans', Value: rows.filter(row => row.Status === 'Pending').length },
        { Field: 'Disposed Challans', Value: rows.filter(row => row.Status === 'Disposed').length },
        { Field: '', Value: '' }, // Empty row
        { Field: 'Successfully Processed Vehicles', Value: '' },
        ...Object.keys(challanData).map(regNum => ({ Field: regNum, Value: '' })),
        ...(errors.length > 0 ? [
          { Field: '', Value: '' }, // Empty row
          { Field: 'Failed Vehicles (can be retried)', Value: '' },
          ...errors.map(error => ({ Field: error.regNum, Value: error.message }))
        ] : [])
      ];
      
      const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData);
      
      // Create a workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, summaryWorksheet, "Export Summary");
      XLSX.utils.book_append_sheet(workbook, worksheet, "Challan Data");
      
      // Generate the Excel file
      const currentDate = format(new Date(), 'yyyy-MM-dd_HH-mm');
      const processedVehicles = Object.keys(challanData).length;
      const filename = processing 
        ? `Challan_Data_Partial_${processedVehicles}vehicles_${currentDate}.xlsx`
        : `Challan_Data_Complete_${processedVehicles}vehicles_${currentDate}.xlsx`;
      
      XLSX.writeFile(workbook, filename);
      
    } catch (error) {
      console.error("Error exporting data:", error);
    } finally {
      setExporting(false);
    }
  };  // Determine if export button should be disabled
  const isExportDisabled =
    exporting || 
    !challanData || 
    Object.keys(challanData).length === 0;

  // If no processing has started yet
  if (processedCount === 0) {
    return (
      <div className="text-center py-8">
        <FileSpreadsheet className="h-10 w-10 mx-auto text-muted-foreground opacity-50" />
        <p className="text-muted-foreground mt-4">
          Process registration numbers to generate an Excel export
        </p>
      </div>
    );
  }

  // If processing is complete but no challans were found
  if (!processing && 
      processedCount === registrationNumbers.length && 
      (!challanData || Object.keys(challanData).length === 0)) {
    return (
      <Alert className="bg-destructive/10 border-destructive/20">
        <AlertTitle>No challan data found</AlertTitle>
        <AlertDescription>
          No challan information was found for the provided registration numbers.
          Please verify the registration numbers and try again.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Export Summary</h3>
          <p className="text-xs text-muted-foreground">
            {Object.keys(challanData).length} vehicles • {Object.values(challanData).reduce((total, data) => {
              const pendingCount = data.Pending_data?.length || 0;
              const disposedCount = data.Disposed_data?.length || 0;
              return total + pendingCount + disposedCount;
            }, 0)} total challans
            {errors.length > 0 && ` • ${errors.length} failed`}
            {processing && ` • Processing in progress...`}
          </p>
        </div>
        
        <Button
          onClick={handleExport}
          disabled={isExportDisabled}
          className="gap-2"
        >
          {exporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              {processing ? 'Export Current Data' : 'Export Excel'}
            </>
          )}
        </Button>
      </div>
      
      {processedCount < registrationNumbers.length && processing && (
        <Alert className="bg-blue-50 border-blue-200">
          <AlertTitle>Export Available During Processing</AlertTitle>
          <AlertDescription>
            Processing is in progress. You can export the current data at any time - 
            the export will include all challans that have been processed so far.
          </AlertDescription>
        </Alert>
      )}
      
      {errors.length > 0 && !processing && (
        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertTitle>Some Vehicles Failed to Process</AlertTitle>
          <AlertDescription>
            {errors.length} vehicle{errors.length === 1 ? '' : 's'} failed to fetch challan data. 
            You can retry these failed vehicles from the Processing Status section above, 
            or export the current data without the failed vehicles.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}