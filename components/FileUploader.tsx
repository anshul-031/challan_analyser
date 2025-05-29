"use client";

import { useState } from 'react';
import * as XLSX from 'xlsx';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast-simple';
import { useProcessor } from '@/contexts/ProcessorContext';
import { Progress } from '@/components/ui/progress';

export function FileUploader() {
  const { toast } = useToast();
  const { setRegistrationNumbers, processing } = useProcessor();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const processFile = async (file: File) => {
    setUploadProgress(10);
    setFileName(file.name);

    // Check file type
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast({
        variant: "destructive",
        title: "Invalid file format",
        description: "Please upload an Excel file (.xlsx or .xls)",
      });
      setUploadProgress(0);
      setFileName(null);
      return;
    }

    try {
      setUploadProgress(30);
      const data = await readExcelFile(file);
      setUploadProgress(70);

      // Validate data structure
      if (!data || !Array.isArray(data) || data.length === 0) {
        throw new Error("Invalid Excel data structure");
      }

      // Check for "Registration Number" column
      const firstRow = data[0];
      if (!firstRow || !Object.keys(firstRow).some(key => 
        key.toLowerCase() === "registration number" || key === "Registration Number")) {
        throw new Error("Excel file must contain a 'Registration Number' column");
      }

      // Extract registration numbers
      const regNosFromExcel = data
        .map(row => row["Registration Number"] || row["registration number"])
        .filter(Boolean)
        .map(regNo => String(regNo).trim().toUpperCase());

      // Filter unique registration numbers
      const uniqueRegNos = Array.from(new Set(regNosFromExcel));

      if (uniqueRegNos.length === 0) {
        throw new Error("No valid registration numbers found in file");
      }

      setRegistrationNumbers(uniqueRegNos);
      setUploadProgress(100);
      
      toast({
        title: "File processed successfully",
        description: `Found ${uniqueRegNos.length} unique registration numbers`,
      });
      
      // Reset progress after a delay
      setTimeout(() => {
        setUploadProgress(0);
      }, 1000);
      
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error processing file",
        description: error instanceof Error ? error.message : "Unknown error occurred",
      });
      setUploadProgress(0);
      setFileName(null);
    }
  };

  const readExcelFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          if (!data) {
            reject(new Error("Failed to read file"));
            return;
          }
          
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(worksheet);
          
          resolve(json);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error("Failed to read file"));
      };
      
      reader.readAsArrayBuffer(file);
    });
  };

  return (
    <div 
      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
        isDragging 
          ? 'border-primary bg-primary/5' 
          : 'border-border hover:border-primary/50'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center gap-3">
        <div className="rounded-full p-3 bg-primary/10">
          <Upload className="h-6 w-6 text-primary" />
        </div>
        
        <div>
          <p className="text-sm font-medium">
            {fileName ? fileName : "Drag and drop your Excel file here"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            or click to browse
          </p>
        </div>

        {uploadProgress > 0 && (
          <Progress value={uploadProgress} className="w-full mt-2" />
        )}

        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          disabled={processing}
        />
        
        <Button
          variant="secondary"
          size="sm"
          onClick={() => document.getElementById('file-upload')?.click()}
          disabled={processing}
          className="mt-2"
        >
          Select File
        </Button>
      </div>
    </div>
  );
}