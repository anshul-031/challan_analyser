"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileUploader } from '@/components/FileUploader';
import { RegistrationNumbers } from '@/components/RegistrationNumbers';
import { ProcessingStatus } from '@/components/ProcessingStatus';
import { ExcelExporter } from '@/components/ExcelExporter';
import { ChallanPreview } from '@/components/ChallanPreview';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ProcessorProvider } from '@/contexts/ProcessorContext';

export function AppContainer() {
  return (
    <ProcessorProvider>
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Vehicle Challan Details Processor</h1>
          <ThemeToggle />
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="col-span-full md:col-span-1">
            <CardHeader>
              <CardTitle>Upload Excel File</CardTitle>
              <CardDescription>
                Upload an Excel file with a column named &quot;Registration Number&quot;
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUploader />
            </CardContent>
          </Card>
          
          <Card className="col-span-full md:col-span-1">
            <CardHeader>
              <CardTitle>Unique Registration Numbers</CardTitle>
              <CardDescription>
                Filtered unique vehicle registration numbers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RegistrationNumbers />
            </CardContent>
          </Card>
          
          <Card className="col-span-full md:col-span-1">
            <CardHeader>
              <CardTitle>Processing Status</CardTitle>
              <CardDescription>
                Status of challan data retrieval
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProcessingStatus />
            </CardContent>
          </Card>
          
          <Card className="col-span-full">
            <CardHeader>
              <CardTitle>Challan Data Preview</CardTitle>
              <CardDescription>
                Preview of processed challan data and export statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChallanPreview />
            </CardContent>
          </Card>
          
          <Card className="col-span-full">
            <CardHeader>
              <CardTitle>Export Results</CardTitle>
              <CardDescription>
                Export challan details to Excel (available during processing)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ExcelExporter />
            </CardContent>
          </Card>
        </div>
        
        <footer className="mt-12 text-center text-sm text-muted-foreground">
          <p>© 2025 Vehicle Challan Details Processor</p>
        </footer>
      </div>
    </ProcessorProvider>
  );
}