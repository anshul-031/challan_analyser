"use client";

import { useState } from 'react';
import { useProcessor } from '@/contexts/ProcessorContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Eye, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function ChallanPreview() {
  const { challanData, processing, processedCount } = useProcessor();
  const [selectedRegNum, setSelectedRegNum] = useState<string>('');

  // Get sample data for preview
  const getSampleData = () => {
    const allChallans: any[] = [];
    
    Object.entries(challanData).forEach(([regNum, data]) => {
      // Add pending challans
      if (data.Pending_data && data.Pending_data.length > 0) {
        data.Pending_data.forEach((challan: any) => {
          allChallans.push({
            regNum,
            status: 'Pending',
            ...challan
          });
        });
      }
      
      // Add disposed challans
      if (data.Disposed_data && data.Disposed_data.length > 0) {
        data.Disposed_data.forEach((challan: any) => {
          allChallans.push({
            regNum,
            status: 'Disposed',
            ...challan
          });
        });
      }
    });
    
    return allChallans.slice(0, 5); // Show only first 5 for preview
  };

  const sampleData = getSampleData();
  const totalChallans = Object.values(challanData).reduce((total, data) => {
    const pendingCount = data.Pending_data?.length || 0;
    const disposedCount = data.Disposed_data?.length || 0;
    return total + pendingCount + disposedCount;
  }, 0);

  const vehiclesWithChallans = Object.keys(challanData).length;

  if (Object.keys(challanData).length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No challan data available yet. Process some registration numbers to see a preview.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{vehiclesWithChallans}</div>
            <p className="text-xs text-muted-foreground">Vehicles Processed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{totalChallans}</div>
            <p className="text-xs text-muted-foreground">Total Challans</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {Object.values(challanData).reduce((total, data) => total + (data.Pending_data?.length || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {Object.values(challanData).reduce((total, data) => total + (data.Disposed_data?.length || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">Disposed</p>
          </CardContent>
        </Card>
      </div>

      {/* Sample Data Preview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Sample Challan Data</CardTitle>
              <CardDescription>
                Preview of challan data that will be exported to Excel
              </CardDescription>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  View All Fields
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Complete Challan Data Structure</DialogTitle>
                  <DialogDescription>
                    All fields that will be included in the Excel export
                  </DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {[
                      'Registration Number', 'Status', 'Challan No', 'Challan Date Time',
                      'Challan Place', 'Challan Status', 'Sent To Reg Court', 'Fine Imposed',
                      'Owner Name', 'Name Of Violator', 'Department', 'State Code',
                      'Amount Of Fine Imposed', 'Court Address', 'Court Name',
                      'Date Of Proceeding', 'Sent To Court On', 'Sent To Virtual Court',
                      'RTO District Name', 'Receipt No (Disposed only)', 'Received Amount (Disposed only)',
                      'Offense Acts', 'Offense Names'
                    ].map((field, index) => (
                      <Badge key={index} variant="secondary" className="mr-2 mb-2">
                        {field}
                      </Badge>
                    ))}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {sampleData.length > 0 ? (
            <div className="space-y-4">
              <ScrollArea className="h-[300px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reg. Number</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Challan No</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Place</TableHead>
                      <TableHead>Fine Amount</TableHead>
                      <TableHead>Offense</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sampleData.map((challan, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{challan.regNum}</TableCell>
                        <TableCell>
                          <Badge variant={challan.status === 'Pending' ? 'destructive' : 'default'}>
                            {challan.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{challan.challan_no || 'N/A'}</TableCell>
                        <TableCell>{challan.challan_date_time || 'N/A'}</TableCell>
                        <TableCell>{challan.challan_place || 'N/A'}</TableCell>
                        <TableCell>{challan.amount_of_fine_imposed || challan.fine_imposed || 'N/A'}</TableCell>
                        <TableCell>
                          {challan.offence_details && challan.offence_details.length > 0 
                            ? challan.offence_details[0].name 
                            : 'N/A'}
                          {challan.offence_details && challan.offence_details.length > 1 && '...'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
              
              {totalChallans > 5 && (
                <p className="text-sm text-muted-foreground text-center">
                  Showing 5 of {totalChallans} total challans. Export to Excel to see all data.
                </p>
              )}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No challan data available for preview
            </p>
          )}
        </CardContent>
      </Card>

      {processing && (
        <Alert className="bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Processing is ongoing. This preview will update automatically as more data becomes available.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
